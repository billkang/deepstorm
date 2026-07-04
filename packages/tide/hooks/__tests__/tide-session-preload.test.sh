#!/bin/bash
# tide-session-preload.test.sh
# 测试: tide-session-preload.sh 的 session 索引读取逻辑
#
# 用法: bash packages/tide/hooks/__tests__/tide-session-preload.test.sh

set -euo pipefail

PASS=0
FAIL=0
SCRIPT="$(dirname "$0")/../tide-session-preload.sh"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

assert_output_contains() {
  local desc="$1"
  local project_dir="$2"
  local expected="$3"
  local output
  output=$(CLAUDE_PROJECT_DIR="$project_dir" bash "$SCRIPT" 2>&1 || true)
  if echo "$output" | grep -qF "$expected"; then
    echo -e "${GREEN}✓${NC} $desc"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} $desc"
    echo "  expected: $expected"
    echo "  output: $output"
    FAIL=$((FAIL + 1))
  fi
}

assert_silent() {
  local desc="$1"
  local project_dir="$2"
  local output
  output=$(CLAUDE_PROJECT_DIR="$project_dir" bash "$SCRIPT" 2>&1 || true)
  if [ -z "$output" ]; then
    echo -e "${GREEN}✓${NC} $desc"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} $desc"
    echo "  output: $output"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== tide-session-preload Session 预加载测试 ==="
echo ""

BASE_TMP="${TMPDIR:-/tmp}"

# ── 无 index 文件：静默退出 ──
T="$(mktemp -d "$BASE_TMP/tide-test-XXXX")"
assert_silent "无 index 文件: 静默退出" "$T"
rm -rf "$T"

# ── 空 index（空数组） ──
T="$(mktemp -d "$BASE_TMP/tide-test-XXXX")"
mkdir -p "$T/tide-data/sessions"
echo '[]' > "$T/tide-data/sessions/.index.json"
assert_output_contains "空 index: 输出 TIDE_SESSIONS:0" "$T" "TIDE_SESSIONS:0"
rm -rf "$T"

# ── 单条 session ──
T="$(mktemp -d "$BASE_TMP/tide-test-XXXX")"
mkdir -p "$T/tide-data/sessions"
cat > "$T/tide-data/sessions/.index.json" <<'JSON'
[{"sessionId":"tide-20260624-001","status":"active","brief":"讨论用户注册功能","createdAt":"2026-06-24","featureId":"REEF-AUTH-REGISTER"}]
JSON
assert_output_contains "单条 session: 输出 TIDE_SESSIONS:1" "$T" "TIDE_SESSIONS:1"
assert_output_contains "单条 session: 包含 sessionId" "$T" "tide-20260624-001"
assert_output_contains "单条 session: 包含 brief" "$T" "讨论用户注册功能"
rm -rf "$T"

# ── 多条 session ──
T="$(mktemp -d "$BASE_TMP/tide-test-XXXX")"
mkdir -p "$T/tide-data/sessions"
cat > "$T/tide-data/sessions/.index.json" <<'JSON'
[
  {"sessionId":"tide-20260624-001","status":"active","brief":"讨论用户注册","createdAt":"2026-06-24","featureId":"REEF-AUTH-REGISTER"},
  {"sessionId":"tide-20260624-002","status":"archived","brief":"优化查询性能","createdAt":"2026-06-23","featureId":"REEF-QUERY-OPT"},
  {"sessionId":"tide-20260623-003","status":"active","brief":"修复登录bug","createdAt":"2026-06-22","featureId":"REEF-AUTH-LOGIN"}
]
JSON
assert_output_contains "多条 session: 输出 TIDE_SESSIONS:3" "$T" "TIDE_SESSIONS:3"
assert_output_contains "多条 session: 包含第一条" "$T" "tide-20260624-001"
assert_output_contains "多条 session: 包含第二条" "$T" "tide-20260624-002"
assert_output_contains "多条 session: 包含第三条" "$T" "tide-20260623-003"
rm -rf "$T"

# ── index 文件为无效 JSON ──
T="$(mktemp -d "$BASE_TMP/tide-test-XXXX")"
mkdir -p "$T/tide-data/sessions"
echo 'not-json' > "$T/tide-data/sessions/.index.json"
assert_silent "无效 JSON: jq 出错，静默退出" "$T"
rm -rf "$T"

echo ""
echo "=== 测试结果 ==="
echo -e "${GREEN}通过: $PASS${NC}"
echo -e "${RED}失败: $FAIL${NC}"
echo "总计: $((PASS + FAIL))"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
