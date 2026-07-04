## Context

当前 MCP 使用指南 skill 分散维护：`packages/cli/mcp-skills/` 下按 MCP 服务组织 4 个单体 SKILL.md（mcp-figma、mcp-dingtalk-wiki、mcp-github、mcp-jira），`packages/reef/skills/reef-start/references/` 下另存有 MCP 操作流程引用文档（jira-start-dingtalk.md、jira-start-figma.md、jira-start-env.md）。两者内容重叠但各自维护，导致 CLI 安装的来源和各子工具实际使用的内容不一致。

同时，现有的单体 SKILL.md 将某 MCP 服务的全部操作放在一个文件中，但 reef、tide、sweep 各自只需要该服务的特定操作类型（读或写）。需要一个按操作类型拆分的公共 MCP skill 体系，统一管理、按需安装。

### 现有安装流程

```
Step 1b: 选择 MCP 服务 (Jira/Figma/GitHub/钉钉)
Step 1c: 安装所有对应 mcp-{name}/SKILL.md   ← 全量安装
Step 2:  选择子工具 (reef/tide/sweep/atoll)
```

问题：Step 1c 在 Step 2 之前，安装时不知道用户选了哪些子工具，只能全量装。

### 现有模板引用方式

各子工具模板中使用 `.claude/skills/mcp-{provider.id}/SKILL.md` 通配路径引用 MCP skill，运行时由 AI 根据能力映射 JSON 中的 `provider.id` 替换。拆分后一个 provider 对应多个 skill（read/write），通配路径不再精准。

## Goals / Non-Goals

**Goals:**
- 建立 DeepStorm 层级公共 MCP skill 体系，按 `deepstorm-mcp-{service}-{op}` 扁平化命名
- 每个 skill 的内容以各子工具的实际使用场景为准，不包含未验证的操作
- 子工具通过 `wizard.json` 声明所需 MCP skill，构建时写入 registry
- CLI setup 按子工具选择只安装必需的 deepstorm-mcp-* skill
- 更新所有模板中 MCP skill 引用路径为硬编码的 `deepstorm-mcp-{service}-{op}` 格式
- 统一 `deepstorm-` 前缀，更新现有文档中旧命名引用

**Non-Goals:**
- 不改变 `.mcp.json` 的 MCP 服务接入方式（server 配置不受影响）
- 不改变运行时能力发现机制（`{{reef_capabilities}}`、`deepstorm.installedMcpServers` 不变）
- 不修改 `openspec/specs/` 中现有的 MCP 基础设施 spec（mcp-capability-discovery、mcp-server-config 等）
- 不改动非 MCP 相关的引用文档（如 `references/jira-start-subagent.md`，留在 reef-start）

## Decisions

### D1: 命名方案 — `deepstorm-mcp-{service}-{op}` 扁平化

**决策:** 使用扁平目录名 `deepstorm-mcp-jira-read`、`deepstorm-mcp-jira-write`，位于 `packages/cli/mcp-skills/` 下。

**备选方案对比:**

| 方案 | 说明 | 否决理由 |
|------|------|---------|
| `deepstorm-mcp-{service}-{op}`（选定） | 扁平命名，一个目录一个 skill | 路径短，安装逻辑简单，与 wizard.json 映射一一对应 |
| `{service}/{op}` 嵌套目录 | 按服务组织，内部分操作 | 安装时路径层次深，注册逻辑复杂 |
| 维持单体不拆分 | 一个服务一个 SKILL.md | 不符合按操作类型按需安装的设计目标 |

### D2: 操作类型 — read / write 两分

**决策:** 每个 MCP 服务按 read 和 write 两类操作拆分。write 包含 create、update、transition、comment 等所有写入操作。

**理由:** 分析各子工具实际使用场景后，所有 MCP 操作均可归入 read 或 write。如 reef 只需要读 Jira/钉钉/Figma，tide 需要写 Jira/钉钉，没有出现需要进一步拆分的操作类型（如 admin/batch）。

**例外处理:** 如果未来某服务的 write 操作内部出现截然不同的流程（如 GitHub write 包含 PR review 和文件修改，操作差异大），可以按需再拆。

### D3: 映射声明位置 — `wizard.json` 的 `mcpSkills` 字段

**决策:** 每个子工具的 `packages/{tool}/wizard.json` 新增 `mcpSkills` 数组字段，声明该工具所需的 deepstorm-mcp-* skill 列表。

```json
// packages/reef/wizard.json
{
  "tool": "reef",
  "mcpSkills": [
    "deepstorm-mcp-jira-read",
    "deepstorm-mcp-dingtalk-wiki-read",
    "deepstorm-mcp-figma-read"
  ],
  "questions": [...]
}
```

**备选方案对比:**

