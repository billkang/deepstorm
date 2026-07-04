---
name: deepstorm-mcp-feishu-wiki-write
description: Use when you need to create or update Feishu wiki documents — push PRD, update document content. References knowledge_base domain in the capability mapping.
---

# 飞书知识库写入操作指南

本指南说明如何通过飞书知识库 MCP 创建和更新文档。使用前请确保 `.env` 中已配置 `DEEPSTORM_FEISHU_TOKEN`。

> **领域能力：** `knowledge_base` — 知识管理
> **服务标识：** `feishu-wiki`

---

## 环境要求

- `.env` 文件须包含 `DEEPSTORM_FEISHU_TOKEN=your_token`
- Token 从飞书开放平台 > 应用凭证获取

---

## 常用操作

### 创建文档

在指定知识库或目录下创建新文档，需提供：
- 标题
- 正文（Markdown 格式）
- 目标知识库或目录

**典型场景：** 将 PRD 推送到知识库，方便团队查阅。

### 更新文档

修改已有文档的内容。

---

## 多 Provider 选择

| 场景 | 处理方式 |
|------|---------|
| 唯一 provider | 自动推送，无需用户选择 |
| 多个 provider | 展示可用列表，用户选择后持久化 |

---

## 降级处理

`knowledge_base.available === false` 时：
1. 跳过知识库写入操作
2. 在 checklist 中记录为 skipped
3. 告知用户未检测到知识库服务，跳过 PRD 推送

---

## 常见错误

| 错误 | 原因 | 处理 |
|------|------|------|
| Token 错误 | Token 未配置或无效 | 检查 `.env` |
| 文档不存在 | 链接错误或已被删除 | 确认目标文档存在 |
| 无权限 | Token 无权操作该文档 | 确认机器人权限 |
