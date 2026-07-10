# Brainstorming Session — reef-auto-format 增强：匹配 IDE 格式化行为

- **日期：** 2026-07-10
- **主题：** reef-auto-format.sh 在代码生成后缺少 Prettier 和 organizeImports 格式化，导致 VS Code 保存时 import 发生变化
- **参与角色：** User (Dev) / Claude (AI)

## 讨论内容

### 问题描述

实际项目中使用 reef（Claude Code）生成代码后，打开文件执行保存操作时，VS Code 的 "format on save" 会再次格式化代码，导致 import 语句发生变化。具体表现为：

1. **Prettier 格式化** — 项目配置了 Prettier 作为 formatter，import 行的换行/缩进/括号间距被 Prettier 改写
2. **`source.organizeImports`** — VS Code 的 code action 重新排序 import、合并重复 import、移除未使用的 import

### 根因分析

reef 已有 `reef-auto-format.sh` 作为 PostToolUse hook，在每次 Write/Edit 后运行 `eslint --fix`。但 `eslint --fix` 只修复 ESLint 规则，不覆盖：

| 缺少的工具 | 作用 | VS Code 中对应配置 |
|-----------|------|-------------------|
| `prettier --write` | 格式化 import 换行/缩进/括号间距 | `"editor.defaultFormatter": "esbenp.prettier-vscode"` |
| `organizeImports` | 排序/合并/清理 import | `"editor.codeActionsOnSave": {"source.organizeImports": true}` |
| `isort` (Python) | Python import 排序 | 等价于 TS 的 organizeImports |

### 讨论决策

| 问题 | 决策 |
|------|------|
| 需要支持 Prettier 还是 organizeImports？ | **两者都要** — 项目通常同时启用 |
| 如何感知项目配置？ | **自动检测 `.vscode/settings.json` + `wizard.json` 回退** |
| 覆盖范围？ | **全语言** — TS/JS 加 Prettier + organizeImports，Python 加 isort |

### 影响范围

| 涉及文件 | 变更内容 |
|---------|---------|
| `packages/reef/hooks/reef-auto-format.sh.tmpl` | 增加 Prettier、organizeImports、isort 格式化步骤 |
| `packages/reef/wizard.json` | 可能新增配置项 |
| `packages/cli/src/commands/setup/` | 需同步 CLI 资产安装逻辑 |

### 后续步骤

1. 走 OpenSpec 流程：`/opsx:new` → proposal → specs → design → tasks
2. 改造 `reef-auto-format.sh.tmpl` 的核心格式化分支
3. 在 `wizard.json` 中增加相关配置选项（如果必要）
4. 同步更新 CLI 安装/更新命令
5. 验证：在 playground 中测试增强后的自动格式化行为
