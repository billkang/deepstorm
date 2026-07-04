import { describe, it, expect } from 'vitest'
import { parseFrontmatter } from '../frontmatter'

describe('parseFrontmatter', () => {
  it('parses valid frontmatter with deepstorm field', () => {
    const content = `---
name: reef-react-lint
description: React 代码规范检查
allowed-tools: Bash(node:*)
deepstorm:
  tool: reef
  configKey: reef.frontend.framework
  configValue: react
  dependencies:
    - deepstorm-jira-parser
---
# Skill content here`
    const result = parseFrontmatter(content)
    expect(result).not.toBeNull()
    expect(result?.name).toBe('reef-react-lint')
    expect(result?.deepstorm?.tool).toBe('reef')
    expect(result?.deepstorm?.configKey).toBe('reef.frontend.framework')
    expect(result?.deepstorm?.configValue).toBe('react')
    expect(result?.deepstorm?.dependencies).toEqual(['deepstorm-jira-parser'])
  })

  it('parses frontmatter without deepstorm field', () => {
    const content = `---
name: some-other-skill
description: 没有 deepstorm 字段
---`
    const result = parseFrontmatter(content)
    expect(result).not.toBeNull()
    expect(result?.name).toBe('some-other-skill')
    expect(result?.deepstorm).toBeUndefined()
  })

  it('returns null for content without frontmatter', () => {
    const content = '# Just a markdown file\n没有 frontmatter'
    const result = parseFrontmatter(content)
    expect(result).toBeNull()
  })

  it('returns null for empty content', () => {
    expect(parseFrontmatter('')).toBeNull()
    expect(parseFrontmatter('   ')).toBeNull()
  })

  it('parses frontmatter with no optional dependencies field', () => {
    const content = `---
name: reef-simple
deepstorm:
  tool: reef
  configKey: reef.test.framework
  configValue: jest
---`
    const result = parseFrontmatter(content)
    expect(result?.deepstorm?.dependencies).toBeUndefined()
  })

  it('parses shared skill naming convention', () => {
    const content = `---
name: deepstorm-jira-parser
deepstorm:
  tool: shared
  configKey: shared.issueTracker
  configValue: jira
---`
    const result = parseFrontmatter(content)
    expect(result?.deepstorm?.tool).toBe('shared')
    expect(result?.name).toBe('deepstorm-jira-parser')
  })

  it('handles malformed frontmatter gracefully', () => {
    const content = '---\ninvalid: yaml: : :\n---'
    const result = parseFrontmatter(content)
    expect(result).toBeNull()
  })
})
