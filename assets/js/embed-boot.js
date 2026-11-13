/**
 * Embed / redirect boot for standalone portfolio pages.
 * - ?embed=1 OR running inside Me.html iframe → hide shell chrome
 * - Direct top-level visit → redirect into Me.html hash route
 */
(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var inIframe = window.parent && window.parent !== window;
  var embed = params.get("embed") === "1" || inIframe;
  var pathName = window.location.pathname || "";

  function portfolioRoot() {
    if (window.PORTFOLIO_BASE) return window.PORTFOLIO_BASE;
    var s = document.currentScript;
    if (s && s.src) return s.src.replace(/assets\/js\/[^/?#]+(?:\?.*)?$/, "");
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var abs = scripts[i].src || "";
      var m = abs.match(/^(.*\/)assets\/js\//);
      if (m) return m[1];
    }
    return "/";
  }

  var REDIRECTS = [
    { re: /Write\.html$/i, hash: "#/project/tax-advice" },
    { re: /\/projects\/write\/?(?:index\.html)?$/i, hash: "#/project/tax-advice" },
    { re: /Agent\.html$/i, hash: "#/project/agent-os" },
    { re: /\/projects\/agent-os\/?(?:index\.html)?$/i, hash: "#/project/agent-os" },
    { re: /ChatPwC\.html$/i, hash: "#/project/chatpwc" },
    { re: /\/projects\/chat-pwc\/?(?:index\.html)?$/i, hash: "#/project/chatpwc" },
    { re: /DesignSystem\.html$/i, hash: "#/project/ai-design-system" },
    { re: /\/projects\/ai-design-system\/?(?:index\.html)?$/i, hash: "#/project/ai-design-system" },
    { re: /MAP\.html$/i, hash: "#/project/ma-path" },
    { re: /\/projects\/ma-path\/?(?:index\.html)?$/i, hash: "#/project/ma-path" },
    { re: /Pulse\.html$/i, hash: "#/project/pulse" },
    { re: /\/projects\/pulse\/?(?:index\.html)?$/i, hash: "#/project/pulse" },
    { re: /DCB\.html$/i, hash: "#/project/dcb" },
    { re: /\/projects\/dcb\/?(?:index\.html)?$/i, hash: "#/project/dcb" },
    { re: /Pathfinder\.html$/i, hash: "#/project/pathfinder" },
    { re: /\/projects\/pathfinder\/?(?:index\.html)?$/i, hash: "#/project/pathfinder" },
    { re: /Approach\.html$/i, hash: "#/approach" },
    { re: /\/pages\/approach\/?(?:index\.html)?$/i, hash: "#/approach" },
    { re: /Contact\.html$/i, hash: "#/contact" },
    { re: /\/pages\/contact\/?(?:index\.html)?$/i, hash: "#/contact" },
  ];

  function lookupRedirect(hrefOrPath) {
    var target = String(hrefOrPath || "");
    if (/\/prototype\//i.test(target)) return null;
    for (var i = 0; i < REDIRECTS.length; i++) {
      if (REDIRECTS[i].re.test(target)) return REDIRECTS[i].hash;
    }
    return null;
  }

  function projectHashFromHref(href) {
    if (!href) return null;
    var clean = href.split("?")[0].split("#")[0];
    return lookupRedirect(clean);
  }

  function enableEmbedMode() {
    document.documentElement.classList.add("la-embed");
    var style = document.createElement("style");
    style.textContent = [
      "html.la-embed{height:auto!important;min-height:100%;overflow-x:hidden;overflow-y:auto;}",
      "html.la-embed body{height:auto!important;min-height:100%;overflow-x:hidden;overflow-y:visible;margin:0;}",
      "html.la-embed #la-sidebar-root,html.la-embed #la-mobile-bar-root,html.la-embed .la-sidebar,html.la-embed .la-mobile-bar,html.la-embed .la-backdrop,html.la-embed .sp-top,html.la-embed .approach-page-header,html.la-embed .legacy-case-study-navigation,html.la-embed .la-skip{display:none!important;}",
      "html.la-embed body.la-case-study-page{overflow-x:hidden;overflow-y:visible;}",
      "html.la-embed body.la-case-study-page .la-case-study-shell{display:block!important;width:100%!important;min-height:0!important;height:auto!important;}",
      "html.la-embed body.la-case-study-page .la-case-study-main{display:block!important;margin:0!important;padding:0!important;width:100%!important;max-width:none!important;min-height:0!important;height:auto!important;}",
      "html.la-embed .container,html.la-embed .container-fluid{max-width:100%;}",
      "html.la-embed .approach-scroll-section{display:block;width:100%;}",
      "html.la-embed .approach-scroll-track{display:none!important;height:0!important;visibility:hidden!important;}",
      "html.la-embed .approach-page-shell,html.la-embed .approach-page-shell--embedded{position:static!important;top:auto!important;height:auto!important;min-height:0!important;max-width:760px;margin:0 auto;padding:48px 24px 64px;overflow:visible!important;display:block!important;background:transparent;}",
      "html.la-embed .approach-page-shell--embedded .approach-page-header{display:none!important;}",
    ].join("");
    document.head.appendChild(style);

    document.addEventListener("DOMContentLoaded", function () {
      document.body.classList.add("la-embed-body");
      document.body.classList.remove("la-sidebar-collapsed");
      var roots = document.querySelectorAll(
        "#la-sidebar-root, #la-mobile-bar-root, .la-backdrop, #la-backdrop, .la-mobile-bar, .la-sidebar, .sp-top, .approach-page-header, .sp-back"
      );
      roots.forEach(function (el) {
        el.setAttribute("hidden", "");
        el.setAttribute("aria-hidden", "true");
        el.style.display = "none";
        if (el.parentNode) el.parentNode.removeChild(el);
      });
      var shell = document.querySelector(".approach-page-shell");
      if (shell) shell.classList.add("approach-page-shell--embedded");
      var approach = document.querySelector("[data-approach-scrolly]");
      if (approach) {
        approach.setAttribute("data-approach-mode", "click");
        approach.classList.add("approach-workspace-embed");
      }
    });

    document.addEventListener(
      "click",
      function (e) {
        if (!inIframe) return;

        var btn = e.target.closest("[data-step]");
        if (btn) {
          var step = parseInt(btn.getAttribute("data-step") || "0", 10);
          try {
            window.parent.postMessage({ type: "la-approach-step", step: step }, "*");
          } catch (err) {
            /* ignore */
          }
        }

        var a = e.target.closest("a[href]");
        if (!a) return;
        var href = a.getAttribute("href") || "";
        if (!href || (href.charAt(0) === "#" && href.indexOf("#/") !== 0)) return;
        if (a.target === "_blank" || /^https?:\/\//i.test(href) || /^mailto:/i.test(href)) return;

        var projectHash = projectHashFromHref(href);
        if (projectHash) {
          e.preventDefault();
          try {
            window.parent.postMessage({ type: "la-navigate", href: "Me.html" + projectHash }, "*");
          } catch (err2) {
            /* ignore */
          }
          return;
        }

        if (/Me\.html/i.test(href) || href.indexOf("#/") === 0) {
          e.preventDefault();
          try {
            window.parent.postMessage({ type: "la-navigate", href: href }, "*");
          } catch (err3) {
            /* ignore */
          }
        }
      },
      true
    );
  }

  if (embed) {
    enableEmbedMode();
    return;
  }

  if (/\/prototype\//i.test(pathName)) return;

  var hash = lookupRedirect(pathName);
  if (hash) {
    var anchor = "";
    if (/pathfinder/i.test(pathName)) {
      var rawAnchor = (window.location.hash || "").replace(/^#/, "");
      if (rawAnchor && rawAnchor.charAt(0) !== "/" && /^[a-z0-9-]+$/i.test(rawAnchor)) {
        anchor = "/" + rawAnchor;
      }
    }
    window.location.replace(portfolioRoot() + "Me.html" + hash + anchor);
  }
})();
