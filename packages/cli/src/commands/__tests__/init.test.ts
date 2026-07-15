import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { parseInitArgs, runInit, writeInitTechStack, initClaudeMd } from '../init'

function tmpDir(): string {
  return path.join(process.env.TMPDIR || '/tmp', `.init-test-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`)
}

function dirExists(p: string): boolean {
  return fs.existsSync(p) && fs.statSync(p).isDirectory()
}

function fileExists(p: string): boolean {
  return fs.existsSync(p) && fs.statSync(p).isFile()
}

describe('parseInitArgs', () => {
  it('应当解析完整的命令行参数', () => {
    const opts = parseInitArgs({
      name: 'my-app',
      frontend: 'angular',
      backend: 'java',
      output: '/tmp/out',
    })
    expect(opts.projectName).toBe('my-app')
    expect(opts.frontend).toBe('angular')
    expect(opts.backend).toBe('java')
    expect(opts.output).toBe('/tmp/out')
  })

  it('应当解析仅前端参数（后端不选）', () => {
    const opts = parseInitArgs({ name: 'fe-only', frontend: 'angular' })
    expect(opts.projectName).toBe('fe-only')
    expect(opts.frontend).toBe('angular')
    expect(opts.backend).toBeUndefined()
  })

  it('应当解析仅后端参数（前端不选）', () => {
    const opts = parseInitArgs({ name: 'be-only', backend: 'java' })
    expect(opts.projectName).toBe('be-only')
    expect(opts.backend).toBe('java')
    expect(opts.frontend).toBeUndefined()
  })

  it('当缺少 name 时 projectName 为 undefined', () => {
    const opts = parseInitArgs({ frontend: 'angular' })
    expect(opts.projectName).toBeUndefined()
  })

  it('应当解析子选项（uiLib、cssFramework、orm）', () => {
    const opts = parseInitArgs({
      name: 'full',
      frontend: 'angular',
      backend: 'java',
      'ui-lib': 'primeng',
      'css': 'tailwind',
      'orm': 'hibernate',
    })
    expect(opts.uiLib).toBe('primeng')
    expect(opts.cssFramework).toBe('tailwind')
    expect(opts.orm).toBe('hibernate')
  })

  it('当无任何参数时返回空对象', () => {
    const opts = parseInitArgs({})
    expect(Object.keys(opts).length).toBe(0)
  })
})

