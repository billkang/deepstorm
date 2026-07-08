---
name: deepstorm-commit
description: 根据当前变更和 OpenSpec 任务定义，生成规范的提交信息并创建新提交。用户说「提交代码」「commit」「git push」「提交」「推送」等触发
allowed-tools: Bash(git:*), Bash(pnpm:*)
---

# 智能提交 — DeepStorm 版本

根据当前变更、OpenSpec 任务定义及 DeepStorm 仓库约定，生成中文提交信息，创建新的 git 提交。

> **本技能继承自 `@deepstorm/reef` 套件的 `reef-commit` skill 框架**，针对 DeepStorm 自身源码仓库做了以下定制：
>
> | 差异点 | reef-commit（通用模板） | deepstorm-commit（DeepStorm 自身） |
> |--------|-----------------------|----------------------------------|
> | 提交前缀 | 不使用 conventional commit | ✅ 使用 `feat:`/`fix:`/`refactor:`/`chore:` 等 |
> | 测试命令 | `./gradlew test` + `pnpm test` | `pnpm validate`（DeepStorm 统一验证） |
> | 分支范围检查 | scope-gate hook | ❌ 跳过 — DeepStorm 为 monorepo，跨 package 变更是常态 |
> | JIRA 引用 | 自动提取 | ✅ 同步支持 |
> | 受众 | 下游用户项目 | DeepStorm 自身开发 |
>
> 当 `reef-commit` 更新通用工作流逻辑时，本技能应同步更新。以下工作流步骤编号与 `reef-commit` 对齐。

## 提交信息风格规范

### 标题

1. **推荐使用 conventional commit 前缀**，清晰标识提交类型：
   - `feat:` — 新功能
   - `fix:` — 问题修复
   - `chore:` — 工程配置、依赖管理
   - `refactor:` — 重构（非修复非功能）
   - `docs:` — 文档变更
   - `test:` — 测试相关
   - `style:` — 代码格式（非语义变化）
2. 前缀后接中文描述，一句话说清做了什么，可包含英文术语（如 Tide、OpenSpec、BMAD）
3. 命名来源优先级：OpenSpec proposal/design 标题 → 变更内容总结
4. 正例：`feat: 实现 TIDE_DATA_DIR 环境变量支持`、`fix: 修复 session 测试中 env 恢复的 bug`、`chore: 更新 pnpm 依赖至 9.0`

### 正文

标题和正文每行均不超过 70 视觉宽度（中文字符占 2 列，ASCII 字符占 1 列；即纯中文 ≤ 35 字，中英混排视实际内容折算）。

| 复杂度 | 正文策略 |
|--------|---------|
| 简单（单文件 / 小修补 / 配置改动） | 仅标题 |
| 中等 | 标题 + 一段说明 |
| 复杂（多 package / 架构级 / 破坏性变更） | 标题 + `本次提交改动如下：` + 要点列表 |

有参考文档加 `参考资料：`，关联 Issue 在尾部隔空行加 `JIRA: {完整 URL}`。文件数仅作参考（50 个重命名仍属简单）。

## 工作流

### 1. 检测变更

```bash
git status --short
```

若无任何变更则提示用户并退出。

### 2. 分支名与任务相关性检查

在审查待提交文件之前，先检查当前分支是否与待提交的任务相关。如果当前在 `main` 分支上则**必须**创建新分支；如果分支名与任务内容明显不匹配（如命名随意、与 OpenSpec 任务不符），建议创建新分支。

```bash
BRANCH=$(git branch --show-current)
echo "当前分支: $BRANCH"

# 检测是否需要创建新分支
MUST_NEW_BRANCH=false

# 条件一：在 main 上必须创建新分支
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  echo "⚠️ 当前在 $BRANCH 分支上，不允许直接提交，必须创建新分支"
  MUST_NEW_BRANCH=true
fi

# 条件二：检查分支名是否包含 temp、wip、test、tmp、dev 等临时名称
TEMP_PATTERN='^(temp|wip|test|tmp|dev)(/.*)?$'
if echo "$BRANCH" | grep -qE "$TEMP_PATTERN"; then
  echo "⚠️ 当前分支名 ($BRANCH) 看起来是临时分支，建议创建有意义的新分支"
fi

# 收集 OpenSpec 任务上下文
for dir in openspec/changes/*/; do
  if [ -f "$dir/proposal.md" ]; then
    TASK_NAME=$(basename "$dir")
    echo "发现 OpenSpec 任务: $TASK_NAME"
  fi
done
```

**判断规则（LLM 自行推理执行）：**

1. **如果 MUST_NEW_BRANCH=true**（当前在 main）：
   - 直接进入步骤 3「创建新分支」，无需询问用户
2. **如果分支名明显不相关**（如 `temp-xxx`、`test-foo`、或随意命名与当前变更毫无关联）：
   - 向用户说明：「当前分支 `$BRANCH` 与待提交的变更内容似乎不匹配，是否创建一个新分支？」
   - 用户同意 → 进入步骤 3「创建新分支」
   - 用户不同意 → 继续当前分支
