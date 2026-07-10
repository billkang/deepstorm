# LLM Code Style Rules

Backend code style rules for LLM-generated code, covering Java (Spring Boot) and Python (FastAPI) variants.

## Purpose

Define the code style constraints that LLM-agents MUST follow when generating backend code. These rules ensure consistency with project-level formatting and linting expectations, reducing manual cleanup and review overhead.

## Requirements

### Requirement: 控制流语句必须使用大括号

LLM 生成的所有 Java 代码中，`if`、`else`、`for`、`while`、`do` 的控制流体 SHALL 使用大括号 `{}` 包裹，无论体是否只有一行。

对应 Checkstyle `NeedBraces` 规则（`LITERAL_DO, LITERAL_ELSE, LITERAL_FOR, LITERAL_IF, LITERAL_WHILE`）。

#### Scenario: 单行 if 语句必须使用大括号
- **WHEN** LLM 生成 `if (condition) doSomething()` 形式的单行 if 代码
- **THEN** LLM SHALL 改为 `if (condition) { doSomething(); }` 形式

#### Scenario: if-else 各分支各自使用大括号
- **WHEN** LLM 生成 if-else 语句，其中任一分支仅为单行
- **THEN** if 体和 else 体各自 SHALL 使用大括号包裹

#### Scenario: for 循环使用大括号
- **WHEN** LLM 生成 for 循环语句，循环体仅为单行
- **THEN** 循环体 SHALL 使用大括号包裹

#### Scenario: while 循环使用大括号
- **WHEN** LLM 生成 while 循环语句，循环体仅为单行
- **THEN** 循环体 SHALL 使用大括号包裹

#### Scenario: do-while 循环使用大括号
- **WHEN** LLM 生成 do-while 循环语句
- **THEN** 循环体 SHALL 使用大括号包裹

### Requirement: 禁止声明未被使用的局部变量

LLM 生成的 Java 代码中 MUST NOT 声明未被使用的局部变量。在 switch 模式匹配中必须使用 `_`（匿名模式变量）替代命名变量。

对应 Java 编译器未使用局部变量警告和 Java 21+ 匿名模式变量特性。

#### Scenario: 未使用的局部变量不得声明
- **WHEN** LLM 生成的方法体中有仅分配但从未被读取的局部变量
- **THEN** LLM SHALL 删除该变量声明，或将其用于后续逻辑

#### Scenario: switch pattern 未使用变量用 `_` 替代
- **WHEN** LLM 生成 switch 或 switch 表达式中的模式匹配分支，且模式变量在分支体中未被使用
- **THEN** LLM SHALL 使用 `_`（匿名模式变量）替代命名变量，例如 `case UserMessage _ ->` 而非 `case UserMessage ignored ->`

#### Scenario: catch 块未使用的异常参数
- **WHEN** LLM 生成 try-catch 代码，catch 块中未使用异常变量
- **THEN** LLM SHALL 使用 `_` 替代命名变量，例如 `catch (IOException _) { log.error("IO error"); }`

### Requirement: 局部变量声明靠近首次使用且正确使用 `final`

LLM 生成的 Java 代码中，局部变量声明的位置 SHALL 遵循以下约束：声明与首次使用的行数距离 SHALL ≤ 3 行；从方法调用返回值赋值的局部变量 SHALL 使用 `final` 修饰以避免副作用。

对应 Checkstyle 的变量声明距离检查规则，和局部变量 `final` 推荐规则。

#### Scenario: 变量声明靠近首次使用处
- **WHEN** LLM 生成的代码中有一个局部变量在方法体早期声明，但首次使用在 4+ 行之后
- **THEN** LLM SHALL 将该变量的声明移至靠近首次使用处（≤ 3 行），或如果只有一次赋值则保持 `final` 声明更早的位置

#### Scenario: 方法返回值存储使用 `final`
- **WHEN** LLM 生成的代码从方法调用获取返回值并赋值给局部变量
- **THEN** 该局部变量 SHALL 使用 `final` 修饰（`final var x = methodCall(...)`），除非该变量后续会被重新赋值

### Requirement: Python 变体同步大括号规则（如适用）

如果 Python 变体的 `quick-reference.md` 包含了控制流风格相关规范，则 SHALL 同步更新；如果 Python 变体不存在控制流风格规范，则无须修改。

#### Scenario: Python 变体检查
- **WHEN** `packages/reef/skills/reef-style-backend/variants/python/quick-reference.md` 文件中存在类似的控制流编码规范章节
- **THEN** SHALL 按语言习惯补充对应的代码风格约束
