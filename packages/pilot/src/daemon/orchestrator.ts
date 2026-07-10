import * as fs from 'node:fs'
import * as path from 'node:path'
import { acquireLock, releaseLock, registerLockCleanup } from './lock'
import { spawnClaudeProcess, parseTasksMd, buildTaskPrompt, hasTaskCompleteMarker, hasTaskStuckMarker, parseTokenUsage } from './claude-process'
import { loadState, saveState, updateTask, resetRunningTasksOnRecovery } from '../state/store'
import { loadConfig } from '../config/loader'
import { createTokenTracker } from '../monitor/token-tracker'
import { DeadLoopDetector } from '../monitor/dead-loop-detector'
import { startSilenceDetector } from '../monitor/silence-detector'
import { handleRetry, waitBackoff } from '../retry/handler'
import type { PilotState, TaskState, ErrorType } from '../state/types'
import type { PilotConfig } from '../config/schema'

export interface PilotRunOptions {
  /** 项目目录 */
  projectDir: string
  /** 可选的 task 过滤(仅运行指定 task) */
  taskFilter?: string[]
  /** 前台模式(默认 false,fork 后运行) */
  foreground?: boolean
}

export interface ExecuteTaskResult {
  success: boolean
  stuckReason: string | null
  errorType: ErrorType | null
  /** 用于错误分类的输出文本(截取到前 2000 字符) */
  errorOutput: string
}

/**
 * 读取 OpenSpec tasks.md 文件内容.
 */
function readTasksMd(projectDir: string): string | null {
  const candidates = [
    path.join(projectDir, 'tasks.md'),
    path.join(projectDir, 'openspec', 'changes', 'archive', 'tasks.md'),
  ]
  for (const candidate of candidates) {
    try {
      return fs.readFileSync(candidate, 'utf-8')
    } catch {
      continue
    }
  }
  return null
}

/**
 * 读取 OpenSpec spec 文件内容(同时扫描 openspec/changes/<name>/specs/).
 */
function readSpecs(projectDir: string): string {
  const searchPaths: string[] = [
    path.join(projectDir, 'specs'),
  ]
  // 扫描 openspec/changes/<name>/specs/
  const changesDir = path.join(projectDir, 'openspec', 'changes')
  try {
    const entries = fs.readdirSync(changesDir, { recursive: true })
    for (const entry of entries) {
      const entryStr = String(entry)
      const entryPath = path.join(changesDir, entryStr)
      if (entryPath.includes('/specs/') && entryPath.endsWith('.md') && fs.statSync(entryPath).isFile()) {
        searchPaths.push(path.dirname(entryPath))
      }
    }
  } catch {
    // changes 目录可能不存在
  }

  // 去重
  const uniquePaths = [...new Set(searchPaths)]
  let content = ''
  for (const specsPath of uniquePaths) {
    try {
      const files = fs.readdirSync(specsPath, { recursive: true })
      for (const file of files) {
        const fileName = String(file)
        const filePath = path.join(specsPath, fileName)
        if (filePath.endsWith('spec.md') && fs.statSync(filePath).isFile()) {
          content += `\n---\n${fs.readFileSync(filePath, 'utf-8')}\n`
        }
      }
    } catch {
      continue
    }
  }
  return content
}

/**
 * 查找 openspec/changes 下的 design.md 文件.
 */
function readDesignMd(projectDir: string): string {
  const changesDir = path.join(projectDir, 'openspec', 'changes')
  try {
    const entries = fs.readdirSync(changesDir, { recursive: true })
    for (const entry of entries) {
      const entryStr = String(entry)
      const entryPath = path.join(changesDir, entryStr)
      if (entryStr.endsWith('design.md') && fs.statSync(entryPath).isFile()) {
        return fs.readFileSync(entryPath, 'utf-8')
      }
    }
  } catch {
    // ignore
  }
  return ''
}

/**
 * 运行前检查: 验证 claude CLI 是否可用.
 */
export function checkClaudeCli(): boolean {
  try {
    const result = require('child_process').spawnSync('claude', ['--version'], { stdio: 'pipe' })
    return result.status === 0
  } catch {
    return false
  }
}

/**
 * 获取默认约束列表.
 */
function defaultConstraints(): string[] {
  return [
    '每次只实现一个 task',
    '保持代码质量和项目一致性',
  ]
}

/**
 * 执行单个 task,集成 heartbeat/token/silence/dead-loop 监控.
 */
