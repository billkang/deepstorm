# template-export Specification

## Purpose

Defines the behavior of `deepstorm template init` and `deepstorm template apply` commands regarding the preservation of the `references/` subdirectory when exporting and applying skill templates.

## ADDED Requirements

### Requirement: template init MUST preserve references/ subdirectory

When the `deepstorm template init` command exports a skill template, it SHALL include the `references/` subdirectory (and all files within it) in the exported output.

#### Scenario: references/ exists in source
- **WHEN** the source skill directory has a `references/` subdirectory with files
- **THEN** `copyDir` SHALL recursively copy the entire `references/` directory to the export destination
- **THEN** the exported `.deepstorm/templates/<skillId>/references/` SHALL contain all files from the source
- **THEN** files in `references/` SHALL remain as-is (no template rendering)

#### Scenario: references/ does not exist in source
- **WHEN** the source skill directory does NOT have a `references/` subdirectory
- **THEN** the exported template SHALL NOT contain a `references/` directory
- **THEN** no error or warning SHALL be emitted

### Requirement: template apply MUST preserve references/ subdirectory

When the `deepstorm template apply` command applies a skill template to `.claude/skills/`, it SHALL include the `references/` subdirectory in the applied output.

#### Scenario: references/ exists in exported template
- **WHEN** the exported template has a `references/` subdirectory
- **THEN** `copyDir` SHALL recursively copy it to `.claude/skills/<skillId>/references/`
- **THEN** files SHALL be identical to those in the template source

#### Scenario: references/ does not exist in exported template
- **WHEN** the exported template does NOT have a `references/` subdirectory
- **THEN** `.claude/skills/<skillId>/references/` SHALL NOT be created
- **THEN** no error or warning SHALL be emitted

### Requirement: copyDir behavior SHALL be tested

The `copyDir` utility function (`src/utils/fs.ts`) is the underlying mechanism for both `template init` and `template apply`. Unit tests SHALL verify its recursive copy behavior with respect to the `references/` subdirectory.

#### Scenario: copyDir with subdirectories
- **WHEN** `copyDir` is called on a directory that has subdirectories (including `references/`)
- **THEN** the destination SHALL contain the identical directory structure and file contents
- **THEN** the `force: true` option SHALL overwrite existing files at destination
