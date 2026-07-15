import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { uninstallDeepStorm } from '../uninstall'

// 模拟 @clack/prompts 的 confirm，默认返回 false（不删除模板）
vi.mock('@clack/prompts', () => ({
  confirm: vi.fn().mockResolvedValue(false),
  isCancel: vi.fn().mockReturnValue(false),
}))

import { confirm } from '@clack/prompts'

describe('uninstallDeepStorm', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-uninstall-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function createSettings(config?: Record<string, unknown>): void {
    const content = config ?? {}
    const dotDeepstorm = path.join(tmpDir, '.deepstorm')
    fs.mkdirSync(dotDeepstorm, { recursive: true })
    fs.writeFileSync(
      path.join(dotDeepstorm, 'settings.json'),
      JSON.stringify(content),
      'utf-8',
    )
  }

  function createSkill(): void {
    fs.mkdirSync(path.join(tmpDir, '.claude', 'skills', 'reef-style'), { recursive: true })
    fs.writeFileSync(path.join(tmpDir, '.claude', 'skills', 'reef-style', 'SKILL.md'), '# skill', 'utf-8')
  }

  function createTemplatesDir(): void {
    fs.mkdirSync(path.join(tmpDir, '.deepstorm', 'templates', 'some-template'), { recursive: true })
    fs.writeFileSync(path.join(tmpDir, '.deepstorm', 'templates', 'some-template', 'SKILL.md'), '# template', 'utf-8')
  }

  function createMcp(): void {
    fs.writeFileSync(
      path.join(tmpDir, '.mcp.json'),
      JSON.stringify({ mcpServers: { 'deepstorm-github': { command: 'npx' }, 'user-manual': { command: 'python' } } }),
      'utf-8',
    )
  }

  it('.deepstorm/settings.json 不存在时应提示尚未配置', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await uninstallDeepStorm(tmpDir)

    expect(consoleSpy).toHaveBeenCalledWith('DeepStorm 尚未配置，无需卸载')
    consoleSpy.mockRestore()
  })

  it('空配置时应提示尚未配置', async () => {
    createSettings({}) // 空的 settings.json

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await uninstallDeepStorm(tmpDir)

    expect(consoleSpy).toHaveBeenCalledWith('DeepStorm 尚未配置，无需卸载')
    consoleSpy.mockRestore()
  })

  it('settings.json 损坏时应继续执行清理', async () => {
    const dotDeepstorm = path.join(tmpDir, '.deepstorm')
    fs.mkdirSync(dotDeepstorm, { recursive: true })
    fs.writeFileSync(path.join(dotDeepstorm, 'settings.json'), '{invalid json', 'utf-8')

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await uninstallDeepStorm(tmpDir)

    expect(consoleSpy).toHaveBeenCalledWith('DeepStorm 尚未配置，无需卸载')
    consoleSpy.mockRestore()
  })

  it('完整卸载：清理 skill、MCP 并删除 .deepstorm/settings.json', async () => {
    createSettings({
      installedSkills: ['reef-style'],
      installedMcpServers: ['github'],
      installedAt: '2024-01-01T00:00:00.000Z',
    })
    createSkill()
    createMcp()

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await uninstallDeepStorm(tmpDir)

    // skill 目录应被清理
    expect(fs.existsSync(path.join(tmpDir, '.claude', 'skills', 'reef-style'))).toBe(false)

    // deepstorm-* MCP server 应被清理，用户自定义应保留
    const mcpAfter = JSON.parse(fs.readFileSync(path.join(tmpDir, '.mcp.json'), 'utf-8'))
    expect(mcpAfter.mcpServers).not.toHaveProperty('deepstorm-github')
    expect(mcpAfter.mcpServers['user-manual']).toEqual({ command: 'python' })

    // .deepstorm/settings.json 应被删除
    expect(fs.existsSync(path.join(tmpDir, '.deepstorm', 'settings.json'))).toBe(false)

    expect(consoleSpy).toHaveBeenCalledWith('✔ DeepStorm 已卸载')
    consoleSpy.mockRestore()
  })

  it('.deepstorm/templates/ 存在且用户确认删除时应删除', async () => {
    createSettings({ installedSkills: [], installedAt: '2024-01-01T00:00:00.000Z' })
    createTemplatesDir()

    vi.mocked(confirm).mockResolvedValueOnce(true)

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await uninstallDeepStorm(tmpDir)

    expect(fs.existsSync(path.join(tmpDir, '.deepstorm', 'templates'))).toBe(false)
    expect(consoleSpy).toHaveBeenCalledWith('✔ .deepstorm/templates/ 已删除')
    consoleSpy.mockRestore()
  })

  it('.deepstorm/templates/ 存在但用户取消删除时应保留', async () => {
    createSettings({ installedSkills: [], installedAt: '2024-01-01T00:00:00.000Z' })
    createTemplatesDir()

    // confirm 默认返回 false
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    await uninstallDeepStorm(tmpDir)

    expect(fs.existsSync(path.join(tmpDir, '.deepstorm', 'templates'))).toBe(true)
    expect(consoleSpy).toHaveBeenCalledWith('保留 .deepstorm/templates/')
    consoleSpy.mockRestore()
  })
})
