/**
 * MCP 及外部服务的环境变量模板管理。
 *
 * 从 env-examples/ 目录读取 .env-example 文件，为 setup 流程提供：
 *   1. getMcpEnvStubs() — 输出到 guide 的摘要信息
 *   2. collectEnvSections() — 合并到最终 .env 的完整内容
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

export interface EnvStubEntry {
  key: string
  comment: string
}

/** env-examples 目录名（相对 cliDir） */
const ENV_EXAMPLES_DIR = 'env-examples'

/**
 * 解析 .env-example 文件，提取 KEY= 条目和前一条有意义的注释。
 * 跳过纯装饰线（═、━ 等重复字符组成的注释行）。
 */
function parseEnvExampleFile(filePath: string): EnvStubEntry[] {
  if (!fs.existsSync(filePath)) return []

  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const entries: EnvStubEntry[] = []
  let lastComment = ''

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('#')) {
      const text = trimmed.replace(/^#+[\s═━]*/, '').trim()
      if (text && !text.startsWith('═') && !text.startsWith('━') && !line.match(/^#\s*[═━]/)) {
        lastComment = text
      }
    } else if (trimmed.includes('=') && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=')
      const key = trimmed.slice(0, eqIdx).trim()
      if (key && /^[A-Z][A-Z0-9_]*$/.test(key)) {
        entries.push({ key, comment: lastComment || key })
        lastComment = ''
      }
    }
  }

  return entries
}

/**
 * 从 env-examples 目录下查找指定工具的环境变量 stub 列表。
 * 返回选中工具对应的 KEY= 条目及注释，用于 guide 显示。
 */
export function getMcpEnvStubs(
  selectedTools: string[],
  examplesDir?: string,
): EnvStubEntry[] {
  if (!examplesDir) return []
  const result: EnvStubEntry[] = []

  for (const tool of selectedTools) {
    const filePath = path.join(examplesDir, `${tool}.env-example`)
    const entries = parseEnvExampleFile(filePath)
    result.push(...entries)
  }

  return result
}

/**
 * 读取并返回选中工具的 .env-example 完整内容，
 * 用于写入最终 .env 文件。
 *
 * 自动跳过 KEY 已存在于 existingKeys 中的 section。
 * 返回的数组中每个元素是一段完整的 .env 节。
 */
export function collectEnvSections(
  selectedTools: string[],
  examplesDir: string,
  existingKeys: Set<string>,
): string[] {
  const sections: string[] = []

  for (const tool of selectedTools) {
    const filePath = path.join(examplesDir, `${tool}.env-example`)
    if (!fs.existsSync(filePath)) continue

    const content = fs.readFileSync(filePath, 'utf-8').trimEnd()
    const entries = parseEnvExampleFile(filePath)

    // 该服务所有 KEY 都已存在 → 整个 section 跳过
    const allExist = entries.every((e) => existingKeys.has(e.key))
    if (allExist) continue

    // 移除已存在的 KEY 行，保留装饰注释
    const filtered = filterExistingKeys(content, existingKeys)
    if (filtered) sections.push(filtered)
  }

  return sections
}

/**
 * 从 env-example 内容中移除已存在 KEY 的行和其上方相邻注释。
 * 保留装饰边框和无关注释。
 */
function filterExistingKeys(
  content: string,
  existingKeys: Set<string>,
): string {
  const lines = content.split('\n')
  const result: string[] = []
  let skipUntilDecor = false

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()

    // 检测 KEY= 行
    if (trimmed.includes('=') && !trimmed.startsWith('#')) {
      const key = trimmed.slice(0, trimmed.indexOf('=')).trim()
      if (existingKeys.has(key)) {
        skipUntilDecor = true
        continue
      }
    }

    // 正在跳过旧 section，遇到装饰线才恢复
    if (skipUntilDecor) {
      if (lines[i].match(/^#\s*[═━]/)) {
        skipUntilDecor = false
        result.push(lines[i])
      }
      continue
    }

    result.push(lines[i])
  }

  return result.join('\n').trimEnd()
}
