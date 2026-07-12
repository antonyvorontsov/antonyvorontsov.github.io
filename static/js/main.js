// Entry point: wires up modules on page load
(function (navigation, utils, search, copyButton, codeExpand) {
  navigation.initTheme();
  utils.updateFooterYear();
  navigation.initToc();
  navigation.initMobileMenu();
  search.init();
  copyButton.init();
  codeExpand.init();
})(window.Blog.navigation, window.Blog.utils, window.Blog.search, window.Blog.copyButton, window.Blog.codeExpand);
