## Why

DeepStorm CLI 开发目前有单元测试（vitest）覆盖函数级逻辑，但缺少对构建后的产物（dist/）在真实项目（playground）中的端到端验证环节。改代码 → 单元测试通过 → build 后，构建物是否能在 playground 中正常工作完全靠手动验证，退化无感知。需要一个规范化的验证流程，确保每次构建后的 CLI 在 playground 环境中的各命令可正常运行。

## What Changes

### 新增
- 新增 `playground/scripts/verify-cli.sh`：E2E 验证脚本，黑盒测试各 CLI 命令
- 完善 `playground/test-fixtures/`：添加各命令所需的 fixture 文件
- `package.json` 增加 `playground:verify` script 快捷入口
- 在开发工作流中增加构建后验证环节（build → verify → merge）

### 代码修改（packages/cli）

- **`update.ts` 版本检查增强**：
  - 新增 `getRegistryUrl()`：支持 `DEEPSTORM_REGISTRY_URL` 环境变量覆盖 npm registry URL
  - 新增 `readLocalRegistryFile()`：支持本地文件路径读取版本信息，无需联网
  - 新增 `parseVersionResponse()`：提取公共版本号解析逻辑
  - 网络错误提示由"fetch failed"改进为中文可读提示，附带 registry URL
  - 模板同步执行优先级高于版本检查（同步为主，版本检查为辅助信息）
- **`update.ts` 自动更新命令可配置**：
  - 新增 `DEEPSTORM_UPDATE_CMD` 环境变量覆盖 `npm install -g` 命令，便于本地 mock 测试
- **`update.test.ts`**：测试断言同步更新

## Capabilities

### New Capabilities
- `cli-verify`: CLI 构建物验证。通过 Shell 脚本执行 playground 中的已构建 CLI，检查各命令正常退出、输出符合预期。支持 L0 快速冒烟（每次 build 后执行）和 L1 全量验证（手动触发）两种模式。退出码语义为后续 CI gate 做准备。

### Modified Capabilities
<!-- 无需修改已有 capability -->

## Impact

- `playground/`: 新增 `scripts/verify-cli.sh`，`test-fixtures/` 添加新 fixture
- `packages/cli/`: `update.ts` + `update.test.ts` 增强
- 文档（CLAUDE.md）：开发工作流章节新增构建后验证环节
- 开发者工作流：`pnpm build && pnpm playground:verify` 成为标准流程
