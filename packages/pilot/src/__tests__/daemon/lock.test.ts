import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { acquireLock, releaseLock, isLockActive, registerLockCleanup } from '../../daemon/lock'

describe('daemon/lock', () => {
  let tmpDir: string
  const lockDir = '.deepstorm'

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pilot-lock-test-'))
    fs.mkdirSync(path.join(tmpDir, lockDir), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('acquireLock', () => {
    it('acquires lock when no lock file exists', () => {
      const result = acquireLock(tmpDir)
      expect(result).toBe(true)

      const lockPath = path.join(tmpDir, lockDir, '.pilot.lock')
      expect(fs.existsSync(lockPath)).toBe(true)
    })

    it('rejects duplicate lock for same project', () => {
      acquireLock(tmpDir)
      const result = acquireLock(tmpDir)
      expect(result).toBe(false)
    })

    it('stores current PID in lock file', () => {
      acquireLock(tmpDir)
      const lockPath = path.join(tmpDir, lockDir, '.pilot.lock')
      const pid = parseInt(fs.readFileSync(lockPath, 'utf-8').trim(), 10)
      expect(pid).toBe(process.pid)
    })
  })

  describe('releaseLock', () => {
    it('removes lock file', () => {
      acquireLock(tmpDir)
      releaseLock(tmpDir)

      const lockPath = path.join(tmpDir, lockDir, '.pilot.lock')
      expect(fs.existsSync(lockPath)).toBe(false)
    })

    it('does not throw when releasing non-existent lock', () => {
      expect(() => releaseLock(tmpDir)).not.toThrow()
    })
  })

  describe('registerLockCleanup', () => {
    it('registers cleanup handlers without throwing', () => {
      acquireLock(tmpDir)
      expect(() => registerLockCleanup(tmpDir)).not.toThrow()
    })
  })

  describe('isLockActive', () => {
    it('returns true when PID in lock is alive', () => {
      acquireLock(tmpDir)
      expect(isLockActive(tmpDir)).toBe(true)
    })

    it('returns false when no lock file exists', () => {
      expect(isLockActive(tmpDir)).toBe(false)
    })
  })
})
