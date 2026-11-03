# Policies

A rule written in a standard is read by the model, which may follow it. A
policy is a rule a machine answers yes or no, at the moment of an action: a
commit, a push, an edit. The standard explains and prevents; the policy
refuses what escaped it. The same rule can live in both.

A policy acts at three points, from one file:

1. **Before generation.** Each enabled policy is listed under `## Policies`
   in the `AGENTS.md` block of the scope it applies to, so the agent is told.
2. **Before execution.** The Claude Code guard refuses an edit that adds a
   refused line, and a command that would skip the git hooks.
3. **Before git records.** Git hooks in every clone `rness.json` declares
   refuse the commit or the push, for any agent and for people.

## A policy

A policy is a Markdown file of `.rness/policy/`: `policy/<name>.md` applies
everywhere, `policy/<scope>/<name>.md` to one scope. The name is lowercase
words joined by hyphens and is the policy's id in every message. The title is
the `#` heading and the body is the reason, for the people who review it and
the agents that read it. Policies have no number: `rness doc new policy` is
refused.

```md
---
status: Enabled
standard: standards/documentation.md
rules:
  - check: commit-message
    deny: '\u2014'
    fix: Write " - ", a comma, a colon or a period instead of the em dash.
  - check: added-lines
    deny: '\u2014'
    fix: Write " - ", a comma, a colon or a period instead of the em dash.
---

# No em dash

Text with an em dash reads as machine-written. Use " - ", a comma, a colon
or a period.
```

| Key | Required | Value |
| --- | --- | --- |
| `status` | yes | `Enabled`: applied. `Disabled`: listed and validated, applied nowhere. |
| `rules` | yes | A non-empty list of rules. |
| `standard` | no | The path of a standard of the workspace that explains the rule. It must exist. |
| `date`, `updated` | no | ISO dates. |

Any other key is refused. Each rule has three keys, all required: `check`,
`deny` and `fix`. `fix` is one line: it is what the agent reads to correct
itself.

A `deny` pattern is a JavaScript regular expression, compiled with the flags
`i` (a trailer's case does not matter) and `u` (`\u2014` names the em dash
without writing it), and matched against one line at a time. `^` and `$` are
the line's. A scoped policy only adds to the global ones, and a name used both
globally and in a scope is refused.

`rness validate` checks every policy, disabled ones included, and names the
file and the line of what it refuses: an unknown key, a missing `status` or
`rules`, a rule without `check`, `deny` or `fix`, a pattern that does not
compile, a `standard` that does not exist, a name that is not lowercase words
joined by hyphens. It also refuses YAML anchors, aliases, custom tags, merge
keys and duplicate keys. The CLI package publishes a JSON Schema of the front
matter.

## The three checks

Rness provides a fixed set. A rule picks one; there is no condition and no
expression language.

| `check` | What it reads | `deny` | Run by |
| --- | --- | --- | --- |
| `commit-message` | Every line of the commit message, cut at git's scissors line only for a message edited in an editor (never under `-m`, `-F` or for a merge message). Comment lines are read too: under `-m` and `-F` git keeps them in the commit. | A pattern | The `commit-msg` hook |
| `added-lines` | Each line a commit or an edit adds, never a line already there. | A pattern | The `pre-commit` hook, and the guard on `Edit` and `Write` |
| `push` | Each ref update of a push. | `non-fast-forward`, the only value | The `pre-push` hook |

- **Added lines only.** A file that already holds the pattern does not block a
  commit that does not touch that line.
- **Merges.** A merge git concludes itself runs no `pre-commit`. One you
  conclude with `git commit` after a conflict does, and only the lines added
  against every parent are checked: your conflict resolutions and any new
  line. A line either branch brought passes, since it was checked when that
  branch committed it.
- **Rness's own outputs are not checked** by `added-lines`: the files under
  `.claude/skills/rness/` and the lines inside a rness block. Nobody can fix
  them where they land; their source is elsewhere.
- **Non-fast-forward** means the remote object is not an ancestor of the local
  one. Whatever the flag (`-f`, `--force-with-lease`, `+main`, an alias), the
  push is judged on what it does. A new branch passes, and so does a deletion.
  A remote object missing locally reads as non-fast-forward, and the fix says
  to fetch first.
- **Several scopes in one clone** (a monorepo): `added-lines` applies the
  policies of each file's own scope, the deepest one holding it;
  `commit-message` and `push` apply those of every scope of the clone.

## The git hooks

`rness create`, `rness add` and `rness sync` write three hooks, `pre-commit`,
`commit-msg` and `pre-push`, in the hooks directory of every clone under
`org/` that `rness.json` declares, as a repository or as the home of a
scope. They are local to your machine and never committed to the project.
They are written whatever the policies, and each passes at once while no
enabled policy uses its check: a policy enabled in `.rness/` applies as soon
as the clone has pulled it, with no `sync`. `.rness/` itself gets the same
three through its own `.githooks/`.

