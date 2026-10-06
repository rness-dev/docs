# Boards in `rness.json`

Every board Rness keeps is declared in `.rness/rness.json`, under
`boards`, one entry per board; on GitHub, a board is a GitHub Project of the
organization. `pulse` is [Agent Pulse](../guide/boards.md); any other name
is a [collection's own board](../guide/boards.md#a-collection-s-own-board).
This page lists every key. What `rness.json` says is the board: edit it,
commit it, and the next `rness board push` brings the board in line.

```json
"boards": {
  "pulse": {
    "number": 3,
    "preset": "agent-pulse/1",
    "collections": "all",
    "fields": { "Collection": { "type": "select", "from": "$collection" } },
    "views": [{ "name": "All", "layout": "table" }]
  }
}
```

A board is read whole or refused. An unknown key or a wrong value is named
by its full key, such as `"boards.pulse.views[1].date" must name a date
field`, in `rness validate` and at session start; `rness board push` skips
that board and syncs the others. Rness keeps a few things for itself on
every board: one issue per document, the `Path` and `Status` fields, and
the `rness` label.

A board not created yet is written as its preset's name, `"pulse":
"agent-pulse"` or `"roadmap": "collection"`, or declared whole without its
`number`: `rness board push` creates it, then writes the number in. A board
written as a number alone (`"pulse": 3`) reads as its preset; the next
`rness sync` writes it whole, and nothing changes on GitHub. `"projects"`,
the former name of `"boards"`, still reads; `rness sync` renames it.

## A board

| Key | What it is | When absent |
| --- | --- | --- |
| `number` | The GitHub Project's number, in the organization, written by `rness board push` when it creates the project. | Not created yet: the next `rness board push` creates it. |
| `preset` | The [preset](#presets) and revision the board was made from, such as `agent-pulse/1`. | No preset: the board stays as written. |
| `title` | The project's title. | Left as it is on GitHub. |
| `description` | The project's short description. | Left as it is. |
| `readme` | A file of `.rness/`, such as `roadmap/README.md`: its text, front matter removed, is the project's README. | Left as it is. |
| `updates` | A directory of `.rness/`: each `.md` file in it is a [status update](#status-updates). | None posted. |
| `collections` | `"all"`, or the [collections](#collections) the board shows. Required. | |
| `colors` | A [colour](#colors) per option name. | Rness's defaults. |
| `fields` | The board's own [fields](#fields), by name. | None. |
| `labels` | Where each document's [labels](#labels) come from. | The `rness` label only. |
| `views` | The board's [views](#views), in order. Required, at least one. | |
| `hooks` | What a Claude Code session does to the board: [hooks](#hooks). | Nothing. |

## `collections` {#collections}

- **`"all"`**: `adr`, `specs` and `plans` with the statuses of their
  lifecycle, then every other directory of `.rness/` whose documents carry
  a status, with the statuses found. A directory another board holds is
  left out. Each collection gets a single-select field of its own
  statuses, named after it (`Plans status`), for a board view's columns.
- **An object**, a directory of `.rness/` to each collection:

| Key | What it is | When absent |
| --- | --- | --- |
| `label` | Its name on the board, in `Collection` and in filters. | The directory's name, capitalised: `marketing` gives `Marketing`. |
| `statuses` | `"contract"` (the lifecycle's, for `adr`, `specs` and `plans` only), `"found"` (those its documents carry), or a list: these first, in order, then any other found. A list for `adr`, `specs` or `plans` holds every status of the lifecycle. Required. | |
| `field` | The name of a single-select field of this collection's statuses alone, for a board view's columns. | None: `Status` holds them. |

## `fields` {#fields}

Each field is a `type` and where its value comes from:

```json
"fields": {
  "Owner": { "type": "select", "from": "owner" },
  "Publish date": { "type": "date", "from": ["published_at", "scheduled_at"] },
  "Agent": { "type": "select", "from": "$agent", "options": ["working"] }
}
```

- **`type`**: `text`, `date`, `select` or `number`.
- **`from`**: a front-matter key of the documents, a source Rness knows, or
  a list of them: the first one present wins.
- **`options`**: a select's options, in this order; values found in the
  documents follow.

| Source | Value |
| --- | --- |
| `$collection` | The collection's label. A view's `collection` filters by the select from it. |
| `$status` | The document's status. |
| `$agent` | `working` while a session marks the card, empty otherwise. A select, with the option `working`. |
| `$session` | The session working on it now: `claude · 1a2b3c4d`. Emptied when the session ends. |
| `$sessions` | Every session that wrote or changed it, with its agent. Never emptied. |
| `$id` | The document's number. |

The names Rness and GitHub use are refused: `Path`, `Status`, `Title`,
`Assignees`, `Labels`, `Linked pull requests`, `Milestone`, `Repository`,
`Reviewers`, `Type`, `Parent issue` and `Sub-issues progress`. A field
removed from `fields` stays on the project, no longer written; the sync
says so once, to delete it on GitHub if unwanted.

## `colors` {#colors}

An option's name to a colour: `gray`, `blue`, `green`, `yellow`,
`orange`, `red`, `pink` or `purple`. It applies to every option of that
name on the board: a status, `working`, a value of a declared select. A
colour change keeps every card's value. Without one, a status takes the
colour of its place in the lifecycle, a collection in `Collection` pink,
and any other option GitHub's default.

## `labels` {#labels}

- **`"directory"`**: each document is labelled with the subdirectory it
  sits in, within its collection: `marketing/posts/launch.md` gets
  `posts`.
- **A front-matter key**: each document is labelled with its values.

A label no document carries any more is taken off its cards.

## `views` {#views}

```json
"views": [
  { "name": "All", "layout": "table", "fields": ["Title", "Collection", "Status"] },
  { "name": "Plans", "layout": "board", "collection": "plans", "columns": "Plans status" },
  { "name": "Working", "layout": "table", "filter": "agent:working" },
  { "name": "Calendar", "layout": "roadmap", "collection": "marketing", "date": "Publish date" }
]
```

| Key | What it is | When absent |
| --- | --- | --- |
| `name` | The view's name, unique on the board. Required. | |
| `layout` | `board`, `table` or `roadmap`. Required. | |
| `collection` | Only this collection's cards. The board needs a select field from `$collection`. | Every card. |
| `filter` | A GitHub filter, such as `agent:working`, added to the collection's. | None. |
| `columns` | A board only: the single-select its columns follow: `Status`, a collection's status field, or a declared select. | `Status`. |
| `fields` | A table only: its columns: `Title`, `Status`, `Labels`, `Assignees`, `Path`, or a field of the board. | GitHub's default ones. |
| `date` | A roadmap only, required: a date field of the board. | |

At each sync:

- A view Rness made is updated in place: its name, filter and fields. One
  whose layout or columns changed is deleted and made again.
- A view Rness made and no longer declared is deleted. A view your team
  made on GitHub is left alone, and the sync mentions it once.
- GitHub shows a table's fields in the project's order, whatever the
  order given, and keeps views where they are: Rness reorders neither.
- A roadmap's date field is picked once, in the view's **Date fields**
  menu on GitHub. GitHub's API cannot set it, and a roadmap it makes has
  none (seen on 2026-10-06). Rness checks that `date` names a date field,
  and keeps the view: it is made again only when its layout changes.

## `hooks` {#hooks}

What a [Claude Code](../guide/claude-code.md) session does to the board,
by event. Each action is its name, or an object with its parameters:

```json
"hooks": {
  "session-start": [
    { "action": "mark-in-progress", "collections": ["plans", "specs"], "statuses": ["In progress", "Approved"] },
    { "action": "journal", "to": "repo", "limit": 5 }
  ],
  "edit": ["mark"],
  "session-end": ["clear-marks", "journal-summary"]
}
```

| Action | Event | What it does | Parameters | Needs |
| --- | --- | --- | --- | --- |
| `mark-in-progress` | `session-start` | Marks the documents of the session's scope `working`. | `collections` (default `["plans"]`), `statuses` (default `["In progress"]`) | A select from `$agent` with `working`. |
| `mark` | `edit` | Marks the document the agent edits, when the board holds it. | | The same. |
| `clear-marks` | `session-end` | Clears the session's marks, then syncs the board. | | The same. |
| `journal` | `session-start` | Tells the agent to note its decisions on the plan it implements: the [agent's journal](../guide/boards.md#the-agent-s-journal). | `to`: `"plan"` or `"repo"`, required; `limit`, notes per session and plan (default 5) | The board holds `plans`. |
| `journal-summary` | `session-end` | Posts the session's summary where its notes went. | | `journal` on the same board. |

An action appears at most once per event, and only at its own event. The
events are Claude Code's: `session-start`, `edit` (after the agent writes a
file) and `session-end`. The actions are Rness's own: a hook never runs a
command written in `rness.json`, which every developer's machine runs.
Remove `hooks` to leave a board alone during sessions.

## Status updates {#status-updates}

Each `.md` file of `updates` is one status update of the project:

```md
---
health: on-track
start_date: 2026-10-01
target_date: 2026-11-12
---

The first post is out; the second is scheduled for Thursday.
```

`health` is `on-track`, `at-risk`, `off-track`, `complete` or `inactive`;
the dates are optional; the text below is the update. Each file is posted
once, in the order of the file names, and updated when it changes. A
deleted file leaves its update.

`readme` and `updates` stay within `.rness/`: a path out of it, or a file
that is a link leading out, is refused before anything is read, since
`rness.json` is shared by the whole organization and the file would be
published on GitHub.

## Presets {#presets}

`rness board push` writes a board whole from a preset when it creates
it, and records it in `preset`:

- **`agent-pulse`**, for `pulse`: every collection (`"all"`); the fields
  `Collection`, `Agent`, `Working session` and `Session history`; the
  views `All`, `ADR`, `Specs`, `Plans` and `Working`; the hooks
  `mark-in-progress`, `mark` and `clear-marks`.
- **`collection`**, for a collection's own board: that collection, its
  statuses as found; the same four fields; the views `All`, the
  collection's board and `Working`.

When a later Rness brings a new revision of a preset, `rness sync` (which
`rness upgrade` runs) merges it into the board value by value. What you
never changed takes the new value; what you changed stays yours, and the
sync names it when the new revision changed it too. Remove `preset` to
keep a board exactly as you wrote it.
