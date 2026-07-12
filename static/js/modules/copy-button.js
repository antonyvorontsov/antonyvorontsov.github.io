// Copy-to-clipboard button injected server-side into every fenced code block
// (see layouts/_default/_markup/render-codeblock.html). Reads .textContent from
// the rendered <code> element (strips Chroma's span tags for free) rather than
// threading the raw source through a data-attribute. Uses textContent, not
// innerText: Chroma's `.line { display: flex }` makes innerText insert an
// extra line break at each line's box boundary on top of the newline Chroma
// already embeds in the text, doubling every line.
window.Blog = window.Blog || {};

window.Blog.copyButton = (function () {
  function showSuccess(button) {
    const defaultIcon = button.querySelector('.copy-icon-default');
    const successIcon = button.querySelector('.copy-icon-success');
    defaultIcon.style.display = 'none';
    successIcon.style.display = 'inline-block';
    setTimeout(() => {
      defaultIcon.style.display = 'inline-block';
      successIcon.style.display = 'none';
    }, 2000);
  }

  function copyCode(button) {
    if (!navigator.clipboard) return;
    const code = button.closest('.code-block-wrapper').querySelector('code').textContent;
    navigator.clipboard.writeText(code).then(() => showSuccess(button), () => {});
  }

  function init() {
    document.querySelectorAll('.copy-btn').forEach((button) => {
      button.addEventListener('click', () => copyCode(button));
    });
  }

  return { init };
})();
