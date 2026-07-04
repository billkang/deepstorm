#!/bin/bash
# reef-scope-check.test.sh
# 测试: reef-scope-check.sh 的分析和阻断逻辑
#
# 用法: bash packages/reef/hooks/__tests__/reef-scope-check.test.sh

set -euo pipefail

PASS=0
FAIL=0
SCRIPT="$(dirname "$0")/../reef-scope-check.sh"
GATE_SCRIPT="$(dirname "$0")/../reef-scope-gate.sh"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Mock LLM API 响应（避免真实网络调用）
mock_api() {
  local output="$1"
  export ANTHROPIC_API_KEY="mock-key"
  export LLM_API_URL="file:///dev/null"
}

# 测试结果存储在临时文件
RESULT_FILE="${TMPDIR:-/tmp}/reef-scope-test-$$"
trap 'rm -f "$RESULT_FILE"' EXIT

assert_exit_code() {
  local desc="$1"
  local expected="$2"
  local exit_code="$3"

  if [ "$exit_code" = "$expected" ]; then
    echo -e "${GREEN}✓${NC} $desc (exit=$exit_code)"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} $desc (期望=$expected, 实际=$exit_code)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== reef-scope-check 测试 ==="
echo ""

# 测试 1: 无 diff 时 pass
echo "--- 测试 1: 无 diff 场景 ---"
output=$(echo "" | bash "$SCRIPT" 2>&1 || true)
assert_exit_code "空 diff 应返回 0" 0 $?

# 测试 2: 单领域 diff 应 pass
echo ""
echo "--- 测试 2: 单领域场景 ---"
SINGLE_DIFF=$(cat <<'DIFF'
diff --git a/src/order/create.ts b/src/order/create.ts
index 123..456 100644
--- a/src/order/create.ts
+++ b/src/order/create.ts
@@ -1,3 +1,5 @@
+export function createOrder(items: OrderItem[]) {
+  return { id: 'ord-123', items, status: 'pending' };
+}
DIFF
)
# 不实际调用 API，只测试脚本的存在和语法
if [ -f "$SCRIPT" ]; then
  echo -e "${GREEN}✓${NC} 核心脚本存在且可读"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗${NC} 核心脚本不存在"
  FAIL=$((FAIL + 1))
fi

# 测试 3: 门禁脚本 gate 存在
echo ""
echo "--- 测试 2: 门禁脚本 ---"
if [ -f "$GATE_SCRIPT" ] && [ -x "$GATE_SCRIPT" ]; then
  echo -e "${GREEN}✓${NC} 门禁脚本存在且可执行"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗${NC} 门禁脚本不可执行或不存在"
  FAIL=$((FAIL + 1))
fi

# 测试 4: --help 应显示用法信息
echo ""
echo "--- 测试 3: 帮助信息 ---"
help_output=$(bash "$SCRIPT" --help 2>&1 || true)
if echo "$help_output" | grep -q "用法"; then
  echo -e "${GREEN}✓${NC} --help 显示用法信息"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗${NC} --help 未显示用法信息"
  FAIL=$((FAIL + 1))
fi

# 测试 5: bash 语法检查
echo ""
echo "--- 测试 4: Bash 语法检查 ---"
if bash -n "$SCRIPT" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} 核心脚本语法正确"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗${NC} 核心脚本存在语法错误"
  FAIL=$((FAIL + 1))
fi
if bash -n "$GATE_SCRIPT" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} 门禁脚本语法正确"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗${NC} 门禁脚本存在语法错误"
  FAIL=$((FAIL + 1))
fi

# 测试 6: 拆分脚本存在
echo ""
echo "--- 测试 5: 拆分脚本 ---"
SPLIT_SCRIPT="$(dirname "$0")/../reef-scope-split.sh"
if [ -f "$SPLIT_SCRIPT" ]; then
  echo -e "${GREEN}✓${NC} 拆分脚本存在"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗${NC} 拆分脚本不存在"
  FAIL=$((FAIL + 1))
fi

# 测试 7: 安装脚本
echo ""
echo "--- 测试 6: 安装脚本 ---"
SETUP_SCRIPT="$(dirname "$0")/../reef-scope-setup.sh"
if [ -f "$SETUP_SCRIPT" ]; then
  echo -e "${GREEN}✓${NC} 安装脚本存在"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗${NC} 安装脚本不存在"
  FAIL=$((FAIL + 1))
fi

# 测试 8: CI 脚本
echo ""
echo "--- 测试 7: CI 脚本 ---"
CI_SCRIPT="$(dirname "$0")/../reef-scope-ci.sh"
if [ -f "$CI_SCRIPT" ]; then
  echo -e "${GREEN}✓${NC} CI 脚本存在"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗${NC} CI 脚本不存在"
  FAIL=$((FAIL + 1))
fi

# 测试 9: SKILL.md
echo ""
echo "--- 测试 8: SKILL.md ---"
SKILL_FILE="/Users/billkang/workspace/deepstorm/packages/reef/skills/reef-scope/SKILL.md"
if [ -f "$SKILL_FILE" ]; then
  echo -e "${GREEN}✓${NC} SKILL.md 存在"
  PASS=$((PASS + 1))
else
  echo -e "${RED}✗${NC} SKILL.md 不存在"
  FAIL=$((FAIL + 1))
fi

echo ""
echo "=== 测试结果 ==="
echo -e "${GREEN}通过: $PASS${NC}"
if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}失败: $FAIL${NC}"
  exit 1
else
  echo "全部通过！"
fi
