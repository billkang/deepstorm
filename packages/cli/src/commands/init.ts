import { Command } from 'commander'
import * as fs from 'node:fs'
import * as path from 'node:path'
import Handlebars from 'handlebars'
import { writeDeepStormConfig } from '../merger/settings'
import { RegistryReader } from '../engine/registry'
import type { Registry } from '../types/registry'

/**
 * 初始化项目的选项接口。
 */
export interface InitOptions {
  /** 项目名称 */
  projectName?: string
  /** 前端框架：angular */
  frontend?: string
  /** 后端语言：java */
  backend?: string
  /** UI 库：primeng / none */
  uiLib?: string
  /** CSS 框架：tailwind / none */
  cssFramework?: string
  /** ORM：hibernate / none */
  orm?: string
  /** 数据库迁移：liquibase / none */
  migration?: string
  /** AI 框架：spring-ai / none */
  ai?: string
  /** Node.js ORM：prisma / none */
  nodejsOrm?: string
  /** Node.js AI 框架：claude-agent-sdk / none */
  nodejsAi?: string
  /** 输出目录（不含 projectName） */
  output?: string
}

const VALID_PROJECT_NAME = /^[a-zA-Z0-9_-]+$/

/**
 * 解析 CLI 参数为 InitOptions。
 */
export function parseInitArgs(raw: Record<string, unknown>): Partial<InitOptions> {
  const opts: Partial<InitOptions> = {}
  if (raw.name && typeof raw.name === 'string') opts.projectName = raw.name
  if (raw.frontend && typeof raw.frontend === 'string') opts.frontend = raw.frontend
  if (raw.backend && typeof raw.backend === 'string') opts.backend = raw.backend
  if (raw.output && typeof raw.output === 'string') opts.output = raw.output
  if (raw.uiLib && typeof raw.uiLib === 'string') opts.uiLib = raw.uiLib
  if (raw.cssFramework && typeof raw.cssFramework === 'string') opts.cssFramework = raw.cssFramework
  if (raw.orm && typeof raw.orm === 'string') opts.orm = raw.orm
  if (raw.migration && typeof raw.migration === 'string') opts.migration = raw.migration
  if (raw.ai && typeof raw.ai === 'string') opts.ai = raw.ai
  // 支持 kebab-case CLI 参数：--ui-lib、--css-framework
  if (raw['ui-lib'] && typeof raw['ui-lib'] === 'string') opts.uiLib = raw['ui-lib']
  if (raw['css'] && typeof raw['css'] === 'string') opts.cssFramework = raw['css']
  if (raw.nodejsOrm && typeof raw.nodejsOrm === 'string') opts.nodejsOrm = raw.nodejsOrm
  if (raw['nodejs-orm'] && typeof raw['nodejs-orm'] === 'string') opts.nodejsOrm = raw['nodejs-orm']
  if (raw.nodejsAi && typeof raw.nodejsAi === 'string') opts.nodejsAi = raw.nodejsAi
  if (raw['nodejs-ai'] && typeof raw['nodejs-ai'] === 'string') opts.nodejsAi = raw['nodejs-ai']
  return opts
}

const CONTEXT_MD_NAME = 'context.md'

const CONTEXT_MD_TEMPLATE = `# 项目上下文地图

> 由 \`reef-start\` 阶段一结束时按需维护。
>
> 记录项目的技术栈、关键模块、历史踩坑和外部引用，供后续开发阶段（style、lint、testcase、codegen 等）使用。

---

## 技术栈

<!-- 模板变量将在 reef-start 中根据 wizard 配置自动填充 -->

- **语言**：{backend.language}/{frontend.framework}
- **构建工具**：
- **包管理**：
- **测试框架**：
- **ORM/数据库**：
- **CI/CD**：
- **部署目标**：

## 关键模块

<!-- 记录项目的主要模块 / 目录结构概览 -->

| 模块 | 路径 | 说明 |
|------|------|------|
|      |      |      |

## 架构决策记录（ADR）

<!-- 重要的技术决策及其理由 -->

| 决策 | 选择 | 理由 |
|------|------|------|
|      |      |      |

## 历史踩坑

<!-- 开发过程中遇到的问题和规避方案 -->

| 问题类型 | 问题描述 | 规避方案 |
|---------|---------|---------|
|         |         |         |

## 外部引用

<!-- 相关的 PRD 链接、设计稿、API 文档、第三方服务等 -->

- **PRD**：
- **设计稿**：
- **API 文档**：
- **第三方服务**：

## 依赖关系

<!-- 模块间的依赖关系图示或描述 -->

\`\`\`mermaid
graph TD
\`\`\`

---

> 此文件的维护时机：
> 1. \`reef-start\` 阶段一结束时按需创建/更新
> 2. 每次引入新的技术栈决策或发现值得记录的踩坑时追加
> 3. 重大架构变更时同步更新
`

/**
 * 初始化 .deepstorm/context.md 模板。
 * 如果文件已存在，不覆盖。
 */
export function initContextMap(targetDir: string, opts: InitOptions): void {
  const deepstormDir = path.join(targetDir, '.deepstorm')
  const contextPath = path.join(deepstormDir, CONTEXT_MD_NAME)
  if (fs.existsSync(contextPath)) return

  ensureDir(deepstormDir)

  const backendLang = opts.backend || 'none'
  const frontendFramework = opts.frontend || 'none'
  const content = CONTEXT_MD_TEMPLATE
    .replace('{backend.language}', backendLang)
    .replace('{frontend.framework}', frontendFramework)

  fs.writeFileSync(contextPath, content, 'utf-8')
  console.log('✔ 已创建 .deepstorm/context.md 项目上下文地图')
}

/**
 * 在 CLAUDE.md 末尾追加项目上下文引用行（已废弃，不再创建根目录 CLAUDE.md）。
 * 保留空实现以兼容已有调用。
 */
function appendClaudeMdRef(_targetDir: string): void {
  // 不再创建根目录 CLAUDE.md，所有项目信息通过 .claude/claude.md 提供
}

/**
 * 初始化 .claude/claude.md 项目信息文件。
 * 写入项目名称、技术栈概览和对 .deepstorm/context.md 的引用。
 * 如果文件已存在，不覆盖。
 */
export function initClaudeMd(targetDir: string, opts: InitOptions): void {
  const claudeDir = path.join(targetDir, '.claude')
  const claudeMdPath = path.join(claudeDir, 'CLAUDE.md')
  if (fs.existsSync(claudeMdPath)) return

  ensureDir(claudeDir)

  const projectName = opts.projectName || 'unknown'
  const lines: string[] = [
    `# ${projectName}`,
    '',
  ]

  // 技术栈区块
  const techLines: string[] = []
  if (opts.frontend) {
    techLines.push(`- **前端**：${opts.frontend}`)
    if (opts.uiLib) techLines.push(`- **UI 库**：${opts.uiLib}`)
    if (opts.cssFramework) techLines.push(`- **CSS 方案**：${opts.cssFramework}`)
  }
  if (opts.backend) {
    techLines.push(`- **后端**：${opts.backend === 'nodejs' ? 'Node.js (NestJS)' : opts.backend}`)
    if (opts.backend === 'nodejs') {
      if (opts.nodejsOrm) techLines.push(`- **ORM**：${opts.nodejsOrm}`)
      if (opts.nodejsAi) techLines.push(`- **AI 框架**：${opts.nodejsAi}`)
    } else {
      if (opts.orm) techLines.push(`- **ORM**：${opts.orm}`)
      if (opts.migration) techLines.push(`- **数据库迁移**：${opts.migration}`)
      if (opts.ai) techLines.push(`- **AI 框架**：${opts.ai}`)
    }
  }
  if (techLines.length > 0) {
    lines.push('## 技术栈', '')
    lines.push(...techLines)
    lines.push('')
  }

  lines.push('> 项目事实见 .deepstorm/context.md')
  lines.push('')

  fs.writeFileSync(claudeMdPath, lines.join('\n'), 'utf-8')
  console.log('✔ 已创建 .claude/claude.md 项目信息')
}

