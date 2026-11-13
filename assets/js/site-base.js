/**
 * Resolve the portfolio site root from this script's URL.
 * Works from nested project/pages paths and from the repo root.
 */
(function (window, document) {
  "use strict";
  function detectBase() {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var abs = scripts[i].src || "";
      var m = abs.match(/^(.*\/)assets\/js\/site-base\.js(\?.*)?$/);
      if (m) return m[1];
    }
    if (document.currentScript && document.currentScript.src) {
      return document.currentScript.src.replace(/assets\/js\/site-base\.js(\?.*)?$/, "");
    }
    return "/";
  }
  window.PORTFOLIO_BASE = detectBase();
  window.siteUrl = function (p) {
    p = String(p || "").replace(/^\//, "");
    return window.PORTFOLIO_BASE + p;
  };
})(window, document);
