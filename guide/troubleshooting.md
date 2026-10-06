# Troubleshooting

Problems met in real workspaces, grouped by the part of the guide they
belong to: what you see, why, and the fix.

## Claude Code

### The `/rness:*` commands do not appear {#rness-commands-missing}

A session opens with the rness line, `rness <version> · <organization> · …`,
but typing `/rness` lists no command.

Claude Code loads the `rness` plugin, `.claude/skills/rness/`, only in a
folder whose trust dialog you accepted. A folder inside one you already
trust never shows that dialog: the hooks run, so the rness line appears,
but the plugin stays off.

1. Quit Claude Code in that folder.
2. From the folder you open Claude Code in, the workspace root or a
   repository's root, mark it as trusted:

   ```sh
   node -e '
   const fs = require("fs")
   const file = require("os").homedir() + "/.claude.json"
   const config = JSON.parse(fs.readFileSync(file, "utf8"))
   config.projects ??= {}
   config.projects[process.cwd()] = { ...config.projects[process.cwd()], hasTrustDialogAccepted: true }
   fs.writeFileSync(file, JSON.stringify(config, null, 2) + "\n")
   '
   ```

3. Start `claude` there again and type `/rness`: `adr`, `plan`, `spec` and
   `status` are listed.

::: details What the command changes
`~/.claude.json` keeps one entry per folder under `projects`. The command
sets `"hasTrustDialogAccepted": true` in the current folder's entry, which
is what accepting the dialog writes, and leaves the rest of the file as it
is. You can make the same change in an editor. Trusting a folder lets
Claude Code apply the `.claude/` files it holds: do it for a workspace you
know. Observed with Claude Code 2.1.287 (2026-10-02).
:::

### A formatter or a linter fails on `.claude/skills/rness/` {#generated-files-linted}

`prettier --check .`, `eslint .` or a type check reports files under
`.claude/skills/rness/`; since 0.19 they include `hooks/register.tsx`, the
plugin's mod, which imports Claude Code's types from `claude-code`, a module
your project does not have.

Rness writes these files whole and compares them byte for byte: a
reformatted file is reported by `rness sync --check`, then written back by
`rness sync`. They are not yours to format or lint. Leave them out, as the
Rness repository does:

```text
# .prettierignore
.claude/skills/rness/
```

and in `eslint.config.js`, `globalIgnores(['.claude/skills/rness/**'])`.
A `tsconfig.json` whose `include` reaches `.claude/` needs it in `exclude`.

## Agent Pulse

### A board is skipped, or `validate` names a key of `projects` {#board-refused}

`rness pulse sync` says `skipped <name>: …` and `rness validate` names the
key at fault, such as `"projects.roadmap.views[1].date" must name a date
field`. Rness checks each board declared in `rness.json` on its own: the
others still sync. Fix the key the line names, then sync again.

A board is skipped too while its collection's `README.md` still declares
`description`, `statuses`, `fields` or `labels`, as before 0.21. Run
`rness sync`: it moves them into `rness.json`. When the README and
`rness.json` say different things, it names both and moves nothing: keep
the one you want in `rness.json` and delete the other from the README.

### A board's `readme` or `updates` is refused {#board-path}

`readme` and `updates` are paths within `.rness/`, such as
`roadmap/README.md`. A path out of `.rness/`, or a file that is a link
leading out of it, is refused before anything is read: `rness.json` is
shared by the whole organization, and the file would be published on
GitHub.

## Node.js and updates

### `rness needs Node … or newer` {#node-version}

Every `rness` command checks the Node.js it runs on before anything else,
and stops with `rness needs Node <version> or newer (running v…)`. Install
Node.js 22.17 or later.

Inside a workspace, `rness` runs the version pinned in `.rness/package.json`,
and an older pin may ask for a newer Node.js than that. `upgrade` is the
exception: it runs the copy you start. To move such a workspace to the
latest release without changing Node.js, from `.rness/`:

```sh
npx @rness/cli@latest upgrade
```

Then push `.rness` and commit the files it lists, as in
[Update Rness](./upgrade.md#update).