async function executeTask(
  task: TaskState,
  projectDir: string,
  config: PilotConfig,
  specContent: string,
  designContent: string,
  logDir: string,
): Promise<ExecuteTaskResult> {
  const constraints = defaultConstraints()
  if (designContent) {
    constraints.push(`参考设计文档: ${designContent.slice(0, 500)}`)
  }

  const prompt = buildTaskPrompt(
    task.id,
    task.title,
    `实现 task ${task.id}: ${task.title}`,
    specContent,
    constraints,
  )

  // 创建 monitors
  let deadLoopDetected = false
  let deadLoopKilled = false
  let silenceKilled = false

  const tokenTracker = createTokenTracker({
    budget: task.tokenBudget ?? 300_000,
    onOverBudget: (used, budget) => {
      console.log(`[Pilot] Token budget exceeded for task ${task.id}: ${used} used, ${budget} budget`)
    },
    parseTokens: parseTokenUsage,
  })

  const deadLoopDetector = new DeadLoopDetector({ threshold: 3 })

  const silenceDetector = startSilenceDetector({
    thresholdMs: config.silenceThresholdMs ?? 5 * 60 * 1000,
    onTimeout: () => {
      if (!deadLoopKilled) {
        silenceKilled = true
        console.log(`[Pilot] Silence timeout for task ${task.id}`)
        handle.kill('SIGTERM')
      }
    },
  })

  // 日志停滞检测周期(匹配心跳间隔)
  const stagnationInterval = setInterval(() => {
    if (!deadLoopKilled && deadLoopDetector.checkStagnation()) {
      deadLoopDetected = true
      deadLoopKilled = true
      console.log(`[Pilot] Log stagnation detected for task ${task.id}`)
      handle.kill('SIGTERM')
    }
  }, config.heartbeatIntervalMs ?? 30_000)

  // 创建 combined.log 写入流
  const combinedLogPath = path.join(logDir, 'combined.log')
  const combinedStream = fs.createWriteStream(combinedLogPath, { flags: 'a' })
  combinedStream.write(`[${new Date().toISOString()}] Starting task ${task.id}\n`)

  task.status = 'running'
  task.startedAt = new Date().toISOString()

  const handle = spawnClaudeProcess({
    projectDir,
    prompt,
    logDir,
    taskId: task.id,
    timeoutMs: config.taskTimeoutMs ?? 30 * 60 * 1000,
    onData: (text: string) => {
      tokenTracker.feed(text)
      combinedStream.write(text)
      silenceDetector.markActivity()

      const isDeadLoop = deadLoopDetector.feed(text)
      if (isDeadLoop && !deadLoopKilled) {
        deadLoopDetected = true
        deadLoopKilled = true
        console.log(`[Pilot] Dead loop detected for task ${task.id}`)
        handle.kill('SIGTERM')
      }
    },
  })

  const result = await handle.wait()

  // 停止 monitors
  clearInterval(stagnationInterval)
  silenceDetector.stop()
  tokenTracker.stop()
  combinedStream.end()

  task.completedAt = new Date().toISOString()
  task.duration = task.startedAt
    ? new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime()
    : null
  task.tokensUsed = tokenTracker.total

  // 获取用于错误分类的输出文本(截取尾部关键部分)
  const errorOutput = result.output.slice(-2000)

  // 检查 monitor 检测到的问题(优先级高于 exit code)
  if (tokenTracker.isOverBudget) {
    task.status = 'skipped'
    task.error = 'token_overbudget'
    task.errorDetail = `Token budget exceeded: ${task.tokensUsed} used, ${task.tokenBudget} budget`
    return { success: false, stuckReason: null, errorType: 'token_overbudget', errorOutput }
  }

  if (deadLoopDetected) {
    task.status = 'failed'
    task.error = 'dead_loop'
    task.errorDetail = 'Dead loop detected - task requires manual intervention'
    return { success: false, stuckReason: null, errorType: 'dead_loop', errorOutput }
  }

  if (silenceKilled) {
    task.error = 'silence_timeout'
    task.errorDetail = `Process had no output for ${(config.silenceThresholdMs ?? 5 * 60 * 1000) / 1000}s`
    return { success: false, stuckReason: null, errorType: 'silence_timeout', errorOutput }
  }

  // 检查退出码
  if (result.exitCode !== 0 && result.signaled) {
    task.error = 'timeout'
    task.errorDetail = `Process timed out after ${(config.taskTimeoutMs ?? 30 * 60 * 1000) / 1000}s`
    return { success: false, stuckReason: null, errorType: 'timeout', errorOutput }
  }

  if (result.exitCode !== 0) {
    task.error = 'process_crash'
    task.errorDetail = `Process exited with code ${result.exitCode}, signal: ${result.signal}`
    return { success: false, stuckReason: null, errorType: 'process_crash', errorOutput }
  }

  // 检查卡住标记
  const stuckReason = hasTaskStuckMarker(result.output, task.id)
  if (stuckReason) {
    task.error = 'unknown'
    task.errorDetail = `Task stuck: ${stuckReason}`
    return { success: false, stuckReason, errorType: 'unknown', errorOutput }
  }

  // 检查完成标记
  if (hasTaskCompleteMarker(result.output, task.id)) {
    task.status = 'completed'
    task.error = null
    task.errorDetail = null
    return { success: true, stuckReason: null, errorType: null, errorOutput: '' }
  }

  // claude 正常退出但没有完成标记--视为成功
  task.status = 'completed'
  task.error = null
  task.errorDetail = null
  return { success: true, stuckReason: null, errorType: null, errorOutput: '' }
}

