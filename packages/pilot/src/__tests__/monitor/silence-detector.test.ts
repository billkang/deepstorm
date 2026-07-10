import { describe, it, expect, vi, afterEach } from 'vitest'
import { startSilenceDetector } from '../../monitor/silence-detector'

describe('monitor/silence-detector', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls onTimeout after silence exceeds threshold', async () => {
    const onTimeout = vi.fn()

    startSilenceDetector({
      thresholdMs: 20,
      checkIntervalMs: 10,
      onTimeout,
    })

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(onTimeout).toHaveBeenCalled()
  })

  it('resets timer when markActivity is called', async () => {
    const onTimeout = vi.fn()

    const detector = startSilenceDetector({
      thresholdMs: 50,
      checkIntervalMs: 10,
      onTimeout,
    })

    // 每 20ms 触发一次活动
    const interval = setInterval(() => detector.markActivity(), 20)

    await new Promise(resolve => setTimeout(resolve, 200))

    clearInterval(interval)
    detector.stop()

    // 因为持续有活动，不应触发超时
    expect(onTimeout).not.toHaveBeenCalled()
  })

  it('stops checking after stop()', async () => {
    const onTimeout = vi.fn()

    const detector = startSilenceDetector({
      thresholdMs: 10,
      checkIntervalMs: 10,
      onTimeout,
    })

    detector.stop()

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(onTimeout).not.toHaveBeenCalled()
  })
})
