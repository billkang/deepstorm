## Context

当前 DeepStorm 的 MCP 服务可用性感知机制采用"模板注入 + 运行时交叉引用"的方式：

1. **安装时**：`buildMcpCapabilities()` 根据每个 skill 模板 frontmatter 的 `mcpCapabilities` 声明，结合 `registry.mcpTools` 和 `installedMcpServers`，生成 JSON 字符串，通过 `injectSkillCapabilities()` 注入到 `{{tide_capabilities}}`、`{{reef_capabilities}}`、`{{sweep_capabilities}}` 等模板变量中
2. **渲染后**：每个 skill 的 SKILL.md 中嵌入了各自的能力映射 JSON
3. **运行时**：AI 读取 SKILL.md 中的能力映射 JSON，再与 `.claude/settings.json` → `deepstorm.installedMcpServers` 交叉引用确认可用性

问题：
- 各套件各自维护模板变量名称（`tide_capabilities` / `reef_capabilities` / `sweep_capabilities`）
- 每次安装/刷新时重复相同的扫描逻辑
- 运行时需两步才能确认 provider 可用性
- `injectSkillCapabilities()` 只在渲染输出中注入能力数据，settings.json 中没有统一的能力快照

## Goals / Non-Goals

**Goals:**

- 所有套件统一从 `.claude/settings.json` → `deepstorm.mcpCapabilities` 读取运行时 MCP 能力映射
- CLI 在 `setup`（安装）和 `config-refresh`（刷新）时自动从所有 skill 模板 frontmatter 收集 `mcpCapabilities` 声明，构建统一的映射写入 settings.json
- 每个 skill 的 SKILL.md.tmpl 中移除 `{{xxx_capabilities}}` 模板变量引用，直接引用 `deepstorm.mcpCapabilities`
- 移除 skill 模板中不必要的运行时交叉引用步骤
- 保持 `buildMcpCapabilities()` 和 `injectSkillCapabilities()` 的向后兼容（仍然保留，旧的 skill 模板不受影响）

**Non-Goals:**

- 不改变 `registry.mcpTools` 的结构
- 不改变 skill 模板 frontmatter 的 `mcpCapabilities` 声明格式
- 不修改 `.mcp.json` 的安装机制
- 不涉及 MCP 服务的启停或管理功能

## Decisions

### Decision 1: 两处统一构建，一处写入

在 `setup.ts` 和 `config-refresh.ts` 各自添加 `buildUnifiedMcpCapabilities()` 函数，两者逻辑一致但导出方式不同：

| 位置 | 导出 | 写入方式 |
|------|------|----------|
| `setup.ts` | `export function` (供外部测试) | 直接写入 `deepstormConfig.mcpCapabilities`，通过 `mergeDeepStormConfig` 持久化 |
| `config-refresh.ts` | `function` (文件内私有) | 通过 `mergeDeepStormConfig` 写入 settings.json |

**理由**：安装和刷新是两个独立入口，共享底层逻辑但生命周期不同。setup 只在新安装时调用，config-refresh 可能在后续任意时间点调用。复用同一个函数但各自控制写入时机，避免耦合。

### Decision 2: 扫描 `cliDir/skills/{skillId}/SKILL.md.tmpl` 的 frontmatter

`buildUnifiedMcpCapabilities()` 遍历 `cliDir/skills/` 下所有子目录，对每个包含 `SKILL.md.tmpl` 的目录：

1. 读取文件内容
2. 用 `parseFrontmatter()` 解析 YAML frontmatter
3. 提取 `mcpCapabilities` 字段（`Record<string, { domain: string }>`）
4. 合并所有声明到 `allDeclarations` 对象
5. 调用 `buildMcpCapabilities(allDeclarations, installedMcpTools, mcpTools)` 生成最终映射

**理由**：`parseFrontmatter` 和 `buildMcpCapabilities` 已存在并有测试覆盖，避免了引入新依赖或解析逻辑。只扫描 `.tmpl` 文件（而非已渲染的 SKILL.md），确保总是从源定义出发。

### Decision 3: 输出的映射结构

```json
{
  "issue_tracker": {
    "available": true,
    "providers": [{ "id": "jira", "label": "Jira" }]
  },
  "knowledge_base": {
    "available": true,
    "providers": [{ "id": "dingtalk-wiki", "label": "钉钉云文档" }]
  },
  "design_tools": {
    "available": false,
    "providers": []
  }
}
```

与 `buildMcpCapabilities()` 已有的输出格式完全一致，skill 无需修改解析逻辑。

### Decision 4: Skill 模板引用方式统一

**旧方式**（每个 skill 各自处理）：
```
读取 {{tide_capabilities}}（渲染后的 JSON）
交叉引用 deepstorm.installedMcpServers
```

**新方式**（统一读取 settings.json）：
```
读取 `.claude/settings.json` → `deepstorm.mcpCapabilities`
直接判断 available 和 providers
```

具体变更：

| 文件 | 变更 |
|------|------|
| `reef-start/SKILL.md.tmpl` | 移除 `{{reef_capabilities}}` 占位符，替换能力发现指引 |
| `reef-gen-frontend/SKILL.md.tmpl` | `deepstorm.installedMcpServers` → `deepstorm.mcpCapabilities` |
| `tide-discuss/SKILL.md.tmpl` | `{{tide_capabilities}}` → `deepstorm.mcpCapabilities`，简化发现步骤 |
| `tide-discuss/references/publish-flow.md` | 同上 |
| `sweep-plan/SKILL.md.tmpl` | `{{sweep_capabilities}}` / `deepstorm.installedMcpServers` → `deepstorm.mcpCapabilities` |
| `deepstorm-mcp-figma-read/SKILL.md` | `{{capabilities}}` → `deepstorm.mcpCapabilities` |
| `deepstorm-mcp-jira-read/SKILL.md` | 同上 |

### Decision 5: 向后兼容

- `deepstorm.mcpCapabilities` 字段在 `DeepStormConfig` 中声明为可选（`?`）
- skill 模板模板中保留降级指引：当 `mcpCapabilities` 缺失时，按"无 MCP 服务安装"模式运行
- `injectSkillCapabilities()` 保留不动，旧的 skill 模板如果依赖 `{{tide_capabilities}}` 仍然能渲染（虽然新模板不再依赖）

## Risks / Trade-offs

- **[风险] 旧 settings.json 缺少 `mcpCapabilities`** → 各 skill 模板已加入降级处理：读取失败时按"无 MCP 服务安装"运行
- **[风险] 新增 skill 时忘记在 frontmatter 声明 mcpCapabilities** → 无声明则能力为空数组（available: false），skill 按无 MCP 模式运行。建议在 skill 模板创建规范中要求声明
- **[风险] `buildUnifiedMcpCapabilities` 与 `buildMcpCapabilities` 功能重复** → 两者职责不同：`buildMcpCapabilities` 是工具函数（输入声明 → 输出映射 JSON），`buildUnifiedMcpCapabilities` 是编排函数（扫描文件系统 + 聚合声明 + 调用前者）。未来可考虑将扫描+聚合逻辑移到公共模块
- **[权衡] setup.ts 中导出 vs config-refresh.ts 中私有** → 一致性上有差距，但 setup 中的函数被 `buildUnifiedMcpCapabilities` 名称导出仅因为测试需要，config-refresh 中的函数尚无测试需求。如有需要可后续统一到公共模块
- **[风险] 大项目中有大量 skill 时扫描性能** → 当前 ~10 个 skill，扫描 + 解析 frontmatter 耗时 <50ms。如果后续扩展到数百个，可考虑缓存 mcpCapabilities 的索引
