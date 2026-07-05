## Context

DeepStorm CLI 构建后的产物（dist/cli.js）需要在 playground 项目中做端到端验证。当前验证完全靠手动，没有自动化脚本，也缺少集成到开发流程中的门闸。

playground 项目已有基础设施：
- `test-fixtures/` 目录，内有 deepstorm-version-newer.json 和 deepstorm-version-current.json
- `scripts/` 目录，已有一些 setup 脚本
- `settings.json` 和 `.mcp.json` 配置齐全

验证脚本需要在 playground 环境中运行，使用已构建的 `dist/cli.js`，以确保验证的是最新构建物。

## Goals / Non-Goals

**Goals:**
- 提供一个可重复执行的验证脚本 `playground/scripts/verify-cli.sh`
- 覆盖所有 CLI 命令的核心功能路径（update / diagnose / info 等）
- 支持 L0 冒烟（每次 build 后必跑）和 L1 全量验证（手动触发）两种模式
- 退出码语义：0=全部通过，非0=有失败
- 验证失败的输出包含清晰的断言对比（期望 vs 实际）

**Non-Goals:**
- 不替换现有的 vitest 单元测试（两者互补）
- 不涉及 dist/ 以外的构建物验证（如 npm 包发布）
- 不做性能/压力测试
- setup / plugin build 命令暂不纳入验证范围（setup 需交互式输入，plugin build 需 .deepstorm 目录）

## Decisions

### 1. Shell 脚本（bash）作为验证框架
- **选择**：纯 bash 脚本，`run_test` 函数封装断言逻辑
- **理由**：
  - CLI 验证本质是黑盒进程测试，bash 执行子进程最直接
  - 零依赖——不需要 node_modules 支持即可运行
  - 退出码语义天然适合 CI gate
- **备选方案**：vitest + execa——被否决，增加了对 playground 依赖安装的要求，验证脚本应在构建后立即可用

### 2. 超时机制与 run_test 函数设计

GNU `timeout` 是 Linux 标准命令，但 macOS 默认不包含。脚本头部提供一个可移植的兼容层：

```bash
# 可移植 timeout（macOS 无 GNU coreutils 时 fallback 到 perl 实现）
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
```

脚本定义后，`timeout` 对所有后续调用透明可用。在 `run_test` 中使用：

```bash
run_test() {
  local desc=$1
  local cmd=$2
  local expect=$3
  local mode=$4     # expect_in（默认）| expect_not | expect_exit

  printf "  %-55s" "$desc"
  output=$(eval "$cmd" 2>&1)
  local rc=$?   # 立即捕获退出码（timeout 退出码 124=超时）

  if [ "$rc" = 124 ]; then
    echo "❌ (超时>30s)"; fail=1
    return
  fi

  if [ "$mode" = "expect_exit" ]; then
    if [ "$rc" = "$expect" ]; then echo "✅"; else echo "❌ (exit:$rc, expect:$expect)"; fail=1; fi
  elif [ "$mode" = "expect_not" ]; then
    if echo "$output" | grep -q "$expect"; then
      echo "❌ (包含不应有内容: $expect)"; fail=1
    else
      echo "✅"
    fi
  else
    if echo "$output" | grep -q "$expect"; then echo "✅"; else echo "❌ (期望:$expect)"; echo "$output" | head -10; fail=1; fi
  fi
}
```

关键点：
- `eval` 后立即 `local rc=$?` 修复退出码捕获 bug
- 调用方在 `$cmd` 中自行包含 `timeout 30`，如 `DEEPSTORM_REGISTRY_URL=... timeout 30 node cli.js update`。bash 将 `DEEPSTORM_REGISTRY_URL=...` 解析为 `timeout` 的环境变量，`timeout` 再将其传递给子进程 `node`，env var 语义正确
- `timeout` 退出码 124 直接标记 FAIL 并返回（不继续断言模式）
- 统一 `$fail` 标记，全部场景执行完后以 `$fail` 决定最终退出码
- 复杂 JSON 断言可用 `run_test_json()` 函数扩展

