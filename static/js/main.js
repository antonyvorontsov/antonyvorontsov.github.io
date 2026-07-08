// Entry point: wires up modules on page load
(function (navigation, utils) {
  navigation.initTheme();
  utils.updateFooterYear();
  navigation.initToc();
})(window.Blog.navigation, window.Blog.utils);
