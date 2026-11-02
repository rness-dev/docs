<script setup lang="ts">
// The landing page's product window (rness-dev/web,
// src/components/landing/hero.tsx, `ProductWindow`): `rness sync --check`
// finding the drifted repository and `rness sync` bringing it back, over the
// block it writes. The output lines are the CLI's own. Keep the two in step.
const rows = [
  { status: 'unchanged', file: 'org/app1/AGENTS.md' },
  { status: 'unchanged', file: 'org/app2/AGENTS.md' },
  { status: 'stale', file: 'org/app3/AGENTS.md' },
]

const block = `<!-- BEGIN rness -->
This directory is scope app3 of
rness workspace acme.

## Rules
- Security policies
- Engineering principles
- Testing standards
<!-- END rness -->`
</script>

<template>
  <div class="hero-window" aria-hidden="true">
    <div class="file">
      <div class="file-bar">org/app3/AGENTS.md</div>
      <pre class="file-body">{{ block }}</pre>
    </div>

    <div class="terminal">
      <div class="terminal-bar">
        <span class="dot" />
        <span class="dot" />
        <span class="dot" />
        <span class="title">acme - zsh</span>
      </div>
      <div class="terminal-body">
        <div><span class="prompt">$</span> <span class="strong">rness sync --check</span></div>
        <div v-for="row in rows" :key="row.file" class="row">
          <span :class="['status', row.status]">{{ row.status }}</span>
          <span :class="{ strong: row.status === 'stale' }">{{ row.file }}</span>
        </div>
        <div class="warn">1 block(s) out of date - run rness sync</div>
        <div class="gap"><span class="prompt">$</span> <span class="strong">rness sync -y</span></div>
        <div class="row">
          <span class="status updated">updated</span>
          <span class="strong">org/app3/AGENTS.md</span>
        </div>
        <div><span class="prompt">$</span> <span class="caret" /></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-window {
  position: relative;
  width: 480px;
  height: 420px;
  font-family: var(--vp-font-family-mono);
}

.file {
  position: absolute;
  top: 6px;
  right: 0;
  width: 78%;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
  box-shadow: var(--rness-shadow-window);
  transform: rotate(4deg);
}
.file-bar {
  display: flex;
  align-items: center;
  height: 38px;
  padding: 0 14px;
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  font-size: 12px;
  color: var(--vp-c-text-3);
}
.file-body {
  margin: 0;
  padding: 16px 18px;
  font-size: 12px;
  line-height: 1.75;
  color: var(--rness-terminal-line);
  white-space: pre;
}

.terminal {
  position: absolute;
  top: 120px;
  left: 0;
  width: 88%;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--vp-c-bg);
  box-shadow:
    0 40px 80px -32px rgb(20 22 27 / 0.35),
    0 2px 6px rgb(20 22 27 / 0.05);
  animation: window-float 7s ease-in-out infinite;
}
.terminal-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  padding: 0 14px;
  border-bottom: 1px solid var(--vp-c-divider);
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--rness-dot);
}
.title {
  margin-left: 8px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}
.terminal-body {
  padding: 18px 20px 20px;
  font-size: 13px;
  line-height: 1.85;
  color: var(--rness-terminal-line);
}
.row {
  display: flex;
  gap: 14px;
}
.status {
  width: 84px;
  color: var(--vp-c-text-3);
}
.status.stale {
  font-weight: 600;
  color: var(--rness-warn);
}
.status.updated {
  font-weight: 600;
  color: var(--vp-c-brand-1);
}
.prompt {
  color: var(--vp-c-brand-1);
}
.strong {
  color: var(--vp-c-text-1);
}
.warn {
  color: var(--rness-warn);
}
.gap {
  margin-top: 10px;
}
.caret {
  display: inline-block;
  width: 8px;
  height: 15px;
  vertical-align: -2px;
  background: var(--vp-c-text-1);
  animation: caret-blink 1.1s steps(1) infinite;
}

@keyframes window-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}
@keyframes caret-blink {
  50% {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: reduce) {
  .terminal,
  .caret {
    animation: none;
  }
}
</style>
