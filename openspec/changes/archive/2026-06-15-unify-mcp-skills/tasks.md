## 1. 创建新的 deepstorm-mcp-* SKILL.md 文件

- [x] 1.1 创建 `deepstorm-mcp-jira-read/SKILL.md` — 内容源自 reef-start 1.2 的 Issue 获取流程
- [x] 1.2 创建 `deepstorm-mcp-jira-write/SKILL.md` — 内容源自 tide-discuss 4c 的 Issue 创建流程
- [x] 1.3 创建 `deepstorm-mcp-dingtalk-wiki-read/SKILL.md` — 内容源自 reef-start references/jira-start-dingtalk.md
- [x] 1.4 创建 `deepstorm-mcp-dingtalk-wiki-write/SKILL.md` — 内容源自 tide-discuss 4a 的 PRD 推送流程
- [x] 1.5 创建 `deepstorm-mcp-figma-read/SKILL.md` — 内容源自 reef-start references/jira-start-figma.md
- [x] 1.6 创建 `deepstorm-mcp-github-read/SKILL.md` — 从现有 cli/mcp-skills/mcp-github/SKILL.md 提取只读操作
- [x] 1.7 创建 `deepstorm-mcp-github-write/SKILL.md` — 从现有 cli/mcp-skills/mcp-github/SKILL.md 提取写入操作（含 comment）

## 2. 更新构建与安装逻辑

- [x] 2.1 更新 `packages/reef/wizard.json` — 新增 `mcpSkills: ["deepstorm-mcp-jira-read", "deepstorm-mcp-dingtalk-wiki-read", "deepstorm-mcp-figma-read"]`
- [x] 2.2 更新 `packages/tide/wizard.json` — 新增 `mcpSkills: ["deepstorm-mcp-jira-write", "deepstorm-mcp-dingtalk-wiki-write"]`
- [x] 2.3 更新 `packages/sweep/wizard.json` — 新增 `mcpSkills: ["deepstorm-mcp-jira-read", "deepstorm-mcp-dingtalk-wiki-read"]`
- [x] 2.4 更新 `packages/atoll/wizard.json` — 新增 `mcpSkills: []`
- [x] 2.5 更新 `packages/cli/src/build-registry.ts` — 在 wizard.json 扫描逻辑中读取 `mcpSkills` 字段，写入 registry
- [x] 2.6 更新 `packages/cli/src/commands/setup.ts` — 将 MCP skill 安装从 Step 1c 移到 Step 2 之后，改为按工具 `mcpSkills` + MCP 服务交集体选择性安装

## 3. 更新各模板中的 MCP skill 引用路径

- [x] 3.1 更新 `reef-start/SKILL.md.tmpl` — 5 处 `.claude/skills/mcp-{provider.id}/SKILL.md` 替换为 `deepstorm-mcp-*` 硬编码路径（1.2→jira-read、1.3→dingtalk-wiki-read、1.5→figma-read + 注意事项）
- [x] 3.2 更新 `tide-discuss/SKILL.md.tmpl` — 2 处替换（4a→dingtalk-wiki-write、4c→jira-write）
- [x] 3.3 更新 `sweep-plan/SKILL.md.tmpl` — 2 处替换（issue_tracker→jira-read、knowledge_base→dingtalk-wiki-read）

## 4. 清理旧文件

- [x] 4.1 删除 `packages/cli/mcp-skills/mcp-figma/` 旧单体目录
- [x] 4.2 删除 `packages/cli/mcp-skills/mcp-dingtalk-wiki/` 旧单体目录
- [x] 4.3 删除 `packages/cli/mcp-skills/mcp-github/` 旧单体目录
- [x] 4.4 删除 `packages/cli/mcp-skills/mcp-jira/` 旧单体目录
- [x] 4.5 删除 `packages/reef/skills/reef-start/references/jira-start-dingtalk.md`
- [x] 4.6 删除 `packages/reef/skills/reef-start/references/jira-start-figma.md`
- [x] 4.7 删除 `packages/reef/skills/reef-start/references/jira-start-env.md`

## 5. 验证

- [x] 5.1 运行 `pnpm build` 确认构建通过
- [x] 5.2 运行 `pnpm vitest run` 确认所有测试通过
- [x] 5.3 确认 registry.json 中正确包含各工具的 `mcpSkills` 映射
- [x] 5.4 确认旧命名文档已无残留引用（dist/ 由构建重新生成）
