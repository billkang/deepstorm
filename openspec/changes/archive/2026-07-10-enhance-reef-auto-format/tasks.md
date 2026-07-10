## 1. VS Code 配置检测

- [x] 1.1 在 `reef-auto-format.sh.tmpl` 中新增 VS Code 配置检测函数 `detect_vscode_settings`，读取 `.vscode/settings.json` 并解析 `editor.defaultFormatter`、`editor.formatOnSave`、`editor.codeActionsOnSave` 配置项
- [x] 1.2 实现配置缓存机制：首次读取后缓存到临时文件，以文件 mtime 作为缓存失效依据
- [x] 1.3 实现配置优先级逻辑：VS Code 配置 > wizard.json > 工具自动检测

## 2. Prettier 格式化支持

- [x] 2.1 在 `reef-auto-format.sh.tmpl` 的 TypeScript/JS/CSS 分支中增加 Prettier 检测逻辑——检查 `.prettierrc` / `prettier.config.js` 等配置文件是否存在
- [x] 2.2 实现 Prettier 格式化步骤：`npx prettier --write "$filepath"`，确保格式化顺序为 Prettier → ESLint --fix
- [x] 2.3 实现 Prettier 禁用配置：当 VS Code 配置或 wizard.json 指示禁用时跳过

## 3. Organize Imports 支持

- [x] 3.1 在 `.ts` / `.tsx` 分支中增加 TypeScript organize imports 步骤
- [x] 3.2 在 `.py` 分支中增加 isort 步骤（`isort "$filepath"`），回退到 `ruff check --select I --fix "$filepath"`
- [x] 3.3 实现 organize imports 禁用配置

## 4. 配置项定义（wizard.json）

- [x] 4.1 在 `wizard.json` 中新增 `reef.formatter` 配置组，包含 `prettier.enabled`、`organizeImports.enabled` 配置项
- [x] 4.2 确保 `deepstorm update` 命令能将新配置同步到已安装副本（模板文件名称未变，现有 CLI 机制自动覆盖）

## 5. CLI 同步

- [x] 5.1 检查 `packages/cli/src/commands/setup/` 中钩子安装逻辑，确保新版本的 `reef-auto-format.sh` 被正确安装（`renderToolAssets` 自动处理 .tmpl 渲染，无需代码改动）
- [x] 5.2 检查 `packages/cli/src/commands/update/` 中 update 命令的资产同步逻辑（`syncToolAssets` → `renderToolAssets` 覆盖 hooks 同步，无需改动）
- [x] 5.3 验证 playground 的 `.deepstorm/` 配置与新模板一致（`pnpm playground:verify` ✅）

## 6. 测试与验证

- [x] 6.1 在 `packages/reef/hooks/__tests__/` 中为新的格式化步骤编写测试（15/15 通过）
- [x] 6.2 在 playground 项目中手动验证：运行 reef 生成代码 → 验证 Prettier/organizeImports 已执行
- [x] 6.3 验证 wizard.json 和 VS Code 配置检测的优先级逻辑
