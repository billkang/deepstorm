#!/bin/bash
# sweep-mcp-hook.test.sh
# 测试: sweep-mcp-hook.sh 的 MCP 进程管理逻辑
#
# 用法: bash packages/sweep/hooks/__tests__/sweep-mcp-hook.test.sh

set -euo pipefail

PASS=0
FAIL=0
SCRIPT="$(dirname "$0")/../sweep-mcp-hook.sh"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

assert_output_contains() {
  local desc="$1"
  local expected="$2"
  shift 2
  local output
  output=$(CLAUDE_PROJECT_DIR=/dev/null bash "$SCRIPT" "$@" 2>&1 || true)
  if echo "$output" | grep -qF "$expected"; then
    echo -e "${GREEN}✓${NC} $desc"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} $desc"
    echo "  args: $*"
    echo "  expected: $expected"
    echo "  output: $output"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== sweep-mcp-hook MCP 进程管理测试 ==="
echo ""

BASE_TMP="${TMPDIR:-/tmp}"

# ── --stop 无进程 ──
T="$(mktemp -d "$BASE_TMP/sweep-test-XXXX")"
cat > "$T/lsof" <<'MOCK'
#!/bin/bash
# 无进程在监听端口
exit 1
MOCK
chmod +x "$T/lsof"
export PATH="$T:$PATH"
assert_output_contains "--stop: 无进程" "not running" "--stop"
rm -rf "$T"

# ── --status 无进程 ──
T="$(mktemp -d "$BASE_TMP/sweep-test-XXXX")"
cat > "$T/lsof" <<'MOCK'
#!/bin/bash
exit 1
MOCK
chmod +x "$T/lsof"
export PATH="$T:$PATH"
assert_output_contains "--status: 无进程" "not running" "--status"
rm -rf "$T"

# ── --stop 有进程 ──
T="$(mktemp -d "$BASE_TMP/sweep-test-XXXX")"
cat > "$T/lsof" <<'MOCK'
#!/bin/bash
echo "12345"
exit 0
MOCK
chmod +x "$T/lsof"
export PATH="$T:$PATH"
assert_output_contains "--stop: 有进程" "stopped" "--stop"
rm -rf "$T"

# ── --status 有进程（headless） ──
T="$(mktemp -d "$BASE_TMP/sweep-test-XXXX")"
cat > "$T/lsof" <<'MOCK'
#!/bin/bash
echo "12345"
MOCK
chmod +x "$T/lsof"
cat > "$T/ps" <<'MOCK'
#!/bin/bash
# ps -p 12345 -o args= → return --headless
if [[ "$*" == *"12345"* ]]; then
  echo "/path/to/node /path/to/playwright-mcp --headless --port 54321"
fi
MOCK
chmod +x "$T/ps"
export PATH="$T:$PATH"
assert_output_contains "--status: headless 运行中" "headless" "--status"
rm -rf "$T"

# ── --status 有进程（headed） ──
T="$(mktemp -d "$BASE_TMP/sweep-test-XXXX")"
cat > "$T/lsof" <<'MOCK'
#!/bin/bash
echo "12345"
MOCK
chmod +x "$T/lsof"
cat > "$T/ps" <<'MOCK'
#!/bin/bash
if [[ "$*" == *"12345"* ]]; then
  echo "/path/to/node /path/to/playwright-mcp --port 54321"
fi
MOCK
chmod +x "$T/ps"
export PATH="$T:$PATH"
assert_output_contains "--status: headed 运行中" "headed" "--status"
rm -rf "$T"

# ── 默认启动（无 lsof 命令，回退到无进程） ──
T="$(mktemp -d "$BASE_TMP/sweep-test-XXXX")"
# 不做 lsof mock，让 lsof 自然找不到进程
# 用 mock 的 node_modules/.bin/playwright-mcp 来验证启动流程
mkdir -p "$T/node_modules/.bin"
cat > "$T/node_modules/.bin/playwright-mcp" <<'MOCK'
#!/bin/bash
# 模拟 playwright-mcp 启动
echo "Playwright MCP running on port 54321"
sleep 30
MOCK
chmod +x "$T/node_modules/.bin/playwright-mcp"
cat > "$T/lsof" <<'MOCK'
#!/bin/bash
# 第一次调用（检查是否在运行）→ 无进程
# sleep 后的第二次调用来检查新进程
# mock 为有进程
echo "67890"
exit 0
MOCK
chmod +x "$T/lsof"
export PATH="$T:$PATH"
assert_output_contains "默认启动: 启动成功" "started" ""
rm -rf "$T"

# ── 默认启动（已有相同模式进程）──
T="$(mktemp -d "$BASE_TMP/sweep-test-XXXX")"
cat > "$T/lsof" <<'MOCK'
#!/bin/bash
echo "12345"
MOCK
chmod +x "$T/lsof"
cat > "$T/ps" <<'MOCK'
#!/bin/bash
if [[ "$*" == *"12345"* ]]; then
  echo "/path/to/node /path/to/playwright-mcp --headless --port 54321"
fi
MOCK
chmod +x "$T/ps"
export PATH="$T:$PATH"
assert_output_contains "已有 headless 进程: 跳过" "already running" ""
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
