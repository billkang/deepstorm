import * as fs from 'node:fs'
import { deepMerge } from '../utils/json'

/**
 * 合并 hooks 配置到 .claude/hooks/hooks.json。
 * 文件不存在时自动创建，已有 hooks 原样保留。
 */
export function mergeHooks(
  hooksPath: string,
  hooks: Record<string, unknown>,
): void {
  let existing: Record<string, unknown> = {}

  try {
    if (fs.existsSync(hooksPath)) {
      const raw = fs.readFileSync(hooksPath, 'utf-8')
      existing = JSON.parse(raw)
    }
  } catch {
    existing = {}
  }

  const merged = deepMerge(existing, hooks)
  fs.writeFileSync(hooksPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8')
}
