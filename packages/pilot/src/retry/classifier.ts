/**
 * 错误分类器：根据错误文本匹配预定义模式。
 */

import { createHash } from 'node:crypto'
import type { ErrorType } from '../state/types'

/** 错误模式定义 */
interface ErrorPattern {
  type: ErrorType
  patterns: RegExp[]
  retryable: boolean
  maxRetries?: number
}

const ERROR_PATTERNS: ErrorPattern[] = [
  {
    type: 'compilation',
    patterns: [
      /compilation error/i,
      /SyntaxError/i,
      /syntax error/i,
      /tsc:.*error/i,
      /Cannot find (module|name|type)/i,
      /is not assignable to type/i,
      /build.*failed/i,
      /Module (not found|parse failed)/i,
    ],
    retryable: true,
  },
  {
    type: 'test_failure',
    patterns: [
      /test.*failed/i,
      /FAIL.*test/i,
      /expected.*received/i,
      /AssertionError/i,
      /test.*not pass/i,
    ],
    retryable: true,
    maxRetries: 2,
  },
  {
    type: 'timeout',
    patterns: [
      /timed? ?out/i,
      /timeout/i,
      /ETIMEDOUT/i,
      /ESOCKETTIMEDOUT/i,
    ],
    retryable: true,
  },
  {
    type: 'process_crash',
    patterns: [
      /segmentation fault/i,
      /out of memory/i,
      /killed/i,
      /exit code -\d+/,
    ],
    retryable: true,
  },
  {
    type: 'token_overbudget',
    patterns: [
      /token.*(limit|budget|exceeded|over)/i,
      /context.*length/i,
      /too many tokens/i,
    ],
    retryable: false,
  },
  {
    type: 'dead_loop',
    patterns: [
      /dead loop/i,
      /infinite loop/i,
      /same output/,
    ],
    retryable: false,
  },
]

/**
 * 根据错误文本分类错误类型。
 */
export function classifyError(errorText: string): { type: ErrorType; retryable: boolean; maxRetries: number } {
  for (const pattern of ERROR_PATTERNS) {
    for (const regex of pattern.patterns) {
      if (regex.test(errorText)) {
        return {
          type: pattern.type,
          retryable: pattern.retryable,
          maxRetries: pattern.maxRetries ?? 3,
        }
      }
    }
  }
  return { type: 'unknown', retryable: true, maxRetries: 3 }
}

/**
 * 计算错误文本的 MD5 指纹。
 */
export function calculateErrorFingerprint(errorText: string): string {
  return createHash('md5').update(errorText).digest('hex')
}

/**
 * 检查是否应跳过重试（相同指纹）。
 */
export function shouldSkipRetry(
  currentFingerprint: string,
  previousErrorFingerprints: Array<string | null>,
): boolean {
  return previousErrorFingerprints.some(fp => fp !== null && fp === currentFingerprint)
}
