## Why

Tide discuss skill 启动时，AI 需加载 SKILL.md.tmpl（~26.8KB）并扫描 `tide-data/sessions/` 目录读取所有 session 文件，这些 I/O 调用和文本体积消耗了首 token 时间。同时在废弃（superseded）会话时，已生成的 PRD 文件仍遗留在 `tide-data/prds/` 目录下，造成数据混乱。通过文本压缩、Hook 预加载、索引缓存三层手段加速启动，通过废弃文件夹机制保持数据整洁。

## What Changes

1. **SKILL.md.tmpl 文本压缩**（功能零变更）：
   - 上下文隔离段落去重合并
   - Step 2 Checklist 规则去冗余合并
   - Step 4 MCP 能力映射的 JSON 说明性示例删除
   - 参考文件使用说明行精简
   - 通篇措辞紧凑化
   - Mermaid 核心流程图、所有真实 references/*.md 引用保持原样

2. **废弃 PRD 文件夹**：
   - `tide-data/abandoned/` — 会话 superseded 时，PRD 文件移入该目录
   - 数据存储约定表中新增路径说明
   - 目录自动创建列表中加入 `abandoned`
   - supersede 流程中增加 PRD 清理步骤

3. **Hook 预加载**（纯 settings.json 配置）：
   - `sessionStart` hook 在 AI 启动前扫描 session 目录，注入摘要数据
   - 消除启动时的 ls/Read I/O 调用

4. **会话索引缓存**：
   - `tide-data/sessions/.index.json` 维护轻量摘要
   - 启动时优先读索引（单文件），仅选中具体 session 时读完整 JSON
   - session CRUD 时同步维护索引

5. **MCP 能力发现缓存**：
   - 首次发现结果缓存到 session JSON 的 `services.capabilities` 字段
   - 恢复时跳过重新发现

## Capabilities

### New Capabilities
（无新增能力）

### Modified Capabilities
- `tide-core`: 废弃 PRD 文件夹 + 会话索引缓存 + MCP 能力缓存，需在 spec 中增加对应约束

## Impact

- 修改文件：`packages/tide/skills/tide-discuss/SKILL.md.tmpl`
- 修改文件：`packages/cli/src/commands/setup.ts`（或相关模板渲染逻辑，写入 sessionStart hook 到目标 settings.json）
- 运行时新增文件：`tide-data/sessions/.index.json`（自动维护）
- 运行时新增目录：`tide-data/abandoned/`
- 无接口/API 变更，无依赖变更
- 向后兼容：所有缓存逻辑无数据时降级为原行为
