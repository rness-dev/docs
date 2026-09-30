import { useData } from 'vitepress'
import { computed } from 'vue'

import type { MenuVersion, ThemeConfig } from '../config'

/**
 * The version of the page being read (spec 0021 §3), from its served path:
 * `v0.14/guide/x.md` is v0.14's, `next/…` the working copy's, anything else
 * the latest release's — the home page and `all-versions` included.
 */
export function useDocsVersion() {
  const { theme, page } = useData<ThemeConfig>()
  const versions = computed<MenuVersion[]>(() => theme.value.versions ?? [])
  const current = computed<MenuVersion | undefined>(() => {
    const path = page.value.relativePath
    return (
      versions.value.find((v) => v.prefix !== '' && path.startsWith(v.prefix)) ??
      versions.value.find((v) => v.latest) ??
      versions.value[0]
    )
  })
  /** The page being read, without its version: `guide/workspace`. */
  const pageKey = computed(() =>
    page.value.relativePath.replace(/\.md$/, '').slice(current.value?.prefix.length ?? 0)
  )
  return { versions, current, pageKey }
}
