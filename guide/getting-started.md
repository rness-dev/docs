# Getting started

Rness gives every AI coding agent in a GitHub organization the same context:
the organization's standards, decisions, specifications and plans. They live
as Markdown in one repository, `.rness`, and the `rness` command writes what
applies into the `AGENTS.md` of every repository you work on. Claude Code,
Codex, Cursor and GitHub Copilot already read that file, so nothing else
changes in your workflow.

You need Node 22.17 or newer, and git.

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

1. **Where your organization lives**: GitHub (GitLab and Atlassian come
   later), or no organization yet: a blank local workspace (below).
2. **A GitHub login**, offered once: it lists your organizations and their
   private repositories.
3. **The organization**, picked from your list, or typed for one you are
   not a member of. Pass it to skip the question: `pnpm create rness acme`.
   An organization that has not yet approved Rness for its private
   repositories gets the approval page opened in your browser; Rness waits
   for an owner's click, then goes on.
4. **The repositories** you want to work on, picked from the organization's
   list. Private ones appear once you are [logged in](./repositories.md#private-repositories).
5. **The agents your team uses**, for a new workspace. Rness then also
   writes the files those agents need, such as
   [Claude Code's](./claude-code.md).

If the organization already has a `.rness` repository, you **join** it: you
get the same context, pinned to the same Rness version as your teammates.
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

To try Rness with no organization, or no GitHub account:

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
(`standards/`, `adr/`, `specs/`, `plans/`, …) and the version of Rness the
organization uses. [The workspace](./workspace.md) explains each part.

## The `rness` command

The workspace installs Rness in `.rness/node_modules`, which is not on your
`PATH`: a bare `rness` works only once you install it globally.

::: code-group

```sh [npm]
npm install -g @rness/cli
```

```sh [pnpm]
pnpm add -g @rness/cli
```

```sh [yarn]
yarn global add @rness/cli   # Yarn 1; with Yarn 2+, use npm
```

```sh [bun]
bun add -g @rness/cli
```

:::

A global install never puts you on a different version from your team.
Inside a workspace, `rness` hands every command over to the version pinned
in `.rness/package.json`, except `create`, `upgrade`, `login` and `logout`.

Without a global install, put your package manager in front of the
command:

- from anywhere in the workspace: `npx @rness/cli sync`;
- from `.rness/`, offline: `npx rness sync`, `pnpm rness sync`,
  `yarn rness sync` or `bunx rness sync`.

This guide writes `rness …` for short.

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
- [Update Rness](./upgrade.md): one command, and a pull request for each
  release.
- [CLI reference](../cli/commands.md): every command and option.
