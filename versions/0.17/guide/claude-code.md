# Claude Code

Every agent that reads `AGENTS.md` gets the context. For Claude Code, Rness
does more: the context loads when a session starts, mistakes in `.rness/`
are caught as they are made, and the `/rness:*` commands help write and
close decisions, specifications and plans.

Tested with Claude Code 2.1.285 (2026-09-30).

## Turn it on

```sh
rness sync --agent claude
```

This declares Claude Code in `rness.json` for the whole team, then writes
its files in every repository. A new workspace asks during `create`. Commit
`.rness/rness.json`, then, in each repository:

```sh
git add .claude/settings.json .claude/skills/rness .mcp.json
git commit -m "chore: rness for Claude Code"
```

Claude Code applies these files once you trust the folder, in an
interactive session.

## What it gives you

| In a session | What happens |
| --- | --- |
| At start | A line such as `rness 0.15.0 · acme · scope web — 10 standards, 9 decisions`, and the scope's documents for the model. When the context may be wrong, both say why. |
| After an edit in `.rness/` | The problems of that document's front matter go back to the model, which fixes them in the same turn. |
| On demand | The `rness` MCP server lets the model find what applies and where a subject was decided. |
| `/rness:*` | The commands below. |
| With [Agent Pulse](./agent-pulse.md) | The board shows what the agent works on, and follows its status changes. |

The session reads `.rness/` next to the repository without asking for
permission.

## The `/rness:*` commands

| Command | Does |
| --- | --- |
| `/rness:status [tab]` | Where every decision, specification and plan stands. |
| `/rness:adr [subject \| NNNN]` | Records a decision as an ADR. |
| `/rness:spec [subject \| NNNN]` | Writes a specification. |
| `/rness:plan <spec>` | Turns an approved specification into a plan. |
| `/rness:done [plan]` | Closes a piece of work: checks each task against evidence, then marks the plan `Completed` and its specification `Implemented`, and fixes the documents the work made inaccurate. |

The last four are procedures the agent follows in your conversation, not
file generators:

```
you   : SQLite or Postgres for the local cache?
agent : … discussion … → SQLite
you   : /rness:adr
agent : ADR 0010 "The local cache is SQLite", repo app?
you   : yes
agent : writes adr/0010-local-cache-sqlite.md (Proposed) and shows it
```

- After a discussion, `/rness:adr` writes the decision from it. Otherwise
  it asks, one question at a time.
- The agent may offer one of them on its own, for example an ADR when a
  choice would be hard to reverse. It writes nothing without your yes,
  except `/rness:done` on a plan whose last task has just passed.
- A new document takes its collection's first status and the next number.
  The agent moves a status as the work goes, and whenever you ask: a plan
  `In progress` as it starts its tasks, `Completed` once they pass, a
  specification `Implemented` with its last plan. Accepting an ADR or
  approving a specification stays yours, unless you asked it to go ahead.
- Each command records its session and the model it ran as in the
  document's `sessions:`, for example
  `{ id: 1e9cb41b-…, agent: Claude Opus 5.5 }`. `claude --resume <id>`
  reopens that session on the machine it ran on.
- The rules they follow are your workspace's, in `.rness/CONVENTIONS.md`.
- Each command ends in a commit of the files the agent alone changed,
  added by name. A file you or someone else changed too stays uncommitted,
  and the agent names it. Nothing is pushed.

`/rness:status` shows tables. For the full-screen view, run it in the same
terminal: `Ctrl+Z`, then `npx @rness/cli status`, `q`, then `fg`. Or run it
in another terminal, from the workspace's `.rness/`:

::: code-group

```sh [npm]
npx rness status
```

```sh [pnpm]
pnpm rness status
```

```sh [yarn]
yarn rness status
```

```sh [bun]
bunx rness status
```

:::

## The MCP server

Each developer approves the `rness` server once, in Claude Code's own
dialog. It is read-only and local:

| Tool | Returns |
| --- | --- |
| `rness_context` | What applies to the current repository: standards, decisions, specifications, plans |
| `rness_list` | Every document of a collection, optionally of one status |
| `rness_read` | One file of `.rness/` |
| `rness_search` | The documents that match a query, with the matching lines |

Other agents can run the same server with `rness mcp`; Rness writes no
configuration for them.

::: details What Rness writes, exactly
- `.claude/settings.json` in each repository: `../../.rness` in
  `permissions.additionalDirectories`, and three hooks (session start,
  after an edit, session end). Each hook runs the Rness version pinned in
  `.rness/`. The hooks read `.rness/`, write nothing and install nothing.
  They reach the network only for [Agent Pulse](./agent-pulse.md).
- `.mcp.json` in each repository: the `rness` server.
- `.claude/skills/rness/` in each repository: the `/rness:*` commands.
- The same settings and commands at the workspace root, for sessions
  started there, on your machine only.

Rness adds what is missing and leaves your own settings, hooks and servers
as they are. A file that is not valid JSON is reported, never rewritten.
The files under `.claude/skills/rness/` are Rness's own: an edit by hand
is reported by `rness sync --check`, then written back by `rness sync`.
Removing `claude` from `agents` leaves these files in place, and `sync`
says where they are.
:::

::: details Review changes to these files
Claude Code runs hooks from a committed settings file without asking each
developer, and would run a changed `rness` server once approved. Review a
change to `.claude/settings.json` or `.mcp.json` as you review code. Rness
does not pre-approve its MCP server, for that reason.
:::

::: details Other agents
Codex, Cursor and GitHub Copilot read the `AGENTS.md` block; Rness writes
nothing else for them. `rness sync --agent` accepts `claude` only.
:::
