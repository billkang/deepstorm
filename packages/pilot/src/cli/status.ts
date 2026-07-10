import { Command } from 'commander'
import * as path from 'node:path'
import { loadState } from '../state/store'
import { isLockActive } from '../daemon/lock'

/**
 * 注册 `pilot status` 命令。
 */
export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('查看 task 执行状态')
    .option('-p, --project <dir>', '项目目录')
    .action((options: { project?: string }) => {
      const projectDir = options.project ? path.resolve(options.project) : process.cwd()
      const state = loadState(projectDir)

      if (!state) {
        console.log('No pilot run found for this project.')
        return
      }

      const daemonRunning = isLockActive(projectDir)
      console.log(`\nProject: ${state.project}`)
      console.log(`Daemon:  ${daemonRunning ? '🟢 Running' : '⚫ Stopped'}`)
      console.log(`Started: ${state.startedAt}`)
      if (state.restartCount > 0) {
        console.log(`Restarts: ${state.restartCount}`)
      }
      console.log('')

      // 表格 header
      const header = 'Task ID'.padEnd(10) + 'Status'.padEnd(14) + 'Retries'.padEnd(10) + 'Tokens'.padEnd(14) + 'Duration'.padEnd(12) + 'Error'
      console.log(header)
      console.log('-'.repeat(header.length))

      for (const task of state.tasks) {
        const statusSymbol = statusBadge(task.status)
        const retriesStr = `${task.retries}/${task.maxRetries}`
        const tokensStr = task.tokensUsed > 0
          ? `${(task.tokensUsed / 1000).toFixed(0)}K / ${(task.tokenBudget / 1000).toFixed(0)}K`
          : '-'
        const durationStr = task.duration ? `${(task.duration / 1000).toFixed(0)}s` : '-'
        const errorStr = task.error ?? '-'

        console.log(
          task.id.padEnd(10) +
          statusSymbol.padEnd(14) +
          retriesStr.padEnd(10) +
          tokensStr.padEnd(14) +
          durationStr.padEnd(12) +
          errorStr,
        )
      }

      // 摘要行
      if (state.summary) {
        console.log('')
        console.log(`--- Summary ---`)
        console.log(`Completed: ${state.summary.completed}  |  Failed: ${state.summary.failed}  |  Skipped: ${state.summary.skipped}`)
        console.log(`Total tokens: ${state.summary.totalTokens}`)
        if (state.summary.totalDuration) {
          console.log(`Total duration: ${(state.summary.totalDuration / 1000).toFixed(0)}s`)
        }
      }
    })
}

function statusBadge(status: string): string {
  switch (status) {
    case 'completed': return '✅ Completed'
    case 'running':   return '🟡 Running'
    case 'failed':    return '❌ Failed'
    case 'skipped':   return '⏭️  Skipped'
    default:          return '⏳ Pending'
  }
}
