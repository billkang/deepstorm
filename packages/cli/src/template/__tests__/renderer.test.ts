import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import Handlebars from 'handlebars'
import { renderTemplate, copyVariants, copyFragments, registerPartialsDir } from '../renderer'
import { findAffectedTemplates, buildTemplateVariables } from '../registry'
import type { Registry } from '../../types/registry'
import { ensureDir } from '../../utils/fs'

const TMP_DIR = path.join(
  import.meta.dirname,
  '..',
  '..',
  '..',
  '..',
  '__test_fixtures__',
)

function cleanTmp(): void {
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true, force: true })
  }
}

beforeEach(() => cleanTmp())
afterEach(() => cleanTmp())

// ─── renderTemplate ──────────────────────────────────────────────

describe('renderTemplate', () => {
  it('应该替换 {{var}} 占位符', () => {
    const tmplPath = path.join(TMP_DIR, 'test.md.tmpl')
    const outPath = path.join(TMP_DIR, 'test.md')
    ensureDir(TMP_DIR)
    fs.writeFileSync(
      tmplPath,
      '框架: {{reef.frontend.framework.label}}',
      'utf-8',
    )

    renderTemplate(tmplPath, {
      'reef.frontend.framework.label': 'React 19',
    }, outPath)

    const result = fs.readFileSync(outPath, 'utf-8')
    expect(result).toBe('框架: React 19')
  })

  it('应该替换多个占位符', () => {
    const tmplPath = path.join(TMP_DIR, 'multi.md.tmpl')
    const outPath = path.join(TMP_DIR, 'multi.md')
    ensureDir(TMP_DIR)
    fs.writeFileSync(tmplPath, '{{a}} + {{b}} = {{c}}', 'utf-8')

    renderTemplate(tmplPath, { a: '1', b: '2', c: '3' }, outPath)

    const result = fs.readFileSync(outPath, 'utf-8')
    expect(result).toBe('1 + 2 = 3')
  })

  it('未匹配的占位符应输出空字符串（Handlebars 行为）', () => {
    const tmplPath = path.join(TMP_DIR, 'unmatched.md.tmpl')
    const outPath = path.join(TMP_DIR, 'unmatched.md')
    ensureDir(TMP_DIR)
    fs.writeFileSync(tmplPath, '{{matched}} + {{unmatched}}', 'utf-8')

    renderTemplate(tmplPath, { matched: 'ok' }, outPath)

    const result = fs.readFileSync(outPath, 'utf-8')
    expect(result).toBe('ok + ')
  })

  it('模板文件不存在时应抛出错误', () => {
    expect(() =>
      renderTemplate('/not/exists.tmpl', {}, '/dev/null'),
    ).toThrow('模板文件不存在')
  })

  it('自动创建输出目录', () => {
    const tmplPath = path.join(TMP_DIR, 'autodir.tmpl')
    const outPath = path.join(TMP_DIR, 'sub', 'out', 'test.md')
    ensureDir(TMP_DIR)
    fs.writeFileSync(tmplPath, 'hello', 'utf-8')

    renderTemplate(tmplPath, {}, outPath)

    expect(fs.existsSync(outPath)).toBe(true)
  })

  // ─── 新增 Handlebars 条件测试 ─────────────────────────────────

  it('应支持 {{#if}} 条件渲染：条件为真时输出内容', () => {
    const tmplPath = path.join(TMP_DIR, 'if-true.md.tmpl')
    const outPath = path.join(TMP_DIR, 'if-true.md')
    ensureDir(TMP_DIR)
    fs.writeFileSync(
      tmplPath,
      '{{#if showSection}}显示此内容{{/if}}',
      'utf-8',
    )

    renderTemplate(tmplPath, { showSection: true }, outPath)

    const result = fs.readFileSync(outPath, 'utf-8')
    expect(result).toBe('显示此内容')
  })

  it('应支持 {{#if}} 条件渲染：条件为假时隐藏内容', () => {
    const tmplPath = path.join(TMP_DIR, 'if-false.md.tmpl')
    const outPath = path.join(TMP_DIR, 'if-false.md')
    ensureDir(TMP_DIR)
    fs.writeFileSync(
      tmplPath,
      '{{#if showSection}}隐藏这个{{/if}}',
      'utf-8',
    )

    renderTemplate(tmplPath, { showSection: false }, outPath)

    const result = fs.readFileSync(outPath, 'utf-8')
    expect(result).toBe('')
  })

  it('应支持 {{#if}}...{{else}}', () => {
    const tmplPath = path.join(TMP_DIR, 'if-else.md.tmpl')
    const outPath = path.join(TMP_DIR, 'if-else.md')
    ensureDir(TMP_DIR)
    fs.writeFileSync(
      tmplPath,
      '{{#if flag}}A{{else}}B{{/if}}',
      'utf-8',
    )

    renderTemplate(tmplPath, { flag: false }, outPath)

    const result = fs.readFileSync(outPath, 'utf-8')
    expect(result).toBe('B')
  })

  it('空字符串应视为假', () => {
    const tmplPath = path.join(TMP_DIR, 'empty-str.md.tmpl')
    const outPath = path.join(TMP_DIR, 'empty-str.md')
    ensureDir(TMP_DIR)
    fs.writeFileSync(
      tmplPath,
      '{{#if styleRef}}→ {{styleRef}}{{/if}}',
      'utf-8',
    )

    renderTemplate(tmplPath, { styleRef: '' }, outPath)

    const result = fs.readFileSync(outPath, 'utf-8')
    expect(result).toBe('')
  })

  // ─── 新增 Handlebars 循环测试 ─────────────────────────────────

  it('应支持 {{#each}} 循环', () => {
    const tmplPath = path.join(TMP_DIR, 'each.md.tmpl')
    const outPath = path.join(TMP_DIR, 'each.md')
    ensureDir(TMP_DIR)
    fs.writeFileSync(
      tmplPath,
      '{{#each items}}{{this}}\n{{/each}}',
      'utf-8',
    )

    renderTemplate(tmplPath, { items: ['a', 'b', 'c'] }, outPath)

    const result = fs.readFileSync(outPath, 'utf-8')
    expect(result).toBe('a\nb\nc\n')
  })

  it('空数组应输出空字符串', () => {
    const tmplPath = path.join(TMP_DIR, 'each-empty.md.tmpl')
    const outPath = path.join(TMP_DIR, 'each-empty.md')
    ensureDir(TMP_DIR)
    fs.writeFileSync(
      tmplPath,
      '{{#each items}}内容{{/each}}',
      'utf-8',
    )

    renderTemplate(tmplPath, { items: [] }, outPath)

    const result = fs.readFileSync(outPath, 'utf-8')
    expect(result).toBe('')
  })

  // ─── 嵌套路径测试 ────────────────────────────────────────────

  it('应支持嵌套变量路径', () => {
    const tmplPath = path.join(TMP_DIR, 'nested.md.tmpl')
    const outPath = path.join(TMP_DIR, 'nested.md')
    ensureDir(TMP_DIR)
    fs.writeFileSync(
      tmplPath,
      '{{reef.frontend.framework.styleRef}}',
      'utf-8',
    )

    renderTemplate(
      tmplPath,
      { 'reef.frontend.framework.styleRef': '→ 参考 [Angular 规范](dimensions/angular/quick-reference.md)' },
      outPath,
    )

    const result = fs.readFileSync(outPath, 'utf-8')
    expect(result).toBe('→ 参考 [Angular 规范](dimensions/angular/quick-reference.md)')
  })

  it('嵌套路径与 #if 组合使用', () => {
    const tmplPath = path.join(TMP_DIR, 'nested-if.md.tmpl')
    const outPath = path.join(TMP_DIR, 'nested-if.md')
    ensureDir(TMP_DIR)
    fs.writeFileSync(
      tmplPath,
      '{{#if showRef}}→ {{ref}}{{/if}}',
      'utf-8',
    )

    renderTemplate(
      tmplPath,
      { showRef: true, ref: '参考文档' },
      outPath,
    )

    const result = fs.readFileSync(outPath, 'utf-8')
    expect(result).toBe('→ 参考文档')
  })

  // ─── "true"/"false" 字符串转布尔测试 ─────────────────────────

  it('"true" 字符串应在 #if 中被视为真', () => {
    const tmplPath = path.join(TMP_DIR, 'str-true.md.tmpl')
    const outPath = path.join(TMP_DIR, 'str-true.md')
    ensureDir(TMP_DIR)
    fs.writeFileSync(
      tmplPath,
      '{{#if mcp.jira}}Jira 可用{{/if}}',
      'utf-8',
    )

    renderTemplate(tmplPath, { 'mcp.jira': 'true' }, outPath)

    const result = fs.readFileSync(outPath, 'utf-8')
    expect(result).toBe('Jira 可用')
  })

  it('"false" 字符串应在 #if 中被视为假', () => {
    const tmplPath = path.join(TMP_DIR, 'str-false.md.tmpl')
    const outPath = path.join(TMP_DIR, 'str-false.md')
    ensureDir(TMP_DIR)
    fs.writeFileSync(
      tmplPath,
      '{{#if mcp.figma}}Figma 可用{{/if}}',
      'utf-8',
    )

    renderTemplate(tmplPath, { 'mcp.figma': 'false' }, outPath)

    const result = fs.readFileSync(outPath, 'utf-8')
    expect(result).toBe('')
  })

  // ─── Partial 测试 ────────────────────────────────────────────

  it('应支持 {{> partial}} 引用已注册的 partial', () => {
    const partialsDir = path.join(TMP_DIR, 'partials')
    ensureDir(partialsDir)
    fs.writeFileSync(
      path.join(partialsDir, 'style-ref.hbs'),
      '→ 参考 [{{name}} 规范](dimensions/{{key}}/quick-reference.md)',
      'utf-8',
    )
    registerPartialsDir(partialsDir)

    const tmplPath = path.join(TMP_DIR, 'partial-test.md.tmpl')
    const outPath = path.join(TMP_DIR, 'partial-test.md')
    fs.writeFileSync(tmplPath, '### 框架规范\n{{> style-ref}}', 'utf-8')

    renderTemplate(tmplPath, { name: 'Angular', key: 'angular' }, outPath)

    const result = fs.readFileSync(outPath, 'utf-8')
    expect(result).toBe('### 框架规范\n→ 参考 [Angular 规范](dimensions/angular/quick-reference.md)')
  })
})

