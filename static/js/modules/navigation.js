// Nav bar controls (theme, language) and in-page post navigation (table of contents scrollspy)
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
    const textRu = document.getElementById('theme-text-ru');
    const textEn = document.getElementById('theme-text-en');

    if (theme === 'dark') {
      sunIcon.style.display = 'inline-block';
      moonIcon.style.display = 'none';
      textRu.textContent = 'Светлая тема';
      textEn.textContent = 'Light Mode';
    } else {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'inline-block';
      textRu.textContent = 'Темная тема';
      textEn.textContent = 'Dark Mode';
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

  function getSystemLanguage() {
    if (localStorage.getItem('lang')) {
      return localStorage.getItem('lang');
    }
    // default to 'ru' if browser language matches Russian, else 'en'
    const navLang = navigator.language || navigator.userLanguage;
    return (navLang && navLang.toLowerCase().startsWith('ru')) ? 'ru' : 'en';
  }

  // Update SEO Title dynamically based on data-title-ru/data-title-en on <html>
  function updatePageTitle(lang) {
    const titleRu = document.documentElement.dataset.titleRu;
    const titleEn = document.documentElement.dataset.titleEn;
    if (lang === 'ru' && titleRu) {
      document.title = titleRu;
    } else if (lang === 'en' && titleEn) {
      document.title = titleEn;
    }
  }

  function toggleLang() {
    const activeLang = document.documentElement.getAttribute('lang');
    const newLang = activeLang === 'ru' ? 'en' : 'ru';
    document.documentElement.setAttribute('lang', newLang);
    localStorage.setItem('lang', newLang);
    updatePageTitle(newLang);
  }

  function initLanguage() {
    const currentLang = getSystemLanguage();
    document.documentElement.setAttribute('lang', currentLang);
    updatePageTitle(currentLang);
    document.getElementById('lang-btn').addEventListener('click', toggleLang);
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

  return { initTheme, initLanguage, initToc };
})();
