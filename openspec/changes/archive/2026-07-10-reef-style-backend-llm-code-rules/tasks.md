## 1. Java quick-reference.md 更新

- [x] 1.1 在「LLM 常犯错误」章节新增：「所有控制流语句必须使用大括号（if/else/for/while/do 一律使用 {}）」
- [x] 1.2 在「LLM 常犯错误」章节新增：「禁止声明未被使用的局部变量；switch 模式匹配中使用 _ 替代命名变量」
- [x] 1.3 验证：加载完整 quick-reference.md 后，两条新规则与已有规则风格一致

## 2. Python 变体检查与同步

- [x] 2.1 检查 `variants/python/quick-reference.md` 是否有控制流风格相关章节
- [x] 2.2 如适用：按 Python 语言习惯同步代码风格规则（缩进约束替代大括号规则）—— 不适用，Python 无对应章节

## 3. 文件编辑许可与 Apply

- [x] 3.1 创建 `.claude/.discuss-apply-active` 标记文件以放行 skill 文件的 Write/Edit
- [x] 3.2 通过 `/opsx:apply` 执行上述修改

## 5. 变量声明距离与 final 规则

- [x] 5.1 在「LLM 常犯错误」章节新增：「局部变量声明必须靠近首次使用处（≤ 3 行）；从方法调用返回值赋值的局部变量使用 final 修饰」
- [x] 5.2 验证：新规则与已有规则风格一致

## 4. 同步验证

- [x] 4.1 确认 `quick-reference.md` 变更已正确写入
- [x] 4.2 运行测试套件，确认无回归
- [x] 4.3 确认 CLI 资产同步路径覆盖了 quick-reference.md 的变更
