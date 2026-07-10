/**
 * Daemon 入口——供 child_process.fork() 调用。
 *
 * 接收来自父进程的 IPC 消息：
 *   { type: 'start', projectDir: string }
 *   { type: 'status' }
 *   { type: 'stop' }
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { daemonMain } from './orchestrator'

let running = false
let errorLogStream: fs.WriteStream | null = null

/**
 * 将 daemon 的 stderr 重定向到日志文件，方便排查后台问题。
 */
function redirectStderr(projectDir: string): void {
  const logDir = path.join(projectDir, '.deepstorm', 'pilot-logs')
  fs.mkdirSync(logDir, { recursive: true })
  errorLogStream = fs.createWriteStream(path.join(logDir, 'daemon-error.log'), { flags: 'a' })
  const origStderr = process.stderr.write.bind(process.stderr)
  process.stderr.write = (chunk: any, ...args: any[]) => {
    errorLogStream?.write(typeof chunk === 'string' ? chunk : chunk.toString())
    return origStderr(chunk, ...args)
  }
}

process.on('message', async (msg: any) => {
  try {
    if (msg.type === 'start') {
      if (running) {
        process.send?.({ type: 'error', message: 'Daemon is already running' })
        return
      }
      const projectDir = msg.projectDir ?? process.cwd()
      redirectStderr(projectDir)
      running = true
      process.send?.({ type: 'started', pid: process.pid })
      await daemonMain(projectDir)
    } else if (msg.type === 'status') {
      process.send?.({
        type: 'status',
        running,
        pid: process.pid,
      })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    process.send?.({ type: 'error', message })
  }
})

process.on('SIGTERM', () => {
  running = false
  errorLogStream?.end()
  process.exit(0)
})

process.on('SIGINT', () => {
  running = false
  errorLogStream?.end()
  process.exit(0)
})
