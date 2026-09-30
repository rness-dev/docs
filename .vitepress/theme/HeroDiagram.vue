<script setup lang="ts">
// The landing page's hero diagram (rness-dev/web,
// src/components/landing/hero-diagram.tsx), stacked top to bottom to sit at
// the right of the home page's text: Rness hands the organization's context
// to whichever agent a team uses, and that agent carries it into every
// repository. The travelling light is a gradient moved by SMIL `<animate>`,
// as on the landing page: no dependency. Keep the two in step.
import { onBeforeUnmount, onMounted, ref, useId } from 'vue'

/*
 * Agent logos from simple-icons (CC0 1.0), as on the landing page: Claude
 * (Claude Code), OpenAI (Codex), Cursor. The marks belong to their owners;
 * they are here to name the tools.
 */
const agents = [
  {
    name: 'Claude Code',
    path: 'm4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z',
  },
  {
    name: 'Codex',
    path: 'M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z',
  },
  {
    name: 'Cursor',
    path: 'M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23',
  },
]

const GITHUB =
  'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'

const repositories = ['app1', 'app2', 'app3']

// One pass of light takes BEAM_SECONDS on every beam. The repository beams
// start as the first one reaches the agents, so the light appears to flow on.
const BEAM_SECONDS = 3.2
const HANDOFF_SECONDS = 1.7

type Ends = { x1: number; y1: number; x2: number; y2: number }
type Beam = { id: string; path: string; enter: Ends; leave: Ends; delay: number }

const ENDPOINTS = ['x1', 'y1', 'x2', 'y2'] as const

// useId may contain characters that break a `url(#…)` reference.
const uid = useId().replace(/[^\w-]/g, '')

const figure = ref<HTMLElement | null>(null)
const rness = ref<HTMLElement | null>(null)
const agentBox = ref<HTMLElement | null>(null)
// Held by index, in the order of `repositories`: each beam's delay follows it.
const repoNodes: HTMLElement[] = []
const size = ref({ width: 0, height: 0 })
const beams = ref<Beam[]>([])

/**
 * A beam from the bottom edge of `from` to the top edge of `to`. Both control
 * points sit halfway down, so it leaves and arrives square to the node edges.
 */
function beamOf(box: DOMRect, from: HTMLElement, to: HTMLElement, id: string, delay: number): Beam {
  const a = from.getBoundingClientRect()
  const b = to.getBoundingClientRect()
  const start = { x: a.left + a.width / 2 - box.left, y: a.bottom - box.top }
  const end = { x: b.left + b.width / 2 - box.left, y: b.top - box.top }
  const middle = (start.y + end.y) / 2
  const length = Math.hypot(end.x - start.x, end.y - start.y) || 1
  const ux = (end.x - start.x) / length
  const uy = (end.y - start.y) / length
  const tail = Math.max(length * 0.4, 48)

  // The gradient runs from the tail of the light to its head, and slides from
  // "head at the start" to "tail at the end" so each pass enters and leaves.
  return {
    id: `${uid}-${id}`,
    path: `M ${start.x},${start.y} C ${start.x},${middle} ${end.x},${middle} ${end.x},${end.y}`,
    enter: { x1: start.x - tail * ux, y1: start.y - tail * uy, x2: start.x, y2: start.y },
    leave: { x1: end.x, y1: end.y, x2: end.x + tail * ux, y2: end.y + tail * uy },
    delay,
  }
}

function measure() {
  const container = figure.value
  if (!container || !rness.value || !agentBox.value) return
  const box = container.getBoundingClientRect()
  size.value = { width: box.width, height: box.height }
  beams.value = [
    beamOf(box, rness.value, agentBox.value, 'agents', 0),
    ...repoNodes.map((node, i) =>
      beamOf(box, agentBox.value!, node, `repo${i}`, HANDOFF_SECONDS + i * 0.2)
    ),
  ]
}

