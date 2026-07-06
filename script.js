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
  
  // Update SEO Title dynamically
  if (newLang === 'ru') {
    document.title = "Антон Воронцов — Senior .NET Engineer & Tech Lead";
  } else {
    document.title = "Anton Vorontsov — Senior .NET Engineer & Tech Lead";
  }
}

// Set dynamic page title on load if language is English
if (currentLang === 'en') {
  document.title = "Anton Vorontsov — Senior .NET Engineer & Tech Lead";
}

// Dynamic Year Calculation for Footer
const currentYear = new Date().getFullYear();
const yearStr = currentYear > 2026 ? `2026 - ${currentYear}` : `2026`;
document.getElementById('copyright-year-ru').textContent = yearStr;
document.getElementById('copyright-year-en').textContent = yearStr;
