/// <reference types="vitepress/client" />
import posthog from 'posthog-js'

/*
 * Analytics without cookies, as on the landing page (rness-dev/web,
 * `instrumentation-client.ts`; spec 0024): nothing is kept in the browser, and
 * PostHog counts visitors by a hash made on its servers, so a visit that goes
 * from the landing page to the docs is one visitor. Events go through the
 * landing page's proxy on rness.dev: this site's own domain has
 * `trailingSlash: false`, which would redirect PostHog's `…/e/` POSTs.
 * Without `VITE_POSTHOG_PROJECT_TOKEN`, nothing loads.
 */
const token: string | undefined = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN

type Tracked = { name: string; properties: Record<string, string> }

/** What a click is, for analytics: the default theme's copy button, the top bar's GitHub link, or nothing. */
function trackedOf(target: EventTarget | null): Tracked | null {
  if (!(target instanceof Element)) return null
  if (target.closest('.vp-doc button.copy'))
    return { name: 'docs_code_copied', properties: { page: location.pathname } }
  if (target.closest('a.VPSocialLink[href*="github.com"]'))
    return { name: 'github_cta_clicked', properties: { location: 'docs-nav' } }
  return null
}

export function startAnalytics(): void {
  if (!token) return
  posthog.init(token, {
    api_host: 'https://rness.dev/rly',
    ui_host: 'https://eu.posthog.com',
    defaults: '2026-05-30',
    cookieless_mode: 'always',
    // The page views and the two events below only (spec 0024 §4).
    autocapture: false,
    capture_dead_clicks: false,
    capture_performance: false,
    disable_session_recording: true,
  })
  document.addEventListener(
    'click',
    (event) => {
      const tracked = trackedOf(event.target)
      if (tracked === null) return
      // The GitHub link leaves the page: the event goes now, by beacon.
      posthog.capture(tracked.name, tracked.properties, {
        send_instantly: true,
        transport: 'sendBeacon',
      })
    },
    { capture: true }
  )
}
