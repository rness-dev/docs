# The workspace

A rness workspace mirrors one GitHub organization:

```
<org>/
├── AGENTS.md        generated global block, not committed
├── CLAUDE.md        the same global block, for Claude Code, not committed
├── .rness/          the organization's context — a git repository
└── org/<repo>/      the repositories you work on, cloned; a monorepo is a
                     repository like any other, its parts declared as scopes
```

The workspace root is never a git repository. `.rness/` is one, shared by the
team; `org/` holds your clones, and nothing but `org/` records which
repositories you chose. Two teammates can clone different repositories of the
same organization; the catalogue is the same for both.

This page describes `@rness/cli` 0.7.0.

## `rness.json`, the catalogue

```json
{
  "contract": 1,
  "org": "acme",
  "agents": ["claude"],
  "repos": {
    "app": { "url": "git@github.com:acme/app.git" },
    "platform": { "url": "https://github.com/acme/platform.git" }
  },
  "scopes": {
    "app": { "path": "org/app" },
    "platform": { "path": "org/platform" },
    "web": { "path": "org/platform/apps/web", "extends": ["platform"] }
  }
}
```

- `repos` — every repository rness knows about. `rness add` declares one;
  `rness create` and `rness sync` clone the ones you pick. A choice never
  removes a repository from the catalogue.
