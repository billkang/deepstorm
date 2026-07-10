import { Command } from 'commander'
import * as path from 'node:path'
import { loadState, saveState, resetRunningTasksOnRecovery } from '../state/store'
import { isLockActive, acquireLock, registerLockCleanup } from '../daemon/lock'
import { loadConfig } from '../config/loader'

/**
 * 注册 `pilot resume` 命令。
 */
export function registerResumeCommand(program: Command): void {
  program
    .command('resume')
    .description('恢复失败或跳过的 task')
    .option('-p, --project <dir>', '项目目录')
    .option('-t, --task <id>', '恢复指定 task（不指定则恢复所有失败/跳过的 task）')
    .action(async (options: { project?: string; task?: string }) => {
      const projectDir = options.project ? path.resolve(options.project) : process.cwd()

      // 检查是否有 daemon 正在运行
      if (isLockActive(projectDir)) {
        console.error('Pilot daemon is still running — stop it first with "pilot stop"')
        process.exit(1)
      }

      const state = loadState(projectDir)
      if (!state) {
        console.log('No pilot state found for this project.')
        return
      }

      let tasksToResume = state.tasks.filter(t => t.status === 'failed' || t.status === 'skipped')
      if (options.task) {
        tasksToResume = tasksToResume.filter(t => t.id === options.task)
        if (tasksToResume.length === 0) {
          console.log(`No failed/skipped task found with ID "${options.task}"`)
          return
        }
      }

      if (tasksToResume.length === 0) {
        console.log('No tasks to resume.')
        return
      }

      // 重置 task 状态
      for (const task of tasksToResume) {
        task.status = 'pending'
        task.retries = 0
        task.error = null
        task.errorDetail = null
        task.errorFingerprint = null
        task.startedAt = null
        task.completedAt = null
        task.duration = null
        console.log(`Reset task ${task.id}: ${task.title}`)
      }

      state.isResumed = true
      saveState(projectDir, state)

      // 锁定并运行
      if (!acquireLock(projectDir)) {
        console.error('Failed to acquire lock.')
        process.exit(1)
      }
      registerLockCleanup(projectDir)

      console.log(`\nResuming ${tasksToResume.length} task(s)...`)
      const { runPilot } = await import('../daemon/orchestrator')
      await runPilot({ projectDir, taskFilter: tasksToResume.map(t => t.id) })
    })
}
