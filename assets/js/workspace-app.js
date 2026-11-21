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

  const LAB_PROJECTS = PK && typeof PK.getLabProjects === "function" ? PK.getLabProjects() : [];
  LAB_PROJECTS.forEach(function (p) {
    PROJECT_ROUTES[p.slug] = {
      id: p.id,
      file: p.file,
      label: p.name,
      frameTitle: p.name + (p.concept ? " concept overview" : " case study"),
    };
    PROJECT_ID_TO_SLUG[p.id] = p.slug;
    NAV_LABELS[p.id] = p.displayTitle || p.name;
  });

  function experienceHtml() {
    return PK && PK.experienceHtml ? PK.experienceHtml() : "";
  }

  function labName(p) {
    return p.displayTitle || p.name;
  }

  function labsLibraryHtml() {
    if (!LAB_PROJECTS.length || !PK.projectCardHtml) return "";
    return (
      '<p class="ws-detail__lead">Personal products and experiments outside professional work. Watch Face Layout Studio is built and tested (v0.1.0) in a private repository. Garmin Health Companion is a private exploration, and the other two are concepts. None is publicly released.</p>' +
      '<div class="la-project-cards">' +
      LAB_PROJECTS.map(PK.projectCardHtml).join("") +
      "</div>"
    );
  }

  const LIBRARY_SECTIONS = [
    {
      id: "about",
      title: "About",
      icon: "user-round",
      get html() {
        return `
        <p class="ws-detail__lead">Long Geng is an AI product designer with ${experienceHtml()} across product design and front-end development. He leads design for enterprise AI products at PwC Australia’s AI Centre of Excellence.</p>
        <ul class="ws-detail__list">
          <li><strong>Focus:</strong> AI products where people stay in control — tax advice drafting, regulatory assurance and agent workspaces.</li>
          <li><strong>How he works:</strong> AI-first and prototype-first, increasingly hands-on in code, and close to engineering until the details ship.</li>
          <li><strong>Outside work:</strong> Independent Labs — small products and concepts, including a watch-face layout tool he built.</li>
          <li><strong>Based in:</strong> Melbourne</li>
        </ul>`;
      },
      related: [
        { label: "What makes Long a strong AI product designer?", prompt: "What makes Long a strong AI product designer?" },
        { label: "Tell me about Long’s background", prompt: "Tell me about Long’s background and experience." },
      ],
    },
    {
      id: "experience",
      title: "Experience",
      icon: "briefcase",
      html: `
        <p class="ws-detail__lead">Product design and front-end development, most recently leading AI product design at PwC Australia.</p>
        <ul class="ws-detail__list">
          <li><strong>2020 – now · UX/UI &amp; AI Product Design Lead, PwC Australia (AI Centre of Excellence).</strong> Design lead on Tax Advice AI, Regulatory Pathfinder and AgentOS; redesigned the Enterprise AI Design System. Also ChatPwC, M&amp;A Path (UX/UI lead and front-end), Engagement Pulse and Digital Customer Blueprint.</li>
          <li><strong>2022 · UX/UI Bootcamp Tutor, Monash University</strong> (part-time).</li>
          <li><strong>2017 – 2020 · Front End Developer &amp; Product Designer, Desert Software.</strong> Product design and React front-end work.</li>
          <li><strong>2016 – 2017 · Web Developer &amp; UX/UI Designer</strong> at Umbrella Dementia Cafes and Shengxiao Machinery.</li>
          <li><strong>Education:</strong> Master of Information Technology, Monash University (2015 – 2017).</li>
        </ul>`,
      related: [
        { label: "What AI products has he designed?", prompt: "What AI products has Long designed?" },
        { label: "How hands-on is he with code?", prompt: "How hands-on is Long with prototyping and code?" },
      ],
    },
    {
      id: "ai-capabilities",
      title: "AI capabilities",
      icon: "sparkles",
      html: `
        <p class="ws-detail__lead">Capabilities shown in the case studies, where AI is part of the workflow rather than a feature on the side.</p>
        <ul class="ws-detail__list">
          <li><strong>Agent experience:</strong> Agent workspaces and sidebars, and multi-agent runs that show the outcome first with each agent’s activity on demand.</li>
          <li><strong>Human in the loop:</strong> Suggestions beside the original value, editable drafts, and explicit accept, confirm or override.</li>
          <li><strong>Evidence and review:</strong> Citations, sources and review state kept with the output, so it can be checked before it is used.</li>
          <li><strong>Progressive disclosure:</strong> Dense workflows that stay readable — essentials first, detail when it is needed.</li>
          <li><strong>AI-native patterns:</strong> Prompt composers, agent states, citations, loading, permission and recovery states as shared components.</li>
          <li><strong>AI-assisted delivery:</strong> Working prototypes early, tested against real scenarios, then focused changes validated in code for review.</li>
        </ul>`,
      related: [
        { label: "How does he design trustworthy AI?", prompt: "How does he design trustworthy human–AI interactions?" },
        { label: "What is his AI-first approach?", prompt: "What is Long’s AI-first approach?" },
        { label: "How did he build an AI-native design system?", prompt: "How did Long build an AI-native design system?" },
      ],
    },
    {
      id: "skills",
      title: "Skills and tools",
      icon: "wrench",
      html: `
        <p class="ws-detail__lead">Product design with enough engineering to prototype, build and review in code.</p>
        <ul class="ws-detail__list">
          <li><strong>Product and interaction design:</strong> Interaction models, information architecture and complex workflows, in Figma and, earlier, Sketch.</li>
          <li><strong>Research and validation:</strong> Interviews, journey maps, competitor analysis and usability testing.</li>
          <li><strong>Design systems:</strong> Component states and patterns, built on and extending enterprise design systems.</li>
          <li><strong>Front-end:</strong> HTML, CSS, JavaScript and React — building pages and fixing UI issues alongside developers.</li>
          <li><strong>AI-assisted development:</strong> Cursor to build working prototypes and make focused UI changes in code for review.</li>
          <li><strong>Data visualisation:</strong> Dashboards and charts for deals, surveys and engagement results.</li>
        </ul>`,
      related: [
        { label: "How hands-on is he with code?", prompt: "How hands-on is Long with prototyping and code?" },
        { label: "How does he collaborate with teams?", prompt: "How does he collaborate with product and engineering teams?" },
      ],
    },
    {
      id: "impact",
      title: "Selected impact",
      icon: "target",
      html: `
        <p class="ws-detail__lead">Impact is described by what changed in each workflow, from the case studies.</p>
        <ul class="ws-detail__list">
          <li><strong>Tax Advice AI:</strong> A limited editor redesigned into an agent-enabled drafting and review workspace, delivered in phased milestones.</li>
          <li><strong>Regulatory Pathfinder:</strong> AI help placed on the control, the test plan and the review, so a suggestion never overwrites the record.</li>
          <li><strong>AgentOS:</strong> A three-panel workspace for agents, conversation and artefacts, and an outcome-first view of multi-agent runs shown in a prototype demo.</li>
          <li>
            <strong>Enterprise AI Design System:</strong> AI-specific interaction patterns standardised across several AI products, beyond a visual refresh.
            <br /><a href="#/project/ai-design-system" data-ws-nav="#/project/ai-design-system">View project</a>
          </li>
          <li><strong>M&amp;A Path:</strong> One deals workflow application for data, workplans and collaboration, with pages he coded in React.</li>
        </ul>`,
      related: [
        { label: "Which case study should I review first?", prompt: "Which case study should I review first?" },
        { label: "What AI products has he designed?", prompt: "What AI products has Long designed?" },
      ],
    },
  ];

  if (LAB_PROJECTS.length) {
    LIBRARY_SECTIONS.push({
      id: "independent-labs",
      title: "Independent Labs",
      icon: "flask-conical",
      html: labsLibraryHtml(),
      related: [
        { label: "Tell me about " + labName(LAB_PROJECTS[0]), prompt: "Tell me about " + labName(LAB_PROJECTS[0]) },
        { label: "What are Long\u2019s independent labs?", prompt: "What are Long\u2019s independent labs?" },
      ],
    });
  }

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
      if (meta && !olderNavOpen && isOlderNavProject(meta.id)) setOlderNavOpen(true);
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
    const current = frameEl.getAttribute("data-route-src") || frameEl.getAttribute("src") || "";
    frameEl.setAttribute("title", title || "Workspace content");
    if (current !== src) {
      frameEl.setAttribute("data-route-src", src);
      // Changing src would add the frame's own history entry, so Back would move the
      // frame without changing the route. Replace the frame location instead.
      let replaced = false;
      if (current && frameEl.contentWindow) {
        try {
          frameEl.contentWindow.location.replace(new URL(src, window.location.href).href);
          replaced = true;
        } catch (e) {
          /* fall back to src */
        }
      }
      if (!replaced) frameEl.setAttribute("src", src);
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
      const join = meta.file.indexOf("?") === -1 ? "?" : "&";
      showFrameWorkspace(meta.file + join + "embed=1" + section, meta.frameTitle || meta.label + " case study", {
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
    if (p.displayTitle) return p.displayTitle;
    if (compact && (p.shortTitle || (p.shortName && p.name && p.shortName !== p.name))) {
      return p.shortTitle || p.shortName;
    }
    return NAV_LABELS[p.id] || p.name || p.shortName;
  }

  function renderProjectsNav() {
    const workList = document.getElementById("la-work-list");
    if (!workList || !PK) return;
    const item = function (p) {
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
    };
    workList.innerHTML = projectsNavHtml(item, "sidebar");
  }

  /*
   * Projects navigation shared by the sidebar and the collapsed-sidebar flyout:
   * key professional projects, then an "Earlier Work" group (registry entries
   * flagged navOlder) revealed by a Show more / Show less control that sits
   * after it, then the Independent Labs group. Disclosure state lives for the
   * browser session so in-app navigation keeps the user's choice.
   */
  const OLDER_NAV_KEY = "laProjectsOlderOpen";
  const OLDER_NAV_CHEVRON =
    '<svg class="la-work__more-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg>';
  let olderNavOpen = false;
  try {
    olderNavOpen = sessionStorage.getItem(OLDER_NAV_KEY) === "1";
  } catch (e) {}

  function isOlderNavProject(id) {
    const p = PK && typeof PK.getProjectById === "function" ? PK.getProjectById(id) : null;
    return !!(p && p.navOlder);
  }

  function projectsNavHtml(item, scope) {
    const professional = PK.getAllProjects();
    const key = professional.filter(function (p) {
      return !p.navOlder;
    });
    const older = professional.filter(function (p) {
      return p.navOlder;
    });
    const listId = "la-work-older-" + scope;
    let html = key.map(item).join("");
    if (older.length) {
      html +=
        '<li class="la-work__older" role="none"><ul class="la-work__older-list" id="' +
        listId +
        '" aria-labelledby="' +
        listId +
        '-label"' +
        (olderNavOpen ? "" : " hidden") +
        '><li class="la-work__subgroup" role="presentation"><span class="la-work__label" id="' +
        listId +
        '-label">Earlier Work</span></li>' +
        older.map(item).join("") +
        '</ul></li><li class="la-work__more" role="none"><button type="button" class="la-work__more-btn" data-projects-older-toggle aria-expanded="' +
        olderNavOpen +
        '" aria-controls="' +
        listId +
        '"><span class="la-work__more-text">' +
        (olderNavOpen ? "Show less" : "Show more") +
        "</span>" +
        OLDER_NAV_CHEVRON +
        "</button></li>";
    }
    if (LAB_PROJECTS.length) {
      html +=
        '<li class="la-work__group" role="presentation"><span class="la-work__label">Independent Labs</span></li>' +
        LAB_PROJECTS.map(item).join("");
    }
    return html;
  }

  function setOlderNavOpen(open) {
    olderNavOpen = !!open;
    try {
      sessionStorage.setItem(OLDER_NAV_KEY, olderNavOpen ? "1" : "0");
    } catch (e) {}
    document.querySelectorAll("[data-projects-older-toggle]").forEach(function (btn) {
      btn.setAttribute("aria-expanded", String(olderNavOpen));
      const text = btn.querySelector(".la-work__more-text");
      if (text) text.textContent = olderNavOpen ? "Show less" : "Show more";
      const list = document.getElementById(btn.getAttribute("aria-controls"));
      if (list) list.hidden = !olderNavOpen;
    });
    if (flyoutOpen) positionFlyout();
  }

  function bindOlderNavToggle() {
    document.addEventListener("click", function (e) {
      const btn = e.target.closest && e.target.closest("[data-projects-older-toggle]");
      if (!btn) return;
      e.preventDefault();
      setOlderNavOpen(!olderNavOpen);
    });
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
    const item = function (p) {
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
    };
    list.innerHTML = projectsNavHtml(item, "flyout");
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
        document.body.classList.add("la-sidebar-motion");
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
    bindOlderNavToggle();
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
