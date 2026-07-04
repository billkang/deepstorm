## 1. sweep-plan 模板化

- [x] 1.1 将 `packages/sweep/skills/sweep-plan/SKILL.md` 重命名为 `SKILL.md.tmpl`
- [x] 1.2 在 frontmatter 添加 `mcpCapabilities` 声明（`issue_tracker` / `knowledge_base` 两个域）和 `deepstorm.tool: sweep`
- [x] 1.3 添加 `{{sweep_capabilities}}` 模板变量引用和运行时能力发现章节

## 2. Step 2（需求获取阶段）动态化

- [x] 2.1 重写 Step 2.2（Issue 链接获取），将硬编码"Jira MCP"替换为 `issue_tracker` 能力检测
- [x] 2.2 重写 Step 2.3（PRD 链接获取），将硬编码"钉钉 MCP"替换为 `knowledge_base` 能力检测
- [x] 2.3 重写 Step 2.5（后备处理），统一为能力不可用时的降级路径
- [x] 2.4 更新 SKILL.md 描述和表格中的特定服务名称（Jira → Issue 跟踪、钉钉 → 知识库）

## 3. 测试

- [x] 3.1 验证 `deriveVariableName` 对 `deepstorm.tool: sweep` 正确推导为 `sweep_capabilities`
- [x] 3.2 全量测试：`pnpm vitest run` → 121/121 pass
