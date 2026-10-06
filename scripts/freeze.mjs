#!/usr/bin/env node
// Freezes the working copy as the docs of the pinned @rness/cli's minor
// (spec 0021 §2): guide/ and cli/ copied into versions/<minor>/, the CLI's
// --help written beside them, the frozen CLI page pointed at it. A patch
// release refreezes its minor. Keeps the latest minor and the three before.
//
//   pnpm freeze
import { execFileSync } from 'node:child_process'
import { cpSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const KEPT_OLDER = 3
const root = fileURLToPath(new URL('..', import.meta.url))
const require = createRequire(import.meta.url)
const pkg = require('@rness/cli/package.json')
const bin = join(dirname(require.resolve('@rness/cli/package.json')), pkg.bin.rness)
const minor = pkg.version.split('.').slice(0, 2).join('.')

/** The pinned CLI's own help: never the workspace's copy this site sits in. */
function help(args) {
  return execFileSync(process.execPath, [bin, ...args, '--help'], {
    encoding: 'utf8',
    env: { ...process.env, RNESS_NO_DELEGATE: '1', NO_COLOR: '1' },
  }).trimEnd()
}

/** As `.vitepress/cli.data.ts` reads them: the root help's commands, `help` and aliases dropped. */
function commandNames(text) {
  const section = text.split(/^Commands:$/m)[1] ?? ''
  return section
    .split('\n')
    .map((line) => /^ {2}(\S+)/.exec(line)?.[1])
    .filter((name) => name !== undefined)
    .map((name) => name.split('|')[0])
    .filter((name) => name !== 'help')
}

const rootHelp = help([])
const names = commandNames(rootHelp)

// The working copy may run ahead of npm; a frozen release may not. Every
// command the release names has a section of the page, and every section a
// command: else nothing is frozen.
const working = readFileSync(join(root, 'cli', 'commands.md'), 'utf8')
const sections = [...working.matchAll(/^## `rness (\S+)`$/gm)].map((m) => m[1])
const problems = [
  ...names.filter((n) => !sections.includes(n)).map((n) => `no section for \`rness ${n}\``),
  ...sections
    .filter((n) => !names.includes(n))
    .map((n) => `a section for \`rness ${n}\`, which ${pkg.version} does not have`),
]
if (problems.length > 0) throw new Error(`cli/commands.md: ${problems.join('; ')}`)

const target = join(root, 'versions', minor)
rmSync(target, { recursive: true, force: true })
for (const section of ['guide', 'cli'])
  cpSync(join(root, section), join(target, section), { recursive: true })

const commands = Object.fromEntries(names.map((name) => [name, help([name])]))
writeFileSync(
  join(target, 'cli-help.json'),
  `${JSON.stringify({ version: pkg.version, root: rootHelp, commands }, null, 2)}\n`
)

// The frozen CLI page reads the frozen help, never the pinned CLI's.
const page = join(target, 'cli', 'commands.md')
const live = "import { data } from '../.vitepress/cli.data'"
const text = readFileSync(page, 'utf8')
if (!text.includes(live)) throw new Error(`${page}: no \`${live}\` to point at the frozen help`)
writeFileSync(
  page,
  text.replace(
    live,
    `import { data as frozen } from '../../../.vitepress/frozen.data'\nconst data = frozen['${minor}']`
  )
)

const minors = readdirSync(join(root, 'versions'), { withFileTypes: true })
  .filter((e) => e.isDirectory() && /^\d+\.\d+$/.test(e.name))
  .map((e) => e.name)
  .sort((a, b) => {
    const [am, an] = a.split('.').map(Number)
    const [bm, bn] = b.split('.').map(Number)
    return bm - am || bn - an
  })
const pruned = minors.slice(1 + KEPT_OLDER)
for (const old of pruned) rmSync(join(root, 'versions', old), { recursive: true, force: true })

console.log(`froze    versions/${minor}/ (@rness/cli ${pkg.version})`)
for (const old of pruned) console.log(`removed  versions/${old}/`)
