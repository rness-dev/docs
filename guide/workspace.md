# The workspace

A rness workspace mirrors one GitHub organization:

```
<org>/
├── AGENTS.md        generated global block, not committed
├── .rness/          the organization's context — a git repository
└── org/<repo>/      the repositories you work on, cloned; a monorepo is a
                     repository like any other, its parts declared as scopes
```

The workspace root is never a git repository. `.rness/` is one, shared by the
team; `org/` holds your clones, and nothing but `org/` records which
repositories you chose. Two teammates can clone different repositories of the
same organization; the catalogue is the same for both.

This page describes `@rness/cli` 0.5.3.

## `rness.json`, the catalogue

```json
{
  "contract": 1,
  "org": "acme",
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
- A `CLAUDE.md` holding `@AGENTS.md` is created next to the block for Claude
  Code when there is none; an existing one gets that line prepended.
- The workspace root gets a global block of its own in `<org>/AGENTS.md`.

A block above 32 KiB is written with a warning: that is a lot of rules for an
agent to carry on every turn.

## A standalone clone

A repository cloned on its own — in CI, or by an agent that checks out one
repository — has no `.rness/` next to it. Its `AGENTS.md` block is complete
on its own: the intro says so, and the rules it carries are all the agent has.
That is why the block holds the standards themselves, not links to them.

`.rness/` itself can be checked out alone: its `.github/workflows/validate.yml`
runs `rness validate` on every pull request, with the pinned version, without
any clone under `org/`.
