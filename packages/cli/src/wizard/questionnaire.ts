import * as p from '@clack/prompts'
import type { RegistryReader } from '../engine/registry'
import type { WizardEntry, WizardQuestion, WizardOption } from '../types/registry'

/**
 * 为指定工具运行问答流程。
 * @param configuredKeys - 已在前置工具中配过的 key 集合（跨工具去重）
 * @returns 用户配置映射 { configKey: configValue }
 */
export async function runQuestionnaire(
  reader: RegistryReader,
  tools: string[],
  configuredKeys: Set<string>,
): Promise<Record<string, string>> {
  const config: Record<string, string> = {}

  for (const tool of tools) {
    const wizard = reader.getWizard(tool)
    if (!wizard) continue

    const toolConfig = await runToolWizard(wizard, configuredKeys)
    Object.assign(config, toolConfig)
  }

  return config
}

/** 评估单个 question 的 dependsOn 条件 */
function evaluateDependsOn(
  question: WizardQuestion,
  config: Record<string, string>,
): boolean {
  if (!question.dependsOn) return true

  const parentValue = config[question.dependsOn.key]

  if (question.dependsOn.contains) {
    const values = parentValue ? parentValue.split(',').map((v) => v.trim()) : []
    const contains = values.includes(question.dependsOn.value)
    return question.dependsOn.not ? !contains : contains
  }

  return question.dependsOn.not
    ? parentValue !== question.dependsOn.value
    : parentValue === question.dependsOn.value
}

/** 渲染单个 question（select / multiselect / group） */
async function renderQuestion(
  question: WizardQuestion,
  config: Record<string, string>,
  configuredKeys: Set<string>,
): Promise<void> {
  if (question.type === 'multiselect' && question.options) {
    const hasGroups = question.options.some((o) => o.group)
    if (hasGroups) {
      const groups = groupOptionsByGroup(question.options)
      const answer = await p.groupMultiselect({
        message: question.label,
        options: groups,
      })
      if (p.isCancel(answer)) {
        p.cancel('已取消')
        process.exit(0)
      }
      config[question.key] = (answer as string[]).join(',')
    } else {
      const answer = await p.multiselect({
        message: question.label,
        options: question.options.map((o) => ({
          value: o.value,
          label: o.label,
        })),
      })
      if (p.isCancel(answer)) {
        p.cancel('已取消')
        process.exit(0)
      }
      config[question.key] = (answer as string[]).join(',')
    }
    configuredKeys.add(question.key)
  } else if (question.type === 'select' && question.options) {
    const answer = await p.select({
      message: question.label,
      options: question.options.map((o) => ({
        value: o.value,
        label: o.label,
      })),
    })
    if (p.isCancel(answer)) {
      p.cancel('已取消')
      process.exit(0)
    }
    config[question.key] = answer as string
    configuredKeys.add(question.key)
  } else if (question.type === 'group' && question.questions) {
    const groupPrompts: Record<string, () => Promise<unknown>> = {}
    for (const sub of question.questions) {
      if (sub.type === 'select' && sub.options) {
        groupPrompts[sub.key] = () =>
          p.select({
            message: sub.label,
            options: sub.options!.map((o) => ({
              value: o.value,
              label: o.label,
            })),
          })
      }
    }
    const answers = await p.group(groupPrompts, {
      onCancel: () => {
        p.cancel('操作已取消')
        process.exit(0)
      },
    })
    for (const [key, value] of Object.entries(answers)) {
      config[key] = value as string
      configuredKeys.add(key)
    }
  }
}

/**
 * 将 multiselect 后的所有 question 渲染为一个 p.group() 表单。
 * 按选中领域展开（前端/后端），传递依赖（如 Java 详情依赖语言）通过
 * group 的 results 实现条件展示。所有选项一页看完，无需切 tab。
 */
