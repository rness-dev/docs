# Agent Pulse

Agent Pulse is a GitHub Project of your organization. On it the team sees
every decision, specification and plan of `.rness/`, where each one stands,
and what an agent is working on right now. Rness writes it; the team reads
it.

## Create it

```sh
rness pulse create    # once per organization: the project, then a first sync
```

Then commit `.rness/rness.json`, which now holds the board, written whole
(see [Shaped in `rness.json`](#shaped-in-rness-json)). The project is
private, GitHub's default for an organization project.

It needs:

- **Issues turned on for `.rness`**, in its GitHub settings: each document
  becomes an issue of `.rness`.
- **The `project` scope** on each developer's `rness login`. Rness asks for
  it where a pulse is declared.

## What you see

- **A board per collection**: ADR, Specs, Plans, and any other directory
  whose documents carry a status. Its columns are that collection's
  statuses.
- **`Working`**: the documents an agent is working on now.
- **`All`**: every document in a table.

Each card is an issue of `.rness` whose body is the document itself, so a
specification reads on the board. Links between documents open in the
side panel. The fields:

| Field | Holds |
| --- | --- |
| `Status` | The document's status (and `ADR status`, `Specs status`, … for each collection's board) |
| `Collection` | ADR, Specs, Plans, … |
| `Agent` | `working` while an agent works on it |
| `Working session` | The session working on it now: `claude · 1a2b3c4d`. Emptied when the session ends. |
| `Session history` | Every session that wrote or changed it, with its agent: `Claude Opus 5.5 · 1e9cb41b-…`. Never emptied. |
| `Path` | The document's path in `.rness/` |

## Shaped in `rness.json`

Each board is described in `.rness/rness.json`, under `projects`: its
collections, the statuses and their colours, its fields, labels and views.
What `rness.json` says is the board. Edit it, commit it, and the next
`rness pulse sync` brings the board in line.

```json
"projects": {
  "pulse": {
    "number": 3,
    "preset": "agent-pulse/1",
    "title": "Agent Pulse",
    "collections": "all",
    "colors": { "Blocked": "red", "In progress": "yellow" },
    "fields": {
      "Collection": { "type": "select", "from": "$collection" },
      "Owner": { "type": "select", "from": "owner" }
    },
    "views": [
      { "name": "All", "layout": "table", "fields": ["Title", "Collection", "Status"] },
      { "name": "Plans", "layout": "board", "collection": "plans", "columns": "Plans status" }
    ]
  }
}
```

- **`collections`**: `"all"` (ADR, specs, plans, then every other
  directory whose documents carry a status), or the directories to show,
  each with its `statuses`.
- **`fields`**: each a `type` (`text`, `date`, `select`, `number`) and
  where its value comes from: a front-matter key of the documents, or
  what Rness knows (`$collection`, `$status`, `$agent`, `$session`,
  `$sessions`, `$id`).
- **`views`**: `board`, `table` or `roadmap` views, each for every card or
  one collection's, with an optional GitHub filter.
- **`colors`**: a colour per option, among `gray`, `blue`, `green`,
  `yellow`, `orange`, `red`, `pink` and `purple`. A colour change keeps
  every card's value.

A view you change is updated in place. A view you add on GitHub yourself
is left alone, and the sync mentions it once. A board declared wrongly is
skipped, and `rness validate` names the key at fault. Every key, its
values and its default: [Boards in `rness.json`](../cli/boards.md).

`pulse create` writes Agent Pulse from the preset `agent-pulse`, recorded
in `"preset"`. When a later Rness improves the preset, `rness sync` brings
the improvement into your board: what you never changed takes the new
value, and what you changed stays yours. Remove `"preset"` to keep a board
exactly as you wrote it.

::: tip From 0.20
A board declared by its number (`"pulse": 3`) still works. The first
`rness sync` after an upgrade writes it whole, and nothing changes on
GitHub.
:::

## What keeps it up to date

With [Claude Code](./claude-code.md), you run nothing:

- **At session start**, the `In progress` plans of the repository you work
  in are marked `working`.
- **When the agent edits a document**, the document is marked `working`. A
  new document gets its card, and a changed status moves its card, within
  seconds.
- **At session end**, the session's marks are cleared and the board is
  synced.

By hand, or from another agent:

```sh
rness pulse sync
```

The hooks start a background process that uses your login, and Claude Code
never waits for it. When it cannot write (no login, a missing scope,
GitHub unreachable), the next session start says why.

What a session does is the board's `hooks` in `rness.json`, which Agent
Pulse's preset declares as above:

```json
"hooks": {
  "session-start": ["mark-in-progress"],
  "edit": ["mark"],
  "session-end": ["clear-marks"]
}
```

`mark-in-progress` can name other collections and statuses, such as
`{ "action": "mark-in-progress", "collections": ["plans", "specs"],
"statuses": ["In progress", "Approved"] }`. Remove `hooks` to turn marking
off on a board, or add them to a collection's own project. The actions are
Rness's own: a hook never runs a command written in `rness.json`. Every
action and its parameters: [hooks](../cli/boards.md#hooks).

## The agent's journal

How a plan was implemented, in the agent's words: the approach it chose,
where it left the plan and why, what blocked it, and what it did. Turn it
on with two more hooks on Agent Pulse:

```json
"hooks": {
  "session-start": [
    "mark-in-progress",
    { "action": "journal", "to": "repo", "limit": 5 }
  ],
  "edit": ["mark"],
  "session-end": ["clear-marks", "journal-summary"]
}
```

When a plan is `In progress` in the repository you work in, the session
start tells the agent to post a note when it chooses an approach, deviates
from the plan, is blocked, and when it is done: decisions and their
reasons, not steps, `limit` at most per session. It posts with
`rness pulse note` or the `rness_note` tool, and you can too:

```sh
rness pulse note --kind deviation "Kept the old header: two clients read it."
```

- **`"to": "plan"`**: the notes are comments on the plan's issue in
  `.rness`.
- **`"to": "repo"`**: the first note opens an implementation issue in the
  repository the session works in, labelled `rness:plan`, a sub-issue of
  the plan's. The note prints its reference, `acme/api#87`: the pull
  request that completes the plan carries `Closes acme/api#87`, and
  GitHub closes the issue when it is merged into the default branch.
  Rness closes nothing. A repository with its issues off, or that your
  login cannot write to, gets nothing: the note goes to the plan's issue,
  and the next session start says so once.
- **At session end**, `journal-summary` posts the session's duration, its
  commits on the branch and the branch's pull request, where its notes
  went, or on the plan when it made commits and no note.

::: details Limits
- A note holds 1 to 4,000 characters.
- A note that looks like it holds a credential (a GitHub token, an AWS key,
  a private key, a Slack or API token) is refused, never redacted.
- The counts and the session's start stay in your clones' git directories,
  never pushed.
- Not verified against GitHub yet (2026-10-06): a sub-issue across
  repositories, and `Closes` on a merged pull request.
:::

## A collection's own project

Agent Pulse shows every collection of `.rness/` on one project. A
collection whose work stands apart, such as a roadmap or a launch, can
have a project of its own:

```sh
rness pulse create roadmap    # the project, named after the collection, then a sync
```

`rness.json` then holds both boards, and `rness pulse sync` syncs both.
The collection's documents leave Agent Pulse for their project; their
issues stay as they are. The project's board is declared like Agent
Pulse's, with a few keys of its own:

```json
"roadmap": {
  "number": 4,
  "preset": "collection/1",
  "description": "What we ship this quarter.",
  "readme": "roadmap/README.md",
  "updates": "roadmap/updates",
  "collections": {
    "roadmap": { "statuses": ["Idea", "Planned", "Building", "Shipped", "Dropped"] }
  },
  "fields": {
    "Target date": { "type": "date", "from": "target" },
    "Area": { "type": "select", "from": "area" }
  },
  "labels": "directory",
  "views": [
    { "name": "Roadmap", "layout": "board", "collection": "roadmap" },
    { "name": "Calendar", "layout": "roadmap", "collection": "roadmap", "date": "Target date" }
  ]
}
```

- **`readme`** is a file of `.rness/` whose text is the project's README.
- **`statuses`** are the columns, in order.
- **`labels`** is `directory` (each document labelled with its
  subdirectory) or a front-matter key.
- A roadmap view's date field is picked once in the view's settings on
  GitHub: GitHub's API cannot set it.
- **`roadmap/updates/`** holds the project's status updates, one file each,
  named by date:

  ```md
  ---
  health: on-track   # on-track, at-risk, off-track, complete or inactive
  ---
  The first two items shipped; the third moves to next month.
  ```

  Each file is posted once and updated when it changes.

Before 0.21, a collection's `README.md` declared these in its front
matter. `rness sync` moves them into `rness.json` and out of the README.

## Things to know

- **Access follows `.rness`**: GitHub shows these issues only to people
  who can read `.rness`. `-label:rness` hides them from its Issues tab.
- **One way**: a change made on the board by hand (a card moved, a field,
  a title, an issue closed) is written back at the next sync. It never
  reaches `.rness/`. Change the document instead.
- **Comments are yours**: a specification's discussion can live on its
  issue, and Rness never touches comments.
- **Your own items stay yours**: a card Rness did not make is never edited,
  closed or archived.
- **A deleted document** closes its issue, as not planned.

::: details How an issue's body is written
- The first line is the document's path and a link to the file.
- The front matter and the first heading are left out: they are the
  fields and the title.
- A link to another document points to that document's issue.
- `@name` and `#12` are escaped, so a body notifies no one and links no
  wrong issue.
- A document longer than GitHub's 65,536 characters is cut at a blank
  line, and ends with a link to the rest.
:::

::: details Rate and size
Rness sends one request at a time. A new document costs a few requests;
an unchanged one, nothing but its share of the listing. When GitHub's rate
limit is hit, Rness waits as long as GitHub says, 10 minutes at most, and
the next sync finishes the rest. On a board of 54 documents (2026-09-30), a
sync with nothing to change took 4 s.
:::
