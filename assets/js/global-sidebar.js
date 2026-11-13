/**
 * Shared global left sidebar used by the landing page and case study pages.
 * Renders chrome from one markup source and wires collapse / tooltips / Work flyout.
 */
window.GlobalSidebar = (function () {
  "use strict";

  const DESKTOP_MQ = "(min-width: 901px)";
  const TOOLTIP_SHOW_DELAY = 320;
  const FLYOUT_CLOSE_DELAY = 160;

  let options = {};
  let tooltipEl = null;
  let tooltipTimer = null;
  let tooltipTrigger = null;
  let flyoutEl = null;
  let flyoutOpen = false;
  let flyoutCloseTimer = null;
  let workNavEl = null;

  function refreshIcons() {
    if (typeof lucide !== "undefined" && lucide.createIcons) {
      lucide.createIcons({
        attrs: { "stroke-width": 1.75 },
        nameAttr: "data-lucide",
      });
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function shellHref(href) {
    if (!href) return href;
    if (window.siteUrl && /^Me\.html/i.test(href)) return window.siteUrl(href);
    return href;
  }

  function isDesktop() {
    return window.matchMedia(DESKTOP_MQ).matches;
  }

  function isDesktopCollapsed() {
    return isDesktop() && document.body.classList.contains("la-sidebar-collapsed");
  }

  function getProjects() {
    const PK = window.PortfolioKnowledge;
    return PK && typeof PK.getAllProjects === "function" ? PK.getAllProjects() : [];
  }

  function workItemMarkup(p, activeProjectId) {
    const NAV_LABELS = {
      write: "TaxAdvice AI",
      agentos: "Agent OS",
      chatpwc: "ChatPwC",
      "enterprise-ai-design-system": "Enterprise AI Design System",
      map: "M&A Path",
      pulse: "Engagement Pulse",
      dcb: "Digital Customer Blueprint",
      pathfinder: "Regulatory Pathfinder",
    };
    const label = escapeHtml(NAV_LABELS[p.id] || p.name || p.shortName);
    const active = activeProjectId && p.id === activeProjectId;
    const update = p.isRecentlyUpdated
      ? '<span class="la-work__item-label">' +
        label +
        '<span class="la-work__update-dot" aria-hidden="true"></span>' +
        '<span class="la-sr-only">Recently updated</span></span>'
      : label;
    const attrs = active ? ' class="is-active" aria-current="page"' : "";
    return "<li class=\"la-work__item\"><a href=\"" + shellHref(p.href) + "\"" + attrs + ">" + update + "</a></li>";
  }

  function renderWorkListHtml(activeProjectId) {
    return getProjects()
      .map(function (p) {
        return workItemMarkup(p, activeProjectId);
      })
      .join("");
  }

  function mobileBarHtml() {
    return (
      '<header class="la-mobile-bar">' +
      '<a class="la-mobile-bar__brand" href="' +
      shellHref("Me.html#/") +
      '" aria-label="Go to new chat">' +
      '<span class="la-sidebar-profile__logo la-sidebar-profile__logo--sm">' +
      '<img src="' +
      (window.siteUrl ? window.siteUrl("assets/images/shared/logo_AI.svg") : "assets/images/shared/logo_AI.svg") +
      '" alt="Long" width="28" height="28" />' +
      "</span><span>Long</span></a>" +
      '<button type="button" class="la-menu-btn" id="la-menu-btn" aria-label="Open navigation menu" title="Menu" aria-expanded="false" aria-controls="la-sidebar">' +
      '<i data-lucide="menu" class="site-icon" aria-hidden="true"></i>' +
      "</button></header>"
    );
  }

  function sidebarHtml(opts) {
    const activeNav = opts.activeNav || "";
    const approachHref = shellHref(opts.approachHref || "Me.html#/approach");
    const libraryHref = shellHref(opts.libraryHref || "Me.html#/library");
    const resumeHref = shellHref(opts.resumeHref || "Me.html#/resume");
    const chatHref = shellHref(opts.chatHref || "Me.html#/");
    const contactHref = shellHref(opts.contactHref || "Me.html#/contact");
    const workActive = activeNav === "work" ? " is-active" : "";
    const chatActive = activeNav === "chat" ? " is-active" : "";
    const approachActive = activeNav === "approach" ? " is-active" : "";
    const libraryActive = activeNav === "library" ? " is-active" : "";
    const resumeActive = activeNav === "resume" ? " is-active" : "";
    const contactActive = activeNav === "contact" ? " is-active" : "";
    const collapsed = !!opts.defaultCollapsed;
    const collapseLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";
    const collapseIcon = collapsed ? "panel-left-open" : "panel-left-close";
    const chatCurrent = chatActive ? ' aria-current="page"' : "";

    return (
      '<aside class="la-sidebar" id="la-sidebar" aria-label="Primary">' +
      '<div class="la-sidebar__top">' +
      '<a class="la-sidebar-profile" href="' +
      shellHref("Me.html#/") +
      '" data-tooltip="Go to new chat" aria-label="Go to new chat">' +
      '<span class="la-sidebar-profile__logo">' +
      '<img src="' +
      (window.siteUrl ? window.siteUrl("assets/images/shared/logo_AI.svg") : "assets/images/shared/logo_AI.svg") +
      '" alt="Long" width="32" height="32" />' +
      "</span>" +
      '<span class="la-sidebar-profile__content">' +
      '<span class="la-sidebar-profile__name">Long</span>' +
      '<span class="la-sidebar-profile__role">AI Product Designer</span>' +
      "</span></a>" +
      '<button type="button" class="la-sidebar__collapse" id="la-sidebar-collapse" aria-label="' +
      collapseLabel +
      '" data-tooltip="' +
      collapseLabel +
      '">' +
      '<i data-lucide="' +
      collapseIcon +
      '" class="site-icon site-icon--sm" aria-hidden="true"></i>' +
      "</button></div>" +
      '<nav class="la-nav la-nav--primary" aria-label="Main">' +
      '<a class="la-nav__link la-chat__new' +
      chatActive +
      '" href="' +
      chatHref +
      '" id="la-nav-new-chat" data-tooltip="New chat" aria-label="Start a new chat"' +
      chatCurrent +
      ">" +
      '<i data-lucide="square-pen" aria-hidden="true"></i><span>New chat</span></a>' +
      '<a class="la-nav__link' +
      approachActive +
      '" href="' +
      approachHref +
      '" data-tooltip="Approach" aria-label="Approach">' +
      '<i data-lucide="workflow" aria-hidden="true"></i><span>Approach</span></a>' +
      '<a class="la-nav__link' +
      libraryActive +
      '" href="' +
      libraryHref +
      '" data-tooltip="Library" aria-label="Library">' +
      '<i data-lucide="library" aria-hidden="true"></i><span>Library</span></a>' +
      '<a class="la-nav__link' +
      resumeActive +
      '" href="' +
      resumeHref +
      '" data-tooltip="Resume" aria-label="Resume">' +
      '<i data-lucide="file-text" aria-hidden="true"></i><span>Resume</span></a>' +
      "</nav>" +
      '<button type="button" class="la-nav__link la-projects-trigger' +
      workActive +
      '" id="la-nav-work" data-tooltip="Projects" aria-label="Projects" aria-haspopup="menu" aria-expanded="false" aria-controls="la-work-flyout">' +
      '<i data-lucide="layout-grid" aria-hidden="true"></i><span>Projects</span></button>' +
      '<div class="la-work" id="la-work">' +
      '<div class="la-work__label">Projects</div>' +
      '<ul class="la-work__list" id="la-work-list">' +
      renderWorkListHtml(opts.activeProjectId) +
      "</ul></div>" +
      '<div class="la-sidebar__footer">' +
      '<a class="la-nav__link' +
      contactActive +
      '" href="' +
      contactHref +
      '" id="la-nav-contact" data-tooltip="Contact" aria-label="Contact">' +
      '<i data-lucide="mail" aria-hidden="true"></i><span>Contact</span></a>' +
      "</div></aside>"
    );
  }

  function ensureTooltipEl() {
    if (tooltipEl) return tooltipEl;
    tooltipEl = document.createElement("div");
    tooltipEl.className = "la-sidebar-tooltip";
    tooltipEl.setAttribute("role", "tooltip");
    tooltipEl.id = "la-sidebar-tooltip";
    tooltipEl.hidden = true;
    document.body.appendChild(tooltipEl);
    return tooltipEl;
  }

  function hideTooltip() {
    if (tooltipTimer) {
      window.clearTimeout(tooltipTimer);
      tooltipTimer = null;
    }
    if (tooltipEl) {
      tooltipEl.hidden = true;
      tooltipEl.textContent = "";
    }
    if (tooltipTrigger) {
      tooltipTrigger.removeAttribute("aria-describedby");
      tooltipTrigger = null;
    }
  }

  function positionPopover(el, anchor, gap) {
    const rect = anchor.getBoundingClientRect();
    const tipRect = el.getBoundingClientRect();
    let top = rect.top + rect.height / 2 - tipRect.height / 2;
    let left = rect.right + (gap == null ? 8 : gap);
    const maxTop = window.innerHeight - tipRect.height - 8;
    top = Math.max(8, Math.min(top, maxTop));
    if (left + tipRect.width > window.innerWidth - 8) {
      left = Math.max(8, rect.left - tipRect.width - 8);
    }
    el.style.top = Math.round(top) + "px";
    el.style.left = Math.round(left) + "px";
  }

  function showTooltip(trigger) {
    if (!isDesktopCollapsed() || !trigger || flyoutOpen) return;
    const label = trigger.getAttribute("data-tooltip");
    if (!label) return;
    // Work uses the flyout instead of a plain tooltip
    if (trigger.id === "la-nav-work") return;

    hideTooltip();
    tooltipTrigger = trigger;
    const el = ensureTooltipEl();
    el.textContent = label;
    trigger.setAttribute("aria-describedby", "la-sidebar-tooltip");
    el.hidden = false;
    positionPopover(el, trigger, 8);
  }

  function scheduleTooltip(trigger) {
    if (tooltipTimer) window.clearTimeout(tooltipTimer);
    tooltipTimer = window.setTimeout(function () {
      showTooltip(trigger);
    }, TOOLTIP_SHOW_DELAY);
  }

  function ensureFlyoutEl() {
    if (flyoutEl) return flyoutEl;
    flyoutEl = document.createElement("div");
    flyoutEl.className = "la-work-flyout";
    flyoutEl.id = "la-work-flyout";
    flyoutEl.setAttribute("role", "menu");
    flyoutEl.setAttribute("aria-label", "Work");
    flyoutEl.hidden = true;
    flyoutEl.innerHTML =
      '<div class="la-work__label">Work</div><ul class="la-work-flyout__list" id="la-work-flyout-list"></ul>';
    document.body.appendChild(flyoutEl);

    flyoutEl.addEventListener("mouseenter", function () {
      cancelFlyoutClose();
    });
    flyoutEl.addEventListener("mouseleave", function () {
      scheduleFlyoutClose();
    });
    flyoutEl.addEventListener("focusin", function () {
      cancelFlyoutClose();
    });
    flyoutEl.addEventListener("focusout", function (e) {
      if (!flyoutEl.contains(e.relatedTarget) && e.relatedTarget !== workNavEl) {
        scheduleFlyoutClose();
      }
    });
    return flyoutEl;
  }

  function populateFlyout() {
    const list = document.getElementById("la-work-flyout-list");
    if (!list) return;
    list.innerHTML = getProjects()
      .map(function (p) {
        const label = escapeHtml(
          p.shortTitle ||
            (p.shortName && p.name && p.shortName !== p.name
              ? p.shortName
              : null) ||
            p.shortName ||
            p.name
        );
        const active = options.activeProjectId && p.id === options.activeProjectId;
        const update = p.isRecentlyUpdated
          ? '<span class="la-work__item-label">' +
            label +
            '<span class="la-work__update-dot" aria-hidden="true"></span>' +
            '<span class="la-sr-only">Recently updated</span></span>'
          : label;
        const cls =
          "la-work-flyout__item" + (active ? " is-active" : "");
        const current = active ? ' aria-current="page"' : "";
        return (
          "<li><a class=\"" +
          cls +
          '" role="menuitem" href="' +
          shellHref(p.href) +
          '"' +
          current +
          ">" +
          update +
          "</a></li>"
        );
      })
      .join("");
  }

  function positionFlyout() {
    if (!flyoutEl || !workNavEl) return;
    const gap = 8;
    const rect = workNavEl.getBoundingClientRect();
    flyoutEl.style.visibility = "hidden";
    flyoutEl.hidden = false;
    const tipRect = flyoutEl.getBoundingClientRect();
    let top = rect.top;
    let left = rect.right + gap;
    const maxTop = window.innerHeight - tipRect.height - 8;
    top = Math.max(8, Math.min(top, maxTop));
    if (left + tipRect.width > window.innerWidth - 8) {
      left = Math.max(8, rect.left - tipRect.width - gap);
    }
    flyoutEl.style.top = Math.round(top) + "px";
    flyoutEl.style.left = Math.round(left) + "px";
    flyoutEl.style.visibility = "";
  }

  function openFlyout() {
    if (!isDesktopCollapsed() || !workNavEl) return;
    cancelFlyoutClose();
    hideTooltip();
    ensureFlyoutEl();
    populateFlyout();
    flyoutOpen = true;
    flyoutEl.hidden = false;
    workNavEl.setAttribute("aria-expanded", "true");
    positionFlyout();
  }

  function closeFlyout(returnFocus) {
    cancelFlyoutClose();
    flyoutOpen = false;
    if (flyoutEl) flyoutEl.hidden = true;
    if (workNavEl) {
      workNavEl.setAttribute("aria-expanded", "false");
      if (returnFocus) workNavEl.focus();
    }
  }

  function cancelFlyoutClose() {
    if (flyoutCloseTimer) {
      window.clearTimeout(flyoutCloseTimer);
      flyoutCloseTimer = null;
    }
  }

  function scheduleFlyoutClose() {
    cancelFlyoutClose();
    flyoutCloseTimer = window.setTimeout(function () {
      closeFlyout(false);
    }, FLYOUT_CLOSE_DELAY);
  }

  function syncCollapseButton() {
    const collapseBtn = document.getElementById("la-sidebar-collapse");
    if (!collapseBtn) return;
    const collapsed = document.body.classList.contains("la-sidebar-collapsed");
    const label = collapsed ? "Expand sidebar" : "Collapse sidebar";
    collapseBtn.setAttribute("aria-label", label);
    collapseBtn.setAttribute("data-tooltip", label);
    const icon = collapseBtn.querySelector("[data-lucide]");
    if (icon) {
      icon.setAttribute("data-lucide", collapsed ? "panel-left-open" : "panel-left-close");
      refreshIcons();
    }
  }

  function setCollapsed(collapsed) {
    document.body.classList.toggle("la-sidebar-collapsed", !!collapsed);
    syncCollapseButton();
    hideTooltip();
    closeFlyout(false);
  }

  function toggleSidebarCollapse() {
    setCollapsed(!document.body.classList.contains("la-sidebar-collapsed"));
  }

  function syncBackdrop() {
    const backdrop = document.getElementById("la-backdrop");
    if (!backdrop) return;
    const open = document.body.classList.contains("la-drawer-open");
    backdrop.hidden = !open;
    backdrop.setAttribute("aria-hidden", open ? "false" : "true");
  }

  function openDrawer() {
    document.body.classList.add("la-drawer-open");
    const menuBtn = document.getElementById("la-menu-btn");
    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", "true");
      menuBtn.setAttribute("aria-label", "Close navigation menu");
      const icon = menuBtn.querySelector("[data-lucide]");
      if (icon) {
        icon.setAttribute("data-lucide", "x");
        refreshIcons();
      }
    }
    syncBackdrop();
  }

  function closeDrawer() {
    document.body.classList.remove("la-drawer-open");
    const menuBtn = document.getElementById("la-menu-btn");
    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Open navigation menu");
      const icon = menuBtn.querySelector("[data-lucide]");
      if (icon) {
        icon.setAttribute("data-lucide", "menu");
        refreshIcons();
      }
    }
    syncBackdrop();
  }

  function toggleDrawer() {
    if (document.body.classList.contains("la-drawer-open")) closeDrawer();
    else openDrawer();
  }

  function bindTooltipTriggers(root) {
    const triggers = root.querySelectorAll("[data-tooltip]");
    triggers.forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        if (!isDesktopCollapsed() || el.id === "la-nav-work") return;
        scheduleTooltip(el);
      });
      el.addEventListener("mouseleave", function () {
        hideTooltip();
      });
      el.addEventListener("focus", function () {
        if (!isDesktopCollapsed() || el.id === "la-nav-work") return;
        showTooltip(el);
      });
      el.addEventListener("blur", function () {
        hideTooltip();
      });
    });
  }

  function bindWorkFlyout() {
    workNavEl = document.getElementById("la-nav-work");
    if (!workNavEl) return;

    workNavEl.addEventListener("mouseenter", function () {
      if (!isDesktopCollapsed()) return;
      openFlyout();
    });
    workNavEl.addEventListener("mouseleave", function () {
      if (!isDesktopCollapsed()) return;
      scheduleFlyoutClose();
    });
    workNavEl.addEventListener("focus", function () {
      if (!isDesktopCollapsed()) return;
      openFlyout();
    });
    workNavEl.addEventListener("blur", function (e) {
      if (!isDesktopCollapsed()) return;
      if (flyoutEl && flyoutEl.contains(e.relatedTarget)) return;
      scheduleFlyoutClose();
    });

    workNavEl.addEventListener("click", function (e) {
      if (!isDesktop()) {
        // Mobile: open drawer so Work list is reachable without hover
        if (!document.body.classList.contains("la-drawer-open")) {
          e.preventDefault();
          openDrawer();
          const work = document.getElementById("la-work");
          if (work) work.scrollIntoView({ block: "nearest" });
        }
        return;
      }
      if (isDesktopCollapsed()) {
        // Keep navigation available; flyout already open on hover/focus
        closeFlyout(false);
      }
    });
  }

  function bindGlobalEvents() {
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (flyoutOpen) {
          e.preventDefault();
          closeFlyout(true);
          return;
        }
        closeDrawer();
      }
    });

    document.addEventListener("click", function (e) {
      if (!flyoutOpen) return;
      const t = e.target;
      if (flyoutEl && flyoutEl.contains(t)) {
        // Selecting an item navigates away; close for cleanliness
        if (t.closest("a")) closeFlyout(false);
        return;
      }
      if (workNavEl && workNavEl.contains(t)) return;
      closeFlyout(false);
    });

    window.addEventListener(
      "resize",
      function () {
        hideTooltip();
        if (!isDesktopCollapsed()) closeFlyout(false);
        else if (flyoutOpen) positionFlyout();
      },
      { passive: true }
    );

    window.addEventListener(
      "scroll",
      function () {
        hideTooltip();
        if (flyoutOpen) positionFlyout();
      },
      true
    );
  }

  function mount(opts) {
    options = opts || {};
    // Embedded in Me.html workspace iframe — no duplicate sidebar
    if (document.documentElement.classList.contains("la-embed")) {
      return false;
    }
    const sidebarRoot = document.querySelector(options.sidebarRoot || "#la-sidebar-root");
    const mobileRoot = document.querySelector(options.mobileRoot || "#la-mobile-bar-root");

    if (options.defaultCollapsed) {
      document.body.classList.add("la-sidebar-collapsed");
    }

    if (mobileRoot && !mobileRoot.querySelector(".la-mobile-bar")) {
      mobileRoot.innerHTML = mobileBarHtml();
    }
    if (sidebarRoot) {
      // Replace mount placeholder with the shared aside markup
      sidebarRoot.outerHTML = sidebarHtml(options);
    }

    refreshIcons();
    return true;
  }

  function init(opts) {
    if (document.documentElement.classList.contains("la-embed")) {
      return;
    }
    if (opts) options = Object.assign({}, options, opts);

    if (options.defaultCollapsed) {
      document.body.classList.add("la-sidebar-collapsed");
    }
    syncCollapseButton();

    const workList = document.getElementById("la-work-list");
    if (workList && !workList.children.length) {
      workList.innerHTML = renderWorkListHtml(options.activeProjectId);
    } else if (workList && options.activeProjectId) {
      workList.innerHTML = renderWorkListHtml(options.activeProjectId);
    }

    const collapseBtn = document.getElementById("la-sidebar-collapse");
    if (collapseBtn) {
      collapseBtn.addEventListener("click", function () {
        toggleSidebarCollapse();
        // Avoid sticky mouse focus ring after click (keyboard focus-visible retained)
        if (typeof collapseBtn.matches === "function" && !collapseBtn.matches(":focus-visible")) {
          collapseBtn.blur();
        }
      });
    }

    const menuBtn = document.getElementById("la-menu-btn");
    const backdrop = document.getElementById("la-backdrop");
    if (menuBtn) menuBtn.addEventListener("click", toggleDrawer);
    if (backdrop) backdrop.addEventListener("click", closeDrawer);

    const sidebar = document.getElementById("la-sidebar");
    if (sidebar) bindTooltipTriggers(sidebar);
    bindWorkFlyout();
    bindGlobalEvents();
    syncBackdrop();
    refreshIcons();
  }

  function autoInitFromBody() {
    const raw = document.body && document.body.getAttribute("data-global-sidebar");
    if (!raw) return;
    let opts;
    try {
      opts = JSON.parse(raw);
    } catch (err) {
      console.error("Invalid data-global-sidebar JSON", err);
      return;
    }
    mount(opts);
    init(opts);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInitFromBody);
  } else {
    autoInitFromBody();
  }

  /** Shared case-study page options (Write, Agent, ChatPwC, MAP, Pulse, DCB). */
  function caseStudyOptions(activeProjectId) {
    return {
      sidebarRoot: "#la-sidebar-root",
      mobileRoot: "#la-mobile-bar-root",
      defaultCollapsed: true,
      activeNav: "work",
      activeProjectId: activeProjectId,
      mode: "case-study",
      chatHref: "Me.html#/",
      approachHref: "Me.html#/approach",
      libraryHref: "Me.html#/library",
      resumeHref: "Me.html#/resume",
      contactHref: "Me.html#/contact",
    };
  }

  return {
    mount: mount,
    init: init,
    setCollapsed: setCollapsed,
    refreshIcons: refreshIcons,
    renderWorkListHtml: renderWorkListHtml,
    caseStudyOptions: caseStudyOptions,
  };
})();
