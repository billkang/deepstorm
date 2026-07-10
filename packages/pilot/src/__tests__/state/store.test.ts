import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { loadState, saveState, updateTask, resetRunningTasksOnRecovery } from '../../state/store'
import type { PilotState, TaskState } from '../../state/types'

describe('state/store', () => {
  let tmpDir: string
  const testProject = '/tmp/test-project'

  function makeState(overrides?: Partial<PilotState>): PilotState {
    return {
      project: testProject,
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

  function makeTask(overrides?: Partial<TaskState>): TaskState {
    return {
      id: '1.1',
      title: 'Test task',
      status: 'pending',
      retries: 0,
      maxRetries: 3,
      tokenBudget: 100_000,
      tokensUsed: 0,
      startedAt: null,
      completedAt: null,
      duration: null,
      error: null,
      errorDetail: null,
      errorFingerprint: null,
      logPath: null,
      ...overrides,
    }
  }

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pilot-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('loadState', () => {
    it('returns null when no state file exists', () => {
      const result = loadState(tmpDir)
      expect(result).toBeNull()
    })

    it('loads existing state file', () => {
      const state = makeState()
      saveState(tmpDir, state)
      const loaded = loadState(tmpDir)
      expect(loaded).not.toBeNull()
      expect(loaded!.project).toBe(testProject)
      expect(loaded!.tasks).toEqual([])
    })
  })

  describe('resetRunningTasksOnRecovery', () => {
    it('resets running tasks to pending on recovery', () => {
      const state = makeState()
      state.tasks.push(makeTask({ id: '1.1', status: 'running' }))
      state.tasks.push(makeTask({ id: '1.2', status: 'completed' }))
      state.tasks.push(makeTask({ id: '1.3', status: 'pending' }))

      resetRunningTasksOnRecovery(state)

      expect(state.tasks[0].status).toBe('pending')
      expect(state.tasks[1].status).toBe('completed')
      expect(state.tasks[2].status).toBe('pending')
      expect(state.restartCount).toBe(1)
      expect(state.isResumed).toBe(true)
    })

    it('does not modify state with no running tasks', () => {
      const state = makeState()
      state.tasks.push(makeTask({ id: '1.1', status: 'completed' }))

      resetRunningTasksOnRecovery(state)

      expect(state.tasks[0].status).toBe('completed')
      expect(state.restartCount).toBe(1)
    })
  })

  describe('saveState', () => {
    it('writes state to .deepstorm/pilot-state.json', () => {
      const state = makeState()
      saveState(tmpDir, state)

      const filePath = path.join(tmpDir, '.deepstorm', 'pilot-state.json')
      expect(fs.existsSync(filePath)).toBe(true)

      const raw = fs.readFileSync(filePath, 'utf-8')
      const parsed = JSON.parse(raw)
      expect(parsed.project).toBe(testProject)
    })

    it('updates updatedAt timestamp on save', () => {
      const state = makeState()
      const before = state.updatedAt

      // 模拟时间推移
      state.tasks.push(makeTask())
      saveState(tmpDir, state)

      expect(state.updatedAt).not.toBe(before)
    })

    it('performs atomic write (temp + rename)', () => {
      const state = makeState()
      saveState(tmpDir, state)

      const tmpPath = path.join(tmpDir, '.deepstorm', 'pilot-state.json.tmp')
      expect(fs.existsSync(tmpPath)).toBe(false)
    })
  })

  describe('updateTask', () => {
    it('adds a new task to the state', () => {
      const state = makeState()
      const task = makeTask({ id: '1.1', title: 'Create config' })

      updateTask(state, task)

      expect(state.tasks).toHaveLength(1)
      expect(state.tasks[0].id).toBe('1.1')
    })

    it('updates an existing task', () => {
      const state = makeState()
      state.tasks.push(makeTask({ id: '1.1' }))

      updateTask(state, { id: '1.1', status: 'running', startedAt: '2026-07-10T01:00:00.000Z' } as TaskState)

      expect(state.tasks).toHaveLength(1)
      expect(state.tasks[0].status).toBe('running')
      expect(state.tasks[0].startedAt).toBe('2026-07-10T01:00:00.000Z')
    })

    it('does not affect other tasks when updating', () => {
      const state = makeState()
      state.tasks.push(makeTask({ id: '1.1' }))
      state.tasks.push(makeTask({ id: '1.2' }))

      updateTask(state, { id: '1.2', status: 'completed' } as TaskState)

      expect(state.tasks[0].status).toBe('pending')
      expect(state.tasks[1].status).toBe('completed')
    })
  })
})
