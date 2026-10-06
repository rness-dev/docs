<script setup>
import { data as frozen } from '../../../.vitepress/frozen.data'
const data = frozen['0.22']
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
reads `.rness/` and writes nothing. `--json` prints one JSON object
instead, in a terminal too: the tabs and their rows, each with the colour
of its status on Agent Pulse and its item there, the board, and what a
Claude Code session shows of the workspace (the session-start line, the
status line, the plans in progress, what needs action). In Claude Code,
`/rness:status` opens it in a pane, or shows the tables
([Claude Code](../guide/claude-code.md)).

## `rness doc`

<div v-html="data.commands.doc"></div>

`doc new <collection>` writes the next numbered document of `adr`, `specs`
or `plans` and prints its path. The number is the highest of the collection
plus one, on four digits, counted from the files present, so two sessions
never pick the same one. The file is `NNNN-<slug>.md`, the slug taken from
`--title` (`untitled` without it), with its collection's front matter —
`date` today, the first status (`Proposed` for an ADR, `Draft` otherwise),
an empty `repo`, and `updated` except on an ADR — and its opening sections,
those of `adr/0000-template.md` for an ADR. It never overwrites a file
(exit 1); any other collection is bad usage (exit 2). It runs from anywhere
in the workspace. No prompt, no network. The lifecycle skills of Claude
Code number what they create with it ([agent
targets](../guide/claude-code.md)).

## `rness validate`

<div v-html="data.commands.validate"></div>

`validate` checks `.rness/` against its contract — `rness.json`, and the
front matter and allowed statuses of every ADR, specification and plan, each
named `NNNN-<slug>.md` with a number no other document of its collection
has — and,
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

## `rness board`

<div v-html="data.commands.board"></div>

`rness board push` shows the documents of `.rness/`, and the agent at work
on them, on the boards `rness.json` declares under `boards`: on GitHub,
projects of the organization. **Agent Pulse** (`pulse`) holds every
collection, a board per directory, each document an issue of
`<org>/.rness` whose body is the document ([Boards](../guide/boards.md)).

A board declared without its `number`, or by its preset's name
(`"pulse": "agent-pulse"`, `"roadmap": "collection"`), is not on GitHub
yet: push creates it first. Its name is `pulse` or a collection of
`.rness/` — a directory whose documents carry a status — else it is
refused before GitHub is asked anything. In a terminal push asks once
before it creates a project; `-y` does not ask. Off a terminal without
`-y`, or declined, it creates none, pushes the other boards and exits 1:

```text
not created: pulse — rness board push in a terminal, or with --yes, creates it
```

Creating needs an `org` in `rness.json` — a blank workspace is refused. Push
creates the project and at once writes its number into `rness.json`, the
board written whole from its preset, with the `provider`; then it adds the
fields and the views and fills it, its `created` lines saying what it
added. A step failing after the project exits 1 with the number written:
the next `rness board push` completes the layout. Commit `rness.json` in
`.rness`. A workspace with no `provider` whose repositories look like
GitLab is refused before anything is created: write `"provider": "github"`
if the organization is on GitHub.

Push needs Issues on `<org>/.rness`. Without them it stops before writing
anything, with:

```text
boards need Issues on <org>/.rness: turn them on in its Settings
```

`rness board push`, as often as wanted, brings every board up to date, the
collections' own first and Agent Pulse last. On each it works in two
passes. First each document gets its issue — created, or reopened — with
its label and fields; then the bodies that changed are written, since a
body links to other documents' issues. It archives the items whose document
is gone and adds the option or the board a new status or directory needs.
It says what it did to the issues, then to the items: `created 1 issue`,
`reopened 1 issue`, `synced 52 items: 1 created, 2 updated, 49 unchanged`.

The `synced` line also counts the items it archived. On one of GitHub's
rate limits it waits as GitHub says, and says so as it begins
(`waiting  60 s — GitHub's rate limit`), 10 minutes at most in all; past
that it stops with how many changes it did not make, and the next push
makes them.

Push also needs a login with the `project` scope ([`rness login`](#rness-login)).
Without one, when it creates a board, it offers to log in, in a terminal;
with `-y` or off a terminal it stops with `boards need a GitHub login: run
rness login` or `boards need the project scope: run rness login`. A classic
`GITHUB_TOKEN` works when it carries the scope; a fine-grained or GitHub App
token reports no scope, and boards refuse it. When GitHub cannot be
reached, it says so (`cannot reach GitHub: …`) instead of asking for a login.

::: details `rness pulse`
The former name of `rness board` still runs, hidden from the help: each
command as its new one, said once on stderr (`rness pulse sync is now rness
board push`). `rness pulse create [<collection>]` adds the board to `boards`
by its preset's name, then pushes without asking.
:::

## `rness note`

<div v-html="data.commands.note"></div>

A note of the [agent's journal](../guide/boards.md#the-agent-s-journal) on
the plan in progress: the text, or stdin. `--kind` titles it (`approach`,
`deviation`, `blocker`, `done`); `--plan` names the plan when several are
in progress. It posts with your login, where the board's `journal` hook
says, and prints the issue it went to.

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

`login` connects Rness to your GitHub account through GitHub's device flow —
a code to approve at `https://github.com/login/device`, from any machine — so
that `create` lists your private repositories and organizations, and clones
over HTTPS carry the login. The login is one file under your config directory,
readable by you only; the token lives 8 hours and is renewed on its own.
`GITHUB_TOKEN`, then `GH_TOKEN`, win over it. `--setup-git` makes Rness git's
credential helper for github.com, for your own `git pull` and `git push`; it
needs a global install.

It asks for the `repo` and `read:org` scopes, and for `project` too where
the workspace declares a board, or when `rness board push` creates one: a
developer who never uses [boards](#rness-board) grants nothing more. A
login made before a board was declared lacks the scope: run `rness login`
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
