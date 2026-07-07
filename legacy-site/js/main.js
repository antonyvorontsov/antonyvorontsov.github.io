// Entry point: wires up modules on page load
(function (navigation, utils) {
  navigation.initTheme();
  navigation.initLanguage();
  utils.updateFooterYear();
  navigation.initToc();
})(window.Blog.navigation, window.Blog.utils);
