## Context

`@deepstorm/cli` 目前有 `setup`、`update`、`doctor`、`config`、`template`、`plugin`、`release` 等命令，均使用 `commander.js` 注册，交互式问答复用 `@clack/prompts` 和 `wizard-flow.ts`。现有的模板渲染引擎基于 Handlebars（`.tmpl` 文件），在 `template-engine.ts` 中实现。

本次新增的 `init` 命令需要一套新的「项目脚手架模板」，与现有的「skill/agent/hook 模板」分离。前者产出用户的应用代码，后者产出 `.claude/` 插件配置。

## Goals / Non-Goals

**Goals:**
- 新增 `deepstorm init` 子命令，支持交互式和参数式两种模式
- 内置前端（Angular）和后端（Java Spring Boot + Gradle）项目模板
- 模板使用 Handlebars 渲染，与现有渲染引擎保持一致
- 生成的项目可直接运行（安装依赖、启动 dev server）
- 复用 `@clack/prompts` 实现交互式问答

**Non-Goals:**
- 不安装 DeepStorm 插件（`setup` 职责）
- 不涉及 `.claude/`、`.mcp.json` 等 DeepStorm 自身配置
- 不实现项目运行期能力（dev/deploy）
- 不覆盖 monorepo 或微服务架构的项目结构
- 不支持 pnpm workspace / lerna 等 monorepo 管理工具
- 首批仅支持 Angular + Java，后续根据需求扩展框架支持

## Decisions

### Decision 1: 命令注册方式

**选择：** 使用 `commander.js` 注册 `init` 子命令，与其他命令一致。

**备选方案：**
- 独立脚本入口 — 放弃。增加维护成本，用户心智负担高。

**理由：** 与现有 CLI 框架一致，用户可通过 `deepstorm --help` 发现该命令。

### Decision 2: 模板存放位置

**选择：** 内嵌在 `init.ts` 的 `renderAngularTemplate()`、`renderJavaTemplate()`、`renderCommonFiles()` 函数中，不依赖独立的模板目录或 `.tmpl` 文件。

**备选方案：**
- `packages/cli/src/templates/init/` 独立目录 — 放弃。多条件渲染（PrimeNG/Tailwind/Hibernate/Liquibase/Spring AI 的组合）导致 Handlebars 模板中的条件分支过于复杂，不如 TypeScript 内联模板直观。
- 放在 `packages/reef/` 下 — 放弃。Reef 是开发套件，`init` 是 CLI 命令，CLI 的模板应属 CLI 自身。
- 从远程 CDN 下载 — 放弃。增加网络依赖和版本一致性问题。

**理由：** 内置在 `init.ts` 中保证离线可用、版本与 CLI 锁死。TypeScript 内联模板的类型安全性和条件分支可读性优于 Handlebars 模板引擎。项目脚手架模板对条件渲染的需求（5 个条件选项 → 32 种组合）远超 skill/agent 模板，内联方案更易维护。

### Decision 3: 模板引擎

**选择：** 使用 TypeScript 内联模板（`writeTemplate()` 函数），不引入 Handlebars。

**备选方案：**
- Handlebars（复用 `template-engine.ts` + `.tmpl` 文件）— 放弃。项目脚手架有 5 个条件选项（PrimeNG、Tailwind、Hibernate、Liquibase、Spring AI），Handlebars 的 `{{#if}}` 嵌套导致模板可读性差。
- EJS — 放弃。引入新依赖，且 TypeScript 内联模板已满足所有需求。
- 直接 cp 静态文件 — 放弃。需要变量替换和条件渲染能力。

**理由：** 项目脚手架的条件渲染复杂度远超 skill/agent 模板（5 个选项 → 32 种条件组合），TypeScript 的 `if` 语句 + 模板字符串的写法和调试体验优于 Handlebars 的条件语法。`writeTemplate()` 作为轻量辅助函数，无需引入模板引擎依赖。

### Decision 4: 交互式问答

**选择：** 复用 `@clack/prompts`，使用 `wizard-flow.ts` 的 `dependsOn` 条件逻辑，但不经 `wizard.json` — init 的问答流程是固定的，直接写在 `init.ts` 中。

**备选方案：**
- 走 `wizard.json` 配置驱动 — 放弃。init 的选项与 reef 的 wizard 相似但不相同（如不需要 `reef.formatter`），混用会导致维护困惑。

**理由：** 固定问答逻辑更清晰，避免 wizard.json 膨胀。options 定义为一个独立的 interface 供命令解析和问答共用。

### Decision 5: 目录结构布局

**选择：** 参照 chatbi 项目的单一根目录结构 — Angular 放在 `src/main/web/`，Java 放在 `src/main/java/`，不分离为 `frontend/` + `backend/`。

**备选方案：**
- 独立 `frontend/` + `backend/` 目录 — 放弃。与 chatbi 结构不一致，增加用户切换项目的认知成本。

**理由：** chatbi 是用户生产环境验证过的项目结构，跟随该模式减少后续适配工作。`angular.json` 的 `sourceRoot` 指向 `src/main/web` 即可实现。

### Decision 6: Java 构建工具

**选择：** 使用 Gradle (Kotlin DSL)，与 chatbi 一致。

**备选方案：**
- Maven — 放弃。Gradle Kotlin DSL 在现代 Spring Boot 项目中更常见，且 chatbi 使用 Gradle。

**理由：** Gradle 的 Kotlin DSL 提供更好的 IDE 支持和构建性能。如果需要 Maven 模板可后续扩展。

### Decision 7: 变量命名约定

**选择：** 使用 TypeScript `TemplateContext` 接口定义变量，通过 `buildContext()` 函数从 `InitOptions` 构建：

| 变量 | 类型 | 来源 | 示例值 |
|------|------|------|--------|
| `projectName` | string | 用户输入 | `my-app` |
| `packageName` | string | 从 projectName 推导（去符号小写） | `myapp` |
| `groupId` | string | 默认值 | `com.example` |
| `frontend` | string/false | 用户选择 | `angular` |
| `backend` | string/false | 用户选择 | `java` |
| `uiLib` | string/false | 用户选择 | `primeng` |
| `cssFramework` | string/false | 用户选择 | `tailwind` |
| `orm` | string/false | 用户选择 | `hibernate` |

**理由：** 属性值为 `false` 表示该功能未选择，在模板中以 `ctx.orm === 'hibernate'` 判断。避免 Handlebars 的条件语法，利用 TypeScript 的类型检查和 IDE 自动补全。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 模板版本与 Angular / Spring Boot 官方最新版本不同步 | 每个大版本迭代时同步更新模板内容，跟随 `reef/wizard.json` 的框架版本 |
| chatbi 的项目结构有特定偏好（如 `src/main/web/` 是非标准 Angular 布局） | 首批按该结构定型，后续可根据用户反馈支持其他布局选项 |

## Open Questions

- Java 模板的 groupId 应该交互式提问还是用默认值 `com.example`？
- 是否需要在 `init` 时一并初始化 Git 仓库（`git init`）？
