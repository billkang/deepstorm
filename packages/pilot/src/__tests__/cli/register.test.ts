import { describe, it, expect } from 'vitest'
import { Command } from 'commander'
import { registerPilotCommands } from '../../cli/register'

describe('cli/register', () => {
  it('registers all pilot subcommands', () => {
    const program = new Command()
    registerPilotCommands(program)

    const cmd = program.commands.find(c => c.name() === 'pilot')
    expect(cmd).toBeDefined()

    const subCommands = cmd!.commands.map(c => c.name())
    expect(subCommands).toContain('run')
    expect(subCommands).toContain('status')
    expect(subCommands).toContain('log')
    expect(subCommands).toContain('stop')
    expect(subCommands).toContain('resume')
    expect(subCommands).toContain('list')
  })

  it('registers run command with --detach option', () => {
    const program = new Command()
    registerPilotCommands(program)

    const cmd = program.commands.find(c => c.name() === 'pilot')
    const runCmd = cmd!.commands.find(c => c.name() === 'run')!

    expect(runCmd.options.some(o => o.short === '-d' || o.long === '--detach')).toBe(true)
    expect(runCmd.options.some(o => o.short === '-p' || o.long === '--project')).toBe(true)
  })

  it('registers status command without --detach', () => {
    const program = new Command()
    registerPilotCommands(program)

    const cmd = program.commands.find(c => c.name() === 'pilot')
    const statusCmd = cmd!.commands.find(c => c.name() === 'status')!

    expect(statusCmd.options.some(o => o.long === '--project')).toBe(true)
  })
})
