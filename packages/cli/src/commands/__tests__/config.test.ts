import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Command } from 'commander'
import { registerConfigCommand } from '../config'
import type { Registry } from '../../types/registry'

vi.mock('../config-view', () => ({ viewConfig: vi.fn() }))
vi.mock('../config-set', () => ({ setConfigValue: vi.fn() }))
vi.mock('../config-reset', () => ({ resetConfig: vi.fn() }))
vi.mock('../config-refresh', () => ({ refreshConfig: vi.fn() }))

vi.mock('@clack/prompts', () => ({
  confirm: vi.fn(),
  isCancel: vi.fn(),
}))

import { viewConfig } from '../config-view'
import { setConfigValue } from '../config-set'
import { resetConfig } from '../config-reset'
import { refreshConfig } from '../config-refresh'
import * as p from '@clack/prompts'

const emptyRegistry: Registry = {
  version: '1',
  tools: {},
  wizards: {},
  skills: {},
}

function getSubCommand(program: Command, name: string): Command {
  const configCmd = program.commands.find((c) => c.name() === 'config')!
  return configCmd.commands.find((c) => c.name() === name)!
}

describe('registerConfigCommand', () => {
  it('registers config subcommand with view/set/reset/refresh', () => {
    const program = new Command()
    registerConfigCommand(program, emptyRegistry)
    const configCmd = program.commands.find((c) => c.name() === 'config')!
    expect(configCmd).toBeDefined()
    expect(configCmd.description()).toBe('查看和修改项目级 DeepStorm 配置')
    const names = configCmd.commands.map((c) => c.name())
    expect(names).toEqual(['view', 'set', 'reset', 'refresh'])
  })
})

describe('config set action', () => {
  let program: Command

  beforeEach(() => {
    vi.clearAllMocks()
    program = new Command()
    registerConfigCommand(program, emptyRegistry)
  })

  it('parses key=value and calls setConfigValue', async () => {
    const setCmd = getSubCommand(program, 'set')
    await setCmd.parseAsync(['node', 'test', 'reef.frontend.framework=react'])
    expect(setConfigValue).toHaveBeenCalledWith(
      expect.any(String),
      'reef.frontend.framework',
      'react',
      emptyRegistry,
    )
  })

  it('prints error for invalid format (no equals sign)', async () => {
    const setCmd = getSubCommand(program, 'set')
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await setCmd.parseAsync(['node', 'test', 'invalidformat'])
    expect(consoleSpy).toHaveBeenCalledWith('格式错误：请使用 key=value 格式')
    expect(setConfigValue).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('prints error for empty key (equals at start)', async () => {
    const setCmd = getSubCommand(program, 'set')
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    await setCmd.parseAsync(['node', 'test', '=value'])
    expect(consoleSpy).toHaveBeenCalledWith('格式错误：请使用 key=value 格式')
    consoleSpy.mockRestore()
  })
})

describe('config reset action', () => {
  let program: Command

  beforeEach(() => {
    vi.clearAllMocks()
    program = new Command()
    registerConfigCommand(program, emptyRegistry)
  })

  it('resets config when user confirms', async () => {
    vi.mocked(p.confirm).mockResolvedValue(true)
    vi.mocked(p.isCancel).mockReturnValue(false)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const resetCmd = getSubCommand(program, 'reset')
    await resetCmd.parseAsync(['node', 'test'])

    expect(resetConfig).toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('配置已清除'))
    logSpy.mockRestore()
  })

  it('cancels reset when user declines', async () => {
    vi.mocked(p.confirm).mockResolvedValue(false)
    vi.mocked(p.isCancel).mockReturnValue(false)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const resetCmd = getSubCommand(program, 'reset')
    await resetCmd.parseAsync(['node', 'test'])

    expect(resetConfig).not.toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith('已取消')
    logSpy.mockRestore()
  })

  it('cancels reset when user presses ctrl+c', async () => {
    vi.mocked(p.isCancel).mockReturnValue(true)
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const resetCmd = getSubCommand(program, 'reset')
    await resetCmd.parseAsync(['node', 'test'])

    expect(resetConfig).not.toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith('已取消')
    logSpy.mockRestore()
  })
})

describe('config refresh action', () => {
  let program: Command

  beforeEach(() => {
    vi.clearAllMocks()
    program = new Command()
    registerConfigCommand(program, emptyRegistry)
  })

  it('refreshes templates and prints refreshed skills', async () => {
    vi.mocked(refreshConfig).mockReturnValue({
      refreshed: ['reef-frontend-style', 'tide-style'],
      errors: [],
    })
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const refreshCmd = getSubCommand(program, 'refresh')
    await refreshCmd.parseAsync(['node', 'test'])

    expect(refreshConfig).toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('2 个技能'))
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('reef-frontend-style'))
    expect(errorSpy).not.toHaveBeenCalled()
    logSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('prints errors when refresh encounters problems', async () => {
    vi.mocked(refreshConfig).mockReturnValue({
      refreshed: [],
      errors: ['template not found: reef-style'],
    })
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const refreshCmd = getSubCommand(program, 'refresh')
    await refreshCmd.parseAsync(['node', 'test'])

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('not found'))
    // Should also print "没有需要刷新的技能"
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('没有需要刷新'))
    logSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('prints nothing-to-refresh when empty', async () => {
    vi.mocked(refreshConfig).mockReturnValue({ refreshed: [], errors: [] })
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    const refreshCmd = getSubCommand(program, 'refresh')
    await refreshCmd.parseAsync(['node', 'test'])

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('没有需要刷新'))
    logSpy.mockRestore()
  })
})
