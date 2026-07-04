#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_common.sh"

echo "============================================"
echo "  Sweep — 测试侧工具安装"
echo "============================================"
echo ""

check_cli

E2E_DIR="$PLAYGROUND_DIR/e2e"

# 直接安装到 e2e/ 目录
cd "$E2E_DIR"
node "$CLI_JS" setup --non-interactive \
  --tools sweep \
  --mcp-tools playwright \
  --set "sweep.e2eFramework=playwright"

# ─── E2E 测试目录初始化引导 ───────────────────
echo ""
echo "🧪 E2E 测试目录待初始化..."
echo ""
echo "请在 CLI 中进入 $E2E_DIR 目录后执行："
echo "  /sweep-init"
echo ""
echo "该命令将引导你完成以下配置："
echo "  - 创建 flows/ 测试意图文档目录"
echo "  - 生成 playwright.config.ts 等配置文件"
echo "  - 配置被测系统多环境地址（test / staging / prod）"
echo "  - 安装 npm 依赖"

echo ""
echo "✅ Sweep 安装完成"
echo ""
echo "可用命令："
echo "  /sweep-init         — 初始化 E2E 测试项目"
echo "  /sweep-run --all    — 全量执行 E2E 测试"
echo "  /sweep-plan         — 创建新测试"
echo "详细步骤: cat $PLAYGROUND_DIR/README.md"
