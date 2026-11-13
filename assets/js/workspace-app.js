/**
 * Persistent AI workspace shell for Me.html.
 * Hash routing (GitHub Pages–safe). Sidebar stays mounted; only the right workspace changes.
 */
(function () {
  "use strict";

  const PK = window.PortfolioKnowledge;
  const SIDEBAR_COLLAPSE_KEY = "laSidebarCollapsed";
  const APPROACH_STEP_KEY = "laApproachStep";

  const PROJECT_ROUTES = {
    "tax-advice": { id: "write", file: "projects/write/index.html", label: "TaxAdvice AI" },
    "agent-os": { id: "agentos", file: "projects/agent-os/index.html", label: "Agent OS" },
    chatpwc: { id: "chatpwc", file: "projects/chat-pwc/index.html", label: "ChatPwC" },
    "ai-design-system": {
      id: "enterprise-ai-design-system",
      file: "projects/ai-design-system/index.html",
      label: "Enterprise AI Design System",
    },
    "ma-path": { id: "map", file: "projects/ma-path/index.html", label: "M&A Path" },
    pulse: { id: "pulse", file: "projects/pulse/index.html", label: "Engagement Pulse" },
    dcb: { id: "dcb", file: "projects/dcb/index.html", label: "Digital Customer Blueprint" },
    pathfinder: { id: "pathfinder", file: "projects/pathfinder/index.html", label: "Regulatory Pathfinder" },
  };

  const PROJECT_ID_TO_SLUG = {
    write: "tax-advice",
    agentos: "agent-os",
    chatpwc: "chatpwc",
    "enterprise-ai-design-system": "ai-design-system",
    map: "ma-path",
    pulse: "pulse",
    dcb: "dcb",
    pathfinder: "pathfinder",
  };

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

  const LIBRARY_SECTIONS = [
    {
      id: "about",
      title: "About",
      icon: "user-round",
      html: `
        <p class="ws-detail__lead">Long Geng is a Product &amp; UX Designer with 8+ years blending design and development, focused on enterprise AI products at PwC Australia.</p>
        <ul class="ws-detail__list">
          <li><strong>Focus:</strong> Complex AI workflows across tax, deals, document intelligence, and agent operations.</li>
          <li><strong>Working style:</strong> Close collaboration with PMs, engineers, and SMEs from concept through release.</li>
          <li><strong>Based in:</strong> Melbourne</li>
        </ul>`,
      related: [
        { label: "What makes Long a strong AI product designer?", prompt: "What makes Long a strong AI product designer?" },
        { label: "Tell me about Long’s background", prompt: "Tell me about Long." },
      ],
    },
    {
      id: "experience",
      title: "Experience",
      icon: "briefcase",
      html: `
        <p class="ws-detail__lead">PwC Australia — AI Centre of Excellence</p>
        <ul class="ws-detail__list">
          <li><strong>AgentOS:</strong> Led design for the foundational experience, system identity, and visual language — including a 3-panel model for sources, chat, and creation.</li>
          <li><strong>Tax Advice AI (Write):</strong> Led the redesign from a limited editor into an AI-agent-enabled drafting and review workspace.</li>
          <li><strong>M&amp;A Path:</strong> UX/UI Design Lead unifying fragmented deal data and collaboration flows for Deals teams.</li>
          <li><strong>Regulatory Pathfinder:</strong> Led UX/UI for an AI-assisted assurance workspace connecting controls, testing, evidence, review and incident triage.</li>
          <li><strong>Additional product work:</strong> ChatPwC, Engagement Pulse, and Digital Customer Blueprint.</li>
        </ul>`,
      related: [
        { label: "What was his role and impact?", prompt: "What was his role and impact on key projects?" },
        { label: "Which AI products has he worked on?", prompt: "Which projects are AI native?" },
      ],
    },
    {
      id: "ai-capabilities",
      title: "AI capabilities",
      icon: "sparkles",
      html: `
        <p class="ws-detail__lead">Enterprise AI product design where AI is central to the workflow — not a decorative feature.</p>
        <ul class="ws-detail__list">
          <li>Agent UX and multi-panel workspaces</li>
          <li>Human-in-the-loop review and approval</li>
          <li>Evidence, sources, and explainability</li>
          <li>Generative drafting and review flows</li>
          <li>Trustworthy human–AI interaction patterns</li>
          <li>AI interaction systems</li>
          <li>Agent and conversational patterns</li>
          <li>Trust, evidence and recovery states</li>
          <li>Reusable AI-native components</li>
        </ul>`,
      related: [
        { label: "How does he design trustworthy AI?", prompt: "How does he design trustworthy human–AI interactions?" },
        { label: "How does he approach complex AI problems?", prompt: "How does he approach complex AI problems?" },
        { label: "How did he build an AI-native design system?", prompt: "How did Long build an AI-native design system?" },
      ],
    },
    {
      id: "skills",
      title: "Skills and tools",
      icon: "wrench",
      html: `
        <p class="ws-detail__lead">Core strengths sit at the intersection of AI product UX, enterprise workflow design, and implementation-aware collaboration.</p>
        <ul class="ws-detail__list">
          <li><strong>AI / agent UX:</strong> Human-in-the-loop systems, drafting/review, multi-panel workspaces</li>
          <li><strong>Systems thinking:</strong> Information architecture, progressive disclosure, reusable patterns</li>
          <li><strong>Design systems:</strong> Component architecture, interaction patterns, and design-to-development documentation</li>
          <li><strong>Delivery:</strong> Prototyping, design-engineering handoff, and hands-on front-end collaboration</li>
        </ul>`,
      related: [
        { label: "How does he collaborate with teams?", prompt: "How does he collaborate with product and engineering teams?" },
      ],
    },
    {
      id: "impact",
      title: "Selected impact",
      icon: "target",
      html: `
        <p class="ws-detail__lead">Impact shows up as reduced workflow complexity, clearer review and decision-making, and patterns that can be reused across products.</p>
        <ul class="ws-detail__list">
          <li>Reduced tool fragmentation through unified interaction models</li>
          <li>Clearer human–AI responsibility boundaries in advisory workflows</li>
          <li>Reusable components and behaviours productised from validated patterns</li>
          <li>
            <strong>Enterprise AI Design System</strong> — Transformed a traditional enterprise SaaS design system into a modern AI-native interaction system, introducing reusable components, states and interaction patterns for multiple AI products.
            <br /><a href="#/project/ai-design-system" data-ws-nav="#/project/ai-design-system">View project</a>
          </li>
        </ul>`,
      related: [
        { label: "Which case study should I review first?", prompt: "Which case study should I review first?" },
        { label: "Review project impact", prompt: "What was his role and impact on key projects?" },
      ],
    },
  ];

  const workspaceState = {
    activeView: "chat",
    activeProject: null,
    librarySection: null,
    sidebarCollapsed: false,
    approach: { activeStep: 0 },
  };

  let shell;
  let workspace;
  let frameEl;
  let transitioning = false;
  let lastHash = "";

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function refreshIcons() {
    if (typeof lucide !== "undefined" && lucide.createIcons) {
      lucide.createIcons({ attrs: { "stroke-width": 1.75 }, nameAttr: "data-lucide" });
    }
  }

  function parseHash() {
    let raw = (window.location.hash || "").replace(/^#/, "");
    if (!raw || raw === "/") return { view: "chat", project: null, section: null, clearChat: false };
    if (raw.charAt(0) === "/") raw = raw.slice(1);
    const parts = raw.split("/").filter(Boolean);

    if (!parts.length || parts[0] === "chat") {
      return { view: "chat", project: null, section: null, clearChat: false };
    }
    if (parts[0] === "project" && parts[1] && PROJECT_ROUTES[parts[1]]) {
      const section = parts[2] && /^[a-z0-9-]+$/i.test(parts[2]) ? parts[2] : null;
      return { view: "project", project: parts[1], section: section, clearChat: false };
    }
    if (parts[0] === "approach") {
      return { view: "approach", project: null, section: null, clearChat: false };
    }
    if (parts[0] === "library") {
      // Resume lives in the sidebar, not Library
      if (parts[1] === "resume") {
        return { view: "resume", project: null, section: null, clearChat: false };
      }
      return {
        view: "library",
        project: null,
        section: parts[1] || null,
        clearChat: false,
      };
    }
    if (parts[0] === "resume") {
      return { view: "resume", project: null, section: null, clearChat: false };
    }
    if (parts[0] === "contact") {
      return { view: "contact", project: null, section: null, clearChat: false };
    }
    return { view: "chat", project: null, section: null, clearChat: false };
  }

  function hashFor(route) {
    if (!route || route.view === "chat") return "#/";
    if (route.view === "project" && route.project) {
      return "#/project/" + route.project + (route.section ? "/" + route.section : "");
    }
    if (route.view === "approach") return "#/approach";
    if (route.view === "library") {
      return route.section ? "#/library/" + route.section : "#/library";
    }
    if (route.view === "resume") return "#/resume";
    if (route.view === "contact") return "#/contact";
    return "#/";
  }

  function isProjectGated(slug) {
    return !!(window.PortfolioAccess && slug && window.PortfolioAccess.isGated(slug));
  }

  function holdGatedProject(slug, trigger) {
    if (!window.PortfolioAccess) return;
    window.PortfolioAccess.open({ slug: slug, trigger: trigger || null });
  }

  function goHash(hash, trigger) {
    const raw = String(hash || "");
    const slug = window.PortfolioAccess ? window.PortfolioAccess.slugFromHash(raw.charAt(0) === "#" ? raw : "#" + raw) : "";
    if (isProjectGated(slug)) {
      holdGatedProject(slug, trigger);
      return;
    }
    const next = raw.charAt(0) === "#" ? raw : "#" + (raw.charAt(0) === "/" ? raw : "/" + raw);
    window.location.hash = next === "#/" ? "/" : next.replace(/^#/, "");
  }

  function navigate(route, options) {
    options = options || {};
    if (route && route.view === "project" && isProjectGated(route.project)) {
      holdGatedProject(route.project, document.activeElement);
      return;
    }
    const next = hashFor(route);
    if (options.replace) {
      window.history.replaceState(route, "", next);
    } else if (window.location.hash !== next) {
      window.location.hash = next.slice(1) ? next : "#/";
      return;
    }
    applyRoute(route, options);
  }

  function setNavActive(route) {
    document.querySelectorAll("[data-ws-nav], .la-work__item a, .la-chat__new, .la-sidebar-profile").forEach(function (el) {
      el.classList.remove("is-active");
      el.removeAttribute("aria-current");
    });

    if (!route || route.view === "chat") {
      const newChat = document.getElementById("la-nav-new-chat");
      if (newChat) {
        newChat.classList.add("is-active");
        newChat.setAttribute("aria-current", "page");
      }
      return;
    }

    if (route.view === "project" && route.project) {
      const meta = PROJECT_ROUTES[route.project];
      const link = document.querySelector('.la-work__item a[data-project-id="' + (meta && meta.id) + '"]');
      if (link) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
      return;
    }

    const map = {
      approach: '[data-ws-nav="#/approach"]',
      library: '[data-ws-nav="#/library"]',
      resume: '[data-ws-nav="#/resume"]',
      contact: '[data-ws-nav="#/contact"]',
    };
    const sel = map[route.view];
    if (!sel) return;
    document.querySelectorAll(sel).forEach(function (el) {
      el.classList.add("is-active");
      el.setAttribute("aria-current", "page");
    });
  }

  function panels() {
    return {
      chat: document.getElementById("ws-panel-chat"),
      frame: document.getElementById("ws-panel-frame"),
      library: document.getElementById("ws-panel-library"),
      resume: document.getElementById("ws-panel-resume"),
      contact: document.getElementById("ws-panel-contact"),
    };
  }

  function focusWorkspaceHeading(panel) {
    if (!panel) return;
    const heading = panel.querySelector("h1, [data-ws-focus]");
    if (heading) {
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      window.requestAnimationFrame(function () {
        heading.focus({ preventScroll: true });
      });
    }
  }

  function runTransition(showPanel, afterShow) {
    const all = panels();
    const current = Object.keys(all)
      .map(function (k) {
        return all[k];
      })
      .find(function (p) {
        return p && !p.hidden && p.classList.contains("is-visible");
      });

    function reveal() {
      Object.keys(all).forEach(function (k) {
        const p = all[k];
        if (!p) return;
        const on = p === showPanel;
        p.hidden = !on;
        p.classList.toggle("is-visible", on);
        p.setAttribute("aria-hidden", on ? "false" : "true");
      });
      if (typeof afterShow === "function") afterShow();
      focusWorkspaceHeading(showPanel);
      transitioning = false;
    }

    if (prefersReducedMotion() || !current || current === showPanel) {
      reveal();
      if (showPanel) {
        showPanel.classList.remove("ws-panel--enter", "ws-panel--leave");
      }
      return;
    }

    transitioning = true;
    current.classList.add("ws-panel--leave");
    window.setTimeout(function () {
      current.classList.remove("ws-panel--leave", "is-visible");
      current.hidden = true;
      current.setAttribute("aria-hidden", "true");
      reveal();
      if (showPanel) {
        showPanel.classList.add("ws-panel--enter");
        window.requestAnimationFrame(function () {
          showPanel.classList.remove("ws-panel--enter");
        });
      }
    }, 200);
  }

  function setCaseStudyCollapsed(defaultCollapsed) {
    if (!window.matchMedia("(min-width: 901px)").matches) return;
    if (defaultCollapsed) {
      document.body.classList.add("la-sidebar-collapsed");
    }
    syncCollapseButton();
  }

  function syncCollapseButton() {
    const collapseBtn = document.getElementById("la-sidebar-collapse");
    if (!collapseBtn) return;
    const collapsed = document.body.classList.contains("la-sidebar-collapsed");
    workspaceState.sidebarCollapsed = collapsed;
    try {
      localStorage.setItem(SIDEBAR_COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch (e) {
      /* ignore */
    }
    const label = collapsed ? "Expand sidebar" : "Collapse sidebar";
    collapseBtn.setAttribute("aria-label", label);
    collapseBtn.setAttribute("data-tooltip", label);
    collapseBtn.setAttribute("title", label);
    const icon = collapseBtn.querySelector("[data-lucide]");
    if (icon) {
      icon.setAttribute("data-lucide", collapsed ? "panel-left-open" : "panel-left-close");
      refreshIcons();
    }
  }

  function showChatWorkspace(options) {
    options = options || {};
    const p = panels();
    document.body.classList.remove("la-workspace-scroll-lock");
    shell.classList.remove("is-workspace-frame", "is-workspace-utility");
    runTransition(p.chat, function () {
      if (window.LandingAssistant && typeof window.LandingAssistant.showChatWorkspace === "function") {
        window.LandingAssistant.showChatWorkspace(options);
      }
    });
  }

  function loadFrame(src, title) {
    if (!frameEl) return;
    const current = frameEl.getAttribute("src") || "";
    frameEl.setAttribute("title", title || "Workspace content");
    if (current !== src) {
      frameEl.setAttribute("src", src);
    } else {
      try {
        if (frameEl.contentWindow) {
          frameEl.contentWindow.scrollTo(0, 0);
        }
      } catch (e) {
        /* cross-origin ignore */
      }
    }
  }

  function showFrameWorkspace(src, title, opts) {
    opts = opts || {};
    const p = panels();
    document.body.classList.add("la-workspace-scroll-lock");
    shell.classList.add("is-workspace-frame");
    shell.classList.remove("is-workspace-utility");
    if (opts.collapseSidebar) setCaseStudyCollapsed(true);
    runTransition(p.frame, function () {
      loadFrame(src, title);
    });
  }

  function renderLibraryIndex() {
    const root = document.getElementById("ws-library-root");
    if (!root) return;
    root.innerHTML = `
      <header class="ws-utility-header">
        <h1 class="ws-utility-title" data-ws-focus tabindex="-1">Library</h1>
        <p class="ws-utility-lead">Structured facts about Long — experience, capabilities, and impact.</p>
      </header>
      <ul class="sp-contact-list ws-library-list">
        ${LIBRARY_SECTIONS.map(function (s) {
          return `
          <li>
            <a class="sp-contact-row ws-library-row" href="#/library/${s.id}" data-ws-nav="#/library/${s.id}">
              <i data-lucide="${s.icon}" aria-hidden="true"></i>
              <span class="sp-contact-value">${s.title}</span>
              <i data-lucide="chevron-right" class="ws-library-row__chevron" aria-hidden="true"></i>
            </a>
          </li>`;
        }).join("")}
      </ul>`;
    refreshIcons();
    bindWorkspaceNav(root);
  }

  function renderLibraryDetail(sectionId) {
    const section = LIBRARY_SECTIONS.find(function (s) {
      return s.id === sectionId;
    });
    const root = document.getElementById("ws-library-root");
    if (!root || !section) {
      renderLibraryIndex();
      return;
    }
    root.innerHTML = `
      <header class="ws-utility-header ws-utility-header--detail">
        <nav class="ws-breadcrumb" aria-label="Library">
          <a href="#/library" data-ws-nav="#/library">Library</a>
          <span aria-hidden="true">/</span>
          <span>${section.title}</span>
        </nav>
        <h1 class="ws-utility-title" data-ws-focus tabindex="-1">${section.title}</h1>
      </header>
      <article class="ws-detail">
        ${section.html}
        ${
          section.related && section.related.length
            ? `<div class="ws-related">
                <p class="ws-related__label">Related questions</p>
                <div class="ws-related__tiles">
                  ${section.related
                    .map(function (r) {
                      return `<button type="button" class="la-tile" data-ws-ask="${escapeAttr(r.prompt)}">${escapeHtml(r.label)}</button>`;
                    })
                    .join("")}
                </div>
              </div>`
            : ""
        }
      </article>`;
    refreshIcons();
    bindWorkspaceNav(root);
    root.querySelectorAll("[data-ws-ask]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const prompt = btn.getAttribute("data-ws-ask");
        askInChat(prompt);
      });
    });
  }

  function showLibrary(sectionId) {
    const p = panels();
    document.body.classList.remove("la-workspace-scroll-lock");
    shell.classList.remove("is-workspace-frame");
    shell.classList.add("is-workspace-utility");
    runTransition(p.library, function () {
      if (sectionId) renderLibraryDetail(sectionId);
      else renderLibraryIndex();
    });
  }

  function showResume() {
    const p = panels();
    document.body.classList.add("la-workspace-scroll-lock");
    shell.classList.remove("is-workspace-frame");
    shell.classList.add("is-workspace-utility");
    runTransition(p.resume, function () {
      const frame = document.getElementById("ws-resume-frame");
      if (frame && !frame.getAttribute("src")) {
        frame.setAttribute("src", "assets/media/Resume-Long-Geng.pdf#view=FitH");
      }
    });
  }

  function showContact() {
    const p = panels();
    document.body.classList.remove("la-workspace-scroll-lock");
    shell.classList.remove("is-workspace-frame");
    shell.classList.add("is-workspace-utility");
    runTransition(p.contact);
  }

  function askInChat(prompt) {
    navigate({ view: "chat" }, { replace: false });
    window.setTimeout(function () {
      if (window.LandingAssistant && typeof window.LandingAssistant.openChat === "function") {
        window.LandingAssistant.openChat({
          prompt: prompt,
          source: "library-ask",
          skipHistory: true,
        });
      }
    }, 40);
  }

  function applyRoute(route, options) {
    options = options || {};
    workspaceState.activeView = route.view;
    workspaceState.activeProject = route.project || null;
    workspaceState.librarySection = route.section || null;
    setNavActive(route);
    closeDrawer();

    if (route.view === "chat") {
      showChatWorkspace({
        reset: !!options.resetChat,
        focusComposer: !!options.resetChat || !!options.focusComposer,
      });
      return;
    }

    if (route.view === "project" && route.project && PROJECT_ROUTES[route.project]) {
      const meta = PROJECT_ROUTES[route.project];
      const section = route.section && /^[a-z0-9-]+$/i.test(route.section) ? "#" + route.section : "";
      showFrameWorkspace(meta.file + "?embed=1" + section, meta.label + " case study", {
        collapseSidebar: true,
      });
      return;
    }

    if (route.view === "approach") {
      const step = workspaceState.approach.activeStep || 0;
      showFrameWorkspace("pages/approach/index.html?embed=1#step-" + step, "Approach", {
        collapseSidebar: false,
      });
      return;
    }

    if (route.view === "library") {
      showLibrary(route.section);
      return;
    }

    if (route.view === "resume") {
      showResume();
      return;
    }

    if (route.view === "contact") {
      showContact();
    }
  }

  function onHashChange() {
    const hash = window.location.hash || "#/";
    const route = parseHash();
    if (route.view === "project" && isProjectGated(route.project)) {
      holdGatedProject(route.project, document.activeElement);
      const revert = lastHash && lastHash.indexOf("#/project/") !== 0 ? lastHash : "#/";
      if (hash !== revert) {
        window.history.replaceState({}, "", window.location.pathname + window.location.search + revert);
      }
      lastHash = revert;
      return;
    }
    lastHash = hash;
    applyRoute(route);
  }

  function closeDrawer() {
    document.body.classList.remove("la-drawer-open");
    const menuBtn = document.getElementById("la-menu-btn");
    const backdrop = document.getElementById("la-backdrop");
    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Open navigation menu");
      const icon = menuBtn.querySelector("[data-lucide]");
      if (icon) {
        icon.setAttribute("data-lucide", "menu");
        refreshIcons();
      }
    }
    if (backdrop) {
      backdrop.hidden = true;
      backdrop.setAttribute("aria-hidden", "true");
    }
  }

  function openDrawer() {
    document.body.classList.add("la-drawer-open");
    const menuBtn = document.getElementById("la-menu-btn");
    const backdrop = document.getElementById("la-backdrop");
    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", "true");
      menuBtn.setAttribute("aria-label", "Close navigation menu");
      const icon = menuBtn.querySelector("[data-lucide]");
      if (icon) {
        icon.setAttribute("data-lucide", "x");
        refreshIcons();
      }
    }
    if (backdrop) {
      backdrop.hidden = false;
      backdrop.setAttribute("aria-hidden", "false");
    }
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  function projectNavLabel(p, compact) {
    if (compact && (p.shortTitle || (p.shortName && p.name && p.shortName !== p.name))) {
      return p.shortTitle || p.shortName;
    }
    return NAV_LABELS[p.id] || p.name || p.shortName;
  }

  function renderProjectsNav() {
    const workList = document.getElementById("la-work-list");
    if (!workList || !PK) return;
    workList.innerHTML = PK.getAllProjects()
      .map(function (p) {
        const slug = PROJECT_ID_TO_SLUG[p.id];
        const label = escapeHtml(projectNavLabel(p, false));
        const content = p.isRecentlyUpdated
          ? '<span class="la-work__item-label">' +
            label +
            '<span class="la-work__update-dot" aria-hidden="true"></span>' +
            '<span class="la-sr-only">Recently updated</span></span>'
          : label;
        return (
          '<li class="la-work__item"><a href="#/project/' +
          slug +
          '" data-ws-nav="#/project/' +
          slug +
          '" data-project-id="' +
          p.id +
          '">' +
          content +
          "</a></li>"
        );
      })
      .join("");
  }

  function bindWorkspaceNav(root) {
    (root || document).querySelectorAll("[data-ws-nav]").forEach(function (el) {
      if (el.__wsBound) return;
      el.__wsBound = true;
      el.addEventListener("click", function (e) {
        const href = el.getAttribute("data-ws-nav") || el.getAttribute("href");
        if (!href || href.charAt(0) !== "#") return;
        e.preventDefault();
        if (el.id === "la-nav-new-chat" || el.getAttribute("data-ws-new-chat") === "1") {
          startNewChat();
          return;
        }
        if (el.getAttribute("data-ws-home") === "1") {
          startNewChat();
          return;
        }
        const gated = window.PortfolioAccess && window.PortfolioAccess.slugFromHash(href);
        if (isProjectGated(gated)) {
          e.stopPropagation();
          holdGatedProject(gated, el);
          return;
        }
        window.location.hash = href.replace(/^#/, "") ? href : "/";
      });
    });
  }

  function startNewChat() {
    if (window.LandingAssistant && typeof window.LandingAssistant.startNewChat === "function") {
      window.LandingAssistant.startNewChat({ skipHistory: true });
    }
    navigate({ view: "chat" }, { replace: true, resetChat: true, focusComposer: true });
  }

  function migrateLegacyQuery() {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    const intent = params.get("intent");
    const q = params.get("q");
    const forceNew = params.get("new") === "1";
    if (!view && !intent && !q && !forceNew) return false;

    let hash = "#/";
    if (intent === "approach" || view === "approach") hash = "#/approach";
    else if (intent === "about") hash = "#/library/about";
    else if (intent === "work") hash = "#/";
    else if (view === "chat" || q || forceNew) hash = "#/";

    const url = window.location.pathname + hash;
    window.history.replaceState({}, "", url);

    if (q && window.LandingAssistant) {
      window.setTimeout(function () {
        window.LandingAssistant.openChat({
          prompt: q,
          source: "query-param",
          resetConversation: true,
          skipHistory: true,
        });
      }, 60);
    } else if (forceNew) {
      window.setTimeout(function () {
        startNewChat();
      }, 60);
    }
    return true;
  }

  let flyoutEl = null;
  let flyoutOpen = false;
  let flyoutCloseTimer = null;
  let workNavEl = null;

  function ensureFlyout() {
    if (flyoutEl) return flyoutEl;
    flyoutEl = document.createElement("div");
    flyoutEl.className = "la-work-flyout";
    flyoutEl.id = "la-work-flyout";
    flyoutEl.setAttribute("role", "menu");
    flyoutEl.setAttribute("aria-label", "Projects");
    flyoutEl.hidden = true;
    flyoutEl.innerHTML =
      '<div class="la-work__label">Projects</div><ul class="la-work-flyout__list" id="la-work-flyout-list"></ul>';
    document.body.appendChild(flyoutEl);
    flyoutEl.addEventListener("mouseenter", function () {
      if (flyoutCloseTimer) window.clearTimeout(flyoutCloseTimer);
    });
    flyoutEl.addEventListener("mouseleave", function () {
      scheduleFlyoutClose();
    });
    return flyoutEl;
  }

  function populateFlyout() {
    ensureFlyout();
    const list = document.getElementById("la-work-flyout-list");
    if (!list || !PK) return;
    const activeId =
      workspaceState.activeProject && PROJECT_ROUTES[workspaceState.activeProject]
        ? PROJECT_ROUTES[workspaceState.activeProject].id
        : null;
    list.innerHTML = PK.getAllProjects()
      .map(function (p) {
        const slug = PROJECT_ID_TO_SLUG[p.id];
        const label = escapeHtml(projectNavLabel(p, true));
        const active = activeId && p.id === activeId;
        const update = p.isRecentlyUpdated
          ? '<span class="la-work__item-label">' +
            label +
            '<span class="la-work__update-dot" aria-hidden="true"></span></span>'
          : label;
        return (
          '<li><a class="la-work-flyout__item' +
          (active ? " is-active" : "") +
          '" role="menuitem" href="#/project/' +
          slug +
          '"' +
          (active ? ' aria-current="page"' : "") +
          ">" +
          update +
          "</a></li>"
        );
      })
      .join("");
  }

  function positionFlyout() {
    if (!flyoutEl || !workNavEl) return;
    const rect = workNavEl.getBoundingClientRect();
    flyoutEl.style.visibility = "hidden";
    flyoutEl.hidden = false;
    const tipRect = flyoutEl.getBoundingClientRect();
    let top = Math.max(8, Math.min(rect.top, window.innerHeight - tipRect.height - 8));
    let left = rect.right + 8;
    if (left + tipRect.width > window.innerWidth - 8) {
      left = Math.max(8, rect.left - tipRect.width - 8);
    }
    flyoutEl.style.top = Math.round(top) + "px";
    flyoutEl.style.left = Math.round(left) + "px";
    flyoutEl.style.visibility = "";
  }

  function openFlyout() {
    if (!window.matchMedia("(min-width: 901px)").matches) return;
    if (!document.body.classList.contains("la-sidebar-collapsed")) return;
    populateFlyout();
    flyoutOpen = true;
    flyoutEl.hidden = false;
    if (workNavEl) workNavEl.setAttribute("aria-expanded", "true");
    positionFlyout();
  }

  function closeFlyout() {
    if (flyoutCloseTimer) window.clearTimeout(flyoutCloseTimer);
    flyoutOpen = false;
    if (flyoutEl) flyoutEl.hidden = true;
    if (workNavEl) workNavEl.setAttribute("aria-expanded", "false");
  }

  function scheduleFlyoutClose() {
    if (flyoutCloseTimer) window.clearTimeout(flyoutCloseTimer);
    flyoutCloseTimer = window.setTimeout(closeFlyout, 160);
  }

  function bindProjectsFlyout() {
    workNavEl = document.getElementById("la-nav-work");
    if (!workNavEl) return;
    workNavEl.addEventListener("mouseenter", openFlyout);
    workNavEl.addEventListener("mouseleave", scheduleFlyoutClose);
    workNavEl.addEventListener("focus", openFlyout);
    workNavEl.addEventListener("click", function (e) {
      if (!document.body.classList.contains("la-sidebar-collapsed")) return;
      e.preventDefault();
      if (flyoutOpen) closeFlyout();
      else openFlyout();
    });
    document.addEventListener("click", function (e) {
      if (!flyoutOpen) return;
      if (flyoutEl && flyoutEl.contains(e.target)) return;
      if (workNavEl && workNavEl.contains(e.target)) return;
      closeFlyout();
    });
  }

  function bindShellChrome() {
    const menuBtn = document.getElementById("la-menu-btn");
    const backdrop = document.getElementById("la-backdrop");
    const collapseBtn = document.getElementById("la-sidebar-collapse");

    if (menuBtn) {
      menuBtn.addEventListener("click", function () {
        if (document.body.classList.contains("la-drawer-open")) closeDrawer();
        else openDrawer();
      });
    }
    if (backdrop) backdrop.addEventListener("click", closeDrawer);
    if (collapseBtn) {
      collapseBtn.addEventListener("click", function () {
        document.body.classList.toggle("la-sidebar-collapsed");
        syncCollapseButton();
        closeFlyout();
      });
    }

    bindProjectsFlyout();

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (flyoutOpen) {
          closeFlyout();
          return;
        }
        closeDrawer();
      }
    });

    // Messages from embedded case study / approach iframes
    window.addEventListener("message", function (event) {
      if (!event.data || typeof event.data !== "object") return;
      if (event.data.type === "la-approach-step") {
        workspaceState.approach.activeStep = event.data.step || 0;
        try {
          sessionStorage.setItem(APPROACH_STEP_KEY, String(workspaceState.approach.activeStep));
        } catch (err) {
          /* ignore */
        }
        return;
      }
      if (event.data.type === "la-navigate" && event.data.href) {
        const href = String(event.data.href);
        const qMatch = href.match(/[?&]q=([^&#]+)/);
        const hashMatch = href.match(/#(\/.*)$/);
        const hash = hashMatch ? hashMatch[1] : "/";
        if (qMatch) {
          const prompt = decodeURIComponent(qMatch[1].replace(/\+/g, " "));
          window.location.hash = "/";
          window.setTimeout(function () {
            askInChat(prompt);
          }, 40);
          return;
        }
        goHash(hash.charAt(0) === "/" ? hash : "/" + hash);
      }
    });
  }

  function restorePersistedChrome() {
    try {
      const collapsed = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
      if (collapsed === "1") document.body.classList.add("la-sidebar-collapsed");
      else if (collapsed === "0") document.body.classList.remove("la-sidebar-collapsed");
    } catch (e) {
      /* ignore */
    }
    syncCollapseButton();

    try {
      const step = parseInt(sessionStorage.getItem(APPROACH_STEP_KEY) || "0", 10);
      if (!isNaN(step)) workspaceState.approach.activeStep = step;
    } catch (e) {
      /* ignore */
    }
  }

  function projectHrefForId(id) {
    const slug = PROJECT_ID_TO_SLUG[id];
    return slug ? "#/project/" + slug : "#/";
  }

  function init() {
    shell = document.getElementById("la-shell");
    workspace = document.getElementById("la-workspace");
    frameEl = document.getElementById("ws-frame");
    if (!shell || !workspace) return;

    restorePersistedChrome();
    renderProjectsNav();
    bindWorkspaceNav(document);
    bindShellChrome();
    refreshIcons();

    // Keep internal navigation inside the shell (no full reload / new tab)
    document.addEventListener("auxclick", function (e) {
      if (e.button !== 1) return;
      const a = e.target.closest("a");
      if (!a) return;
      const href = a.getAttribute("href") || "";
      const slug = window.PortfolioAccess && window.PortfolioAccess.slugFromHash(href);
      if (isProjectGated(slug)) {
        e.preventDefault();
        holdGatedProject(slug, a);
      }
    });
    document.addEventListener("click", function (e) {
      const a = e.target.closest("a");
      if (!a || a.target === "_blank") return;
      const href = a.getAttribute("href") || "";
      if (!href) return;
      // Ignore in-page anchors that are not workspace routes
      if (href.charAt(0) === "#" && href.indexOf("#/") !== 0 && href !== "#/") return;

      // Pure hash routes
      if (href.indexOf("#/") === 0 || href === "#/") {
        e.preventDefault();
        if (href === "#/") window.location.hash = "/";
        else goHash(href, a);
        return;
      }

      // Me.html#/... deep links from answers / cards
      const meHash = href.match(/^(?:\.\/)?Me\.html(#\/.*)$/i);
      if (meHash) {
        e.preventDefault();
        goHash(meHash[1], a);
        return;
      }

      if (
        /^(Write|Agent|ChatPwC|DesignSystem|MAP|Pulse|DCB|Pathfinder)\.html/i.test(href) ||
        /\/projects\//i.test(href) ||
        /pages\/approach/i.test(href)
      ) {
        const file = href.split("?")[0].split("#")[0];
        const hashIndex = href.indexOf("#");
        const anchor = hashIndex >= 0 ? href.slice(hashIndex + 1) : "";
        const entry = Object.keys(PROJECT_ROUTES).find(function (slug) {
          return file.indexOf(PROJECT_ROUTES[slug].file) !== -1;
        });
        if (entry) {
          e.preventDefault();
          const section = anchor && /^[a-z0-9-]+$/i.test(anchor) ? "/" + anchor : "";
          goHash("/project/" + entry + section, a);
        } else if (/pages\/approach/i.test(href) || /^Approach\.html/i.test(href)) {
          e.preventDefault();
          window.location.hash = "/approach";
        }
      } else if (/^Approach\.html/i.test(href) || /pages\/approach/i.test(href)) {
        e.preventDefault();
        window.location.hash = "/approach";
      } else if (/^Contact\.html/i.test(href) || /pages\/contact/i.test(href)) {
        e.preventDefault();
        window.location.hash = "/contact";
      }
    });

    window.addEventListener("hashchange", onHashChange);

    const migrated = migrateLegacyQuery();
    if (!window.location.hash || window.location.hash === "#") {
      window.history.replaceState({}, "", window.location.pathname + "#/");
    }
    lastHash = window.location.hash || "#/";
    if (!migrated) {
      const initial = parseHash();
      if (initial.view === "project" && isProjectGated(initial.project)) {
        const safe = window.location.pathname + window.location.search + "#/";
        window.history.replaceState({}, "", safe);
        lastHash = "#/";
        applyRoute(parseHash(), { focusComposer: false });
        holdGatedProject(initial.project, null);
      } else {
        applyRoute(initial, { focusComposer: false });
      }
    }
  }

  window.WorkspaceApp = {
    navigate: navigate,
    startNewChat: startNewChat,
    askInChat: askInChat,
    projectHrefForId: projectHrefForId,
    state: workspaceState,
    PROJECT_ROUTES: PROJECT_ROUTES,
    PROJECT_ID_TO_SLUG: PROJECT_ID_TO_SLUG,
    NAV_LABELS: NAV_LABELS,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
