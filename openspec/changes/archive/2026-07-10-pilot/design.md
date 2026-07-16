## Context

当前 DeepStorm 已具备完整的 OpenSpec 工作流（spec-driven development）：讨论需求 → 产出 proposal/specs/design/tasks → 通过 `/opsx:apply` 由开发者逐 task 引导 AI 实现。但这个过程需要开发者全程在线参与，无法让 AI 独立完成实现。

`@deepstorm/pilot` 要解决的是：**让开发者可以在不值守的情况下，让 AI 自动读取 OpenSpec 并按序实现 tasks。**

### 现有架构

- `@deepstorm/cli`：已注册 tide/reef/sweep/atoll 四个套件的子命令
- `.claude/skills/`：各套件的 SKILL.md，定义了开发工作流
- `openspec/changes/<name>/`：每个 OpenSpec change 的 artifact 目录
- 现有 reef-start skill 是交互式的（需要开发者逐 task 确认），与本工具的自动化定位互补

### 约束

- **不替换现有工作流**：pilot 是 reef-start 的补充，不是替代
- **只认 OpenSpec**：输入必须是 tasks.md + specs/ + design.md，不支持自由格式
- **本地执行**：运行在开发者本地机器，不引入远程执行环境
- **复用现有认证**：开发者已配置好的 Claude Code CLI（已配置 DeepSeek 模型），pilot 不做额外认证

---

## Goals / Non-Goals

**Goals:**

- 提供 `pilot run` 命令，启动 OpenSpec tasks 的自动串行执行
- 提供 daemon 后台运行模式，支持 detach
- 提供进程互斥锁，防止同一项目重复运行
- 提供 JSON 状态持久化，支持中断恢复
- 提供进程心跳监控 + token 消耗追踪 + 超时/静默检测
- 提供 per-task 重试逻辑（最多 3 次），相同错误不重复
- 提供 token 预算硬上限，防止费用失控
- 提供 CLI dashboard（status/log/stop/resume）
- 提供执行摘要报告

**Non-Goals:**

- CI/CD 事件触发（v1 不包含，后续版本可基于本架构扩展）
- 远程/云执行环境（v1 仅本地执行）
- 图形化 UI / Web 仪表盘（仅 CLI + TUI）
- 非 OpenSpec 格式的任务输入
- 多项目并行编排（每个项目独立进程，互不干扰）
- 自动修复跳过/失败的任务（需要开发者手动检查后触发 resume）

---

## Decisions

### Decision 1: 进程模型 — 独立 Daemon 进程 + CLI 通信

**方案对比：**

| 方案 | 说明 | 评价 |
|------|------|------|
| **A. Daemon fork（选定 ✅）** | `pilot run` fork 出一个独立的 Node.js daemon 进程，通过 child_process.fork() 的 IPC 通道与 CLI 通信 | 进程隔离好、不受终端生命周期影响、IPC 原生支持 |
| **B. 同进程线程池** | 在主 CLI 进程中用 Worker Threads 执行 | 主进程退出即终止、不适合 detach |
| **C. 纯 shell 后台 (&)** | 用 shell 的 `&` 或 `nohup` 实现后台 | 缺少进程间通信能力、状态查询困难 |

**选择理由：**
- `child_process.fork()` 内建的 IPC 通道（`process.send()` / `process.on('message')`）使 CLI 命令（status/log/stop）能与 daemon 双向通信
- Daemon 进程与终端生命周期解耦，即使用户关闭终端，daemon 继续运行
- Node.js `process.exit()` 时自动触发 daemon 的 cleanup hook，释放锁文件

### Decision 2: Daemon-CLI 通信 — IPC + 文件状态

**方案对比：**

| 方案 | 说明 | 评价 |
|------|------|------|
| **A. IPC 通道（选定 ✅）** | fork 模式内建的 `message` 事件 + `send()` | 零依赖、低延迟、适合运行时查询 |
| **B. Unix Socket / HTTP localhost** | 启动本地 HTTP server | 增加复杂度、端口冲突处理 |
| **C. 纯文件轮询** | CLI 读取 state.json，daemon 也读取 | 无需 IPC，但需要轮询、延迟高 |