/**
 * 将 init 选择的技术方案写入 .deepstorm/settings.json 的 reef.* 命名空间。
 * 仅写入 init 问过的字段，不覆盖无关字段。
 *
 * 如果 opts 包含 frontend 或 backend 信息，同时初始化 .deepstorm/context.md。
 */
export function writeInitTechStack(baseDir: string, opts: InitOptions): void {
  const config: Record<string, string> = {}

  if (opts.frontend) {
    config['reef.techs'] = opts.backend ? 'frontend,backend' : 'frontend'
    config['reef.frontend.framework'] = opts.frontend
    if (opts.uiLib) config['reef.frontend.uiLibrary'] = opts.uiLib
    if (opts.cssFramework) config['reef.frontend.css'] = opts.cssFramework
  }

  if (opts.backend) {
    config['reef.techs'] = opts.frontend ? 'frontend,backend' : 'backend'
    config['reef.backend.language'] = opts.backend
    if (opts.backend === 'nodejs') {
      if (opts.nodejsOrm) config['reef.backend.nodejs.orm'] = opts.nodejsOrm
      if (opts.nodejsAi) config['reef.backend.nodejs.ai'] = opts.nodejsAi
    } else {
      if (opts.orm) config['reef.backend.java.orm'] = opts.orm
      if (opts.migration) config['reef.backend.java.dbMigration'] = opts.migration
      if (opts.ai) config['reef.backend.java.ai'] = opts.ai
    }
  }

  if (Object.keys(config).length === 0) return

  const nested = buildInitNestedConfig(config)
  writeDeepStormConfig(baseDir, nested)

  // 同步初始化 .deepstorm/context.md 和 .claude/claude.md
  initContextMap(baseDir, opts)
  initClaudeMd(baseDir, opts)
}

function buildInitNestedConfig(flat: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = { reef: {} }

  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.')
    let current = result
    for (let i = 0; i < parts.length; i++) {
      if (i === parts.length - 1) {
        current[parts[i]] = value
      } else {
        if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
          current[parts[i]] = {}
        }
        current = current[parts[i]]
      }
    }
  }

  return result
}

/**
 * 注册 init 子命令。
 */
export function registerInitCommand(program: Command, registry?: Registry): void {
  program
    .command('init')
    .description('初始化项目脚手架 — 选择技术栈，生成项目骨架')
    .option('--name <name>', '项目名称')
    .option('--frontend <framework>', '前端框架（angular）')
    .option('--backend <language>', '后端语言（java / nodejs）')
    .option('--output <dir>', '输出目录（默认为当前目录）')
    .option('--ui-lib <lib>', 'UI 库（primeng）')
    .option('--css <framework>', 'CSS 框架（tailwind）')
    .option('--orm <orm>', 'ORM 框架（hibernate）')
    .option('--migration <tool>', '数据库迁移工具（liquibase）')
    .option('--ai <framework>', 'AI 框架（spring-ai）')
    .option('--nodejs-orm <orm>', 'Node.js ORM（prisma）')
    .option('--nodejs-ai <framework>', 'Node.js AI 框架（claude-agent-sdk）')
    .action(async (options) => {
      const args = parseInitArgs(options)
      const targetDir = options.output || process.cwd()

      if (args.projectName && (args.frontend || args.backend)) {
        // 完整参数 → 直接生成
        await runInit(targetDir, args as InitOptions)
        if (args.projectName) {
          writeInitTechStack(targetDir, args as InitOptions)
          await promptContinueSetup(targetDir, args.projectName, registry)
        }
      } else {
        // 参数不全 → 交互模式
        const opts = await runInteractiveMode(targetDir)
        if (opts) {
          writeInitTechStack(targetDir, opts)
          if (opts.projectName) {
            await promptContinueSetup(targetDir, opts.projectName, registry)
          }
        }
      }
    })
}

async function promptContinueSetup(targetDir: string, projectName: string, registry?: Registry): Promise<void> {
  // 没有 registry 时跳过引导（如：非交互测试或未传入 registry）
  if (!registry) return
  if (!registry.tools || Object.keys(registry.tools).length === 0) return

  const { confirm, isCancel, outro } = await import('@clack/prompts')

  const projectPath = path.join(targetDir, projectName)
  const shouldContinue = await confirm({
    message: `是否继续安装 DeepStorm 开发环境（skills + MCP 服务）？`,
    initialValue: true,
  })

  if (isCancel(shouldContinue)) {
    outro('已取消')
    return
  }

  if (shouldContinue) {
    console.log(`\n✔ 请运行以下命令继续安装:\n    cd ${projectName} && deepstorm setup\n`)
  } else {
    console.log(`\nℹ 你可以稍后运行以下命令来安装开发环境:\n    cd ${projectName} && deepstorm setup\n`)
  }
}

// ──────────────────────────────────────
// 模板变量接口
// ──────────────────────────────────────

interface TemplateContext {
  projectName: string
  packageName: string
  groupId: string
  frontend: string | false
  backend: string | false
  uiLib: string | false
  cssFramework: string | false
  orm: string | false
  migration: string | false
  ai: string | false
}

function buildContext(opts: InitOptions): TemplateContext {
  const projectName = opts.projectName || 'project'
  const packageName = projectName.replace(/[_-]/g, '').toLowerCase()
  return {
    projectName,
    packageName,
    groupId: `com.${packageName}`,
    frontend: opts.frontend || false,
    backend: opts.backend || false,
    uiLib: opts.uiLib || false,
    cssFramework: opts.cssFramework || false,
    orm: opts.orm || false,
    migration: opts.migration || false,
    ai: opts.ai || false,
  }
}

// ──────────────────────────────────────
// 主函数
// ──────────────────────────────────────

/**
 * 运行 init 交互模式。
 */
