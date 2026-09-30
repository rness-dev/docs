# Getting started

rness gives every AI coding agent in a GitHub organization the same context:
the organization's standards, decisions, specifications and plans. They live
as Markdown in one repository, `.rness`, and the `rness` command writes what
applies into the `AGENTS.md` of every repository you work on. Claude Code,
Codex, Cursor and GitHub Copilot already read that file, so nothing else
changes in your workflow.

You need Node 24 or newer, and git.

## Create a workspace

A workspace mirrors one GitHub organization. Create it with the package
manager you use; the workspace installs its own dependencies with the same
one.

::: code-group

```sh [npm]
npm create rness
```

```sh [pnpm]
pnpm create rness
```

```sh [yarn]
yarn create rness
```

```sh [bun]
bun create rness
```

:::

The command asks a few questions:

1. **How to start**: from a GitHub organization, or a blank local workspace
   (below).
2. **The organization**: its name. Pass it to skip the question:
   `pnpm create rness acme`.
3. **The repositories** you want to work on, picked from the organization's
   list. Private ones appear once you are [logged in](./repositories.md#private-repositories).
4. **The agents your team uses**, for a new workspace. rness then also
   writes the files those agents need, such as
   [Claude Code's](./claude-code.md).

If the organization already has a `.rness` repository, you **join** it: you
get the same context, pinned to the same rness version as your teammates.
Otherwise `create` makes a new `.rness` from a starter set. Once you are
logged in, it offers to create the private `acme/.rness` on GitHub and push
it, so your teammates can join.

::: details Flags with npm, and the hints the CLI prints
With `npm create`, flags go after `--`: `npm create rness acme -- --yes`.
The next steps `create` prints are written the way you launched it
(`npx @rness/cli`, `pnpm dlx @rness/cli`, …), so they work without a global
install.
:::

### Without a GitHub organization

To try rness with no organization, or no GitHub account:

::: code-group

```sh [npm]
npm create rness my-project -- --blank
```

```sh [pnpm]
pnpm create rness my-project --blank
```

```sh [yarn]
yarn create rness my-project --blank
```

```sh [bun]
bun create rness my-project --blank
```

:::

A blank workspace makes no request to GitHub, and needs no login. Add
repositories by `<owner>/<repo>` or by URL
([Repositories](./repositories.md)). To share it later, set `"org"` in
`.rness/rness.json` and push `.rness` to `github.com/<org>/.rness`.

## What appears on disk

```
acme/
├── AGENTS.md        the organization-wide rules, for a session opened here
├── .rness/          the organization's context — a git repository
└── org/
    ├── app/         the repositories you picked, cloned
    └── api/
```

`.rness/` holds `rness.json` (the list of repositories), the documents
(`standards/`, `adr/`, `specs/`, `plans/`, …) and the version of rness the
organization uses. [The workspace](./workspace.md) explains each part.

## Write the context into every repository

```sh
rness sync
```

`sync` writes the rules that apply to each repository into its `AGENTS.md`,
between two markers. The rest of the file stays yours. Commit what it
wrote in each repository, usually `AGENTS.md`, `CLAUDE.md` and the agent's
files.

Run it again whenever `.rness/` changes. `rness sync --check` writes
nothing, and fails when a repository's block is out of date. It is the
check to run in a repository's CI.

::: tip No global install needed
Every command works through your package manager, for example
`npx @rness/cli sync` or `pnpm dlx @rness/cli sync`. Inside a workspace,
whichever `rness` you launch runs the version the organization pinned.
:::

## Look around

```sh
rness status        # where every decision, specification and plan stands
rness context       # what an agent sees in the current repository
rness validate      # checks .rness/ and every generated block
```

`rness status` opens a full-screen view in a terminal: the arrow keys move
between tabs, and `q` closes it.

## Next

- [The workspace](./workspace.md): `rness.json`, the documents, and what
  reaches each repository.
- [Repositories](./repositories.md): add one, reach private ones.
- [Claude Code](./claude-code.md): the context at session start, and the
  `/rness:*` commands.
- [Agent Pulse](./agent-pulse.md): the documents, and the agents at work,
  on a GitHub Project.
- [Update rness](./upgrade.md): one command, and a pull request for each
  release.
- [CLI reference](../cli/commands.md): every command and option.
