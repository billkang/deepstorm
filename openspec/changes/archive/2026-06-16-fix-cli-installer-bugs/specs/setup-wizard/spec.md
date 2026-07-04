# setup-wizard Specification

This is a delta spec for the `setup-wizard` capability. Only modified requirements are listed below; all other requirements from the base spec remain unchanged.

## MODIFIED Requirements

### Requirement: 合并 hooks（按需安装）

CLI SHALL 在安装 hooks 时使用 `mergeHooks()` 函数合并到目标 `hooks.json`，而非简单复制。`shouldInstallGlobalHooks` 的 gating 逻辑保持不变（仅当选中的工具列表包含 hooks 声明时才触发）。

#### Scenario: 合并 hooks 到已有文件
- **WHEN** 用户选中多个工具，且首个工具的安装过程已创建了 `hooks.json`
- **THEN** CLI SHALL 使用 `mergeHooks()` 将后续工具的 hook 配置合并到已有 `hooks.json`
- **THEN** 已有 hook 条目 SHALL 完整保留
- **THEN** hook 条目 SHALL 不产生重复

#### Scenario: 首次安装 hooks
- **WHEN** `.claude/hooks/hooks.json` 尚未存在
- **THEN** CLI SHALL 调用 `mergeHooks()` 创建该文件
- **THEN** `mergeHooks()` 从 `dist/hooks/hooks.json` 读取 incoming hooks 并写入目标路径
