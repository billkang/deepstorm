## ADDED Requirements

### Requirement: selectMcpTools 可测试
`selectMcpTools` 函数 SHALL 可被单元测试覆盖，包括 mock RegistryReader 和 @clack/prompts 交互。

#### Scenario: 空工具列表显示提示
- **WHEN** `getMcpTools()` 返回空数组
- **THEN** 调用 `p.note()` 提示"没有可用的 MCP 工具"
- **AND** 返回空数组
- **AND** 不调用 `p.multiselect()`

#### Scenario: 正常多选服务
- **WHEN** 有 3 个 MCP 工具可用（github/jira/figma）
- **AND** 用户选择 github 和 jira
- **THEN** 返回 `["github", "jira"]`

#### Scenario: context7 排在列表最后
- **WHEN** 工具列表包含 context7 和其他工具
- **THEN** context7 在 options 数组中排在最后一位
- **AND** 其余工具按字母序排列

#### Scenario: Option label 包含领域标签
- **WHEN** 工具具有 domain 属性
- **THEN** option label 格式为 `{domainLabel} · {toolLabel}`
- **AND** 已知领域显示本地化标签（如代码托管），未知领域显示原始 domain 名

#### Scenario: 全部不选返回空数组
- **WHEN** 用户没有选择任何工具
- **THEN** 返回空数组

#### Scenario: 取消操作触发 process.exit(0)
- **WHEN** 用户通过 ctrl+c 取消选择
- **THEN** 调用 `p.cancel('已取消安装')`
- **AND** 调用 `process.exit(0)`

#### Scenario: undefined entry 不崩溃
- **WHEN** `getMcpToolEntry()` 返回 undefined
- **THEN** option label 中 domain 部分为空字符串
- **AND** 不抛出异常

#### Scenario: multiselect required 为 false
- **WHEN** 调用 `selectMcpTools()`
- **THEN** `p.multiselect()` 的 `required` 参数为 `false`

#### Scenario: initialValues 正确传递
- **WHEN** 调用 `selectMcpTools(reader, ['jira'])`
- **THEN** `p.multiselect()` 的 `initialValues` 参数为 `['jira']`

### Requirement: config 子命令 action 可测试
config 各子命令（set/reset/refresh）的 action 处理逻辑 SHALL 可被单元测试覆盖，各子命令模块 SHALL 可被 mock。

#### Scenario: config set 正确解析 key=value
- **WHEN** 用户输入 `deepstorm config set reef.frontend.framework=react`
- **THEN** 解析出 key=`reef.frontend.framework`，value=`react`
- **AND** 调用 `setConfigValue()` 传入正确参数

#### Scenario: config set 无等号报错
- **WHEN** 用户输入 `deepstorm config set invalidformat`
- **THEN** 输出错误"格式错误：请使用 key=value 格式"
- **AND** 不调用 `setConfigValue()`

#### Scenario: config set 等号在开头报错
- **WHEN** 用户输入 `deepstorm config set =value`
- **THEN** 输出错误"格式错误：请使用 key=value 格式"

#### Scenario: config reset 用户确认后清除
- **WHEN** 用户运行 `deepstorm config reset`
- **AND** 在确认提示中选择 Yes
- **THEN** 调用 `resetConfig()`
- **AND** 输出"配置已清除"

#### Scenario: config reset 用户拒绝则取消
- **WHEN** 用户运行 `deepstorm config reset`
- **AND** 在确认提示中选择 No
- **THEN** 不调用 `resetConfig()`
- **AND** 输出"已取消"

#### Scenario: config reset ctrl+c 取消
- **WHEN** 用户运行 `deepstorm config reset`
- **AND** 按下 ctrl+c
- **THEN** 不调用 `resetConfig()`
- **AND** 输出"已取消"

#### Scenario: config refresh 成功刷新技能
- **WHEN** `refreshConfig()` 返回 `{refreshed: ['reef-frontend-style'], errors: []}`
- **THEN** 输出"已刷新 1 个技能"
- **AND** 列出刷新成功的技能名
- **AND** 不输出错误信息

#### Scenario: config refresh 部分失败
- **WHEN** `refreshConfig()` 返回 `{refreshed: [], errors: ['template not found: reef-style']}`
- **THEN** 输出错误信息
- **AND** 输出"没有需要刷新的技能"

#### Scenario: config refresh 无刷新内容
- **WHEN** `refreshConfig()` 返回 `{refreshed: [], errors: []}`
- **THEN** 输出"没有需要刷新的技能"

### Requirement: config-set 值无变更及模板提示
`setConfigValue` 函数 SHALL 正确处理值无变更场景、affected templates 确认流程、未知 key 和 settings.json 损坏恢复。

#### Scenario: 值无变更提示
- **WHEN** 新值与现有值相同
- **THEN** 输出提示包含"已是"和"无变更"
- **AND** 不修改文件内容

#### Scenario: 无 affected templates 时不提示用户
- **WHEN** 选项定义中没有 `affectedTemplates` 字段
- **THEN** 不调用 `p.confirm()`
- **AND** 直接写入配置

