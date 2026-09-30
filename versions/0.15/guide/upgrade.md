# Update rness

Your organization uses one version of rness, pinned in
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
rness, Dependabot opens a pull request on your organization's `.rness`
that moves the pin, and the `validate` check runs with the new version
before anyone merges.

1. Review the pull request, and merge it with a merge commit rather than
   a squash.
2. Pull `.rness`, then run the update above. It finds the pin already
   moved, brings in the starter files, updates the repositories and
   commits.

Dependabot checks weekly and waits 3 days after a release before opening
the pull request, which guards against a compromised release. To get it
sooner, give up that wait for rness only. In `.rness/.github/dependabot.yml`,
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
exempts rness in its `pnpm-workspace.yaml` (`minimumReleaseAgeExclude`),
so an update on release day works. Only `pnpm create rness` on release day
still picks the previous version.
:::

::: details In CI
The `validate` workflow of `.rness` sets `RNESS_NO_INSTALL=1`: a pin that
moved is reported, not installed. Set the same variable on any machine that
must not install.
:::
