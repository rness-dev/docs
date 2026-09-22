# CLI reference

`@rness/cli` 0.5.3. The help below is the command's own, verbatim. Inside a
workspace every command except `create`, `upgrade`, `login` and `logout` is
delegated to the copy pinned in `.rness/package.json`.

```
Usage: rness [options] [command]

Configuration-plane CLI for rness workspaces

Options:
  -v, --version                       print the version
  -h, --help                          display help for command

Commands:
  context [options]                   Resolve and print the context for a scope
  validate [options]                  Check the .rness/ tree against the
                                      contract and every generated block
  sync [options]                      Write the rness block into every AGENTS.md
                                      of the cloned repositories
  add [options] <repo>                Clone (or adopt) a repository under org/
                                      and declare it in rness.json
  login [options]                     Log in to GitHub, to list and clone
                                      private repositories
  logout                              Forget the GitHub login of this machine
  upgrade|update [options] [version]  Move this workspace to another @rness/cli:
                                      pin it in .rness/package.json, install,
                                      sync
  create [options] [org]              Create a workspace for a GitHub
                                      organization, or join its existing .rness
  help [command]                      display help for command
```

## `rness create`

```
Usage: rness create [options] [org]

Create a workspace for a GitHub organization, or join its existing .rness

Arguments:
  org                the GitHub organization, same as --org

Options:
  --org <name>       the GitHub organization, exact name (github.com/<name>)
  --repos <list>     comma-separated repositories for your workspace (catalogue
                     entries are cloned, others added)
  --pm <name>        package manager for .rness/ (npm, pnpm, yarn, bun; default:
                     the one running this command)
  --ssh              force git@github.com: (default: SSH when it works, else
                     HTTPS)
  --https            force https://github.com/
  --skip-install     do not install .rness/ dependencies
  -y, --yes          do not ask for confirmation
  --template <name>  reserved
  -h, --help         display help for command
```

`create` never runs inside a workspace. It creates `<org>/` in the current
directory, with the organization's exact name, and either scaffolds `.rness/`
(a new organization) or clones the existing `<org>/.rness` (joining). In a
terminal it lists the organization's repositories to pick from, with every
catalogue repository pre-selected when joining; picked repositories are cloned
under `org/`, new ones are added to the catalogue. Without a terminal or with
`--yes`, `--repos` is the selection, and a join without `--repos` clones the
whole catalogue. Logged in, it offers to create the private `<org>/.rness` on
GitHub and push. A cancelled prompt writes nothing and exits 0.

Joining is served by the version the organization pinned, whatever copy you
ran: `create` installs `.rness/` and hands the first sync to it.

## `rness add`

```
Usage: rness add [options] <repo>

Clone (or adopt) a repository under org/ and declare it in rness.json

Arguments:
  repo             <repo>, <owner>/<repo>, or a clone URL

Options:
  --scopes <list>  comma-separated sub-directories to declare as scopes
                   extending the repository
  --ssh            force git@github.com: (default: SSH when it works, else
                   HTTPS)
  --https          force https://github.com/
  -y, --yes        do not ask for confirmation
  -h, --help       display help for command
```

`add` clones the repository under `org/` — or adopts a clone already there —
and declares it in `rness.json` for the whole team: an entry in `repos`, a
scope of the same name, and one scope per `--scopes` directory, each extending
the repository. Names are lowercased. In a workspace that clones over SSH, a
failing SSH test offers `--https` for that repository only.

## `rness sync`

```
Usage: rness sync [options]

Write the rness block into every AGENTS.md of the cloned repositories

Options:
  --scope <name>  only this scope (the root block is skipped)
  --check         render and compare only; exit 1 when a block is out of date
  --pull          git pull --ff-only in every clean clone
  --all           clone every rness.json repository missing from org/
  -y, --yes       do not ask for confirmation
  -h, --help      display help for command
```

