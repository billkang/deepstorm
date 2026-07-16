## Purpose

Sweep flow execution — 通过 Playwright MCP 或本机 Playwright 测试运行器逐步骤执行 .flow.md 测试意图文档，支持交互式选择、参数指定、多环境切换、结果持久化。支持混合执行模式（原生 Playwright 执行 + AI 自愈）。
## Requirements
### Requirement: Skill 检查项目初始化状态

Flow-execution skill（`/sweep:run`）SHALL 在执行前检查项目是否已通过 setup 初始化。

#### Scenario: 项目已初始化
- **WHEN** 用户执行 `/sweep:run`
- **AND** 项目已初始化（存在 `.sweep-init` 标记文件）
- **THEN** skill SHALL 继续执行流程

#### Scenario: 项目未初始化
- **WHEN** 用户执行 `/sweep:run`
- **AND** 项目未初始化
- **THEN** skill SHALL 提示"当前目录尚未初始化为 Sweep 测试项目。请先运行 /sweep:init 初始化。"并退出

---

### Requirement: Skill 支持交互式层级选择

Flow-execution skill SHALL 在不带参数运行时，根据 topology.yaml 的模块结构提供交互式层级选择。

#### Scenario: 展示模块层级
- **WHEN** 用户执行 `/sweep:run`（不带参数）
- **THEN** skill SHALL 读取 `flows/topology.yaml` 获取模块结构
- **AND** skill SHALL 调用 `scripts/flow-selector.mjs` 渲染当前层级的 checkbox 列表
- **AND** 基于 `@inquirer/checkbox` 实现，空格勾选 + 回车确认
- **AND** 第一项为"全部执行"

#### Scenario: 逐级深入
- **WHEN** 用户勾选了某个有子模块的模块
- **AND** 未勾选"全部执行"
- **THEN** skill SHALL 进入该模块的子层
- **AND** 使用 AskUserQuestion 渲染子模块列表
- **AND** 用户再次勾选 + 确认

#### Scenario: 模块下无 flow 文件
- **WHEN** 用户选择的模块目录下没有 `.flow.md` 文件
- **THEN** skill SHALL 提示"该模块下暂无测试流程"并返回上级层

---

### Requirement: Skill 支持直接参数指定执行范围

Flow-execution skill SHALL 支持通过参数直接指定执行范围，跳过交互式选择。

#### Scenario: 全量执行
- **WHEN** 用户执行 `/sweep:run --all`
- **THEN** skill SHALL 扫描 `flows/` 目录下的所有 `.flow.md` 文件
- **AND** skill SHALL 依次执行每个文件中的所有 Flow

#### Scenario: 按模块路径执行
- **WHEN** 用户执行 `/sweep:run --path user-system/login`
- **THEN** skill SHALL 执行 `flows/user-system/login/` 目录下的所有 `.flow.md` 文件

#### Scenario: 单文件执行
- **WHEN** 用户执行 `/sweep:run flows/user-system/login.flow.md`
- **THEN** skill SHALL 仅执行指定文件中的所有 Flow

#### Scenario: 单 Flow 执行
- **WHEN** 用户执行 `/sweep:run flows/user-system/login.flow.md --flow L02`
- **THEN** skill SHALL 仅执行指定文件中 ID 为 L02 的 Flow

#### Scenario: 指定路径不存在
- **WHEN** 用户指定的文件或 --path 路径不存在
- **THEN** skill SHALL 提示"指定路径不存在"并根据 topology.yaml 列出可用模块

---

### Requirement: Skill 通过 Playwright MCP 执行测试

Flow-execution skill SHALL 通过 Playwright MCP 逐步骤操作浏览器执行测试流程，并验证每个步骤的预期结果。

#### Scenario: 逐步骤执行
- **WHEN** skill 开始执行一个 Flow
- **THEN** skill SHALL 读取该 Flow 的每个执行步骤
- **AND** skill SHALL 通过 Playwright MCP 执行浏览器操作（导航、点击、输入等）
- **AND** skill SHALL 在每个步骤后通过 Playwright MCP 验证 ✅ 验证点

