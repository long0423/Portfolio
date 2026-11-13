/**
 * Write Builder playground — sidebar, composer, single-select templates,
 * prompt injection with editable placeholders, starter context sources.
 */
(function () {
  "use strict";

  const app = document.querySelector(".wb-app");
  const sidebarToggle = document.getElementById("wb-sidebar-toggle");
  const filterBtn = document.getElementById("wb-filter-btn");
  const newDocBtn = document.getElementById("wb-new-doc");
  const chooseProjectBtn = document.getElementById("wb-choose-project");
  const composerInput = document.getElementById("wb-composer-input");
  const composerAttachments = document.getElementById("wb-composer-attachments");
  const sendBtn = document.getElementById("wb-send");
  const chipButtons = document.querySelectorAll(".wb-chips .wb-chip");
  const composerToggles = document.querySelectorAll(".wb-composer-toggle");
  const navItems = document.querySelectorAll(".wb-nav__item");
  const workflowCards = document.querySelectorAll(".wb-workflow-card");
  const searchInput = document.getElementById("wb-workflow-search");
  const tipsBtn = document.getElementById("wb-tips-btn");
  const settingsBtn = document.getElementById("wb-settings-btn");
  const headerHomeBtn = document.getElementById("wb-header-home");
  const workflowsScroll = document.getElementById("wb-workflows-scroll");
  const workflowsScrollWrap = document.getElementById("wb-workflows-scroll-wrap");
  const templateHint = document.getElementById("wb-tofa-hint");
  const themeToggle = document.getElementById("wb-theme-toggle");
  const THEME_STORAGE_KEY = "write-theme";
  const eduPopout = document.getElementById("wb-edu-popout");
  const eduTitle = document.getElementById("wb-edu-title");
  const eduSubtitle = document.getElementById("wb-edu-subtitle");
  const eduDesc = document.getElementById("wb-edu-desc");
  const composerEl = document.querySelector(".wb-composer");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const EDU_OPEN_DELAY_MS = 520;
  const EDU_CLOSE_DELAY_MS = 150;
  const SOURCE_PREVIEW_OPEN_DELAY_MS = 520;
  const SOURCE_PREVIEW_CLOSE_DELAY_MS = 150;
  const sourcePreviewEl = document.getElementById("wb-source-preview");
  const sourcePreviewTitle = document.getElementById("wb-source-preview-title");
  const sourcePreviewSub = document.getElementById("wb-source-preview-sub");
  const sourcePreviewIcon = document.getElementById("wb-source-preview-icon");
  const sourcePreviewBody = document.getElementById("wb-source-preview-body");
  const sourcePreviewPage = document.getElementById("wb-source-preview-page");
  const sourcePreviewState = {
    id: null,
    trigger: null,
    spec: null,
    openTimer: null,
    closeTimer: null,
    stageMounted: false,
  };
  const EDU_CONTENT = {
    tofa: {
      title: "TOFA",
      subtitle: "Taxation of Financial Arrangements",
      description:
        "A structured advisory template for assessing TOFA classification, tax timing and implementation considerations under Division 230.",
    },
    "transaction-cost": {
      title: "Transaction Cost",
      subtitle: "Transaction Cost Tax Analysis",
      description:
        "A structured tax analysis for assessing the treatment of transaction-related costs across acquisitions, disposals and restructures.",
    },
    "tax-consolidation": {
      title: "Tax Consolidation",
      subtitle: "Consolidation Tax Analysis",
      description:
        "A structured analysis for assessing tax consolidation implications, group membership, joining events and related tax adjustments.",
    },
    "tax-loss": {
      title: "Tax Loss",
      subtitle: "Tax Loss Analysis",
      description:
        "A structured analysis for assessing available tax losses, utilisation requirements, continuity tests and key risk considerations.",
    },
  };

  const eduState = {
    key: null,
    trigger: null,
    openTimer: null,
    closeTimer: null,
    placementFrozen: false,
    stageMounted: false,
  };

  const demoOverlayLayer = document.getElementById("wb-demo-overlay-layer");
  const demoCameraStage = document.getElementById("wb-demo-camera-stage");
  const demoCameraViewport = document.getElementById("wb-demo-camera-viewport");

  let isGenerating = false;
  let generationTimer = null;

  /** Single-select template / composer state. */
  const promptState = {
    selectedTemplate: null, // null | template id
    promptOrigin: "empty", // "empty" | "template" | "manual"
    templatePromptId: null,
    templateDirty: false,
  };

  let composerSources = []; // { id, label, icon, origin, templateId? }
  let filesToggleArmed = false;
  let filesToggleAddedIds = [];
  let dismissedTemplateSources = {}; // templateId -> { sourceId: true }

  const GENERIC_LIBRARY = [
    { id: "generic-board", label: "Board paper.pdf", icon: "file-text", group: "Files" },
    { id: "generic-notes", label: "Working notes", icon: "files", group: "Files" },
    { id: "generic-guidance", label: "Relevant tax guidance", icon: "landmark", group: "Sources" },
  ];

  const TEMPLATES = {
    tofa: {
      id: "tofa",
      label: "TOFA",
      prompt:
        "Prepare a TOFA classification and implementation advisory report for [Company name] in relation to [financial arrangement / transaction].\n\n" +
        "The relevant arrangements are expected to commence on [Effective date] and have an approximate notional value of [Amount].\n\n" +
        "Please assess the application of Division 230, including:\n" +
        "- whether the relevant rights and obligations constitute financial arrangements\n" +
        "- applicable tax timing methods\n" +
        "- relevant elections, exceptions and transitional considerations\n" +
        "- foreign exchange and hedging implications where relevant\n" +
        "- interaction with the organisation's accounting and treasury treatment\n" +
        "- implementation, data, control and governance requirements\n\n" +
        "Please also:\n" +
        "- identify material assumptions and information gaps\n" +
        "- highlight areas requiring further confirmation with Treasury, Finance or Tax\n" +
        "- summarise key tax risks and implementation considerations\n" +
        "- recommend practical next steps\n" +
        "- support material conclusions with relevant legislation, guidance and source references\n\n" +
        "Where the available information is incomplete, clearly distinguish confirmed facts from assumptions and identify the additional information required.",
      autoSources: [
        { id: "tofa-register", label: "Financial arrangements register", icon: "sheet" },
        { id: "tofa-treasury", label: "Treasury policy", icon: "file-text" },
        { id: "tofa-div230", label: "Division 230", icon: "landmark" },
      ],
      librarySources: [
        { id: "tofa-register", label: "Financial arrangements register.xlsx", icon: "sheet", group: "Files" },
        { id: "tofa-treasury", label: "Treasury policy.pdf", icon: "file-text", group: "Files" },
        { id: "tofa-div230", label: "Division 230 — TOFA legislation", icon: "landmark", group: "Sources" },
        { id: "tofa-ato", label: "ATO TOFA guidance", icon: "globe", group: "Sources" },
      ],
    },
    "transaction-cost": {
      id: "transaction-cost",
      label: "Transaction Cost",
      prompt:
        "Prepare a transaction cost tax analysis for [Company name] in relation to [acquisition / disposal / restructure / transaction].\n\n" +
        "The transaction is expected to complete on [Completion date] and involves estimated transaction costs of approximately [Amount].\n\n" +
        "Please:\n" +
        "- categorise the major transaction costs\n" +
        "- assess whether each cost is deductible, capital or otherwise subject to specific treatment\n" +
        "- distinguish acquisition, financing, integration and disposal-related costs where relevant\n" +
        "- identify documentation and evidentiary requirements\n" +
        "- highlight material uncertainties and recommended next steps\n\n" +
        "Please support material conclusions with relevant Australian tax guidance and legislation.",
      autoSources: [
        { id: "tx-ledger", label: "Transaction cost ledger", icon: "sheet" },
        { id: "tx-structure", label: "Deal structure summary", icon: "file-text" },
        { id: "tx-invoices", label: "Adviser invoices", icon: "files" },
      ],
      librarySources: [
        { id: "tx-ledger", label: "Transaction cost ledger.xlsx", icon: "sheet", group: "Files" },
        { id: "tx-structure", label: "Deal structure summary.pdf", icon: "file-text", group: "Files" },
        { id: "tx-invoices", label: "Adviser invoices.pdf", icon: "files", group: "Files" },
        { id: "tx-guidance", label: "Transaction-cost tax guidance", icon: "landmark", group: "Sources" },
      ],
    },
    "tax-consolidation": {
      id: "tax-consolidation",
      label: "Tax Consolidation",
      prompt:
        "Prepare a tax consolidation analysis for [Head company] and the proposed inclusion of [Joining entity / entities] into the Australian tax consolidated group.\n\n" +
        "The proposed joining date is [Joining date].\n\n" +
        "Please assess:\n" +
        "- eligibility and group membership requirements\n" +
        "- joining-event implications\n" +
        "- tax cost-setting considerations\n" +
        "- treatment of assets, liabilities and inherited tax attributes\n" +
        "- relevant elections and compliance requirements\n" +
        "- implementation steps and key risks\n\n" +
        "Please clearly identify assumptions, outstanding information and actions required before implementation.",
      autoSources: [
        { id: "tc-structure", label: "Group structure chart", icon: "network" },
        { id: "tc-profile", label: "Entity tax profile", icon: "sheet" },
        { id: "tc-joining", label: "Joining calculations", icon: "table-2" },
      ],
      librarySources: [
        { id: "tc-structure", label: "Group structure chart.pdf", icon: "network", group: "Files" },
        { id: "tc-profile", label: "Entity tax profile.xlsx", icon: "sheet", group: "Files" },
        { id: "tc-joining", label: "Proposed joining calculations.xlsx", icon: "table-2", group: "Files" },
        { id: "tc-guidance", label: "Consolidation legislation & ATO guidance", icon: "landmark", group: "Sources" },
      ],
    },
    "tax-loss": {
      id: "tax-loss",
      label: "Tax Loss",
      prompt:
        "Prepare a tax loss utilisation assessment for [Company / Group name] for the period ending [Reporting date].\n\n" +
        "Available carried-forward tax losses are approximately [Amount].\n\n" +
        "Please assess:\n" +
        "- the current tax loss position\n" +
        "- continuity of ownership requirements\n" +
        "- business continuity requirements where relevant\n" +
        "- restrictions or risks affecting utilisation\n" +
        "- expected utilisation profile\n" +
        "- supporting documentation and evidence requirements\n\n" +
        "Please identify key assumptions, unresolved matters and recommended actions.",
      autoSources: [
        { id: "tl-schedule", label: "Tax loss schedule", icon: "sheet" },
        { id: "tl-ownership", label: "Ownership history", icon: "table-2" },
        { id: "tl-activity", label: "Business activity summary", icon: "file-text" },
      ],
      librarySources: [
        { id: "tl-schedule", label: "Tax loss schedule.xlsx", icon: "sheet", group: "Files" },
        { id: "tl-ownership", label: "Ownership history.xlsx", icon: "table-2", group: "Files" },
        { id: "tl-activity", label: "Business activity summary.pdf", icon: "file-text", group: "Files" },
        { id: "tl-guidance", label: "Loss continuity guidance", icon: "landmark", group: "Sources" },
      ],
    },
  };

  function getSourcePreviewSpec(sourceId) {
    const api = window.WriteBuilderSourcePreviews;
    return api && typeof api.get === "function" ? api.get(sourceId) : null;
  }

  function hasSourcePreview(sourceId) {
    const spec = getSourcePreviewSpec(sourceId);
    return !!spec;
  }

  function currentPreviewPage() {
    const spec = sourcePreviewState.spec;
    if (!sourcePreviewBody || !spec || !spec.pages) return 1;
    const sections = sourcePreviewBody.querySelectorAll("[data-preview-page]");
    if (!sections.length) {
      const max = Math.max(1, sourcePreviewBody.scrollHeight - sourcePreviewBody.clientHeight);
      const ratio = max ? sourcePreviewBody.scrollTop / max : 0;
      return Math.min(spec.pages, Math.max(1, Math.round(1 + ratio * (spec.pages - 1))));
    }
    const bodyRect = sourcePreviewBody.getBoundingClientRect();
    const midY = bodyRect.top + sourcePreviewBody.clientHeight * 0.35;
    let page = parseInt(sections[0].getAttribute("data-preview-page"), 10) || 1;
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= midY) {
        page = parseInt(sections[i].getAttribute("data-preview-page"), 10) || page;
      }
    }
    return page;
  }

  function updatePreviewPager() {
    const spec = sourcePreviewState.spec;
    if (!sourcePreviewPage) return;
    if (spec && spec.showPager && spec.pages) {
      sourcePreviewPage.hidden = false;
      sourcePreviewPage.textContent = currentPreviewPage() + " / " + spec.pages;
      return;
    }
    if (spec && spec.cornerMeta) {
      sourcePreviewPage.hidden = false;
      sourcePreviewPage.textContent = spec.cornerMeta;
      return;
    }
    sourcePreviewPage.hidden = true;
    sourcePreviewPage.textContent = "";
  }

  function revealPreviewRelevant() {
    if (!sourcePreviewBody) return;
    const focus = sourcePreviewBody.querySelector("[data-preview-focus]");
    if (focus) {
      const bodyRect = sourcePreviewBody.getBoundingClientRect();
      const focusRect = focus.getBoundingClientRect();
      const y = focusRect.top - bodyRect.top + sourcePreviewBody.scrollTop;
      sourcePreviewBody.scrollTop = Math.max(0, Math.round(y - sourcePreviewBody.clientHeight * 0.22));
    }
    updatePreviewPager();
  }

  function refreshIcons() {
    if (typeof lucide !== "undefined") {
      lucide.createIcons({ attrs: { "stroke-width": 1.75 } });
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function getTheme() {
    const t = document.documentElement.dataset.theme;
    return t === "dark" ? "dark" : "light";
  }

  function syncThemeToggle() {
    if (!themeToggle) return;
    const isDark = getTheme() === "dark";
    const label = isDark ? "Light mode" : "Dark mode";
    const aria = isDark ? "Switch to light mode" : "Switch to dark mode";
    const iconName = isDark ? "sun" : "moon";
    themeToggle.setAttribute("aria-label", aria);
    themeToggle.setAttribute("title", label);
    themeToggle.setAttribute("data-tooltip", label);
    const span = themeToggle.querySelector("span");
    if (span) span.textContent = label;
    const icon = themeToggle.querySelector("[data-lucide]");
    if (icon) icon.setAttribute("data-lucide", iconName);
    refreshIcons();
  }

  function setTheme(theme, persist) {
    const next = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    if (persist !== false) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch (e) {
        /* ignore quota / private mode */
      }
    }
    syncThemeToggle();
  }

  function toggleTheme() {
    setTheme(getTheme() === "dark" ? "light" : "dark", true);
  }

  /* Collapsed sidebar tooltips (ChatGPT-style) */
  let sidebarTooltipEl = null;
  let sidebarTooltipTimer = null;
  let sidebarTooltipTrigger = null;

  function ensureSidebarTooltip() {
    if (sidebarTooltipEl) return sidebarTooltipEl;
    sidebarTooltipEl = document.createElement("div");
    sidebarTooltipEl.className = "wb-sidebar-tooltip";
    sidebarTooltipEl.id = "wb-sidebar-tooltip";
    sidebarTooltipEl.setAttribute("role", "tooltip");
    sidebarTooltipEl.hidden = true;
    document.body.appendChild(sidebarTooltipEl);
    return sidebarTooltipEl;
  }

  function hideSidebarTooltip() {
    if (sidebarTooltipTimer) {
      window.clearTimeout(sidebarTooltipTimer);
      sidebarTooltipTimer = null;
    }
    if (sidebarTooltipEl) sidebarTooltipEl.hidden = true;
    if (sidebarTooltipTrigger) {
      sidebarTooltipTrigger.removeAttribute("aria-describedby");
      sidebarTooltipTrigger = null;
    }
  }

  function showSidebarTooltip(trigger) {
    if (!app || !app.classList.contains("is-sidebar-collapsed") || !trigger) return;
    const label = trigger.getAttribute("data-tooltip") || trigger.getAttribute("title");
    if (!label) return;
    hideSidebarTooltip();
    const el = ensureSidebarTooltip();
    el.textContent = label;
    sidebarTooltipTrigger = trigger;
    trigger.setAttribute("aria-describedby", "wb-sidebar-tooltip");
    el.hidden = false;
    const rect = trigger.getBoundingClientRect();
    const tipRect = el.getBoundingClientRect();
    let top = rect.top + rect.height / 2 - tipRect.height / 2;
    let left = rect.right + 8;
    top = Math.max(8, Math.min(top, window.innerHeight - tipRect.height - 8));
    if (left + tipRect.width > window.innerWidth - 8) {
      left = Math.max(8, rect.left - tipRect.width - 8);
    }
    el.style.top = Math.round(top) + "px";
    el.style.left = Math.round(left) + "px";
  }

  function bindSidebarTooltips() {
    const root = document.getElementById("wb-sidebar");
    if (!root) return;
    root.querySelectorAll("[data-tooltip], .wb-nav__item, #wb-new-doc, #wb-filter-btn").forEach(function (el) {
      if (!el.getAttribute("data-tooltip")) {
        const title = el.getAttribute("title") || (el.querySelector("span") && el.querySelector("span").textContent);
        if (title) el.setAttribute("data-tooltip", title.trim());
      }
      el.addEventListener("pointerenter", function (e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        if (sidebarTooltipTimer) window.clearTimeout(sidebarTooltipTimer);
        sidebarTooltipTimer = window.setTimeout(function () {
          showSidebarTooltip(el);
        }, 280);
      });
      el.addEventListener("pointerleave", hideSidebarTooltip);
      el.addEventListener("focus", function () {
        showSidebarTooltip(el);
      });
      el.addEventListener("blur", hideSidebarTooltip);
    });
  }

  function clearEduOpenTimer() {
    if (eduState.openTimer) {
      window.clearTimeout(eduState.openTimer);
      eduState.openTimer = null;
    }
  }

  function clearEduCloseTimer() {
    if (eduState.closeTimer) {
      window.clearTimeout(eduState.closeTimer);
      eduState.closeTimer = null;
    }
  }

  function clearEduTimers() {
    clearEduOpenTimer();
    clearEduCloseTimer();
  }

  function rectsOverlap(a, b, pad) {
    const p = pad || 0;
    return !(
      a.right < b.left + p ||
      a.left > b.right - p ||
      a.bottom < b.top + p ||
      a.top > b.bottom - p
    );
  }

  function fillEduContent(key) {
    const content = EDU_CONTENT[key];
    if (!content || !eduPopout) return;
    eduPopout.setAttribute("data-edu-active", key);
    if (eduTitle) eduTitle.textContent = content.title;
    if (eduSubtitle) eduSubtitle.textContent = content.subtitle || "";
    if (eduDesc) eduDesc.textContent = content.description;
    eduPopout.querySelectorAll("[data-edu-doc]").forEach(function (doc) {
      doc.hidden = doc.getAttribute("data-edu-doc") !== key;
    });
  }

  function measureEduSize() {
    if (!eduPopout) return { width: 480, height: 420 };
    const prevHidden = eduPopout.hidden;
    const prevVisibility = eduPopout.style.visibility;
    const prevDisplay = eduPopout.style.display;
    if (prevHidden) {
      eduPopout.hidden = false;
      eduPopout.style.visibility = "hidden";
      eduPopout.style.display = "block";
      eduPopout.classList.remove("is-visible");
    }
    const width = eduPopout.offsetWidth || 400;
    const height = eduPopout.offsetHeight || 420;
    if (prevHidden) {
      eduPopout.hidden = true;
      eduPopout.style.visibility = prevVisibility;
      eduPopout.style.display = prevDisplay;
    }
    return { width: width, height: height };
  }

  function isCinematicDemoActive() {
    if (document.body.classList.contains("wb-demo-cinematic")) return true;
    return !!(
      window.WriteBuilderDemo &&
      typeof window.WriteBuilderDemo.getActive === "function" &&
      window.WriteBuilderDemo.getActive()
    );
  }

  function getCameraTransformState() {
    if (window.WriteBuilderCamera && typeof window.WriteBuilderCamera.getState === "function") {
      return window.WriteBuilderCamera.getState();
    }
    return { scale: 1, x: 0, y: 0 };
  }

  function clientPointToStageLocal(clientX, clientY) {
    if (!demoCameraViewport) {
      return { x: clientX, y: clientY };
    }
    const vp = demoCameraViewport.getBoundingClientRect();
    const cam = getCameraTransformState();
    const scale = cam.scale || 1;
    return {
      x: (clientX - vp.left - (cam.x || 0)) / scale,
      y: (clientY - vp.top - (cam.y || 0)) / scale,
    };
  }

  function mountOverlayForDemo(el, stateRef, stageMount) {
    if (!el) return;
    if (stageMount && demoOverlayLayer) {
      if (el.parentElement !== demoOverlayLayer) {
        demoOverlayLayer.appendChild(el);
      }
      el.classList.add("is-stage-mounted");
      if (stateRef) stateRef.stageMounted = true;
      demoOverlayLayer.setAttribute("aria-hidden", "false");
    } else {
      if (el.parentElement !== document.body) {
        document.body.appendChild(el);
      }
      el.classList.remove("is-stage-mounted");
      if (stateRef) stateRef.stageMounted = false;
      el.style.left = "";
      el.style.top = "";
    }
  }

  function mountEduForDemo(stageMount) {
    mountOverlayForDemo(eduPopout, eduState, stageMount);
    mountOverlayForDemo(sourcePreviewEl, sourcePreviewState, stageMount);
  }

  function ensureEduHost() {
    mountEduForDemo(isCinematicDemoActive());
  }

  function freezeEduPlacement(frozen) {
    eduState.placementFrozen = !!frozen;
  }

  function positionEduPopoutViewport(trigger) {
    const margin = 14;
    const gap = 8;
    const trig = trigger.getBoundingClientRect();
    const size = measureEduSize();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const composerRect = composerEl ? composerEl.getBoundingClientRect() : null;

    const candidates = [
      { name: "above-right", top: trig.top - gap - size.height, left: trig.right - size.width },
      { name: "above-left", top: trig.top - gap - size.height, left: trig.left },
      { name: "below-right", top: trig.bottom + gap, left: trig.right - size.width },
      { name: "below-left", top: trig.bottom + gap, left: trig.left },
    ];

    function clamp(pos) {
      return {
        name: pos.name,
        top: Math.min(Math.max(margin, pos.top), Math.max(margin, vh - size.height - margin)),
        left: Math.min(Math.max(margin, pos.left), Math.max(margin, vw - size.width - margin)),
      };
    }

    function score(pos) {
      const boxed = {
        top: pos.top,
        left: pos.left,
        right: pos.left + size.width,
        bottom: pos.top + size.height,
      };
      let value = 0;
      const fitsY = pos.top >= margin - 1 && pos.top + size.height <= vh - margin + 1;
      const fitsX = pos.left >= margin - 1 && pos.left + size.width <= vw - margin + 1;
      if (fitsY) value += 40;
      if (fitsX) value += 20;
      if (composerRect && rectsOverlap(boxed, composerRect, 4)) value -= 50;
      if (pos.name.indexOf("above") === 0) value += 8;
      if (pos.name.indexOf("right") !== -1) value += 2;
      return value;
    }

    let best = null;
    let bestScore = -Infinity;
    candidates.forEach(function (raw) {
      const pos = clamp(raw);
      const s = score(pos);
      if (s > bestScore) {
        bestScore = s;
        best = pos;
      }
    });

    if (!best) {
      best = clamp({
        name: "fallback",
        top: trig.bottom + gap,
        left: trig.left + trig.width / 2 - size.width / 2,
      });
    }

    eduPopout.style.top = Math.round(best.top) + "px";
    eduPopout.style.left = Math.round(best.left) + "px";
  }

  function positionEduPopoutStage(trigger) {
    const gap = 8;
    const size = measureEduSize();
    const trig = trigger.getBoundingClientRect();
    // Convert trigger edges into untransformed stage-local space
    const topLeft = clientPointToStageLocal(trig.left, trig.top);
    const topRight = clientPointToStageLocal(trig.right, trig.top);
    const bottomLeft = clientPointToStageLocal(trig.left, trig.bottom);

    const candidates = [
      {
        name: "above-right",
        top: topRight.y - gap - size.height,
        left: topRight.x - size.width,
      },
      {
        name: "above-left",
        top: topLeft.y - gap - size.height,
        left: topLeft.x,
      },
      {
        name: "below-right",
        top: bottomLeft.y + gap,
        left: topRight.x - size.width,
      },
      {
        name: "below-left",
        top: bottomLeft.y + gap,
        left: topLeft.x,
      },
    ];

    const stageW = demoCameraStage
      ? demoCameraStage.clientWidth || demoCameraStage.offsetWidth
      : window.innerWidth;
    const stageH = demoCameraStage
      ? demoCameraStage.clientHeight || demoCameraStage.offsetHeight
      : window.innerHeight;
    const margin = 12;

    function clamp(pos) {
      return {
        name: pos.name,
        top: Math.min(Math.max(margin, pos.top), Math.max(margin, stageH - size.height - margin)),
        left: Math.min(Math.max(margin, pos.left), Math.max(margin, stageW - size.width - margin)),
      };
    }

    let best = clamp(candidates[0]);
    let bestScore = -Infinity;
    candidates.forEach(function (raw) {
      const pos = clamp(raw);
      let value = 0;
      if (pos.name.indexOf("above") === 0) value += 8;
      if (pos.name.indexOf("right") !== -1) value += 2;
      const bottom = pos.top + size.height;
      if (bottom > topLeft.y && pos.top < bottomLeft.y) value -= 20;
      if (value > bestScore) {
        bestScore = value;
        best = pos;
      }
    });

    eduPopout.style.top = Math.round(best.top) + "px";
    eduPopout.style.left = Math.round(best.left) + "px";
  }

  function positionEduPopout(trigger) {
    if (!eduPopout || !trigger) return;
    if (eduState.placementFrozen) return;
    ensureEduHost();
    if (eduState.stageMounted) {
      positionEduPopoutStage(trigger);
    } else {
      positionEduPopoutViewport(trigger);
    }
  }

  function hideEduPopout() {
    clearEduTimers();
    eduState.placementFrozen = false;
    if (!eduPopout) return;
    eduPopout.classList.remove("is-visible");
    eduPopout.hidden = true;
    eduPopout.setAttribute("aria-hidden", "true");
    eduState.key = null;
    eduState.trigger = null;
    // Restore normal portal host when demo ends / popout closes
    if (!isCinematicDemoActive()) {
      mountEduForDemo(false);
    }
  }

  function showEduPopout(key, trigger) {
    if (!eduPopout || !EDU_CONTENT[key] || !trigger) return;
    clearEduCloseTimer();
    eduState.placementFrozen = false;
    fillEduContent(key);
    eduState.key = key;
    eduState.trigger = trigger;
    ensureEduHost();
    eduPopout.hidden = false;
    eduPopout.setAttribute("aria-hidden", "false");
    positionEduPopout(trigger);
    if (prefersReducedMotion) {
      eduPopout.classList.add("is-visible");
    } else {
      eduPopout.classList.remove("is-visible");
      // Force reflow so the enter transition runs when switching keys.
      void eduPopout.offsetWidth;
      window.requestAnimationFrame(function () {
        if (eduState.key === key) eduPopout.classList.add("is-visible");
      });
    }
  }

  function scheduleEduOpen(key, trigger) {
    if (!key || !trigger) return;
    clearEduCloseTimer();
    if (eduState.key === key && eduPopout && !eduPopout.hidden) {
      eduState.trigger = trigger;
      positionEduPopout(trigger);
      return;
    }
    // Switching templates: close the other popout immediately, then delay-open.
    if (eduState.key && eduState.key !== key && eduPopout && !eduPopout.hidden) {
      eduPopout.classList.remove("is-visible");
      eduPopout.hidden = true;
      eduPopout.setAttribute("aria-hidden", "true");
      eduState.key = null;
      eduState.trigger = null;
    }
    clearEduOpenTimer();
    eduState.openTimer = window.setTimeout(function () {
      eduState.openTimer = null;
      showEduPopout(key, trigger);
    }, EDU_OPEN_DELAY_MS);
  }

  function scheduleEduClose() {
    clearEduOpenTimer();
    clearEduCloseTimer();
    eduState.closeTimer = window.setTimeout(function () {
      eduState.closeTimer = null;
      hideEduPopout();
    }, EDU_CLOSE_DELAY_MS);
  }

  function bindEduPopouts() {
    if (!eduPopout) return;
    if (!isCinematicDemoActive() && eduPopout.parentElement !== document.body) {
      document.body.appendChild(eduPopout);
    }

    const eduChips = document.querySelectorAll(".wb-chip[data-edu]");
    eduChips.forEach(function (chip) {
      const key = chip.getAttribute("data-edu");
      if (!key || !EDU_CONTENT[key]) return;

      chip.addEventListener("pointerenter", function (e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        scheduleEduOpen(key, chip);
      });
      chip.addEventListener("pointerleave", function (e) {
        if (e.pointerType && e.pointerType !== "mouse") return;
        scheduleEduClose();
      });
      chip.addEventListener("focus", function () {
        scheduleEduOpen(key, chip);
      });
      chip.addEventListener("blur", function () {
        window.setTimeout(function () {
          const active = document.activeElement;
          if (active === chip) return;
          if (eduPopout.contains(active)) return;
          scheduleEduClose();
        }, 0);
      });
    });

    eduPopout.addEventListener("pointerenter", function () {
      clearEduCloseTimer();
    });
    eduPopout.addEventListener("pointerleave", function () {
      scheduleEduClose();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (!eduPopout || eduPopout.hidden) return;
      hideEduPopout();
      e.preventDefault();
    });

    document.addEventListener("click", function (e) {
      if (!eduPopout || eduPopout.hidden) return;
      if (e.target.closest("#wb-edu-popout")) return;
      if (e.target.closest(".wb-chip[data-edu]")) return;
      hideEduPopout();
    });

    window.addEventListener(
      "resize",
      function () {
        if (!eduPopout || eduPopout.hidden || !eduState.trigger) return;
        if (eduState.placementFrozen) return;
        positionEduPopout(eduState.trigger);
      },
      { passive: true }
    );

    window.addEventListener(
      "scroll",
      function () {
        if (!eduPopout || eduPopout.hidden || !eduState.trigger) return;
        if (eduState.placementFrozen) return;
        positionEduPopout(eduState.trigger);
      },
      true
    );
  }

  function clearSourcePreviewOpenTimer() {
    if (sourcePreviewState.openTimer) {
      window.clearTimeout(sourcePreviewState.openTimer);
      sourcePreviewState.openTimer = null;
    }
  }

  function clearSourcePreviewCloseTimer() {
    if (sourcePreviewState.closeTimer) {
      window.clearTimeout(sourcePreviewState.closeTimer);
      sourcePreviewState.closeTimer = null;
    }
  }

  function clearSourcePreviewTimers() {
    clearSourcePreviewOpenTimer();
    clearSourcePreviewCloseTimer();
  }

  function measureSourcePreviewSize() {
    if (!sourcePreviewEl) return { width: 360, height: 260 };
    const prevHidden = sourcePreviewEl.hidden;
    const prevVisibility = sourcePreviewEl.style.visibility;
    const prevDisplay = sourcePreviewEl.style.display;
    if (prevHidden) {
      sourcePreviewEl.hidden = false;
      sourcePreviewEl.style.visibility = "hidden";
      sourcePreviewEl.style.display = "flex";
      sourcePreviewEl.classList.remove("is-visible");
    }
    const width = sourcePreviewEl.offsetWidth || 360;
    const height = sourcePreviewEl.offsetHeight || 260;
    if (prevHidden) {
      sourcePreviewEl.hidden = true;
      sourcePreviewEl.style.visibility = prevVisibility;
      sourcePreviewEl.style.display = prevDisplay;
    }
    return { width: width, height: height };
  }

  function applySourcePreviewPosition(left, top) {
    if (!sourcePreviewEl) return;
    if (sourcePreviewState.stageMounted && isCinematicDemoActive()) {
      const local = clientPointToStageLocal(left, top);
      sourcePreviewEl.style.left = Math.round(local.x) + "px";
      sourcePreviewEl.style.top = Math.round(local.y) + "px";
      return;
    }
    sourcePreviewEl.style.left = Math.round(left) + "px";
    sourcePreviewEl.style.top = Math.round(top) + "px";
  }

  function positionSourcePreview(trigger) {
    if (!sourcePreviewEl || !trigger) return;
    mountEduForDemo(isCinematicDemoActive());
    const margin = 14;
    const gap = 8;
    const trig = trigger.getBoundingClientRect();
    const size = measureSourcePreviewSize();

    if (sourcePreviewState.stageMounted && demoCameraStage) {
      const topLeft = clientPointToStageLocal(trig.left, trig.top);
      const bottomLeft = clientPointToStageLocal(trig.left, trig.bottom);
      const center = clientPointToStageLocal(trig.left + trig.width / 2, trig.top);
      const stageW = demoCameraStage.clientWidth || window.innerWidth;
      const stageH = demoCameraStage.clientHeight || window.innerHeight;
      let left = center.x - size.width / 2;
      let top = topLeft.y - gap - size.height;
      if (top < margin) top = bottomLeft.y + gap;
      left = Math.min(Math.max(margin, left), Math.max(margin, stageW - size.width - margin));
      top = Math.min(Math.max(margin, top), Math.max(margin, stageH - size.height - margin));
      sourcePreviewEl.style.left = Math.round(left) + "px";
      sourcePreviewEl.style.top = Math.round(top) + "px";
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = trig.left + trig.width / 2 - size.width / 2;
    let top = trig.top - gap - size.height;
    if (top < margin) top = trig.bottom + gap;
    left = Math.min(Math.max(margin, left), Math.max(margin, vw - size.width - margin));
    top = Math.min(Math.max(margin, top), Math.max(margin, vh - size.height - margin));
    applySourcePreviewPosition(left, top);
  }

  function fillSourcePreview(sourceId) {
    const content = getSourcePreviewSpec(sourceId);
    if (!content || !sourcePreviewEl) return false;
    sourcePreviewState.spec = content;
    if (sourcePreviewTitle) sourcePreviewTitle.textContent = content.title;
    if (sourcePreviewSub) sourcePreviewSub.textContent = content.meta || "";
    if (sourcePreviewIcon) {
      sourcePreviewIcon.innerHTML =
        '<i data-lucide="' + escapeHtml(content.icon || "file-text") + '" aria-hidden="true"></i>';
    }
    if (sourcePreviewBody) {
      sourcePreviewBody.dataset.kind = content.kind || "document";
      sourcePreviewBody.dataset.type = content.type || content.kind || "document";
      sourcePreviewBody.innerHTML = content.html || "";
      sourcePreviewBody.scrollTop = 0;
    }
    updatePreviewPager();
    refreshIcons();
    return true;
  }

  function hideSourcePreview() {
    clearSourcePreviewTimers();
    if (sourcePreviewState.trigger) {
      sourcePreviewState.trigger.classList.remove("is-hover");
    }
    sourcePreviewState.id = null;
    sourcePreviewState.trigger = null;
    sourcePreviewState.spec = null;
    if (!sourcePreviewEl) return;
    sourcePreviewEl.classList.remove("is-visible");
    sourcePreviewEl.hidden = true;
    sourcePreviewEl.setAttribute("aria-hidden", "true");
    if (sourcePreviewPage) {
      sourcePreviewPage.hidden = true;
      sourcePreviewPage.textContent = "";
    }
    if (!isCinematicDemoActive()) {
      mountOverlayForDemo(sourcePreviewEl, sourcePreviewState, false);
    }
  }

  function showSourcePreview(sourceId, trigger) {
    if (!fillSourcePreview(sourceId) || !trigger) return;
    clearSourcePreviewCloseTimer();
    if (sourcePreviewState.trigger && sourcePreviewState.trigger !== trigger) {
      sourcePreviewState.trigger.classList.remove("is-hover");
    }
    sourcePreviewState.id = sourceId;
    sourcePreviewState.trigger = trigger;
    trigger.classList.add("is-hover");
    sourcePreviewEl.hidden = false;
    sourcePreviewEl.setAttribute("aria-hidden", "false");
    positionSourcePreview(trigger);
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        if (sourcePreviewState.id !== sourceId) return;
        revealPreviewRelevant();
        positionSourcePreview(trigger);
      });
    });
    if (prefersReducedMotion) {
      sourcePreviewEl.classList.add("is-visible");
      return;
    }
    sourcePreviewEl.classList.remove("is-visible");
    void sourcePreviewEl.offsetWidth;
    window.requestAnimationFrame(function () {
      if (sourcePreviewState.id === sourceId) sourcePreviewEl.classList.add("is-visible");
    });
  }

  function scheduleSourcePreviewOpen(sourceId, trigger) {
    if (!hasSourcePreview(sourceId) || !trigger) return;
    clearSourcePreviewCloseTimer();
    if (sourcePreviewState.id === sourceId && sourcePreviewEl && !sourcePreviewEl.hidden) {
      sourcePreviewState.trigger = trigger;
      positionSourcePreview(trigger);
      return;
    }
    if (sourcePreviewState.id && sourcePreviewState.id !== sourceId && sourcePreviewEl && !sourcePreviewEl.hidden) {
      sourcePreviewEl.classList.remove("is-visible");
      sourcePreviewEl.hidden = true;
      if (sourcePreviewState.trigger) sourcePreviewState.trigger.classList.remove("is-hover");
      sourcePreviewState.id = null;
      sourcePreviewState.trigger = null;
      sourcePreviewState.spec = null;
    }
    clearSourcePreviewOpenTimer();
    sourcePreviewState.openTimer = window.setTimeout(function () {
      sourcePreviewState.openTimer = null;
      showSourcePreview(sourceId, trigger);
    }, SOURCE_PREVIEW_OPEN_DELAY_MS);
  }

  function scheduleSourcePreviewClose() {
    clearSourcePreviewOpenTimer();
    clearSourcePreviewCloseTimer();
    sourcePreviewState.closeTimer = window.setTimeout(function () {
      sourcePreviewState.closeTimer = null;
      hideSourcePreview();
    }, SOURCE_PREVIEW_CLOSE_DELAY_MS);
  }

  function bindSourcePreviewChip(el, sourceId) {
    if (!el || !hasSourcePreview(sourceId)) return;
    el.addEventListener("pointerenter", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      if (e.target.closest(".wb-attachment__remove")) {
        clearSourcePreviewOpenTimer();
        return;
      }
      scheduleSourcePreviewOpen(sourceId, el);
    });
    el.addEventListener("pointerleave", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      scheduleSourcePreviewClose();
    });
    const removeBtn = el.querySelector(".wb-attachment__remove");
    if (removeBtn) {
      removeBtn.addEventListener("pointerenter", function () {
        clearSourcePreviewOpenTimer();
        if (sourcePreviewState.id === sourceId) hideSourcePreview();
      });
    }
  }

  function bindSourcePreviewPopout() {
    if (!sourcePreviewEl) return;
    sourcePreviewEl.addEventListener("pointerenter", function () {
      clearSourcePreviewCloseTimer();
    });
    sourcePreviewEl.addEventListener("pointerleave", function () {
      scheduleSourcePreviewClose();
    });
    if (sourcePreviewBody) {
      sourcePreviewBody.addEventListener(
        "scroll",
        function () {
          if (!sourcePreviewEl || sourcePreviewEl.hidden) return;
          updatePreviewPager();
        },
        { passive: true }
      );
    }
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (!sourcePreviewEl || sourcePreviewEl.hidden) return;
      hideSourcePreview();
    });
    window.addEventListener(
      "resize",
      function () {
        if (!sourcePreviewEl || sourcePreviewEl.hidden || !sourcePreviewState.trigger) return;
        positionSourcePreview(sourcePreviewState.trigger);
      },
      { passive: true }
    );
    window.addEventListener(
      "scroll",
      function () {
        if (!sourcePreviewEl || sourcePreviewEl.hidden || !sourcePreviewState.trigger) return;
        positionSourcePreview(sourcePreviewState.trigger);
      },
      true
    );
  }

  function goToWriteHome() {
    hideEduPopout();
    hideSourcePreview();
    if (window.WriteBuilderDemo && typeof window.WriteBuilderDemo.cancel === "function") {
      window.WriteBuilderDemo.cancel();
    }
    if (window.WriteBuilderReport && typeof window.WriteBuilderReport.reset === "function") {
      const state =
        typeof window.WriteBuilderReport.getState === "function"
          ? window.WriteBuilderReport.getState()
          : null;
      if (!state || state.view !== "compose") {
        window.WriteBuilderReport.reset();
      }
    }
    const composeView = document.getElementById("wb-compose-view");
    if (composeView) {
      composeView.hidden = false;
      composeView.removeAttribute("hidden");
      composeView.setAttribute("aria-hidden", "false");
      composeView.classList.remove("is-exiting");
    }
    if (app) app.classList.remove("is-editor-view", "is-assistant-open");
  }

  function getPromptText() {
    if (!composerInput) return "";
    return (composerInput.innerText || composerInput.textContent || "")
      .replace(/\u00a0/g, " ")
      .replace(/\n$/, "");
  }

  function isComposerEmpty() {
    return getPromptText().trim().length === 0;
  }

  function syncEmptyClass() {
    if (!composerInput) return;
    composerInput.classList.toggle("is-empty", isComposerEmpty());
  }

  function setChipSelected(chip, selected) {
    if (!chip) return;
    chip.classList.toggle("is-selected", selected);
    chip.setAttribute("aria-pressed", selected ? "true" : "false");
    const plusIcon = chip.querySelector(".wb-btn__icon--plus");
    if (plusIcon) {
      plusIcon.setAttribute("data-lucide", selected ? "check" : "plus");
    }
  }

  function getTemplateIdFromChip(chip) {
    if (!chip) return null;
    return chip.dataset.template || chip.dataset.edu || chip.dataset.context || null;
  }

  function getTemplateStaticParts(templateId) {
    const tpl = TEMPLATES[templateId];
    if (!tpl) return [];
    return tpl.prompt.split(/\[[^\]]+\]/);
  }

  function buildTemplateHtml(plain) {
    const re = /\[([^\]]+)\]/g;
    let html = "";
    let last = 0;
    let match;
    const source = plain || "";
    while ((match = re.exec(source)) !== null) {
      html += escapeHtml(source.slice(last, match.index)).replace(/\n/g, "<br>");
      const label = match[1];
      html +=
        '<span class="wb-token" data-placeholder="true" data-label="' +
        escapeHtml(label) +
        '" role="mark" aria-label="Placeholder: ' +
        escapeHtml(label) +
        '. Replace with your value.">[' +
        escapeHtml(label) +
        "]</span>";
      last = match.index + match[0].length;
    }
    html += escapeHtml(source.slice(last)).replace(/\n/g, "<br>");
    return html;
  }

  function clearComposerEditor() {
    if (!composerInput) return;
    composerInput.innerHTML = "";
    syncEmptyClass();
  }

  function unwrapAllTokens() {
    if (!composerInput) return;
    const tokens = composerInput.querySelectorAll(".wb-token");
    tokens.forEach(function (token) {
      const text = document.createTextNode(token.textContent || "");
      token.parentNode.replaceChild(text, token);
    });
    composerInput.normalize();
  }

  function remainingPlaceholders() {
    if (!composerInput) return [];
    return Array.prototype.slice.call(
      composerInput.querySelectorAll('.wb-token[data-placeholder="true"]')
    );
  }

  function updateTemplateHint() {
    if (!templateHint) return;
    const show =
      !!promptState.selectedTemplate &&
      promptState.promptOrigin === "template" &&
      remainingPlaceholders().length > 0;
    templateHint.hidden = !show;
  }

  function isTemplateOnlyPlaceholderEdits() {
    if (promptState.promptOrigin !== "template" || !promptState.templatePromptId) {
      return false;
    }
    const parts = getTemplateStaticParts(promptState.templatePromptId);
    const plain = getPromptText();
    let remaining = plain;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      const idx = remaining.indexOf(part);
      if (idx === -1) return false;
      remaining = remaining.slice(idx + part.length);
    }
    return true;
  }

  function recomputeTemplateDirty() {
    if (promptState.promptOrigin !== "template") return;
    promptState.templateDirty = !isTemplateOnlyPlaceholderEdits();
  }

  function animateComposerSwap() {
    if (prefersReducedMotion) return;
    const targets = [composerInput, composerAttachments].filter(Boolean);
    targets.forEach(function (el) {
      el.classList.remove("is-template-swap");
      // Force reflow so the animation can restart.
      void el.offsetWidth;
      el.classList.add("is-template-swap");
    });
    window.setTimeout(function () {
      targets.forEach(function (el) {
        el.classList.remove("is-template-swap");
      });
    }, 220);
  }

  function injectTemplatePrompt(templateId) {
    const tpl = TEMPLATES[templateId];
    if (!composerInput || !tpl) return;
    composerInput.innerHTML = buildTemplateHtml(tpl.prompt);
    promptState.promptOrigin = "template";
    promptState.templatePromptId = templateId;
    promptState.templateDirty = false;
    syncEmptyClass();
    updateTemplateHint();
    updateSendState();
  }

  function getDismissedSet(templateId) {
    if (!dismissedTemplateSources[templateId]) {
      dismissedTemplateSources[templateId] = {};
    }
    return dismissedTemplateSources[templateId];
  }

  function removeTemplateOriginSources() {
    composerSources = composerSources.filter(function (s) {
      return s.origin !== "template";
    });
  }

  function syncTemplateAutoSources(templateId, options) {
    const opts = options || {};
    const tpl = TEMPLATES[templateId];
    if (!tpl) return;

    removeTemplateOriginSources();

    if (opts.resetDismissed) {
      dismissedTemplateSources[templateId] = {};
    }

    const dismissed = getDismissedSet(templateId);
    tpl.autoSources.forEach(function (src) {
      if (dismissed[src.id]) return;
      if (composerSources.some(function (s) {
        return s.id === src.id;
      })) {
        return;
      }
      composerSources.push({
        id: src.id,
        label: src.label,
        icon: src.icon,
        origin: "template",
        templateId: templateId,
        title: "Suggested context for " + tpl.label,
      });
    });

    renderComposerSources();
  }

  function addSourceIfMissing(item) {
    if (composerSources.some(function (s) {
      return s.id === item.id;
    })) {
      return false;
    }
    composerSources.push(item);
    return true;
  }

  function addLibrarySourcesForActiveTemplate() {
    const templateId = promptState.selectedTemplate;
    const library = templateId && TEMPLATES[templateId]
      ? TEMPLATES[templateId].librarySources
      : GENERIC_LIBRARY;
    const labelPrefix = templateId && TEMPLATES[templateId]
      ? TEMPLATES[templateId].label
      : "Write";

    filesToggleAddedIds = [];
    library.forEach(function (src) {
      const chipLabel = src.label.replace(/\.(xlsx|pdf|docx)$/i, "");
      const added = addSourceIfMissing({
        id: src.id,
        label: chipLabel,
        icon: src.icon,
        origin: "user",
        viaFilesToggle: true,
        title: src.group === "Sources"
          ? "Source · " + labelPrefix
          : "File · " + labelPrefix,
      });
      if (added) filesToggleAddedIds.push(src.id);
    });
    renderComposerSources();
  }

  function removeComposerSource(sourceId) {
    const item = composerSources.find(function (s) {
      return s.id === sourceId;
    });
    if (!item) return;
    if (item.origin === "template" && item.templateId) {
      getDismissedSet(item.templateId)[sourceId] = true;
    }
    composerSources = composerSources.filter(function (s) {
      return s.id !== sourceId;
    });
    filesToggleAddedIds = filesToggleAddedIds.filter(function (id) {
      return id !== sourceId;
    });
    renderComposerSources();
  }

  function renderComposerSources() {
    if (!composerAttachments) return;
    hideSourcePreview();
    composerAttachments.innerHTML = "";
    composerSources.forEach(function (item) {
      const el = document.createElement("div");
      el.className = "wb-attachment";
      el.dataset.sourceId = item.id;
      el.dataset.origin = item.origin || "user";
      if (item.title) el.title = item.title;

      el.innerHTML =
        '<span class="wb-attachment__icon"><i data-lucide="' +
        escapeHtml(item.icon || "file-text") +
        '" aria-hidden="true"></i></span>' +
        '<span class="wb-attachment__label">' +
        escapeHtml(item.label) +
        "</span>" +
        '<button type="button" class="wb-attachment__remove" aria-label="Remove ' +
        escapeHtml(item.label) +
        '">' +
        '<i data-lucide="x" aria-hidden="true"></i>' +
        "</button>";

      const removeBtn = el.querySelector(".wb-attachment__remove");
      removeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        hideSourcePreview();
        removeComposerSource(item.id);
      });
      bindSourcePreviewChip(el, item.id);

      composerAttachments.appendChild(el);
    });
    refreshIcons();
  }

  function clearComposerSources() {
    composerSources = [];
    filesToggleAddedIds = [];
    if (composerAttachments) composerAttachments.innerHTML = "";
  }

  function syncChipSelection(templateId) {
    chipButtons.forEach(function (chip) {
      const id = getTemplateIdFromChip(chip);
      setChipSelected(chip, !!templateId && id === templateId);
    });
    refreshIcons();
  }

  function selectTemplate(templateId) {
    const tpl = TEMPLATES[templateId];
    if (!tpl) return;

    const prev = promptState.selectedTemplate;

    promptState.selectedTemplate = templateId;
    syncChipSelection(templateId);

    // Always replace prompt on select / switch (explicit context change).
    injectTemplatePrompt(templateId);

    // Re-entry after switching away resets dismissed starter sources for demo predictability.
    syncTemplateAutoSources(templateId, {
      resetDismissed: prev !== templateId,
    });

    if (filesToggleArmed) {
      addLibrarySourcesForActiveTemplate();
    }

    animateComposerSwap();
    updateTemplateHint();
    updateSendState();
  }

  function deselectTemplate() {
    const prevId = promptState.selectedTemplate;
    promptState.selectedTemplate = null;
    syncChipSelection(null);

    removeTemplateOriginSources();
    renderComposerSources();

    if (promptState.promptOrigin === "template") {
      if (!promptState.templateDirty || isTemplateOnlyPlaceholderEdits()) {
        clearComposerEditor();
        promptState.promptOrigin = "empty";
        promptState.templatePromptId = null;
        promptState.templateDirty = false;
      } else {
        unwrapAllTokens();
        promptState.promptOrigin = "manual";
        promptState.templatePromptId = null;
        promptState.templateDirty = false;
      }
    }

    if (prevId) {
      dismissedTemplateSources[prevId] = {};
    }

    animateComposerSwap();
    updateTemplateHint();
    updateSendState();
  }

  function replaceTokenWithText(token, text) {
    const node = document.createTextNode(text);
    token.parentNode.replaceChild(node, token);
    const range = document.createRange();
    range.setStart(node, text.length);
    range.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function selectTokenContents(token) {
    const range = document.createRange();
    range.selectNodeContents(token);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    composerInput.querySelectorAll(".wb-token.is-active").forEach(function (t) {
      t.classList.remove("is-active");
    });
    token.classList.add("is-active");
  }

  function getSelectedToken() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    let node = sel.anchorNode;
    if (!node) return null;
    if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
    if (node && node.classList && node.classList.contains("wb-token")) {
      return node;
    }
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    if (container.nodeType === Node.ELEMENT_NODE) {
      const tokens = container.querySelectorAll
        ? container.querySelectorAll(".wb-token")
        : [];
      if (tokens.length === 1 && sel.toString() === tokens[0].textContent) {
        return tokens[0];
      }
    }
    let el = container.nodeType === Node.TEXT_NODE ? container.parentNode : container;
    while (el && el !== composerInput) {
      if (el.classList && el.classList.contains("wb-token")) return el;
      el = el.parentNode;
    }
    return null;
  }

  function setSidebarCollapsed(collapsed) {
    if (!app) return;
    app.classList.toggle("is-sidebar-collapsed", collapsed);
    hideSidebarTooltip();
    if (sidebarToggle) {
      sidebarToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      sidebarToggle.setAttribute(
        "aria-label",
        collapsed ? "Expand sidebar" : "Collapse sidebar"
      );
      sidebarToggle.setAttribute(
        "data-tooltip",
        collapsed ? "Expand sidebar" : "Collapse sidebar"
      );
      sidebarToggle.setAttribute(
        "title",
        collapsed ? "Expand sidebar" : "Collapse sidebar"
      );
      const icon = sidebarToggle.querySelector("[data-lucide]");
      if (icon) {
        icon.setAttribute("data-lucide", collapsed ? "panel-left-open" : "panel-left-close");
      }
    }
    refreshIcons();
    updateWorkflowScrollFades();
  }

  function flashControl(el) {
    if (!el) return;
    el.classList.add("is-pressed");
    window.setTimeout(function () {
      el.classList.remove("is-pressed");
    }, 160);
  }

  function resetComposerToggles() {
    composerToggles.forEach(function (btn) {
      btn.classList.remove("is-active");
      btn.setAttribute("aria-pressed", "false");
    });
    filesToggleArmed = false;
    filesToggleAddedIds = [];
  }

  function resetChips() {
    syncChipSelection(null);
    promptState.selectedTemplate = null;
  }

  function resetToCleanState() {
    hideEduPopout();
    hideSourcePreview();
    clearComposerEditor();
    clearComposerSources();
    dismissedTemplateSources = {};
    resetChips();
    resetComposerToggles();
    if (chooseProjectBtn) {
      chooseProjectBtn.classList.remove("is-active");
    }
    promptState.selectedTemplate = null;
    promptState.promptOrigin = "empty";
    promptState.templatePromptId = null;
    promptState.templateDirty = false;
    updateTemplateHint();
    stopGeneration(false);
    updateSendState();
  }

  function updateSendState() {
    if (!sendBtn) return;
    const hasText = !isComposerEmpty();
    if (isGenerating) {
      sendBtn.disabled = false;
      sendBtn.classList.add("is-generating");
      sendBtn.setAttribute("aria-label", "Stop generation");
      const icon = sendBtn.querySelector("[data-lucide]");
      if (icon) icon.setAttribute("data-lucide", "square");
    } else {
      sendBtn.classList.remove("is-generating");
      sendBtn.disabled = !hasText;
      sendBtn.setAttribute("aria-label", hasText ? "Send" : "Send (disabled)");
      const icon = sendBtn.querySelector("[data-lucide]");
      if (icon) icon.setAttribute("data-lucide", "arrow-up");
    }
    syncEmptyClass();
    refreshIcons();
  }

  function getSelectedContextLabels() {
    const labels = [];
    if (promptState.selectedTemplate && TEMPLATES[promptState.selectedTemplate]) {
      labels.push(TEMPLATES[promptState.selectedTemplate].label);
    }
    composerSources.forEach(function (s) {
      if (s.label && labels.indexOf(s.label) === -1) {
        labels.push(s.label);
      }
    });
    return labels;
  }

  function startGeneration() {
    if (isGenerating || isComposerEmpty()) return;
    isGenerating = true;
    if (composerInput) composerInput.setAttribute("contenteditable", "false");
    updateSendState();
    if (window.WriteBuilderReport && typeof window.WriteBuilderReport.start === "function") {
      window.WriteBuilderReport.start({
        prompt: getPromptText(),
        contexts: getSelectedContextLabels(),
      });
      return;
    }
    generationTimer = window.setTimeout(function () {
      stopGeneration(true);
    }, 4000);
  }

  function stopGeneration(completed) {
    if (generationTimer) {
      window.clearTimeout(generationTimer);
      generationTimer = null;
    }
    if (
      !completed &&
      window.WriteBuilderReport &&
      typeof window.WriteBuilderReport.stop === "function" &&
      window.WriteBuilderReport.getState &&
      window.WriteBuilderReport.getState().view !== "compose"
    ) {
      window.WriteBuilderReport.stop();
      return;
    }
    isGenerating = false;
    if (composerInput) {
      composerInput.setAttribute("contenteditable", "true");
    }
    updateSendState();
  }

  function onReportGenerationEnded() {
    isGenerating = false;
    if (composerInput) {
      composerInput.setAttribute("contenteditable", "true");
    }
    updateSendState();
  }

  function requestNewDocument() {
    if (window.WriteBuilderReport && typeof window.WriteBuilderReport.reset === "function") {
      window.WriteBuilderReport.reset();
    }
    resetToCleanState();
    if (composerInput) {
      composerInput.focus();
    }
  }

  window.WriteBuilderCompose = {
    onGenerationEnded: onReportGenerationEnded,
    requestNewDocument: requestNewDocument,
    goHome: goToWriteHome,
    resetToCleanState: resetToCleanState,
    setSidebarCollapsed: setSidebarCollapsed,
    isSidebarCollapsed: function () {
      return !!(app && app.classList.contains("is-sidebar-collapsed"));
    },
    selectTemplate: selectTemplate,
    deselectTemplate: deselectTemplate,
    getSelectedTemplate: function () {
      return promptState.selectedTemplate;
    },
    showEduPopout: showEduPopout,
    hideEduPopout: hideEduPopout,
    freezeEduPlacement: freezeEduPlacement,
    mountEduForDemo: mountEduForDemo,
    setChipHover: function (chip, hovered) {
      if (!chip) return;
      chip.classList.toggle("is-hover", !!hovered);
    },
    clearChipHovers: function () {
      document.querySelectorAll(".wb-chip.is-hover, .wb-attachment.is-hover").forEach(function (chip) {
        chip.classList.remove("is-hover");
      });
    },
    getContextChip: function (sourceId) {
      if (!composerAttachments || !sourceId) return null;
      return composerAttachments.querySelector('.wb-attachment[data-source-id="' + sourceId + '"]');
    },
    showContextPreview: function (sourceId, trigger) {
      const chip = trigger || window.WriteBuilderCompose.getContextChip(sourceId);
      if (!chip) return false;
      showSourcePreview(sourceId, chip);
      return true;
    },
    hideContextPreview: hideSourcePreview,
    getContextPreview: function () {
      return sourcePreviewEl;
    },
    getContextPreviewBody: function () {
      return sourcePreviewBody;
    },
    getContextPreviewDelay: function () {
      return SOURCE_PREVIEW_OPEN_DELAY_MS;
    },
    repositionEduPopout: function () {
      if (eduState.trigger && !eduState.placementFrozen) {
        positionEduPopout(eduState.trigger);
      }
    },
    getEduCanvas: function () {
      return eduPopout ? eduPopout.querySelector(".wb-edu-canvas") : null;
    },
    getTemplateChip: function (templateId) {
      return document.querySelector(
        '.wb-chip[data-template="' + templateId + '"], .wb-chip[data-edu="' + templateId + '"]'
      );
    },
    getComposerInput: function () {
      return composerInput;
    },
    getComposerEl: function () {
      return composerEl;
    },
    getSendButton: function () {
      return sendBtn;
    },
    getChipsEl: function () {
      return document.querySelector(".wb-chips");
    },
    getEduPopout: function () {
      return eduPopout;
    },
    findPlaceholder: function (label) {
      if (!composerInput || !label) return null;
      return composerInput.querySelector(
        '.wb-token[data-placeholder="true"][data-label="' + label + '"]'
      );
    },
    typeIntoPlaceholder: async function (label, value, options) {
      options = options || {};
      const token = window.WriteBuilderCompose.findPlaceholder(label);
      if (!token || !composerInput) return false;
      selectTokenContents(token);
      if (typeof options.onReady === "function") options.onReady(token);
      const selectHold =
        options.selectHoldMs == null ? 280 : options.selectHoldMs;
      await new Promise(function (r) {
        window.setTimeout(r, selectHold);
      });
      if (options.shouldAbort && options.shouldAbort()) return false;
      // Clear selected placeholder, brief beat, then type with caret sync
      const parent = token.parentNode;
      if (!parent) return false;
      const textNode = document.createTextNode("");
      parent.replaceChild(textNode, token);
      await new Promise(function (r) {
        window.setTimeout(r, options.settleMs == null ? 80 : options.settleMs);
      });
      const caretApi = window.WriteBuilderCaret;
      if (caretApi && caretApi.waitForLayout) await caretApi.waitForLayout();
      if (typeof options.onCaret === "function") options.onCaret(textNode, 0);
      if (caretApi && caretApi.typeTextWithCaret) {
        const typed = await caretApi.typeTextWithCaret(textNode, value, {
          shouldAbort: options.shouldAbort,
          onCaret: options.onCaret,
          onChar: options.onChar,
          reduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          charDelayMin: options.charDelayMin,
          charDelayMax: options.charDelayMax,
        });
        if (!typed) return false;
      } else {
        const delayMin = options.charDelayMin == null ? 20 : options.charDelayMin;
        const delayMax = options.charDelayMax == null ? 45 : options.charDelayMax;
        for (let i = 0; i < value.length; i++) {
          if (options.shouldAbort && options.shouldAbort()) return false;
          textNode.nodeValue = value.slice(0, i + 1);
          if (typeof options.onChar === "function") options.onChar(value.charAt(i), i);
          await new Promise(function (r) {
            window.requestAnimationFrame(r);
          });
          if (typeof options.onCaret === "function") options.onCaret(textNode, i + 1);
          const wait = delayMin + Math.random() * (delayMax - delayMin);
          await new Promise(function (r) {
            window.setTimeout(r, wait);
          });
        }
      }
      if (promptState.promptOrigin === "template") {
        recomputeTemplateDirty();
      }
      updateTemplateHint();
      updateSendState();
      return true;
    },
    startGeneration: startGeneration,
    clickSend: function () {
      if (sendBtn && !sendBtn.disabled) {
        sendBtn.click();
        return true;
      }
      startGeneration();
      return true;
    },
  };

  function updateWorkflowScrollFades() {
    if (!workflowsScroll || !workflowsScrollWrap) return;
    const scrollLeft = workflowsScroll.scrollLeft;
    const scrollWidth = workflowsScroll.scrollWidth;
    const clientWidth = workflowsScroll.clientWidth;
    const hasOverflow = scrollWidth > clientWidth + 1;
    const atStart = scrollLeft <= 1;
    const atEnd = scrollLeft + clientWidth >= scrollWidth - 1;

    workflowsScrollWrap.classList.toggle("is-fade-left", hasOverflow && !atStart);
    workflowsScrollWrap.classList.toggle("is-fade-right", hasOverflow && !atEnd);
  }

  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", function () {
      setSidebarCollapsed(!app.classList.contains("is-sidebar-collapsed"));
    });
  }

  if (filterBtn) {
    filterBtn.addEventListener("click", function () {
      flashControl(filterBtn);
      filterBtn.classList.toggle("is-active");
    });
  }

  if (newDocBtn) {
    newDocBtn.addEventListener("click", function () {
      flashControl(newDocBtn);
      requestNewDocument();
    });
  }

  if (chooseProjectBtn) {
    chooseProjectBtn.addEventListener("click", function () {
      flashControl(chooseProjectBtn);
      chooseProjectBtn.classList.toggle("is-active");
    });
  }

  if (tipsBtn) {
    tipsBtn.addEventListener("click", function () {
      flashControl(tipsBtn);
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      flashControl(settingsBtn);
      // Settings menu demo actions are owned by WriteBuilderDemo
      if (!window.WriteBuilderDemo) return;
    });
  }

  navItems.forEach(function (item) {
    item.addEventListener("click", function () {
      navItems.forEach(function (n) {
        n.classList.remove("is-active");
        n.removeAttribute("aria-current");
      });
      item.classList.add("is-active");
      item.setAttribute("aria-current", "page");
      flashControl(item);
    });
  });

  composerToggles.forEach(function (btn) {
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", function () {
      const isActive = btn.classList.toggle("is-active");
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      flashControl(btn);
      if (btn.dataset.toggle === "files") {
        if (isActive) {
          filesToggleArmed = true;
          addLibrarySourcesForActiveTemplate();
        } else {
          // Deactivate picker affordance only — keep user-added chips.
          filesToggleArmed = false;
          filesToggleAddedIds = [];
        }
      }
    });
  });

  chipButtons.forEach(function (chip) {
    chip.addEventListener("click", function () {
      const templateId = getTemplateIdFromChip(chip);
      if (!templateId || !TEMPLATES[templateId]) return;

      flashControl(chip);
      if (promptState.selectedTemplate === templateId) {
        deselectTemplate();
      } else {
        selectTemplate(templateId);
      }
    });
  });

  if (composerInput) {
    composerInput.addEventListener("click", function (e) {
      const token = e.target.closest && e.target.closest(".wb-token");
      if (token && composerInput.contains(token)) {
        e.preventDefault();
        selectTokenContents(token);
      }
    });

    composerInput.addEventListener("keydown", function (e) {
      const token = getSelectedToken();
      if (!token) return;

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        replaceTokenWithText(token, "");
        recomputeTemplateDirty();
        updateTemplateHint();
        updateSendState();
      }
    });

    composerInput.addEventListener("beforeinput", function (e) {
      const token = getSelectedToken();
      if (!token) return;
      if (e.inputType === "insertText" && e.data) {
        e.preventDefault();
        replaceTokenWithText(token, e.data);
        recomputeTemplateDirty();
        updateTemplateHint();
        updateSendState();
      } else if (
        e.inputType === "deleteContentBackward" ||
        e.inputType === "deleteContentForward"
      ) {
        e.preventDefault();
        replaceTokenWithText(token, "");
        recomputeTemplateDirty();
        updateTemplateHint();
        updateSendState();
      } else if (e.inputType === "insertParagraph" || e.inputType === "insertLineBreak") {
        e.preventDefault();
        replaceTokenWithText(token, "\n");
        recomputeTemplateDirty();
        updateTemplateHint();
        updateSendState();
      }
    });

    composerInput.addEventListener("paste", function (e) {
      const token = getSelectedToken();
      if (!token) return;
      e.preventDefault();
      const text = (e.clipboardData && e.clipboardData.getData("text/plain")) || "";
      replaceTokenWithText(token, text);
      recomputeTemplateDirty();
      updateTemplateHint();
      updateSendState();
    });

    composerInput.addEventListener("input", function () {
      if (promptState.promptOrigin === "template") {
        recomputeTemplateDirty();
        updateTemplateHint();
      } else if (isComposerEmpty()) {
        promptState.promptOrigin = "empty";
        promptState.templatePromptId = null;
      } else {
        promptState.promptOrigin = "manual";
        promptState.templatePromptId = null;
      }
      updateSendState();
    });

    composerInput.addEventListener("blur", function () {
      composerInput.querySelectorAll(".wb-token.is-active").forEach(function (t) {
        t.classList.remove("is-active");
      });
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", function () {
      if (isGenerating) {
        if (window.WriteBuilderReport && typeof window.WriteBuilderReport.stop === "function") {
          window.WriteBuilderReport.stop();
        } else {
          stopGeneration(false);
        }
        return;
      }
      startGeneration();
    });
  }

  workflowCards.forEach(function (card) {
    card.addEventListener("click", function () {
      workflowCards.forEach(function (c) {
        c.classList.remove("is-active");
      });
      card.classList.add("is-active");
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const q = searchInput.value.trim().toLowerCase();
      workflowCards.forEach(function (card) {
        const title = card.querySelector(".wb-workflow-card__title");
        const text = title ? title.textContent.toLowerCase() : "";
        card.hidden = q.length > 0 && !text.includes(q);
      });
      updateWorkflowScrollFades();
    });
  }

  if (workflowsScroll) {
    workflowsScroll.addEventListener("scroll", updateWorkflowScrollFades, {
      passive: true,
    });
  }

  window.addEventListener("resize", updateWorkflowScrollFades);

  if (window.matchMedia("(max-width: 900px)").matches) {
    setSidebarCollapsed(true);
  }

  resetToCleanState();
  updateWorkflowScrollFades();
  bindEduPopouts();
  bindSourcePreviewPopout();
  bindSidebarTooltips();
  if (headerHomeBtn) {
    headerHomeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      goToWriteHome();
    });
  }
  syncThemeToggle();
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      flashControl(themeToggle);
      toggleTheme();
    });
  }
  refreshIcons();
})();
