# Brainstorming Session

**日期：** 2026-06-22
**主题：** sweep-run 执行效率优化
**参与者：** Bill（需求方）、Claude

---

## 讨论背景

当前 `/sweep-run` 执行 E2E 测试流程时速度很慢。每次执行都由 AI 逐条阅读理解 `.flow.md`，再通过 Playwright MCP 逐步骤操作浏览器。在测试文件较多时，执行时间不可接受。

## 关键讨论

### 痛点确认

1. **解析环节慢**：AI 用自然语言阅读理解 `.flow.md` 的结构（场景、步骤、验证点），解析成本高
2. **执行环节慢**：每个 Flow 的每一步操作都通过 MCP 调用浏览器，串行执行开销大

### 方案 A：解析器化（结构化解析 `.flow.md`）

用代码解析器替代 AI 的自然语言理解：
- 使用 `gray-matter` 提取 frontmatter + 正则/语法解析提取 Flow 结构
- 解析结果直接供 `browser_run_code_unsafe` 编译 Playwright 脚本使用
- AI 不再需要逐条理解 `.flow.md`，解析时间从秒级降为微秒级

### 方案 B：混合执行策略（Hybrid Execution）

**核心创新**：引入预编译 `.spec.ts` 的同时，用 AI 做容错和自动修复。

执行链路：
1. 由解析器从 `.flow.md` 预编译生成 Playwright `.spec.ts`
2. 默认走 `npx playwright test` 原生执行（毫秒级启动，~20x 加速）
3. 如果 `.spec.ts` 跑不过 → **不一定是 bug**，可能是页面元素变更
4. AI 驱动回退到逐步骤执行，诊断实际页面状态
5. 如果页面元素变了 → **自动更新 `.spec.ts`**，使 spec 永远和页面保持同步
6. 如果 AI 也跑不过 → 报告为真正的 Bug

**关键优势**：解决了"生成 spec 后页面变化导致 spec 荒废"的问题。AI 充当自适应层，spec 和页面之间的漂移由 AI 自动修复。

### 预期加速比

| 路径 | 场景 | 加速比 | 预期发生概率 |
|------|------|--------|------------|
| `.spec.ts` 直接通过 | 页面未变化 | ~20x | ~70% |
| Hybrid 回退更新 spec | 页面元素变更 | ~1x（和现在持平） | ~25% |
| 两者都失败 | 真有 Bug | ~1x（需人工介入） | ~5% |

## 决定

- **方案 A 和 B 全部实施**，不拆分
- 变更名为 `sweep-run-hybrid-execution`
- 进入 OpenSpec 流程：proposal → specs → design → tasks
