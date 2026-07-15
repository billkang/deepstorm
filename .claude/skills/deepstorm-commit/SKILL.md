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
> | PR 自动创建 | ❌ 无 | ✅ commit 后自动创建 PR，target: main |
> | 自动合并 | ❌ 无 | ✅ squash merge auto-merge |
> | 受众 | 下游用户项目 | DeepStorm 自身开发 |
>
> 当 `reef-commit` 更新通用工作流逻辑时，本技能应同步更新。工作流步骤 1-9 与 `reef-commit` 对齐；步骤 10-12（自动推送、PR 创建、自动合并）为 `deepstorm-commit` 独有。

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

### 4.5 文档同步检查

审查文件后，检查本次变更是否涉及需要同步 DeepStorm 自身文档的情况：

```bash
# 获取变更文件列表
CHANGED=$(git diff --name-only --cached 2>/dev/null || git diff --name-only)
echo "$CHANGED"
```

**判断规则（LLM 自行推理）：**

1. **DeepStorm 自身开发需要检查的变更类型：**
   - 修改了 `packages/*/skills/` / `agents/` / `hooks/` → README.md（根 + 对应 package）组件列表、CLAUDE.md
   - 修改了 CLI 命令（`packages/cli/src/commands/`）→ 根 README.md CLI 命令表
   - 修改了 MCP 服务器配置（`packages/cli/mcp/`）→ 根 README.md MCP 章节
   - 修改了配置格式（`config-schema.json`、`wizard.json`）→ 项目结构/配置文档
   - 修改了工作流程或约定（skills/agents/hooks 的行为逻辑）→ CLAUDE.md 关键约定

2. **提醒方式：** 发现未同步的文档时，**提示用户**（非阻断）：「本次变更涉及 XXX，相关文档可能需要同步更新：- path/to/doc.md」。用户可立即更新或跳过。

3. **不需要检查：** 纯 bug 修复、内部重构（不改变对外行为）、测试补充、仅文档变更

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

### 5.5 OpenSpec 验证与归档检查

> **本步骤继承自 `@reef-commit` 通用框架的 OpenSpec 门禁机制**，在提交前完成验证和归档检查。

**判断流程（LLM 自行推理执行）：**

1. **查找关联的 OpenSpec change：**
   ```bash
   BRANCH=$(git branch --show-current)
   echo "当前分支: $BRANCH"

   # 扫描 openspec/changes/ 下所有活跃 change（非 archive 目录）
   for dir in openspec/changes/*/; do
     CHANGE_NAME=$(basename "$dir")
     if [ -f "$dir/.openspec.yaml" ] && [ "$CHANGE_NAME" != "archive" ]; then
       echo "发现活跃 OpenSpec change: $CHANGE_NAME"
       cat "$dir/.openspec.yaml"
     fi
   done
   ```

2. **匹配规则：**
   - 扫描 `openspec/changes/*/` 下活跃 change（不包含 `archive/` 目录下的）
   - 与当前分支名比较：分支名包含 change 名 → 匹配
   - 如果无活跃 change（所有变更已归档或不存在）→ **跳过本步骤**
   - 如果有多个活跃 change → 让用户选择，不得自动猜测

3. **检查归档状态：**
   - 读取匹配 change 的 `.openspec.yaml`，检查 `status` 字段
   - 如果 `status: archived` → 验证与归档均已完成，**跳过后续检查**
   - 如果 `status` 非 `archived` → 继续下一步

4. **运行验证（仅当尚未验证时）：**
   - 检查任务完成状态：读取 `tasks.md`，确认所有 checkbox 均为 `[x]`
   - 如有未完成的任务 → **提示用户**「存在未完成任务，请先完成所有 task 再提交」，中止提交流程
   - 所有任务已完成但未验证 → **通过 Skill 工具自动调用 `/opsx:verify`**
   - 根据 verify 结果判断：
     - 有 **CRITICAL** 问题 → 提示修复后再提交，中止流程
     - 仅 WARNING/SUGGESTION → 视为验证通过，继续下一步

5. **运行归档（仅当验证通过后）：**
   - 验证通过后 → **通过 Skill 工具自动调用 `/opsx:archive`**
   - 归档完成后确认 `openspec/changes/archive/` 下已有对应 change 目录
   - 如果 archive 执行失败 → 提示用户手动处理，中止提交流程

6. **确认已就绪：**
   - 确认 `.openspec.yaml` 中 `status: archived`
   - 确认变更已在 archive 目录中
   - 向用户报告：「✅ OpenSpec 验证已通过，变更已归档，可以继续提交」

