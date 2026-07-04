## Context

Reef 套件提供后端代码审查（`reef-review-backend.md`）和后端框架参考（`reef-style-backend/variants/java/`）。当前这两个文件缺乏对 Spring AI / DeepSeek 的支持：

- 审查 Checklist 涵盖 Spring Boot、Hibernate 等规范，但没有 AI 相关的审查项
- Spring AI 快速参考只提供了 OpenAI 的配置示例，而项目实际使用 DeepSeek

两个修改都是纯内容新增，不需要新模块、新依赖或架构变更。

## Goals / Non-Goals

**Goals:**
- 在 reef-review-backend.md 的 Checklist 中增加 Spring AI 相关审查项（🟡 必须 + 🟢 建议）
- 在 spring-ai/quick-reference.md 中补充 DeepSeek 配置示例和 ChatClient 用法

**Non-Goals:**
- 不创建新的 skill 或 agent（审查项内嵌到现有 Checklist 中）
- 不修改已有的 OpenAI 配置示例
- 不涉及前端 AI 相关审查（Angular 侧没有 AI 审查需求）

## Decisions

| 决策 | 方案 | 备选 | 理由 |
|------|------|------|------|
| 审查项位置 | 内嵌到现有 reef-review-backend.md 的 Checklist 末尾 | 创建独立的 reef-review-ai.md | 审查项数量少（7 条），独立文件反而增加查找成本。紧跟现有 Checklist 结构一致 |
| DeepSeek 文档位置 | 在 quick-reference.md 新增 "## DeepSeek" 章节 | 创建独立的 deepseek-reference.md | quick-reference.md 本身就是 Spring AI 的聚合参考，DeepSeek 作为其中的模型供应商章节与其定位一致 |
| 审查项标记颜色 | 沿用现有红绿灯体系：🟡 必须 + 🟢 建议 | 统一为 must/should | 保持与现有 Checklist 一致的视觉风格 |

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| DeepSeek 配置可能随 Spring AI 版本变更而过时 | quick-reference.md 本身是有版本号的参考文档，随版本更新同步维护 |
| 审查项过多导致 Checklist 臃肿 | 只增加 AI 最核心的 7 条，避免过度覆盖。后续可根据反馈增减 |
