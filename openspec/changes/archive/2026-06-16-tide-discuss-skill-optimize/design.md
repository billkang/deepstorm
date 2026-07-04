## Context

Tide discuss skill 的实现全部在 `SKILL.md.tmpl`（~26.8KB，安装时渲染为 SKILL.md）中，是 AI 驱动的纯文本技能。启动时 AI 需要读取并理解整个文件以做出初始决策。文件体积直接影响首 token 生成速度和上下文窗口利用效率。同时，当前废弃会话时 PRD 文件会遗留在 `prds/` 目录下，造成数据混乱。

## Goals / Non-Goals

**Goals:**
- SKILL.md.tmpl 从 ~26.8KB 压缩至 ~24KB，保持所有业务逻辑和行为不变
- 会话 superseded 时自动将 PRD 文件移入 abandoned 目录
- 通过 hook 预加载 + 缓存索引消除启动时的 I/O 调用
- 零外部依赖变更，零 API 变更

**Non-Goals:**
- 不改变 tide-discuss 的角色流程、checklist 逻辑、发布流程
- 不改变 session JSON 数据格式
- 不迁移已有废弃会话的残留 PRD 文件（向后兼容）

## Decisions

### Decision 1: Mermaid 图不动

三个核心流程图（入口决策流、会话生命周期、发布流程）保持原样。它们是 SKILL.md 的逻辑骨架，AI 依赖图来理解分支路径和状态流转。精简节点标签反而可能降低指令清晰度。**不做任何修改。**

### Decision 2: 上下文隔离段落去重

Step 1 段落中「上下文隔离」的说明在入口处（行 188-193）和下方的备注块（行 207-218）重复表述了同一套逻辑（AI 宣告切换 + 引导 `/clear`）。合并为一个精简段落，约减 50% 篇幅。

### Decision 3: Step 2 规则段与 Checklist 段去重

Step 2 中"规则"段（一次只扮演一个角色/一次只问一个问题/不要替用户做决定）和"Checklist 约束"段的"勿越俎代庖"有重叠。将"规则"段保留为精简版统领性规则，"Checklist 约束"段不再重复这些点。参考文件引用（`references/checklists.md`）保留不动。

### Decision 4: 能力映射示例精简

Step 4 当前有一行内联的 `{{tide_capabilities}}` 渲染值（行 324），紧接着是一段说明性示例 JSON（行 328-339）。运行时 AI 看到的是渲染后的实际 JSON，示例仅作为模板编写时的参考。删除示例 JSON 块，保留内联引用。

### Decision 5: 废弃 PRD 文件移动

添加运行时的 `mv` 操作：会话进入 superseded 状态时，检查 `tide-data/prds/{sessionId}-prd.md` 和 `tide-data/prds/{sessionId}-prd.json` 是否存在，若存在则 `mv` 到 `tide-data/abandoned/`。不修改 session JSON 中的文件路径字段（PRD 路径不持久化在 session 中）。

### Decision 6: 通篇措辞压缩

- 表格改用紧凑格式，精简列描述文字
- 参考文件的使用说明行（如 `> **用途:** ...` `> **引用时机:** ...`）精简为单行注释
- 移除不增加业务逻辑的修饰性语言
- 不删除任何带有业务约束的段落、不修改代码/配置示例
- 所有 5 处真实存在的 `references/*.md` 引用保持不动

### Decision 7: sessionStart Hook 预载 session 数据

在 `.claude/settings.json` 中配置 `sessionStart` hook，在 AI 启动前扫描 `tide-data/sessions/` 目录并将 session 摘要注入到系统上下文中。

**输出格式：** 每行一个 JSON 摘要，AI 可直接读取：
```
TIDE_SESSIONS:3
{"sessionId":"tide-20260616-002","status":"active","brief":"XXX","createdAt":"2026-06-16T..."}
{"sessionId":"tide-20260616-001","status":"prd_ready","brief":"YYY","createdAt":"2026-06-15T..."}
```

**效果：** SKILL.md 中 "扫描 sessions/ 目录" 的指令仍在，但 AI 启动时数据已在上下文中，无需调 `ls` 或 `Read`。Hook 命令用 Python 提取必要字段（sessionId、status、brief、createdAt、featureId），不抛出完整 JSON。

**零 SKILL.md 改动**——纯 settings.json 配置变更。

### Decision 8: 会话索引缓存（.index.json）

在 `tide-data/sessions/.index.json` 中维护一个轻量摘要索引，记录每个 active session 的元信息：

```json
[
  {"sessionId":"tide-20260616-002","status":"active","brief":"XXX","createdAt":"...","featureId":"AUTH-LOGIN"},
  {"sessionId":"tide-20260616-001","status":"prd_ready","brief":"YYY","createdAt":"...","featureId":"PAYMENT-ORDER"}
]
```

**维护时机：** 在每次 session 创建、状态更新、归档时同步写入 `.index.json`（增量修改，不重写全文）。

**启动时读取策略：** AI 优先读取 `.index.json`（单文件、小体积），仅当用户选中某个具体 session 时才读取完整的 `{sessionId}.json`。`.index.json` 不存在时降级为扫描目录（向后兼容）。

**需要修改 SKILL.md：** 在所有操作 session 文件的位置增加索引写入步骤。

**配合 hook（Decision 7）效果最大化：** Hook 只需 `cat tide-data/sessions/.index.json` 一行命令，注入 ~200 字节数据即可完成启动准备。

### Decision 9: MCP 能力发现缓存

MCP 能力发现（Step 4 入口）目前每次都会重新读取 `settings.json` 并交叉匹配。当前场景下用户的 MCP 服务配置在单次会话中不会变化，重复发现是浪费。

**方案：** 首次成功发现后，将结果缓存到 session JSON 的 `services.capabilities` 字段：

```json
"capabilities": {
  "knowledge_base": {"available": false},
  "issue_tracker": {"available": true, "providers": [{"id": "jira", "label": "Jira"}]}
}
```

**恢复时：** 如果 session 已有 `services.capabilities`，跳过重新发现，直接按缓存值执行发布流程。仅在用户明确要求重试时才刷新缓存。

**向后兼容：** 旧 session 无此字段时走完整发现逻辑不变。

### Decision 10: 启动时依赖 skill 检查

tide-discuss 依赖 BMAD 套件进行多角色需求讨论，依赖 grill-me 进行需求追问。启动时（入口扫描后）应检查这些依赖 skill 是否已安装。

**检查方式：** AI 检查 `.claude/settings.json` 中的 `deepstorm.installedSkills` 数组是否包含 `bmad` 和 `grill-me`。不依赖额外文件扫描，零 I/O 开销。

**未安装时的行为：**
- bmad 未安装 → **警告提醒**，告知用户 tide-discuss 需要 bmad 来进行角色讨论，建议运行 `npx @deepstorm/cli setup` 安装
- grill-me 未安装 → **温和提示**，告知用户安装后可获得更好的需求追问体验
- 两种提示都**不阻止技能运行**，用户仍可正常使用 tide-discuss

**判断逻辑只在入口执行一次**，不在讨论过程中重复检查。

## Risks / Trade-offs

- **[兼容性] 新版 SKILL.md.tmpl 测试依赖人工 review** → 仅做文本级变换，无逻辑修改，review 时对比即可
- **[数据残留] 旧 superseded 会话的 PRD 文件不会自动回迁** → 在 SKILL.md 中明确说明：仅新 supersede 操作适用