**选择理由：**
- Fork IPC 是最简单直接的方案，不需要额外端口
- 状态文件仍作为后备：即使 daemon 不在运行（已退出），CLI 也能通过读取 state.json 获得最后一次执行状态
- IPC 仅在 daemon 活跃时可用，fallback 到文件读取

### Decision 3: 状态存储 — JSON 文件 + 原子写入

**方案对比：**

| 方案 | 说明 | 评价 |
|------|------|------|
| **A. JSON 文件 + temp+rename（选定 ✅）** | 写入 `.tmp` 后 `fs.renameSync` | 简单、零依赖、满足需求 |
| **B. SQLite** | 使用 better-sqlite3 | 引入编译依赖、复杂度高 |
| **C. 内存 + 定期快照** | 运行时全内存，定期写盘 | 崩溃丢失数据 |

**选择理由：**
- 状态文件小（单个项目最多几十个 task），JSON 完全够用
- `fs.renameSync` 在 macOS/Linux 上是原子操作，防止写入时崩溃导致文件损坏
- 不需要并发写入（单 daemon 单项目串行），无竞争条件
- 零外部依赖

### Decision 4: 错误分类策略

参考 ts-claw 的 `RecoveryManager` 模式，按 error type 分类处理：

| 错误类型 | 是否重试 | 策略 | 原因 |
|---------|---------|------|------|
| compilation | ✅ 是 | 满 3 次，无 backoff | 编译错误 AI 通常能自行修复 |
| test_failure | ✅ 是 | 最多 2 次 | 重试后仍失败说明逻辑错误 |
| timeout | ✅ 是 | 3 次 + exponential backoff | 超时可能由暂时负载导致 |
| process_crash | ✅ 是 | 3 次 + backoff | 偶发进程崩溃 |
| token_overbudget | ❌ 否 | 直接 skip | 重试会消耗更多 token |
| dead_loop | ❌ 否 | 直接 fail | 逻辑死循环，重试无意义 |
| unrecoverable_error | ❌ 否 | 直接 fail | 相同错误重复出现 |

### Decision 5: 死循环检测 — 输出指纹 MD5

参考 ts-claw 的 `ReminderInjector` 模式：

- 每 30s 对最近 10 行 claude 输出计算 MD5 指纹
- 连续 3 次指纹相同 → 判定死循环
- 判定后 SIGTERM → SIGKILL (30s 超时)
- 记录 error type `dead_loop`，不重试

**为什么不用更复杂的检测：** 简单的输出重复检测已经能捕获绝大多数死循环场景。在 token 消耗面前，误报（kill 了正在工作的进程）的成本远低于漏报（token 烧完）。

### Decision 6: Token 预算计算

参考 ts-claw 的 `CostTracker` 模式：

- 每个 task 的 token budget = `defaultTokenBudget × 3`（默认 100K × 3 = 300K）
- 预算在 task 生命周期内累积（不是每次重试刷新）
- 从 claude 输出中解析 token 消耗（claude CLI 会输出 token 使用信息）
- 超过 budget 后 kill 进程并 skip task

### Decision 7: 包组织 — `packages/pilot/` 独立包

