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
 * 同时确保 CLAUDE.md 包含项目上下文引用行。
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
  appendClaudeMdRef(targetDir)
}

/**
 * 在 CLAUDE.md 末尾追加项目上下文引用行。
 * 如果已有引用则不重复追加。
 */
function appendClaudeMdRef(targetDir: string): void {
  const claudeMdPath = path.join(targetDir, 'CLAUDE.md')
  const refLine = '\n> 项目事实见 .deepstorm/context.md\n'

  if (!fs.existsSync(claudeMdPath)) {
    fs.writeFileSync(claudeMdPath, refLine, 'utf-8')
    return
  }

  const existing = fs.readFileSync(claudeMdPath, 'utf-8')
  if (existing.includes('.deepstorm/context.md')) return

  fs.appendFileSync(claudeMdPath, refLine, 'utf-8')
  console.log('✔ 已在 CLAUDE.md 追加项目上下文引用')
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
    if (opts.orm) config['reef.backend.java.orm'] = opts.orm
    if (opts.migration) config['reef.backend.java.dbMigration'] = opts.migration
    if (opts.ai) config['reef.backend.java.ai'] = opts.ai
  }

  if (Object.keys(config).length === 0) return

  const nested = buildInitNestedConfig(config)
  writeDeepStormConfig(baseDir, nested)

  // 同步初始化 .deepstorm/context.md
  initContextMap(baseDir, opts)
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
    .option('--backend <language>', '后端语言（java）')
    .option('--output <dir>', '输出目录（默认为当前目录）')
    .option('--ui-lib <lib>', 'UI 库（primeng）')
    .option('--css <framework>', 'CSS 框架（tailwind）')
    .option('--orm <orm>', 'ORM 框架（hibernate）')
    .option('--migration <tool>', '数据库迁移工具（liquibase）')
    .option('--ai <framework>', 'AI 框架（spring-ai）')
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
  return {
    projectName: opts.projectName!,
    packageName: opts.projectName!.replace(/[_-]/g, '').toLowerCase(),
    groupId: 'com.example',
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

  const projectName = await text({
    message: '项目名称：',
    placeholder: 'my-project',
    validate: (value) => {
      if (!value) return '请输入项目名称'
      if (!VALID_PROJECT_NAME.test(value)) return '项目名仅支持字母、数字、下划线和短横线'
      return undefined
    },
  })
  if (isCancel(projectName) || typeof projectName !== 'string') {
    outro('已取消')
    return
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
    uiLib = await select({
      message: '选择 UI 库：',
      options: [
        { value: 'primeng', label: 'PrimeNG' },
        { value: 'none', label: '无（仅 Angular 核心）' },
      ],
    })
    if (isCancel(uiLib)) { outro('已取消'); return }

    cssFramework = await select({
      message: '选择 CSS 方案：',
      options: [
        { value: 'tailwind', label: 'Tailwind CSS' },
        { value: 'none', label: '标准 CSS' },
      ],
    })
    if (isCancel(cssFramework)) { outro('已取消'); return }
  }

  const backendChoice = await select({
    message: '选择后端框架：',
    options: [
      { value: 'java', label: 'Java (Spring Boot)' },
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
    orm = await select({
      message: '选择 ORM 框架：',
      options: [
        { value: 'hibernate', label: 'Hibernate' },
        { value: 'none', label: '无' },
      ],
    })
    if (isCancel(orm)) { outro('已取消'); return }

    migration = await select({
      message: '选择数据库迁移工具：',
      options: [
        { value: 'liquibase', label: 'Liquibase' },
        { value: 'none', label: '无' },
      ],
    })
    if (isCancel(migration)) { outro('已取消'); return }

    aiChoice = await select({
      message: '选择 AI 框架：',
      options: [
        { value: 'spring-ai', label: 'Spring AI' },
        { value: 'none', label: '无' },
      ],
    })
    if (isCancel(aiChoice)) { outro('已取消'); return }
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
  }

  await runInit(targetDir, opts)

  outro('✅ 项目已生成！')
  return opts
}

/**
 * 运行 init，生成项目脚手架。
 */
export async function runInit(baseDir: string, opts: InitOptions): Promise<void> {
  if (!opts.projectName) {
    throw new Error('项目名称为必填项')
  }

  if (!VALID_PROJECT_NAME.test(opts.projectName)) {
    throw new Error(`项目名 "${opts.projectName}" 包含非法字符。仅支持字母、数字、下划线和短横线。`)
  }

  const projectDir = path.join(baseDir, opts.projectName)

  if (fs.existsSync(projectDir)) {
    throw new Error(`目标目录 ${projectDir} 已存在。请删除后重试或使用其他项目名。`)
  }

  const ctx = buildContext(opts)
  fs.mkdirSync(projectDir, { recursive: true })

  const hasFrontend = opts.frontend === 'angular'
  const hasBackend = opts.backend === 'java'

  try {
    if (hasFrontend) {
      renderAngularTemplate(projectDir, ctx)
    }
    if (hasBackend) {
      renderJavaTemplate(projectDir, ctx)
    }
    renderCommonFiles(projectDir, ctx)

    console.log(`\n✔ 项目已创建: ${projectDir}`)
    console.log('\n下一步:')
    console.log(`  cd ${opts.projectName}`)
    if (opts.frontend) console.log(`  pnpm install        # 安装前端依赖`)
    if (opts.backend) console.log(`  ./gradlew build      # 构建后端`)
    console.log()
    printProjectTree(projectDir, hasFrontend, hasBackend)
  } catch (err) {
    // 清理：如果渲染失败，删除已创建的项目目录
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true })
    }
    throw err
  }
}

