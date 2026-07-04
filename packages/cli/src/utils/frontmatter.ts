import * as yaml from 'js-yaml'

export interface DeepStormMeta {
  tool: string
  configKey: string
  configValue: string
  dependencies?: string[]
}

export interface SkillFrontmatter {
  name: string
  description?: string
  'allowed-tools'?: string
  deepstormm?: DeepStormMeta
}

/**
 * 解析 markdown 文件的 YAML frontmatter。
 * 返回 null 如果不存在 frontmatter 或解析失败。
 */
export function parseFrontmatter(content: string): SkillFrontmatter | null {
  const trimmed = content.trim()
  if (!trimmed.startsWith('---')) {
    return null
  }

  // 查找第二个 ---
  const endIndex = trimmed.indexOf('---', 3)
  if (endIndex === -1) {
    return null
  }

  const yamlBlock = trimmed.slice(3, endIndex).trim()
  if (!yamlBlock) {
    return null
  }

  try {
    const parsed = yaml.load(yamlBlock) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object') {
      return null
    }
    return parsed as unknown as SkillFrontmatter
  } catch {
    return null
  }
}
