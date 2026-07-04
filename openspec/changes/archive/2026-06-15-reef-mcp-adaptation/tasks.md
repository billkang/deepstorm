# Tasks: Reef MCP Adaptation

## 1. Foundation — injectSkillCapabilities 泛化

- [x] 1.1 在 `packages/cli/src/template/registry.ts` 中新增 `deriveVariableName`，从 frontmatter.deepstorm.tool 自动推导变量名
- [x] 1.2 重构返回语句：`return { ...baseVariables, [resolvedVarName]: capabilities }`
- [x] 1.3 验证所有现有 Tide 测试通过（120/120 pass）

## 2. reef-start 模板化

- [x] 2.1 将 `packages/reef/skills/reef-start/SKILL.md` 重命名为 `SKILL.md.tmpl`（原 .md 已删除）
- [x] 2.2 在 frontmatter 添加 `mcpCapabilities` 声明（issue_tracker / knowledge_base / design_tools 三个域）
- [x] 2.3 添加 `{{reef_capabilities}}` 模板变量引用和运行时能力发现章节
- [x] 2.4 将 Stage 1 的 MCP 调用改为动态能力检测模式
- [x] 2.5 将 1.5 的 Figma 引用改为通用 design_tools 描述

## 3. 引用文件内容重写

- [x] 3.1 重写 `references/jira-start-dingtalk.md`（通用知识库 PRD 获取）
- [x] 3.2 重写 `references/jira-start-figma.md`（通用设计工具处理）
- [x] 3.3 重写 `references/jira-start-env.md`（通用 MCP 环境配置）
- [x] 3.4 更新 `references/jira-start-subagent.md`（Figma 引用改为设计工具数据）

## 4. reef-gen-frontend 动态化

- [x] 4.1 修改 `packages/reef/skills/reef-gen-frontend/SKILL.md` Step 3，将 `figma-developer` MCP 引用改为 design_tools 能力检测

## 5. reef-pr / reef-commit 通用化

- [x] 5.1 修改 `packages/reef/skills/reef-pr/SKILL.md`，将 GitHub MCP 引用改为通用描述
- [x] 5.2 修改 `packages/reef/skills/reef-commit/SKILL.md`，将 JIRA URL 引用改为通用 Issue URL

## 6. 测试

- [x] 6.1 添加 `injectSkillCapabilities` 泛化后的测试（自定义 variableName → reef_capabilities）
- [x] 6.2 验证 `deriveVariableName` 从 deepstorm.tool 正确推导：tide → tide_capabilities, reef → reef_capabilities
- [x] 6.3 全量测试：`pnpm vitest run` → 120/120 pass
