import { describe, it, expect } from 'vitest'
import { Command } from 'commander'
import { registerPluginBuildCommand } from '../plugin-build'
import type { Registry } from '../../types/registry'

describe('registerPluginBuildCommand', () => {
  const mockRegistry: Registry = {
    version: '1',
    tools: {},
    wizards: {},
    skills: {},
  }

  it('register plugin build subcommand on the program', () => {
    const program = new Command()
    registerPluginBuildCommand(program, mockRegistry)

    const pluginCmd = program.commands.find((c) => c.name() === 'plugin')
    expect(pluginCmd).toBeDefined()
    expect(pluginCmd!.description()).toContain('插件')

    const buildCmd = pluginCmd!.commands.find((c) => c.name() === 'build')
    expect(buildCmd).toBeDefined()
    expect(buildCmd!.description()).toContain('构建')
  })
})