describe('runInit', () => {
  let testDir: string

  beforeEach(() => {
    testDir = tmpDir()
  })

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('应当为全栈项目（Angular + Java）创建完整目录结构', async () => {
    await runInit(testDir, {
      projectName: 'my-project',
      frontend: 'angular',
      backend: 'java',
    })

    const root = path.join(testDir, 'my-project')
    expect(dirExists(root)).toBe(true)

    // 根级配置文件
    expect(fileExists(path.join(root, 'angular.json'))).toBe(true)
    expect(fileExists(path.join(root, 'package.json'))).toBe(true)
    expect(fileExists(path.join(root, 'build.gradle.kts'))).toBe(true)
    expect(fileExists(path.join(root, 'settings.gradle.kts'))).toBe(true)
    expect(fileExists(path.join(root, 'gradlew'))).toBe(true)
    expect(fileExists(path.join(root, 'gradlew.bat'))).toBe(true)

    // Angular 源码
    expect(fileExists(path.join(root, 'src/main/web/main.ts'))).toBe(true)
    expect(fileExists(path.join(root, 'src/main/web/index.html'))).toBe(true)
    expect(fileExists(path.join(root, 'src/main/web/styles.css'))).toBe(true)
    expect(dirExists(path.join(root, 'src/main/web/app'))).toBe(true)

    // Java 源码
    expect(dirExists(path.join(root, 'src/main/java'))).toBe(true)
    expect(fileExists(path.join(root, 'src/main/resources/application.yml'))).toBe(true)
    expect(dirExists(path.join(root, 'src/test/java'))).toBe(true)

    // 公共文件
    expect(fileExists(path.join(root, '.gitignore'))).toBe(true)
    expect(fileExists(path.join(root, '.env'))).toBe(true)
    expect(fileExists(path.join(root, 'README.md'))).toBe(true)
  })

  it('应当为仅 Angular 项目创建正确的结构（无后端文件）', async () => {
    await runInit(testDir, {
      projectName: 'fe-only',
      frontend: 'angular',
    })

    const root = path.join(testDir, 'fe-only')
    expect(fileExists(path.join(root, 'angular.json'))).toBe(true)
    expect(fileExists(path.join(root, 'src/main/web/main.ts'))).toBe(true)

    // 不应有后端文件
    expect(fileExists(path.join(root, 'build.gradle.kts'))).toBe(false)
    expect(fileExists(path.join(root, 'settings.gradle.kts'))).toBe(false)
    expect(fileExists(path.join(root, 'gradlew'))).toBe(false)
    expect(dirExists(path.join(root, 'src/main/java'))).toBe(false)
  })

  it('应当为仅 Java 项目创建正确的结构（无 Angular 文件）', async () => {
    await runInit(testDir, {
      projectName: 'be-only',
      backend: 'java',
    })

    const root = path.join(testDir, 'be-only')
    expect(fileExists(path.join(root, 'build.gradle.kts'))).toBe(true)
    expect(dirExists(path.join(root, 'src/main/java'))).toBe(true)

    // 不应有前端文件
    expect(fileExists(path.join(root, 'angular.json'))).toBe(false)
    expect(fileExists(path.join(root, 'package.json'))).toBe(false)
    expect(dirExists(path.join(root, 'src/main/web'))).toBe(false)
  })

  it('应当处理 PrimeNG UI 库选项', async () => {
    await runInit(testDir, {
      projectName: 'with-primeng',
      frontend: 'angular',
      uiLib: 'primeng',
    })

    const root = path.join(testDir, 'with-primeng')
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'))
    expect(pkg.dependencies).toHaveProperty('primeng')
    expect(fileExists(path.join(root, 'src/main/web/main.ts'))).toBe(true)
  })

  it('应当处理 Tailwind CSS 选项', async () => {
    await runInit(testDir, {
      projectName: 'with-tailwind',
      frontend: 'angular',
      cssFramework: 'tailwind',
    })

    const root = path.join(testDir, 'with-tailwind')
    expect(fileExists(path.join(root, 'postcss.config.json'))).toBe(true)
    const styles = fs.readFileSync(path.join(root, 'src/main/web/styles.css'), 'utf-8')
    expect(styles).toContain('tailwind')
  })

  it('应当处理 Hibernate ORM 选项', async () => {
    await runInit(testDir, {
      projectName: 'with-orm',
      backend: 'java',
      orm: 'hibernate',
    })

    const root = path.join(testDir, 'with-orm')
    const buildGradle = fs.readFileSync(path.join(root, 'build.gradle.kts'), 'utf-8')
    expect(buildGradle).toContain('spring-boot-starter-data-jpa')

    // 应有数据源配置
    const appYml = fs.readFileSync(path.join(root, 'src/main/resources/application.yml'), 'utf-8')
    expect(appYml).toContain('datasource')
  })

  it('应当处理 Liquibase DB 迁移选项', async () => {
    await runInit(testDir, {
      projectName: 'with-liquibase',
      backend: 'java',
      migration: 'liquibase',
    })

    const root = path.join(testDir, 'with-liquibase')
    const buildGradle = fs.readFileSync(path.join(root, 'build.gradle.kts'), 'utf-8')
    expect(buildGradle).toContain('liquibase')
    expect(dirExists(path.join(root, 'src/main/resources/db/changelog'))).toBe(true)
  })

  it('应当处理 Spring AI 集成选项', async () => {
    await runInit(testDir, {
      projectName: 'with-ai',
      backend: 'java',
      ai: 'spring-ai',
    })

    const root = path.join(testDir, 'with-ai')
    const buildGradle = fs.readFileSync(path.join(root, 'build.gradle.kts'), 'utf-8')
    expect(buildGradle).toContain('spring-ai')
    expect(buildGradle).toContain('milestone')
  })

  it('应当输出到指定 output 目录', async () => {
    const customOutput = path.join(testDir, 'custom-dir')
    await runInit(customOutput, {
      projectName: 'my-app',
      frontend: 'angular',
    })

    const root = path.join(customOutput, 'my-app')
    expect(dirExists(root)).toBe(true)
    expect(fileExists(path.join(root, 'angular.json'))).toBe(true)
  })

  it('当目标目录已存在时应抛出错误', async () => {
    const existingDir = path.join(testDir, 'existing-project')
    fs.mkdirSync(existingDir, { recursive: true })

    await expect(
      runInit(testDir, { projectName: 'existing-project', frontend: 'angular' }),
    ).rejects.toThrow(/已存在/)
  })

  it('当项目名包含非法字符时应抛出错误', async () => {
    await expect(
      runInit(testDir, { projectName: 'my/project', frontend: 'angular' }),
    ).rejects.toThrow(/非法/)
  })

  it('writeInitTechStack 应当写入完整的全栈配置', () => {
    writeInitTechStack(testDir, {
      projectName: 'test',
      frontend: 'angular',
      backend: 'java',
      uiLib: 'primeng',
      cssFramework: 'tailwind',
      orm: 'hibernate',
      migration: 'liquibase',
      ai: 'spring-ai',
    })
    const settingsPath = path.join(testDir, '.deepstorm', 'settings.json')
    expect(fileExists(settingsPath)).toBe(true)
    const cfg = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(cfg.reef.techs).toBe('frontend,backend')
    expect(cfg.reef.frontend.framework).toBe('angular')
    expect(cfg.reef.frontend.uiLibrary).toBe('primeng')
    expect(cfg.reef.frontend.css).toBe('tailwind')
    expect(cfg.reef.backend.language).toBe('java')
    expect(cfg.reef.backend.java.orm).toBe('hibernate')
    expect(cfg.reef.backend.java.dbMigration).toBe('liquibase')
    expect(cfg.reef.backend.java.ai).toBe('spring-ai')
  })

  it('writeInitTechStack 只写前端时不应包含后端字段', () => {
    writeInitTechStack(testDir, {
      projectName: 'fe-only',
      frontend: 'angular',
      uiLib: 'primeng',
    })
    const settingsPath = path.join(testDir, '.deepstorm', 'settings.json')
    const cfg = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(cfg.reef.techs).toBe('frontend')
    expect(cfg.reef.frontend.framework).toBe('angular')
    expect(cfg.reef.backend).toBeUndefined()
  })

  it('writeInitTechStack 只写后端时不应包含前端字段', () => {
    writeInitTechStack(testDir, {
      projectName: 'be-only',
      backend: 'java',
      orm: 'hibernate',
    })
    const settingsPath = path.join(testDir, '.deepstorm', 'settings.json')
    const cfg = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    expect(cfg.reef.techs).toBe('backend')
    expect(cfg.reef.backend.language).toBe('java')
    expect(cfg.reef.backend.java.orm).toBe('hibernate')
    expect(cfg.reef.frontend).toBeUndefined()
  })

  it('writeInitTechStack 应当保留 settings.json 中的已有字段', () => {
    // 先写入一个已有的 tide 配置到 .deepstorm/settings.json
    const settingsDir = path.join(testDir, '.deepstorm')
    fs.mkdirSync(settingsDir, { recursive: true })
    fs.writeFileSync(path.join(settingsDir, 'settings.json'), JSON.stringify({
      tide: { issueTracker: 'jira' },
    }), 'utf-8')

    writeInitTechStack(testDir, {
      projectName: 'test',
      frontend: 'angular',
    })

    const cfg = JSON.parse(fs.readFileSync(path.join(settingsDir, 'settings.json'), 'utf-8'))
    expect(cfg.reef.techs).toBe('frontend')
    expect(cfg.tide.issueTracker).toBe('jira') // 保留
  })

  it('应当支持空 projectName（原地初始化模式）', async () => {
    await runInit(testDir, { frontend: 'angular' })

    // 应在 testDir 直接生成，不含子目录
    expect(fileExists(path.join(testDir, 'angular.json'))).toBe(true)
    expect(fileExists(path.join(testDir, 'package.json'))).toBe(true)
    expect(fileExists(path.join(testDir, 'src/main/web/main.ts'))).toBe(true)

    // 不应有以项目名命名的子目录
    expect(dirExists(path.join(testDir, 'undefined'))).toBe(false)
  })

  it('原地初始化模式下已有文件应被跳过不覆盖', async () => {
    // 先写入一个已有的 angular.json
    fs.mkdirSync(path.join(testDir, 'src/main/web/app'), { recursive: true })
    fs.writeFileSync(path.join(testDir, 'angular.json'), JSON.stringify({ original: true }), 'utf-8')

    // 执行原地初始化
    await runInit(testDir, { frontend: 'angular' })

    // 已有文件不被覆盖
    const content = JSON.parse(fs.readFileSync(path.join(testDir, 'angular.json'), 'utf-8'))
    expect(content.original).toBe(true)

    // 不存在的文件应正常创建
    expect(fileExists(path.join(testDir, 'package.json'))).toBe(true)
  })

  it('生成的 Angular + Java 项目结构应与 chatbi 风格一致', async () => {
    await runInit(testDir, {
      projectName: 'verify-structure',
      frontend: 'angular',
      backend: 'java',
      uiLib: 'primeng',
      cssFramework: 'tailwind',
      orm: 'hibernate',
      migration: 'liquibase',
    })

    const root = path.join(testDir, 'verify-structure')

    // 根级配置文件（与 chatbi 风格一致）
    expect(fileExists(path.join(root, 'angular.json'))).toBe(true)
    expect(fileExists(path.join(root, 'package.json'))).toBe(true)
    expect(fileExists(path.join(root, 'build.gradle.kts'))).toBe(true)
    expect(fileExists(path.join(root, 'settings.gradle.kts'))).toBe(true)
    expect(fileExists(path.join(root, 'gradlew'))).toBe(true)
    expect(fileExists(path.join(root, 'gradlew.bat'))).toBe(true)
    expect(fileExists(path.join(root, 'gradle.properties'))).toBe(true)
    expect(dirExists(path.join(root, 'gradle/wrapper'))).toBe(true)
    expect(fileExists(path.join(root, 'tsconfig.json'))).toBe(true)
    expect(fileExists(path.join(root, 'tsconfig.app.json'))).toBe(true)
    expect(fileExists(path.join(root, 'tsconfig.spec.json'))).toBe(true)
    expect(fileExists(path.join(root, 'proxy.conf.json'))).toBe(true)
    expect(fileExists(path.join(root, 'eslint.config.mjs'))).toBe(true)

    // Angular 前端在 src/main/web/（与 chatbi 结构一致）
    expect(fileExists(path.join(root, 'src/main/web/index.html'))).toBe(true)
    expect(fileExists(path.join(root, 'src/main/web/main.ts'))).toBe(true)
    expect(fileExists(path.join(root, 'src/main/web/styles.css'))).toBe(true)
    expect(fileExists(path.join(root, 'src/main/web/app/app.ts'))).toBe(true)
    expect(fileExists(path.join(root, 'src/main/web/app/app.config.ts'))).toBe(true)
    expect(fileExists(path.join(root, 'src/main/web/app/app.routes.ts'))).toBe(true)

    // Java 后端在 src/main/java/（与 chatbi 结构一致）
    expect(dirExists(path.join(root, 'src/main/java'))).toBe(true)
    expect(fileExists(path.join(root, 'src/main/resources/application.yml'))).toBe(true)
    expect(dirExists(path.join(root, 'src/test/java'))).toBe(true)

    // 条件集成验证
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'))
    expect(pkg.dependencies).toHaveProperty('primeng')

    const styles = fs.readFileSync(path.join(root, 'src/main/web/styles.css'), 'utf-8')
    expect(styles).toContain('tailwind')

    const buildGradle = fs.readFileSync(path.join(root, 'build.gradle.kts'), 'utf-8')
    expect(buildGradle).toContain('spring-boot-starter-data-jpa')
    expect(buildGradle).toContain('liquibase')

    expect(dirExists(path.join(root, 'src/main/resources/db/changelog'))).toBe(true)
  })
})

