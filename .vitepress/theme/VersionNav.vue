<script setup lang="ts">
// The top bar's Guide and CLI links, in the version being read (spec 0021
// §3): a reader of v0.14 stays in v0.14. The default theme's `nav` is empty
// for that reason — its links would always lead to the latest release.
import { withBase } from 'vitepress'
import { computed } from 'vue'

import { useDocsVersion } from './useDocsVersion'

defineProps<{ screen?: boolean }>()
const { current, pageKey } = useDocsVersion()

const links = computed(() => {
  const prefix = current.value?.prefix ?? ''
  return [
    { text: 'Guide', section: 'guide/', href: withBase(`/${prefix}guide/getting-started`) },
    { text: 'CLI', section: 'cli/', href: withBase(`/${prefix}cli/commands`) },
  ]
})
</script>

<template>
  <nav :class="screen ? 'version-nav-screen' : 'version-nav'" aria-label="Main">
    <a
      v-for="link in links"
      :key="link.text"
      :href="link.href"
      :class="{ active: pageKey.startsWith(link.section) }"
      >{{ link.text }}</a
    >
  </nav>
</template>

<style scoped>
.version-nav {
  display: none;
  align-items: center;
}
@media (min-width: 768px) {
  .version-nav {
    display: flex;
  }
}
.version-nav a {
  display: block;
  padding: 0 12px;
  font-size: 14px;
  font-weight: 500;
  line-height: var(--vp-nav-height);
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: color 0.25s;
}
.version-nav a:hover,
.version-nav a.active {
  color: var(--vp-c-brand-1);
}
.version-nav a:focus-visible,
.version-nav-screen a:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: -2px;
}

.version-nav-screen a {
  display: block;
  padding: 12px 0 11px;
  border-bottom: 1px solid var(--vp-c-divider);
  font-size: 14px;
  font-weight: 500;
  line-height: 24px;
  color: var(--vp-c-text-1);
  text-decoration: none;
}
.version-nav-screen a.active {
  color: var(--vp-c-brand-1);
}
</style>
