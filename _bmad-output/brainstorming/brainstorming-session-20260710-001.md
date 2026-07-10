# Brainstorming Session — reef-style-backend 缺失 LLM 代码风格规则

- **日期：** 2026-07-10
- **主题：** Checkstyle NeedBraces 与未使用变量警告，LLM 生成代码反复触发
- **参与角色：** User (Dev) / Claude (AI)

## 讨论内容

### 问题描述

ChatBI 项目（使用 reef 脚手架 + Java 后端）的 Checkstyle 构建检查中反复出现两类警告：

1. **`'if' 结构必须使用大括号 '{}'`**（`NeedBraces`）
   - Checkstyle 配置了 `NeedBraces`（`LITERAL_DO, LITERAL_ELSE, LITERAL_FOR, LITERAL_IF, LITERAL_WHILE`）
   - LLM 生成的代码常省略单行 `if` 的大括号，如 `if (text == null) return type + " <null>";`
   - 人工修复后，下次 LLM 写出同样的模式

2. **`The value of the local variable ignored is not used`**
   - Java 编译器警告未使用的局部变量
   - switch pattern 中 LLM 写上命名变量（如 `case UserMessage ignored ->`）但未使用
   - Java 21+ 提供了匿名模式变量 `_`，LLM 不主动使用

### 根因分析

`reef-style-backend` 的 `quick-reference.md`（LLM 编码规范速查）的「LLM 常犯错误」章节覆盖了 `var` 声明、字符串格式化、多态替代 `instanceof`，但**没有包含 NeedBraces 和未使用变量规则**。

LLM 加载技能后，按规则写代码时看不到这两条约束，自然回退到默认行为（省略大括号、用命名变量而非 `_`）。

### 需要补充的规则

#### 规则一：所有控制流语句必须使用大括号

```
所有 if / else / for / while / do 必须使用大括号 {}
禁止省略大括号的单行体
对应 Checkstyle NeedBraces 规则
```

覆盖：`if`、`else`、`for`、`while`、`do` 的所有分支体。

#### 规则二：禁止声明未被使用的局部变量

```
不要声明未被使用的局部变量
switch pattern 中用 _（匿名模式变量）代替命名变量
对应 Eclipse JDT 未使用变量警告
```

覆盖：未使用的局部变量、未使用的 switch 模式变量。

### 影响范围

| 项目 | 影响 |
|------|------|
| `packages/reef/skills/reef-style-backend/variants/java/quick-reference.md` | Java 变体的 LLM 常犯错误章节 |
| `packages/reef/skills/reef-style-backend/variants/python/quick-reference.md` | Python 变体（如果适用） |
| `CLI 同步` | `deepstorm update` 需将变更传播到安装副本和 playground |

### 后续步骤

1. 在 `reef-style-backend` 走 OpenSpec 流程，创建一个 change
2. 更新 `variants/java/quick-reference.md` 的「LLM 常犯错误」章节
3. 同步更新 `.deepstorm` 和 `playground` 的安装副本
4. 验证：加载技能后 LLM 生成代码不再触发 NeedBraces 和未使用变量警告