export async function runInteractiveMode(targetDir: string): Promise<InitOptions | undefined> {
  // Dynamic import of @clack/prompts for interactive mode
  // This avoids requiring it when using CLI args
  const { intro, outro, text, select, isCancel, confirm } = await import('@clack/prompts')

  intro('🚀 DeepStorm Init — 项目脚手架初始化')

  const isProjectDir = await confirm({
    message: '当前路径是否为项目目录？',
    initialValue: false,
  })
  if (isCancel(isProjectDir)) {
    outro('已取消')
    return
  }

  let projectName: string | undefined

  if (isProjectDir) {
    // 用户已在项目目录 → 跳过项目名询问，原地初始化
    console.log('✓ 将在当前目录直接生成脚手架')
    projectName = undefined
  } else {
    // 需要创建新目录 → 询问项目名
    const name = await text({
      message: '项目名称：',
      placeholder: 'my-project',
      validate: (value) => {
        if (!value) return '请输入项目名称'
        if (!VALID_PROJECT_NAME.test(value)) return '项目名仅支持字母、数字、下划线和短横线'
        return undefined
      },
    })
    if (isCancel(name) || typeof name !== 'string') {
      outro('已取消')
      return
    }
    projectName = name
  }

  const frontendChoice = await select({
    message: '选择前端框架：',
    options: [
      { value: 'angular', label: 'Angular' },
      { value: 'none', label: '不需要前端' },
    ],
  })
  if (isCancel(frontendChoice)) {
    outro('已取消')
    return
  }

  let uiLib: string | undefined
  let cssFramework: string | undefined
  if (frontendChoice === 'angular') {
    const uiLibResult = await select({
      message: '选择 UI 库：',
      options: [
        { value: 'primeng', label: 'PrimeNG' },
        { value: 'none', label: '无（仅 Angular 核心）' },
      ],
    })
    if (isCancel(uiLibResult)) { outro('已取消'); return }
    uiLib = uiLibResult

    const cssResult = await select({
      message: '选择 CSS 方案：',
      options: [
        { value: 'tailwind', label: 'Tailwind CSS' },
        { value: 'none', label: '标准 CSS' },
      ],
    })
    if (isCancel(cssResult)) { outro('已取消'); return }
    cssFramework = cssResult
  }

  const backendChoice = await select({
    message: '选择后端框架：',
    options: [
      { value: 'java', label: 'Java (Spring Boot)' },
      { value: 'nodejs', label: 'Node.js (NestJS)' },
      { value: 'none', label: '不需要后端' },
    ],
  })
  if (isCancel(backendChoice)) {
    outro('已取消')
    return
  }

  let orm: string | undefined
  let migration: string | undefined
  let aiChoice: string | undefined
  if (backendChoice === 'java') {
    const ormResult = await select({
      message: '选择 ORM 框架：',
      options: [
        { value: 'hibernate', label: 'Hibernate' },
        { value: 'none', label: '无' },
      ],
    })
    if (isCancel(ormResult)) { outro('已取消'); return }
    orm = ormResult

    const migrationResult = await select({
      message: '选择数据库迁移工具：',
      options: [
        { value: 'liquibase', label: 'Liquibase' },
        { value: 'none', label: '无' },
      ],
    })
    if (isCancel(migrationResult)) { outro('已取消'); return }
    migration = migrationResult

    const aiResult = await select({
      message: '选择 AI 框架：',
      options: [
        { value: 'spring-ai', label: 'Spring AI' },
        { value: 'none', label: '无' },
      ],
    })
    if (isCancel(aiResult)) { outro('已取消'); return }
    aiChoice = aiResult
  }

  let nodejsOrm: string | undefined
  let nodejsAi: string | undefined
  if (backendChoice === 'nodejs') {
    const ormResult = await select({
      message: '选择 ORM 框架：',
      options: [
        { value: 'prisma', label: 'Prisma' },
        { value: 'none', label: '无' },
      ],
    })
    if (isCancel(ormResult)) { outro('已取消'); return }
    nodejsOrm = ormResult

    const aiResult = await select({
      message: '选择 AI 框架：',
      options: [
        { value: 'claude-agent-sdk', label: 'Claude Agent SDK' },
        { value: 'none', label: '无' },
      ],
    })
    if (isCancel(aiResult)) { outro('已取消'); return }
    nodejsAi = aiResult
  }

  if ((!frontendChoice || frontendChoice === 'none') && (!backendChoice || backendChoice === 'none')) {
    console.error('❌ 至少需要选择前端或后端之一')
    outro('初始化失败')
    return
  }

  const opts: InitOptions = {
    projectName,
    frontend: frontendChoice === 'none' ? undefined : frontendChoice as string,
    backend: backendChoice === 'none' ? undefined : backendChoice as string,
    uiLib: uiLib && uiLib !== 'none' ? uiLib : undefined,
    cssFramework: cssFramework && cssFramework !== 'none' ? cssFramework : undefined,
    orm: orm && orm !== 'none' ? orm : undefined,
    migration: migration && migration !== 'none' ? migration : undefined,
    ai: aiChoice && aiChoice !== 'none' ? aiChoice : undefined,
    nodejsOrm: nodejsOrm && nodejsOrm !== 'none' ? nodejsOrm : undefined,
    nodejsAi: nodejsAi && nodejsAi !== 'none' ? nodejsAi : undefined,
  }

  await runInit(targetDir, opts)

  outro('✅ 项目已生成！')
  return opts
}

/**
 * 运行 init，生成项目脚手架。
 * - 有 `projectName` 时：创建子目录并生成
 * - 无 `projectName` 时：原地初始化（当前目录即项目目录）
 */
export async function runInit(baseDir: string, opts: InitOptions): Promise<void> {
  const inPlace = !opts.projectName
  const projectName = inPlace ? 'project' : opts.projectName!

  if (!inPlace && !VALID_PROJECT_NAME.test(projectName)) {
    throw new Error(`项目名 "${projectName}" 包含非法字符。仅支持字母、数字、下划线和短横线。`)
  }

  const projectDir = inPlace ? baseDir : path.join(baseDir, projectName)

  if (!inPlace && fs.existsSync(projectDir)) {
    throw new Error(`目标目录 ${projectDir} 已存在。请删除后重试或使用其他项目名。`)
  }

  if (!inPlace) {
    fs.mkdirSync(projectDir, { recursive: true })
  }

  const ctx = buildContext(opts)
  const hasFrontend = opts.frontend === 'angular'
  const hasJavaBackend = opts.backend === 'java'
  const hasNodeBackend = opts.backend === 'nodejs'
  const hasBackend = hasJavaBackend || hasNodeBackend

  try {
    const isMonorepo = hasFrontend && hasNodeBackend
    if (isMonorepo) {
      // Angular + NestJS 全栈 = monorepo：server/ + client/
      renderAngularTemplate(path.join(projectDir, 'client'), ctx, true)
      renderNestJSTemplate(path.join(projectDir, 'server'), ctx, opts)
      renderMonorepoRoot(projectDir, ctx)
    } else {
      if (hasFrontend) {
        renderAngularTemplate(projectDir, ctx)
      }
      if (hasJavaBackend) {
        renderJavaTemplate(projectDir, ctx)
      }
      if (hasNodeBackend) {
        renderNestJSTemplate(projectDir, ctx, opts)
      }
    }
    renderCommonFiles(projectDir, ctx, opts)

    console.log(`\n✔ 项目已创建: ${projectDir}`)
    console.log('\n下一步:')
    if (!inPlace) {
      console.log(`  cd ${opts.projectName}`)
    }
    if (isMonorepo) {
      console.log(`  cd client && pnpm install  # 安装前端依赖`)
      console.log(`  cd server && pnpm install  # 安装后端依赖`)
      console.log(`  pnpm dev                  # 启动前后端开发服务器`)
    } else {
      if (opts.frontend) console.log(`  pnpm install        # 安装前端依赖`)
      if (hasJavaBackend) console.log(`  ./gradlew build      # 构建后端`)
      if (hasNodeBackend) console.log(`  pnpm install         # 安装依赖`)
    }
    console.log()
    printProjectTree(projectDir, hasFrontend, hasJavaBackend, hasNodeBackend)

    // 原地初始化模式末尾兜底生成 claude.md
    if (inPlace) {
      initClaudeMd(baseDir, opts)
    }
  } catch (err) {
    // 清理：如果渲染失败，删除已创建的项目目录（原地模式不删除 baseDir）
    if (!inPlace && fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true })
    }
    throw err
  }
}

// ──────────────────────────────────────
// Angular 模板渲染
// ──────────────────────────────────────