| 方案 | 说明 | 否决理由 |
|------|------|---------|
| wizard.json mcpSkills（选定） | 工具自我声明所需 MCP skill | 高内聚，构建时一并读入 registry |
| build-registry.ts 硬编码 | 放在 PACKAGE_LABELS 旁边 | 改动构建代码才能增减映射，不够声明式 |
| 独立 mcp-skills.json | 新文件统一管理 | 不必要的新文件，增加维护点 |
| SKILL.md frontmatter | frontmatter 声明 mcpCapabilities 时附加 skills | frontmatter 被构建扫描流程读取，但 wizard.json 已存在工具元数据读取逻辑 |

### D4: 安装流程 — MCP skill 安装移到工具选择之后

**决策:** 将 Step 1c（MCP skill 安装）移到 Step 2（工具选择）之后，改为 Step 2b。

**改造后的流程:**

```
Step 1b: 选择 MCP 服务 (Jira/Figma/...)
         → 生成 .mcp.json 配置（不变）
Step 2:  选择子工具 (reef/tide/...)
Step 2b: 计算交集 → 只装工具需要的 deepstorm-mcp-* skill
         遍历用户选中的子工具 → 查 mcpSkills 映射 → 匹配已选的 MCP 服务 → 安装
Step 3+: 安装各工具 assets（不变）
```

**计算规则:**

```
所需 skill = 用户选择的 MCP 服务 × 用户选择的子工具的 mcpSkills 映射

例: 用户选 MCP={Jira, Figma}, 子工具={reef, tide}
  → reef 需要 [jira-read, dingtalk-wiki-read, figma-read]
  → tide 需要 [jira-write, dingtalk-wiki-write]
  → 有 MCP 服务支持的交集: mcp-jira-read + mcp-jira-write + mcp-figma-read
  → 安装这 3 个 skill
```

不支持的 MCP service 对应的 skill 不报错，静默跳过。用户如后续新增 MCP 服务，重新运行 setup 即可。

### D5: 模板引用 — 从通配路径改为硬编码路径

**决策:** 各子工具 SKILL.md.tmpl 中所有 `.claude/skills/mcp-{provider.id}/SKILL.md` 通配引用替换为 `.claude/skills/deepstorm-mcp-{service}-{op}/SKILL.md` 硬编码路径。

**理由:** 每个引用点上下文已知操作类型（读 Issue → read、推送 PRD → write），硬编码更精确、减少 AI 运行时推断。原有通配引用方式在拆分后也不再有 `{provider.id}` 到单个 skill 路径的一对一映射。

**变更清单:**

| 模板文件 | 引用处 | 操作类型 | 新路径 |
|---------|--------|---------|-------|
| reef-start/SKILL.md.tmpl | 1.2 获取 Issue | read | `deepstorm-mcp-jira-read` |
| reef-start/SKILL.md.tmpl | 1.3 获取 PRD | read | `deepstorm-mcp-dingtalk-wiki-read` |
| reef-start/SKILL.md.tmpl | 1.5 获取设计稿 | read | `deepstorm-mcp-figma-read` |
| reef-start/SKILL.md.tmpl | 底部注意事项 ×2 | 按上下文 | 分别对应上述三个 |
| tide-discuss/SKILL.md.tmpl | 4a 推送 PRD | write | `deepstorm-mcp-dingtalk-wiki-write` |
| tide-discuss/SKILL.md.tmpl | 4c 创建工单 | write | `deepstorm-mcp-jira-write` |
| sweep-plan/SKILL.md.tmpl | 获取测试需求 - issue_tracker | read | `deepstorm-mcp-jira-read` |
| sweep-plan/SKILL.md.tmpl | 获取测试需求 - knowledge_base | read | `deepstorm-mcp-dingtalk-wiki-read` |

### D6: references/jira-start-env.md 处理

**决策:** 删除该文件，其内容涉及的 MCP 环境配置已经由以下方式覆盖：

- **环境变量说明**: 各 MCP 服务的 `DEEPSTORM_*` 凭证模板由 `mcp-env.ts` 在 setup 时自动生成到 `.env`
- **MCP 安装流程**: 由 `setup.ts` 的 Step 1b（.mcp.json 配置）+ Step 2b（部署 deepstorm-mcp-* skill）覆盖
- **运行时感知**: SKILL.md.tmpl 的能力映射+ `deepstorm.installedMcpServers` 机制已覆盖

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 拆分后 read/write 边界模糊（如"搜索"归类到 read 还是独立操作） | 统一归 read，写明搜索是读取操作的一种 |
| 旧文中仍引用 `mcp-{name}` 命名 | 已列入 What Changes 内容，逐文件检查更新；dist/ 中的文件由构建重新生成 |
| 某些场景需要同时使用 read 和 write（如先读 Issue 再 comment） | AI 同时加载 read + write 两个 skill 即可，无冲突 |
| `wizard.json` 增加 `mcpSkills` 字段后，现有构建解释器需更新 | build-registry.ts 读取 wizard.json 时加字段解析，向后兼容（缺省值 = 空数组） |
| skill 内容与实际 MCP 工具接口不一致（如 Figma API 更新） | skill 本身是操作指南，工具调用方式随 SKILL.md 更新即可，不影响系统运行 |

## Open Questions

- 无（所有设计决策已在讨论中确定）
