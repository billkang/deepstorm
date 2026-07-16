## ADDED Requirements

### Requirement: CLI command — pilot run

The system SHALL provide a `pilot run` CLI subcommand under `@deepstorm/cli` that starts the automated OpenSpec task execution for a given project.

#### Scenario: Basic run invocation
- **WHEN** user runs `pilot run --project /path/to/project`
- **THEN** system SHALL read the project's OpenSpec artifacts (tasks.md, specs/, design.md) from the standard OpenSpec structure
- **THEN** system SHALL start executing tasks in serial order

#### Scenario: Run with explicit tasks file
- **WHEN** user runs `pilot run --project /path/to/project --tasks /path/to/tasks.md`
- **THEN** system SHALL use the specified tasks file instead of default `tasks.md`

#### Scenario: Run from current directory
- **WHEN** user runs `pilot run` without `--project`
- **THEN** system SHALL use the current working directory as the project

#### Scenario: Detached daemon mode
- **WHEN** user runs `pilot run --project /path --detach` (or `-d`)
- **THEN** system SHALL fork the pilot process into background daemon mode
- **THEN** system SHALL return control to the terminal immediately
- **THEN** system SHALL print the daemon PID for management

#### Scenario: Foreground mode
- **WHEN** user runs `pilot run --project /path` without `--detach`
- **THEN** system SHALL keep the process in foreground
- **THEN** system SHALL stream task progress to stdout in real-time
- **THEN** system SHALL support graceful shutdown on Ctrl+C (SIGINT)

### Requirement: Singleton lock — PID file

The system SHALL prevent duplicate pilot daemon processes from running on the same project simultaneously.

#### Scenario: First run creates lock
- **WHEN** pilot run starts on a project for the first time
- **THEN** system SHALL create a `.pilot.lock` file in the project's `.deepstorm/` directory
- **THEN** lock file SHALL contain the daemon PID

#### Scenario: Duplicate run rejected
- **WHEN** user runs `pilot run` on a project that already has a running pilot daemon
- **THEN** system SHALL detect the existing lock file
- **THEN** system SHALL verify the PID in lock file is still alive
- **THEN** system SHALL print error "Pilot already running on this project (PID: <pid>)"
- **THEN** system SHALL exit with non-zero code

#### Scenario: Stale lock cleanup
- **WHEN** user runs `pilot run` and lock file exists but the recorded PID is no longer alive
- **THEN** system SHALL remove the stale lock file
- **THEN** system SHALL create a new lock file with current PID
- **THEN** system SHALL proceed with normal execution

#### Scenario: Lock release on clean shutdown
- **WHEN** pilot daemon shuts down gracefully
- **THEN** system SHALL remove the `.pilot.lock` file

### Requirement: Claude process spawn

The system SHALL spawn a `claude` CLI process for each project, using the existing local Claude Code CLI configuration.

#### Scenario: Claude CLI spawn
- **WHEN** pilot starts task execution
- **THEN** system SHALL spawn `claude` CLI via child_process.spawn
- **THEN** system SHALL pass the project directory as the working directory
- **THEN** system SHALL inherit the project's environment variables (including API keys from `.env`)

#### Scenario: Claude process isolation
- **WHEN** multiple pilot processes run on different projects
- **THEN** each SHALL have its own independent `claude` child process
- **THEN** processes SHALL NOT share state or interfere with each other

#### Scenario: Claude process stdin/stdout handling
- **WHEN** `claude` process requires input confirmation
- **THEN** system SHALL automatically send "yes" or appropriate default responses to unblock execution
- **THEN** system SHALL capture stdout/stderr for log storage

### Requirement: Process lifecycle management

The system SHALL manage the full lifecycle of the claude child process.

#### Scenario: Process start
- **WHEN** pilot begins task execution for a project
- **THEN** system SHALL spawn claude process with correct working directory and environment

#### Scenario: Graceful shutdown
- **WHEN** pilot receives SIGTERM or SIGINT
- **THEN** system SHALL forward the signal to the claude child process
- **THEN** system SHALL wait for child process to exit (with timeout)
- **THEN** system SHALL save current state to state store
- **THEN** system SHALL release the singleton lock

#### Scenario: Force kill on timeout
- **WHEN** claude child process does not exit within 30 seconds of receiving SIGTERM
- **THEN** system SHALL send SIGKILL to the child process

#### Scenario: Unexpected child exit
- **WHEN** claude child process exits unexpectedly (crash/error)
- **THEN** system SHALL record the exit code and signal in state store
- **THEN** system SHALL trigger retry-failover logic if the current task is retryable
