# Intent Detection

## Purpose

在 UserPromptSubmit hook 阶段，通过轻量关键词匹配检测用户输入是否包含开发意图（新增功能、修复 bug、重构代码等），并在匹配时自动触发 reef-start skill 加载。

## ADDED Requirements

### Requirement: System SHALL detect development intent from user input

The system SHALL inspect every user message in a `before-read` hook to determine whether the message expresses a development-related intent (feature request, bug fix, refactoring, code modification, etc.).

#### Scenario: Detect feature request intent (Chinese)
- **WHEN** user inputs a message in Chinese that starts with or contains patterns like "我想加一个", "我需要一个", "加个功能", "实现一下", "帮我做个", "新增一个"
- **THEN** the system SHALL match this as development intent and prepare to invoke reef-start skill

#### Scenario: Detect feature request intent (English)
- **WHEN** user inputs a message in English that contains patterns like "add a", "implement", "build a", "create a", "new feature", "I need a"
- **THEN** the system SHALL match this as development intent

#### Scenario: Detect bug fix intent (Chinese)
- **WHEN** user inputs a message containing "bug", "修复", "修一下", "有问题", "不正常", "返回不对", "报错"
- **THEN** the system SHALL match this as development intent

#### Scenario: Detect bug fix intent (English)
- **WHEN** user inputs a message containing "fix", "bug", "issue", "broken", "error", "not working"
- **THEN** the system SHALL match this as development intent

#### Scenario: Detect refactoring intent (Chinese)
- **WHEN** user inputs a message containing "重构", "重写", "优化", "改造", "整理", "提取"
- **THEN** the system SHALL match this as development intent

#### Scenario: Detect refactoring intent (English)
- **WHEN** user inputs a message containing "refactor", "rewrite", "restructure", "clean up", "extract", "optimize"
- **THEN** the system SHALL match this as development intent

### Requirement: System SHALL NOT match non-development intent

The system MUST NOT match messages that are clearly not development-related, to avoid false positives.

#### Scenario: Pass through casual conversation
- **WHEN** user inputs casual non-development messages like "今天天气不错", "帮我查一下文档", "hello", "good morning", "npm install 报错了" (simple command troubleshooting)
- **THEN** the system SHALL NOT match as development intent and SHALL pass through without any intervention

#### Scenario: Pass through existing development commands
- **WHEN** user inputs an existing slash command like `/opsx:*`, `/bmad*`, `/reef-*`, `/review`, `/qa`
- **THEN** the system SHALL NOT re-trigger intent detection (already in a development flow)

### Requirement: Intent detection SHALL use keyword matching only

The detection mechanism MUST be lightweight keyword-based matching. No NLP model, external API calls, or heavy computation. This ensures zero latency impact on user experience.

#### Scenario: Keyword-based matching
- **WHEN** a user message is received
- **THEN** the system SHALL match against a predefined keyword list using substring/case-insensitive matching, without any NLP or ML inference

#### Scenario: No external dependencies
- **WHEN** the detection script runs
- **THEN** it SHALL NOT make any HTTP calls, API requests, or invoke any external services

### Requirement: Detection match SHALL trigger reef-start skill invocation

When a positive match is detected, the system SHALL inject an instruction into the AI's context that loads the `reef-start` skill via the Skill tool.

#### Scenario: Inject skill load instruction
- **WHEN** the system detects development intent
- **THEN** the hook SHALL output a message that causes the AI to invoke Skill("reef-start") or equivalent, with the user's original message carried through

#### Scenario: Preserve user's original message
- **WHEN** the hook triggers reef-start
- **THEN** the user's original message content MUST be preserved and passed to the reef-start skill as context

### Requirement: Matching rules SHALL be configurable

The keyword matching rules MUST be defined in a configuration file that can be modified by the user without changing the hook script itself.

#### Scenario: Config file with keyword lists
- **WHEN** the detection script runs
- **THEN** it SHALL read keyword patterns from a configuration file (e.g., `regex-list.json` or inline in hooks.json)

#### Scenario: User can extend keywords
- **WHEN** a user adds new keywords to the configuration
- **THEN** the detection SHALL include the new keywords without any code changes to the hook script

### Requirement: Detection SHALL yield to explicit user commands

If the user has already started a specific development flow (e.g., already in an OpenSpec change, already loaded reef-start), the detection SHALL NOT re-trigger.

#### Scenario: Already in a development session
- **WHEN** the user is currently in an active development flow (reef-start already loaded, or deepstorm-discuss already active)
- **THEN** the detection hook SHALL NOT re-inject reef-start instructions

#### Scenario: Explicit slash command used
- **WHEN** the user's message starts with a recognized slash command (/opsx, /reef, /bmad, /review, etc.)
- **THEN** the detection SHALL NOT trigger, allowing the normal slash command flow to proceed