function renderAngularTemplate(projectDir: string, ctx: TemplateContext, subPkg = false): void {
  const hasPrimeng = ctx.uiLib === 'primeng'
  const hasTailwind = ctx.cssFramework === 'tailwind'
  const webRoot = subPkg ? 'src' : 'src/main/web'

  // angular.json
  writeTemplate(projectDir, 'angular.json', JSON.stringify({
    $schema: './node_modules/@angular/cli/lib/config/schema.json',
    version: 1,
    newProjectRoot: 'projects',
    projects: {
      [ctx.packageName]: {
        projectType: 'application',
        root: '',
        sourceRoot: webRoot,
        prefix: 'app',
        architect: {
          build: {
            builder: '@angular-devkit/build-angular:application',
            options: {
              outputPath: 'build',
              index: `${webRoot}/index.html`,
              browser: `${webRoot}/main.ts`,
              polyfills: ['zone.js'],
              tsConfig: 'tsconfig.app.json',
              assets: [{ glob: '**/*', input: 'public' }],
              styles: getAngularStyles(hasPrimeng, webRoot),
              scripts: [],
            },
            configurations: {
              production: { budgets: [], outputHashing: 'all' },
              development: { optimization: false, extractLicenses: false, sourceMap: true },
            },
            defaultConfiguration: 'production',
          },
          serve: {
            builder: '@angular-devkit/build-angular:dev-server',
            configurations: { production: { buildTarget: `${ctx.packageName}:build:production` }, development: { buildTarget: `${ctx.packageName}:build:development` } },
            defaultConfiguration: 'development',
            options: { proxyConfig: 'proxy.conf.json' },
          },
          test: {
            builder: '@angular-devkit/build-angular:karma',
            options: { polyfills: ['zone.js', 'zone.js/testing'], tsConfig: 'tsconfig.spec.json', assets: [{ glob: '**/*', input: 'public' }], styles: getAngularStyles(hasPrimeng, webRoot), scripts: [] },
          },
        },
      },
    },
  }, null, 2))

  // tsconfig.json
  writeTemplate(projectDir, 'tsconfig.json', JSON.stringify({
    compileOnSave: false,
    compilerOptions: {
      baseUrl: './',
      outDir: './dist',
      forceConsistentCasingInFileNames: true,
      strict: true,
      noImplicitOverride: true,
      noPropertyAccessFromIndexSignature: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,
      sourceMap: true,
      declaration: false,
      downlevelIteration: true,
      experimentalDecorators: true,
      moduleResolution: 'bundler',
      importHelpers: true,
      target: 'ES2022',
      module: 'ES2022',
      lib: ['ES2022', 'dom'],
      skipLibCheck: true,
    },
    angularCompilerOptions: {
      enableI18nLegacyMessageIdFormat: false,
      strictInjectionParameters: true,
      strictInputAccessModifiers: true,
      strictTemplates: true,
    },
  }, null, 2))

  // tsconfig.app.json
  writeTemplate(projectDir, 'tsconfig.app.json', JSON.stringify({
    extends: './tsconfig.json',
    compilerOptions: { outDir: './out-tsc/app', types: [] },
    files: [`${webRoot}/main.ts`],
    include: ['src/**/*.d.ts'],
  }, null, 2))

  // tsconfig.spec.json
  writeTemplate(projectDir, 'tsconfig.spec.json', JSON.stringify({
    extends: './tsconfig.json',
    compilerOptions: { outDir: './out-tsc/spec', types: ['jasmine'] },
    include: ['src/**/*.spec.ts', 'src/**/*.d.ts'],
  }, null, 2))

  // package.json
  const pkgDeps: Record<string, string> = {
    '@angular/animations': '^21.0.0',
    '@angular/common': '^21.0.0',
    '@angular/compiler': '^21.0.0',
    '@angular/core': '^21.0.0',
    '@angular/forms': '^21.0.0',
    '@angular/platform-browser': '^21.0.0',
    '@angular/router': '^21.0.0',
    'rxjs': '~7.8.0',
    'tslib': '^2.3.0',
    'zone.js': '~0.15.0',
  }
  const devDeps: Record<string, string> = {
    '@angular-devkit/build-angular': '^21.0.0',
    '@angular/cli': '^21.0.0',
    '@angular/compiler-cli': '^21.0.0',
    'typescript': '~5.7.0',
  }

  if (hasPrimeng) {
    pkgDeps['primeng'] = '^21.0.0'
    pkgDeps['@primeng/themes'] = '^21.0.0'
    pkgDeps['@primeuix/themes'] = '^2.0.0'
  }

  writeTemplate(projectDir, 'package.json', JSON.stringify({
    name: ctx.packageName,
    version: '1.0.0-dev',
    private: true,
    packageManager: 'pnpm@10.0.0',
    scripts: {
      ng: 'ng',
      start: 'ng serve',
      build: 'ng build',
      watch: 'ng build --watch --configuration development',
      test: 'ng test',
      lint: 'ng lint',
      typecheck: 'tsc --build --noEmit',
    },
    dependencies: pkgDeps,
    devDependencies: devDeps,
  }, null, 2))

  // proxy.conf.json
  writeTemplate(projectDir, 'proxy.conf.json', JSON.stringify({
    '/api': {
      target: 'http://localhost:8080',
      secure: false,
    },
  }, null, 2))

  // eslint.config.mjs
  writeTemplate(projectDir, 'eslint.config.mjs', `import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
`)

  // public/ (assets referenced in angular.json)
  ensureDir(path.join(projectDir, 'public'))

  // Angular source directory
  ensureDir(path.join(projectDir, webRoot, 'app'))

  writeTemplate(projectDir, `${webRoot}/index.html`, `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>${ctx.projectName}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/x-icon" href="favicon.ico">
</head>
<body>
  <app-root></app-root>
</body>
</html>
`)

  writeTemplate(projectDir, `${webRoot}/main.ts`, `import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
`)

  const stylesContent = hasTailwind
    ? `@import "tailwindcss";\n\n/* 全局样式 */\n`
    : `/* 全局样式 */\n`

  writeTemplate(projectDir, `${webRoot}/styles.css`, stylesContent)

  // app/
  writeTemplate(projectDir, `${webRoot}/app/app.ts`, `import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: \`<router-outlet></router-outlet>\`,
})
export class App {}
`)

  writeTemplate(projectDir, `${webRoot}/app/app.config.ts`, `import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
  ],
};
`)

  writeTemplate(projectDir, `${webRoot}/app/app.routes.ts`, `import { Routes } from '@angular/router';

export const routes: Routes = [];
`)

  // Tailwind config
  if (hasTailwind) {
    writeTemplate(projectDir, 'postcss.config.json', JSON.stringify({
      plugins: { '@tailwindcss/postcss': {} },
    }, null, 2))
  }
}

function getAngularStyles(hasPrimeng: boolean, webRoot: string): string[] {
  const styles: string[] = []
  if (hasPrimeng) {
    styles.push('@primeng/themes/aura/aura.css')
  }
  styles.push(`${webRoot}/styles.css`)
  return styles
}

// ──────────────────────────────────────
// Monorepo 根配置（用于 Angular + NestJS 全栈项目）
// ──────────────────────────────────────

function renderMonorepoRoot(projectDir: string, ctx: TemplateContext): void {
  // 根 package.json — 使用 pnpm workspace 委托子包
  writeTemplate(projectDir, 'package.json', JSON.stringify({
    name: ctx.packageName,
    version: '0.1.0',
    private: true,
    description: '',
    scripts: {
      dev: 'pnpm --filter server dev & pnpm --filter client dev',
      build: 'pnpm --filter server build',
      lint: 'pnpm --filter server lint',
      format: 'pnpm --filter server format',
      test: 'pnpm --filter server test',
    },
  }, null, 2))

  // pnpm-workspace.yaml
  writeTemplate(projectDir, 'pnpm-workspace.yaml', `packages:
  - "server"
  - "client"
`)
}

// ──────────────────────────────────────
// Java 模板渲染
// ──────────────────────────────────────

