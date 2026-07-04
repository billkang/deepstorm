---
type: brainstorming-session
date: 2026-07-01
session: "tide-20260701-001"
participants: [user, claude]
topic: "Reef 套件 AI 相关能力增强"
status: draft
---

# Reef 套件 AI 相关能力增强 — 需求讨论

## 背景

Reef 是 DeepStorm 开发侧套件，提供规范生成、代码审查、Git 工作流等能力。当前 Reef 已有：
- `reef-review-backend.md` — 后端代码审查 Checklist，包含 Checkstyle 合规检查
- `reef-style-backend/variants/java/ai/spring-ai/quick-reference.md` — Spring AI 快速参考

但这两个文件在 AI 相关审查点和配置示例上还有不足，需要进行增强。

## 讨论内容

### 需求 1：增强 reef-review-backend.md 的 Spring AI 审查项

**现状：** 当前 Checklist 中没有 Spring AI / DeepSeek 相关的审查点。

**需要增加的审查项：**
- 🟡 AI 工具方法（@Tool）缺少 description 描述
- 🟡 AI 调用缺少 try-catch 异常处理或降级逻辑
- 🟡 API Key 硬编码在代码中而非通过 `${}` 环境变量引用
- 🟡 ChatClient 通过 `new` 直接创建而非 DI 注入
- 🟡 Structured Output 使用 class 而非 record
- 🟢 AI 调用日志记录了输入输出（便于调试审计）
- 🟢 Tool 返回值类型明确，避免 Object 或泛型丢失类型信息

### 需求 2：补充 spring-ai/quick-reference.md 的 DeepSeek 配置

**现状：** 当前配置示例是 OpenAI 格式，而项目实际使用 DeepSeek（通过 `spring-ai-starter-model-deepseek`）。

**需要补充：**
- DeepSeek 的 application.yml 配置示例
- DeepSeek Chat API 调用示例（ChatClient 用法）
- DeepSeek 模型选择说明

### 不纳入范围

- BI 查询逻辑、DataEase 集成、意图解析等当前项目特有的审查点 → 留在 AI 项目本地 `.claude/agents/`
- Liquibase 迁移生成 skill → 不是本次讨论范围
- 数据库 MCP 连接指南 → 不是本次讨论范围
- NG-ZORRO 前端 UI 库支持 → 不是本次讨论范围

## 结论

两个需求都在 Reef 套件范围内，走 DeepStorm Flow：
1. `/opsx:new reef-ai-enhance` → 创建变更
2. proposal → specs → design → tasks
3. 检查 superpowers → TDD apply → verify → archive

## 影响的文件

| 文件 | 操作 |
|------|------|
| `packages/reef/skills/reef-review-backend/reef-review-backend.md` | 修改 — 增加 Spring AI 审查项 |
| `packages/reef/skills/reef-style-backend/variants/java/ai/spring-ai/quick-reference.md` | 修改 — 补充 DeepSeek 配置示例 |
