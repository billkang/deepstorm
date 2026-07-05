## 1. 基础设施

- [x] 1.1 创建 `playground/scripts/verify-cli.sh` 框架（run_test 函数、路径推导、超时机制、退出码汇总）
- [x] 1.2 在项目根 `package.json` 增加 `playground:verify` script 入口
- [x] 1.3 确保 `playground/test-fixtures/deepstorm-version-newer.json` 和 `deepstorm-version-current.json` 可用

## 2. 运行前检查

- [x] 2.1 实现 CLI 路径有效性检查（CLI_BIN 文件存在），失败退 2
- [x] 2.2 实现 fixture 文件存在性检查，失败退 2
- [x] 2.3 实现 CLI 入口冒烟：`node <CLI_BIN> --help` → 退出码 0

## 3. 配置文件保护

- [x] 3.1 实现配置文件的备份与恢复机制（备份 `.claude/settings.json` + `trap EXIT` 恢复）
- [x] 3.2 验证脚本退出时自动清理临时文件（.verifybak）

## 4. L0 冒烟验证（每次 build 后必跑，带 30s 超时）

- [x] 4.1 update 模板同步 + 版本检查：`DEEPSTORM_REGISTRY_URL=<fixture> node <CLI_BIN> update` → 输出含"同步完成"、"当前版本"、"最新版本"，退出码 0
- [x] 4.2 update 版本检查降级：`DEEPSTORM_REGISTRY_URL=http://localhost:1 node <CLI_BIN> update` → 输出含"无法检查更新"
- [x] 4.3 超时处理：`run_test` 使用 `timeout 30` 包装 CLI 调用，超时标记 FAIL

## 5. L1 全量验证（手动触发 `--full`，先跑 L0 全部场景再追加）

- [x] 5.1 update 检测到更新并自动更新：fixture 指向 newer + `DEEPSTORM_UPDATE_CMD` → 输出含"最新版本"、"正在自动更新"、"已更新"
- [x] 5.2 doctor 命令验证：`node <CLI_BIN> doctor` → 退出码 0，输出含"CLI 版本"

## 6. 文档与流程

- [x] 6.1 更新 CLAUDE.md 开发工作流章节，加入构建后验证环节
