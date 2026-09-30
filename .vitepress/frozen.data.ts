import { readFileSync } from 'node:fs'
import { basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMarkdownRenderer, defineLoader } from 'vitepress'

import type { CliHelp } from './cli.data'

/**
 * The CLI reference of each frozen version (spec 0021 §2): the `--help`
 * `scripts/freeze.mjs` wrote into `versions/<minor>/cli-help.json` when the
 * version was frozen, rendered as the live loader renders the pinned CLI's.
 * A frozen page never runs a CLI.
 */
declare const data: Record<string, CliHelp>
export { data }

interface FrozenHelp {
  version: string
  root: string
  commands: Record<string, string>
}

export default defineLoader({
  watch: ['../versions/*/cli-help.json'],
  async load(files: string[]): Promise<Record<string, CliHelp>> {
    const md = await createMarkdownRenderer(fileURLToPath(new URL('..', import.meta.url)))
    const block = (text: string) => md.render('```\n' + text + '\n```')
    const all: Record<string, CliHelp> = {}
    for (const file of files) {
      const minor = basename(dirname(file))
      const help = JSON.parse(readFileSync(file, 'utf8')) as FrozenHelp
      all[minor] = {
        version: help.version,
        root: block(help.root),
        commands: Object.fromEntries(
          Object.entries(help.commands).map(([name, text]) => [name, block(text)])
        ),
      }
    }
    return all
  },
})
