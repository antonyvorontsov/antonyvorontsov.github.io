// Entry point: wires up modules on page load. copyButton/codeExpand are only
// loaded on post pages (see baseof.html) since code blocks only appear there.
(function (navigation, utils, search, copyButton, codeExpand) {
  navigation.initTheme();
  utils.updateFooterYear();
  navigation.initToc();
  navigation.initMobileMenu();
  search.init();
  if (copyButton) copyButton.init();
  if (codeExpand) codeExpand.init();
})(window.Blog.navigation, window.Blog.utils, window.Blog.search, window.Blog.copyButton, window.Blog.codeExpand);
