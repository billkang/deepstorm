import { Command } from 'commander'
import * as path from 'node:path'
import * as fs from 'node:fs'
/**
 * 注册 `pilot log` 命令。
 */
export function registerLogCommand(program: Command): void {
  program
    .command('log')
    .description('查看执行日志')
    .option('-p, --project <dir>', '项目目录')
    .option('-t, --task <id>', '按 task ID 过滤')
    .option('-f, --follow', '实时追踪新日志')
    .action((options: { project?: string; task?: string; follow?: boolean }) => {
      const projectDir = options.project ? path.resolve(options.project) : process.cwd()
      const logDir = path.join(projectDir, '.deepstorm', 'pilot-logs')

      if (!fs.existsSync(logDir)) {
        console.log('No logs found.')
        return
      }

      const logFiles = options.task
        ? [`${options.task}.log`]
        : fs.readdirSync(logDir).filter(f => f.endsWith('.log')).sort()

      if (logFiles.length === 0) {
        console.log('No logs found.')
        return
      }

      for (const logFile of logFiles) {
        const logPath = path.join(logDir, logFile)
        const taskId = logFile.replace(/\.log$/, '')

        if (fs.existsSync(logPath)) {
          const stats = fs.statSync(logPath)
          const timestamp = stats.mtime.toISOString()
          const content = fs.readFileSync(logPath, 'utf-8')
          const lines = content.split('\n')
          for (const line of lines) {
            if (line.trim()) {
              console.log(`[${taskId} ${timestamp}] ${line}`)
            }
          }
        }
      }

      // --follow 模式：追踪最新的日志文件,只读取新增内容
      if (options.follow && logFiles.length > 0) {
        const latestLog = logFiles[logFiles.length - 1]
        const logPath = path.join(logDir, latestLog)

        let lastPosition = fs.existsSync(logPath) ? fs.statSync(logPath).size : 0
        let lastTimestamp = fs.existsSync(logPath) ? fs.statSync(logPath).mtime.toISOString() : ''

        const watcher = fs.watch(logPath, () => {
          try {
            const stats = fs.statSync(logPath)
            if (stats.size <= lastPosition) return
            const fd = fs.openSync(logPath, 'r')
            const buf = Buffer.alloc(stats.size - lastPosition)
            fs.readSync(fd, buf, 0, buf.length, lastPosition)
            fs.closeSync(fd)
            const newContent = buf.toString('utf-8')
            lastTimestamp = stats.mtime.toISOString()
            for (const line of newContent.split('\n')) {
              if (line.trim()) {
                console.log(`[${latestLog.replace(/\.log$/, '')} ${lastTimestamp}] ${line}`)
              }
            }
            lastPosition = stats.size
          } catch {
            // file may be rotated or removed during follow
          }
        })

        process.on('SIGINT', () => {
          watcher.close()
          process.exit(0)
        })
      }
    })
}
