# rness docs

Source of the public documentation site of
[rness](https://github.com/rness-dev/rness), the governance layer for AI agents
across a GitHub organization.

Status on 2026-09-21: the site is a scaffold. It has a home page and no
content pages yet, and it is not deployed. The intended address is
`https://rness.dev/docs`.

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
opening a pull request.

## Layout

| Path | Role |
| --- | --- |
| `index.md` | Home page |
| `guide/` | Guide pages (empty) |
| `cli/` | CLI reference pages (empty) |
| `public/` | Static files, served under `/docs/` |
| `.vitepress/config.ts` | Site configuration: navigation, sidebars, metadata |
| `.vitepress/theme/` | Default VitePress theme plus the rness colour tokens |
| `vercel.json` | Output directory and the `/docs/:path*` rewrite |

Adding a page: create the Markdown file, then register it in `nav` or
`sidebar` in `.vitepress/config.ts`. Navigation is not generated.

## Configuration

No environment variable is required. The site is served under the `/docs/`
base path (`base` in `.vitepress/config.ts`); the landing domain reaches it
through a rewrite.

## Contributing

Fix or add a Markdown file, run `pnpm build`, open a pull request.
