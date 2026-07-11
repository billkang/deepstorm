## MODIFIED Requirements

### Requirement: CLI command — pilot run

The system SHALL provide a `pilot run` CLI subcommand under `@deepstorm/cli` that starts the automated OpenSpec task execution for a given project.

#### Scenario: Basic run invocation

- **WHEN** user runs `pilot run --project /path/to/project`
- **THEN** system SHALL find the first active change via `findFirstActiveChange()`
- **THEN** system SHALL read the change's OpenSpec artifacts (tasks.md, specs/, design.md) from `openspec/changes/<name>/`
- **THEN** system SHALL start executing tasks in serial order

#### Scenario: Run with explicit change name

- **WHEN** user runs `pilot run --project /path/to/project --tasks my-feature`
- **THEN** system SHALL look up the change via `findChangeByName(projectDir, "my-feature")`
- **THEN** system SHALL use that change's artifacts instead of auto-discovering

#### Scenario: Change not found

- **WHEN** user runs `pilot run --tasks nonexistent` and no matching change exists
- **THEN** system SHALL print an error indicating the change was not found
- **THEN** system SHALL exit with non-zero code

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
