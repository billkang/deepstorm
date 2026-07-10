import { describe, it, expect } from 'vitest'
import { DeadLoopDetector } from '../../monitor/dead-loop-detector'

describe('monitor/dead-loop-detector', () => {
  it('detects dead loop after 3 consecutive identical outputs', () => {
    const detector = new DeadLoopDetector({ threshold: 2 })

    expect(detector.feed('error')).toBe(false)
    expect(detector.feed('error')).toBe(false)
    expect(detector.feed('error')).toBe(true) // pair 1→2, pair 2→3
  })

  it('resets counter on different output', () => {
    const detector = new DeadLoopDetector({ threshold: 2 })

    expect(detector.feed('error')).toBe(false)
    expect(detector.feed('progress')).toBe(false)
    expect(detector.feed('progress')).toBe(false)
    expect(detector.feed('progress')).toBe(true)
  })

  it('resets state on reset()', () => {
    const detector = new DeadLoopDetector({ threshold: 1 })

    // Without reset, 2 same outputs would trigger
    detector.feed('error')
    detector.reset()

    // After reset, starts fresh
    expect(detector.feed('error')).toBe(false)
  })

  it('detects stagnation after 3 consecutive same window samples', () => {
    const detector = new DeadLoopDetector({ stagnationThreshold: 2 })

    // Feed output to build up the window
    detector.feed('step 1')
    detector.feed('step 2')

    // Same window content across samples = stagnation
    expect(detector.checkStagnation()).toBe(false)
    expect(detector.checkStagnation()).toBe(false)
    expect(detector.checkStagnation()).toBe(true)
  })

  it('does not flag stagnation when window content changes', () => {
    const detector = new DeadLoopDetector({ stagnationThreshold: 2 })

    detector.feed('step 1')
    expect(detector.checkStagnation()).toBe(false)

    detector.feed('step 2') // window changed
    expect(detector.checkStagnation()).toBe(false)

    detector.feed('step 3') // window changed again
    expect(detector.checkStagnation()).toBe(false)
  })

  it('resets stagnation state on reset()', () => {
    const detector = new DeadLoopDetector({ stagnationThreshold: 1 })

    detector.feed('test')
    detector.checkStagnation() // first sample
    detector.reset()

    // After reset, should start fresh
    detector.feed('test')
    expect(detector.checkStagnation()).toBe(false)
  })
})
