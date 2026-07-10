import { Command } from 'commander'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { loadState } from '../state/store'

/**
 * 注册 `pilot list` 命令。
 */
export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('列出所有有 pilot 状态的项目')
    .option('-d, --dir <path>', '扫描目录（默认当前目录）')
    .action((options: { dir?: string }) => {
      const scanDir = options.dir ? path.resolve(options.dir) : process.cwd()

      // 首先检查当前目录本身
      const projects: Array<{ path: string; status: string; tasks: string; updatedAt: string }> = []
      const selfState = loadState(scanDir)
      if (selfState) {
        projects.push({
          path: scanDir,
          status: selfState.summary ? 'completed' : 'in_progress',
          tasks: `${selfState.tasks.filter(t => t.status === 'completed').length}/${selfState.tasks.length}`,
          updatedAt: selfState.updatedAt,
        })
      }

      // 扫描子目录
      try {
        const entries = fs.readdirSync(scanDir, { withFileTypes: true })
        for (const entry of entries) {
          if (!entry.isDirectory() || entry.name.startsWith('.')) continue
          const subDir = path.join(scanDir, entry.name)
          const state = loadState(subDir)
          if (state) {
            projects.push({
              path: subDir,
              status: state.summary ? 'completed' : 'in_progress',
              tasks: `${state.tasks.filter(t => t.status === 'completed').length}/${state.tasks.length}`,
              updatedAt: state.updatedAt,
            })
          }
        }
      } catch {
        // 扫描失败则忽略
      }

      if (projects.length === 0) {
        console.log('No pilot projects found.')
        return
      }

      console.log('\nPilot Projects:')
      console.log('')
      const header = 'Project'.padEnd(40) + 'Status'.padEnd(16) + 'Tasks'.padEnd(12) + 'Updated'
      console.log(header)
      console.log('-'.repeat(header.length))

      for (const proj of projects) {
        const statusBadge = proj.status === 'completed' ? '✅ Completed' : '🟡 In Progress'
        const shortPath = proj.path.startsWith(process.cwd())
          ? '.' + proj.path.slice(process.cwd().length)
          : proj.path
        console.log(
          shortPath.padEnd(40) +
          statusBadge.padEnd(16) +
          proj.tasks.padEnd(12) +
          new Date(proj.updatedAt).toLocaleString(),
        )
      }
      console.log('')
    })
}
