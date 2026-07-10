import { describe, it, expect, vi, afterEach } from 'vitest'
import { startHeartbeat } from '../../monitor/heartbeat'

describe('monitor/heartbeat', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('calls onDead when process becomes not alive', async () => {
    const onDead = vi.fn()
    let alive = true

    startHeartbeat({
      intervalMs: 10,
      isAlive: () => alive,
      onDead,
    })

    alive = false

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(onDead).toHaveBeenCalledTimes(1)
  })

  it('does not call onDead when process stays alive', async () => {
    const onDead = vi.fn()

    startHeartbeat({
      intervalMs: 10,
      isAlive: () => true,
      onDead,
    })

    await new Promise(resolve => setTimeout(resolve, 30))

    expect(onDead).not.toHaveBeenCalled()
  })

  it('stops checking after stop()', async () => {
    const onDead = vi.fn()
    let alive = true

    const handle = startHeartbeat({
      intervalMs: 10,
      isAlive: () => alive,
      onDead,
    })

    handle.stop()
    alive = false

    await new Promise(resolve => setTimeout(resolve, 30))

    expect(onDead).not.toHaveBeenCalled()
  })
})
