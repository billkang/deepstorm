import { Command } from 'commander'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { execSync } from 'node:child_process'
import { buildRegistry } from '../build-registry'

/**
 * 自动检测仓库根目录。从当前目录向上查找包含 packages/ 的目录。
 */
function detectRepoRoot(): string {
  let dir = process.cwd()
  const root = path.parse(dir).root
  while (dir !== root) {
    if (fs.existsSync(path.join(dir, 'packages'))) return dir
    dir = path.dirname(dir)
  }
  console.error('✘ 未找到仓库根目录（包含 packages/ 目录）')
  process.exit(1)
}

/**
 * 注册 release 子命令。
 */
export function registerReleaseCommand(program: Command): void {
  const releaseCmd = program
    .command('release')
    .description('Release 发布工作流 — 构建、版本号、发布到 npm')

  releaseCmd
    .command('build')
    .description('构建阶段：聚合 registry → esbuild 打包')
    .option('--root <path>', '仓库根目录（默认自动检测）')
    .action((options: { root?: string }) => {
      const root = options.root || detectRepoRoot()
      doBuild(root)
    })

  releaseCmd
    .command('publish [bump]')
    .description('发布到 npm：构建 → 升级版本 → npm publish → git tag')
    .option('--root <path>', '仓库根目录（默认自动检测）')
    .option('--tag <tag>', 'npm dist-tag（默认 latest）')
    .option('--dry-run', '试运行（不实际发布）')
    .action((bump: string | undefined, options: { root?: string; tag?: string; dryRun?: boolean }) => {
      const root = options.root || detectRepoRoot()
      const releaseType = bump || 'patch'
      doPublish(root, releaseType, options.tag || 'latest', !!options.dryRun)
    })
}

function doBuild(root: string): void {
  // Step 1: esbuild 打包 CLI
  console.log('🔧 阶段 1/2: esbuild 打包 CLI...')
  execSync('node scripts/build.mjs', {
    cwd: path.join(root, 'packages', 'cli'),
    stdio: 'inherit',
  })

  // Step 2: 聚合 registry + 复制源文件
  console.log('\n📦 阶段 2/2: 聚合 registry + 复制源文件...')
  buildRegistry(path.join(root, 'packages', 'cli'))

  console.log('\n✔ 构建完成')
  console.log('   dist/cli.js — CLI 可执行文件')
  console.log('   dist/registry.json — 技能注册索引')
  console.log('   dist/skills/ — 技能文件')
  console.log('   dist/agents/ | dist/mcp/ | dist/hooks/ — 运行时数据')
}

function doPublish(root: string, bump: string, tag: string, dryRun: boolean): void {
  const cliDir = path.join(root, 'packages', 'cli')
  const pkgPath = path.join(cliDir, 'package.json')

  // Step 1: 读取当前版本
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  const currentVersion = pkg.version
  const [major, minor, patch] = currentVersion.split('.').map(Number)

  let newVersion: string
  switch (bump) {
    case 'major':
      newVersion = `${major + 1}.0.0`
      break
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`
      break
    case 'patch':
    default:
      newVersion = `${major}.${minor}.${patch + 1}`
      break
  }

  console.log(`\n📦 @deepstorm/cli v${currentVersion} → v${newVersion} (${bump})`)
  console.log(`   标签: ${tag}`)
  if (dryRun) {
    console.log('   模式: --dry-run（不实际发布）')
  }
  console.log('')

  // Step 2: Build
  doBuild(root)

  // Step 3: 更新版本号
  console.log('\n📝 更新版本号...')
  pkg.version = newVersion
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
  console.log(`   package.json → ${newVersion}`)

  if (dryRun) {
    // 试运行：回滚版本号
    pkg.version = currentVersion
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8')
    console.log('\n🏁 试运行完成（版本号已回滚，未发布）')
    return
  }

  // Step 4: Git 提交 + Tag
  console.log('\n🔖 Git tag...')
  try {
    execSync(`git add packages/cli/package.json packages/cli/registry.json packages/cli/bin/`, {
      cwd: root,
      stdio: 'pipe',
    })
    execSync(`git commit -m "release @deepstorm/cli@${newVersion}"`, {
      cwd: root,
      stdio: 'pipe',
    })
    execSync(`git tag "cli-v${newVersion}"`, { cwd: root, stdio: 'pipe' })
    console.log(`   commit + tag cli-v${newVersion} 已创建`)
  } catch (err) {
    console.log('   ⚠ Git 操作失败（请手动处理）:', err instanceof Error ? err.message : err)
  }

  // Step 5: npm publish
  console.log(`\n📤 npm publish...`)
  try {
    execSync(`npm publish --tag ${tag}`, {
      cwd: cliDir,
      stdio: 'inherit',
    })
    console.log(`\n✔ @deepstorm/cli@${newVersion} 已发布到 npm`)
    console.log(`   使用: npx @deepstorm/cli setup`)
  } catch (err) {
    console.log('\n⚠ npm publish 失败，请手动执行:')
    console.log(`   cd ${cliDir} && npm publish --tag ${tag}`)
  }
}
