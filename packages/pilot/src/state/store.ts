import * as fs from 'node:fs'
import * as path from 'node:path'
import type { PilotState, TaskState } from './types'

const STATE_DIR = '.deepstorm'
const STATE_FILE = 'pilot-state.json'
const TEMP_SUFFIX = '.tmp'

/**
 * 获取 state 文件路径。
 */
function stateFilePath(projectDir: string): string {
  return path.join(projectDir, STATE_DIR, STATE_FILE)
}

/**
 * 获取临时文件路径（用于原子写入）。
 */
function tempFilePath(projectDir: string): string {
  return stateFilePath(projectDir) + TEMP_SUFFIX
}

/**
 * 确保 .deepstorm 目录存在。
 */
function ensureStateDir(projectDir: string): void {
  const dir = path.join(projectDir, STATE_DIR)
  fs.mkdirSync(dir, { recursive: true })
}

/**
 * 从项目目录加载 pilot-state.json。
 * 如果文件不存在，返回 null。
 */
export function loadState(projectDir: string): PilotState | null {
  const filePath = stateFilePath(projectDir)
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as PilotState
  } catch {
    return null
  }
}

/**
 * 保存 state 到项目目录。
 * 使用原子写入：先写临时文件，再 rename。
 */
export function saveState(projectDir: string, state: PilotState): void {
  state.updatedAt = new Date().toISOString()
  ensureStateDir(projectDir)

  const tmpPath = tempFilePath(projectDir)
  const targetPath = stateFilePath(projectDir)

  const raw = JSON.stringify(state, null, 2)
  fs.writeFileSync(tmpPath, raw, 'utf-8')
  fs.renameSync(tmpPath, targetPath)
}

/**
 * 更新或添加单个 task 到 state 中，并持久化。
 */
export function updateTask(state: PilotState, task: Partial<TaskState> & { id: string }): void {
  const idx = state.tasks.findIndex(t => t.id === task.id)
  if (idx >= 0) {
    state.tasks[idx] = { ...state.tasks[idx], ...task }
  } else {
    state.tasks.push(task as TaskState)
  }
}

/**
 * 从崩溃恢复后，将所有 running 状态的 task 重置为 pending。
 * 递增 restartCount 并标记 isResumed。
 */
export function resetRunningTasksOnRecovery(state: PilotState): void {
  for (const task of state.tasks) {
    if (task.status === 'running') {
      task.status = 'pending'
    }
  }
  state.restartCount = (state.restartCount || 0) + 1
  state.isResumed = true
}
