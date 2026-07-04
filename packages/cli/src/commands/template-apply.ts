import * as fs from 'node:fs'
import * as path from 'node:path'
import { copyDir } from '../utils/fs'

/**
 * 应用用户修改后的模板到 .claude/skills/。
 */
export function applyTemplate(
  targetDir: string,
  skillId: string,
): void {
  const srcDir = path.join(targetDir, '.deepstorm', 'templates', skillId)
  const destDir = path.join(targetDir, '.claude', 'skills', skillId)

  if (!fs.existsSync(srcDir)) {
    console.log(`模板不存在，请先运行 deepstorm template init ${skillId}`)
    return
  }

  copyDir(srcDir, destDir)
  console.log(`✔ 模板已应用到 .claude/skills/${skillId}/`)
}
