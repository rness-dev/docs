import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'
import type { PageData, SiteConfig } from 'vitepress'

import { type CliHelpText, cliHelp } from './cli-help'
import { type DocsVersion, versionOfPath } from './versions'

/**
 * The Markdown twin of every page (spec 0027 §3): the page's source, front
 * matter stripped and the VitePress-only syntax flattened, written next to
 * its HTML so that `/docs/guide/x.md` says what `/docs/guide/x` shows. From
 * the twins of the latest release, `llms.txt` (an index, one line per page)
 * and `llms-full.txt` (the pages in one file), spec 0027 §2. The build fails
 * when an HTML page has no twin.
 */

interface Page {
  /** The served path: `guide/x.md`, `v0.16/guide/x.md`, `index.md`. */
  path: string
  /** The source path: `versions/0.17/guide/x.md`. */
  file: string
  title: string
  frontmatter: Record<string, unknown>
}

interface HomeFrontmatter {
  hero: { name: string; text: string; tagline: string; actions?: { text: string; link: string }[] }
  features?: { title: string; details: string }[]
}

export interface TwinsOptions {
  versions: readonly DocsVersion[]
  /** The guide's pages in reading order, `[title, 'guide/x']`. */
  guide: readonly (readonly [string, string])[]
  /** The public URL of the site, no trailing slash. */
  siteUrl: string
}

const PAGES = new Map<string, Page>()

/** Called from `transformPageData`: what the build knows of each page it renders. */
export function collectPage(pageData: PageData): void {
  if (pageData.filePath === '') return // virtual, the 404 page
  PAGES.set(pageData.relativePath, {
    path: pageData.relativePath,
    file: pageData.filePath,
    title: pageData.title,
    frontmatter: pageData.frontmatter,
  })
}

const fence = (text: string): string => '```\n' + text + '\n```'

/** The help a CLI page shows: the frozen copy's, or the pinned CLI's for the working copy. */
function helpOf(srcDir: string, v: DocsVersion): CliHelpText {
  if (v.source === '') return cliHelp()
  return JSON.parse(readFileSync(join(srcDir, v.source, 'cli-help.json'), 'utf8')) as CliHelpText
}

/** The home page, whose content is its front matter. */
function homeTwin(fm: HomeFrontmatter, base: string): string {
  const link = (l: string): string => (l.startsWith('/') ? base + l.slice(1) : l)
  const lines = [`# ${fm.hero.name}`, '', fm.hero.text, '', fm.hero.tagline, '']
  for (const a of fm.hero.actions ?? []) lines.push(`- [${a.text.replace(/ ↗$/, '')}](${link(a.link)})`)
  for (const f of fm.features ?? []) lines.push('', `## ${f.title}`, '', f.details)
  return lines.join('\n') + '\n'
}

/**
 * VitePress syntax that has no Markdown reading, flattened: a `::: details`
 * or admonition container becomes its title in bold and its content as is,
 * a `::: code-group` disappears and each of its fences gets its label as a
 * line above it.
 */
