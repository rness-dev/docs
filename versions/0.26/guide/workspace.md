# The workspace

A workspace mirrors one GitHub organization:

```
<org>/
├── AGENTS.md        the organization-wide rules, not committed
├── CLAUDE.md        the same, for Claude Code
├── .rness/          the organization's context — a git repository
└── org/<repo>/      the repositories you work on, cloned
```

`.rness/` is shared by the whole team. `org/` holds your clones: two
teammates can clone different repositories of the same organization, and
both see the same context. The workspace root is not a git repository.

## `rness.json`, the list of repositories

```json
{
  "contract": 2,
  "provider": "github",
  "org": "acme",
  "agents": ["claude"],
  "boards": { "pulse": { "number": 3, "preset": "agent-pulse/1", "…": "…" } },
  "scopes": {
    "app": { "url": "git@github.com:acme/app.git" },
    "platform": {
      "url": "https://github.com/acme/platform.git",
      "scopes": {
        "web": { "path": "apps/web" },
        "ui": { "path": "packages/ui", "extends": ["web"] }
      }
    }
  }
}
```

| Key | Holds |
| --- | --- |
| `org` | The organization: a GitHub organization, a GitLab group or a Bitbucket workspace. Absent in a blank workspace. |
| `scopes` | Every repository Rness knows about, and where context applies. A scope with a `url` is a repository, cloned at `org/<name>`; `rness add` declares one. A scope nested in a repository's own `scopes` is a part of it (a directory of a monorepo): its `path` is relative to its parent, and it inherits its parent's context first. `extends` inherits the context of any other scope. |
| `agents` | The agents your team uses; Rness writes their files ([Claude Code](./claude-code.md)). |
| `boards` | The [boards](./boards.md): on GitHub, the organization's Projects, each board written whole: its collections, statuses, colours, fields and views ([Shaped in `rness.json`](./boards.md#shaped-in-rness-json)). `pulse` is [Agent Pulse](./boards.md), any other name a [collection's own board](./boards.md#a-collection-s-own-board). Declared by the team, its number written by `rness board push` when it creates it. Every key: [Boards in `rness.json`](../cli/boards.md). |
| `provider` | Where the organization lives: `github`, `gitlab` or `atlassian`. |
| `jira` | On Atlassian only, the Jira site and space of the cards and the journal: `{ "site": "acme.atlassian.net", "space": "RNESS" }` ([Atlassian](./atlassian.md#the-jira-space)). |

Commit `rness.json` in `.rness` whenever a command changes it: it is the
team's.

A name is used once in the whole file, whatever its depth: `web` cannot be
declared under two repositories. `--scope web` and `standards/web/` use the
name alone. A repository has no `path` (it is `org/app`), and a part has no
`url`.

::: details Names and URLs
A repository or scope name is lowercase: letters, digits, `.`, `_` and
`-`. Typed in another case, it is lowercased: `dApp` is `dapp`, in
`rness.json` and under `org/`. `org` keeps its case. A URL is cloned as
written: `git@github.com:` when your SSH key works, `https://github.com/`
otherwise
([SSH or HTTPS](./repositories.md#ssh-or-https)).
:::

## The documents

| Directory | Holds | Statuses |
| --- | --- | --- |
| `standards/` | Rules and guidance: what is written into `AGENTS.md` | none |
| `adr/` | Decisions, never rewritten: a new ADR supersedes an old one | `Proposed`, `Accepted`, `Rejected`, `Superseded` |
| `specs/` | What is proposed, and why | `Draft`, `Proposed`, `Approved`, `Implemented`, `Superseded`, `Rejected` |
| `plans/` | Ordered steps to implement a specification | `Draft`, `Ready`, `In progress`, `Blocked`, `Completed`, `Abandoned` |
| `skills/` | Reusable agent skills | none |
| `policy/` | Rules refused at commit, push and edit ([Policies](./policies.md)); not numbered | `Enabled`, `Disabled` |

A decision, specification or plan starts with front matter:

```yaml
---
date: 2026-09-22
status: Proposed
repo: app
spec: '[0012](../specs/0012-login.md)'
updated: 2026-09-24
---
```

`rness validate` checks the front matter and the statuses. `sessions:` lists
the Claude Code sessions that wrote or changed the document, each with the
model it ran as ([Claude Code](./claude-code.md#the-rness-commands)).

## What applies where

A document's directory decides where it applies:

- `standards/coding-style.md` applies everywhere;
- `standards/web/seo.md` applies to the scope `web`, and to the scopes that
  extend it.

A scope's context is the global documents, its own, and those of every
scope it extends. To see it:

```sh
rness context               # the scope of the current directory
rness context --scope web
```

## The generated block

`rness sync` writes a scope's `standards/` into its `AGENTS.md`, between two
markers:

```md
<!-- BEGIN rness -->
<!-- rness · scope: app · … · generated: run `rness sync`, never edit inside this block -->
This directory is scope `app` of rness workspace `acme`. Full context lives in
`../../.rness/` — start at its `AGENTS.md`, then task-relevant `adr/`, `specs/`, `plans/`;
…
## Rules
# Coding style
…
<!-- END rness -->
```

- Everything outside the markers is yours.
- Only the rules are copied. Agents reach decisions, specifications and
  plans through `.rness/`.
- Each repository also gets a `CLAUDE.md` that imports `AGENTS.md`, for
  Claude Code.
- A block that no longer matches `.rness/`, because the context changed or
  someone edited inside the markers, is reported by `rness validate` and
  `rness sync --check`. `rness sync` rewrites it.

::: details Large blocks, and the workspace root
A block above 32 KiB is written with a warning: that is a lot of rules for
an agent to carry on every turn. The workspace root gets the global rules in
its own `AGENTS.md` and `CLAUDE.md`. They live on your machine only, since
the root is not a repository.
:::

## A standalone clone

A repository cloned on its own, in CI or by an agent that checks out one
repository, has no `.rness/` next to it. Its block is complete on its own:
the rules it carries are all the agent needs. This is why the block holds
the rules themselves rather than links to them.

`.rness` can be checked out alone too. Its CI workflow runs `rness validate`
on every pull request.
