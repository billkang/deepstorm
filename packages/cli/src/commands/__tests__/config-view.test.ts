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

  it('settings.json 不存在时应输出引导提示', () => {
    viewConfig(tmpDir)
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('尚未配置 DeepStorm'),
    )
  })

  it('应读取并展示 settings.json 中的 deepstorm 配置', () => {
    const dotClaude = path.join(tmpDir, '.claude')
    fs.mkdirSync(dotClaude, { recursive: true })
    fs.writeFileSync(
      path.join(dotClaude, 'settings.json'),
      JSON.stringify({
        deepstorm: {
          reef: { frontend: { framework: 'angular' } },
          installedSkills: ['reef-style-frontend'],
        },
      }),
      'utf-8',
    )

    viewConfig(tmpDir)
    // 应该以 JSON 格式打印配置
    expect(consoleLogSpy).toHaveBeenCalledWith('DeepStorm 配置:')
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"framework": "angular"'),
    )
  })

  it('settings.json 无 deepstorm 字段时应输出提示', () => {
    const dotClaude = path.join(tmpDir, '.claude')
    fs.mkdirSync(dotClaude, { recursive: true })
    fs.writeFileSync(
      path.join(dotClaude, 'settings.json'),
      JSON.stringify({ someOtherConfig: 'value' }),
      'utf-8',
    )

    viewConfig(tmpDir)
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('尚未配置 DeepStorm'),
    )
  })
})
