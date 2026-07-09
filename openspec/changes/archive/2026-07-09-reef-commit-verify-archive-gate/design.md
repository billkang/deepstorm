## Context

deepstorm-commit 是 DeepStorm 自身的智能提交技能，在 `.claude/skills/deepstorm-commit/SKILL.md` 中定义。它继承自 `packages/reef/skills/reef-commit/SKILL.md.tmpl` 通用模板。

当前 deepstorm-commit 的工作流为：检测变更 → 分支检查 → 审查文件 → 文档检查 → 运行测试 → 收集上下文 → 生成提交信息 → 确认 → 提交 → 推送。其中缺少对 OpenSpec change 的 verify/archive 状态检查，可能导致未经验证或未归档的变更被提交。

reef-commit 是面向下游用户项目的通用技能模板，deepstorm-commit 是 DeepStorm 自身的定制版本。本变更需同步修改两份技能文件。

## Goals / Non-Goals

**Goals:**
- 在 deepstorm-commit 提交流程中插入 OpenSpec verify/archive 门禁步骤
- 自动检测关联的活跃 OpenSpec change
- 未验证时自动运行 `/opsx:verify`，未归档时自动运行 `/opsx:archive`
- 同步更新 reef-commit 通用模板，确保下游用户也能使用此能力
- 所有行为通过 Skill 工具调用而不是命令行，确保 hooks（PreToolUse 约束）生效

**Non-Goals:**
- 不修改 /opsx:verify 或 /opsx:archive 本身的行为
- 不改动 deepstorm-commit 的其他步骤逻辑
- 不引入新的配置文件或环境变量

## Decisions

### Decision 1: 步骤插入位置为步骤 5（测试）之后、步骤 6（收集上下文）之前

**备选方案：**
- A（选中）：步骤 5 之后步骤 6 之前 — 测试通过后才进行 OpenSpec 检查，避免测试失败时做无用功
- B：步骤 9（执行提交）之前 — 离提交最近，但此时已生成了提交信息，如果 verify/archive 出问题需要回头修改更麻烦
- C：步骤 2（分支检查）之后 — 太早，此时还不确定是否要通过测试

**理由：** 步骤 5 通过了测试验证，意味着代码本身已就绪。verify/archive 可能产生额外文件变更（如归档复制），放在步骤 6 之前可以确保这些变更在「收集上下文」和「生成提交信息」时被正确捕获。

### Decision 2: 通过 Skill 工具调用 /opsx:verify 和 /opsx:archive

**备选方案：**
- A（选中）：使用 Skill 工具调用 — 与 deepstorm-discuss 工作流中定义的方式一致，hooks 约束能正常生效
- B：直接执行 openspec CLI 命令 — 绕过 hooks 约束，可能导致 PreToolUse prompt hook 失效

**理由：** Skill 工具是 DeepStorm 工作流的标准调用方式。opsx:verify 和 opsx:archive 是独立的 skill，通过 Skill 工具调用可确保所有配套 hooks（PreToolUse 门禁）执行，符合 DeepStorm 自身开发规范。

### Decision 3: 同步更新 reef-commit 通用模板

**备选方案：**
- A（选中）：同步更新 `packages/reef/skills/reef-commit/SKILL.md.tmpl` — 保持通用能力对齐，下游用户项目受益
- B：仅修改 deepstorm-commit — 快速但导致两份技能差异扩大，增加维护成本

**理由：** CLAUDE.md 关键约定要求「修改 reef 套件内容时必须同步检查并更新 CLI 消费命令」。虽然这里不是 CLI 消费命令，但 reef-commit 作为通用模板，保持与 deepstorm-commit 的行为一致是合理的。

## Risks / Trade-offs

- **[风险] verify 可能产生提示信息，需要用户交互** → 门禁步骤中明确告知用户即将运行 verify/archive，并报告结果
- **[风险] archive 可能失败（如文件锁、权限问题）** → spec 中定义了 archive 失败的处理流程：提示用户手动处理
- **[风险] 自动运行 verify/archive 可能让用户感觉失去控制** → 执行前通过展示确认信息让用户知情，非静默执行
- **[风险] reef-commit 通用模板中的 OpenSpec 路径差异** → deepstorm-commit 使用 `openspec/changes/`，reef-commit 下游项目路径可能不同，需要在模板中使用模板变量或配置路径
