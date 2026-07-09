## ADDED Requirements

### Requirement: Java 文件写入后自动格式化

在 Edit/Write 一个 `.java` 文件后，PostToolUse hook SHALL 自动调用 `google-java-format` 对文件进行格式化，确保列宽、缩进、换行等格式规范自动修正。该行为是强制的，不提供关闭选项。

#### Scenario: .java 文件写入后执行 google-java-format
- **WHEN** PostToolUse 检测到目标文件扩展名为 `.java`
- **AND** `google-java-format` 工具已安装
- **THEN** 系统调用 `google-java-format -i` 格式化该文件
- **AND** 静默退出，不产生输出

#### Scenario: google-java-format 不存在时优雅降级
- **WHEN** PostToolUse 检测到目标文件扩展名为 `.java`
- **AND** `google-java-format` 工具未安装
- **THEN** 系统输出一条 warning 提示安装 `google-java-format`
- **AND** 不阻塞正常开发流程

### Requirement: 支持通过 wizard.json 配置 Java 格式化工具

系统 SHALL 在 `wizard.json` 中提供 Java 格式化工具的静态配置（type: static），固定使用 `google-java-format`，不提供用户选择。该配置 SHALL 影响 `reef-auto-format.sh.tmpl` 的渲染结果。

#### Scenario: 每次安装始终启用 google-java-format
- **WHEN** 用户通过 CLI setup 安装 reef（选择 Java 后端）
- **THEN** `wizard.json` 中的 `reef.backend.java.formatTool` 始终为 `google-java-format`
- **AND** `reef-auto-format.sh` 中的 `*.java` 分支始终为调用 `google-java-format -i`
