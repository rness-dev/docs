import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMarkdownRenderer, defineLoader } from 'vitepress'

/**
 * The CLI reference is rendered from the CLI itself: `rness --help`, then
 * `rness <command> --help` for every command the root help names, run at
 * build time from the `@rness/cli` pinned in this site's `package.json`.
 * Each output is rendered through VitePress's Markdown renderer, so the page
 * gets the same code blocks a fenced block would. A release moves the pin by
 * pull request (Dependabot), and the page follows.
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

const require = createRequire(import.meta.url)
const pkg = require('@rness/cli/package.json') as {
  version: string
  bin: { rness: string }
}
const bin = join(dirname(require.resolve('@rness/cli/package.json')), pkg.bin.rness)
const page = fileURLToPath(new URL('../cli/commands.md', import.meta.url))

/**
 * This directory sits inside a rness workspace on a maintainer's machine:
 * without RNESS_NO_DELEGATE the launcher would hand over to the workspace's
 * pinned copy, and the page would describe that one instead of the dependency.
 */
function help(args: string[]): string {
  return execFileSync(process.execPath, [bin, ...args, '--help'], {
    encoding: 'utf8',
    env: { ...process.env, RNESS_NO_DELEGATE: '1', NO_COLOR: '1' },
  }).trimEnd()
}

/** Command names from the root help's `Commands:` section; `help` and aliases dropped. */
function commandNames(root: string): string[] {
  const section = root.split(/^Commands:$/m)[1] ?? ''
  return section
    .split('\n')
    .map((line) => /^ {2}(\S+)/.exec(line)?.[1])
    .filter((name): name is string => name !== undefined)
    .map((name) => name.split('|')[0])
    .filter((name) => name !== 'help')
}

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
      .map((n) => `a section for \`rness ${n}\`, which ${pkg.version} does not have`),
  ]
  if (problems.length > 0) throw new Error(`cli/commands.md: ${problems.join('; ')}`)
}

export default defineLoader({
  async load(): Promise<CliHelp> {
    const md = await createMarkdownRenderer(fileURLToPath(new URL('..', import.meta.url)))
    const block = (text: string) => md.render('```\n' + text + '\n```')
    const root = help([])
    const known = commandNames(root)
    checkSections(known)
    const commands = Object.fromEntries(known.map((name) => [name, block(help([name]))]))
    return { version: pkg.version, root: block(root), commands }
  },
})
