#!/usr/bin/env bash

# ====================================================================
# DeepStorm CLI — 构建物 E2E 验证脚本
#
# 用法:
#   bash verify-cli.sh           # L0 冒烟（每次 build 后执行）
#   bash verify-cli.sh --full    # L0 + L1 全量（手动触发）
#
# 退出码:
#   0 = 全部通过
#   1 = 验证场景失败
#   2 = 前提检查失败（CLI_BIN 不存在、fixture 缺失等）
# ====================================================================

# 注意：不使用 set -e，因为 run_test 需要处理命令的失败退出

# ─── 可移植 timeout（macOS 默认无 GNU timeout） ─────────────────
if ! command -v timeout >/dev/null 2>&1; then
  if command -v gtimeout >/dev/null 2>&1; then
    alias timeout='gtimeout'
  else
    timeout() {
      local sec=$1; shift
      perl -e 'alarm shift; exec @ARGV' "$sec" "$@"
    }
  fi
fi

# ─── 路径推导 ──────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLAYGROUND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
MONOREPO_ROOT="$(cd "$PLAYGROUND_DIR/.." && pwd)"
CLI_BIN="$MONOREPO_ROOT/packages/cli/dist/cli.js"
SETTINGS_PATH="$PLAYGROUND_DIR/.claude/settings.json"
SETTINGS_BAK="$SETTINGS_PATH.verifybak"
FIXTURES_DIR="$PLAYGROUND_DIR/test-fixtures"

fail=0

# ─── run_test 函数 ─────────────────────────────────────────────
#   $1 = desc      场景描述
#   $2 = cmd       要执行的命令（含 env var + timeout + CLI 调用）
#   $3 = expect    预期内容（mode=expect_exit 时为预期退出码）
#   $4 = mode      expect_in（默认）| expect_not | expect_exit
# 全局变量: fail（1 = 有失败）
run_test() {
  local desc=$1 cmd=$2 expect=$3 mode=${4:-expect_in}

  printf "  %-55s" "$desc"

  local output rc
  output=$(eval "$cmd" 2>&1)
  rc=$?

  # timeout 退出码 124 = 超时
  if [ "$rc" = 124 ]; then
    echo "❌ (超时>30s)"; fail=1
    return
  fi

  case "$mode" in
    expect_exit)
      if [ "$rc" = "$expect" ]; then echo "✅"; else echo "❌ (exit:$rc, expect:$expect)"; fail=1; fi
      ;;
    expect_not)
      if echo "$output" | grep -q "$expect"; then
        echo "❌ (包含不应有内容: $expect)"; fail=1
      else
        echo "✅"
      fi
      ;;
    *)
      if echo "$output" | grep -q "$expect"; then
        if [ "$rc" != 0 ]; then
          echo "❌ (exit:$rc, expect:0)"; fail=1
        else
          echo "✅"
        fi
      else
        echo "❌ (期望:$expect)"; echo "$output" | head -10; fail=1
      fi
      ;;
  esac
}

# ─── 前提检查（文件存在性） ──────────────────────────────────
prerequisites() {
  echo "──── 前提检查 ────"

  printf "  %-55s" "CLI_BIN 文件存在"
  if [ -f "$CLI_BIN" ]; then echo "✅"; else echo "❌ ($CLI_BIN)"; exit 2; fi

  printf "  %-55s" "fixture 文件存在"
  if [ -f "$FIXTURES_DIR/deepstorm-version-current.json" ] && \
     [ -f "$FIXTURES_DIR/deepstorm-version-newer.json" ]; then
    echo "✅"
  else
    echo "❌"; exit 2
  fi
}

# ─── 配置保护 ──────────────────────────────────────────────
cleanup() {
  if [ -f "$SETTINGS_BAK" ]; then
    cp "$SETTINGS_BAK" "$SETTINGS_PATH"
    rm -f "$SETTINGS_BAK"
  fi
}
trap cleanup EXIT

backup_settings() {
  if [ -f "$SETTINGS_PATH" ]; then
    cp "$SETTINGS_PATH" "$SETTINGS_BAK"
  fi
}

# ══════════════════════════════════════════════════════════════════
# 主流程
# ══════════════════════════════════════════════════════════════════

MODE="${1:-l0}"

# 切换到 playground 目录，确保 CLI 能找到 .claude/settings.json
cd "$PLAYGROUND_DIR"

echo "DeepStorm CLI 构建物验证"
echo "  CLI:    $CLI_BIN"
echo "  Mode:   $([ "$MODE" = "--full" ] && echo 'L0 + L1 全量' || echo 'L0 冒烟')"
echo ""

# ─── 前提检查 ────────────────────────────────────────────────
prerequisites

# ─── CLI 入口冒烟 ─────────────────────────────────────────────
echo "──── CLI 入口冒烟 ────"
run_test "CLI --help (exit 0)" "timeout 30 node $CLI_BIN --help" "0" expect_exit
run_test "CLI --help (输出关键字)" "timeout 30 node $CLI_BIN --help" "DeepStorm"

# ─── 备份配置 ────────────────────────────────────────────────
backup_settings

# ─── L0 冒烟验证 ─────────────────────────────────────────────
echo "──── L0 冒烟验证 ────"

run_test "update 同步完成" \
  "DEEPSTORM_REGISTRY_URL=file://$FIXTURES_DIR/deepstorm-version-current.json timeout 30 node $CLI_BIN update" \
  "同步完成"

run_test "update 输出版本信息" \
  "DEEPSTORM_REGISTRY_URL=file://$FIXTURES_DIR/deepstorm-version-current.json timeout 30 node $CLI_BIN update" \
  "当前版本"

run_test "update 降级 (registry 不可达)" \
  "DEEPSTORM_REGISTRY_URL=http://localhost:1 timeout 30 node $CLI_BIN update" \
  "无法检查更新"

run_test "update 降级时仍同步模板" \
  "DEEPSTORM_REGISTRY_URL=http://localhost:1 timeout 30 node $CLI_BIN update" \
  "同步完成"

# ─── L1 全量验证（--full） ──────────────────────────────────
if [ "$MODE" = "--full" ]; then
  echo "──── L1 全量验证 ────"

  run_test "update 检测到更新" \
    "DEEPSTORM_REGISTRY_URL=file://$FIXTURES_DIR/deepstorm-version-newer.json DEEPSTORM_UPDATE_CMD='echo mock' timeout 30 node $CLI_BIN update" \
    "最新版本"

  run_test "update 自动更新中" \
    "DEEPSTORM_REGISTRY_URL=file://$FIXTURES_DIR/deepstorm-version-newer.json DEEPSTORM_UPDATE_CMD='echo mock' timeout 30 node $CLI_BIN update" \
    "正在自动更新"

  run_test "update 已更新完成" \
    "DEEPSTORM_REGISTRY_URL=file://$FIXTURES_DIR/deepstorm-version-newer.json DEEPSTORM_UPDATE_CMD='echo mock' timeout 30 node $CLI_BIN update" \
    "已更新"

  run_test "doctor 正常执行" \
    "timeout 30 node $CLI_BIN doctor" \
    "0" expect_exit

  run_test "doctor 输出版本信息" \
    "timeout 30 node $CLI_BIN doctor" \
    "CLI 版本"
fi

# ─── 汇总 ──────────────────────────────────────────────────────
echo ""
echo "──── 汇总 ────"
if [ "$fail" = 0 ]; then
  echo "✅ 全部验证通过"
  exit 0
else
  echo "❌ 存在失败"
  exit 1
fi
