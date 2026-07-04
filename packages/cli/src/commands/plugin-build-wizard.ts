import * as p from '@clack/prompts'

/**
 * 引导用户输入插件市场名（marketplace name）。
 * 市场名用于 marketplace.json 的 name 字段，格式建议 kebab-case。
 */
export async function promptMarketplaceName(): Promise<string> {
  const name = await p.text({
    message: '请输入插件市场名（如 example-orgg）',
    placeholder: 'example-orgg',
    validate: (value) => {
      if (!value || value.trim().length === 0) {
        return '市场名不能为空'
      }
      if (/\s/.test(value)) {
        return '市场名不能包含空格，建议使用 kebab-case 格式（如 my-company）'
      }
      if (/[A-Z]/.test(value)) {
        return '市场名建议使用小写字母，推荐 kebab-case 格式（如 my-company）'
      }
      if (/[_.]/.test(value)) {
        return '市场名不能包含下划线或点号，建议使用 kebab-case 格式（如 my-company）'
      }
    },
  })

  if (p.isCancel(name)) {
    p.cancel('已取消构建')
    process.exit(0)
  }

  return name.trim()
}