#### Scenario: 步骤执行失败
- **WHEN** 某一步骤的验证点检查失败
- **THEN** skill SHALL 记录该步骤为失败
- **AND** skill SHALL 继续执行后续步骤（不中断）
- **AND** 最终报告中标注失败步骤

---

### Requirement: Skill 支持多环境切换

Flow-execution skill SHALL 通过 `--env` 参数支持目标环境切换，将对应环境的 baseURL 注入 Playwright 配置。

#### Scenario: 指定目标环境
- **WHEN** 用户执行 `/sweep:run --env staging`
- **THEN** skill SHALL 从 `.env` 读取 `BASE_URL_STAGING` 的值
- **AND** skill SHALL 将 baseURL 设置为该值

#### Scenario: 不指定环境
- **WHEN** 用户执行 `/sweep:run` 不指定 `--env`
- **THEN** skill SHALL 使用 `.env` 中的 `DEFAULT_ENV` 值
- **AND** 如 `DEFAULT_ENV` 未设置，SHALL 默认使用 `test`

#### Scenario: 指定环境不存在
- **WHEN** 用户指定的 `--env` 值在 `.env` 中找不到对应配置
- **THEN** skill SHALL 提示"未找到 [env] 环境的 baseURL 配置，请检查 .env 文件"
- **AND** SHALL 列出 `.env` 中已有的环境列表

---

### Requirement: Skill 输出并持久化测试报告

Flow-execution skill SHALL 在执行完成后输出测试报告，同时在终端实时显示和在 `flows/reports/` 中持久化。

#### Scenario: 终端实时输出
- **WHEN** skill 执行 Flow
- **THEN** skill SHALL 在终端实时显示：
  - 当前正在执行的步骤描述
  - 每个步骤的验证结果（✅ 通过 / ❌ 失败）
  - 最终的汇总统计（总步骤数 / 通过数 / 失败数）

#### Scenario: 报告持久化
- **WHEN** 执行完成
- **THEN** skill SHALL 将完整执行报告写入 `flows/reports/{flow-name}-{timestamp}.report.md`
- **AND** 报告 SHALL 包含：执行时间、目标环境、每个步骤的执行结果、失败步骤的详情

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

### Requirement: env-manager 从 .deepstorm/settings.json 读取 E2E 框架配置

`env-manager.mjs` 的 `readFramework()` SHALL 从 `.deepstorm/settings.json` 读取 `sweep.e2eFramework` 确定当前项目使用的 E2E 测试框架，不再回退到 `.claude/settings.json`。

#### Scenario: .deepstorm/settings.json 中存在配置
- **WHEN** `.deepstorm/settings.json` 中存在 `sweep.e2eFramework` 字段
- **THEN** `readFramework()` SHALL 返回该字段的值
- **AND** source SHALL 标记为 `"deepstorm-settings"`

#### Scenario: .deepstorm/settings.json 不存在
- **WHEN** `.deepstorm/settings.json` 不存在
- **THEN** `readFramework()` SHALL 返回 `{ framework: null, source: "missing-file" }`

#### Scenario: 配置未设置
- **WHEN** `.deepstorm/settings.json` 存在但 `sweep.e2eFramework` 字段缺失
- **THEN** `readFramework()` SHALL 返回 `{ framework: null, source: "not-configured" }`

#### Scenario: 配置文件格式错误
- **WHEN** `.deepstorm/settings.json` 格式非法
- **THEN** `readFramework()` SHALL 返回 `{ framework: null, source: "parse-error" }`

#### Scenario: 配置值为 playwright
- **WHEN** `readFramework()` 返回 `{ framework: "playwright" }`
- **THEN** sweep-run SHALL 通过 Playwright MCP（`deepstorm-playwright`）执行浏览器操作

#### Scenario: 配置值为 null
- **WHEN** `readFramework()` 返回 `{ framework: null }`
- **THEN** sweep-run SHALL 提示"E2E 框架未配置，请运行 deepstorm setup 重新配置"并退出

