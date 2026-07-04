import 'dotenv/config'
import * as esbuild from 'esbuild'

// Step 1: 打包 CLI 入口
await esbuild.build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/cli.js',
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: ['@clack/prompts', 'commander', 'js-yaml'],
})

// Step 2: 编译 registry 构建工具（unbundled，供 npm run build 后续步骤调用）
await esbuild.build({
  entryPoints: ['src/build-registry.ts'],
  outfile: 'dist/build-registry.js',
  bundle: false,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
})
