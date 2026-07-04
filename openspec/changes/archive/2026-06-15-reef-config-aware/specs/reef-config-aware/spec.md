# Reef Config-Aware — Reef 套件配置感知改造

## ADDED Requirements

### Requirement: reef wizard.json 配置问卷

Reef 套件 SHALL 提供 `wizard.json`，在 `deepstorm setup` 时询问用户的前端框架和后端语言选择。问卷数据嵌入 `template` 和 `affectedTemplates` 字段以支持模板渲染。

wizard.json 的 questions SHALL 包含：
- `key: "reef.frontend.framework"` — 前端框架选择（`type: select`，选项含 `angular`）
- `key: "reef.backend.language"` — 后端语言选择（`type: select`，选项含 `java`）

每个选项 MUST 包含 `template` 对象和 `affectedTemplates` 数组。

#### Scenario: 交互模式下显示问卷
- **WHEN** 用户运行 `deepstorm setup` 并选择 reef 工具
- **THEN** 向导依次询问前端框架和后端语言，选项包含 Angular 和 Java

#### Scenario: 非交互模式下从 --set 参数读取配置
- **WHEN** 用户运行 `deepstorm setup --non-interactive --tools reef --set reef.frontend.framework=angular reef.backend.language=java`
- **THEN** 跳过交互问卷，直接使用传入的配置值

---

### Requirement: Way 1 安装流水线

`deepstorm setup` SHALL 采用 Way 1 安装逻辑：选中某工具后，将该工具下所有 skill/agent/hook 安装到 `.claude/`，配置感知型资产在安装时通过模板引擎渲染。

#### Scenario: 选中 reef 工具后安装所有 reef skill
- **WHEN** 用户选择 reef 并完成问卷
- **THEN** CLI 遍历 reef 所有 skill 目录，对无 .tmpl 的 skill 直接复制，对有 .tmpl 的 skill 执行模板渲染后再复制

#### Scenario: agent 安装模板渲染
- **WHEN** reef 的 agent 目录中存在 .md.tmpl 文件
- **THEN** 引擎对该 .md.tmpl 执行模板渲染后输出到 `.claude/agents/`

#### Scenario: hook 安装模板渲染
- **WHEN** reef 的 hooks 目录中存在 .sh.tmpl 文件
- **THEN** 引擎对该 .sh.tmpl 执行模板渲染后输出到 `.claude/hooks/`

#### Scenario: 无 .tmpl 的静态资产直接复制
- **WHEN** skill/agent/hook 目录中无 .tmpl 文件
- **THEN** 整目录直接复制，不做模板渲染

#### Scenario: 安装后 .claude/ 下无残余 .tmpl 文件
- **WHEN** 安装完成
- **THEN** `.claude/skills/`、`.claude/agents/`、`.claude/hooks/` 下不存在任何 `.tmpl` 文件

---

### Requirement: reef-style-frontend 模板化

`packages/reef/skills/reef-style-frontend/` SHALL 拆分为模板 + variants 结构：

```
reef-style-frontend/
├── SKILL.md.tmpl              ← 含 {{var}} 占位符
├── variants/
│   └── angular/               ← 现有 quick-reference.md + examples/ 移入
│       ├── quick-reference.md
│       └── examples/{...}.md
```

SKILL.md.tmpl 中 MUST 使用 `{{reef.frontend.framework.label}}` 等占位符替换框架名。

#### Scenario: 安装 Angular 时生成正确内容
- **WHEN** 用户配置 `reef.frontend.framework` 为 `angular`
- **THEN** 渲染后的 SKILL.md 中描述为"Angular 21 + TypeScript + Signal + PrimeNG + Tailwind"，`variants/angular/` 下的 quick-reference.md 和 examples/ 被复制到目标

#### Scenario: 渲染结果无模板语法残留
- **WHEN** 模板渲染完成
- **THEN** 输出的 SKILL.md 中不含 `{{` 或 `.tmpl` 标记

---

### Requirement: reef-style-backend 模板化

