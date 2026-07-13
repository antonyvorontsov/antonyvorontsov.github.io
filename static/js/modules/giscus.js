// Giscus (GitHub Discussions comments) — see layouts/partials/giscus.html and
// specs/components/comments.md. The container's data-* attributes carry the
// static config (repo/category/lang); data-theme is added here rather than
// server-side because the site's theme is a client-side toggle (localStorage),
// not something Hugo knows at build time. syncTheme() is called by
// navigation.js's toggleTheme() to update the already-loaded widget live,
// using giscus's own documented postMessage API — no reload needed.
window.Blog = window.Blog || {};

window.Blog.giscus = (function () {
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  function postTheme(iframe, theme) {
    iframe.contentWindow.postMessage({ giscus: { setConfig: { theme } } }, 'https://giscus.app');
  }

  function init() {
    const container = document.querySelector('.giscus-container');
    if (!container) return;

    // Giscus lazy-loads (data-loading="lazy" below): the iframe isn't created
    // until it nears the viewport, which on a post page is typically well
    // after page load. A theme toggle before that point would otherwise be
    // silently lost — this observer applies the current theme the moment the
    // iframe actually shows up, then stops (later toggles go through the
    // normal syncTheme() path below since the iframe exists by then).
    const observer = new MutationObserver(() => {
      const iframe = container.querySelector('iframe.giscus-frame');
      if (!iframe) return;
      postTheme(iframe, currentTheme());
      observer.disconnect();
    });
    observer.observe(container, { childList: true });

    const attrs = {
      repo: container.dataset.repo,
      'repo-id': container.dataset.repoId,
      category: container.dataset.category,
      'category-id': container.dataset.categoryId,
      lang: container.dataset.lang,
      mapping: 'url',
      strict: '0',
      'reactions-enabled': '1',
      'emit-metadata': '0',
      'input-position': 'top',
      theme: currentTheme(),
      loading: 'lazy',
    };

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.crossOrigin = 'anonymous';
    Object.entries(attrs).forEach(([key, value]) => script.setAttribute(`data-${key}`, value));

    container.appendChild(script);
  }

  function syncTheme(theme) {
    const iframe = document.querySelector('iframe.giscus-frame');
    if (!iframe) return; // not mounted yet — the MutationObserver in init() will apply the current theme once it is
    postTheme(iframe, theme);
  }

  return { init, syncTheme };
})();