async function renderAsSingleGroup(
  questions: WizardQuestion[],
  multiselectKey: string,
  selectedTechs: string[],
  config: Record<string, string>,
  configuredKeys: Set<string>,
): Promise<void> {
  // Phase 1: 分类 question — 根节点（直接依赖 multiselect）和传递依赖
  const directQuestions: WizardQuestion[] = []
  const conditionalGroups: Array<{ group: WizardQuestion }> = []

  for (let i = 1; i < questions.length; i++) {
    const q = questions[i]

    // 根节点：直接依赖 multiselect，contains 方式
    if (q.dependsOn?.key === multiselectKey && q.dependsOn?.contains) {
      if (!selectedTechs.includes(q.dependsOn.value)) {
        config[q.key] = 'none'
        continue
      }
      directQuestions.push(q)
    }
    // 传递依赖：非 contains 的 dependsOn（如 Java 详情依赖 language）
    else if (q.dependsOn && !q.dependsOn.contains) {
      conditionalGroups.push({ group: q })
    }
  }

  // Phase 2: 构建 p.group 的 prompts record
  const groupPrompts: Record<string, (...args: any[]) => any> = {}

  for (const root of directQuestions) {
    if (root.type === 'group' && root.questions) {
      for (const sub of root.questions) {
        if (configuredKeys.has(sub.key)) continue
        if (sub.type === 'select' && sub.options) {
          const opts = sub.options
          groupPrompts[sub.key] = () =>
            p.select({
              message: sub.label,
              options: opts.map((o) => ({
                value: o.value,
                label: o.label,
              })),
            })
        }
      }
    } else if (root.type === 'select' && root.options) {
      if (configuredKeys.has(root.key)) continue
      const opts = root.options
      groupPrompts[root.key] = () =>
        p.select({
          message: root.label,
          options: opts.map((o) => ({
            value: o.value,
            label: o.label,
          })),
        })
    }
  }

  // 传递依赖（条件性展示，如 "Java 详情" 仅在语言选 Java 后展示）
  for (const { group: grp } of conditionalGroups) {
    if (!grp.dependsOn) continue
    const depKey = grp.dependsOn.key
    const depValue = grp.dependsOn.value

    if (grp.type === 'group' && grp.questions) {
      for (const sub of grp.questions) {
        if (configuredKeys.has(sub.key)) continue
        if (sub.type === 'select' && sub.options) {
          groupPrompts[sub.key] = ({ results }: { results: Record<string, string> }) => {
            if (results[depKey] === depValue) {
              return p.select({
                message: sub.label,
                options: sub.options!.map((o) => ({
                  value: o.value,
                  label: o.label,
                })),
              })
            }
            return undefined // 条件不满足，跳过
          }
        }
      }
    }
  }

  // Phase 3: 渲染表单组
  if (Object.keys(groupPrompts).length === 0) return

  const answers = await p.group(groupPrompts, {
    onCancel: () => {
      p.cancel('操作已取消')
      process.exit(0)
    },
  })

  for (const [key, value] of Object.entries(answers)) {
    if (value !== undefined) {
      config[key] = value as string
      configuredKeys.add(key)
    }
  }
}

async function runToolWizard(
  wizard: WizardEntry,
  configuredKeys: Set<string>,
): Promise<Record<string, string>> {
  const config: Record<string, string> = {}

  p.intro(`${wizard.label} — ${wizard.description}`)

  let i = 0
  while (i < wizard.questions.length) {
    const question = wizard.questions[i]

    if (configuredKeys.has(question.key)) {
      p.note(`已在其他工具中配置，跳过`, question.label)
      i++
      continue
    }

    // 检查 dependsOn 条件（不含 contains — 那是 tab root 专用）
    if (question.dependsOn && !question.dependsOn.contains) {
      if (!evaluateDependsOn(question, config)) {
        config[question.key] = 'none'
        i++
        continue
      }
    }

    if (question.type === 'multiselect' && question.options) {
      // 渲染多选
      await renderQuestion(question, config, configuredKeys)

      // 检测后续是否有 tab-eligible question（contains 依赖此 multiselect）
      const hasTabs = wizard.questions.some(
        (q, idx) =>
          idx > i &&
          q.dependsOn?.key === question.key &&
          q.dependsOn?.contains,
      )

      if (hasTabs) {
        const selectedTechs = (config[question.key] || '')
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
        await renderAsSingleGroup(
          wizard.questions,
          question.key,
          selectedTechs,
          config,
          configuredKeys,
        )
        // 所有后续 question 已被大表单处理，退出循环
        break
      }
    } else if (question.dependsOn?.contains) {
      // 普通 tab root（contains 但不在 multiselect 后自动检测的情况）
      // 按普通 question 处理
      if (evaluateDependsOn(question, config)) {
        await renderQuestion(question, config, configuredKeys)
      } else {
        config[question.key] = 'none'
      }
    } else {
      // select / group / confirm
      if (question.type === 'select' || question.type === 'group') {
        await renderQuestion(question, config, configuredKeys)
      }
      // type === 'confirm' 按原有逻辑处理（如有需要可扩展）
    }

    i++
  }

  p.outro(`${wizard.label} 配置完成`)
  return config
}

/**
 * 将带 group 的选项列表按 group 分组为 Record<string, Option[]>。
 * group 为 undefined 的选项归入 "其他" 组。
 */
function groupOptionsByGroup(
  options: WizardOption[],
): Record<string, Array<{ value: string; label: string }>> {
  const groups: Record<string, Array<{ value: string; label: string }>> = {}
  for (const opt of options) {
    const groupName = opt.group || '其他'
    if (!groups[groupName]) groups[groupName] = []
    groups[groupName].push({ value: opt.value, label: opt.label })
  }
  return groups
}
