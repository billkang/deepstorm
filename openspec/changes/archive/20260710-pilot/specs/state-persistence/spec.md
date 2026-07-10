## ADDED Requirements

### Requirement: State store file format

The system SHALL persist execution state to a JSON file for crash recovery and status queries.

#### Scenario: State file location
- **WHEN** pilot starts on a project
- **THEN** system SHALL create/read state from `<project>/.deepstorm/pilot-state.json`

#### Scenario: State file structure
- **WHEN** state store is initialized
- **THEN** the JSON structure SHALL contain:
  - `project`: project path (string)
  - `startedAt`: ISO 8601 timestamp of pilot start
  - `updatedAt`: ISO 8601 timestamp of last state update
  - `pilotVersion`: @deepstorm/pilot version string
  - `tasks`: array of task state objects
  - `errors`: array of error records

#### Scenario: Task state object structure
- **WHEN** a task is recorded in state
- **THEN** each task object SHALL contain:
  - `id`: task identifier from tasks.md (string, e.g., "1.3")
  - `title`: short task description
  - `status`: one of `pending`, `running`, `completed`, `failed`, `skipped`
  - `retries`: number of retry attempts (integer)
  - `maxRetries`: maximum allowed retries (integer, default 3)
  - `tokenBudget`: token budget for this task (integer)
  - `tokensUsed`: actual tokens consumed (integer)
  - `startedAt`: ISO 8601 timestamp when task execution started
  - `completedAt`: ISO 8601 timestamp when task finished
  - `duration`: execution duration in milliseconds
  - `error`: error type if task failed/skipped (string)
  - `errorDetail`: detailed error message (string)
  - `errorFingerprint`: MD5 hash of error pattern for dedup detection (string)
  - `logPath`: relative path to task log file (string)

#### Scenario: Error record structure
- **WHEN** a non-recoverable error occurs
- **THEN** each error record SHALL contain:
  - `timestamp`: ISO 8601 timestamp
  - `type`: error classification (string)
  - `message`: human-readable error description
  - `fingerprint`: MD5 hash for dedup detection (string)
  - `taskId`: associated task identifier (string)

### Requirement: Atomic state updates

The system SHALL ensure state file writes are atomic to prevent corruption.

#### Scenario: Atomic write
- **WHEN** system updates the state store
- **THEN** system SHALL write to a temporary file first (e.g., `pilot-state.json.tmp`)
- **THEN** system SHALL rename the temp file to the target path atomically (fs.rename)

#### Scenario: Recovery from partial write
- **WHEN** system crashes mid-write
- **THEN** on next startup, system SHALL detect a stale temp file and ignore it
- **THEN** system SHALL read the last valid state file instead

### Requirement: Interrupt recovery

The system SHALL support recovery from interruption, resuming from the last non-completed task.

#### Scenario: Resume after crash
- **WHEN** user runs `pilot run --project <dir>` again after an interrupted run
- **THEN** system SHALL read `pilot-state.json` from the project
- **THEN** system SHALL identify the first task with status `pending`, `failed`, or `skipped`
- **THEN** system SHALL resume execution from that task
- **THEN** system SHALL record in state that this is a resumed run

#### Scenario: Running tasks become pending on restart
- **WHEN** system restarts after crash
- **THEN** any task with status `running` SHALL be reset to `pending`
- **THEN** system SHALL increment a `restartCount` counter in state
- **THEN** system SHALL log a warning about the restart

#### Scenario: Complete run state
- **WHEN** all tasks are completed
- **THEN** system SHALL set overall status to `completed` in state
- **THEN** system SHALL calculate and store summary statistics
  - Total duration
  - Total tokens consumed
  - Tasks completed vs failed/skipped count

### Requirement: State query interface

The system SHALL provide a programmatic interface to read state for the CLI dashboard.

#### Scenario: Read state by project
- **WHEN** user runs `pilot status --project <dir>`
- **THEN** system SHALL read and parse `pilot-state.json`
- **THEN** system SHALL return structured task status data for display

#### Scenario: State not found
- **WHEN** user runs `pilot status` on a project that has no state file
- **THEN** system SHALL print "No pilot run found for this project"
- **THEN** system SHALL exit with code 0 (informational, not error)
