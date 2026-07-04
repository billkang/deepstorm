# skill-installation Specification

## Purpose

Defines the CLI installer engine core logic — how skill/agent/hook/MCP assets are assembled from `dist/` and installed into the project's `.claude/` directory. Covers the template-based vs static asset detection, rendering pipeline, subdirectory handling (variants/fragments/references), agent compilation, hook script rendering, and installation sequencing per selected tool.

## ADDED Requirements

### Requirement: Template-based skills MUST copy references/ subdirectory

When a skill has a `SKILL.md.tmpl` file (template-based skill), the installer SHALL copy the `references/` subdirectory from the source skill directory to the target skill directory, in addition to the existing `variants/` and `fragments/` copying.

#### Scenario: references/ directory exists
- **WHEN** a template-based skill has a `references/` subdirectory under its source directory
- **THEN** the installer SHALL recursively copy `references/` to the target skill directory
- **THEN** the copy SHALL use `fs.cpSync(referencesSrc, referencesDest, { recursive: true, force: true })`
- **THEN** references files SHALL remain as-is (no template rendering needed for references/)

#### Scenario: references/ directory does not exist
- **WHEN** a template-based skill does NOT have a `references/` subdirectory
- **THEN** the installer SHALL silently skip the references/ copy step
- **THEN** no error or warning SHALL be emitted

#### Scenario: references/ coexists with variants/ and fragments/
- **WHEN** a template-based skill has all three subdirectories (references/, variants/, fragments/)
- **THEN** the installer SHALL copy all three independently
- **THEN** each subdirectory SHALL be correctly placed under the target skill directory

### Requirement: Hook scripts MUST be registered via merge

When installing hooks for a tool, the installer SHALL use the `mergeHooks()` function from `merger/hooks.ts` to register hook entries into `hooks.json`, rather than overwriting or skipping the file.

#### Scenario: hooks.json does not exist
- **WHEN** `hooks.json` does not yet exist in the target `.claude/hooks/` directory
- **THEN** the installer SHALL create `hooks.json` with the incoming hooks configuration
- **THEN** `mergeHooks()` SHALL be called with the target path and incoming hooks object

#### Scenario: hooks.json already exists
- **WHEN** `hooks.json` already exists from a previous tool installation
- **THEN** the installer SHALL merge new hook entries into the existing file
- **THEN** `mergeHooks()` SHALL be used for the merge
- **THEN** existing hook entries SHALL NOT be duplicated

#### Scenario: no hooks configured for selected tools
- **WHEN** none of the user-selected tools declare any hooks
- **THEN** the installer SHALL NOT create or modify `hooks.json`

### Requirement: Build-time hooks.json merge MUST deduplicate

When the build script (`buildRegistry`) merges `hooks.json` files from multiple packages into `dist/hooks/hooks.json`, it SHALL deduplicate hook entries to prevent runtime hook scripts from executing multiple times.

#### Scenario: duplicate hook entries from multiple build passes
- **WHEN** the same package's `hooks.json` is merged multiple times during build
- **THEN** the merge function SHALL detect and remove duplicate entries
- **THEN** deduplication SHALL use the (event, matcher, command) tuple as the identity key
- **THEN** the output `dist/hooks/hooks.json` SHALL contain each unique hook exactly once

#### Scenario: distinct hooks from different packages
- **WHEN** different packages declare different hooks (e.g., reef's PreToolUse and tide's SessionStart)
- **THEN** all distinct hooks SHALL be preserved in the merged output
- **THEN** no hook entries SHALL be lost due to deduplication
