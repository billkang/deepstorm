## Context

DeepStorm CLI Phase A (`cli-setup-tool`) 实现了完整的 CLI 脚手架：setup 向导、config CRUD、template 管理、doctor 诊断。其安装机制采用 configKey+configValue 精确匹配来选择技能（matcher 模式），但该模式不适合配置感知场景——同一个 skill（如 reef-style-frontend）需要在不同语言选择下表现出来的行为不同，而不是根据配置安装不同的 skill。

Phase B 需要建立新的安装范式：Way 1（全装 + 模板渲染）。用户在 setup 时选择工具（如 reef），回答技术栈问卷（前端框架/后端语言），CLI 将该工具下所有 skill/agent/hook 安装到 `.claude/`，但配置感知型资产在安装时通过模板渲染生成目标语言的内容。

模板渲染采用 {{var}} 占位符替换 + variants/ 目录文件级选择，不引入第三方模板引擎（零新增依赖）。

## Goals / Non-Goals

**Goals:**
- 建立 CLI 模板渲染引擎，支持 {{var}} 占位符替换 + variants/ 目录级别选择
- reef wizard.json 实现配置问卷，内嵌 template data
- Way 1 setup 流程（全装 + 渲染）覆盖 skill/agent/hook
- style-frontend/style-backend 拆分为模板 + variants
- review skill/agents 拆分为模板 + variants
- auto-format.sh 拆分为模板 + variants
- 所有 11 个 reef SKILL.md 声明 deepstorm 归属
- config set 支持重渲染确认流程
- build-registry 支持 .tmpl 扫描
- 删除 matcher/resolver（Way 1 不再需要）

**Non-Goals:**
- 不引入新语言的技术栈内容（仅 Angular/Java）
- 不改造 gen-backend/gen-frontend
- 不改造 tide/sweep/atoll
- 不实现 skill 热加载（重渲染后需重启 Claude Code 会话）

## Decisions

### D1: 模板引擎设计

**选择：** 纯正则 {{var}} 替换 + 文件级别选择，零新增依赖。

```typescript
// renderer.ts — 核心接口
function renderTemplate(
  tmplPath: string,              // SKILL.md.tmpl 文件路径
  variables: Record<string, string>,  // 占位符值表
  outputPath: string,            // 输出路径（覆盖 SKILL.md）
): void

function copyVariants(
  sourceVariantsDir: string,     // variants/ 目录
  selectedValue: string,         // 用户选择的值，如 "angular"
  targetDir: string,             // 目标目录，如 .claude/skills/reef-style-frontend/
): void
```

**模板变量命名约定：** `{{tool.configKey.field}}`

`{{reef.frontend.framework.label}}` 的解析规则：
1. 去掉最后一段（`.field`） → config key: `reef.frontend.framework`
2. 最后一段 → 模板字段名: `label`
3. 查 config: `config["reef.frontend.framework"]` → `"angular"`
4. 查 wizard.json 对应选项的 `template.label` → `"Angular 21 + TypeScript + Signal + PrimeNG + Tailwind CSS 4"`

替代方案：EJS 模板引擎。否决原因：内容 95%+ 是框架特定的 markdown，{{var}} 只在 frontmatter 和 SKILL.md 少量定位使用，引入 EJS 收益极低。且 EJS 语法（`<% %>`）混入 markdown 后严重影响可读性。

### D2: Way 1 Setup 流程

**选择：** 工具级全装 + 配置感知资产就地渲染。

```
用户选择 reef 工具
  ↓
回答 wizard 问卷（前端框架 + 后端语言）
  ↓
写入 config 到 .claude/settings.json
  ↓
遍历 reef 下所有 skill:
  若该 skill 目录中存在 SKILL.md.tmpl:
    renderTemplate(tmpl, variables, output)
    copyVariants(variants/, selectedConfigValue, target)
  否则:
    直接复制整个 skill 目录
  ↓
遍历 reef 下所有 agent:
  同上逻辑（.tmpl → render, 否则直接复制）
  ↓
遍历 reef 下所有 hook:
  同上逻辑
  ↓
合并 MCP 配置
  ↓
输出引导信息
```

