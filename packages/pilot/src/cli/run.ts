import { Command } from 'commander'
import * as path from 'node:path'
import * as fs from 'node:fs'
import * as cp from 'node:child_process'
import { checkClaudeCli } from '../daemon/orchestrator'
import { isLockActive } from '../daemon/lock'

export interface RunOptions {
  project?: string
  detach?: boolean
  tasks?: string
}

/**
 * 注册 `pilot run` 命令。
 */
export function registerRunCommand(program: Command): void {
  program
    .command('run')
    .description('启动 OpenSpec tasks 自动执行')
    .option('-p, --project <dir>', '项目目录')
    .option('-d, --detach', '后台 daemon 模式运行')
    .option('--tasks <file>', '指定 tasks.md 文件路径')
    .action(async (options: RunOptions) => {
      const projectDir = options.project ? path.resolve(options.project) : process.cwd()

      // 前置检查：claude CLI 是否可用
      if (!checkClaudeCli()) {
        console.error('Error: claude CLI is not available.')
        console.error('Make sure Claude Code is installed and configured.')
        process.exit(1)
      }

      // 前置检查：OpenSpec 是否存在
      const tasksPath = options.tasks
        ? path.resolve(options.tasks)
        : path.join(projectDir, 'tasks.md')

      if (!fs.existsSync(tasksPath)) {
        if (options.tasks) {
          console.error(`Error: specified tasks file not found: ${tasksPath}`)
        } else {
          console.error(`Error: no tasks.md found in ${projectDir}`)
          console.error('Run pilot from an OpenSpec project, or use --tasks to specify a file.')
        }
        process.exit(1)
      }

      // 锁检查
      if (isLockActive(projectDir)) {
        console.error(`Pilot daemon is already running on this project.`)
        console.error(`Use 'pilot stop' to stop it first, or 'pilot status' to check.`)
        process.exit(1)
      }

      console.log(`[Pilot] Starting run for ${projectDir}`)

      if (options.detach) {
        // Daemon 模式：fork 子进程
        // 生产环境指向 dist/daemon/index.js，开发环境指向 src/daemon/index.ts
        const daemonScript = path.join(__dirname, '..', 'daemon', 'index.js')
        const child = cp.fork(daemonScript, [], {
          cwd: projectDir,
          stdio: 'pipe',
          env: { ...process.env },
        })

        child.on('message', (msg: any) => {
          if (msg.type === 'started') {
            console.log(`[Pilot] Daemon started (PID: ${msg.pid})`)
            console.log(`[Pilot] Use 'pilot status' to check progress`)
            console.log(`[Pilot] Use 'pilot log' to view logs`)
          }
        })

        child.on('error', (err) => {
          console.error(`[Pilot] Daemon error: ${err.message}`)
          process.exit(1)
        })

        // 发送 IPC start 消息，通知 daemon 开始执行
        child.send({ type: 'start', projectDir })

        process.stdin?.resume()
      } else {
        // 前台模式：直接运行
        const { runPilot } = await import('../daemon/orchestrator')
        await runPilot({ projectDir })
      }
    })
}
