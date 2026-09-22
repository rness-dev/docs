# Getting started

rness gives every AI coding agent in a GitHub organization the same context:
the organization's standards, decisions, specifications and plans, kept as
Markdown in one repository and written by the `rness` command into the
`AGENTS.md` of every repository you work on. Claude Code, Codex and Cursor read
that file; nothing else changes in your workflow.

This page describes `@rness/cli` 0.5.3. Node 24 or newer is required.

## Create a workspace

A workspace mirrors one GitHub organization. Run the command with the package
manager you use — the workspace's own dependencies are installed with the same
one:

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

The command asks for the organization, then lists its repositories so you can
pick the ones you want to work on. Pass the organization to skip the first
question (`npm create rness acme`); with `npm create`, flags go after `--`
(`npm create rness acme -- --yes`).

For a permanent `rness` command, install the CLI once:

```sh
npm i -g @rness/cli
rness create acme
```

Inside a workspace, every `rness` you run delegates to the copy pinned in
`.rness/package.json`: the whole team runs the version the organization agreed
on, whatever is installed globally.

## What appears on disk

```
acme/
├── AGENTS.md        generated global block — the root is not a git repository
├── .rness/          the organization's context: a git repository
└── org/
    ├── app/         the repositories you picked, cloned
    └── api/
```

`.rness/` is the organization's context repository. It holds:

- `rness.json` — the catalogue: every repository rness knows about, and the
  scopes where context resolves;
- `standards/`, `adr/`, `specs/`, `plans/`, `skills/` — the collections
  rness resolves per scope; `standards/` is what reaches the agents. `docs/`
  holds current-state notes for maintainers;
- `package.json` — the pinned `@rness/cli`;
- `.github/workflows/validate.yml` and `.github/dependabot.yml` — a check on
  every pull request, and a pull request for every release.

`rness create` creates `.rness/` from a scaffold when the organization has
none yet, and joins the existing one otherwise: a teammate runs the same
command with the same organization and gets a workspace pinned to the same
version, cloning the repositories they pick.

A new workspace has to reach GitHub before teammates can join it. Logged in
(see below), `create` offers to create the private repository `acme/.rness`
and push the context. Otherwise it prints the two manual steps: create the
empty repository on github.com, then `git remote add origin … && git push`.

## Private repositories

Without a login only public repositories are listed. To reach the private ones:

```sh
rness login
```

`rness login` connects rness to your GitHub account through GitHub's device
flow: it shows a code and `https://github.com/login/device`; you approve the
code in a browser, on any machine. The login is one file,
`~/.config/rness/auth.json` (`$XDG_CONFIG_HOME`, `%APPDATA%` on Windows),
readable by you only. The access token lives 8 hours and is renewed on its
own. `GITHUB_TOKEN`, then `GH_TOKEN`, win over it — CI needs no login.

rness asks for the `repo` and `read:org` scopes: GitHub has no read-only scope
for private repositories. It only lists and clones. An organization that
restricts OAuth apps hides its private repositories until an owner approves
"Rness"; `create` says so, with the link.

`rness logout` forgets the login; revoke the authorization itself in GitHub's
settings (the command prints the link).

### SSH or HTTPS

`create` and `add` test your SSH access to github.com once
(`ssh -T git@github.com`) and write `git@github.com:` URLs when GitHub accepts
your key, `https://github.com/` ones otherwise; `--ssh` and `--https` decide
without the test. Over HTTPS, rness's own clones and pulls carry the login.
For your own `git pull` and `git push`, `rness login` offers to make rness
git's credential helper for github.com (`--setup-git`); `logout` undoes it.

## Add a repository

```sh
rness add api
rness add acme/api
rness add https://github.com/acme/api.git
```

`add` clones the repository under `org/` (or adopts a clone already there)
and declares it in `rness.json`, for the whole team. A monorepo is a
repository like any other; its parts become scopes:

```sh
rness add platform --scopes apps/web,packages/ui
```

## Write the context into every repository

```sh
rness sync
```

`sync` resolves the context of every scope and writes it into the
`org/<repo>/AGENTS.md` of your clones as a marked block, between
`<!-- BEGIN rness -->` and `<!-- END rness -->`. The rest of the file is left
alone. Next to it, a `CLAUDE.md` that reads `@AGENTS.md` is created for Claude
Code when there is none.

Run `sync` after every change in `.rness/` and commit the `AGENTS.md` of each
repository. In a terminal, `sync` offers to clone the catalogue repositories
you do not have; `rness sync --all` clones them all, `rness sync --pull` pulls
every clean clone first.

## See what an agent sees

```sh
rness context                 # the scope owning the current directory
rness context --scope api
rness context --scope api --json
```

## Check it

```sh
rness validate      # the .rness/ tree against its contract, and every block
rness sync --check  # writes nothing; exit 1 when a block is out of date
```

The scaffold's `.github/workflows/validate.yml` runs `rness validate` on every
pull request of `.rness`, with the pinned version. `sync --check` is the one to
run in a repository's CI: it fails when someone changed the context without
regenerating the block.

## Next

- [The workspace](/guide/workspace) — `rness.json`, the collections, how a
  scope's context is resolved, what the generated block contains.
- [Versions](/guide/versions) — the pin, the pull request that moves it, and
  what teammates have to do (nothing).
- [CLI reference](/cli/commands) — every command and option.
