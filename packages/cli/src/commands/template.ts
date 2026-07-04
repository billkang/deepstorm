import { Command } from 'commander'
import { listTemplates } from './template-list'
import { initTemplate } from './template-init'
import { applyTemplate } from './template-apply'
import type { Registry } from '../types/registry'

/**
 * 注册 template 子命令树。
 */
export function registerTemplateCommand(program: Command, registry: Registry): void {
  // 运行时数据（skills/等）在 __dirname 即 dist/ 下
  const cliDir = __dirname
  const templateCmd = program
    .command('template')
    .description('管理 DeepStorm skill 模板')

  templateCmd
    .command('list [tool]')
    .description('查看可用模板列表，可按工具过滤')
    .action((tool?: string) => {
      listTemplates(registry, tool)
    })

  templateCmd
    .command('init [tool] [capability]')
    .description('导出默认模板到 .deepstorm/templates/')
    .action(async (tool?: string, capability?: string) => {
      if (!tool) {
        console.log('请指定工具名称：deepstorm template init <tool> [capability]')
        return
      }
      const skillId = capability ? `${tool}-${capability}` : tool
      await initTemplate(cliDir, process.cwd(), skillId)
    })

  templateCmd
    .command('apply [tool] [capability]')
    .description('应用模板到 .claude/skills/')
    .action((tool?: string, capability?: string) => {
      if (!tool) {
        console.log('请指定工具名称：deepstorm template apply <tool> [capability]')
        return
      }
      const skillId = capability ? `${tool}-${capability}` : tool
      applyTemplate(process.cwd(), skillId)
    })
}
