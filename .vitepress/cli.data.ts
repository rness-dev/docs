import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createMarkdownRenderer, defineLoader } from 'vitepress'

import { PINNED_VERSION, cliHelp } from './cli-help'

/**
 * The CLI reference is rendered from the CLI itself: `rness --help`, then
 * `rness <command> --help` for every command the root help names, run at
 * build time from the `@rness/cli` pinned in this site's `package.json`
 * (`cli-help.ts`). Each output is rendered through VitePress's Markdown
 * renderer, so the page gets the same code blocks a fenced block would. A
 * release moves the pin by pull request (Dependabot), and the page follows.
 */
export interface CliHelp {
  /** The pinned `@rness/cli` version. */
  version: string
  /** `rness --help`, as HTML. */
  root: string
  /** `rness <command> --help`, as HTML, keyed by command name. */
  commands: Record<string, string>
}

declare const data: CliHelp
export { data }

const page = fileURLToPath(new URL('../cli/commands.md', import.meta.url))

/** The commands the page has a `## \`rness <name>\`` section for. */
function documented(): string[] {
  return [...readFileSync(page, 'utf8').matchAll(/^## `rness (\S+)`$/gm)].map(
    (m) => m[1]
  )
}

/**
 * Every command the CLI names has a section on the page, and every section a
 * command — checked here, where a throw fails the build, so a release cannot
 * leave the page behind. Add the missing section (its help is already in
 * `data.commands`), or remove the stale one.
 */
function checkSections(known: string[]): void {
  const sections = documented()
  const problems = [
    ...known.filter((n) => !sections.includes(n)).map((n) => `no section for \`rness ${n}\``),
    ...sections
      .filter((n) => !known.includes(n))
      .map((n) => `a section for \`rness ${n}\`, which ${PINNED_VERSION} does not have`),
  ]
  if (problems.length > 0) throw new Error(`cli/commands.md: ${problems.join('; ')}`)
}

export default defineLoader({
  async load(): Promise<CliHelp> {
    const md = await createMarkdownRenderer(fileURLToPath(new URL('..', import.meta.url)))
    const block = (text: string) => md.render('```\n' + text + '\n```')
    const text = cliHelp()
    checkSections(Object.keys(text.commands))
    return {
      version: text.version,
      root: block(text.root),
      commands: Object.fromEntries(
        Object.entries(text.commands).map(([name, help]) => [name, block(help)])
      ),
    }
  },
})
