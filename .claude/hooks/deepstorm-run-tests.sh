#!/bin/bash
# deepstorm-run-tests.sh
# PostToolUse / Stop hook: 编辑 DeepStorm 代码后运行测试
# 超时后放行，不会阻塞流程
#
# 部署路径：.claude/hooks/deepstorm-run-tests.sh

set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" 2>/dev/null || exit 0

TIMEOUT=30
TIMEOUT_CMD=""

if command -v gtimeout &>/dev/null; then
  TIMEOUT_CMD="gtimeout $TIMEOUT"
elif command -v timeout &>/dev/null; then
  TIMEOUT_CMD="timeout $TIMEOUT"
fi

# 检测修改的文件路径（PostToolUse 模式）
FILE_PATH=""
if [ -p /dev/stdin ] && command -v jq &>/dev/null; then
  FILE_PATH=$(jq -r '.tool_response.filePath // .tool_input.file_path // ""' 2>/dev/null || true)
fi
[ -z "$FILE_PATH" ] && FILE_PATH="${CLAUDE_CODE_TOOL_RESULT_FILEPATH:-}"

# 如果能确定是哪个包，只跑该包的测试
PACKAGE_FILTER=""
if [ -n "$FILE_PATH" ]; then
  case "$FILE_PATH" in
    *"/packages/cli/"*)
      PACKAGE_FILTER="--filter @deepstorm/cli"
      ;;
    *"/packages/reef/"*)
      PACKAGE_FILTER="--filter @deepstorm/reef"
      ;;
    *"/packages/sweep/"*)
      PACKAGE_FILTER="--filter @deepstorm/sweep"
      ;;
    *"/packages/atoll/"*)
      PACKAGE_FILTER="--filter @deepstorm/atoll"
      ;;
    *"/packages/tide/"*)
      PACKAGE_FILTER="--filter @deepstorm/tide"
      ;;
  esac
fi

if [ -n "$PACKAGE_FILTER" ]; then
  echo "[deepstorm-run-tests] Running tests for $PACKAGE_FILTER (timeout ${TIMEOUT}s)..." >&2
  if [ -n "$TIMEOUT_CMD" ]; then
    if $TIMEOUT_CMD pnpm --filter "$PACKAGE_FILTER" test 2>&1; then
      echo "[deepstorm-run-tests] ✅ Tests passed." >&2
    else
      rc=$?
      if [ $rc -eq 124 ]; then
        echo "[deepstorm-run-tests] ⏱ Tests timed out after ${TIMEOUT}s, continuing..." >&2
      else
        echo "[deepstorm-run-tests] ❌ Tests FAILED." >&2
      fi
    fi
  else
    pnpm --filter "$PACKAGE_FILTER" test 2>&1 && echo "[deepstorm-run-tests] ✅ Tests passed." >&2 || echo "[deepstorm-run-tests] ❌ Tests FAILED." >&2
  fi
else
  # 无法确定包范围，只跑 CLI 包测试（最可能受影响的）
  if [ -f "packages/cli/package.json" ]; then
    echo "[deepstorm-run-tests] Running CLI tests (timeout ${TIMEOUT}s)..." >&2
    cd packages/cli
    if [ -n "$TIMEOUT_CMD" ]; then
      if $TIMEOUT_CMD npx vitest run --reporter=verbose 2>&1; then
        echo "[deepstorm-run-tests] ✅ CLI tests passed." >&2
      else
        rc=$?
        if [ $rc -eq 124 ]; then
          echo "[deepstorm-run-tests] ⏱ CLI tests timed out, continuing..." >&2
        else
          echo "[deepstorm-run-tests] ❌ CLI tests FAILED." >&2
        fi
      fi
    else
      npx vitest run --reporter=verbose 2>&1 && echo "[deepstorm-run-tests] ✅ CLI tests passed." >&2 || echo "[deepstorm-run-tests] ❌ CLI tests FAILED." >&2
    fi
    cd "$PROJECT_DIR"
  fi
fi

# Stop hook: 如果测试失败，提示阻止退出
if [ -n "${CLAUDE_HOOK_EVENT:-}" ] && [ "$CLAUDE_HOOK_EVENT" = "Stop" ]; then
  cat <<'EOF'
{
  "decision": "approve",
  "reason": "Continuing with current test status.",
  "continue": true
}
EOF
fi

exit 0
