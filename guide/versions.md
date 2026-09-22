# Versions

The version of `@rness/cli` a workspace runs is written in one place,
`.rness/package.json`:

```json
{
  "devDependencies": {
    "@rness/cli": "0.5.3"
  }
}
```

Every `rness` command run inside the workspace delegates to that copy,
installed under `.rness/node_modules` — whatever `rness` you typed, global or
`npx`. The whole team runs the version the organization agreed on, and moving
it is a change to `.rness`, reviewed like any other.

This page describes `@rness/cli` 0.5.3; the behaviours below arrived in 0.5.1
to 0.5.3, and the text says which.

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
— announces it on stderr (`installing @rness/cli 0.5.3 in .rness…`), and
carries on with the command. Nothing to remember, nothing to run.

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

`upgrade` pins the version in `.rness/package.json` (the rest of the file
untouched), installs with the workspace's package manager, then syncs through
the new copy; a failed install restores the file. Commit `.rness`. It is the
manual and offline path — usually nobody runs it, the pull request does the
same.

`upgrade` is never delegated to the pinned copy, which is what it replaces. A
workspace pinned below 0.5.0, whose copy has no such command, starts with
`npx @rness/cli@latest upgrade`.

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

## Two managers, two guards

pnpm 12 refuses to install a version published less than 24 hours ago
(`minimumReleaseAge`). The scaffold's `pnpm-workspace.yaml` excludes
`@rness/cli` from that rule, since the pinned CLI is what the workspace exists
to run; the same exclusion is what `rness upgrade` suggests when an install
fails on it. The same 24 hours apply to `pnpm create rness` on the day of a
release: it resolves the previous version until the next day.
