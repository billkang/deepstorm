## ADDED Requirements

### Requirement: Prettier 自动格式化
reef-auto-format hook SHALL 在 Write/Edit 后自动检测项目是否配置了 Prettier，若有则执行 `prettier --write` 对文件进行格式化。

#### Scenario: 项目有 .prettierrc 配置文件
- **WHEN** 项目根目录存在 `.prettierrc` / `.prettierrc.json` / `.prettierrc.yaml` / `.prettierrc.toml` / `prettier.config.js` / `.prettierrc.js` 之一
- **THEN** hook 自动运行 `npx prettier --write "$filepath"`

#### Scenario: 项目没有 Prettier 配置
- **WHEN** 项目根目录不存在任何 Prettier 配置文件
- **THEN** hook 跳过 Prettier 格式化步骤，不报错

#### Scenario: Prettier 执行失败
- **WHEN** `prettier --write` 执行返回非零退出码
- **THEN** hook 输出警告信息到 stderr，不阻塞后续格式化步骤

### Requirement: 格式化顺序
Prettier 格式化 SHOULD 在 ESLint fix 之前执行（如果 ESLint 先于 Prettier 执行，ESLint 的格式化修复会被 Prettier 覆盖，导致 diff 膨胀）。

#### Scenario: 多个格式化工具的执行顺序
- **WHEN** 同一个文件同时匹配 Prettier 和 ESLint 的条件
- **THEN** hook 先执行 `prettier --write`，再执行 `eslint --fix`

### Requirement: Prettier 版本兼容
hook SHOULD 使用项目本地安装的 Prettier（通过 `npx prettier`），而非全局安装。

#### Scenario: 使用项目本地 Prettier
- **WHEN** hook 执行 Prettier 格式化
- **THEN** 使用 `npx prettier --write` 确保使用项目的 `node_modules/.bin/prettier` 版本

### Requirement: Prettier 禁用配置
用户 SHOULD 能通过 wizard.json 配置项禁用 Prettier 自动格式化，即使项目存在 Prettier 配置。

#### Scenario: wizard.json 配置禁用 Prettier
- **WHEN** wizard.json 中 `reef.formatter.prettier.enabled` 为 `false`
- **THEN** hook 跳过 Prettier 格式化步骤，即使检测到 Prettier 配置文件
