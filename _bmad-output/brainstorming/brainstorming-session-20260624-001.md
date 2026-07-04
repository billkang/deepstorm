# Brainstorming Session

- **日期**：2026-06-24
- **主题**：Reef 自动意图识别 — 用户自然对话中自动唤起 reef-start skill
- **参与角色**：用户（Bill Kang）、AI 助手

## 讨论过程

### 初始需求

用户在安装了 reef 套件的实际项目中，希望不需要手动输入 `/reef-start` 等命令，而是通过自然对话中的意图识别，自动唤起 reef-start skill，引导用户走 SDD 全流程。

### 关键澄清回合

**第一轮（我的错误理解）：** 我以为是要修改 deepstorm-discuss 的入口路由，让它主动调用 reef-start。

**用户纠正：** 这不是 DeepStorm 自身开发的问题。而是当 reef 作为一个套件部署到用户的**实际项目**中时，能否在用户自然口述需求（没有使用任何 slash 命令）的情况下，系统自动识别"这是开发需求"并唤起 reef-start skill。

**第二轮（理解对齐）：** 确认了核心场景：
- 用户在自己的项目目录中工作
- Reef 已经安装到该项目
- 用户自然地描述需求，如"我想加一个用户注册功能"、"这个 bug 需要修一下"
- 系统自动检测到开发意图 → 自动加载 reef-start skill → 走 SDD 全流程

### 需求要点

1. **意图自动检测**：在用户未使用 slash 命令时，根据自然语言输入判断是否属于"开发需求/代码修改"意图
2. **自动唤起 reef-start**：匹配成功后自动加载 reef-start skill，而不是等用户手动调用
3. **静默过关**：非开发意图的消息（如运维查询、日常聊天）正常处理，不受影响
4. **用户项目部署**：作为 reef 安装的一部分，hook 机制自动部署到用户项目的 `.claude/` 目录

### 边界范围

- **第一版不做**：多轮对话的意图累积（只在单条消息层面做判断）
- **明确不做的**：不影响 reef 未安装的项目；不影响用户已明确使用其他 slash 命令的场景

## 关键决策

1. 使用 `before-read` hook 机制在 AI 处理前注入指令
2. 匹配规则使用关键词模式，不做 NLP 模型调用（轻量、无外部依赖）
3. Hook 脚本从 reef 安装流程中自动部署，无需用户手动配置

## 后续步骤

- Step 2: 创建 OpenSpec change
- Step 3: Proposal（完整的需求描述和 Capabilities）
- Step 4: Specs（WHEN/THEN 场景规范）
- Step 5: Design（技术决策：hook 类型、匹配算法、指令格式）
- Step 6: Tasks（实现任务分解）
- → superpowers → apply → verify → archive

## 变更名前瞻

`reef-intent-detect-hook`（英文 kebab-case，3-6 词）
