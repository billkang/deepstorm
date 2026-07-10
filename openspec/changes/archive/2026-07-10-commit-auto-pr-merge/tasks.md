## 1. 修改已有的推送步骤

- [x] 1.1 将步骤 10 从「仅在用户明确要求时」改为「commit 后自动推送」：删除可选的用户确认环节，使其成为流程的自动步骤
- [x] 1.2 新增 `--amend` 场景的分支逻辑：amend 后自动执行 `git push --force-with-lease`，跳过后面的 PR 流程
- [x] 1.3 增加 push 失败的错误处理提示

## 2. 新增 PR 创建与自动合并步骤

- [x] 2.1 新增步骤 11「创建 Pull Request」：使用 `gh pr create` 创建 PR，target branch 为 `main`，title 复用 commit title，body 包含 commit 正文和 OpenSpec 引用
- [x] 2.2 新增步骤 12「启用自动合并」：使用 `gh pr merge --auto --squash` 启用 auto-merge，告知用户 PR 链接
- [x] 2.3 增加 PR 创建失败（gh 未安装/未认证/已有 PR）的兜底处理逻辑

## 3. 更新工作流概览

- [x] 3.1 在文件头部差异表中同步更新 deepstorm-commit vs reef-commit 的差异点说明
- [x] 3.2 更新步骤编号说明，确保所有交叉引用正确
