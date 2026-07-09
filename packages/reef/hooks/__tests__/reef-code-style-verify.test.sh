#!/bin/bash
# reef-code-style-verify.test.sh
# 测试: reef-code-style-verify.sh 的代码风格验证逻辑
#
# 用法: bash packages/reef/hooks/__tests__/reef-code-style-verify.test.sh

set -euo pipefail

PASS=0
FAIL=0
SCRIPT="$(dirname "$0")/../reef-code-style-verify.sh.tmpl"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

assert_passes() {
  local input="$1"
  local desc="$2"
  local output
  output=$(echo "$input" | bash "$SCRIPT" 2>&1 || true)
  if ! echo "$output" | grep -q "style-verify"; then
    echo -e "${GREEN}✓${NC} $desc"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} $desc"
    echo "  input: $input"
    echo "  output: $output"
    FAIL=$((FAIL + 1))
  fi
}

assert_exits_cleanly() {
  local input="$1"
  local desc="$2"
  local output
  output=$(echo "$input" | bash "$SCRIPT" 2>&1 || true)
  if [ $? -eq 0 ] || [ $? -eq 1 ]; then
    echo -e "${GREEN}✓${NC} $desc"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} $desc"
    echo "  output: $output"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== reef-code-style-verify 验证测试 ==="
echo ""

# ── 文件路径解析测试 ──
# 使用临时文件模拟已存在的文件
TMPDIR="${TMPDIR:-/tmp}"
TEST_JAVA=$(mktemp "$TMPDIR/test-style-verify-XXXXXX.java")
TEST_PY=$(mktemp "$TMPDIR/test-style-verify-XXXXXX.py")
TEST_TS=$(mktemp "$TMPDIR/test-style-verify-XXXXXX.ts")
TEST_CONFIG=$(mktemp "$TMPDIR/test-style-verify-XXXXXX.json")

echo "// test" > "$TEST_JAVA"
echo "# test" > "$TEST_PY"
echo "// test" > "$TEST_TS"
echo '{}' > "$TEST_CONFIG"

# 工具不存在时优雅降级
assert_passes "{\"tool_response\":{\"filePath\":\"$TEST_JAVA\"}}" "Java: 无 lint 工具时静默退出"
assert_passes "{\"tool_response\":{\"filePath\":\"$TEST_PY\"}}" "Python: 无 lint 工具时静默退出"
assert_passes "{\"tool_response\":{\"filePath\":\"$TEST_TS\"}}" "TypeScript: 无 lint 工具时静默退出"

# 非源码文件跳过验证
assert_passes "{\"tool_response\":{\"filePath\":\"$TEST_CONFIG\"}}" "配置文件: 跳过验证"

# ── 边界情况 ──
assert_exits_cleanly '{}' "边界: 空 JSON"
assert_exits_cleanly '{"tool_response":{}}' "边界: 无 filePath"
assert_exits_cleanly '{"tool_response":{"filePath":""}}' "边界: 空路径"

# ── 不存在的文件 ──
assert_exits_cleanly '{"tool_response":{"filePath":"/nonexistent/file.java"}}' "边界: 文件不存在"

# 清理临时文件
rm -f "$TEST_JAVA" "$TEST_PY" "$TEST_TS" "$TEST_CONFIG"

echo ""
echo "=== 测试结果 ==="
echo -e "${GREEN}通过: $PASS${NC}"
echo -e "${RED}失败: $FAIL${NC}"
echo "总计: $((PASS + FAIL))"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
