## 1. Hooks.json — Prompt Hook 增强

- [x] 1.1 阅读当前 `hooks.json` 中 PreToolUse Write|Edit prompt hook 的结构
- [x] 1.2 将 prompt hook 内容从仅"加载 skill"改为内联核心规则（Java 5 条 + Python 5 条 + TS 5 条）+ skill 引用 + 自证要求
- [x] 1.3 验证 hooks.json JSON 格式正确

## 2. Java Auto-Format — 替换 no-op

- [x] 2.1 阅读 `reef-auto-format.sh.tmpl` 当前 Java 分支实现和 `.tmpl` 变量注入机制
- [x] 2.2 将 Java 分支从 `no-op` 改为 `google-java-format -i "$filepath"`，失败时降级到 warning
- [x] 2.3 确认 `.tmpl` 模板变量（如 `{{reef.backend.java.formatCmd}}`）正确插入

## 3. Post-Write Verify Script — 新增 reef-code-style-verify.sh

- [x] 3.1 阅读现有 hook 脚本（`reef-auto-format.sh`）的 stdin JSON 解析和文件路径获取模式
- [x] 3.2 创建 `reef-code-style-verify.sh`，实现：
  - 从 stdin JSON 解析文件路径
  - 按文件类型路由（Java→checkstyle / Python→ruff check / TS→eslint）
  - 验证不通过时输出违规报告
- [x] 3.3 创建 `reef-code-style-verify.sh.tmpl` 模板版本，支持 wizard 配置变量注入
- [x] 3.4 在 `hooks.json` 的 PostToolUse 中注册 `reef-code-style-verify.sh`（async 模式）
- [x] 3.5 验证 hooks.json JSON 格式正确

## 4. Wizard.json — Java 格式化工具配置

- [x] 4.1 阅读 `wizard.json` 中现有后端配置结构（`reef.backend.java.details`）
- [x] 4.2 在 Java 详情维度中新增 `reef.backend.java.formatTool` 配置（type: static，强制 google-java-format）
  - 强制使用 `google-java-format`，不提供 `none` 退化选项
  - 包含 `formatCmd`、`lintCmd` 等必要字段
- [x] 4.3 验证 wizard.json JSON 格式正确

## 5. 文档更新

- [x] 5.1 `ARCHITECTURE.md` 已删除（设计决策已在 OpenSpec artifacts 中记录）
- [x] 5.2 验证文档格式和引用完整性

## 6. 测试

- [x] 6.1 为 `reef-code-style-verify.sh` 编写测试用例（`__tests__/reef-code-style-verify.test.sh`）
  - 工具不存在时降级（Java/Python/TS）
  - 非源码文件跳过
  - 边界情况（空 JSON、无路径、空路径、文件不存在）
- [x] 6.2 运行 `pnpm test:hooks` 验证全部 hook 测试通过
