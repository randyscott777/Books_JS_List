// Created by Claude Code — Claude Sonnet 5 (claude-sonnet-5),
// planned with Claude Opus 5.5.
// Prompt: "add the API code to the mysite/books folder in
// randyscott777_pythonanywhere project" — this file is the client for the
// mysite Books blueprint's read-only API: one fetch on load, then all
// search/sort/stats run locally against id/title/author records.
//
// Plain JS, no build step, no frameworks, no external JS libraries.

(function () {
  "use strict";

  // Local dev tries the Flask dev server on :5000 first and falls back to
  // the deployed PythonAnywhere app if nothing answers there; GitHub Pages
  // talks to PythonAnywhere directly.
  // Fallback added by Claude Opus 5.5 (claude-opus-5-5).
  const LOCAL_API = "http://127.0.0.1:5000";
  const REMOTE_API = "https://randyscott777.pythonanywhere.com";
  const IS_LOCAL =
    location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const API_BASES = IS_LOCAL ? [LOCAL_API, REMOTE_API] : [REMOTE_API];
  const LOCAL_TIMEOUT_MS = 2000;

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const els = {
    statsBar: document.getElementById("statsBar"),
    stateArea: document.getElementById("stateArea"),
    bookList: document.getElementById("bookList"),
    resultCount: document.getElementById("resultCount"),
    searchInput: document.getElementById("searchInput"),
    sortSelect: document.getElementById("sortSelect"),
    letterIndex: document.getElementById("letterIndex"),
    apiLabel: document.getElementById("apiLabel"),
  };

  let allBooks = [];

  function setApiLabel(base) {
    if (els.apiLabel) {
      els.apiLabel.textContent = base;
    }
  }

  setApiLabel(API_BASES[0]);

  // ------------------------------------------------------------- helpers

  function setControlsEnabled(enabled) {
    els.searchInput.disabled = !enabled;
    els.sortSelect.disabled = !enabled;
  }

  function cmpText(a, b) {
    return (a || "").localeCompare(b || "", undefined, { sensitivity: "base" });
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

    els.bookList.replaceChildren();
    els.resultCount.textContent = "";
    els.letterIndex.replaceChildren();
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

    els.bookList.replaceChildren();
    els.resultCount.textContent = "";
    els.letterIndex.replaceChildren();
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
      '<p class="state-title">No books match that search.</p>' +
      '<p class="state-detail">Try a broader search term.</p>';
    els.stateArea.appendChild(panel);
  }

  function clearStateArea() {
    els.stateArea.replaceChildren();
  }

  // ------------------------------------------------------------- fetch

  async function loadBooks() {
    showLoading();
    for (const base of API_BASES) {
      try {
        const opts = { cache: "no-store" };
        // don't let a dead local server stall the fallback
        if (base === LOCAL_API) opts.signal = AbortSignal.timeout(LOCAL_TIMEOUT_MS);
        const res = await fetch(`${base}/api/books`, opts);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json();
        allBooks = Array.isArray(data) ? data : [];
        setApiLabel(base);
        clearStateArea();
        setControlsEnabled(true);
        buildLetterIndex();
        render();
        return;
      } catch (err) {
        // try the next base, if any
      }
    }
    allBooks = [];
    showError();
  }

  // ------------------------------------------------------------- letter index

  function buildLetterIndex() {
    const present = new Set(
      allBooks
        .map((b) => (b.title || "").trim().charAt(0).toUpperCase())
        .filter(Boolean)
    );

    els.letterIndex.replaceChildren();
    ALPHABET.forEach((letter) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "letter-btn";
      btn.textContent = letter;
      if (present.has(letter)) {
        btn.addEventListener("click", () => jumpToLetter(letter));
      } else {
        btn.disabled = true;
      }
      els.letterIndex.appendChild(btn);
    });
  }

  function jumpToLetter(letter) {
    els.searchInput.value = "";
    els.sortSelect.value = "title-asc";
    render();
    requestAnimationFrame(() => {
      const titles = els.bookList.querySelectorAll(".book-title");
      for (const titleEl of titles) {
        if (titleEl.textContent.trim().charAt(0).toUpperCase() === letter) {
          titleEl.closest(".book-row").scrollIntoView({ behavior: "smooth", block: "start" });
          break;
        }
      }
    });
  }

  // ------------------------------------------------------------- filter/sort

  function getFiltered() {
    const q = els.searchInput.value.trim().toLowerCase();
    const sort = els.sortSelect.value;

    let list = allBooks.filter((b) => {
      if (!q) return true;
      const title = (b.title || "").toLowerCase();
      const author = (b.author || "").toLowerCase();
      return title.includes(q) || author.includes(q);
    });

    list = list.slice().sort((a, b) => {
      switch (sort) {
        case "title-desc":
          return -cmpText(a.title, b.title);
        case "author-asc":
          return cmpText(a.author, b.author) || cmpText(a.title, b.title);
        case "author-desc":
          return -cmpText(a.author, b.author) || cmpText(a.title, b.title);
        case "title-asc":
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

    const authorCounts = new Map();
    list.forEach((b) => {
      const a = (b.author || "").trim();
      if (!a) return;
      authorCounts.set(a, (authorCounts.get(a) || 0) + 1);
    });
    const distinctAuthors = authorCounts.size;
    const topAuthors = Array.from(authorCounts.entries())
      .sort((a, b) => b[1] - a[1] || cmpText(a[0], b[0]))
      .slice(0, 3);

    els.statsBar.appendChild(makeStat("total", "Books", String(total)));
    els.statsBar.appendChild(makeStat("authors", "Authors", String(distinctAuthors)));
    els.statsBar.appendChild(makeAuthorStat(topAuthors));
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

  function makeAuthorStat(topAuthors) {
    const div = document.createElement("div");
    div.className = "stat";
    div.dataset.stat = "top-authors";

    const l = document.createElement("span");
    l.className = "stat-label";
    l.textContent = "Top authors";
    div.appendChild(l);

    if (!topAuthors.length) {
      const v = document.createElement("span");
      v.className = "stat-value is-small";
      v.textContent = "—";
      div.appendChild(v);
      return div;
    }

    const ul = document.createElement("ul");
    ul.className = "stat-list";
    topAuthors.forEach(([name, count]) => {
      const li = document.createElement("li");
      const nameEl = document.createElement("span");
      nameEl.textContent = name;
      const countEl = document.createElement("span");
      countEl.className = "count";
      countEl.textContent = String(count);
      li.appendChild(nameEl);
      li.appendChild(countEl);
      ul.appendChild(li);
    });
    div.appendChild(ul);
    return div;
  }

  // ------------------------------------------------------------- rows
  // One line per record: title left, author right, each truncated with an
  // ellipsis (full text in the tooltip). Changed by Claude Opus 5.5.

  function buildRow(book) {
    const li = document.createElement("li");
    li.className = "book-row";

    const title = document.createElement("span");
    title.className = "book-title";
    title.textContent = book.title || "Untitled";
    title.title = title.textContent;

    const author = document.createElement("span");
    author.className = "book-author";
    author.textContent = book.author || "Unknown author";
    author.title = author.textContent;

    li.appendChild(title);
    li.appendChild(author);

    return li;
  }

  // ------------------------------------------------------------- render

  function render() {
    const filtered = getFiltered();
    renderStats(filtered);

    els.bookList.replaceChildren();

    if (filtered.length === 0) {
      showEmptyState();
      els.resultCount.textContent = `0 of ${allBooks.length} books`;
      return;
    }

    clearStateArea();
    const frag = document.createDocumentFragment();
    filtered.forEach((b) => frag.appendChild(buildRow(b)));
    els.bookList.appendChild(frag);
    els.resultCount.textContent = `${filtered.length} of ${allBooks.length} books`;
  }

  // ------------------------------------------------------------- wiring

  els.searchInput.addEventListener("input", render);
  els.sortSelect.addEventListener("change", render);

  loadBooks();
})();
