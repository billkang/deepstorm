import * as fs from 'node:fs'
import * as path from 'node:path'
import { ensureDir, copyDir } from '../utils/fs'

/**
 * 同步官方更新的 skill 到 .claude/skills/，不覆盖用户修改。
 */
export function upgradeTemplates(
  cliDir: string,
  targetDir: string,
  skillIds: string[],
): void {
  const templatesDir = path.join(targetDir, '.deepstorm', 'templates')

  for (const skillId of skillIds) {
    const userTemplate = path.join(templatesDir, skillId)
    if (fs.existsSync(userTemplate)) {
      console.log(`${skillId}：检测到用户修改，跳过。如需同步请运行 deepstorm template apply ${skillId}`)
      continue
    }

    const src = path.join(cliDir, 'skills', skillId)
    const dest = path.join(targetDir, '.claude', 'skills', skillId)

    if (fs.existsSync(src)) {
      ensureDir(path.dirname(dest))
      copyDir(src, dest)
      console.log(`✔ ${skillId} 已更新`)
    }
  }
}
