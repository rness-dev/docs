# Atlassian

A workspace can mirror a Bitbucket workspace instead of a GitHub
organization. Bitbucket Cloud holds the repositories; it has no issues, so
the cards and the agent's journal live in a space of a Jira Cloud site.
Everything else stays the same: `.rness`, `rness sync`, the agents' files,
the lifecycle of your documents. This page is what differs.

## Log in

```sh
rness login --provider atlassian
```

Neither Bitbucket nor Jira offers a device flow, so the login is two API
tokens, both made at
`https://id.atlassian.com/manage-profile/security/api-tokens`. Inside an
Atlassian workspace the flag is not needed.

1. **A Bitbucket token**: "Create API token with scopes", app Bitbucket,
   with these scopes:

   ```text
   read:user:bitbucket read:workspace:bitbucket read:project:bitbucket
   read:repository:bitbucket write:repository:bitbucket
   admin:repository:bitbucket read:pullrequest:bitbucket
   ```

2. **The Jira site**, `<name>.atlassian.net`, typed.
3. **Your Atlassian account's email**: Rness offers your primary address
   on Bitbucket.
4. **A Jira token**: "Create API token", without scopes.

Each token is typed into a masked prompt. A token refused is asked again;
nothing is stored until both answer. The login sits beside your GitHub or
GitLab login, if you have one.

- `BITBUCKET_TOKEN` takes precedence over the stored Bitbucket token, and
  `JIRA_EMAIL` with `JIRA_API_TOKEN` over the stored Jira login, for the
  workspace's Jira site. Off a terminal, `rness login --provider atlassian`
  exits 1 and names these three variables: set them in CI.
- An API token lives until it expires or you revoke it; nothing renews it.
  A token refused later clears that login, and the command says to log in
  again.
- Over HTTPS git sends the username `x-bitbucket-api-token-auth` and the
  Bitbucket token. `rness login --setup-git` makes Rness git's credential
  helper for bitbucket.org; the login offers it. The Jira token never goes
  to git.
- `rness logout --provider atlassian` forgets the Bitbucket login and every
  Jira login of this machine, and names the tokens page, where you revoke
  them.

## Create the workspace

Answer **Atlassian (Bitbucket + Jira)** to the first question of `create`,
or pass the provider:

::: code-group

```sh [npm]
npm create rness -- acme --provider atlassian
```

```sh [pnpm]
pnpm create rness acme --provider atlassian
```

```sh [yarn]
yarn create rness acme --provider atlassian
```

```sh [bun]
bun create rness acme --provider atlassian
```

:::

The same command joins a workspace whose `.rness` already exists: give it
to your teammates.

- **The organization is a Bitbucket workspace**, by its slug: lowercase
  letters, digits, `-` and `_`, not starting with `-`. `create` asks
  `Which Bitbucket workspace?` among yours, each with its name; Bitbucket
  has no personal account apart from the workspaces. Then it says your
  access:

  ```text
  member   acme (as cedric, owner)
  using    ssh (ssh.bitbucket.org)
  ```

- **The repositories**: each by its slug, the Bitbucket project as the
  hint, cloned under `org/<slug>`. A private repository wears the padlock.
  `.rness` is not offered.
- **The context repository is `<workspace>/.rness`**, as on GitHub. On
  your machine it is cloned as `.rness/`. Logged in, `create` offers to
  create it on Bitbucket, private, and push it. Otherwise it prints the
  steps, with git alone:

  ```sh
  # create the empty private repository acme/.rness on bitbucket.org, then:
  git remote add origin git@ssh.bitbucket.org:acme/.rness.git && git push -u origin main
  ```

- `rness add api` adds `<workspace>/api`; `rness add other/api` adds a
  repository of the workspace `other`. `.rness` is refused: it is the
  context repository.

### The Jira space

A new workspace, created in a terminal, then asks where its cards and its
journal live, on the Jira site your login holds (`Which Jira site?` comes
first when you logged in to several):

```text
◆  Which Jira space for the cards and the journal?
│  ○ OPS                 Operations
│  ● a new space RNESS   acme.atlassian.net
```

The spaces listed are those you can edit, by key with their names. `a new
space RNESS` is offered when that key is free on the site; otherwise `a new
space…` asks for a key: A to Z and digits, 2 to 10, a letter first. The
answer is written to `rness.json` at once:

```json
"provider": "atlassian",
"org": "acme",
"jira": { "site": "acme.atlassian.net", "space": "RNESS" },
```

`jira` is read only with `"provider": "atlassian"`. A teammate who joins
reads it there and is asked nothing.

A new space is created team-managed, Kanban, once the workspace is built
and before `.rness` is published. When Jira refuses it, the next steps say
how to make it by hand:

```sh
# create a team-managed Kanban space with the key RNESS on acme.atlassian.net
# (Jira > Spaces > Create space > Kanban > Team-managed), then: rness board push
```

Off a terminal, with `--yes`, or without a stored Jira login (`JIRA_EMAIL`
and `JIRA_API_TOKEN` name no site), no space is asked and `jira` is not
written. A next step says what to add:

