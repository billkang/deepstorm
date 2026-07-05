---
date: 2026-07-05
session: 002
topic: 构建物验证环节 —— playground E2E 验证框架
participants: [billkang, claude]
---

# 构建物验证环节 —— playground E2E 验证框架

## 背景

DeepStorm 开发目前有单元测试（vitest），但缺少对构建后的产物（dist/）在 playground 项目中做端到端验证的环节。

当前流程：
```
改代码 → 单元测试 → build → merge
                              ↑
                         缺少这一环：
                         构建物在 playground 跑得通吗？
```

## 讨论内容

### 发现的问题

1. **没有构建物验证** — 单元测试通过≠构建后的 CLI 在真实项目中能跑
2. **验证靠手动** — 每次改完代码要手动 `cd playground && node dist/cli.js update` 看一眼
3. **退化无感知** — 改了 registry 相关代码后，只有 playground 跑一遍才能发现 dist 路径、__dirname 解析是否正确
4. **全量验证无覆盖** — 目前只手动测了 update，setup、diagnose、plugin build 等命令从未在 playground 验证过

### 关键决策

1. **验证范围**：所有 CLI 命令（setup / update / diagnose / plugin build / info 等）
2. **验证方式**：Shell 脚本为主（黑盒进程测试），必要时用 node -e / jq 辅助复杂断言
3. **测试目录**：`playground/` 已有 test-fixtures/ 目录存放 mock JSON 文件，验证脚本也放在 playground/ 下

### Script 方案核心模式

```bash
run_test() {
  local desc=$1 cmd=$2 expect=$3
  output=$(eval "$cmd" 2>&1)
  if echo "$output" | grep -q "$expect"; then
    echo "  ✅ $desc"
  else
    echo "  ❌ $desc"
    echo "    期望包含: $expect"
    echo "    实际输出: $output"
    exit 1
  fi
}

# 用例示例
run_test "update 同步 skill" \
  "DEEPSTORM_REGISTRY_URL=test-fixtures/version-current.json node dist/cli.js update" \
  "同步完成"
```

## 可选的下一步

1. 用 OpenSpec 创建 `add-cli-e2e-verify` change，产出 proposal → specs → design → tasks
2. 或先简单实现一个验证脚本跑起来，后续再走完整 OpenSpec 做复杂场景