describe('initClaudeMd', () => {
  let testDir: string

  beforeEach(() => {
    testDir = tmpDir()
  })

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('应当创建 .claude/CLAUDE.md 并包含项目名和技术栈', () => {
    initClaudeMd(testDir, {
      projectName: 'my-app',
      frontend: 'angular',
      backend: 'java',
    })

    const claudeMdPath = path.join(testDir, '.claude', 'CLAUDE.md')
    expect(fileExists(claudeMdPath)).toBe(true)
    const content = fs.readFileSync(claudeMdPath, 'utf-8')
    expect(content).toContain('# my-app')
    expect(content).toContain('- **前端**：angular')
    expect(content).toContain('- **后端**：java')
    expect(content).toContain('.deepstorm/context.md')
  })

  it('当 .claude/CLAUDE.md 已存在时应跳过', () => {
    const claudeDir = path.join(testDir, '.claude')
    fs.mkdirSync(claudeDir, { recursive: true })
    fs.writeFileSync(path.join(claudeDir, 'CLAUDE.md'), '# existing', 'utf-8')

    initClaudeMd(testDir, {
      projectName: 'my-app',
      frontend: 'angular',
    })

    const content = fs.readFileSync(path.join(claudeDir, 'CLAUDE.md'), 'utf-8')
    expect(content).toBe('# existing') // 不被覆盖
  })

  it('无 projectName 时 CLAUDE.md 标题使用 unknown', () => {
    initClaudeMd(testDir, { frontend: 'angular' })

    const content = fs.readFileSync(path.join(testDir, '.claude', 'CLAUDE.md'), 'utf-8')
    expect(content).toContain('# unknown')
  })

  it('不创建根目录 CLAUDE.md', () => {
    initClaudeMd(testDir, {
      projectName: 'test',
      frontend: 'angular',
    })

    // 根目录 CLAUDE.md 不应被创建
    const rootClaudeMd = path.join(testDir, 'CLAUDE.md')
    expect(fileExists(rootClaudeMd)).toBe(false)

    // 只有 .claude/CLAUDE.md 存在
    expect(fileExists(path.join(testDir, '.claude', 'CLAUDE.md'))).toBe(true)
  })
})

describe('writeInitTechStack with initClaudeMd', () => {
  let testDir: string

  beforeEach(() => {
    testDir = tmpDir()
  })

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  it('writeInitTechStack 应当同时生成 .claude/CLAUDE.md', () => {
    writeInitTechStack(testDir, {
      projectName: 'test',
      frontend: 'angular',
      backend: 'java',
    })

    const claudeMdPath = path.join(testDir, '.claude', 'CLAUDE.md')
    expect(fileExists(claudeMdPath)).toBe(true)
    const content = fs.readFileSync(claudeMdPath, 'utf-8')
    expect(content).toContain('# test')
  })
})