// Measured in the browser only: the server renders the nodes, and the beams
// appear once their ends are known.
let observer: ResizeObserver | undefined
onMounted(() => {
  observer = new ResizeObserver(measure)
  for (const element of [figure.value, rness.value, agentBox.value, ...repoNodes])
    if (element) observer.observe(element)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <figure ref="figure" class="hero-diagram">
    <figcaption class="visually-hidden">
      Rness gives Claude Code, Codex, Cursor and any agent that reads AGENTS.md the same rules,
      decisions and context in every repository of the organization.
    </figcaption>

    <svg
      v-if="beams.length"
      class="beams"
      aria-hidden="true"
      :width="size.width"
      :height="size.height"
      :viewBox="`0 0 ${size.width} ${size.height}`"
      fill="none"
    >
      <defs>
        <linearGradient
          v-for="beam in beams"
          :id="beam.id"
          :key="beam.id"
          gradientUnits="userSpaceOnUse"
          v-bind="beam.enter"
        >
          <stop offset="0%" style="stop-color: var(--vp-c-brand-1); stop-opacity: 0" />
          <stop offset="40%" style="stop-color: var(--vp-c-brand-1)" />
          <stop offset="80%" style="stop-color: var(--rness-beam-head)" />
          <stop offset="100%" style="stop-color: var(--rness-beam-head); stop-opacity: 0" />
          <animate
            v-for="endpoint in ENDPOINTS"
            :key="endpoint"
            :attributeName="endpoint"
            :values="`${beam.enter[endpoint]};${beam.leave[endpoint]}`"
            :dur="`${BEAM_SECONDS}s`"
            :begin="`${beam.delay}s`"
            repeatCount="indefinite"
          />
        </linearGradient>
      </defs>
      <g v-for="beam in beams" :key="beam.id">
        <path :d="beam.path" class="rail" stroke-width="2" />
        <path
          :d="beam.path"
          class="light"
          :stroke="`url(#${beam.id})`"
          stroke-width="6"
          stroke-opacity="0.35"
          stroke-linecap="round"
        />
        <path
          :d="beam.path"
          class="light"
          :stroke="`url(#${beam.id})`"
          stroke-width="2"
          stroke-linecap="round"
        />
      </g>
    </svg>

    <div ref="rness" class="rness">
      <svg class="mark" viewBox="0 0 120 120" fill="none" aria-hidden="true">
        <rect width="120" height="120" rx="26" fill="#F2F3F4" />
        <path
          d="M38.33 79.3C38.33 80.9569 36.9869 82.3 35.33 82.3H21C19.3431 82.3 18 80.9569 18 79.3V22C18 20.3431 19.3431 19 21 19H57.65C62.37 19 66.31 19.9533 69.47 21.86C72.63 23.76 75.0067 26.2433 76.6 29.31C78.1933 32.3767 78.99 35.6867 78.99 39.24C78.99 43.2933 78.04 46.8967 76.14 50.05C74.7214 52.4093 72.9257 54.4174 70.7528 56.0743C69.4927 57.0352 68.9655 58.7428 69.6783 60.1581L78.6394 77.9505C79.6443 79.9457 78.194 82.3 75.96 82.3H59.9517C58.7753 82.3 57.7074 81.6124 57.2206 80.5415L49.1594 62.8085C48.6726 61.7376 47.6047 61.05 46.4283 61.05H41.33C39.6731 61.05 38.33 62.3931 38.33 64.05V79.3ZM41.33 33.45C39.6731 33.45 38.33 34.7931 38.33 36.45V43.97C38.33 45.6268 39.6731 46.97 41.33 46.97H52.59C54.1833 46.97 55.5333 46.3433 56.64 45.09C57.74 43.83 58.29 42.1567 58.29 40.07C58.29 38.7833 58.0467 37.65 57.56 36.67C57.0667 35.69 56.39 34.9067 55.53 34.32C54.6767 33.74 53.6967 33.45 52.59 33.45H41.33Z"
          fill="#0C0E10"
        />
        <path
          d="M75.69 72.8C78.91 79.24 79.59 77.8 86.19 77.8H98.19C99.2509 77.8 100.268 78.2214 101.018 78.9716C101.769 79.7217 102.19 80.7391 102.19 81.8V97.8C102.19 98.8609 101.769 99.8783 101.018 100.628C100.268 101.379 99.2509 101.8 98.19 101.8H82.19C81.1291 101.8 80.1117 101.379 79.3616 100.628C78.6114 99.8783 78.19 98.8609 78.19 97.8V87.3C78.19 81.3 72.69 81.8 66.69 81.8L75.69 72.8Z"
          fill="#0C0E10"
        />
      </svg>
      <span class="rness-text">
        <span class="wordmark">Rness</span>
        <span class="rness-caption">rules, decisions, context</span>
      </span>
    </div>

    <div ref="agentBox" class="agents">
      <ul>
        <li v-for="agent in agents" :key="agent.name">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path :d="agent.path" />
          </svg>
          <span>{{ agent.name }}</span>
        </li>
      </ul>
      <p>or any agent that reads AGENTS.md</p>
    </div>

    <div class="organization">
      <ul>
        <li v-for="(name, i) in repositories" :key="name">
          <div :ref="(el) => (repoNodes[i] = el as HTMLElement)" class="repository">{{ name }}</div>
        </li>
      </ul>
      <span class="organization-name">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path :d="GITHUB" />
        </svg>
        github.com/acme
      </span>
    </div>
  </figure>
</template>

<style scoped>
.hero-diagram {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
  margin: 0;
}

.beams {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}
.rail {
  stroke: var(--rness-control);
}
/* SMIL ignores media queries: the travelling light is hidden instead, and
   only the static rail remains. */
@media (prefers-reduced-motion: reduce) {
  .light {
    display: none;
  }
}

.rness {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 12px;
  background: var(--vp-c-bg-alt);
  padding: 12px 20px 12px 12px;
  box-shadow: 0 0 56px -12px var(--vp-c-brand-1);
}
.mark {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}
.rness-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.wordmark {
  font-family: var(--rness-font-logo);
  font-size: 20px;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1);
}
.rness-caption {
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  line-height: 1;
  color: var(--vp-c-text-2);
}

.agents {
  position: relative;
  border: 1px solid var(--rness-control);
  border-radius: 12px;
  background: var(--rness-surface-raised);
}
.agents ul {
  display: flex;
  gap: 6px;
  margin: 0;
  padding: 18px 12px 14px;
  list-style: none;
}
.agents li {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 76px;
  margin: 0;
  color: var(--rness-bright);
}
.agents li svg {
  width: 26px;
  height: 26px;
}
.agents li span {
  font-size: 12.5px;
  line-height: 1;
  white-space: nowrap;
  color: var(--vp-c-text-2);
}
.agents p {
  margin: 0;
  border-top: 1px solid var(--rness-hairline);
  padding: 11px 12px;
  text-align: center;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  line-height: 1;
  color: var(--vp-c-text-3);
}

.organization {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  border: 1px dashed var(--rness-control);
  border-radius: 12px;
  padding: 12px;
}
.organization ul {
  display: flex;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
.organization li {
  margin: 0;
}
.repository {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  min-height: 40px;
  border: 1px solid var(--rness-control);
  border-radius: 8px;
  background: var(--vp-c-bg-alt);
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  color: var(--rness-bright);
}
.organization-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  line-height: 1;
  color: var(--vp-c-text-3);
}
.organization-name svg {
  width: 12px;
  height: 12px;
}
</style>
