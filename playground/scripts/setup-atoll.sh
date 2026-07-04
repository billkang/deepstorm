#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_common.sh"

echo "==========================================="
echo "  Atoll — 运维侧工具安装"
echo "============================================"
echo ""

check_cli

cd "$PLAYGROUND_DIR"
node "$CLI_JS" setup --non-interactive \
  --tools atoll

echo ""
echo "✅ Atoll 安装完成"
echo ""
echo "可用命令："
echo "  /atoll:atoll-ops  — 触发 Atoll 运维工作流"
echo "详细步骤: cat $PLAYGROUND_DIR/README.md"
