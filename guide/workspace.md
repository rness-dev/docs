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
  "provider": "github",
  "org": "acme",
  "agents": ["claude"],
  "pulse": { "project": 3 },
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
- `provider` (0.12.0) — where the organization lives: `github`, the only one
  this version talks to. `rness create` asks, or takes `--provider github`.
  `git` still clones, pulls and pushes; the provider's API does the rest —
  organizations, creating a repository, the board. Without the key, the
  provider is read from the first repository URL: a GitLab host reads as
  `gitlab`, any other host, or no repository, as `github`; `rness pulse
  create` writes it, and refuses a detected provider it cannot talk to. A
  provider written here that this version cannot talk to (`gitlab`) is
  refused by `validate`, `create`, `login` and `pulse`; `add`, `sync` and the
  local commands never refuse.
- `agents` — the agents the team uses, for which rness writes more than the
  block ([Agent targets](#agent-targets)). Optional: absent means never asked,
  `[]` means none.
- `pulse` (0.12.0) — `project` is the number of the organization's
  [Agent Pulse](#agent-pulse) project, written by `rness pulse create`.
- `provider` and `pulse` are optional: an absent key means none; `null` is
  refused. A CLI older than 0.12.0 refuses either key: move the pin
  (`rness upgrade`) before one is written.
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
  session start, Claude Code shows a line such as `rness 0.13.0 · acme ·
  scope web — 10 standards, 9 decisions`, and the model receives the scope's
  documents as `rness_context` lists them; when the context may be wrong —
  no `.rness` installed next to the repository, a `rness.json` rness refuses,
  a pin the installed copy does not match, problems `rness validate` would
  report — both say why. After an edit of a file under `.rness/`, the
  problems of its front matter, or of `rness.json`, go back to the model,
  which fixes them in the same turn; stale blocks are left to `rness sync`.
  Each hook is one fixed `sh` line that runs the copy pinned in `.rness/`.
  Claude Code runs hooks from a committed settings file without asking each
  developer, including in `claude -p`; they read `.rness/`, write nothing in
  the workspace and run no install, and only with a pulse declared do they
  reach the network (below). Verified with Claude Code 2.1.284 on
  2026-09-29; the `sh` line is not verified on Windows.
- Since 0.12.0, a third hook runs at session end (`SessionEnd`), in the same
  two places; the two existing lines do not change. Without a pulse it does
  nothing. With a [pulse](#agent-pulse) declared, session start marks the
  `In progress` plans of the session's scope `Agent: working`, with the
  session; an edit of a document of `.rness/` marks that document; session
  end clears the marks of that session, its subagents' included, and syncs
  the board. Each hook starts a detached `rness` process, which uses your
  login, and answers at once: a slow network never holds Claude Code, and
  the session-end sync outlives Claude Code's exit (verified with Claude
  Code 2.1.284 on 2026-09-29). With no login, without the `project` scope,
  or when GitHub cannot be reached, nothing is sent: the process writes why
  to `pulse.json` in rness's configuration directory (`~/.config/rness/` by
  default), and the next session start says it once, as
  `rness: pulse not updated — <reason>`, then deletes it. Two sessions
  marking one plan both write; the last wins.
- Since 0.11.0, each repository and the workspace root get a Claude Code
  plugin, `.claude/skills/rness/`, with `/rness:status [tab]`, the tables
  of [`rness status`](/cli/commands#rness-status). Claude Code loads it once
  the folder is trusted, in a session started there. Nothing started from
  inside Claude Code gets the terminal, so the full-screen view cannot open
  from there. Since 0.14.0 the command ends with two ways to reach it: in
  the same terminal, `Ctrl+Z` suspends Claude Code, `npx @rness/cli status`
  opens the view, `q` closes it and `fg` resumes Claude Code (Unix only);
  or, in another terminal, from the workspace's `.rness/`, the command of
  its package manager — `pnpm rness status`, `npx rness status`,
  `yarn rness status` or `bunx rness status` — which runs the pinned copy
  without the network. Verified with Claude Code 2.1.284 on 2026-09-29, and
  with each manager on 2026-09-30.
- Since 0.14.0 the plugin also walks the workspace's lifecycle:
  `/rness:adr [subject | NNNN]` records a decision as an ADR,
  `/rness:spec [subject | NNNN]` writes a specification,
  `/rness:plan <spec>` turns an approved specification into a plan, and
  `/rness:done [plan]` closes a piece of work: it checks each task against
  evidence, then marks the plan `Completed` and its specification
  `Implemented`, and corrects the documents the work made inaccurate. Each
  one is a procedure loaded into the conversation, not a file generator.
  After a decision has been discussed, `/rness:adr` writes it from the
  conversation; otherwise it asks, one question at a time. The agent may
  start one itself, but writes nothing without your yes. The rules stay in
  `.rness/CONVENTIONS.md`. A new document starts at its collection's first
  status and takes the next number in your checkout. No skill commits.
  Verified with Claude Code 2.1.285 on 2026-09-30.
- rness owns values, not files: what is missing is added; the team's own
  settings and hooks stay as they are, in their order and indentation. A
  file that is not valid JSON is reported and never rewritten. The plugin is
  the exception: its files are rness's whole, and an edit by hand is
  reported, then written back by `rness sync`.
- `rness sync --check` and `rness validate` report a missing value; `sync
  --pull` does not count these files as local changes. Removing an agent
  from `agents` leaves its values in place, and `sync` says which files still
  carry them.
- Codex, Cursor and GitHub Copilot read the `AGENTS.md` block and have no
  target: `sync` refuses an agent name it cannot compile. A CLI older than
  0.7.0 refuses the `agents` key: move the pin first.

## Agent Pulse

Since 0.12.0, `rness pulse create` gives the organization a GitHub Project
named **Agent Pulse**, where the team sees every document of `.rness/` and
when an agent is at work on one; `rness pulse sync` keeps it in step
([commands](/cli/commands#rness-pulse)). The project is private — GitHub's
default for a new organization project; rness does not set it.

Since 0.13.0, each document is an issue of `<org>/.rness`, labelled `rness`,
added to the project, and the project is linked to `.rness`, so it shows in
that repository's Projects tab. The issue's title is the document's, its
body the document ([the body](#the-body)). In 0.12.0 it was a draft holding
the title, the path and a link. The fields:

| Field | Holds |
| --- | --- |
| `Status` | The document's status. Its options are every contract status and those found in `.rness/`, in lifecycle order, 50 at most. |
| `Collection` | Its directory, named as a tab of [`rness status`](/cli/commands#rness-status): ADR, Specs, Plans, and any other directory whose documents carry a status. |
| `<Collection> status` | One field per collection — `ADR status`, `Specs status`, `Plans status`, … — holding the same status among that collection's own steps. |
| `Agent` | `working` while an agent is at work on the document. |
| `Session` | The session that marked it: `claude · 1a2b3c4d`, plus the agent type for a subagent. |
| `Path` | The document's path in `.rness/`, by which rness finds the item again. |

The views: `All`, a table of every item showing Title, Collection, Status
and Session — GitHub's first view, `View 1`, renamed when no `All` exists;
one board per collection, named as `rness status` names its tab, filtered on
its `Collection`, its columns that collection's steps and only them; and
`Working`, a table filtered on `Agent: working`.

- Access follows `.rness`: GitHub shows an issue of a private repository
  only to the people who can read it. `-label:rness` leaves these issues out
  of `.rness`'s Issues tab.
- Issues must be on for `.rness`. Without them `pulse create` and
  `pulse sync` refuse before writing anything, saying `the pulse needs Issues on <org>/.rness: turn them on in its Settings`.
- State follows existence. An issue is open while its document exists;
  when the document is gone, it is closed as not planned and its item
  archived. One closed by hand, or by a `fixes #n` in a `.rness` commit,
  while its document exists, is reopened at the next sync. The status is a
  field, not the issue's state. Gone means gone for this clone's git: the
  path is in its history and no longer in its working tree. A teammate's
  document that this clone has not pulled yet is left alone.
- One way: the team reads the board, rness writes it. rness reads it only to
  find its own items and to tell a changed body; what someone changes there
  by hand — a card, a field, a title, a body, an issue closed — is
  written back at the next sync, and never reaches `.rness/`. Comments are
  the team's: rness never writes or deletes one, and a spec's discussion
  lives on its issue. The board is not made read-only: whoever runs an
  agent writes it with their own login, so they need Write on the project;
  read-only for anyone else is the project's "Manage access", by hand. The
  project's workflows are left alone. An item of the team's — one without
  `Path`, an issue of another repository, any other issue of `.rness` — is
  never edited, closed or archived.
- `working` is set and cleared by the Claude Code hooks
  ([agent targets](#agent-targets)); no other agent marks the board. A
  document an agent has just written, with no issue yet, gets one, then is
  marked `working` from its first edit.
- Each developer's `rness login` needs the `project` scope for the board to
  be written — asked only where a pulse is declared. An organization that
  restricts OAuth apps must approve "Rness", as for its private
  repositories.
- rness sends its requests one after another. A new document costs an issue,
  its addition to the project, up to four fields, then its body; an
  unchanged one, nothing but its share of the listing, which reads every
  item's body. On one of GitHub's rate limits rness waits as long as GitHub
  says, 10 minutes at most in all; past that it stops, saying how many
  changes it did not make, and the next sync makes them. Measured on
  2026-09-30 on a board of 54 documents: the migration from 0.12.0 took
  169 s with no wait; a sync with nothing to change, 4 s; the listing, one
  page of 852 KB in about 1 s.
- `pulse sync` remakes a board built by an earlier version: its URL changes
  once. Upgrading from 0.12.0: [the versions page](/guide/versions).

### The body

An issue's body is the document, the same bytes for the same document:

- Its first line is the path and a link to the file.
- The front matter (the status is a field) and the first heading (the
  title) are dropped.
- Outside code, a link to another document becomes the URL of that
  document's issue, which opens in the board's side panel. A link to any
  other file of `.rness` points to it on GitHub; an absolute link stays as
  written.
- Outside code, `@name` is written `\@name` and a bare `#12` gets a
  zero-width space after `#`: a body notifies no one and points at no
  wrong issue.
- It is cut at 65,536 characters, GitHub's limit: a longer document ends at
  the last blank line that fits, with `The rest: <link>`.
- A last line, invisible on GitHub, `<!-- rness <digest> -->`, is how sync
  tells a body that changed.

## A standalone clone

A repository cloned on its own — in CI, or by an agent that checks out one
repository — has no `.rness/` next to it. Its `AGENTS.md` block is complete
on its own: the intro says so, and the rules it carries are all the agent has.
That is why the block holds the standards themselves, not links to them.

`.rness/` itself can be checked out alone: its `.github/workflows/validate.yml`
runs `rness validate` on every pull request, with the pinned version, without
any clone under `org/`.
