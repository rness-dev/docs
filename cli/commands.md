<script setup>
import { data } from '../.vitepress/cli.data'
</script>

# CLI reference

`@rness/cli` {{ data.version }} — the version pinned in this site's
`package.json`. The help below is the command's own, rendered from it when the
site is built. Inside a workspace every command except `create`, `upgrade`,
`login` and `logout` is delegated to the copy pinned in `.rness/package.json`.

<div v-html="data.root"></div>

## `rness create`

<div v-html="data.commands.create"></div>

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

<div v-html="data.commands.add"></div>

`add` clones the repository under `org/` — or adopts a clone already there —
and declares it in `rness.json` for the whole team: an entry in `repos`, a
scope of the same name, and one scope per `--scopes` directory, each extending
the repository. Names are lowercased. In a workspace that clones over SSH, a
failing SSH test offers `--https` for that repository only.

## `rness sync`

<div v-html="data.commands.sync"></div>

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

<div v-html="data.commands.context"></div>

`context` prints the resolved context — standards, ADRs, specifications, plans
and skills — of one scope: the global files of each collection, the scope's
own, and everything along its `extends` chain. Without `--scope`, the scope
owning the current directory; at the workspace root, the global files only.
`--json` prints the same as one object. No prompt, no network.

## `rness validate`

<div v-html="data.commands.validate"></div>

`validate` checks `.rness/` against its contract — `rness.json`, and the
front matter and allowed statuses of every ADR, specification and plan — and,
when `org/` clones are present, every generated block: stale (its hash no
longer matches a fresh render, or someone edited inside the markers) is a
problem, missing is a warning. It runs alone in a checkout of `.rness/`,
which is what the scaffold's CI workflow does. No prompt, no network.

## `rness upgrade`

<div v-html="data.commands.upgrade"></div>

`upgrade` pins the version in `.rness/package.json`, installs with the
workspace's package manager, then syncs through the new copy; a failed install
restores the file. It writes `.github/dependabot.yml` into a workspace created
before 0.5.1 and migrates the scaffold's old CI line. It is never delegated:
the copy you ran is the one that upgrades. Commit `.rness` afterwards;
teammates' next `rness` command installs the new pin itself.

## `rness login`

<div v-html="data.commands.login"></div>

`login` connects rness to your GitHub account through GitHub's device flow —
a code to approve at `https://github.com/login/device`, from any machine — so
that `create` lists your private repositories and organizations, and clones
over HTTPS carry the login. The login is one file under your config directory,
readable by you only; the token lives 8 hours and is renewed on its own.
`GITHUB_TOKEN`, then `GH_TOKEN`, win over it. `--setup-git` makes rness git's
credential helper for github.com, for your own `git pull` and `git push`; it
needs a global install.

## `rness logout`

<div v-html="data.commands.logout"></div>

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
