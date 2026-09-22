import { defineConfig } from 'vitepress'

// Becomes https://rness.dev/docs once the domain is configured.
const SITE_URL = 'https://rness-docs.vercel.app/docs'

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
    hostname: `${SITE_URL}/`,
  },

  // Canonical URLs point at the public host so a deployment URL never competes in search
  transformPageData(pageData) {
    const canonicalUrl = `${SITE_URL}/${pageData.relativePath}`
      .replace(/index\.md$/, '')
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

    // Navigation and sidebars are added with the pages they point to: VitePress
    // fails the build on a dead link.
    nav: [],
    sidebar: {},

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
