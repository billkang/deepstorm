## 1. Review 已有文档

- [x] 1.1 核对已有 `jackson-polymorphism.md` 是否覆盖 spec 中全部 9 项 Requirement
- [x] 1.2 核对已有文档中的代码示例是否准确（基类注解、子类定义、TS 类型、模板用法）
- [x] 1.3 核对已有文档中的最佳实践表格是否与 spec 的 Requirement 一致

## 2. 完善规范文档

- [x] 2.1 根据 spec 补充缺失的 Requirement 内容
- [x] 2.2 根据 design.md 补充技术决策说明和备选方案对比
- [x] 2.3 统一文档格式和术语（遵循中文正文 + 英文技术术语原则）

## 3. 集成到文档体系

- [x] 3.1 `quick-reference.md` 中添加 DTO 多态序列化引用章节
- [x] 3.2 `SKILL.md.tmpl` 知识文件清单中添加 `jackson-polymorphism.md`
- [x] 3.3 `setup.ts` 中 `copyFragmentsForSkill` 增加复制额外 `.md` 文件逻辑