/**
 * 运行一次完整的 pilot session(含重试循环).
 */
export async function runPilot(options: PilotRunOptions): Promise<void> {
  const { projectDir, taskFilter } = options
  const lockDir = path.join(projectDir, '.deepstorm')
  const logDir = path.join(lockDir, 'pilot-logs')

  fs.mkdirSync(lockDir, { recursive: true })
  fs.mkdirSync(logDir, { recursive: true })

  // 锁定
  if (!acquireLock(projectDir)) {
    console.error('Pilot is already running on this project.')
    process.exit(1)
  }
  registerLockCleanup(projectDir)

  // 加载配置
  const config = loadConfig(projectDir)

  // 加载/初始化 state
  let state = loadState(projectDir)
  if (state) {
    resetRunningTasksOnRecovery(state)
  } else {
    state = {
      project: projectDir,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pilotVersion: '0.5.0',
      tasks: [],
      errors: [],
      summary: null,
      restartCount: 0,
      isResumed: false,
    }
  }

  // 读取 tasks
  const tasksMdContent = readTasksMd(projectDir)
  if (!tasksMdContent) {
    console.error('No tasks.md found in project.')
    releaseLock(projectDir)
    process.exit(1)
  }

  const specContent = readSpecs(projectDir)
  const designContent = readDesignMd(projectDir)

  const parsedTasks = parseTasksMd(tasksMdContent)

  // 如果 state 中没有 task 记录,初始化
  if (state.tasks.length === 0) {
    state.tasks = parsedTasks.map(t => ({
      id: t.id,
      title: t.title,
      status: 'pending' as const,
      retries: 0,
      maxRetries: config.maxRetries ?? 3,
      tokenBudget: config.perTaskBudget?.[t.id] ?? (config.defaultTokenBudget ?? 100_000) * 3,
      tokensUsed: 0,
      startedAt: null,
      completedAt: null,
      duration: null,
      error: null,
      errorDetail: null,
      errorFingerprint: null,
      logPath: null,
    }))
  }

  // 过滤 task(如果指定了 taskFilter)
  let tasksToRun = state.tasks
  if (taskFilter && taskFilter.length > 0) {
    tasksToRun = state.tasks.filter(t => taskFilter.includes(t.id))
  }

  // 串行执行(含重试循环)
  // 进入执行循环前先持久化初始状态，让 `pilot status` 可实时查看
  saveState(projectDir, state)

  for (const task of tasksToRun) {
    if (task.status === 'completed') continue

    while (task.retries <= task.maxRetries) {
      console.log(`\n[Pilot] Running task ${task.id}: ${task.title} (attempt ${task.retries}/${task.maxRetries})`)

      const result = await executeTask(
        task,
        projectDir,
        config,
        specContent,
        designContent,
        logDir,
      )

      if (result.success) {
        console.log(`[Pilot] Task ${task.id} completed.`)
        break
      }

      // Task 失败--决策是否重试
      console.log(`[Pilot] Task ${task.id} failed: ${task.errorDetail}`)

      const decision = handleRetry(task, state, result.errorOutput, {
        baseDelay: config.retryBaseDelay ?? 10,
        maxDelay: config.retryMaxDelay ?? 300,
      })

      // 记录错误
      state.errors.push({
        timestamp: new Date().toISOString(),
        type: decision.errorType,
        message: task.errorDetail ?? 'Unknown error',
        fingerprint: decision.fingerprint,
        taskId: task.id,
      })

      if (!decision.shouldRetry) {
        // 不可重试--标记最终状态
        if (decision.errorType === 'token_overbudget') {
          task.status = 'skipped'
        } else {
          task.status = 'failed'
        }
        task.error = decision.errorType
        task.errorDetail = decision.reason ?? task.errorDetail
        task.errorFingerprint = decision.fingerprint
        console.log(`[Pilot] Task ${task.id} stopped: ${decision.reason}`)
        break
      }

      // 准备重试
      task.retries++
      task.error = decision.errorType
      task.errorFingerprint = decision.fingerprint
      // 重置 task 状态以便重试
      task.status = 'running'
      task.startedAt = new Date().toISOString()
      task.completedAt = null
      task.duration = null
      task.errorDetail = null

      console.log(`[Pilot] Retrying task ${task.id} in ${decision.backoffMs}ms...`)
      saveState(projectDir, state)
      await waitBackoff(decision.backoffMs)
    }

    saveState(projectDir, state)
  }

  // 生成摘要
  const completed = state.tasks.filter(t => t.status === 'completed').length
  const failed = state.tasks.filter(t => t.status === 'failed').length
  const skipped = state.tasks.filter(t => t.status === 'skipped').length
  const totalTokens = state.tasks.reduce((sum, t) => sum + t.tokensUsed, 0)

  state.summary = {
    startTime: state.startedAt,
    endTime: new Date().toISOString(),
    totalDuration: state.startedAt
      ? new Date().getTime() - new Date(state.startedAt).getTime()
      : null,
    completed,
    failed,
    skipped,
    totalTokens,
  }

  saveState(projectDir, state)

  // 写入摘要报告
  writeSummary(projectDir, state)

  // 释放锁
  releaseLock(projectDir)
}