function renderJavaTemplate(projectDir: string, ctx: TemplateContext): void {
  const hasOrm = ctx.orm === 'hibernate'
  const hasLiquibase = ctx.migration === 'liquibase'
  const hasSpringAi = ctx.ai === 'spring-ai'

  // settings.gradle.kts
  writeTemplate(projectDir, 'settings.gradle.kts', `rootProject.name = "${ctx.packageName}"
`)

  // gradle.properties
  writeTemplate(projectDir, 'gradle.properties', `# Gradle JVM 参数
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
# 并行构建
org.gradle.parallel=true
`)

  // build.gradle.kts
  const plugins: string[] = [
    'java',
    'org.springframework.boot',
    'io.spring.dependency-management',
  ]
  const gradleDeps: string[] = [
    'implementation("org.springframework.boot:spring-boot-starter-web")',
    'implementation("org.springframework.boot:spring-boot-starter-validation")',
    'compileOnly("org.jetbrains:annotations:26.0.2")',
  ]
  if (hasOrm) {
    gradleDeps.push('implementation("org.springframework.boot:spring-boot-starter-data-jpa")')
  }
  if (hasLiquibase) {
    gradleDeps.unshift('id("org.liquibase.gradle") version "2.2.2"')
    gradleDeps.push('implementation("org.liquibase:liquibase-core")')
  }
  if (hasSpringAi) {
    gradleDeps.push('implementation("org.springframework.ai:spring-ai-openai-spring-boot-starter")')
  }
  const reposExtra = hasSpringAi
    ? '\n  maven { url = uri("https://repo.spring.io/milestone") }'
    : ''

  writeTemplate(projectDir, 'build.gradle.kts', `plugins {
  ${plugins.map(p => `id("${p}") version "3.4.0"`).join('\n  ')}${
    hasLiquibase ? `\n  id("org.liquibase.gradle") version "2.2.2"` : ''
  }
}

group = "${ctx.groupId}"
version = "1.0.0-SNAPSHOT"
description = "${ctx.projectName}"

java {
  toolchain {
    languageVersion = JavaLanguageVersion.of(21)
  }
}

repositories {
  mavenCentral()${reposExtra}
}

dependencies {
  ${gradleDeps.join('\n  ')}

  testImplementation("org.springframework.boot:spring-boot-starter-test")
  testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

tasks.withType<Test> {
  useJUnitPlatform()
}
`)

  // Java 应用入口
  const appPackage = ctx.groupId.replace(/[.-]/g, '.')
  const appDir = `src/main/java/${appPackage.replace(/\./g, '/')}`
  ensureDir(path.join(projectDir, appDir))

  writeTemplate(projectDir, `${appDir}/Application.java`, `package ${appPackage};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {

  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }
}
`)

  // 基础控制器
  const controllerDir = `${appDir}/controller`
  ensureDir(path.join(projectDir, controllerDir))
  writeTemplate(projectDir, `${controllerDir}/HealthController.java`, `package ${appPackage}.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

  @GetMapping("/api/health")
  public String health() {
    return "OK";
  }
}
`)

  // 基础服务
  const serviceDir = `${appDir}/service`
  ensureDir(path.join(projectDir, serviceDir))

  // 基础仓库（仅当有 ORM 时）
  if (hasOrm) {
    const repositoryDir = `${appDir}/repository`
    ensureDir(path.join(projectDir, repositoryDir))
    const entityDir = `${appDir}/entity`
    ensureDir(path.join(projectDir, entityDir))

    writeTemplate(projectDir, `${entityDir}/BaseEntity.java`, `package ${appPackage}.entity;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import java.time.LocalDateTime;

@MappedSuperclass
public abstract class BaseEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
`)
  }

  // resources
  ensureDir(path.join(projectDir, 'src/main/resources'))

  const datasourceConfig = hasOrm
    ? `\nspring:
  datasource:
    url: jdbc:h2:mem:${ctx.packageName}
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: false
    properties:
      hibernate:
        format_sql: true
`
    : ''

  const liquibaseConfig = hasLiquibase
    ? `\n  liquibase:
    change-log: classpath:db/changelog/db.changelog-master.xml
`
    : ''

  writeTemplate(projectDir, 'src/main/resources/application.yml', `server:
  port: 8080
${datasourceConfig}${liquibaseConfig}
logging:
  level:
    root: INFO
    ${ctx.packageName}: DEBUG
`)

  if (hasLiquibase) {
    const now = new Date()
    const ts = now.toISOString().replace(/\D/g, '').slice(0, 12)
    ensureDir(path.join(projectDir, 'src/main/resources/db/changelog'))
    writeTemplate(projectDir, 'src/main/resources/db/changelog/db.changelog-master.xml', `<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
  xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-latest.xsd">

  <changeSet id="${ts}-001" author="deepstorm">
    <createTable tableName="flyway_schema_history">
      <column name="version" type="VARCHAR(50)"/>
    </createTable>
  </changeSet>
</databaseChangeLog>
`)
  }

  // Test skeleton
  const testDir = `src/test/java/${appPackage.replace(/\./g, '/')}`
  ensureDir(path.join(projectDir, testDir))
  ensureDir(path.join(projectDir, 'src/test/resources'))

  writeTemplate(projectDir, `${testDir}/ApplicationTests.java`, `package ${appPackage};

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ApplicationTests {

  @Test
  void contextLoads() {
  }
}
`)

  writeTemplate(projectDir, 'src/test/resources/junit-platform.properties', `junit.jupiter.testinstance.lifecycle.default = per_class
`)

  // Gradle wrapper
  ensureDir(path.join(projectDir, 'gradle/wrapper'))
  writeTemplate(projectDir, 'gradle/wrapper/gradle-wrapper.properties', `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.12-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`)

  // gradlew (shell script)
  writeTemplate(projectDir, 'gradlew', `#!/bin/sh

#
# Gradle start up script for POSIX generated by Gradle.
#

# Attempt to set APP_HOME
PRG="$0"
while [ -h "$PRG" ] ; do
  ls=$(ls -ld "$PRG")
  link=$(expr "$ls" : '.*-> \\(.*\\)$')
  if expr "$link" : '/.*' > /dev/null; then
    PRG="$link"
  else
    PRG=$(dirname "$PRG")/"$link"
  fi
done
SAVED="$(pwd)"
cd "$(dirname "$PRG")/" >/dev/null
APP_HOME="$(pwd -P)"
cd "$SAVED" >/dev/null

APP_NAME="Gradle"
APP_BASE_NAME=$(basename "$0")

MAX_FD="maximum"

warn () {
  echo "$*"
} >&2

die () {
  echo
  echo "$*"
  echo
  exit 1
} >&2

DEFAULT_JVM_OPTS='"-Xmx64m" "-Xms64m"'

CLASSPATH=$APP_HOME/gradle/wrapper/gradle-wrapper.jar

# Determine the Java command to use to start the JVM.
if [ -n "$JAVA_HOME" ] ; then
  if [ -x "$JAVA_HOME/jre/sh/java" ] ; then
    JAVACMD="$JAVA_HOME/jre/sh/java"
  else
    JAVACMD="$JAVA_HOME/bin/java"
  fi
  if [ ! -x "$JAVACMD" ] ; then
    die "ERROR: JAVA_HOME is set to an invalid directory: $JAVA_HOME"
  fi
else
  JAVACMD="java"
  which java >/dev/null 2>&1 || die "ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH."
fi

exec "$JAVACMD" $DEFAULT_JVM_OPTS $JAVA_OPTS $GRADLE_OPTS -classpath "$CLASSPATH" org.gradle.wrapper.GradleWrapperMain "$@"
`)

  // gradlew.bat
  writeTemplate(projectDir, 'gradlew.bat', `@rem
@rem Gradle startup script for Windows
@rem
@if "%DEBUG%"=="" @echo off
@rem Set local scope for the variables
setlocal enabledelayedexpansion
set APP_BASE_NAME=%~n0
set APP_HOME=%CD%
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"
set CLASSPATH=%APP_HOME%/gradle/wrapper/gradle-wrapper.jar
"%JAVA_HOME%/bin/java.exe" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*
:end
@endlocal & exit /b %ERRORLEVEL%
`)
}

