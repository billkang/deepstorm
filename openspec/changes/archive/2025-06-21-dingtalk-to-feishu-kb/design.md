## Context

DeepStorm 当前使用 `dingtalk-wiki` 作为知识库（knowledge-base）领域的唯一 MCP provider。该 provider 提供文档搜索、读取和写入能力，覆盖 tide-discuss 的 PRD 发布流程、reef 的开发上下文获取、sweep 的测试计划查阅等场景。

钉钉云文档在 API 稳定性、团队实际协作工具使用上存在限制。团队已切换至飞书进行日常文档协作，因此需要将知识库 provider 从钉钉云文档整体替换为飞书知识库。

此次变更涉及 4 个套件（tide/reef/sweep/atoll）、CLI 构建注册表、MCP 配置和技能文件、以及大量文档引用，是一次跨模块的 provider 替换。

## Goals / Non-Goals

**Goals:**
- 新增 `feishu-wiki` MCP 服务配置和技能文件（读/写）
- 移除所有 `dingtalk-wiki` 相关的 MCP 配置、技能文件、环境变量
- 更新构建注册表 `build-registry.ts` 中的 MCP 依赖列表
- 更新 4 个套件的 `wizard.json` 中 `mcpSkills` 引用
- 更新所有 README、SKILL.md.tmpl、reference 文档中的钉钉云文档引用
- 更新测试文件中的 provider 名称与断言
- 确保 `service-agnostic-data-format` 的向后兼容路径正常工作
- 废弃 openspec/specs/ 下的 old dingtalk-wiki 规范（标记或替换）

**Non-Goals:**
- 不改变 `service-agnostic-data-format` 的整体架构（services 命名空间模式保留）
- 不修改已归档的 openspec/changes/archive/ 历史变更记录
- 不修改 `_bmad-output/` 中的 AI 讨论流程记录
- 不修改 `coverage/` 构建产物（随下次 build 自动重建）
- 不引入新的知识库 provider 多选项（飞书为唯一替代）
- 不修改 tide-core 发布流程的逻辑架构（动态适配模式保留）

## Decisions

### Decision 1: provider ID 命名

- **选择**: `feishu-wiki`
- **备选**: `larksuite-wiki`、`feishu-knowledge-base`、`feishu-docs`
- **理由**: 保持与现有 `dingtalk-wiki` 一致的 `{platform}-wiki` 命名模式。`feishu` 为团队实际使用的产品名称，与现有代码中中文"飞书"一致。`larksuite` 为国际版名称，国内团队不使用。保持 `-wiki` 后缀以匹配知识库的语义。

### Decision 2: 环境变量命名

- **选择**: `DEEPSTORM_FEISHU_TOKEN` 和 `FEISHU_WEBHOOK_TOKEN`
- **备选**: `DEEPSTORM_FEISHU_WEBHOOK_TOKEN`、`FEISHU_APP_TOKEN`
- **理由**: 匹配现有 `DEEPSTORM_DINGTALK_TOKEN` / `DINGTALK_WEBHOOK_TOKEN` 的命名模式。`DEEPSTORM_*` 前缀用于框架级变量，`FEISHU_*` 前缀保持与 MCP 包内部命名一致。避免引入 `APP_TOKEN` 这种可能被误解为应用级凭证的名称。

### Decision 3: MCP 技能命名

- **选择**: `deepstorm-mcp-feishu-wiki-read` / `deepstorm-mcp-feishu-wiki-write`
- **备选**: `deepstorm-mcp-feishu-read` / `deepstorm-mcp-feishu-write`（去掉 `-wiki`）
- **理由**: 保持与现有 `deepstorm-mcp-dingtalk-wiki-read` / `write` 的命名一致性。保留 `-wiki` 后缀明确表达这是知识库领域能力，避免与其他飞书 MCP 工具（如飞书审批、飞书日历等未来可能的能力）混淆。

### Decision 4: 迁移策略 — 替换而非共存

- **选择**: 一次性替换 dingtalk-wiki 为 feishu-wiki
- **备选 A**: 两者共存，通过 feature toggle 切换
- **备选 B**: 分阶段迁移（先加 feishu → 再弃 dingtalk → 再删 dingtalk）
- **理由**: 钉钉云文档已弃用，无需保留两套知识库 provider 的维护成本。备选 A 和 B 适合生产环境的平滑迁移场景，但 DeepStorm 的知识库 provider 是 CLI 安装决定而非运行时切换，不存在并行的必要。`service-agnostic-data-format` 的 `services` 命名空间已确保旧 session 数据的向后兼容性。

### Decision 5: 旧 MCP 配置文件的处理