关键变化：
- 删除对 `matchSkills()` 的依赖
- `guide.ts` 接收 `string[]`（已安装 skill 列表）而非 `ResolvedSkill[]`
- `installSkills()` 不再区分 explicit/auto installed

### D3: variants/ 目录约定

所有配置感知资产的 variants 使用统一结构。`variants/` 下存放**不可变参考文档**（quick-reference、examples），不含 SKILL.md。SKILL.md 由模板引擎从 `.tmpl` 渲染生成，保持动态更新。

```
{asset-name}/
├── SKILL.md.tmpl          ← 模板（或 agent.md.tmpl / hook.sh.tmpl）
└── variants/
    └── {configValue}/     ← 配置值的精确匹配（angular, react, java, python）
        ├── quick-reference.md    （可选）
        └── examples/             （可选）
```

规则：
- `variants/` 子目录名 **必须**是 wizard 选项中定义的 `value`（如 `angular`、`react`、`java`、`python`）
- `variants/{value}/` 下的所有内容在安装时被**完整复制**到目标目录（**不含** `SKILD.md`）
- 无 variants/ 目录或 variant 不匹配时，仅渲染 SKILL.md.tmpl，不复制额外文件
- 新增技术栈仅需添加 wizard 选项和 template 数据，无需预渲染变体 SKILL.md

### D4: wizard.json 的 template data 结构

```json
{
  "tool": "reef",
  "questions": [
    {
      "key": "reef.frontend.framework",
      "label": "前端框架",
      "type": "select",
      "options": [
        {
          "value": "angular",
          "label": "Angular",
          "template": {
            "label": "Angular 21 + TypeScript + Signal + PrimeNG + Tailwind CSS 4",
            "buildTool": "pnpm:*",
            "fileExt": "*.component.ts / *.service.ts / *.ts",
            "sourcePath": "src/main/web/",
            "agentName": "review-frontend.angular"
          },
          "affectedTemplates": [
            "skills/reef-style-frontend/SKILL.md.tmpl",
            "agents/reef-review-frontend.md.tmpl",
            "skills/reef-review/SKILL.md.tmpl"
          ]
        }
      ]
    }
  ]
}
```

`affectedTemplates` 声明该值变更时需要重新渲染哪些模板。

### D5: build-registry 的 .tmpl 扫描

当前 build-registry 只扫描 `SKILL.md`。改为先查 `SKILL.md`，不存在则查 `SKILL.md.tmpl`：

```typescript
const mdPath = path.join(skillsDir, skillName, 'SKILL.md')
const tmplPath = path.join(skillsDir, skillName, 'SKILL.md.tmpl')
const srcPath = fs.existsSync(mdPath) ? mdPath : (fs.existsSync(tmplPath) ? tmplPath : null)
if (!srcPath) { /* 跳过 */ }
```

Registry 条目新增 `hasTemplate: true` 字段标记配置感知型 skill。

### D6: config-set 重渲染

`deepstorm config set reef.frontend.framework=react` 执行流程：

1. 写入新配置到 `.claude/settings.json`（现有逻辑）
2. 从 `@deepstorm/cli/dist/registry.json` 读取 registry（通过 `__dirname` 定位）
3. 在 wizard.json 中查找对应 `questions[].options[]` 的 `affectedTemplates`
4. 输出警告："检测到配置变更，需要重新生成以下 skill/agent/hook：\n  reef-style-frontend, reef-review-frontend\n确认重新生成？[y/N]"
5. 用户确认后：
   - 从 `@deepstorm/cli/dist/skills/{name}/SKILL.md.tmpl` 读取原始模板
   - 用新配置值渲染 → 覆盖 `.claude/skills/{name}/SKILL.md`
   - 从 `@deepstorm/cli/dist/skills/{name}/variants/{value}/` 复制新文件
   - 清空并替换 `quick-reference.md` 和 `examples/`
6. 完成后提示："已重新生成，请重启 Claude Code 会话生效"

**拒绝场景：** 如果用户 N，不做任何修改，配置已写入但 skill 内容维持旧版本。