`sync` renders the context of every scope and writes it into the `AGENTS.md`
of your clones, as a block between `<!-- BEGIN rness -->` and
`<!-- END rness -->`; the rest of each file is untouched. A `CLAUDE.md`
holding `@AGENTS.md` is created next to it when there is none. In a terminal,
catalogue repositories missing from `org/` are offered for cloning first;
with `--yes` or `--check` they are named on one `not cloned:` line instead. A
clone `rness.json` does not know gets no block and a `not in rness.json:`
line. `--check` writes nothing and exits 1 when a block is out of date — the
command for a repository's CI.

## `rness context`

```
Usage: rness context [options]

Resolve and print the context for a scope

Options:
  --scope <name>  scope to resolve (default: the scope owning the current
                  directory)
  --json          print JSON instead of Markdown
  -h, --help      display help for command
```

`context` prints the resolved context — standards, ADRs, specifications, plans
and skills — of one scope: the global files of each collection, the scope's
own, and everything along its `extends` chain. Without `--scope`, the scope
owning the current directory; at the workspace root, the global files only.
`--json` prints the same as one object. No prompt, no network.

## `rness validate`

```
Usage: rness validate [options]

Check the .rness/ tree against the contract and every generated block

Options:
  -h, --help  display help for command
```

`validate` checks `.rness/` against its contract — `rness.json`, and the
front matter and allowed statuses of every ADR, specification and plan — and,
when `org/` clones are present, every generated block: stale (its hash no
longer matches a fresh render, or someone edited inside the markers) is a
problem, missing is a warning. It runs alone in a checkout of `.rness/`,
which is what the scaffold's CI workflow does. No prompt, no network.

## `rness upgrade`

```
Usage: rness upgrade|update [options] [version]

Move this workspace to another @rness/cli: pin it in .rness/package.json,
install, sync

Arguments:
  version     an exact version (default: the latest release)

Options:
  -y, --yes   do not ask for confirmation
  -h, --help  display help for command
```

`upgrade` pins the version in `.rness/package.json`, installs with the
workspace's package manager, then syncs through the new copy; a failed install
restores the file. It writes `.github/dependabot.yml` into a workspace created
before 0.5.1 and migrates the scaffold's old CI line. It is never delegated:
the copy you ran is the one that upgrades. Commit `.rness` afterwards;
teammates' next `rness` command installs the new pin itself.

## `rness login`

```
Usage: rness login [options]

Log in to GitHub, to list and clone private repositories

Options:
  --setup-git     make rness git's credential helper for github.com
  --no-setup-git  do not ask about git
  -h, --help      display help for command
```

`login` connects rness to your GitHub account through GitHub's device flow —
a code to approve at `https://github.com/login/device`, from any machine — so
that `create` lists your private repositories and organizations, and clones
over HTTPS carry the login. The login is one file under your config directory,
readable by you only; the token lives 8 hours and is renewed on its own.
`GITHUB_TOKEN`, then `GH_TOKEN`, win over it. `--setup-git` makes rness git's
credential helper for github.com, for your own `git pull` and `git push`; it
needs a global install.

## `rness logout`

```
Usage: rness logout [options]

Forget the GitHub login of this machine

Options:
  -h, --help  display help for command
```

`logout` forgets the login of this machine and undoes the git credential
helper. The authorization itself is revoked in GitHub's settings; the command
prints the link.

## Environment

| Variable | Effect |
| --- | --- |
| `RNESS_NO_INSTALL=1` | After a pull that moved the pin, do not install it: warn and run the command anyway. For CI, a container image, a machine that cannot install. |
| `RNESS_NO_DELEGATE=1` | Run the copy you invoked, never the pinned one. |
| `RNESS_DEBUG=1` | Stack traces on errors, and a line naming the copy delegated to. |
| `GITHUB_TOKEN`, `GH_TOKEN` | Used before the stored login, in that order: CI needs no `rness login`. |
| `NO_COLOR=1`, `FORCE_COLOR=1` | Plain output, or coloured output through a pipe. Output through a pipe or in CI is plain by default. |

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Success — including a prompt the user cancelled or declined. |
| `1` | Failure: a handled error, a stale block under `--check`, a problem under `validate`. |
| `2` | Bad usage — or a command that needs a terminal, run without one and without `--yes`. |
