## 1. initTemplate 测试

- [x] 1.1 编写测试：`initTemplate()` 导出时，源目录有 `references/` → 导出结果包含 `references/` 且文件完整
- [x] 1.2 编写测试：`initTemplate()` 导出时，源目录无 `references/` → 导出结果无 `references/`，静默跳过

## 2. applyTemplate 测试

- [x] 2.1 编写测试：`applyTemplate()` 应用时，模板目录有 `references/` → 目标目录包含 `references/` 且文件完整
- [x] 2.2 编写测试：`applyTemplate()` 应用时，模板目录无 `references/` → 目标目录无 `references/`，静默跳过

## 3. copyDir 单元测试

- [x] 3.1 编写测试：`copyDir()` 递归复制包含 `references/` 在内的子目录，校验目录结构和文件内容一致（已有 `fs.test.ts` 中的 `copies a directory recursively` 测试覆盖）
