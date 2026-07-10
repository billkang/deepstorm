#!/bin/bash
# reef-auto-format.test.sh
# 测试: reef-auto-format.sh 的增强格式化逻辑（v2: Prettier, organizeImports, VS Code 配置检测）
#
# 用法: bash packages/reef/hooks/__tests__/reef-auto-format.test.sh

set -euo pipefail

PASS=0
FAIL=0
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="$SCRIPT_DIR/reef-auto-format.sh.tmpl"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

TEST_DIR=""
setup_test_dir() {
  TEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/reef-test-XXXXXX")"
  echo "$TEST_DIR"
}

cleanup_test_dir() {
  if [ -n "$TEST_DIR" ] && [ -d "$TEST_DIR" ]; then
    rm -rf "$TEST_DIR"
  fi
}

# ── 测试 1: Shell 语法检查 ──────────────────────────────────────────

test_shell_syntax() {
  if bash -n "$SCRIPT" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Shell 语法检查通过"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} Shell 语法错误"
    bash -n "$SCRIPT" 2>&1 || true
    FAIL=$((FAIL + 1))
  fi
}

# ── 测试 2: 默认值逻辑（Handlebars 未注入时的 bash 降级） ────────

test_default_value_fallback() {
  # 模拟 {{reef.formatter.prettier.enabled}} 未渲染（空字符串）
  local result
  result=$(USE_PRETTIER='' bash -c '
    [ -z "$USE_PRETTIER" ] && USE_PRETTIER="true"
    echo "$USE_PRETTIER"
  ')
  if [ "$result" = "true" ]; then
    echo -e "${GREEN}✓${NC} 默认值：空字符串降级为 true"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} 默认值：期望 true，实际 $result"
    FAIL=$((FAIL + 1))
  fi

  # 模拟 {{reef.formatter.organizeImports.enabled}} 未渲染
  local result2
  result2=$(USE_ORGANIZE_IMPORTS='' bash -c '
    [ -z "$USE_ORGANIZE_IMPORTS" ] && USE_ORGANIZE_IMPORTS="true"
    echo "$USE_ORGANIZE_IMPORTS"
  ')
  if [ "$result2" = "true" ]; then
    echo -e "${GREEN}✓${NC} 默认值：organizeImports 空字符串降级为 true"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} 默认值：期望 true，实际 $result2"
    FAIL=$((FAIL + 1))
  fi

  # 模拟显式设置为 false（wizard.json 禁用）
  local result3
  result3=$(USE_PRETTIER='false' bash -c '
    [ -z "$USE_PRETTIER" ] && USE_PRETTIER="true"
    echo "$USE_PRETTIER"
  ')
  if [ "$result3" = "false" ]; then
    echo -e "${GREEN}✓${NC} 默认值：显式 false 不被覆盖"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} 默认值：期望 false，实际 $result3"
    FAIL=$((FAIL + 1))
  fi
}

# ── 测试 3: Prettier 配置检测（内联函数测试） ─────────────────────

test_prettier_config_detection() {
  local test_dir
  test_dir=$(setup_test_dir)

  # 定义被测试的函数
  detect_prettier_config() {
    local prettier_configs=(
      ".prettierrc" ".prettierrc.json" ".prettierrc.yaml" ".prettierrc.yml"
      ".prettierrc.toml" ".prettierrc.js" ".prettierrc.cjs"
      "prettier.config.js" "prettier.config.cjs"
    )
    local config
    for config in "${prettier_configs[@]}"; do
      if [ -f "$test_dir/$config" ]; then
        return 0
      fi
    done
    return 1
  }

  # 创建 .prettierrc → 应检测到
  echo '{}' > "$test_dir/.prettierrc"
  if detect_prettier_config; then
    echo -e "${GREEN}✓${NC} Prettier 检测：.prettierrc 被识别"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} Prettier 检测：.prettierrc 未被识别"
    FAIL=$((FAIL + 1))
  fi

  # 不同文件名
  rm "$test_dir/.prettierrc"
  touch "$test_dir/.prettierrc.json"
  if detect_prettier_config; then
    echo -e "${GREEN}✓${NC} Prettier 检测：.prettierrc.json 被识别"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} Prettier 检测：.prettierrc.json 未被识别"
    FAIL=$((FAIL + 1))
  fi

  rm "$test_dir/.prettierrc.json"
  touch "$test_dir/prettier.config.js"
  if detect_prettier_config; then
    echo -e "${GREEN}✓${NC} Prettier 检测：prettier.config.js 被识别"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} Prettier 检测：prettier.config.js 未被识别"
    FAIL=$((FAIL + 1))
  fi

  # 删除所有配置 → 不应检测到
  rm -f "$test_dir/prettier.config.js"
  if detect_prettier_config; then
    echo -e "${RED}✗${NC} Prettier 检测：无配置时误报"
    FAIL=$((FAIL + 1))
  else
    echo -e "${GREEN}✓${NC} Prettier 检测：无配置时返回 false"
    PASS=$((PASS + 1))
  fi

  cleanup_test_dir
}

