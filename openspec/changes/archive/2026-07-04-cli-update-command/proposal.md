## Why

`@deepstorm/cli` 目前没有检查 npm 最新版本并更新自身的功能，用户无法感知是否有新版本可用。同时 `template upgrade` 作为独立子命令，语义上与 CLI 更新的场景分离，用户需要分别运行多个命令完成"检查更新"的预期操作。通过统一为 `deepstorm update` 命令，降低用户心智负担。

## What Changes

- **新增** `deepstorm update` 命令，替代 `template upgrade` 的功能并扩展 CLI 自更新能力
- **新增** `deepstorm update --check` 查看版本信息（仅检查，不执行任何更新）
- **新增** `deepstorm update --cli` 检查 npm 最新版本并执行 `npm install -g @deepstorm/cli`
- **新增** `deepstorm update --skills` 同步 skill 模板（取代 `template upgrade`，行为一致）
- **移除** `deepstorm template upgrade` 子命令（功能合并到 `update --skills`）
- **修复** `index.ts` 中硬编码的 `program.version('0.1.0')`，改为从 `package.json` 读取实际版本
- `deepstorm doctor` 输出的版本信息保持不变

## Capabilities

### New Capabilities
- `cli-self-update`: 检查 npm registry 上 `@deepstorm/cli` 的最新版本，与本地版本比对，支持仅检查模式和实际更新模式

### Modified Capabilities
- `template-management`: 将 `template upgrade` 命令路径迁移到 `update --skills`，保留原有行为（同步官方更新、不覆盖用户修改）

## Impact

- `packages/cli/src/commands/`: 新增 `update.ts`，移除或废弃 `template-upgrade.ts`（功能内联到 update 命令）
- `packages/cli/src/commands/template.ts`: 移除 `upgrade` 子命令注册
- `packages/cli/src/index.ts`: 注册 `update` 命令，修复硬编码版本号
- `packages/cli/package.json`: 无新增运行时依赖（`https`/`fetch` 为 Node.js 内置）
