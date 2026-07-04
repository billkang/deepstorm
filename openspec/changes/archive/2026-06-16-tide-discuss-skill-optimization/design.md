## Context

Tide-discuss SKILL.md.tmpl 是 DeepStorm Tide 套件的核心工作流指令文件。当前结构为 1 个主模板（~400 行）+ 8 个参考文件（`references/` 目录），总计约 1000+ 行。

**现状分析：**
- AI 加载 skill 时只得到主 SKILL.md，参考文件需通过额外的 Read 调用加载
- 每次 Read 调用约 3-5 秒，连续加载 3-4 个文件时用户等待感明显
- 主模板中「上下文隔离」指令为模糊表述（"必须主动重置上下文"），无法被 AI 实际执行
- 部分参考文件（如 `entry-details.md`、`session-ops.md`、`archive.md`）内容与主工作流高度耦合，适合内联
- 部分参考文件（如 `data-format.md`、`prd-template.md`）内容独立且结构固定，适合保留

**约束条件：**
- 不改变 Tide 工作流的业务逻辑
- 向后兼容已有的 session 数据和 PRD 文件
- 不增加新的外部依赖

## Goals / Non-Goals

**Goals:**
- 减少 AI 加载 tide-discuss skill 时的文件 IO 次数（目标：≤2 次 Read）
- 补充 `/clear` 执行指引，使上下文隔离指令可被 AI 实际遵循
- 优化 SKILL.md.tmpl 结构，提升可读性和指令清晰度
- 消除模糊指令，所有 AI 需要执行的操作都拆解为具体步骤

**Non-Goals:**
- 不修改 Tide 工作流的业务逻辑或数据格式
- 不改变已有 session/archive 文件结构
- 不引入构建工具或模板引擎

## Decisions

### Decision 1: 参考文件合并策略

**选择：部分合并 + 摘要索引**

将参考文件分为三类：

| 类别 | 文件 | 策略 | 原因 |
|------|------|------|------|
| **内联** | `entry-details.md` | 合并到 SKILL.md | 内容 ~100 行，与入口流程紧密耦合，高频引用 |
| **内联** | `session-ops.md` | 合并到 SKILL.md | 内容 ~80 行，含会话恢复和关联逻辑 |
| **内联** | `archive.md` | 合并到 SKILL.md | 内容 ~30 行，极小且仅含归档规则 |
| **保留** | `data-format.md` | 保留 + 顶部加摘要索引 | ~200 行，纯数据格式规范，只在写入时参考 |
| **保留** | `prd-template.md` | 保留 + 顶部加摘要索引 | 模板文件，只在 Step 3 渲染时使用 |
| **保留** | `publish-flow.md` | 保留 + 顶部加摘要索引 | ~150 行，含详细的错误处理恢复路径 |
| **保留** | `role-prompts.md` | 保留 | 角色 prompt 较长，按需加载（每轮只读一个角色） |
| **保留** | `checklists.md` | 保留 | checklist 定义按需加载 |

**合并后 SKILL.md.tmpl 预计从 ~400 行增至 ~600 行**，完全可接受。

### Decision 2: 内联文件的插入位置

**选择：按工作流阶段就近插入**

- `archive.md` 内容 → 插入到「归档」章节末尾
- `session-ops.md` 内容 → 插入到「会话恢复」章节末尾，关联逻辑紧跟在 LINK 说明后
- `entry-details.md` 内容 → 插入到「入口：数据扫描 + 输入解析」章节末尾

不放在文件末尾统一附录，而是按上下文就近放置，方便 AI 阅读时在对应阶段直接获取完整信息。

### Decision 3: 保留文件的摘要索引格式

保留文件在文件顶部增加 3-5 行的元数据摘要块，格式如下：

```markdown
> **用途:** 描述该文件的内容和适用场景
> **引用时机:** Step 2 角色生成完 checklist 后写入
> **关键字段:** `sessionId`, `featureId`, `brief`, `status`
```

### Decision 4: 上下文隔离指令模式

**模式：两步声明 + 用户执行**

SKILL.md.tmpl 在每个通往 S1（新建会话）的入口点明确要求 AI：

1. **AI 主动声明** — 以固定句式宣告上下文切换
2. **引导 `/clear`** — 提示用户直接输入 `/clear` 清空终端

已修改的文件：
- `SKILL.md.tmpl` — Step 1 入口、LINK 说明、会话关联、流程结束表
- `references/entry-details.md` — 所有"变更需求"操作说明
- `references/session-ops.md` — 会话关联步骤
- `references/archive.md` — 重来操作说明

### Decision 5: 结构优化

**选择：按工作流阶段分级标题 + 引用行号锚点**

- 主标题层级与 Mermaid 流程图的阶段对齐（`Step 1` / `Step 2` / `Step 3` / `Step 4`）
- 每个 reference 文件的引用处标注文件名（如 `<!-- ref: data-format.md -->`）
- 检查并统一模板中的中英文标点和空格规范

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 合并后 SKILL.md.tmpl 文件过长（>800 行），AI 整体加载变慢 | 保持合理的标题层级，关键指令放在对应章节而非全部堆在前面 |
| 保留的参考文件仍需要 Read 调用 | 摘要索引让 AI 能判断是否需要 Read 该文件，避免盲目加载 |
| `/clear` 指令被用户忽视，上下文仍然污染 | 这是用户行为，无法强制。AI 主动声明已提供软性保障 |
| 合并后主模板变更频繁，与分布式参考文件相比冲突概率增加 | SKILL.md.tmpl 本身就是一个文件，变更频率不变 |

## Open Questions

- [ ] `role-prompts.md` 中的分析师引导 prompt 是否需要简化？当前较长，可能导致 Step 1 → analyst 过渡时加载慢
- [ ] 是否需要在 `SKILL.md.tmpl` 开头增加一个"文件索引"区块，列出所有保留参考文件的用途？
