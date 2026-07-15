# reef-start 借鉴 Lattice 能力方案

> 分析日期：2026-07-14
> 基于 [Lattice 项目分析](lattice-analysis.md)、[DeepStorm vs Lattice](deepstorm-vs-lattice.md)

---

## 背景

reef-start 是 DeepStorm 的开发流程入口 SKILL.md，覆盖 Issue 驱动（Path A）和开放讨论（Path B）两条路径，包含需求获取 → SDD 文档 → TDD 实现 → 分支结束五个阶段。

Lattice 的 PrismSpec 工作流提供了风险自适应的 plan/tdd 模式、后置验证门禁、结构化证据闭环和优雅的上下文地图设计。本文件记录 reef-start 可以借鉴的具体切入点。

---

## 对比总览

```
reef-start（当前）                       Lattice PrismSpec
┌────────────────────────────┐          ┌────────────────────────┐
│ 阶段一：获取需求             │          │ Clarify → Spec          │
│   Issue + PRD + 设计稿      │          │   (一次梳理)             │
├────────────────────────────┤          ├────────────────────────┤
│ 阶段二：创建分支             │          │ (无显式步骤)             │
├────────────────────────────┤          ├────────────────────────┤
│ 阶段三：SDD 文档             │          │ Specification           │
│   proposal→specs→design     │          │   spec.md（单文件）       │
│   →tasks→harden→plans       │          │   (7 步→1 步)            │
├────────────────────────────┤          ├────────────────────────┤
│ 门禁：superpowers 检查       │          │ Planning (risk-mode)    │
│   (强制 TDD)                │          │   plan / tdd 自适应      │
├────────────────────────────┤          ├────────────────────────┤
│ 阶段四：TDD 实现             │          │ Implement               │
│   RED→GREEN→REFACTOR        │          │   plan 或 tdd 模式       │
│   × 每个 task                │          │                         │
├────────────────────────────┤          ├────────────────────────┤
│ (隐式验证：TDD 内置)         │          │ Quality Gate            │
│                             │          │   build→lint→test       │
│                             │          │   →ac-coverage→drift    │
├────────────────────────────┤          ├────────────────────────┤
│ 阶段五：分支结束              │          │ Review→Verification     │
│ (code-audit→提交/PR)        │          │   →Evidence             │
└────────────────────────────┘          └────────────────────────┘
```

---

## 切入点一：风险自适应的执行模式

**现状**：reef-start 阶段四的所有代码变更都走 TDD（RED→GREEN→REFACTOR），无论变更的复杂度和风险级别。

**问题**：
- 简单配置变更（如调整 API 路径、修改环境变量名）也需要完整的 TDD 循环
- 纯前端样式调整、Markdown 文档修改被豁免了，但还有大量"低风险但涉及代码"的变更
- TDD 循环 token 消耗高，低风险场景不划算

**目标**：在 superpowers 门禁（阶段三→四之间）增加风险判断，低风险走 plan mode（直接实现 + build/lint/test 验证），高风险走 tdd mode（完整 TDD 循环）。

### 风险路由卡

在 `packages/reef/skills/reef-start/SKILL.md` 的 superpowers 门禁阶段增加风险判断：

| 风险因子 | plan | tdd |
|----------|------|-----|
| 文档/配置/SKILL.md 变更 | ✅ | — |
| 简单重构（已有测试覆盖） | ✅ | — |
| 新增业务逻辑功能 | — | ✅ |
| Bug fix（需验证修复正确性） | — | ✅ |
| 权限/安全/资金变更 | — | ✅ |
| 数据库迁移/幂等性 | — | ✅ |
| 状态机/并发逻辑 | — | ✅ |

### 执行策略差异

| Feature | Plan Mode | TDD Mode |
|---------|-----------|----------|
| 实现顺序 | 直接实现任务 | 先红灯测试 → 绿灯 → 重构 |
| 验证要求 | build + lint + test --related | 完整测试套件 + AC-to-test trace |
| 失败重试 | 默认 1 次 | 默认 3 次 + 降级计划 |
| 代码审查 | code-audit (可选精简) | code-audit (全量并行) |