// ─── registerPartialsDir ──────────────────────────────────────────

describe('registerPartialsDir', () => {
  it('应注册目录下的所有 .hbs 文件为 partial', () => {
    const partialsDir = path.join(TMP_DIR, 'my-partials')
    ensureDir(partialsDir)
    fs.writeFileSync(
      path.join(partialsDir, 'header.hbs'),
      '# {{title}}',
      'utf-8',
    )
    fs.writeFileSync(
      path.join(partialsDir, 'footer.hbs'),
      '---\nend',
      'utf-8',
    )

    registerPartialsDir(partialsDir)

    expect(Handlebars.partials.header).toBe('# {{title}}')
    expect(Handlebars.partials.footer).toBe('---\nend')
  })

  it('只注册 .hbs 文件，跳过其他文件', () => {
    const partialsDir = path.join(TMP_DIR, 'mixed')
    ensureDir(partialsDir)
    fs.writeFileSync(path.join(partialsDir, 'valid.hbs'), 'content', 'utf-8')
    fs.writeFileSync(path.join(partialsDir, 'readme.md'), 'not a partial', 'utf-8')
    fs.writeFileSync(path.join(partialsDir, 'script.js'), 'not a partial', 'utf-8')

    registerPartialsDir(partialsDir)

    expect(Handlebars.partials.valid).toBe('content')
    expect(Handlebars.partials.readme).toBeUndefined()
    expect(Handlebars.partials.script).toBeUndefined()
  })

  it('目录不存在时应静默跳过', () => {
    expect(() => registerPartialsDir('/nonexistent/partials')).not.toThrow()
  })
})

