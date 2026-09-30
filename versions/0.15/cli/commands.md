<script setup>
import { data as frozen } from '../../../.vitepress/frozen.data'
const data = frozen['0.15']
</script>

# CLI reference

Every command, with its own `--help` and what it does. Inside a workspace,
every command except `create`, `upgrade`, `login` and `logout` runs the
version pinned in `.rness/package.json`, whichever `rness` you type.

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

In a terminal, before the organization, it asks `Where does your
organization live?`: GitHub, the one this version talks to; GitLab and
Atlassian (Bitbucket + Jira) are listed, disabled. `--provider github`
answers it off a terminal. The answer is written to `rness.json` as
`provider` ([the catalogue](../guide/workspace.md#rness-json-the-list-of-repositories)). A
join asks too, then takes the provider the organization's `rness.json`
names; `--blank` asks nothing.

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
command for a repository's CI. With agents declared in `rness.json`, it also
writes the files those agents need ([agent targets](../guide/claude-code.md)).

## `rness context`

<div v-html="data.commands.context"></div>

`context` prints the resolved context — standards, ADRs, specifications, plans
and skills — of one scope: the global files of each collection, the scope's
own, and everything along its `extends` chain. Without `--scope`, the scope
owning the current directory; at the workspace root, the global files only.
`--json` prints the same as one object. No prompt, no network.

## `rness status`

<div v-html="data.commands.status"></div>

`status` shows where every decision, specification and plan stands: a tab
for ADRs, one for specifications, one for plans, and one for each other
directory of `.rness/` whose Markdown files carry a `status` in their front
matter; a line per document, newest first — its number or date, its title,
its status. In a terminal it is a full-screen view: `←`/`→` or `Tab` change
tab, `↑`/`↓`, `PgUp`/`PgDn` and `Home`/`End` scroll, `q` or `Esc` closes and
gives the screen back. Off a terminal — a pipe, CI, an agent's tool — it
prints Markdown, a table per tab; `rness status specs` prints that one. It
reads `.rness/` and writes nothing. In Claude Code, `/rness:status` shows
the tables ([agent targets](../guide/claude-code.md)).

## `rness validate`

<div v-html="data.commands.validate"></div>

`validate` checks `.rness/` against its contract — `rness.json`, and the
front matter and allowed statuses of every ADR, specification and plan — and,
when `org/` clones are present, every generated block: stale (its hash no
longer matches a fresh render, or someone edited inside the markers) is a
problem, missing is a warning. So is a value an [agent
target](../guide/claude-code.md) needs and a clone lacks. It warns when
the scaffold merged in `.rness` is behind the pin. It runs alone in a checkout
of `.rness/`, which is what the scaffold's CI workflow does. No prompt, no
network.

## `rness mcp`

<div v-html="data.commands.mcp"></div>

`mcp` is a local MCP server, started by an agent over stdio — not a command
to type. It reads the workspace's `.rness/` and writes nothing. Four tools
answer "what applies here" and "where was this decided":

| Tool | Returns |
| --- | --- |
| `rness_context({ scope? })` | The scope of the working directory, or the one named, and what applies to it: standards, decisions, specifications and plans — id, status, title and path, no bodies. |
| `rness_list({ collection, status? })` | Every document of a collection, across scopes, optionally of one status. |
| `rness_read({ path })` | One file of `.rness/`, by its path there; 256 KiB at most, nothing outside `.rness/`. |
| `rness_search({ query, collection? })` | The documents whose text matches, most matching first, with the matching lines. |

`.rness/` is read again on each call, so an edit shows at once. It speaks the
MCP revision `2026-07-28` and the earlier ones that open with `initialize`
(`2025-11-25` back to `2024-11-05`). For Claude Code, `rness sync` registers
it in each repository ([agent targets](../guide/claude-code.md)).
Another agent can run the same command from a clone.

## `rness pulse`

<div v-html="data.commands.pulse"></div>

`pulse` shows the documents of `.rness/`, and the agent at work on them, in
the organization's GitHub Projects: a project named **Agent Pulse**, a board
per directory, each document an issue of `<org>/.rness` whose body is the
document ([Agent Pulse](../guide/agent-pulse.md)).

`rness pulse create`, once per organization, needs an `org` in `rness.json`
— a blank workspace is refused — and no pulse declared yet. It creates the
project and at once writes `"pulse": { "project": <number> }`, and the
`provider`, into `rness.json`; then it adds the fields and the views and runs
a first sync, its `created` line saying what it added. A step failing after
the project exits 1 with the pulse declared: `rness pulse sync` completes the
layout. Commit `rness.json` in `.rness`. A workspace with no `provider` whose
repositories look like GitLab is refused before anything is created: write
`"provider": "github"` if the organization is on GitHub.

Both need Issues on `<org>/.rness`. Without them they stop before writing
anything, with:

```text
the pulse needs Issues on <org>/.rness: turn them on in its Settings
```

`rness pulse sync`, as often as wanted, works in two passes. First each
document gets its issue — created, or reopened — with its label and
fields; then the bodies that changed are written, since a body links to
other documents' issues. It archives the
items whose document is gone and adds the option or the board a new status
or directory needs. It says what it did to the issues, then to the items:
`created 1 issue`, `reopened 1 issue`, `synced 52 items: 1 created, 2
updated, 49 unchanged`.

The `synced` line also counts the items it archived. On one of GitHub's
rate limits it waits as GitHub says, and says so as it begins
(`waiting  60 s — GitHub's rate limit`), 10 minutes at most in all; past
that it stops with how many changes it did not make, and the next sync
makes them.

Both also need a login with the `project` scope ([`rness login`](#rness-login)).
Without one, `create` offers to log in, in a terminal; with `-y` or off a
terminal, the pulse stops with `the pulse needs a GitHub login: run rness
login` or `the pulse needs the project scope: run rness login`. A classic
`GITHUB_TOKEN` works when it carries the scope; a fine-grained or GitHub App
token reports no scope, and the pulse refuses it. When GitHub cannot be
reached, it says so (`cannot reach GitHub: …`) instead of asking for a login.

## `rness upgrade`

<div v-html="data.commands.upgrade"></div>

`upgrade` merges the target version's scaffold into `.rness` with git, pins
the version in `.rness/package.json`, installs with the workspace's package
manager, syncs through the new copy — the blocks and the agent files — then
commits `.rness`
([the scaffold, merged with git](../guide/upgrade.md#update)).
The next steps say what is left: push `.rness`, and per repository the files
the sync changed. A hook refusing the commit leaves everything staged, and
`upgrade` exits 1. `.rness` must be clean, with no merge in progress. It is
never delegated: the copy you ran is the one that upgrades. Teammates' next
`rness` command installs the new pin itself.

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

It asks for the `repo` and `read:org` scopes, and for `project` too where
the workspace declares a pulse, or when `rness pulse create` runs it: a
developer who never uses the [pulse](#rness-pulse) grants nothing more. A
login made before the pulse was declared lacks the scope: run `rness login`
again. A `provider` written in `rness.json` that this version cannot talk to
is refused.

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
