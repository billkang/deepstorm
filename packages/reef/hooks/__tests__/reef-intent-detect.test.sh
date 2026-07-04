#!/bin/bash
# reef-intent-detect.test.sh
# 测试: reef-intent-detect.sh 的匹配逻辑
#
# 用法: bash packages/reef/hooks/__tests__/reef-intent-detect.test.sh

set -euo pipefail

PASS=0
FAIL=0
SCRIPT="$(dirname "$0")/../reef-intent-detect.sh"

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

assert_trigger() {
  local input="$1"
  local desc="$2"
  local output
  output=$(CLAUDE_INPUT="$input" bash "$SCRIPT" 2>&1 || true)
  if echo "$output" | grep -q "reef-start"; then
    echo -e "${GREEN}✓${NC} $desc"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} $desc (输入: '$input')"
    echo "  output: $output"
    FAIL=$((FAIL + 1))
  fi
}

assert_silent() {
  local input="$1"
  local desc="$2"
  local output
  output=$(CLAUDE_INPUT="$input" bash "$SCRIPT" 2>&1 || true)
  if [ -z "$output" ]; then
    echo -e "${GREEN}✓${NC} $desc"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} $desc (输入: '$input')"
    echo "  output: $output"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== reef-intent-detect 匹配测试 ==="
echo ""

# ── 中文新增功能 ──
assert_trigger "我想加一个用户注册功能" "中文: 我想加"
assert_trigger "帮我做个登录页面" "中文: 帮我做个"
assert_trigger "加个搜索功能" "中文: 加个"
assert_trigger "实现一下数据导出" "中文: 实现一下"
assert_trigger "新增一个报表模块" "中文: 新增一个"
assert_trigger "写个批量导入功能" "中文: 写个"

# ── 中文 Bug 修复 ──
assert_trigger "修复登录失败的问题" "中文: 修复"
assert_trigger "这个按钮点不了，修一下" "中文: 修一下"
assert_trigger "数据返回不对" "中文: 返回不对"
assert_trigger "接口报错了" "中文: 报错"
assert_trigger "有个bug需要处理" "中文: bug"

# ── 中文重构/优化 ──
assert_trigger "重构用户模块的代码" "中文: 重构"
assert_trigger "优化一下查询性能" "中文: 优化"
assert_trigger "把公共逻辑提取出来" "中文: 提取"

# ── 中文代码修改 ──
assert_trigger "把这个接口改成 RESTful" "中文: 把这个"
assert_trigger "改一下这个页面的样式" "中文: 改一下"
assert_trigger "改成使用新的API" "中文: 改成"

# ── 英文新增功能 ──
assert_trigger "I need to add a user login feature" "英文: add a"
assert_trigger "implement file upload" "英文: implement"
assert_trigger "build a dashboard component" "英文: build a"
assert_trigger "create a new API endpoint" "英文: create a"

# ── 英文 Bug 修复 ──
assert_trigger "fix the login validation" "英文: fix"
assert_trigger "the API is broken" "英文: broken"
assert_trigger "search is not working" "英文: not working"
assert_trigger "fix this bug in production" "英文: bug"

# ── 英文重构 ──
assert_trigger "refactor the user module" "英文: refactor"
assert_trigger "rewrite the legacy code" "英文: rewrite"
assert_trigger "optimize the database queries" "英文: optimize"

# ── Issue 引用 ──
assert_trigger "处理一下 LC-1234 这个任务" "Issue编号: LC-1234"
assert_trigger "PROJ-456 需要改一下" "Issue编号: PROJ-456"

# ── 非开发意图（应静默） ──
assert_silent "今天天气不错" "排除: 天气聊天"
assert_silent "查一下文档" "排除: 查一下"
assert_silent "怎么看当前的版本号" "排除: 怎么看"
assert_silent "hello world" "排除: 纯英文聊天"
assert_silent "npm install 报错了，帮忙看看" "排除: 命令报错（非代码修改）"
assert_silent "" "排除: 空输入"

# ── 已有 slash 命令（应静默） ──
assert_silent "/opsx:explore" "排除: /opsx: 命令"
assert_silent "/review" "排除: /review 命令"
assert_silent "/reef-commit" "排除: /reef- 命令"

echo ""
echo "=== 测试结果 ==="
echo -e "${GREEN}通过: $PASS${NC}"
echo -e "${RED}失败: $FAIL${NC}"
echo "总计: $((PASS + FAIL))"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