/**
 * 写入执行摘要到 pilot-summary.md.
 */
function writeSummary(projectDir: string, state: PilotState): void {
  const summaryPath = path.join(projectDir, '.deepstorm', 'pilot-summary.md')
  const lines: string[] = [
    '# Pilot Run Summary',
    '',
    `- **Started**: ${state.startedAt}`,
    `- **Ended**: ${state.summary?.endTime ?? 'N/A'}`,
    `- **Duration**: ${state.summary?.totalDuration ? `${(state.summary.totalDuration / 1000).toFixed(0)}s` : 'N/A'}`,
    `- **Completed**: ${state.summary?.completed ?? 0}`,
    `- **Failed**: ${state.summary?.failed ?? 0}`,
    `- **Skipped**: ${state.summary?.skipped ?? 0}`,
    `- **Total Tokens**: ${state.summary?.totalTokens ?? 0}`,
    '',
    '## Task Status',
    '',
    '| Task | Status | Error |',
    '|------|--------|-------|',
  ]

  for (const task of state.tasks) {
    lines.push(`| ${task.id} ${task.title} | ${task.status} | ${task.error ?? '-'} |`)
  }

  const failedTasks = state.tasks.filter(t => t.status === 'failed' || t.status === 'skipped')
  if (failedTasks.length > 0) {
    lines.push('', '## Failed / Skipped Tasks')
    lines.push('', 'To resume failed tasks, run:')
    lines.push('', '```bash')
    lines.push(`pilot resume --project "${projectDir}"`)
    lines.push('```')
    lines.push('', 'Or resume a specific task:')
    lines.push('```bash')
    lines.push(`pilot resume --project "${projectDir}" --task <task-id>`)
    lines.push('```')
    lines.push('', '| Task | Error | Detail |')
    lines.push('|------|-------|--------|')
    for (const task of failedTasks) {
      lines.push(`| ${task.id} | ${task.error ?? '-'} | ${task.errorDetail ?? '-'} |`)
    }
  }

  fs.writeFileSync(summaryPath, lines.join('\n'), 'utf-8')
}

/**
 * daemon 入口--供 fork 调用.
 */
export async function daemonMain(projectDir: string): Promise<void> {
  try {
    await runPilot({ projectDir })
    process.exit(0)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[Pilot] Fatal error: ${msg}`)
    try {
      releaseLock(projectDir)
    } catch {
      // ignore cleanup errors
    }
    process.exit(1)
  }
}
