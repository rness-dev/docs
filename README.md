# rness docs

Source of the public documentation site of
[rness](https://github.com/rness-dev/rness), the governance layer for AI agents
across a GitHub organization.

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
```

There is no test suite and no linter; `pnpm build` is the check to run before
opening a pull request. It also fails when the pinned `@rness/cli` has a
command the CLI page has no `## \`rness <name>\`` section for, or the page a
section for a command the CLI no longer has.

## Layout

| Path | Role |
| --- | --- |
| `index.md` | Home page |
| `guide/` | Getting started, the workspace, versions |
| `cli/commands.md` | CLI reference: a paragraph per command around the help the loader renders |
| `.vitepress/cli.data.ts` | Runs the pinned `@rness/cli`'s `--help` at build time; the CLI page renders it |
| `.github/dependabot.yml` | Moves that pin by pull request on each release |
| `public/` | Static files, served under `/docs/` |
| `.vitepress/config.ts` | Site configuration: navigation, sidebars, metadata |
| `.vitepress/theme/` | Default VitePress theme plus the rness colour tokens |
| `vercel.json` | Output directory, the `/docs/:path*` rewrite, no trailing slash |

Adding a page: create the Markdown file, then register it in `nav` or
`sidebar` in `.vitepress/config.ts`. Navigation is not generated.

## Configuration

No environment variable is required. The site is served under the `/docs/`
base path (`base` in `.vitepress/config.ts`); the landing domain reaches it
through a rewrite.

## Contributing

Fix or add a Markdown file, run `pnpm build`, open a pull request.
