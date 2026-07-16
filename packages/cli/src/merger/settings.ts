import * as fs from 'node:fs'
import * as path from 'node:path'
import { deepMerge } from '../utils/json'
import type { DeepStormConfig } from '../types/config'

/** 当前配置格式版本 */
export const CONFIG_VERSION = 1

/**
 * 返回 DeepStorm 配置文件路径（.deepstorm/settings.json）。
 */
export function getDeepStormConfigPath(targetDir: string): string {
  return path.join(targetDir, '.deepstorm', 'settings.json')
}

/**
 * 写入 DeepStorm 配置到 .deepstorm/settings.json。
 * 文件不存在时自动创建目录和文件。
 */
export function writeDeepStormConfig(
  targetDir: string,
  config: DeepStormConfig,
): void {
  const settingsPath = getDeepStormConfigPath(targetDir)
  ensureDir(path.dirname(settingsPath))

  let existing: Record<string, unknown> = {}
  try {
    if (fs.existsSync(settingsPath)) {
      const raw = fs.readFileSync(settingsPath, 'utf-8')
      existing = JSON.parse(raw)
    }
  } catch {
    existing = {}
  }

  const merged = deepMerge(existing, config as unknown as Record<string, unknown>)
  fs.writeFileSync(settingsPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8')
}

/**
 * 从 .deepstorm/settings.json 读取 DeepStorm 配置。
 * 自动执行旧配置迁移（如果版本号不匹配）。
 *
 * @returns DeepStorm 配置对象，或 null（文件不存在/配置为空）
 */
export function readDeepStormConfig(
  targetDir: string,
): Record<string, unknown> | null {
  const settingsPath = getDeepStormConfigPath(targetDir)

  if (fs.existsSync(settingsPath)) {
    return readAndMigrate(settingsPath)
  }

  return null
}

/**
 * 读取并自动迁移配置。
 */
function readAndMigrate(
  settingsPath: string,
): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(settingsPath, 'utf-8')
    const config = JSON.parse(raw)
    if (!config || Object.keys(config).length === 0) return null

    const migrated = migrateConfig(config)
    if (migrated !== config) {
      fs.writeFileSync(settingsPath, JSON.stringify(migrated, null, 2) + '\n', 'utf-8')
    }

    return migrated
  } catch {
    return null
  }
}

/** 确保目录存在 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/**
 * 将扁平旧配置迁移为嵌套新结构，补全新增维度为默认值 "none"。
 *
 * 检测规则：
 * - configVersion 不存在或 < CONFIG_VERSION → 触发迁移
 * - reef 下缺少新维度字段 → 补充为 "none"
 *
 * @param config - DeepStorm 配置对象（会被原地修改，也可能返回新对象）
 * @returns 迁移后的配置对象（如果无变更则返回原引用）
 */
export function migrateConfig(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const version = (config.configVersion as number) ?? 0
  if (version >= CONFIG_VERSION) return config

  let changed = false

  // ── Reef 配置迁移 ──
  const reef = config.reef as Record<string, unknown> | undefined
  if (reef) {
    const frontend = reef.frontend as Record<string, unknown> | undefined
    if (frontend) {
      const newFrontendDims: Array<{ key: string; defaultValue: string }> = [
        { key: 'tsConfig', defaultValue: 'none' },
        { key: 'css', defaultValue: 'none' },
        { key: 'test', defaultValue: 'none' },
      ]
      for (const dim of newFrontendDims) {
        if (!(dim.key in frontend)) {
          (frontend as Record<string, unknown>)[dim.key] = dim.defaultValue
          changed = true
        }
      }
    }

    const backend = reef.backend as Record<string, unknown> | undefined
    if (backend) {
      const language = backend.language as string | undefined
      if (language === 'java') {
        if (!backend.java || typeof backend.java !== 'object') {
          backend.java = {}
          changed = true
        }
        const java = backend.java as Record<string, unknown>
        const newJavaDims: Array<{ key: string; defaultValue: string }> = [
          { key: 'framework', defaultValue: 'spring-boot' },
          { key: 'orm', defaultValue: 'hibernate' },
          { key: 'dbMigration', defaultValue: 'liquibase' },
          { key: 'ai', defaultValue: 'none' },
          { key: 'test', defaultValue: 'junit5' },
        ]
        for (const dim of newJavaDims) {
          if (!(dim.key in java)) {
            java[dim.key] = dim.defaultValue
            changed = true
          }
        }
      } else if (language) {
        if (!backend.java || typeof backend.java !== 'object') {
          backend.java = {}
          changed = true
        }
        const java = backend.java as Record<string, unknown>
        const newJavaDims: Array<{ key: string; defaultValue: string }> = [
          { key: 'framework', defaultValue: 'none' },
          { key: 'orm', defaultValue: 'none' },
          { key: 'dbMigration', defaultValue: 'none' },
          { key: 'ai', defaultValue: 'none' },
          { key: 'test', defaultValue: 'none' },
        ]
        for (const dim of newJavaDims) {
          if (!(dim.key in java)) {
            java[dim.key] = dim.defaultValue
            changed = true
          }
        }
      }
    }
  }

  // ── 更新版本号 ──
  if (changed) {
    config.configVersion = CONFIG_VERSION
  }

  return config
}

