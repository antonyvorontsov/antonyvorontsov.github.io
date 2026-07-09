// Site search: fetches this page's language-scoped search-index.json (see
// layouts/index.searchindex.json) once, then filters it client-side as the
// user types. No content changes here — the index just mirrors what's
// already on the site's pages.
window.Blog = window.Blog || {};

window.Blog.search = (function () {
  let index = null;
  let indexPromise = null;

  function loadIndex(url) {
    if (!indexPromise) {
      indexPromise = fetch(url)
        .then((res) => res.json())
        .then((data) => {
          index = data;
          return data;
        });
    }
    return indexPromise;
  }

  function matches(entry, query) {
    return (
      entry.title.toLowerCase().includes(query) ||
      entry.description.toLowerCase().includes(query) ||
      entry.content.toLowerCase().includes(query)
    );
  }

  function renderResults(container, entries) {
    container.innerHTML = '';

    if (entries.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'search-empty';
      empty.textContent = container.dataset.noResultsText;
      container.appendChild(empty);
      return;
    }

    const list = document.createElement('ul');
    list.className = 'search-results-list';

    entries.slice(0, 20).forEach((entry) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = entry.url;
      a.className = 'search-result-link';

      const title = document.createElement('span');
      title.className = 'search-result-title';
      title.textContent = entry.title;
      a.appendChild(title);

      if (entry.description) {
        const desc = document.createElement('span');
        desc.className = 'search-result-desc';
        desc.textContent = entry.description;
        a.appendChild(desc);
      }

      li.appendChild(a);
      list.appendChild(li);
    });

    container.appendChild(list);
  }

  function init() {
    const btn = document.getElementById('search-btn');
    const overlay = document.getElementById('search-overlay');
    if (!btn || !overlay) return;

    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    const closeBtn = document.getElementById('search-close');
    const indexUrl = btn.dataset.searchIndex;

    function onKeydown(e) {
      if (e.key === 'Escape') close();
    }

    function open() {
      overlay.hidden = false;
      input.value = '';
      results.innerHTML = '';
      loadIndex(indexUrl);
      document.addEventListener('keydown', onKeydown);
      input.focus();
    }

    function close() {
      overlay.hidden = true;
      document.removeEventListener('keydown', onKeydown);
      btn.focus();
    }

    function runSearch() {
      const query = input.value.trim().toLowerCase();
      if (query === '') {
        results.innerHTML = '';
        return;
      }
      if (!index) {
        loadIndex(indexUrl).then(runSearch);
        return;
      }
      renderResults(results, index.filter((entry) => matches(entry, query)));
    }

    btn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    input.addEventListener('input', runSearch);
  }

  return { init };
})();
