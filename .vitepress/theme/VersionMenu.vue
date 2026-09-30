<script setup lang="ts">
// The version menu (spec 0021 §3): the version of the page being read, and
// the same page in every other version the site serves — that version's
// "Getting started" when it has no such page. In the top bar it is a
// disclosure; in the mobile menu (`screen`), a plain list.
import { withBase } from 'vitepress'
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'

import type { MenuVersion } from '../config'
import { useDocsVersion } from './useDocsVersion'

const props = defineProps<{ screen?: boolean }>()
const { versions, current, pageKey } = useDocsVersion()
const id = useId()

const short = (v: MenuVersion | undefined) =>
  v === undefined ? '' : v.id === 'next' ? (v.latest ? 'Latest' : 'Unreleased') : `v${v.id}`

function hrefOf(v: MenuVersion): string {
  const target = v.pages.includes(pageKey.value) ? pageKey.value : 'guide/getting-started'
  return withBase(`/${v.prefix}${target}`)
}

const open = ref(false)
const container = ref<HTMLElement>()
const trigger = ref<HTMLButtonElement>()

function close(focus: boolean) {
  open.value = false
  if (focus) trigger.value?.focus()
}
function onPointer(event: PointerEvent) {
  if (open.value && !container.value?.contains(event.target as Node)) close(false)
}
/** Tabbing out of the menu closes it. */
function onFocusOut(event: FocusEvent) {
  if (!container.value?.contains(event.relatedTarget as Node | null)) open.value = false
}
function onKey(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) close(true)
}
onMounted(() => {
  if (props.screen) return
  document.addEventListener('pointerdown', onPointer)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointer)
  document.removeEventListener('keydown', onKey)
})
</script>

<template>
  <nav v-if="screen" class="version-screen" aria-label="Documentation version">
    <p class="heading">Version</p>
    <ul>
      <li v-for="v in versions" :key="v.id">
        <a :href="hrefOf(v)" :aria-current="v.id === current?.id ? 'page' : undefined">{{
          v.label
        }}</a>
      </li>
      <li><a :href="withBase('/all-versions')">All versions</a></li>
    </ul>
  </nav>

  <div v-else ref="container" class="version-menu" @focusout="onFocusOut">
    <button
      ref="trigger"
      type="button"
      class="trigger"
      :aria-expanded="open"
      :aria-controls="id"
      :aria-label="`Documentation version: ${short(current)}`"
      @click="open = !open"
    >
      {{ short(current) }}
      <span class="caret" aria-hidden="true">▾</span>
    </button>
    <ul v-show="open" :id="id" class="items">
      <li v-for="v in versions" :key="v.id">
        <a
          :href="hrefOf(v)"
          :aria-current="v.id === current?.id ? 'page' : undefined"
          @click="close(false)"
          >{{ v.label }}</a
        >
      </li>
      <li class="all">
        <a :href="withBase('/all-versions')" @click="close(false)">All versions</a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.version-menu {
  position: relative;
  display: flex;
  align-items: center;
  margin-left: 12px;
}

.trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  line-height: 20px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
}
.trigger:hover {
  border-color: var(--vp-c-brand-1);
}
.trigger:focus-visible,
.items a:focus-visible,
.version-screen a:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}
.caret {
  font-size: 11px;
  color: var(--vp-c-text-2);
}

.items {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 50;
  min-width: 170px;
  margin: 0;
  padding: 6px;
  list-style: none;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-elv);
  box-shadow: var(--vp-shadow-3);
}
.items a,
.version-screen a {
  display: block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 14px;
  line-height: 24px;
  color: var(--vp-c-text-1);
  text-decoration: none;
  white-space: nowrap;
}
.items a:hover {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-default-soft);
}
.items a[aria-current='page'],
.version-screen a[aria-current='page'] {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.items .all {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid var(--vp-c-divider);
}

.version-screen {
  margin-top: 24px;
  padding-top: 12px;
  border-top: 1px solid var(--vp-c-divider);
}
.version-screen .heading {
  margin: 0 0 4px;
  padding: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
}
.version-screen ul {
  margin: 0;
  padding: 0;
  list-style: none;
}
.version-screen a {
  padding: 6px 0;
}
</style>
