// Generic helper functions used across modules
window.Blog = window.Blog || {};

window.Blog.utils = (function () {
  function updateFooterYear() {
    const currentYear = new Date().getFullYear();
    const yearStr = currentYear > 2026 ? `2026 - ${currentYear}` : `2026`;
    const yearEl = document.getElementById('copyright-year');
    if (yearEl) yearEl.textContent = yearStr;
  }

  return { updateFooterYear };
})();
