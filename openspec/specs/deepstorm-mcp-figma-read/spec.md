## ADDED Requirements

### Requirement: Figma 设计文件基本信息获取

deepstorm-mcp-figma-read skill SHALL 提供通过 Figma MCP 获取设计文件基本信息的操作指南。

#### Scenario: 获取文件元数据
- **WHEN** 需要了解 Figma 文件的名称、版本、最后修改时间
- **THEN** skill 指南 SHALL 说明如何调用 Figma MCP 的获取文件信息工具

### Requirement: Figma 设计节点数据读取

deepstorm-mcp-figma-read skill SHALL 提供读取 Figma 设计节点树结构和样式的操作指南。

#### Scenario: 获取完整节点树
- **WHEN** 需要查看设计稿的完整结构和布局信息
- **THEN** skill 指南 SHALL 说明如何调用 Figma MCP 的读取文件内容工具获取节点树

#### Scenario: 获取指定节点详情
- **WHEN** 需要查看特定 UI 元素或组件的详细样式属性
- **THEN** skill 指南 SHALL 说明如何调用 Figma MCP 的获取节点工具，传入 nodeId

#### Scenario: 获取组件和样式
- **WHEN** 需要获取文件中定义的本地组件、组件集（Variants）或颜色/文本样式
- **THEN** skill 指南 SHALL 说明如何调用对应的 Figma MCP 工具

### Requirement: Figma 设计稿图片导出

deepstorm-mcp-figma-read skill SHALL 提供将 Figma 节点导出为图片的操作指南。

#### Scenario: 导出节点图片
- **WHEN** 需要将设计稿中的某个节点保存为 PNG/JPEG/SVG 图片
- **THEN** skill 指南 SHALL 说明如何调用 Figma MCP 的获取图片工具

### Requirement: Issue 关联的设计链接识别

deepstorm-mcp-figma-read skill SHALL 说明如何从 Issue 中识别和提取 Figma 设计链接。

#### Scenario: 从 Issue Design 字段获取
- **WHEN** Issue 的 Design 字段包含 Figma 链接
- **THEN** skill 指南 SHALL 说明如何从字段值中提取 fileKey 和 nodeId

#### Scenario: 从 Issue 描述回退获取
- **WHEN** Design 字段不存在或为空
- **THEN** skill 指南 SHALL 说明回退到 Issue 描述中正则匹配 Figma 链接

### Requirement: 设计数据分析与整合

deepstorm-mcp-figma-read skill SHALL 说明如何将获取到的设计数据整合到开发文档中。

#### Scenario: 分析设计数据
- **WHEN** 设计数据已获取
- **THEN** skill 指南 SHALL 说明派遣子代理分析设计数据，提取布局结构、关键 UI 元素、交互流程

### Requirement: MCP 服务未配置时的降级处理

deepstorm-mcp-figma-read skill SHALL 提供设计工具 MCP 不可用时的降级方式说明。

#### Scenario: 降级处理
- **WHEN** `design_tools.available === false`
- **THEN** skill 指南 SHALL 说明告知用户未检测到设计工具服务并跳过设计稿获取
