import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { mergeDeepStormConfig, migrateConfig, CONFIG_VERSION, readDeepStormConfig } from '../settings'
import type { DeepStormConfig } from '../../types/config'

describe('mergeDeepStormConfig', () => {
  let tmpDir: string
  let settingsPath: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-settings-'))
    settingsPath = path.join(tmpDir, 'settings.json')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function readSettings(): Record<string, unknown> {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
  }

  it('creates settings.json if it does not exist', () => {
    const config: DeepStormConfig = {
      reef: { frontend: { framework: 'angular' } },
      installedSkills: ['reef-test-lint'],
    }

    mergeDeepStormConfig(settingsPath, config)

    expect(fs.existsSync(settingsPath)).toBe(true)
    const settings = readSettings()
    expect(settings.deepstorm).toBeDefined()
    expect((settings.deepstorm as any).reef.frontend.framework).toBe('angular')
    expect((settings.deepstorm as any).installedSkills).toEqual(['reef-test-lint'])
  })

  it('preserves existing non-deepstorm fields', () => {
    fs.writeFileSync(
      settingsPath,
      JSON.stringify({ mcpServers: { existing: true }, otherField: 'keep' }),
      'utf-8',
    )

    mergeDeepStormConfig(settingsPath, {
      reef: { frontend: { framework: 'angular' } },
    })

    const settings = readSettings()
    expect(settings.mcpServers).toEqual({ existing: true })
    expect(settings.otherField).toBe('keep')
    expect((settings.deepstorm as any).reef.frontend.framework).toBe('angular')
  })

  it('merges with existing deepstorm config', () => {
    // 已有部分 deepstorm 配置
    fs.writeFileSync(
      settingsPath,
      JSON.stringify({
        deepstorm: {
          reef: { frontend: { framework: 'angular' } },
          installedSkills: ['reef-test-lint'],
          installedAt: '2024-01-01',
        },
      }),
      'utf-8',
    )

    mergeDeepStormConfig(settingsPath, {
      tide: { issueTracker: 'jira' },
      installedSkills: ['reef-test-lint', 'tide-jira'],
    })

    const settings = readSettings()
    const df = settings.deepstorm as any
    // 已有字段保留
    expect(df.reef.frontend.framework).toBe('angular')
    expect(df.installedAt).toBe('2024-01-01')
    // 新字段合并
    expect(df.tide.issueTracker).toBe('jira')
    // installedSkills 数组覆盖（非追加）
    expect(df.installedSkills).toEqual(['reef-test-lint', 'tide-jira'])
  })

  it('handles non-JSON settings file gracefully', () => {
    fs.writeFileSync(settingsPath, 'not-json', 'utf-8')

    expect(() => {
      mergeDeepStormConfig(settingsPath, { reef: { frontend: { framework: 'angular' } } })
    }).not.toThrow()
  })
})

// ─── readDeepStormConfig ─────────────────────────────────────────

describe('readDeepStormConfig', () => {
  let tmpDir: string
  let settingsPath: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-readdf-'))
    settingsPath = path.join(tmpDir, 'settings.json')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('返回 deepstorm 命名空间内容', () => {
    fs.writeFileSync(
      settingsPath,
      JSON.stringify({
        deepstorm: {
          reef: { frontend: { framework: 'angular' } },
          installedSkills: ['reef-test'],
        },
      }),
      'utf-8',
    )

    const result = readDeepStormConfig(settingsPath)
    expect(result).not.toBeNull()
    expect((result as any).reef.frontend.framework).toBe('angular')
    expect((result as any).installedSkills).toEqual(['reef-test'])
  })

  it('文件不存在时返回 null', () => {
    expect(readDeepStormConfig('/nonexistent/path/settings.json')).toBeNull()
  })

  it('无 deepstorm 命名空间时返回 null', () => {
    fs.writeFileSync(
      settingsPath,
      JSON.stringify({ mcpServers: {} }),
      'utf-8',
    )

    expect(readDeepStormConfig(settingsPath)).toBeNull()
  })

  it('文件格式错误时返回 null', () => {
    fs.writeFileSync(settingsPath, 'not-json', 'utf-8')
    expect(readDeepStormConfig(settingsPath)).toBeNull()
  })
})

