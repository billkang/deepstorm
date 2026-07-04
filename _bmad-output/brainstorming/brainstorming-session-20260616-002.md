---
stepsCompleted: [1]
inputDocuments: []
session_topic: 'reef 单元测试规范体系设计'
session_goals: '设计一组可组合的单元测试规范 MD 文档体系，解决语言×测试框架×ORM×业务框架的组合爆炸问题，服务于 code-gen 和 code-review'
selected_approach: A + C（分层正交 + 参考实现差异点）
techniques_used:
  - 分层拆解（Layer 0-3）
  - 渐进式聚焦
  - 正交子维度划分
ideas_generated:
  - 分层正交模型（L0通用哲学 → L1语言层 → L2测试框架层 → L3框架集成层）
  - L0写在SKILL.md.tmpl中（前后端各自一份，5-8行可接受重复）
  - L1语言相关约定（文件命名、目录结构、断言风格）放在各L2 fragment开头
  - 自动推导机制：用户选完框架自动挂载对应测试fragment
  - 扁平化目录结构：fragments/java/test/ 下各维度并列
  - 参考策略：JUnit5+Spring Boot+Hibernate 写完整参考，其他框架由LLM adaptive
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Billkang
**Date:** 2026-06-16

## Session Overview

**Topic:** reef 单元测试规范体系设计

**Goals:** 设计一组可组合的单元测试规范 MD 文档体系，解决语言×测试框架×ORM×业务框架的组合爆炸问题，服务于 code-gen 和 code-review

### Problem Context

- Java 语言有多种单元测试框架（JUnit、TestNG 等），每种写法不同
- 选定 Java 后还有不同的 ORM 框架（Hibernate、MyBatis 等）、业务框架（Spring 等），每个组合的测试写法不同
- 前端也有同样的问题（不同框架 × 不同测试框架）
- 当前产生 N×M 的组合问题，没有统一解耦方式
- 目标是"规范可组合"——语言规范 + 测试框架规范 + 框架集成规范 = 按需拼装

## Discussion Summary

### 分层模型（Layer 0-3）

| 层级 | 内容 | 说明 |
|------|------|------|
| L0 通用哲学 | 测试金字塔、FIRST 原则、AAA 模式、命名规范基调 | 内化在每个 L2 fragment 的 quick-reference.md 顶部 |
| L1 语言层 | 目录结构、测试文件命名、基础断言风格 | Java/TypeScript/Go 各有一份 |
| L2 测试框架层 | JUnit5、Vitest 等各自独立 fragment | 生命周期、参数化、mock 策略 |
| L3 框架集成层（测试视角） | Spring MVC 测试、Service 测试、DataJPA 测试等正交子维度 | 按用户选中的框架自动推导挂载 |

### 后端 L3 正交子维度

| 子维度 | 覆盖内容 | 触发条件 |
|--------|---------|---------|
| `spring-mvc-test/` | `@WebMvcTest` + `MockMvc` | 选了 Spring Boot |
| `spring-service-test/` | `@SpringBootTest` + `@Transactional` | 选了 Spring Boot |
| `data-jpa-test/` | `@DataJpaTest` + Testcontainers | 选了 Hibernate |
| `data-mybatis-test/` | `@MybatisTest` + H2 | (future) 选了 MyBatis |

### 前端 L3 子维度

| 子维度 | 说明 | 状态 |
|--------|------|------|
| `vitest/` | Vitest 测试规范 + Angular Testing Library | 一期实现 |
| `component-test/` | 组件测试子维度 | future |
| `service-test/` | 服务测试子维度 | future |
| `e2e-test/` | Playwright E2E | 暂不实现 |

### L0 通用哲学方案

选定 **SKILL.md.tmpl 写死方案**：L0（测试金字塔、FIRST、AAA）约 5-8 行直接写在后端和前端 SKILL.md.tmpl 中。

理由：
- 真正的跨语言 L0 内容极少（5-8 行），不值得单独建 fragment
- 加上新语言（Python 等）时，L0 文件命名/目录结构等规则实际属于 L1，不是真跨语言
- 前后端各一份的重复（5-8 行）是可接受的
- 加新语言时只需在 fragment 中描述 L1 相关内容，不必动 L0

### 自动推导规则

用户选择技术栈后，系统自动推导需要加载的测试 fragment。不需要用户额外选择。

| 用户选择 | 自动加载 |
|----------|---------|
| JUnit5 | `junit5/` |
| Spring Boot | `spring-mvc-test/` + `spring-service-test/` |
| Hibernate | `data-jpa-test/` |
| Vitest | `vitest/` |

### 参考策略

- 以 JUnit5 + Spring Boot + Hibernate 为完整参考规范
- 注释充分说明"为什么这么写"
- LLM 读后对其他框架（MyBatis、TestNG 等）进行 adaptive 输出
- 规范格式对齐现有的 quick-reference.md + examples/ 结构

### 项目级 Override（L4）

当前不做，作为 future 方向。后续支持后允许项目层覆盖上层规范。

### 目录结构

```
packages/reef/skills/reef-style-backend/
├── SKILL.md.tmpl                    ← L0（5-8行）写死在此
└── fragments/java/test/
    ├── junit5/
    │   ├── quick-reference.md       ← L1约定（命名/目录/断言）+ L2 JUnit5规范
    │   └── examples/
    ├── spring-mvc-test/
    │   └── quick-reference.md       ← L3 @WebMvcTest规范（L0来自模板）
    ├── spring-service-test/
    │   └── quick-reference.md       ← L3 @SpringBootTest规范
    └── data-jpa-test/
        ├── quick-reference.md       ← L3 @DataJpaTest规范
        └── examples/

packages/reef/skills/reef-style-frontend/
├── SKILL.md.tmpl                    ← L0（5-8行）写死在此
└── fragments/test/
    └── vitest/
        ├── quick-reference.md       ← L1约定 + L2 Vitest规范
        └── examples/
```

### 一期范围

- 后端：junit5/ + spring-mvc-test/ + spring-service-test/ + data-jpa-test/
- 前端：vitest/（基于已有内容扩写，补充 L0 通用原则和 examples）
- 后端 SKILL.md.tmpl 加入 test dimension
- wizard.json 加入测试维度的自动推导规则
