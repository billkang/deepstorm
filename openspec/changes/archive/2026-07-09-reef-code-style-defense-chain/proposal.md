## Why

当前 Reef Hook 系统的代码风格防御链存在三个断层：事前提醒只有"加载 skill"的软约束（模型可选择性忽略）、事后无代码风格验证、Java 自动格式化是 no-op。实际使用中 Claude 输出的代码经常不符合 code-style 规范，需要人工修正。通过建立「事前提醒 + 事后验证 + 自动修正」三级防御链，让 code-style 的执行从"模型自觉"变为"系统保障"。

## What Changes

- **Prompt hook 增强**：在 Edit/Write PreToolUse prompt hook 中内联核心编码铁律（5-7 条），不再只依赖"加载 skill"的间接指示；同时保留 skill 引用作为完整规范入口
- **新增 post-write 代码风格验证 hook**：每次 Edit/Write 后自动运行 checkstyle（Java）/ ruff check（Python）/ eslint（TS）验证代码风格，不通过时输出告警并注入 `<system-reminder>` 要求修正
- **Java auto-format 启用**：`reef-auto-format.sh.tmpl` 中 Java 分支从 no-op 改为调用 google-java-format
- **wizard.json 新增 Java 格式化配置选项**：用户可在 `google-java-format` / `none` 之间选择
- **ARCHITECTURE.md 更新**：追加新的防御链架构记录

## Capabilities

### New Capabilities
- `post-write-style-verify`: 写后代码风格自动验证能力。每次 Edit/Write 后异步调用 linter 检查，不通过时输出告警并注入 `<system-reminder>` 要求模型修正
- `prompt-hook-inline-rules`: prompt hook 内联核心规则的能力。按文件类型（Java/Python/TS）动态插入 5-7 条最核心的编码铁律
- `java-auto-format`: Java 代码的自动格式化能力。通过 google-java-format 自动修正格式问题

### Modified Capabilities
- （无现有 spec 修改）

## Impact

- **修改文件**：
  - `packages/reef/hooks/hooks.json` — 增强 prompt hook 内容，新增 L2 hook 注册
  - `packages/reef/hooks/reef-auto-format.sh.tmpl` — Java 添加 google-java-format
  - `packages/reef/wizard.json` — 新增 Java 格式化工具配置选项
  - `packages/reef/hooks/ARCHITECTURE.md` — 追加新防御链架构

- **新增文件**：
  - `packages/reef/hooks/reef-code-style-verify.sh` — 写后代码风格验证脚本
  - `packages/reef/hooks/reef-code-style-verify.sh.tmpl` — 模板版本（含 wizard 配置变量）

- **影响范围**：所有使用 reef hook 系统的项目（安装后自动获得增强防御链）
- **不涉及**：前端 code-style 规则、后端 code-style 规则内容本身（quick-reference.md 不改），只改执行机制
