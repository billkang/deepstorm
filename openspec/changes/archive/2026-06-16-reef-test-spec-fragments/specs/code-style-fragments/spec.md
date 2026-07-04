# code-style-fragments Specification

## Purpose

This is a delta spec for the existing `code-style-fragments` capability. Updates are limited to adding test as a new recognized dimension in the code-style fragment system.

## ADDED Requirements

### Requirement: 测试维度作为 code-style 新维度

测试 SHALL 作为 code-style fragment 体系中的新维度被支持，与 framework、ORM、AI 等同级。

#### Scenario: 后端测试维度
- **WHEN** code-style fragment 系统识别测试维度
- **THEN** 后端 SHALL 识别 `backend.java.test` 作为新的子维度路径
- **THEN** `backend.java.test` SHALL 包含 `styleRef` 字段，指向 `fragments/java/test/` 下的对应 fragment
- **THEN** `backend.java.test` SHALL 支持自动推导：根据已选 `framework` 和 `orm` 选项自动设置 test sub-options

#### Scenario: 前端测试维度
- **WHEN** code-style fragment 系统识别前端测试维度
- **THEN** 前端已有 `frontend.test` 配置项 SHALL 扩展为支持自动推导：
  - 当用户选择 Vitest 时，`frontend.test.styleRef` 自动指向 `fragments/test/vitest/`
