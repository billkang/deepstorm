## ADDED Requirements

### Requirement: Per-task retry with maximum attempts

The system SHALL retry failed tasks up to a configurable maximum number of attempts.

#### Scenario: Retry on recoverable failure
- **WHEN** a task fails with a recoverable error type
- **THEN** system SHALL increment the task's `retries` counter
- **THEN** system SHALL check if `retries < maxRetries`
- **THEN** if under limit, system SHALL restart the task from scratch
- **THEN** system SHALL clear the task's previous output and log

#### Scenario: Max retries exceeded
- **WHEN** a task has exhausted its `maxRetries` (default: 3)
- **THEN** system SHALL mark task status as `failed`
- **THEN** system SHALL set error type to `max_retries_exceeded`
- **THEN** system SHALL move to the next task

#### Scenario: Retry count persistence
- **WHEN** retry counter is updated
- **THEN** system SHALL persist the updated count to state store immediately
- **THEN** on recovery from crash, retry count SHALL be preserved

### Requirement: Same-error fingerprint detection

The system SHALL detect when a retry produces the same error as a previous attempt, preventing pointless retries.

#### Scenario: Error fingerprint generation
- **WHEN** a task fails
- **THEN** system SHALL generate an MD5 fingerprint from the error message and error type
- **THEN** fingerprint SHALL be stored in the task's `errorFingerprint` field
- **THEN** fingerprint SHALL also be recorded in the global `errors` array

#### Scenario: Same fingerprint blocks retry
- **WHEN** a retry attempt produces an error with the same fingerprint as a previous attempt
- **THEN** system SHALL stop retrying immediately (even if under maxRetries)
- **THEN** system SHALL mark task status as `failed`
- **THEN** system SHALL set error type to `unrecoverable_error`
- **THEN** system SHALL record "Error repeated despite retry — same fingerprint detected" in error detail

#### Scenario: Fingerprint comparison scope
- **WHEN** comparing fingerprints
- **THEN** system SHALL compare against all prior attempts of the same task only
- **THEN** system SHALL NOT cross-compare fingerprints between different tasks

### Requirement: Error type classification

The system SHALL classify errors into distinct types, each with different retry behavior.

#### Scenario: Compilation/syntax error — retryable
- **WHEN** claude process output contains compilation errors, syntax errors, or TypeScript build failures
- **THEN** system SHALL classify as error type `compilation`
- **THEN** system SHALL treat `compilation` errors as retryable (AI can self-correct)

#### Scenario: Test failure — retryable (limited)
- **WHEN** claude process output contains test failures
- **THEN** system SHALL classify as error type `test_failure`
- **THEN** system SHALL treat `test_failure` as retryable
- **THEN** system SHALL reduce maxRetries to 2 for test failures (test failures after retry likely indicate logic errors)

#### Scenario: Token overbudget — skip, no retry
- **WHEN** task exceeds token budget
- **THEN** system SHALL classify as error type `token_overbudget`
- **THEN** system SHALL mark task as `skipped`
- **THEN** system SHALL NOT retry (retry would consume more tokens)

#### Scenario: Timeout — retryable
- **WHEN** task times out
- **THEN** system SHALL classify as error type `timeout`
- **THEN** system SHALL treat `timeout` as retryable (next attempt may be faster)
- **THEN** system SHALL add exponential backoff before retry

#### Scenario: Dead loop — not retryable
- **WHEN** system detects repeated same-output pattern
- **THEN** system SHALL classify as error type `dead_loop`
- **THEN** system SHALL NOT retry
- **THEN** system SHALL mark task as `failed`
- **THEN** system SHALL record "Dead loop detected — task requires manual intervention" in error detail

#### Scenario: Claude CLI crash/exit — retryable
- **WHEN** claude process exits with non-zero code unexpectedly
- **THEN** system SHALL classify as error type `process_crash`
- **THEN** system SHALL treat `process_crash` as retryable
- **THEN** system SHALL add backoff delay before retry

### Requirement: Exponential backoff between retries

The system SHALL wait an increasing amount of time between retry attempts.

#### Scenario: Backoff formula
- **WHEN** a retry is triggered
- **THEN** system SHALL wait `baseDelay * 2^attempt` milliseconds before spawning
- **THEN** baseDelay SHALL be 10 seconds by default
- **THEN** maximum backoff SHALL be capped at 5 minutes

#### Scenario: Backoff configuration
- **WHEN** pilot run starts
- **THEN** system SHALL read backoff settings from `<project>/.deepstorm/pilot.config.json`
- **THEN** supported configuration: `retryBaseDelay` (seconds), `retryMaxDelay` (seconds)

### Requirement: Token budget hard cap per task

The system SHALL enforce a hard upper limit on token consumption per task.

#### Scenario: Budget derivation
- **WHEN** a task begins execution
- **THEN** system SHALL calculate token budget as: configurable expected_tokens × 3
- **THEN** default expected_tokens SHALL be 100,000
- **THEN** budget SHALL persist across retries (retry counts against same budget, not fresh each time)

#### Scenario: Budget config per project
- **WHEN** `pilot.config.json` contains `defaultTokenBudget`
- **THEN** system SHALL use that value instead of the 100K default
- **THEN** system SHALL allow per-task budget override via `tokenBudget` in config
