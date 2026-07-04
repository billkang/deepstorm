import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * 确保目录存在，不存在则递归创建
 */
export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true })
}

/**
 * 递归复制目录
 */
export function copyDir(src: string, dest: string): void {
  fs.cpSync(src, dest, { recursive: true, force: true })
}

/**
 * 清空目录内容（保留目录本身），用于重渲染时清除旧 variants 内容。
 */
export function removeDirContents(dir: string): void {
  const entries = fs.readdirSync(dir)
  for (const entry of entries) {
    if (entry === '.DS_Store') continue
    const fullPath = path.join(dir, entry)
    fs.rmSync(fullPath, { recursive: true, force: true })
  }
}

/**
 * 读取文本文件（UTF-8）
 */
export function readTextFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8')
}

/**
 * 写入文本文件（UTF-8），自动创建父目录
 */
export function writeTextFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, content, 'utf-8')
}
