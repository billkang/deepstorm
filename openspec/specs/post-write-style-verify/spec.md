# Post-Write Style Verify

## Purpose

在 Edit/Write 操作完成后，自动对修改的源码文件执行代码风格验证（checkstyle/ruff/eslint），以 async 非阻塞模式输出违规报告或静默通过。该能力是 reef 代码风格防御链的第二环。

## Requirements

### Requirement: 写后代码风格自动验证

每次 Edit/Write 操作完成后，系统 SHALL 自动对刚修改的文件执行代码风格验证，并根据验证结果输出告警或静默退出。

该验证 SHALL 在 PostToolUse 阶段以 async 模式执行，不得阻塞用户操作流。

#### Scenario: Java 文件写后通过 checkstyle 验证
- **WHEN** Edit/Write 写入一个 `.java` 文件
- **THEN** 系统调用 `checkstyle`（或等价工具）验证该文件
- **AND** 如果所有规则通过，静默退出，不产生输出

#### Scenario: Java 文件写后未通过 checkstyle 验证
- **WHEN** Edit/Write 写入一个 `.java` 文件
- **AND** checkstyle 验证发现违规
- **THEN** 系统输出违规报告（文件名、行号、违规类型）
- **AND** 系统注入 `<system-reminder>` 要求模型修复违规

#### Scenario: Python 文件写后通过 ruff check 验证
- **WHEN** Edit/Write 写入一个 `.py` 文件
- **THEN** 系统调用 `ruff check` 验证该文件（规则 F+E+I+N）
- **AND** 如果所有规则通过，静默退出

#### Scenario: Python 文件写后未通过 ruff check 验证
- **WHEN** Edit/Write 写入一个 `.py` 文件
- **AND** `ruff check` 发现违规
- **THEN** 系统输出违规报告
- **AND** 系统注入 `<system-reminder>` 要求模型修复

#### Scenario: TypeScript/HTML 文件写后通过 eslint 验证
- **WHEN** Edit/Write 写入一个 `.ts` / `.tsx` / `.html` 文件
- **THEN** 系统调用 `eslint` 验证该文件
- **AND** 如果所有规则通过，静默退出

#### Scenario: 验证工具不存在时优雅降级
- **WHEN** 目标文件类型对应的验证工具未安装（如没有 checkstyle / ruff / eslint）
- **THEN** 系统静默退出，不输出错误
- **AND** 不阻塞正常的开发流程

### Requirement: 非源码文件跳过验证

系统 SHALL 只对源码文件（`.java` / `.py` / `.ts` / `.tsx` / `.html` / `.css` / `.scss` / `.less`）执行验证，跳过配置文件、资源文件等。

#### Scenario: 配置文件写后跳过验证
- **WHEN** Edit/Write 写入 `.json` / `.yaml` / `.yml` / `.xml` / `.properties` 文件
- **THEN** 系统跳过代码风格验证
