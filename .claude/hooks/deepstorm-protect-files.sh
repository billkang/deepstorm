#!/bin/bash
# deepstorm-protect-files.sh
# PreToolUse: 保护 DeepStorm 关键文件不被随意修改
#
# 部署路径：.claude/hooks/deepstorm-protect-files.sh

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""') || exit 0

[ -z "$FILE_PATH" ] && exit 0

FILENAME=$(basename "$FILE_PATH")
DIRNAME=$(dirname "$FILE_PATH")

# ── 绝对禁止修改的文件 ──────────────────────────────────────────────
PROTECTED_FILES=(
  ".env"
  "package-lock.json"
  "yarn.lock"
  "pnpm-lock.yaml"
)

for pattern in "${PROTECTED_FILES[@]}"; do
  if [[ "$FILENAME" == "$pattern" ]]; then
    cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Cannot modify protected file: $pattern"
  }
}
EOF
    exit 0
  fi
done

# ── 受保护目录（禁止直接修改内部文件） ──────────────────────────
PROTECTED_DIRS=(
  ".git/"
  "node_modules/"
  "dist/"
)

for dir in "${PROTECTED_DIRS[@]}"; do
  if [[ "$FILE_PATH" == *"$dir"* ]]; then
    cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "Cannot modify files in protected directory: $dir"
  }
}
EOF
    exit 0
  fi
done

# ── DeepStorm 关键配置文件（需谨慎修改） ─────────────────────────
# 这些文件修改需要告警但不由 hook 绝对禁止
DEEPSTORM_CRITICAL_FILES=(
  "CLAUDE.md"
  "registry.json"
  "wizard.json"
)

for pattern in "${DEEPSTORM_CRITICAL_FILES[@]}"; do
  if [[ "$FILENAME" == "$pattern" ]]; then
    cat >&2 <<EOF
[deepstorm-protect-files] ⚠ WARNING: You are modifying $FILENAME
[deepstorm-protect-files] This is a DeepStorm critical configuration file.
[deepstorm-protect-files] Ensure you have discussed this change via /deepstorm-discuss.
EOF
    exit 0
  fi
done

# 默认放行
exit 0
