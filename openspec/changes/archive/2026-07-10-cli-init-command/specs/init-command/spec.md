## ADDED Requirements

### Requirement: CLI 命令注册

`@deepstorm/cli` SHALL 注册一个 `init` 子命令，与 `setup`、`update`、`doctor` 等现有命令平级。

#### Scenario: 命令可见
- **WHEN** 用户运行 `deepstorm --help`
- **THEN** 帮助信息中 SHALL 包含 `init` 命令及其用途说明

#### Scenario: 版本匹配
- **WHEN** 用户运行 `deepstorm init --version`
- **THEN** SHALL 使用与 CLI 相同的 `--version` 输出版本号

### Requirement: 交互式问答

`init` 命令 SHALL 提供交互式问答流程，引导用户选择技术栈选项。

#### Scenario: 前端框架选择
- **WHEN** 用户运行 `deepstorm init` 进入交互模式
- **THEN** SHALL 提示用户选择前端框架：Angular / None（不选前端）

#### Scenario: 后端语言选择
- **WHEN** 用户运行 `deepstorm init` 进入交互模式
- **THEN** SHALL 提示用户选择后端语言：Java (Spring Boot) / None（不选后端）

#### Scenario: Angular 子选项（选后才出现）
- **WHEN** 用户选择了 Angular
- **THEN** SHALL 展示对应的子选项（UI 库、CSS 方案），选项集与 reef wizard 一致

#### Scenario: Java 子选项（选后才出现）
- **WHEN** 用户选择了 Java
- **THEN** SHALL 展示对应的子选项（ORM、数据库迁移、AI、测试），选项集与 reef wizard 一致

#### Scenario: 项目名称输入
- **WHEN** 用户进入交互流程
- **THEN** SHALL 提示用户输入项目名称，作为生成的根目录名

#### Scenario: 至少选择一项
- **WHEN** 用户在前端和后端都选择了 None
- **THEN** SHALL 提示至少选择前端或后端之一，不允许两者都为空

### Requirement: 命令行参数

`init` 命令 SHALL 支持通过命令行参数直接指定选项，支持非交互模式。

#### Scenario: 指定项目名
- **WHEN** 用户运行 `deepstorm init --name my-project`
- **THEN** SHALL 使用 `my-project` 作为项目名称，跳过项目名输入环节

#### Scenario: 指定前端框架
- **WHEN** 用户运行 `deepstorm init --frontend angular`
- **THEN** SHALL 使用 Angular 作为前端框架，跳过前端选择环节

#### Scenario: 指定后端语言
- **WHEN** 用户运行 `deepstorm init --backend java`
- **THEN** SHALL 使用 Java 作为后端语言，跳过后端选择环节

#### Scenario: 参数不全时混合模式
- **WHEN** 用户指定了部分参数（如 `--frontend react`）但未指定其他选项
- **THEN** SHALL 对未指定的选项继续以交互模式提示

#### Scenario: 完整参数跳过交互
- **WHEN** 用户指定了全部必需参数（`--name`、至少 `--frontend` 或 `--backend` 之一）
- **THEN** SHALL 完全跳过交互，直接生成项目

### Requirement: 输出目录

生成的脚手架 SHALL 输出到当前目录下的项目名称子目录中。

#### Scenario: 默认输出
- **WHEN** 用户运行 `deepstorm init --name my-app`
- **THEN** SHALL 在当前工作目录下创建 `my-app/` 目录，所有项目文件写入其中

#### Scenario: 输出到指定目录
- **WHEN** 用户运行 `deepstorm init --name my-app --output ~/projects`
- **THEN** SHALL 在 `~/projects/my-app/` 目录下生成项目

#### Scenario: 目录已存在
- **WHEN** 目标目录已存在
- **THEN** SHALL 提示用户确认是否覆盖，用户拒绝则终止

### Requirement: 初始化后提示

生成项目后 SHALL 输出下一步操作指引。

#### Scenario: 完成提示
- **WHEN** 项目脚手架生成完毕
- **THEN** SHALL 输出项目路径、关键目录结构预览、推荐的下一步命令（如 `cd my-app`、`deepstorm setup` 等）

### Requirement: 错误处理

`init` 命令 SHALL 对异常情况给出明确的错误提示。

#### Scenario: 项目名包含非法字符
- **WHEN** 用户输入的项目名包含非法文件名字符
- **THEN** SHALL 提示项目名无效并给出命名规则说明

#### Scenario: 未知框架参数
- **WHEN** 用户指定了不支持的 `--frontend` 或 `--backend` 值
- **THEN** SHALL 输出支持的选项列表，提示用户重新运行