`packages/reef/skills/reef-style-backend/` SHALL 拆分为模板 + variants 结构：

```
reef-style-backend/
├── SKILL.md.tmpl              ← 含 {{var}} 占位符
├── variants/
│   └── java/                  ← 现有 quick-reference.md + examples/ 移入
│       ├── quick-reference.md
│       └── examples/{...}.md
```

#### Scenario: 安装 Java 时生成正确内容
- **WHEN** 用户配置 `reef.backend.language` 为 `java`
- **THEN** 渲染后的 SKILL.md 中描述为"Spring Boot 3.5 + Java 25"，`variants/java/` 下内容被复制

---

### Requirement: review skill 模板化

`packages/reef/skills/reef-review/SKILL.md` SHALL 改为 `SKILL.md.tmpl`，将硬编码的源码路径和 agent 名称替换为 `{{var}}` 占位符。

涉及替换的变量：
- `{{reef.backend.language.sourcePath}}` — 后端源码目录（如 `src/main/java/ src/test/java/`）
- `{{reef.frontend.framework.sourcePath}}` — 前端源码目录（如 `src/main/web/`）
- `{{reef.backend.language.agentName}}` — 后端审查 agent 名
- `{{reef.frontend.framework.agentName}}` — 前端审查 agent 名

#### Scenario: Java + Angular 下 review skill 正常渲染
- **WHEN** 配置为 `backend.language=java` 且 `frontend.framework=angular`
- **THEN** reef-review/SKILL.md 渲染后源码路径为 `src/main/java/ src/test/java/` 和 `src/main/web/`，agent dispatch 使用硬编码名（`backend-code-audit`、`frontend-code-audit` 等）

#### Scenario: review skill 不变的部分保持不变
- **WHEN** 模板渲染完成
- **THEN** review skill 的流程逻辑（Step 1→2→3）、agent 派发方式、agent 超时设置、输出格式等框架无关内容保持不变

---

### Requirement: review agent 模板化 + variants

`agents/reef-review-frontend.md` 和 `agents/reef-review-backend.md` SHALL 各拆分为 `.tmpl` + `variants/`：

```
agents/
├── reef-review-backend.md.tmpl
├── reef-review-frontend.md.tmpl
├── reef-review-security.md.tmpl
├── reef-review-infra.md
├── variants/
│   ├── java/
│   │   └── reef-review-backend.md
│   └── angular/
│       └── reef-review-frontend.md
```

#### Scenario: Java 变体包含 Java 审查 checklist
- **WHEN** 配置 `reef.backend.language` 为 `java`
- **THEN** `.claude/agents/reef-review-backend.md` 包含 Java/Spring Boot 特定的 P0 多租户红线、@PreAuthorize、MapStruct 等检查项

#### Scenario: Angular 变体包含 Angular 审查 checklist
- **WHEN** 配置 `reef.frontend.framework` 为 `angular`
- **THEN** `.claude/agents/reef-review-frontend.md` 包含 Angular 特定的 Signal Forms、PrimeNG、httpResource 等检查项

---

### Requirement: reef-auto-format.sh 模板化 + variants

`hooks/reef-auto-format.sh` SHALL 改为 `reef-auto-format.sh.tmpl` + `variants/java/`，与 skills/agents 采用一致的 variants 方案。

```
hooks/
├── reef-auto-format.sh.tmpl
├── variants/
│   └── java/
│       └── reef-auto-format.sh       ← 现有格式化逻辑（gradle spotlessApply + eslint --fix）
├── block-dangerous.sh           ← 静态，不变
├── protect-files.sh             ← 静态，不变
├── run-tests.sh                 ← 静态，不变
└── hooks.json                   ← 静态，不变
```

#### Scenario: Java 配置下使用 Java 格式化工具
- **WHEN** 配置 `reef.backend.language` 为 `java`
- **THEN** `.claude/hooks/reef-auto-format.sh` 包含 gradle spotlessApply / google-java-format 逻辑

