# Brainstorming Session

- **日期**: 2026-07-10
- **主题**: `@deepstorm/pilot` — OpenSpec 实现自动编排 Harness
- **参与角色**: 开发者（需求方）

## 讨论内容

### 核心动机

当前开发范式发生巨大变化：开发人员更多在做选择和澄清需求，代码生成交给 AI 处理。目标是让开发者：

> **Day 1（讨论）**: 与 AI 讨论和澄清需求，产出 OpenSpec 文档
> **Auto（自动实现）**: Claude Code 读取 OpenSpec，逐个自动完成编码
> **Day 2（验证）**: 开发者验证需求是否被正确实现

### 关键设计决策

| 维度 | 决策 |
|------|------|
| **工具性质** | 新的 CLI 命令 / Harness Agent（非 skill） |
| **命名** | `@deepstorm/pilot` |
| **运行位置** | 开发者本地机器 |
| **驱动方式** | spawn `claude` CLI 进程（DeepSeek 模型，无需额外认证） |
| **输入格式** | 只认 OpenSpec（tasks.md + specs/ + design.md） |
| **执行模式** | `pilot run --project <dir>` → spawn 1 个 claude 进程，单项目串行 |
| **多项目并行** | 每个项目开一个终端窗口运行 `pilot run`，互不干扰 |
| **防重复启动** | 通过文件锁检测项目是否已有 pilot 在运行，有则拒绝 |
| **后台运行** | 支持 daemon 模式，detach 后在后台执行 |
| **状态查看** | CLI 命令查看 task 级执行状态、日志追踪 |
| **失败处理** | 编译错误/超时最多 3 次重试，相同错误重复出现不重试 |
| **Token 控制** | 每个 task 设预算上限，超限跳过 |
| **跳过处理** | 跳过任务记录失败原因，第二天开发者手动修复后触发重跑 |

### 架构设想

```
CLI 命令层:
  run           → 启动/恢复项目运行（支持 detach）
  status        → 查看各项目 task 级状态
  log           → 查看实时日志
  stop          → 停止指定项目的运行

Daemon 层（后台常驻）:
  - Singleton Lock（PID 文件锁，防止重复启动）
  - Orchestrator（管理 claude 进程、重试、超时、Token）
  - State Store（pilot-state.json，可中断恢复）
  - Monitor（每 30s 探测进程存活/心跳）

监控界面:
  - CLI status 命令（task 级进度表格）
  - 日志查看（每个 task 的输出）
```

### 失败处理策略

```
失败类型:
  - 编译/语法错误     → 可重试（AI 通常能自行修复）
  - 测试不通过        → 可重试（限次）
  - API 超时          → 可重试（加 backoff）
  - 逻辑死循环         → 不应重试，硬性判定（⚠️ 防止费用失控）
  - Token 超支         → 立即跳过
  - 上下文溢出         → 自动拆分 task

兜底:
  - 重试计数器按 task 维度
  - 相同错误重复出现（即使还在 3 次内）→ 判为不可恢复
  - 每个 task 设定预期 token 消耗 × 3 的硬性天花板
```

### 范围界定

**包含:**
- 夜间无人在场时自动执行 OpenSpec tasks
- 生成代码、运行测试、输出执行报告（Run Report）
- 支持 tide / reef / sweep / atoll 四套件的任务链

**不包含（第一版）:**
- CI/CD 触发（后续版本）
- 远程执行环境（后续版本）
- 图形化 UI 仪表盘（先做 CLI+TUI）
- 非 OpenSpec 格式的任务输入

### 关键问题

- 命名是否确认为 `pilot`？是否有更贴切的名称？
- CLI 和 Daemon 的通信方式（Unix socket / 信号 / HTTP localhost）？
- 是否需要 TUI 仪表盘（如 `pilot dashboard` 全屏 UI）？

## 后续步骤

1. 进入 OpenSpec 创建变更 → `openspec/new pilot`
2. 产出 proposal → specs → design → tasks
