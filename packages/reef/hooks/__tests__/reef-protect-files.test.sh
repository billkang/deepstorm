#!/bin/bash
# reef-protect-files.test.sh
# 测试: reef-protect-files.sh 的文件保护逻辑
#
# 用法: bash packages/reef/hooks/__tests__/reef-protect-files.test.sh

set -euo pipefail

PASS=0
FAIL=0
SCRIPT="$(dirname "$0")/../reef-protect-files.sh"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

assert_blocked() {
  local input="$1"
  local desc="$2"
  local output
  output=$(echo "$input" | bash "$SCRIPT" 2>&1 || true)
  if echo "$output" | grep -q "deny"; then
    echo -e "${GREEN}✓${NC} $desc"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} $desc"
    echo "  input: $input"
    echo "  output: $output"
    FAIL=$((FAIL + 1))
  fi
}

assert_allowed() {
  local input="$1"
  local desc="$2"
  local output
  output=$(echo "$input" | bash "$SCRIPT" 2>&1 || true)
  if [ -z "$output" ]; then
    echo -e "${GREEN}✓${NC} $desc"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} $desc"
    echo "  input: $input"
    echo "  output: $output"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== reef-protect-files 文件保护测试 ==="
echo ""

# ── 保护文件拦截 ──
assert_blocked '{"tool_input":{"file_path":".env"}}' ".env"
assert_blocked '{"tool_input":{"file_path":"config/.env"}}' "config/.env"
assert_allowed '{"tool_input":{"file_path":"/project/.env.production"}}' ".env.production（basename 精确匹配，不拦截）"
assert_blocked '{"tool_input":{"file_path":"package-lock.json"}}' "package-lock.json"
assert_blocked '{"tool_input":{"file_path":"frontend/yarn.lock"}}' "yarn.lock"
assert_blocked '{"tool_input":{"file_path":"backend/pnpm-lock.yaml"}}' "pnpm-lock.yaml"

# ── 保护目录拦截 ──
assert_blocked '{"tool_input":{"file_path":".git/config"}}' ".git/config"
assert_blocked '{"tool_input":{"file_path":".git/HEAD"}}' ".git/HEAD"
assert_blocked '{"tool_input":{"file_path":"node_modules/express/index.js"}}' "node_modules/express"
assert_blocked '{"tool_input":{"file_path":".git/objects/pack/pack-123.idx"}}' ".git/objects/pack"

# ── 正常文件放行 ──
assert_allowed '{"tool_input":{"file_path":"src/main.ts"}}' "src/main.ts"
assert_allowed '{"tool_input":{"file_path":"src/App.vue"}}' "src/App.vue"
assert_allowed '{"tool_input":{"file_path":"README.md"}}' "README.md"
assert_allowed '{"tool_input":{"file_path":"package.json"}}' "package.json"
assert_allowed '{"tool_input":{"file_path":".claude/settings.json"}}' ".claude/settings.json"
assert_allowed '{"tool_input":{"file_path":"src/utils/helpers.ts"}}' "src/utils/helpers.ts"

# ── 边界情况 ──
assert_allowed '{}' "边界: 空 JSON"
assert_allowed '{"tool_input":{}}' "边界: 无文件路径"
assert_allowed '{"tool_input":{"file_path":""}}' "边界: 空路径"

echo ""
echo "=== 测试结果 ==="
echo -e "${GREEN}通过: $PASS${NC}"
echo -e "${RED}失败: $FAIL${NC}"
echo "总计: $((PASS + FAIL))"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
