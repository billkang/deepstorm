import * as fs from 'node:fs'

export interface EnvVar {
  key: string
  comment: string
}

/**
 * 追加环境变量到 .env 文件。
 * 不覆盖已有变量，每项附带注释说明。
 * 第一次写入时加 # DeepStorm 分区头。
 */
export function appendEnvVars(envPath: string, vars: EnvVar[]): void {
  if (vars.length === 0) return

  let existingLines: string[] = []
  let existingKeys = new Set<string>()

  if (fs.existsSync(envPath)) {
    const raw = fs.readFileSync(envPath, 'utf-8')
    existingLines = raw.split('\n')
    for (const line of existingLines) {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=')
        if (eqIdx > 0) {
          existingKeys.add(trimmed.slice(0, eqIdx))
        }
      }
    }
  }

  // 过滤出还不存在的变量
  const newVars = vars.filter((v) => !existingKeys.has(v.key))
  if (newVars.length === 0) return

  const output = [...existingLines]

  // 标记分区头
  if (existingLines.length > 0 && existingLines[existingLines.length - 1] !== '') {
    output.push('')
  }
  output.push('# DeepStorm')
  output.push('')

  for (const v of newVars) {
    output.push(`# ${v.comment}`)
    output.push(`${v.key}=`)
  }
  output.push('')

  fs.writeFileSync(envPath, output.join('\n'), 'utf-8')
}
