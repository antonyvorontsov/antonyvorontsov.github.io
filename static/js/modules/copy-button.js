// Copy-to-clipboard button injected server-side into every fenced code block
// (see layouts/_default/_markup/render-codeblock.html). Reads .innerText from
// the rendered <code> element (strips Chroma's span tags for free) rather than
// threading the raw source through a data-attribute.
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
    const code = button.closest('.code-block-wrapper').querySelector('code').innerText;
    navigator.clipboard.writeText(code).then(() => showSuccess(button), () => {});
  }

  function init() {
    document.querySelectorAll('.copy-btn').forEach((button) => {
      button.addEventListener('click', () => copyCode(button));
    });
  }

  return { init };
})();
