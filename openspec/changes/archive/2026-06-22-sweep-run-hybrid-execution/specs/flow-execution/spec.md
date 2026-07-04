## ADDED Requirements

### Requirement: Skill 支持混合执行模式（Hybrid Execution）

Flow-execution skill SHALL 在默认模式下使用 Hybrid Execution 策略：先通过编译的 `.spec.ts` 原生执行，失败后由 AI 驱动回退诊断。

#### Scenario: 混合执行入口
- **WHEN** 用户执行 `/sweep-run`（不带 `--browser` 参数）
- **THEN** skill SHALL 检查对应的 `.flow.spec.ts` 是否已生成且最新
- **AND** `.flow.spec.ts` 由 `/sweep-plan` 阶段首次生成
- **AND** 如果 `.flow.spec.ts` 最新，SHALL 直接运行 `npx playwright test` 执行（跳过解析 + 编译）
- **AND** 如果过时或不存在，SHALL 运行解析器 + 编译器重新生成再执行

#### Scenario: 原生执行全部通过
- **WHEN** `npx playwright test` 执行通过（所有 test 块 pass）
- **THEN** skill SHALL 输出测试通过报告
- **AND** SHALL 使用原生 Playwright 的报告格式
- **AND** 报告 SHALL 标注执行模式为 "native"（原生执行）

#### Scenario: 原生执行有失败触发自愈
- **WHEN** `npx playwright test` 执行有失败
- **THEN** skill SHALL 调用 Self-Healing Spec 引擎进行失败诊断
- **AND** 如果自愈引擎修复了 spec，SHALL 重新执行原生测试
- **AND** 重新执行结果作为最终报告依据
- **AND** 报告 SHALL 标注执行模式为 "hybrid"（混合执行）

#### Scenario: 存在 AI_REQUIRED 标记的步骤
- **WHEN** `.flow.spec.ts` 中存在标记为 `// AI_REQUIRED` 的测试块
- **THEN** skill SHALL 跳过该块的原生执行
- **AND** 在原生执行完成后，由 AI 通过 Playwright MCP 单独执行该 Flow

---

### Requirement: 模式兼容性

Hybrid Execution SHALL 是默认执行模式，原有 `--browser` 和 `--no-parallel` 模式 SHALL 保持可用。

#### Scenario: --browser 参数向后兼容
- **WHEN** 用户执行 `/sweep-run --browser`
- **THEN** skill SHALL 使用原有的 AI 逐步骤浏览器调试模式
- **AND** 不经过解析器、编译器、原生执行路径
- **AND** 行为与当前实现一致

#### Scenario: --no-parallel 参数向后兼容
- **WHEN** 用户执行 `/sweep-run --no-parallel`
- **THEN** skill SHALL 使用编译的 `.spec.ts` 执行
- **AND** 但不分发多 Agent（单线程顺序执行）
- **AND** 自愈机制保持可用

#### Scenario: 交互式选择兼容
- **WHEN** 用户执行 `/sweep-run`（无参数，进入交互式选择）
- **THEN** SHALL 保持现有的 topology.yaml 模块选择和 flow-selector.mjs 交互流程
- **AND** 选定文件后使用 Hybrid Execution 模式执行

---

### Requirement: .gitignore 配置

Sweep-run skill SHALL 自动配置 `.gitignore` 排除编译生成的 `.flow.spec.ts` 文件。

#### Scenario: .gitignore 中排除 .flow.spec.ts
- **WHEN** sweep-run 首次检测到 `*.flow.spec.ts` 文件生成
- **AND** `.gitignore` 中尚不包含对该模式的排除
- **THEN** skill SHALL 在 `.gitignore` 中添加 `*.flow.spec.ts`
- **AND** 注释说明 "Auto-generated Playwright spec files from .flow.md (managed by sweep-run)"

---

### Requirement: 解析器和编译器托管位置

Flow Parser 和 Spec Compiler 的脚本 SHALL 托管在 sweep-run skill 的同级 `scripts/` 目录下，由 SKILL.md 中的 Bash 命令或内联 Node.js 调用。

#### Scenario: 脚本位置
- **WHEN** sweep-run 需要调用解析器或编译器
- **THEN** 解析器脚本 SHALL 位于 `scripts/flow-parser.mjs`
- **AND** 编译器脚本 SHALL 位于 `scripts/spec-compiler.mjs`
- **AND** 两个脚本 SHALL 可以通过 `node scripts/<name>.mjs <args>` 调用

#### Scenario: sweep-run 中调用解析器
- **WHEN** sweep-run 需要解析 `.flow.md`
- **THEN** SKILL.md 中的流程 SHALL 通过 Bash 命令调用 `node scripts/flow-parser.mjs <path>`
- **AND** 解析结果以 JSON 输出到 stdout 或临时文件供后续使用
