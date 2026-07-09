## Context

Reef Hook 系统的代码风格防御链目前仅依赖 PreToolUse prompt hook 的软约束（提示模型加载 code-style skill），缺乏事后验证和自动修正能力。此前 ARCHITECTURE.md 已记录 Command Hook deny 语义在当前 harness 中不生效。

当前防御链：

```
PreToolUse prompt hook → "加载 reef-style-{backend|frontend} skill"
    ↓
模型写代码（可能遵守/可能忽略规则）
    ↓
PostToolUse auto-format → Java: NO-OP, Python: ruff, TS: eslint
    ↓
无验证 → 不符合规范的代码写入文件
```

目标防御链：

```
PreToolUse prompt hook → 内联 5 条最常违规核心铁律 + skill 引用（增强）
    ↓
模型写代码（核心规则就在提示中，无法"没看到"）
    ↓
PostToolUse auto-format → Java: google-java-format ✅（增强）
    ↓
PostToolUse code-style-verify → checkstyle/ruff/eslint 验证 → 不通过则告警（新增）
```

## Goals / Non-Goals

**Goals:**
- 每次 Edit/Write 前，模型能看到核心编码铁律（不依赖 skill 加载）
- 每次 Edit/Write 后，系统自动验证代码风格合规性
- Java 文件写入后自动格式化（google-java-format）
- 规则按语言/框架差异化（Java / Python / TS）
- 验证/格式化工具不存在时优雅降级
- 可配置 Java 格式化工具开关

**Non-Goals:**
- 不修改大部分 code-style 规则内容（`// ======` 分隔线规则除外——已从禁令翻转为推荐）
- 不修改 Command Hook deny 语义（harness 限制，不在本变更范围）
- 不涉及 CI/CD 流水线中的代码风格检查（仅关注开发时 hook）
- 不新增编程语言的格式化/验证支持（仅覆盖现有支持的 Java/Python/TS）

## Decisions

### D1: Prompt Hook 规则组织方式 — 单 hook 包含所有规则集

**选项对比：**

| 选项 | 优点 | 缺点 |
|------|------|------|
| A: 单 prompt hook 包含所有规则集 | 实现简单，无需变更 hook 注册结构 | 模型会看到不相关的规则（如写 Python 时看到 Java 规则），但模型有足够上下文忽略无关内容 |
| B: 按文件类型拆分为多个 prompt hook entry | 精确注入，模型只看到相关规则 | 需在 hooks.json 中为每个文件类型创建独立的 PreToolUse matcher，配置膨胀 |

**决策：** 选择方案 A。模型能根据 `tool_input.file_path` 自动选择适用规则。多出的 2-3 组不相关规则对 token 消耗影响极小（<200 tokens），且方案 B 的维护成本更高（每新增一种语言需修改 hooks.json）。

**Prompt Hook 结构：**
```
1. 自证要求指令（确认已阅读规则）
2. Java 核心铁律（5 条最常违规的）
3. Python 核心铁律（5 条）
4. TypeScript/Angular/React/Vue 核心铁律（5 条）
5. 完整 skill 引用提示（"完整规范请加载 reef-style-{backend|frontend} skill 阅读"）
```

### D2: PostToolUse 验证的执行模式 — async 非阻塞

**选项对比：**

| 选项 | 优点 | 缺点 |
|------|------|------|
| A: async 非阻塞 | 不中断用户工作流，验证在后台完成 | 告警可能被用户忽略 |
| B: sync 阻塞等待 | 确保用户看到验证结果 | 打断节奏，降低用户体验 |

**决策：** 选择方案 A（async）。验证结果通过 `echo` 输出到 hook 输出流，用户可见但不阻塞。使用 `hooks.json` 的 `"async": true` 配置。

### D3: 验证规则定义方式 — shell 脚本内联判断

**选项对比：**

| 选项 | 优点 | 缺点 |
|------|------|------|
| A: shell 脚本内联 | 自包含，无需额外配置文件 | 规则修改需改脚本 |
| B: 外部 YAML/JSON 配置文件 | 规则可单独修改 | 增加了文件数量和复杂度，wizard.json 格式变更 |

**决策：** 选择方案 A。当前验证规则数量有限（3 种语言 × 各 1 个工具），不构成独立的配置管理需求。未来规则数量增长时再提取为独立配置。

### D4: Java 格式化工具 — 强制 google-java-format

| 选项 | 优点 | 缺点 |
|------|------|------|
| A: google-java-format（选择） | 轻量、标准 | 用户可能选择 none 使 L3 防御失效 |
| B: spotlessApply (Gradle) | 高度可配置 | 启动慢（需要 Gradle daemon），重 |
| C: 强制 google-java-format（最终决策） | 保证防御链完整，无需用户决策 | 多项目仍可使用删除 hook 的方式绕过 |

**决策：** 最终采用方案 C（强制）。wizard.json 中 type 改为 `static`，固定 `google-java-format -i`，不提供用户选择。google-java-format 只处理格式（列宽、缩进、换行），不修改逻辑，零风险。

### D5: System-reminder 注入方式

验证不通过时，系统需注入 `<system-reminder>` 要求模型修正。但 command hook 的输出不能直接注入 system-reminder。
**方案：** 通过 `echo` 输出格式化文本到 hook 输出流，内容包含明确的违规报告和修正要求。模型在 PostToolUse 阶段能看到这些输出。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| [R1] Prompt hook 太长导致 token 消耗增加 | 每种语言仅 5 条最常违规规则，每条不超过 20 字，总长度控制在 300 tokens 以内 |
| [R2] google-java-format 与现有 checkstyle 配置冲突 | google-java-format 只处理格式（列宽、缩进、换行），不修改逻辑；checkstyle 规则单独在 verify 中执行 |
| [R3] 验证工具未安装时静默降级，用户不知道缺少工具 | 在 auto-format 的 Java 分支输出一次 warning 提示安装 |
| [R4] 自证要求可能被模型敷衍（输出确认后仍不遵守） | 自证要求是辅助手段，主要防御靠 L2 验证 |
| [R5] PostToolUse verify 在大型文件上性能问题 | 验证限定为刚修改的单文件，不扫描全项目，单文件 checkstyle 通常在 <1s |

## Migration Plan

1. 修改 `hooks.json` 中的 prompt hook 内容
2. 修改 `reef-auto-format.sh.tmpl` 中的 Java 分支
3. 新增 `reef-code-style-verify.sh`/`.tmpl` 脚本
4. 修改 `wizard.json` 新增 Java 格式化工具配置
5. 更新 `ARCHITECTURE.md`
