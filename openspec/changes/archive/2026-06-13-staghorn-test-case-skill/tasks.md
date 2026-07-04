## 1. 创建 skill 目录结构

- [x] 1.1 在 `packages/reef/skills/` 下创建 `testcase/` 目录及 `references/` 子目录
- [x] 1.2 创建 `references/test-case-template.md` — 定义测试用例字段模板（ID、类型、前置条件、步骤、预期结果、验收标准）
- [x] 1.3 创建 `references/coverage-dimensions.md` — 定义四维覆盖指引（正常流程/边界条件/异常场景/验收标准）

## 2. 实现 SKILL.md

- [x] 2.1 创建 `SKILL.md`，编写 metadata（name、description、trigger signals）
- [x] 2.2 实现输入处理逻辑：解析 Jira Issue 描述，提取功能范围、用户故事、验收标准
- [x] 2.3 实现 PRD 上下文处理：可选接收 PRD 引用，引导用户提供补充上下文
- [x] 2.4 实现结构化测试用例生成逻辑：基于 spec 定义的 6 字段格式输出 Markdown 清单
- [x] 2.5 实现四维覆盖分析：确保输出的测试用例覆盖正常流程、边界条件、异常场景、验收标准至少三个维度
- [x] 2.6 实现 superpowers 兼容输出格式：一致的 section header 和 field label，标注可被 superpowers 消费

## 3. 集成与验证

- [x] 3.1 在 `packages/reef/skills/` 下添加 testcase skill 目录
- [ ] 3.2 验证 skill 在 Reef 中能正常加载（`/help` 可见）— 需在 Claude Code 中验证
- [ ] 3.3 验证完整流程：输入 Jira Issue 描述 → 生成结构化测试用例 → 输出符合 spec 定义 — 需在 Claude Code 中验证
- [ ] 3.4 验证边界情况：无 PRD 上下文时仅基于 Jira Issue 生成，输出备注限制 — 需在 Claude Code 中验证

## 4. 文档

- [x] 4.1 更新 `packages/reef/README.md`，添加测试用例 skill 使用说明
- [x] 4.2 同步 spec 到 `openspec/specs/test-case-generation/spec.md`
