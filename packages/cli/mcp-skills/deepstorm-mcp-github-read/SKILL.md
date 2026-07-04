---
name: deepstorm-mcp-github-read
description: Use when you need to read GitHub data — browse repository files, list branches, search code, view Issues and Pull Requests. References code-hosting domain in the capability mapping.
---

# GitHub 读取操作指南

本指南说明如何通过 GitHub MCP 读取仓库数据。使用前请确保 `.env` 中已配置 `DEEPSTORM_GITHUB_TOKEN`。

> **领域能力：** `code-hosting` — 代码托管
> **服务标识：** `github`

---

## 环境要求

- `.env` 文件须包含 `DEEPSTORM_GITHUB_TOKEN=your_token`
- Token 从 https://github.com/settings/tokens 生成，至少需要 `repo` 和 `read:org` 权限
- 需要本地 Docker 环境

---

## 常用操作

### 仓库浏览

| 操作 | 说明 |
|------|------|
| 查看仓库详情 | 元信息：描述、语言、Star 数、License |
| 查看文件内容 | 指定路径的文件内容 |
| 列出分支 | 仓库所有分支列表 |

### 代码搜索

| 操作 | 说明 |
|------|------|
| 搜索代码 | 在仓库范围内搜索代码片段 |
| 搜索 Issue/PR | 按关键词、状态、作者搜索 |

### Issue 和 PR 查看

| 操作 | 说明 |
|------|------|
| 获取 PR 详情 | 描述、变更文件列表、评论、检查状态 |
| 获取 Issue 详情 | Issue 描述和全部评论 |
| 列出 Issue/PR | 按状态、标签、Assignee 筛选 |

---

## 降级处理

`code-hosting.available === false` 时，降级为使用 `gh` CLI 命令替代。

---

## 常见错误

| 错误 | 原因 | 处理 |
|------|------|------|
| `Resource not accessible` | Token 权限不足 | 检查 Token 的 scope |
| `Not Found` | 仓库不存在或无权限 | 确认仓库名和权限 |
| Docker 错误 | Docker 未启动 | 确认 Docker 正在运行 |
