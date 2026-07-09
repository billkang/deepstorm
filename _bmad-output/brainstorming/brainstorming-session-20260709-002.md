# Brainstorming Session — Reef Hook 防御链增强

- **日期：** 2026-07-09
- **主题：** 增强 Reef Hook 系统的代码风格防御链，建立「事前提醒 + 事后验证 + 自动修正」三级防御
- **参与角色：** User (Dev) / Claude (AI)

## 讨论内容

### 背景

在实际项目使用 reef 的过程中，Claude 经常不按照 code-style 输出代码，导致代码质量低。当前防御链依赖 prompt hook 的软约束（模型"看到"指令但可选择性忽略），且缺乏事后验证和自动修正机制。

此前 ARCHITECTURE.md 已记录 Command Hook Deny 机制不生效（harness 不消费 `permissionDecision: "deny"`），实际有效防御仅靠 prompt hook + CLAUDE.md 铁律。

### 现状分析 — 6 个断层

| # | 断层 | 严重程度 | 说明 |
|---|------|---------|------|
| 1 | Prompt hook 只有"加载 skill"，未内联核心规则 | 🔴 | 模型可能加载 skill 但没读完几十条规则 |
| 2 | SKILL.md 规则太多（30+ 条），模型记不住 | 🟡 | 模型在长上下文中易遗忘或选择性忽略 |
| 3 | Java auto-format = no-op | 🔴 | `reef-auto-format.sh.tmpl` 对 Java 不执行任何格式化 |
| 4 | 无事后验证 | 🔴 | 写完文件后没有 checkstyle/ruff 验证是否符合规范 |
| 5 | Command hook deny 不生效 | 🟡 | harness 不消费 deny 语义 |
| 6 | Prompt hook 无自证要求 | 🟡 | 模型不需要确认"已遵守规则"就可以写代码 |

### 目标方案

用户要求：**全都要** — 事前提醒 + 事后检查 + 自动修正

#### L1 — 事前提醒：Prompt Hook 内联核心规则

不在 prompt hook 中只说"加载 skill"，而是把 5-7 条最核心的规则直接内联进去。即使 skill 加载失败或模型没读完，核心铁律在每次写文件前都会出现。

内联规则示例（Java）：
1. 100 列换行，运算符/`.`/`::` 放行首
2. 领域事件用 `@Getter @AllArgsConstructor`，禁止 `@Data`
3. 禁止 `@Autowired` 字段注入，必须构造函数注入
4. 用 Abstract Method 替代 `instanceof` 链做类型分发
5. Model/Entity 字段加 `/** */` 注释，DTO 不加
6. 字符串格式化用 `formatted()`，不用 `+` 拼接
7. 禁止花式注释分隔线（`// ======`）

同时保留"加载完整 skill"的引用，作为辅助。

#### L2 — 事后验证：新增 code-style-verify PostToolUse hook

**目前完全不存在，是最大缺口。**

新增 `reef-code-style-verify.sh`，在每次 Edit/Write 后运行：

| 语言 | 验证工具 | 验证项 |
|------|---------|--------|
| Java | checkstyle + 自定义规则 | 列宽、命名、import、javadoc |
| Python | ruff check | F+E+I+N |
| TS/JS | eslint | 已有 eslint 配置 |

不通过时：输出详细违规报告 + 注入 `<system-reminder>` 要求模型修正。

#### L3 — 自动修正：Auto-format 增强

Java 从 no-op 改为调用 `google-java-format`，wizard.json 新增可配置选项。

### 关键决策

| # | 事项 | 结论 | 理由 |
|---|------|------|------|
| 1 | L1 规则粒度 | 每条规则一句话 + 正反示例 | 纯文字不够直观，正反示例能显著提高模型遵循率 |
| 2 | L2 验证时机 | 每次 Edit/Write 后异步验证 | 实时反馈，不影响用户操作流 |
| 3 | L2 验证严格度 | 温柔模式（告警 + 注入 system-reminder） | 不阻塞工作流，但让模型知道问题 |
| 4 | L3 Java 格式化 | 默认 google-java-format | 轻量、标准、社区广泛使用 |
| 5 | 自定义规则 | Checkstyle 检查不了 Lombok 规则 | 需要用正则或 grep 补充 |
| 6 | Prompt hook 顺序 | 先内联核心规则，再说加载 skill | 确保核心规则总是可见 |

### 预期影响的文件

**修改：**
- `packages/reef/hooks/hooks.json` — 增强 prompt hook 内容，添加 L2 hook 注册
- `packages/reef/hooks/reef-auto-format.sh.tmpl` — Java 添加 google-java-format

**新增：**
- `packages/reef/hooks/reef-code-style-verify.sh` — 写后代码风格验证
- `packages/reef/hooks/reef-code-style-verify.sh.tmpl` — 模板版本（含 wizard 配置）

**可能修改：**
- `packages/reef/wizard.json` — 新增 Java 格式化工具配置选项