### D7: 模板变量完整清单

**reef-style-frontend/SKILL.md.tmpl**
| 变量 | Angular 值 |
|------|-----------|
| `{{reef.frontend.framework.label}}` | `Angular 21 + TypeScript + Signal + PrimeNG + Tailwind CSS 4` |
| `{{reef.frontend.framework.buildTool}}` | `pnpm:*` |

**reef-style-backend/SKILL.md.tmpl**
| 变量 | Java 值 |
|------|---------|
| `{{reef.backend.language.label}}` | `Spring Boot 3.5 + Java 25` |
| `{{reef.backend.language.buildTool}}` | `./gradlew:*` |

**reef-review/SKILL.md.tmpl**
| 变量 | Angular + Java 值 |
|------|------------------|
| `{{reef.backend.language.sourcePath}}` | `src/main/java/ src/test/java/` |
| `{{reef.frontend.framework.sourcePath}}` | `src/main/web/` |

**reef-review-frontend.md.tmpl**
| 变量 | Angular 值 |
|------|-----------|
| `{{reef.frontend.framework.label}}` | `Angular 21 + TypeScript + Signal + PrimeNG + Tailwind CSS 4` |
| `{{reef.frontend.framework.sourcePath}}` | `src/main/web/` |

**reef-review-backend.md.tmpl**
| 变量 | Java 值 |
|------|---------|
| `{{reef.backend.language.label}}` | `Spring Boot 3.5 + Java 25` |
| `{{reef.backend.language.sourcePath}}` | `src/main/java/ src/test/java/` |

**reef-auto-format.sh.tmpl**
| 变量 | Angular 值 | Java 值 |
|------|-----------|---------|
| `{{reef.frontend.framework.formatCmd}}` | `pnpm` | — |
| `{{reef.backend.language.formatCmd}}` | — | `./gradlew` |

**wizard.json template 数据字段（按 key 聚合）：**

| 字段 | 用途 | 使用方 |
|------|------|--------|
| `label` | 技术栈显示名称 | reef-style-frontend/SKILL.md.tmpl, reef-review-frontend.md.tmpl, reef-review-backend.md.tmpl |
| `buildTool` | 构建工具命令 | reef-style-frontend/SKILL.md.tmpl, reef-style-backend/SKILL.md.tmpl |
| `formatCmd` | 格式化工具命令 | reef-auto-format.sh.tmpl |
| `sourcePath` | 源码目录路径 | reef-review/SKILL.md.tmpl, reef-review-frontend.md.tmpl, reef-review-backend.md.tmpl |
| `fileExt` | 文件扩展名 | （保留扩展，当前未在模板中直接使用） |

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| `deepstorm config set` 重渲染时 `@deepstorm/cli/dist/` 路径不可达（如 pnpm 全局安装） | 模板无法读取，重渲染失败 | fallback 到提示"请运行 deepstorm setup --reconfigure" |
| 用户先 `config set` 写入了配置，但否定了重渲染提示 | .claude/settings.json 中的配置与 skill 内容不一致 | doctor 诊断增加配置-内容一致性检查 |
| `variants/` 中缺少对应 `configValue` 的目录（如选了 `react` 但还没写内容） | copyVariants 无文件可复制 | 渲染器忽略 missing variant，仅渲染 SKILL.md，静默降级 |
| `{{var}}` 变量名与 wizard 配置不匹配 | 占位符未被替换（留在最终输出中） | renderer 对未匹配占位符输出警告日志 |
| 模板中使用了 SKILL.md 中不存在的 frontmatter 字段 | 不影响渲染（extra 字段被忽略） | 无 — 宽松处理 |
| `deepstorm uninstall` 清理了 .claude/ 但用户手动改了配置 | uninstall 仍然是全量清理 | 无影响 |
| 多技能共享同一 template 变量（如 reef-review 和 reef-style-frontend 都引用 `{{reef.frontend.framework.label}}`） | 所有引用该变量的模板一次性全部重渲染 | 正确的行为 — affectedTemplates 声明了完整列表 |
