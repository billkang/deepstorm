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
  /** 指定 change 名称(目录名), 不指定则自动取第一个 */
  changeName?: string
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
 * OpenSpec change 目录及其 artifacts.
 */
export interface ActiveChange {
  /** Change 名称(目录名) */
  name: string
  /** Change 目录完整路径 */
  dir: string
  /** tasks.md 路径 */
  tasksPath: string
  /** specs/ 目录路径(可能不存在) */
  specsDir: string
  /** design.md 路径(可能不存在) */
  designPath: string
}

/**
 * 查找第一个未完成的 OpenSpec change.
 *
 * 仅扫描 openspec/changes/<change-name>/ (active changes, 排除 archive).
 * 不处理已归档的 change, 不 fallback 到项目根目录.
 *
 * 多个 active change 时按名称排序取第一个.
 * 每完成一个 change 后应 archive, 然后进入下一次循环处理下一个.
 */
export function findFirstActiveChange(projectDir: string): ActiveChange | null {
  const changesDir = path.join(projectDir, 'openspec', 'changes')

  try {
    const entries = fs.readdirSync(changesDir, { withFileTypes: true })
    const activeNames = entries
      .filter(e => e.isDirectory() && e.name !== 'archive')
      .map(e => e.name)
      .sort()

    for (const name of activeNames) {
      const dir = path.join(changesDir, name)
      const tasksPath = path.join(dir, 'tasks.md')
      if (fs.existsSync(tasksPath)) {
        return {
          name,
          dir,
          tasksPath,
          specsDir: path.join(dir, 'specs'),
          designPath: path.join(dir, 'design.md'),
        }
      }
    }
  } catch {
    // changes 目录不存在
  }

  return null
}

/**
 * 按名称查找指定的 OpenSpec change.
 *
 * 仅查找 openspec/changes/<name>/ (active change).
 * 不处理已归档的 change.
 */
export function findChangeByName(projectDir: string, changeName: string): ActiveChange | null {
  const changesDir = path.join(projectDir, 'openspec', 'changes')

  const activeDir = path.join(changesDir, changeName)
  const activeTasksPath = path.join(activeDir, 'tasks.md')
  if (fs.existsSync(activeTasksPath)) {
    return {
      name: changeName,
      dir: activeDir,
      tasksPath: activeTasksPath,
      specsDir: path.join(activeDir, 'specs'),
      designPath: path.join(activeDir, 'design.md'),
    }
  }

  return null
}

/**
 * 读取 tasks.md 文件内容.
 */
function readTasksMd(change: ActiveChange): string | null {
  try {
    return fs.readFileSync(change.tasksPath, 'utf-8')
  } catch {
    return null
  }
}

/**
 * 读取 change 下的 spec 文件内容.
 */
function readSpecs(change: ActiveChange): string {
  let content = ''

  // 读取 change 自身的 specs/
  try {
    const files = fs.readdirSync(change.specsDir, { recursive: true })
    for (const file of files) {
      const fileName = String(file)
      const filePath = path.join(change.specsDir, fileName)
      if (fileName.endsWith('.md') && fs.statSync(filePath).isFile()) {
        content += `\n---\n${fs.readFileSync(filePath, 'utf-8')}\n`
      }
    }
  } catch {
    // specs/ 可能不存在
  }

  return content
}

/**
 * 读取 change 下的 design.md 文件内容.
 */
function readDesignMd(change: ActiveChange): string {
  try {
    return fs.readFileSync(change.designPath, 'utf-8')
  } catch {
    return ''
  }
}

/**
 * 归档已完成的 change.
 *
 * 当所有 tasks 状态均为 completed 时, 将 change 目录移至
 * openspec/changes/archive/<YYYY-MM-DD>-<name>/.
 * 存在 failed/skipped 时跳过归档.
 *
 * @returns true 表示归档成功, false 表示跳过或失败
 */
export function archiveChange(projectDir: string, change: ActiveChange, state: PilotState): boolean {
  const allCompleted = state.tasks.every(t => t.status === 'completed')
  if (!allCompleted) {
    const failedCount = state.tasks.filter(t => t.status === 'failed' || t.status === 'skipped').length
    console.log(`[Pilot] ${failedCount} task(s) failed/skipped, skipping archive.`)
    return false
  }

  if (state.tasks.length === 0) {
    console.log('[Pilot] No tasks to archive, skipping.')
    return false
  }

  const dateStr = new Date().toISOString().slice(0, 10)
  const archiveDir = path.join(projectDir, 'openspec', 'changes', 'archive', `${dateStr}-${change.name}`)

  try {
    // 确保 archive 父目录存在
    const archiveParent = path.dirname(archiveDir)
    if (!fs.existsSync(archiveParent)) {
      fs.mkdirSync(archiveParent, { recursive: true })
    }

    // 如果目标已存在, 追加序号
    let finalPath = archiveDir
    let counter = 1
    while (fs.existsSync(finalPath)) {
      finalPath = path.join(projectDir, 'openspec', 'changes', 'archive', `${dateStr}-${change.name}-${counter}`)
      counter++
    }

    fs.renameSync(change.dir, finalPath)
    console.log(`[Pilot] Archived change: ${change.name} → archive/${path.basename(finalPath)}`)
    return true
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[Pilot] Failed to archive change: ${msg}`)
    return false
  }
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

  // 查找 change: --tasks 指定名称 → 自动取第一个
  const change = options.changeName
    ? findChangeByName(projectDir, options.changeName)
    : findFirstActiveChange(projectDir)

  if (!change) {
    if (options.changeName) {
      console.error(`Change not found: ${options.changeName}`)
      console.error(`Looked in openspec/changes/${options.changeName}/`)
    } else {
      console.error('No active change found in project.')
      console.error('Run pilot from an OpenSpec project with active changes, or use --tasks to specify a change name.')
    }
    releaseLock(projectDir)
    process.exit(1)
  }

  console.log(`[Pilot] Active change: ${change.name}`)

  // 读取 change 的所有 artifacts
  const tasksMdContent = readTasksMd(change)
  if (!tasksMdContent) {
    console.error('No tasks.md found in change.')
    releaseLock(projectDir)
    process.exit(1)
  }

  const specContent = readSpecs(change)
  const designContent = readDesignMd(change)

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

  // 归档已完成的 change
  archiveChange(projectDir, change, state)

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
