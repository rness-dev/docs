import { type DefaultTheme, defineConfigWithTheme } from 'vitepress'

import { type DocsVersion, docsVersions, rewriteOf, versionOfPath } from './versions'

/** What the version menu needs of each version (theme/VersionMenu.vue). */
export type MenuVersion = Pick<DocsVersion, 'id' | 'label' | 'prefix' | 'latest' | 'pages'>

export interface ThemeConfig extends DefaultTheme.Config {
  versions: MenuVersion[]
}

// The public host: rness.dev rewrites /docs to this deployment (org/web,
// next.config.ts). Canonical links and the sitemap name that host, so the
// *.vercel.app one never competes in search.
const SITE_URL = 'https://rness.dev/docs'

// Every version the site serves (spec 0021 §2), read from `versions/` once
// per build: the latest release at the root, the working copy under `next/`,
// older minors under `v<minor>/`.
const VERSIONS = docsVersions()
const LATEST = VERSIONS.find((v) => v.latest) ?? VERSIONS[0]!
const REWRITE = rewriteOf(VERSIONS)

/** The guide's pages, in reading order; a version shows those it has. */
const GUIDE: readonly [string, string][] = [
  ['Getting started', 'guide/getting-started'],
  ['The workspace', 'guide/workspace'],
  ['Repositories', 'guide/repositories'],
  ['Claude Code', 'guide/claude-code'],
  ['Agent Pulse', 'guide/agent-pulse'],
  ['Update rness', 'guide/upgrade'],
]

/** A page name made readable, for a page of an older version the list does not know. */
const titleOf = (page: string): string => {
  const name = page.split('/').pop() ?? page
  return name.charAt(0).toUpperCase() + name.slice(1).replaceAll('-', ' ')
}

function sidebarOf(v: DocsVersion): DefaultTheme.SidebarMulti {
  const known = GUIDE.filter(([, page]) => v.pages.includes(page))
  const extra = v.pages
    .filter((p) => p.startsWith('guide/') && !GUIDE.some(([, page]) => page === p))
    .map((p): [string, string] => [titleOf(p), p])
  const link = (page: string) => `/${v.prefix}${page}`
  return {
    [`/${v.prefix}guide/`]: [
      {
        text: 'Guide',
        items: [...known, ...extra].map(([text, page]) => ({ text, link: link(page) })),
      },
    ],
    [`/${v.prefix}cli/`]: [
      { text: 'CLI reference', items: [{ text: 'Commands', link: link('cli/commands') }] },
    ],
  }
}

/** The same page in the latest release, for a copy's canonical link; the home page when it has none. */
function latestOf(path: string): string {
  const v = versionOfPath(VERSIONS, path)
  const page = path.slice(v.prefix.length).replace(/\.md$/, '')
  return v.latest || LATEST.pages.includes(page) ? page : ''
}

// https://vitepress.dev/reference/site-config
export default defineConfigWithTheme<ThemeConfig>({
  title: 'rness',
  description:
    'Documentation for rness, the governance layer for AI agents across a GitHub organization.',
  lang: 'en-US',
  // Served under /docs of the landing domain through a rewrite (see vercel.json)
  base: '/docs/',
  cleanUrls: true,
  lastUpdated: true,
  // Repository files, not pages of the site
  srcExclude: ['README.md', 'AGENTS.md', 'CLAUDE.md'],
  // The landing page is dark-only; the docs follow it
  appearance: 'force-dark',
  rewrites: REWRITE,

  sitemap: {
    // Same served form as the canonical links: no trailing slash anywhere.
    // VitePress hands the home page over as an empty url, which the stream
    // would join to the hostname as `…/docs/`. Only the latest release is
    // listed: the other copies are not for search engines.
    hostname: SITE_URL,
    transformItems: (items) =>
      items
        .filter((item) => versionOfPath(VERSIONS, item.url).latest)
        .map((item) => ({
          ...item,
          url: item.url === '' ? SITE_URL : `${SITE_URL}/${item.url}`,
        })),
  },

  transformPageData(pageData) {
    // The served form has no trailing slash (vercel.json): the home page is
    // `SITE_URL` itself. A copy that is not the latest release points its
    // canonical link at the latest page and asks not to be indexed.
    const path = pageData.relativePath
    const latest = versionOfPath(VERSIONS, path).latest
    const page = latestOf(path).replace(/(^|\/)index$/, '')
    const canonicalUrl = page === '' ? SITE_URL : `${SITE_URL}/${page}`
    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push(['link', { rel: 'canonical', href: canonicalUrl }])
    if (!latest) pageData.frontmatter.head.push(['meta', { name: 'robots', content: 'noindex' }])
  },

  head: [
    ['link', { rel: 'icon', href: '/docs/favicon.svg', type: 'image/svg+xml' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'rness' }],
  ],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: '/logo.svg',
    siteTitle: 'rness',
    // The default logo link is `base` — `/docs/`, one redirect per click on
    // the site's own host and through rness.dev. `/docs` is the served form.
    logoLink: '/docs',

    // Guide and CLI are in theme/VersionNav.vue: they follow the version
    // being read, which a static `nav` cannot. The guide's order is GUIDE
    // above; each version gets its own sidebars.
    nav: [],
    sidebar: Object.assign({}, ...VERSIONS.map(sidebarOf)),

    socialLinks: [{ icon: 'github', link: 'https://github.com/rness-dev/rness' }],

    // The latest release only: results from other versions would compete.
    search: {
      provider: 'local',
      options: {
        _render(src, env, md) {
          // `env.relativePath` is the source file: where it is served decides.
          if (!versionOfPath(VERSIONS, REWRITE(env.relativePath)).latest) return ''
          return md.render(src, env)
        },
      },
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: '© 2026 rness',
    },

    editLink: {
      pattern: 'https://github.com/rness-dev/docs/edit/main/:path',
      text: 'Edit this page on GitHub',
    },

    // Read by the theme's version menu (theme/VersionMenu.vue).
    versions: VERSIONS.map(({ id, label, prefix, latest, pages }) => ({
      id,
      label,
      prefix,
      latest,
      pages,
    })),
  },
})
