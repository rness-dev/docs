# Versions

The version of `@rness/cli` a workspace runs is written in one place,
`.rness/package.json`:

```json
{
  "devDependencies": {
    "@rness/cli": "0.8.0"
  }
}
```

Every `rness` command run inside the workspace delegates to that copy,
installed under `.rness/node_modules` — whatever `rness` you typed, global or
`npx`. The whole team runs the version the organization agreed on, and moving
it is a change to `.rness`, reviewed like any other.

This page describes `@rness/cli` 0.8.0; the behaviours below arrived in 0.5.1
to 0.8.0, and the text says which.

## Update a workspace, step by step

A release reaches a workspace in three moves: the pin moves once, in the
organization's `.rness`; someone merges the new scaffold there; then every
machine installs the new version.

**Once, for the organization**

1. Wait for the pull request Dependabot opens on `<org>/.rness`, titled
   `chore(deps-dev): bump @rness/cli from 0.7.0 to 0.8.0`
   ([when it arrives](#a-release-opens-a-pull-request)). Without Dependabot,
   or without waiting: run `rness upgrade` in the workspace, then commit and
   push `.rness` ([by hand](#moving-the-pin-by-hand)).
2. Review it — `validate.yml` has run with the new version — and merge.
3. Merge the new version's scaffold (0.8.0 and later): pull, then run
   `rness upgrade` in the workspace. It merges the CI workflow, hooks and
   starter documents of the version the pin names, with git, and installs
   nothing more ([the scaffold](#the-scaffold-merged-with-git)). Review, commit,
   push. `rness validate` warns while this step is missing.

**On every machine, yours included**

4. Pull the context:

   ```sh
   cd acme/.rness
   git pull
   ```

5. Run any `rness` command in the workspace; `rness validate` changes
   nothing and is a good one. It sees that the pin moved, installs it
   (`installing @rness/cli 0.8.0 in .rness…`), then runs the command with it.
   An option on its own (`rness --version`) does not check. Installing by
   hand does the same: `pnpm install` in `.rness/`, or the install of the
   manager the workspace uses.
6. Check: inside the workspace, `rness --version` prints the copy installed
   in `.rness/` — the new version.
7. Run `rness sync` only when the release notes say the blocks changed
   ([below](#what-an-upgrade-changes-in-the-repositories)); otherwise nothing
   changes in the repositories.

Without a global `rness`, type the commands through your package manager:
`npx @rness/cli validate`, `pnpm dlx @rness/cli validate`,
`yarn dlx @rness/cli validate` or `bunx @rness/cli validate`. Inside the
workspace, whichever copy you launch hands the command to the one in
`.rness/`.

## A release opens a pull request

The scaffold ships `.rness/.github/dependabot.yml`, restricted to
`@rness/cli`. Each release opens a pull request on the organization's
`.rness`: the pin and the lockfile in the diff, `validate.yml` running with
the new version before anyone merges. Review, merge; that is the whole
upgrade.

The pull request arrives 3 to 10 days after a release: Dependabot checks
weekly, and holds any new version back for 3 days by default — its cooldown,
a guard against a compromised release. To receive it sooner, at the price of
that guard, add under `allow:` in `dependabot.yml`, at the same indentation:

```yaml
    cooldown:
      exclude:
        - "@rness/cli"
```

A workspace created before 0.5.1 has no `dependabot.yml`; `rness upgrade`
writes it.

## Teammates catch up on their own

After `git pull` in `.rness`, the pin has moved and the installed copy has
not. The next `rness` command in that workspace installs the pin itself —
with the workspace's package manager, frozen, so the working tree stays clean
— announces it on stderr (`installing @rness/cli 0.8.0 in .rness…`), and
carries on with the command. Nothing extra to remember or to run.

Since 0.5.3 the check runs in the installed copy as well as in the launcher,
so it works whatever `rness` a teammate typed. Two limits remain:

- The move to 0.5.3 itself is seen only by a launcher at 0.5.1 or later. A
  global `@rness/cli` older than that, over an installed copy older than
  0.5.3, installs nothing and says nothing: run `npm i -g @rness/cli@latest`
  once.
- `RNESS_NO_INSTALL=1` turns the catch-up off and restores a warning instead
  — for CI, a container image, or a machine that cannot install. The
  scaffold's `validate.yml` sets it.

## Moving the pin by hand

```sh
rness upgrade            # the latest release
rness upgrade 0.5.2      # an exact version, up or down
```

`upgrade` merges the scaffold of the target version (below), pins the
version in `.rness/package.json` (the rest of the file untouched), installs
with the workspace's package manager, then syncs through the new copy. The
merge is staged, not committed: commit `.rness` once, and the commit records
it. Without Dependabot, this is the whole upgrade.

`upgrade` is never delegated to the pinned copy, which is what it replaces:
it runs the copy you typed. From 0.8.0, a global `rness` older than the pin
merges the scaffold of the copy installed in `.rness`. A global below 0.8.0
knows no scaffold: it answers "already at" and merges nothing — use
`npx @rness/cli@latest upgrade`, or `pnpm rness upgrade` from inside
`.rness`, which runs the pinned copy. A workspace pinned below 0.5.0 starts
with the `npx` form.

## The scaffold, merged with git

`rness create` writes the scaffold into `.rness/` — the CI workflow, the
hooks, `dependabot.yml`, the starter documents — in its one commit. Since
0.8.0, `rness upgrade` brings a later version's scaffold with a three-way git
merge, from the last commit in which rness wrote the scaffold:

```sh
rness upgrade -y
merging  the @rness/cli 0.9.0 scaffold
added    .github/workflows/validate.yml
updated  .githooks/pre-commit
merged   AGENTS.md
```

- A file the team never touched takes the new version. An edited one keeps
  its edits where the scaffold did not change the same lines. When both
  changed the same lines, `upgrade` stops before installing and lists the
  conflicts: `git checkout --ours <file>` keeps yours, `--theirs` takes the
  scaffold's; then `git add`, `git commit`, and `rness upgrade` again.
- `.rness` must be a git repository with nothing uncommitted.
- `rness.json`, the repositories and their blocks are never touched.
- A `.rness` with no scaffold commit — made by hand, or older than
  `rness create` — is adopted by its first upgrade: identical files merge
  silently, a missing one is added, a differing one conflicts once. After
  that, merges have a base like any other.
- Merge an upgrade pull request with a merge commit, not a squash: a squash
  drops the scaffold commit, and the next upgrade falls back to an older
  base — more conflicts, never a silent loss.
- `rness validate` warns while the scaffold merged in `.rness` is behind the
  pin; a one-commit CI checkout says nothing, its history is not there.

## What an upgrade changes in the repositories

Nothing, unless the block's content changes. A generated block is current
when its hash is, whatever version wrote it, so upgrading rewrites no
`AGENTS.md` on its own.

One exception, in 0.5.2: the block's intro changed (it points at
`.rness/AGENTS.md` instead of a file nobody wrote), and the intro is part of
the hashed body. Every block written by 0.5.1 or earlier is out of date under
0.5.2 and later. Run `rness sync` once after that upgrade and commit the
refreshed `AGENTS.md` in each repository; until then `rness sync --check`
exits 1.

In 0.6.2, the workspace root `CLAUDE.md` changed: it holds the global block
instead of `@AGENTS.md`. It is on each machine only, never in a repository:
the first `rness sync` after the upgrade rewrites it, on every machine; nothing
to commit.

In 0.7.0, `rness.json` accepts an `agents` key. Move the pin first, then
declare an agent: a CLI older than 0.7.0 refuses the key, and every command
of a teammate still on the old pin would stop on it.

## Two managers, two guards

pnpm 12 refuses to install a version published less than 24 hours ago
(`minimumReleaseAge`). The scaffold's `pnpm-workspace.yaml` excludes
`@rness/cli` from that rule, since the pinned CLI is what the workspace exists
to run; the same exclusion is what `rness upgrade` suggests when an install
fails on it. The same 24 hours apply to `pnpm create rness` on the day of a
release: it resolves the previous version until the next day.
