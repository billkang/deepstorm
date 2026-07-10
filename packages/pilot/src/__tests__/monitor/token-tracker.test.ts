import { describe, it, expect, vi } from 'vitest'
import { createTokenTracker } from '../../monitor/token-tracker'

describe('monitor/token-tracker', () => {
  it('accumulates tokens from parsed output', () => {
    const tracker = createTokenTracker({
      budget: 1000,
      onOverBudget: vi.fn(),
      parseTokens: () => ({ input: 100, output: 50 }),
    })

    tracker.feed('some output')
    expect(tracker.total).toBe(150)

    tracker.feed('more output')
    expect(tracker.total).toBe(300)
  })

  it('triggers onOverBudget when budget exceeded', () => {
    const onOverBudget = vi.fn()

    const tracker = createTokenTracker({
      budget: 300,
      onOverBudget,
      parseTokens: () => ({ input: 200, output: 0 }),
    })

    tracker.feed('first output')   // total=200, still under 300
    expect(onOverBudget).not.toHaveBeenCalled()

    tracker.feed('second output')  // total=400, exceeds 300
    expect(onOverBudget).toHaveBeenCalledWith(400, 300)
    expect(onOverBudget).toHaveBeenCalledTimes(1) // only once
  })

  it('reports isOverBudget correctly', () => {
    const tracker = createTokenTracker({
      budget: 100,
      onOverBudget: vi.fn(),
      parseTokens: () => ({ input: 120, output: 0 }),
    })

    expect(tracker.isOverBudget).toBe(false)
    tracker.feed('big output')
    expect(tracker.isOverBudget).toBe(true)
  })
})
