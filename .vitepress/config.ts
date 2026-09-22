import { defineConfig } from 'vitepress'

// The public host: rness.dev rewrites /docs to this deployment (org/web,
// next.config.ts). Canonical links and the sitemap name that host, so the
// *.vercel.app one never competes in search.
const SITE_URL = 'https://rness.dev/docs'

// https://vitepress.dev/reference/site-config
export default defineConfig({
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

  sitemap: {
    // Same served form as the canonical links: no trailing slash anywhere.
    // VitePress hands the home page over as an empty url, which the stream
    // would join to the hostname as `…/docs/`.
    hostname: SITE_URL,
    transformItems: (items) =>
      items.map((item) => ({
        ...item,
        url: item.url === '' ? SITE_URL : `${SITE_URL}/${item.url}`,
      })),
  },

  // Canonical URLs point at the public host so a deployment URL never competes in search
  transformPageData(pageData) {
    // The served form has no trailing slash (vercel.json): the home page is
    // `SITE_URL` itself. No other page is an `index.md` — VitePress writes its
    // links to those as `<dir>/`, one redirect per click through vercel.json.
    const canonicalUrl = `${SITE_URL}/${pageData.relativePath}`
      .replace(/\/index\.md$/, '')
      .replace(/\.md$/, '')
    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push(['link', { rel: 'canonical', href: canonicalUrl }])
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

    // Navigation and sidebars are written by hand, in the same commit as the
    // page they point to: these links are not checked at build time.
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'CLI', link: '/cli/commands' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting started', link: '/guide/getting-started' },
            { text: 'The workspace', link: '/guide/workspace' },
            { text: 'Versions', link: '/guide/versions' },
          ],
        },
      ],
      '/cli/': [
        {
          text: 'CLI reference',
          items: [{ text: 'Commands', link: '/cli/commands' }],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/rness-dev/rness' }],

    search: { provider: 'local' },

    footer: {
      message: 'Released under the MIT License.',
      copyright: '© 2026 rness',
    },

    editLink: {
      pattern: 'https://github.com/rness-dev/docs/edit/main/:path',
      text: 'Edit this page on GitHub',
    },
  },
})
