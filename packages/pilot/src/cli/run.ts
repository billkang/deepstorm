import { Command } from 'commander'
import * as path from 'node:path'
import * as cp from 'node:child_process'
import { checkClaudeCli, findFirstActiveChange, findChangeByName } from '../daemon/orchestrator'
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
    .option('--tasks <name>', '指定 change 名称（openspec/changes/ 下的目录名）')
    .action(async (options: RunOptions) => {
      const projectDir = options.project ? path.resolve(options.project) : process.cwd()

      // 前置检查：claude CLI 是否可用
      if (!checkClaudeCli()) {
        console.error('Error: claude CLI is not available.')
        console.error('Make sure Claude Code is installed and configured.')
        process.exit(1)
      }

      // 前置检查：查找 change
      if (options.tasks) {
        // 按名称查找指定 change
        const change = findChangeByName(projectDir, options.tasks)
        if (!change) {
          console.error(`Error: change "${options.tasks}" not found.`)
          console.error(`Looked in openspec/changes/${options.tasks}/`)
          process.exit(1)
        }
        console.log(`[Pilot] Using specified change: ${change.name}`)
      } else {
        // 自动取第一个 active change
        const change = findFirstActiveChange(projectDir)
        if (!change) {
          console.error(`Error: no active change found in ${projectDir}`)
          console.error('Run pilot from an OpenSpec project with active changes, or use --tasks to specify a change name.')
          process.exit(1)
        }
        console.log(`[Pilot] Found active change: ${change.name}`)
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
        await runPilot({ projectDir, changeName: options.tasks })
      }
    })
}