// ─── copyVariants ────────────────────────────────────────────────

describe('copyVariants', () => {
  it('应将选中变体的文件复制到目标目录', () => {
    ensureDir(path.join(TMP_DIR, 'variants', 'angular'))
    fs.writeFileSync(
      path.join(TMP_DIR, 'variants', 'angular', 'quick-reference.md'),
      '# Angular',
      'utf-8',
    )
    ensureDir(path.join(TMP_DIR, 'variants', 'angular', 'examples'))
    fs.writeFileSync(
      path.join(TMP_DIR, 'variants', 'angular', 'examples', 'form.md'),
      '# Form',
      'utf-8',
    )

    const target = path.join(TMP_DIR, 'output')
    copyVariants(path.join(TMP_DIR, 'variants'), 'angular', target)

    expect(
      fs.readFileSync(path.join(target, 'quick-reference.md'), 'utf-8'),
    ).toBe('# Angular')
    expect(
      fs.readFileSync(path.join(target, 'examples', 'form.md'), 'utf-8'),
    ).toBe('# Form')
  })

  it('变体目录不存在时应静默跳过', () => {
    const target = path.join(TMP_DIR, 'output')
    ensureDir(target)

    // 应该不抛错
    copyVariants(path.join(TMP_DIR, 'variants'), 'nonexistent', target)
  })

  it('clean=true 时应先清空目标目录', () => {
    ensureDir(path.join(TMP_DIR, 'variants', 'react'))
    fs.writeFileSync(
      path.join(TMP_DIR, 'variants', 'react', 'readme.md'),
      '# React',
      'utf-8',
    )

    ensureDir(path.join(TMP_DIR, 'variants', 'angular'))
    fs.writeFileSync(
      path.join(TMP_DIR, 'variants', 'angular', 'readme.md'),
      '# Angular',
      'utf-8',
    )

    // 先装 angular 的旧内容
    const target = path.join(TMP_DIR, 'output')
    copyVariants(path.join(TMP_DIR, 'variants'), 'angular', target)
    expect(fs.readFileSync(path.join(target, 'readme.md'), 'utf-8')).toBe(
      '# Angular',
    )

    // clean=true 切换 react
    copyVariants(path.join(TMP_DIR, 'variants'), 'react', target, true)
    expect(fs.readFileSync(path.join(target, 'readme.md'), 'utf-8')).toBe(
      '# React',
    )
  })
})

