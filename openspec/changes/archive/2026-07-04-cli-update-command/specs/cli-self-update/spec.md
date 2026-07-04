## ADDED Requirements

### Requirement: 查看版本更新信息（update --check）

CLI SHALL 支持 `deepstorm update --check` 检查 npm registry 上的最新版本并与本地版本比对。

#### Scenario: 有新版本可用
- **WHEN** 用户运行 `deepstorm update --check`
- **THEN** CLI 向 `https://registry.npmjs.org/@deepstorm/cli/latest` 发送 GET 请求
- **THEN** CLI 从响应中提取 `version` 字段
- **THEN** CLI 从 `package.json` 读取本地版本号
- **THEN** CLI 比较两个版本号
- **THEN** 如果线上版本 > 本地版本，输出 "✔ 当前版本: v{local} / ✔ 最新版本: v{latest} / → 有新版本可用！运行 deepstorm update --cli 更新"
- **THEN** 如果版本相同，输出 "✓ 已是最新版本"
- **THEN** CLI 不执行任何安装操作

#### Scenario: npm registry 连接失败
- **WHEN** 用户运行 `deepstorm update --check` 且无法连接到 npm registry
- **THEN** CLI 输出 "⚠ 无法检查更新：npm registry 连接失败"
- **THEN** CLI 以非零退出码退出

#### Scenario: registry 返回异常数据
- **WHEN** npm registry 返回的 JSON 中没有 `version` 字段或版本号格式异常
- **THEN** CLI 输出 "⚠ 无法解析最新版本信息"
- **THEN** CLI 以非零退出码退出

### Requirement: 更新 CLI 自身（update --cli）

CLI SHALL 支持 `deepstorm update --cli` 检查最新版本并提示用户执行更新。

#### Scenario: 有新版本
- **WHEN** 用户运行 `deepstorm update --cli`
- **THEN** CLI 执行与 `--check` 相同的版本检查
- **THEN** 如果线上版本 > 本地版本，输出 "运行以下命令更新：npm install -g @deepstorm/cli@latest"
- **THEN** CLI 不自动执行更新命令

#### Scenario: 已是最新版本
- **WHEN** 用户运行 `deepstorm update --cli` 且本地已是最新
- **THEN** CLI 输出 "✓ 已是最新版本"

### Requirement: 全量更新（update，无选项）

CLI SHALL 支持 `deepstorm update` 不带选项时同时执行 CLI 版本检查和 skill 模板同步。

#### Scenario: 执行全量更新
- **WHEN** 用户运行 `deepstorm update`
- **THEN** CLI 先执行版本检查（同 `--check`）
- **THEN** CLI 再执行 skill 模板同步（同 `--skills`）
- **THEN** 版本检查和技能同步独立执行，一个失败不影响另一个

### Requirement: 版本号从 package.json 读取

CLI 的 `--version` 输出 SHALL 从 `package.json` 读取实际版本号，而非硬编码。

#### Scenario: --version 输出版本号
- **WHEN** 用户运行 `deepstorm --version`
- **THEN** CLI 输出 `X.Y.Z` 格式的版本号
- **THEN** 版本号与 npm 包 `@deepstorm/cli` 的 `package.json` 中的 `version` 字段一致

#### Scenario: doctor 输出中显示版本
- **WHEN** 用户运行 `deepstorm doctor`
- **THEN** CLI 版本检查项输出 `v{version}` 格式
- **THEN** 版本号与 `package.json` 一致
