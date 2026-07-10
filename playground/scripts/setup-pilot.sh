#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_common.sh"

echo "============================================"
echo "  Pilot — OpenSpec 自动实现 Harness Agent"
echo "  测试项目初始化"
echo "============================================"
echo ""

check_cli

# ─── 创建 pilot 测试任务 ───────────────────────────
PILOT_DIR="$PLAYGROUND_DIR/pilot-test"
rm -rf "$PILOT_DIR"
mkdir -p "$PILOT_DIR/.deepstorm"

cat > "$PILOT_DIR/tasks.md" << 'TASKS'
## 1. 基础文件操作

- [ ] 1.1 创建一个 README.md 文件，内容为 "# Pilot Playground Test\n\nThis is an E2E test for DeepStorm Pilot."
- [ ] 1.2 创建一个 src/ 目录和一个 src/index.js 文件，内容为 "console.log('pilot test passed');"

## 2. 文件修改

- [ ] 2.1 在 README.md 末尾追加一行 "## Status\n\nTest completed."
- [ ] 2.2 在 src/ 下创建一个 utils/ 目录

## 3. 清理

- [ ] 3.1 创建一个 .gitignore 文件，忽略 node_modules/
- [ ] 3.2 输出 "All pilot E2E tests passed"
TASKS

echo "✅ 测试项目创建: $PILOT_DIR"
echo "   任务数: $(grep -c '\[ \]' "$PILOT_DIR/tasks.md")"
echo ""

# ─── 创建 pilot 配置文件 ──────────────────────────
cat > "$PILOT_DIR/pilot.config.json" << 'CONFIG'
{
  "defaultTokenBudget": 50000,
  "taskTimeoutMs": 60000,
  "silenceThresholdMs": 30000,
  "maxRetries": 1,
  "heartbeatIntervalMs": 15000
}
CONFIG

echo "✅ pilot.config.json 已创建"
echo ""

# ─── 输出指引 ─────────────────────────────────────
echo "============================================"
echo "✅ Pilot 测试就绪！"
echo ""
echo "前台运行（实时看日志）："
echo "  node $CLI_JS pilot run --project $PILOT_DIR"
echo ""
echo "后台运行："
echo "  node $CLI_JS pilot run --detach --project $PILOT_DIR"
echo ""
echo "查看状态："
echo "  node $CLI_JS pilot status --project $PILOT_DIR"
echo ""
echo "查看日志："
echo "  node $CLI_JS pilot log --project $PILOT_DIR"
echo ""
echo "停止："
echo "  node $CLI_JS pilot stop --project $PILOT_DIR"
echo "============================================"
