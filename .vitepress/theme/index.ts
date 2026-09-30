/// <reference types="vitepress/client" />
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'

import HeroDiagram from './HeroDiagram.vue'
import VersionMenu from './VersionMenu.vue'
import VersionNav from './VersionNav.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  // Analytics in the browser only, loaded apart from the pages (spec 0024).
  enhanceApp() {
    if (!import.meta.env.SSR) void import('./analytics').then((m) => m.startAnalytics())
  },
  // The version-aware Guide and CLI links, and the version menu (spec 0021
  // §3), in the top bar and in the menu that replaces it on a narrow screen.
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'nav-bar-content-before': () => h(VersionNav),
      'nav-bar-content-after': () => h(VersionMenu),
      'nav-screen-content-before': () => h(VersionNav, { screen: true }),
      'nav-screen-content-after': () => h(VersionMenu, { screen: true }),
      // The landing page's hero diagram, top to bottom, at the right of the
      // home page's text (custom.css hides it where there is no right).
      'home-hero-image': () => h(HeroDiagram),
    }),
} satisfies Theme
