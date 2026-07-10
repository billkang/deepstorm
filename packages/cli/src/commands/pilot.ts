/**
 * Bridge: 注册 @deepstorm/pilot CLI 命令组。
 */

import { Command } from 'commander'
import { registerPilotCommands as register } from '@deepstorm/pilot'

/**
 * 将 pilot 子命令组注册到 commander program。
 */
export function registerPilotCommands(program: Command): void {
  register(program)
}