### 规则

- **plan → tdd 升级**：若 plan mode 实现过程中发现复杂度超预期，Agent 应主动升级为 tdd mode
- **tdd → plan 降级**：禁止。一旦判定为高风险，即使实现后发现简单，也不允许降级
- **默认 auto**：superpowers 门禁时自动评估风险，推荐模式并让用户确认

### 涉及改动

| 文件 | 改动内容 |
|------|---------|
| `packages/reef/skills/reef-start/SKILL.md` | superpowers 门禁阶段增加风险路由卡，阶段四增加 plan mode 分支 |
| `packages/reef/skills/reef-start/references/risk-routing-card.md` | (新增) 风险路由参考文档 |

---

## 切入点二：后置验证门禁

**现状**：TDD 循环内有"运行完整测试套件"步骤，但放在每个 task 循环内，且缺少 build 和 lint 的强制验证。

**目标**：每个 task 标记完成前，必须跑 build + lint + unit-test（相关），任何一个失败就不允许标完成。

### 改动

| 文件 | 改动内容 |
|------|---------|
| `packages/reef/skills/reef-start/SKILL.md` | 阶段四 TDD 循环的"标记完成"步骤前增加验证步骤 |

### 验证模板（写入 SKILL.md）

```markdown
#### 验证门禁（每个 task 标完成前）

```bash
npm run build               # 必须通过 → exit 0
npm run lint                # 必须通过 → exit 0
npm test -- --related       # 必须通过 → exit 0
```
```

并根据项目框架自动选择命令（Java → `mvn compile` + `mvn checkstyle:check` + `mvn test`；Python → `ruff check` + `pytest`）。

---

## 切入点三：统一结构化证据收敛

**现状**：reef-start 的验证结果散布在多个地方——

- TDD 循环的测试通过/失败（隐式，在对话中）
- code-audit 的 review 报告（`.deepstorm/reviews/`）
- style-verify 的违规报告（HOOK 输出）
- 没有一份统一的证据文件说"这次 change 的验证结果是什么"

**目标**：在 code-audit 之后、分支结束之前，生成一份结构化验证报告。

### 报告格式（`openspec/changes/<change>/verify-report.json`）

```json
{
  "change": "prj-add-user-registration",
  "tasks": {
    "total": 5,
    "passed": 4,
    "failed": 1
  },
  "build": {
    "command": "npm run build",
    "exitCode": 0,
    "passed": true,
    "duration": 4520
  },
  "lint": {
    "command": "npm run lint",
    "exitCode": 0,
    "passed": true
  },
  "tests": {
    "command": "npm test",
    "exitCode": 0,
    "passed": true,
    "total": 42,
    "passed": 42,
    "failed": 0,
    "duration": 8530
  },
  "acCoverage": {
    "total": 5,
    "covered": 4,
    "uncovered": ["AC-3"],
    "ratio": "80%"
  },
  "review": {
    "findings": 3,
    "blockers": 0,
    "warnings": 2,
    "suggestions": 1,
    "reportFile": ".deepstorm/reviews/2026-07-14-prj-add-user-registration.md"
  },
  "summary": "PASSED with warnings"
}
```

### 改动

| 文件 | 改动内容 |
|------|---------|
| `packages/reef/skills/reef-start/SKILL.md` | 阶段五前增加证据收敛步骤 |

---

## 切入点四：上下文地图

**现状**：reef-start 阶段一大量采集上下文（Issue 详情、PRD、Figma、需求讨论），但采集到的信息没有结构化的保存和复用机制。下一次启动 reef-start 时，这些上下文不可复用。

**目标**：在 `.deepstorm/` 下维护一份轻量级上下文地图文件，让 Agent 每次启动时快速了解项目背景。

### 文件格式

`.deepstorm/context.md`（由 reef-start 阶段一更新，或 CLI setup 时初始化）：

