// Nav bar controls (theme) and in-page post navigation (table of contents scrollspy).
// Language switching is a native per-language page (layouts/partials/header.html
// renders a real link via .Translations) — no client-side language logic here.
window.Blog = window.Blog || {};

window.Blog.navigation = (function () {
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
  }

  function initTheme() {
    const currentTheme = getSystemTheme();
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
    document.getElementById('theme-btn').addEventListener('click', toggleTheme);
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

  return { initTheme, initToc };
})();
