## 1. Setup

- [x] 1.1 在 `packages/sweep/skills/sweep-run/scripts/` 下创建脚本目录结构
- [x] 1.2 在 playground/e2e 的 `package.json` 中添加 `@playwright/test` devDependency
- [x] 1.3 更新 playground/e2e 的 `.gitignore`，添加 `*.flow.spec.ts` 排除规则
- [x] 1.4 确认 playground/e2e 的 `playwright.config.ts` 中 `testMatch` 包含 `**/*.flow.spec.ts`

## 2. Flow Parser

- [x] 2.1 实现 `flow-parser.mjs`：使用 `gray-matter` 提取 `.flow.md` 的 frontmatter
- [x] 2.2 实现场景清单表格解析（正则提取 | ID | 场景 | 类型 | 优先级 |）
- [x] 2.3 实现 Flow 章节解析：提取 ID、标题、前置条件、执行步骤、验证点、环境要求
- [x] 2.4 实现验证点提取（`✅ 验证点：` 标记解析，支持同一步骤多个验证点）
- [x] 2.5 实现宽松模式降级（缺失可选字段时设为空值，不中断解析）
- [x] 2.6 实现错误处理（文件不存在、格式严重错误时返回结构化错误信息）
- [x] 2.7 定义并导出解析结果的 JSON Schema
- [x] 2.8 单元测试：覆盖正常解析、缺失字段、文件不存在、多个验证点等场景

## 3. Spec Compiler

- [x] 3.1 实现 `spec-compiler.mjs`：接收解析器 JSON 输出，生成 Playwright `.spec.ts`
- [x] 3.2 实现 `describe` + `test` 结构生成（文件级 describe，每个 Flow 对应一个 test）
- [x] 3.3 实现步骤操作到 Playwright API 的映射（goto / click / fill / selectOption / waitForSelector）
- [x] 3.4 实现验证点断言映射（toHaveTitle / toHaveURL / toBeVisible / toHaveText）
- [x] 3.5 实现 `AI_REQUIRED` 标记跳过机制
- [x] 3.6 实现输出文件路径派生（与 `.flow.md` 同目录，`.flow.spec.ts` 后缀）
- [x] 3.7 实现跳过条件检查（spec.ts 最新修改时间晚于 flow.md 时跳过）
- [x] 3.8 单元测试：覆盖生成 spec、AI_REQUIRED 跳过、跳过条件检查、宽松模式

## 4. Sweep-Plan 集成（plan 时首次编译）

- [x] 4.1 更新 `sweep-plan/SKILL.md.tmpl`：在写完 .flow.md 后自动调用编译器生成 .flow.spec.ts
- [x] 4.2 在 sweep-plan 流程中新增后台编译步骤（用户不感知）
- [x] 4.3 确保 sweep-plan 中的编译器调用路径与 sweep-run 的脚本路径一致（共享 scripts/compiler.mjs）

## 5. Self-Healing Engine（SKILL.md 中的 AI 流程）

- [x] 5.1 在 SKILL.md 中定义自愈引擎的诊断触发条件（spec.ts 执行失败时进入）
- [x] 5.2 定义 AI 诊断流程：读取 Playwright 失败日志 → 打开浏览器 → 对比实际页面元素
- [x] 5.3 定义元素变更时自动更新 spec.ts 定位器的流程（含 `// auto-repaired` 注释）
- [x] 5.4 定义判断为真 Bug 时的处理流程（保留失败、不修改 spec）
- [x] 5.5 定义二次验证机制（修复后重跑 test 块，失败则放弃修复）
- [x] 5.6 定义修复循环保护机制（同一 Flow 最多重试 3 次）
- [x] 5.7 定义自愈报告格式（诊断时间、Flow ID、失败原因、判定结果、修复记录）

## 6. SKILL.md 执行流程重写

- [x] 6.1 在 SKILL.md 中更新步骤 2：run 时检查 freshness（plan 已首次编译 spec.ts）
- [x] 6.2 在 SKILL.md 中新增步骤 5.2：混合执行模式执行逻辑（先原生，失败后自愈）
- [x] 6.3 在 SKILL.md 中更新步骤 6 报告输出：标注执行模式（native / hybrid / browser）
- [x] 6.4 更新快速参考卡片、参数说明表和检查清单
- [x] 6.5 将 `--browser` 和 `--no-parallel` 的向后兼容逻辑补充到 SKILL.md

## 7. 集成验证

- [x] 7.1 用 playground/e2e 中的一个现有 `.flow.md` 测试端到端链路：playground 中 4 个 .flow.md 全部通过解析 + 编译验证
- [x] 7.2 测试自愈流程：login.flow.spec.ts 故意使用 heuristic 选择器 → Playwright 原生执行失败 → AI 诊断修复 6 处 → 重跑 3/3 通过（959ms）
- [x] 7.3 测试 `--browser` 参数向后兼容（SKILL.md 已保留该模式，参数解析 + 执行模式选择 + 不自愈说明 + 报告格式 + 检查清单均验证通过）
- [x] 7.4 验证 `.gitignore` 排除生效（git status 不显示 .flow.spec.ts）
