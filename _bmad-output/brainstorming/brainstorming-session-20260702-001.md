# Brainstorming Session: Branch Scope Validation (Reef)

- **Date:** 2026-07-02
- **Session:** 001
- **Status:** Completed → proceeding to `/opsx:new`

## Participants

- Bill (需求方 / Ideator)
- Claude (DeepStorm Architect)

## Problem Statement

开发过程中，一个 git 分支可能包含多个业务领域的变更（如订单 + 支付 + 文档），但团队要求每个分支只专注做一个业务领域。当前缺乏机制来验证分支范围是否聚焦。

## Proposed Solution

在 `reef` 中新增一个 **Branch Scope Validation** 能力，功能包括：

1. **AI 语义分析** — 分析分支的 diff 内容，判断涉及哪些业务领域
2. **本地门禁** — `git commit` 时自动检查，如果涉及多个业务领域则阻止提交
3. **CI 门禁** — PR 创建时作为强制校验
4. **自动拆分** — 给出拆分建议后，用户确认即可自动创建新分支、拆分文件、走 commit

## Key Discussion Points

### 范围判断方法
- ❌ 不是按文件路径/代码模块划分（文件路径不反映业务领域）
- ❌ 不是按 OpenSpec artifact 关联（不够自动化）
- ✅ **AI 语义分析** diff 内容来判定业务领域归属

### 执行模式
- `git commit` hook（本地强制）
- CI/PR 门禁（远程强制）
- 两者都阻断性校验（发现问题就不让提交）

### 输出处理
- 给出拆分建议（列出涉及的 N 个业务领域）
- 用户确认后自动执行：创建分支 → 拆分文件 → git commit

### 归属套件
- 仅涉及 `reef`（开发侧）

## Next Steps

1. ✅ 需求讨论完成
2. ➡️ Step 2: `/opsx:new` 创建 OpenSpec change
3. Step 3: proposal.md — 定义 Why/What/Capabilities/Impact
4. Step 4: specs — 定义每个 capability 的 WHEN/THEN
5. Step 5: design.md — 技术决策
6. Step 6: tasks.md — 实现任务
