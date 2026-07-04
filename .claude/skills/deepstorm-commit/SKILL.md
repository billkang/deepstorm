---
name: deepstorm-commit
description: 根据当前变更和 OpenSpec 上下文，生成规范的提交信息并创建新提交。用户说「提交代码」「commit」「git push」「提交」「推送」「更新 changelog」等触发
allowed-tools: Bash(git:*), Bash(pnpm:*)
---

# 智能提交 — DeepStorm 版本

根据当前变更、OpenSpec 任务定义及 DeepStorm 仓库约定，生成中文提交信息，创建新的 git 提交。

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

## 工作流

### 1. 检测变更

```bash
git status --short
```

若无任何变更则提示用户并退出。

### 2. 审查待提交文件

展示变更清单，检查敏感文件：

```bash
git diff --stat
```

如包含 `.env`、凭据、证书或大型二进制文件，让用户确认或排除后再继续。

### 3. 运行测试

```bash
git status --short
```

如有变更则运行全量验证：

```bash
pnpm validate
```

- 测试全部通过 → 继续
- 任一测试失败 → 提示用户修复后再提交

### 4. 收集上下文

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

# 变更统计
FORK_POINT=$(git reflog --date=local | grep "checkout: moving from.* to $(git rev-parse --abbrev-ref HEAD)$" | head -1 | sed -n 's/.*from \([^ ]*\) to .*/\1/p' || echo main)
git diff "$FORK_POINT"..HEAD --stat
git diff "$FORK_POINT"..HEAD | head -300

# OpenSpec 上下文（兼容新旧两种分支名格式）
for dir in openspec/changes/*/ openspec/changes/*/*/; do
  if [ -f "$dir/proposal.md" ]; then
    head -5 "$dir/proposal.md"
  fi
done

# 变更涉及的 packages
git diff --name-only | grep -oP '^packages/[^/]+' | sort -u
```

### 5. 生成提交信息

**标题生成规则：**
- **提交类型前缀**：优先从 `$BRANCH_PREFIX` 中提取（如分支 `feat/add-user-auth` → 自动使用 `feat:`），无需手动选择
- **Fallback**：当分支名不含 `/`（$BRANCH_PREFIX 为空），回到手动选择模式，从 8 种前缀中选取
- 若无 OpenSpec，基于分支名或变更内容总结描述
- 如为问题修复，使用 `fix: 解决{问题描述}的问题` 格式
- **正例：** 分支 `feat/add-user-auth` → `feat: 实现用户认证`；分支不含前缀 → 手动选择 `chore:`、`refactor:` 等

**正文生成规则：**
- 涉及多 package 的变更，用要点列表区分
- 末尾添加 OpenSpec 引用：`Change: openspec/changes/<name>/`

### 6. 展示并确认

展示生成的完整提交信息，问用户确认：
- 「就这样提交」— 执行第 7 步
- 「用 --amend 合并到上次提交」— 执行第 7 步的 amend 模式
- 「修改一下」— 用户提供修改意见后重新生成

### 7. 执行提交

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

### 8. 推送（仅在用户明确要求时）

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