#### Scenario: affected templates 存在时提示用户
- **WHEN** 选项定义中包含 `affectedTemplates`
- **THEN** 调用 `p.confirm()` 询问是否重新生成模板
- **AND** 输出"检测到配置变更"

#### Scenario: 用户拒绝模板重新生成时提示手动更新
- **WHEN** 用户拒绝确认
- **THEN** 提示"setup --reconfigure"手动更新方式
- **AND** 配置值仍然写入

#### Scenario: 未知 config key 不写入
- **WHEN** 传入不存在的 config key
- **THEN** 不更新 settings.json
- **AND** 不输出"已更新"信息

#### Scenario: 损坏的 settings.json 可恢复
- **WHEN** settings.json 内容格式错误（如 `{corrupt`）
- **THEN** 函数正常写入新值
- **AND** 恢复为合法 JSON

### Requirement: Registry 查询方法可测试
`RegistryReader` 的 `getToolEntry`、`getMcpTools`、`getMcpToolEntry`、`findSkillIds` 方法 SHALL 可被单元测试覆盖。

#### Scenario: getToolEntry 返回工具元数据
- **WHEN** 查询已存在的工具（如 reef）
- **THEN** 返回其 label 和 description

#### Scenario: getToolEntry 返回 undefined
- **WHEN** 查询不存在的工具名
- **THEN** 返回 `undefined`

#### Scenario: getMcpTools 返回所有 MCP 工具名
- **WHEN** registry 包含 mcpTools
- **THEN** 返回所有 MCP 工具的名称数组

#### Scenario: getMcpToolEntry 返回已有工具的元数据
- **WHEN** 查询已知的 MCP 工具（如 github）
- **THEN** 返回其 domain、label、description

#### Scenario: getMcpToolEntry 返回 undefined
- **WHEN** 查询不存在的 MCP 工具名
- **THEN** 返回 `undefined`

#### Scenario: findSkillIds 按 configKey+configValue 匹配
- **WHEN** 传入匹配的 configKey 和 configValue
- **THEN** 返回对应 skill ID 列表

#### Scenario: findSkillIds 不匹配时返回空数组
- **WHEN** 传入不匹配的 configKey 和 configValue
- **THEN** 返回空数组

### Requirement: guide MCP 输出可测试
`printGuide` 函数的 MCP 相关输出 SHALL 可被单元测试覆盖。

#### Scenario: 展示 MCP 工具数量
- **WHEN** 传入 `mcpTools: ['github', 'jira']`
- **THEN** 输出包含"2 个外部服务"
- **AND** 列出 github 和 jira

#### Scenario: 展示 MCP env stubs
- **WHEN** 传入 `mcpEnvStubs` 数组
- **THEN** 输出包含每个 env key 和 comment

#### Scenario: GitHub 工具显示 Docker 警告
- **WHEN** `mcpTools` 包含 `'github'`
- **THEN** 输出包含"Docker"

#### Scenario: 非 GitHub 工具不显示 Docker 警告
- **WHEN** `mcpTools` 仅包含 `'jira'`
- **THEN** 输出不包含"Docker"

### Requirement: guide git prompt 多场景可测试
`printGuide` 函数的 git 交互提示 SHALL 覆盖多种 .gitignore 场景和用户选择。

#### Scenario: .git 目录存在时显示 confirm
- **WHEN** `targetDir` 下存在 `.git` 目录
- **THEN** 调用 `p.confirm()`

#### Scenario: 无 .git 时不显示 confirm
- **WHEN** `targetDir` 下不存在 `.git`
- **THEN** 不调用 `p.confirm()`

#### Scenario: .gitignore 含 `.claude/` 时显示 warning
- **WHEN** `.gitignore` 文件包含 `.claude/` 行
- **AND** 用户确认 Git 提交
- **THEN** 输出提示".gitignore 中包含了 .claude/"

#### Scenario: .gitignore 含 `.claude`（无斜杠）时显示 warning
- **WHEN** `.gitignore` 文件包含 `.claude` 行
- **THEN** 输出同样的 warning 提示

#### Scenario: .gitignore 含 `.claude/**` pattern 时显示 warning
- **WHEN** `.gitignore` 文件包含 `.claude/**` 行
- **THEN** 输出同样的 warning 提示

#### Scenario: .gitignore 无 `.claude/` 时显示手动提交提示
- **WHEN** `.gitignore` 文件存在但不包含 `.claude/`
- **AND** 用户确认 Git 提交
- **THEN** 输出包含"手动执行"
- **AND** 不输出 ".gitignore 中包含了" 提示

#### Scenario: 用户拒绝 Git 提交时不显示 commit 信息
- **WHEN** 用户拒绝 confirm
- **THEN** 输出不包含"git add"

### Requirement: questionnaire 条件依赖可测试
`runQuestionnaire` 的 `dependsOn` 条件逻辑 SHALL 可被单元测试覆盖，包括 `not` 标志。

