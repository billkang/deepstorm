import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import os from 'node:os'
import { copyFragmentsForSkill, collectFragmentsFromQuestion } from '../setup'
import type { Registry, WizardQuestion } from '../../types/registry'

// ─── collectFragmentsFromQuestion ─────────────────────────────────

describe('collectFragmentsFromQuestion', () => {
  let selectedFragments: Array<{ category: string; value: string }>

  beforeEach(() => {
    selectedFragments = []
  })

  it('应从 select 选项收集 fragment', () => {
    const question: WizardQuestion = {
      key: 'reef.backend.java.framework',
      label: 'Web 框架',
      type: 'select',
      options: [
        {
          value: 'spring-boot',
          label: 'Spring Boot',
          fragments: ['java/framework/spring-boot'],
        },
      ],
    }

    collectFragmentsFromQuestion(question, {
      'reef.backend.java.framework': 'spring-boot',
    }, selectedFragments)

    expect(selectedFragments).toHaveLength(1)
    expect(selectedFragments[0]).toEqual({
      category: 'java/framework',
      value: 'spring-boot',
    })
  })

  it('应正确处理嵌套 category 路径（多级）', () => {
    const question: WizardQuestion = {
      key: 'reef.backend.java.framework',
      label: 'Web 框架',
      type: 'select',
      options: [
        {
          value: 'spring-boot',
          label: 'Spring Boot',
          fragments: ['java/framework/spring-boot'],
        },
      ],
    }

    collectFragmentsFromQuestion(question, {
      'reef.backend.java.framework': 'spring-boot',
    }, selectedFragments)

    expect(selectedFragments[0].category).toBe('java/framework')
    expect(selectedFragments[0].value).toBe('spring-boot')
  })

  it('应递归处理 group 类型问题的子问题', () => {
    const question: WizardQuestion = {
      key: 'reef.backend.java.details',
      label: 'Java 框架选型',
      type: 'group',
      questions: [
        {
          key: 'reef.backend.java.framework',
          label: 'Web 框架',
          type: 'select',
          options: [
            {
              value: 'spring-boot',
              label: 'Spring Boot',
              fragments: ['java/framework/spring-boot'],
            },
          ],
        },
        {
          key: 'reef.backend.java.orm',
          label: 'ORM',
          type: 'select',
          options: [
            {
              value: 'hibernate',
              label: 'Hibernate',
              fragments: ['java/orm/hibernate'],
            },
          ],
        },
      ],
    }

    collectFragmentsFromQuestion(question, {
      'reef.backend.java.framework': 'spring-boot',
      'reef.backend.java.orm': 'hibernate',
    }, selectedFragments)

    expect(selectedFragments).toHaveLength(2)
    expect(selectedFragments).toContainEqual({
      category: 'java/framework',
      value: 'spring-boot',
    })
    expect(selectedFragments).toContainEqual({
      category: 'java/orm',
      value: 'hibernate',
    })
  })

  it('value 为 "none" 时应跳过', () => {
    const question: WizardQuestion = {
      key: 'reef.backend.java.framework',
      label: 'Web 框架',
      type: 'select',
      options: [
        {
          value: 'spring-boot',
          label: 'Spring Boot',
          fragments: ['java/framework/spring-boot'],
        },
        {
          value: 'none',
          label: '不使用',
        },
      ],
    }

    collectFragmentsFromQuestion(question, {
      'reef.backend.java.framework': 'none',
    }, selectedFragments)

    expect(selectedFragments).toHaveLength(0)
  })

  it('未在 config 中出现的 key 应跳过', () => {
    const question: WizardQuestion = {
      key: 'reef.something',
      label: '未配置',
      type: 'select',
      options: [
        {
          value: 'test',
          label: 'Test',
          fragments: ['some/category/test'],
        },
      ],
    }

    collectFragmentsFromQuestion(question, {
      'reef.other': 'test',
    }, selectedFragments)

    expect(selectedFragments).toHaveLength(0)
  })

  it('option 无 fragments 数组时应跳过', () => {
    const question: WizardQuestion = {
      key: 'reef.backend.java.framework',
      label: 'Web 框架',
      type: 'select',
      options: [
        {
          value: 'spring-boot',
          label: 'Spring Boot',
          // 没有 fragments 字段
        },
      ],
    }

    collectFragmentsFromQuestion(question, {
      'reef.backend.java.framework': 'spring-boot',
    }, selectedFragments)

    expect(selectedFragments).toHaveLength(0)
  })

  it('多选值（逗号分隔）应解析为多个 fragment', () => {
    const question: WizardQuestion = {
      key: 'reef.techs',
      label: '技术选型',
      type: 'select',
      options: [
        {
          value: 'frontend',
          label: '前端',
          fragments: ['ui-lib/primeng'],
        },
        {
          value: 'backend',
          label: '后端',
          fragments: ['java/framework/spring-boot'],
        },
      ],
    }

    collectFragmentsFromQuestion(question, {
      'reef.techs': 'frontend,backend',
    }, selectedFragments)

    expect(selectedFragments).toHaveLength(2)
    expect(selectedFragments).toContainEqual({ category: 'ui-lib', value: 'primeng' })
    expect(selectedFragments).toContainEqual({ category: 'java/framework', value: 'spring-boot' })
  })

  it('fragmentPath 少于两段（如 "test"）应跳过', () => {
    const question: WizardQuestion = {
      key: 'reef.something',
      label: '测试',
      type: 'select',
      options: [
        {
          value: 'test',
          label: 'Test',
          fragments: ['not-enough-parts'],
        },
      ],
    }

    collectFragmentsFromQuestion(question, {
      'reef.something': 'test',
    }, selectedFragments)

    expect(selectedFragments).toHaveLength(0)
  })
})

