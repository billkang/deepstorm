import * as fs from 'node:fs'
import * as path from 'node:path'
import { getDeepStormConfigPath } from '../merger/settings'

/**
 * 删除 .deepstorm/settings.json（DeepStorm 配置）。
 */
export function resetConfig(targetDir: string): void {
  const settingsPath = path.join(targetDir, '.deepstorm', 'settings.json')

  if (!fs.existsSync(settingsPath)) return

  try {
    fs.unlinkSync(settingsPath)
    console.log('✔ 已清除 DeepStorm 配置')
  } catch {
    // 无法删除，忽略
  }
}