A clone `rness.json` does not declare gets no hook, and no policy applies in
a clone that holds no scope: nothing is checked there, by the hooks or by the
guard. A clone's name is compared whatever its case, so `org/Web` is the
declared `web` and its policies apply.

Each hook carries a marker line and runs the CLI pinned in
`.rness/package.json`, by the workspace's absolute path. `rness sync`
rewrites a rness hook that is missing or out of date. It reports two cases,
once per clone until the cause changes, and writes nothing there:

- a hook file without the marker is someone else's and is left as it is;
- a clone with `core.hooksPath` set (husky, lefthook) is left alone.

Each report ends with the lines to add to that hook, or to each of the three
hooks of your own hook manager, `<hook>` replaced by the hook's name. They
find the workspace from the clone, two levels up, so your team can commit
them; outside a work tree they do nothing, and they end the hook only to
refuse, so your own lines after them still run:

```sh
rness_dir=
if rness_top=$(git rev-parse --show-toplevel 2>/dev/null); then
  rness_dir=$(cd "$rness_top/../../.rness" 2>/dev/null && pwd -P) || rness_dir="$rness_top/../../.rness"
fi
rness_bin="$rness_dir/node_modules/@rness/cli/dist/bin/rness.js"
rness_why=
if [ -z "$rness_dir" ]; then
  :
elif ! command -v node >/dev/null 2>&1; then
  rness_why='node not found'
elif [ ! -f "$rness_bin" ]; then
  rness_why="$rness_bin not found"
elif [ ! -f "$rness_dir/rness.json" ] || [ ! -O "$rness_dir" ] || [ -n "$(find "$rness_dir" -prune -perm -0002)" ]; then
  echo "rness: policies not checked: $rness_dir is no workspace .rness of yours alone" >&2
else
  rness_status=0
  rness_out=$(node "$rness_bin" policy check <hook> "$@" 2>&1) || rness_status=$?
  if [ "$rness_status" -ne 0 ] && [ "$rness_status" -ne 20 ]; then
    rness_out="rness: policies not checked: the rness CLI exited $rness_status"
  fi
  if [ -n "$rness_out" ]; then
    printf '%s\n' "$rness_out" >&2
  fi
  if [ "$rness_status" -eq 20 ]; then
    exit 1
  fi
fi
if [ -n "$rness_why" ] && { [ ! -d "$rness_dir" ] || grep -rqsE "^status:[[:space:]]*[\"']?Enabled" "$rness_dir/policy"; }; then
  echo "rness: policies not checked: $rness_why" >&2
fi
```

The hooks fail open. A missing `node`, a pinned CLI not installed, a `.rness/`
not reachable (a standalone clone) or an error of Rness's own never blocks a
commit: the hook prints one line, `rness: policies not checked: <why>`, and
lets git go on. A missing `node` or CLI says nothing while no policy is
enabled, since nothing would be checked. Only a refusal blocks: its message
is shown, and the hook exits 1. Any other exit of the CLI is one line,
`rness: policies not checked: the rness CLI exited <n>`, in place of what
it printed.

A hook runs the CLI only from a `.rness/` that holds its `rness.json`, is
owned by you and is not writable by everyone. A `.rness/` someone else could
have placed above a clone (`/tmp/.rness` for a clone under `/tmp`) is never
run: the hook says so in one line.

::: details Removing the hooks
A rness hook is the one whose second line is the marker,
`# rness: policy hook`. After moving the pin back to a version without
policies, each commit says `the rness CLI exited 2` until you remove them.
In each clone:

```sh
for hook in pre-commit commit-msg pre-push; do
  file="$(git rev-parse --git-path hooks)/$hook"
  if grep -qs '^# rness: policy hook' "$file"; then rm "$file"; fi
done
```

A hook without the marker is left as it is.
:::

## The refusal

The message is written for the agent that has to fix it alone. It names every
failing rule of every policy, so one correction passes:

```
rness: policy no-agent-trailers refused this commit
  commit message, line 7: Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  fix: Remove the agent's Co-Authored-By trailer, then commit again.
  policy: .rness/policy/no-agent-trailers.md
```

Each failing rule shows where (the message line, `path:line` for an added
line, or the ref for a push), the offending line cut to 120 characters, its
`fix`, and the standard when the policy names one. A git hook prints it on
stderr and exits 1, which the agent sees as its command failing; the guard
prints the same text and refuses the tool call. There is no retry limit.

## Where refusals show

Each refusal is recorded as one line in `rness/refusals.jsonl`, in the git
directory of the clone or of `.rness/`: never committed, never pushed, and
pruned to 30 days by `rness sync`.

- **The session summary.** With a board that keeps a [journal](./boards.md),
  the summary of a session gains a line such as
  `Policies: 3 refusals (no-em-dash 2, no-agent-trailers 1)`, and is posted
  when the session has at least one commit, note or refusal. Two sessions in
  the same clone at the same time both count the same window.
