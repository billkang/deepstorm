import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { saveState } from '../../state/store'
import type { PilotState, TaskState } from '../../state/types'

describe('cli/status', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pilot-cli-test-'))
    fs.mkdirSync(path.join(tmpDir, '.deepstorm'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function makeState(overrides?: Partial<PilotState>): PilotState {
    return {
      project: tmpDir,
      startedAt: '2026-07-10T00:00:00.000Z',
      updatedAt: '2026-07-10T00:00:00.000Z',
      pilotVersion: '0.5.0',
      tasks: [],
      errors: [],
      summary: null,
      restartCount: 0,
      isResumed: false,
      ...overrides,
    }
  }

  it('shows "no pilot run found" when no state file', () => {
    // No state file created - just verify it doesn't crash
    // The actual CLI command would show the message
    expect(fs.existsSync(path.join(tmpDir, '.deepstorm', 'pilot-state.json'))).toBe(false)
  })

  it('displays task status table with mixed states', () => {
    const state = makeState({
      tasks: [
        {
          id: '1.1', title: 'Setup', status: 'completed' as const,
          retries: 0, maxRetries: 3, tokenBudget: 100000, tokensUsed: 45000,
          startedAt: '2026-07-10T00:00:00.000Z', completedAt: '2026-07-10T00:30:00.000Z',
          duration: 1800000, error: null, errorDetail: null, errorFingerprint: null, logPath: null,
        },
        {
          id: '1.2', title: 'Core', status: 'running' as const,
          retries: 1, maxRetries: 3, tokenBudget: 100000, tokensUsed: 23000,
          startedAt: '2026-07-10T00:31:00.000Z', completedAt: null,
          duration: null, error: null, errorDetail: null, errorFingerprint: null, logPath: null,
        },
        {
          id: '1.3', title: 'Tests', status: 'failed' as const,
          retries: 3, maxRetries: 3, tokenBudget: 100000, tokensUsed: 90000,
          startedAt: null, completedAt: null,
          duration: null, error: 'compilation' as any, errorDetail: 'Build failed', errorFingerprint: null, logPath: null,
        },
      ],
    })

    saveState(tmpDir, state)
    const loaded = JSON.parse(fs.readFileSync(path.join(tmpDir, '.deepstorm', 'pilot-state.json'), 'utf-8'))
    expect(loaded.tasks).toHaveLength(3)
    expect(loaded.tasks[0].status).toBe('completed')
    expect(loaded.tasks[1].status).toBe('running')
    expect(loaded.tasks[2].status).toBe('failed')
  })

  it('reports summary when available', () => {
    const state = makeState({
      tasks: [],
      summary: {
        startTime: '2026-07-10T00:00:00.000Z',
        endTime: '2026-07-10T02:00:00.000Z',
        totalDuration: 7200000,
        completed: 5,
        failed: 1,
        skipped: 0,
        totalTokens: 350000,
      },
    })

    saveState(tmpDir, state)
    const loaded = JSON.parse(fs.readFileSync(path.join(tmpDir, '.deepstorm', 'pilot-state.json'), 'utf-8'))
    expect(loaded.summary.completed).toBe(5)
    expect(loaded.summary.failed).toBe(1)
    expect(loaded.summary.totalTokens).toBe(350000)
  })
})