```
packages/pilot/
├── src/
│   ├── index.ts                    # Public API: runPilot, getStatus, etc.
│   ├── cli/
│   │   ├── register.ts             # 注册到 @deepstorm/cli 命令树
│   │   ├── run.ts                  # pilot run 命令处理
│   │   ├── status.ts               # pilot status 命令处理
│   │   ├── log.ts                  # pilot log 命令处理
│   │   ├── stop.ts                 # pilot stop 命令处理
│   │   └── resume.ts               # pilot resume 命令处理
│   ├── daemon/
│   │   ├── index.ts                # Daemon entry (fork target)
│   │   ├── orchestrator.ts         # Task orchestrator: read tasks, serialize, dispatch
│   │   └── claude-process.ts       # Claude CLI spawn/kill/monitor
│   ├── state/
│   │   ├── store.ts                # Read/write/atomic update pilot-state.json
│   │   └── types.ts                # TypeScript types for state schema
│   ├── monitor/
│   │   ├── heartbeat.ts            # Process alive check (30s interval)
│   │   ├── token-tracker.ts        # Parse token usage from output stream
│   │   ├── silence-detector.ts     # Output silence monitoring
│   │   └── dead-loop-detector.ts   # MD5 fingerprint comparison
│   ├── retry/
│   │   ├── handler.ts              # Retry orchestration + backoff
│   │   └── classifier.ts           # Error type classification
│   └── config/
│       ├── schema.ts               # pilot.config.json schema
│       └── loader.ts               # Config file loading
├── package.json                    # name: @deepstorm/pilot
└── tsconfig.json
```

**依赖关系：**
- `@deepstorm/cli` 通过 `register.ts` 注册 pilot 子命令组
- pilot 本身不依赖其他 DeepStorm 套件，仅读取 OpenSpec 文件结构
- 外部依赖尽可能少：child_process（内置）、crypto（内置）、fs（内置）

### ts-claw 模式映射

以下是从 `ts-claw` 参考实现中借鉴的关键模式及其在 pilot 中的落地位置：

| ts-claw 组件 | pilot 对应模块 | 实现方式 |
|-------------|---------------|---------|
| `ReminderInjector` (MD5 指纹 + 连续 3 次失败检测) | `monitor/dead-loop-detector.ts` | 每 30s 对 stdout 最近 10 行计算 md5 → 连续 3 次命中 → 判定 dead_loop |
| `CostTracker` (Decorator 模式包裹 Provider) | `monitor/token-tracker.ts` | 解析 claude 进程 stdout/stderr 中的 token 消耗行 → 累加到 task 计数器 |
| `RecoveryManager` (按工具类型匹配错误 + 注入恢复建议) | `retry/classifier.ts` + `retry/handler.ts` | 按 error type 分类（compilation/timeout/dead_loop），匹配预定义模式 → 执行对应策略 |
| `Session` (token/cost 追踪 + working memory) | `state/store.ts` + `state/types.ts` | JSON 持久化 + 运行时内存缓存；不保留 conversation history（claude 进程自行管理） |
| `Compactor` (上下文压缩，保留最近 N 条) | —（不适用） | pilot 不直接调用 LLM，claude 进程自行管理上下文 |
| `Tool middleware chain` (per-tool-call 拦截) | `monitor/*` | 对 claude 进程的 stdout 流进行实时解析，相当于在"工具输出"层面做旁路监控 |
| `Reporter/Logger` | `cli/status.ts` + `cli/log.ts` | TerminalReporter 风格：`pilot status` 表格输出 + `pilot log` 实时日志 |
| `Engine` (ReAct loop) | `daemon/orchestrator.ts` | 简化的编排循环：读取 task → spawn claude → 监控输出 → 检测标记 → 继续/重试/fail |

**架构差异总结（pilot vs ts-claw）：**

| 维度 | ts-claw | pilot |
|------|---------|-------|
| LLM 交互 | 直接调用 LLM API | 通过 claude CLI 间接管理 |
| Agent 循环 | 自实现 ReAct loop | 委托给 claude CLI |
| 上下文管理 | 自实现 composer/compactor | claude 进程自管理 |
| 状态持久化 | PLAN.md + TODO.md 文件 | pilot-state.json |
| 输出解析 | API 响应解析 | 进程 stdout/stderr 流式解析 |

### Decision 8: Daemon 生命周期

