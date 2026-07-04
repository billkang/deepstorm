# Brainstorming Session — 2026-07-04

## 会话信息

- **日期：** 2026-07-04
- **议题：** CLI 发版流程重构（release 命令）
- **参与者：** Bill（用户）、Claude

## 讨论内容

### 背景

`@deepstorm/cli` 目前的发版流程由 4 个分散的脚本构成：

| 命令 | 用途 |
|------|------|
| `pnpm changeset` | 手动创建变更描述文件 |
| `pnpm changeset version` | 基于 changeset 文件生成版本号 + CHANGELOG |
| `pnpm release` | 执行构建脚本 |
| `pnpm release:publish` | 执行 npm publish |

流程割裂，需要开发者手动操作多个步骤，且版本号决策依赖人工判断。同时 changeset 存在对开发者的记忆负担（每个 PR 都需要记得跑 `changeset`）。

### 目标

合并为一个 `release` 命令，自动完成从版本号决策到发布的完整链路：

```
release → 读 git log → AI 建议版本号 + 用户确认 → 生成 CHANGELOG → 构建 → npm publish
```

### 关键决策

1. **舍弃 changeset** ❌
   - 所有工具使用统一版本号，changeset 的多包版本管理优势无法发挥
   - 开发者需要理解 changeset 的概念和文件管理，增加认知负担
   - 改为全部从 git commit 历史 + AI 分析决策

2. **版本号决策流程**
   - 大模型根据 git commit 历史（Conventional Commits 前缀）分析变更范围
   - 建议合适的版本号（major / minor / patch + pre-release）
   - **用户确认后才继续**，不会自动发布

3. **CHANGELOG 生成**
   - 追加到已有 CHANGELOG.md 文件
   - 按 Conventional Commits 前缀分类生成（feat: / fix: / chore: / refactor: 等）
   - AI 可自行分析汇总信息，不依赖人工预写的变更描述

4. **发布行为**
   - 构建代码
   - 执行 npm publish
   - 提交版本号和 CHANGELOG 的变更到 git

### 超越现有 changeset 的优势

| 维度 | changeset | Git Log + AI |
|------|-----------|-------------|
| **开发者负担** | 每个 PR 都要手动跑 | 零人工参与（发版时才运行） |
| **遗漏风险** | 开发者可能忘记跑 changeset | 不依赖人工记忆 |
| **版本号精度** | 靠开发者写时判断 | AI 在发版时全局分析所有变更 |
| **CHANGELOG 质量** | 开发者写的自由文本 | 遵循 Conventional Commits 规范 |

### 待办问题

- release 命令在 CLI 中实现还是放在 `scripts/release.mjs` 中？
- Git tag 是否自动添加？
- 是否需要支持 dry-run 模式（只分析不真的 publish）？
- monorepo 中多个包的构建顺序（目前似乎只有 `@deepstorm/cli` 需要发布）

## 检查清单

- [x] 已明确"做什么"：合并发版流程为一个 AI 驱动的 release 命令
- [x] 已明确"不做什么"：不保留 changeset 工具链
- [x] 已收敛到可执行的变更范围
- [ ] 变更名称确认后进入 Step 2