// ─── copyFragments ───────────────────────────────────────────────

describe('copyFragments', () => {
  it('应将选中 fragment 的维度文件复制到目标目录', () => {
    // 模拟 fragment 源目录：fragments/framework/angular/quick-reference.md
    ensureDir(path.join(TMP_DIR, 'fragments', 'framework', 'angular'))
    fs.writeFileSync(
      path.join(TMP_DIR, 'fragments', 'framework', 'angular', 'quick-reference.md'),
      '# Angular 规范',
      'utf-8',
    )
    ensureDir(path.join(TMP_DIR, 'fragments', 'framework', 'angular', 'examples'))
    fs.writeFileSync(
      path.join(TMP_DIR, 'fragments', 'framework', 'angular', 'examples', 'component.ts'),
      '// 示例',
      'utf-8',
    )
    // 不应该被复制的
    ensureDir(path.join(TMP_DIR, 'fragments', 'framework', 'react'))
    fs.writeFileSync(
      path.join(TMP_DIR, 'fragments', 'framework', 'react', 'quick-reference.md'),
      '# React 规范',
      'utf-8',
    )

    const selectedFragments = [
      { category: 'framework', value: 'angular' },
    ]
    const target = path.join(TMP_DIR, 'dimensions')

    copyFragments(
      path.join(TMP_DIR, 'fragments'),
      selectedFragments,
      target,
    )

    expect(fs.existsSync(path.join(target, 'framework', 'angular', 'quick-reference.md'))).toBe(true)
    expect(fs.existsSync(path.join(target, 'framework', 'angular', 'examples', 'component.ts'))).toBe(true)
    // react 不应该被复制
    expect(fs.existsSync(path.join(target, 'framework', 'react'))).toBe(false)
  })

  it('应复制多个维度的选中 fragment', () => {
    ensureDir(path.join(TMP_DIR, 'fragments', 'ts-config', 'strict'))
    fs.writeFileSync(
      path.join(TMP_DIR, 'fragments', 'ts-config', 'strict', 'quick-reference.md'),
      '# TS Strict',
      'utf-8',
    )
    ensureDir(path.join(TMP_DIR, 'fragments', 'css', 'tailwind'))
    fs.writeFileSync(
      path.join(TMP_DIR, 'fragments', 'css', 'tailwind', 'quick-reference.md'),
      '# Tailwind',
      'utf-8',
    )

    const selectedFragments = [
      { category: 'ts-config', value: 'strict' },
      { category: 'css', value: 'tailwind' },
    ]
    const target = path.join(TMP_DIR, 'dimensions')

    copyFragments(
      path.join(TMP_DIR, 'fragments'),
      selectedFragments,
      target,
    )

    expect(fs.existsSync(path.join(target, 'ts-config', 'strict', 'quick-reference.md'))).toBe(true)
    expect(fs.existsSync(path.join(target, 'css', 'tailwind', 'quick-reference.md'))).toBe(true)
  })

  it('fragment 目录不存在时应静默跳过', () => {
    const selectedFragments = [
      { category: 'nonexistent', value: 'something' },
    ]
    const target = path.join(TMP_DIR, 'dimensions')

    // 应该不抛错
    copyFragments(
      path.join(TMP_DIR, 'fragments'),
      selectedFragments,
      target,
    )
    expect(fs.existsSync(target)).toBe(false)
  })
})