> **提示**：如果 verify 或 archive 执行后产生了额外的文件变更（如归档过程中复制了文件），后续步骤会重新检测变更并纳入提交。

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
→ 提交完成后自动进入第 10 步（推送）、第 11 步（PR）、第 12 步（自动合并）

**Amend 模式：**
```bash
git add -A
git commit --amend -m "<完整提交信息>"
```
→ 提交完成后进入 Amend 推送逻辑（仅推送，跳过 PR 和自动合并）

### 10. 自动推送到远程

Commit 执行后自动推送当前分支到远程仓库。此步骤不再需要用户确认——推送是 PR 流程的前置条件。

**默认模式（新提交）：**
```bash
git push -u origin $(git branch --show-current)
```

**已有远程跟踪分支：**
```bash
git push
```

> **注意**：`-u` 仅在首次推送时添加。后续推送不需要。

**错误处理：**
- 如果 push 失败（网络错误、权限不足等），提示用户手动处理并中止流程
- 用户处理完毕后可重新执行 `/deepstorm-commit` 继续

### 11. 创建 Pull Request

推送成功后自动创建 Pull Request。目标分支固定为 `main`。

```bash
# 获取 commit 信息
COMMIT_TITLE=$(git log -1 --pretty=%s)
COMMIT_BODY=$(git log -1 --pretty=%B | tail -n +2 | sed '/^$/d' | head -5)

# 检查 gh 是否可用
if ! command -v gh &> /dev/null; then
  echo "⚠️ gh CLI 未安装，跳过 PR 创建"
  echo "请手动创建 PR：https://github.com/billkang/deepstorm/compare/$(git branch --show-current)"
  exit 0
fi

# 检查是否已有对应 PR
EXISTING_PR=$(gh pr list --head "$(git branch --show-current)" --json number,title --jq '.[0].number' 2>/dev/null)

if [ -n "$EXISTING_PR" ]; then
  echo "🔍 检测到当前分支已有 PR (#$EXISTING_PR)"
  echo "是否继续对该 PR 启用自动合并？(y/n)"
  read -r CONTINUE_MERGE
  if [ "$CONTINUE_MERGE" != "y" ]; then
    echo "🛑 跳过自动合并，请手动处理 PR"
    exit 0
  fi
else
  # 构建 PR body
  PR_BODY="${COMMIT_BODY}"
  if ls openspec/changes/*/proposal.md 2>/dev/null; then
    PR_BODY="${PR_BODY}\n\n---\nOpenSpec Change: openspec/changes/$(git branch --show-current)/"
  fi

  # 创建 PR
  PR_URL=$(gh pr create \
    --base main \
    --title "$COMMIT_TITLE" \
    --body "$PR_BODY" 2>&1)
  echo "✅ PR 已创建：$PR_URL"
fi
```

**失败处理：**
- `gh` 未安装 → 提示手动创建，显示分支名
- `gh` 未认证（`gh auth status` 失败）→ 提示运行 `gh auth login`
- 创建失败 → 显示错误信息，提示手动处理

### 12. 启用自动合并（Squash Merge）

PR 创建成功后启用 auto-merge，等待 CI 通过后自动合并。

```bash
# 获取 PR 号
PR_NUMBER=$(gh pr list --head "$(git branch --show-current)" --json number --jq '.[0].number' 2>/dev/null)

if [ -n "$PR_NUMBER" ]; then
  gh pr merge "$PR_NUMBER" --auto --squash
  PR_URL="https://github.com/billkang/deepstorm/pull/$PR_NUMBER"
  echo "✅ Auto-merge (squash) 已启用：$PR_URL"
  echo "CI 通过后 PR 将自动合并到 main"
else
  echo "⚠️ 找不到 PR，请手动合并"
fi
```

## Amend 场景的推送逻辑

当用户在第 8 步选择了 `--amend` 模式时，commit 完成后直接进入推送，**跳过第 11 步和第 12 步**（不创建 PR、不启用自动合并），因为 amend 通常发生在已有 PR 需要微调的场景：

```bash
git push --force-with-lease
```

推送完成后提示用户：
- PR 无需重新创建，amend 后的变更会自动反映到已关联的 PR 中
- 如果之前未创建 PR，请手动创建

## 约束规则

- 默认新提交，用户要求才 `--amend`（amend 会跳过 PR 流程）
- 每行 ≤ 70 视觉宽度（中文 2 列 / ASCII 1 列）
- 无变更则退出
- 提交前必须通过 `pnpm validate`
- 需要 `gh` CLI 可用（PR 创建和自动合并必需，push 不需要）
