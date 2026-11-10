# Update Rness

Your organization uses one version of Rness, pinned in
`.rness/package.json`. Every `rness` command in the workspace runs that
version, whichever `rness` you type, so the whole team stays in step.
Moving to a new version is a change to `.rness`, reviewed like any other.

## Update

From the workspace's `.rness/`:

::: code-group

```sh [npm]
npx rness upgrade
```

```sh [pnpm]
pnpm rness upgrade
```

```sh [yarn]
yarn rness upgrade
```

```sh [bun]
bunx rness upgrade
```

:::

It moves the pin to the latest release, installs it, brings in the new
version's starter files (CI workflow, hooks, templates) without losing your
edits, updates every repository's generated files, and commits `.rness`.
Then:

1. Push `.rness`.
2. In each repository, commit the files it lists at the end, for example
   `.claude/skills/rness/`.

To go to a given version, up or down: `pnpm rness upgrade 0.14.0`.

If `rness` stops on the Node.js version before it starts, see
[Troubleshooting](./troubleshooting.md#node-version).

## `rness.json` is rewritten once {#rness-json}

`rness.json` has one current shape, contract 2: no `repos` key, a
repository and the parts of it all declared under `scopes` ([The workspace](./workspace.md#rness-json-the-list-of-repositories)).
`upgrade` rewrites the file once, in the same commit as the new pin. It
reads and checks the file first, before changing anything. If the file holds
something the new shape cannot (a repository with no scope at
`org/<name>`, a scope inside no repository, a scope outside `org/`), it
stops with one line per problem, changes nothing and leaves the pin where it
was: fix the file by hand, then run `upgrade` again. Meanwhile the current
version keeps working. When a part now inherits its repository by nesting,
`upgrade` says so (`scope "web" now inherits platform (nested)`).

To do it in one step, use the new copy:

```sh
npx @rness/cli@latest upgrade
```

Run from the workspace's `.rness/`, `rness upgrade` of an older pin (`pnpm rness upgrade`) installs the new version but cannot rewrite the file. Its
sync then stops with `rness.json is contract 1: run rness upgrade`. Run
`rness upgrade` once more: it finishes the update, rewrites the file, syncs
and commits. If a newer release came out between the two runs, finish with
`rness upgrade <version>`, the version the first run installed.

In a workspace whose `packageManager` is npm, `pnpm rness` fails: use
`npm exec -- rness upgrade` or `npx rness upgrade`.

Until the file is rewritten, every command but `upgrade`, `login` and
`logout` stops with that line. The hooks do not block your commits: they
print one line, `rness: policies not checked`, naming `rness upgrade`. Once rewritten, a downgrade below 0.25.0, the first version that
reads contract 2, is refused: the older version cannot read the file.

A teammate who joins with `rness create <org>` a workspace still on the
former shape is told which version to use, in the form
`npx @rness/cli@<version> create <org>`.

## Your teammates

They pull `.rness`:

```sh
git -C .rness pull
```

Their next `rness` command sees the new pin, installs it, and carries on.
There is nothing else to run.

## Hear about new releases

### A pull request for each release

Every `.rness` comes with `.github/dependabot.yml`. For each release of
Rness, Dependabot opens a pull request on your organization's `.rness`
that moves the pin, and the `validate` check runs with the new version
before anyone merges.

1. Review the pull request, and merge it with a merge commit rather than
   a squash.
2. Pull `.rness`, then run the update above. It finds the pin already
   moved, brings in the starter files, updates the repositories and
   commits.

When the pull request moves the pin of a workspace still on the former shape
to a version that reads contract 2, its `validate` check fails with `rness.json is contract 1: run rness upgrade`: the new version
does not read the former shape. Tell the team once: one developer runs
`rness upgrade` (on the pull request's branch before merging it, or on
`main` after) and pushes; the others `git pull`.

Dependabot checks weekly and waits 3 days after a release before opening
the pull request, which guards against a compromised release. To get it
sooner, give up that wait for Rness only. In `.rness/.github/dependabot.yml`,
under `allow:`, at the same indentation:

```yaml
    cooldown:
      exclude:
        - "@rness/cli"
```

### Or watch the repository

On [github.com/rness-dev/rness](https://github.com/rness-dev/rness),
**Watch → Custom → Releases** notifies you of each release. The
[changelog](https://github.com/rness-dev/rness/blob/main/packages/cli/README.md)
says what each one changed, and what to commit.

::: details When the starter files conflict
If you edited a starter file on the same lines as the new version,
`upgrade` stops before installing and lists the conflicts. For each file,
keep yours with `git checkout --ours <file>` or take the new one with
`git checkout --theirs <file>`, then `git add` and `git commit`, and run
the update again.

`.rness` must be committed, with no merge in progress, before an update.
:::

::: details pnpm and same-day releases
pnpm refuses packages published less than 24 hours ago. Every `.rness`
exempts Rness in its `pnpm-workspace.yaml` (`minimumReleaseAgeExclude`),
so an update on release day works. Only `pnpm create rness` on release day
still picks the previous version.
:::

::: details In CI
The `validate` workflow of `.rness` sets `RNESS_NO_INSTALL=1`: a pin that
moved is reported, not installed. Set the same variable on any machine that
must not install.
:::