// ─── registry ────────────────────────────────────────────────────

describe('findAffectedTemplates', () => {
  const sampleRegistry: Registry = {
    version: '1',
    tools: { reef: { label: '开发侧', description: '' } },
    wizards: {
      reef: {
        tool: 'reef',
        label: '开发侧',
        description: '',
        questions: [
          {
            key: 'reef.frontend.framework',
            label: '前端框架',
            type: 'select',
            options: [
              {
                value: 'angular',
                label: 'Angular',
                template: { label: 'Angular 21' },
                affectedTemplates: [
                  'skills/reef-style-frontend/SKILL.md.tmpl',
                  'agents/reef-review-frontend.md.tmpl',
                ],
              },
              {
                value: 'react',
                label: 'React',
                template: { label: 'React 19' },
                affectedTemplates: [
                  'skills/reef-style-frontend/SKILL.md.tmpl',
                  'agents/reef-review-frontend.md.tmpl',
                ],
              },
            ],
          },
          {
            key: 'reef.backend.language',
            label: '后端语言',
            type: 'select',
            options: [
              {
                value: 'java',
                label: 'Java',
                template: { label: 'Java 25' },
                affectedTemplates: [
                  'skills/reef-style-backend/SKILL.md.tmpl',
                  'agents/reef-review-backend.md.tmpl',
                ],
              },
            ],
          },
        ],
      },
    },
    skills: {},
  }

  it('应返回指定 config key 的受影响模板列表', () => {
    const result = findAffectedTemplates(
      sampleRegistry,
      'reef.frontend.framework',
    )
    expect(result).toContain('skills/reef-style-frontend/SKILL.md.tmpl')
    expect(result).toContain('agents/reef-review-frontend.md.tmpl')
  })

  it('应返回去重后的模板列表', () => {
    const result = findAffectedTemplates(
      sampleRegistry,
      'reef.frontend.framework',
    )
    // angular 和 react 的 affectedTemplates 有重复，应去重
    expect(
      result.filter((t) => t === 'skills/reef-style-frontend/SKILL.md.tmpl').length,
    ).toBe(1)
  })

  it('不存在的 config key 应返回空数组', () => {
    const result = findAffectedTemplates(sampleRegistry, 'tide.something')
    expect(result).toEqual([])
  })
})

