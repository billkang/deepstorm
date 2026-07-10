import * as fs from 'node:fs'
import * as path from 'node:path'
import { DEFAULT_CONFIG } from './schema'
import type { PilotConfig } from './schema'

/**
 * 从项目目录加载 pilot.config.json，未配置的字段使用默认值。
 */
export function loadConfig(projectDir: string): PilotConfig {
  const configPath = path.join(projectDir, '.deepstorm', 'pilot.config.json')
  try {
    const raw = fs.readFileSync(configPath, 'utf-8')
    const userConfig = JSON.parse(raw) as PilotConfig
    return { ...DEFAULT_CONFIG, ...userConfig }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}
