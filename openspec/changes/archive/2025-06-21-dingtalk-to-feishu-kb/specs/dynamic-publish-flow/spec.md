## MODIFIED Requirements

### Requirement: 4a 按 knowledge_base 能力可用性执行

**Modified**: 知识库 provider 引用从 `dingtalk-wiki` 更新为 `feishu-wiki`；MCP skill 引用路径从 `deepstorm-mcp-dingtalk-wiki-write` 更新为 `deepstorm-mcp-feishu-wiki-write`。

Step 4a SHALL 根据能力映射中 `knowledge_base` 的 provider 可用性决定是否执行知识库推送。

#### Scenario: 单知识库可用时正常推送
- **WHEN** 能力映射中 `knowledge_base` 有 1 个可用 provider（如飞书知识库）
- **THEN** AI SHALL 读取 `.claude/skills/deepstorm-mcp-feishu-wiki-write/SKILL.md` 了解工具调用方式
- **THEN** AI SHALL 按指南将 PRD Markdown 推送到飞书知识库
- **THEN** 成功后 `publishChecklist[0]` 记录 `{step:"knowledge_base_push", done:true}`
- **THEN** 成功后 `services.knowledgeBase` 记录 `{provider:"feishu-wiki", url:"..."}`
- **THEN** session `status` 改为 `published`

#### Scenario: 多知识库可用时由用户选择
- **WHEN** 能力映射中 `knowledge_base` 有 2 个或以上可用 provider
- **THEN** AI SHALL 展示可用列表让用户选择
- **THEN** 用户选择后，AI 按所选 provider 的 skill 指南执行推送
- **THEN** 所选 provider 记入 `services.knowledgeBase.provider`

#### Scenario: 无可用知识库时跳过 4a
- **WHEN** 能力映射中 `knowledge_base` 的 provider 数组为空或全部不可用
- **THEN** AI SHALL 在 `publishChecklist[0]` 中记录 `{step:"knowledge_base_push", done:true, skipped:true, note:"无可用知识库服务"}`
- **THEN** session `status` SHALL 直接改为 `published`
- **THEN** AI SHALL 告知用户"未检测到知识库服务，跳过 PRD 推送"

#### Scenario: 4a 执行失败
- **WHEN** 知识库 MCP 调用返回错误或超时
- **THEN** `publishChecklist[0]` 记录 `{step:"knowledge_base_push", done:false, note:"错误信息"}`
- **THEN** session `status` SHALL 改为 `publish_error`
- **THEN** AI SHALL 提示用户错误信息，提供重试或放弃发布选项
