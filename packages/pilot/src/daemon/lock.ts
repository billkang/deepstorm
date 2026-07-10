import * as fs from 'node:fs'
import * as path from 'node:path'

const LOCK_DIR = '.deepstorm'
const LOCK_FILE = '.pilot.lock'

/**
 * 获取锁文件路径。
 */
function lockFilePath(projectDir: string): string {
  return path.join(projectDir, LOCK_DIR, LOCK_FILE)
}

/**
 * 获取当前进程的 PID。
 */
const currentPid = (): number => process.pid

/**
 * 尝试获取项目的单例锁（PID 文件锁）。
 * 如果锁已被其他进程持有，返回 false。
 * 如果锁文件存在但 PID 已不存活，自动清理并重新获取。
 * 返回 true 表示获取成功。
 */
export function acquireLock(projectDir: string): boolean {
  const lockPath = lockFilePath(projectDir)

  // 检查已有锁
  try {
    const raw = fs.readFileSync(lockPath, 'utf-8').trim()
    const pid = parseInt(raw, 10)
    if (!isNaN(pid)) {
      try {
        // 检查 PID 是否存活 (signal 0 不发送信号，仅检测进程存在)
        process.kill(pid, 0)
        // PID 存活，锁已被其他进程持有
        return false
      } catch {
        // PID 不存活，清理 stale 锁
        fs.unlinkSync(lockPath)
      }
    }
  } catch {
    // 锁文件不存在，继续
  }

  // 写入锁文件
  fs.writeFileSync(lockPath, String(currentPid()), 'utf-8')
  return true
}

/**
 * 释放项目锁。
 */
export function releaseLock(projectDir: string): void {
  const lockPath = lockFilePath(projectDir)
  try {
    fs.unlinkSync(lockPath)
  } catch {
    // 锁文件不存在，忽略
  }
}

/**
 * 注册进程退出时的锁自动释放。
 */
export function registerLockCleanup(projectDir: string): void {
  const cleanup = () => releaseLock(projectDir)

  process.on('exit', cleanup)
  process.on('SIGTERM', () => {
    releaseLock(projectDir)
    process.exit(0)
  })
  process.on('SIGINT', () => {
    releaseLock(projectDir)
    process.exit(0)
  })
}

/**
 * 检查锁是否仍然有效（PID 存活）。
 */
export function isLockActive(projectDir: string): boolean {
  const lockPath = lockFilePath(projectDir)
  try {
    const raw = fs.readFileSync(lockPath, 'utf-8').trim()
    const pid = parseInt(raw, 10)
    if (isNaN(pid)) return false
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}
