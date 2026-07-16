---
name: deepstorm-mcp-playwright-read
description: Use when you need to perform browser automation — navigate pages, click elements, fill forms, extract content, take screenshots. References e2e-testing domain in the capability mapping.
---

# Playwright MCP 浏览器操作指南

本指南说明如何通过 Playwright MCP 操作浏览器执行 E2E 测试步骤。使用前请确保 DeepStorm 安装时已选择 Playwright MCP 服务，连接地址已硬编码在 `.mcp.json` 中（默认 `http://localhost:54321/sse`）。

> **领域能力：** `browser-automation` — 端到端测试
> **服务标识：** `playwright`

---

## 环境要求

- Playwright MCP 连接地址已硬编码在 `.mcp.json` 的 `deepstorm-playwright` 服务中（默认 `http://localhost:54321/sse`）
- 确保 Playwright MCP 进程已在本地运行（默认端口 54321）

---

## 运行时能力确认

操作前先确认 Playwright MCP 是否可用：

```
检查 `.deepstorm/settings.json` → `mcpCapabilities` 中 browser-automation.available === true（providers 包含 playwright）
```

---

## 常用操作

### 页面导航

```text
使用 Playwright MCP 的 navigate 工具，传入目标 URL
```

### 元素交互

| 操作 | 工具 | 参数 |
|------|------|------|
| 点击 | click | selector（CSS 选择器） |
| 填写 | fill | selector + value |
| 选择 | selectOption | selector + value |
| 悬停 | hover | selector |

### 内容提取

```text
使用 evaluate 或 textContent 工具，通过选择器提取页面文本内容
```

### 截图

```text
使用 screenshot 工具，可指定全页截图或视口截图
```

---

## 降级处理

`browser-automation.available === false` 时：

1. 告知用户未检测到浏览器自动化服务
2. 提示用户运行 `deepstorm setup` 并选择 Playwright MCP
3. 或手动配置 `.mcp.json` 中的 `deepstorm-playwright` 服务

---

## 常见错误

| 错误 | 原因 | 处理 |
|------|------|------|
| `Connection refused` | Playwright MCP 未启动 | 检查 `.mcp.json` 中 `deepstorm-playwright` 的 `url` 配置，启动 Playwright MCP 服务 |
| `Element not found` | 选择器不匹配 | 使用浏览器 DevTools 检查正确选择器 |
| `Timeout` | 页面加载慢 | 增加等待时间或使用 waitForSelector |
