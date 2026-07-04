# Template Engine — CLI 模板渲染基础设施

## ADDED Requirements

### Requirement: {{var}} 占位符替换

模板渲染引擎 SHALL 支持 `{{configKey.field}}` 格式的占位符替换。

占位符解析规则：
1. 去掉最后一个 `.` 之前的部分 → config key（如 `reef.frontend.framework`）
2. 最后一个 `.` 之后的部分 → 模板字段名（如 `label`）
3. 查用户配置 `config[configKey]` → 得到选中值（如 `angular`）
4. 查对应 wizard.json 中 `options[].value === selectedValue` 的 `template[field]` → 得到替换值
5. 若任一步骤找不到值，保留占位符原样并输出警告

#### Scenario: 基本占位符替换
- **WHEN** 模板中包含 `{{reef.frontend.framework.label}}` 且用户配置 `reef.frontend.framework` 为 `angular`
- **THEN** 引擎替换为 wizard 中 angular 选项的 `template.label` 值

#### Scenario: 未匹配占位符保留原样
- **WHEN** 模板中包含 `{{unknown.key.field}}` 且 registry 中无对应配置
- **THEN** 引擎保留 `{{unknown.key.field}}` 不变，输出警告日志

#### Scenario: wizard 中缺少 template data
- **WHEN** 匹配到 config 值但在 wizard 选项中找不到 `template` 字段
- **THEN** 引擎保留占位符原样，输出警告日志

---

### Requirement: variants/ 目录文件级选择

模板渲染引擎 SHALL 支持按用户配置值从 `variants/` 子目录中选择性复制文件到输出目录。

`variants/` 目录命名规则：
- 子目录名称 MUST 等于 wizard 选项中定义的 `value`（如 `angular`、`react`、`java`、`python`）
- `variants/{value}/` 下的所有文件和子目录 SHALL 被完整递归复制到目标目录

#### Scenario: variant 存在且匹配配置值
- **WHEN** `variants/react/` 目录存在且用户配置 `reef.frontend.framework` 为 `react`
- **THEN** `variants/react/` 下的所有文件被完整复制到目标目录

#### Scenario: variant 不存在时静默降级
- **WHEN** 选中的配置值在 `variants/` 下无对应目录
- **THEN** 引擎跳过文件复制，不报错

#### Scenario: 复制前清空目标中原有 variants 内容
- **WHEN** 目标目录已存在旧 variants 内容（如 quick-reference.md）
- **THEN** 先删除旧文件再复制新文件，避免残留

---

### Requirement: affectedTemplates 匹配

模板渲染引擎 SHALL 支持通过 wizard.json 中声明的 `affectedTemplates` 列表，在 config set 变更时找到需要重新渲染的模板文件。

`affectedTemplates` 声明在 wizard 选项级别：
```json
{
  "value": "react",
  "template": { ... },
  "affectedTemplates": [
    "skills/reef-style-frontend/SKILL.md.tmpl",
    "agents/reef-review-frontend.md.tmpl"
  ]
}
```

`affectedTemplates` 中的路径是相对于 `@deepstorm/cli/dist/` 的资产路径。

#### Scenario: config set 时找到受影响模板
- **WHEN** 用户执行 `deepstorm config set reef.frontend.framework=react`
- **THEN** 引擎查询 registry + wizard.json 找到所有 `affectedTemplates` 列表

#### Scenario: 多 skill 共享同一 affectedTemplates
- **WHEN** 用户修改 `reef.backend.language` 影响 reef-style-backend 和 reef-review-backend
- **THEN** 引擎一并找全这两个模板的路径
