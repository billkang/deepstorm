/**
 * 进程心跳检查：每 N 毫秒验证子进程存活。
 */

export interface HeartbeatOptions {
  /** 检查间隔（毫秒） */
  intervalMs: number
  /** 检测是否存活的函数 */
  isAlive: () => boolean
  /** 心跳丢失回调 */
  onDead: () => void
}

export interface HeartbeatHandle {
  stop: () => void
}

/**
 * 启动心跳监控。
 */
export function startHeartbeat(options: HeartbeatOptions): HeartbeatHandle {
  const { intervalMs, isAlive, onDead } = options
  let running = true

  const intervalId = setInterval(() => {
    if (!running) return
    if (!isAlive()) {
      running = false
      clearInterval(intervalId)
      onDead()
    }
  }, intervalMs)

  return {
    stop: () => {
      running = false
      clearInterval(intervalId)
    },
  }
}
