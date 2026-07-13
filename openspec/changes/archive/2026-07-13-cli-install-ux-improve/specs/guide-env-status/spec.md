## ADDED Requirements

### Requirement: guide 按 MCP 服务分组展示环境变量状态

`deepstorm setup` 完成后的引导输出（`printGuide`）中，SHALL 新增一个"环境变量配置状态"区块，按 MCP 服务分组展示每个服务的配置状态。每个 MCP 服务的状态分为三档：

- **✅ 已配置**：该服务的所有必填 key 在 `.env` 中都有非默认值
- **⚠️ 需要补填**：该服务已安装但 `.env` 中缺少部分 key，需列出缺失 key 的名称
- **ℹ 无需配置**：该服务不需要环境变量（无对应的 `.env-example` 文件）

#### Scenario: 所有 MCP 均已配置
- **WHEN** 安装完成时，所有选中的 MCP 服务的 `.env` key 都已填值
- **THEN** guide 中环境变量状态区块 SHALL 显示每个服务的 ✅ 状态，例如：
  ```
  环境变量配置状态：
    ✅ Jira — 所有环境变量已配置
    ✅ Feishu Wiki — 所有环境变量已配置
  ```

#### Scenario: 部分 MCP 缺少环境变量
- **WHEN** 安装完成时，部分选中的 MCP 服务（如 GitHub）的 `.env` 中缺少关键 key（如 `GH_TOKEN`）
- **THEN** guide 中环境变量状态区块 SHALL 对 GitHub 显示 ⚠️ 状态，并列出缺失的 key：
  ```
  环境变量配置状态：
    ✅ Jira — 所有环境变量已配置
    ⚠️ GitHub — 缺少以下环境变量：
      · GH_TOKEN — GitHub Personal Access Token
  ```

#### Scenario: 未选择任何 MCP
- **WHEN** 用户安装过程中没有选择任何 MCP 服务
- **THEN** guide SHALL NOT 显示"环境变量配置状态"区块

#### Scenario: 环境和之前已有配置混合
- **WHEN** 新增安装的 MCP 部分已配、部分未配，且之前安装的 MCP 也已被检测
- **THEN** guide SHALL 汇总展示所有已安装 MCP 的当前状态（包括本次新装和之前安装的），保持一致性
