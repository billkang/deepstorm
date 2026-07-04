import { Command } from 'commander'
import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Registry } from '../types/registry'
import { RegistryReader } from '../engine/registry'
import { buildPlugin } from '../engine/plugin-builder'
import { runWizardFlow } from '../wizard/wizard-flow'
import { promptMarketplaceName } from './plugin-build-wizard'
import { renderToolAssets } from './setup'
import { mergeHooks } from '../merger/hooks'

/**
 * 注册 plugin build 子命令。
 */
export function registerPluginBuildCommand(program: Command, registry: Registry): void {
  const cliDir = __dirname

  const plugin = program
    .command('plugin')
    .description('管理 DeepStorm 插件')

  plugin
    .command('build')
    .description('构建 DeepStorm Claude Plugin')
    .action(async () => {
      const reader = new RegistryReader(registry)
      const targetDir = process.cwd()

      try {
        // Step 1: 市场名输入
        const marketplaceName = await promptMarketplaceName()

        // Step 2-5: 共享向导流程（工具选择 → MCP选择 → 问答 → 模板变量）
        const { tools, config, selectedMcpTools, templateVariables } = await runWizardFlow(reader, registry)

        // Step 6: 创建输出目录并生成元数据
        const pluginDir = await buildPlugin({
          marketplaceName,
          tools,
          config,
          selectedMcpTools,
          cliDir,
          targetDir,
          registry,
        })

        // Step 7: 对每个选中的工具套件渲染 skills/agents/hooks
        for (const tool of tools) {
          renderToolAssets(
            tool,
            reader,
            cliDir,
            pluginDir,
            templateVariables,
            config,
            registry,
            selectedMcpTools,
            '', // targetSubDir = '' → 直接写 plugin 根目录的 skills/ agents/ hooks/
          )
        }

        // Step 7b: 合并 hooks.json — 从 packages/{tool}/hooks/hooks.json 直接读取源文件，
        // 写入插件目录的 hooks/deepstorm-hooks.json（非标准文件名，避免 Claude Code auto-load 冲突）。
        // 不依赖 dist/ 构建产物，与 setup Step 5 逻辑一致但目标路径为 pluginDir/hooks/
        mergePluginHooks(tools, reader, pluginDir)

        // Step 7c: 更新 plugin.json — 声明 hooks 路径，
        // 使用 deepstorm-hooks.json（非标准文件名，避免与 Claude Code auto-load 冲突）
        updatePluginJsonHooks(pluginDir)

        // Step 8: 更新 .gitignore
        ensureGitIgnore(targetDir)

        console.log(`\n✔ DeepStorm Plugin 构建完成！`)
        console.log(`   输出目录: ${pluginDir}`)
        console.log(`   市场名: ${marketplaceName}`)
        console.log(`   工具套件: ${tools.join(', ')}`)
        console.log(`   MCP 服务: ${selectedMcpTools.join(', ') || '（无）'}`)
        console.log(`\n使用以下命令安装插件:`)
        console.log(`   /plugin install deepstorm@${marketplaceName}`)
      } catch (err) {
        console.error('构建失败:', err instanceof Error ? err.message : err)
        process.exit(1)
      }
    })
}

/**
 * 更新 plugin.json，添加 hooks 声明路径，指向 deepstorm-hooks.json。
 * 使用非标准文件名（deepstorm-hooks.json 而非 hooks.json），
 * 避免与 Claude Code auto-load 的 hooks/hooks.json 冲突。
 */
export function updatePluginJsonHooks(pluginDir: string): void {
  const hooksDir = path.join(pluginDir, 'hooks')
  const pluginJsonPath = path.join(pluginDir, '.claude-plugin', 'plugin.json')
  if (!fs.existsSync(hooksDir) || !fs.existsSync(pluginJsonPath)) return

  try {
    const pluginJson = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf-8'))
    pluginJson.hooks = './hooks/deepstorm-hooks.json'
    fs.writeFileSync(pluginJsonPath, JSON.stringify(pluginJson, null, 2) + '\n', 'utf-8')
    console.log('✔ plugin.json 已添加 hooks 声明')
  } catch {
    // plugin.json 不存在或格式错误时静默忽略
  }
}

/**
 * 确保 .gitignore 包含 .deepstorm/ 忽略规则。
 */
function ensureGitIgnore(targetDir: string): void {
  const gitIgnorePath = path.join(targetDir, '.gitignore')
  const line = '.deepstorm/'

  try {
    if (fs.existsSync(gitIgnorePath)) {
      const content = fs.readFileSync(gitIgnorePath, 'utf-8')
      if (content.includes(line)) return // 已存在，跳过
      fs.writeFileSync(gitIgnorePath, content.trimEnd() + '\n' + line + '\n', 'utf-8')
    } else {
      fs.writeFileSync(gitIgnorePath, line + '\n', 'utf-8')
    }
    console.log('✔ .gitignore 已添加 .deepstorm/ 忽略规则')
  } catch {
    // .gitignore 不存在或无法写入时静默忽略
  }
}

/**
 * 合并选中工具的 hooks 配置到插件目录的 hooks/deepstorm-hooks.json。
 *
 * 从 packages/{tool}/hooks/hooks.json 直接读取源文件（不依赖 dist/ 构建产物），
 * 合并写入插件目录（deepstorm-hooks.json，非标准文件名，避免 Claude Code auto-load 冲突）。
 * 与 setup Step 5 逻辑一致，区别是目标路径为 pluginDir/hooks/。
 *
 * @param tools - 选中的工具名称列表（如 reef、sweep、tide）
 * @param reader - RegistryReader 实例（用于判断工具是否有 hooks）
 * @param pluginDir - 插件输出目录的绝对路径
 * @param packagesDir - 可选，packages/ 目录的绝对路径；默认使用 process.cwd()/packages
 */
export function mergePluginHooks(
  tools: string[],
  reader: RegistryReader,
  pluginDir: string,
  packagesDir?: string,
): void {
  if (!tools.some((tool) => reader.getToolHooks(tool).length > 0)) return

  const pkgsDir = packagesDir ?? path.resolve(process.cwd(), 'packages')
  const pluginHooksDir = path.join(pluginDir, 'hooks')
  const destHooksJson = path.join(pluginHooksDir, 'deepstorm-hooks.json')

  for (const tool of tools) {
    const srcPath = path.join(pkgsDir, tool, 'hooks', 'hooks.json')
    if (fs.existsSync(srcPath)) {
      fs.mkdirSync(pluginHooksDir, { recursive: true })
      const incoming = JSON.parse(fs.readFileSync(srcPath, 'utf-8'))
      mergeHooks(destHooksJson, incoming)
    }
  }
}
