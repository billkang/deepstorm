## ADDED Requirements

### Requirement: Skill accepts Jira Issue input
The skill SHALL accept a Jira Issue description or ID as its primary input for test case generation. The skill MUST parse the Jira Issue to extract the feature description, acceptance criteria, and functional requirements.

#### Scenario: Direct Jira Issue description
- **WHEN** the user provides a Jira Issue description text to the skill
- **THEN** the skill SHALL parse the description to identify the feature scope, user stories, and acceptance criteria

#### Scenario: Jira Issue ID reference
- **WHEN** the user provides a Jira Issue ID (e.g., `PROJ-123`)
- **THEN** the skill SHALL prompt the user to provide the issue description, as external Jira API access is not in scope

---

### Requirement: Skill accepts PRD context
The skill SHOULD accept optional PRD context to supplement the Jira Issue description. When a PRD document URL or reference is provided, the skill SHALL use the guide the user to provide relevant context from the PRD.

#### Scenario: PRD context provided
- **WHEN** the user provides a PRD document reference or summary
- **THEN** the skill SHALL incorporate PRD context to enrich test case coverage, especially for business rules, edge cases, and non-functional requirements not fully described in the Jira Issue

#### Scenario: PRD context not provided
- **WHEN** the user does not provide any PRD context
- **THEN** the skill SHALL generate test cases based solely on the Jira Issue description, and note in the output that context was limited

---

### Requirement: Skill generates structured test cases
The skill SHALL generate a structured test case list in Markdown format. Each test case MUST include the following fields:

| 字段 | 必填 | 说明 |
|------|------|------|
| `ID` | 是 | 唯一标识，格式 `TC-{feature}-{seq}` |
| `类型` | 是 | 正常流程 / 边界条件 / 异常场景 / 验收标准 |
| `前置条件` | 是 | 测试所需的前置状态或数据 |
| `测试步骤` | 是 | 清晰的操作步骤描述 |
| `预期结果` | 是 | 期望的行为或输出 |
| `关联验收标准` | 否 | 对应 PRD 或 Jira 中的验收标准编号 |

#### Scenario: Generate test case list
- **WHEN** the skill has received Jira Issue input and optionally PRD context
- **THEN** the skill SHALL output a Markdown list of structured test cases with all required fields populated

#### Scenario: Test case ID uniqueness
- **WHEN** multiple test cases are generated for the same feature
- **THEN** each test case SHALL have a unique `ID` following the format `TC-{feature}-{seq}`

---

### Requirement: Test case coverage dimensions
The skill SHALL generate test cases across four coverage dimensions: normal flow, boundary conditions, exception scenarios, and acceptance criteria verification. The generated test cases MUST achieve reasonable coverage across at least three of the four dimensions.

#### Scenario: Normal flow test cases
- **WHEN** the skill analyzes the feature's primary user journey
- **THEN** the output SHALL include at least one test case covering the expected/happy path

#### Scenario: Boundary condition test cases
- **WHEN** the skill identifies input constraints or limits in the feature description
- **THEN** the output SHALL include test cases covering boundary values and edge cases

#### Scenario: Exception scenario test cases
- **WHEN** the skill identifies possible failure modes or error conditions
- **THEN** the output SHALL include test cases covering error handling and exceptional behavior

#### Scenario: Acceptance criteria verification
- **WHEN** the Jira Issue or PRD defines explicit acceptance criteria
- **THEN** the output SHALL include a test case for each acceptance criterion to verify compliance

---

### Requirement: Output consumable by superpowers
The output test case list SHALL be formatted such that Reef's superpowers capability can consume it to generate improved unit tests. The Markdown output MUST use consistent and parseable section headers and field labels.

#### Scenario: Superpowers integration
- **WHEN** the test case list is generated
- **THEN** the skill SHALL note that the output can be used as input to superpowers for improved unit test generation

#### Scenario: Output format consistency
- **WHEN** the skill generates the test case list
- **THEN** each test case SHALL follow the same field structure and formatting to ensure machine-parseability
