import { Command } from 'commander'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { releaseLock } from '../daemon/lock'

/**
 * 等待进程退出（轮询，最多 30s）。
 */
function waitForExit(pid: number, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now()
    const poll = () => {
      if (Date.now() - start >= timeoutMs) {
        resolve()
        return
      }
      try {
        process.kill(pid, 0)
        setTimeout(poll, 500)
      } catch {
        resolve()
      }
    }
    poll()
  })
}

/**
 * 注册 `pilot stop` 命令。
 */
export function registerStopCommand(program: Command): void {
  program
    .command('stop')
    .description('停止 pilot daemon')
    .option('-p, --project <dir>', '项目目录')
    .option('-f, --force', '强制停止 (SIGKILL)')
    .action(async (options: { project?: string; force?: boolean }) => {
      const projectDir = options.project ? path.resolve(options.project) : process.cwd()
      const lockPath = path.join(projectDir, '.deepstorm', '.pilot.lock')

      if (!fs.existsSync(lockPath)) {
        console.log('No pilot daemon running for this project.')
        return
      }

      try {
        const pidStr = fs.readFileSync(lockPath, 'utf-8').trim()
        const pid = parseInt(pidStr, 10)

        if (isNaN(pid)) {
          releaseLock(projectDir)
          console.log('Invalid lock file cleaned up.')
          return
        }

        try {
          const signal = options.force ? 'SIGKILL' : 'SIGTERM'
          process.kill(pid, signal)
          console.log(`Sent ${signal} to pilot daemon (PID: ${pid})`)

          if (!options.force) {
            await waitForExit(pid, 30_000)
          }

          releaseLock(projectDir)
          console.log('Pilot stopped.')
        } catch {
          // PID not alive, clean stale lock
          releaseLock(projectDir)
          console.log('No running pilot daemon found — stale lock cleaned up.')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`Error stopping pilot: ${message}`)
        process.exit(1)
      }
    })
}
