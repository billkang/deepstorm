import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * 读取 config-schema.json 中的合法 key 列表。
 * 递归遍历 schema 的 properties，收集所有叶子路径（如 tide.issueTracker、reef.frontend.framework）。
 */
export function loadValidConfigKeys(): Set<string> {
  // 尝试多个路径：bundled dist/、dev src/commands/、packages/cli/ 等
  const candidates = [
    path.resolve(__dirname, 'config-schema.json'),
    path.resolve(__dirname, '..', 'config-schema.json'),
    path.resolve(process.cwd(), 'config-schema.json'),
    path.resolve(process.cwd(), 'packages', 'cli', 'config-schema.json'),
  ]
  for (const schemaPath of candidates) {
    try {
      if (!fs.existsSync(schemaPath)) continue
      const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'))
      const keys = new Set<string>()
      collectLeafPaths(schema.properties, '', keys)
      return keys
    } catch {
      continue
    }
  }
  return new Set()
}

/**
 * 递归收集 schema 中所有叶子属性的路径。
 * @param props 当前层级的 properties 对象
 * @param prefix 当前前缀（如 "tide"）
 * @param keys 收集结果的 Set
 */
function collectLeafPaths(
  props: Record<string, any> | undefined,
  prefix: string,
  keys: Set<string>,
): void {
  if (!props) return
  for (const [key, value] of Object.entries(props)) {
    const fullPath = prefix ? `${prefix}.${key}` : key
    if (value.properties && typeof value.properties === 'object') {
      // 有嵌套 properties，递归
      collectLeafPaths(value.properties, fullPath, keys)
    } else {
      // 叶子节点
      keys.add(fullPath)
    }
  }
}

/**
 * 校验配置 key 是否合法（在 config-schema.json 中有定义）。
 * 不合法时输出错误并返回 false，否则返回 true。
 */
export function validateConfigKey(key: string): boolean {
  const validKeys = loadValidConfigKeys()
  if (validKeys.has(key)) return true

  console.error(`未知配置项：${key}`)
  console.error(`合法配置项：${[...validKeys].join('、')}`)
  return false
}
