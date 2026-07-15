# project-directory-detection Specification

## ADDED Requirements

### Requirement: init 交互模式询问当前路径是否为项目目录

`deepstorm init` 交互模式 SHALL 在询问项目名称之前，先询问用户当前路径是否为项目目录。

#### Scenario: 用户确认当前路径是项目目录
- **WHEN** 用户运行 `deepstorm init`（无 `--name` 参数），系统询问"当前路径是否为项目目录？"
- **AND** 用户选择"是"
- **THEN** 系统 SHALL 跳过项目名称询问
- **AND** 系统 SHALL 在当前目录（`process.cwd()`）直接生成脚手架代码，不创建子目录
- **AND** 技术栈询问（前端/后端选择）SHALL 正常进行

#### Scenario: 用户确认当前路径不是项目目录
- **WHEN** 用户运行 `deepstorm init`（无 `--name` 参数），系统询问"当前路径是否为项目目录？"
- **AND** 用户选择"否"
- **THEN** 系统 SHALL 继续原有流程：询问项目名称 → 在 `{当前目录}/{项目名}` 下创建新目录并生成脚手架

#### Scenario: 用户取消目录选择
- **WHEN** 系统询问"当前路径是否为项目目录？"
- **AND** 用户按 Ctrl+C 取消
- **THEN** 系统 SHALL 正常退出，不产生任何文件改动

### Requirement: runInit 支持无 projectName 的运行模式

`runInit` 函数 SHALL 支持 `projectName` 为空字符串的场景，此时使用当前目录作为项目根目录。

#### Scenario: projectName 为空时在当前目录生成
- **WHEN** `runInit` 被调用且 `opts.projectName` 为空
- **THEN** 系统 SHALL 使用 `baseDir` 作为项目目录（不创建子目录）
- **AND** 系统 SHALL 跳过 `runInit` 函数中的项目名称格式校验
- **AND** 后续所有模板渲染 SHALL 以 `baseDir` 为根目录

#### Scenario: projectName 有值时创建子目录
- **WHEN** `runInit` 被调用且 `opts.projectName` 为有效值
- **THEN** 系统 SHALL 沿用原有逻辑：在 `path.join(baseDir, opts.projectName)` 下创建子目录并生成脚手架

### Requirement: 非交互模式（--name）保持原有行为

使用 `--name` 参数的非交互模式 SHALL 保持不变，始终创建以该名称命名的子目录。

#### Scenario: 带 --name 的非交互模式
- **WHEN** 用户运行 `deepstorm init --name my-project --frontend angular`
- **THEN** 系统 SHALL 在 `{当前目录}/my-project` 下创建项目，SKIP 目录询问提示

### Requirement: 在当前目录 init 时不覆盖已有文件

当用户在已有目录中执行 init 时，SHALL 仅添加脚手架中不存在的文件，不覆盖已有文件。

#### Scenario: 已有文件存在时跳过
- **WHEN** 用户在已有项目目录中执行 `deepstorm init` 并确认当前路径是项目目录
- **AND** 目标文件（如 `package.json`）已存在
- **THEN** 系统 SHALL 跳过已存在的文件，不覆盖
- **AND** 系统 SHALL 仅生成不存在的文件
- **AND** 系统 SHALL 打印已跳过文件的提示信息