```
pilot run
  │
  ├─ 检查 .pilot.lock → 已存在且 PID 存活 → 拒绝
  │
  ├─ 创建 .pilot.lock (PID)
  ├─ 读取 state.json ← 恢复或初始化
  ├─ fork daemon 进程
  │
  └─ [daemon]
       ├─ 读取 tasks.md
       ├─ for each task (串行):
       │   ├─ spawn "claude" → 传递 task prompt
       │   ├─ monitor stdout/stderr
       │   ├─ track tokens
       │   ├─ detect silence/dead-loop
       │   ├─ on success: mark completed, save state
       │   └─ on failure: retry or skip
       ├─ 写入 summary.md
       └─ 释放 .pilot.lock
```

### Decision 9: 前端 CLI 命令树注册

在 `@deepstorm/cli` 的命令树中注册：

```
deepstorm
  ├── setup
  ├── update
  ├── doctor
  ├── ...
  └── pilot              # 子命令组
       ├── run           # pilot run [--project] [--detach]
       ├── status        # pilot status [--project]
       ├── log           # pilot log [--project] [--task] [--follow]
       ├── stop          # pilot stop [--project] [--force]
       └── resume        # pilot resume [--project] [--task]
```

### Decision 10: Claude 进程 prompt 组装

pilot 需要构建一个完整的 prompt 传递给 claude CLI，使其理解自己要做什么。

Prompt 结构：
```
## 你的任务

你正在实现 OpenSpec 变更 "<change-name>" 中的任务列表。

## 任务列表

<tasks.md 内容>

## 当前任务

### 任务 <task-id>: <task-title>

<task 的详细描述和 spec 要求>

## 约束

- 每次只实现一个 task
- 实现完成后，输出标识: "##TASK_COMPLETE ##<task-id>##"
- 遇到无法解决的问题时，输出: "##TASK_STUCK ##<task-id>##<原因>"
```

这种结构化的 prompt 让 pilot 能通过检测 claude 输出的标记来感知 task 完成情况。

---

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| Claude CLI 输出格式不确定 | 难以准确解析 token 消耗和 task 完成标记 | 使用可配置的正则模式匹配；同时提供手动标志位检测 |
| Daemon 进程内存泄漏 | 长时间运行后性能下降 | 添加 daemon 自身的内存监控；设置 task 间隔的 GC 提示 |
| 开发者修改了代码文件后 pilot 还在运行 | 文件冲突 | 每次 spawn 前检查文件时间戳变化；记录文件修改历史 |
| 网络波动导致 Claude API 超时 | task 被误判为 dead_loop | 区分 API 超时（重试）和死循环（不重试）；API 超时走 retry 路径 |
| 并行 pilot 对同一项目操作 | 状态文件竞争 | PID 锁 + 文件级互斥；锁检测强制串行 |
| pd配置错误（claude CLI 不存在） | pilot run 启动即失败 | `pilot run` 前置检查：验证 claude CLI 是否可用 |
| claude CLI 更新后输出格式变化 | prompt 标记检测失效 | prompt 标记设计保持简单（##TASK_COMPLETE），不易受格式变化影响 |

**权衡：**

- **串行 vs 并行**：选择串行是为了简化状态管理、避免文件冲突、降低 token 峰值消耗。代价是总体执行时间 ≈ 各 task 耗时之和。
- **IPC vs HTTP**：选择 fork IPC 是为了零依赖、零端口管理。代价是仅本地进程间可通信（不支持远程查询）。
- **文件锁 vs 端口锁**：选择文件锁是为了简单直接。代价是文件系统写入有延迟窗口（~ms 级，可接受）。

---

## Open Questions

1. **claude CLI 的输出格式**：实际 token 消耗信息是从 stdout 解析，还是从 stderr？格式如何？需要在实际 claude 进程中验证。
2. **长 task 的中断粒度**：如果一个 task 本身执行时间很长（超过 timeout），是直接 kill 还是先尝试 checkpoint（如果有）？
3. **prompt 组装时 spec 的引用方式**：完整 copying spec 到 prompt 中，还是仅引用 spec 路径让 claude 自行读取？
4. **日志轮转**：如果单个 task 产生大量日志，是否需要日志轮转（log rotation）策略？
