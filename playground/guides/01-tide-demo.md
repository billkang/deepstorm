# Tide 工具能力演示

> 本文档展示 Tide (产品侧) 在 Playground 中的使用流程。
> 这是一个**演示参考**，实际操作请按 `playground/README.md` Phase 3 步骤执行。

---

## 场景假设

任务管理系统需要增加一个新功能：**任务截止日期**。

> 在真实场景中，Tide 通过 BMAD 多角色讨论来梳理需求。

## 1. BMAD 分析师 Mary — 分析背景

```
角色触发：用户口述需求 → Tide 自动激活 BMAD
```

**用户输入：** "我想给任务加一个截止日期功能，用户可以在创建或编辑任务时设置截止时间，到期没完成的标红提醒。"

**分析师 Mary 的分析：**
- **背景痛点：** 目前任务只有"待办/已完成"两个状态，缺少时间维度的管理
- **业务目标：** 帮助用户按时完成任务，减少延期
- **核心指标：** 任务按时完成率
- **约束：**
  - 截止日期为可选字段（不填表示无截止日期）
  - 过期任务在列表中自动标红显示
  - 提供"已过期"筛选状态

## 2. 产品经理 John — 用户故事

```
角色触发：分析师输出完成 → Tide 自动激活 PM 角色
```

```gherkin
Feature: 任务截止日期

  Scenario: 创建任务时设置截止日期
    Given 用户已登录
    When 用户创建任务时填写截止日期
    Then 任务详情中显示截止日期

  Scenario: 任务过期标红
    Given 存在一个已过期的任务
    When 用户查看任务列表
    Then 该任务以红色标记显示
    And 状态标签显示"已过期"

  Scenario: 筛选过期任务
    Given 存在多个不同状态的任务
    When 用户选择筛选"已过期"
    Then 列表仅显示已过期的任务
```

## 3. PRD 片段（Tide 产出）

Tide 会将讨论结果生成为结构化 PRD，以下为关键片段：

```markdown
## 功能规格

### 数据模型变更

给 Task 新增字段：
- `dueDate: string | null` — ISO 8601 格式的截止日期
- `overdue: boolean` — 计算属性：当前时间 > dueDate 且 status = 'todo'

### UI 变更

1. **新建/编辑弹窗**：新增"截止日期"输入框（type=date）
2. **任务列表**：过期任务标题显示为红色
3. **筛选下拉**：新增"已过期"选项

### API 变更

- `POST /api/tasks` 和 `PUT /api/tasks/:id` 新增 body 字段 `dueDate`
- `GET /api/tasks` 新增筛选参数 `status=overdue`
```

## 4. 后续流程

PRD 发布后，团队的下一步：

```
Tide 产出 PRD
  → OpenSpec New 生成 spec + tasks
  → Reef 开发代码（/reef:reef-commit、/reef:reef-pr）
  → Sweep 生成并执行 E2E 测试（/sweep-plan → /sweep-run）
  → Atoll 部署上线（atoll-ops）
```

---

## 验证指引

逐步骤验证见 `playground/README.md` → **Phase 3：Tide — 产品需求讨论验证**。

| 能力 | 验证方法 | 依赖 |
|------|---------|------|
| BMAD 多角色讨论 | 在 Claude Code 中直接口述需求，Tide 自动激活 BMAD 流程 | 无 |
| PRD 自动生成 | 检查 `tide-data/prds/` 目录下的 PRD 文件 | 无 |
| Jira Issue 创建 | 需配置 Jira MCP 后执行发布流程 | Jira Token |
| 飞书知识库发布 | 需配置飞书 MCP 后执行发布流程 | 飞书 Token |
