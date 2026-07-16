import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { migrateConfig, CONFIG_VERSION, readDeepStormConfig } from '../settings'

// ─── readDeepStormConfig ─────────────────────────────────────────

describe('readDeepStormConfig', () => {
  let tmpDir: string
  let deepstormSettingsPath: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-readdf-'))
    const dotDeepstorm = path.join(tmpDir, '.deepstorm')
    fs.mkdirSync(dotDeepstorm, { recursive: true })
    deepstormSettingsPath = path.join(dotDeepstorm, 'settings.json')
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('返回 .deepstorm/settings.json 的内容', () => {
    fs.writeFileSync(
      deepstormSettingsPath,
      JSON.stringify({
        reef: { frontend: { framework: 'angular' } },
        installedSkills: ['reef-test'],
      }),
      'utf-8',
    )

    const result = readDeepStormConfig(tmpDir)
    expect(result).not.toBeNull()
    expect((result as any).reef.frontend.framework).toBe('angular')
    expect((result as any).installedSkills).toEqual(['reef-test'])
  })

  it('文件不存在时返回 null', () => {
    expect(readDeepStormConfig('/nonexistent/path')).toBeNull()
  })

  it('文件内容为空时返回 null', () => {
    fs.writeFileSync(deepstormSettingsPath, '{}', 'utf-8')
    expect(readDeepStormConfig(tmpDir)).toBeNull()
  })

  it('文件格式错误时返回 null', () => {
    fs.writeFileSync(deepstormSettingsPath, 'not-json', 'utf-8')
    expect(readDeepStormConfig(tmpDir)).toBeNull()
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