#### Scenario: 静态 hook 文件不受影响
- **WHEN** 安装完成
- **THEN** block-dangerous.sh、protect-files.sh、run-tests.sh 和 hooks.json 内容与源目录一致

---

### Requirement: config set 重渲染流程

`deepstorm config set` SHALL 在写入配置后，检查配置变更是否影响已安装的模板资产。若受影响，SHALL 提示用户确认后触发重渲染。

确认流程：
1. 列出受影响的 skill/agent/hook 名称
2. 提示"检测到配置变更，需要重新生成以下文件：[列表]。确认重新生成？[y/N]"
3. 用户确认后，从 `@deepstorm/cli/dist/` 读取原始 .tmpl 文件进行重渲染
4. 用户拒绝后，配置已写入但 skill 内容维持旧版本

#### Scenario: 用户确认重渲染
- **WHEN** `deepstorm config set reef.frontend.framework=react` 执行成功且用户输入 `y`
- **THEN** 引擎重渲染所有受影响模板并覆盖 `.claude/` 下对应文件，提示"请重启 Claude Code 会话生效"

#### Scenario: 用户拒绝重渲染
- **WHEN** 用户输入 `n`
- **THEN** 配置已写入 `.claude/settings.json`，但 `.claude/skills/` 下内容不变

#### Scenario: 配置值未变更（与原值相同）
- **WHEN** 已存在 `reef.frontend.framework=angular`，用户执行 `deepstorm config set reef.frontend.framework=angular`
- **THEN** 引擎检测到无变化，跳过重渲染提示

---

### Requirement: build-registry 支持 .tmpl 扫描

`packages/cli/src/build-registry.ts` SHALL 在扫描 SKILL.md 时，若 `SKILL.md` 文件不存在则尝试读取 `SKILL.md.tmpl` 的 frontmatter。

Registry 条目 SHALL 新增字段：
- `hasTemplate: true` — 标记该技能是配置感知型（使用模板渲染）

#### Scenario: SKILL.md 不存在时读取 .tmpl frontmatter
- **WHEN** `reef-style-frontend/` 下无 `SKILL.md` 但有 `SKILL.md.tmpl`
- **THEN** build-registry 解析 `SKILL.md.tmpl` 的 frontmatter 生成 registry 条目

#### Scenario: hasTemplate 字段写入 registry
- **WHEN** skill 使用 SKILL.md.tmpl
- **THEN** registry.skills[skillName] 包含 `hasTemplate: true`

---

### Requirement: 所有 reef SKILL.md 声明 deepstorm 归属

当前全部 11 个 reef skill 的 SKILL.md 文件（reef-commit、reef-pr、reef-start、reef-harden、reef-migrate、reef-review、reef-gen-backend、reef-gen-frontend、reef-style-backend、reef-style-frontend、reef-testcase）SHALL 在 frontmatter 中增加：

```yaml
deepstorm:
  tool: reef
```

#### Scenario: registry 中正确显示 reef 工具归属
- **WHEN** build 完成后查看 registry.json
- **THEN** 11 个 reef skill 均出现在 registry.skills 中，`tool` 字段为 `reef`

---

## REMOVED Requirements

### Requirement: matcher 按 configKey+configValue 匹配安装

**Reason**: Way 1（全装 + 模板渲染）替代了 matcher 的筛选安装逻辑。所有选中工具的 skill 全量安装，不再按精确的 configKey+configValue 匹配来决定安装哪些 skill。

**Migration**: 移除 `src/engine/matcher.ts`、`src/engine/resolver.ts` 及其测试文件。setup 流程改为遍历工具下所有 skill 目录的方式进行安装。

### Requirement: ResolvedSkill 的 autoInstalled 字段

**Reason**: Way 1 不区分显式安装和自动依赖安装，所有安装的 skill 都是选中工具的一部分。

**Migration**: `guide.ts` 中的 `ResolvedSkill[]` 类型改为 `string[]`，输出引导信息时改为平铺已安装 skill 列表。
