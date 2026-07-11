import dotenv from 'dotenv'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '../../..')   // 项目根目录
const cliDir = resolve(__dirname, '..')           // packages/cli
const pkgJson = resolve(cliDir, 'package.json')

// 加载根目录 .env（含 NPM_TOKEN 等）
dotenv.config({ path: resolve(rootDir, '.env') })

if (!process.env.NPM_TOKEN) {
  console.error('❌ NPM_TOKEN 未设置，请检查根目录 .env 文件')
  process.exit(1)
}

console.log(`ℹ️  加载 .env → NPM_TOKEN (${process.env.NPM_TOKEN.slice(0, 10)}...)`)

try {
  // npm 11 读取 .npmrc 的规则：
  //   - 从 cwd 向上找 package.json 确定 project root
  //   - 只在 project root 目录找 .npmrc
  //   - packages/cli/ 自己有 package.json，所以根目录 .npmrc 不会被加载
  //   因此需要用 --userconfig 显式指定根目录 .npmrc，并 --registry 指向 npmjs.org
  execSync(
    'pnpm publish' +
    ' --registry https://registry.npmjs.org/' +
    ' --no-git-checks',
    {
      cwd: cliDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        NPM_TOKEN: process.env.NPM_TOKEN,
      },
    },
  )
} catch {
  console.error('❌ pnpm publish 失败')
  process.exit(1)
}
