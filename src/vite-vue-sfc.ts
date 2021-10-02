import type { Plugin } from 'vite'
import { FilterPattern, createFilter } from '@rollup/pluginutils'
import { resolveConfig } from './options'
import { createGenerator, NanowindUserConfig } from '.'

export interface NanowindUserOptions extends NanowindUserConfig {
  include?: FilterPattern
  exclude?: FilterPattern
}

export default function NanowindVueVitePlugin(config: NanowindUserOptions = {}): Plugin {
  const resolved = resolveConfig(config)
  const generate = createGenerator(resolved)

  const filter = createFilter(
    config.include || [/\.vue$/],
    config.exclude || [/[\/\\]node_modules[\/\\]/, /[\/\\]dist[\/\\]/],
  )

  async function transformSFC(code: string) {
    const style = await generate(code)
    if (!style)
      return null
    return `${code}\n<style scoped>${style}</style>`
  }

  return {
    name: 'nanowind',
    enforce: 'pre',
    transform(code, id) {
      if (!filter(id))
        return

      return transformSFC(code)
    },
    handleHotUpdate(ctx) {
      const read = ctx.read
      if (filter(ctx.file)) {
        ctx.read = async() => {
          const code = await read()
          return await transformSFC(code) || code
        }
      }
    },
  }
}