// ─── migrateConfig ───────────────────────────────────────────────

describe('migrateConfig', () => {
  it('should add missing frontend dimensions with default "none"', () => {
    const oldConfig: Record<string, unknown> = {
      reef: {
        frontend: { framework: 'angular' },
        backend: { language: 'java' },
      },
    }

    migrateConfig(oldConfig)

    const frontend = (oldConfig.reef as any).frontend
    expect(frontend.tsConfig).toBe('none')
    expect(frontend.css).toBe('none')
    expect(frontend.test).toBe('none')
  })

  it('should not override existing frontend dimensions', () => {
    const config: Record<string, unknown> = {
      configVersion: 1,
      reef: {
        frontend: {
          framework: 'angular',
          tsConfig: 'strict',
          css: 'tailwind',
          test: 'vitest',
        },
        backend: { language: 'java' },
      },
    }

    const result = migrateConfig(config)
    const frontend = (result.reef as any).frontend
    expect(frontend.tsConfig).toBe('strict')
    expect(frontend.css).toBe('tailwind')
    expect(frontend.test).toBe('vitest')
  })

  it('should set configVersion after migration', () => {
    const oldConfig: Record<string, unknown> = {
      reef: {
        frontend: { framework: 'angular' },
        backend: { language: 'java' },
      },
    }

    migrateConfig(oldConfig)

    expect(oldConfig.configVersion).toBe(CONFIG_VERSION)
  })

  it('should initialize Java sub-dimensions when language is java', () => {
    const oldConfig: Record<string, unknown> = {
      reef: {
        frontend: { framework: 'angular' },
        backend: { language: 'java' },
      },
    }

    migrateConfig(oldConfig)

    const java = (oldConfig.reef as any).backend.java as Record<string, unknown>
    expect(java.framework).toBe('spring-boot')
    expect(java.orm).toBe('hibernate')
    expect(java.dbMigration).toBe('liquibase')
    expect(java.ai).toBe('none')
    expect(java.test).toBe('junit5')
  })

  it('should set Java sub-dimensions to "none" when language is not java', () => {
    const oldConfig: Record<string, unknown> = {
      reef: {
        frontend: { framework: 'angular' },
        backend: { language: 'none' },
      },
    }

    migrateConfig(oldConfig)

    const java = (oldConfig.reef as any).backend.java as Record<string, unknown>
    expect(java.framework).toBe('none')
    expect(java.orm).toBe('none')
    expect(java.dbMigration).toBe('none')
    expect(java.ai).toBe('none')
    expect(java.test).toBe('none')
  })

  it('should not change config with version >= CONFIG_VERSION', () => {
    const config: Record<string, unknown> = {
      configVersion: 1,
      reef: {
        frontend: { framework: 'angular' },
        backend: { language: 'java' },
      },
    }

    const frontendBefore = (config.reef as any).frontend
    const result = migrateConfig(config)

    // No changes should happen since version is current
    expect(result).toBe(config) // same reference
    const frontendAfter = (result.reef as any).frontend
    expect(frontendAfter).toEqual(frontendBefore)
  })

  it('should preserve existing Java sub-dimensions when present', () => {
    const config: Record<string, unknown> = {
      reef: {
        frontend: { framework: 'angular' },
        backend: {
          language: 'java',
          java: {
            framework: 'spring-boot',
            orm: 'hibernate',
            dbMigration: 'none',
          },
        },
      },
    }

    migrateConfig(config)

    const java = (config.reef as any).backend.java as Record<string, unknown>
    expect(java.framework).toBe('spring-boot')
    expect(java.orm).toBe('hibernate')
    expect(java.dbMigration).toBe('none')
    expect(java.ai).toBe('none')
    expect(java.test).toBe('junit5')
  })
})
