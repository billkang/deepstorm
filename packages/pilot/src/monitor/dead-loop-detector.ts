import { createHash } from 'node:crypto'

/**
 * 死循环检测：通过 MD5 指纹比较连续输出片段。
 */

export interface DeadLoopDetectorOptions {
  /** 判定死循环所需连续相同次数（默认 3） */
  threshold?: number
  /** 日志停滞检测所需连续相同采样次数（默认 3） */
  stagnationThreshold?: number
  /** 每个采样保留的最大输出字符数（默认 4096） */
  maxWindowSize?: number
}

export class DeadLoopDetector {
  private threshold: number
  private stagnationThreshold: number
  private maxWindowSize: number
  private fingerprints: string[] = []
  private consecutiveMatches = 0

  // 日志停滞检测(state)
  private outputWindow = ''
  private stagnationFingerprints: string[] = []
  private consecutiveStagnation = 0

  constructor(options: DeadLoopDetectorOptions = {}) {
    this.threshold = options.threshold ?? 3
    this.stagnationThreshold = options.stagnationThreshold ?? 3
    this.maxWindowSize = options.maxWindowSize ?? 4096
  }

  /**
   * 对输出片段计算 MD5 指纹并检测死循环。
   * 返回 true 表示已判定为死循环。
   */
  feed(output: string): boolean {
    const fingerprint = createHash('md5').update(output).digest('hex')
    this.fingerprints.push(fingerprint)

    // 只保留最近 5 个指纹
    if (this.fingerprints.length > 5) {
      this.fingerprints.shift()
    }

    // 检查是否连续相同
    if (this.fingerprints.length >= 2) {
      const last = this.fingerprints[this.fingerprints.length - 1]
      const prev = this.fingerprints[this.fingerprints.length - 2]
      if (last === prev) {
        this.consecutiveMatches++
      } else {
        this.consecutiveMatches = 0
      }
    }

    // 累计输出到窗口(供停滞检测采样)
    this.outputWindow += output
    if (this.outputWindow.length > this.maxWindowSize) {
      this.outputWindow = this.outputWindow.slice(-this.maxWindowSize)
    }

    return this.consecutiveMatches >= this.threshold
  }

  /**
   * 周期性采样检测:检查最近输出的内容相对于上一次采样是否有实质变化。
   * 如果连续 stagnationThreshold 次采样内容相同,说明输出在变化但没有实际进展,判定为停滞。
   * 返回 true 表示已判定为停滞。
   */
  checkStagnation(): boolean {
    const fingerprint = createHash('md5').update(this.outputWindow).digest('hex')
    this.stagnationFingerprints.push(fingerprint)

    // 只保留最近 stagnationThreshold + 2 个指纹
    const maxStagnationSamples = this.stagnationThreshold + 2
    if (this.stagnationFingerprints.length > maxStagnationSamples) {
      this.stagnationFingerprints.shift()
    }

    // 检查是否连续相同
    if (this.stagnationFingerprints.length >= 2) {
      const last = this.stagnationFingerprints[this.stagnationFingerprints.length - 1]
      const prev = this.stagnationFingerprints[this.stagnationFingerprints.length - 2]
      if (last === prev) {
        this.consecutiveStagnation++
      } else {
        this.consecutiveStagnation = 0
      }
    }

    return this.consecutiveStagnation >= this.stagnationThreshold
  }

  /**
   * 重置所有检测状态。
   */
  reset(): void {
    this.fingerprints = []
    this.consecutiveMatches = 0
    this.outputWindow = ''
    this.stagnationFingerprints = []
    this.consecutiveStagnation = 0
  }
}
