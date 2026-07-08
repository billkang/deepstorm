#!/bin/bash
# deepstorm-intent-detect.sh
# UserPromptSubmit hook: 检测用户输入是否涉及 DeepStorm 自身代码修改，
# 自动提示使用 /deepstorm-discuss 流程
#
# 部署路径：.claude/hooks/deepstorm-intent-detect.sh
# 注册方式：通过 .claude/hooks.json 的 UserPromptSubmit 条目

set -euo pipefail

# ── 配置：开发意图关键词（修改 DeepStorm 自身） ────────────────────

DEEPSTORM_DEV_PATTERNS=(
  # 修改 DeepStorm 自身
  "修改.*deepstorm" "修改.*setup" "修改.*cli" "修改.*reef"
  "deepstorm.*改" "setup.*改" "cli.*改"
  "改.*deepstorm" "改.*setup流程" "改.*安装" "改.*构建"
  "deepstorm.*不工作" "deepstorm.*有问题" "deepstorm.*坏了"
  "deepstorm.*hook" "deepstorm.*hooks"

  # setup / 安装流程
  "deepstorm setup" "deepstorm update" "deepstorm upgrade"
  "setup流程" "安装流程" "更新流程"
  "deepstorm.*setup" "deepstorm.*update"
  "hook.*不生效" "hook.*路径"

  # 包级修改
  "改.*packages" "改.*cli" "改.*reef" "改.*tide" "改.*sweep" "改.*atoll"
  "修.*packages" "修.*cli" "修.*reef" "修.*tide" "修.*sweep" "修.*atoll"
  "packages.*hooks" "packages.*wizard"

  # 构建/发布
  "deepstorm.*构建" "deepstorm.*发布" "deepstorm.*打包"
  "pnpm build" "构建流程" "发布流程"

  # 模板/配置
  "hooks\.json" "settings\.json" "CLAUDE\.md"
  "修改.*模板" "更新.*模板" "模板.*改"
)

# 排除规则（纯查询不触发）
EXCLUDE_PATTERNS=(
  "^/" "^!"
  "查一下" "看看" "读一下"
  "怎么用" "是什么意思" "怎么配置"
)

# ── 主逻辑 ────────────────────────────────────────────────────────

MESSAGE="${CLAUDE_INPUT:-}"
[ -z "$MESSAGE" ] && exit 0

# 检查排除规则
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
  if echo "$MESSAGE" | grep -qiE "$pattern"; then
    exit 0
  fi
done

# 匹配 DeepStorm 开发意图
for pattern in "${DEEPSTORM_DEV_PATTERNS[@]}"; do
  if echo "$MESSAGE" | grep -qiE "$pattern"; then
    cat <<'HOOKEOF'
<system-reminder>
The user's message indicates intent to modify DeepStorm's own code.
IMPORTANT: Before writing any code, you MUST first go through /deepstorm-discuss to discuss the approach.
This is a hard requirement for ALL DeepStorm code changes.
Only skip if already in an active deepstorm-discuss workflow.
</system-reminder>
HOOKEOF
    exit 0
  fi
done

exit 0
