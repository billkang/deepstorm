import * as fs from 'node:fs'
import * as path from 'node:path'
import { execSync } from 'node:child_process'

const EXEC_OPTIONS = { encoding: 'utf-8' as const, timeout: 120_000, stdio: 'pipe' as const }

/**
 * 安全执行命令，捕获错误不抛异常。
 */
export function execSafe(command: string): { success: boolean; output: string } {
  try {
    const output = execSync(command, EXEC_OPTIONS)
    return { success: true, output: output.toString() }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { success: false, output: message }
  }
}

/**
 * 检测 BMAD Method 是否已安装。
 */
export function isBmadInstalled(): boolean {
  const result = execSafe('npx bmad-method status')
  return result.success && result.output.includes('Version:')
}

/**
 * 检测 grill-me 是否已安装。
 */
export function isGrillMeInstalled(targetDir: string): boolean {
  return fs.existsSync(path.join(targetDir, '.claude', 'skills', 'grill-me', 'SKILL.md'))
}

/**
 * 安装 BMAD Method。
 */
export function installBmadMethod(): void {
  if (isBmadInstalled()) {
    console.log('ℹ BMAD Method 已存在，跳过安装')
    return
  }

  const result = execSafe('npx bmad-method install')
  if (result.success) {
    console.log('✔ BMAD Method 已安装')
  } else {
    console.log('⚠ BMAD Method 安装失败，请手动执行 npx bmad-method install')
  }
}

/**
 * 安装 grill-me skill。
 */
export function installGrillMe(targetDir: string): void {
  if (isGrillMeInstalled(targetDir)) {
    console.log('ℹ grill-me 已存在，跳过安装')
    return
  }

  const skillDir = path.join(targetDir, '.claude', 'skills', 'grill-me')
  fs.mkdirSync(skillDir, { recursive: true })

  try {
    execSync(
      'curl -fsSL https://raw.githubusercontent.com/mattpocock/skills/main/grill-me/SKILL.md -o SKILL.md',
      { ...EXEC_OPTIONS, cwd: skillDir },
    )
    console.log('✔ grill-me skill 已安装')
  } catch {
    console.log('⚠ grill-me 安装失败，请手动安装 https://github.com/mattpocock/skills')
  }
}

/**
 * 检测 Playwright 浏览器是否已安装。
 * `npx playwright install --dry-run` 在已安装时输出浏览器版本信息，
 * 未安装时提示运行 `npx playwright install`。
 */
function isPlaywrightInstalled(targetDir: string): boolean {
  const result = execSafe('npx playwright install --dry-run')
  // 已安装：输出包含 "chromium"、"firefox" 等浏览器名
  // 未安装：输出包含 "To install" 等提示
  return result.success && !result.output.toLowerCase().includes('to install')
}

/**
 * 安装 Playwright 浏览器。
 */
export function installPlaywright(
  config: Record<string, string>,
  targetDir: string,
): void {
  if (config['sweep.e2eFramework'] !== 'playwright') return

  if (isPlaywrightInstalled(targetDir)) {
    console.log('ℹ Playwright 浏览器已存在，跳过安装')
    return
  }

  const result = execSafe('npx playwright install')
  if (result.success) {
    console.log('✔ Playwright 浏览器已安装')
  } else {
    console.log('⚠ Playwright 浏览器安装失败，请手动执行 npx playwright install')
  }
}

/**
 * Step 9：安装向导末尾自动安装各套件前置依赖。
 */
export function step9AutoInstallDeps(
  tools: string[],
  config: Record<string, string>,
  targetDir: string,
): void {
  if (tools.includes('tide')) {
    installBmadMethod()
    installGrillMe(targetDir)
  }
  if (tools.includes('sweep')) {
    installPlaywright(config, targetDir)
  }
}
