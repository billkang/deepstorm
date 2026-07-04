import * as fs from 'node:fs'
import { deepMerge } from '../utils/json'
import type { DeepStormConfig } from '../types/config'

/** 当前配置格式版本 */
export const CONFIG_VERSION = 1

/**
 * 合并 DeepStorm 配置到 .claude/settings.json 的 deepstormm 命名空间。
 * 文件不存在时自动创建，已有非 deepstorm 字段原样保留。
 */
export function mergeDeepStormConfig(
  settingsPath: string,
  config: DeepStormConfig,
): void {
  let settings: Record<string, unknown> = {}

  try {
    if (fs.existsSync(settingsPath)) {
      const raw = fs.readFileSync(settingsPath, 'utf-8')
      settings = JSON.parse(raw)
    }
  } catch {
    // 文件损坏或非 JSON，从空对象开始
    settings = {}
  }

  const existing = (settings.deepstorm as Record<string, unknown>) || {}
  settings.deepstorm = deepMerge(existing, config as unknown as Record<string, unknown>)

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8')
}

/**
 * 从 .claude/settings.json 的 deepstormm 命名空间读取配置。
 * 读取后自动执行旧配置迁移（如果版本号不匹配）。
 *
 * @returns deepstormm 配置对象，或 null（文件不存在/配置为空）
 */
export function readDeepStormConfig(
  settingsPath: string,
): Record<string, unknown> | null {
  if (!fs.existsSync(settingsPath)) return null

  try {
    const raw = fs.readFileSync(settingsPath, 'utf-8')
    const settings = JSON.parse(raw)
    const deepstorm = settings.deepstorm as Record<string, unknown> | undefined
    if (!deepstorm) return null

    // 自动迁移旧配置
    const migrated = migrateConfig(deepstorm)
    if (migrated !== deepstorm) {
      settings.deepstorm = migrated
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8')
    }

    return settings.deepstorm as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * 将扁平旧配置迁移为嵌套新结构，补全新增维度为默认值 "none"。
 *
 * 检测规则：
 * - configVersion 不存在或 < CONFIG_VERSION → 触发迁移
 * - reef 下缺少新维度字段 → 补充为 "none"
 *
 * @param config - deepstormm 命名空间的对象（会被原地修改，也可能返回新对象）
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
        // 确保 Java 子维度存在（多选，展开为对象）
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
        // 非 Java 语言，确保 java 子维度存在但为 none
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
