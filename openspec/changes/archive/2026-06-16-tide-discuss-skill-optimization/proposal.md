## Why

Tide-discuss SKILL.md.tmpl 当前将工作流逻辑分散在 1 个主模板 + 8 个参考文件中。AI 运行时需要通过多次 Read 调用逐一加载这些文件，每次加载约 3-5 秒，用户体验上表现为"等待时间过长"（尤其是连续加载多个参考文件时）。此外，经实践发现主模板中的「上下文隔离」指令不完整（缺少 `/clear` 的执行指引），需要补充完善。

趁此次优化，对 SKILL.md.tmpl 做一次结构性 review，提升 AI 启动效率和指令完整性。

## What Changes

1. **参考文件合并** — 将 `references/` 目录下内容量适中的文件合并到主 `SKILL.md.tmpl`，消除运行时多次文件 IO
   - 拆分标准：内容 < 200 行且与主工作流紧密相关的 → 内联到主模板
   - 内容较多或独立的数据格式规范 → 保留独立文件但增加摘要索引
2. **上下文隔离指令完善** — 补充 `/clear` 执行指引，形成"AI 主动声明 + 用户 `/clear`"的双重保障（已直接修改，需通过 spec 记录追踪）
3. **SKILL.md 结构优化** — 全局 review，调整段落顺序和嵌套层级，提升可读性和 AI 解析效率
4. **指令歧义消除** — 检查并修正模板中模糊或不可执行的指令（如"主动重置上下文"→ 具体步骤）

## Capabilities

### New Capabilities

- `tide-skill-consolidation`: 将 tide-discuss 技能的工作流指令从「主模板 + 多个参考文件」的分散结构合并为更自包含的单一模板，减少 AI 启动时的文件 IO

### Modified Capabilities

- `tide-core`: `tide-core` spec 中的「上下文隔离」需求需要更新——补充 `clear` 命令的执行约束，明确 AI 无法自行清空上下文，需引导用户操作

## Impact

- **代码**: `packages/tide/skills/tide-discuss/SKILL.md.tmpl` + 参考文件
- **构建**: 无影响（skill 无需编译）
- **已有会话**: 向后兼容，历史 session 数据格式不变
- **已部署安装**: 用户重新执行 `npx @deepstorm/cli setup` 时获取新模板
