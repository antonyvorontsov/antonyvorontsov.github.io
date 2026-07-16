// Nav bar controls (theme) and in-page post navigation (table of contents scrollspy).
// Language switching is a native per-language page (layouts/partials/header.html
// renders a real link via .Translations) — no client-side language logic here.
window.Blog = window.Blog || {};

window.Blog.navigation = (function () {
  let giscus = null;

  function getStoredTheme() {
    return localStorage.getItem('theme');
  }

  function getSystemTheme() {
    return getStoredTheme() || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  function updateThemeIcon(theme) {
    const sunIcon = document.querySelector('.theme-icon-light');
    const moonIcon = document.querySelector('.theme-icon-dark');

    if (theme === 'dark') {
      sunIcon.style.display = 'inline-block';
      moonIcon.style.display = 'none';
    } else {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'inline-block';
    }
  }

  function toggleTheme() {
    const activeTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    if (giscus) giscus.syncTheme(newTheme);
  }

  function initTheme(giscusModule) {
    giscus = giscusModule || null;
    const currentTheme = getSystemTheme();
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    document.getElementById('theme-btn').addEventListener('click', toggleTheme);
  }

  // Mobile nav: the three page links (nav-links) collapse into a dropdown
  // toggled by nav-burger below the 767px breakpoint (see styles.css); above
  // it .nav-links is always visible via CSS and this code has no effect.
  function initMobileMenu() {
    const burger = document.getElementById('nav-burger');
    const links = document.getElementById('nav-links');
    if (!burger || !links) return;

    const iconOpen = burger.querySelector('.nav-burger-icon-open');
    const iconClose = burger.querySelector('.nav-burger-icon-close');

    function onOutsideClick(e) {
      if (!links.contains(e.target) && !burger.contains(e.target)) close();
    }

    function onKeydown(e) {
      if (e.key === 'Escape') close();
    }

    function open() {
      links.classList.add('open');
      burger.setAttribute('aria-expanded', 'true');
      iconOpen.style.display = 'none';
      iconClose.style.display = 'inline-block';
      document.addEventListener('click', onOutsideClick);
      document.addEventListener('keydown', onKeydown);
    }

    function close() {
      links.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      iconOpen.style.display = 'inline-block';
      iconClose.style.display = 'none';
      document.removeEventListener('click', onOutsideClick);
      document.removeEventListener('keydown', onKeydown);
    }

    burger.addEventListener('click', (e) => {
      e.stopPropagation();
      links.classList.contains('open') ? close() : open();
    });
  }

  // Table of Contents scrollspy: TOC links are rendered server-side by Hugo
  // (layouts/posts/single.html, from .Fragments.Headings) — here we only
  // observe the linked headings and toggle the active link on scroll.
  function initToc() {
    const tocList = document.querySelector('.toc-list');
    if (!tocList) return;

    const tocLinks = tocList.querySelectorAll('.toc-link');
    if (tocLinks.length === 0) return;

    const headings = [];
    tocLinks.forEach((link) => {
      const id = link.getAttribute('href').slice(1);
      const heading = document.getElementById(id);
      if (heading) headings.push(heading);
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = tocList.querySelector(`a[href="#${entry.target.id}"]`);
        if (!link || !entry.isIntersecting) return;
        tocLinks.forEach((l) => l.classList.remove('active'));
        link.classList.add('active');
      });
    }, { rootMargin: '-80px 0px -70% 0px' });

    headings.forEach((heading) => observer.observe(heading));
  }

  // Cosmetic only: relativeURLs+uglyURLs means the Home link (header.html) must
  // literally target ".../index.html" so it still works when public/ is opened
  // via file:// (see specs/data-model/url-scheme.md). Over http(s) we can clean
  // the address bar back to ".../" after the fact without affecting anything —
  // resolving further relative links from ".../index.html" vs ".../" is
  // identical since they're the same directory.
  function initCleanHomeURL() {
    if (window.location.protocol === 'file:') return;
    const path = window.location.pathname;
    if (!path.endsWith('/index.html')) return;
    const cleanPath = path.slice(0, -'index.html'.length);
    window.history.replaceState(window.history.state, '', cleanPath + window.location.search + window.location.hash);
  }

  return { initTheme, initToc, initMobileMenu, initCleanHomeURL };
})();
