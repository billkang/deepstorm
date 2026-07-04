import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fetch before importing update module
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock getCliVersion
vi.mock('../../utils/version', () => ({
  getCliVersion: () => '0.1.2',
}))

// Mock upgradeTemplates
vi.mock('../template-upgrade', () => ({
  upgradeTemplates: vi.fn(),
}))

import { checkNpmVersion, updateCLI, updateSkills, registerUpdateCommand } from '../update'
import { upgradeTemplates } from '../template-upgrade'
import { Command } from 'commander'
import type { Registry } from '../../types/registry'

describe('checkNpmVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应返回最新版本当 npm registry 响应正常', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ version: '0.2.0' }),
    })

    const result = await checkNpmVersion()

    expect(result.current).toBe('0.1.2')
    expect(result.latest).toBe('0.2.0')
    expect(result.error).toBeUndefined()
    expect(mockFetch).toHaveBeenCalledWith(
      'https://registry.npmjs.org/@deepstorm/cli/latest',
      expect.any(Object),
    )
  })

  it('应处理 npm registry 网络错误', async () => {
    mockFetch.mockRejectedValueOnce(new Error('connect ECONNREFUSED'))

    const result = await checkNpmVersion()

    expect(result.current).toBe('0.1.2')
    expect(result.latest).toBeNull()
    expect(result.error).toBeDefined()
    expect(result.error).toContain('connect ECONNREFUSED')
  })

  it('应处理非 200 响应', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    const result = await checkNpmVersion()

    expect(result.current).toBe('0.1.2')
    expect(result.latest).toBeNull()
    expect(result.error).toBeDefined()
  })

  it('应处理 JSON 解析异常', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new Error('Unexpected token <')),
    })

    const result = await checkNpmVersion()

    expect(result.current).toBe('0.1.2')
    expect(result.latest).toBeNull()
    expect(result.error).toBeDefined()
  })

  it('应处理 registry 返回缺少 version 字段', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ name: '@deepstorm/cli' }),
    })

    const result = await checkNpmVersion()

    expect(result.current).toBe('0.1.2')
    expect(result.latest).toBeNull()
    expect(result.error).toBeDefined()
  })

  it('应处理版本一致的情况', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ version: '0.1.2' }),
    })

    const result = await checkNpmVersion()

    expect(result.current).toBe('0.1.2')
    expect(result.latest).toBe('0.1.2')
    expect(result.isUpToDate).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('应识别出有更新可用', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ version: '0.2.0' }),
    })

    const result = await checkNpmVersion()

    expect(result.current).toBe('0.1.2')
    expect(result.latest).toBe('0.2.0')
    expect(result.isUpToDate).toBe(false)
    expect(result.hasUpdate).toBe(true)
  })

  it('应使用自定义 fetch 函数', async () => {
    const customFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ version: '1.0.0' }),
    })

    const result = await checkNpmVersion(customFetch)

    expect(result.latest).toBe('1.0.0')
    expect(customFetch).toHaveBeenCalled()
  })
})

describe('updateCLI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('有更新时应输出版本信息和更新指引', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ version: '0.2.0' }),
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await updateCLI()
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('当前版本'),
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('最新版本'),
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('npm install -g @deepstorm/cli@latest'),
    )
    consoleSpy.mockRestore()
  })

  it('已是最新时应提示已是最新', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ version: '0.1.2' }),
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await updateCLI()
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('已是最新'),
    )
    consoleSpy.mockRestore()
  })

  it('联网失败时应提示错误', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ETIMEDOUT'))

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    await updateCLI()
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('无法检查更新'),
    )
    consoleSpy.mockRestore()
  })
})

describe('updateSkills', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应委托 upgradeTemplates', () => {
    const mockUpgrade = vi.mocked(upgradeTemplates)
    const skillIds = ['tide-core', 'reef-lint']

    updateSkills('/cli/dir', '/project/dir', skillIds)

    expect(mockUpgrade).toHaveBeenCalledWith('/cli/dir', '/project/dir', skillIds)
  })
})

describe('registerUpdateCommand', () => {
  let program: Command
  const registry: Registry = {
    version: '1',
    tools: {},
    wizards: {},
    skills: {
      'tide-core': { tool: 'tide', configKey: 'x', configValue: 'y' },
      'reef-lint': { tool: 'reef', configKey: 'a', configValue: 'b' },
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    program = new Command()
    registerUpdateCommand(program, registry)
  })

  it('应注册 update 命令', () => {
    const cmd = program.commands.find((c) => c.name() === 'update')
    expect(cmd).toBeDefined()
    expect(cmd!.description()).toBe('检查更新并同步 skill 模板')
  })

  it('应支持 --check 选项', () => {
    const cmd = program.commands.find((c) => c.name() === 'update')!
    const opts = cmd.options.map((o) => o.long)
    expect(opts).toContain('--check')
  })

  it('应支持 --cli 选项', () => {
    const cmd = program.commands.find((c) => c.name() === 'update')!
    const opts = cmd.options.map((o) => o.long)
    expect(opts).toContain('--cli')
  })

  it('应支持 --skills 选项', () => {
    const cmd = program.commands.find((c) => c.name() === 'update')!
    const opts = cmd.options.map((o) => o.long)
    expect(opts).toContain('--skills')
  })

  it('--skills 无 skill 时应输出提示', async () => {
    const emptyRegistry: Registry = { version: '1', tools: {}, wizards: {}, skills: {} }
    const emptyProgram = new Command()
    registerUpdateCommand(emptyProgram, emptyRegistry)

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const cmd = emptyProgram.commands.find((c) => c.name() === 'update')!
    await cmd.parseAsync(['node', 'test', '--skills'])
    expect(logSpy).toHaveBeenCalledWith('registry 中无已注册 skill')
    expect(upgradeTemplates).not.toHaveBeenCalled()
    logSpy.mockRestore()
  })
})