// ─── copyFragmentsForSkill ────────────────────────────────────────

describe('copyFragmentsForSkill', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fragments-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  function makeRegistry(
    fragments: Record<string, string[]>,
  ): Registry {
    const options = Object.entries(fragments).map(([value, fragPaths]) => ({
      value,
      label: value,
      fragments: fragPaths,
    }))
    return {
      version: '1',
      tools: {},
      wizards: {
        test: {
          tool: 'test',
          label: 'Test',
          description: '',
          questions: [
            {
              key: 'test.fragments',
              label: 'Fragments',
              type: 'select',
              options,
            },
          ],
        },
      },
      skills: {},
    }
  }

  it('应将选中 fragment 的 quick-reference.md 复制为 {value}.md', () => {
    // 准备 fragments 源文件
    const srcDir = path.join(tmpDir, 'src')
    fs.mkdirSync(path.join(srcDir, 'fragments', 'java', 'framework', 'spring-boot'), { recursive: true })
    fs.writeFileSync(
      path.join(srcDir, 'fragments', 'java', 'framework', 'spring-boot', 'quick-reference.md'),
      '# Spring Boot 规范',
      'utf-8',
    )

    const registry = makeRegistry({ 'spring-boot': ['java/framework/spring-boot'] })
    const targetDir = path.join(tmpDir, 'target')
    fs.mkdirSync(targetDir, { recursive: true })

    copyFragmentsForSkill('test-skill', srcDir, { 'test.fragments': 'spring-boot' }, registry, targetDir)

    // 验证：quick-reference.md → spring-boot.md
    const outputPath = path.join(targetDir, 'spring-boot.md')
    expect(fs.existsSync(outputPath)).toBe(true)
    expect(fs.readFileSync(outputPath, 'utf-8')).toBe('# Spring Boot 规范')
  })

  it('应将选中 fragment 的 examples 复制到统一 examples/ 目录并加 {value}- 前缀', () => {
    const srcDir = path.join(tmpDir, 'src')
    fs.mkdirSync(path.join(srcDir, 'fragments', 'java', 'framework', 'spring-boot', 'examples'), { recursive: true })
    fs.writeFileSync(
      path.join(srcDir, 'fragments', 'java', 'framework', 'spring-boot', 'quick-reference.md'),
      '# SB',
      'utf-8',
    )
    fs.writeFileSync(
      path.join(srcDir, 'fragments', 'java', 'framework', 'spring-boot', 'examples', 'controller.md'),
      '# Controller 示例',
      'utf-8',
    )
    fs.writeFileSync(
      path.join(srcDir, 'fragments', 'java', 'framework', 'spring-boot', 'examples', 'service.md'),
      '# Service 示例',
      'utf-8',
    )

    const registry = makeRegistry({ 'spring-boot': ['java/framework/spring-boot'] })
    const targetDir = path.join(tmpDir, 'target')
    fs.mkdirSync(targetDir, { recursive: true })

    copyFragmentsForSkill('test-skill', srcDir, { 'test.fragments': 'spring-boot' }, registry, targetDir)

    // 验证：examples 文件加前缀
    const examplesDir = path.join(targetDir, 'examples')
    expect(fs.existsSync(path.join(examplesDir, 'spring-boot-controller.md'))).toBe(true)
    expect(fs.readFileSync(path.join(examplesDir, 'spring-boot-controller.md'), 'utf-8')).toBe('# Controller 示例')
    expect(fs.existsSync(path.join(examplesDir, 'spring-boot-service.md'))).toBe(true)
  })

  it('应正确处理多个 fragment（防重名）', () => {
    const srcDir = path.join(tmpDir, 'src')
    // fragment 1
    fs.mkdirSync(path.join(srcDir, 'fragments', 'framework', 'spring-boot', 'examples'), { recursive: true })
    fs.writeFileSync(
      path.join(srcDir, 'fragments', 'framework', 'spring-boot', 'quick-reference.md'),
      '# SB',
      'utf-8',
    )
    fs.writeFileSync(
      path.join(srcDir, 'fragments', 'framework', 'spring-boot', 'examples', 'testing.md'),
      '# SB Testing',
      'utf-8',
    )
    // fragment 2
    fs.mkdirSync(path.join(srcDir, 'fragments', 'orm', 'hibernate', 'examples'), { recursive: true })
    fs.writeFileSync(
      path.join(srcDir, 'fragments', 'orm', 'hibernate', 'quick-reference.md'),
      '# HB',
      'utf-8',
    )
    fs.writeFileSync(
      path.join(srcDir, 'fragments', 'orm', 'hibernate', 'examples', 'testing.md'),
      '# HB Testing',
      'utf-8',
    )

    const registry = makeRegistry({
      'spring-boot': ['framework/spring-boot'],
      'hibernate': ['orm/hibernate'],
    })
    const targetDir = path.join(tmpDir, 'target')
    fs.mkdirSync(targetDir, { recursive: true })

    copyFragmentsForSkill('test-skill', srcDir, { 'test.fragments': 'spring-boot,hibernate' }, registry, targetDir)

    // {value}.md 文件
    expect(fs.readFileSync(path.join(targetDir, 'spring-boot.md'), 'utf-8')).toBe('# SB')
    expect(fs.readFileSync(path.join(targetDir, 'hibernate.md'), 'utf-8')).toBe('# HB')
    // examples 有 value- 前缀，不会重名
    expect(fs.readFileSync(path.join(targetDir, 'examples', 'spring-boot-testing.md'), 'utf-8')).toBe('# SB Testing')
    expect(fs.readFileSync(path.join(targetDir, 'examples', 'hibernate-testing.md'), 'utf-8')).toBe('# HB Testing')
  })

  it('fragments 目录不存在时应静默跳过', () => {
    const srcDir = path.join(tmpDir, 'src') // 没有 fragments/ 子目录
    fs.mkdirSync(srcDir, { recursive: true })

    const registry = makeRegistry({ 'spring-boot': ['java/framework/spring-boot'] })
    const targetDir = path.join(tmpDir, 'target')
    fs.mkdirSync(targetDir, { recursive: true })

    expect(() =>
      copyFragmentsForSkill('test-skill', srcDir, { 'test.fragments': 'spring-boot' }, registry, targetDir),
    ).not.toThrow()
    // target 目录应该没有被创建新文件
    expect(fs.readdirSync(targetDir)).toEqual([])
  })

  it('fragments 目录存在但没有匹配项时应静默跳过', () => {
    const srcDir = path.join(tmpDir, 'src')
    fs.mkdirSync(path.join(srcDir, 'fragments', 'java', 'framework', 'spring-boot'), { recursive: true })
    fs.writeFileSync(
      path.join(srcDir, 'fragments', 'java', 'framework', 'spring-boot', 'quick-reference.md'),
      '# SB',
      'utf-8',
    )

    // registry 中没有 spring-boot 的碎片映射
    const registry: Registry = {
      version: '1',
      tools: {},
      wizards: {},
      skills: {},
    }
    const targetDir = path.join(tmpDir, 'target')
    fs.mkdirSync(targetDir, { recursive: true })

    expect(() =>
      copyFragmentsForSkill('test-skill', srcDir, {}, registry, targetDir),
    ).not.toThrow()
    // 不应创建任何文件
    expect(fs.readdirSync(targetDir)).toEqual([])
  })

  it('fragment 缺少 quick-reference.md 时应跳过该 fragment（不抛错）', () => {
    const srcDir = path.join(tmpDir, 'src')
    // 只有目录，没有 quick-reference.md
    fs.mkdirSync(path.join(srcDir, 'fragments', 'something', 'test'), { recursive: true })

    const registry = makeRegistry({ 'test': ['something/test'] })
    const targetDir = path.join(tmpDir, 'target')
    fs.mkdirSync(targetDir, { recursive: true })

    expect(() =>
      copyFragmentsForSkill('test-skill', srcDir, { 'test.fragments': 'test' }, registry, targetDir),
    ).not.toThrow()
    // target 不应有 test.md 文件
    expect(fs.existsSync(path.join(targetDir, 'test.md'))).toBe(false)
  })

  it('fragment 有 quick-reference.md 但无 examples/ 目录时应只复制 quick-reference', () => {
    const srcDir = path.join(tmpDir, 'src')
    fs.mkdirSync(path.join(srcDir, 'fragments', 'ui-lib', 'primeng'), { recursive: true })
    fs.writeFileSync(
      path.join(srcDir, 'fragments', 'ui-lib', 'primeng', 'quick-reference.md'),
      '# PrimeNG',
      'utf-8',
    )
    // 没有 examples/ 目录

    const registry = makeRegistry({ 'primeng': ['ui-lib/primeng'] })
    const targetDir = path.join(tmpDir, 'target')
    fs.mkdirSync(targetDir, { recursive: true })

    copyFragmentsForSkill('test-skill', srcDir, { 'test.fragments': 'primeng' }, registry, targetDir)

    // 只有 {value}.md，没有 examples/ 目录
    expect(fs.readFileSync(path.join(targetDir, 'primeng.md'), 'utf-8')).toBe('# PrimeNG')
    expect(fs.existsSync(path.join(targetDir, 'examples'))).toBe(false)
  })

  it('fragment examples 目录为空时应跳过 examples 创建', () => {
    const srcDir = path.join(tmpDir, 'src')
    fs.mkdirSync(path.join(srcDir, 'fragments', 'css', 'tailwind', 'examples'), { recursive: true })
    fs.writeFileSync(
      path.join(srcDir, 'fragments', 'css', 'tailwind', 'quick-reference.md'),
      '# Tailwind',
      'utf-8',
    )

    const registry = makeRegistry({ 'tailwind': ['css/tailwind'] })
    const targetDir = path.join(tmpDir, 'target')
    fs.mkdirSync(targetDir, { recursive: true })

    copyFragmentsForSkill('test-skill', srcDir, { 'test.fragments': 'tailwind' }, registry, targetDir)

    // quick-reference.md 应复制
    expect(fs.readFileSync(path.join(targetDir, 'tailwind.md'), 'utf-8')).toBe('# Tailwind')
    // 但 examples 目录不应创建（readdirSync 返回空列表，不应创建 examples/ 目录）
    // （循环不会执行 ensureDir，所以 examples/ 不存在）
    expect(fs.existsSync(path.join(targetDir, 'examples'))).toBe(false)
  })
})
