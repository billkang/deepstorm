import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { buildMcpCapabilities, injectSkillCapabilities } from '../registry'
import { ensureDir } from '../../utils/fs'

const TMP_DIR = path.join(
  import.meta.dirname, '..', '..', '..', '..', '__test_fixtures__registry',
)

function cleanTmp(): void {
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true, force: true })
  }
}

beforeEach(() => cleanTmp())
afterEach(() => cleanTmp())

describe('buildMcpCapabilities', () => {
  const mcpCapabilities = {
    knowledge_base: { domain: 'knowledge-base' },
    issue_tracker: { domain: 'project-management' },
  }

  const mcpTools = {
    'feishu-wiki': { domain: 'knowledge-base', label: '飞书知识库', description: '' },
    jira: { domain: 'project-management', label: 'Jira', description: '' },
    linear: { domain: 'project-management', label: 'Linear', description: '' },
    github: { domain: 'code-hosting', label: 'GitHub', description: '' },
    figma: { domain: 'design-tools', label: 'Figma', description: '' },
  }

  it('单一匹配：每个能力域恰好有一个已安装服务', () => {
    const result = JSON.parse(
      buildMcpCapabilities(mcpCapabilities, ['jira', 'feishu-wiki'], mcpTools),
    )

    expect(result.knowledge_base.available).toBe(true)
    expect(result.knowledge_base.providers).toHaveLength(1)
    expect(result.knowledge_base.providers[0]).toEqual({
      id: 'feishu-wiki',
      label: '飞书知识库',
    })

    expect(result.issue_tracker.available).toBe(true)
    expect(result.issue_tracker.providers).toHaveLength(1)
    expect(result.issue_tracker.providers[0]).toEqual({
      id: 'jira',
      label: 'Jira',
    })
  })

  it('多匹配：一个能力域有多个已安装服务', () => {
    const result = JSON.parse(
      buildMcpCapabilities(mcpCapabilities, ['jira', 'linear', 'feishu-wiki'], mcpTools),
    )

    expect(result.issue_tracker.available).toBe(true)
    expect(result.issue_tracker.providers).toHaveLength(2)
    expect(result.issue_tracker.providers).toEqual(
      expect.arrayContaining([
        { id: 'jira', label: 'Jira' },
        { id: 'linear', label: 'Linear' },
      ]),
    )

    expect(result.knowledge_base.available).toBe(true)
    expect(result.knowledge_base.providers).toHaveLength(1)
  })

  it('零匹配：能力域没有已安装服务时返回 available: false', () => {
    const result = JSON.parse(
      buildMcpCapabilities(mcpCapabilities, [], mcpTools),
    )

    expect(result.knowledge_base.available).toBe(false)
    expect(result.knowledge_base.providers).toHaveLength(0)

    expect(result.issue_tracker.available).toBe(false)
    expect(result.issue_tracker.providers).toHaveLength(0)
  })

  it('不相关 MCP 被过滤：只返回声明了的能力域', () => {
    const result = JSON.parse(
      buildMcpCapabilities(mcpCapabilities, ['jira', 'feishu-wiki', 'github', 'figma'], mcpTools),
    )

    // 应只包含 knowledge_base 和 issue_tracker
    expect(Object.keys(result)).toEqual(
      expect.arrayContaining(['knowledge_base', 'issue_tracker']),
    )
    expect(Object.keys(result)).not.toContain('code-hosting')
    expect(Object.keys(result)).not.toContain('design-tools')

    // 不相关服务不影响相关域的结果
    expect(result.issue_tracker.providers).toHaveLength(1)
    expect(result.knowledge_base.providers).toHaveLength(1)
  })

  it('能力域声明为空时返回空对象', () => {
    const result = JSON.parse(
      buildMcpCapabilities({}, ['jira', 'feishu-wiki'], mcpTools),
    )

    expect(result).toEqual({})
  })

  it('返回 JSON 字符串', () => {
    const result = buildMcpCapabilities(mcpCapabilities, ['jira'], mcpTools)
    expect(() => JSON.parse(result)).not.toThrow()
  })
})

