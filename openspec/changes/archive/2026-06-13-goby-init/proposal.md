## Why

Sweep 是 DeepStorm 测试侧套件，目前仅有骨架结构。为让测试工程师在 AI 编程时代能用工程化方法管理 E2E 测试流程，需要充实 Sweep 的核心能力。

## What Changes

- **新增三个 skill**：setup、flow-create、flow-run
- **新增钉钉 MCP 读取能力**：用于获取 PRD 验收标准
- **更新 README**：补充使用说明
- **不涉及 agents/hooks**（MVP 阶段纯 skills）
- **不涉及 CI 集成**（第二期考虑）

## Capabilities

### New Capabilities

- `e2e-setup`: 基于 Playwright 初始化 E2E 测试项目骨架。创建目录结构、生成 playwright.config.ts（含多环境 baseURL 配置）、写入 .env 模板、配置 Playwright MCP。运行后项目可直接用于编写和执行 E2E 测试流程。对其他两个 skill 是硬性前置条件——未初始化时调用其他 skill 会报错引导。

- `flow-creation`: 交互式生成 `.flow.md` 测试意图文档。读取钉钉 PRD 获取验收标准，通过结构化对话引导测试工程师覆盖功能流程、边界条件、异常场景。将测试用例和测试执行流程合二为一，同一份文档供评审、手工测、AI 自动执行三种场景使用。支持走 OpenSpec change 管理大的流程变更。

- `flow-execution`: 读取 `.flow.md`，通过 Playwright MCP 逐步骤执行，输出实时终端报告并持久化到 `flows/reports/`。支持三级粒度：单文件、单 flow、全量运行。通过 `--env` 参数切换目标环境（test/staging/prod），执行前检查项目是否已初始化。

### Modified Capabilities

（无）

## Impact

- `packages/sweep/` — 新增 skills/ 目录，含三个 skill 子目录
- `packages/sweep/skills/` — 三个 skill 子目录（setup、flow-create、flow-run）
- `packages/sweep/README.md` — 补充完整文档
- 钉钉 MCP 读取能力需在 Claude Code 中配置，Sweep skill 内部通过 MCP 调读取 PRD 内容
- 不影响 tide、reef、atoll 等现有套件
