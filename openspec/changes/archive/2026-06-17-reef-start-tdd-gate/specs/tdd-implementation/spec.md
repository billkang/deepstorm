## ADDED Requirements

### Requirement: Implementation SHALL use TDD (RED → GREEN → REFACTOR) for code changes
During the implementation phase, the AI SHALL follow the TDD cycle (RED → GREEN → REFACTOR) for each task that involves code behavior changes. Configuration, documentation, SKILL.md template, and shell script tasks are exempt.

#### Scenario: Implementing a code change task
- **WHEN** the AI processes a task that involves writing or modifying TypeScript, Java, Python, or any other production code
- **THEN** the AI SHALL: first write a failing test (RED), then write the minimum code to pass the test (GREEN), then refactor while keeping tests green (REFACTOR), and repeat for each code-change task

#### Scenario: Implementing a configuration task
- **WHEN** the AI processes a task that involves only package.json, .env, JSON configuration, markdown documentation, README, shell scripts, or SKILL.md templates
- **THEN** the AI MAY implement directly without TDD

### Requirement: AI SHALL judge each task's TDD applicability
Before each task implementation, the AI SHALL evaluate whether the task involves code behavior changes and decide whether TDD applies.

#### Scenario: Task type judgment
- **WHEN** the AI reads a task from `tasks.md`
- **THEN** the AI SHALL classify it as either "code change requires TDD" (TypeScript/Java/Python/etc.) or "exempt from TDD" (config/doc/SKILL.md/shell), based on the task type judgment table in Phase 4 of the SKILL.md

### Requirement: AI SHALL handle missing test framework
If the test framework is not yet set up for the project, the AI SHALL bootstrap the framework first (non-TDD), then use TDD for all subsequent code tasks.

#### Scenario: No test framework exists
- **WHEN** the first code-change task encounters a project without a test framework
- **THEN** the AI SHALL first create the test framework infrastructure (this step is exempt from TDD), then use TDD for all subsequent code tasks

### Requirement: Completed tasks SHALL be marked and regression-checked
After each task completes, the AI SHALL update `tasks.md` and run the full test suite.

#### Scenario: Task done
- **WHEN** a task's implementation cycle (RED → GREEN → REFACTOR, or direct implementation for exempt types) is complete
- **THEN** the AI SHALL tick the checkbox in `tasks.md` (change `- [ ]` to `- [x]`), run the full test suite to confirm no regression, and proceed to the next task

### Requirement: Blocked tasks SHALL pause and ask the user
If the AI encounters a blocking issue or ambiguous requirement during implementation, it SHALL stop and ask the user for clarification.

#### Scenario: Encountering blocked task
- **WHEN** the AI cannot determine the correct implementation approach for a task due to insufficient information or conflicting requirements
- **THEN** the AI SHALL pause implementation and ask the user for guidance before proceeding
