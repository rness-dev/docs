# rness docs

Public documentation site of rness, built with VitePress. See
[README.md](README.md) for the layout and the local workflow.

- `pnpm build` is the only check: it compiles the theme and the pages, and
  fails on a dead link. Run it after touching `.vitepress/config.ts`, the theme
  or any page.
- Navigation and sidebars are written by hand in `.vitepress/config.ts`; a
  new page appears nowhere until it is registered there.
- The site is served under `/docs/` (`base` in the config, the rewrite in
  `vercel.json`). Absolute paths in `head` and in CSS carry that prefix;
  Markdown links and `themeConfig` paths do not.
- Colour tokens in `.vitepress/theme/custom.css` mirror the landing page
  (`rness-dev/web`, `src/app/globals.css`). Change them together.
- Pages describe what `@rness/cli` ships. A planned feature is labelled as
  planned, never written as current behaviour.
- Native-build approval for esbuild lives in `pnpm-workspace.yaml`
  (`allowBuilds`), not in `package.json`.
