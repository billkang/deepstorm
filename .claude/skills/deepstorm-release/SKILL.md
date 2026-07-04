---
name: deepstorm-release
description: Use when the user wants to publish a new version of @deepstorm/* packages to npm, or when running a release/publish workflow for the DeepStorm monorepo. Triggers include "release", "publish", "bump version", "cut a release", "ship it", "发版".
---

# DeepStorm Release

## Overview

`/deepstorm-release` 是 DeepStorm 项目的 AI 驱动发版流程。它分析 git 提交历史来决定版本号、生成 CHANGELOG、构建代码并发布到 npm——每一步都经过用户确认。

去除了 `changeset` 依赖，改用 Git Log + AI 分析替代手动变更记录。

## When to Use

| 触发场景 | 不适用 |
|------|--------|
| "发版"、"发布"、"release"、"publish"、"bump version" | 日常开发提交 |
| "cut a release"、"ship it" | 独立的 npm 包发布（非 DeepStorm 项目） |
| 准备正式或 pre-release 版本 | 只需要构建而不发布 |

## Version Strategy

- **统一版本号**：所有 `@deepstorm/*` 包共享同一版本号（根 `package.json` 中的 `version`）
- **仅 CLI 发布到 npm**：`tide`/`reef`/`sweep`/`atoll` 为 `private: true`，自动跳过发布
- **Tag 格式**：`v{version}`（如 `v0.2.0`）

## Workflow

```mermaid
flowchart TD
    START["/deepstorm-release"] --> S1["Step 1: 状态检查"]
    S1 --> S2["Step 2: AI 分析 git 历史"]
    S2 --> G1{"⚡ 门禁 #1<br>版本号确认"}
    G1 -->|"确认/覆盖"| S4["Step 4: 生成 CHANGELOG"]
    S4 --> S5["Step 5: 更新版本号"]
    S5 --> S6["Step 6: 构建"]
    S6 -->|"❌ 失败"| FAIL["中止，提示修复"]
    S6 -->|"✅ 成功"| S7["Step 7: Release Commit + Tag"]
    S7 --> G2{"⚡ 门禁 #2<br>发布确认"}
    G2 -->|"确认"| S8["Step 8: npm publish + git push"]
    G2 -->|"取消"| HOLD["保留版本变更<br>提示手动发布"]
    S8 --> S9["Step 9: 完成摘要"]
    FAIL --> RETRY["修复后重新开始"]
```

### Step 1: 状态检查

检查当前工作区是否就绪：

```bash
# 获取当前版本
cat package.json | jq -r .version

# 获取最新 tag
git describe --tags --abbrev=0 2>/dev/null || echo "no-tag"

# 检查工作区是否干净
git status --porcelain
```

- **工作区脏** → 列出未提交变更，请用户先提交或 stash，然后重新执行 `/deepstorm-release`
- **无 tag** → 从仓库第一次提交开始分析
- **上次发布以来无新提交** → 提示"自上次发布以来无变更"，退出流程

### Step 2: AI 分析 git 历史

读取自上次 tag 以来的提交记录：

```bash
git log --oneline <last-tag>..HEAD
```

AI 按 Conventional Commits 前缀分类分析变更范围。如果没有 tag，使用 `git log --oneline` 分析全部历史。

**分析维度：**

| 提交类型 | 版本影响 | 示例 |
|---------|---------|------|
| `feat:` | minor | 新功能 |
| `feat!:` 或 `BREAKING CHANGE:` | major | 破坏性 API 变更 |
| `fix:` | patch | Bug 修复 |
| `perf:` | patch | 性能优化 |
| `refactor:` / `docs:` / `test:` / `chore:` | patch | 重构/文档/测试/杂项 |

**产出：** 变更摘要 + **建议版本号**（major / minor / patch，同时检测 pre-release 需求）

### Step 3: 版本号确认 ⚡ 门禁 #1

展示给用户：

```
📋 变更摘要 — v0.1.2 以来的变更

  ✨ Features:      3 (templates, update, doctor)
  🐛 Bug Fixes:     2
  🔧 Maintenance:   1
  ⚠️  Breaking:      0

建议版本: 0.1.2 → 0.2.0 (minor)

确认版本号? (y/n 或输入替代版本号)
```

等待用户操作：
- **y/Y** → 使用建议版本号继续
- **n/N** → 提示用户输入替代版本号，输入后使用该值
- **直接输入版本号** → 使用用户输入的版本
- **用户不回应** → **不要继续，再次询问**

> 版本号遵循 [SemVer](https://semver.org/)。Pre-release 格式如 `0.2.0-beta.1` 或 `0.2.0-rc.1`，此时 npm publish 自动使用 `--tag next`。

### Step 4: 生成 CHANGELOG

AI 将 git 提交分类汇总为结构化 CHANGELOG 条目：

```
## [X.Y.Z] - YYYY-MM-DD

### ⚠ BREAKING CHANGES
<!-- 仅在存在破坏性变更时出现此章节 -->

### Features
<!-- feat: 类型的提交 -->

### Bug Fixes
<!-- fix: 类型的提交 -->

### Performance Improvements
<!-- perf: 类型的提交 -->

### Code Refactoring
<!-- refactor: 类型的提交 -->

### Documentation
<!-- docs: 类型的提交 -->

### Maintenance
<!-- chore: / test: / style: / build: / ci: 类型的提交 -->
```

**规则：**
- 每个条目末尾引用 commit hash：`(<abbrev-hash>)`
- 同类且主题相似的多个提交合并为 1-2 句自然语言
- 追加到 `CHANGELOG.md` 已有内容**前面**
- 如果 `CHANGELOG.md` 不存在则新建
- breaking changes 在文件最顶部突出显示

### Step 5: 更新版本号

将所有 `package.json` 的 `version` 更新为确认后的版本号：

| 文件 | 操作 |
|------|------|
| `package.json`（根） | `version` 字段写入确认后的版本号 |
| `packages/*/package.json` | `version` 字段同步更新 |

### Step 6: 构建

```bash
pnpm build
```

- **退出码 0（成功）** → 继续
- **退出码非 0（失败）** → 中止流程，展示构建错误信息。版本号变更尚未 commit，不受影响

> **注意：** 构建在 commit 之前执行。如果构建失败，不会产生任何 git 提交。

### Step 7: Release Commit + Tag

```bash
git add .
git commit -m "RELEASING: Releasing v{version}"
git tag v{version}
```

**Commit Message 格式：** `RELEASING: Releasing v{version}`

### Step 8: npm Publish ⚡ 门禁 #2

展示发布摘要后等待用户确认：

```
📦 即将发布:
   包: @deepstorm/cli
   版本: v0.2.0
   标签: latest

   确认发布? (y/N)
