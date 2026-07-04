## ADDED Requirements

### Requirement: CLI version check and self-update
`deepstorm update` SHALL check the npm registry for the latest `@deepstorm/cli` version and automatically update if a newer version is available.

#### Scenario: New version available
- **WHEN** user runs `deepstorm update` and npm registry has a newer version of `@deepstorm/cli`
- **THEN** CLI SHALL display current version and latest version
- **THEN** CLI SHALL automatically run `npm install -g @deepstorm/cli@latest`
- **THEN** CLI SHALL display success message after update completes

#### Scenario: Network failure during version check
- **WHEN** user runs `deepstorm update` and network is unreachable during version check
- **THEN** CLI SHALL display error message and continue to skill sync without aborting

#### Scenario: Already on latest version
- **WHEN** user runs `deepstorm update` and current version matches npm latest
- **THEN** CLI SHALL display "已是最新版本" and proceed to skill sync

### Requirement: Incremental sync based on installed tools
`deepstorm update` SHALL read the deepstorm configuration from `.claude/settings.json` and only sync assets for tools and skills the user has explicitly installed.

#### Scenario: Sync only installed skills
- **WHEN** user runs `deepstorm update` and `deepstorm.installedSkills` contains `["tide-discuss", "reef-commit"]`
- **THEN** CLI SHALL only sync those two skills to `.claude/skills/`
- **THEN** CLI SHALL NOT sync any skills not in the installed list

#### Scenario: No installed skills found
- **WHEN** user runs `deepstorm update` and `.claude/settings.json` has no `deepstorm.installedSkills` or file does not exist
- **THEN** CLI SHALL display a message and skip skill sync

#### Scenario: Config-aware skill rendering during update
- **WHEN** user runs `deepstorm update` and a skill has `.tmpl` templates that depend on configuration values (e.g., `reef.frontend.framework`)
- **THEN** CLI SHALL re-render those templates using the current config from `deepstorm.*` in settings.json

### Requirement: Sync hooks and agents
`deepstorm update` SHALL sync not only skills but also hooks and agents for the installed tools.

#### Scenario: Sync installed hooks
- **WHEN** user runs `deepstorm update` and installed tools have associated hooks
- **THEN** CLI SHALL update the hooks in `.claude/hooks/` for those tools

#### Scenario: Sync installed agents
- **WHEN** user runs `deepstorm update` and installed tools have associated agents
- **THEN** CLI SHALL update the agents in `.claude/agents/` for those tools

### Requirement: User modification protection
`deepstorm update` SHALL detect files that the user has modified and preserve them before overwriting with new versions.

#### Scenario: User-modified file detected
- **WHEN** a system file in `.claude/skills/` or `.claude/agents/` has been modified by the user since last install
- **THEN** CLI SHALL rename the modified file with a `.bak` suffix (or timestamp-based marker) to preserve the user's version
- **THEN** CLI SHALL install the new system version of the file
- **THEN** CLI SHALL report to the user which files were backup and replaced

#### Scenario: Unmodified file
- **WHEN** a system file matches the distributed version
- **THEN** CLI SHALL overwrite it silently without backup

### Requirement: Replace `template upgrade` subcommand
The `template upgrade` subcommand SHALL be removed, with its functionality fully subsumed by `deepstorm update`.

#### Scenario: template upgrade is no longer available
- **WHEN** user runs `npx @deepstorm/cli template upgrade`
- **THEN** the command SHALL return an error indicating the subcommand no longer exists and redirect to `deepstorm update`

### Requirement: No sub-options on update command
`deepstorm update` SHALL accept no command-line options (`--check`, `--cli`, `--skills` are removed).

#### Scenario: Running update with --check flag
- **WHEN** user runs `deepstorm update --check`
- **THEN** CLI SHALL treat `--check` as an unknown option and display an error
