---
name: deepstorm-mcp-feishu-wiki-read
description: Use when you need to search and read Feishu wiki documents — search PRDs, read document content, extract requirement context. References knowledge_base domain in the capability mapping.
---

# 飞书知识库读取操作指南

本指南说明如何通过飞书知识库 MCP 搜索和读取文档内容。使用前请确保 `.env` 中已配置 `DEEPSTORM_FEISHU_TOKEN`。

> **领域能力：** `knowledge_base` — 知识管理
> **服务标识：** `feishu-wiki`

---

## 环境要求

- `.env` 文件须包含 `DEEPSTORM_FEISHU_TOKEN=your_token`
- Token 从飞书开放平台 > 应用凭证获取

---

## 常用操作

### 搜索文档

按关键词搜索飞书知识库文档，返回匹配的文档列表和摘要。

**示例场景：**
- 搜索 PRD 文档：搜索与当前 Issue 相关的需求文档
- 搜索技术方案：搜索关于特定功能的讨论文档

### 读取文档内容

获取指定文档的完整内容，支持 Markdown 格式输出。

**使用方式：**
- 从 Issue 描述中提取的文档链接
- 使用搜索结果的文档 ID

### 提取 PRD 上下文

读取到的文档内容中提取以下信息：

1. **需求背景和目标** — 为什么做、解决什么问题
2. **功能范围定义** — 做什么，不做什么
3. **验收标准** — 如何验证
4. **关键决策记录** — 重要的技术/产品决策及理由

---

## 降级处理

`knowledge_base.available === false` 时：
1. 告知用户未检测到知识库服务
2. 询问用户是否手动提供 PRD 内容

---

## 常见错误

| 错误 | 原因 | 处理 |
|------|------|------|
| Token 错误 | Token 未配置或无效 | 检查 `.env` 中 `DEEPSTORM_FEISHU_TOKEN` |
| 文档不存在 | 链接错误或已被删除 | 确认文档链接正确 |
| 无权限 | Token 无权访问该文档 | 确认机器人已被加入目标知识库 |
