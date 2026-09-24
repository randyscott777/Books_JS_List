<!-- Created by Claude Code — Claude Sonnet 5 (claude-sonnet-5), planned with Claude Opus 5.5 -->

# Stacks — Books JS List

## What this project is

A small, static GitHub Pages site — **Stacks** — that presents a personal
book collection as a fast, filterable, client-side index. It has no
backend, no build step, and no framework: three files (`index.html`,
`style.css`, `app.js`) fetch a JSON book list from the existing **Reading
Room** Flask app (`Books_Maintenance`, deployed on PythonAnywhere) and do
all search/filter/sort/stats work in the browser after that single fetch.

It is a companion, read-only front end to Books_Maintenance — it cannot
add, edit, or delete books. Its whole job is to make browsing the
collection fast and pleasant from a public URL, without exposing the
Reading Room's edit/delete routes.

The visual design is a deliberate departure from the Reading Room's warm,
aged-paper library theme: a dark "terminal index card" aesthetic (near-
black background, acid-lime and hot-magenta accents, a wide geometric
display face for headings/numbers, monospace for everything else) so the
two apps read as clearly different products even though they show the
same data.

## Architecture

```
Books_JS_List/                 (this repo — GitHub Pages, main branch, root)
├── index.html                 markup: header, stats bar, toolbar, grid, footer
├── style.css                  dark "terminal index card" theme, responsive
├── app.js                     fetch + client-side filter/sort/stats/render
├── README.md
└── CLAUDE.md                  this file

Books_Maintenance/              (separate repo/folder — NOT part of this repo)
└── app.py                     Flask app; added GET /api/books,
                                GET /api/books/<id>, and a manual CORS
                                after_request hook restricted to this
                                site's origins.
```

Data flow: on page load, `app.js` does one `fetch(`${API_BASE}/api/books`)`
against the Reading Room API. Everything after that — search, genre/status
filters, sort, the live stats bar, "N of M books", and the empty state —
is computed locally against the in-memory array. No caching: every page
load or Retry click is a fresh network request.

`API_BASE` is chosen at runtime in `app.js`:
- `location.hostname` is `localhost` or `127.0.0.1` → `http://127.0.0.1:5000`
  (the local Flask dev server)
- anything else (i.e. the deployed `randyscott777.github.io` site) →
  `https://randyscott777.pythonanywhere.com`

## How to run locally

1. This is a static site — no install step. Serve the folder with any
   static server, e.g. `python -m http.server 8000`, then open
   <http://127.0.0.1:8000/>.
2. For live data locally, the Reading Room app needs to be running on
   `127.0.0.1:5000` (`cd Books_Maintenance && python app.py`). On this
   machine port 5000 is often already held by the Taskflow app — don't
   kill it; either free the port deliberately or just view the site
   pointed at the deployed PythonAnywhere API by opening it via a
   non-localhost hostname.
3. `node --check app.js` is a quick syntax sanity check (Node is not
   required to use the site).

## PythonAnywhere deploy steps (for the API side, Books_Maintenance)

The API this site depends on lives in the separate `Books_Maintenance`
project, deployed at `randyscott777.pythonanywhere.com`. To ship the new
`/api/books` routes there:

1. Upload the updated `Books_Maintenance/app.py` to
   `/home/randyscott777/Books_Maintenance/app.py` on PythonAnywhere
   (Files tab, or `git pull` if that repo is cloned there).
2. Go to the **Web** tab and click **Reload** on the
   `randyscott777.pythonanywhere.com` app.
3. Confirm `https://randyscott777.pythonanywhere.com/api/books` returns
   JSON, and that a request from `https://randyscott777.github.io`
   receives the `Access-Control-Allow-Origin` header.

`DB_PATH` in `app.py` is unchanged — it already points at
`../Books_Maintenance_Kivy/books.db`, matching the PythonAnywhere layout
at `/home/randyscott777/Books_Maintenance_Kivy/books.db`.

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
  on PythonAnywhere; add a `/api` surface to the already-deployed Reading
  Room app rather than a new service; API is read-only; edit the local
  `app.py` and re-upload it to PythonAnywhere; one `fetch()` on load plus
  client-side filtering (no server-side query params needed); CORS via a
  manual header restricted to `/api/*` only (no `flask-cors` package); new
  public repo `Books_JS_List`, GitHub Pages served from `main` root;
  standard list features (search, genre/status filters, sort, live stats);
  a fresh, modern look explicitly distinct from the Reading Room's warm
  library theme; a friendly offline/waking-up message with a Retry button
  on fetch failure; the API base URL auto-switches for local testing vs.
  the deployed site.
- **2026-09-24** — "go ahead" — built with Claude Sonnet 5, planned with
  Claude Opus 5.5.
