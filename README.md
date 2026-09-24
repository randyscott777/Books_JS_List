<!-- Created by Claude Code — Claude Sonnet 5 (claude-sonnet-5), planned with Claude Opus 5.5 -->

# Stacks — Books JS List

A read-only, client-side book index. It's a static HTML/CSS/JS page (no
build step, no frameworks) that fetches a JSON book list from the **Reading
Room** Flask app and does all searching, filtering, sorting, and stats
entirely in the browser.

**Live site:** <https://randyscott777.github.io/Books_JS_List/>

## What it does

- Fetches `GET /api/books` once on page load.
- Search by title or author (case-insensitive, instant).
- Filter by genre (built from the data) and by status (Unread, Reading,
  Finished, Wishlist).
- Sort by title, author, year, or rating (nulls sort last).
- A live stats bar (total, per-status counts, average rating, top 3
  genres) that reflects whatever is currently filtered — not the whole
  collection.
- Loading state while fetching, and a friendly "server is waking up"
  message with a **Retry** button if the fetch fails (PythonAnywhere free
  apps sleep after inactivity).
- No caching — every load / retry is a fresh `fetch()`.

## API source

Data comes from the **Books_Maintenance** ("Reading Room") Flask app:

- Local dev: `http://127.0.0.1:5000/api/books`
- Production: `https://randyscott777.pythonanywhere.com/api/books`

`app.js` picks the base URL automatically: if `location.hostname` is
`localhost` or `127.0.0.1`, it targets the local Flask dev server;
otherwise it targets the deployed PythonAnywhere app. The API is read-only
(`GET /api/books`, `GET /api/books/<id>`) and allows cross-origin requests
from this GitHub Pages origin via a manual CORS header (no `flask-cors`).

## Local test steps

1. Start the Reading Room app locally on port 5000 (from
   `Books_Maintenance/`, run `python app.py`) — this is the same machine's
   copy of the book database.
   - Note: on this machine, port 5000 is often already held by a different
     Flask app (Taskflow). If so, stop that app first, or just skip local
     API testing and rely on the deployed PythonAnywhere API instead — the
     site still works from `file://`/`localhost` because it falls back to
     `http://127.0.0.1:5000` only when the hostname is `localhost`/
     `127.0.0.1`.
2. Serve this folder with a static server, e.g.:
   ```
   python -m http.server 8000
   ```
3. Open <http://127.0.0.1:8000/> in a browser. The page should fetch from
   `http://127.0.0.1:5000/api/books` and render the shelf.
4. Sanity-check the script parses with `node --check app.js` (no Node
   runtime is required to use the site — this is just a syntax check).

## Files

```
Books_JS_List/
├── index.html   # markup + controls
├── style.css    # "terminal index card" dark theme
├── app.js       # fetch, filter/sort/stats, rendering (plain JS)
├── README.md    # this file
└── CLAUDE.md    # architecture + deploy notes + prompt log
```
