/**
 * build-registry.ts
 *
 * DeepStorm CLI 构建工具 — 聚合 registry.json + 复制运行时数据到 dist/。
 * 被两个入口使用：
 *   1. npm run build（通过 node dist/build-registry.js 调用）
 *   2. deepstorm release build（直接 import 调用）
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import yaml from 'js-yaml'

// ---- 类型定义 ----

interface SkillEntry {
  tool?: string
  configKey?: string
  configValue?: string
  name?: string
  description?: string
  hasTemplate?: boolean
  dependencies?: string[]
}

interface ToolInfo {
  label: string
  description: string
  mcpDependencies?: string[]
}

interface McpToolEntry {
  domain: string
  label: string
  description: string
}

interface Registry {
  version: string
  tools: Record<string, ToolInfo>
  wizards: Record<string, unknown>
  skills: Record<string, SkillEntry>
  mcpTools?: Record<string, McpToolEntry>
  toolAssets?: Record<string, { agents?: string[]; hooks?: string[] }>
}

// ---- 工具标签映射 ----

const PACKAGE_LABELS: Record<string, ToolInfo> = {
  tide: { label: '产品侧', description: 'BMAD 需求讨论、PRD、Jira', mcpDependencies: ['jira', 'feishu-wiki', 'figma'] },
  reef: { label: '开发侧', description: '规范生成、代码实现', mcpDependencies: ['jira', 'feishu-wiki', 'figma', 'github', 'context7'] },
  sweep: { label: '测试侧', description: '测试生成、覆盖率、CI', mcpDependencies: ['jira', 'feishu-wiki', 'playwright'] },
  atoll: { label: '运维侧', description: '部署辅助、监控、故障排查', mcpDependencies: ['jira', 'feishu-wiki'] },
  shared: { label: '共享', description: '公共技能与工具' },
}

const TOOL_ORDER = ['tide', 'reef', 'sweep', 'atoll', 'shared']

// ---- 辅助函数 ----

function getPackageDirs(packagesDir: string): string[] {
  if (!fs.existsSync(packagesDir)) return []
  const dirs = fs.readdirSync(packagesDir).filter((name) => {
    const dir = path.join(packagesDir, name)
    return fs.statSync(dir).isDirectory() && name !== 'cli'
  })
  // 按 TOOL_ORDER 排序，确保 UI 中套件显示顺序为：产品 → 开发 → 测试 → 运维
  dirs.sort((a, b) => {
    const ia = TOOL_ORDER.indexOf(a)
    const ib = TOOL_ORDER.indexOf(b)
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
  })
  return dirs
}

function parseFrontmatter(content: string): Record<string, unknown> | null {
  const trimmed = content.trim()
  if (!trimmed.startsWith('---')) return null

  const endIndex = trimmed.indexOf('---', 3)
  if (endIndex === -1) return null

  const yamlBlock = trimmed.slice(3, endIndex).trim()
  if (!yamlBlock) return null

  try {
    return yaml.load(yamlBlock) as Record<string, unknown>
  } catch {
    return null
  }
}

/** 递归扫描目录，收集所有 .json 文件 */
function collectJsonFiles(dir: string): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry)
    if (entry === '.DS_Store') continue
    if (fs.statSync(fullPath).isDirectory()) {
      results.push(...collectJsonFiles(fullPath))
    } else if (entry.endsWith('.json')) {
      results.push(fullPath)
    }
  }
  return results
}

/** 扫描目录并返回相对于 tool 的资产文件名列表 */
function scanAssets(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((n) => n !== '.DS_Store')
    .filter((n) => n !== 'hooks.json') // hooks.json 是元数据配置，不是可执行 hook 脚本
    .filter((n) => {
      const stat = fs.statSync(path.join(dir, n))
      return stat.isFile()
    })
    .map((n) => n.replace(/\.tmpl$/, ''))
    .filter((v, i, a) => a.indexOf(v) === i)
}

// ---- 主构建函数 ----

/**
 * 构建 registry.json 并复制运行时数据到 dist/。
 *
 * @param cliDir - packages/cli/ 目录的绝对路径
 */
