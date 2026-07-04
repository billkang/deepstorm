## 1. tide-core spec 更新

- [x] 1.1 添加 "Step 3 MCP 能力发现前置检查" requirement（含 1 个 scenario）
- [x] 1.2 添加 "Step 2 角色讨论约束规则" requirement（含 4 个 scenario）
- [x] 1.3 添加 "上下文隔离" requirement（含 1 个 scenario）
- [x] 1.4 添加 "参考文件索引" requirement（含 1 个 scenario）
- [x] 1.5 添加 "Feature ID 字数限制" requirement（含 1 个 scenario）
- [x] 1.6 添加 "PRD 模板引用" requirement（含 1 个 scenario）

## 2. mcp-capability-discovery spec 更新

- [x] 2.1 修改 "引用 MCP skill 指南" scenario，路径从 `mcp-{id}` 改为 `deepstorm-mcp-{id}-write`

## 3. dynamic-publish-flow spec 更新

- [x] 3.1 修改 "单知识库可用时正常推送" scenario，路径从 `mcp-dingtalk-wiki` 改为 `deepstorm-mcp-{provider-id}-write`
- [x] 3.2 修改 "单工单系统正常创建" scenario，路径从 `mcp-jira` 改为 `deepstorm-mcp-{provider-id}-write`

## 4. 验证

- [x] 4.1 确认 delta spec 内容与主 spec 同步后无冲突
- [x] 4.2 确认 SKILL.md.tmpl 与 specs 之间无更多不一致
