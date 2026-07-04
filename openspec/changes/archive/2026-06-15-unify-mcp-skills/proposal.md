## Why

当前 MCP 使用指南 skill 分散在两个地方：`packages/reef/skills/reef-start/references/` 存有面向 reef 的 MCP 操作流程，`packages/cli/mcp-skills/` 存有按 MCP 服务组织的通用指南。两者内容重叠但各自维护，导致 CLI 安装的来源和各子工具实际使用的内容不一致。MCP skill 本质上是 DeepStorm 层级的公共能力，不属于任何单个子工具，需要统一管理、按需安装，确保每个子工具使用的 MCP skill 内容一致且仅包含实际需要的操作。

## What Changes

- **新增** `packages/cli/mcp-skills/deepstorm-mcp-*` skill 文件，按 `{service}-{op}` 两分（read/write），内容从各子工具的实际使用场景提取
- **删除** `packages/cli/mcp-skills/mcp-{name}/` 未拆分的单体 SKILL.md 文件
- **删除** `packages/reef/skills/reef-start/references/jira-start-dingtalk.md`（内容迁移到 `deepstorm-mcp-dingtalk-wiki-read`）
- **删除** `packages/reef/skills/reef-start/references/jira-start-figma.md`（内容迁移到 `deepstorm-mcp-figma-read`）
- **修改** 各模板（reef-start、tide-discuss、sweep-plan）中所有 `.claude/skills/mcp-{provider.id}/SKILL.md` 通配引用，改为 `.claude/skills/deepstorm-mcp-{service}-{op}/SKILL.md` 硬编码路径
- **删除** `packages/reef/skills/reef-start/references/jira-start-env.md`（MCP 环境配置内容合并到 `deepstorm-mcp-env` 或 design.md 中的通用说明）
- **新增** `wizard.json` 的 `mcpSkills` 字段，声明每个子工具所需的 MCP skill 列表
- **修改** `build-registry.ts` 读取 `wizard.json` 的 `mcpSkills` 字段写入 `registry.json`
- **修改** `setup.ts` 安装逻辑，按用户选择的子工具对应的 `mcpSkills` 映射只安装必要的 `deepstorm-mcp-*` skill

## Capabilities

### New Capabilities

- `deepstorm-mcp-jira-read`: Jira Issue 读取操作指南——查询 Issue、获取详情、提取自定义字段
- `deepstorm-mcp-jira-write`: Jira Issue 写入操作指南——创建/更新 Issue、状态流转、添加评论
- `deepstorm-mcp-dingtalk-wiki-read`: 钉钉云文档读取操作指南——搜索文档、读取文档内容、提取 PRD 上下文
- `deepstorm-mcp-dingtalk-wiki-write`: 钉钉云文档写入操作指南——创建/更新文档、推送 PRD
- `deepstorm-mcp-figma-read`: Figma 设计稿读取操作指南——获取文件信息、读取节点数据、导出图片
- `deepstorm-mcp-github-read`: GitHub 只读操作指南——浏览代码、搜索仓库、查看 Issue/PR
- `deepstorm-mcp-github-write`: GitHub 写入操作指南——创建/更新 Issue、提交 PR、添加评论

### Modified Capabilities

- 无（本次变更不修改现有 `openspec/specs/` 中的现有 spec）

## Impact

- **`packages/cli/mcp-skills/`**: 目录结构从 `mcp-{name}/SKILL.md` 变为 `deepstorm-mcp-{service}-{op}/SKILL.md`，文件数量从 4 个增至 7 个
- **`packages/cli/src/build-registry.ts`**: 新增 `wizard.json` 的 `mcpSkills` 字段解析逻辑
- **`packages/cli/src/commands/setup.ts`**: MCP skill 安装逻辑改为按子工具映射选择性安装
- **`packages/reef/skills/reef-start/`**: SKILL.md.tmpl 中 5 处 MCP 引用路径更新 + references 中 3 个文件删除（dingtalk、figma、env）
- **`packages/tide/skills/tide-discuss/`**: SKILL.md.tmpl 中 2 处 MCP 引用路径更新
- **`packages/sweep/skills/sweep-plan/`**: SKILL.md.tmpl 中 2 处 MCP 引用路径更新
- **`packages/reef/wizard.json`**: 新增 `mcpSkills` 字段
- **`packages/tide/wizard.json`**: 新增 `mcpSkills` 字段
- **`packages/sweep/wizard.json`**: 新增 `mcpSkills` 字段
- **`packages/atoll/wizard.json`**: 新增 `mcpSkills` 字段（空数组）
- 不改变 `.mcp.json` 的 MCP 服务接入方式，不改变运行时能力发现机制
