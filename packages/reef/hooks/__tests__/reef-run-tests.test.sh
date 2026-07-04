#!/bin/bash
# reef-run-tests.test.sh
# 测试: reef-run-tests.sh 的测试运行逻辑
#
# 用法: bash packages/reef/hooks/__tests__/reef-run-tests.test.sh

set -euo pipefail

PASS=0
FAIL=0
SCRIPT="$(dirname "$0")/../reef-run-tests.sh"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

assert_pass() {
  local desc="$1"
  local tmpdir="$2"
  local output
  output=$(CLAUDE_PROJECT_DIR="$tmpdir" bash "$SCRIPT" 2>&1 || true)
  if echo "$output" | grep -q "approve"; then
    echo -e "${GREEN}✓${NC} $desc"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} $desc"
    echo "  output: $output"
    FAIL=$((FAIL + 1))
  fi
}

assert_block() {
  local desc="$1"
  local tmpdir="$2"
  local output
  output=$(CLAUDE_PROJECT_DIR="$tmpdir" bash "$SCRIPT" 2>&1 || true)
  if echo "$output" | grep -q "block"; then
    echo -e "${GREEN}✓${NC} $desc"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} $desc"
    echo "  output: $output"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== reef-run-tests 测试运行测试 ==="
echo ""

BASE_TMP="$TMPDIR"

# ── 无项目文件：无测试可跑，直接通过 ──
T="$(mktemp -d "$BASE_TMP/reef-test-XXXX")"
assert_pass "无项目文件: 直接通过" "$T"
rm -rf "$T"

# ── 前端测试通过 ──
T="$(mktemp -d "$BASE_TMP/reef-test-XXXX")"
touch "$T/package.json"
cat > "$T/pnpm" <<'MOCK'
#!/bin/bash
echo "Tests running..."
exit 0
MOCK
chmod +x "$T/pnpm"
export PATH="$T:$PATH"
assert_pass "前端测试: pnpm test 通过" "$T"
rm -rf "$T"

# ── 前端测试失败 ──
T="$(mktemp -d "$BASE_TMP/reef-test-XXXX")"
touch "$T/package.json"
cat > "$T/pnpm" <<'MOCK'
#!/bin/bash
echo "Tests running..."
exit 1
MOCK
chmod +x "$T/pnpm"
export PATH="$T:$PATH"
assert_block "前端测试: pnpm test 失败" "$T"
rm -rf "$T"

# ── 后端测试通过（build.gradle.kts） ──
T="$(mktemp -d "$BASE_TMP/reef-test-XXXX")"
touch "$T/build.gradle.kts"
cat > "$T/gradlew" <<'MOCK'
#!/bin/bash
echo "Tests running..."
exit 0
MOCK
chmod +x "$T/gradlew"
export PATH="$T:$PATH"
assert_pass "后端测试: build.gradle.kts 通过" "$T"
rm -rf "$T"

# ── 后端测试通过（build.gradle） ──
T="$(mktemp -d "$BASE_TMP/reef-test-XXXX")"
touch "$T/build.gradle"
cat > "$T/gradlew" <<'MOCK'
#!/bin/bash
echo "Tests running..."
exit 0
MOCK
chmod +x "$T/gradlew"
export PATH="$T:$PATH"
assert_pass "后端测试: build.gradle 通过" "$T"
rm -rf "$T"

# ── 后端测试失败 ──
T="$(mktemp -d "$BASE_TMP/reef-test-XXXX")"
touch "$T/build.gradle"
cat > "$T/gradlew" <<'MOCK'
#!/bin/bash
echo "Tests running..."
exit 1
MOCK
chmod +x "$T/gradlew"
export PATH="$T:$PATH"
assert_block "后端测试: gradlew test 失败" "$T"
rm -rf "$T"

# ── 前后端同时通过 ──
T="$(mktemp -d "$BASE_TMP/reef-test-XXXX")"
touch "$T/package.json"
cat > "$T/pnpm" <<'MOCK'
#!/bin/bash
echo "Tests running..."
exit 0
MOCK
chmod +x "$T/pnpm"
touch "$T/build.gradle.kts"
cat > "$T/gradlew" <<'MOCK'
#!/bin/bash
echo "Tests running..."
exit 0
MOCK
chmod +x "$T/gradlew"
export PATH="$T:$PATH"
assert_pass "前后端测试: 全部通过" "$T"
rm -rf "$T"

# ── 前端通过+后端失败 ──
T="$(mktemp -d "$BASE_TMP/reef-test-XXXX")"
touch "$T/package.json"
cat > "$T/pnpm" <<'MOCK'
#!/bin/bash
echo "Tests running..."
exit 0
MOCK
chmod +x "$T/pnpm"
touch "$T/build.gradle"
cat > "$T/gradlew" <<'MOCK'
#!/bin/bash
echo "Tests running..."
exit 1
MOCK
chmod +x "$T/gradlew"
export PATH="$T:$PATH"
assert_block "前后端测试: 后端失败" "$T"
rm -rf "$T"

# ── 超时场景：gtimeout 模拟超时 ──
T="$(mktemp -d "$BASE_TMP/reef-test-XXXX")"
# 创建一个 gtimeout mock 让 pnpm test 超时
cat > "$T/gtimeout" <<'MOCK'
#!/bin/bash
TIMEOUT="$1"
shift
# pnpm test 模拟超时
if [[ "$*" == *"pnpm"* ]]; then
  echo "[gtimeout] Timed out after ${TIMEOUT}s" >&2
  exit 124
fi
# gradlew 正常通过
exec "$@"
MOCK
chmod +x "$T/gtimeout"
touch "$T/package.json"
touch "$T/build.gradle.kts"
cat > "$T/gradlew" <<'MOCK'
#!/bin/bash
echo "Tests running..."
exit 0
MOCK
chmod +x "$T/gradlew"
export PATH="$T:$PATH"
assert_pass "前端超时+后端通过: 不阻断" "$T"
rm -rf "$T"

# ── 无 timeout 命令（回退模式） ──
T="$(mktemp -d "$BASE_TMP/reef-test-XXXX")"
touch "$T/package.json"
cat > "$T/pnpm" <<'MOCK'
#!/bin/bash
echo "Tests running..."
exit 0
MOCK
chmod +x "$T/pnpm"
# PATH 中只有 mock pnpm，没有 gtimeout/timeout
export PATH="$T:$PATH"
assert_pass "无 timeout 命令: 直接运行测试" "$T"
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
