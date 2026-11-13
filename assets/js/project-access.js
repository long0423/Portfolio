/**
 * Central project-access presentation.
 *
 * This is a visitor-facing navigation gate, not authentication.
 * Case study files on GitHub Pages stay publicly reachable by direct URL
 * and in the Git repository. Switching defaultMode and republishing
 * changes what ordinary navigation does.
 *
 * defaultMode: "request" or "public"
 * projectOverrides: { "<project id or route slug>": "request" | "public" }
 *
 *   npm run access:request
 *   npm run access:public
 */
(function (window, document) {
  "use strict";

  var ACCESS = {
    defaultMode: "request",
    projectOverrides: {},
  };

  window.PORTFOLIO_ACCESS = ACCESS;

  var SLUG_TO_ID = {
    "tax-advice": "write",
    pathfinder: "pathfinder",
    "agent-os": "agentos",
    chatpwc: "chatpwc",
    "ai-design-system": "enterprise-ai-design-system",
    "ma-path": "map",
    pulse: "pulse",
    dcb: "dcb",
  };

  var ID_TO_SLUG = {
    write: "tax-advice",
    pathfinder: "pathfinder",
    agentos: "agent-os",
    chatpwc: "chatpwc",
    "enterprise-ai-design-system": "ai-design-system",
    map: "ma-path",
    pulse: "pulse",
    dcb: "dcb",
  };

  var dialog = null;
  var backdrop = null;
  var lastFocus = null;
  var scrollY = 0;
  var keyHandler = null;

  function normalizeMode(value) {
    return value === "public" ? "public" : "request";
  }

  function resolveId(key) {
    var value = String(key || "");
    if (ID_TO_SLUG[value]) return value;
    if (SLUG_TO_ID[value]) return SLUG_TO_ID[value];
    return value;
  }

  function modeFor(key) {
    var id = resolveId(key);
    var slug = ID_TO_SLUG[id] || String(key || "");
    var overrides = ACCESS.projectOverrides || {};
    if (Object.prototype.hasOwnProperty.call(overrides, id)) return normalizeMode(overrides[id]);
    if (Object.prototype.hasOwnProperty.call(overrides, slug)) return normalizeMode(overrides[slug]);
    return normalizeMode(ACCESS.defaultMode);
  }

  function isGated(key) {
    if (!key) return false;
    var id = resolveId(key);
    if (!ID_TO_SLUG[id] && !SLUG_TO_ID[String(key)]) return false;
    return modeFor(key) !== "public";
  }

  function displayName(key) {
    var id = resolveId(key);
    var knowledge = window.PortfolioKnowledge;
    if (knowledge && typeof knowledge.getAllProjects === "function") {
      var match = knowledge.getAllProjects().filter(function (project) {
        return project.id === id;
      })[0];
      if (match && match.name) return match.name;
    }
    return id;
  }

  function contactEmail() {
    var knowledge = window.PortfolioKnowledge;
    if (knowledge && knowledge.profile && knowledge.profile.email) return knowledge.profile.email;
    return "michaelgeng0423@gmail.com";
  }

  function contactHref(name) {
    return (
      "mailto:" +
      contactEmail() +
      "?subject=" +
      encodeURIComponent("Portfolio — Request access to " + name)
    );
  }

  function portfolioRoot() {
    var scripts = document.getElementsByTagName("script");
    var i;
    for (i = 0; i < scripts.length; i++) {
      var abs = scripts[i].src || "";
      var match = abs.match(/^(.*\/)assets\/js\/project-access\.js(?:\?.*)?$/);
      if (match) return match[1];
    }
    return "";
  }

  function slugFromHash(hash) {
    var match = String(hash || "").match(/(?:^|#)\/project\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  }

  function focusable() {
    if (!dialog) return [];
    return Array.prototype.slice.call(
      dialog.querySelectorAll("a[href], button:not([disabled])")
    );
  }

  function onKey(event) {
    if (!dialog || dialog.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    var items = focusable();
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function ensure() {
    if (dialog) return;
    backdrop = document.createElement("div");
    backdrop.className = "pa-backdrop";
    backdrop.hidden = true;
    backdrop.addEventListener("click", close);

    dialog = document.createElement("div");
    dialog.className = "pa-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "pa-title");
    dialog.setAttribute("aria-describedby", "pa-body");
    dialog.hidden = true;
    dialog.innerHTML =
      '<button type="button" class="pa-close" data-pa-close aria-label="Close">' +
      '<span aria-hidden="true">&times;</span>' +
      "</button>" +
      '<p class="pa-eyebrow">Project access</p>' +
      '<h2 id="pa-title">Case study available on request</h2>' +
      '<p id="pa-body"></p>' +
      '<div class="pa-actions">' +
      '<a class="pa-primary" id="pa-contact">Contact me</a>' +
      '<button type="button" class="pa-secondary" data-pa-close>Not now</button>' +
      "</div>";

    dialog.addEventListener("click", function (event) {
      if (event.target.closest("[data-pa-close]")) close();
    });

    document.body.appendChild(backdrop);
    document.body.appendChild(dialog);
  }

  function lockScroll() {
    scrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = "-" + scrollY + "px";
    document.body.classList.add("pa-lock");
  }

  function unlockScroll() {
    document.body.classList.remove("pa-lock");
    document.body.style.top = "";
    window.scrollTo(0, scrollY);
  }

  function open(options) {
    options = options || {};
    ensure();
    var name = options.name || displayName(options.slug || options.id);
    var body = dialog.querySelector("#pa-body");
    var contact = dialog.querySelector("#pa-contact");
    body.textContent =
      "I share detailed case studies and interactive prototypes upon request. If you'd like to explore " +
      name +
      " in more detail, please get in touch.";
    contact.href = contactHref(name);
    lastFocus = options.trigger && options.trigger.focus ? options.trigger : document.activeElement;
    backdrop.hidden = false;
    dialog.hidden = false;
    lockScroll();
    var shell = document.getElementById("la-shell");
    if (shell) shell.setAttribute("inert", "");
    if (!keyHandler) {
      keyHandler = onKey;
      document.addEventListener("keydown", keyHandler);
    }
    var closeBtn = dialog.querySelector(".pa-close");
    window.requestAnimationFrame(function () {
      if (closeBtn) closeBtn.focus();
    });
  }

  function close() {
    if (!dialog || dialog.hidden) return;
    dialog.hidden = true;
    backdrop.hidden = true;
    var shell = document.getElementById("la-shell");
    if (shell) shell.removeAttribute("inert");
    if (keyHandler) {
      document.removeEventListener("keydown", keyHandler);
      keyHandler = null;
    }
    unlockScroll();
    if (lastFocus && typeof lastFocus.focus === "function") {
      lastFocus.focus();
    }
    lastFocus = null;
  }

  window.PortfolioAccess = {
    isGated: isGated,
    modeFor: modeFor,
    displayName: displayName,
    slugFromHash: slugFromHash,
    portfolioRoot: portfolioRoot,
    open: open,
    close: close,
  };
})(window, document);
