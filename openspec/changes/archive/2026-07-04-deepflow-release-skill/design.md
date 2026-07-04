## Context

当前 `@deepstorm/cli` 的发版通过 4 个 npm scripts 拼凑，依赖 `changeset` 工具管理版本和 CHANGELOG。用户每次 PR 都需要手动运行 `pnpm changeset` 创建变更描述文件，发版时再运行 `changeset version` 消费这些文件。这一流程要求开发者理解 changeset 的概念和使用方式，且 PR 时容易遗忘此步骤。

本变更将发版流程设计为一个 Claude Code Skill（`.claude/skills/deepstorm-release/SKILL.md`），用户运行 `/deepstorm-release` 即可在 AI 引导下完成从版本号决策到发布的完整链路。**Skill 的执行由 Claude Code 在交互会话中实时完成**——每条命令由 AI 调用 Bash 工具执行，每一步由用户确认，不是独立脚本或后台任务。

同时彻底移除 `changeset` 工具链，不再依赖 `.changeset/` 目录。

## Goals / Non-Goals

**Goals:**

- 提供一个 `/deepstorm-release` 命令，在 Claude Code 中完成完整发版流程
- AI 根据 git 提交历史自动分析版本变更范围，建议版本号
- AI 按 Conventional Commits 类型分类生成 CHANGELOG，追加到已有文件
- 自动化构建和 npm publish
- 完全移除 changeset 工具链
- 所有包共享统一版本号

**Non-Goals:**

- 不提供 CI/CD 流水线集成（Skill 只在 Claude Code 交互会话中运行）
- 不处理多通道发布（如 `next` / `beta` 标签）——采用 `--tag` 参数简单支持
- 不替代手动热修复分支管理

## Decisions

### D1: Skill 作为入口，而非 CLI 子命令

| 方案 | 说明 |
|------|------|
| CLI 子命令 (`deepstorm release`) | 在 CLI 代码中实现完整发版逻辑 |
| **Skill (`/deepstorm-release`) ✅** | 在 SKILL.md 中描述发版流程，由 Claude Code 逐步骤执行 |

**理由：**
- 发版流程需要大量上下文理解（git 历史分析、CHANGELOG 润色），AI 在此方面有天然优势
- 代码构建和 npm publish 可由 Skill 中的 Bash 工具调用，无需额外 CLI 逻辑
- 与 deepstorm-release 的定位一致——Skill 是 Claude Code 的扩展，而非独立 CLI 命令
- 快速迭代：修改 SKILL.md 即可调整流程，无需重新构建和发布 CLI

### D2: 直接执行而非生成脚本

Skill 在执行过程中直接调用 Bash 工具运行命令（构建、npm publish 等），**不生成中间脚本文件**。

**理由：** 发版是一次性事件，不需要可复用的脚本文件。直接在当前会话中执行命令是最简单的路径。当前 `.mjs` 脚本中的构建逻辑在过渡期中可保留，由 Skill 调用。

### D3: AI 一站式 CHANGELOG 生成，不依赖 git-changelog 等第三方工具

CHANGELOG 生成完全由运行中的大模型在 Skill 上下文中完成——读取 git log → AI 按 `feat:`/`fix:`/`chore:` 等前缀分类 → 汇总同类变更 → 润色为人类可读的条目 → 追加到 `CHANGELOG.md`。

**理由：**
- 不需要增加外部依赖（`auto-changelog`、`standard-version` 等）
- AI 的分类能力和自然语言表述优于模板化工具
- 模型本身就是发版流程的执行者，零上下文传输成本

### D4: 交互式确认门禁

| 步骤 | 确认方式 |
|------|---------|
| 版本号建议 | AI 展示变更摘要 + 建议版本 → **用户确认或手动输入覆盖** |
| npm publish | 构建完成后提示即将发布的版本和包名 → **用户输入 y 确认后才执行** |

不设全自动模式（如 `--yes`）——发版是高风险操作，每次都需要开发者目视确认。

## Workflow

```
/deepstorm-release
│
├─ 1. 检查当前状态
│   ├─ 读取根 package.json version
│   ├─ 获取最新 git tag (git describe --tags --abbrev=0)
│   ├─ 检查是否有未提交的变更
│   └─ 读取 CHANGELOG.md（为追加做准备）
│
├─ 2. AI 分析 git 历史
│   ├─ git log --oneline <last-tag>..HEAD
│   ├─ 按 Conventional Commits 前缀分类
│   ├─ 统计 feat / fix / chore / refactor / breaking 数量
│   ├─ 分析是否有 breaking changes（`!` 标记或 `BREAKING CHANGE:` 正文）
│   └─ → 建议版本号（major / minor / patch / prerelease）
│
├─ 3. 用户确认版本号         ← ⚡ 交互门禁 #1
│   ├─ 展示变更摘要：N 个 feat, M 个 fix, ...
│   ├─ 展示建议版本：current X.Y.Z → suggested A.B.C
│   └─ 用户：接受 / 手动输入替代版本号
│
├─ 4. 生成 CHANGELOG
│   ├─ AI 汇总分类后的提交
│   ├─ 按格式撰写条目：### Features / ### Bug Fixes / ### Maintenance
│   ├─ 整合 breaking changes 标注
│   └─ 追加到 CHANGELOG.md 文件头部
│
├─ 5. 更新版本号
│   ├─ 根 package.json → version 字段
│   └─ packages/*/package.json → 回写同步版本
│
├─ 6. 构建
│   └─ 执行构建命令（pnpm build）
│
├─ 7. 创建 Release Commit + Tag
│   ├─ git add . && git commit -m "RELEASING: Releasing v{version}"
│   └─ git tag v{version}
│
├─ 8. 发布到 npm              ← ⚡ 交互门禁 #2
│   ├─ 展示即将发布的版本号和包名
│   ├─ 用户确认 → npm publish（或 pnpm publish）
│   └─ git push origin main --tags
│
└─ 9. 完成
    ├─ 展示发布摘要
    └─ 提示用户验证
```

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| AI 分析的版本号不准确 | 版本号语义错误 | 设确认门禁（D4），用户可以手动覆盖 |
| git commit message 质量参差不齐 | CHANGELOG 可读性下降 | AI 负责润色汇总，可合并同类项 |
| npm publish 需要 npm token 或登录 | 流程阻断 | Skill 前置检查 npm whoami，引导用户先登录 |
| 构建失败导致版本已 commit 但未发布 | 版本已标记但 npm 不可用 | 先构建再 commit+tag（步骤 6 → 7），构建失败不产生提交 |
| 同时有未提交的本地修改 | 可能误提交脏文件 | Step 1 检查 git status，有脏文件时中断并提示 |
| changeset 残留引用 | 构建脚本或文档中可能还有引用 | 在 tasks 中添加 grep 检查所有代码文件的 changeset 引用 |

## Migration Plan

1. 创建 SKILL.md（本 change 的主要产出）
2. 删除 `.changeset/` 目录
3. 删除 `packages/cli/scripts/release.mjs`
4. 修改 `package.json`（根 + packages）——移除 changeset devDependency，精简 scripts
5. 检查并清理所有代码文件中对 `changeset` 的引用
6. 保留现有的 `CHANGELOG.md`（Skill 后续会追加而不是覆盖）
7. 下次发布直接使用 `/deepstorm-release` 替代旧的 `pnpm release` 流程

## Open Questions

- 发版后是否需要自动推送 GitHub Release？暂不纳入 MVP，后续可扩展
- 是否支持 `--tag next` 等 dist-tag 参数？Step 8 可支持参数传递
