## ADDED Requirements

### Requirement: Process heartbeat monitoring

The system SHALL periodically verify that the claude child process is alive and responsive.

#### Scenario: Regular heartbeat check
- **WHEN** pilot daemon is running
- **THEN** system SHALL check child process status every 30 seconds
- **THEN** monitoring SHALL verify process is not a zombie (no exit code received)

#### Scenario: Heartbeat failure detection
- **WHEN** child process is detected as dead (exited)
- **THEN** system SHALL record exit code and signal in state store
- **THEN** system SHALL trigger retry-failover logic for the current task

#### Scenario: Process alive log
- **WHEN** heartbeat check passes
- **THEN** system SHALL log a heartbeat tick at debug level (not shown in normal status)
- **THEN** system SHALL update `lastHeartbeat` timestamp in the daemon's runtime state

### Requirement: Task-level token consumption monitoring

The system SHALL track token consumption per task to prevent runaway costs.

#### Scenario: Token tracking on claude output
- **WHEN** claude process produces output with token usage information
- **THEN** system SHALL parse and accumulate token counts for the current task
- **THEN** system SHALL update `tokensUsed` in the task's state object

#### Scenario: Token budget enforcement
- **WHEN** a task's `tokensUsed` exceeds its `tokenBudget`
- **THEN** system SHALL stop the current task immediately
- **THEN** system SHALL mark task status as `skipped`
- **THEN** system SHALL set error type to `token_overbudget`
- **THEN** system SHALL record remaining token budget and actual usage in error detail
- **THEN** system SHALL proceed to the next task

#### Scenario: Token budget configuration
- **WHEN** pilot run starts
- **THEN** system SHALL derive each task's token budget from:
  - Default budget (configurable, e.g., 100K tokens per task)
  - Multiplied by 3 for the hard cap
- **THEN** system SHALL allow per-project override via `pilot.config.json`

#### Scenario: Total run token limit
- **WHEN** total tokens across all tasks exceed a configurable maximum
- **THEN** system SHALL stop execution after the current task completes
- **THEN** system SHALL mark remaining tasks as `skipped` with reason `total_budget_exceeded`

### Requirement: Execution timeout

The system SHALL enforce a maximum execution time per task.

#### Scenario: Per-task timeout
- **WHEN** a task runs longer than the configured timeout (default: 30 minutes)
- **THEN** system SHALL send SIGTERM to the claude child process
- **THEN** system SHALL mark task status as `failed`
- **THEN** system SHALL set error type to `timeout`
- **THEN** system SHALL trigger retry-failover logic

#### Scenario: Timeout configuration
- **WHEN** pilot run starts
- **THEN** system SHALL read timeout settings from `<project>/.deepstorm/pilot.config.json`
- **THEN** if not configured, system SHALL use default timeout of 30 minutes per task

### Requirement: Silence detection

The system SHALL detect when the claude process has stopped producing output for an extended period.

#### Scenario: Output silence timeout
- **WHEN** claude child process produces no new output for the silence threshold (default: 5 minutes)
- **THEN** system SHALL log a warning
- **THEN** system SHALL send SIGTERM to the claude child process
- **THEN** system SHALL mark task status as `failed` with error type `silence_timeout`
- **THEN** system SHALL trigger retry-failover logic

#### Scenario: Silence threshold configuration
- **WHEN** pilot run starts
- **THEN** system SHALL read silence threshold from `<project>/.deepstorm/pilot.config.json`
- **THEN** if not configured, system SHALL use default threshold of 5 minutes

### Requirement: Terminated process detection (dead loop)

The system SHALL detect when the claude process enters a non-productive state (e.g., dead loop, repeated same tool calls).

#### Scenario: Dead loop detection via same-output pattern
- **WHEN** claude process produces identical output (same log segment) 3 consecutive times
- **THEN** system SHALL detect the repeating pattern by comparing output fingerprints
- **THEN** system SHALL send SIGTERM to the claude child process
- **THEN** system SHALL mark task status as `failed` with error type `dead_loop`
- **THEN** system SHALL NOT retry this task (dead loop is non-recoverable)

#### Scenario: Dead loop detection via log stagnation
- **WHEN** claude process has produced new output but the output content has not changed semantic state for 3 consecutive heartbeat cycles
- **THEN** system SHALL flag as potential dead loop
- **THEN** after confirmation (2 more cycles), system SHALL terminate and mark as `dead_loop`
