/**
 * 重试编排：判断是否重试、等待 backoff。
 */

import { classifyError, calculateErrorFingerprint, shouldSkipRetry } from './classifier'
import type { ErrorType } from '../state/types'
import type { TaskState, PilotState } from '../state/types'

export interface RetryDecision {
  /** 是否应重试 */
  shouldRetry: boolean
  /** 错误类型 */
  errorType: ErrorType
  /** 重试前等待毫秒数 */
  backoffMs: number
  /** 不可重试的原因 */
  reason?: string
  /** 错误指纹 */
  fingerprint: string
}

/**
 * 判断是否应重试给定 task。
 */
export function handleRetry(
  task: TaskState,
  state: PilotState,
  errorText: string,
  config: { baseDelay: number; maxDelay: number },
): RetryDecision {
  const { type, retryable, maxRetries } = classifyError(errorText)
  const fingerprint = calculateErrorFingerprint(errorText)

  // 不可重试的错误类型
  if (!retryable) {
    return {
      shouldRetry: false,
      errorType: type,
      backoffMs: 0,
      reason: `Error type "${type}" is not retryable`,
      fingerprint,
    }
  }

  // 超过最大重试次数
  if (task.retries >= (task.maxRetries ?? maxRetries)) {
    return {
      shouldRetry: false,
      errorType: type,
      backoffMs: 0,
      reason: `Max retries (${task.maxRetries ?? maxRetries}) exceeded`,
      fingerprint,
    }
  }

  // 相同错误指纹检测（循环重试）
  const previousFingerprints = state.errors
    .filter(e => e.taskId === task.id)
    .map(e => e.fingerprint)

  if (shouldSkipRetry(fingerprint, previousFingerprints)) {
    return {
      shouldRetry: false,
      errorType: type,
      backoffMs: 0,
      reason: 'Same error pattern detected — unrecoverable',
      fingerprint,
    }
  }

  // 计算 backoff
  const backoffMs = Math.min(
    config.baseDelay * 1000 * Math.pow(2, task.retries),
    config.maxDelay * 1000,
  )

  return {
    shouldRetry: true,
    errorType: type,
    backoffMs,
    fingerprint,
  }
}

/**
 * 等待指定毫秒数。
 */
export function waitBackoff(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
