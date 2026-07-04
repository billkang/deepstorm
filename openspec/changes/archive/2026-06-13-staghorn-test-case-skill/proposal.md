## Why

PRD → Jira → 开发（Reef）的链路已经打通，但测试用例生成环节缺少结构化的工具支撑。当前测试人员依赖人工梳理测试场景，产出物与开发流程脱节，导致单元测试的完备性和代码质量参差不齐。需要将测试用例生成内聚到开发侧，让测试用例成为开发过程的"脚手架"，辅助 Reef + superpowers 产出更高质量的代码和单元测试。

## What Changes

- 在 Reef 中新增一个测试用例生成的 skill
- 输入：Jira Issue（功能描述）+ PRD 链接（上下文）
- 输出：结构化的测试用例清单（覆盖正常流程、边界条件、异常场景、验收标准）
- 与 Reef 现有的 superpowers 能力协作，提升单元测试生成质量

## Capabilities

### New Capabilities
- `test-case-generation`: 根据 Jira Issue 的功能描述和 PRD 上下文，生成结构化测试用例清单，包含功能测试场景、边界条件、异常路径和验收标准

### Modified Capabilities

（无 — 不涉及现有 spec 需求变更）

## Impact

- **Reef**：新增 skill 文件（`test-case-generation`），需定义 SKILL.md 及输入输出规范
- **Sweep**：测试侧职责范围需后续讨论，不影响本次变更
- **不涉及**：Tide、Atoll、root CLAUDE.md、现有 spec 变更