```sh
# for the cards: add "jira": { "site": "<name>.atlassian.net", "space": "<KEY>" } to rness.json
```

## SSH

`create` and `add` test `ssh -T git@ssh.bitbucket.org` once and write
`git@ssh.bitbucket.org:` URLs when Bitbucket accepts your key,
`https://bitbucket.org/` ones otherwise. Bitbucket's greeting names no
account, so the line reads `using ssh (ssh.bitbucket.org)`, without `as`.

Atlassian refuses SSH to `bitbucket.org` once its migration period ends,
on 2026-11-12 (Atlassian's announcement, read 2026-10-19). Rness writes
every URL on `ssh.bitbucket.org`, a URL typed or listed on the old host
too. A clone made with either name is the same repository for Rness: it is
adopted, not cloned again. Bitbucket takes an SSH key on one account only:
a key already on another account is refused there.

## Boards

`rness board push` puts the boards `rness.json` declares on the board of
the workspace's Jira space. A team-managed space has exactly one board:
every `board` view shares it. Rness never creates the board, and writes
nothing back to `rness.json`: `number` and `ids` are refused on Atlassian.

The first push asks before it changes the space:

```text
◆  Set up RNESS for Agent Pulse: 13 statuses, any-to-any transitions?
```

`--yes` answers it. Off a terminal without `--yes`, nothing is set up, and
the push exits 1 with how to do it. In a space as Jira's Kanban template
made it, with its four statuses To Do, In Progress, In Review and Done:

```text
renamed  the template's To Do, In Progress, Done: Draft, In progress, Completed
created  10 statuses in RNESS: Proposed, Ready, Approved, Blocked, Accepted, Implemented, Rejected, Superseded, Abandoned, Gone
note     views ADR, Specs, Plans share the board of RNESS: filter on collection-adr, collection-specs, collection-plans
note     view All: https://acme.atlassian.net/issues/?jql=project%20%3D%20RNESS%20AND%20labels%20%3D%20rness
note     view Working: https://acme.atlassian.net/issues/?jql=project%20%3D%20RNESS%20AND%20labels%20%3D%20rness%20AND%20labels%20%3D%20agent-working
visible  Gone has a column, so gone documents show on the board: hide it once, among the hidden statuses of the board's column settings, https://acme.atlassian.net/jira/software/projects/RNESS/boards/3
```

- **The statuses are real Jira statuses**, each with a global transition,
  so any status reaches any other in one move. In another space, a status
  whose name matches a declared one, whatever the case, is used as it is,
  and the missing ones are created. In Review is left for your team to
  keep or remove.
- **Jira gives each new status its own column** on a fresh board, `Gone`
  included. Hide `Gone` once, by hand: in the board's column settings,
  among the hidden statuses. Jira's API cannot do it. The next push
  checks it:

  ```text
  checked  board RNESS: every status in a column, Gone hidden
  ```

  Once a status is hidden, Jira marks the board advanced: a status added
  later gets no column, and the push lists it `unmapped`, with the board's
  URL, to map once in the same settings.
- **The cards are issues of the space**, type Task, one per document,
  labelled `rness`. A card's status is its document's. A select is a label
  `<field>-<option>`, lowercased, spaces as `-`: `collection-specs`,
  `agent-working`.
- **The description is the document**, its first line the file on
  Bitbucket. Links to other documents go to their issues,
  `https://acme.atlassian.net/browse/RNESS-12`. A description holds 32,767
  characters at most: a longer document is cut, with a link to the whole
  file. Nothing is escaped: Jira's text mentions no one.
- **The other fields** (`Working session`, `Session history`, a declared
  date or number) are lines at the end of the description, below a rule.
- A document gone moves its card to `Gone`, and back to its status when the
  document returns. A card moved by hand is moved back by the next push.
- A site in another language shows the statuses translated (Draft as
  Brouillon on a French site): Rness works by their ids.
- Every `board` view is the one board: filter it on the view's collection
  label, as the `note` line says. A `table` view is printed once as Jira's issue search URL. A
  `roadmap` view has no object on Jira. A board's title, short
  description, README and status updates are not written.
- In a space as the template made it, the push turns the board's Backlog
  off. In another space whose Backlog is on, it says once that the cards
  it makes land there, not on the board.
- The marks of a session are the label `agent-working` and a `Working
  session` line. A hook never sets up the space: until a push has, the next
  session start says why it could not write.
- The notes of the [agent's journal](./boards.md#the-agent-s-journal) are
  comments. Bitbucket has no issues, so with `"to": "repo"` the
  implementation issue lives in the space too, labelled `rness-plan` and
  linked to the plan's issue as `Relates`. Issues are referred to by key
  (`RNESS-12`), and a session's summary names its branch's pull request on
  Bitbucket.

`push` needs the space on the site, and your Jira login allowed to create,
edit and transition its issues. A workspace's `rness status` links the
space's boards: `https://acme.atlassian.net/jira/software/projects/RNESS/boards`.
