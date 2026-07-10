import { describe, it, expect } from 'vitest'
import { classifyError, calculateErrorFingerprint, shouldSkipRetry } from '../../retry/classifier'

describe('retry/classifier', () => {
  describe('classifyError', () => {
    it('classifies compilation errors', () => {
      const result = classifyError('tsc: error TS2345: Type mismatch')
      expect(result.type).toBe('compilation')
      expect(result.retryable).toBe(true)
    })

    it('classifies syntax errors', () => {
      const result = classifyError('SyntaxError: Unexpected token')
      expect(result.type).toBe('compilation')
    })

    it('classifies test failures', () => {
      const result = classifyError('FAIL tests/foo.test.ts: expected 3, received 5')
      expect(result.type).toBe('test_failure')
      expect(result.retryable).toBe(true)
      expect(result.maxRetries).toBe(2)
    })

    it('classifies timeout errors', () => {
      const result = classifyError('Error: ETIMEDOUT')
      expect(result.type).toBe('timeout')
      expect(result.retryable).toBe(true)
    })

    it('classifies token overbudget errors', () => {
      const result = classifyError('token limit exceeded')
      expect(result.type).toBe('token_overbudget')
      expect(result.retryable).toBe(false)
    })

    it('classifies unknown errors as retryable', () => {
      const result = classifyError('Some random unexpected error')
      expect(result.type).toBe('unknown')
      expect(result.retryable).toBe(true)
    })
  })

  describe('calculateErrorFingerprint', () => {
    it('returns consistent MD5 hash', () => {
      const fp1 = calculateErrorFingerprint('compilation error: missing semicolon')
      const fp2 = calculateErrorFingerprint('compilation error: missing semicolon')
      expect(fp1).toBe(fp2)
    })

    it('returns different hash for different errors', () => {
      const fp1 = calculateErrorFingerprint('error A')
      const fp2 = calculateErrorFingerprint('error B')
      expect(fp1).not.toBe(fp2)
    })
  })

  describe('shouldSkipRetry', () => {
    it('returns true when same fingerprint exists', () => {
      const fp = 'abc123'
      expect(shouldSkipRetry(fp, ['other', fp])).toBe(true)
    })

    it('returns false when no matching fingerprint', () => {
      const fp = 'abc123'
      expect(shouldSkipRetry(fp, ['other', 'xyz'])).toBe(false)
    })

    it('returns false when no previous errors', () => {
      expect(shouldSkipRetry('abc', [])).toBe(false)
    })
  })
})
