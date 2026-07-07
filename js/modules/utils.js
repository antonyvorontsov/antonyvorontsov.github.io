// Generic helper functions used across modules
window.Blog = window.Blog || {};

window.Blog.utils = (function () {
  function slugify(text) {
    return text.toLowerCase().trim()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'section';
  }

  function headingSlugSource(heading) {
    const ru = heading.querySelector('.lang-ru');
    return ru ? ru.textContent : heading.textContent;
  }

  function updateFooterYear() {
    const currentYear = new Date().getFullYear();
    const yearStr = currentYear > 2026 ? `2026 - ${currentYear}` : `2026`;
    const yearRu = document.getElementById('copyright-year-ru');
    const yearEn = document.getElementById('copyright-year-en');
    if (yearRu) yearRu.textContent = yearStr;
    if (yearEn) yearEn.textContent = yearStr;
  }

  return { slugify, headingSlugSource, updateFooterYear };
})();
