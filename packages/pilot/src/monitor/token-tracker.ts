/**
 * Token 消耗追踪：从输出流解析 token 数据并累加。
 */

export interface TokenTrackerOptions {
  /** token 预算上限 */
  budget: number
  /** token 超限回调 */
  onOverBudget: (used: number, budget: number) => void
  /** 解析 token 的函数 */
  parseTokens: (output: string) => { input?: number; output?: number }
}

export interface TokenTrackerHandle {
  /** 处理新输出，返回当前总消耗 */
  feed: (output: string) => number
  /** 当前总消耗 */
  readonly total: number
  /** 是否已超预算 */
  isOverBudget: boolean
  /** 停止追踪 */
  stop: () => void
}

/**
 * 创建 token 追踪器。
 */
export function createTokenTracker(options: TokenTrackerOptions): TokenTrackerHandle {
  const { budget, onOverBudget, parseTokens } = options
  let total = 0
  let triggered = false

  return {
    get total() {
      return total
    },
    get isOverBudget() {
      return total >= budget || triggered
    },
    feed: (output: string) => {
      const tokens = parseTokens(output)
      const newTokens = (tokens.input ?? 0) + (tokens.output ?? 0)
      total += newTokens

      if (!triggered && total >= budget) {
        triggered = true
        onOverBudget(total, budget)
      }

      return total
    },
    stop: () => {
      // 无状态停止
    },
  }
}
