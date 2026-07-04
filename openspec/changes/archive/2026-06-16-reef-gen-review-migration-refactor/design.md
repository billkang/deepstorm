## Context

reef 技能包当前有三种内容模式并存：

| 模式 | 技能 | 说明 |
|------|------|------|
| `.tmpl` + `variants/` + `fragments/` | `style-backend`, `style-frontend` | 完整的动态内容生成 |
| `.tmpl` only | `review` | 已模板化但内容过时 |
| 静态 `.md` | `gen-backend`, `gen-frontend`, `migrate` | 纯硬编码 |

渲染引擎已完成（`packages/cli/src/template/renderer.ts`），支持 Handlebars `{{var}}` 和 `{{#if}}`，以及 `copyVariants()` 和 `copyFragments()`。`build-registry.ts` 自动发现技能目录并复制到 `dist/`，`wizard.json` 控制模板渲染。

本次改造不引入新的架构模式，而是在现有架构上扩展覆盖范围。

## Goals / Non-Goals

**Goals:**
- `reef-gen-backend` 和 `reef-gen-frontend` 从静态 `.md` 改为 `.tmpl` + `variants/`，对齐 `reef-style-backend` 的模式
- `reef-review/SKILL.md.tmpl` 内容修复：agent 路径、Liquibase 硬编码、冗余代码
- `reef-migrate` 整包删除，其工作流合并为 `reef-gen-backend` 的数据库迁移条件块
- `wizard.json` 中对应的选项添加 `affectedTemplates` 引用

**Non-Goals:**
- 不改动渲染引擎（`renderer.ts`、`registry.ts`、`toNested`）
- 不改动 `build-registry.ts`
- 不改动设置向导流程（`setup.ts`）
- 不新增 wizard.json 配置维度或选项
- 不解决 `reef-gen-frontend` 设计数据获取章节的泛化问题（该章节已相对通用）

## Decisions

### D1: `.tmpl` + `variants/` 模式，不使用 `fragments/` 扩展

`reef-gen-backend` 和 `reef-gen-frontend` 的变体内容（编码步骤、命令、路径）放入 `variants/{value}/`，不拆出 `fragments/` 结构。

**原因：** 生成技能的变体内容是完整的步骤描述，不是一个可独立开关的维度。`fragments/` 适合 style 技能中"选择了某个维度的某个选项就增加一段参考文件"的场景。gen 技能中，语言变体是互斥的（Java OR Python，不可同时存在），用 `variants/` 自然表达。

**备选方案：** 使用 `fragments/` 做更细粒度的拆分。否决原因：过度工程化，当前只支持一个后端语言和一个前端框架，颗粒度太细无实际收益。

### D2: 数据库迁移作为 `reef-gen-backend` 的条件块，不保留独立技能

`reef-migrate/SKILL.md` 删除，其生成迁移的工作流（确定类型 → 生成 changeset ID → 生成文件 → 提醒代码变更）在 `reef-gen-backend/SKILL.md.tmpl` 中以 `{{#if reef.backend.java.dbMigration.styleRef}}` 条件块呈现。

**原因：**
- `reef-style-backend` 的 `fragments/java/db-migration/liquibase/` 已提供编码指导（quick-reference + 示例）
- 用户只需要在 gen-backend 中被提醒"你需要创建迁移文件，具体语法见 style-backend"
- 独立的 migrate 技能增加了技能列表的认知负荷
- 数据库迁移是 backend 代码生成的子步骤，不是独立流程

### D3: agent 路径使用安装后相对路径

所有 agent 引用路径从 `../reef/agents/*.md`（monorepo 路径）改为 `../../agents/*.md`（安装后路径）。

**原因：** 虽然 AI 实际通过 Agent tool 按名称调用代理（路径仅供 AI 阅读参考），但路径必须指向真实存在的文件，避免 AI 尝试 Read 时产生 404 错误。

**路径解析：**
```
安装前：packages/reef/skills/reef-review/SKILL.md.tmpl → packages/reef/agents/*.md
安装后：.claude/skills/reef-review/SKILL.md → .claude/agents/*.md
正确相对路径：../../agents/reef-review-backend.md
```

### D4: 不修改 `wizard.json` 的维度结构

gen-backend 和 gen-frontend 使用已有的 `configKey` 和 `affectedTemplates` 机制。

**变化：**
- Java 选项追加 `"skills/reef-gen-backend/SKILL.md.tmpl"` 到 `affectedTemplates`
- Angular 选项追加 `"skills/reef-gen-frontend/SKILL.md.tmpl"` 到 `affectedTemplates`

**原因：** 不需要为 gen 技能新增维度。用户的语言/框架选择已通过 `reef.backend.language` 和 `reef.frontend.framework` 确定，gen 技能只需共享这些配置。

### D5: `{{#if}}` 用于条件包含，不引入新模板语法

语言特有的内容通过 `variants/{value}/` 目录复制实现，`.tmpl` 中不做多值分支。

**模式：**
```handlebars
### 3. 编写代码

{{#if reef.backend.language.sourcePath}}
阅读本技能目录下的 `steps.md` 了解编码步骤顺序和规范。
{{/if}}

{{#if reef.backend.java.dbMigration.styleRef}}
### 4. 数据库迁移
...
{{/if}}

### 5. 运行验证
构建命令：`{{reef.backend.language.buildTool}}`
源文件路径：`{{reef.backend.language.sourcePath}}`
```

**原因：** 引擎不支持 `{{#if (eq a b)}}`。单语言状态下条件判断足够。

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| `reef-gen-backend` 和 `reef-gen-frontend` 已安装用户不会自动重新渲染 | 已安装用户继续使用旧版本 | 用户在 `setup --reconfigure` 或 template upgrade 时重新渲染 |
| `reef-migrate` 删除后已有用户手动静默丢失 | 升级后迁移技能消失 | 在归档指南中说明，gen-backend 的条件块已覆盖迁移指导 |
| agent 路径虽已修复，但 AI 可能仍尝试 `Read` 路径 | Read 报错影响体验 | 在路径旁添加注释说明 agent 按名称调用，路径仅供查阅 |
| 渲染后的内容长度可能因 `{{#if}}` 条件块而大幅变化 | 不同语言用户的技能内容量不一致 | 这符合预期——空选项自然不生成内容 |

## Open Questions

- （无）
