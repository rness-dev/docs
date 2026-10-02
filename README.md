# rness docs

Source of the public documentation site of
[Rness](https://github.com/rness-dev/rness): one source of truth for every
AI coding agent across a GitHub organization.

Live at `https://rness.dev/docs` — the landing domain rewrites `/docs` to
this deployment (`rness-docs.vercel.app`). The site documents what
`@rness/cli` ships and nothing else — the rule is in the generated block of
`AGENTS.md`.

## Prerequisites

Node ≥ 24 and pnpm.

## Local workflow

```bash
pnpm install
pnpm dev        # http://localhost:5173/docs/
pnpm build      # the validation command: compiles the site, fails on a dead link
pnpm preview    # serves the build
pnpm freeze     # freezes the working copy as the pinned CLI's minor (below)
```

There is no test suite and no linter; `pnpm build` is the check to run before
opening a pull request. It also fails when the pinned `@rness/cli` has a
command the CLI page has no `## \`rness <name>\`` section for, or the page a
section for a command the CLI no longer has.

## Versions

The site serves one copy of the guide and the CLI reference per `@rness/cli`
minor, and a version menu in the top bar switches between them.

| Source | Served at | What |
| --- | --- | --- |
| `guide/`, `cli/` | `/docs/next/` ("Unreleased") | The working copy: edit this |
| `versions/<latest>/` | `/docs/` | The latest release, frozen |
| `versions/<older>/` | `/docs/v<minor>/` | The three minors before it, frozen |

After a release of `@rness/cli`, the workflow `Release`
(`.github/workflows/release.yml`) does the freeze. The rness repository's
`Publish` workflow starts it with the version it has just published, and it
waits for npm to answer that version; every hour, or at once with its "Run
workflow" button, it compares the pin with npm's latest instead. A newer
version gets a branch `release/<version>` and a pull request:

1. the pin moved to the new version;
2. `pnpm freeze`: `guide/` and `cli/` copied into `versions/<minor>/`, the
   pinned CLI's help written into `versions/<minor>/cli-help.json`, and the
   copies older than the latest minor and the three before it dropped; a
   patch release refreezes its minor;
3. `pnpm build`, which fails on a dead link: then no pull request.

Merging the pull request deploys `/docs`. What the workflow cannot do comes
before: `guide/` and `cli/` must describe the release, written with the work
that made it; the pull request asks. By hand, the same three steps are
`pnpm add -D @rness/cli@<version> --save-exact`, `pnpm freeze`,
`pnpm build`, then a commit of `versions/` with the pin.

Until the freeze, `/docs/` keeps the previous release, which stays true of
that release. Never edit a frozen copy by hand, except to fix an error in
it; the next freeze of that minor overwrites it.

- Internal links are relative `.md` links (`./workspace.md#…`,
  `../cli/commands.md#…`): they resolve inside whichever version serves the
  page.
- Only the latest release is in the search index and the sitemap; the other
  copies carry `noindex`, and their canonical link names the latest page.

## Layout

| Path | Role |
| --- | --- |
| `index.md` | Home page |
| `all-versions.md` | The versions the site keeps |
| `guide/`, `cli/` | The working copy (see Versions) |
| `versions/<minor>/` | A frozen release: `guide/`, `cli/`, `cli-help.json` |
| `.vitepress/versions.ts` | Lists the versions, and where each page is served |
| `.vitepress/cli-help.ts` | Runs the pinned `@rness/cli`'s `--help`, for the CLI page and its twin |
| `.vitepress/cli.data.ts` | Renders that help for the working copy's CLI page |
| `.vitepress/twins.ts` | At the end of the build: the Markdown twin of every page, `llms.txt`, `llms-full.txt` (see Agent-readable) |
| `.vitepress/frozen.data.ts` | Renders each frozen `cli-help.json` for its copy |
| `.vitepress/config.ts` | Rewrites, sidebars per version, metadata, search |
| `.vitepress/theme/` | Default VitePress theme, the rness colour tokens, the version menu and the version-aware top links |
| `scripts/freeze.mjs` | `pnpm freeze` |
| `.github/workflows/release.yml` | Freezes a new `@rness/cli` release, by pull request (see Versions) |
| `public/` | Static files, served under `/docs/` |
| `vercel.json` | Output directory, the `/docs/:path*` rewrite, redirects of moved pages, no trailing slash, the `Link` and `Vary` headers of the twins |

Adding a page to the guide: create it in `guide/`, add it to `GUIDE` in
`.vitepress/config.ts` (its sidebar order), and link it from a page that
readers reach.

## Agent-readable

Every page is also served as Markdown, at its URL plus `.md`:
`/docs/guide/getting-started.md` is the source of `/docs/guide/getting-started`,
front matter stripped, the VitePress containers flattened, the CLI page's
help inlined. Each HTML page advertises its twin with
`<link rel="alternate" type="text/markdown">` and, from `vercel.json`, a
`Link` header and `Vary: Accept`; the build fails when a page has no twin. `/docs/llms.txt` lists the pages of the latest release, one
line each with its first paragraph, and `/docs/llms-full.txt` holds them in
one file; neither names the working copy or an older minor. All of it is
written by `.vitepress/twins.ts` at the end of `pnpm build`.

A request to `rness.dev/docs/...` with `Accept: text/markdown` gets the
twin: that negotiation is the landing page's (rness-dev/web, its request
proxy), in front of this deployment.

## Configuration

No environment variable is required. The site is served under the `/docs/`
base path (`base` in `.vitepress/config.ts`); the landing domain reaches it
through a rewrite.

Analytics are optional. With `VITE_POSTHOG_PROJECT_TOKEN` set at build time
(on the Vercel project, for Production and Preview; locally in `.env.local`,
from `.env.example`), the theme loads PostHog
without cookies (`.vitepress/theme/analytics.ts`) and sends page views,
`docs_code_copied` and `github_cta_clicked` through the landing page's proxy,
`rness.dev/rly`. Without it, nothing loads.

## Contributing

Fix or add a Markdown file, run `pnpm build`, open a pull request.
