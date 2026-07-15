import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Registry } from '../types/registry'

export interface BuildPluginConfig {
  marketplaceName: string
  tools: string[]
  config: Record<string, string>
  selectedMcpTools: string[]
  cliDir: string
  targetDir: string
  registry: Registry
}

/**
 * 构建 DeepStorm Claude Plugin。
 *
 * 1. 创建输出目录 .deepstorm/
 * 2. 生成元数据文件（plugin.json, marketplace.json, settings.json, .mcp.json）
 * 3. 生成 .env（如有 MCP 服务）
 * 4. 生成 README.md 和 CHANGELOG.md
 *
 * 返回插件目录的绝对路径。
 */
export async function buildPlugin(config: BuildPluginConfig): Promise<string> {
  const { marketplaceName, tools, selectedMcpTools, cliDir, targetDir } = config
  const outputDir = path.join(targetDir, '.deepstorm')

  // 创建输出目录
  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true })
  }
  fs.mkdirSync(outputDir, { recursive: true })

  // 读取 root package.json
  const rootPkgMeta = readRootPackageJson(targetDir)

  // 创建 .claude-plugin/ 目录
  const claudePluginDir = path.join(outputDir, '.claude-plugin')
  fs.mkdirSync(claudePluginDir, { recursive: true })

  // 写入 plugin.json（hooks 声明在 plugin-build.ts Step 7c 中补充）
  const pluginJson = {
    name: 'deepstorm',
    description: rootPkgMeta.description,
    version: rootPkgMeta.version,
    author: { name: 'deepstorm' },
    license: 'MIT',
    keywords: ['deepstorm', 'ai', 'software-engineering', ...tools],
  }
  fs.writeFileSync(path.join(claudePluginDir, 'plugin.json'), JSON.stringify(pluginJson, null, 2), 'utf-8')

  // 写入 marketplace.json
  const marketplaceJson = {
    name: marketplaceName,
    description: 'DeepStorm Claude Code 插件',
    owner: { name: marketplaceName },
    plugins: [
      {
        name: 'deepstorm',
        source: './',
        description: 'DeepStorm — Spec 驱动的 AI 协同软件工程实践工具集',
        version: rootPkgMeta.version,
      },
    ],
  }
  fs.writeFileSync(path.join(claudePluginDir, 'marketplace.json'), JSON.stringify(marketplaceJson, null, 2), 'utf-8')

  // 写入 settings.json
  const settingsJson = {
    enabledMcpjsonServers: selectedMcpTools,
  }
  fs.writeFileSync(path.join(outputDir, 'settings.json'), JSON.stringify(settingsJson, null, 2), 'utf-8')

  // 写入 .mcp.json（如有 MCP 服务）
  if (selectedMcpTools.length > 0) {
    const mcpServers: Record<string, unknown> = {}
    for (const mcpName of selectedMcpTools) {
      const serverConfig = readMcpServerConfig(cliDir, mcpName)
      if (serverConfig) {
        mcpServers[`deepstorm-${mcpName}`] = serverConfig
      }
    }
    if (Object.keys(mcpServers).length > 0) {
      fs.writeFileSync(
        path.join(outputDir, '.mcp.json'),
        JSON.stringify({ mcpServers }, null, 2) + '\n',
        'utf-8',
      )
    }
  }

  // 写入 .env（如有 MCP 服务）— 不存在则创建，存在则追加
  if (selectedMcpTools.length > 0) {
    const envPath = path.join(targetDir, '.env')
    const header = '# ── DeepStorm Plugin MCP 环境变量 ──\n\n'
    const sections: string[] = []
    for (const mcpName of selectedMcpTools) {
      const envExampleFile = path.join(cliDir, 'env-examples', `${mcpName}.env-example`)
      if (fs.existsSync(envExampleFile)) {
        const content = fs.readFileSync(envExampleFile, 'utf-8')
        sections.push(`# ${mcpName}`)
        sections.push(content)
      }
    }
    const newContent = header + sections.join('\n') + '\n'
    if (fs.existsSync(envPath)) {
      const existing = fs.readFileSync(envPath, 'utf-8').trimEnd()
      fs.writeFileSync(envPath, existing + '\n\n' + newContent, 'utf-8')
    } else {
      fs.writeFileSync(envPath, newContent, 'utf-8')
    }
  }

  // 写入 README.md
  const readmeContent = generateReadme(marketplaceName, tools, selectedMcpTools, rootPkgMeta.version)
  fs.writeFileSync(path.join(outputDir, 'README.md'), readmeContent, 'utf-8')

  // 写入 CHANGELOG.md
  const changelogContent = `# Changelog\n\n## v${rootPkgMeta.version}\n\n- 首次构建 DeepStorm Plugin\n`
  fs.writeFileSync(path.join(outputDir, 'CHANGELOG.md'), changelogContent, 'utf-8')

  return outputDir
}

function readRootPackageJson(targetDir: string): { version: string; description: string } {
  const pkgPath = path.join(targetDir, 'package.json')
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    return {
      version: pkg.version || '0.1.0',
      description: pkg.description || 'DeepStorm — Spec 驱动的 AI 协同软件工程实践工具集',
    }
  } catch {
    return {
      version: '0.1.0',
      description: 'DeepStorm — Spec 驱动的 AI 协同软件工程实践工具集',
    }
  }
}

function generateReadme(
  marketplaceName: string,
  tools: string[],
  selectedMcpTools: string[],
  version: string,
): string {
  const lines: string[] = [
    `# DeepStorm Plugin (${marketplaceName})`,
    '',
    'DeepStorm — Spec 驱动的 AI 协同软件工程实践工具集。',
    '本插件通过 Claude Code 的 plugin 机制提供 DeepStorm 工具能力。',
    '',
    `> **版本**: ${version}`,
    '',
    '## 安装',
    '',
    '```bash',
    `/plugin install deepstorm@${marketplaceName}`,
    '```',
    '',
    '## 包含的工具套件',
    '',
  ]

  for (const tool of tools) {
    lines.push(`- **${tool}**: DeepStorm ${tool} 套件`)
  }

  if (selectedMcpTools.length > 0) {
    lines.push('', '## MCP 服务', '', ...selectedMcpTools.map((m) => `- ${m}`))
  }

  lines.push(
    '',
    '## 环境变量',
    '',
    '编辑 .env 文件，填写对应的 API Token 后重启 Claude Code 会话。',
    '',
    '## 开发',
    '',
    '```bash',
    `# 本地测试（在插件目录下运行）`,
    `claude --plugin-dir .`,
    '```',
  )

  return lines.join('\n')
}

/**
 * 从 cliDir/mcp/ 目录下查找并读取指定 MCP 服务的 server 配置。
 * 扫描 mcp 目录下所有 JSON 文件，查找 name 匹配的条目。
 */
function readMcpServerConfig(cliDir: string, mcpName: string): Record<string, unknown> | null {
  const mcpDir = path.join(cliDir, 'mcp')
  if (!fs.existsSync(mcpDir)) return null

  const entries = fs.readdirSync(mcpDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const domainDir = path.join(mcpDir, entry.name)
    const files = fs.readdirSync(domainDir).filter((f) => f.endsWith('.json'))
    for (const file of files) {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(domainDir, file), 'utf-8'))
        if (content.name === mcpName && content.mcpServers) {
          const servers = content.mcpServers
          const keys = Object.keys(servers)
          if (keys.length > 0) {
            return servers[keys[0]]
          }
        }
      } catch {
        continue
      }
    }
  }
  return null
}