// ──────────────────────────────────────
// Angular 模板渲染
// ──────────────────────────────────────

function renderAngularTemplate(projectDir: string, ctx: TemplateContext): void {
  const hasPrimeng = ctx.uiLib === 'primeng'
  const hasTailwind = ctx.cssFramework === 'tailwind'

  // angular.json
  writeTemplate(projectDir, 'angular.json', JSON.stringify({
    $schema: './node_modules/@angular/cli/lib/config/schema.json',
    version: 1,
    newProjectRoot: 'projects',
    projects: {
      [ctx.packageName]: {
        projectType: 'application',
        root: '',
        sourceRoot: 'src/main/web',
        prefix: 'app',
        architect: {
          build: {
            builder: '@angular-devkit/build-angular:application',
            options: {
              outputPath: 'build',
              index: 'src/main/web/index.html',
              browser: 'src/main/web/main.ts',
              polyfills: ['zone.js'],
              tsConfig: 'tsconfig.app.json',
              assets: [{ glob: '**/*', input: 'public' }],
              styles: getAngularStyles(hasPrimeng),
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
            options: { polyfills: ['zone.js', 'zone.js/testing'], tsConfig: 'tsconfig.spec.json', assets: [{ glob: '**/*', input: 'public' }], styles: getAngularStyles(hasPrimeng), scripts: [] },
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
    files: ['src/main/web/main.ts'],
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

  // src/main/web/
  ensureDir(path.join(projectDir, 'src/main/web/app'))

  writeTemplate(projectDir, 'src/main/web/index.html', `<!doctype html>
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

  writeTemplate(projectDir, 'src/main/web/main.ts', `import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
`)

  const stylesContent = hasTailwind
    ? `@import "tailwindcss";\n\n/* 全局样式 */\n`
    : `/* 全局样式 */\n`

  writeTemplate(projectDir, 'src/main/web/styles.css', stylesContent)

  // app/
  writeTemplate(projectDir, 'src/main/web/app/app.ts', `import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: \`<router-outlet></router-outlet>\`,
})
export class App {}
`)

  writeTemplate(projectDir, 'src/main/web/app/app.config.ts', `import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
  ],
};
`)

  writeTemplate(projectDir, 'src/main/web/app/app.routes.ts', `import { Routes } from '@angular/router';

export const routes: Routes = [];
`)

  // Tailwind config
  if (hasTailwind) {
    writeTemplate(projectDir, 'postcss.config.json', JSON.stringify({
      plugins: { '@tailwindcss/postcss': {} },
    }, null, 2))
  }
}

function getAngularStyles(hasPrimeng: boolean): string[] {
  const styles: string[] = []
  if (hasPrimeng) {
    styles.push('@primeng/themes/aura/aura.css')
  }
  styles.push('src/main/web/styles.css')
  return styles
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
  const appPackage = `${ctx.groupId}.${ctx.packageName}`.replace(/[.-]/g, '.')
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
    ensureDir(path.join(projectDir, 'src/main/resources/db/changelog'))
    writeTemplate(projectDir, 'src/main/resources/db/changelog/db.changelog-master.xml', `<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog
  xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
    http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-latest.xsd">

  <changeSet id="001" author="deepstorm">
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
// 公共文件
// ──────────────────────────────────────

function renderCommonFiles(projectDir: string, ctx: TemplateContext): void {
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

  writeTemplate(projectDir, '.env.example', `# 数据库配置
DB_URL=jdbc:postgresql://localhost:5432/${ctx.packageName}
DB_USERNAME=postgres
DB_PASSWORD=change-me

# API Keys
OPENAI_API_KEY=sk-your-key-here
`)

  const readme = generateReadme(ctx)
  writeTemplate(projectDir, 'README.md', readme)
}

function generateReadme(ctx: TemplateContext): string {
  const lines: string[] = []
  lines.push(`# ${ctx.projectName}`, '')
  lines.push('## 技术栈', '')
  if (ctx.frontend) lines.push('- **前端：** Angular + TypeScript')
  if (ctx.backend) lines.push('- **后端：** Java 21 + Spring Boot 3.x + Gradle')
  lines.push('')
  lines.push('## 快速开始', '')
  if (ctx.frontend) {
    lines.push('### 前端', '')
    lines.push('```bash')
    lines.push('pnpm install')
    lines.push('pnpm start')
    lines.push('```', '')
  }
  if (ctx.backend) {
    lines.push('### 后端', '')
    lines.push('```bash')
    lines.push('./gradlew build')
    lines.push('./gradlew bootRun')
    lines.push('```', '')
  }
  lines.push('## 项目结构', '')
  lines.push('```')
  if (ctx.frontend && ctx.backend) {
    lines.push('├── src/main/web/          # Angular 前端')
    lines.push('├── src/main/java/         # Java 后端')
    lines.push('├── src/main/resources/    # 配置')
    lines.push('├── build.gradle.kts       # Gradle 构建')
    lines.push('└── angular.json           # Angular 配置')
  } else if (ctx.frontend) {
    lines.push('├── src/main/web/          # Angular 前端')
    lines.push('└── angular.json           # Angular 配置')
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
  ensureDir(path.dirname(fullPath))
  fs.writeFileSync(fullPath, content, 'utf-8')
}

function printProjectTree(projectDir: string, hasFrontend: boolean, hasBackend: boolean): void {
  console.log('目录结构:')
  console.log(`  ${path.basename(projectDir)}/`)
  if (hasFrontend && hasBackend) {
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
  } else if (hasFrontend) {
    console.log('  ├── src/main/web/         # Angular 前端')
    console.log('  ├── angular.json')
    console.log('  └── package.json')
  } else if (hasBackend) {
    console.log('  ├── src/')
    console.log('  │   ├── main/java/')
    console.log('  │   ├── main/resources/')
    console.log('  │   ├── test/java/')
    console.log('  │   └── test/resources/')
    console.log('  ├── build.gradle.kts')
    console.log('  └── settings.gradle.kts')
  }
}
