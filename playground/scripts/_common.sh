#!/usr/bin/env bash
# DeepStorm Playground — 工具初始化公共配置
# 被 setup-*.sh source 使用
set -euo pipefail

_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLAYGROUND_DIR="$(cd "$_SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$PLAYGROUND_DIR/.." && pwd)"
CLI_DIR="$REPO_ROOT/packages/cli"
CLI_JS="$CLI_DIR/dist/cli.js"

check_cli() {
  if [ ! -f "$CLI_JS" ]; then
    echo "❌ 未找到 $CLI_JS"
    echo "   请先构建 CLI：cd $CLI_DIR && pnpm build"
    exit 1
  fi
}

# 清除 pnpm 泄漏的 npm_config_* 环境变量，避免 npm install 产生未知配置警告
# pnpm 会在 shell 中残留大量 npm_config_ 前缀变量，npm 会将它们解析为用户配置
unset_npm_config_leakage() {
  while IFS='=' read -r var _; do
    unset "$var"
  done < <(env | grep -E '^npm_config_')
}
