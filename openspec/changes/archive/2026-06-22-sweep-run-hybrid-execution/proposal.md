## Why

当前 `/sweep-run` 执行 E2E 测试流程时，每个 `.flow.md` 文件由 AI 逐条阅读理解、再通过 Playwright MCP 逐步骤操作浏览器执行。在测试文件较多时执行时间不可接受。核心瓶颈在于：AI 在"解析"和"执行"两个环节都深度介入，缺少原生执行器的加速能力。同时，已有 `.spec.ts` 方案被放弃的原因是页面元素变更后 spec 无法自动适配。本变更同时解决速度和维护性两个问题。

## What Changes

- **新增 `.flow.md` 解析器**：用 `gray-matter` + 结构化解析替代 AI 自然语言阅读理解 `.flow.md`，将解析时间从秒级降为微秒级
- **新增预编译 `.spec.ts` 生成**：由解析器从 `.flow.md` 自动预编译生成 Playwright `.spec.ts` 文件
- **新增混合执行模式**：默认走 `npx playwright test` 原生执行（毫秒级启动）；如果 `.spec.ts` 执行失败，由 AI 驱动回退到逐步骤执行并诊断原因
- **新增 spec 自动同步机制**：当回退执行确认是页面元素变更而非 Bug 时，AI 自动更新 `.spec.ts` 适配新元素
- **修改 sweep-run 执行流程**：SKILL.md 的执行链路从"AI 解析 → AI 执行"变为"解析器解析 → 预编译脚本 → 原生执行 → 失败回退 → 自动修复"

## Capabilities

### New Capabilities
- `flow-parser`: 结构化解析 `.flow.md` 文件。使用 `gray-matter` 提取 frontmatter，用正则/语法解析提取 Flow 结构（场景、步骤、验证点），输出结构化 JSON 供下游使用
- `spec-compilation`: 将解析后的 `.flow.md` 结构自动编译为 Playwright `.spec.ts` 测试脚本，保持语义等价
- `self-healing-spec`: 当 `.spec.ts` 执行失败时，由 AI 驱动浏览器重新执行并诊断失败原因。确认是页面元素变更后自动更新 `.spec.ts`

### Modified Capabilities
- `flow-execution`: 执行流程从"AI 解析 + AI 逐步骤驱动"改为"解析器预编译 + 原生 Playwright 执行 + AI 回退容错"。新增 Hybrid Execution 执行模式，新增 spec 与 flow.md 同步机制

## Impact

- `packages/sweep/skills/sweep-run/SKILL.md`：执行流程重构，新增混合执行模式
- `packages/sweep/skills/sweep-plan/SKILL.md.tmpl`：可能需要调整生成的 `.flow.md` 格式以更好适配解析器
- Playground e2e 项目：新增 `flows/.spec/` 或同级目录存储预编译的 `.spec.ts` 文件
- 依赖层面：playground e2e 项目需新增 `@playwright/test` 作为 devDependency
- 无 Breaking Changes：原有 `--browser` 模式和 `--no-parallel` 参数保持兼容
