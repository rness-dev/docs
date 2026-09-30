# Repositories

## Add a repository

```sh
rness add api                                # a repository of your organization
rness add acme/api                           # any owner
rness add https://github.com/acme/api.git    # any URL
```

`add` clones the repository under `org/` (or adopts a clone already there)
and declares it in `rness.json` for the whole team. Commit `rness.json` in
`.rness`. A blank workspace has no organization, so there give
`<owner>/<repo>` or a URL.

A monorepo is a repository like any other. Its parts become scopes, each
with its own context:

```sh
rness add platform --scopes apps/web,packages/ui
```

## Clone what your teammates added

`rness sync` offers, in a terminal, to clone the repositories of
`rness.json` you do not have yet.

```sh
rness sync --all     # clone every repository of the list
rness sync --pull    # pull every clean clone first
```

## Private repositories

Without a login, rness lists public repositories only. To reach the
private ones:

```sh
rness login
```

rness shows a code and `https://github.com/login/device`. Approve the code
in a browser, on any machine. The login is stored in
`~/.config/rness/auth.json` (`%APPDATA%` on Windows), readable by you
only, and renews itself. `rness logout` forgets it.

- rness asks for the `repo` and `read:org` scopes. GitHub has no read-only
  scope for private repositories, but rness only lists and clones them.
  Where the workspace uses [Agent Pulse](./agent-pulse.md), it also asks for
  `project`, to write the board.
- An organization that restricts OAuth apps hides its private repositories
  until an owner approves "Rness". `rness create` says so, with the link.
- In CI, set `GITHUB_TOKEN` or `GH_TOKEN`. Either one takes precedence over
  the login.

## SSH or HTTPS

`create` and `add` test your SSH access to github.com once. They write
`git@github.com:` URLs when GitHub accepts your key, and
`https://github.com/` URLs otherwise. `--ssh` and `--https` choose without
the test.

Over HTTPS, rness's own clones and pulls use your login. For your own
`git pull` and `git push`, `rness login` offers to act as git's credential
helper for github.com (`rness login --setup-git`); `rness logout` undoes
it.
