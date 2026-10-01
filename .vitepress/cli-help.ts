import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

/**
 * The pinned `@rness/cli`'s help, as text: `rness --help`, then
 * `rness <command> --help` for every command the root help names. The CLI
 * reference of the working copy renders it (`cli.data.ts`), and so does that
 * page's Markdown twin (`twins.ts`); a frozen copy reads the help its freeze
 * wrote instead (`scripts/freeze.mjs`).
 */
export interface CliHelpText {
  /** The pinned `@rness/cli` version. */
  version: string
  /** `rness --help`. */
  root: string
  /** `rness <command> --help`, keyed by command name. */
  commands: Record<string, string>
}

const require = createRequire(import.meta.url)
const pkg = require('@rness/cli/package.json') as {
  version: string
  bin: { rness: string }
}
const bin = join(dirname(require.resolve('@rness/cli/package.json')), pkg.bin.rness)

/** The pinned `@rness/cli` version, from its package. */
export const PINNED_VERSION = pkg.version

/**
 * This directory sits inside a rness workspace on a maintainer's machine:
 * without RNESS_NO_DELEGATE the launcher would hand over to the workspace's
 * pinned copy, and the page would describe that one instead of the dependency.
 */
export function help(args: string[]): string {
  return execFileSync(process.execPath, [bin, ...args, '--help'], {
    encoding: 'utf8',
    env: { ...process.env, RNESS_NO_DELEGATE: '1', NO_COLOR: '1' },
  }).trimEnd()
}

/** Command names from the root help's `Commands:` section; `help` and aliases dropped. */
export function commandNames(root: string): string[] {
  const section = root.split(/^Commands:$/m)[1] ?? ''
  return section
    .split('\n')
    .map((line) => /^ {2}(\S+)/.exec(line)?.[1])
    .filter((name): name is string => name !== undefined)
    .map((name) => name.split('|')[0]!)
    .filter((name) => name !== 'help')
}

let cached: CliHelpText | undefined

/** The whole help, run once per process. */
export function cliHelp(): CliHelpText {
  if (cached === undefined) {
    const root = help([])
    const commands = Object.fromEntries(commandNames(root).map((name) => [name, help([name])]))
    cached = { version: pkg.version, root, commands }
  }
  return cached
}
