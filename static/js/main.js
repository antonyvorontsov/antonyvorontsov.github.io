// Entry point: wires up modules on page load
(function (navigation, utils, search) {
  navigation.initTheme();
  utils.updateFooterYear();
  navigation.initToc();
  navigation.initMobileMenu();
  search.init();
})(window.Blog.navigation, window.Blog.utils, window.Blog.search);