#### Scenario: dependsOn 条件满足时显示子问题
- **WHEN** 父问题选择 `java`
- **AND** 子问题依赖 `{key: "parent", value: "java"}`
- **THEN** 子问题被展示
- **AND** 结果中包含子问题值

#### Scenario: dependsOn 条件不满足时跳过子问题
- **WHEN** 父问题选择 `none`
- **THEN** 子问题不被展示
- **AND** 子问题结果设为默认值 `"none"`

#### Scenario: dependsOn 父 key 已配置时跳过
- **WHEN** 父问题 key 已在 `configuredKeys` 中
- **THEN** 子问题设为 `"none"`
- **AND** 不会向用户展示子问题

#### Scenario: dependsOn with not 标志
- **WHEN** 子问题依赖为 `{key: "env", value: "prod", not: true}`
- **AND** 父问题选择非 `prod` 的值（如 `dev`）
- **THEN** 子问题被展示
- **AND** 子问题结果包含用户选择值

#### Scenario: dependsOn not 条件不满足时跳过
- **WHEN** 子问题依赖为 `{key: "env", value: "prod", not: true}`
- **AND** 父问题选择 `prod`
- **THEN** 子问题不被展示
- **AND** 子问题结果设为 `"none"`

### Requirement: questionnaire multiselect 可测试
`runQuestionnaire` 的 `multiselect` 和 `groupMultiselect` 类型 SHALL 可被单元测试覆盖。

#### Scenario: multiselect 无分组
- **WHEN** question 类型为 `multiselect` 且 options 无 groups
- **THEN** 调用 `p.multiselect()`
- **AND** 结果中多选值以逗号分隔

#### Scenario: multiselect 单选
- **WHEN** question 类型为 `multiselect` 且用户只选一个
- **THEN** 结果中值为 `"react"`

### Requirement: questionnaire group 类型可测试
`runQuestionnaire` 的 `group` 类型 SHALL 可被单元测试覆盖。

#### Scenario: group 类型显示子问题
- **WHEN** question 类型为 `group` 且有子 questions
- **AND** 子问题类型为 `select`
- **THEN** 结果中包含子问题 key 和对应值

#### Scenario: group 类型子问题带默认值
- **WHEN** question 类型为 `group`
- **AND** 子问题有默认值
- **THEN** 结果中默认值被应用

### Requirement: release build 可测试
release 命令的 build action SHALL 可被单元测试覆盖，mock execSync 和 buildRegistry。

#### Scenario: 指定 root 时正常执行 build
- **WHEN** 用户运行 `deepstorm release build --root <dir>`
- **THEN** `execSync` 被调用执行 `node scripts/build.mjs`
- **AND** `buildRegistry` 被调用

#### Scenario: dry-run 模式不修改版本
- **WHEN** 用户运行 `deepstorm release publish patch --dry-run`
- **THEN** 输出包含"试运行"
- **AND** package.json 版本回滚到原始值

### Requirement: setup fragment 复制边缘情况可测试
`copyFragmentsForSkill` 函数 SHALL 正确处理示例文件过滤、目录不存在、无匹配 fragment 等边缘情况。

#### Scenario: .DS_Store 文件被跳过
- **WHEN** examples 目录包含 `.DS_Store` 和正常文件
- **THEN** `.DS_Store` 不被复制到目标目录
- **AND** 正常文件被复制（以 value- 前缀命名）

#### Scenario: fragments 目录不存在时不报错
- **WHEN** 源目录下没有 `fragments/` 目录
- **THEN** 函数正常返回，不创建任何文件
- **AND** 不抛出异常

#### Scenario: config 值无匹配 fragment 时不复制
- **WHEN** 用户的 config 值在 registry 中没有对应 fragment
- **THEN** 不复制任何文件到目标目录

### Requirement: template 子命令 action 可测试
template 各子命令（list/init/apply/upgrade）的 action 处理逻辑 SHALL 可被单元测试覆盖，子命令模块 SHALL 可被 mock。

#### Scenario: template list 无工具筛选
- **WHEN** 用户运行 `deepstorm template list`
- **THEN** `listTemplates()` 被调用时 registry 参数和工具参数为 `undefined`

#### Scenario: template list 按工具筛选
- **WHEN** 用户运行 `deepstorm template list reef`
- **THEN** `listTemplates()` 被调用时工具参数为 `'reef'`

#### Scenario: template init 无工具名时报错
- **WHEN** 用户运行 `deepstorm template init`
- **THEN** 输出提示"请指定工具名称"
- **AND** 不调用 `initTemplate()`

#### Scenario: template init 仅指定工具名
- **WHEN** 用户运行 `deepstorm template init reef`
- **THEN** `initTemplate()` 被调用时 skillId 为 `'reef'`

#### Scenario: template init 指定工具和 capability
- **WHEN** 用户运行 `deepstorm template init reef frontend`
- **THEN** `initTemplate()` 被调用时 skillId 为 `'reef-frontend'`
