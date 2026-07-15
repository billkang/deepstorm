## ADDED Requirements

### Requirement: Sweep + Playwright 被选中时自动安装 Playwright 浏览器
当用户通过 `deepstorm setup` 选择 Sweep 套件且 E2E 框架选择了 Playwright 时，系统 SHALL 在安装向导末尾自动执行 `npx playwright install`。

#### Scenario: 首次安装 Playwright 浏览器成功
- **WHEN** 向导结束时，用户已选择 Sweep 套件且 E2E 框架为 Playwright
- **THEN** 系统在 Sweep 对应的项目目录下执行 `npx playwright install`
- **THEN** 安装成功后显示 `✔ Playwright 浏览器已安装`

#### Scenario: Playwright 浏览器已安装
- **WHEN** Playwright 浏览器已存在（`npx playwright install` 检测已安装）
- **THEN** 系统跳过安装（幂等）
- **THEN** 显示 `ℹ Playwright 浏览器已存在，跳过安装`

#### Scenario: Playwright 浏览器安装失败
- **WHEN** `npx playwright install` 执行失败（网络错误、权限不足等）
- **THEN** 系统捕获错误，显示 `⚠ Playwright 浏览器安装失败，请手动执行 npx playwright install`
- **THEN** 安装流程继续，不中断向导

### Requirement: Sweep 未选 Playwright 时不触发安装
当用户选择 Sweep 但未选择 Playwright E2E 框架时，系统 SHALL NOT 触发 Playwright 浏览器的安装。

#### Scenario: 选择 Sweep 但未选 Playwright
- **WHEN** 用户选择 Sweep，但 E2E 框架不是 Playwright
- **THEN** 系统跳过 Playwright 浏览器安装
- **THEN** 安装流程正常结束

### Requirement: 自动安装步骤位于向导末尾
Playwright 浏览器自动安装 SHALL 发生在安装向导所有其他步骤（MCP 配置、skill 安装等）完成之后，与 bmad/grill-me 安装并列。

#### Scenario: 多套件安装顺序
- **WHEN** 用户同时选择了 Tide 和 Sweep
- **THEN** 向导末尾先执行 bmad-method 和 grill-me 的安装（Tide 依赖）
- **THEN** 再执行 Playwright 浏览器的安装（Sweep 依赖）
- **THEN** 所有安装完成后向导结束
