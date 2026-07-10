/**
 * `pilot.config.json` 类型定义
 */

export interface PilotConfig {
  /** 每个 task 的默认 token 预算（默认 100_000） */
  defaultTokenBudget?: number

  /** 每个 task 的超时时间，单位毫秒（默认 30 * 60 * 1000 = 30min） */
  taskTimeoutMs?: number

  /** 静默检测阈值，单位毫秒（默认 5 * 60 * 1000 = 5min） */
  silenceThresholdMs?: number

  /** 重试基础延迟，单位秒（默认 10） */
  retryBaseDelay?: number

  /** 重试最大延迟，单位秒（默认 300 = 5min） */
  retryMaxDelay?: number

  /** 每个 task 的最大重试次数（默认 3） */
  maxRetries?: number

  /** 心跳检查间隔，单位毫秒（默认 30_000 = 30s） */
  heartbeatIntervalMs?: number

  /** 每 task 的 token 预算覆盖 */
  perTaskBudget?: Record<string, number>
}

export const DEFAULT_CONFIG: PilotConfig = {
  defaultTokenBudget: 100_000,
  taskTimeoutMs: 30 * 60 * 1000,
  silenceThresholdMs: 5 * 60 * 1000,
  retryBaseDelay: 10,
  retryMaxDelay: 300,
  maxRetries: 3,
  heartbeatIntervalMs: 30_000,
}
