## 1. Setup — Step 9 框架

- [x] 1.1 在 `setup.ts` 中创建 `step9AutoInstallDeps()` 函数，接收 `tools` 和 `config` 参数
- [x] 1.2 在 `exports` 中添加 `execSafe` 辅助函数封装，捕获错误时仅警告不中断
- [x] 1.3 在 setup 主流程末尾，Step 8 guide 之后调用 `step9AutoInstallDeps()`

## 2. Tide — BMAD Method 自动安装

- [x] 2.1 实现 `installBmadMethod()` 函数，检测 `npx bmad-method status` 判断是否已安装
- [x] 2.2 已安装时跳过，未安装时执行 `npx bmad-method install`
- [x] 2.3 捕获执行错误，显示友好警告信息

## 3. Tide — grill-me skill 自动安装

- [x] 3.1 实现 `installGrillMe()` 函数，检测 `.claude/skills/grill-me/SKILL.md` 是否存在
- [x] 3.2 已存在时跳过，不存在时从 GitHub raw URL 下载 SKILL.md
- [x] 3.3 确保 `grill-me/` 目录结构正确
- [x] 3.4 捕获下载错误，显示友好警告信息

## 4. Sweep — Playwright 浏览器自动安装

- [x] 4.1 实现 `installPlaywright()` 函数，检测 `config['sweep.e2eFramework']` 是否为 `playwright`
- [x] 4.2 检测 Playwright 浏览器是否已安装（通过 `npx playwright install --dry-run` 或文件检测）
- [x] 4.3 已安装时跳过，未安装时执行 `npx playwright install`
- [x] 4.4 捕获执行错误，显示友好警告信息

## 5. 测试

- [x] 5.1 为 `step9AutoInstallDeps` 编写单元测试（mock execSync）
- [x] 5.2 验证 Tide 选中 + 未选中时的行为
- [x] 5.3 验证 Sweep + Playwright 选中时的行为
- [x] 5.4 验证已安装时跳过的幂等行为
- [x] 5.5 验证安装失败时的错误处理
