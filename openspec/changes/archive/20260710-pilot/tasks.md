## 1. 项目脚手架

- [x] 1.1 创建 `packages/pilot/` 目录结构和 `package.json`（`@deepstorm/pilot`）
- [x] 1.2 创建 `tsconfig.json` 和基础构建配置
- [x] 1.3 创建 `src/index.ts` 公共 API 入口文件
- [x] 1.4 创建 `src/config/schema.ts` — `pilot.config.json` 配置类型定义
- [x] 1.5 创建 `src/config/loader.ts` — 配置文件加载逻辑（默认值、项目级覆盖）

## 2. 状态持久化（State Store）

- [x] 2.1 创建 `src/state/types.ts` — 完整 TypeScript 类型定义（State、TaskState、ErrorRecord、RunSummary）
- [x] 2.2 创建 `src/state/store.ts` — 状态文件读写：`loadState()`、`saveState()`、原子写入（temp + rename）
- [x] 2.3 实现 `updateTask()` — 更新单个 task 状态并持久化
- [x] 2.4 实现状态恢复逻辑：从 `pilot-state.json` 恢复、`running` → `pending` 重置

## 3. 单例进程锁（Singleton Lock）

- [x] 3.1 创建 `src/daemon/lock.ts` — PID 文件锁：`acquireLock()`、`releaseLock()`、`isLockActive()`
- [x] 3.2 实现锁的 PID 验证：检查锁文件中 PID 是否存活（`process.kill(pid, 0)`）
- [x] 3.3 实现 stale 锁清理：PID 不存活时自动移除旧锁
- [x] 3.4 实现进程退出时的锁自动释放（`process.on('exit')` + `SIGTERM`/`SIGINT` handler）

## 4. Daemon 核心 — 编排器（Orchestrator）

- [x] 4.1 创建 `src/daemon/orchestrator.ts` — 主编排循环：读取 tasks、串行遍历、状态更新
- [x] 4.2 实现 OpenSpec tasks 读取：解析 `tasks.md` 中的 `- [ ]` 清单、识别分组和 task ID
- [x] 4.3 实现 prompt 组装：将 task 描述 + spec 要求 + 约束合并为 claude 输入 prompt
- [x] 4.4 实现 task 完成标记检测：从 claude stdout 中匹配 `##TASK_COMPLETE`/`##TASK_STUCK`
- [x] 4.5 创建 `src/daemon/claude-process.ts` — Claude CLI 的 spawn/kill/stdout 流式读取
- [x] 4.6 实现 claude 进程的管道管理：stdout/stderr 捕获、日志写入、自动应答（yes）
- [x] 4.7 实现 daemon IPC 通道：CLI ↔ daemon 的 `process.send()` / `process.on('message')` 通信
- [x] 4.8 创建 `src/daemon/index.ts` — daemon 入口文件（fork 目标），组装所有模块

## 5. 监控（Monitor）

- [x] 5.1 创建 `src/monitor/heartbeat.ts` — 进程心跳检查：每 30s 验证子进程存活
- [x] 5.2 创建 `src/monitor/token-tracker.ts` — Token 消耗追踪：从 claude 输出解析 token 数据、累加到 task
- [x] 5.3 创建 `src/monitor/silence-detector.ts` — 静默检测：记录最后输出时间、超过阈值触发超时
- [x] 5.4 创建 `src/monitor/dead-loop-detector.ts` — 死循环检测：MD5 指纹 + 连续 3 次相同判定

## 6. 重试与故障转移（Retry / Failover）

- [x] 6.1 创建 `src/retry/classifier.ts` — 错误分类器：根据错误文本匹配预定义模式（compilation/test/timeout/dead_loop/process_crash）
- [x] 6.2 创建 `src/retry/handler.ts` — 重试编排：`handleRetry()` 判断是否重试、指纹比较、backoff 等待
- [x] 6.3 实现相同错误指纹检测：MD5 比较、失败次数不超过 3 次、相同指纹立即终止
- [x] 6.4 实现 token 预算检查：超限时 skip task、记录 `token_overbudget` 错误

## 7. CLI 命令 — pilot run

- [x] 7.1 创建 `src/cli/run.ts` — `pilot run` 命令处理：参数解析（`--project`、`--detach`/`-d`）
- [x] 7.2 实现 run 流程：锁定 → 加载/初始化状态 → fork daemon → 返回 PID
- [x] 7.3 实现前台模式：直接在当前进程执行（不 fork），实时输出到 stdout
- [x] 7.4 实现 daemon 模式：fork 后 CLI 进程退出、daemon 后台运行

## 8. CLI 命令 — pilot status / log / stop / resume

- [x] 8.1 创建 `src/cli/status.ts` — `pilot status` 命令：读取 state 输出 task 级进度表格
- [x] 8.2 创建 `src/cli/log.ts` — `pilot log` 命令：`--task` 过滤、`--follow` 实时追踪、`[task-id] [timestamp]` 前缀
- [x] 8.3 创建 `src/cli/stop.ts` — `pilot stop` 命令：读锁文件 → SIGTERM daemon → 等待退出 → 清理
- [x] 8.4 实现 `--force` 模式：SIGKILL + 直接清理锁文件
- [x] 8.5 创建 `src/cli/resume.ts` — `pilot resume` 命令：重置 failed/skipped task → 重启执行
- [x] 8.6 实现 resume 特定 task：`--task <id>` 只重置指定 task

## 9. CLI 集成

- [x] 9.1 创建 `src/cli/register.ts` — 将 pilot 命令组注册到 `@deepstorm/cli` 的命令树
- [x] 9.2 更新 `packages/cli/src/index.ts` — 注册 pilot 子命令
- [x] 9.3 实现前置检查：`pilot run` 验证 claude CLI 是否可用、OpenSpec 结构是否存在
- [x] 9.4 pnpm-workspace.yaml 已包含 `packages/*`，pilot 自动注册

## 10. 执行摘要报告

- [x] 10.1 实现完成摘要生成：执行时间、succ/fail/skip 计数、总 token 消耗、失败详情
- [x] 10.2 写入 `pilot-summary.md` 到项目 `.deepstorm/` 目录
- [x] 10.3 添加 resume 指引到摘要尾部（列出所有 failed/skipped task 及错误原因）

## 11. 测试

- [x] 11.1 编写 state store 单元测试：读写、原子写入、崩溃恢复
- [x] 11.2 编写 lock 单元测试：获取/释放、重复获取拒绝、stale 清理
- [x] 11.3 编写 error classifier 单元测试：各类型错误模式匹配
- [x] 11.4 编写 retry handler 单元测试：重试计数、fingerprint 检测、backoff
- [x] 11.5 编写 monitor 单元测试：heartbeat、token tracker、silence、dead loop
- [x] 11.6 编写 CLI 命令单元测试：参数解析、状态表格输出、命令注册
- [x] 11.7 编写 orchestrator 集成测试：task 解析、prompt 构建、完成标记检测
