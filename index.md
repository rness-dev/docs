---
layout: home

hero:
  name: Rness
  text: One source of truth for every agent.
  tagline: The organization's standards, decisions, specifications and plans — Markdown in git, written into the AGENTS.md of every repository by one command.
  actions:
    - theme: brand
      text: Get started
      link: /guide/getting-started.md
    - theme: alt
      text: CLI reference
      link: /cli/commands.md
    - theme: alt
      text: GitHub ↗
      link: https://github.com/rness-dev/rness

features:
  - title: One context, every repository
    details: A workspace mirrors a GitHub organization. Its context lives in one repository, .rness, and rness sync writes the part that applies into each repository's AGENTS.md — a marked block, the rest of the file untouched.
  - title: Every agent, unchanged
    details: Claude Code, Codex, Cursor and GitHub Copilot read AGENTS.md already. No new agent, no new workflow, no new configuration format.
  - title: One version for the whole team
    details: The Rness version is pinned in .rness. Each release opens a pull request there; once it is merged, each teammate's next rness command installs it.
---
