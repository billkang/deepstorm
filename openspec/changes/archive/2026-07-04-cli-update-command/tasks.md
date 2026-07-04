## 1. 修复 CLI 版本号

- [x] 1.1 将 `index.ts` 中的硬编码 `program.version('0.1.0')` 改为从 `package.json` 读取
- [x] 1.2 验证 `deepstorm --version` 输出与 `packages/cli/package.json` 中的 `version` 一致（输出 0.1.2）

## 2. 实现 update 命令核心

- [x] 2.1 创建 `src/commands/update.ts`，实现 `checkNpmVersion()`：fetch npm registry 最新版本
- [x] 2.2 实现 `updateCLI()`：版本比对 + 输出更新指引（`npm install -g @deepstorm/cli@latest`）
- [x] 2.3 实现 `updateSkills()`：委托 `upgradeTemplates()` 执行 skill 模板同步
- [x] 2.4 实现 `registerUpdateCommand()`：注册 `update / update --check / update --cli / update --skills`
- [x] 2.5 全量 `deepstorm update`（无选项）先检查版本、再同步 skill 模板

## 3. 向后兼容

- [x] 3.1 从 `template.ts` 移除 `upgrade` 子命令注册
- [x] 3.2 验证 `template-upgrade.ts` 的 `upgradeTemplates` 导出是否可被 `update.ts` 正常 import（已通过测试验证）

## 4. 更新 doctor 命令

- [x] 4.1 在 `doctor.ts` 的诊断检查中加入版本对比信息（可选，提示运行 update --check）

## 5. 测试

- [x] 5.1 为 `checkNpmVersion()` 编写单元测试（mock fetch，覆盖成功/失败/超时场景）
- [x] 5.2 为 `update` 命令注册和子选项解析编写集成测试
- [x] 5.3 更新 `template-upgrade` 相关的现有测试以反映命令路径变化
