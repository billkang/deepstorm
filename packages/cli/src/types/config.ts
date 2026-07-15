/**
 * 存储在 .deepstorm/settings.json 中的 DeepStorm 配置和安装记录。
 *
 * 三层配置体系：
 *   1. CLAUDE.md — 行为规则和工程约定
 *   2. .deepstorm/settings.json — DeepStorm 项目配置（本文件）
 *   3. .claude/settings.json — Claude Code 原生配置（mcpServers, sandbox 等）
 */

/** DeepStorm 根配置命名空间 */
export interface DeepStormConfig {
  /** 配置格式版本，用于结构变更时的自动迁移判断 */
  configVersion?: number

  /** 用户配置值，按工具组织 */
  tide?: TideConfig
  reef?: ReefConfig
  sweep?: SweepConfig
  atoll?: AtollConfig

  /** 安装记录 */
  installedSkills?: string[]
  installedAgents?: string[]
  installedMcpServers?: string[]
  installedHooks?: string[]
  installedAt?: string

  /** 统一 MCP 能力映射 — 所有 skill 从此处读取 MCP 服务可用性 */
  mcpCapabilities?: Record<string, { available: boolean; providers: Array<{ id: string; label: string }> }>
}

export interface TideConfig {
  issueTracker?: 'jira' | 'none'
}

export interface ReefConfig {
  frontend?: {
    framework?: 'angular' | 'react' | 'none'
    /** TypeScript 配置模式 */
    tsConfig?: 'strict' | 'standard' | 'none'
    /** CSS 方案 */
    css?: 'tailwind' | 'none'
    /** 前端测试框架 */
    test?: 'vitest' | 'none'
  }
  backend?: {
    language?: 'java' | 'none'
    /** Java 子维度（language === 'java' 时有效） */
    java?: {
      /** Java Web 框架 */
      framework?: 'spring-boot' | 'none'
      /** ORM 框架 */
      orm?: 'hibernate' | 'none'
      /** 数据库迁移工具 */
      dbMigration?: 'liquibase' | 'none'
      /** AI 框架 */
      ai?: 'spring-ai' | 'none'
      /** 单元测试框架 */
      test?: 'junit5' | 'none'
    }
  }
}

export interface SweepConfig {
  ciProvider?: 'github-actions' | 'gitlab-ci' | 'jenkins' | 'none'
}

export interface AtollConfig {
  deployTarget?: 'kubernetes' | 'docker' | 'serverless' | 'none'
}
