## ADDED Requirements

### Requirement: 开发意图检测（intent-detect）

DeepStorm 自身开发环境 SHALL 配置一个 UserPromptSubmit hook，在用户输入涉及修改 DeepStorm 自身代码时自动提示使用 `deepstorm-discuss` 流程。

#### Scenario: 检测开发意图关键词
- **WHEN** 用户输入包含以下关键词：修改 DeepStorm 自身、setup 流程、packages、hooks.json、构建/发布、CLAUDE.md 等
- **THEN** hook SHALL 注入 `<system-reminder>` 提示块，要求先走 `deepstorm-discuss` 流程
- **AND** MUST NOT 拦截查询类输入（如"查一下"、"看看"、"怎么用"）

#### Scenario: 排除纯查询和命令
- **WHEN** 用户输入以 `/` 或 `!` 开头
- **OR** 输入属于查询类（包含"怎么用"、"是什么意思"等）
- **THEN** hook SHALL 不注入任何提示，静默放行

### Requirement: 危险命令拦截（block-dangerous）

DeepStorm 自身开发环境 SHALL 配置一个 PreToolUse|Bash hook，拦截危险的 Bash 命令。

#### Scenario: 拦截破坏性系统命令
- **WHEN** 命令包含 `rm -rf /`、`rm -rf ~`、`mkfs.`、`dd if=`、`chmod -R 777 /`、`chown -R`、fork bomb 等模式
- **THEN** hook SHALL 返回 `permissionDecision: "deny"` 并说明拦截原因

#### Scenario: 拦截危险 git 操作
- **WHEN** 命令包含 `git push --force origin main` 或 `git push --force origin master`
- **THEN** hook SHALL 返回 `permissionDecision: "deny"`

#### Scenario: 拦截 curl|sh 管道执行
- **WHEN** 命令将 `curl` 或 `wget` 的输出管道到 `sh` 或 `bash`
- **THEN** hook SHALL 返回 `permissionDecision: "deny"`

#### Scenario: 拦截 sed -i 修改敏感文件
- **WHEN** 命令使用 `sed -i` 直接修改 `.env`、lock 文件
- **THEN** hook SHALL 返回 `permissionDecision: "deny"`

#### Scenario: 放行安全命令
- **WHEN** 命令不匹配任何危险模式
- **THEN** hook SHALL 静默退出（exit 0），不干扰正常流程

### Requirement: 关键文件保护（protect-files）

DeepStorm 自身开发环境 SHALL 配置一个 PreToolUse|Write|Edit hook，保护项目关键文件不被随意修改。

#### Scenario: 禁止修改保护文件
- **WHEN** 尝试 Write/Edit `.env`、`package-lock.json`、`yarn.lock`、`pnpm-lock.yaml`
- **THEN** hook SHALL 返回 `permissionDecision: "deny"`

#### Scenario: 禁止修改保护目录内文件
- **WHEN** 尝试修改 `.git/`、`node_modules/`、`dist/` 目录内的任何文件
- **THEN** hook SHALL 返回 `permissionDecision: "deny"`

#### Scenario: 关键配置文件告警
- **WHEN** 尝试修改 `CLAUDE.md`、`registry.json`、`wizard.json`
- **THEN** hook SHALL 输出警告信息到 stderr，提示需要走 `deepstorm-discuss` 流程
- **AND** MUST NOT 阻止修改（仅警告）

#### Scenario: 普通文件放行
- **WHEN** 修改的文件不在保护列表和告警列表中
- **THEN** hook SHALL 静默退出（exit 0）

### Requirement: 开发流程强制门禁

DeepStorm 自身开发环境在 Write/Edit 操作前 SHALL 有一个不可协商的开发流程提示。

#### Scenario: Write/Edit 前提示 deepstorm-discuss
- **WHEN** 即将执行 Write 或 Edit 操作
- **THEN** 新增的 prompt hook SHALL 输出提示："You are about to write or edit a file in the DeepStorm project. DeepStorm development requires discussing changes before implementing them. Have you gone through /deepstorm-discuss first?"
- **AND** timeout SHALL 为 5 秒（快速提醒，不阻断流程）

### Requirement: 自动测试（run-tests）

DeepStorm 自身开发环境 SHALL 配置 PostToolUse 和 Stop hooks，编辑代码后自动运行所属包的测试。

#### Scenario: 编辑后自动检测包并测试
- **WHEN** Edit/Write 操作涉及 `*.ts` 文件
- **THEN** hook SHALL 根据文件路径检测所属包（cli/reef/sweep/tide/atoll），使用 `pnpm --filter` 运行对应包的测试
- **AND** SHALL 以异步模式执行（`async: true`），不阻塞后续操作
- **AND** SHALL 设置 30 秒超时，超时后放行不阻塞

#### Scenario: 无法识别包时回退
- **WHEN** 无法根据文件路径识别所属包
- **THEN** hook SHALL 回退到运行 CLI 包测试（`packages/cli`）
- **AND** SHALL 输出提示说明正在运行默认测试

#### Scenario: 退出时测试
- **WHEN** Stop 事件触发（用户退出会话）
- **THEN** hook SHALL 运行测试并输出结果
- **AND** MUST return `{ decision: "approve", continue: true }`，不阻止退出

#### Scenario: 测试失败不中断流程
- **WHEN** 测试执行失败（非零退出码）
- **THEN** hook SHALL 输出 ❌ 标记到 stderr，但不能导致 hook 非零退出
- **AND** SHALL exit 0 确保不阻塞后续流程

### Requirement: hooks.json 注册完整

根目录 `.claude/hooks.json` SHALL 正确注册所有 hook 脚本到对应的 Claude Code hook 事件。

#### Scenario: 注册所有事件
- **WHEN** 检查 `.claude/hooks.json`
- **THEN** SHALL 包含以下事件配置：
  - `UserPromptSubmit` → intent-detect
  - `PreToolUse` with `"Bash"` matcher → block-dangerous
  - `PreToolUse` with `"Write|Edit"` matcher → protect-files + prompt hook
  - `PostToolUse` with `"Edit|Write"` matcher → run-tests（async）
  - `Stop` → run-tests

#### Scenario: 脚本路径正确
- **WHEN** hooks.json 中的任一 `command` 引用了 hook 脚本
- **THEN** 路径 SHALL 为 `bash .claude/hooks/{name}.sh` 格式（相对于项目根目录）
- **AND** 引用的脚本文件 SHALL 实际存在于 `.claude/hooks/` 目录下
