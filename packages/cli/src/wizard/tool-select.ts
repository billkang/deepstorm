import * as p from '@clack/prompts'
import type { RegistryReader } from '../engine/registry'

/**
 * 让用户多选要安装的工具套件。
 * 全部不选时返回空数组，调用方应直接退出。
 *
 * @param reader - RegistryReader 实例
 * @param initialValues - 默认勾选的工具列表（二次运行时传入已装工具）
 */
export async function selectTools(reader: RegistryReader, initialValues?: string[]): Promise<string[]> {
  const tools = reader.getTools()
  if (tools.length === 0) {
    p.note('没有可用的工具套件', '提示')
    return []
  }

  // 校验 initialValues 中的工具名是否有效
  const validInitials = initialValues
    ? initialValues.filter((v) => tools.includes(v))
    : []
  const hasInitials = validInitials.length > 0

  const message = hasInitials
    ? '选择要安装的 DeepStorm 工具套件（已有工具默认勾选，取消勾选不会卸载）：'
    : '选择要安装的 DeepStorm 工具套件（空格选中，回车确认）：'

  const selected = await p.multiselect<string>({
    message,
    options: tools.map((t) => {
      const entry = reader.getToolEntry(t)
      return {
        value: t,
        label: entry ? `${entry.label} (${t})` : t,
        hint: entry?.description,
      }
    }),
    required: false,
    initialValues: validInitials,
  })

  if (p.isCancel(selected)) {
    p.cancel('已取消安装')
    process.exit(0)
  }

  return selected as string[]
}
