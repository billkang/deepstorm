# Lattice Porting

> capability: `lattice-porting`

## ADDED Requirements

### Requirement: 移植风险路由到 SKILL.md.tmpl

reef-start SKILL.md.tmpl SHALL 包含与 SKILL.md 一致的风险路由判断流程、Mode 切换规则和声明模板。

#### Scenario: 风险路由判断流程
- **WHEN** SKILL.md.tmpl 被读取
- **THEN** 在 superpowers 门禁阶段（阶段三→四之间）SHALL 包含以下内容：
  - 变更特征分析方法（1. 分析变更特征 → 2. 查阅风险路由卡 → 3. 输出风险判断表 → 4. 等待用户确认）
  - 风险路由卡引用（`references/risk-routing-card.md`）
  - 输出模板（变更特征判定表 + 推荐模式 + 理由 + 用户确认）
  - plan→tdd 升级规则 + tdd→plan 禁止降级规则
- **AND** 内容 SHALL 与 SKILL.md 第 421-460 行中的行为和约束完全一致

#### Scenario: Mode 声明模板
- **WHEN** 风险路由完成
- **THEN** SKILL.md.tmpl SHALL 包含 Plan Mode 和 TDD Mode 两套声明模板，内容与 SKILL.md 第 462-510 行一致

### Requirement: 移植上下文地图更新到 SKILL.md.tmpl

SKILL.md.tmpl SHALL 包含 Path A 和 Path B 两条路径的阶段一结束后上下文地图更新逻辑。

#### Scenario: Path A 1.6
- **WHEN** Path A 阶段一需求获取完成
- **THEN** SKILL.md.tmpl SHALL 包含 1.6 更新上下文地图段（与 SKILL.md 第 187-197 行一致）

#### Scenario: Path B B1.5
- **WHEN** Path B 阶段一 brainstorming 产出后
- **THEN** SKILL.md.tmpl SHALL 包含 B1.5 更新上下文地图段（与 SKILL.md 第 266-276 行一致）

### Requirement: 移植阶段四增强到 SKILL.md.tmpl

SKILL.md.tmpl SHALL 包含阶段四的 plan/tdd 双路径实现逻辑、后置验证门禁、AC-to-test 回溯和验证报告。

#### Scenario: 核心原则 dual-mode
- **WHEN** SKILL.md.tmpl 的阶段四核心原则段被读取
- **THEN** 该段 SHALL 同时包含 plan mode 和 tdd mode 的原则（与 SKILL.md 第 597-603 行一致）

#### Scenario: 4.2 逐 task 实现
- **WHEN** SKILL.md.tmpl 的阶段四 4.2 段被读取
- **THEN** 该段 SHALL 包含 plan mode 和 tdd mode 两条实现路径，含后置验证门禁三步流程（与 SKILL.md 第 630-709 行一致）

#### Scenario: 框架自适应验证命令表
- **WHEN** SKILL.md.tmpl 的阶段四被读取
- **THEN** SHALL 包含 Java Spring Boot / Python FastAPI / Node.js / Go 四套件的验证命令表 + 兜底策略（与 SKILL.md 第 692-702 行一致）

#### Scenario: 4.3 code-audit 含 AC trace
- **WHEN** SKILL.md.tmpl 的 code-audit 段被读取
- **THEN** 该段 SHALL 包含 AC-to-test 回溯检查项 + AC Coverage 输出格式 + 高风险/低风险 AC 处理规则（与 SKILL.md 第 711-739 行一致）

#### Scenario: 4.4 验证报告
- **WHEN** SKILL.md.tmpl 被读取
- **THEN** SHALL 包含 code-audit 与分支结束之间的 4.4 验证报告生成段，含 JSON 格式定义、数据源映射表和摘要字段逻辑（与 SKILL.md 第 741-782 行一致）

#### Scenario: 4.5 分支结束含 verify-report 归档
- **WHEN** SKILL.md.tmpl 的分支结束段被读取
- **THEN** SHALL 包含 verify-report.json 随 change 目录归档的说明（与 SKILL.md 第 784-793 行一致）

### Requirement: 流程图一致

移植后 SKILL.md.tmpl 的阶段四入口流程图 SHALL 与 SKILL.md 一致（包含 plan mode 和 tdd mode 分支）。

#### Scenario: 双分支流程图
- **WHEN** 移植完成
- **THEN** SKILL.md.tmpl 的阶段四 Mermaid 流程图 SHALL 包含 Plan Mode 和 TDD Mode 双分支拓扑（与 SKILL.md 第 543-595 行一致）

### Requirement: 删除过时的 SKILL.md

移植完成后，packages/reef/skills/reef-start/SKILL.md SHALL 被删除。

#### Scenario: 删除构建产物
- **WHEN** 移植完成且 build-registry 已确认不依赖 SKILL.md
- **THEN** `packages/reef/skills/reef-start/SKILL.md` SHALL 被删除
- **AND** dist/skills/reef-start/SKILL.md SHALL 后续由模板渲染生成
