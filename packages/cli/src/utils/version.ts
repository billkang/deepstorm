import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * 读取 CLI 包自身的 package.json 中的版本号。
 * 优先从 dist/ 同级读取，或回退到 __dirname 的父目录。
 */
export function getCliVersion(): string {
  try {
    const paths = [
      path.resolve(__dirname, 'package.json'),
      path.resolve(__dirname, '..', 'package.json'),
    ]
    for (const pkgPath of paths) {
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
        return pkg.version || '0.0.0'
      }
    }
    return '0.0.0'
  } catch {
    return '0.0.0'
  }
}
