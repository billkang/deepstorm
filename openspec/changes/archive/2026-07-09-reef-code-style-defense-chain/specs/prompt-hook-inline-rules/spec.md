## ADDED Requirements

### Requirement: Java 文件写入前内联核心编码铁律

在 Edit/Write 一个 `.java` 文件前，Prompt Hook SHALL 在系统提示中插入 Java 后端编码的 5 条最常违规的核心铁律。这些规则 MUST 直接内联在 prompt hook 中（不依赖 skill 加载），确保模型在写代码前立刻看到。其余完整规范通过加载 `reef-style-backend` skill 获取。

格式规范（100 列换行、运算符位置等）由 google-java-format 自动处理，不在内联规则中重复。

#### Scenario: .java 文件 Edit/Write 前注入核心规则
- **WHEN** PreToolUse 检测到目标文件扩展名为 `.java`
- **THEN** 系统注入包含以下 5 条 Java 核心编码铁律的 Prompt Hook：
  1. 领域事件 / POJO 用 `@Getter @AllArgsConstructor`，**禁止 `@Data`**
  2. **禁止 `@Autowired`** 字段注入，必须构造函数注入（`@RequiredArgsConstructor`）
  3. 用 Abstract Method 替代 `instanceof` 链做类型分发
  4. 字符串用 `formatted()` / Text Block，不用 `+` 拼接
  5. Service/Controller 用 `@RequiredArgsConstructor`，Entity 用 `@Getter @NoArgsConstructor(access = PROTECTED)`
- **AND** 在核心规则之后，保留"加载 reef-style-backend skill 阅读完整规范"的引用

#### Scenario: Python 文件写入前内联核心编码铁律
- **WHEN** PreToolUse 检测到目标文件扩展名为 `.py`
- **THEN** 系统注入包含以下 5 条 Python 核心编码铁律的 Prompt Hook：
  1. f-string 替代 `%` 格式化或 `.format()`
  2. snake_case 命名（函数/变量），PascalCase 命名（类）
  3. 所有函数标注返回类型和参数类型（mypy 通过）
  4. 用 `is` / `is not` 比较 `None`，不用 `== None`
  5. 用 Enum / Abstract Method / Protocol 替代 `isinstance()` 链做类型分发
- **AND** 在核心规则之后，保留"加载 reef-style-backend skill 阅读完整规范"的引用

#### Scenario: TypeScript 文件写入前内联核心编码铁律
- **WHEN** PreToolUse 检测到目标文件扩展名为 `.ts` / `.tsx`
- **THEN** 系统注入包含以下 5 条 TypeScript 核心编码铁律的 Prompt Hook（根据前端框架变体 Angular/React/Vue 选择对应规则）：
  1. Standalone + OnPush + `inject()`（Angular）/ 函数组件 + hooks（React）/ `<script setup lang="ts">`（Vue）
  2. `output()` 替代 `@Output()`（Angular）/ 自定义 hooks 替代类组件生命周期（React）
  3. `signal()` / `computed()` 管理响应式状态
  4. `loadComponent` 懒加载路由
  5. `interface` 定义 Props / Entity 类型
- **AND** 在核心规则之后，保留"加载 reef-style-frontend skill 阅读完整规范"的引用

### Requirement: Prompt Hook 包含自证要求

Prompt Hook 的末尾 MUST 包含一条自证指令，要求模型在输出代码前先确认已遵守核心规则，减少"选择性忽略"的可能。

#### Scenario: 模型写代码前确认规则
- **WHEN** Prompt Hook 注入核心铁律后
- **THEN** 指令末尾附加："在编写代码前，先输出 `✅ [STYLE] 已确认 {语言} 编码铁律` 确认你已经阅读并遵守了以上规则。"
