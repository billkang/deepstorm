## ADDED Requirements

### Requirement: Reef install SHALL deploy intent detection hook

When reef is installed or updated via the DeepStorm CLI, the installation process SHALL deploy the `reef-intent-detect.sh` script to the user project's `.claude/hooks/` directory.

#### Scenario: Fresh install deploys hook
- **WHEN** user runs `npx @deepstorm/cli setup` and selects reef installation
- **THEN** the CLI SHALL copy `reef-intent-detect.sh` to the project's `.claude/hooks/` directory

#### Scenario: Update overwrites existing hook
- **WHEN** user runs reef update and a previous version of `reef-intent-detect.sh` exists
- **THEN** the CLI SHALL overwrite it with the latest version

### Requirement: hooks.json SHALL include before-read hook registration

The reef `hooks.json` SHALL include a `before-read` hook entry that points to the `reef-intent-detect.sh` script.

#### Scenario: before-read hook registered in hooks.json
- **WHEN** reefs `hooks.json` is deployed to the user's project
- **THEN** it SHALL include a hook entry with `matcher: "*"` (or equivalent to match all user messages) and command pointing to `reef-intent-detect.sh`

#### Scenario: Hook runs before every AI processing cycle
- **WHEN** a user submits a message
- **THEN** the `before-read` hook SHALL execute before the AI processes the user's input

### Requirement: Non-zero exit from hook SHALL trigger reef-start

The intent detection hook SHALL use a non-zero exit code (or stdout injection) to signal that reef-start should be invoked.

#### Scenario: Match triggers non-zero exit or injected instruction
- **WHEN** the hook detects a development intent match
- **THEN** the hook SHALL output an instruction string that the harness interprets as a request to invoke the reef-start skill

#### Scenario: No match exits cleanly
- **WHEN** the hook does NOT detect development intent
- **THEN** the hook SHALL exit with code 0 and produce no output, allowing normal AI processing

### Requirement: Hook SHALL work without reef-start skill pre-installed

The hook SHALL gracefully handle the case where the `reef-start` skill is not available (e.g., reef not fully installed or outdated).

#### Scenario: reef-start skill missing
- **WHEN** the hook triggers but `reef-start` skill is not found in the available skills list
- **THEN** the hook SHALL output a fallback message rather than failing silently or causing an error

### Requirement: Hook script SHALL be self-contained

The `reef-intent-detect.sh` script MUST be a single bash script with no external dependencies beyond standard Unix tools (grep, awk, sed, etc.).

#### Scenario: No external runtime required
- **WHEN** the hook script is executed
- **THEN** it SHALL run using only the system-installed bash and POSIX tools

#### Scenario: No package.json dependency
- **WHEN** reef is installed
- **THEN** the intent detection hook SHALL NOT require npm packages or node_modules access

### Requirement: Installer SHALL handle multi-hook directory

If the user's project does not already have a `.claude/hooks/` directory or `hooks.json`, the installer SHALL create them.

#### Scenario: Hooks directory does not exist
- **WHEN** the user's project has no `.claude/hooks/` directory
- **THEN** the installer SHALL create the directory and populate it with reefs hooks.json

#### Scenario: Existing hooks.json with other hooks
- **WHEN** the user's project already has a `hooks.json` with existing hooks from other plugins
- **THEN** the installer SHALL merge the intent detection hook entry into the existing configuration without removing other hooks

### Requirement: Installer SHALL support both `.claude/hooks/` and `.claude/settings.json` hook registration

The hook deployment SHALL support the standard Claude Code hook registration pattern, whether through `hooks.json` or through `settings.json` hook references.

#### Scenario: Deployment via hooks.json
- **WHEN** the project has or can have a `.claude/hooks/hooks.json`
- **THEN** the installer SHALL register the before-read hook there

#### Scenario: Deployment via settings.json hooks path
- **WHEN** the project uses `.claude/settings.json` to reference hook files
- **THEN** the installer SHALL ensure the hook script path is correctly referenced
