// Entry point: wires up modules on page load. copyButton/codeExpand/giscus are
// only loaded on page types where they apply (see baseof.html).
(function (navigation, utils, search, copyButton, codeExpand, giscus) {
  navigation.initTheme(giscus);
  navigation.initCleanHomeURL();
  utils.updateFooterYear();
  navigation.initToc();
  navigation.initMobileMenu();
  search.init();
  if (copyButton) copyButton.init();
  if (codeExpand) codeExpand.init();
  if (giscus) giscus.init();
})(window.Blog.navigation, window.Blog.utils, window.Blog.search, window.Blog.copyButton, window.Blog.codeExpand, window.Blog.giscus);
