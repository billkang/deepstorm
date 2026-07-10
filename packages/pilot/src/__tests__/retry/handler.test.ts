import { describe, it, expect } from 'vitest'
import { handleRetry } from '../../retry/handler'
import type { TaskState, PilotState } from '../../state/types'

describe('retry/handler', () => {
  const config = { baseDelay: 1, maxDelay: 10 } // fast backoff for tests

  function makeTask(overrides?: Partial<TaskState>): TaskState {
    return {
      id: '1.1',
      title: 'Test',
      status: 'failed',
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

  function makeState(overrides?: Partial<PilotState>): PilotState {
    return {
      project: '/test',
      startedAt: '',
      updatedAt: '',
      pilotVersion: '0.5.0',
      tasks: [],
      errors: [],
      summary: null,
      restartCount: 0,
      isResumed: false,
      ...overrides,
    }
  }

  it('allows retry for compilation errors', () => {
    const task = makeTask()
    const state = makeState()
    const decision = handleRetry(task, state, 'tsc: error TS2345', config)

    expect(decision.shouldRetry).toBe(true)
    expect(decision.errorType).toBe('compilation')
    expect(decision.backoffMs).toBeGreaterThan(0)
  })

  it('refuses retry for non-retryable errors', () => {
    const task = makeTask()
    const state = makeState()
    const decision = handleRetry(task, state, 'token limit exceeded', config)

    expect(decision.shouldRetry).toBe(false)
    expect(decision.errorType).toBe('token_overbudget')
  })

  it('refuses retry when max retries exceeded', () => {
    const task = makeTask({ retries: 3, maxRetries: 3 })
    const state = makeState()
    const decision = handleRetry(task, state, 'syntax error', config)

    expect(decision.shouldRetry).toBe(false)
    expect(decision.reason).toContain('exceeded')
  })

  it('refuses retry on same error fingerprint', () => {
    const task = makeTask()
    const state = makeState({
      errors: [{
        timestamp: '',
        type: 'compilation' as any,
        message: 'syntax error',
        fingerprint: '',
        taskId: '1.1',
      }],
    })

    // First retry
    const first = handleRetry(task, state, 'syntax error', config)
    expect(first.shouldRetry).toBe(true)

    // Simulate adding fingerprint to state
    state.errors.push({
      timestamp: '',
      type: 'compilation' as any,
      message: 'syntax error',
      fingerprint: first.fingerprint,
      taskId: '1.1',
    })

    // Second retry with same error
    const second = handleRetry(task, state, 'syntax error', config)
    expect(second.shouldRetry).toBe(false)
    expect(second.reason).toContain('unrecoverable')
  })

  it('computes exponential backoff', () => {
    const task = makeTask({ retries: 2 })
    const state = makeState()

    const decision = handleRetry(task, state, 'compilation error', { baseDelay: 5, maxDelay: 100 })

    // 5 * 2^2 = 20 seconds
    expect(decision.backoffMs).toBe(20_000)
  })

  it('caps backoff at maxDelay', () => {
    const task = makeTask({ retries: 10, maxRetries: 20 }) // would be huge without cap
    const state = makeState()

    const decision = handleRetry(task, state, 'compilation error', { baseDelay: 5, maxDelay: 10 })

    expect(decision.backoffMs).toBe(10_000) // capped
  })
})
