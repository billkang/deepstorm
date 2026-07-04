## ADDED Requirements

### Requirement: AI SHALL check superpowers before entering implementation phase
Before entering the implementation phase (Phase 4), the AI SHALL execute a mandatory superpowers check gate. This gate SHALL stop all forward progress until completed.

#### Scenario: Tasks complete with code changes involved
- **WHEN** `tasks.md` has been created and the user has approved all SDD documents, AND the change involves TypeScript, Java, Python, or other code file modifications
- **THEN** the AI SHALL invoke the Skill tool to load `superpowers:test-driven-development` and any other applicable superpowers, and SHALL NOT enter the implementation phase until the gate is passed

#### Scenario: Tasks complete with only configuration changes
- **WHEN** `tasks.md` has been created and the user has approved all SDD documents, AND the change involves only configuration, SKILL.md templates, markdown, or documentation files
- **THEN** the AI MAY skip the superpowers skill loading and proceed to the implementation phase

### Requirement: Gate SHALL include Skill tool invocation, Rigid declaration, enhanced checklist, and Red Flags
The superpowers check gate SHALL mandate four specific sub-steps before implementation may proceed.

#### Scenario: Complete gate workflow
- **WHEN** the AI starts the superpowers check gate
- **THEN** the AI SHALL: (1) invoke the Skill tool to load applicable superpowers such as `superpowers:test-driven-development`, (2) follow any checklists provided by loaded skills by creating todo items via TaskCreate, (3) if Rigid skills are loaded, declare the Rigid discipline to the user using the prescribed template and wait for user confirmation, (4) verify all items in the enhanced checklist are checked, including that superpowers are loaded and Rigid discipline is confirmed

### Requirement: Rigid discipline SHALL override default implementation flow
Rigid superpower skills (such as test-driven-development) SHALL take precedence over the default implementation instructions when conflicts arise.

#### Scenario: TDD skill conflicts with default implement-fast approach
- **WHEN** `superpowers:test-driven-development` is loaded as a Rigid skill AND the default flow instructs the AI to implement tasks in any order
- **THEN** the AI SHALL follow TDD discipline (RED → GREEN → REFACTOR) regardless of what the default flow suggests, and SHALL NOT produce production code without a failing test first

### Requirement: Red Flags SHALL trigger immediate stop
The superpowers check gate SHALL include a Red Flags table that the AI uses for self-diagnosis when tempted to skip the gate.

#### Scenario: AI thinks "this change is too simple for superpowers"
- **WHEN** the AI considers skipping the superpowers check because the change appears simple
- **THEN** the AI SHALL stop and return to the superpowers check gate, because even 1% applicability requires checking

#### Scenario: AI thinks "let me check tasks first, then do superpowers"
- **WHEN** the AI wants to "first look at the task list and then come back to check superpowers"
- **THEN** the AI SHALL recognize this as a Red Flag and return to the superpowers check gate without accessing implementation details first