export function buildRegistry(cliDir: string): void {
  console.log('🔨 构建 registry...\n')

  // 路径解析
  const root = path.resolve(cliDir, '..', '..') // repo root
  const distDir = path.join(cliDir, 'dist')
  const packagesDir = path.join(root, 'packages')
  const packageDirs = getPackageDirs(packagesDir)

  const registry: Registry = {
    version: '1',
    tools: {},
    wizards: {},
    skills: {},
  }

  // 1. 扫描 SKILL.md frontmatter → skills 段
  console.log('📄 扫描 SKILL.md frontmatter...')
  let skillCount = 0
  for (const pkg of packageDirs) {
    const skillsDir = path.join(root, 'packages', pkg, 'skills')
    if (!fs.existsSync(skillsDir)) continue

    const skillNames = fs.readdirSync(skillsDir).filter((n) =>
      fs.statSync(path.join(skillsDir, n)).isDirectory(),
    )

    for (const skillName of skillNames) {
      const mdPath = path.join(skillsDir, skillName, 'SKILL.md')
      const tmplPath = path.join(skillsDir, skillName, 'SKILL.md.tmpl')
      const hasMd = fs.existsSync(mdPath)
      const hasTmpl = fs.existsSync(tmplPath)

      if (!hasMd && !hasTmpl) {
        console.log(`  ⚠ ${pkg}/${skillName}: 缺少 SKILL.md/SKILL.md.tmpl，跳过`)
        continue
      }

      const skillMd = hasMd ? mdPath : tmplPath
      const content = fs.readFileSync(skillMd, 'utf-8')
      const fm = parseFrontmatter(content)

      if (!fm) {
        console.log(`  ⚠ ${pkg}/${skillName}: frontmatter 解析失败，跳过`)
        continue
      }

      if (!fm.deepstorm) {
        console.log(`  - ${pkg}/${skillName}: 无 deepstorm 字段，跳过注册`)
        continue
      }

      const df = fm.deepstorm as Record<string, unknown>
      const entry: SkillEntry = {
        tool: df.tool as string | undefined,
        configKey: df.configKey as string | undefined,
        configValue: df.configValue as string | undefined,
        name: (fm.name as string) || undefined,
        description: (fm.description as string) || undefined,
      }
      if (hasTmpl) {
        entry.hasTemplate = true
      }
      const deps = df.dependencies
      if (Array.isArray(deps) && deps.length > 0) {
        entry.dependencies = deps as string[]
      }
      registry.skills[skillName] = entry
      skillCount++
    }
  }
  console.log(`  ✔ 已注册 ${skillCount} 个 skill\n`)

  // 2. 扫描 wizard.json → tools + wizards 段
  console.log('📋 扫描 wizard.json...')
  let wizardCount = 0
  for (const pkg of packageDirs) {
    const wizardPath = path.join(root, 'packages', pkg, 'wizard.json')
    if (!fs.existsSync(wizardPath)) continue

    try {
      const wizard = JSON.parse(fs.readFileSync(wizardPath, 'utf-8'))
      if (wizard.tool && wizard.questions) {
        // 注入 label/description（优先 wizard.json 中的，降级到 PACKAGE_LABELS）
        const pkgLabel = PACKAGE_LABELS[pkg]
        const enriched = { ...wizard }
        if (!enriched.label && pkgLabel) enriched.label = pkgLabel.label
        if (!enriched.description && pkgLabel) enriched.description = pkgLabel.description
        registry.wizards[enriched.tool] = enriched
        if (pkgLabel) registry.tools[enriched.tool] = pkgLabel
        wizardCount++
        console.log(`  ✔ ${pkg}/wizard.json (${wizard.tool})`)
      } else {
        console.log(`  ⚠ ${pkg}/wizard.json: 缺少 tool 或 questions 字段`)
      }
    } catch {
      console.log(`  ⚠ ${pkg}/wizard.json: 解析失败`)
    }
  }
  if (wizardCount === 0) console.log('  无 wizard.json 文件')
  console.log(`  ✔ 已注册 ${wizardCount} 个 wizard\n`)

  // 2.5. 扫描 MCP JSON 文件 → mcpTools 段
  console.log('🔌 扫描 MCP 工具配置...')
  const mcpTools: Record<string, McpToolEntry> = {}
  const cliMcpDir = path.join(cliDir, 'mcp')
  const mcpJsonFiles = collectJsonFiles(cliMcpDir)
  let mcpCount = 0
  for (const jsonPath of mcpJsonFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
      if (data.name && data.domain && data.label) {
        mcpTools[data.name] = {
          domain: data.domain,
          label: data.label,
          description: data.description || '',
        }
        mcpCount++
        console.log(`  ✔ ${data.label} (${data.name}) → ${data.domain}`)
      } else {
        console.log(`  ⚠ ${path.relative(cliDir, jsonPath)}: 缺少 name/domain/label 字段，跳过`)
      }
    } catch {
      console.log(`  ⚠ ${path.relative(cliDir, jsonPath)}: 解析失败，跳过`)
    }
  }
  registry.mcpTools = mcpTools
  console.log(`  ✔ 已注册 ${mcpCount} 个 MCP 工具\n`)

  // 3. 扫描 tool 的 agents 和 hooks → toolAssets 段
  console.log('📁 扫描 agents 和 hooks 归属...')
  const toolAssets: Record<string, { agents?: string[]; hooks?: string[] }> = {}
  for (const pkg of packageDirs) {
    const wizardPath = path.join(root, 'packages', pkg, 'wizard.json')
    if (!fs.existsSync(wizardPath)) continue

    let tool: string | undefined
    try {
      const wizard = JSON.parse(fs.readFileSync(wizardPath, 'utf-8'))
      tool = wizard.tool
    } catch {
      continue
    }
    if (!tool) continue

    const assets: { agents?: string[]; hooks?: string[] } = {}
    const agentsDir = path.join(root, 'packages', pkg, 'agents')
    const hooksDir = path.join(root, 'packages', pkg, 'hooks')

    if (fs.existsSync(agentsDir)) {
      const agents = scanAssets(agentsDir)
      if (agents.length > 0) assets.agents = agents
    }
    if (fs.existsSync(hooksDir)) {
      const hooks = scanAssets(hooksDir)
      if (hooks.length > 0) assets.hooks = hooks
    }

    if (Object.keys(assets).length > 0) {
      toolAssets[tool] = assets
    }
  }
  registry.toolAssets = toolAssets
  console.log(`  ✔ 已映射 ${Object.keys(toolAssets).length} 个工具的 assets\n`)

  // 补充 tools 段
  for (const skill of Object.values(registry.skills)) {
    if (skill.tool && !registry.tools[skill.tool]) {
      registry.tools[skill.tool] = {
        label: skill.tool.charAt(0).toUpperCase() + skill.tool.slice(1),
        description: '',
      }
    }
  }

  // 4. 复制 skills/agents/mcp/hooks 到 dist/
  const assetDirs = ['skills', 'agents', 'mcp', 'hooks']
  // 清理旧 dist/hooks/hooks.json，避免积累重复
  const distHooksJson = path.join(distDir, 'hooks', 'hooks.json')
  if (fs.existsSync(distHooksJson)) {
    fs.rmSync(distHooksJson, { force: true })
  }
  for (const assetDir of assetDirs) {
    for (const pkg of packageDirs) {
      const srcDir = path.join(root, 'packages', pkg, assetDir)
      if (!fs.existsSync(srcDir)) continue

      const entries = fs.readdirSync(srcDir)

      if (assetDir === 'skills') {
        const dirs = entries.filter((n) => fs.statSync(path.join(srcDir, n)).isDirectory())
        if (dirs.length === 0) continue
        for (const item of dirs) {
          const src = path.join(srcDir, item)
          const dest = path.join(distDir, assetDir, item)
          const needsUpdate = !fs.existsSync(dest)
          if (!needsUpdate) {
            const srcStat = fs.statSync(src)
            const destStat = fs.statSync(dest)
            if (srcStat.mtimeMs <= destStat.mtimeMs) continue
          }
          fs.cpSync(src, dest, { recursive: true, force: true })
          console.log(`  ${needsUpdate ? '  复制' : '  更新'} ${pkg}/${assetDir}/${item}`)
        }
      } else {
        const destDir = path.join(distDir, assetDir)
        fs.mkdirSync(destDir, { recursive: true })
        for (const entry of entries) {
          if (entry === '.DS_Store' || entry === 'variants') continue

          // hooks.json 按工具分别保存（如 reef-hooks.json、sweep-hooks.json），
          // setup 时只合并选中工具的 hooks
          if (assetDir === 'hooks' && entry === 'hooks.json') {
            copyToolHooksJson(destDir, pkg, srcDir)
            continue
          }

const src = path.join(srcDir, entry)
          const dest = path.join(destDir, entry)
          if (fs.existsSync(dest)) continue
          fs.cpSync(src, dest, { recursive: true, force: false })
          console.log(`  复制 ${pkg}/${assetDir}/${entry}`)
        }
      }
    }
  }

  // 4a. 清理 dist/ 中的 __tests__ 目录（测试文件不打包到发布产物）
  let cleanedCount = 0
  function cleanTests(dir: string): void {
    if (!fs.existsSync(dir)) return
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry)
      if (!fs.statSync(full).isDirectory()) continue
      if (entry === '__tests__') {
        fs.rmSync(full, { recursive: true, force: true })
        cleanedCount++
      } else {
        cleanTests(full)
      }
    }
  }
  for (const assetDir of assetDirs) {
    const d = path.join(distDir, assetDir)
    if (fs.existsSync(d)) cleanTests(d)
  }
  if (cleanedCount > 0) console.log(`  ✔ 已清理 ${cleanedCount} 个 __tests__ 目录`)

  // 4b. 复制 CLI 包自身的 mcp 配置（覆盖模式）
  if (fs.existsSync(cliMcpDir)) {
    const destDir = path.join(distDir, 'mcp')
    fs.mkdirSync(destDir, { recursive: true })
    for (const entry of fs.readdirSync(cliMcpDir)) {
      if (entry === '.DS_Store') continue
      const src = path.join(cliMcpDir, entry)
      const dest = path.join(destDir, entry)
      fs.cpSync(src, dest, { recursive: true, force: true })
    }
    console.log(`  复制 cli/mcp/ → dist/mcp/`)
  }

  // 4c. 复制 CLI 包自身的 mcp-skills（覆盖模式）
  const cliMcpSkillsSrc = path.join(cliDir, 'mcp-skills')
  if (fs.existsSync(cliMcpSkillsSrc)) {
    const destDir = path.join(distDir, 'mcp-skills')
    fs.mkdirSync(destDir, { recursive: true })
    for (const entry of fs.readdirSync(cliMcpSkillsSrc)) {
      if (entry === '.DS_Store') continue
      const src = path.join(cliMcpSkillsSrc, entry)
      const dest = path.join(destDir, entry)
      fs.cpSync(src, dest, { recursive: true, force: true })
    }
    console.log(`  复制 cli/mcp-skills/ → dist/mcp-skills/`)
  }

  // 4d. 复制 CLI 包自身的 env-examples（.env 模板文件，setup 时合并到项目 .env，覆盖模式）
  const cliEnvExamplesSrc = path.join(cliDir, 'env-examples')
  if (fs.existsSync(cliEnvExamplesSrc)) {
    const destDir = path.join(distDir, 'env-examples')
    fs.mkdirSync(destDir, { recursive: true })
    for (const entry of fs.readdirSync(cliEnvExamplesSrc)) {
      if (entry === '.DS_Store') continue
      const src = path.join(cliEnvExamplesSrc, entry)
      const dest = path.join(destDir, entry)
      fs.cpSync(src, dest, { recursive: true, force: true })
    }
    console.log(`  复制 cli/env-examples/ → dist/env-examples/`)
  }

  // 5. 输出 registry.json
  const registryPath = path.join(distDir, 'registry.json')
  fs.mkdirSync(distDir, { recursive: true })
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8')

  // 6. 复制 config-schema.json 到 dist/
  const schemaSrc = path.join(cliDir, 'config-schema.json')
  const schemaDest = path.join(distDir, 'config-schema.json')
  if (fs.existsSync(schemaSrc)) {
    fs.cpSync(schemaSrc, schemaDest, { force: true })
  }

  console.log(`\n📦 registry.json 已生成 → ${registryPath}`)
  console.log(`   tools: ${Object.keys(registry.tools).length} 个工具`)
  console.log(`   wizards: ${Object.keys(registry.wizards).length} 个`)
  console.log(`   skills: ${Object.keys(registry.skills).length} 个`)
  console.log('\n✔ 构建完成')
}

/**
 * 按工具分别保存 hooks.json（如 reef-hooks.json、sweep-hooks.json）。
 * setup 时再根据用户选中的工具动态合并，避免未安装工具的 hooks 被写入。
 */
function copyToolHooksJson(destDir: string, pkg: string, srcDir: string): void {
  const destPath = path.join(destDir, `${pkg}-hooks.json`)
  const srcPath = path.join(srcDir, 'hooks.json')

  if (!fs.existsSync(srcPath)) return

  const destDirExists = fs.existsSync(destDir)
  if (!destDirExists) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  fs.cpSync(srcPath, destPath, { force: true })
  console.log(`  复制 ${pkg}/hooks/hooks.json → ${pkg}-hooks.json`)
}


// ---- 独立执行入口 ----
// 被 npm run build（node scripts/build.mjs && node dist/build-registry.js）直接调用
// 注：当作为依赖被 esbuild 打包到 dist/cli.js 时，require.main !== module 不会误触发
const isMainModule =
  typeof require !== 'undefined' &&
  typeof module !== 'undefined' &&
  require.main === module

if (isMainModule) {
  const cliDir = path.resolve(__dirname, '..')
  buildRegistry(cliDir)
}
