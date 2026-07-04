## Context

当前 `deepstorm update` 实现在 `packages/cli/src/commands/update.ts` 中，存在以下结构性问题：

1. **子选项过多**：`--check`/`--cli`/`--skills` 三个选项，用户需要记住不同选项的语义
2. **同步范围窄**：仅同步 skill 模板（通过 `template-upgrade.ts` 的 `upgradeTemplates`），不处理 hooks、agents
3. **全量同步**：`Object.keys(registry.skills)` 同步所有 registry 中的 skill，不管用户有没有安装
4. **无修改保护**：不做用户修改检测，直接覆盖
5. **功能分散**：`template upgrade` 独立存在，与 `update` 职责重叠

用户期望的是一个"一键全量更新"命令：`deepstorm update` 无参数执行，自动完成 CLI 升级 + 已安装资产的增量同步。

## Goals / Non-Goals

**Goals:**
- `deepstorm update` 无选项全量更新（CLI 版本检查 + 自动升级 + 资产同步）
- 基于 `.claude/settings.json` 的 `deepstorm.installedSkills` 和配置项，只同步已安装的内容
- 同步范围包括 skill、hooks、agents
- 检测用户修改，备份用户版本后覆盖系统版本，并告知用户
- 移除 `template upgrade` 子命令（已合入 update）

**Non-Goals:**
- 不涉及 setup/wizard 流程的变更
- 不改变 config/template 等其他子命令
- 不引入新的配置文件格式

## Decisions

### D1: 移除全部子选项
**决策：** 去掉 `--check`、`--cli`、`--skills` 三个选项，`deepstorm update` 不接受任何参数。
**理由：** 用户希望一个命令做完所有事。如果需要仅检查版本或仅更新 CLI，可以用 `npm view @deepstorm/cli version` 或 `npm install -g @deepstorm/cli` 替代。简化交互降低认知负荷。

### D2: 读取 installedSkills 替代 registry skills
**决策：** 从 `.claude/settings.json` 的 `deepstorm.installedSkills` 读取已安装的 skill IDs，而非 `Object.keys(registry.skills)`。
**理由：** registry 包含所有可选 skill，而 installedSkills 只包含用户 setup 时选中的。这确保 update 不会安装用户未选过的内容。
**备选方案考虑：** 或者扫描 `.claude/skills/` 目录下实际存在的 skill 目录——但无法区分"用户手动删除"和"从未安装过"的情况。

### D3: 同步范围扩大到 hooks 和 agents
**决策：** update 时除了 skill，还为已安装的工具套件同步 hooks 和 agents。
**实现方式：** 复用 `setup.ts` 中 `renderToolAssets` 的部分逻辑——遍历 installedSkills 对应的工具套件，对每个工具调用 `getToolHooks()` 和 `getToolAgents()`。
**理由：** 用户期望 `deepstorm update` 完整更新安装时选择的所有资产，不应有遗漏。

### D4: 用户修改检测与备份
**决策：** 同步前计算文件的 checksum 或比较修改时间，与系统分发版本对比。修改过的文件：
1. 重命名为 `{filename}.{timestamp}.bak` 保留用户版本
2. 复制系统新版本
3. 在控制台输出备份文件列表
**实现方式：** 在 `template-upgrade.ts` 中扩展，为每个文件做 diff/checksum 比较。
**理由：** 用户可能自定义了 SKILL.md，直接覆盖会丢失改动。备份 + 告知是最安全的方式。
**备选方案考虑：** 仅跳过不改——但用户可能不知道有新版可用。

### D5: 复用 setup 的渲染逻辑
**决策：** update 的 skill/agent/hook 同步复用 `setup.ts` 中的 `renderToolAssets` 函数。
**理由：** `renderToolAssets` 已经实现了配置感知（SKILL.md.tmpl 渲染、variants 复制、fragments 复制），不应重复实现。update 本质上是对已安装工具的"重新部署"。
**改动点：** `renderToolAssets` 目前接受 `tools: string[]`，update 时从 `installedSkills` 反向映射到 tool 名称，再调用该函数。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| checksum 比较可能误判（如文件系统时间戳不一致） | 使用内容哈希（SHA256）而非修改时间，确保精确匹配 |
| `renderToolAssets` 复用可能引入 setup 特有的 side effect | 将 `renderToolAssets` 中用不到的 setup 专用参数（如 `installedMcpTools`）标记为可选或拆分独立函数 |
| 用户可能不适应 `template upgrade` 被移除 | `template upgrade` 明确报错提示"请使用 deepstorm update" |

## Open Questions

- hooks 和 agents 的"用户修改检测"是否与 skill 采用同一策略（checksum + 备份）？还是目前这些文件用户基本不改，直接覆盖即可？
