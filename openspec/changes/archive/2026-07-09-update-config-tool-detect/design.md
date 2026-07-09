# Design: Config Tool Detection

## Context

`syncToolAssets()` 是 `deepstorm update` 的核心同步函数，负责从 dist/ 发布包中同步 skills、agents、hooks 到用户项目的 `.claude/` 目录。该函数接收 `installedSkillIds: string[]` 作为输入，通过 `skillIdsToTools()` 反向映射为 tool 名称（如 `["reef-commit"]` → `["reef"]`），然后遍历 tool 列表同步资产。

问题在于：`installedSkills` 仅记录了通过 setup 明确安装的 skill ID。在 playground 等测试项目中，setup 流程只安装了 sweep skills（因为 setup 的选择流程决定了安装哪些 skill），但配置中已经包含了 `reef.techs`、`reef.frontend.framework` 等选项——这些选项只在 setup wizard 中被填写，并没有同步到 `installedSkills`。

## Goals

1. 使 `deepstorm update` 能从 `deepstorm.*` 配置项前缀检测 tool
2. 保证双来源合并不引入重复或冲突
3. 不影响 setup 命令和已有正确安装的项目

## Non-Goals

1. 不修改 `installedSkills` 的数据结构
2. 不修改 registry 的 schema
3. 不修改 build 流程

## Decisions

### Decision 1: 从扁平配置 key 前缀反向检测（而非读写 installedSkills）

- **备选方案 A（选）**：扫描 `deepstorm.*` 扁平配置的所有 key，提取 `.` 之前的 prefix 与 `registry.tools` 比对
- **备选方案 B**：在 setup 时强制将所有配置过的 tool 写入 `installedSkills`
- **备选方案 C**：在 update 时遍历 `registry.tools` 所有 key，逐一检查是否有相关配置前缀

**选择理由：** 方案 B 需要修改 setup 流程且破坏现有配置兼容性；方案 C 在 registry 有大量 tool 时性能差。方案 A 无侵入、兼容现有配置，是最小改动。

### Decision 2: 双来源合并后统一使用

`syncToolAssets()` 内所有 tool 名称相关的操作（backup、render、merge hooks、store checksums）全部使用 `allTools`，避免维护两套 tool 列表的逻辑分支。

## Risks / Trade-offs

| 风险 | 说明 | 缓解措施 |
|------|------|---------|
| 误检测 | 配置中一个 `reef.xxx` key 就触发 reef 同步 | 有意为之——有配置就说明 setup 已配置过该 tool，同步不存在损害 |
| 配置 key 命名冲突 | 某 non-tool 配置恰好以 tool 名称开头 | registry.tools 的 key 是有限的已知集合（tide/reef/sweep/atoll），误触发概率极小 |

## Implementation

### 新增函数

```typescript
function detectToolsFromConfig(
  config: Record<string, string>,
  registry: Registry,
): string[] {
  const knownTools = new Set(Object.keys(registry.tools ?? {}))
  const found = new Set<string>()
  for (const key of Object.keys(config)) {
    const dotIdx = key.indexOf('.')
    if (dotIdx < 0) continue
    const prefix = key.slice(0, dotIdx)
    if (knownTools.has(prefix)) found.add(prefix)
  }
  return [...found]
}
```

### 调用链变更

```
syncToolAssets(cliDir, targetDir, installedSkillIds):
  1. toolNames = skillIdsToTools(installedSkillIds, registry)     // 不变
  2. config = readSettingsConfig(targetDir)                       // 不变
  3. configTools = detectToolsFromConfig(config, registry)        // 新增
  4. allTools = [...new Set([...toolNames, ...configTools])]       // 合并
  5. 后续所有操作使用 allTools 替代 toolNames                      // 替换
```
