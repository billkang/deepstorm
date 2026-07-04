/**
 * 深度合并两个对象。
 * - 对象字段递归合并
 * - 数组直接覆盖（不合并）
 * - 不修改原始对象
 */
export function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target }

  for (const key of Object.keys(source)) {
    const val = source[key]
    const existing = result[key]

    if (isPlainObject(existing) && isPlainObject(val)) {
      result[key] = deepMerge(
        existing as Record<string, unknown>,
        val as Record<string, unknown>,
      )
    } else {
      result[key] = val
    }
  }

  return result
}

function isPlainObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
