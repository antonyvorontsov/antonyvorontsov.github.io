// Expand-to-modal for code blocks (see layouts/_default/_markup/render-codeblock.html
// and layouts/partials/code-modal.html). One modal shared by every code block on the
// page — clones the clicked block's .highlight (the transform.Highlight output,
// already syntax-highlighted) into the modal rather than re-rendering or threading
// raw source through a data-attribute.
window.Blog = window.Blog || {};

window.Blog.codeExpand = (function () {
  function init() {
    const overlay = document.getElementById('code-modal-overlay');
    const content = document.getElementById('code-modal-content');
    const closeBtn = document.getElementById('code-modal-close');
    if (!overlay || !content || !closeBtn) return;

    let trigger = null;

    function onKeydown(e) {
      if (e.key === 'Escape') close();
    }

    function open(button) {
      const highlight = button.closest('.code-block-wrapper').querySelector('.highlight');
      content.innerHTML = '';
      content.appendChild(highlight.cloneNode(true));
      trigger = button;
      overlay.hidden = false;
      document.addEventListener('keydown', onKeydown);
      closeBtn.focus();
    }

    function close() {
      overlay.hidden = true;
      content.innerHTML = '';
      document.removeEventListener('keydown', onKeydown);
      if (trigger) trigger.focus();
    }

    document.querySelectorAll('.expand-btn').forEach((button) => {
      button.addEventListener('click', () => open(button));
    });

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  }

  return { init };
})();
