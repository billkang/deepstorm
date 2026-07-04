#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_common.sh"

echo "============================================"
echo "  Tide — 产品侧工具安装"
echo "============================================"
echo ""

check_cli

cd "$PLAYGROUND_DIR"
node "$CLI_JS" setup --non-interactive \
  --tools tide \
  --mcp-tools jira,figma

# 创建 tide-data 目录（Tide 会话记录存储）
mkdir -p "$PLAYGROUND_DIR/tide-data"

echo ""
echo "✅ Tide 安装完成"
echo ""
echo "下一步："
echo "  在 Claude Code 中直接输入产品需求，触发 Tide BMAD 多角色讨论"
echo "  详细步骤: cat $PLAYGROUND_DIR/README.md"
