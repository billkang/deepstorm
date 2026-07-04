import * as fs from 'node:fs'
import * as path from 'node:path'
import { confirm } from '@clack/prompts'
import { ensureDir, copyDir } from '../utils/fs'

/**
 * 导出 skill 默认模板到 .deepstorm/templates/。
 */
export async function initTemplate(
  cliDir: string,
  targetDir: string,
  skillId: string,
): Promise<void> {
  const srcDir = path.join(cliDir, 'skills', skillId)
  const destDir = path.join(targetDir, '.deepstorm', 'templates', skillId)

  if (!fs.existsSync(srcDir)) {
    console.log(`模板不存在：${skillId}`)
    return
  }

  if (fs.existsSync(destDir)) {
    const shouldOverwrite = await confirm({
      message: `模板 ${skillId} 已存在，是否覆盖？`,
      initialValue: false,
    })

    if (!shouldOverwrite) {
      console.log('已取消')
      return
    }

    // 删除旧目录
    fs.rmSync(destDir, { recursive: true, force: true })
  }

  ensureDir(path.dirname(destDir))
  copyDir(srcDir, destDir)
  console.log(`✔ 模板已导出到 .deepstorm/templates/${skillId}/`)
  console.log(`  修改完成后运行 deepstorm template apply ${skillId} 应用更改`)
}
