## Why

Reef 的 code-style 体系目前缺少统一的单元测试规范。不同语言（Java/TypeScript）、不同测试框架（JUnit5/Vitest）、不同框架集成层（Spring Boot/Hibernate）的测试写法各不相同，现有测试相关内容散落在各个框架维度的 fragment 中且内容极浅（例如 JUnit5 fragment 只有基本注解表）。这导致 code-gen 产出的测试代码缺乏一致性，code-review 也没有明确的测试标准可循。

需要设计一套可组合的测试规范体系，按照"分层正交"模型解耦测试规范的各个维度，通过自动推导机制根据用户选中的技术栈组合出对应的测试规范。

## What Changes

- **新增测试维度**：在 code-style fragment 体系中将"测试"提升为一个正式的独立维度，与 framework/ORM/AI 同级
- **创建后端测试 fragments**：新增 junit5（增强）、spring-mvc-test、spring-service-test、data-jpa-test 四个 fragment，每个包含 quick-reference.md 和 examples/
- **增强前端测试 fragments**：在已有 vitest fragment 基础上补充 L0 通用原则和更完整的示例
- **SKILL.md.tmpl 更新**：后端和前端模板各加入 L0 测试通用原则（测试金字塔、FIRST、AAA），约 5-8 行
- **自动推导机制**：wizard.json 增加测试维度的自动挂载规则，用户选完框架后自动推导所需测试 fragment
- **L0 通用原则**：测试金字塔、FIRST 原则、AAA 模式直接写死在前后端 SKILL.md.tmpl 中，不单独建文件

## Capabilities

### New Capabilities
- `test-fragment-architecture`: 测试 fragment 的分层模型（L0-L3）、目录结构约定、fragment 间的组合规则和加载机制
- `backend-test-fragments`: 后端测试 fragments 规范，覆盖 JUnit5（L2）、Spring MVC 测试（L3）、Spring Service 测试（L3）、DataJPA 测试（L3）的编写要求
- `frontend-test-fragments`: 前端测试 fragments 规范，覆盖 Vitest 测试（L2）的编写要求

### Modified Capabilities
- `code-style-fragments`: 在已有 fragment 架构中加入 test 作为新的正交维度，定义其与其他维度（framework、ORM 等）的自动推导关系
- `config-management`: 新增测试维度的配置项（testRef、testFragments），以及在 wizard.json 中定义自动推导规则

## Impact

- `packages/reef/skills/reef-style-backend/`：新增 `fragments/java/test/` 目录及 4 个 fragment，更新 `SKILL.md.tmpl`
- `packages/reef/skills/reef-style-frontend/`：新增 `fragments/test/vitest/` 增强内容，更新 `SKILL.md.tmpl`
- `packages/cli/`：wizard.json 配置增加测试维度定义和自动推导规则
- `openspec/specs/code-style-fragments/`：已有 spec 需要更新
