import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * 删除 .claude/settings.json 中的 deepstormm 命名空间。
 */
export function resetConfig(targetDir: string): void {
  const settingsPath = path.join(targetDir, '.claude', 'settings.json')

  if (!fs.existsSync(settingsPath)) return

  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    if (!settings.deepstorm) return

    delete settings.deepstorm
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8')
  } catch {
    // 文件损坏，忽略
  }
}
