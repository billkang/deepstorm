/**
 * pilot-state.json 的完整类型定义
 */

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

export type ErrorType =
  | 'compilation'
  | 'test_failure'
  | 'timeout'
  | 'dead_loop'
  | 'process_crash'
  | 'token_overbudget'
  | 'max_retries_exceeded'
  | 'unrecoverable_error'
  | 'silence_timeout'
  | 'unknown'

export interface TaskState {
  /** task 标识，如 "1.3" */
  id: string
  /** task 标题 */
  title: string
  /** 当前状态 */
  status: TaskStatus
  /** 已重试次数 */
  retries: number
  /** 最大允许重试次数 */
  maxRetries: number
  /** 此 task 的 token 预算 */
  tokenBudget: number
  /** 实际消耗的 token 数 */
  tokensUsed: number
  /** 开始执行时间 (ISO 8601) */
  startedAt: string | null
  /** 完成时间 (ISO 8601) */
  completedAt: string | null
  /** 执行时长，毫秒 */
  duration: number | null
  /** 错误类型 */
  error: ErrorType | null
  /** 错误详情 */
  errorDetail: string | null
  /** 错误指纹（MD5 hash），用于重复检测 */
  errorFingerprint: string | null
  /** task 日志文件路径（相对路径，相对于 logs 目录） */
  logPath: string | null
}

export interface ErrorRecord {
  /** 错误发生时间 (ISO 8601) */
  timestamp: string
  /** 错误分类 */
  type: ErrorType
  /** 错误信息 */
  message: string
  /** MD5 指纹 */
  fingerprint: string
  /** 关联 task ID */
  taskId: string
}

export interface RunSummary {
  /** 运行开始时间 */
  startTime: string
  /** 运行结束时间 */
  endTime: string | null
  /** 总时长，毫秒 */
  totalDuration: number | null
  /** 完成 task 数 */
  completed: number
  /** 失败 task 数 */
  failed: number
  /** 跳过 task 数 */
  skipped: number
  /** 总 token 消耗 */
  totalTokens: number
}

export interface PilotState {
  /** 项目路径 */
  project: string
  /** pilot 开始时间 */
  startedAt: string
  /** 最后更新 */
  updatedAt: string
  /** @deepstorm/pilot 版本 */
  pilotVersion: string
  /** task 列表 */
  tasks: TaskState[]
  /** 错误记录 */
  errors: ErrorRecord[]
  /** 运行摘要 */
  summary: RunSummary | null
  /** 重启计数（从崩溃恢复后递增） */
  restartCount: number
  /** 是否为恢复运行 */
  isResumed: boolean
}