- `agents` — the agents the team uses, for which rness writes more than the
  block ([Agent targets](#agent-targets)). Optional: absent means never asked,
  `[]` means none.
- `scopes` — where context resolves: a repository, or a directory inside one,
  with an optional `extends`. `rness add platform --scopes apps/web` writes
  the scope `web` above.
- A repository or scope name takes what GitHub allows, in lowercase: letters,
  digits, `.`, `_` and `-`. `org` follows GitHub's rule for organization
  names, case kept as typed.
- A URL is cloned as written, never converted. `create` and `add` write
  `git@github.com:` URLs when your SSH key is accepted, `https://github.com/`
  ones otherwise (`--ssh`, `--https`).

## The collections

| Directory | Role | Front matter |
| --- | --- | --- |
| `standards/` | Reusable guidance — the part written into `AGENTS.md` | none |
| `adr/` | Durable decisions, never rewritten, superseded by a new ADR | `status`: `Proposed`, `Accepted`, `Rejected`, `Superseded` |
| `specs/` | What is proposed and why | `status`: `Draft`, `Proposed`, `Approved`, `Implemented`, `Superseded`, `Rejected` |
| `plans/` | Ordered, verifiable implementation steps | `status`: `Draft`, `Ready`, `In progress`, `Blocked`, `Completed`, `Abandoned` |
| `skills/` | Reusable agent skills | none |

ADRs, specifications and plans start with YAML front matter before the first
`#` heading:

```yaml
---
date: 2026-09-22
status: Proposed
repo: app
---
```

`date` is the creation date; add `updated:` on a meaningful change, never on
an ADR. Link related documents with `spec:`, `plan:`, `adr:` or
`superseded_by:`. `rness validate` enforces the front matter and the status
sets; `adr/0000-template.md` is exempt.

`docs/` in the scaffold holds current-state notes for maintainers; rness does
not resolve it.

## How a scope's context is resolved

A file's directory decides its scope:

- `<collection>/<file>.md` applies everywhere;
- `<collection>/<scope>/**` applies to that scope, and to the scopes that
  extend it.

A scope's context is the global files of each collection, plus its own, plus
everything along its `extends` chain. Front matter never re-routes a file:
`rness validate` rejects a `scopes` or `scope` key.

`rness context --scope <name>` prints the resolved context as Markdown
(`--json` for a machine); without `--scope`, the scope owning the current
directory. The root of the workspace resolves the global files only.

## The generated block

`rness sync` writes the resolved `standards/` of each scope into
`org/<repo>/AGENTS.md` (and the sub-directory of a nested scope), between two
markers:

```md
<!-- BEGIN rness -->
<!-- rness · scope: app · contract: 1 · hash: 9f2c4d1e8b07 · generated: run `rness sync`, never edit inside this block -->
This directory is scope `app` of rness workspace `acme`. Full context lives in
`../../.rness/` — start at its `AGENTS.md`, then task-relevant `adr/`, `specs/`, `plans/`;
live: `rness context --scope app`. If `.rness/` is not reachable, this is a
standalone clone: the rules below are all you have.

## Rules
<!-- rness: standards/coding-style.md -->
# Coding style
…
<!-- END rness -->
```

- Everything outside the markers is yours; a new block is inserted after the
  file's first-line `#` heading and its blank line, else at the top.
- The header carries a hash of the body. `rness validate` and `rness sync
  --check` call a block stale when its hash no longer matches a fresh render
  — because the context changed, or because someone edited inside the
  markers. `sync` rewrites it; the rest of the file is untouched.
- Only `standards/` is written into the block. Decisions, specifications and
  plans are reached through `.rness/`, which the intro points at.
- In each repository, a `CLAUDE.md` holding `@AGENTS.md` is created next to
  the block for Claude Code when there is none; an existing one gets that
  line prepended.
- The workspace root gets a global block of its own, in `<org>/AGENTS.md` and
  in `<org>/CLAUDE.md` itself. Claude Code loads the root `CLAUDE.md` from
  every repository below it; an `@AGENTS.md` there would import a file
  outside the repository, which Claude Code gates behind a dialog. A line that
  is exactly `@AGENTS.md` is dropped from the root file; the rest of it is
  kept. The root files are on your machine only: run `rness sync` once after
  upgrading to 0.6.2 or later.

A block above 32 KiB is written with a warning: that is a lot of rules for an
agent to carry on every turn.

## Agent targets

Every agent that reads `AGENTS.md` gets the block. For the agents the team
declares in `rness.json`, `rness sync` also writes the files that agent needs:

```sh
rness sync --agent claude     # declare claude, then write its files
rness sync                    # in a terminal, with no agents key, asks once
```

- `agents` belongs to the team: the files it produces are committed in each
  repository, so they come out the same on every machine. Commit
  `.rness/rness.json` after declaring one, and the files it wrote in each
  repository.
- `rness create` asks for a new workspace, with its other questions, or takes
  `--agent claude`; a join takes the organization's list. `-y`, `--check` and
  scripts never ask.
- **Claude Code** (`claude`) — each clone gets `.claude/settings.json` with
  `../../.rness` in `permissions.additionalDirectories`: a session opened in
  the repository reads `.rness/` without a permission prompt. Claude Code
  resolves that path against the repository and applies it once the
  repository has been trusted in an interactive session. Verified with Claude
  Code 2.1.284 on 2026-09-29.
- Since 0.9.0, the same target registers the [MCP server](/cli/commands#rness-mcp):
  `.mcp.json` gets `mcpServers.rness`, which runs the copy pinned in
  `.rness/` (`node ../../.rness/node_modules/@rness/cli/dist/bin/rness.js mcp`).
  The server starting from the repository and answering is verified with
  Claude Code 2.1.284 on 2026-09-29. Each developer approves it once, in
  Claude Code's own dialog: rness does not pre-approve it (0.9.1), since
  `enabledMcpjsonServers` in a committed settings file would let any change
  to the `rness` entry of `.mcp.json` run unasked. Review such a change like
  code.
- Since 0.10.0, the same `.claude/settings.json` carries two hooks, and the
  workspace root gets a `.claude/settings.json` with the same two, for
  sessions started there — written on every machine, in no repository. At
  session start, Claude Code shows a line such as `rness 0.11.0 · acme ·
  scope web — 10 standards, 9 decisions`, and the model receives the scope's
  documents as `rness_context` lists them; when the context may be wrong —
  no `.rness` installed next to the repository, a `rness.json` rness refuses,
  a pin the installed copy does not match, problems `rness validate` would
  report — both say why. After an edit of a file under `.rness/`, the
  problems of its front matter, or of `rness.json`, go back to the model,
  which fixes them in the same turn; stale blocks are left to `rness sync`.
  Each hook is one fixed `sh` line that runs the copy pinned in `.rness/`.
  Claude Code runs hooks from a committed settings file without asking each
  developer, including in `claude -p`; these two read `.rness/` and nothing
  else. Verified with Claude Code 2.1.284 on 2026-09-29; the `sh` line is not
  verified on Windows.
- Since 0.11.0, each repository and the workspace root get a Claude Code
  plugin, `.claude/skills/rness/`, with one command: `/rness:status [tab]`,
  the tables of [`rness status`](/cli/commands#rness-status). Claude Code
  loads it once the folder is trusted, in a session started there. Nothing
  started from inside Claude Code gets the terminal, so the full-screen view
  cannot open from there: `Ctrl+Z` suspends Claude Code, `npx @rness/cli
  status` opens it, `q` closes it, `fg` resumes Claude Code. Verified with
  Claude Code 2.1.284 on 2026-09-29.
- rness owns values, not files: what is missing is added; the team's own
  settings and hooks stay as they are, in their order and indentation. A
  file that is not valid JSON is reported and never rewritten. The plugin is
  the exception: its two files are rness's whole, and an edit by hand is
  reported, then written back by `rness sync`.
- `rness sync --check` and `rness validate` report a missing value; `sync
  --pull` does not count these files as local changes. Removing an agent
  from `agents` leaves its values in place, and `sync` says which files still
  carry them.
- Codex, Cursor and GitHub Copilot read the `AGENTS.md` block and have no
  target: `sync` refuses an agent name it cannot compile. A CLI older than
  0.7.0 refuses the `agents` key: move the pin first.

## A standalone clone

A repository cloned on its own — in CI, or by an agent that checks out one
repository — has no `.rness/` next to it. Its `AGENTS.md` block is complete
on its own: the intro says so, and the rules it carries are all the agent has.
That is why the block holds the standards themselves, not links to them.

`.rness/` itself can be checked out alone: its `.github/workflows/validate.yml`
runs `rness validate` on every pull request, with the pinned version, without
any clone under `org/`.
