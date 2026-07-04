---
name: deepstorm-mcp-jira-write
description: Use when you need to create, update, transition, or comment on Jira Issues. References issue_tracker domain in the capability mapping.
---

# Jira Issue 写入操作指南

本指南说明如何通过 Jira MCP 创建和修改 Issue。使用前请确保 `.env` 中已配置 `DEEPSTORM_JIRA_TOKEN`。

> **领域能力：** `issue_tracker` — 项目管理
> **服务标识：** `jira`

---

## 环境要求

- `.env` 文件须包含 `DEEPSTORM_JIRA_TOKEN=your_token`
- Token 从 https://id.atlassian.com/manage/api-tokens 生成

---

## 常用操作

### 创建 Issue

调用 Jira MCP 的创建 Issue 工具，需提供：

| 字段 | 说明 | 示例 |
|------|------|------|
| 项目 Key | 项目标识 | `PROJ` |
| Issue 类型 | Story/Task/Bug/Sub-task | `Task` |
| 摘要（Summary） | 标题 | `用户登录功能优化` |
| 描述（Description） | Markdown 正文 | 详细描述 |
| 父任务（可选） | Sub-task 的父级 | `PROJ-123` |

### 更新 Issue 字段

调用 Jira MCP 的更新 Issue 工具，可更新：摘要、描述、优先级、经办人、标签。

### 状态流转（Transition）

1. **先查询**：调用 Jira MCP 获取可用的 transitions 列表
2. **再流转**：选择目标 transition 执行

常见流转路径：`To Do → In Progress → In Review → Done`

### 添加评论

调用 Jira MCP 的添加评论工具，支持 Markdown 格式。

---

## 多 Provider 选择

当 `issue_tracker.available === true` 且有多个 provider 时，展示可用列表供用户选择。

---

## 降级处理

`issue_tracker.available === false` 时：
1. 跳过 Issue 创建/更新操作
2. 在 checklist 中记录为 skipped
3. 提示用户手动在 Jira 中操作

---

## 常见错误

| 错误 | 原因 | 处理 |
|------|------|------|
| `Authentication failed` | Token 无效 | 检查 `.env` |
| `Transition not allowed` | 该状态流转在当前工作流中不允许 | 先查询可用的 transitions 列表 |
| `Field not on screen` | Jira 项目配置限制 | 确认字段在 project workflow 中可见 |
