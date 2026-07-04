## 1. Changeset 清理

- [x] 1.1 删除 `.changeset/` 目录及其全部内容
- [x] 1.2 从根 `package.json` 移除 `changeset` devDependency
- [x] 1.3 从根 `package.json` 移除 `changeset`、`version`、`release`、`release:publish` 四个 scripts
- [x] 1.4 从 `packages/cli/package.json` 移除 `changeset` 依赖
- [x] 1.5 删除 `packages/cli/scripts/release.mjs` 文件
- [x] 1.6 全局搜索代码和文档中对 `changeset` 的引用，确认无残留

## 2. 创建 SKILL.md

- [x] 2.1 创建 `.claude/skills/deepstorm-release/` 目录
- [x] 2.2 编写 SKILL.md — 流程总览和工作区检查步骤（Step 1: git status + 最新 tag + 当前版本号）
- [x] 2.3 编写 Step 2 — AI 分析 git 提交历史并建议版本号（git log 读取、Conventional Commits 分析、变更摘要展示）
- [x] 2.4 编写 Step 3 — 版本号确认门禁（用户确认或手动输入覆盖）
- [x] 2.5 编写 Step 4 — CHANGELOG 按类型分类生成并追加到已有文件
- [x] 2.6 编写 Step 5 — 更新版本号到各 package.json
- [x] 2.7 编写 Step 6 — 执行构建并检查结果
- [x] 2.8 编写 Step 7 — 创建 release commit + git tag
- [x] 2.9 编写 Step 8 — npm 登录验证 + 发布前确认门禁 + npm publish + git push
- [x] 2.10 编写 Step 9 — 完成提示和发布摘要展示

## 3. Skill 注册与验证

- [x] 3.1 registry.json 不需要注册——`.claude/skills/` 下的技能被 Claude Code 自动发现
- [x] 3.2 确认 —— `/deepstorm-release` 已出现在 Claude Code 可用技能列表中 ✅
- [x] 3.3 dry-run 测试 —— Step 1（脏工作区检测）确认通过 ✅
