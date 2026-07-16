---
name: deepstorm-mcp-jira-read
description: Use when you need to read Jira Issue data — get issue details, search issues, extract custom fields. References issue_tracker domain in the capability mapping.
---

# Jira Issue 读取操作指南

本指南说明如何通过 Jira MCP 读取 Issue 数据。使用前请确保 `.env` 中已配置 `DEEPSTORM_JIRA_TOKEN`。

> **领域能力：** `issue_tracker` — 项目管理
> **服务标识：** `jira`

---

## 环境要求

- `.env` 文件须包含 `DEEPSTORM_JIRA_TOKEN=your_token`
- Token 从 https://id.atlassian.com/manage/api-tokens 生成

---

## 运行时能力确认

操作前先确认 Jira MCP 是否可用：

```
检查 `.deepstorm/settings.json` → `mcpCapabilities` 中 issue_tracker.available === true（providers 包含 jira）
```

---

## 常用操作

### 解析 Issue 标识

| 输入格式 | 示例 | 提取方式 |
|---------|------|---------|
| 完整 URL | `https://<instance>.atlassian.net/browse/LC-1234` | 从 URL path 提取 `LC-1234` |
| 完整编号 | `LC-1234` | 直接使用 |
| 纯数字 | `1234` | 需结合项目前缀 |

### 获取 Issue 详情

调用 Jira MCP 的获取 Issue 工具，传入解析后的 Issue Key。

**提取的元数据结构：**

```json
{
  "key": "LC-1234",
  "title": "Issue 摘要",
  "url": "https://<instance>.atlassian.net/browse/LC-1234",
  "type": "Story",
  "status": "In Progress",
  "description": "Issue 描述正文"
}
```

### 提取自定义字段

从返回数据中查找设计工具关联字段（如 `customfield_10032`），提取其中的 Figma/Figma 链接。

---

## 降级处理

`issue_tracker.available === false` 时：

1. 告知用户未检测到 Issue 跟踪服务
2. 请求用户手动粘贴 Issue 摘要和描述
3. 从用户提供的信息提取所需元数据

---

## 常见错误

| 错误 | 原因 | 处理 |
|------|------|------|
| `Authentication failed` | Token 无效 | 检查 `.env` 中 `DEEPSTORM_JIRA_TOKEN` |
| `Issue not found` | Key 错误或无权限 | 确认 Key 正确，检查项目访问权限 |
