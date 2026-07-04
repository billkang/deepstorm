## 1. Foundation — SKILL.md.tmpl 与构建注册

- [ ] 1.1 将 `packages/tide/skills/tide-discuss/SKILL.md` 重命名为 `SKILL.md.tmpl`，保留全部现有内容
- [ ] 1.2 在 SKILL.md.tmpl frontmatter 中添加 `deepstorm: {tool: "tide"}` 和 `mcpCapabilities` 声明（knowledge_base → knowledge-base、issue_tracker → project-management）
- [ ] 1.3 新建 `packages/tide/wizard.json`（极简声明，tool: "tide"，空 questions 数组）
- [ ] 1.4 运行 `pnpm build` 确认 tide-discuss 出现在 dist/ 构建产物和 registry.json 中
- [ ] 1.5 确认 `npx deepstorm setup` 中 tide 出现在工具选择列表

## 2. buildMcpCapabilities 工具函数

- [ ] 2.1 在 `packages/cli/src/template/registry.ts` 中导出 `buildMcpCapabilities` 函数，接收 `mcpCapabilities`、`installedMcpServers`、`mcpTools` 三个参数，返回序列化的能力映射 JSON 字符串
- [ ] 2.2 处理单 MCP 匹配、多 MCP 匹配、0 MCP 匹配、不相关 MCP 被过滤四种场景
- [ ] 2.3 为 `buildMcpCapabilities` 编写单元测试，覆盖四种匹配场景

## 3. Setup 流程集成

- [ ] 3.1 修改 `packages/cli/src/commands/setup.ts` 中 `installAllToolAssets`：渲染 .tmpl 前解析 frontmatter，提取 `mcpCapabilities`；调用 `buildMcpCapabilities` 生成 JSON；注入到 `templateVariables` 作为 `tide_capabilities`
- [ ] 3.2 处理 SKILL.md.tmpl 中 frontmatter 不存在 `mcpCapabilities` 的降级（视为不需要 MCP，空 `tide_capabilities`）

## 4. SKILL.md.tmpl 内容重写

- [ ] 4.1 在 SKILL.md Step 4 入口前新增「MCP 能力发现」指令段：运行时读取 `deepstorm.installedMcpServers` 与能力映射 JSON 交叉匹配，异常时降级为全部跳过
- [ ] 4.2 重写 4a 知识库推送：按能力映射可用性动态执行或跳过；多 provider 时询问用户选择；成功后写 `services.knowledgeBase`
- [ ] 4.3 重写 4b 任务拆分：无可用工单系统时整步跳过（`skipped: true`），不展示任务拆分；有可用时正常执行；多 provider 时在 4b 入口询问选择
- [ ] 4.4 重写 4c 创建工单：按 4b 选择的 provider 执行；失败时记录 `failedItems` 到 publishChecklist
- [ ] 4.5 更新所有状态流转描述：`published`/`completed` 的到达条件改为 MCP 感知，移除钉钉/Jira 专属表述
- [ ] 4.6 更新 `publishChecklist` 步骤名引用为 `knowledge_base_push` / `issue_task_split` / `create_issues`
- [ ] 4.7 更新异常恢复路径：适配 `skipped: true` 标记和 `services` 命名空间

## 5. 参考文件更新

- [ ] 5.1 重写 `references/publish-flow.md`：改为 MCP 感知的动态流程描述，移除钉钉/Jira 硬编码
- [ ] 5.2 更新 `references/data-format.md`：新增 `services` 命名空间定义（knowledgeBase、issueTracker），更新 publishChecklist 步骤名和字段说明
- [ ] 5.3 更新 `references/session-ops.md`：恢复路径适配新 publishChecklist 语义和 skipped 标记

## 6. config refresh 命令

- [ ] 6.1 实现 `packages/cli/src/commands/config-refresh.ts`：读取 `installedSkills` → 对每个有 `.tmpl` 的 skill 重新渲染（含最新 `installedMcpServers`）
- [ ] 6.2 注册 `config refresh` 子命令到 `config.ts` 的命令树
- [ ] 6.3 确保 `config refresh` 可测试：处理 skill 目录不存在、registry 中未注册等情况

## 7. 配置清理与旧数据兼容

- [ ] 7.1 从 `packages/cli/config-schema.json` 中移除 `tide.issueTracker` 枚举（不再需要）
- [ ] 7.2 确认 AI SKILL.md 指令中包含旧 session 降级读取逻辑（`services` → `dingtalkUrl`/`jiraUrls`）
