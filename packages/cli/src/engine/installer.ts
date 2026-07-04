import * as path from 'node:path'
import { ensureDir, copyDir } from '../utils/fs'

/**
 * 复制 skill 目录从源目录到目标目录。
 * @param skillIds - 要安装的 skill ID 列表
 * @param sourceDir - 内置 skill 所在源目录（如 skills/）
 * @param targetDir - 目标目录（如 .claude/skills/）
 * @returns 实际复制的 skill ID 列表
 */
export function installSkills(
  skillIds: string[],
  sourceDir: string,
  targetDir: string,
): string[] {
  if (skillIds.length === 0) return []

  ensureDir(targetDir)

  for (const id of skillIds) {
    const src = path.join(sourceDir, id)
    const dest = path.join(targetDir, id)
    copyDir(src, dest)
  }

  return [...skillIds]
}