- **选择**: 删除 `packages/cli/mcp/knowledge-base/dingtalk-wiki.json`，创建 `feishu-wiki.json`
- **备选**: 原地修改 dingtalk-wiki.json 内容
- **理由**: 文件名即服务标识。保留旧文件名但修改内容会导致代码审查和 git 历史追踪困难。删除旧文件 + 创建新文件使 git diff 清晰显示"R dingtalk-wiki.json → feishu-wiki.json"。

### Decision 6: 旧 openspec/specs/ 处理

- **选择**: 保留 `openspec/specs/deepstorm-mcp-dingtalk-wiki-{read,write}/` 目录（作为历史记录），在其 spec.md 顶部添加废弃标记；创建新的 `feishu-wiki-{read,write}` 规范
- **备选**: 直接删除旧 specs
- **理由**: openspec/specs/ 是活动规范目录，旧 spec 的删除应在归档阶段（TBD）处理。当前阶段先标记废弃，确保协作成员知道这些规范已被替代。

### Decision 7: wizard.json 中的 mcpSkills 顺序

- **选择**: 在 tide/reef/sweep/atoll 的 `wizard.json` 中，将 `deepstorm-mcp-dingtalk-wiki-read/write` 替换为 `deepstorm-mcp-feishu-wiki-read/write`，保持原有数组顺序中的位置
- **理由**: 功能语义等同，只需替换 provider ID。保持数组顺序减少不必要的 diff。

## Migration Plan

### Phase 1 — MCP 基础设施
1. 创建 `packages/cli/mcp/knowledge-base/feishu-wiki.json`（MCP server 配置）
2. 创建 `packages/cli/mcp-skills/deepstorm-mcp-feishu-wiki-read/SKILL.md`
3. 创建 `packages/cli/mcp-skills/deepstorm-mcp-feishu-wiki-write/SKILL.md`
4. 删除 `packages/cli/mcp/knowledge-base/dingtalk-wiki.json`
5. 删除 `packages/cli/mcp-skills/deepstorm-mcp-dingtalk-wiki-read/` 和 `-write/`
6. 更新环境变量示例文件

### Phase 2 — 源码注册
7. 更新 `packages/cli/src/build-registry.ts`（mcpDependencies 中的 `dingtalk-wiki` → `feishu-wiki`）
8. 更新 `packages/cli/src/template/registry.ts`（JSDoc/示例中的 `dingtalk-wiki`）
9. 更新 tide/reef/sweep 的 `wizard.json`（`mcpSkills` 数组）

### Phase 3 — 文档
10. 更新根目录 README.md
11. 更新 playground/README.md
12. 更新 packages/tide/README.md、packages/reef/README.md、packages/sweep/README.md
13. 更新 SKILL.md.tmpl 文件（tide-discuss、reef-start、sweep-plan）
14. 更新 reference 文档（publish-flow.md、data-format.md、prd-template.md）
15. 更新 env-examples（`dingtalk-wiki.env-example` → `feishu-wiki.env-example`）

### Phase 4 — 测试
16. 更新 `packages/cli/src/build-registry.ts` 相关测试
17. 更新 `registry.test.ts`、`config-refresh.test.ts`、`setup.test.ts`、`reconfigure.test.ts`
18. 运行全量测试确认

### Rollback
- git revert 当前 change 的 commit（如果有）或逐个恢复被删除的文件
- 回退环境变量更改
- **关键依赖**: feishu-wiki MCP 包必须可用，否则 rollback 到 dingtalk-wiki

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 存在未发现的 dingtalk-wiki 引用 | 遗漏导致运行时错误 | 实现前用 grep 全面扫描；实现后验证性搜索；CI 检查无 `dingtalk-wiki` 残留 |
| 旧 `.env` 文件中用户仍使用 `DEEPSTORM_DINGTALK_TOKEN` | 飞书 MCP 连接失败 | env 迁移指南 + setup 流程中自动检测旧变量并提示迁移 |
| 旧 session JSON 含 `dingtalkUrl` | 展示旧链接指向钉钉 | service-agnostic-data-format 已有降级兼容逻辑，不阻塞 |
| 飞书 MCP 包的 API 接口与现有技能文档不符 | 技能文档与实际能力脱节 | SKILL.md 中 MCP 调用指南按飞书实际 API 编写，不照搬钉钉模板 |
| `dist/` 构建产物未及时重建 | 安装时使用旧 dingtalk 配置 | 在 tasks 中安排 `pnpm build` 步骤 |

## Open Questions

- 飞书知识库 MCP 包（`feishu-wiki` 或其他名称）是否已有可用 npm 包？如无，当前选择为占位名，确认后更新。
- dingtalk-wiki MCP 包是否仍有用户使用？如果有，是否需要更长的废弃过渡期？