function flatten(text: string): string {
  const out: string[] = []
  let inFence = false
  for (const line of text.split('\n')) {
    if (/^```/.test(line)) inFence = !inFence
    if (inFence && !/^```/.test(line)) {
      out.push(line)
      continue
    }
    if (/^:::\s*$/.test(line)) continue
    const container = /^::: ?([a-z-]+)(?:\s+(.*))?$/.exec(line)
    if (container !== null) {
      const [, kind, title] = container
      if (kind === 'code-group') continue
      out.push(`**${title ?? kind!.charAt(0).toUpperCase() + kind!.slice(1)}**`, '')
      continue
    }
    const labelled = /^(```[a-z]*) \[([^\]]+)\]$/.exec(line)
    if (labelled !== null) {
      out.push(`**${labelled[2]}**`, '', labelled[1]!)
      continue
    }
    out.push(line)
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n')
}

function twinOf(page: Page, source: string, base: string, srcDir: string, opts: TwinsOptions): string {
  if (page.frontmatter['layout'] === 'home')
    return homeTwin(page.frontmatter as unknown as HomeFrontmatter, base)
  let text = source.replace(/^---\n[\s\S]*?\n---\n+/, '')
  text = text.replace(/<script setup>[\s\S]*?<\/script>\n*/g, '')
  if (/(^|\/)cli\/commands\.md$/.test(page.path)) {
    const version = versionOfPath(opts.versions, page.path)
    const help = helpOf(srcDir, version)
    text = text.replace(/<div v-html="data\.root"><\/div>/g, fence(help.root))
    text = text.replace(/<div v-html="data\.commands\.([a-z-]+)"><\/div>/g, (_, name: string) => {
      const h = help.commands[name]
      // The working copy may document a command npm does not have yet.
      if (h === undefined && version.source === '') return ''
      if (h === undefined) throw new Error(`${page.file}: no help for \`rness ${name}\``)
      return fence(h)
    })
  }
  if (page.path === 'all-versions.md')
    text = text.replace(
      /<ul>[\s\S]*?<\/ul>/,
      opts.versions.map((v) => `- [${v.label}](${base}${v.prefix}guide/getting-started.md)`).join('\n')
    )
  if (/<[a-z-]+ v-|v-html|\{\{/.test(text)) throw new Error(`${page.file}: Vue syntax left in its twin`)
  return flatten(text)
}

/** The first paragraph after the title: what `llms.txt` says of a page. */
function firstParagraph(twin: string): string {
  const lines = twin.split('\n')
  let i = lines.findIndex((l) => /^# /.test(l)) + 1
  const para: string[] = []
  for (; i < lines.length; i++) {
    const line = lines[i]!
    if (para.length === 0) {
      if (line.startsWith('```')) {
        while (++i < lines.length && !lines[i]!.startsWith('```'));
        continue
      }
      if (line.trim() === '' || /^(#|\*\*|[-*] |\d+\. |<|>)/.test(line)) continue
    } else if (line.trim() === '') break
    para.push(line.trim())
  }
  return para.join(' ')
}

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => join(e.parentPath, e.name))
}

/** Run from `buildEnd`: the twins, the check, `llms.txt` and `llms-full.txt`. */
export function writeTwins(siteConfig: SiteConfig, opts: TwinsOptions): void {
  const { outDir, srcDir, site } = siteConfig
  const base = site.base
  const twins = new Map<string, string>()
  for (const page of PAGES.values()) {
    const source = readFileSync(join(srcDir, page.file), 'utf8')
    const twin = twinOf(page, source, base, srcDir, opts)
    const target = join(outDir, page.path)
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, twin)
    twins.set(page.path, twin)
  }

  for (const html of htmlFiles(outDir)) {
    if (basename(html) === '404.html') continue
    const twin = html.replace(/\.html$/, '.md')
    if (!existsSync(twin)) throw new Error(`no Markdown twin for ${relative(outDir, html)}`)
  }

  // The index of the latest release, in sidebar order: the guide, then the
  // CLI reference. Nothing of the working copy or of an older minor.
  const latest = opts.versions.find((v) => v.latest) ?? opts.versions[0]!
  const guide = [
    ...opts.guide.filter(([, p]) => latest.pages.includes(p)),
    ...latest.pages
      .filter((p) => p.startsWith('guide/') && !opts.guide.some(([, page]) => page === p))
      .map((p): [string, string] => [PAGES.get(`${latest.prefix}${p}.md`)?.title ?? p, p]),
  ]
  const entry = (title: string, page: string): string => {
    const path = `${latest.prefix}${page}.md`
    const twin = twins.get(path)
    if (twin === undefined) throw new Error(`llms.txt: no twin for ${path}`)
    return `- [${title}](${opts.siteUrl}/${path}): ${firstParagraph(twin)}`
  }
  const version = helpOf(srcDir, latest).version
  const index = [
    `# ${site.title} documentation`,
    '',
    `> ${site.description}`,
    '',
    `The guide and the CLI reference of \`@rness/cli\` ${version}, the latest release. Every page is served as Markdown at its URL plus \`.md\`; a request with \`Accept: text/markdown\` gets the same. The pages below in one file: [llms-full.txt](${opts.siteUrl}/llms-full.txt).`,
    '',
    '## Guide',
    '',
    ...guide.map(([title, page]) => entry(title, page)),
    '',
    '## CLI reference',
    '',
    entry('Commands', 'cli/commands'),
    '',
    '## Optional',
    '',
    `- [All versions](${opts.siteUrl}/all-versions.md): the releases this site keeps a copy for, and how to read the version a workspace runs`,
    `- [Changelog](https://github.com/rness-dev/rness/blob/main/packages/cli/README.md): what each release of \`@rness/cli\` changed`,
    `- [rness.dev](https://rness.dev/llms.txt): what Rness is, when to use it, how to install it`,
    '',
  ].join('\n')
  writeFileSync(join(outDir, 'llms.txt'), index)

  const full = [
    `# ${site.title} documentation`,
    '',
    `> ${site.description}`,
    '',
    `Every page of the guide and the CLI reference of \`@rness/cli\` ${version}, in reading order. The index: [llms.txt](${opts.siteUrl}/llms.txt).`,
    '',
    ...[...guide.map(([, p]) => p), 'cli/commands'].map((p) => twins.get(`${latest.prefix}${p}.md`)!.trimEnd()),
    '',
  ].join('\n\n')
  writeFileSync(join(outDir, 'llms-full.txt'), full)
}
