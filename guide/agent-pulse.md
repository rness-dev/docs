# Agent Pulse

Agent Pulse is a GitHub Project of your organization. On it the team sees
every decision, specification and plan of `.rness/`, where each one stands,
and what an agent is working on right now. Rness writes it; the team reads
it.

## Create it

```sh
rness pulse create    # once per organization: the project, then a first sync
```

Then commit `.rness/rness.json`, which now names the project. The project
is private, GitHub's default for an organization project.

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
