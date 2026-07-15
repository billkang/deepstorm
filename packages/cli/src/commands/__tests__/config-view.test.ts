import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import os from 'node:os'
import { viewConfig } from '../config-view'

describe('viewConfig', () => {
  let tmpDir: string
  let consoleLogSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-view-test-'))
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('.deepstorm/settings.json 不存在时应输出引导提示', () => {
    viewConfig(tmpDir)
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('尚未配置 DeepStorm'),
    )
  })

  it('应读取并展示 .deepstorm/settings.json 中的配置', () => {
    const deepstormDir = path.join(tmpDir, '.deepstorm')
    fs.mkdirSync(deepstormDir, { recursive: true })
    fs.writeFileSync(
      path.join(deepstormDir, 'settings.json'),
      JSON.stringify({
        reef: { frontend: { framework: 'angular' } },
        installedSkills: ['reef-style-frontend'],
      }),
      'utf-8',
    )

    viewConfig(tmpDir)
    expect(consoleLogSpy).toHaveBeenCalledWith('DeepStorm 配置:')
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"framework": "angular"'),
    )
  })

  it('.deepstorm/settings.json 为空时应输出提示', () => {
    const deepstormDir = path.join(tmpDir, '.deepstorm')
    fs.mkdirSync(deepstormDir, { recursive: true })
    fs.writeFileSync(
      path.join(deepstormDir, 'settings.json'),
      JSON.stringify({}),
      'utf-8',
    )

    viewConfig(tmpDir)
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('尚未配置 DeepStorm'),
    )
  })
})
