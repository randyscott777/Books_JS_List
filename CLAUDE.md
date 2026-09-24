<!-- Created by Claude Code — Claude Sonnet 5 (claude-sonnet-5), planned with Claude Opus 5.5 -->

# Stacks — Books JS List

## What this project is

A small, static GitHub Pages site — **Stacks** — that presents a personal
book collection as a fast, searchable, client-side index. It has no
backend, no build step, and no framework: three files (`index.html`,
`style.css`, `app.js`) fetch a JSON book list from the existing **Books**
blueprint of the `mysite` Flask project (deployed on PythonAnywhere) and do
all search/sort/stats work in the browser after that single fetch.

It is a companion, read-only front end — it cannot add, edit, or delete
books. Its whole job is to make browsing the collection fast and pleasant
from a public URL, without exposing `mysite`'s insert/update/delete routes.

The live data is only `{id, title, author}` (`Books/books.db` on the
`mysite` project, 277 rows) — no genre, status, year, rating, or notes -
so the page shows only what the API actually has: title, author, search,
sort, and an author-focused stats bar.

The visual design is a deliberate "terminal index card" aesthetic: near-
black background, acid-lime and hot-magenta accents, a wide geometric
display face for headings/numbers, monospace for everything else, so the
page reads like a live console over the book collection.

## Architecture

```
Books_JS_List/                 (this repo — GitHub Pages, main branch, root)
├── index.html                 markup: header, stats bar, toolbar, letter
│                               index, one-line book list, footer
├── style.css                  dark "terminal index card" theme, responsive
├── app.js                     fetch + client-side search/sort/stats/render
├── README.md
└── CLAUDE.md                  this file

Randyscott777_PythonAnywhere/mysite/     (separate project — NOT part of this repo)
└── Books/books.py             Flask blueprint `app8`; has
                                GET /api/books, GET /api/books/<id>, and a
                                manual CORS after_app_request hook scoped
                                to /api/books* paths only.
```

Data flow: on page load, `app.js` fetches `/api/books` from the Books API
(one successful request; see the fallback below). Everything after that — search, sort, the live stats
bar, the letter index, "N of M books", and the empty state — is computed
locally against the in-memory array. No caching: every page load or Retry
click is a fresh network request (`cache: "no-store"`).

The API base is chosen at runtime in `app.js` (`API_BASES`):
- `location.hostname` is `localhost` or `127.0.0.1` → try
  `http://127.0.0.1:5000` (the local Flask dev server) first with a 2s
  timeout, then fall back to `https://randyscott777.pythonanywhere.com`
  if the local server is down or returns an error. The footer label shows
  whichever base actually answered.
- anything else (i.e. the deployed `randyscott777.github.io` site) →
  `https://randyscott777.pythonanywhere.com` only.
- Opening `index.html` as a `file://` URL does not work: the API's CORS
  allowlist has no `null` origin. Serve the folder over HTTP on port 8000.

## How to run locally

1. This is a static site — no install step. Serve the folder with any
   static server, e.g. `python -m http.server 8000`, then open
   <http://127.0.0.1:8000/>.
2. For live data locally, the `mysite` app needs to be running on
   `127.0.0.1:5000`: `cd Randyscott777_PythonAnywhere/mysite && python
   flask_app.py`. On this machine port 5000 is often already held by the
   Taskflow app — stop it first, or view the site via a non-localhost
   hostname to hit the deployed PythonAnywhere API instead.
3. `node --check app.js` is a quick syntax sanity check (Node is not
   required to use the site).

## PythonAnywhere deploy steps (for the API side, mysite)

The API this site depends on lives in the `Books/` folder of the `mysite`
project, deployed at `randyscott777.pythonanywhere.com`. To ship changes to
the `/api/books` routes there:

