/**
 * 解析 --non-interactive 模式的参数。
 */

export interface NonInteractiveArgs {
  /** 要安装的工具列表 */
  tools: string[]
  /** 配置映射 */
  config: Record<string, string>
}

/**
 * 解析 --tools 和 --set 参数为结构化配置。
 */
export function parseNonInteractiveArgs(
  toolsStr: string | undefined,
  setValues: string[] | undefined,
): NonInteractiveArgs {
  const tools = toolsStr
    ? toolsStr.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  const config: Record<string, string> = {}
  if (setValues) {
    for (const kv of setValues) {
      const eqIdx = kv.indexOf('=')
      if (eqIdx > 0) {
        const key = kv.slice(0, eqIdx).trim()
        const value = kv.slice(eqIdx + 1).trim()
        if (key && value) {
          config[key] = value
        }
      }
    }
  }

  return { tools, config }
}
