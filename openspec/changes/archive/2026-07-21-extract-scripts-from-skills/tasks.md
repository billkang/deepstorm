## 1. 核心共享脚本

- [x] 1.1 创建 `packages/reef/skills/reef-commit/scripts/` 和 `packages/reef/skills/reef-pr/scripts/` 目录
- [x] 1.2 编写 `collect-git-context.mjs`：一次性输出 `{ branch, forkPoint, diffStat, commitLog, openspecChanges, jiraRef }` JSON。复用 `child_process.execSync` 调用 git 命令
- [x] 1.3 为 `collect-git-context.mjs` 添加 `--help` 输出和参数解析（`--json` 等）

## 2. reef-commit 脚本抽取

- [x] 2.1 编写 `branch-check.mjs`：当前分支检查脚本，输出 `{ isValid, reason, action, warning }`
  - main/master 阻断
  - 临时分支名正则检测
  - OpenSpec 任务匹配
- [x] 2.2 编写 `stash-and-switch.sh`：git stash → checkout main → pull → checkout -b → stash pop 序列
- [x] 2.3 编写 `run-tests.sh`：根据项目类型自动检测运行 `./gradlew test` 或 `pnpm test`，输出 JSON 结果（参考 `packages/reef/hooks/reef-run-tests.sh`）
- [x] 2.4 编写 `check-openspec-status.mjs`：扫描 `openspec/changes/*/` 下 `.openspec.yaml`，解析 status 字段
- [x] 2.5 更新 `reef-commit/SKILL.md`：将 Step 2/3/5/6/6.5/7 的内嵌 bash 文本替换为脚本调用指令

## 3. reef-pr 脚本抽取

- [x] 3.1 编写 `create-pr.mjs`：分 `--collect`（收集上下文）和 `--create`（组装 gh pr create）两种模式
- [x] 3.2 `--collect` 模式：检查未提交变更 → 收集分支/commit/diff/proposal 上下文
- [x] 3.3 `--create` 模式：首次推送检测 → `git push -u origin` → `gh pr create` 参数组装 → 已有 PR 检测
- [x] 3.4 更新 `reef-pr/SKILL.md`：将 Step 1 和 Step 4 的内嵌 bash 文本替换为脚本调用

## 4. reef-harden 脚本抽取

- [x] 4.1 编写 `find-change-dir.mjs`：分支名匹配化 → fallback 最近修改 → 用户选择提示
- [x] 4.2 支持 `--files` 参数：列出 change 下所有 SDD 文档路径
- [x] 4.3 更新 `reef-harden/SKILL.md`：将首段上下文约定的 bash 替换为脚本调用

## 5. sweep 脚本扩展

- [x] 5.1 扩展 `packages/sweep/skills/sweep-run/scripts/env-manager.mjs`：添加路径导航方法（向上查找 `.deepstorm/settings.json`）
- [x] 5.2 编写 `packages/sweep/skills/sweep-run/scripts/generate-report.mjs`：执行结果格式化输出 markdown 报告
- [x] 5.3 编写 `packages/sweep/skills/sweep-init/scripts/init-project.mjs`：整合目录创建 + 配置文件生成 + npm install
- [x] 5.4 更新 `sweep-run/SKILL.md`：Step 1 路径导航改为调用 `env-manager.mjs`
- [x] 5.5 更新 `sweep-init/SKILL.md`：Step 2/3/8 的内嵌 bash 改为调用 `init-project.mjs`

## 6. 测试

- [x] 6.1 为 `collect-git-context.mjs` 编写单元测试（模拟 git 命令输出）
- [x] 6.2 为 `branch-check.mjs` 编写单元测试（各种分支名场景）
- [x] 6.3 为 `create-pr.mjs` 编写单元测试（上下文收集 + 命令组装）
- [x] 6.4 为 `find-change-dir.mjs` 编写单元测试（目录匹配/不存在/多匹配）
- [x] 6.5 为 `check-openspec-status.mjs` 编写单元测试（YAML 解析/状态判断）
- [x] 6.6 为 `init-project.mjs` 编写单元测试（目录创建/文件内容验证）
- [x] 6.7 为 `generate-report.mjs` 编写单元测试（报告格式验证）

## 7. 构建与验证

- [x] 7.1 运行 `pnpm build` 确认构建无报错
- [x] 7.2 运行 `pnpm test` 确保所有测试通过
- [x] 7.3 检查 `packages/cli/dist/skills/` 中构建产物是否包含新增脚本
