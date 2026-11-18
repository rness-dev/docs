# Team skills

A team uses skills it did not write: a community skill from a public
repository, one a developer keeps in a folder of their own. Installed by hand,
each lives on one machine and a teammate who clones next week has none. Team
skills give the organization one path: it declares a skill, the team reviews a
frozen copy in a pull request, and each developer decides whether to install
it. Rness never runs a skill, and never writes one outside the workspace.

The skills the team writes itself take the same path: a directory of
`.rness/skills/` (`.rness/skills/scopes/<scope>/` for one scope) with a
`SKILL.md`. In Claude Code, a skill the team writes is `/rness:<name>`
(`/rness:release`); a declared skill keeps its own name (`/brainstorming`).
Codex and Cursor read both under the plain name. The names `status`, `adr`,
`spec` and `plan` (Rness's own skills) and the retired `done` are refused for
a skill the team writes.

## Declare a skill

```sh
rness skill add github:obra/superpowers --path skills/brainstorming --ref v7.0.0
```

```
added     skill brainstorming (github:obra/superpowers@v7.0.0, 9 files, 14 KB)
```

`add` fetches the source, checks the skill, copies it into
`.rness/skills/<name>/` and writes its entry under `skills` in `rness.json`:
the `source`, `path` and `ref` you gave, the `commit` the ref resolved to and
the `tree` of the copy: the id git gives it in `.rness` (git decides which
files belong to it, its ignore rules and the skill's own `.gitignore`
included), the same before the commit, after it and in every clone. It
changes `.rness` only and commits nothing: review it in a pull request like
any other change.

| Option | What it does |
| --- | --- |
| `--path <dir>` | The skill's directory inside a repository source. |
| `--ref <ref>` | A tag, a branch or a full 40-character commit (a short SHA is refused). Without it, `HEAD`. |
| `--name <name>` | Install the skill under another name; the `name` of its `SKILL.md` is rewritten to match. |
| `--scope <scope>` | Declare it for a repository or part of `rness.json`, and the scopes that extend it. Without it, the whole organization. |

Three sources:

- `github:<owner>/<repo>`.
- `git:<url>`, over SSH or HTTPS. Private repositories work with your git
  credentials.
- `path:<dir>`, a directory on your machine, relative to `.rness/` or absolute.
  Only a machine that has that directory can update the skill.

## Review, update, remove

The copy in `.rness/skills/` is what the team reviews. Nothing is fetched when
a developer installs. Editing a declared copy by hand is refused in Claude
Code: run `rness skill update`, or remove its `source` from `rness.json` to
make it the team's own.

- `rness skill update [<name>...] [--ref <ref>]` fetches again, replaces the
  copy and says how many files were added, changed and removed. A new copy is a
  new review in the pull request. Updates are run by hand.
- `rness skill remove <name>` undeclares the skill and deletes its copy. The
  next `rness sync` of each developer removes the installed copies.

`rness validate` reports a declared copy whose tree differs from its `tree`.

## Consent

Nothing installs silently, and you are asked once per skill. A skill is pending
for you until you have accepted or declined it. Once accepted, its new versions
(reviewed in the pull request that changes `.rness`) are installed by
`rness sync` without a new question, each said:

```
updated   deploy (3ae403c -> 017c560)
```

with `, allowed-tools: <before> -> <after>` when the two versions ask for
different tools. A declined skill is never proposed again, whatever its
version. What is installed is the copy as committed at `HEAD` of `.rness`: a
skill not yet committed is not installed (`<name>: commit .rness first`), and an
uncommitted edit never reaches a clone.

```sh
rness skill install
```

It lists what is pending: the name, the source and version (or "written by the
team"), and the `allowed-tools` the skill asks for. It then asks `Install`,
`Decline` or `Details` (the default is `Decline`; `Details` lists each skill's
files). Name skills to be asked about those only. `--yes` accepts without the
question. Where two skills share a name, give the id, such as `web/deploy`. A
bare `rness skill install` with nothing pending also installs the new versions
of accepted skills, like `rness sync`. `rness skill list` shows each skill that
applies and its state: installed, pending, declined or invalid (its committed
copy fails the checks, or it is not committed yet).

```sh
rness skill uninstall <name>...
```

Uninstalls skills, accepted or not: the answer is recorded as declined and
their installed copies are removed from every clone and the workspace root.
`rness skill install <name>` installs one again.

Your answers are kept per workspace in the git directory of `.rness`, never
committed. `allowed-tools` pre-approves tools for the turn that invokes the
skill and restricts nothing (verified 2026-11-13).

## Where skills are installed

Each accepted skill is copied into every clone it applies to: a skill of the
whole organization into every clone, a scope's skill into the clones of that
scope and of the scopes that extend it, a part's skill into its repository's
clone root. In each clone it goes to `.claude/skills/<name>/` when `claude` is
among the declared agents, and to `.agents/skills/<name>/`. A skill the team
writes goes for Claude Code inside the `rness` plugin,
`.claude/skills/rness/skills/<name>/`, so it is invoked as `/rness:<name>`;
the `CLAUDE.md` block line reads `- release (Claude Code: /rness:release): ...`.
A 0.26.0 copy of such a skill moves at the next `rness sync`. Like
`/rness:status`, these load only when Claude Code is opened at a repository
root, in a trusted folder. The top-level
skills also go to the workspace root's `.claude/skills/`, for a session opened
there. Files keep their bytes and executable bits.

The paths are excluded from git in each clone (`.git/info/exclude`), so
`git status` stays clean and a `git pull` brings no skill: only
`rness skill install` does. A clone where `.claude/skills/<name>` or
`.agents/skills/<name>` is tracked by git, or holds a directory Rness did not
write, is skipped, and `rness sync` and `rness skill install` say so.

### Tools that see the installed copies

The exclude hides the copies from git, not from every tool. As of 2026-11-13,
prettier 3.10.1, eslint 10.14.0, vitest 5.1.0 and jest 30.5.2 read them (none
reads `.git/info/exclude`), and biome 2.6.7 too unless its `vcs` block is
enabled for git with `useIgnoreFile`. tsc 7.0.2 and `node --test` skip dot
directories. Rness never edits these tools' files: add the line yourself.

| Tool | Line |
| --- | --- |
| prettier | `/.claude/skills/` and `/.agents/skills/` in `.prettierignore` |
| eslint | `ignores: [".claude/skills/", ".agents/skills/"]` |
| vitest | `test.exclude: [...configDefaults.exclude, ".claude/**", ".agents/**"]` |
| jest | `testPathIgnorePatterns: ["/node_modules/", "/\\.claude/", "/\\.agents/"]` (replaces jest's default) |
| biome | `vcs: { enabled: true, clientKind: "git", useIgnoreFile: true }` |

**Never** in your home directory (`~/.claude/skills`, `~/.agents/skills`), and
never outside the workspace. A skill installed for the organization does not
leak into your other projects.

## `rness sync`

`rness sync` installs again, as committed in `.rness`, the skills you
accepted (a new clone, a removed copy, a new version) and removes the ones no
longer accepted or no longer declared. When skills are pending it prints one
line, and goes on:

```
skills    2 team skills await your consent: rness skill install
```

It never installs a skill you have not accepted. A pending skill does not fail
`rness sync --check` or `rness validate`. The generated `AGENTS.md` and
`CLAUDE.md` blocks gain a `## Team skills` section listing, for each scope, the
name and description of the skills that apply, so an agent without the skill
installed learns it exists.

## Teammates on 0.25.x

As of 2026-11-13, Rness 0.25.x refuses a `rness.json` that declares `skills`
(`rness.json: unknown key "skills"`), and its hooks never catch up a moved pin.
A teammate who pulls a `.rness` that declares skills runs `rness sync` once: it
installs the pinned version.

## In Claude Code

When a session starts, the line above is shown to you, and the agent is given
the pending skills (names, sources, `allowed-tools`) with the instruction to
ask you first. On your yes it runs `rness skill install <names> --yes`; never
without asking. Claude Code may need `/reload-skills` to see a new skills
directory. See [Claude Code](./claude-code.md).

The guard refuses an edit of an installed copy in a clone, and an edit of a
declared copy in `.rness/skills/`. Writes through Bash are not seen.

## What a skill may hold

Checked when you add or update a skill, and by `rness validate` on the copies:

- a `SKILL.md` at the root, with a `name` equal to the directory's (lowercase
  letters, digits and hyphens, at most 64 characters) and a `description`;
- regular files only: a symbolic link, a device or a path leaving the
  directory is refused, with its name;
- no control character in a file name, in the `description` or in
  `allowed-tools`;
- at most 1 MB of file content;
- not the name `rness`, which collides with the plugin's directory; for a
  skill the team writes, not `status`, `adr`, `spec`, `plan` or `done`
  either.

A name declared twice in one clone, or both declared and written by the team,
is refused by `rness validate`.

## Which agents see them

As of 2026-11-13:

| Where the agent runs | Has the team skills |
| --- | --- |
| Claude Code, local, in a clone of the workspace | The accepted ones, from `.claude/skills/` (Claude Code reads that directory only, from the start directory up to the repository root; a nested `.claude/skills/` loads when a file of that subdirectory is read) |
| Claude Code, local, at the workspace root | The accepted top-level ones |
| Codex CLI, local, in a clone | The accepted ones, from `.agents/skills/` (read in the vendor's documentation, not run here) |
| Cursor, local, in a clone | The accepted ones, read from `.agents/skills/`, `.cursor/skills/` and `.claude/skills/`. Rness writes the first and the last, so a skill may be listed twice (not verified: the vendor does not document the same name in two directories) |
| Claude Code on the web, cloud agents, CI | None: Rness does not run there |
| A clone made without Rness | None until its developer runs Rness |

A personal skill of the same name, `~/.claude/skills/<name>`, wins over the
project's: if you keep your own copy of a team skill in your home directory,
yours is the one Claude Code uses.

Rness writes the standard directories these agents read and nothing of their
configuration. Plugins, marketplaces and automatic updates are not part of it.
