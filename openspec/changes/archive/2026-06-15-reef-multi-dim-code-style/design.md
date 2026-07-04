## Context

当前系统使用纯正则替换（`content.replace(/\{\{(\S+?)\}\}/g, ...)`）作为模板引擎，模板文件（`.tmpl`）中只有 `{{var}}` 占位符，无条件分支、循环、模板引用等能力。

Reef code-style 只有两个扁平维度（`frontend.framework`、`backend.language`），用 `wizard.json` 的 option template 字段注入值，用 `variants/{value}/` 目录复制静态文件。

项目需要：
1. 支持前端的多维度选择（framework + TS 配置 + CSS 方案 + 测试框架）
2. 支持后端的嵌套维度（language 下再分子维度：orm、dbMigration、ai）
3. 各维度独立产出 code-style 片段，按用户选择组合
4. 新增 Spring AI 技术栈的 code-style

### 现有系统关键约束

- `renderTemplate` 是直接的字符串替换，调用的地方比较多
- `buildTemplateVariables` 在 `template/registry.ts` 中产生扁平 `Record<string, string>`
- `wizard.json` 的 question 无依赖关系，顺序遍历
- config 存储为 `<模块>.<领域>.<选项>` 的扁平 key（如 `reef.frontend.framework`）
- 现有 `.tmpl` 文件全部使用 `{{key}}` 格式，无需修改

## Goals / Non-Goals

**Goals:**
- 将模板引擎从正则替换迁移为 Handlebars，引入 `{{#if}}`/`{{#each}}`/`{{else}}`/`{{> partial}}` 能力
- 实现 fragment 式的 code-style 架构：各维度独立产出 markdown 文件，setup 时根据选择组合
- 支持 `wizard.json` 中问题的条件依赖（`dependsOn`）
- 扩展 reef 的 wizard 维度：前端 4 维、后端语言 + 4 子维
- 配置模型从扁平改为嵌套结构，支持旧配置自动迁移
- 现有 `.tmpl` 文件零修改，现有配置零损失

**Non-Goals:**
- 不引入运行时动态模板更新（模板在 setup 时一次性渲染）
- 不改变 MCP skill 的安装机制
- 不做跨 skill 的自动依赖解析（留待后续）
- 不改变 CLI 子命令的接口签名

## Decisions

### D1: Handlebars 作为模板引擎

**选择：Handlebars**（vs EJS / 继续使用正则替换）

| 维度 | Handlebars | EJS | 继续正则 |
|------|-----------|-----|---------|
| 语法兼容 | `{{var}}` 完全兼容，零迁移 | `{{var}}` → `<%= var %>`，需全部修改 | 当前就是 |
| 条件能力 | `{{#if}}` 原生 | `<% if %>` 完整 JS | 无 |
| 循环能力 | `{{#each}}` 原生 | `<% for %>` 完整 JS | 无 |
| partial | `{{> partial}}` 原生 | `<%- include %>` 原生 | 无 |
| 模板体积 | 中（~116KB gzip 7KB） | 小（~30KB） | 0 |
| 安全性 | 默认转义，`{{{ }}}` 不转义 | 默认转义 | 纯字符串 |
| 学习成本 | 低（mustache 风格） | 低（像 HTML 里写 JS） | 0 |

**理由：** Handlebars 的 `{{var}}` 与现有系统完全一致，迁移成本最低。EJS 需要修改所有现有模板文件（`{{` → `<%`），破坏性太强。

### D2: `buildTemplateVariables` 输出嵌套结构

**选择：** 将输出从 `Record<string, string>` 改为嵌套对象。

```
当前:  { "reef.frontend.framework.label": "Angular" }
改为:  { reef: { frontend: { framework: { label: "Angular" } } } }
```

**理由：** Handlebars 原生支持嵌套路径（`{{reef.frontend.framework.label}}`），如果用扁平结构需要在渲染前展平，增加复杂度。嵌套结构也对应 `wizard.json` 中 option.template 的键名。

**兼容策略：** 现有 `.tmpl` 文件中 `{{reef.frontend.framework.label}}` 的路径写法不变。

### D3: Fragment 合并策略

**选择：** 安装时复制所有选中维度的碎片文件，主 SKILL.md 用 `{{#if}}` 条件控制引用展示。

**合并规则：** 不做文件级拼接。每个维度的 `quick-reference.md` 作为一个独立文件放在 `dimensions/<category>/<option>/` 下，主 `SKILL.md` 通过链接引用它们。示例文件同理。

**理由：**
1. 避免文件拼接的冲突/覆盖问题（方案 B 的核心痛点）
2. Skill 的 `allowed-tools` 声明了 `Bash(git:*, ...)` 允许读取文件，SKILL.md 链接路径被 Skill 工具识别
3. 主 SKILL.md 保持简洁，不膨胀

**实现：** `SKILL.md` 渲染结果为:

