## Why

当前 AI 代码生成能力已经成熟，开发者的工作重心从"写代码"转向"做选择、澄清需求"。但 AI 辅助开发仍然需要开发者全程在线参与 —— 白天讨论完需求、产出 OpenSpec 后，代码实现阶段仍然需要开发者盯着 AI 逐 task 执行。这意味着开发者无法真正将"实现"环节交给 AI 独立完成。

同时，单次 Claude Code 会话的 context 窗口有限，无法一次性完成所有 tasks。开发者手动排队、逐 task 触发的方式效率低下。

`@deepstorm/pilot` 解决的核心问题是：**让开发者可以"下班后"或"offline 期间"，让 AI 自动读取 OpenSpec，自主完成代码实现和测试，第二天只需验证产出即可。**

## What Changes

- **新增 `@deepstorm/pilot` 包** — 一个 CLI Harness Agent，通过 spawn `claude` CLI 进程自动实现 OpenSpec tasks
- **新增 CLI 子命令组 `pilot`**：
  - `pilot run` — 启动/恢复指定项目的自动实现流程（支持 detach 后台运行）
  - `pilot status` — 查看项目各 task 的执行状态
  - `pilot log` — 查看实时日志
  - `pilot stop` — 停止指定项目的运行
  - `pilot resume` — 恢复已中断的被跳过或失败的 task
- **新增 Daemon 进程管理** — `pilot run` 启动守护进程，后台管理 claude 子进程
- **新增 State Store** — 项目级状态持久化，支持中断后恢复
- **新增 Monitor** — 运行时监控：进程存活、token 消耗、超时检测
- **新增 Retry / Failover 机制** — 每个 task 最多 3 次重试，相同错误不重复，token 预算上限控制
- **新增 CLI 仪表盘** — 命令行查看 task 级进度（表格）、日志追踪

## Capabilities

### New Capabilities

- `pilot-run`：指定任务目录、spawn claude 进程、单项目串行执行、互斥锁防重复启动、detach 后台运行模式
- `state-persistence`：项目级运行状态持久化（JSON），包括 task 状态、重试计数、token 消耗、时间记录；支持进程中断后从断点恢复
- `progress-monitor`：监控 claude 进程存活（心跳）、单个 task token 消耗、执行超时、静默检测（长时间无输出）
- `retry-failover`：按 task 粒度的重试逻辑（最多 3 次），相同错误重复出现判为不可恢复，token 预算硬上限强制跳过，跳过 task 记录失败原因
- `cli-dashboard`：`pilot status` 输出 task 级进度表格，`pilot log` 查看实时日志，`pilot stop` 停止运行，`pilot resume` 恢复跳过/失败的 task

### Modified Capabilities

- 无（全新工具，无已有 capability 变更）

## Impact

- **新增包**：`packages/pilot/` — 独立的 npm 包 `@deepstorm/pilot`
- **新增 CLI 入口**：`packages/cli/` 新增 `pilot` 子命令组
- **新增依赖**：可能需要 Node.js child_process 管理、进程通信、文件监控相关依赖
- **CLI 注册**：`@deepstorm/pilot` 注册到 `@deepstorm/cli` 的命令树中
- **文档**：新增使用文档和架构说明
- **无 breaking changes**：不修改现有套件行为
