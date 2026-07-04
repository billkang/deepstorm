## ADDED Requirements

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
