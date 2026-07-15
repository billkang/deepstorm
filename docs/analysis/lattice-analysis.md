# Lattice 项目分析

> 来源：https://github.com/zdolphin07-dotcom/lattice
> 分析日期：2026-07-14

---

## 一句话定位

Lattice 是一个安装在业务仓库内的 repo-local AI Coding Control Plane（控制面），不取代 AI Coding Agent，而是给 Agent 加上团队交付所需的项目契约层。

## 核心原理：四个控制面契约

### 1. Spec Contract（规格契约）
- 用 PrismSpec 工作流把模糊意图压缩成 `spec.md`
- Context Basis 只记录影响 scope/AC/risk 的结论，不是堆料
- AC 格式为 `AC-{n}` 的可测试验收标准
- Risk & Execution Mode：风险自适应（plan/tdd）
- Spec 是契约不是文档，产物存在于文件系统而非对话记忆

### 2. Context Engineering（上下文工程）
- `context/README.md` — Agent 首先读取的项目上下文地图
- `context/knowledge/` — 可版本化的经验沉淀
- `context/drafts/` — 知识先经 review 再 promote
- **设计原则**：Context 不是批量加载 RAG，而是先给地图，再让 Agent 按需发现和筛选

### 3. Verification Contract（验证契约）
- `lattice/kernel/delivery/pipeline.sh` 运行 gates：spec-lint → build → lint → unit-test → AC-coverage → drift-check → compliance
- **关键规则**：完成声明必须由最后一次运行的外部命令支撑

### 4. Evidence / Eval（证据智能）
- 所有 gate 输出收敛为 `lattice/state/eval-runs/*.json`
- 支持本地查询、历史汇总、CI 集成、静态 dashboard

## 核心架构：两层分离

```
PrismSpec（独立 skill pack） →  spec → plan → implement(plan|tdd) → review → verify
Lattice（团队级增强层）      →  manifest + context + gates + eval + loop/learn
```

## 风险自适应模式

两个稳定的实现档位，不是连续光谱：

| Mode | 适用场景 | 必须产出 |
|------|----------|----------|
| plan | 文档、配置、低风险功能、简单重构 | AC-traced plan、测试（或明确不需要的理由）、验证命令 |
| tdd | bug fix、权限、资金、状态机、并发、幂等、迁移 | red test → green test → AC-to-test trace → regression evidence |

规则：允许 `plan → tdd` 升级，禁止静默 `tdd → plan` 降级。

## 关键技术选择

| 取舍 | Lattice 的选择 | 理由 |
|------|---------------|------|
| 语言 | Bash 3.2+ + yq | 零运行时依赖，安装就是拷贝脚本 |
| 安装 | `bash install.sh --init` | 直接拷贝进业务仓库 |
| 文件 vs 数据库 | 先 Markdown + JSON | Agent 和人都能读，git diff 友好 |
| 上下文检索 | Agent 发现为主 | 模型负责选择和压缩，项目只提供地图 |
| Framework vs User assets | 路径分离 | `kernel/` 可升级，`manifest/context/specs` 版本化不覆盖 |
| Init 自动检测 | 自动检测 Go/Node/Python/Rust/Java 框架并生成 manifest | 仓库即配置 |

## 产物架构

```text
your-project/
├── lattice/
│   ├── manifest.yaml         # 项目契约（可审查）
│   ├── kernel/               # 框架代码（可升级不覆盖）
│   │   ├── orchestrator/     # 状态路由、task 选择
│   │   ├── context/          # 上下文加载
│   │   └── delivery/         # pipeline + gates
│   ├── context/              # 项目资产（版本化）
│   │   ├── knowledge/        # 经验沉淀
│   │   └── drafts/           # 待 review 的知识
│   └── specs/<spec-id>/
│       ├── spec.md           # Contract
│       ├── plan.md           # AC-traced tasks
│       ├── review.md         # Read-only verdict
│       └── verify.md         # Commands + exit codes
└── prismspec/
    ├── skillpack.yaml        # 分发契约
    ├── skills/               # Canonical SKILL.md
    ├── bin/{new,guide,lint,doctor}.sh
    └── templates/            # Spec 模板
```

## 设计原则

- Spec 是契约，不是长文档
- 当前代码、测试、schema 和命令输出仍是真相源
- Plan 和 TDD 是同一工作流的两种风险档位，不是两套流程
- 验证必须由外部命令和证据支撑
- PrismSpec 可独立使用，Lattice 负责项目级增强
- 流程默认克制；多一个阶段就必须多一个明确收益

## 定位总结

适合给现有 AI Coding 习惯加一层工程纪律的团队，与 DeepStorm 互补非竞争。
