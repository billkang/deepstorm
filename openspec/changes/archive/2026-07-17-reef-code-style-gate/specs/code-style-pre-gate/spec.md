## ADDED Requirements

### Requirement: Superpowers 门禁必须包含 code-style 技能检查
reef-start 的阶段三→阶段四 superpowers 门禁中，MUST 将 `reef:reef-style-backend` 和 `reef:reef-style-frontend` 列为硬性加载项。在阶段四实现开始前，AI MUST 通过 Skill tool 加载对应技术栈的 code-style 技能。未加载前 SHALL NOT 进入阶段四实现流程。

#### Scenario: 后端变更通过 superpowers 门禁
- **WHEN** 变更涉及后端代码，AI 执行 superpowers 门禁检查
- **THEN** AI MUST 调用 Skill tool 加载 `reef:reef-style-backend`，并在安全检查清单中标记为已通过
- **THEN** 未加载该技能前 SHALL NOT 进入阶段四

#### Scenario: 前端变更通过 superpowers 门禁
- **WHEN** 变更涉及前端代码，AI 执行 superpowers 门禁检查
- **THEN** AI MUST 调用 Skill tool 加载 `reef:reef-style-frontend`，并在安全检查清单中标记为已通过
- **THEN** 未加载该技能前 SHALL NOT 进入阶段四

#### Scenario: 前后端同时变更
- **WHEN** 变更同时涉及前端和后端代码
- **THEN** AI MUST 加载 `reef:reef-style-backend` 和 `reef:reef-style-frontend` 两个技能
- **THEN** 安全检查清单 MUST 包含两行独立检查项

#### Scenario: 仅文档/配置变更（无代码）
- **WHEN** 变更仅涉及文档、配置文件或不含运行时代码的变更
- **THEN** AI 可豁免 code-style 技能加载，但 MUST 在门禁声明中说明豁免原因

### Requirement: reef-gen-backend 必须将 code-style 加载设为前置门禁
`reef-gen-backend/SKILL.md.tmpl` 的 Step 2 MUST 改为前置门禁：AI 在编写任何后端代码之前，MUST 先通过 Skill tool 加载 `reef:reef-style-backend` 并阅读 `quick-reference.md`。加载完成前 SHALL NOT 进入 Step 3（编写代码）。Step 5（提交前自检）保持作为后置检查。

#### Scenario: 后端代码生成前加载 code-style
- **WHEN** AI 准备编写后端代码，进入 `reef-gen-backend` 流程
- **THEN** AI MUST 先调用 Skill tool 加载 `reef:reef-style-backend`
- **THEN** 阅读 `quick-reference.md` 了解核心规范
- **THEN** 根据当前变更类型选择对应的维度规范文件阅读
- **THEN** 完成后方可进入代码编写步骤
- **THEN** 如 AI 未加载该技能直接编写代码，视为违反工作流纪律

### Requirement: reef-gen-frontend 必须将 code-style 加载设为前置门禁
`reef-gen-frontend/SKILL.md.tmpl` 的 Step 2 MUST 改为前置门禁：AI 在编写任何前端代码之前，MUST 先通过 Skill tool 加载 `reef:reef-style-frontend` 并阅读 `quick-reference.md`。加载完成前 SHALL NOT 进入后续代码编写步骤。Step 5（提交前自检）保持作为后置检查。

#### Scenario: 前端代码生成前加载 code-style
- **WHEN** AI 准备编写前端代码，进入 `reef-gen-frontend` 流程
- **THEN** AI MUST 先调用 Skill tool 加载 `reef:reef-style-frontend`
- **THEN** 阅读 `quick-reference.md` 了解核心规范
- **THEN** 根据当前变更类型选择对应的维度规范文件阅读
- **THEN** 完成后方可进入代码编写步骤
- **THEN** 如 AI 未加载该技能直接编写代码，视为违反工作流纪律

### Requirement: 逐 task 实现流程必须包含 code-style 确认点
`stage-4-implementation.md` 的 4.2 逐 task 实现流程中，Plan Mode 和 TDD Mode 的入口 MUST 增加"确认 code-style 技能已加载"检查点。如发现 code-style 尚未加载，AI MUST 暂停并先加载对应技能。

#### Scenario: Plan Mode 每个 task 前确认 code-style
- **WHEN** AI 按 Plan Mode 进入某个 task 的实现
- **THEN** AI MUST 检查 `reef:reef-style-backend` 或 `reef:reef-style-frontend` 是否已加载
- **THEN** 如未加载，SHALL 先加载对应技能再开始实现
- **THEN** 如已加载，直接进入实现步骤

#### Scenario: TDD Mode 每个 task 前确认 code-style
- **WHEN** AI 按 TDD Mode 进入某个 task 的 RED 阶段（写测试）
- **THEN** AI MUST 检查 `reef:reef-style-backend` 或 `reef:reef-style-frontend` 是否已加载
- **THEN** 如未加载，SHALL 先加载对应技能再开始写测试

### Requirement: superpowers-gate 声明模板和安全检查清单必须同步更新
`references/superpowers-gate.md` 的 Plan Mode / TDD Mode 声明模板 MUST 增加 code-style 技能的行；安全检查清单 MUST 增加"code-style 技能已加载"的独立检查项。

#### Scenario: Plan Mode 声明模板包含 code-style
- **WHEN** AI 使用 Plan Mode 声明模板
- **THEN** 模板的已加载技能表格 MUST 包含 `reef:reef-style-backend` 或 `reef:reef-style-frontend` 行

#### Scenario: TDD Mode 声明模板包含 code-style
- **WHEN** AI 使用 TDD Mode 声明模板
- **THEN** 模板的已加载技能表格 MUST 包含 `reef:reef-style-backend` 或 `reef:reef-style-frontend` 行

#### Scenario: 安全检查清单包含 code-style 检查项
- **WHEN** AI 执行安全检查清单
- **THEN** 清单 MUST 包含 "code-style 技能已加载（reef-style-backend/reef-style-frontend）" 的独立检查项
