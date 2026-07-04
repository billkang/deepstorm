## Why

当用户在自己的项目中安装了 reef 套件后，每次有开发需求（新增功能、修复 bug、重构代码）时，用户需要手动输入 `/reef-start` 命令才能进入 SDD 流程。这对用户来说是一个额外的心智负担——用户更自然地期望直接口述需求（如"我想加一个用户注册功能"），然后系统自动识别这是开发相关需求，自动唤起 reef-start skill 引导用户走高质量 SDD 开发流程。

当前 reef 的 hooks 机制（如 `reef-block-dangerous.sh`、`reef-protect-files.sh`）已经覆盖了文件操作层面的自动化防护，但在"用户消息入口"层面还缺少自动路由能力。

## What Changes

- **新增 `reef-intent-detect.sh` hook 脚本**：部署到 `.claude/hooks/`，在 `before-read` hook 中运行，对用户输入进行开发意图检测
- **新增 hooks.json 配置**：注册 `before-read` hook 类型，调用意图检测脚本
- **修改 reef 安装流程（`wizard.json` 或 setup 脚本）**：确保新 hook 在 reef 安装/更新时自动部署
- **新增匹配规则配置**：定义意图检测的关键词模式，支持用户自定义扩展

## Capabilities

### New Capabilities
- `intent-detection`: 轻量级开发意图检测机制。通过关键词模式匹配，判断用户输入是否属于"开发需求/代码修改"意图，不需要 NLP 模型或外部调用
- `hook-deployment`: Before-read hook 自动部署流程。修改 reef 安装/更新逻辑，确保意图检测 hook 正确安装到用户项目的 `.claude/hooks/` 目录

### Modified Capabilities
- _(无 — 不修改现有 spec 级行为)_

## Impact

- `packages/reef/hooks/reef-intent-detect.sh` — **新建**，核心检测脚本
- `packages/reef/hooks/hooks.json` — **修改**，新增 `before-read` hook 注册
- `packages/reef/wizard.json` — **修改**，在安装/更新时部署新 hook
- `packages/reef/skills/reef-start/SKILL.md.tmpl` — **可能修改**，补充 `Skill` 工具调用的触发条件描述（可选）
- 不影响已安装 reef 的已有用户行为（不修改现有 hook 行为，仅新增）
- 不影响未安装 reef 的项目
