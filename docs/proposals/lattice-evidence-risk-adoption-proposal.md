# Lattice 能力借鉴方案：证据闭环 & 风险自适应

> 分析日期：2026-07-14

参考文档：[Lattice 项目分析](lattice-analysis.md)、[DeepStorm vs Lattice](deepstorm-vs-lattice.md)

---

## DeepStorm 已有基础

**已有类证据闭环种子：**
- `openspec/specs/review-evidence-chain/spec.md` — 审查报告有证据来源标注
- Pilot 的 `pilot-summary.md` — 记录 completed/failed/skipped + token 用量
- Sweep 的 `*.report.md` — 测试报告持久化

**已有类风险自适应种子：**
- `openspec/specs/superpowers-check-gate/spec.md` — 区分代码/文档变更
- Pilot 的错误分类（超时/死循环/静默/预算超限）

---

## 切入点一：Pilot 后置验证门禁（MVP，1-2 天）

**现状**：`hasTaskCompleteMarker()` 读 claude CLI 输出标记就认为完成了
**目标**：task 完成后自动跑 build/lint/test，通过才标记 completed

| 改动文件 | 改动内容 |
|---------|---------|
| `packages/pilot/src/daemon/orchestrator.ts` | `executeTask()` 返回后加验证 gate |
| `packages/pilot/src/config/schema.ts` | 新增 `verifyCommands` 配置 |
| `packages/pilot/src/config/loader.ts` | 自动从项目 package.json 推断验证命令 |
| `packages/pilot/src/state/types.ts` | `TaskState` 加 `verification` 字段 |

产出结构化证据：

```json
{
  "taskId": "T1",
  "verification": {
    "steps": [
      {"command": "npm run build", "exitCode": 0, "passed": true},
      {"command": "npm run lint", "exitCode": 0, "passed": true},
      {"command": "npm test -- --related", "exitCode": 0, "passed": true}
    ],
    "allPassed": true,
    "ranAt": "2026-07-14T10:30:00Z",
    "duration": 4520
  }
}
```

---

## 切入点二：Plan/TDD 风险模式选择器（2-3 天）

### A. spec.md front matter 增加 mode 字段

```markdown
---
mode: auto  # plan | tdd | auto
risk: low   # low | medium | high
---
```

### B. 风险判断卡

放在 `packages/reef/skills/reef-start/references/risk-routing-card.md`：

| 风险因子 | plan | tdd |
|----------|------|-----|
| 文档/配置/简单重构 | ✅ | — |
| 已有测试覆盖充分 | ✅ | — |
| Bug fix / 权限 / 安全 | — | ✅ |
| 资金 / 状态机 / 并发 | — | ✅ |
| 数据库迁移 / 幂等性 | — | ✅ |

### C. 修改 Pilot 执行策略

| Feature | Plan Mode | TDD Mode |
|---------|-----------|----------|
| 实现顺序 | 直接实现任务 | 先红灯测试 → 绿灯 → 重构 |
| 验证要求 | build + lint + test --related | 完整 test suite + AC-to-test trace |
| 失败重试 | 默认 1 次 | 默认 3 次 + 降级计划 |

改动文件：
- `packages/reef/skills/reef-start/SKILL.md` — spec 创建时读 `--mode` 参数，写 `mode: plan|tdd`
- `packages/pilot/src/config/schema.ts` — 增加 `PilotConfig.executionMode`
- `packages/pilot/src/daemon/orchestrator.ts` — `executeTask()` 根据 mode 切换 TDD 流程

---

## 切入点三：AC Coverage Gate（3-5 天）

Lattice 的 AC-coverage 核心逻辑：
> 扫描 spec.md 中的 `AC-{n}` → 扫描 test 文件（按语言约定的模式匹配） → 报告覆盖率

DeepStorm 现状：Sweep 对接 E2E Playwright 测试，不是单元测试。Reef 生成代码但 AC 到 test 的 trace 是口头约定。

建议：在 `packages/sweep/` 新增 gate skill `sweep-ac-coverage/`，纯文件扫描 + 正则匹配，作为 Pilot 和人工 review 的硬性门禁。

产出：
```text
AC Coverage: 4/5
├── AC-1 ✅ test_create_user_success.py::test_ac1
├── AC-2 ✅ test_create_user_duplicate.py::test_ac2
├── AC-3 ❌ （未找到匹配）
```

---

## 优先级路线

```
Phase 1（1-2 天）              Phase 2（2-3 天）            Phase 3（3-5 天）
┌──────────────────────┐      ┌────────────────────┐      ┌─────────────────────┐
│ Pilot 后置验证门禁     │ →   │ Plan/TDD 模式选择    │ →   │ AC Coverage Gate    │
│                      │      │                    │      │                     │
│ 改动最小 / 风险最低    │      │ 改动中等 / 需 skill  │      │ 改动较大 / 涉及 Sweep │
│                      │      │ 配合               │      │                     │
│ 每次 task 完成后       │      │ spec frontmatter    │      │ 自动扫描 spec→test   │
│ 跑 build/lint/test    │      │ risk-routing-card    │      │ 结构化覆盖率报告      │
└──────────────────────┘      └────────────────────┘      └─────────────────────┘
```

**为什么从 Phase 1 开始？**
1. 改动量最小：orchestrator.ts 加几行 post-task verification 就够了
2. 明显提升可信度：从"Agent 说完成了"到"命令证明了完成了"
3. 不破坏现有流程：已有的 task 照跑，只是多一步验证再标记完成
4. 为 Phase 2/3 打基础：有了验证门禁，后面模式选择和 AC trace 才有存在的意义
