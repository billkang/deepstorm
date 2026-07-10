import { Command } from 'commander'
import { registerRunCommand } from './run'
import { registerStatusCommand } from './status'
import { registerLogCommand } from './log'
import { registerStopCommand } from './stop'
import { registerResumeCommand } from './resume'
import { registerListCommand } from './list'

/**
 * 将 pilot 子命令组注册到 root commander program 或父命令。
 */
export function registerPilotCommands(program: Command): void {
  const pilot = program
    .command('pilot')
    .description('OpenSpec 自动实现 Harness Agent')

  registerRunCommand(pilot)
  registerStatusCommand(pilot)
  registerLogCommand(pilot)
  registerStopCommand(pilot)
  registerResumeCommand(pilot)
  registerListCommand(pilot)
}
