// System theme preference check
function getSystemTheme() {
  if (localStorage.getItem('theme')) {
    return localStorage.getItem('theme');
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Initialize Theme
const currentTheme = getSystemTheme();
document.documentElement.setAttribute('data-theme', currentTheme);
updateThemeIcon(currentTheme);

function toggleTheme() {
  const activeTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
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

// Initialize Language
function getSystemLanguage() {
  if (localStorage.getItem('lang')) {
    return localStorage.getItem('lang');
  }
  // default to 'ru' if browser language matches Russian, else 'en'
  const navLang = navigator.language || navigator.userLanguage;
  return (navLang && navLang.toLowerCase().startsWith('ru')) ? 'ru' : 'en';
}

const currentLang = getSystemLanguage();
document.documentElement.setAttribute('lang', currentLang);

function toggleLang() {
  const activeLang = document.documentElement.getAttribute('lang');
  const newLang = activeLang === 'ru' ? 'en' : 'ru';
  document.documentElement.setAttribute('lang', newLang);
  localStorage.setItem('lang', newLang);
  updatePageTitle(newLang);
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

updatePageTitle(currentLang);

// Dynamic Year Calculation for Footer
const currentYear = new Date().getFullYear();
const yearStr = currentYear > 2026 ? `2026 - ${currentYear}` : `2026`;
document.getElementById('copyright-year-ru').textContent = yearStr;
document.getElementById('copyright-year-en').textContent = yearStr;

// Table of Contents: auto-build from post-content headings, sticky + scrollspy
function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

function headingSlugSource(heading) {
  const ru = heading.querySelector('.lang-ru');
  return ru ? ru.textContent : heading.textContent;
}

function initToc() {
  const content = document.getElementById('post-content');
  const tocList = document.getElementById('toc-list');
  if (!content || !tocList) return;

  const headings = content.querySelectorAll('h2, h3');
  if (headings.length === 0) return;

  const usedIds = new Set();
  headings.forEach((heading) => {
    let id = slugify(headingSlugSource(heading));
    let uniqueId = id;
    let i = 1;
    while (usedIds.has(uniqueId) || document.getElementById(uniqueId)) {
      uniqueId = `${id}-${i++}`;
    }
    heading.id = uniqueId;
    usedIds.add(uniqueId);

    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${uniqueId}`;
    a.className = 'toc-link';
    a.innerHTML = heading.innerHTML;
    if (heading.tagName === 'H3') {
      a.style.paddingLeft = '16px';
    }
    li.appendChild(a);
    tocList.appendChild(li);
  });

  const tocLinks = tocList.querySelectorAll('.toc-link');
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

initToc();