```

流程：

> **先决条件：** 该项目 npm 认证通过 `.env` 中的 `NPM_TOKEN` 环境变量注入 `.npmrc`。沙箱（sandbox）默认无法读取环境变量，
> 以下步骤需要关闭沙箱（`dangerouslyDisableSandbox: true`）或在命令中显式传递 token。

1. **获取 NPM_TOKEN：** 从 `.env` 读取 token：
   ```bash
   grep NPM_TOKEN .env | cut -d'=' -f2-
   ```
   如果 .env 不存在或没有 NPM_TOKEN，提示用户先配置。

2. **跳过重复构建：** Step 6 已执行过 `pnpm build`，使用 `--ignore-scripts` 避免 `prepublishOnly`/`prepack` 重复构建：
   ```bash
   cd packages/cli && npm publish --ignore-scripts --cache "$TMPDIR/npm-cache" --//registry.npmjs.org/:_authToken="$TOKEN"
   ```
   - `--ignore-scripts`：跳过 lifecycle scripts（prepublishOnly / prepack），否则会额外构建两次
   - `--cache $TMPDIR/npm-cache`：避免 `~/.npm/_cacache` 的 EPERM 权限问题
   - `--//registry.npmjs.org/:_authToken=...`：内联传递 token，绕过沙箱 env 限制

3. **用户确认：** 输入 y/Y 才继续。发布时如果用户需要先登录，告知用户运行 `npm login`

4. **git push：** 推送 commit 和 tag 到远程

> **Pre-release 版本：** 使用 `--tag next` 替代 `--tag latest`，如 `0.2.0-beta.1`。用户确认发布时应在摘要中体现标签变化。

**跳过私有包：** `"private": true` 的包不会发布。

### Step 9: 完成摘要

```
✅ 发布完成

   版本: v0.1.2 → v0.2.0
   Tag: v0.2.0
   发布 @deepstorm/cli@0.2.0 ✅
   CHANGELOG 已更新

   验证: npm view @deepstorm/cli
```

## 命令速查

| 操作 | 命令 |
|------|------|
| 当前版本 | `cat package.json \| jq -r .version` |
| 最新 tag | `git describe --tags --abbrev=0` |
| 提交历史 | `git log --oneline <tag>..HEAD` |
| 构建 | `pnpm build` |
| 发布 | `cd packages/cli && npm publish --ignore-scripts --cache "\$TMPDIR/npm-cache" --//registry.npmjs.org/:_authToken="\$TOKEN"`（正式）或加 `--tag next`（pre-release） |
| 获取 NPM_TOKEN | `grep NPM_TOKEN .env \| cut -d'=' -f2-` |
| 验证 npm 登录 | `npm whoami`（可能因 token 认证方式不工作） |
| 推送 | `git push origin main --tags` |

## 常见错误

| 错误 | 处理方式 |
|------|---------|
| **工作区有脏文件** | Step 1 检查并中断。提示用户先 `git stash` 或提交当前工作 |
| **构建失败** | Step 6 检查退出码。中止流程，不产生 commit，提示用户修复 |
| **NPM_TOKEN 环境变量未设置** | Step 8 先 `grep NPM_TOKEN .env` 检查 token；若无 `.env` 文件或 token 为空，通知用户配置 |
| **npm publish 重复构建（prepublishOnly + prepack 触发两次 build）** | Step 6 已构建过，Step 8 必须使用 `--ignore-scripts` 跳过 lifecycle scripts |
| **缓存 EPERM（~/.npm/_cacache 被 root 占用）** | 使用 `--cache "$TMPDIR/npm-cache"` 指定临时缓存目录，而不是 `npm cache clean --force`（`sudo chown` 在沙箱中不可用） |
| **沙箱无环境变量（sandbox 隔离）** | Step 8 需要使用 `dangerouslyDisableSandbox: true` 或内联传递 token（`--//registry.npmjs.org/:_authToken=...`） |
| **git push 失败** | Step 8 提示用户手动 `git push origin main --tags` |
| **npm publish 失败（认证错误）** | 版本已 commit + tag，提示用户 `cd packages/cli && NPM_TOKEN=$(grep NPM_TOKEN .env \| cut -d'=' -f2-) npm publish --ignore-scripts` |
| **用户取消发布** | 版本变更和 CHANGELOG 已写入但未 publish。提示后续手动 publish 或 git push |