1. Upload the updated `Books/books.py` to
   `/home/randyscott777/mysite/Books/books.py` on PythonAnywhere (Files
   tab, or however that project's files are normally synced).
2. Go to the **Web** tab and click **Reload** on the
   `randyscott777.pythonanywhere.com` app.
3. Confirm `https://randyscott777.pythonanywhere.com/api/books` returns
   JSON, and that a request from `https://randyscott777.github.io`
   receives the `Access-Control-Allow-Origin` header.

`Books/books.db` is unchanged by this site — it's the same SQLite database
the rest of the `mysite` Books blueprint (`/selectBooks`, `/insertBook`,
etc.) already reads and writes.

## GitHub Pages deploy (this site)

This repo is published via GitHub Pages from the `main` branch, root
(`/`) — no build step, since it's plain HTML/CSS/JS. Live at
<https://randyscott777.github.io/Books_JS_List/>.

## Prompt log

- **2026-09-24** — "best way to access a remote books.db on
  randyscott777.pythonanywhere.com and then executable from GitHub"
- **2026-09-24** — "A web page in the browser: GitHub Pages hosts an
  HTML/JS page that calls the API with fetch()."
- **2026-09-24** — planning interview (plan-an-app) decisions: DB already
  on PythonAnywhere; add a `/api` surface to the already-deployed Flask app
  rather than a new service; API is read-only; one `fetch()` on load plus
  client-side filtering (no server-side query params needed); CORS via a
  manual header restricted to `/api/*` only (no `flask-cors` package); new
  public repo `Books_JS_List`, GitHub Pages served from `main` root; a
  fresh, modern dark "terminal index card" look; a friendly offline/
  waking-up message with a Retry button on fetch failure; the API base URL
  auto-switches for local testing vs. the deployed site.
- **2026-09-24** — "go ahead" — built with Claude Sonnet 5, planned with
  Claude Opus 5.5. This first pass targeted the standalone `Books_Maintenance`
  ("Reading Room") project and assumed a richer schema (genre, status,
  year, rating, notes) that project was never actually given.
- **2026-09-24** — "add the API code to the mysite/books folder in
  randyscott777_pythonanywhere project"
  Decision: adapt the page to title/author only, since the live data source
  is actually the `Books` blueprint in the `mysite` project
  (`Randyscott777_PythonAnywhere/mysite/Books/books.py`, `Books/books.db`),
  not `Books_Maintenance` — and that table has only `id`, `title`, `author`
  (277 rows). Added the `/api/books` and `/api/books/<id>` routes and the
  CORS hook to `Books/books.py` (see that project's `mysite/CLAUDE.md` for
  the API-side log entry). Reworked this site to match: removed the genre
  filter, status filter, year/rating sorts, star ratings, status badges,
  and notes (no dead code); kept live search (title/author) and added
  Title/Author ascending and descending sorts (author sort ties broken by
  title); the stats bar now shows total books, distinct authors, and the
  top 3 authors by book count; added a small A–Z letter-jump index below
  the toolbar. `API_BASE` still auto-switches local vs. deployed, and now
  points at the `mysite` app instead of `Books_Maintenance`. Kept the
  "terminal index card" visual language throughout.
  Built with Claude Sonnet 5, planned with Claude Opus 5.5.
- **2026-09-24** — "error: The library server is offline or waking up."
  Diagnosis: the deployed API and its CORS header were fine. The error came
  from opening the page locally, where `app.js` pointed only at
  `127.0.0.1:5000` and nothing was running there. Opening `index.html` as a
  `file://` URL gives the same error, because the CORS allowlist has no
  `null` origin.
- **2026-09-24** — "yes" (to making local pages fall back to PythonAnywhere):
  `app.js` now tries `127.0.0.1:5000` (2s timeout) and then the
  PythonAnywhere API when served from localhost. Checked with a Node fetch
  simulation (local fails in ~20ms, remote returns 277 books) and a CORS
  check for origin `http://127.0.0.1:8000`. Built with Claude Opus 5.5.
- **2026-09-24** — "display as a single line per record": replaced the
  card grid with a single bordered list (`#bookList`, `.book-row`). Each
  row is one line, with the title on the left and the author on the right.
  Long text is cut off with an ellipsis, and the full text shows on hover.
  The hover state has a lime left edge and a magenta author. The letter
  index still jumps to the first matching row. Built with Claude Opus 5.5.
