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

# 使用 OpenSpec 目录结构: openspec/changes/<change-name>/
CHANGE_DIR="$PILOT_DIR/openspec/changes/pilot-e2e-test"
mkdir -p "$CHANGE_DIR/specs/pilot-e2e-test"

# ─── proposal.md ──────────────────────────────────
cat > "$CHANGE_DIR/proposal.md" << 'PROPOSAL'
## Why

DeepStorm Pilot 是 OpenSpec 自动实现 Harness Agent，需要一个端到端测试项目来验证其核心能力：读取 tasks.md、spawn Claude CLI 进程、串行执行任务、状态管理等功能是否正常工作。

## What Changes

- 创建 playground E2E 测试项目，验证 Pilot 的 task 执行能力
- 覆盖基础文件操作、文件修改、清理三类任务场景

## Capabilities

### New Capabilities

- `pilot-e2e-test`：Pilot 端到端测试，验证 Harness Agent 完整执行链路

## Impact

- 仅 playground 测试项目，不影响生产代码
PROPOSAL

# ─── design.md ────────────────────────────────────
cat > "$CHANGE_DIR/design.md" << 'DESIGN'
## Context

Pilot 通过读取 OpenSpec 的 tasks.md 文件，生成 prompt 传递给 Claude CLI，由 Claude 自主完成任务。测试需要覆盖：

1. 文件创建能力（README、源码文件、目录）
2. 文件修改能力（追加内容、创建子目录）
3. 清理能力（gitignore、验证输出）

### 约束

- 测试项目独立于主项目，位于 `playground/pilot-test/`
- 使用 OpenSpec 标准目录结构
- 不依赖外部服务，纯本地文件操作

## Goals / Non-Goals

**Goals:**
- 验证 Pilot 能正确读取 OpenSpec tasks.md
- 验证 Claude CLI 能按序执行 task
- 验证完成标记检测（##TASK_COMPLETE）正常工作

**Non-Goals:**
- 不测试 daemon 模式（前台模式即可验证核心逻辑）
- 不测试错误恢复（happy path 优先）
DESIGN

# ─── spec.md ──────────────────────────────────────
cat > "$CHANGE_DIR/specs/pilot-e2e-test/spec.md" << 'SPEC'
## ADDED Requirements

### Requirement: Pilot E2E 测试 — 文件创建

系统 SHALL 能通过 Pilot 自动执行 tasks.md 中定义的文件创建任务，包括创建 README.md、src/index.js 和目录结构。

#### Scenario: 创建 README.md

- **GIVEN** tasks.md 包含 task 1.1「创建一个 README.md 文件」
- **WHEN** Pilot 执行该 task
- **THEN** 应在项目根目录生成 README.md，内容为 "# Pilot Playground Test"

#### Scenario: 创建 src/index.js

- **GIVEN** tasks.md 包含 task 1.2「创建 src/ 目录和 src/index.js」
- **WHEN** Pilot 执行该 task
- **THEN** 应创建 src/ 目录和 src/index.js，内容为 "console.log('pilot test passed');"

### Requirement: Pilot E2E 测试 — 文件修改

系统 SHALL 能通过 Pilot 执行文件修改类 task。

#### Scenario: 追加内容到 README.md

- **GIVEN** tasks.md 包含 task 2.1「在 README.md 末尾追加内容」
- **WHEN** Pilot 执行该 task
- **THEN** README.md 末尾应追加 "## Status\n\nTest completed."

### Requirement: Pilot E2E 测试 — 清理

系统 SHALL 能通过 Pilot 执行清理类 task。

#### Scenario: 创建 .gitignore

- **GIVEN** tasks.md 包含 task 3.1「创建 .gitignore 文件」
- **WHEN** Pilot 执行该 task
- **THEN** 应生成 .gitignore 文件，包含 "node_modules/"
SPEC

# ─── tasks.md ─────────────────────────────────────
cat > "$CHANGE_DIR/tasks.md" << 'TASKS'
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
echo "   📁 目录结构:"
echo "   ├── openspec/changes/pilot-e2e-test/"
echo "   │   ├── proposal.md"
echo "   │   ├── design.md"
echo "   │   ├── tasks.md"
echo "   │   └── specs/pilot-e2e-test/spec.md"
echo "   任务数: $(grep -c '\[ \]' "$CHANGE_DIR/tasks.md")"
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
