import * as p from '@clack/prompts'
import type { RegistryReader } from '../engine/registry'

/**
 * 让用户多选要安装的工具套件。
 * 全部不选时返回空数组，调用方应直接退出。
 */
export async function selectTools(reader: RegistryReader): Promise<string[]> {
  const tools = reader.getTools()
  if (tools.length === 0) {
    p.note('没有可用的工具套件', '提示')
    return []
  }

  const selected = await p.multiselect<string>({
    message: '选择要安装的 DeepStorm 工具套件（空格选中，回车确认）：',
    options: tools.map((t) => {
      const entry = reader.getToolEntry(t)
      return {
        value: t,
        label: entry ? `${entry.label} (${t})` : t,
        hint: entry?.description,
      }
    }),
    required: false,
  })

  if (p.isCancel(selected)) {
    p.cancel('已取消安装')
    process.exit(0)
  }

  return selected as string[]
}
