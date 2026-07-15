#!/usr/bin/env bash
set -euo pipefail

# DeepStorm Playground — 一键全量初始化
# 构建 CLI → 依次安装各套件 → 生成 .env → 安装 app 依赖
# 用法: bash scripts/setup-all.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLAYGROUND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$PLAYGROUND_DIR/.." && pwd)"
CLI_DIR="$REPO_ROOT/packages/cli"
CLI_JS="$CLI_DIR/dist/cli.js"
source "$SCRIPT_DIR/_common.sh"

echo "============================================"
echo "  DeepStorm Playground — 一键全量初始化"
echo "============================================"
echo ""

# ─── 构建 CLI ───────────────────────────────────
echo "📦 [1/4] 构建 CLI..."
cd "$REPO_ROOT"
pnpm build
echo "✅ CLI 构建完成"
echo ""

# ─── 检查构建产物 ──────────────────────────────
if [ ! -f "$CLI_JS" ]; then
  echo "❌ 未找到 $CLI_JS"
  exit 1
fi

# ─── 清理上一次生成的配置 ──────────────────────
rm -rf "$PLAYGROUND_DIR/.claude" "$PLAYGROUND_DIR/.env" "$PLAYGROUND_DIR/.mcp.json" \
  "$PLAYGROUND_DIR/node_modules" "$PLAYGROUND_DIR/tide-data" \
  "$PLAYGROUND_DIR/e2e/.env" "$PLAYGROUND_DIR/e2e/.mcp.json" \
  "$PLAYGROUND_DIR/e2e/.sweep-init" "$PLAYGROUND_DIR/e2e/node_modules"

# esbuild 打包时 commander 等依赖是 external 的，需要 node_modules
ln -sf "$CLI_DIR/node_modules" "$PLAYGROUND_DIR/node_modules"

# ─── 依此安装各套件 ──────────────────────────
echo "🔧 [2/4] 安装各套件..."
echo ""

bash "$SCRIPT_DIR/setup-reef.sh"
echo ""
bash "$SCRIPT_DIR/setup-tide.sh"
echo ""
bash "$SCRIPT_DIR/setup-atoll.sh"
echo ""
bash "$SCRIPT_DIR/setup-sweep.sh"
echo ""
bash "$SCRIPT_DIR/setup-pilot.sh"
echo ""

echo "✅ 各套件安装完成"
echo ""

# ─── 重新生成根路径 .env（不含 playwright） ──
echo "📄 [3/4] 更新根路径 .env..."
ENV_EXAMPLES_DIR="$CLI_DIR/env-examples"
for tool in jira figma github context7; do
  example_file="$ENV_EXAMPLES_DIR/$tool.env-example"
  if [ -f "$example_file" ]; then
    grep -E '^[A-Z_]\+=' "$example_file" >> "$PLAYGROUND_DIR/.env" 2>/dev/null || true
  fi
done
grep -q '^# DEEPSTORM_PLAYGROUND' "$PLAYGROUND_DIR/.env" 2>/dev/null || \
  printf "\n# DEEPSTORM_PLAYGROUND — auto-generated from env-examples/\n" >> "$PLAYGROUND_DIR/.env"
echo "✅ 根路径 .env 已更新（jira, figma, github, context7）"
echo ""

# ─── 安装 app 依赖 ─────────────────────────────
echo "📁 [4/4] 安装 app 依赖..."
cd "$PLAYGROUND_DIR/app"
unset_npm_config_leakage
npm install
echo "✅ app 依赖安装完成"
echo ""

# ─── 完成 ─────────────────────────────────────
echo "============================================"
echo "✅ 环境就绪！"
echo ""
echo "启动被测系统:"
echo "  cd app && npm start"
echo "  → http://localhost:3000"
echo ""
echo "详细验证步骤: cat README.md"
echo "============================================"
