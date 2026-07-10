/**
 * 静默检测：记录最后输出时间，超过阈值触发回调。
 */

export interface SilenceDetectorOptions {
  /** 静默阈值（毫秒） */
  thresholdMs: number
  /** 回调频率（毫秒） */
  checkIntervalMs?: number
  /** 静默超时回调 */
  onTimeout: () => void
}

export interface SilenceDetectorHandle {
  /** 记录一次新输出 */
  markActivity: () => void
  /** 停止检测 */
  stop: () => void
}

/**
 * 启动静默检测。
 */
export function startSilenceDetector(options: SilenceDetectorOptions): SilenceDetectorHandle {
  const { thresholdMs, checkIntervalMs = 5_000, onTimeout } = options
  let lastActivity = Date.now()
  let running = true

  const intervalId = setInterval(() => {
    if (!running) return
    if (Date.now() - lastActivity > thresholdMs) {
      running = false
      clearInterval(intervalId)
      onTimeout()
    }
  }, checkIntervalMs)

  return {
    markActivity: () => {
      lastActivity = Date.now()
    },
    stop: () => {
      running = false
      clearInterval(intervalId)
    },
  }
}