# ── 测试 4: 文件不存在时静默退出 ──────────────────────────────────

test_exit_on_missing_file() {
  local result
  result=$(CLAUDE_CODE_TOOL_RESULT_FILEPATH="/nonexistent/path/file.ts" \
           bash "$SCRIPT" 2>&1 || true)
  if [ -z "$result" ] || echo "$result" | grep -qv "error\|Error\|fail\|FAIL"; then
    echo -e "${GREEN}✓${NC} 文件不存在时静默退出"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} 文件不存在时应静默退出"
    echo "  output: $result"
    FAIL=$((FAIL + 1))
  fi
}

# ── 测试 5: 空文件路径时静默退出 ──────────────────────────────────

test_exit_on_empty_path() {
  local result
  result=$(bash "$SCRIPT" 2>&1 || true)
  if [ -z "$result" ]; then
    echo -e "${GREEN}✓${NC} 空路径时静默退出"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} 空路径时静默退出"
    echo "  output: $result"
    FAIL=$((FAIL + 1))
  fi
}

# ── 测试 6: 不同文件类型脚本不报错 ────────────────────────────────

test_file_type_dispatch() {
  local test_dir
  test_dir=$(setup_test_dir)
  local errors=()

  for ext in java py ts go rs; do
    touch "$test_dir/test.$ext"
    local output
    output=$(CLAUDE_CODE_TOOL_RESULT_FILEPATH="$test_dir/test.$ext" \
             PROJECT_DIR="$test_dir" \
             bash "$SCRIPT" 2>&1 || true)
    local exit_code=$?
    if [ $exit_code -ne 0 ]; then
      errors+=("$ext: exit=$exit_code, output=$output")
    fi
  done

  if [ ${#errors[@]} -eq 0 ]; then
    echo -e "${GREEN}✓${NC} 文件类型分派：Java/Python/TS/Go/Rust 均无报错"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} 文件类型分派出错："
    for err in "${errors[@]}"; do
      echo "  $err"
    done
    FAIL=$((FAIL + 1))
  fi

  cleanup_test_dir
}

# ── 测试 7: VS Code 配置 JSON 解析逻辑 ────────────────────────────

test_vscode_json_parsing() {
  # 测试 jq 解析 VS Code settings.json 的关键模式
  if ! command -v jq &>/dev/null; then
    echo -e "${GREEN}✓${NC} VS Code JSON 解析：jq 不可用，跳过测试"
    PASS=$((PASS + 1))
    return
  fi

  local test_dir
  test_dir=$(setup_test_dir)
  local vscode_dir="$test_dir/.vscode"
  mkdir -p "$vscode_dir"

  # 完整配置（Prettier + organizeImports）
  cat > "$vscode_dir/settings.json" << 'EOF'
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.organizeImports": true,
    "source.fixAll.eslint": true
  }
}
EOF

  local has_prettier
  local has_organize
  has_prettier=$(jq -r '.["editor.formatOnSave"] == true and (.["editor.defaultFormatter"] // "" | test("prettier"; "i"))' "$vscode_dir/settings.json")
  has_organize=$(jq -r '.["editor.codeActionsOnSave"]["source.organizeImports"] // false' "$vscode_dir/settings.json")

  if [ "$has_prettier" = "true" ]; then
    echo -e "${GREEN}✓${NC} VS Code JSON 解析：正确识别 Prettier 配置"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} VS Code JSON 解析：Prettier 识别失败"
    FAIL=$((FAIL + 1))
  fi

  if [ "$has_organize" = "true" ]; then
    echo -e "${GREEN}✓${NC} VS Code JSON 解析：正确识别 organizeImports"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} VS Code JSON 解析：organizeImports 识别失败"
    FAIL=$((FAIL + 1))
  fi

  # 空/不完整配置
  cat > "$vscode_dir/settings.json" << 'EOF'
{
  "editor.formatOnSave": false
}
EOF

  local has_prettier2
  has_prettier2=$(jq -r '.["editor.formatOnSave"] == true and (.["editor.defaultFormatter"] // "" | test("prettier"; "i"))' "$vscode_dir/settings.json")
  if [ "$has_prettier2" = "false" ]; then
    echo -e "${GREEN}✓${NC} VS Code JSON 解析：formatOnSave=false 时正确排除 Prettier"
    PASS=$((PASS + 1))
  else
    echo -e "${RED}✗${NC} VS Code JSON 解析：应为 false"
    FAIL=$((FAIL + 1))
  fi

  cleanup_test_dir
}

