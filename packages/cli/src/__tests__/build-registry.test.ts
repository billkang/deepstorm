import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { buildRegistry } from '../build-registry'

describe('buildRegistry', () => {
  let tmpDir: string
  let cliDir: string
  let packagesDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepstorm-build-reg-'))

    // 模拟仓库结构: root/packages/cli + root/packages/{reef,tide}
    packagesDir = path.join(tmpDir, 'packages')
    fs.mkdirSync(packagesDir, { recursive: true })

    // CLI 目录
    cliDir = path.join(packagesDir, 'cli')
    fs.mkdirSync(path.join(cliDir, 'dist'), { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  /**
   * Helper: 创建一个带有 SKILL.md 的 skill 目录
   */
  function createSkill(pkg: string, skillId: string, frontmatter: Record<string, unknown>): void {
    const fmStr = Object.entries(frontmatter)
      .map(([k, v]) => {
        if (typeof v === 'object' && v !== null) {
          const subLines = Object.entries(v as Record<string, unknown>)
            .map(([sk, sv]) => `    ${sk}: ${sv}`)
            .join('\n')
          return `${k}:\n${subLines}`
        }
        return `${k}: ${v}`
      })
      .join('\n')

    const skillsDir = path.join(packagesDir, pkg, 'skills', skillId)
    fs.mkdirSync(skillsDir, { recursive: true })
    fs.writeFileSync(
      path.join(skillsDir, 'SKILL.md'),
      `---\nname: ${skillId}\n${fmStr}\n---\n\n# ${skillId} content\n`,
      'utf-8',
    )
  }

  /**
   * Helper: 创建 wizard.json
   */
  function createWizard(pkg: string, wizard: Record<string, unknown>): void {
    fs.mkdirSync(path.join(packagesDir, pkg), { recursive: true })
    fs.writeFileSync(
      path.join(packagesDir, pkg, 'wizard.json'),
      JSON.stringify(wizard),
      'utf-8',
    )
  }

  /**
   * Helper: 创建 agent 文件
   */
  function createAgent(pkg: string, agentFile: string): void {
    const agentsDir = path.join(packagesDir, pkg, 'agents')
    fs.mkdirSync(agentsDir, { recursive: true })
    fs.writeFileSync(path.join(agentsDir, agentFile), `# ${agentFile}\n`, 'utf-8')
  }

  /**
   * Helper: 创建 hook 文件
   */
  function createHook(pkg: string, hookFile: string): void {
    const hooksDir = path.join(packagesDir, pkg, 'hooks')
    fs.mkdirSync(hooksDir, { recursive: true })
    fs.writeFileSync(path.join(hooksDir, hookFile), `# ${hookFile} content\n`, 'utf-8')
  }

  /**
   * Helper: 创建 hooks.json（带有效的 hooks 声明）
   */
  function createHooksJson(pkg: string, content: Record<string, unknown>): void {
    const hooksDir = path.join(packagesDir, pkg, 'hooks')
    fs.mkdirSync(hooksDir, { recursive: true })
    fs.writeFileSync(path.join(hooksDir, 'hooks.json'), JSON.stringify(content, null, 2), 'utf-8')
  }

  /**
   * Helper: 创建 wizard.json（很多 assets 测试都依赖 wizard 来注册 tool）
   */
  function ensureWizard(pkg: string): void {
    const wizardPath = path.join(packagesDir, pkg, 'wizard.json')
    if (!fs.existsSync(wizardPath)) {
      createWizard(pkg, { tool: pkg, questions: [] })
    }
  }

  // ─────────────── 测试用例 ───────────────

  it('无 packages 子包时生成最小 registry', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    const registryPath = path.join(cliDir, 'dist', 'registry.json')
    expect(fs.existsSync(registryPath)).toBe(true)

    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'))
    expect(registry.version).toBe('1')
    expect(registry.tools).toEqual({})
    expect(registry.wizards).toEqual({})
    expect(registry.skills).toEqual({})

    consoleSpy.mockRestore()
  })

  it('扫描 SKILL.md frontmatter 并注册 skill', () => {
    createSkill('reef', 'reef-style-frontend', {
      description: '前端编码规范',
      deepstorm: { tool: 'reef', configKey: 'reef.frontend.framework', configValue: 'angular' },
    })
    createSkill('reef', 'reef-style-backend', {
      description: '后端编码规范',
      deepstorm: { tool: 'reef', configKey: 'reef.backend.language', configValue: 'java' },
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    const registry = JSON.parse(fs.readFileSync(path.join(cliDir, 'dist', 'registry.json'), 'utf-8'))
    expect(Object.keys(registry.skills)).toHaveLength(2)
    expect(registry.skills['reef-style-frontend'].configValue).toBe('angular')
    expect(registry.skills['reef-style-backend'].configValue).toBe('java')

    consoleSpy.mockRestore()
  })

  it('扫描 SKILL.md.tmpl 并标记 hasTemplate', () => {
    // 创建只有 .tmpl 文件的 skill
    const pkg = 'reef'
    const skillId = 'reef-template-skill'
    const skillsDir = path.join(packagesDir, pkg, 'skills', skillId)
    fs.mkdirSync(skillsDir, { recursive: true })
    const fmStr = `name: ${skillId}\ndeepstorm:\n  tool: reef\n  configKey: reef.test\n  configValue: vitest`
    fs.writeFileSync(
      path.join(skillsDir, 'SKILL.md.tmpl'),
      `---\n${fmStr}\n---\n\n{{content}}\n`,
      'utf-8',
    )

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    const registry = JSON.parse(fs.readFileSync(path.join(cliDir, 'dist', 'registry.json'), 'utf-8'))
    expect(registry.skills[skillId].hasTemplate).toBe(true)

    consoleSpy.mockRestore()
  })

  it('扫描 wizard.json 并注册工具和向导', () => {
    createWizard('reef', {
      tool: 'reef',
      questions: [{ key: 'reef.frontend.framework', label: '前端框架', type: 'select', options: [] }],
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    const registry = JSON.parse(fs.readFileSync(path.join(cliDir, 'dist', 'registry.json'), 'utf-8'))
    expect(registry.tools.reef).toBeDefined()
    expect(registry.tools.reef.label).toBe('开发侧')
    expect(registry.wizards.reef).toBeDefined()
    expect(registry.wizards.reef.tool).toBe('reef')

    consoleSpy.mockRestore()
  })

  it('解析无效的 wizard.json 时应跳过而不崩溃', () => {
    fs.mkdirSync(path.join(packagesDir, 'reef'), { recursive: true })
    fs.writeFileSync(path.join(packagesDir, 'reef', 'wizard.json'), 'invalid json', 'utf-8')

    // 这个测试不应抛出异常
    expect(() => buildRegistry(cliDir)).not.toThrow()
  })

  it('wizard.json 缺少 tool 或 questions 字段时应跳过', () => {
    createWizard('reef', { label: '仅标签', description: '' })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    const registry = JSON.parse(fs.readFileSync(path.join(cliDir, 'dist', 'registry.json'), 'utf-8'))
    expect(Object.keys(registry.wizards)).toHaveLength(0)

    consoleSpy.mockRestore()
  })

  it('扫描 MCP JSON 文件并注册 mcpTools', () => {
    // 创建 CLI 的 MCP JSON 配置
    const mcpDir = path.join(cliDir, 'mcp')
    fs.mkdirSync(mcpDir, { recursive: true })
    fs.writeFileSync(
      path.join(mcpDir, 'github.json'),
      JSON.stringify({
        name: 'github',
        domain: 'code-hosting',
        label: 'GitHub',
        description: '源码托管',
      }),
      'utf-8',
    )
    fs.writeFileSync(
      path.join(mcpDir, 'jira.json'),
      JSON.stringify({
        name: 'jira',
        domain: 'project-management',
        label: 'Jira',
        description: '任务跟踪',
      }),
      'utf-8',
    )

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    const registry = JSON.parse(fs.readFileSync(path.join(cliDir, 'dist', 'registry.json'), 'utf-8'))
    expect(Object.keys(registry.mcpTools!)).toHaveLength(2)
    expect(registry.mcpTools!['github'].domain).toBe('code-hosting')
    expect(registry.mcpTools!['jira'].label).toBe('Jira')

    consoleSpy.mockRestore()
  })

  it('MCP JSON 缺少 name/domain/label 时应跳过', () => {
    const mcpDir = path.join(cliDir, 'mcp')
    fs.mkdirSync(mcpDir, { recursive: true })
    fs.writeFileSync(
      path.join(mcpDir, 'invalid.json'),
      JSON.stringify({ description: '不完整' }),
      'utf-8',
    )

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    const registry = JSON.parse(fs.readFileSync(path.join(cliDir, 'dist', 'registry.json'), 'utf-8'))
    expect(Object.keys(registry.mcpTools!)).toHaveLength(0)

    consoleSpy.mockRestore()
  })

  it('扫描 agents 和 hooks 归属到 toolAssets（hooks.json 是元数据，不作为 hook 脚本注册）', () => {
    createWizard('reef', {
      tool: 'reef',
      questions: [{ key: 'test', label: 'Test', type: 'select', options: [] }],
    })
    createAgent('reef', 'reef-review-frontend.md')
    createAgent('reef', 'reef-review-backend.md')
    createHook('reef', 'reef-auto-format.sh')

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    const registry = JSON.parse(fs.readFileSync(path.join(cliDir, 'dist', 'registry.json'), 'utf-8'))
    expect(registry.toolAssets!.reef).toBeDefined()
    expect(registry.toolAssets!.reef.agents).toContain('reef-review-frontend.md')
    expect(registry.toolAssets!.reef.agents).toContain('reef-review-backend.md')
    expect(registry.toolAssets!.reef.hooks).not.toContain('hooks.json')
    expect(registry.toolAssets!.reef.hooks).toContain('reef-auto-format.sh')

    consoleSpy.mockRestore()
  })

  it('SKILL.md 缺少 deepstorm 字段时跳过注册', () => {
    createSkill('reef', 'no-deepstorm-skill', {
      description: '没有 deepstorm 字段的 skill',
      // 故意不加 deepstorm
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    const registry = JSON.parse(fs.readFileSync(path.join(cliDir, 'dist', 'registry.json'), 'utf-8'))
    expect(registry.skills['no-deepstorm-skill']).toBeUndefined()

    consoleSpy.mockRestore()
  })

  it('SKILL.md 缺少 SKILL.md/SKILL.md.tmpl 时跳过', () => {
    const pkg = 'reef'
    const skillId = 'empty-dir-skill'
    const skillsDir = path.join(packagesDir, pkg, 'skills', skillId)
    fs.mkdirSync(skillsDir, { recursive: true })
    // 不创建 SKILL.md 或 .tmpl

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    const registry = JSON.parse(fs.readFileSync(path.join(cliDir, 'dist', 'registry.json'), 'utf-8'))
    expect(registry.skills[skillId]).toBeUndefined()

    consoleSpy.mockRestore()
  })

  it('从 packages 复制 skills/agents/mcp/hooks 到 dist/', () => {
    // 创建 reef 包的 skills/agents/hooks
    createSkill('reef', 'reef-style-frontend', {
      description: '前端规范',
      deepstorm: { tool: 'reef', configKey: 'reef.frontend.framework', configValue: 'angular' },
    })
    createAgent('reef', 'reef-review-frontend.md')
    createHooksJson('reef', {
      hooks: {
        PreToolUse: [
          { matcher: 'Bash', hooks: [{ type: 'command', command: 'bash reef-pre.sh' }] },
        ],
      },
    })

    // 创建 tide 包的 skills + hooks
    createSkill('tide', 'tide-prd', {
      description: 'PRD 生成',
      deepstorm: { tool: 'tide' },
    })
    createHooksJson('tide', {
      hooks: {
        SessionStart: [
          { hooks: [{ type: 'command', command: 'bash tide-preload.sh' }] },
        ],
      },
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    // 验证 dist/skills/
    expect(fs.existsSync(path.join(cliDir, 'dist', 'skills', 'reef-style-frontend', 'SKILL.md'))).toBe(true)
    expect(fs.existsSync(path.join(cliDir, 'dist', 'skills', 'tide-prd', 'SKILL.md'))).toBe(true)

    // 验证 dist/agents/
    expect(fs.existsSync(path.join(cliDir, 'dist', 'agents', 'reef-review-frontend.md'))).toBe(true)

    // 验证 dist/hooks/ — 各包分别保存为 {tool}-hooks.json
    expect(fs.existsSync(path.join(cliDir, 'dist', 'hooks', 'reef-hooks.json'))).toBe(true)
    expect(fs.existsSync(path.join(cliDir, 'dist', 'hooks', 'tide-hooks.json'))).toBe(true)
    expect(fs.existsSync(path.join(cliDir, 'dist', 'hooks', 'hooks.json'))).toBe(false)

    consoleSpy.mockRestore()
  })

  it('skills 复制：源目录更新时按 mtime 触发强制覆盖', () => {
    createSkill('reef', 'reef-style', {
      description: '前端规范',
      deepstorm: { tool: 'reef' },
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    // 首次构建：复制到 dist
    buildRegistry(cliDir)
    const skillFile = path.join(cliDir, 'dist', 'skills', 'reef-style', 'SKILL.md')
    expect(fs.existsSync(skillFile)).toBe(true)
    const destContentV1 = fs.readFileSync(skillFile, 'utf-8')

    // 更新源目录中的 SKILL.md → 同时推进源目录的 mtime 到未来（保证 > dest）
    const srcDirPath = path.join(packagesDir, 'reef', 'skills', 'reef-style')
    const srcFile = path.join(srcDirPath, 'SKILL.md')
    fs.writeFileSync(
      srcFile,
      '---\nname: reef-style-updated\ndeepstorm:\n  tool: reef\n---\n\nUpdated content\n',
      'utf-8',
    )
    const futureSec = (Date.now() + 30_000) / 1000
    fs.utimesSync(srcDirPath, futureSec, futureSec)

    // 第二次构建：mtime 判断 src_dir > dest_dir → 强制复制
    buildRegistry(cliDir)

    const destContentV2 = fs.readFileSync(skillFile, 'utf-8')
    expect(destContentV2).toContain('Updated content')
    expect(destContentV2).not.toBe(destContentV1)

    consoleSpy.mockRestore()
  })

  it('skills 复制：目标目录 mtime ≥ 源目录时跳过复制', () => {
    createSkill('reef', 'reef-style', {
      description: '前端规范',
      deepstorm: { tool: 'reef' },
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    // 首次构建：复制到 dist
    buildRegistry(cliDir)
    const skillFile = path.join(cliDir, 'dist', 'skills', 'reef-style', 'SKILL.md')
    const destDirPath = path.join(cliDir, 'dist', 'skills', 'reef-style')

    // 修改 dest 文件，模拟外部手动编辑
    fs.writeFileSync(skillFile, '# manually edited content\n', 'utf-8')
    // 将目标目录 mtime 设为未来时间，使 dest_dir > src_dir
    const futureTs = Date.now() + 30_000
    fs.utimesSync(destDirPath, futureTs / 1000, futureTs / 1000)

    // 第二次构建：src_dir.mtime ≤ dest_dir.mtime → 跳过
    buildRegistry(cliDir)

    const contentAfter = fs.readFileSync(skillFile, 'utf-8')
    expect(contentAfter).toBe('# manually edited content\n')

    consoleSpy.mockRestore()
  })

  it('skills 复制：多个 skill 混合更新和跳过', () => {
    createSkill('reef', 'reef-style', {
      description: '前端规范',
      deepstorm: { tool: 'reef' },
    })
    createSkill('reef', 'reef-test', {
      description: '测试规范',
      deepstorm: { tool: 'reef' },
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    // 首次构建：两个 skill 都复制到 dist
    buildRegistry(cliDir)

    const styleDest = path.join(cliDir, 'dist', 'skills', 'reef-style', 'SKILL.md')
    const testDest = path.join(cliDir, 'dist', 'skills', 'reef-test', 'SKILL.md')

    // 对 reef-test：推进目标目录 mtime（dest_dir > src_dir → 跳过）
    const testDestDir = path.join(cliDir, 'dist', 'skills', 'reef-test')
    const futureTs = Date.now() + 30_000
    fs.utimesSync(testDestDir, futureTs / 1000, futureTs / 1000)

    // 对 reef-style：更新源目录 mtime（src_dir > dest_dir → 更新）
    const styleSrcDir = path.join(packagesDir, 'reef', 'skills', 'reef-style')
    fs.writeFileSync(
      path.join(styleSrcDir, 'SKILL.md'),
      '---\nname: reef-style-updated\ndeepstorm:\n  tool: reef\n---\n\nUpdated\n',
      'utf-8',
    )
    fs.utimesSync(styleSrcDir, Date.now() / 1000, Date.now() / 1000)

    // 第二次构建
    buildRegistry(cliDir)

    // reef-style 应更新（src_dir.dest > dest_dir.mtime）
    const styleContent = fs.readFileSync(styleDest, 'utf-8')
    expect(styleContent).toContain('Updated')

    // reef-test 应跳过（dest_dir.mtime > src_dir.mtime）
    const testContent = fs.readFileSync(testDest, 'utf-8')
    expect(testContent).not.toContain('Updated')

    consoleSpy.mockRestore()
  })

  it('skills 复制：源目录 mtime 等于目标目录 mtime 时跳过', () => {
    createSkill('reef', 'reef-style', {
      description: '前端规范',
      deepstorm: { tool: 'reef' },
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    // 首次构建
    buildRegistry(cliDir)
    const skillFile = path.join(cliDir, 'dist', 'skills', 'reef-style', 'SKILL.md')

    // — 让 dest_dir.mtime = src_dir.mtime（相等） —
    const srcDirPath = path.join(packagesDir, 'reef', 'skills', 'reef-style')
    const srcDirMtime = fs.statSync(srcDirPath).mtimeMs
    const destDirPath = path.join(cliDir, 'dist', 'skills', 'reef-style')
    fs.utimesSync(destDirPath, srcDirMtime / 1000, srcDirMtime / 1000)

    // 验证相等（mtimeMs 可能有亚毫秒差异，用 toBeCloseTo 容忍 2ms）
    expect(fs.statSync(srcDirPath).mtimeMs).toBeCloseTo(
      fs.statSync(destDirPath).mtimeMs,
      -2,
    )

    // 修改 dest 内容，模拟手动编辑
    fs.writeFileSync(skillFile, '# manual edit preserved\n', 'utf-8')
    // 重新把 dest_dir.mtime 设回与 src_dir 相等（writeFileSync 不会影响父目录 mtime）
    // macOS 上 writeFileSync 改已有文件不更新父目录 mtime，但以防万一

    // 第二次构建：src_dir.mtime === dest_dir.mtime → 跳过
    buildRegistry(cliDir)

    const contentAfter = fs.readFileSync(skillFile, 'utf-8')
    expect(contentAfter).toContain('manual edit preserved')

    consoleSpy.mockRestore()
  })

  it('复制 cli/mcp/ 到 dist/mcp/', () => {
    const mcpDir = path.join(cliDir, 'mcp', 'code-hosting')
    fs.mkdirSync(mcpDir, { recursive: true })
    fs.writeFileSync(path.join(mcpDir, 'github.json'), JSON.stringify({ name: 'github' }), 'utf-8')

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    expect(fs.existsSync(path.join(cliDir, 'dist', 'mcp', 'code-hosting', 'github.json'))).toBe(true)

    consoleSpy.mockRestore()
  })

  it('更新 cli/mcp/ 源文件后应覆盖 dist/mcp/ 中的旧文件', () => {
    // 首次构建：复制初始内容到 dist
    const mcpDir = path.join(cliDir, 'mcp', 'docs-reference')
    fs.mkdirSync(mcpDir, { recursive: true })
    fs.writeFileSync(
      path.join(mcpDir, 'context7.json'),
      JSON.stringify({ name: 'context7', envStubs: [] }),
      'utf-8',
    )

    const distFile = path.join(cliDir, 'dist', 'mcp', 'docs-reference', 'context7.json')
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    // 初始内容已验证
    let content = JSON.parse(fs.readFileSync(distFile, 'utf-8'))
    expect(content.name).toBe('context7')
    expect(content.mcpServers).toBeUndefined()

    // 更新源文件，增加 mcpServers 字段
    fs.writeFileSync(
      path.join(mcpDir, 'context7.json'),
      JSON.stringify({
        name: 'context7',
        envStubs: [],
        mcpServers: { context7: { type: 'stdio', command: 'npx', args: [] } },
      }),
      'utf-8',
    )

    // 第二次构建：应覆盖 dist 中的旧文件
    buildRegistry(cliDir)

    content = JSON.parse(fs.readFileSync(distFile, 'utf-8'))
    expect(content.mcpServers).toBeDefined()
    expect(content.mcpServers.context7.type).toBe('stdio')

    consoleSpy.mockRestore()
  })

  it('更新 cli/mcp-skills/ 源文件后应覆盖 dist/mcp-skills/ 中的旧文件', () => {
    // 首次构建：复制初始 mcp-skill 到 dist
    const mcpSkillsDir = path.join(cliDir, 'mcp-skills', 'deepstorm-mcp-test')
    fs.mkdirSync(mcpSkillsDir, { recursive: true })
    fs.writeFileSync(path.join(mcpSkillsDir, 'SKILL.md'), '# old content', 'utf-8')

    const distSkillFile = path.join(cliDir, 'dist', 'mcp-skills', 'deepstorm-mcp-test', 'SKILL.md')
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)
    expect(fs.readFileSync(distSkillFile, 'utf-8')).toBe('# old content')

    // 更新源文件
    fs.writeFileSync(path.join(mcpSkillsDir, 'SKILL.md'), '# updated content', 'utf-8')

    // 第二次构建：应覆盖
    buildRegistry(cliDir)
    expect(fs.readFileSync(distSkillFile, 'utf-8')).toBe('# updated content')

    consoleSpy.mockRestore()
  })

  it('更新 cli/env-examples/ 源文件后应覆盖 dist/env-examples/ 中的旧文件', () => {
    // 首次构建：复制初始 env-example 到 dist
    const envDir = path.join(cliDir, 'env-examples')
    fs.mkdirSync(envDir, { recursive: true })
    fs.writeFileSync(path.join(envDir, 'playwright.env'), '# Playwright MCP — 连接地址已硬编码在 .mcp.json 中\n', 'utf-8')

    const distEnvFile = path.join(cliDir, 'dist', 'env-examples', 'playwright.env')
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    let content = fs.readFileSync(distEnvFile, 'utf-8')
    expect(content).toBe('# Playwright MCP — 连接地址已硬编码在 .mcp.json 中\n')

    // 更新源文件
    fs.writeFileSync(path.join(envDir, 'playwright.env'), '# Playwright MCP — 已更新配置\n', 'utf-8')

    // 第二次构建：应覆盖
    buildRegistry(cliDir)

    content = fs.readFileSync(distEnvFile, 'utf-8')
    expect(content).toBe('# Playwright MCP — 已更新配置\n')

    consoleSpy.mockRestore()
  })

  it('复制 cli/mcp-skills/ 到 dist/mcp-skills/', () => {
    const mcpSkillsDir = path.join(cliDir, 'mcp-skills', 'deepstorm-mcp-jira-read')
    fs.mkdirSync(mcpSkillsDir, { recursive: true })
    fs.writeFileSync(path.join(mcpSkillsDir, 'SKILL.md'), '# Jira Read', 'utf-8')

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    expect(fs.existsSync(path.join(cliDir, 'dist', 'mcp-skills', 'deepstorm-mcp-jira-read', 'SKILL.md'))).toBe(true)

    consoleSpy.mockRestore()
  })

  it('复制 cli/env-examples/ 到 dist/env-examples/', () => {
    const envDir = path.join(cliDir, 'env-examples')
    fs.mkdirSync(envDir, { recursive: true })
    fs.writeFileSync(path.join(envDir, 'github.env'), 'GITHUB_TOKEN=your_token_here', 'utf-8')

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    expect(fs.existsSync(path.join(cliDir, 'dist', 'env-examples', 'github.env'))).toBe(true)

    consoleSpy.mockRestore()
  })

  it('复制 config-schema.json 到 dist/', () => {
    fs.writeFileSync(
      path.join(cliDir, 'config-schema.json'),
      JSON.stringify({ validKeys: [] }),
      'utf-8',
    )

    buildRegistry(cliDir)

    expect(fs.existsSync(path.join(cliDir, 'dist', 'config-schema.json'))).toBe(true)
  })

  it('扫描 .tmpl agent 文件时自动去除 .tmpl 后缀', () => {
    createWizard('reef', {
      tool: 'reef',
      questions: [{ key: 'test', label: 'Test', type: 'select', options: [] }],
    })

    // 创建 .tmpl agent 文件
    const agentsDir = path.join(packagesDir, 'reef', 'agents')
    fs.mkdirSync(agentsDir, { recursive: true })
    fs.writeFileSync(path.join(agentsDir, 'reef-agent.md.tmpl'), '# Agent template', 'utf-8')

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    const registry = JSON.parse(fs.readFileSync(path.join(cliDir, 'dist', 'registry.json'), 'utf-8'))
    // 扫描时 .tmpl 后缀应被去除
    expect(registry.toolAssets!.reef.agents).toEqual(['reef-agent.md'])

    consoleSpy.mockRestore()
  })

  it('同时处理多个包的 assets 并去重', () => {
    createWizard('reef', {
      tool: 'reef',
      questions: [{ key: 'test', label: 'Test', type: 'select', options: [] }],
    })
    createAgent('reef', 'review-frontend.md')
    createHook('reef', 'reef-format.sh')

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    const registry = JSON.parse(fs.readFileSync(path.join(cliDir, 'dist', 'registry.json'), 'utf-8'))
    expect(registry.toolAssets!.reef.agents).toHaveLength(1)
    // hooks.json 是元数据，不在 toolAssets.hooks 中
    expect(registry.toolAssets!.reef.hooks).toHaveLength(1)

    consoleSpy.mockRestore()
  })

  it('frontmatter 解析失败时跳过 skill', () => {
    const pkg = 'reef'
    const skillId = 'bad-frontmatter'
    const skillsDir = path.join(packagesDir, pkg, 'skills', skillId)
    fs.mkdirSync(skillsDir, { recursive: true })
    fs.writeFileSync(path.join(skillsDir, 'SKILL.md'), '=== invalid frontmatter\n', 'utf-8')

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    const registry = JSON.parse(fs.readFileSync(path.join(cliDir, 'dist', 'registry.json'), 'utf-8'))
    expect(registry.skills[skillId]).toBeUndefined()

    consoleSpy.mockRestore()
  })

  it('不会复制 .DS_Store 文件', () => {
    createSkill('reef', 'reef-style', {
      description: '规范',
      deepstorm: { tool: 'reef' },
    })

    // 在多个位置创建 .DS_Store
    fs.writeFileSync(path.join(packagesDir, 'reef', 'skills', '.DS_Store'), 'fake', 'utf-8')
    fs.mkdirSync(path.join(cliDir, 'mcp'), { recursive: true })
    fs.writeFileSync(path.join(cliDir, 'mcp', '.DS_Store'), 'fake', 'utf-8')

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    // 不应因为 .DS_Store 抛出异常
    expect(() => buildRegistry(cliDir)).not.toThrow()

    // dist 中的 skill 仍应正常复制
    expect(fs.existsSync(path.join(cliDir, 'dist', 'skills', 'reef-style', 'SKILL.md'))).toBe(true)

    consoleSpy.mockRestore()
  })

  it('各包的 hooks.json 分别保存为 {tool}-hooks.json，不做构建期合并', () => {
    ensureWizard('reef')
    ensureWizard('tide')

    createHooksJson('reef', {
      hooks: {
        PreToolUse: [
          { matcher: 'Bash', hooks: [{ type: 'command', command: 'bash reef-pre.sh' }] },
        ],
      },
    })
    createHooksJson('tide', {
      hooks: {
        SessionStart: [
          { hooks: [{ type: 'command', command: 'bash tide-preload.sh' }] },
        ],
      },
    })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    // 各包分别保存
    expect(fs.existsSync(path.join(cliDir, 'dist', 'hooks', 'reef-hooks.json'))).toBe(true)
    expect(fs.existsSync(path.join(cliDir, 'dist', 'hooks', 'tide-hooks.json'))).toBe(true)
    // 不生成合并后的 hooks.json
    expect(fs.existsSync(path.join(cliDir, 'dist', 'hooks', 'hooks.json'))).toBe(false)

    const reefHooks = JSON.parse(fs.readFileSync(path.join(cliDir, 'dist', 'hooks', 'reef-hooks.json'), 'utf-8'))
    expect(reefHooks.hooks.PreToolUse).toHaveLength(1)

    const tideHooks = JSON.parse(fs.readFileSync(path.join(cliDir, 'dist', 'hooks', 'tide-hooks.json'), 'utf-8'))
    expect(tideHooks.hooks.SessionStart).toHaveLength(1)

    consoleSpy.mockRestore()
  })

  it('同名 hook 脚本文件在多个包中存在时，首次复制优先', () => {
    ensureWizard('reef')
    ensureWizard('tide')

    createHook('reef', 'shared-format.sh')
    createHook('tide', 'shared-format.sh')

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    // 同名文件只保留第一份（reef 先被扫描）
    expect(fs.existsSync(path.join(cliDir, 'dist', 'hooks', 'shared-format.sh'))).toBe(true)

    consoleSpy.mockRestore()
  })

  it('非 JSON hooks.json 文件被跳过，不影响其他包的 hooks 文件', () => {
    ensureWizard('reef')
    ensureWizard('tide')

    // tide 有有效的 hooks.json
    createHooksJson('tide', {
      hooks: {
        SessionStart: [
          { hooks: [{ type: 'command', command: 'bash tide-preload.sh' }] },
        ],
      },
    })

    // reef 有无效的 hooks.json（非 JSON 内容）
    const hooksDir = path.join(packagesDir, 'reef', 'hooks')
    fs.mkdirSync(hooksDir, { recursive: true })
    fs.writeFileSync(path.join(hooksDir, 'hooks.json'), 'not valid json', 'utf-8')

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    // tide 的内容应仍存在
    expect(fs.existsSync(path.join(cliDir, 'dist', 'hooks', 'tide-hooks.json'))).toBe(true)

    // 无效 JSON 的包，尝试复制后会生成一个带语法错误的文件，
    // 但 build 不会因此崩溃；setup 时读该文件会 JSON.parse 失败，被 mergeHooks 静默跳过
    expect(fs.existsSync(path.join(cliDir, 'dist', 'hooks', 'reef-hooks.json'))).toBe(true)

    consoleSpy.mockRestore()
  })

  it('无 hooks 声明的 hooks.json 仍被复制（setup 时会被忽略）', () => {
    ensureWizard('reef')

    // hooks.json 不含 hooks 字段
    createHooksJson('reef', { version: '1', other: 'data' })

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    buildRegistry(cliDir)

    // 不包含 hooks 字段的 hooks.json 仍会被复制
    expect(fs.existsSync(path.join(cliDir, 'dist', 'hooks', 'reef-hooks.json'))).toBe(true)

    consoleSpy.mockRestore()
  })

})