### 3. 验证级别

| 级别 | 名称 | 触发时机 | 覆盖场景 | 完整性 |
|------|------|---------|---------|--------|
| L0 | smoke | 每次 build 后 `pnpm playground:verify` | --help + update（模板同步 + 版本检查降级） | 全部场景 PASS，30s 超时门禁 |
| L1 | full | 手动 `bash playground/scripts/verify-cli.sh --full` | **先执行全部 L0 场景**，再加 run doctor / update-newer | 全部场景 PASS（含 L0），不单独计时 |

**执行关系**：L1 模式下脚本先无条件执行所有 L0 场景的 `run_test` 调用，再执行 L1 专属场景。不跳过、不合并 L0，确保 --full 覆盖完整。

### 4. CLI 路径解析

```bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLAYGROUND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
# playground/ 相对于 monorepo root 的位置：
MONOREPO_ROOT="$(cd "$PLAYGROUND_DIR/.." && pwd)"
CLI_BIN="$MONOREPO_ROOT/packages/cli/dist/cli.js"
```

脚本基于 `$SCRIPT_DIR` 自动推导 playground 根路径和 CLI 路径，不硬编码绝对路径。本地和 CI 环境路径差异通过此机制自适应。

### 5. Fixture 策略
- 共享 fixture 放 `playground/test-fixtures/`
- 版本检查 fixture（deepstorm-version-*.json）已有，直接使用
- 后续命令需要独立 fixture 时，在验证脚本中临时生成

### 6. 配置保护

脚本执行流程：备份 settings.json → 执行验证 → 恢复 settings.json

```bash
backup_files() { cp "$1" "$1.verifybak"; }
restore_files() { mv "$1.verifybak" "$1"; }
trap 'restore_files "$SETTINGS_PATH"' EXIT
```

备份/恢复通过 `trap` 保证异常退出时也执行。

### 7. 退出码语义

| 退出码 | 含义 | 触发条件 |
|--------|------|---------|
| 0 | 全部通过 | 所有验证场景标记为 ✅ |
| 1 | 验证场景失败 | 任意验证场景标记为 ❌ |
| 2 | 脚本基础检查失败 | CLI_BIN 不存在、fixture 文件缺失、--help 无法执行 |

### 8. 前提检查流程

在进入任何验证场景之前，脚本按序执行：

1. 检查 `CLI_BIN` 文件存在且可执行 → 否则退 2
2. 检查所有引用 fixture 文件存在 → 否则退 2
3. 执行 `node <CLI_BIN> --help` 确保 CLI 入口正常 → 否则退 2
4. 备份 `.claude/settings.json`
5. 进入验证场景循环

## Risks / Trade-offs

- **[脆弱断言]** Shell 脚本的 grep 断言可能因输出格式变动而误判
  - → Mitigation: 复杂断言使用 `run_test_json()` 或 `node -e "..."` 做结构化判断
- **[playground 配置污染]** 验证脚本运行后可能修改 playground 的 settings.json
  - → Mitigation: 验证前备份 `.claude/settings.json`，`trap EXIT` 恢复
- **[假阳性]** 本地和 CI 环境路径不同
  - → Mitigation: 使用 `SCRIPT_DIR` 推导所有路径，不硬编码
- **[sandbox 网络拦截]** 沙箱环境 npm registry 不可达
  - → Mitigation: 使用 `DEEPSTORM_REGISTRY_URL=http://localhost:1` 显式触发降级，不依赖真实网络环境
- **[超时误判]** `timeout 30` 可能在某些场景过于严格（如 diagnose 慢速诊断）
  - → Mitigation: 每个命令的 timeout 值可调（`run_test` 加 `$timeout_sec` 参数），默认 30s
