import { describe, it, expect } from 'vitest'
import { RegistryReader } from '../registry'
import type { Registry } from '../../types/registry'

const sampleRegistry: Registry = {
  version: '1',
  tools: {
    reef: { label: '开发侧', description: '代码规范、审查', mcpDependencies: ['jira', 'github', 'figma'] },
    tide: { label: '产品侧', description: '需求讨论、PRD', mcpDependencies: ['jira', 'figma'] },
  },
  wizards: {
    reef: {
      tool: 'reef',
      label: '开发侧工具',
      description: '代码规范、审查',
      mcpSkills: ['deepstorm-mcp-jira-read', 'deepstorm-mcp-feishu-wiki-read'],
      questions: [
        {
          key: 'reef.frontend.framework',
          label: '选择前端框架',
          type: 'select',
          options: [
            { value: 'react', label: 'React' },
            { value: 'vue', label: 'Vue' },
          ],
        },
      ],
    },
  },
  skills: {
    'reef-react-lint': {
      tool: 'reef',
      configKey: 'reef.frontend.framework',
      configValue: 'react',
    },
    'reef-vue-lint': {
      tool: 'reef',
      configKey: 'reef.frontend.framework',
      configValue: 'vue',
    },
    'reef-jira-link': {
      tool: 'reef',
      configKey: 'reef.issueTracker',
      configValue: 'jira',
      dependencies: ['deepstorm-jira-parser'],
    },
    'deepstorm-jira-parser': {
      tool: 'shared',
      configKey: 'shared.issueTracker',
      configValue: 'jira',
    },
  },
  toolAssets: {
    reef: {
      agents: ['reef-review-backend.md', 'reef-review-frontend.md'],
      hooks: ['hooks.json', 'reef-auto-format.sh'],
    },
  },
  mcpTools: {
    github: { domain: 'code-hosting', label: 'GitHub', description: '代码托管' },
    jira: { domain: 'project-management', label: 'Jira', description: '项目管理' },
  },
}

