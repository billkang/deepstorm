---
name: deepstorm-mcp-figma-read
description: Use when you need to read Figma design data — get file info, read node tree, get components and styles, export images. References design_tools domain in the capability mapping.
---

# Figma 设计稿读取操作指南

本指南说明如何通过 Figma MCP 读取设计稿数据。使用前请确保 `.env` 中已配置 `DEEPSTORM_FIGMA_TOKEN`。

> **领域能力：** `design_tools` — 设计工具
> **服务标识：** `figma`

---

## 环境要求

- `.env` 文件须包含 `DEEPSTORM_FIGMA_TOKEN=your_token`
- Token 从 Figma > Settings > Personal Access Tokens 生成

---

## 运行时能力确认

操作前先确认 Figma MCP 是否可用：

```
检查 `.claude/settings.json` → `deepstorm.mcpCapabilities` 中 design_tools.available === true
```

---

## 设计链接识别

### 从 Issue Design 字段获取（推荐）

从 Issue MCP 返回的数据中查找设计相关字段（如 Jira 的 `customfield_10032`），提取其中的 URL。

从 URL 中提取：

| 参数 | 说明 |
|------|------|
| `fileKey` | 文件标识，从 URL path 获取 |
| `nodeId` | 节点标识，从 URL query（`node-id` 参数）获取 |

### 从 Issue 描述回退

Design 字段不存在或为空时，回退到 Issue 描述中正则匹配设计工具链接。

---

## 常用操作

### 文件操作

| 操作 | 说明 |
|------|------|
| 获取文件信息 | 获取元数据：名称、版本、最后修改时间 |
| 读取文件内容 | 获取完整节点树结构 |
| 获取节点 | 获取指定节点的详细信息和样式属性 |
| 获取图片 | 导出节点为 PNG/JPEG/SVG |
| 获取文件版本 | 文件历史版本列表 |

### 组件和样式

| 操作 | 说明 |
|------|------|
| 获取本地组件 | 文件中所有本地组件及其属性 |
| 获取团队组件 | 团队组件库中的组件 |
| 获取样式 | TextStyle、ColorStyle、EffectStyle |

---

## 设计数据分析

设计数据获取后，可派遣子代理进行分析：

1. 保存原始 JSON 到 `openspec/changes/{change}/design-data/raw-{slug}.json`
2. 如有图片资源则下载到 `openspec/changes/{change}/design-assets/`
3. 子代理输出结构化摘要：布局结构、关键 UI 元素、交互流程、响应式信息

---

## 降级处理

`design_tools.available === false` 时：
1. 告知用户未检测到设计工具服务
2. 跳过设计稿获取
3. 不影响其他工作流

---

## 常见错误

| 错误 | 原因 | 处理 |
|------|------|------|
| `Invalid token` | Token 无效或过期 | 在 Figma 设置中重新生成 |
| `File not found` | 链接错误或无访问权限 | 确认 URL 正确，检查分享权限 |
| `Node not found` | Node ID 错误 | 确认节点 ID 存在于当前文件版本 |
