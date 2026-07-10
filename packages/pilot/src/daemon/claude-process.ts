import { ChildProcess, spawn } from 'node:child_process'
import * as path from 'node:path'
import * as fs from 'node:fs'

export interface ClaudeProcessOptions {
  /** 项目目录，claude 将在此目录下运行 */
  projectDir: string
  /** 发送给 claude 的 prompt */
  prompt: string
  /** 日志目录 */
  logDir: string
  /** task ID，用于日志文件命名 */
  taskId: string
  /** 超时时间（毫秒） */
  timeoutMs: number
  /** 是否启用自动应答 */
  autoYes?: boolean
  /** 每收到输出数据时的回调（用于 monitor 模块实时分析） */
  onData?: (text: string) => void
}

export interface ClaudeProcessResult {
  /** 退出码 */
  exitCode: number | null
  /** 是否被信号终止 */
  signaled: boolean
  /** 终止信号 */
  signal: string | null
  /** 累计输出文本 */
  output: string
  /** 是否检测到死循环 */
  deadLoop: boolean
}

export interface ClaudeProcessHandle {
  /** 等待进程结束 */
  wait: () => Promise<ClaudeProcessResult>
  /** 终止进程 */
  kill: (signal?: 'SIGTERM' | 'SIGKILL') => void
  /** 进程是否存活 */
  isAlive: () => boolean
}

/**
 * 检测输出中是否包含 task 完成标记。
 */
export function hasTaskCompleteMarker(output: string, taskId: string): boolean {
  return output.includes(`##TASK_COMPLETE ##${taskId}##`)
}

/**
 * 检测输出中是否包含 task 卡住标记。
 */
export function hasTaskStuckMarker(output: string, taskId: string): string | null {
  const prefix = `##TASK_STUCK ##${taskId}##`
  const idx = output.indexOf(prefix)
  if (idx >= 0) {
    return output.slice(idx + prefix.length).split('\n')[0].trim()
  }
  return null
}

/**
 * 从输出中解析 token 消耗信息。
 * 匹配形如 "Tokens: 12345 input, 67890 output" 的行。
 */
export function parseTokenUsage(output: string): { input?: number; output?: number } {
  const result: { input?: number; output?: number } = {}

  const inputMatch = output.match(/Tokens:\s*([\d,]+)\s+input/i)
  if (inputMatch) {
    result.input = parseInt(inputMatch[1].replace(/,/g, ''), 10)
  }

  const outputMatch = output.match(/(?:input,\s*)?([\d,]+)\s+output/i)
  if (outputMatch && !outputMatch[1].includes('input')) {
    result.output = parseInt(outputMatch[1].replace(/,/g, ''), 10)
  }

  return result
}

/**
 * 生成 prompt，告诉 claude 如何执行一个 task。
 */
export function buildTaskPrompt(
  taskId: string,
  taskTitle: string,
  taskDescription: string,
  specContent: string,
  constraints: string[],
): string {
  return [
    `## 你的任务`,
    ``,
    `你正在实现 OpenSpec 变更中的任务。`,
    ``,
    `## 当前任务`,
    ``,
    `### 任务 ${taskId}: ${taskTitle}`,
    ``,
    taskDescription,
    ``,
    specContent ? `## Spec 要求\n\n${specContent}` : '',
    ``,
    `## 约束`,
    ``,
    ...constraints.map(c => `- ${c}`),
    ``,
    `- 每次只实现一个 task`,
    `- 实现完成后，输出标识: ##TASK_COMPLETE ##${taskId}##`,
    `- 遇到无法解决的问题时，输出: ##TASK_STUCK ##${taskId}##<原因>`,
  ].filter(Boolean).join('\n')
}

/**
 * 解析 tasks.md 内容，返回 task 列表。
 * 格式参考:
 * ```
 * ## 1. Group Name
 * - [ ] 1.1 Task description
 * ```
 */
export function parseTasksMd(content: string): Array<{ id: string; title: string }> {
  const tasks: Array<{ id: string; title: string }> = []
  const checkboxRegex = /-\s+\[\s*\]\s+([\d.]+)\s+(.+)/
  const lines = content.split('\n')

  for (const line of lines) {
    const match = line.match(checkboxRegex)
    if (match) {
      tasks.push({
        id: match[1].trim(),
        title: match[2].trim(),
      })
    }
  }

  return tasks
}

/**
 * 确保日志目录存在。
 */
function ensureLogDir(logDir: string): void {
  fs.mkdirSync(logDir, { recursive: true })
}

/**
 * 启动 claude CLI 进程并返回控制句柄。
 */
export function spawnClaudeProcess(options: ClaudeProcessOptions): ClaudeProcessHandle {
  const { projectDir, prompt, logDir, taskId, timeoutMs, autoYes = true } = options
  ensureLogDir(logDir)

  const logPath = path.join(logDir, `${taskId}.log`)
  const logStream = fs.createWriteStream(logPath, { flags: 'a' })

  logStream.write(`[${new Date().toISOString()}] Starting task ${taskId}\n`)
  logStream.write(`[${new Date().toISOString()}] Prompt:\n${prompt}\n\n`)

  let output = ''
  let isDead = false

  // 使用 --print 非交互模式，将 prompt 作为参数传入
  const child: ChildProcess = spawn('claude', ['-p', prompt], {
    cwd: projectDir,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env },
  })

  // 自动应答（--print 模式下可能需要接受条款）
  if (autoYes && child.stdin) {
    child.stdin.write('yes\n')
    child.stdin.end()
  }

  // stdout 处理
  child.stdout?.on('data', (data: Buffer) => {
    const text = data.toString('utf-8')
    output += text
    logStream.write(text)
    options.onData?.(text)
  })

  // stderr 处理
  child.stderr?.on('data', (data: Buffer) => {
    const text = data.toString('utf-8')
    output += text
    logStream.write(text)
    options.onData?.(text)
  })

  // 超时定时器
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      child.kill('SIGTERM')
    }, timeoutMs)
  }

  const waitPromise = new Promise<ClaudeProcessResult>((resolve) => {
    child.on('close', (code, signal) => {
      if (timeoutId) clearTimeout(timeoutId)
      isDead = true
      logStream.write(`[${new Date().toISOString()}] Task ${taskId} exited: code=${code}, signal=${signal}\n`)
      logStream.end()
      resolve({
        exitCode: code,
        signaled: signal !== null,
        signal,
        output,
        deadLoop: false,
      })
    })

    child.on('error', (err) => {
      if (timeoutId) clearTimeout(timeoutId)
      isDead = true
      logStream.write(`[${new Date().toISOString()}] Task ${taskId} error: ${err.message}\n`)
      logStream.end()
      resolve({
        exitCode: null,
        signaled: false,
        signal: null,
        output,
        deadLoop: false,
      })
    })
  })

  return {
    wait: () => waitPromise,
    kill: (signal = 'SIGTERM') => {
      child.kill(signal)
      isDead = true
    },
    isAlive: () => !isDead && child.exitCode === null && child.killed === false,
  }
}
