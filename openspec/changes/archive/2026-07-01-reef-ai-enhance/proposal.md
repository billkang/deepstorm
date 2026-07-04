## Why

Reef 套件的后端代码审查 Checklist 和 Spring AI 快速参考目前缺乏 AI 相关的规范指导。项目实际使用 DeepSeek 模型（通过 `spring-ai-starter-model-deepseek`），但参考文档只有 OpenAI 示例；代码审查 Checklist 也没有 Spring AI / DeepSeek 的审查项，导致 AI 相关代码的质量检查仍然依赖人工经验。本次增强补齐这两个缺口。

## What Changes

- **修改** `packages/reef/skills/reef-review-backend/reef-review-backend.md` — 在 Checklist 中增加 Spring AI 相关审查项（🟡 必须 / 🟢 建议）
- **修改** `packages/reef/skills/reef-style-backend/variants/java/ai/spring-ai/quick-reference.md` — 补充 DeepSeek 配置示例和 ChatClient 用法

## Capabilities

### New Capabilities
- `ai-review-checklist`: Spring AI / DeepSeek 代码审查规范项，内嵌到 reef-review-backend 的 Checklist 中
- `deepseek-config-reference`: DeepSeek 接入的配置参考示例，补充到 spring-ai/quick-reference.md

### Modified Capabilities
<!-- 无 spec 级别行为变更 -->

## Impact

- `packages/reef/skills/reef-review-backend/reef-review-backend.md` — Checklist 新增条目，不影响既有审查项
- `packages/reef/skills/reef-style-backend/variants/java/ai/spring-ai/quick-reference.md` — 新增 DeepSeek 章节，不影响 OpenAI 已有内容
