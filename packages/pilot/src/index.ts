/**
 * @deepstorm/pilot — OpenSpec 自动实现 Harness Agent
 *
 * 入口模块，导出所有公共 API。
 */

export { runPilot, daemonMain } from './daemon/orchestrator'
export { loadState, saveState, updateTask } from './state/store'
export { registerPilotCommands } from './cli/register'
export type { PilotState, TaskState, ErrorRecord, RunSummary } from './state/types'
export type { PilotConfig } from './config/schema'