- **`rness status`.** A Policies tab lists every policy with its scope and
  status, then the refusals of the last 7 days across the clones, grouped by
  policy with the count and the last time, in UTC. `/rness:status` shows the
  same.

## Turn on the example

A new workspace has no enabled policy. It ships one example, disabled:
`policy/no-force-push.md`, which refuses a push that rewrites a remote
branch. To enable it, change one line in `.rness/policy/no-force-push.md`:

```diff
-status: Disabled
+status: Enabled
```

Commit it to `.rness/` and merge it as any change. Each clone applies it once
it has pulled `.rness/`; `rness sync` then lists the policy in the blocks.
Write your own the same way: a file, its rules, its reason.

## What enforces it

Dated 2026-11-03. Informed means the block of `AGENTS.md` tells the agent.

| Who | Informed | Blocked before the action | Not covered |
| --- | --- | --- | --- |
| Claude Code, local | Yes | The guard: the lines an edit adds, a bypass of the hooks. The git hooks: commit, push. | A write made through Bash (`sed -i`) until it is committed; a hook that errors (it fails open); the cases listed below. |
| Codex CLI, Cursor, local | Yes, through `AGENTS.md` | The git hooks: commit, push. | `--no-verify`; a write until it is committed. |
| Cloud agents (Codex cloud, Cursor background agents, Claude Code on the web) | If they read `AGENTS.md` | Nothing: no Rness hook in their clone. | Everything else. |
| A person | No | The git hooks. | `--no-verify`. |
| A clone using husky or lefthook | As its harness | Nothing until the team adds the lines `rness sync` prints. | Everything else. |

For Codex CLI and Cursor, the git hooks apply by inference: their documentation
says nothing of git hooks (verified 2026-11-03), and a shell they start runs
the clone's hooks as any shell does. A pull request description and a comment
on the host never pass through git: no policy reaches them.

### What the Claude Code guard does not see

On `Bash`, the guard reads every command and refuses a bypass of the git
hooks while an enabled policy applies: `git commit --no-verify` or `-n`,
`git push --no-verify`, `git merge` or `git pull --no-verify`,
`git -c core.hooksPath=...`, an alias that skips hooks, `GIT_CONFIG_GLOBAL`,
`GIT_CONFIG_SYSTEM`, `GIT_CONFIG`, and a write of `core.hooksPath` or of an
include. When a git command holds a hook-skipping word it cannot read, it
refuses as a backstop, so it can refuse a command that was harmless
(`GIT_CONFIG_GLOBAL=/dev/null git commit`, `git -c "$KV" ...`, `ls *.md commit -n`). The git hooks
still run in every case below except the last two groups, which change or
route around the hooks themselves.

::: details The cases it does not catch
- **Scripts it cannot see.** A shell reading its script from stdin or a file
  (`bash <<EOF`, `... | sh`, `sh < file`, `bash script.sh`, `source file`, `. file`); shell functions
  and aliases; other interpreters (`python -c`, `node -e`, `perl -e`), `make`,
  `npm run`, any script that runs git.
- **Configuration it cannot see.** An alias value is read as a shell reads it, not with git's own splitting. Git aliases already in a configuration
  file or in the hook's own environment; another global configuration through
  `HOME=` or `XDG_CONFIG_HOME=`; `GIT_EXEC_PATH` or `--exec-path=` pointing git
  at other commands.
- **Values it cannot read.** An unknown expansion among the arguments of
  `commit`, `push`, `merge` or `pull` that no option takes
  (`git commit $(printf -- --no-verify) -m x`) is skipped; only the backstop,
  for a command not read to the end, counts it.
- **Options of another git.** An option the tested git (2.56.0) does not know,
  combined with `-n` rather than a literal `--no-verify`.
- **Wrappers.** `-n` behind a wrapper the parser does not know, unless it
  follows `commit` (`parallel git commit -n`).
- **Places.** A command started outside any workspace whose git target cannot
  be placed (`cd "$X" && git commit -n` from `/tmp`).
- **Shell readings.** Only bash 3.2 and zsh were run against the reader.
  Some zsh patterns, a brace expression whose separator comes from an
  expansion, and bash 5, dash or fish where they differ from both.
- **False positives.** The backstop fails closed, so it can refuse a
  harmless command: `ls *.md commit -n`, `git commit -m x *` (refused as
  "may", since the shell could expand `*` to an option).
- **Policies.** An `extends` cycle makes the Bash check fail open, as the git
  hooks do; `rness validate` reports it.
- **Commits that run none of these hooks by design.** `git commit-tree` with
  `git update-ref`, `git am`, `git rebase`, `git cherry-pick`, `git revert`,
  `git stash`; a merge git concludes itself runs no `pre-commit` (one you
  conclude with `git commit` after a conflict does).
- **The hooks themselves.** `rm`, `chmod -x` or an edit of `.git/hooks/*`, an
  edit of `.git/config` (the edit tools or `echo >>`), `git config --unset`
  of a team hook manager's path.
:::
