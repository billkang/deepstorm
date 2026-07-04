---
name: deepstorm-mcp-github-write
description: Use when you need to write to GitHub — create/update Issues, create Pull Requests, submit comments, create/update files. References code-hosting domain in the capability mapping.
---

# GitHub 写入操作指南

本指南说明如何通过 GitHub MCP 创建和修改仓库内容。使用前请确保 `.env` 中已配置 `DEEPSTORM_GITHUB_TOKEN`。

> **领域能力：** `code-hosting` — 代码托管
> **服务标识：** `github`

---

## 环境要求

- `.env` 文件须包含 `DEEPSTORM_GITHUB_TOKEN=your_token`
- Token 从 https://github.com/settings/tokens 生成，至少需要 `repo` 权限

---

## 常用操作

### Issue 管理

| 操作 | 说明 |
|------|------|
| 创建 Issue | 附带标题、描述、标签、Assignee |
| 更新 Issue | 修改标题、描述、标签、状态 |
| 关闭/重新打开 | 管理 Issue 生命周期 |
| 添加评论 | 在 Issue 上回复 |

### Pull Request

| 操作 | 说明 |
|------|------|
| 创建 PR | 指定源/目标分支、标题、描述，支持 Draft PR |
| 更新 PR 描述 | 修改 PR 描述 |
| 合并 PR | merge/squash/rebase |
| 添加 Review Comment | 在 PR 上提交 Review 评论 |

### 文件操作

| 操作 | 说明 |
|------|------|
| 创建文件 | 在指定路径创建新文件 |
| 更新文件 | 修改已有文件内容 |

---

## 降级处理

`code-hosting.available === false` 时，降级为使用 `gh` CLI 命令替代。

---

## 常见错误

| 错误 | 原因 | 处理 |
|------|------|------|
| `Resource not accessible` | Token 权限不足 | 检查 Token 的 scope 配置 |
| `Not Found` | 仓库不存在或无权限 | 确认仓库名和权限 |
| `Conflict` | 合并冲突/分支已存在 | 先解决冲突或检查分支状态 |
