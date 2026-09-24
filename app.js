// Created by Claude Code — Claude Sonnet 5 (claude-sonnet-5),
// planned with Claude Opus 5.5.
// Prompt: "Add read-only JSON API (/api/books, /api/books/<id>) with CORS
// for GitHub Pages site Books_JS_List" — this file is the client for that
// API: one fetch on load, then all search/filter/sort/stats run locally.
//
// Plain JS, no build step, no frameworks, no external JS libraries.

(function () {
  "use strict";

  // Local dev talks to the Flask dev server on :5000; GitHub Pages talks
  // to the deployed PythonAnywhere app.
  const API_BASE =
    location.hostname === "localhost" || location.hostname === "127.0.0.1"
      ? "http://127.0.0.1:5000"
      : "https://randyscott777.pythonanywhere.com";

  const STATUSES = ["Unread", "Reading", "Finished", "Wishlist"];

  const els = {
    statsBar: document.getElementById("statsBar"),
    stateArea: document.getElementById("stateArea"),
    bookGrid: document.getElementById("bookGrid"),
    resultCount: document.getElementById("resultCount"),
    searchInput: document.getElementById("searchInput"),
    genreSelect: document.getElementById("genreSelect"),
    statusSelect: document.getElementById("statusSelect"),
    sortSelect: document.getElementById("sortSelect"),
    apiLabel: document.getElementById("apiLabel"),
  };

  let allBooks = [];

  if (els.apiLabel) {
    els.apiLabel.textContent = API_BASE;
  }

  // ------------------------------------------------------------- helpers

  function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function setControlsEnabled(enabled) {
    els.searchInput.disabled = !enabled;
    els.genreSelect.disabled = !enabled;
    els.statusSelect.disabled = !enabled;
    els.sortSelect.disabled = !enabled;
  }

  function cmpText(a, b) {
    return (a || "").localeCompare(b || "", undefined, { sensitivity: "base" });
  }

  // Numeric compare with nulls always sorted last, regardless of direction.
  function cmpNullableNumber(a, b, descending) {
    const aNull = a === null || a === undefined || a === "";
    const bNull = b === null || b === undefined || b === "";
    if (aNull && bNull) return 0;
    if (aNull) return 1;
    if (bNull) return -1;
    return descending ? b - a : a - b;
  }

  // ------------------------------------------------------------- states

  function showLoading() {
    els.stateArea.replaceChildren();
    const panel = document.createElement("div");
    panel.className = "state-panel is-loading";
    panel.innerHTML =
      '<div class="spinner" aria-hidden="true"></div>' +
      '<p class="state-title">Reading the shelf…</p>' +
      '<p class="state-detail">Waking the library server — this can take a few seconds.</p>';
    els.stateArea.appendChild(panel);

    els.bookGrid.replaceChildren();
    els.resultCount.textContent = "";
    els.statsBar.replaceChildren();
    const placeholder = document.createElement("p");
    placeholder.className = "stats-placeholder";
    placeholder.textContent = "reading the shelf…";
    els.statsBar.appendChild(placeholder);

    setControlsEnabled(false);
  }

  function showError() {
    els.stateArea.replaceChildren();
    const panel = document.createElement("div");
    panel.className = "state-panel is-error";
    panel.innerHTML =
      '<div class="state-icon" aria-hidden="true">&#9889;</div>' +
      '<p class="state-title">The library server is offline or waking up.</p>' +
      '<p class="state-detail">Free PythonAnywhere apps sleep after inactivity — a retry usually wakes it within a few seconds.</p>' +
      '<button type="button" class="retry-btn" id="retryBtn">Retry</button>';
    els.stateArea.appendChild(panel);

    els.bookGrid.replaceChildren();
    els.resultCount.textContent = "";
    els.statsBar.replaceChildren();
    setControlsEnabled(false);

    document.getElementById("retryBtn").addEventListener("click", loadBooks);
  }

  function showEmptyState() {
    els.stateArea.replaceChildren();
    const panel = document.createElement("div");
    panel.className = "state-panel is-empty";
    panel.innerHTML =
      '<div class="state-icon" aria-hidden="true">&middot;&middot;&middot;</div>' +
      '<p class="state-title">No books match those filters.</p>' +
      '<p class="state-detail">Try a broader search, or clear a filter.</p>';
    els.stateArea.appendChild(panel);
  }

  function clearStateArea() {
    els.stateArea.replaceChildren();
  }

  // ------------------------------------------------------------- fetch

  async function loadBooks() {
    showLoading();
    try {
      const res = await fetch(`${API_BASE}/api/books`, { cache: "no-store" });
      if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      const data = await res.json();
      allBooks = Array.isArray(data) ? data : [];
      clearStateArea();
      setControlsEnabled(true);
      populateGenreOptions();
      populateStatusOptions();
      render();
    } catch (err) {
      allBooks = [];
      showError();
    }
  }

  function populateGenreOptions() {
    const current = els.genreSelect.value;
    const genres = Array.from(
      new Set(allBooks.map((b) => (b.genre || "").trim()).filter(Boolean))
    ).sort((a, b) => cmpText(a, b));

    els.genreSelect.replaceChildren();
    const allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = "All genres";
    els.genreSelect.appendChild(allOpt);

    genres.forEach((g) => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g; // textContent — safe even though genre is user-entered
      els.genreSelect.appendChild(opt);
    });

    if (genres.includes(current)) els.genreSelect.value = current;
  }

  function populateStatusOptions() {
    const current = els.statusSelect.value;
    els.statusSelect.replaceChildren();
    const allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = "All statuses";
    els.statusSelect.appendChild(allOpt);

    STATUSES.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      els.statusSelect.appendChild(opt);
    });

    if (STATUSES.includes(current)) els.statusSelect.value = current;
  }

  // ------------------------------------------------------------- filter/sort

  function getFiltered() {
    const q = els.searchInput.value.trim().toLowerCase();
    const genre = els.genreSelect.value;
    const status = els.statusSelect.value;
    const sort = els.sortSelect.value;

    let list = allBooks.filter((b) => {
      if (genre && (b.genre || "") !== genre) return false;
      if (status && (b.status || "") !== status) return false;
      if (q) {
        const title = (b.title || "").toLowerCase();
        const author = (b.author || "").toLowerCase();
        if (!title.includes(q) && !author.includes(q)) return false;
      }
      return true;
    });

    list = list.slice().sort((a, b) => {
      switch (sort) {
        case "author":
          return cmpText(a.author, b.author) || cmpText(a.title, b.title);
        case "year":
          return (
            cmpNullableNumber(a.year, b.year, true) || cmpText(a.title, b.title)
          );
        case "rating":
          return (
            cmpNullableNumber(a.rating, b.rating, true) ||
            cmpText(a.title, b.title)
          );
        case "title":
        default:
          return cmpText(a.title, b.title);
      }
    });

    return list;
  }

  // ------------------------------------------------------------- stats

  function renderStats(list) {
    els.statsBar.replaceChildren();

    const total = list.length;
    const counts = { Unread: 0, Reading: 0, Finished: 0, Wishlist: 0 };
    list.forEach((b) => {
      if (Object.prototype.hasOwnProperty.call(counts, b.status)) {
        counts[b.status]++;
      }
    });

    const rated = list.filter((b) => typeof b.rating === "number");
    const avg = rated.length
      ? (rated.reduce((sum, b) => sum + b.rating, 0) / rated.length).toFixed(1)
      : null;

    const genreCounts = new Map();
    list.forEach((b) => {
      const g = (b.genre || "").trim();
      if (!g) return;
      genreCounts.set(g, (genreCounts.get(g) || 0) + 1);
    });
    const topGenres = Array.from(genreCounts.entries())
      .sort((a, b) => b[1] - a[1] || cmpText(a[0], b[0]))
      .slice(0, 3);

    els.statsBar.appendChild(makeStat("total", "Total", String(total)));
    STATUSES.forEach((s) => {
      els.statsBar.appendChild(
        makeStat(s.toLowerCase(), s, String(counts[s]))
      );
    });
    els.statsBar.appendChild(
      makeStat("rating", "Avg rating", avg === null ? "—" : `${avg}★`)
    );
    els.statsBar.appendChild(makeGenreStat(topGenres));
  }

  function makeStat(key, label, value) {
    const div = document.createElement("div");
    div.className = "stat";
    div.dataset.stat = key;

    const l = document.createElement("span");
    l.className = "stat-label";
    l.textContent = label;

    const v = document.createElement("span");
    v.className = "stat-value";
    v.textContent = value;

    div.appendChild(l);
    div.appendChild(v);
    return div;
  }

  function makeGenreStat(topGenres) {
    const div = document.createElement("div");
    div.className = "stat";
    div.dataset.stat = "genres";

    const l = document.createElement("span");
    l.className = "stat-label";
    l.textContent = "Top genres";
    div.appendChild(l);

    if (!topGenres.length) {
      const v = document.createElement("span");
      v.className = "stat-value is-small";
      v.textContent = "—";
      div.appendChild(v);
      return div;
    }

    const ul = document.createElement("ul");
    ul.className = "stat-genres-list";
    topGenres.forEach(([g, c]) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = g;
      const count = document.createElement("span");
      count.className = "count";
      count.textContent = String(c);
      li.appendChild(name);
      li.appendChild(count);
      ul.appendChild(li);
    });
    div.appendChild(ul);
    return div;
  }

  // ------------------------------------------------------------- cards

  function renderStars(rating) {
    const wrap = document.createElement("span");
    wrap.className = "stars";

    if (typeof rating !== "number" || rating < 1) {
      wrap.dataset.empty = "true";
      wrap.textContent = "not rated";
      return wrap;
    }

    const clamped = Math.max(1, Math.min(5, Math.round(rating)));
    wrap.setAttribute("role", "img");
    wrap.setAttribute("aria-label", `${clamped} out of 5 stars`);

    const filled = document.createElement("span");
    filled.className = "filled";
    filled.textContent = "★".repeat(clamped);
    wrap.appendChild(filled);
    wrap.appendChild(document.createTextNode("☆".repeat(5 - clamped)));
    return wrap;
  }

  function buildCard(book) {
    const li = document.createElement("li");
    li.className = "book-card";

    const top = document.createElement("div");
    top.className = "book-card-top";

    const titleWrap = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "book-title";
    title.textContent = book.title || "Untitled";
    const author = document.createElement("p");
    author.className = "book-author";
    author.textContent = book.author || "Unknown author";
    titleWrap.appendChild(title);
    titleWrap.appendChild(author);

    const badge = document.createElement("span");
    badge.className = "status-badge";
    const status = STATUSES.includes(book.status) ? book.status : "Unread";
    badge.dataset.status = status;
    badge.textContent = status;

    top.appendChild(titleWrap);
    top.appendChild(badge);
    li.appendChild(top);

    const meta = document.createElement("div");
    meta.className = "book-meta";
    if (book.genre) {
      const tag = document.createElement("span");
      tag.className = "book-genre-tag";
      tag.textContent = book.genre;
      meta.appendChild(tag);
    }
    if (book.year) {
      const yr = document.createElement("span");
      yr.className = "book-year";
      yr.textContent = String(book.year);
      meta.appendChild(yr);
    }
    li.appendChild(meta);

    li.appendChild(renderStars(book.rating));

    if (book.notes) {
      const notes = document.createElement("p");
      notes.className = "book-notes";
      notes.textContent = book.notes;
      notes.title = book.notes;
      li.appendChild(notes);
    }

    return li;
  }

  // ------------------------------------------------------------- render

  function render() {
    const filtered = getFiltered();
    renderStats(filtered);

    els.bookGrid.replaceChildren();

    if (filtered.length === 0) {
      showEmptyState();
      els.resultCount.textContent = `0 of ${allBooks.length} books`;
      return;
    }

    clearStateArea();
    const frag = document.createDocumentFragment();
    filtered.forEach((b) => frag.appendChild(buildCard(b)));
    els.bookGrid.appendChild(frag);
    els.resultCount.textContent = `${filtered.length} of ${allBooks.length} books`;
  }

  // ------------------------------------------------------------- wiring

  els.searchInput.addEventListener("input", render);
  els.genreSelect.addEventListener("change", render);
  els.statusSelect.addEventListener("change", render);
  els.sortSelect.addEventListener("change", render);

  loadBooks();
})();
