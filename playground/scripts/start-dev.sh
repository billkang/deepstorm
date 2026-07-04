#!/usr/bin/env bash
set -euo pipefail

# DeepStorm Playground — 启动 App
# Playwright MCP 由 sweep-run 按需管理
# 用法: bash scripts/start-dev.sh
# 终止: Ctrl+C 停止

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLAYGROUND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "============================================"
echo "  DeepStorm Playground - 开发环境启动"
echo "============================================"
echo ""

# --- 关闭已有 App 端口 ---------------------------
echo "[1/2] 检查端口占用..."
PORT=3000
PID=$(lsof -ti tcp:"$PORT" 2>/dev/null || true)
if [ -n "$PID" ]; then
  echo "  - 端口 $PORT (App) 被进程 $PID 占用，正在关闭..."
  kill "$PID" 2>/dev/null || true
  for i in $(seq 1 10); do
    if ! lsof -ti tcp:"$PORT" >/dev/null 2>&1; then
      break
    fi
    sleep 0.3
  done
  if lsof -ti tcp:"$PORT" >/dev/null 2>&1; then
    echo "  - 端口 $PORT 未能释放，强制关闭..."
    kill -9 "$PID" 2>/dev/null || true
    sleep 0.5
  fi
  echo "  - 端口 $PORT (App) 已释放"
else
  echo "  - 端口 $PORT (App) 未被占用"
fi
echo ""

# --- 启动 App（端口 3000）--------------------------
echo "[2/2] 启动 App - http://localhost:3000"
cd "$PLAYGROUND_DIR/app"
node server.js &
APP_PID=$!

echo ""
echo "已启动!"
echo "  App:  http://localhost:3000"
echo "  Ctrl+C 停止"
echo "============================================"

# --- 优雅退出 -------------------------------------
cleanup() {
  echo ""
  echo "正在停止..."
  kill "$APP_PID" 2>/dev/null || true
  wait "$APP_PID" 2>/dev/null || true
  echo "已停止"
}
trap cleanup EXIT INT TERM

wait