describe('RegistryReader', () => {
  const reader = new RegistryReader(sampleRegistry)

  describe('findSkills', () => {
    it('finds skills matching configKey and configValue', () => {
      const skills = reader.findSkills('reef.frontend.framework', 'react')
      expect(skills).toHaveLength(1)
      expect(skills[0].tool).toBe('reef')
    })

    it('returns empty array when no skills match', () => {
      const skills = reader.findSkills('reef.frontend.framework', 'angular')
      expect(skills).toHaveLength(0)
    })
  })

  describe('getTools', () => {
    it('returns all available tool names', () => {
      expect(reader.getTools()).toEqual(['reef', 'tide'])
    })
  })

  describe('getWizard', () => {
    it('returns wizard for a tool', () => {
      const wizard = reader.getWizard('reef')
      expect(wizard).toBeDefined()
      expect(wizard?.questions).toHaveLength(1)
    })

    it('returns undefined for unknown tool', () => {
      expect(reader.getWizard('unknown')).toBeUndefined()
    })
  })

  describe('getSkill', () => {
    it('returns a skill by ID', () => {
      const skill = reader.getSkill('reef-react-lint')
      expect(skill).toBeDefined()
      expect(skill?.configValue).toBe('react')
    })

    it('returns undefined for unknown skill ID', () => {
      expect(reader.getSkill('nonexistent')).toBeUndefined()
    })
  })

  describe('getToolSkills', () => {
    it('returns all skills for a tool', () => {
      const skills = reader.getToolSkills('reef')
      expect(skills).toHaveLength(3)
    })

    it('returns empty array for tool with no skills', () => {
      const skills = reader.getToolSkills('tide')
      expect(skills).toHaveLength(0)
    })
  })

  describe('getToolMcpSkills', () => {
    it('returns mcpSkills for a tool that has them', () => {
      const skills = reader.getToolMcpSkills('reef')
      expect(skills).toEqual(['deepstorm-mcp-jira-read', 'deepstorm-mcp-feishu-wiki-read'])
    })

    it('returns empty array for tool without mcpSkills', () => {
      const skills = reader.getToolMcpSkills('tide')
      expect(skills).toEqual([])
    })

    it('returns empty array for unknown tool', () => {
      const skills = reader.getToolMcpSkills('unknown')
      expect(skills).toEqual([])
    })
  })

  describe('getToolHooks', () => {
    it('returns hooks for a tool that has them', () => {
      const hooks = reader.getToolHooks('reef')
      expect(hooks).toEqual(['hooks.json', 'reef-auto-format.sh'])
    })

    it('returns empty array for tool without hooks', () => {
      const hooks = reader.getToolHooks('tide')
      expect(hooks).toEqual([])
    })

    it('returns empty array for unknown tool', () => {
      const hooks = reader.getToolHooks('unknown')
      expect(hooks).toEqual([])
    })
  })

  describe('getToolAgents', () => {
    it('returns agents for a tool that has them', () => {
      const agents = reader.getToolAgents('reef')
      expect(agents).toEqual(['reef-review-backend.md', 'reef-review-frontend.md'])
    })

    it('returns empty array for tool without agents', () => {
      const agents = reader.getToolAgents('tide')
      expect(agents).toEqual([])
    })

    it('returns empty array for unknown tool', () => {
      const agents = reader.getToolAgents('unknown')
      expect(agents).toEqual([])
    })
  })

  describe('getToolEntry', () => {
    it('returns tool metadata for existing tool', () => {
      const entry = reader.getToolEntry('reef')
      expect(entry).toEqual({ label: '开发侧', description: '代码规范、审查', mcpDependencies: ['jira', 'github', 'figma'] })
    })

    it('returns undefined for unknown tool', () => {
      expect(reader.getToolEntry('unknown')).toBeUndefined()
    })
  })

  describe('getMcpTools', () => {
    it('returns all MCP tool names', () => {
      const tools = reader.getMcpTools()
      expect(tools).toEqual(['github', 'jira'])
    })
  })

  describe('getMcpToolEntry', () => {
    it('returns MCP tool metadata for existing name', () => {
      const entry = reader.getMcpToolEntry('github')
      expect(entry).toEqual({ domain: 'code-hosting', label: 'GitHub', description: '代码托管' })
    })

    it('returns undefined for unknown MCP tool', () => {
      expect(reader.getMcpToolEntry('unknown')).toBeUndefined()
    })
  })

  describe('getMcpDeps', () => {
    it('returns union of MCP dependencies for selected tools', () => {
      const deps = reader.getMcpDeps(['reef', 'tide'])
      expect(deps).toContain('jira')
      expect(deps).toContain('github')
      expect(deps).toContain('figma')
      expect(deps).toHaveLength(3)
    })

    it('returns only MCP deps for a single tool', () => {
      const deps = reader.getMcpDeps(['tide'])
      expect(deps).toEqual(['jira', 'figma'])
    })

    it('deduplicates overlapping MCP dependencies', () => {
      const deps = reader.getMcpDeps(['reef', 'tide'])
      // jira and figma are shared by both, should appear only once
      expect(deps.filter((d) => d === 'jira')).toHaveLength(1)
      expect(deps.filter((d) => d === 'figma')).toHaveLength(1)
    })

    it('returns empty array for tool without mcpDependencies', () => {
      const deps = reader.getMcpDeps(['nonexistent'])
      expect(deps).toEqual([])
    })

    it('returns empty array for empty tool list', () => {
      const deps = reader.getMcpDeps([])
      expect(deps).toEqual([])
    })
  })

  describe('findSkillIds', () => {
    it('returns skill IDs matching configKey and configValue', () => {
      const ids = reader.findSkillIds('reef.frontend.framework', 'react')
      expect(ids).toEqual(['reef-react-lint'])
    })

    it('returns empty array when no skills match', () => {
      const ids = reader.findSkillIds('reef.frontend.framework', 'angular')
      expect(ids).toEqual([])
    })
  })
})
