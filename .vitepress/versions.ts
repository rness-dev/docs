import { existsSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The versions the site serves (spec 0021 §2): each frozen copy under
 * `versions/<minor>/`, the highest at the root, the others under `v<minor>/`,
 * and the working copy (`guide/`, `cli/`) under `next/` — or at the root
 * while nothing is frozen yet.
 */
export interface DocsVersion {
  /** `0.15`, or `next` for the working copy. */
  id: string
  label: string
  /** Its URL prefix under the base: `''`, `next/`, `v0.14/`. */
  prefix: string
  /** Its source directory from the site root: `versions/0.15/`, or `''`. */
  source: string
  latest: boolean
  /** Its pages, as `guide/getting-started`, without `.md`. */
  pages: string[]
}

const root = fileURLToPath(new URL('..', import.meta.url))
/** The directories a version holds; everything else is the site's own. */
const SECTIONS = ['guide', 'cli']

function pagesOf(dir: string): string[] {
  const pages: string[] = []
  for (const section of SECTIONS) {
    const base = join(dir, section)
    if (!existsSync(base)) continue
    for (const entry of readdirSync(base, { recursive: true, withFileTypes: true }))
      if (entry.isFile() && entry.name.endsWith('.md'))
        pages.push(relative(dir, join(entry.parentPath, entry.name)).replace(/\.md$/, ''))
  }
  return pages.sort()
}

const byMinorDesc = (a: string, b: string): number => {
  const [am, an] = a.split('.').map(Number)
  const [bm, bn] = b.split('.').map(Number)
  return (bm ?? 0) - (am ?? 0) || (bn ?? 0) - (an ?? 0)
}

/** The frozen minors, newest first. */
export function frozenMinors(): string[] {
  const dir = join(root, 'versions')
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d+\.\d+$/.test(e.name))
    .map((e) => e.name)
    .sort(byMinorDesc)
}

/** The latest release first, then the working copy, then older minors. */
export function docsVersions(): DocsVersion[] {
  const minors = frozenMinors()
  const next: DocsVersion = {
    id: 'next',
    label: minors.length === 0 ? 'Latest' : 'Unreleased',
    prefix: minors.length === 0 ? '' : 'next/',
    source: '',
    latest: minors.length === 0,
    pages: pagesOf(root),
  }
  const frozen = minors.map(
    (minor, i): DocsVersion => ({
      id: minor,
      label: i === 0 ? `v${minor} · latest` : `v${minor}`,
      prefix: i === 0 ? '' : `v${minor}/`,
      source: `versions/${minor}/`,
      latest: i === 0,
      pages: pagesOf(join(root, 'versions', minor)),
    })
  )
  return frozen.length === 0 ? [next] : [frozen[0]!, next, ...frozen.slice(1)]
}

/**
 * Where each source page is served, for VitePress `rewrites`. A page of no
 * version (the home page, `all-versions.md`) keeps its path.
 */
export function rewriteOf(versions: readonly DocsVersion[]): (page: string) => string {
  return (page) => {
    for (const v of versions) {
      if (v.source !== '' && page.startsWith(v.source))
        return v.prefix + page.slice(v.source.length)
      if (v.source === '' && SECTIONS.some((s) => page.startsWith(`${s}/`)))
        return v.prefix + page
    }
    return page
  }
}

/** The version a served path belongs to (`v0.14/guide/x.md`); the latest for pages of no version. */
export function versionOfPath(
  versions: readonly DocsVersion[],
  path: string
): DocsVersion {
  const prefixed = versions.find((v) => v.prefix !== '' && path.startsWith(v.prefix))
  return prefixed ?? versions.find((v) => v.latest) ?? versions[0]!
}
