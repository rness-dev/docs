import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'

import VersionMenu from './VersionMenu.vue'
import VersionNav from './VersionNav.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  // The version-aware Guide and CLI links, and the version menu (spec 0021
  // §3), in the top bar and in the menu that replaces it on a narrow screen.
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'nav-bar-content-before': () => h(VersionNav),
      'nav-bar-content-after': () => h(VersionMenu),
      'nav-screen-content-before': () => h(VersionNav, { screen: true }),
      'nav-screen-content-after': () => h(VersionMenu, { screen: true }),
    }),
} satisfies Theme
