## ADDED Requirements

### Requirement: CLI command — pilot status

The system SHALL provide a `pilot status` subcommand to display the current execution status of a project.

#### Scenario: Status display format
- **WHEN** user runs `pilot status --project <dir>`
- **THEN** system SHALL display a table with columns:
  - Task ID (e.g., "1.1")
  - Status: colored badge (green=completed, yellow=running, red=failed, gray=skipped, white=pending)
  - Retries (e.g., "1/3")
  - Tokens used (e.g., "45K / 100K")
  - Duration (e.g., "2m 30s")
  - Error (short error message, or "-" if none)

#### Scenario: Status with all tasks complete
- **WHEN** all tasks are completed
- **THEN** system SHALL display summary line:
  - Total tasks, completed count, failed/skipped count
  - Total duration
  - Total tokens consumed
  - Overall status badge

#### Scenario: Status without active run
- **WHEN** user runs `pilot status` and no pilot daemon is running or state file exists
- **THEN** system SHALL print "No pilot run found for this project"

#### Scenario: Status without --project flag
- **WHEN** user runs `pilot status` without `--project`
- **THEN** system SHALL use the current working directory as the project

### Requirement: CLI command — pilot log

The system SHALL provide a `pilot log` subcommand to view execution logs.

#### Scenario: View full logs
- **WHEN** user runs `pilot log --project <dir>`
- **THEN** system SHALL display all task logs concatenated in chronological order
- **THEN** each log entry SHALL be prefixed with: `[<task-id>] <timestamp>` 

#### Scenario: Filter by task
- **WHEN** user runs `pilot log --project <dir> --task 1.3`
- **THEN** system SHALL display logs only for the specified task

#### Scenario: Follow mode (tail -f)
- **WHEN** user runs `pilot log --project <dir> --follow` (or `-f`)
- **THEN** system SHALL stream new log entries in real-time as they are written
- **THEN** system SHALL exit on Ctrl+C

#### Scenario: Log file location
- **WHEN** pilot starts
- **THEN** system SHALL write task logs to `<project>/.deepstorm/pilot-logs/<task-id>.log`
- **THEN** system SHALL create a combined log at `<project>/.deepstorm/pilot-logs/combined.log`

#### Scenario: Log not found
- **WHEN** user requests logs for a task that has no log file
- **THEN** system SHALL print "No logs found for task <task-id>"

### Requirement: CLI command — pilot stop

The system SHALL provide a `pilot stop` subcommand to gracefully stop a running pilot daemon.

#### Scenario: Stop running pilot
- **WHEN** user runs `pilot stop --project <dir>`
- **THEN** system SHALL read the daemon PID from `.pilot.lock`
- **THEN** system SHALL send SIGTERM to the daemon process
- **THEN** system SHALL wait up to 30 seconds for graceful shutdown
- **THEN** system SHALL print "Pilot stopped" on success

#### Scenario: Stop on no lock file
- **WHEN** user runs `pilot stop` and no `.pilot.lock` file exists
- **THEN** system SHALL print "No pilot daemon running for this project"
- **THEN** system SHALL exit with code 0

#### Scenario: Stop on stale lock
- **WHEN** lock file exists but PID is not alive
- **THEN** system SHALL remove the stale lock file
- **THEN** system SHALL print "No running pilot daemon found — stale lock cleaned up"

#### Scenario: Force stop
- **WHEN** user runs `pilot stop --project <dir> --force` (or `-f`)
- **THEN** system SHALL send SIGKILL to the daemon process
- **THEN** system SHALL clean up lock file and state

### Requirement: CLI command — pilot resume

The system SHALL provide a `pilot resume` subcommand to re-run previously skipped or failed tasks.

#### Scenario: Resume all failed tasks
- **WHEN** user runs `pilot resume --project <dir>`
- **THEN** system SHALL read state file to find all tasks with status `failed` or `skipped`
- **THEN** system SHALL reset those tasks to `pending`
- **THEN** system SHALL clear their retry counters
- **THEN** system SHALL start execution from the first previously-failed task

#### Scenario: Resume specific task
- **WHEN** user runs `pilot resume --project <dir> --task 2.1`
- **THEN** system SHALL reset only the specified task to `pending`
- **THEN** system SHALL clear its retry counter
- **THEN** system SHALL start execution from that task

#### Scenario: Resume with no failed tasks
- **WHEN** user runs `pilot resume` and no tasks are `failed` or `skipped`
- **THEN** system SHALL print "No tasks to resume"
- **THEN** system SHALL exit with code 0

#### Scenario: Resume requires stopped daemon
- **WHEN** user runs `pilot resume` while a pilot daemon is still running
- **THEN** system SHALL print "Pilot daemon is still running — stop it first with `pilot stop`"
- **THEN** system SHALL refuse to resume

### Requirement: CLI command — pilot list

The system SHALL provide a `pilot list` subcommand to show all projects that have pilot state.

#### Scenario: List all projects
- **WHEN** user runs `pilot list`
- **THEN** system SHALL scan known locations for `pilot-state.json` files
- **THEN** system SHALL display a table: project path, status, tasks completed/total, last updated

#### Scenario: No projects found
- **WHEN** user runs `pilot list` and no state files exist
- **THEN** system SHALL print "No pilot projects found"

### Requirement: Summary report on completion

The system SHALL produce a structured summary report when all tasks are completed or when the run is stopped.

#### Scenario: Completion report
- **WHEN** all tasks complete, or run is stopped
- **THEN** system SHALL write a summary to `<project>/.deepstorm/pilot-summary.md`
- **THEN** summary SHALL include:
  - Run overview (start time, end time, total duration)
  - Success/fail/skip counts
  - Per-task status list
  - Total tokens consumed
  - Failed tasks detail (error type, error message)
  - Resume instructions for failed tasks