describe('buildTemplateVariables', () => {
  const sampleRegistry: Registry = {
    version: '1',
    tools: { reef: { label: '开发侧', description: '' } },
    wizards: {
      reef: {
        tool: 'reef',
        label: '开发侧',
        description: '',
        questions: [
          {
            key: 'reef.frontend.framework',
            label: '前端框架',
            type: 'select',
            options: [
              {
                value: 'angular',
                label: 'Angular',
                template: {
                  label: 'Angular 21 + TypeScript',
                  buildTool: 'pnpm:*',
                },
                affectedTemplates: [],
              },
            ],
          },
        ],
      },
    },
    skills: {},
  }

  it('应生成正确的扁平模板变量映射', () => {
    const vars = buildTemplateVariables(sampleRegistry, {
      'reef.frontend.framework': 'angular',
    })
    expect(vars['reef.frontend.framework.label']).toBe(
      'Angular 21 + TypeScript',
    )
    expect(vars['reef.frontend.framework.buildTool']).toBe('pnpm:*')
  })

  it('无 template 数据的选项应跳过', () => {
    const emptyRegistry: Registry = {
      version: '1',
      tools: {},
      wizards: {},
      skills: {},
    }
    const vars = buildTemplateVariables(emptyRegistry, {
      'reef.frontend.framework': 'angular',
    })
    expect(Object.keys(vars).length).toBe(0)
  })

  it('应注入已安装 MCP 服务的 mcp.{name} 为 true', () => {
    const registryWithMcp: Registry = {
      version: '1',
      tools: {},
      wizards: {},
      skills: {},
      mcpTools: {
        jira: { domain: 'project-management', label: 'Jira', description: '' },
        github: { domain: 'code-hosting', label: 'GitHub', description: '' },
        figma: { domain: 'design-tools', label: 'Figma', description: '' },
      },
    }

    const vars = buildTemplateVariables(registryWithMcp, {}, ['jira', 'github'])

    // 工具级变量
    expect(vars['mcp.jira']).toBe('true')
    expect(vars['mcp.github']).toBe('true')
    expect(vars['mcp.figma']).toBe('false')
    // 领域级变量：任一工具安装则为 true
    expect(vars['mcp.project-management']).toBe('true')
    expect(vars['mcp.code-hosting']).toBe('true')
    expect(vars['mcp.design-tools']).toBe('false')
  })

  it('未安装的 MCP 服务应注入为 false', () => {
    const registryWithMcp: Registry = {
      version: '1',
      tools: {},
      wizards: {},
      skills: {},
      mcpTools: {
        jira: { domain: 'project-management', label: 'Jira', description: '' },
        github: { domain: 'code-hosting', label: 'GitHub', description: '' },
      },
    }

    const vars = buildTemplateVariables(registryWithMcp, {})

    expect(vars['mcp.jira']).toBe('false')
    expect(vars['mcp.github']).toBe('false')
    expect(vars['mcp.project-management']).toBe('false')
    expect(vars['mcp.code-hosting']).toBe('false')
  })

  it('同一领域有多个工具时正确计算领域状态', () => {
    const registryWithMcp: Registry = {
      version: '1',
      tools: {},
      wizards: {},
      skills: {},
      mcpTools: {
        jira: { domain: 'project-management', label: 'Jira', description: '' },
        linear: { domain: 'project-management', label: 'Linear', description: '' },
        github: { domain: 'code-hosting', label: 'GitHub', description: '' },
      },
    }

    // jira 已安装，linear 未安装 → 领域应该为 true
    const vars = buildTemplateVariables(registryWithMcp, {}, ['jira'])

    expect(vars['mcp.jira']).toBe('true')
    expect(vars['mcp.linear']).toBe('false')
    expect(vars['mcp.project-management']).toBe('true')
    expect(vars['mcp.code-hosting']).toBe('false')
  })

  it('registry 无 mcpTools 时不应注入 mcp 变量', () => {
    const registryNoMcp: Registry = {
      version: '1',
      tools: {},
      wizards: {},
      skills: {},
    }

    const vars = buildTemplateVariables(registryNoMcp, {})
    expect(Object.keys(vars).filter((k) => k.startsWith('mcp.'))).toHaveLength(0)
  })
})
