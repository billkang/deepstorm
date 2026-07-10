## 1. 更新 SKILL.md — Release 分支 & PR

- [x] 1.1 在 deepstorm-release SKILL.md 中新增 Step 9：创建 release 分支 (`release/v{version}`)
- [x] 1.2 新增从 release 分支到 main 的 PR 自动创建逻辑（gh pr create）
- [x] 1.3 新增 PR auto-merge 逻辑（gh pr merge --auto --squash）
- [x] 1.4 Step 9 在 Step 8（npm publish + git push）成功之后执行
- [x] 1.5 处理分支已存在、API 失败等异常情况（跳过不阻断）

## 2. 更新 SKILL.md — GitHub Release

- [x] 2.1 在 deepstorm-release SKILL.md 中新增 Step 10：创建 GitHub Release
- [x] 2.2 Release 名称使用 `v{version}`，描述使用 CHANGELOG 内容
- [x] 2.3 处理已存在同名 Release 和 API 失败的情况（跳过不阻断）

## 3. 更新流程图

- [x] 3.1 更新 SKILL.md 中的 Mermaid 流程图，加入 Step 9 和 Step 10

## 4. 更新命令速查与常见错误

- [x] 4.1 在命令速查表中添加 gh release / gh pr 相关命令
- [x] 4.2 在常见错误章节添加 release 分支/PR/Release 相关错误处理说明
