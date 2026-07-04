## Why

DeepStorm CLI 阶段 A 已实现脚手架和安装向导，但现有 skill 内容全部硬编码为特定技术栈（Angular + Spring Boot）。用户项目使用不同的前端框架或后端语言时，skill 规范不可用。需要建立配置感知机制：skill 在安装时根据用户选择的框架/语言，动态生成对应的技术栈内容，而非运行时分支。

选择 reef 作为试点，因为它的 code-style 场景最具代表性（前后端技术栈可选），同时验证模板引擎 + 变体文件选择的设计能否推广到 tide/sweep/atoll。

## What Changes

- 新增 CLI 模板渲染引擎（`src/template/`）：`{{var}}` 占位符替换 + `variants/` 目录文件级选择
- 新增 reef `wizard.json`：setup 向导询问前端框架和后端语言，选项内嵌 template data
- setup 流程改为 Way 1：选中工具 → 全装该工具下所有 skill/agent/hook → 对 config-aware 的做模板渲染 → 只复制选定语言的 variants 内容
- 删除 `engine/matcher.ts` + `engine/resolver.ts`（Way 1 不再使用）
- style-frontend / style-backend 拆分：SKILL.md → SKILL.md.tmpl，内容移入 `variants/{lang}/`
- review skill 改造：SKILL.md → SKILL.md.tmpl，文件路径和 agent 引用按配置值渲染
- review-frontend / review-backend agent 拆分：同 style-\*，变体文件化
- auto-format.sh 改造：拆为 variants/，与 skills/agents 一致
- 所有 11 个 reef SKILL.md 增加 `deepstorm: { tool: "reef" }` frontmatter 声明归属
- setup 流程补全：agent 和 hook 的安装逻辑（当前为 TODO）
- config set 增强：写配置后提示用户确认 → 重渲染受影响 skill/agent 模板 → 覆盖 .claude/ 下的对应文件
- build-registry 增强：支持 SKILL.md 和 SKILL.md.tmpl 双文件扫描，registry 加 hasTemplate 字段

**不做**：
- 不引入新技术栈内容（Angular/Java 保持现有一份，仅建立机制）
- 不改造 gen-backend / gen-frontend（等 style-\* 稳定后下一轮）
- 不改造 tide/sweep/atoll（后续阶段）

## Capabilities

### New Capabilities
- `template-engine`: CLI 模板渲染基础设施。支持 {{var}} 占位符替换 + variants/ 目录文件级选择。包含 renderer.js、registry（config key → 受影响模板映射）。所有 4 个套件共享，tide/sweep/atoll 后续直接复用。
- `reef-config-aware`: Reef 套件配置感知改造试点。包括 wizard.json、style-backend/style-frontend 变体化、review skill+agents 变体化、auto-format.sh 变体化、所有 skill 的 deepstorm 归属声明。

### Modified Capabilities
- (none)

## Impact

**CLI 引擎（7 改 + 3 增 + 2 删）**

| 操作 | 文件 | 说明 |
|------|------|------|
| 🗑 | `src/engine/matcher.ts` | 删除，Way 1 不再使用 |
| 🗑 | `src/engine/resolver.ts` | 连带删除 |
| 🗑 | `src/engine/__tests__/matcher.test.ts` | 删除 |
| 🗑 | `src/engine/__tests__/resolver.test.ts` | 删除 |
| ✏️ | `packages/cli/src/build-registry.ts` | SKILL.md / SKILL.md.tmpl 双文件扫描，hasTemplate 字段 |
| ✏️ | `src/types/registry.ts` | WizardOption 加 template/affectedTemplates，SkillEntry 加 hasTemplate |
| ✏️ | `src/commands/setup.ts` | Way 1 全装 + 模板渲染 + agent/hook 安装 pipeline |
| ✏️ | `src/commands/config.ts` | 接收 registry 参数 |
| ✏️ | `src/commands/config-set.ts` | 写配置 → 查受影响模板 → 确认 → 重渲染覆盖 |
| ✏️ | `src/wizard/guide.ts` | ResolvedSkill → string[] |
| ➕ | `src/template/renderer.ts` | 模板渲染核心 |
| ➕ | `src/template/registry.ts` | 模板匹配查询 |
| ➕ | `src/template/__tests__/renderer.test.ts` | |

**Reef 套件（6 改 + 2 增）**

| 操作 | 文件 | 说明 |
|------|------|------|
| ➕ | `packages/reef/wizard.json` | 前端框架 + 后端语言问卷，含 template data + affectedTemplates |
| ✏️ | `skills/reef-style-frontend/` | SKILL.md → SKILL.md.tmpl，内容移入 variants/angular/ |
| ✏️ | `skills/reef-style-backend/` | SKILL.md → SKILL.md.tmpl，内容移入 variants/java/ |
| ✏️ | `skills/reef-review/` | SKILL.md → SKILL.md.tmpl，文件路径变体化 |
| ✏️ | `agents/reef-review-frontend.md` | → .tmpl + variants/angular/ |
| ✏️ | `agents/reef-review-backend.md` | → .tmpl + variants/java/ |
| ✏️ | `hooks/reef-auto-format.sh` | → .tmpl + variants/java/（与 skills/agents 一致） |
| ✏️ | `skills/reef-{commit,pr,start,harden,migrate,review,gen-backend,gen-frontend,style-backend,style-frontend,testcase}` | 加 deepstorm: { tool: "reef" } frontmatter |

**依赖变更**
- `@deepstorm/cli`: 无新增 npm 依赖（{{var}} 替换用原生正则）
