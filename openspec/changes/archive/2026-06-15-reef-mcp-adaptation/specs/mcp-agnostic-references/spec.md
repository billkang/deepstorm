# MCP 无关引用文件

## Purpose

reef-start 的 4 个引用文件（当前名为 `jira-start-*`）内容涉及特定 MCP 服务的使用方式，需要改为通用描述，不绑定特定服务名称。引用文件名保持不变以避免破坏内部引用，但内容完全重写。

## Requirements

### Requirement: PRD 上下文获取引用文件通用化

`references/jira-start-dingtalk.md` SHALL 重写为通用知识库 PRD 获取指南，不再提及钉钉特定服务。

#### Scenario: 描述通用 PRD 获取流程

- **WHEN** AI 读取本引用文件
- **THEN** 文件 SHALL 描述的是通用的"从 Issue 描述中识别知识库链接 → 使用可用 knowledge_base MCP 读取 → 整合到 proposal"的流程
- **THEN** 文件 SHALL 不再提及 "dingtalk-wiki"、"钉钉知识库"、"钉钉开放平台"、"AppKey/AppSecret" 等钉钉特定术语
- **THEN** 文件 SHALL 使用通用的 "knowledge_base provider"、"文档链接"、"PRD 内容" 等描述
- **THEN** 文件 SHALL 保留降级处理：无可用知识库服务时询问用户手动提供

#### Scenario: 运行时 provider 选择

- **WHEN** 有多个可用 knowledge_base provider
- **THEN** 引用文件 SHALL 说明 AI 根据 Issue 链接自动选择对应 provider

---

### Requirement: 设计工具处理引用文件通用化

`references/jira-start-figma.md` SHALL 重写为通用设计工具处理指南，不再提及 Figma 特定服务。

#### Scenario: 描述通用设计工具获取流程

- **WHEN** AI 读取本引用文件
- **THEN** 文件 SHALL 描述的是通用的"从 Issue 中识别设计工具链接 → 使用可用 design_tools MCP 拉取设计数据 → 派遣子代理分析"的流程
- **THEN** 文件 SHALL 不再使用 "figma-developer"、"Figma"、"get_figma_data"、"download_figma_images"、"figma-analyzer" 等 Figma 特定术语（"Figma 设计"等描述性术语可保留为示例）
- **THEN** 文件 SHALL 使用通用的 "design_tools provider"、"fileKey"、"nodeId" 等字段描述

#### Scenario: 子代理派遣通用化

- **WHEN** 设计数据获取完成后需要分析
- **THEN** 引用文件 SHALL 描述通用的子代理派遣流程（派遣什么类型的 agent、传递什么参数）
- **THEN** 引用文件 SHALL 不再硬编码 `reef:reef-inspect-figma` agent 名称

---

### Requirement: 环境配置引用文件通用化

`references/jira-start-env.md` SHALL 重写为通用 MCP 环境配置指南，不再提及特定服务的凭证获取方式。

#### Scenario: 描述通用 MCP 环境变量结构

- **WHEN** AI 读取本引用文件
- **THEN** 文件 SHALL 描述的是通用的 ".env 文件 + .mcp.json 配置"的模式
- **THEN** 文件 SHALL 不再列出具体的 Jira/DingTalk/Figma 凭证变量和获取链接
- **THEN** 文件 SHALL 保留通用说明：各 MCP 服务的具体凭证由安装向导处理，AI 运行时通过 `deepstorm.installedMcpServers` 感知可用服务

---

### Requirement: 子代理实现引用文件通用化

`references/jira-start-subagent.md` SHALL 更新描述，不再提及"Figma 原始数据"等特定服务引用。

#### Scenario: 描述通用子代理实现流程

- **WHEN** AI 读取本引用文件
- **THEN** 其步骤 A 中的"Figma 原始数据（如有，优先使用 JSON 而非猜测）"SHALL 改为"设计工具数据（如有，优先使用 MCP 返回的原始数据而非猜测）"
- **THEN** 文件的其他内容（子代理循环、Spec 审查、冲突检查等）保持不变
