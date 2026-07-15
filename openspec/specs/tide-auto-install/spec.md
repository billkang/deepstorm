## ADDED Requirements

### Requirement: Tide 被选中时自动安装 BMAD Method
当用户通过 `deepstorm setup` 选择 Tide 套件时，系统 SHALL 在安装向导末尾自动执行 `npx bmad-method install`。

#### Scenario: 首次安装 BMAD Method 成功
- **WHEN** 向导结束且用户已选择 Tide 套件
- **THEN** 系统执行 `npx bmad-method install`
- **THEN** 安装成功后显示 `✔ BMAD Method 已安装`

#### Scenario: BMAD Method 已安装
- **WHEN** 向导结束且 `.claude/skills/bmad-*` 或 `_bmad/` 目录已存在（bmad 已安装）
- **THEN** 系统跳过安装（幂等），检测方式为执行 `npx bmad-method status`
- **THEN** 显示 `ℹ BMAD Method 已存在，跳过安装`

#### Scenario: BMAD Method 安装失败
- **WHEN** `npx bmad-method install` 执行失败（网络错误、权限不足等）
- **THEN** 系统捕获错误，显示 `⚠ BMAD Method 安装失败，请手动执行 npx bmad-method install`
- **THEN** 安装流程继续，不中断向导

### Requirement: Tide 被选中时自动安装 grill-me skill
当用户通过 `deepstorm setup` 选择 Tide 套件时，系统 SHALL 在安装向导末尾自动从指定仓库安装 grill-me skill。

#### Scenario: 首次安装 grill-me 成功
- **WHEN** 向导结束且用户已选择 Tide 套件
- **THEN** 系统从 `https://github.com/mattpocock/skills` 获取 grill-me SKILL.md
- **THEN** 文件写入 `.claude/skills/grill-me/SKILL.md`
- **THEN** 安装成功后显示 `✔ grill-me skill 已安装`

#### Scenario: grill-me 已安装
- **WHEN** `.claude/skills/grill-me/SKILL.md` 已存在
- **THEN** 系统跳过安装
- **THEN** 显示 `ℹ grill-me 已存在，跳过安装`

#### Scenario: grill-me 安装失败
- **WHEN** 从 GitHub 获取 SKILL.md 失败（网络错误、仓库不可达等）
- **THEN** 系统捕获错误，显示 `⚠ grill-me 安装失败，请手动安装 https://github.com/mattpocock/skills`
- **THEN** 安装流程继续，不中断向导

### Requirement: 非 Tide 场景不触发自动安装
当用户未选择 Tide 套件时，系统 SHALL NOT 触发 bmad 或 grill-me 的安装。

#### Scenario: 仅选择 Reef/Sweep/Atoll
- **WHEN** 用户未选择 Tide 套件
- **THEN** 系统跳过 bmad 和 grill-me 的安装步骤
- **THEN** 安装流程正常结束

### Requirement: 自动安装步骤位于向导末尾
自动安装 BMAD Method 和 grill-me SHALL 发生在安装向导所有其他步骤（MCP 配置、skill 安装等）完成之后。

#### Scenario: 安装顺序正确
- **WHEN** 向导结束前
- **THEN** MCP 服务、skill、agent、hook 等安装步骤先执行
- **THEN** 最后执行 bmad 和 grill-me 的安装
