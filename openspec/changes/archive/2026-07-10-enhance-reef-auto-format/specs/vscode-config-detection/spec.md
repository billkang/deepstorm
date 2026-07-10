## ADDED Requirements

### Requirement: VS Code 配置自动检测
reef-auto-format hook SHALL 在每次执行格式化前检测项目根目录的 `.vscode/settings.json`，解析其中与格式化相关的配置项，据此决定格式化策略。

#### Scenario: 项目存在 .vscode/settings.json
- **WHEN** 项目根目录存在 `.vscode/settings.json`
- **THEN** hook 解析该文件中的 `editor.defaultFormatter`、`editor.formatOnSave`、`editor.codeActionsOnSave` 配置项

#### Scenario: 检测到 Prettier 为默认格式化器
- **WHEN** `.vscode/settings.json` 中 `editor.defaultFormatter` 包含 `"esbenp.prettier-vscode"` 且 `editor.formatOnSave` 为 `true`
- **THEN** hook 启用 Prettier 格式化步骤

#### Scenario: 检测到 organizeImports 配置
- **WHEN** `.vscode/settings.json` 中 `editor.codeActionsOnSave.source.organizeImports` 为 `true`
- **THEN** hook 启用 organize imports 步骤

#### Scenario: 项目不存在 .vscode/settings.json 或配置不完整
- **WHEN** 项目根目录不存在 `.vscode/settings.json`，或缺少相关格式化配置项
- **THEN** hook 回退到 wizard.json 中的配置项决定格式化策略；如果 wizard.json 也没有配置，则保持当前行为（仅 eslint --fix）

### Requirement: VS Code 配置与 wizard.json 的优先级
VS Code 配置检测 SHOULD 优先于 wizard.json 配置。wizard.json 作为 fallback。

#### Scenario: 两者都有时的行为
- **WHEN** `.vscode/settings.json` 和 `wizard.json` 中都有格式化配置
- **THEN** hook 优先使用 `.vscode/settings.json` 的配置，wizard.json 的相应配置被覆盖

#### Scenario: 两者都没有配置
- **WHEN** 既没有 `.vscode/settings.json` 也没有 wizard.json 中的格式化配置
- **THEN** hook 保持当前行为：仅 eslint --fix（TS/JS）、ruff format / black（Python）、google-java-format（Java）

### Requirement: 配置缓存
hook SHOULD 缓存 VS Code 配置检测结果，避免每次 Write/Edit 都重新解析 JSON 文件。

#### Scenario: 配置缓存生效
- **WHEN** hook 在同一 Claude Code session 中多次触发
- **THEN** 仅在首次解析 `.vscode/settings.json`，后续使用缓存结果，除非文件被修改
