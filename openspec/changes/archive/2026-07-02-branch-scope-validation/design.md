## Context

当前 DeepStorm 的 `reef` 套件提供了开发侧工具链，包括代码审查 agents、提交信息生成（`reef-commit` skill）、代码风格规范等能力，但缺少对分支范围的治理。

核心难点在于：
- `reef` 现有的 hooks 是 **Claude Code hooks**（BeforeRead、PreToolUse 等），而我们需要的是 **git hooks**（pre-commit）和 **CI 门禁**，这是两个不同层次
- `reef-commit` skill 处理的是"已准备好提交的内容"，而本变更需要在 commit 之前拦截检查
- AI 语义分析需要调用 LLM API，但 git hook 运行在非交互式环境中

## Goals / Non-Goals

**Goals:**
- 在 git commit 时自动检测当前分支涉及的业务领域，多领域时阻断提交
- 在 CI/PR 阶段作为强制门禁，多领域时阻止合并
- 自动生成拆分方案，用户确认后执行分支拆分操作
- 提供可配置的 enable/disable 开关

**Non-Goals:**
- 不修改现有的 `reef-commit` skill 的核心流程（仅在 commit 前增加检查层）
- 不涉及业务领域定义文件的自动维护（领域由 LLM 自由分类，非预设列表）
- 不涉及分支合并后的清理工作

## Decisions

### Decision 1: 架构分层 — git hook 作为外层拦截，reef agent 作为交互层

三种执行环境需要统一的能力，选择分层架构：

```
┌──────────────────────────────────────────────┐
│                 用户交互层                      │
│  reef skill: 交互式分析、展示报告、确认拆分     │
├──────────────────────────────────────────────┤
│                CLI 核心层                       │
│  reef-scope-check CLI: 接收 diff → LLM 分析    │
│  → 输出 JSON 报告                             │
├──────────────────────────────────────────────┤
│                  执行层                        │
│  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │ git hook │  │ CI 脚本  │  │ reef agent  │ │
│  │ pre-comit│  │ 门禁步骤 │  │ 交互式调用  │ │
│  └──────────┘  └──────────┘  └─────────────┘ │
└──────────────────────────────────────────────┘
```

**理由：**
- CLI 核心层可被三种执行层复用，避免重复
- git hook 场景无法依赖 Claude Code 运行时，必须能独立调用
- reef agent 场景可以整合到 Claude Code 会话中，使用更丰富的交互

**备选方案：**
- 仅做 Claude Code hook（BeforeRead/PreToolUse）：可以在 Claude Code 会话中拦截，但无法在 `git commit` 命令直接执行时拦截 → **被否决**，因为用户要求原生 `git commit` 时也要阻断

### Decision 2: AI 语义分析 — 通过 DeepStorm 已配置的 LLM API Key 调用

方向 C（AI 语义分析）。选择 **使用 Claude API（或可配置的 LLM API）** 作为分析引擎：

**架构：**
1. reef-scope-check CLI 收集 git diff 内容
2. 将 diff + 分析 prompt 通过 API 调用发送给 LLM（默认 Claude API）
3. LLM 返回结构化的 JSON 结果：`{domains: [{name, confidence, explanation}], suggested_split: [...]}`

**理由：**
- DeepStorm 已在 `.env` 中配置了 LLM API key（如 `ANTHROPIC_API_KEY`），无需新增基础设施
- Claude 在代码理解和语义分类方面表现优秀
- 通过结构化输出（JSON mode）确保结果可程序化消费
- API key 在 `.env` 中配置，git hook 脚本可以读取

**备选方案：**
- 本地小模型：无需网络但分类质量差 → **被否决**
- 规则引擎（关键词匹配）：无法捕获语义层面的跨领域 → **被否决**

### Decision 3: Git hook 安装机制 — reef 安装向导集成

git hook 通过 `reef scope setup` 命令安装到目标仓库的 `.git/hooks/pre-commit`：

```
# 安装
reef scope setup
  → 在目标仓库的 .git/hooks/pre-commit 写入 hook 脚本
  → 在项目根目录生成 .deepstorm/scope-config.json（配置）

# 卸载
reef scope uninstall
  → 移除 .git/hooks/pre-commit 中的 scope 检查部分
```

**理由：**
- `reef` 的 wizard.json 和 setup-wizard 已经处理项目初始化，集成安装流程一致
- 直接在 `.git/hooks/pre-commit` 安装对用户最透明
- 配置独立文件，不影响现有 `.claude/` 目录

### Decision 4: 领域分类策略 — 自由分类 + 可选对齐

LLM 默认根据 diff 内容自由判定业务领域，但支持可选的项目级领域对齐：

**默认模式（自由分类）：**
- LLM 阅读 diff，根据代码变更的语义内容自主判定领域
- 适合于尚未定义明确领域划分的项目

**可选模式（领域对齐）：**
- 项目可在 `.deepstorm/scope-config.json` 中定义领域列表
- LLM 将 diff 内容对齐到预定义的领域列表中

**理由：**
- 起步成本最低：不需要用户预先定义领域，拿来即用
- 灵活性高：适应不同项目的领域划分习惯
- 对齐模式为高阶用户提供控制力

### Decision 5: 分支拆分策略 — 基于 git 原生操作

分支拆分使用标准 git 命令实现：

```
1. 从基准分支（main/develop）创建 N 个新分支
2. 对每个新分支：
   a. 只添加属于该领域的文件变更
   b. 如有文件被多个领域共享，归入主要变更领域
   c. 生成领域相关 commit message
3. 当前分支保持原样，不自动删除
```

**理由：**
- 纯 git 操作，无外部依赖
- 最大程度保证数据安全（不丢失任何变更）
- 用户可预览拆分结果后拒绝

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| LLM API 调用失败（网络、配额、key 过期） | commit 被阻断或跳过检查 | 引入 fallback 模式：API 不可用时提示告警但不阻断 |
| LLM 分类不准确 | 误报或漏报 | 输出可信度评分，低分时标记"需人工确认" |
| 大 diff 导致 API 成本高 | 每次 commit 调用一次 API，大 diff 成本增加 | 限制 diff 大小（截断 + 采样），可配置 |
| git hook 安装冲突 | 用户已有自定义 pre-commit hook | hook 安装器采用 chain 模式：追加而非覆盖已有 hook |
| 拆分操作误操作导致文件丢失 | 用户确认后仍有风险 | 拆分前自动做 git stash/备份，提供 rollback 能力 |

## Migration Plan

1. **Phase 1** — CLI 核心层 + scope-detection（CLI 工具可独立运行，通过命令行手动检测）
2. **Phase 2** — scope-gate（git hook + CI 脚本）
3. **Phase 3** — branch-splitting（自动拆分）+ reef skill（交互式体验）

每个 Phase 可独立发布，用户逐步启用。

## Open Questions

- LLM 调用时使用的 prompt 模板如何设计，以确保分类结果一致且可结构化解析？
- 大 diff（1000+ 行变更）是否需要文件摘要替代全量 diff 发送？
- 是否需要支持多语言分析（Java/Python/TypeScript 等）的差异处理？