// ──────────────────────────────────────
// Node.js (NestJS) 模板渲染
// ──────────────────────────────────────

function renderNestJSTemplate(projectDir: string, ctx: TemplateContext, opts: InitOptions): void {
  const hasPrisma = opts.nodejsOrm === 'prisma'
  const hasAgentSdk = opts.nodejsAi === 'claude-agent-sdk'

  // package.json
  const pkgDeps: Record<string, string> = {
    '@nestjs/common': '^11.0.0',
    '@nestjs/core': '^11.0.0',
    '@nestjs/platform-express': '^11.0.0',
    '@nestjs/config': '^4.0.0',
    '@nestjs/swagger': '^9.0.0',
    'class-validator': '^0.14.0',
    'class-transformer': '^0.5.0',
    'reflect-metadata': '^0.2.0',
    rxjs: '^7.8.0',
  }
  const devDeps: Record<string, string> = {
    '@nestjs/cli': '^11.0.0',
    '@nestjs/schematics': '^11.0.0',
    '@nestjs/testing': '^11.0.0',
    '@types/express': '^5.0.0',
    '@types/jest': '^29.5.0',
    '@types/node': '^22.0.0',
    '@typescript-eslint/eslint-plugin': '^8.0.0',
    '@typescript-eslint/parser': '^8.0.0',
    eslint: '^9.0.0',
    'eslint-config-prettier': '^10.0.0',
    'eslint-plugin-prettier': '^5.0.0',
    jest: '^29.7.0',
    prettier: '^3.4.0',
    'source-map-support': '^0.5.0',
    'ts-jest': '^29.0.0',
    'ts-loader': '^9.5.0',
    'ts-node': '^10.9.0',
    'tsconfig-paths': '^4.2.0',
    typescript: '^5.7.0',
  }

  if (hasPrisma) {
    pkgDeps['@prisma/client'] = '^6.0.0'
    devDeps.prisma = '^6.0.0'
  }
  if (hasAgentSdk) {
    pkgDeps['@anthropic-ai/sdk'] = '^0.40.0'
  }

  writeTemplate(projectDir, 'package.json', JSON.stringify({
    name: ctx.packageName,
    version: '0.1.0',
    description: '',
    private: true,
    scripts: {
      build: 'nest build',
      format: 'prettier --write "src/**/*.ts"',
      start: 'nest start',
      'start:dev': 'nest start --watch',
      'start:prod': 'node dist/main',
      lint: 'eslint "{src,test}/**/*.ts" --fix',
      test: 'jest',
      'test:watch': 'jest --watch',
      'test:cov': 'jest --coverage',
      'test:e2e': 'jest --config ./test/jest-e2e.json',
    },
    dependencies: pkgDeps,
    devDependencies: devDeps,
    jest: {
      moduleFileExtensions: ['js', 'json', 'ts'],
      rootDir: 'src',
      testRegex: '.*\\.spec\\.ts$',
      transform: { '^.+\\.(t|j)s$': 'ts-jest' },
      collectCoverageFrom: ['**/*.(t|j)s'],
      coverageDirectory: '../coverage',
      testEnvironment: 'node',
    },
  }, null, 2))

  // tsconfig.json
  writeTemplate(projectDir, 'tsconfig.json', JSON.stringify({
    compilerOptions: {
      module: 'commonjs',
      declaration: true,
      removeComments: true,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      allowSyntheticDefaultImports: true,
      target: 'ES2023',
      sourceMap: true,
      outDir: './dist',
      baseUrl: './',
      incremental: true,
      skipLibCheck: true,
      strict: true,
      strictNullChecks: true,
      noImplicitAny: true,
      strictBindCallApply: true,
      forceConsistentCasingInFileNames: true,
      noFallthroughCasesInSwitch: true,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
  }, null, 2))

  // nest-cli.json
  writeTemplate(projectDir, 'nest-cli.json', JSON.stringify({
    $schema: 'https://json.schemastore.org/nest-cli',
    collection: '@nestjs/schematics',
    sourceRoot: 'src',
    compilerOptions: { deleteOutDir: true },
  }, null, 2))

  // .prettierrc
  writeTemplate(projectDir, '.prettierrc', JSON.stringify({
    singleQuote: true,
    trailingComma: 'all',
    tabWidth: 2,
    semi: true,
    printWidth: 120,
  }, null, 2))

  // src/ 目录
  ensureDir(path.join(projectDir, 'src'))

  // src/main.ts
  writeTemplate(projectDir, 'src/main.ts', [
    "import { NestFactory } from '@nestjs/core';",
    "import { ValidationPipe, Logger } from '@nestjs/common';",
    "import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';",
    "import { AppModule } from './app.module';",
    '',
    'async function bootstrap() {',
    '  const app = await NestFactory.create(AppModule);',
    "  const logger = new Logger('Bootstrap');",
    '',
    "  app.setGlobalPrefix('api/v1');",
    '',
    '  app.useGlobalPipes(',
    '    new ValidationPipe({',
    '      whitelist: true,',
    '      forbidNonWhitelisted: true,',
    '      transform: true,',
    '    }),',
    '  );',
    '',
    '  const config = new DocumentBuilder()',
    `    .setTitle('${ctx.projectName}')`,
    "    .setDescription('API documentation')",
    "    .setVersion('1.0')",
    '    .addBearerAuth()',
    '    .build();',
    '  const document = SwaggerModule.createDocument(app, config);',
    "  SwaggerModule.setup('api/docs', app, document);",
    '',
    '  app.enableCors({',
    "    origin: process.env.CORS_ORIGIN || '*',",
    "    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',",
    '    credentials: true,',
    '  });',
    '',
    '  const port = process.env.PORT || 3000;',
    '  await app.listen(port);',
    '  logger.log(`Application running on http://localhost:${port}`);',
    '  logger.log(`Swagger docs at http://localhost:${port}/api/docs`);',
    '}',
    'bootstrap();',
    '',
  ].join('\n'))

  // src/app.module.ts
  const appModuleContent: string[] = [
    "import { Module } from '@nestjs/common';",
    "import { ConfigModule } from '@nestjs/config';",
    "import { AppController } from './app.controller';",
    "import { AppService } from './app.service';",
  ]
  const appModuleImports: string[] = [
    '    ConfigModule.forRoot({',
    '      isGlobal: true,',
    '    }),',
  ]
  if (hasPrisma) {
    appModuleContent.push("import { PrismaModule } from './prisma/prisma.module';")
    appModuleImports.push('    PrismaModule,')
  }
  if (hasAgentSdk) {
    appModuleContent.push("import { AgentModule } from './agent/agent.module';")
    appModuleImports.push('    AgentModule,')
  }
  appModuleContent.push('')
  appModuleContent.push('/**')
  appModuleContent.push(' * 应用根模块')
  appModuleContent.push(' */')
  appModuleContent.push('@Module({')
  appModuleContent.push('  imports: [')
  appModuleContent.push(appModuleImports.join('\n'))
  appModuleContent.push('  ],')
  appModuleContent.push('  controllers: [AppController],')
  appModuleContent.push('  providers: [AppService],')
  appModuleContent.push('})')
  appModuleContent.push('export class AppModule {}')
  writeTemplate(projectDir, 'src/app.module.ts', appModuleContent.join('\n'))

  // src/app.controller.ts
  writeTemplate(projectDir, 'src/app.controller.ts', [
    "import { Controller, Get } from '@nestjs/common';",
    "import { ApiTags, ApiOperation } from '@nestjs/swagger';",
    "import { AppService } from './app.service';",
    '',
    "@ApiTags('Health')",
    '@Controller()',
    'export class AppController {',
    '  constructor(private readonly appService: AppService) {}',
    '',
    '  @Get()',
    "  @ApiOperation({ summary: '健康检查' })",
    '  getHello(): string {',
    '    return this.appService.getHello();',
    '  }',
    '}',
    '',
  ].join('\n'))

  // src/app.service.ts
  writeTemplate(projectDir, 'src/app.service.ts', [
    "import { Injectable } from '@nestjs/common';",
    '',
    '@Injectable()',
    'export class AppService {',
    '  getHello(): string {',
    `    return 'Hello from ${ctx.projectName}!';`,
    '  }',
    '}',
    '',
  ].join('\n'))

  // Prisma 文件
  if (hasPrisma) {
    ensureDir(path.join(projectDir, 'prisma'))
    writeTemplate(projectDir, 'prisma/schema.prisma', [
      'generator client {',
      '  provider = "prisma-client-js"',
      '}',
      '',
      'datasource db {',
      '  provider = "postgresql"',
      '  url      = env("DATABASE_URL")',
      '}',
      '',
      '/// 用户',
      'model User {',
      '  id        Int      @id @default(autoincrement())',
      '  name      String',
      '  email     String   @unique',
      '  active    Boolean  @default(true)',
      '  createdAt DateTime @default(now())',
      '  updatedAt DateTime @updatedAt',
      '',
      '  @@map("users")',
      '}',
      '',
    ].join('\n'))

    ensureDir(path.join(projectDir, 'src/prisma'))
    writeTemplate(projectDir, 'src/prisma/prisma.module.ts', [
      "import { Global, Module } from '@nestjs/common';",
      "import { PrismaService } from './prisma.service';",
      '',
      '@Global()',
      '@Module({',
      '  providers: [PrismaService],',
      '  exports: [PrismaService],',
      '})',
      'export class PrismaModule {}',
      '',
    ].join('\n'))

    writeTemplate(projectDir, 'src/prisma/prisma.service.ts', [
      "import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';",
      "import { PrismaClient } from '@prisma/client';",
      '',
      '@Injectable()',
      'export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {',
      "  private readonly logger = new Logger(PrismaService.name);",
      '',
      '  async onModuleInit() {',
      '    await this.$connect();',
      "    this.logger.log('Database connected');",
      '  }',
      '',
      '  async onModuleDestroy() {',
      '    await this.$disconnect();',
      "    this.logger.log('Database disconnected');",
      '  }',
      '}',
      '',
    ].join('\n'))
  }

  // Agent SDK 文件
  if (hasAgentSdk) {
    ensureDir(path.join(projectDir, 'src/agent/tools'))
    writeTemplate(projectDir, 'src/agent/agent.module.ts', [
      "import { Module } from '@nestjs/common';",
      "import { AgentService } from './agent.service';",
      '',
      '@Module({',
      '  providers: [AgentService],',
      '  exports: [AgentService],',
      '})',
      'export class AgentModule {}',
      '',
    ].join('\n'))

    writeTemplate(projectDir, 'src/agent/agent.service.ts', [
      "import { Injectable, Logger } from '@nestjs/common';",
      "import { ConfigService } from '@nestjs/config';",
      '',
      '/**',
      ' * Claude Agent 服务',
      ' *',
      ' * 封装 Claude Agent SDK，提供 Agent 交互能力。',
      ' * 使用前需在 .env 中配置 ANTHROPIC_API_KEY。',
      ' */',
      '@Injectable()',
      'export class AgentService {',
      '  private readonly logger = new Logger(AgentService.name);',
      '',
      '  constructor(private readonly configService: ConfigService) {',
      "    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');",
      '    if (!apiKey) {',
      "      this.logger.warn('ANTHROPIC_API_KEY is not configured');",
      '    }',
      '  }',
      '',
      '  async ask(question: string): Promise<string> {',
      "    this.logger.debug(`Agent ask: \"${question}\"`);",
      "    return 'Agent response placeholder -- configure ANTHROPIC_API_KEY to enable';",
      '  }',
      '}',
      '',
    ].join('\n'))

    writeTemplate(projectDir, 'src/agent/tools/example.tool.ts', [
      "import { Injectable, Logger } from '@nestjs/common';",
      '',
      'export interface ToolDefinition {',
      '  name: string;',
      '  description: string;',
      '  input_schema: Record<string, unknown>;',
      '  execute: (input: Record<string, unknown>) => Promise<unknown>;',
      '}',
      '',
      '@Injectable()',
      'export class ExampleTool implements ToolDefinition {',
      '  private readonly logger = new Logger(ExampleTool.name);',
      '',
      "  name = 'get_current_time';",
      "  description = '获取当前日期和时间';",
      "  input_schema = {",
      "    type: 'object',",
      '    properties: {',
      '      timezone: {',
      "        type: 'string',",
      "        description: '时区（可选，默认 UTC）',",
      "        enum: ['UTC', 'Asia/Shanghai', 'America/New_York'],",
      '      },',
      '    },',
      '  };',
      '',
      '  async execute(input: Record<string, unknown>): Promise<unknown> {',
      '    try {',
      '      this.logger.debug(`Tool execute: get_current_time with input: ${JSON.stringify(input)}`);',
      '      const now = new Date();',
      '      return {',
      '        success: true,',
      '        data: {',
      '          iso: now.toISOString(),',
      '          timestamp: now.getTime(),',
      '        },',
      '      };',
      '    } catch (error) {',
      '      this.logger.error(`Tool execution failed: ${error}`);',
      '      return {',
      '        success: false,',
      "        error: error instanceof Error ? error.message : 'Unknown error',",
      '      };',
      '    }',
      '  }',
      '}',
      '',
    ].join('\n'))
  }
}

// ──────────────────────────────────────
// 公共文件
// ──────────────────────────────────────

function renderCommonFiles(projectDir: string, ctx: TemplateContext, opts?: InitOptions): void {
  writeTemplate(projectDir, '.gitignore', `node_modules/
.gradle/
build/
target/
dist/
.env
*.log
.DS_Store
__pycache__/
*.pyc
.idea/
.vscode/
*.iml
`)

  const hasNodeBackend = opts?.backend === 'nodejs'
  if (hasNodeBackend) {
    writeEnvFile(projectDir, `# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/${ctx.packageName}

# Claude Agent SDK
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
AGENT_MODEL=claude-sonnet-5

# Server
PORT=3000
CORS_ORIGIN=http://localhost:4200
`)
  } else {
    writeEnvFile(projectDir, `# 数据库配置
DB_URL=jdbc:postgresql://localhost:5432/${ctx.packageName}
DB_USERNAME=postgres
DB_PASSWORD=change-me

# API Keys
OPENAI_API_KEY=sk-your-key-here
`)
  }

  const readme = generateReadme(ctx, opts)
  writeTemplate(projectDir, 'README.md', readme)
}

function generateReadme(ctx: TemplateContext, opts?: InitOptions): string {
  const hasNodeBackend = opts?.backend === 'nodejs'
  const hasPrisma = opts?.nodejsOrm === 'prisma'
  const hasAgentSdk = opts?.nodejsAi === 'claude-agent-sdk'

  const lines: string[] = []
  lines.push(`# ${ctx.projectName}`, '')
  lines.push('## 技术栈', '')
  if (ctx.frontend) lines.push('- **前端：** Angular + TypeScript')
  if (hasNodeBackend) {
    const nodeDeps: string[] = ['NestJS + TypeScript']
    if (hasPrisma) nodeDeps.push('Prisma')
    if (hasAgentSdk) nodeDeps.push('Claude Agent SDK')
    lines.push(`- **后端：** ${nodeDeps.join(' + ')}`)
  } else if (ctx.backend) {
    lines.push('- **后端：** Java 21 + Spring Boot 3.x + Gradle')
  }
  lines.push('')
  lines.push('## 快速开始', '')
  if (ctx.frontend && hasNodeBackend) {
    lines.push('```bash')
    lines.push('# 安装所有依赖')
    lines.push('pnpm install')
    lines.push('')
    lines.push('# 启动前后端开发服务器')
    lines.push('pnpm dev')
    lines.push('```', '')
  } else if (ctx.frontend) {
    lines.push('### 前端', '')
    lines.push('```bash')
    lines.push('pnpm install')
    lines.push('pnpm start')
    lines.push('```', '')
  }
  if (hasNodeBackend && !ctx.frontend) {
    lines.push('### 后端', '')
    lines.push('```bash')
    lines.push('pnpm install')
    lines.push('pnpm start:dev')
    lines.push('```', '')
  } else if (ctx.backend) {
    lines.push('### 后端', '')
    lines.push('```bash')
    lines.push('./gradlew build')
    lines.push('./gradlew bootRun')
    lines.push('```', '')
  }
  lines.push('## 项目结构', '')
  lines.push('```')
  if (ctx.frontend && hasNodeBackend) {
    lines.push('├── server/                 # NestJS 后端')
    lines.push('│   ├── src/')
    lines.push('│   ├── nest-cli.json')
    lines.push('│   └── package.json')
    lines.push('├── client/                 # Angular 前端')
    lines.push('│   ├── src/')
    lines.push('│   ├── public/')
    lines.push('│   ├── angular.json')
    lines.push('│   └── package.json')
    lines.push('├── pnpm-workspace.yaml')
    lines.push('└── package.json')
  } else if (ctx.frontend && ctx.backend) {
    lines.push('├── src/main/web/          # Angular 前端')
    lines.push('├── src/main/java/         # Java 后端')
    lines.push('├── src/main/resources/    # 配置')
    lines.push('├── build.gradle.kts       # Gradle 构建')
    lines.push('└── angular.json           # Angular 配置')
  } else if (ctx.frontend) {
    lines.push('├── src/main/web/          # Angular 前端')
    lines.push('└── angular.json           # Angular 配置')
  } else if (hasNodeBackend) {
    lines.push('├── src/                    # NestJS 后端')
    lines.push('├── nest-cli.json          # NestJS 配置')
    lines.push('├── tsconfig.json')
    lines.push('└── package.json')
  } else if (ctx.backend) {
    lines.push('├── src/main/java/         # Java 后端')
    lines.push('└── build.gradle.kts       # Gradle 构建')
  }
  lines.push('```', '')
  return lines.join('\n')
}

// ──────────────────────────────────────
// 辅助函数
// ──────────────────────────────────────

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function writeTemplate(baseDir: string, relativePath: string, content: string): void {
  const fullPath = path.join(baseDir, relativePath)
  // 文件已存在时跳过，不覆盖
  if (fs.existsSync(fullPath)) {
    console.log(`  ℹ 跳过已有文件: ${relativePath}`)
    return
  }
  ensureDir(path.dirname(fullPath))
  fs.writeFileSync(fullPath, content, 'utf-8')
}

/**
 * 写入 .env — 不存在则创建，存在则追加（避免覆盖已有配置）。
 */
function writeEnvFile(baseDir: string, content: string): void {
  const envPath = path.join(baseDir, '.env')
  ensureDir(path.dirname(envPath))
  if (fs.existsSync(envPath)) {
    const existing = fs.readFileSync(envPath, 'utf-8').trimEnd()
    fs.writeFileSync(envPath, existing + '\n\n' + content, 'utf-8')
  } else {
    fs.writeFileSync(envPath, content, 'utf-8')
  }
}

function printProjectTree(projectDir: string, hasFrontend: boolean, hasJavaBackend: boolean, hasNodeBackend = false): void {
  console.log('目录结构:')
  console.log(`  ${path.basename(projectDir)}/`)
  if (hasFrontend && hasJavaBackend) {
    console.log('  ├── src/')
    console.log('  │   ├── main/')
    console.log('  │   │   ├── web/          # Angular 前端')
    console.log('  │   │   ├── java/         # Java 后端')
    console.log('  │   │   └── resources/    # 配置')
    console.log('  │   └── test/')
    console.log('  │       ├── java/')
    console.log('  │       └── resources/')
    console.log('  ├── build.gradle.kts')
    console.log('  ├── angular.json')
    console.log('  └── package.json')
  } else if (hasFrontend && hasNodeBackend) {
    console.log('  ├── server/                 # NestJS 后端')
    console.log('  │   ├── src/')
    console.log('  │   │   ├── app.controller.ts')
    console.log('  │   │   ├── app.module.ts')
    console.log('  │   │   ├── app.service.ts')
    console.log('  │   │   ├── main.ts')
    console.log('  │   │   ├── prisma/       # Prisma ORM')
    console.log('  │   │   └── agent/        # Claude Agent SDK')
    console.log('  │   ├── prisma/')
    console.log('  │   │   └── schema.prisma')
    console.log('  │   ├── nest-cli.json')
    console.log('  │   ├── tsconfig.json')
    console.log('  │   └── package.json')
    console.log('  ├── client/                 # Angular 前端')
    console.log('  │   ├── src/')
    console.log('  │   │   ├── index.html')
    console.log('  │   │   ├── main.ts')
    console.log('  │   │   ├── styles.css')
    console.log('  │   │   └── app/')
    console.log('  │   ├── public/')
    console.log('  │   ├── angular.json')
    console.log('  │   ├── tsconfig.json')
    console.log('  │   └── package.json')
    console.log('  ├── pnpm-workspace.yaml')
    console.log('  ├── package.json')
    console.log('  ├── .env')
    console.log('  └── .gitignore')
  } else if (hasFrontend) {
    console.log('  ├── src/main/web/         # Angular 前端')
    console.log('  ├── angular.json')
    console.log('  └── package.json')
  } else if (hasJavaBackend) {
    console.log('  ├── src/')
    console.log('  │   ├── main/java/')
    console.log('  │   ├── main/resources/')
    console.log('  │   ├── test/java/')
    console.log('  │   └── test/resources/')
    console.log('  ├── build.gradle.kts')
    console.log('  └── settings.gradle.kts')
  } else if (hasNodeBackend) {
    console.log('  ├── src/')
    console.log('  │   ├── app.controller.ts')
    console.log('  │   ├── app.module.ts')
    console.log('  │   ├── app.service.ts')
    console.log('  │   ├── main.ts')
    console.log('  │   ├── prisma/          # Prisma ORM')
    console.log('  │   └── agent/           # Claude Agent SDK')
    console.log('  ├── prisma/')
    console.log('  │   └── schema.prisma')
    console.log('  ├── nest-cli.json')
    console.log('  ├── tsconfig.json')
    console.log('  └── package.json')
  }
}
