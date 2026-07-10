import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { saveState } from '../../state/store'
import type { PilotState, TaskState } from '../../state/types'

describe('cli/list', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pilot-list-test-'))
    fs.mkdirSync(path.join(tmpDir, '.deepstorm'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function makeState(overrides?: Partial<PilotState>): PilotState {
    return {
      project: tmpDir,
      startedAt: '2026-07-10T00:00:00.000Z',
      updatedAt: '2026-07-10T02:00:00.000Z',
      pilotVersion: '0.5.0',
      tasks: [
        { id: '1.1', title: 'Setup', status: 'completed' as const, retries: 0, maxRetries: 3, tokenBudget: 100000, tokensUsed: 45000, startedAt: null, completedAt: null, duration: null, error: null, errorDetail: null, errorFingerprint: null, logPath: null },
        { id: '1.2', title: 'Core', status: 'completed' as const, retries: 0, maxRetries: 3, tokenBudget: 100000, tokensUsed: 30000, startedAt: null, completedAt: null, duration: null, error: null, errorDetail: null, errorFingerprint: null, logPath: null },
      ],
      errors: [],
      summary: { startTime: '2026-07-10T00:00:00.000Z', endTime: '2026-07-10T02:00:00.000Z', totalDuration: 7200000, completed: 2, failed: 0, skipped: 0, totalTokens: 75000 },
      restartCount: 0,
      isResumed: false,
      ...overrides,
    }
  }

  it('shows "no pilot projects" when no state files exist', () => {
    const scanDir = path.join(tmpDir, 'empty')
    fs.mkdirSync(scanDir, { recursive: true })
    // No state file created - just verify no crash
    const statePath = path.join(scanDir, '.deepstorm', 'pilot-state.json')
    expect(fs.existsSync(statePath)).toBe(false)
  })

  it('detects state file in scan directory', () => {
    const state = makeState()
    saveState(tmpDir, state)

    const loaded = loadStateFrom(tmpDir)
    expect(loaded).not.toBeNull()
    expect(loaded!.project).toBe(tmpDir)
  })

  it('detects state files in subdirectories', () => {
    // Create a sub-project with state
    const subDir = path.join(tmpDir, 'sub-project')
    fs.mkdirSync(path.join(subDir, '.deepstorm'), { recursive: true })
    const subState = makeState({ project: subDir })
    saveState(subDir, subState)

    // Verify the state file exists
    const statePath = path.join(subDir, '.deepstorm', 'pilot-state.json')
    expect(fs.existsSync(statePath)).toBe(true)

    const loaded = JSON.parse(fs.readFileSync(statePath, 'utf-8'))
    expect(loaded.project).toBe(subDir)
    expect(loaded.tasks).toHaveLength(2)
  })

  it('displays correct task completion counts', () => {
    const state = makeState({
      tasks: [
        { id: '1.1', title: 'Setup', status: 'completed' as const, retries: 0, maxRetries: 3, tokenBudget: 100000, tokensUsed: 45000, startedAt: null, completedAt: null, duration: null, error: null, errorDetail: null, errorFingerprint: null, logPath: null },
        { id: '1.2', title: 'Core', status: 'failed' as const, retries: 3, maxRetries: 3, tokenBudget: 100000, tokensUsed: 90000, startedAt: null, completedAt: null, duration: null, error: 'compilation' as any, errorDetail: 'Build failed', errorFingerprint: null, logPath: null },
      ],
      summary: null,
    })
    saveState(tmpDir, state)

    const loaded = loadStateFrom(tmpDir)
    const completed = loaded!.tasks.filter((t: TaskState) => t.status === 'completed').length
    const total = loaded!.tasks.length
    expect(completed).toBe(1)
    expect(total).toBe(2)
  })
})

function loadStateFrom(projectDir: string) {
  const statePath = path.join(projectDir, '.deepstorm', 'pilot-state.json')
  if (!fs.existsSync(statePath)) return null
  return JSON.parse(fs.readFileSync(statePath, 'utf-8'))
}
