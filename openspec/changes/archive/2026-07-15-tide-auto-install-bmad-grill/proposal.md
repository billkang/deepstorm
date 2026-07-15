## Why

各套件依赖的前置工具（BMAD Method、grill-me、Playwright 浏览器等）当前需要用户手动安装，流程割裂、容易遗漏。在安装向导结束时自动完成这些依赖的安装，可以降低上手成本，确保套件功能开箱即用。

## What Changes

- **新增**：`packages/cli/src/commands/setup.ts` 在安装向导末尾新增步骤，检测用户选择了哪些套件并安装对应的前置依赖
- **新增**：选中 Tide 时，自动执行 `npx bmad-method install` 安装 BMAD Method
- **新增**：选中 Tide 时，自动从指定 GitHub 仓库克隆 grill-me SKILL.md 到 `.claude/skills/grill-me/`
- **新增**：选中 Sweep 且 E2E 框架选了 Playwright 时，自动执行 `npx playwright install` 安装浏览器
- **新增**：安装失败时的错误处理——提示用户手动安装或使用 `deepstorm setup` 重试
- **新增**：幂等检测——已安装时跳过

## Capabilities

### New Capabilities

- `tide-auto-install`: Tide 安装时自动安装 BMAD Method 和 grill-me 前置依赖的能力
- `sweep-auto-install`: Sweep 安装时自动安装 Playwright 浏览器等前置依赖的能力

### Modified Capabilities

（无）

## Impact

- `packages/cli/src/commands/setup.ts`：安装流程末尾新增步骤
- `packages/tide/wizard.json`：可选的元数据配置
- `packages/sweep/wizard.json`：可选的元数据配置
- 用户端运行 `deepstorm setup` 并选择 Tide/Sweep 时，行为变化（自动安装前置依赖）