describe('injectSkillCapabilities', () => {
  const mcpTools = {
    'feishu-wiki': { domain: 'knowledge-base', label: '飞书知识库', description: '' },
    jira: { domain: 'project-management', label: 'Jira', description: '' },
  }

  it('有 mcpCapabilities 时注入 tide_capabilities 到模板变量', () => {
    const tmplPath = path.join(TMP_DIR, 'tide-discuss', 'SKILL.md.tmpl')
    ensureDir(path.join(TMP_DIR, 'tide-discuss'))
    fs.writeFileSync(tmplPath, `---
name: tide-discuss
deepstorm:
  tool: tide
mcpCapabilities:
  knowledge_base:
    domain: "knowledge-base"
  issue_tracker:
    domain: "project-management"
---
# Tide
{{tide_capabilities}}`, 'utf-8')

    const vars = injectSkillCapabilities(tmplPath, { 'my.var': 'hello' }, ['jira', 'feishu-wiki'], mcpTools)

    expect(vars['my.var']).toBe('hello') // base variables preserved
    expect(vars['tide_capabilities']).toBeDefined()
    const parsed = JSON.parse(vars['tide_capabilities'])
    expect(parsed.knowledge_base).toBeDefined()
    expect(parsed.issue_tracker).toBeDefined()
  })

  it('无 mcpCapabilities 时模板变量不改变', () => {
    const tmplPath = path.join(TMP_DIR, 'no-mcp', 'SKILL.md.tmpl')
    ensureDir(path.join(TMP_DIR, 'no-mcp'))
    fs.writeFileSync(tmplPath, `---
name: plain-skill
---
# Plain`, 'utf-8')

    const vars = injectSkillCapabilities(tmplPath, { 'my.var': 'hello' }, ['jira'], mcpTools)
    expect(vars).toEqual({ 'my.var': 'hello' })
    expect(vars['tide_capabilities']).toBeUndefined()
  })

  it('无 frontmatter 时模板变量不改变', () => {
    const tmplPath = path.join(TMP_DIR, 'no-fm', 'SKILL.md.tmpl')
    ensureDir(path.join(TMP_DIR, 'no-fm'))
    fs.writeFileSync(tmplPath, '# Just a markdown', 'utf-8')

    const vars = injectSkillCapabilities(tmplPath, { 'my.var': 'hello' }, ['jira'], mcpTools)
    expect(vars).toEqual({ 'my.var': 'hello' })
  })

  it('文件不存在时返回 baseVariables', () => {
    const vars = injectSkillCapabilities('/not/exists.tmpl', { 'my.var': 'hello' }, ['jira'], mcpTools)
    expect(vars).toEqual({ 'my.var': 'hello' })
  })

  it('支持自定义 variableName 参数', () => {
    const tmplPath = path.join(TMP_DIR, 'reef-start', 'SKILL.md.tmpl')
    ensureDir(path.join(TMP_DIR, 'reef-start'))
    fs.writeFileSync(tmplPath, `---
name: reef-start
deepstorm:
  tool: reef
mcpCapabilities:
  issue_tracker:
    domain: "project-management"
  knowledge_base:
    domain: "knowledge-base"
---
# Reef
{{reef_capabilities}}`, 'utf-8')

    const vars = injectSkillCapabilities(
      tmplPath,
      { 'my.var': 'hello' },
      ['jira', 'feishu-wiki'],
      mcpTools,
      'reef_capabilities',
    )

    expect(vars['my.var']).toBe('hello') // base variables preserved
    expect(vars['reef_capabilities']).toBeDefined()
    expect(vars['tide_capabilities']).toBeUndefined() // should NOT use default name
    const parsed = JSON.parse(vars['reef_capabilities'])
    expect(parsed.issue_tracker).toBeDefined()
    expect(parsed.knowledge_base).toBeDefined()
  })

  it('deepstorm.tool: sweep 自动推导为 sweep_capabilities', () => {
    const tmplPath = path.join(TMP_DIR, 'sweep-plan', 'SKILL.md.tmpl')
    ensureDir(path.join(TMP_DIR, 'sweep-plan'))
    fs.writeFileSync(tmplPath, `---
name: sweep-plan
deepstorm:
  tool: sweep
mcpCapabilities:
  issue_tracker:
    domain: "project-management"
  knowledge_base:
    domain: "knowledge-base"
---
# Sweep
{{sweep_capabilities}}`, 'utf-8')

    const vars = injectSkillCapabilities(
      tmplPath,
      { 'my.var': 'hello' },
      ['jira'],
      mcpTools,
    )

    expect(vars['my.var']).toBe('hello')
    expect(vars['sweep_capabilities']).toBeDefined()
    expect(vars['tide_capabilities']).toBeUndefined()
    const parsed = JSON.parse(vars['sweep_capabilities'])
    expect(parsed.issue_tracker).toBeDefined()
    expect(parsed.issue_tracker.available).toBe(true)
    expect(parsed.knowledge_base).toBeDefined()
    expect(parsed.knowledge_base.available).toBe(false)
  })
})
