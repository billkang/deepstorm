import { readDeepStormConfig } from '../merger/settings'

/**
 * 格式化输出 DeepStorm 配置。
 */
export function viewConfig(targetDir: string): void {
  const deepstorm = readDeepStormConfig(targetDir)

  if (!deepstorm) {
    console.log('尚未配置 DeepStorm，请运行 deepstorm setup')
    return
  }

  console.log('DeepStorm 配置:')
  console.log(JSON.stringify(deepstorm, null, 2))
}
