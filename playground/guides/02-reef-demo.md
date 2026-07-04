# Reef 工具能力演示

> 本文档展示 Reef (开发侧) 在 Playground 中的使用流程。
> 这是一个**演示参考**，实际操作请按 `playground/README.md` Phase 4 步骤执行。

---

## 场景一：test-case-generation — 从 PRD 生成测试用例

### 触发方式

在 Claude Code 中执行 `/reef:reef-testcase` 并输入 PRD 链接或功能描述。

### 输入假设

以上述 Tide 产出的"任务截止日期"PRD 作为输入。

### 预期输出

Reef 的 `test-case-generation` skill 会生成四维覆盖的测试用例：

**正常流程：**
1. 创建任务时设置截止日期 → 任务详情显示截止日期
2. 编辑任务时修改截止日期 → 数据更新
3. 未设置截止日期的任务 → 不显示截止日期字段

**边界条件：**
1. 截止日期设为当天 → 任务正常显示
2. 截止日期设为过去日期 → 任务立即标记为过期
3. 截止日期设为很久以后（2099年）→ 系统正常处理

**异常场景：**
1. 传入非法日期格式 → API 返回 400 错误
2. 并发设置截止日期 → 最后写入生效

**验收标准：**
1. 过期任务在列表中红色显示
2. 筛选"已过期"仅显示过期任务
3. 标记过期任务为完成后，红色标记消失

---

## 场景二：Git CI/PR 工作流

### git-pr — PR 创建

```
场景假设：开发者提交了"任务截止日期"功能的代码。
```

在 Claude Code 中执行 `/reef:reef-pr`：

1. 检测当前分支的变更文件
2. 读取 OpenSpec 上下文（proposal.md 等）
3. 构建 PR 描述（包含变更摘要、关联 Issue、变更清单）
4. 创建 GitHub Pull Request

**验证方式：** 在测试分支上创建一个简单的修改，运行 `/reef:reef-pr` 观察输出。

### git-commit — Commit 辅助

```
场景假设：开发完功能后需要提交代码。
```

执行 `/reef:reef-commit`：
1. 检测当前变更文件
2. 审查待提交文件（检查敏感文件）
3. 自动运行单元测试
4. 收集 OpenSpec 上下文
5. 生成规范的中文提交信息
6. 用户确认后提交

**验证方式：** 在工作区创建一个修改，运行 `/reef:reef-commit` 观察输出。

---

## 场景三：Spec Hardener — 规格强化

### 触发方式

执行 `/reef:reef-harden` 并提供一个 spec 文档路径。

### 能力演示

Spec Hardener 会对 spec 进行以下强化：
1. **完整性检查** — 发现缺失的边界场景和异常处理
2. **一致性检查** — 前后描述是否矛盾
3. **可测试性** — 每个需求是否可验证
4. **技术可行性** — 是否有实现困难的部分

**验证方式：** 将测试工程的 `.flow.md` 文件作为输入，观察 Spec Hardener 的输出。

---

## 场景四：代码生成（需对应技术栈）

Reef 的 `reef-gen-backend`（后端代码生成）和 `reef-gen-frontend`（前端代码生成）技能分别支持 Spring Boot + Angular 技术栈。Playground 中的 使用 Express + Vanilla JS，因此代码生成场景需要搭建对应的技术栈环境后才能验证。

可通过以下方式体验：
1. 在 deepstorm 项目之外创建一个 Spring Boot + Angular 项目
2. 在项目中运行 `/reef:reef-gen-backend` 体验后端代码生成
3. 在项目中运行 `/reef:reef-gen-frontend` 体验前端代码生成

---

## 验证指引

逐步骤验证见 `playground/README.md` → **Phase 4：Reef — 开发侧工具验证**。

| 能力 | 验证方法 | 依赖 |
|------|---------|------|
| test-case-generation | 运行 `/reef:reef-testcase`，输入测试场景或 Jira Issue | 无 |
| git-commit | 在工作区修改文件后运行 `/reef:reef-commit` | 无 |
| spec-hardener | 提供任意 spec 文档运行 `/reef:reef-harden` | 无 |
| code-audit | 在项目上运行 `/reef:reef-review`（自动检测变更范围） | 无 |
| git-pr | 创建测试分支提交后运行 `/reef:reef-pr` | GitHub Token |
| backend-code-gen | 在 Spring Boot 项目上运行 `/reef:reef-gen-backend` | 对应技术栈 |
| frontend-code-gen | 在 Angular 项目上运行 `/reef:reef-gen-frontend` | 对应技术栈 |