3. **如果分支名合理**（如与 OpenSpec 任务同名，或包含功能描述的 kebab-case）：
   - 直接继续

### 3. 创建新分支

当需要创建新分支时，按以下逻辑确定分支名：

**分支名生成规则（优先级从高到低）：**
1. **OpenSpec 任务名**：如果检测到 `openspec/changes/<task>/proposal.md`，使用 `<task>` 作为分支名
2. **用户输入**：询问用户想要的分支名
3. **AI 推导**：根据变更内容总结生成 kebab-case 分支名（例如 `feat/add-user-auth`、`fix/login-timeout`）

```bash
# 暂存当前未提交变更
STASHED=false
if [ -n "$(git status --porcelain)" ]; then
  git stash push -m "deepstorm-commit-auto-stash"
  STASHED=true
fi

# 创建并切换到新分支（基于 main）
git checkout main
git pull origin main 2>/dev/null || true
git checkout -b <new-branch-name>

# 恢复暂存的变更
if [ "$STASHED" = true ]; then
  git stash pop
fi

echo "✅ 已切换到新分支: <new-branch-name>"
```

> **注意**：创建新分支后，后续步骤（审查文件、测试、提交等）在新分支上继续执行。

### 4. 审查待提交文件

展示变更清单，检查敏感文件：

```bash
git diff --stat
```

如包含 `.env`、凭据、证书或大型二进制文件，让用户确认或排除后再继续。

### 5. 运行测试

```bash
git status --short
```

如有变更则运行全量验证：

```bash
pnpm validate
```

- 测试全部通过 → 继续
- 任一测试失败 → 提示用户修复后再提交

### 6. 收集上下文

```bash
# 当前分支名
BRANCH=$(git branch --show-current)
echo "$BRANCH"

# 从前缀分支名中提取 commit type（如 feat/add-user-auth → feat）
BRANCH_PREFIX="${BRANCH%%/*}"
if [ "$BRANCH_PREFIX" = "$BRANCH" ]; then
  # 分支名不含 /，无前缀
  BRANCH_PREFIX=""
fi
echo "Branch prefix: ${BRANCH_PREFIX:-none}"

# 变更统计（基于 main 的 merge-base，更稳健）
FORK_POINT=$(git merge-base main HEAD 2>/dev/null || echo "main")
git diff "$FORK_POINT"..HEAD --stat
git diff "$FORK_POINT"..HEAD | head -300

# OpenSpec 上下文（兼容新旧两种分支名格式）
for dir in openspec/changes/*/ openspec/changes/*/*/; do
  if [ -f "$dir/proposal.md" ]; then
    head -5 "$dir/proposal.md"
  fi
done

# 从 OpenSpec proposal 中提取 JIRA/Issue 引用
for dir in openspec/changes/*/; do
  if [ -f "$dir/proposal.md" ]; then
    grep -iE '(issue|jira|lc-|proj-|JIRA|Issue)' "$dir/proposal.md" 2>/dev/null | head -3
  fi
done

# 变更涉及的 packages
git diff --name-only | grep -oP '^packages/[^/]+' | sort -u
```

### 7. 生成提交信息

**标题生成规则：**
- **提交类型前缀**：优先从 `$BRANCH_PREFIX` 中提取（如分支 `feat/add-user-auth` → 自动使用 `feat:`），无需手动选择
- **Fallback**：当分支名不含 `/`（$BRANCH_PREFIX 为空），回到手动选择模式，从 8 种前缀中选取
- 若无 OpenSpec，基于分支名或变更内容总结描述
- 如为问题修复，使用 `fix: 解决{问题描述}的问题` 格式
- **正例：** 分支 `feat/add-user-auth` → `feat: 实现用户认证`；分支不含前缀 → 手动选择 `chore:`、`refactor:` 等
- **JIRA 引用**：如上下文中提取到 JIRA key（如 `PROJ-123`），在正文末尾隔空行添加 `JIRA: https://your-domain.atlassian.net/browse/PROJ-123`

**正文生成规则：**
- 涉及多 package 的变更，用要点列表区分
- 末尾添加 OpenSpec 引用：`Change: openspec/changes/<name>/`
- 如有 PRD 链接加 `Ref: {URL}`

### 8. 展示并确认

展示生成的完整提交信息，问用户确认：
- 「就这样提交」— 执行第 9 步
- 「用 --amend 合并到上次提交」— 执行第 9 步的 amend 模式
- 「修改一下」— 用户提供修改意见后重新生成

### 9. 执行提交

**默认模式（新提交）：**
```bash
git add -A
git commit -m "<完整提交信息>"
```

**Amend 模式：**
```bash
git add -A
git commit --amend -m "<完整提交信息>"
```

### 10. 推送（仅在用户明确要求时）

**已有远程跟踪分支：**
```bash
git push
```

**Amend 场景（需 force）：**
```bash
git push --force-with-lease
```

**首次推送：**
```bash
git push -u origin $(git branch --show-current)
```

## 约束规则

- 默认新提交，用户要求才 `--amend`
- 每行 ≤ 70 视觉宽度（中文 2 列 / ASCII 1 列）
- 无变更则退出
- 提交前必须通过 `pnpm validate`
