---
title: "DeepStorm Hooks 路径修复与自身开发 hooks 添加"
participants: ["billkang (用户)", "Claude (AI 助手)"]
type: "需求讨论 + 技术方案确认"
status: "已收敛"
date: 2026-07-08
session: "tide-20260708-001"
---

## 讨论背景

在 ChatBI 项目中发现问题后，逐步展开 DeepStorm CLI hooks 相关问题的讨论和修复方案。

## 讨论过程

### 议题 1：hooks.json 路径问题

**触发：** 用户发现 ChatBI 项目中的 `.claude/hooks/hooks.json`（嵌套路径）可以工作吗？如果可以，删除根路径的 `.claude/hooks.json`。

**分析发现：**
- Claude Code 官方文档说明：hooks 配置只从 `.claude/hooks.json`（**项目根目录，单个文件**）加载，hook 脚本放在 `.claude/hooks/` 目录下
- `.claude/hooks/hooks.json`（嵌套路径）是 Claude Code **从不读取**的路径
- 但 ChatBI 项目中 `.claude/hooks/hooks.json` 却生效了——原因是它实际上同时存在 `.claude/hooks.json`（ChatBI 的手动配置）
- 用户确认后删除了 ChatBI 的 `.claude/hooks.json`（因为 ChatBI 的 hooks 配置路径是对的，只是有两个文件存在）

**结论：** 这是 DeepStorm CLI 自身的一个 bug——setup 流程 Step 5 错误地将 hooks 写入 `.claude/hooks/hooks.json`。需要修正所有相关代码。

### 议题 2：DeepStorm 自身需要 hooks 约束

**触发：** 在我修复 hooks 路径问题时，我没有先和用户讨论就直接开始写代码。用户批评说："你直接去生成代码去了吗，你也需要被约束下，借鉴 reef 下面的 hooks，当开始写代码之前，必须走 deepstorm-discuss 流程，把问题讨论清楚了再写代码。"

**分析：**
- reef 套件为开发环境提供了一套完善的 hooks 体系：intent-detect、block-dangerous、protect-files、auto-format、run-tests
- DeepStorm 自身开发环境没有任何 hooks 约束
- 特别需要：改 DeepStorm 代码前必须走 deepstorm-discuss

**结论：** 需要为 DeepStorm 自身 `.claude/` 开发环境借鉴 reef 的 hooks 模式，创建一套类似的约束 hooks。

### 议题 3：补全 hooks 类型

在实现过程中进一步确认了 DeepStorm 自身需要的 hooks：
- **UserPromptSubmit**: 检测输入中的开发意图 → 提示走 deepstorm-discuss
- **PreToolUse|Bash**: 拦截危险 shell 命令（rm -rf /、git push --force 等）
- **PreToolUse|Write|Edit**: 保护关键文件（.env、lock、node_modules、dist）并提示开发流程
- **PostToolUse + Stop**: 编辑后自动跑测试，确保不破坏现有功能

## 讨论产出

### 确定的变更范围

| # | 变更项 | 类型 | 涉及文件 |
|---|--------|------|---------|
| 1 | CLI setup 写入 hooks 路径修正 | bug fix | `packages/cli/src/commands/setup.ts` |
| 2 | CLI upgrade 路径修正 | bug fix | `packages/cli/src/commands/template-upgrade.ts` |
| 3 | merger/hooks.ts JSDoc 修正 | docs | `packages/cli/src/merger/hooks.ts` |
| 4 | reconfigure 清理逻辑适配 | bug fix | `packages/cli/src/wizard/reconfigure.ts` |
| 5 | reconfigure 测试用例更新 | test | `packages/cli/src/wizard/__tests__/reconfigure.test.ts` |
| 6 | reef/sweep/tide 套件 hooks.json 路径修正 | bug fix | `packages/reef/hooks/hooks.json`, `packages/sweep/hooks/hooks.json`, `packages/tide/hooks/hooks.json` |
| 7 | DeepStorm 自身 hooks 配置 | new feature | `.claude/hooks.json` |
| 8 | DeepStorm intent-detect hook | new feature | `.claude/hooks/deepstorm-intent-detect.sh` |
| 9 | DeepStorm block-dangerous hook | new feature | `.claude/hooks/deepstorm-block-dangerous.sh` |
| 10 | DeepStorm protect-files hook | new feature | `.claude/hooks/deepstorm-protect-files.sh` |
| 11 | DeepStorm run-tests hook | new feature | `.claude/hooks/deepstorm-run-tests.sh` |

### 确定的设计决策

1. hooks.json 必须放在项目根 `.claude/hooks.json`，而不是 `.claude/hooks/hooks.json`
2. hook 脚本路径使用 `bash .claude/hooks/deepstorm-*.sh` 格式，相对路径
3. 借鉴 reef 的 hook 模式但独立实现，不完全复制
4. `protect-files` 对 CLAUDE.md、registry.json、wizard.json 等关键配置只警告不阻止
5. `run-tests` 异步执行，30s 超时放行，不阻塞流程
6. **硬约束：** Write/Edit 之前必须走 deepstorm-discuss，通过 prompt hook 强制执行

### 明确的排除范围（Non-Goals）

- ❌ 不改动 DeepStorm 自身的构建/发布流程
- ❌ 不修改各套件的 hook 脚本逻辑本身（只改路径）
- ❌ 不为 playground 设置 hooks（相关的旧 hooks.json 文件已删除）
- ❌ 不引入新的测试框架

## 下一步

- [x] 代码已实现（所有 11 项变更的代码已完成）
- [ ] 补全 OpenSpec artifacts（proposal → specs → design → tasks）
- [ ] 验证（verify）
- [ ] 归档（archive）
