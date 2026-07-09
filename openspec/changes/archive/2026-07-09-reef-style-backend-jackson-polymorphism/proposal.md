## Why

在 ChatBI 项目实践中，后端使用 enum + switch 分发图表类型的方式（`ChartType.METRIC_CARD` 等）存在新增类型时需要同时在 4 处同步修改的问题。通过引入 Jackson `@JsonTypeInfo` 多态序列化 + TypeScript Discriminated Union 模式，已成功消除枚举和对应 switch 分发。当前 reef-style-backend 的 Java 后端代码生成规范中缺少对这一模式的系统性指导，需要将其沉淀为可复用的编码规范文档，使后续生成的 Spring Boot 项目能开箱即用地采用这一模式。

## What Changes

- **新增**：在 reef-style-backend 的 `fragments/java/api-spec/` 下新增 `jackson-polymorphism.md` 编码规范文档
- **修改**：`quick-reference.md` 添加 DTO 多态序列化引用章节，链接到 `jackson-polymorphism.md`
- **修改**：`SKILL.md.tmpl` 的知识文件清单新增 `jackson-polymorphism.md`
- **修改**：`packages/cli/src/commands/setup.ts` 中 `copyFragmentsForSkill` 增加复制额外 `.md` 文件的逻辑（确保 `jackson-polymorphism.md` 被部署到技能输出目录）
- **覆盖范围**：
  - Java 端 `@JsonTypeInfo` + `@JsonSubTypes` 的定义和使用规范
  - 前后端 discriminator value 的同步约定
  - Checkstyle 兼容性处理（`@JsonProperty` 解耦字段名与 getter 名）
  - TypeScript 端 discriminated union 类型的定义规范
  - 模板（Angular `@switch`）中的类型分发模式
  - 判空安全与向后兼容指引
- **不包含**（Non-Goals）：
  - 不涉及 ChatBI 项目的代码修改（已独立完成）
  - 不引入新的 npm 包或依赖

## Capabilities

### New Capabilities
- `jackson-polymorphism`: Jackson 多态序列化 + TypeScript Discriminated Union 的编码规范，涵盖后端 Java `@JsonTypeInfo` 配置、前端 TS 定义、前后端 discriminator value 同步、Checkstyle 兼容等技术要点

### Modified Capabilities
（无 — 本次不修改现有 capability 的 requirement）

## Impact

- **`packages/reef/skills/reef-style-backend/`**：在 `fragments/java/api-spec/` 下新增规范文档
- **文档体系**：新增的编码规范可作为 reef-style-backend 代码生成时 Java API 设计的参考资料
- **无运行时影响**：纯文档变更，不涉及代码生成逻辑或运行时依赖

## 已有输入

本 proposal 的输入来自：
1. **ChatBI 项目实际重构经验** — `_bmad-output/brainstorming/brainstorming-session-20260709-001.md`
2. **已产出的规范文档草稿** — `packages/reef/skills/reef-style-backend/fragments/java/api-spec/jackson-polymorphism.md`（需按 spec 验证后完善）
