import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Command } from 'commander'
import { registerTemplateCommand } from '../template'
import type { Registry } from '../../types/registry'

vi.mock('../template-list', () => ({ listTemplates: vi.fn() }))
vi.mock('../template-init', () => ({ initTemplate: vi.fn() }))
vi.mock('../template-apply', () => ({ applyTemplate: vi.fn() }))

import { listTemplates } from '../template-list'
import { initTemplate } from '../template-init'
import { applyTemplate } from '../template-apply'

const emptyRegistry: Registry = {
  version: '1',
  tools: {},
  wizards: {},
  skills: {},
}

const registryWithSkills: Registry = {
  version: '1',
  tools: {},
  wizards: {},
  skills: {
    'reef-react-lint': { tool: 'reef', configKey: 'x', configValue: 'y' },
    'reef-style': { tool: 'reef', configKey: 'x', configValue: 'z' },
  },
}

function getSubCommand(program: Command, name: string): Command {
  const templateCmd = program.commands.find((c) => c.name() === 'template')!
  return templateCmd.commands.find((c) => c.name() === name)!
}

describe('registerTemplateCommand', () => {
  it('registers template subcommand with list/init/apply', () => {
    const program = new Command()
    registerTemplateCommand(program, emptyRegistry)
    const templateCmd = program.commands.find((c) => c.name() === 'template')!
    expect(templateCmd).toBeDefined()
    expect(templateCmd.description()).toBe('管理 DeepStorm skill 模板')
    const names = templateCmd.commands.map((c) => c.name())
    expect(names).toEqual(['list', 'init', 'apply'])
  })
})

describe('template list action', () => {
  let program: Command

  beforeEach(() => {
    vi.clearAllMocks()
    program = new Command()
    registerTemplateCommand(program, emptyRegistry)
  })

  it('lists all templates when no tool filter given', async () => {
    const cmd = getSubCommand(program, 'list')
    await cmd.parseAsync(['node', 'test'])
    expect(listTemplates).toHaveBeenCalledWith(emptyRegistry, undefined)
  })

  it('lists filtered templates when tool is given', async () => {
    const cmd = getSubCommand(program, 'list')
    await cmd.parseAsync(['node', 'test', 'reef'])
    expect(listTemplates).toHaveBeenCalledWith(emptyRegistry, 'reef')
  })
})

describe('template init action', () => {
  let program: Command

  beforeEach(() => {
    vi.clearAllMocks()
    program = new Command()
    registerTemplateCommand(program, emptyRegistry)
  })

  it('prints error when no tool specified', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const cmd = getSubCommand(program, 'init')
    await cmd.parseAsync(['node', 'test'])
    expect(logSpy).toHaveBeenCalledWith('请指定工具名称：deepstorm template init <tool> [capability]')
    expect(initTemplate).not.toHaveBeenCalled()
    logSpy.mockRestore()
  })

  it('calls initTemplate with tool only', async () => {
    const cmd = getSubCommand(program, 'init')
    await cmd.parseAsync(['node', 'test', 'reef'])
    expect(initTemplate).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'reef')
  })

  it('calls initTemplate with tool and capability combined as skillId', async () => {
    const cmd = getSubCommand(program, 'init')
    await cmd.parseAsync(['node', 'test', 'reef', 'frontend'])
    expect(initTemplate).toHaveBeenCalledWith(expect.any(String), expect.any(String), 'reef-frontend')
  })
})

describe('template apply action', () => {
  let program: Command

  beforeEach(() => {
    vi.clearAllMocks()
    program = new Command()
    registerTemplateCommand(program, emptyRegistry)
  })

  it('prints error when no tool specified', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const cmd = getSubCommand(program, 'apply')
    await cmd.parseAsync(['node', 'test'])
    expect(logSpy).toHaveBeenCalledWith('请指定工具名称：deepstorm template apply <tool> [capability]')
    expect(applyTemplate).not.toHaveBeenCalled()
    logSpy.mockRestore()
  })

  it('calls applyTemplate with tool only', async () => {
    const cmd = getSubCommand(program, 'apply')
    await cmd.parseAsync(['node', 'test', 'reef'])
    expect(applyTemplate).toHaveBeenCalledWith(expect.any(String), 'reef')
  })

  it('calls applyTemplate with tool and capability combined', async () => {
    const cmd = getSubCommand(program, 'apply')
    await cmd.parseAsync(['node', 'test', 'reef', 'style'])
    expect(applyTemplate).toHaveBeenCalledWith(expect.any(String), 'reef-style')
  })
})