```markdown
# 项目上下文

## 技术栈
- 前端：Angular 18 + Tailwind + PrimeNG
- 后端：Java Spring Boot 3.x + Hibernate
- 数据库：PostgreSQL 15 + Liquibase
- CI/CD：GitHub Actions

## 关键模块
| 模块 | 说明 | 高风险 |
|------|------|--------|
| 用户管理 | 注册/登录/权限 | 权限 |
| 订单 | 创建/支付/退款 | 资金 |
| 支付对账 | 每日对账/差异处理 | 资金+幂等 |

## 历史踩坑
- 数据库迁移必须加 `rollback` 脚本（见 incidents/2026-03-migration-missing-rollback.md）
- 支付回调必须幂等（见 incidents/2026-01-payment-idempotency.md）

## 外部引用
- API 文档：https://api-docs.example.com
- 设计系统：Figma Team Library "Acme Design"
- 业务规范：Confluence > 支付团队 > 对账规范
```

### 改动

| 文件 | 改动内容 |
|------|---------|
| `.deepstorm/context.md` | (新增) 上下文地图文件 |
| `packages/cli/src/commands/setup/` | setup 时初始化 `.deepstorm/context.md` 模板 |
| `packages/reef/skills/reef-start/SKILL.md` | 阶段一采集信息后更新 context.md |

---

## 切入点五：AC-to-test 回溯

**现状**：spec.md 有 Acceptance Criteria Mapping，但没有硬性要求每个 AC 对应到哪些测试文件。code-audit 会检查，但没有结构化的 trace 机制。

**目标**：在 code-audit 阶段增加一个轻量检查项，要求 Agent 显式回溯每个 AC 到对应的测试文件和方法。

### 改动

| 文件 | 改动内容 |
|------|---------|
| `packages/reef/skills/reef-start/SKILL.md` | code-audit 检查清单增加 AC trace 项 |

### 产出（写入 review 报告或 verify-report.json）

```text
AC Coverage: 4/5
├── AC-1 ✅ UserRegistrationTest::testCreateSuccess
├── AC-2 ✅ UserRegistrationTest::testDuplicateEmail
├── AC-3 ✅ UserRegistrationTest::testPasswordPolicy
├── AC-4 ✅ UserRegistrationIntegrationTest::testEndToEnd
├── AC-5 ❌ （未找到匹配）
```

---

## 优先级路线

```
Phase 1（立即）             Phase 2（短期）             Phase 3（中期）
┌─────────────────┐        ┌──────────────────┐       ┌───────────────────┐
│ 风险自适应 mode   │  →   │ 后置验证门禁       │   →  │ 统一证据收敛       │
│ (plan/tdd)       │        │ (build+lint+test)  │      │ (verify-report)   │
│                  │        │                    │      │                   │
│ 只改 SKILL.md    │        │ 改 SKILL.md +      │      │ 改 SKILL.md +     │
│ + 一张参考卡      │        │ 框架命令适配        │      │ 定义证据格式        │
│                  │        │                    │      │                   │
│ 1 天内可完成      │        │ 2-3 天              │      │ 3-5 天             │
└─────────────────┘        └──────────────────┘       └───────────────────┘
                              ┌──────────────────┐
                              │ Context 地图      │
                              │ (.deepstorm/)     │
                              │                   │
                              │ 改 CLI setup +    │
                              │ SKILL.md 阶段一    │
                              └──────────────────┘
```

---

## 改动清单总表

| # | 切入点 | 优先级 | 改 SKILL.md | 新增文件 | 改 CLI | 风险评估 |
|---|--------|--------|-------------|----------|--------|---------|
| 1 | 风险自适应 mode | P0 | ✅ 重写 gate 逻辑 | 风险路由卡 1 份 | — | 低 |
| 2 | 后置验证门禁 | P0 | ✅ 阶段四加检查 | — | — | 低 |
| 3 | Context 地图 | P1 | ✅ 阶段一加更新 | `.deepstorm/context.md` | setup 加初始化 | 中 |
| 4 | AC-to-test trace | P1 | ✅ code-audit 加项 | — | — | 低 |
| 5 | 统一证据收敛 | P2 | ✅ 阶段五加产出 | verify-report.json 格式 | — | 中 |
