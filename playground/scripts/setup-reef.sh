#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/_common.sh"

echo "============================================"
echo "  Reef — 开发侧工具安装"
echo "============================================"
echo ""

check_cli

cd "$PLAYGROUND_DIR"
node "$CLI_JS" setup --non-interactive \
  --tools reef \
  --mcp-tools github,context7 \
  --set "reef.techs=frontend,backend" \
  --set "reef.frontend.framework=angular" \
  --set "reef.backend.language=java"

echo ""
echo "✅ Reef 安装完成"
echo ""
echo "可用命令："
echo "  /reef:reef-testcase  — 测试用例生成"
echo "  /reef:reef-harden    — Spec 加固"
echo "  /reef:reef-commit    — Git Commit 辅助"
echo "  /reef:reef-pr        — Git PR 创建（需 GitHub Token）"
echo "  /reef:reef-review    — 代码审查"
echo "详细步骤: cat $PLAYGROUND_DIR/README.md"