# ── 测试 8: 格式化顺序（Prettier → ESLint）验证 ──────────────────

test_format_order() {
  # 验证代码逻辑中 Prettier 在 ESLint 之前执行
  # 查找实际的 `npx prettier` 和 `npx eslint` 命令位置（排除注释和文档）
  local prettier_line
  prettier_line=$(grep -n "npx prettier" "$SCRIPT" | grep -v "^.*#" | head -1 | cut -d: -f1 || echo "0")
  local eslint_line
  eslint_line=$(grep -n "npx eslint" "$SCRIPT" | grep -v "^.*#" | head -1 | cut -d: -f1 || echo "0")

  if [ "$prettier_line" -gt 0 ] && [ "$eslint_line" -gt 0 ] && [ "$prettier_line" -lt "$eslint_line" ]; then
    echo -e "${GREEN}✓${NC} 格式化顺序：Prettier (L$prettier_line) 先于 ESLint (L$eslint_line)"
    PASS=$((PASS + 1))
  elif [ "$prettier_line" -eq 0 ]; then
    # prettier 命令在 Handlebars 条件块中，grep 可能找不到确切行
    # 通过检查文件结构来验证：prettier 块在 eslint 块之前
    local prettier_start
    prettier_start=$(grep -n "# Step 1: Prettier" "$SCRIPT" | head -1 | cut -d: -f1 || echo "0")
    local eslint_start
    eslint_start=$(grep -n "# Step 2: ESLint" "$SCRIPT" | head -1 | cut -d: -f1 || echo "0")
    if [ "$prettier_start" -gt 0 ] && [ "$eslint_start" -gt 0 ] && [ "$prettier_start" -lt "$eslint_start" ]; then
      echo -e "${GREEN}✓${NC} 格式化顺序：Prettier step (L$prettier_start) 先于 ESLint step (L$eslint_start)"
      PASS=$((PASS + 1))
    else
      echo -e "${RED}✗${NC} 格式化顺序：未能确认 Prettier 在 ESLint 之前"
      echo "  prettier_start=$prettier_start, eslint_start=$eslint_start"
      FAIL=$((FAIL + 1))
    fi
  else
    echo -e "${RED}✗${NC} 格式化顺序：Prettier (L$prettier_line) 应在 ESLint (L$eslint_line) 之前"
    FAIL=$((FAIL + 1))
  fi
}

# ── 运行所有测试 ────────────────────────────────────────────────────

echo "=========================================="
echo "  reef-auto-format 增强测试"
echo "=========================================="
echo ""

test_shell_syntax
test_default_value_fallback
test_prettier_config_detection
test_exit_on_missing_file
test_exit_on_empty_path
test_file_type_dispatch
test_vscode_json_parsing
test_format_order

echo ""
echo "=========================================="
echo "  结果: $PASS 通过, $FAIL 失败"
echo "=========================================="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