```markdown
### 框架规范
→ 参考 [Angular 规范](dimensions/framework/angular/quick-reference.md)

### TypeScript 配置
→ 参考 [TS Strict 规范](dimensions/ts-config/strict/quick-reference.md)

### CSS 规范
（未配置 CSS 框架规范）
```

### D4: Wizard 条件依赖

**选择：** `wizard.json` 的 question 结构增加 `dependsOn` 字段。

```json
{
  "key": "reef.backend.java.orm",
  "label": "ORM 框架",
  "type": "select",
  "dependsOn": { "key": "reef.backend.language", "value": "java" },
  "options": [...]
}
```

**运行时逻辑：** setup 流程中，展示问题前检查 `dependsOn`。不满足条件时跳过该问题，对应的 config key 自动设为 `"none"`。

**备选方案考量：**
- 方案 A（全局展开所有问题）：用户界面太长，不友好
- 方案 B（JSON schema 依赖定义）：过于复杂，`dependsOn` 字段够用

### D5: 配置迁移

**选择：** 读取配置时检测版本号（`deepstorm.configVersion`），版本不一致时执行迁移。

**迁移逻辑：** CLI 入口（任何命令）读取配置后，检查 `configVersion`。不存在或 < 当前版本时，补全缺失字段为 `"none"`，写回并更新版本号。

### D6: 新维度默认值

**选择：** 所有新加载的维度默认值为 `"none"`。

**理由：** 现有用户升级时不会因 setup 而被打断。`"none"` 意味着不输出该维度的 code-style 引用，SKILL.md 中对应 `{{#if}}` 块被跳过。

**影响：** `buildTemplateVariables` 中对每个 question 的 template 字段，若 config 值为 `"none"`，则所有该 question 的以 `.styleRef` 结尾的 template 变量设置为空字符串，以 `.show*` 结尾的设为 `false`。

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| [R1] Handlebars 语法与现有类型系统冲突 | `{{#if}}` 可能被 TypeScript 误认 | lint 规则添加 `.tmpl` 排除 |
| [R2] 旧配置迁移遗漏 | 用户升级后仍用扁平结构，新维度未展开 | CLI 入口加配置版本检查，任何命令触发迁移 |
| [R3] wizard 问题膨胀 | 前端 + 后端最多 10 个问题，用户疲劳 | `dependsOn` 减少同时展示的问题数；提供 `--non-interactive` 批量模式 |
| [R4] Fragment 文件总量大 | 每个维度 + 每个选项都需要独立的 markdown | 目录结构清晰；初期先实现 Angular + Spring Boot 核心选项 |
| [R5] Handlebars 性能 | 编译 + 渲染 vs 正则替换略慢 | 影响仅发生在 setup 时（一次性的），非运行时路径，可接受 |
| [R6] 默认值 "none" 导致 silent skip | 用户可能不知道还有更多维度可选 | setup 完成时输出摘要显示哪些维度被跳过 |

## Migration Plan

1. **阶段一：模板引擎切换**（`handlebars-migration` + `template-management`）
   - 在 CLI 包中安装 `handlebars` 依赖
   - 重写 `renderTemplate` using `Handlebars.compile()`
   - `buildTemplateVariables` 改为输出嵌套结构
   - 测试：所有现有 `.tmpl` 渲染结果与之前一致
   - 测试：新增 `{{#if}}` 条件渲染

2. **阶段二：Fragment 架构**（`code-style-fragments`）
   - 定义新的 `dimensions/` 目录结构
   - 重构 `reef-style-frontend` 和 `reef-style-backend` 的模板
   - 实现 `copyFragments` 函数（处理 `dimensions/` 目录复制）
   - 主 SKILL.md.tmpl 改用 `{{#if}}` 条件引用

3. **阶段三：Wizard 扩展**（`setup-wizard`）
   - 实现 `dependsOn` 逻辑
   - 更新 `reef/wizard.json` 加入新维度问题
   - 更新 setup 流程处理问题跳过和默认值

4. **阶段四：配置模型**（`config-management`）
   - 实现嵌套配置模型
   - 实现旧配置自动迁移
   - 添加 `configVersion` 标记

5. **阶段五：Spring AI code-style**
   - 创建 `dimensions/java/spring-ai/quick-reference.md`
   - 注册到 wizard.json 的 `backend.java.ai` 选项

## Open Questions

1. ~~选择 Handlebars 还是 EJS？~~ → **已决定：Handlebars**
2. Fragment 合并策略（拼接 vs 链接引用 vs 条件渲染）？ → **已决定：主文件链接引用 + `{{#if}}` 控制**
3. 安装时 `copyFragments` 的参数传递：通过 wizard.json 的 `fragments` 字段传递，还是通过目录命名约定自动发现？ → **待决定，倾向 `fragments` 字段关联**
4. backend 非 Java 语言现阶段是否需要实现子维度？ → **需要根据用户后续需求决定**
5. 是否保留 `variants/` 机制（与 `dimensions/` 共存还是统一）？ → **待决定，倾向短期内共存过渡**
