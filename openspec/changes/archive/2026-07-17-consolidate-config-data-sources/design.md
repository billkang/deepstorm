## Context

DeepStorm 使用三层配置体系：`CLAUDE.md`（行为规则）、`.deepstorm/settings.json`（DeepStorm 配置）、`.claude/settings.json`（Claude Code 原生配置）。

当前 sweep 套件的初始化流程（`/sweep-init`）和 reef 套件的 scope 检查存在三个散落在配置体系之外的数据源：

1. **`.sweep-init`** — 纯标记文件，内容固定为 `sweep-e2e-project`
2. **`.env`** — 多环境 baseURL（`BASE_URL_TEST`、`BASE_URL_STAGING` 等）
3. **`.deepstorm/scope-config.json`** — branch scope 检查配置（`enabled`、`domains`）

此外，`/sweep-init` 仅支持在当前工作目录生成文件，不支持路径选择，无法满足"多项目混放"场景。

## Goals / Non-Goals

**Goals:**
- `/sweep-init` 支持路径选择（根目录 / e2e/ / 自定义）
- `sweep-plan` 和 `sweep-run` 自动感知 E2E 项目路径并导航
- `.sweep-init`、`.env`（baseURL 部分）、`scope-config.json` 三个数据源收口到 `settings.json`
- 向后兼容已有项目

**Non-Goals:**
- 不改造 Tide 套件的 `tide-data/` 数据目录（业务数据，不是配置）
- 不改造 Pilot 套件的运行时状态文件（`pilot-state.json`、`.pilot.lock` 等）
- 不改造 `.mcp.json`（Claude Code 原生协议文件）
- 不改造 `.deepstorm/context.md`（动态文档，非配置）
- 不改变 `sweep.wizard.json` 的向导流程（可以在后续独立变更中优化）

## Decisions

### 决策 1：配置收口目标 → `.deepstorm/settings.json`

**选择：** 全部收口到已有的 `.deepstorm/settings.json`

**备选方案：**
| 方案 | 理由 | 结论 |
|------|------|------|
| 收口到 settings.json | 已有的 DeepStorm 配置层，有完整的读写链路和类型定义 | ✅ **采纳** |
| 新建 `.deepstorm/sweep.json` | 分离关注点 | ❌ 增加复杂度，与"统一数据源"目标矛盾 |
| 合入 `.claude/settings.json` | Claude Code 原生配置 | ❌ 定位不同，Claude Code 配置不应用来存业务配置 |

### 决策 2：配置写入方式

**选择：** Shell 脚本（`reef-scope-setup.sh`）使用 `jq` 合并写入，AI skill 使用内容拼接后原子写入

**备选方案：**
| 方案 | 理由 | 结论 |
|------|------|------|
| `jq` 合并写入 | 已有 `jq` 工具，可精确操作嵌套 JSON | ✅ **Shell 脚本采用** |
| `node -e "fs.writeFileSync()"` | 无需额外依赖 | ⚠️ 可行但不如 `jq` 直观 |
| 逐字段 Write | AI skill 的天然方式，但 Shell 脚本中易出错 | ✅ **AI skill 采用**（由 AI 读取-修改-写回） |

### 决策 3：路径导航策略

**选择：** 在 SKILL.md 中用 Bash 命令读取 `settings.json` 的 `sweep.e2eProjectPath`，判断后 `cd` 切换

```bash
# 读取 e2eProjectPath
E2E_PATH=$(cat .deepstorm/settings.json 2>/dev/null | grep -o '"e2eProjectPath"[^,]*' | head -1 | cut -d'"' -f4)

# 根据路径值导航
if [ -z "$E2E_PATH" ] || [ "$E2E_PATH" = "." ]; then
  # 根目录，无需切换
elif [ -d "$E2E_PATH" ]; then
  echo "📂 切换到 E2E 项目目录: $E2E_PATH"
  cd "$E2E_PATH"
fi
```

**备选方案：**
| 方案 | 理由 | 结论 |
|------|------|------|
| Bash grep + cd | 简单、无需额外依赖、AI skill 中天然可用 | ✅ **采纳** |
| node 脚本读取 | 更健壮的 JSON 解析，但增加依赖 | ❌ 过度设计 |
| 环境变量传递 | 需要 hook/plugin 系统支持 | ❌ 不必要 |

### 决策 4：向后兼容策略

**选择：** 优先读 `settings.json`，fallback 到旧文件

**检测顺序：**
1. 读 `settings.json` 的 `sweep.e2eProjectPath` → 有值则用
2. 无值，但 `.sweep-init` 存在 → 回退读取，输出提示
3. 都无 → 报错未初始化

**什么时候清理旧文件：** `deepstorm doctor` 命令中检测并提示用户手动删除，不在 skill 执行中自动删除（避免破坏性操作）。

### 决策 5：`.env` 中 API Key 类敏感信息

**选择：** 保持 `.env` 文件作为 API Key / Token 的存储位置，仅将多环境 baseURL 移入 settings.json

**理由：** baseURL 是配置属性（可提交到 git），而 API Key 是敏感信息（必须 gitignored）。两者混在 `.env` 中不合适，拆分后各归其位。

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 已有项目依赖旧 `.sweep-init` 文件 | fallback 读取机制确保向后兼容；`doctor` 提供迁移提示 |
| `settings.json` 并发写入冲突 | Shell 脚本使用 `jq` 原子写入（tmp + rename），AI skill 单线程不会冲突 |
| `jq` 在 CI 环境可能不可用 | `reef-scope-check.sh` 已内联 `jq` 用法；不可用时回退到 `python3 -m json.tool` |
| 用户升级后旧 `.sweep-init` 不自动清理 | 非破坏性设计：旧文件保留不影响功能；`doctor` 诊断中提示清理 |
| 子目录 `npm install` 路径不一致 | sweep-init 在目标目录中创建独立的 `package.json`，`npm install` 在目标目录执行 |

## Migration Plan

1. **类型定义先行**：更新 `config.ts` 后即可发布，不影响旧项目
2. **技能改造并行**：sweep-init、sweep-plan、sweep-run 三个 SKILL.md 同时更新
3. **脚本改造**：reef-scope-setup.sh 和 reef-scope-check.sh 改为读写 settings.json
4. **env-manager.mjs 改造**：增加 settings.json 读取路径，保持 `.env` fallback
5. **测试验证**：playground 项目验证新流程
6. **发布后**：用户运行 `deepstorm update` 获取新技能，旧项目自动兼容
