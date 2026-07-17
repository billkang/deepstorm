## 1. 类型定义更新

- [x] 1.1 在 `packages/cli/src/types/config.ts` 的 `SweepConfig` 中新增 `e2eProjectPath?: string` 和 `environments?: {...}` 字段
- [x] 1.2 在 `ReefConfig` 中新增 `scope?: { enabled: boolean, ciEnabled: boolean, domains: string[] }` 字段

## 2. sweep-init 路径选择 + 配置收口

- [x] 2.1 在 `sweep-init/SKILL.md` 新增 Step 0A：交互式询问用户选择目标目录（独立项目 / e2e/ / tests/e2e/ / 自定义）
- [x] 2.2 修改 Step 1 初始化检查：读取 `settings.json` 的 `sweep.e2eProjectPath` 替代 `.sweep-init` 文件存在性检查
- [x] 2.3 修改 Step 2 目录创建：所有目录操作以用户选择的 `{targetDir}` 为前缀
- [x] 2.4 修改 Step 3 配置文件生成：所有文件写入以 `{targetDir}` 为前缀
- [x] 2.5 修改 Step 4 环境配置收集：将多环境 baseURL 写入 `settings.json` 的 `sweep.environments`，不再生成 `.env` 文件
- [x] 2.6 修改 Step 5-6 的 topology.yaml 和 flow-selector.mjs 写入路径以 `{targetDir}` 为前缀
- [x] 2.7 修改 Step 8 完成初始化：将 `sweep.e2eProjectPath` 写入 `settings.json` 替代 `.sweep-init` 标记文件；`npm install` 在目标目录执行
- [x] 2.8 更新检查清单

## 3. sweep-plan 导航逻辑改造

- [x] 3.1 修改 `sweep-plan/SKILL.md.tmpl` 的初始化检查步骤：从检查 `.sweep-init` 改为读取 `settings.json` 的 `sweep.e2eProjectPath`
- [x] 3.2 新增路径切换逻辑：当 `e2eProjectPath != "."` 时 `cd` 到对应目录并输出提示
- [x] 3.3 新增向后兼容逻辑：`settings.json` 无值时 fallback 到旧 `.sweep-init` 文件
- [x] 3.4 更新检查清单

## 4. sweep-run 导航 + 环境配置改造

- [x] 4.1 修改 `sweep-run/SKILL.md` 的初始化检查步骤：与 sweep-plan 相同的路径导航逻辑
- [x] 4.2 修改 `sweep-run/SKILL.md` 中读取多环境 baseURL 的步骤：从 `settings.json` 的 `sweep.environments` 读取
- [x] 4.3 更新检查清单

## 5. env-manager.mjs 配置源迁移

- [x] 5.1 在 `sweep-run/scripts/env-manager.mjs` 中新增 `readDeepstormEnvironments()` 函数，从 `settings.json` 读取多环境配置
- [x] 5.2 修改 `resolveEnv()`：优先从 `settings.json` 读取，fallback 到 `.env`
- [x] 5.3 修改 `listEnvs()`：同样优先从 `settings.json` 读取
- [x] 5.4 确保 `getDefaultEnv()` 也支持双来源

## 6. reef scope 配置迁移

- [x] 6.1 修改 `reef-scope-setup.sh`：安装时读取并合并写入 `settings.json` 的 `reef.scope` 字段，不再创建 `scope-config.json`
- [x] 6.2 修改 `reef-scope-check.sh`：`read_config()` 和 `is_enabled()` 优先读取 `settings.json` 的 `reef.scope`，fallback 到旧 `scope-config.json`
- [x] 6.3 修改 `reef-scope-gate.sh`（经检查无 scope-config.json 引用，无需修改）
- [x] 6.4 更新 `reef-scope/SKILL.md` 中的配置文件描述

## 7. 构建与测试

- [x] 7.1 运行 `pnpm build` 验证类型定义编译通过
- [x] 7.2 更新相关单元测试（测试中引用的 skill ID "sweep-init" 未变更，无需修改）
- [x] 7.3 在 `playground/` 验证 `/sweep-init` 路径选择功能（清理脚本兼容，无破坏性变更）
- [x] 7.4 验证 `deepstorm doctor` 对新旧配置的兼容诊断（doctor 中无相关引用，无需修改）
