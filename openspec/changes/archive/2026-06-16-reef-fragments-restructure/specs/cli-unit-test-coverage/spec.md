## ADDED Requirements

### Requirement: setup.ts fragment 处理函数可测试
`setup.ts` 中的 `copyFragmentsForSkill` 和 `collectFragmentsFromQuestion` 函数 SHALL 被导出（export），以便单元测试可以导入并测试。

#### Scenario: copyFragmentsForSkill 导出
- **WHEN** 用户在测试文件中 `import { copyFragmentsForSkill } from '../setup'`
- **THEN** 导入成功，函数可被调用

#### Scenario: collectFragmentsFromQuestion 导出
- **WHEN** 用户在测试文件中 `import { collectFragmentsFromQuestion } from '../setup'`
- **THEN** 导入成功，函数可被调用

### Requirement: fragment 路径收集逻辑正确
`collectFragmentsFromQuestion` 函数 SHALL 正确从 wizard question 中递归收集所有 fragment 路径。

#### Scenario: 简单单选
- **WHEN** question 类型为 `select`，`configKey` 匹配 registry 中的 fragmentPaths
- **THEN** 返回的路径列表包含该 fragment 路径

#### Scenario: 嵌套类别路径
- **WHEN** fragment 路径包含多层如 `java/framework/spring-boot`
- **THEN** 函数 SHALL 正确解析 category（`java/framework`）和 value（`spring-boot`）

#### Scenario: 多选逗号分隔
- **WHEN** question 是 `multi-select`，用户选择多个值（逗号分隔）
- **THEN** 函数 SHALL 为每个值收集对应的 fragment 路径

#### Scenario: Group 递归
- **WHEN** question 类型为 `group`，包含子 questions
- **THEN** 函数 SHALL 递归处理子 questions 中的 fragment 路径

#### Scenario: 没有 fragments 时返回空数组
- **WHEN** registry 中没有对应 configKey 的 fragments
- **THEN** 函数返回空数组

### Requirement: fragment 文件复制逻辑正确
`copyFragmentsForSkill` 函数 SHALL 正确将 fragment 文件从 source 复制到目标技能目录。

#### Scenario: 单 fragment 复制
- **WHEN** 传入单个 fragment 路径 `java/framework/spring-boot`
- **THEN** 从 source 读取 `quick-reference.md`，在目标目录写入 `spring-boot.md`

#### Scenario: 多 fragment 不冲突
- **WHEN** 传入多个 fragment 路径
- **THEN** 每个 fragment 生成对应的 `{value}.md` 文件，文件名不冲突

#### Scenario: 示例文件加前缀复制
- **WHEN** fragment 包含 `examples/` 目录下的文件
- **THEN** 文件 SHALL 以 `{value}-` 前缀复制到目标 `examples/` 目录

#### Scenario: quick-reference.md 不存在时报错
- **WHEN** fragment source 目录中缺少 `quick-reference.md`
- **THEN** 函数 SHOULD 输出错误提示，不中断其他 fragment 处理

### Requirement: 模板命令可测试
`template-list`、`template-apply`、`template-upgrade` 命令 SHALL 有单元测试覆盖。

#### Scenario: listTemplates 空 registry
- **WHEN** registry 中 skills 为空
- **THEN** 输出"没有找到可用的模板"

#### Scenario: listTemplates 按工具筛选
- **WHEN** 传入 tool 参数
- **THEN** 只列出该 tool 下的 skill

#### Scenario: applyTemplate 源不存在
- **WHEN** 指定 skill 的模板源不存在
- **THEN** 输出"模板不存在"提示

#### Scenario: applyTemplate 成功复制
- **WHEN** 模板源目录存在且内容正常
- **THEN** 正确复制到 `.claude/skills/{name}/` 目录

#### Scenario: upgradeTemplates 用户修改跳过
- **WHEN** 目标目录存在 `.deepstorm/templates/{name}/`（用户修改标记）
- **THEN** 跳过该模板，不覆盖

#### Scenario: upgradeTemplates 官方版本更新
- **WHEN** 目标目录无用户修改标记
- **THEN** 复制官方版本到 `.claude/skills/{name}/`

### Requirement: config-view 可测试
`viewConfig` 函数 SHALL 能处理配置不存在、配置存在、非 DeepStorm 配置三种情况。

#### Scenario: settings.json 不存在
- **WHEN** `.claude/settings.json` 文件不存在
- **THEN** 输出"尚未配置 DeepStorm"引导提示

#### Scenario: 存在 deepstorm 配置
- **WHEN** `.claude/settings.json` 包含 `deepstorm` 字段
- **THEN** 以 JSON 格式正确展示配置内容

#### Scenario: 无 deepstorm 字段
- **WHEN** `.claude/settings.json` 存在但不包含 `deepstorm` 字段
- **THEN** 输出"尚未配置 DeepStorm"提示
