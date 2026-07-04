import * as fs from 'node:fs'
import * as path from 'node:path'
import Handlebars from 'handlebars'
import { ensureDir, removeDirContents } from '../utils/fs'

/**
 * 注册指定目录下的所有 .hbs 文件为 Handlebars partials。
 *
 * 文件名（不含 .hbs 后缀）作为 partial 名称。
 * 例如 cli/templates/partials/style-ref.hbs 注册为 {{> style-ref}}。
 *
 * @param partialsDir - 包含 .hbs 文件的目录路径
 */
export function registerPartialsDir(partialsDir: string): void {
  if (!fs.existsSync(partialsDir)) return
  const files = fs.readdirSync(partialsDir)
  for (const file of files) {
    if (!file.endsWith('.hbs')) continue
    const partialName = path.basename(file, '.hbs')
    const content = fs.readFileSync(path.join(partialsDir, file), 'utf-8')
    Handlebars.registerPartial(partialName, content)
  }
}

/**
 * 将扁平变量映射转换为 Handlebars 兼容的嵌套结构。
 *
 * 输入：{ "reef.frontend.framework.label": "Angular" }
 * 输出：{ reef: { frontend: { framework: { label: "Angular" } } } }
 *
 * "true"/"false" 字符串被转换为实际布尔值，以支持 Handlebars {{#if}} 条件。
 */
function toNested(vars: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(vars)) {
    const parts = key.split('.')
    let current = result
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) current[parts[i]] = {}
      current = current[parts[i]] as Record<string, unknown>
    }
    // 将 "true"/"false" 字符串转为布尔值，支持 {{#if}} 判断
    const typedValue: unknown =
      value === 'true' ? true : value === 'false' ? false : value
    current[parts[parts.length - 1]] = typedValue
  }
  return result
}

/**
 * 模板编译缓存，避免重复编译相同模板文件。
 */
const compiledCache = new Map<string, HandlebarsTemplateDelegate>()

/**
 * 渲染 SKILL.md.tmpl → SKILL.md。
 *
 * 使用 Handlebars 引擎，支持 {{var}}、{{#if}}、{{#each}}、{{else}} 等语法。
 * 变量支持扁平键名（如 "reef.frontend.framework.label"）和嵌套路径。
 * "true"/"false" 字符串自动转换为布尔值，以支持 {{#if}} 条件渲染。
 *
 * @param tmplPath - .tmpl 文件的完整路径
 * @param variables - 占位符 → 替换值的映射（支持扁平或嵌套键）
 * @param outputPath - 输出文件路径
 */
export function renderTemplate(
  tmplPath: string,
  variables: Record<string, unknown>,
  outputPath: string,
): void {
  if (!fs.existsSync(tmplPath)) {
    throw new Error(`模板文件不存在: ${tmplPath}`)
  }

  // 从缓存取编译后的模板函数
  let templateFn = compiledCache.get(tmplPath)
  if (!templateFn) {
    const source = fs.readFileSync(tmplPath, 'utf-8')
    templateFn = Handlebars.compile(source, { noEscape: true })
    compiledCache.set(tmplPath, templateFn)
  }

  // 扁平变量转嵌套
  const nestedVars = toNested(variables)

  // 渲染
  const content = templateFn(nestedVars)

  ensureDir(path.dirname(outputPath))
  fs.writeFileSync(outputPath, content, 'utf-8')
}

/**
 * 从 variants/ 目录中复制选中变体的文件到目标目录。
 *
 * variants/ 目录结构约定：
 *   variants/{selectedValue}/  ← 用户配置值匹配的子目录
 *   目录下所有文件/子目录被递归复制到 targetDir。
 *
 * 若 selectedValue 对应的变体目录不存在，静默降级（仅输出 debug 日志）。
 *
 * @param sourceVariantsDir - variants/ 目录的完整路径
 * @param selectedValue - 用户选中的配置值（如 "angular", "java"）
 * @param targetDir - 目标目录（如 .claude/skills/reef-style-frontend/）
 * @param clean - 复制前是否先清空 targetDir（用于重渲染场景）
 */
export function copyVariants(
  sourceVariantsDir: string,
  selectedValue: string,
  targetDir: string,
  clean = false,
): void {
  const variantDir = path.join(sourceVariantsDir, selectedValue)

  if (!fs.existsSync(variantDir)) {
    console.warn(
      `[template] ⚠ 变体目录不存在: ${variantDir}（相对于 ${sourceVariantsDir}），跳过`,
    )
    return
  }

  if (clean && fs.existsSync(targetDir)) {
    removeDirContents(targetDir)
  }

  ensureDir(targetDir)

  const entries = fs.readdirSync(variantDir)
  for (const entry of entries) {
    if (entry === '.DS_Store') continue
    const src = path.join(variantDir, entry)
    const dest = path.join(targetDir, entry)
    fs.cpSync(src, dest, { recursive: true, force: true })
  }
}

/**
 * 将选中的 code-style fragment 文件从源 fragments 目录复制到目标 dimensions 目录。
 *
 * 只复制用户选择的维度和选项对应的文件，未选中的不复制。
 *
 * fragments 目录结构约定：
 *   fragments/{category}/{value}/  ← 维度 + 选项值
 *   如 fragments/framework/angular/quick-reference.md
 *
 * @param sourceFragmentsDir - fragments/ 目录的完整路径
 * @param selectedFragments - 选中的 fragment 列表，每项包含 category 和 value
 * @param targetDimensionsDir - 目标 dimensions 目录
 */
export function copyFragments(
  sourceFragmentsDir: string,
  selectedFragments: Array<{ category: string; value: string }>,
  targetDimensionsDir: string,
): void {
  if (!fs.existsSync(sourceFragmentsDir)) return

  for (const { category, value } of selectedFragments) {
    const srcDir = path.join(sourceFragmentsDir, category, value)
    if (!fs.existsSync(srcDir)) continue

    const destDir = path.join(targetDimensionsDir, category, value)
    ensureDir(path.dirname(destDir))

    const entries = fs.readdirSync(srcDir)
    for (const entry of entries) {
      if (entry === '.DS_Store') continue
      const src = path.join(srcDir, entry)
      const dest = path.join(destDir, entry)
      fs.cpSync(src, dest, { recursive: true, force: true })
    }
  }
}
