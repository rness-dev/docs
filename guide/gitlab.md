# GitLab

A workspace can mirror a GitLab group on gitlab.com instead of a GitHub
organization. Everything else stays the same: `.rness`, `rness sync`, the
agents' files, the lifecycle of your documents. This page is what differs.

## Create the workspace

Answer **GitLab** to the first question of `create`, or pass the provider:

::: code-group

```sh [npm]
npm create rness -- acme --provider gitlab
```

```sh [pnpm]
pnpm create rness acme --provider gitlab
```

```sh [yarn]
yarn create rness acme --provider gitlab
```

```sh [bun]
bun create rness acme --provider gitlab
```

:::

- **The organization is a top-level group**, by its path: letters, digits,
  `_`, `-` and `.`. A subgroup is not a workspace of its own, but its
  projects are listed with the group's.
- **The projects**: each by its path, the subgroup as the hint
  (`platform/mobile`), cloned under `org/<path>`. A project `internal` wears
  the padlock, as a private one does. Two projects with the same path in two
  subgroups: the first is offered, the second is named and left out.
  Archived projects, and those scheduled for deletion, are not offered.
- **The context repository is the project `<group>/rness`**: a GitLab
  project's path must start with a letter or a digit, so `.rness` cannot be
  one. On your machine it is still cloned as `.rness/`. Logged in, `create`
  offers to create it, private, and push it. Otherwise it prints the steps:

  ```sh
  # create the empty private project acme/rness on gitlab.com, then:
  git remote add origin git@gitlab.com:acme/rness.git && git push -u origin main
  # or, with the GitLab CLI (glab) installed:
  glab repo create acme/rness --private --skipGitInit && git push -u origin main
  ```

- `rness add api` adds `<group>/api`; a project of a subgroup goes by its
  full path: `rness add acme/platform/mobile`.

## Log in

```sh
rness login --provider gitlab
```

Rness shows a code and opens `https://gitlab.com/oauth/device` to approve it,
through its application "Rness". Inside a GitLab workspace the flag is not
needed. The login asks for the `api` and `write_repository` scopes: `api`
for the projects, the issues and the boards (GitLab has no narrower scope
for issues), `write_repository` for git over HTTPS. The token lives two
hours and renews itself; it sits beside your GitHub login, if you have one.

- `GITLAB_TOKEN` takes precedence over the login: a personal access token
  works there, for CI.
- Over HTTPS git sends the username `oauth2` and the token.
  `rness login --setup-git` makes Rness git's credential helper for
  gitlab.com.
- `rness logout --provider gitlab` forgets that login only, and names
  `https://gitlab.com/-/user_settings/applications`, where you revoke the
  authorization.

## SSH

`create` and `add` test `ssh -T git@gitlab.com` once and write
`git@gitlab.com:` URLs when gitlab.com accepts your key, `https://gitlab.com/`
ones otherwise. gitlab.com takes an SSH key on one account only: a key
already on another account is refused there.

## Boards

`rness board push` puts the boards `rness.json` declares on the issue
boards of `<group>/rness`, in the shape GitLab's Free tier allows:

- **The cards are the project's issues**, one per document, labelled
  `rness`. Its first line names the document and links it.
- **Each `board` view is an issue board**, `<title> · <view>`
  (`Agent Pulse · ADR`). Its lists are the labels of its columns
  (`ADR status::Proposed`, `ADR status::Accepted`, …), in the declared order;
  the Open and Closed lists are hidden.
- **A select is a label `Key::value`**: `Status::Draft`, `Collection::ADR`,
  `Agent::working`. Rness keeps one value per key on a card. Moving a card
  between lists swaps its label; the next push writes the document's status
  back.
- **The other fields** (`Working session`, `Session history`, a declared
  date or number) are lines at the end of the issue's description, below a
  rule.
- `rness.json` names the board by `ids`, one issue board per view,
  written by `push` when it creates them ([`ids`](../cli/boards.md#a-board)).
- A `table` view has no object on GitLab: `push` prints its issue list
  once. A `roadmap` view has none either. A board's README, short
  description and status updates are not written.
- References in your documents (`#4`, `!5`, `@name`) are escaped on the
  cards: a push mentions no one and links no issue.
- `rness note` posts to the plan's card. An implementation issue in a
  member project is linked to it as related, and a session's summary names
  its merge request.

`push` needs Issues turned on in `<group>/rness`. A workspace's `rness status`
links the first view's board.
