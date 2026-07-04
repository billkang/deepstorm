import { RegistryReader } from '../engine/registry'
import type { Registry } from '../types/registry'

/**
 * 列出可用 skill 模板。
 */
export function listTemplates(registry: Registry, tool?: string): void {
  const reader = new RegistryReader(registry)

  const skills = tool
    ? reader.getToolSkills(tool)
    : Object.entries(registry.skills).map(([id, entry]) => ({ id, ...entry }))

  if (skills.length === 0) {
    console.log('没有找到可用的模板')
    return
  }

  console.log('可用的模板:')
  console.log('')
  for (const skill of skills) {
    const id = 'id' in skill ? (skill as any).id : ''
    const toolName = skill.tool || ''
    const toolLabel = toolName.charAt(0).toUpperCase() + toolName.slice(1)
    const displayName = skill.name || id
    const desc = skill.description ? ` — ${skill.description}` : ''
    console.log(`  • ${displayName}（${toolLabel}）${desc}`)
  }
  console.log('')
}
