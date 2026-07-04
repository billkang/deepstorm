## ADDED Requirements

### Requirement: 解析器 SHALL 结构化解析 .flow.md 文件

Flow Parser SHALL 使用代码解析器（非 AI）将 `.flow.md` 文件解析为结构化数据，供下游编译器和执行器使用。

#### Scenario: 解析成功输出结构化 JSON
- **WHEN** 解析器接收一个有效的 `.flow.md` 文件路径
- **THEN** 解析器 SHALL 使用 `gray-matter` 提取 frontmatter（功能名称、来源、创建时间）
- **AND** 解析器 SHALL 提取场景清单表格（ID、场景、类型、优先级）
- **AND** 解析器 SHALL 提取每个 Flow 的 ID、标题、前置条件、执行步骤和验证点、环境要求
- **AND** 解析器 SHALL 输出一个结构化 JSON 对象

#### Scenario: 解析失败时返回错误信息
- **WHEN** 解析器接收一个不存在的文件路径
- **THEN** 解析器 SHALL 返回明确的错误信息，指出文件不存在
- **AND** 不抛出未捕获异常

#### Scenario: 格式不规范的 .flow.md 降级处理
- **WHEN** `.flow.md` 缺少某些可选字段（如没有前置条件或环境要求）
- **THEN** 解析器 SHALL 在不影响其他字段解析的情况下，将缺失字段设为空值
- **AND** 不中断整体解析过程

#### Scenario: 解析器识别执行步骤和验证点
- **WHEN** 解析流流程中的执行步骤章节
- **THEN** 解析器 SHALL 提取每个步骤的序号和描述
- **AND** 提取每个步骤关联的验证点（`✅ 验证点：` 标记后的内容）
- **AND** 验证点提取支持同一步骤多个验证点

---

### Requirement: 解析器输出格式稳定可预测

解析器的输出 JSON Schema SHALL 保持稳定，作为编译器和执行器之间的契约。

#### Scenario: 输出 JSON Schema 定义
- **WHEN** 解析器完成解析
- **THEN** 输出 JSON SHALL 包含顶层字段：`featureName`、`source`、`createdAt`、`scenarios`（数组）、`flows`（数组）
- **AND** 每个 flow 对象 SHALL 包含：`id`、`title`、`preconditions`（可选）、`steps`（数组）、`envRequirements`（可选）
- **AND** 每个 step 对象 SHALL 包含：`order`（数字序号）、`description`（步骤描述文本）、`validations`（验证点字符串数组）

#### Scenario: 输出序列化稳定
- **WHEN** 同一 `.flow.md` 被多次解析
- **THEN** 输出 JSON 内容 SHALL 逐字节一致（相同版本解析器）
- **AND** 响应时间 SHALL 在 100ms 以内

---

### Requirement: 解析器作为独立模块可调用

Flow Parser SHALL 封装为独立可复用的 Node.js 模块，支持编程调用和 CLI 调用两种方式。

#### Scenario: 编程 API 调用
- **WHEN** 其他模块通过 `require` / `import` 引入解析器
- **THEN** 解析器 SHALL 暴露 `parse(filePath: string): FlowParseResult` 接口
- **AND** 同步或 Promise 返回均可接受

#### Scenario: CLI 调用
- **WHEN** 开发者通过 CLI 调用解析器
- **THEN** 解析器 SHALL 支持 `node parser.mjs <file-path>` 形式调用
- **AND** 输出可选为 JSON（stdout）或写入文件
