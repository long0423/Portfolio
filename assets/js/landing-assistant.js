/**
 * ChatGPT-native landing interactions for Me.html
 * Local keyword-matched responses via PortfolioKnowledge — no LLM API.
 * All conversational entry points share one Chat workspace + chatState.
 */
(function () {
  "use strict";

  const PK = window.PortfolioKnowledge;
  if (!PK) {
    console.error("PortfolioKnowledge is required");
    return;
  }

  const CHAT_STORAGE_KEY = "laChatState";
  const PROMPTS = {
    approach: "How does Long approach AI product design?",
    about: "Tell me about Long.",
    work: "Show me Long’s selected work.",
  };

  const shell = document.getElementById("la-shell");
  const home = document.getElementById("la-home");
  const conversation = document.getElementById("la-conversation");
  const chatEmpty = document.getElementById("la-chat-empty");
  const chatHeading = document.getElementById("la-chat-heading");
  const thread = document.getElementById("la-thread");
  const form = document.getElementById("la-composer-form");
  const formConv = document.getElementById("la-composer-form-conv");
  const formEmpty = document.getElementById("la-composer-form-empty");
  const input = document.getElementById("la-input");
  const inputConv = document.getElementById("la-input-conv");
  const inputEmpty = document.getElementById("la-input-empty");
  const sendBtn = document.getElementById("la-send");
  const sendBtnConv = document.getElementById("la-send-conv");
  const sendBtnEmpty = document.getElementById("la-send-empty");
  const suggestions = document.getElementById("la-suggestions");
  const suggestionsWrap = document.getElementById("la-suggestions-wrap");
  const chatSuggestions = document.getElementById("la-chat-suggestions");
  const chatSuggestionsWrap = document.getElementById("la-chat-suggestions-wrap");
  const featured = document.getElementById("la-featured-grid");
  const featuredWrap = document.getElementById("la-featured-wrap");
  const workList = document.getElementById("la-work-list");
  const hscrollInstances = [];
  const menuBtn = document.getElementById("la-menu-btn");
  const backdrop = document.getElementById("la-backdrop");
  const newChatBtn = document.getElementById("la-new-chat");
  const sidebarNewChat = document.getElementById("la-nav-new-chat");
  const collapseBtn = document.getElementById("la-sidebar-collapse");
  const topicPopup = document.getElementById("la-topic-popup");
  const topicList = document.getElementById("la-topic-popup-list");

  const chatState = {
    messages: [],
    status: "idle",
    activeIntent: null,
    draft: "",
  };

  let busy = false;
  let topicOpen = false;
  let topicActiveIndex = -1;
  let ignoreBlurClose = false;
  let tooltipEl = null;
  let tooltipTrigger = null;
  let tooltipTimer = null;
  const TOOLTIP_SHOW_DELAY = 280;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COMPOSER_MAX_HEIGHT = 160;

  function thinkingDelay() {
    return prefersReducedMotion ? 100 : 550 + Math.floor(Math.random() * 300);
  }

  function refreshIcons() {
    if (typeof lucide !== "undefined" && lucide.createIcons) {
      lucide.createIcons({
        attrs: { "stroke-width": 1.75 },
        nameAttr: "data-lucide",
      });
    }
  }

  function bindHScrollFade(wrapEl, trackEl, leftClass, rightClass, focusSelector) {
    if (!wrapEl || !trackEl) return null;

    function update() {
      const { scrollLeft, clientWidth, scrollWidth } = trackEl;
      const hasOverflowLeft = scrollLeft > 2;
      const hasOverflowRight = scrollLeft + clientWidth < scrollWidth - 2;
      wrapEl.classList.toggle(leftClass, hasOverflowLeft);
      wrapEl.classList.toggle(rightClass, hasOverflowRight);
    }

    trackEl.addEventListener("scroll", update, { passive: true });

    trackEl.addEventListener("focusin", function (e) {
      const item = focusSelector ? e.target.closest(focusSelector) : e.target;
      if (!item || !trackEl.contains(item)) return;
      item.scrollIntoView({
        inline: "nearest",
        block: "nearest",
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
      window.requestAnimationFrame(update);
    });

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(update);
      ro.observe(trackEl);
      if (shell) ro.observe(shell);
    }

    update();
    return { update: update, wrap: wrapEl, track: trackEl };
  }

  function updateAllHScrollFades() {
    hscrollInstances.forEach(function (inst) {
      if (inst && inst.update) inst.update();
    });
  }

  function renderSuggestionList(target) {
    if (!target) return;
    target.innerHTML = PK.suggestedPrompts
      .map(
        (p) =>
          `<button type="button" class="la-tile" data-prompt="${escapeAttr(p.label)}">${escapeHtml(p.label)}</button>`
      )
      .join("");
  }

  function renderSuggestions() {
    renderSuggestionList(suggestions);
    renderSuggestionList(chatSuggestions);
    window.requestAnimationFrame(updateAllHScrollFades);
  }

  function projectHashHref(project) {
    if (window.WorkspaceApp && typeof window.WorkspaceApp.projectHrefForId === "function") {
      return window.WorkspaceApp.projectHrefForId(project.id);
    }
    return project.href;
  }

  function renderFeatured() {
    if (!featured) return;
    featured.innerHTML = PK.getFeaturedProjects()
      .map(
        (p) => `
      <a class="la-project-tile" href="${projectHashHref(p)}">
        <span class="la-project-tile__media">
          <img src="${p.thumb}" alt="" loading="lazy" />
        </span>
        <span class="la-project-tile__footer">
          <span class="la-project-tile__name">${escapeHtml(p.name)}</span>
          <i data-lucide="arrow-up-right" aria-hidden="true"></i>
        </span>
      </a>`
      )
      .join("");
    refreshIcons();
    window.requestAnimationFrame(updateAllHScrollFades);
  }

  function renderWorkNav() {
    // WorkspaceApp owns Projects list rendering in the persistent shell.
    if (window.WorkspaceApp) return;
    if (!workList) return;
    workList.innerHTML = PK.getAllProjects()
      .map(function (p) {
        const label = escapeHtml(p.shortName || p.name);
        const content = p.isRecentlyUpdated
          ? `<span class="la-work__item-label">${label}<span class="la-work__update-dot" aria-hidden="true"></span><span class="la-sr-only">Recently updated</span></span>`
          : label;
        return `<li class="la-work__item"><a href="${projectHashHref(p)}">${content}</a></li>`;
      })
      .join("");
  }

  function persistChat() {
    try {
      sessionStorage.setItem(
        CHAT_STORAGE_KEY,
        JSON.stringify({
          messages: chatState.messages,
          activeIntent: chatState.activeIntent,
        })
      );
    } catch (err) {
      /* ignore quota / private mode */
    }
  }

  function loadPersistedChat() {
    try {
      const raw = sessionStorage.getItem(CHAT_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.messages)) {
        chatState.messages = data.messages;
        chatState.activeIntent = data.activeIntent || null;
      }
    } catch (err) {
      chatState.messages = [];
    }
  }

  function clearPersistedChat() {
    try {
      sessionStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (err) {
      /* ignore */
    }
  }

  function isChatRoute() {
    return new URLSearchParams(window.location.search).get("view") === "chat";
  }

  function chatHistoryUrl(options) {
    options = options || {};
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    url.searchParams.delete("new");
    if (options.home) {
      url.searchParams.delete("view");
      url.searchParams.delete("intent");
    } else {
      url.searchParams.set("view", "chat");
      if (options.intent) url.searchParams.set("intent", options.intent);
      else url.searchParams.delete("intent");
    }
    return url.pathname + url.search + url.hash;
  }

  function setNavActive(name) {
    // WorkspaceApp owns sidebar active states in the persistent shell.
    if (window.WorkspaceApp && name !== "chat") return;

    document.querySelectorAll(".la-nav__link, .la-chat__new").forEach(function (el) {
      el.classList.remove("is-active");
      el.removeAttribute("aria-current");
    });

    const target = document.getElementById("la-nav-new-chat");
    if (target && (name === "chat" || name === "home")) {
      target.classList.add("is-active");
      target.setAttribute("aria-current", "page");
    }
  }

  /** Empty New chat state (greeting + composer + prompts + selected work). */
  function showHomeView() {
    if (!shell) return;
    hideTopicPopup();
    shell.classList.remove("is-conversation");
    shell.classList.remove("is-chat-empty");
    if (home) home.setAttribute("aria-hidden", "false");
    if (conversation) conversation.setAttribute("aria-hidden", "true");
    if (chatEmpty) chatEmpty.hidden = true;
    setNavActive("chat");
  }

  function showChatView(options) {
    options = options || {};
    if (!shell) return;
    hideTopicPopup();
    shell.classList.add("is-conversation");
    if (home) home.setAttribute("aria-hidden", "true");
    if (conversation) conversation.setAttribute("aria-hidden", "false");

    const empty = !chatState.messages.length;
    shell.classList.toggle("is-chat-empty", empty);
    if (chatEmpty) chatEmpty.hidden = !empty;

    setNavActive("chat");

    if (empty && chatHeading) {
      window.requestAnimationFrame(function () {
        chatHeading.focus({ preventScroll: true });
      });
    }
  }

  /** Called by WorkspaceApp when the chat panel becomes visible. */
  function showChatWorkspace(options) {
    options = options || {};
    if (options.reset) {
      clearChatMessages();
      [input, inputConv, inputEmpty].forEach(function (el) {
        if (el) {
          el.value = "";
          autosize(el);
        }
      });
      syncSendState(input, sendBtn);
      syncSendState(inputConv, sendBtnConv);
      syncSendState(inputEmpty, sendBtnEmpty);
    }

    if (chatState.messages.length) {
      showChatView({ nav: "chat" });
      if (!thread.children.length) restoreMessagesToThread();
      syncChatEmptyState();
    } else {
      showHomeView();
      if (options.focusComposer && input) {
        window.requestAnimationFrame(function () {
          input.focus();
        });
      }
    }
  }

  function syncChatEmptyState() {
    if (!shell || !shell.classList.contains("is-conversation")) return;
    const empty = !chatState.messages.length;
    shell.classList.toggle("is-chat-empty", empty);
    if (chatEmpty) chatEmpty.hidden = !empty;
  }

  function clearChatMessages() {
    chatState.messages = [];
    chatState.activeIntent = null;
    chatState.status = "idle";
    chatState.draft = "";
    if (thread) thread.innerHTML = "";
    clearPersistedChat();
    syncChatEmptyState();
  }

  function appendUserMessage(text) {
    const el = document.createElement("div");
    el.className = "la-msg la-msg--user";
    el.innerHTML = `<div class="la-msg__bubble">${escapeHtml(text)}</div>`;
    thread.appendChild(el);
    chatState.messages.push({ role: "user", text: text });
    persistChat();
    scrollThread();
  }

  function appendThinking() {
    const el = document.createElement("article");
    el.className = "la-msg la-msg--assistant";
    el.setAttribute("data-thinking", "true");
    el.setAttribute("aria-live", "polite");
    el.innerHTML = `
      <div class="la-msg__content">
        <p class="la-thinking-label">Thinking</p>
        <div class="la-shimmer" aria-hidden="true">
          <div class="la-shimmer__line"></div>
          <div class="la-shimmer__line"></div>
          <div class="la-shimmer__line"></div>
        </div>
      </div>`;
    thread.appendChild(el);
    scrollThread();
    return el;
  }

  function enhanceApproachHtml(html) {
    return (
      html +
      `<div class="answer-links"><a class="answer-link" href="#/approach">Explore the full design approach <i data-lucide="arrow-up-right" aria-hidden="true"></i></a></div>`
    );
  }

  function renderAssistantMessage(response, options) {
    options = options || {};
    const el = document.createElement("article");
    el.className = "la-msg la-msg--assistant";
    el.setAttribute("aria-live", "polite");

    let bodyHtml = response.html || "";
    if (options.approachLink) {
      bodyHtml = enhanceApproachHtml(bodyHtml);
    }

    let followHtml = "";
    if (response.showFollowUps) {
      const items = PK.unknownFollowUps || [];
      followHtml = `
        <div class="la-followups">
          <div class="la-tiles la-hscroll__track">
            ${items
              .map(
                (p) =>
                  `<button type="button" class="la-tile" data-prompt="${escapeAttr(p.prompt || p.label)}">${escapeHtml(p.label)}</button>`
              )
              .join("")}
          </div>
        </div>`;
    }

    el.innerHTML = `
      <div class="la-msg__content">
        ${bodyHtml}
        ${followHtml}
      </div>`;

    thread.appendChild(el);
    bindDynamicPrompts(el);
    refreshIcons();
    scrollThread();

    chatState.messages.push({
      role: "assistant",
      html: bodyHtml + followHtml,
      intent: response.intent || null,
    });
    persistChat();
    return el;
  }

  function restoreMessagesToThread() {
    if (!thread) return;
    thread.innerHTML = "";
    chatState.messages.forEach(function (msg) {
      if (msg.role === "user") {
        const el = document.createElement("div");
        el.className = "la-msg la-msg--user";
        el.innerHTML = `<div class="la-msg__bubble">${escapeHtml(msg.text || "")}</div>`;
        thread.appendChild(el);
      } else if (msg.role === "assistant") {
        const el = document.createElement("article");
        el.className = "la-msg la-msg--assistant";
        el.innerHTML = `<div class="la-msg__content">${msg.html || ""}</div>`;
        thread.appendChild(el);
        bindDynamicPrompts(el);
      }
    });
    refreshIcons();
    scrollThread();
  }

  function submitChatMessage(options) {
    options = options || {};
    const question = String(options.prompt || "").trim();
    if (!question || busy) return;

    busy = true;
    chatState.status = "thinking";
    hideTopicPopup();
    syncSendState(input, sendBtn);
    syncSendState(inputConv, sendBtnConv);
    syncSendState(inputEmpty, sendBtnEmpty);

    showChatView({ nav: options.nav || "chat" });
    syncChatEmptyState();

    appendUserMessage(question);
    syncChatEmptyState();
    const thinkingEl = appendThinking();

    window.setTimeout(function () {
      const response = PK.getResponse(question);
      if (thinkingEl && thinkingEl.parentNode) {
        thinkingEl.parentNode.removeChild(thinkingEl);
      }

      const isApproach =
        options.source === "approach-navigation" ||
        /approach ai product design/i.test(question);

      renderAssistantMessage(response, { approachLink: isApproach });
      chatState.activeIntent = response.intent || null;
      chatState.status = "idle";
      busy = false;
      syncSendState(input, sendBtn);
      syncSendState(inputConv, sendBtnConv);
      syncSendState(inputEmpty, sendBtnEmpty);
      if (inputConv) {
        autosize(inputConv);
        inputConv.blur();
      }
      const latest = thread && thread.querySelector(".la-msg--assistant:last-child");
      if (latest) {
        latest.setAttribute("tabindex", "-1");
        latest.focus({ preventScroll: true });
      }
    }, thinkingDelay());
  }

  /**
   * Shared entry into the Chat workspace.
   * @param {{prompt?: string, source?: string, resetConversation?: boolean, intent?: string, fromPopstate?: boolean, nav?: string}} options
   */
  function openChat(options) {
    options = options || {};
    const prompt = options.prompt ? String(options.prompt).trim() : "";
    const reset = !!options.resetConversation;

    if (reset) {
      clearChatMessages();
      [input, inputConv, inputEmpty].forEach(function (el) {
        if (el) {
          el.value = "";
          autosize(el);
        }
      });
    }

    if (!options.fromPopstate && !options.skipHistory && !window.WorkspaceApp) {
      window.history.pushState(
        { view: "chat", intent: options.intent || null },
        "",
        chatHistoryUrl({ intent: options.intent || null })
      );
    } else if (!options.fromPopstate && !options.skipHistory && window.WorkspaceApp) {
      if ((window.location.hash || "#/") !== "#/" && (window.location.hash || "") !== "#") {
        window.location.hash = "/";
      }
    }

    closeDrawer();

    if (prompt) {
      showChatView({ nav: options.nav || "chat" });
      submitChatMessage({
        prompt: prompt,
        source: options.source,
        nav: options.nav || "chat",
      });
      return;
    }

    // Empty chat / restore — empty state uses the New chat home surface
    if (chatState.messages.length) {
      showChatView({ nav: "chat" });
      if (!thread.children.length) restoreMessagesToThread();
      syncChatEmptyState();
    } else {
      showHomeView();
      if (input) {
        autosize(input);
        input.focus();
      }
    }
  }

  function openHome(options) {
    options = options || {};
    if (!options.fromPopstate && !options.skipHistory && !window.WorkspaceApp) {
      window.history.pushState({ view: "home" }, "", chatHistoryUrl({ home: true }));
    }
    clearChatMessages();
    [input, inputConv, inputEmpty].forEach(function (el) {
      if (el) {
        el.value = "";
        autosize(el);
      }
    });
    showHomeView();
    closeDrawer();
    if (input) input.focus();
  }

  function renderTopicPopup() {
    if (!topicList || !PK.topicSuggestions) return;
    topicList.innerHTML = PK.topicSuggestions
      .map(
        (t, i) => `
      <button
        type="button"
        class="la-topic-item"
        role="option"
        id="la-topic-item-${i}"
        data-topic-prompt="${escapeAttr(t.prompt)}"
        aria-label="${escapeAttr(t.label)}: ${escapeAttr(t.prompt)}"
      >${escapeHtml(t.label)}</button>`
      )
      .join("");

    topicList.querySelectorAll(".la-topic-item").forEach(function (btn) {
      btn.addEventListener("mousedown", function (e) {
        e.preventDefault();
      });
      btn.addEventListener("click", function () {
        const prompt = btn.getAttribute("data-topic-prompt");
        hideTopicPopup();
        if (prompt) submitChatMessage({ prompt: prompt, source: "topic-popup" });
      });
    });
  }

  function canShowTopicPopup() {
    return (
      shell &&
      shell.classList.contains("is-conversation") &&
      !shell.classList.contains("is-chat-empty") &&
      !busy &&
      inputConv &&
      !inputConv.value.trim()
    );
  }

  function showTopicPopup() {
    if (!topicPopup || !canShowTopicPopup()) return;
    topicPopup.hidden = false;
    topicOpen = true;
    topicActiveIndex = -1;
    updateTopicActive();
    if (inputConv) {
      inputConv.setAttribute("aria-expanded", "true");
    }
  }

  function hideTopicPopup() {
    if (!topicPopup) return;
    topicPopup.hidden = true;
    topicOpen = false;
    topicActiveIndex = -1;
    updateTopicActive();
    if (inputConv) {
      inputConv.setAttribute("aria-expanded", "false");
      inputConv.removeAttribute("aria-activedescendant");
    }
  }

  function updateTopicActive() {
    if (!topicList) return;
    const items = topicList.querySelectorAll(".la-topic-item");
    items.forEach(function (item, i) {
      const active = i === topicActiveIndex;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", active ? "true" : "false");
      if (active && inputConv) {
        inputConv.setAttribute("aria-activedescendant", item.id);
        item.scrollIntoView({ block: "nearest" });
      }
    });
  }

  function moveTopicActive(delta) {
    if (!topicList || !topicOpen) return;
    const items = topicList.querySelectorAll(".la-topic-item");
    if (!items.length) return;
    if (topicActiveIndex < 0) {
      topicActiveIndex = delta > 0 ? 0 : items.length - 1;
    } else {
      topicActiveIndex = (topicActiveIndex + delta + items.length) % items.length;
    }
    updateTopicActive();
  }

  function selectTopicActive() {
    if (!topicList || topicActiveIndex < 0) return;
    const items = topicList.querySelectorAll(".la-topic-item");
    const item = items[topicActiveIndex];
    if (item) item.click();
  }

  function bindTopicPopup() {
    if (!inputConv || !topicPopup) return;

    renderTopicPopup();

    inputConv.addEventListener("focus", function () {
      if (canShowTopicPopup()) showTopicPopup();
    });

    inputConv.addEventListener("input", function () {
      autosize(inputConv);
      syncSendState(inputConv, sendBtnConv);
      if (inputConv.value.trim()) {
        hideTopicPopup();
      } else if (canShowTopicPopup() && document.activeElement === inputConv) {
        showTopicPopup();
      }
    });

    inputConv.addEventListener("keydown", function (e) {
      if (!topicOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveTopicActive(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        moveTopicActive(-1);
      } else if (e.key === "Enter" && topicActiveIndex >= 0 && !e.shiftKey) {
        e.preventDefault();
        selectTopicActive();
      } else if (e.key === "Escape") {
        e.preventDefault();
        hideTopicPopup();
      }
    });

    inputConv.addEventListener("blur", function () {
      window.setTimeout(function () {
        if (ignoreBlurClose) {
          ignoreBlurClose = false;
          return;
        }
        if (topicPopup.contains(document.activeElement)) return;
        hideTopicPopup();
      }, 0);
    });

    topicPopup.addEventListener("mousedown", function () {
      ignoreBlurClose = true;
    });

    document.addEventListener("mousedown", function (e) {
      if (!topicOpen) return;
      if (topicPopup.contains(e.target) || e.target === inputConv) return;
      hideTopicPopup();
    });
  }

  function autosize(el) {
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(Math.max(el.scrollHeight, 24), COMPOSER_MAX_HEIGHT);
    el.style.height = next + "px";
    const formEl = el.closest(".la-composer");
    if (formEl) {
      formEl.classList.toggle("is-multiline", next > 28);
    }
  }

  function syncSendState(textarea, button) {
    if (!textarea || !button) return;
    const has = textarea.value.trim().length > 0 && !busy;
    button.classList.toggle("is-enabled", has);
    button.disabled = !has;
  }

  function bindComposer(textarea, button, formEl, options) {
    if (!textarea || !button || !formEl) return;
    const mode = (options && options.mode) || "followup";

    textarea.addEventListener("input", function () {
      autosize(textarea);
      syncSendState(textarea, button);
    });

    textarea.addEventListener("keydown", function (e) {
      if (mode === "followup" && topicOpen && topicActiveIndex >= 0 && e.key === "Enter" && !e.shiftKey) {
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (textarea.value.trim() && !busy) formEl.requestSubmit();
      }
    });

    formEl.addEventListener("submit", function (e) {
      e.preventDefault();
      const q = textarea.value.trim();
      if (!q || busy) return;
      textarea.value = "";
      autosize(textarea);
      syncSendState(textarea, button);
      hideTopicPopup();

      if (mode === "home") {
        openChat({
          prompt: q,
          source: "homepage-composer",
          resetConversation: true,
        });
      } else if (mode === "empty") {
        submitChatMessage({ prompt: q, source: "chat-empty-composer" });
      } else {
        submitChatMessage({ prompt: q, source: "chat-followup" });
      }
    });
  }

  function scrollThread() {
    const chatPanel = document.getElementById("ws-panel-chat");
    if (chatPanel && !chatPanel.hidden) {
      chatPanel.scrollTop = chatPanel.scrollHeight;
      return;
    }
    if (!thread) return;
    thread.scrollTop = thread.scrollHeight;
  }

  function bindDynamicPrompts(root) {
    (root || document).querySelectorAll("[data-prompt]").forEach(function (node) {
      if (node._laBound) return;
      node._laBound = true;
      node.addEventListener("click", function (e) {
        e.preventDefault();
        const q = node.getAttribute("data-prompt");
        if (!q) return;
        closeDrawer();
        if (shell && shell.classList.contains("is-conversation") && chatState.messages.length) {
          submitChatMessage({ prompt: q, source: "followup-prompt" });
        } else {
          openChat({
            prompt: q,
            source: "homepage-prompt",
            resetConversation: true,
          });
        }
      });
    });
  }

  function syncBackdrop() {
    if (!backdrop) return;
    const open = document.body.classList.contains("la-drawer-open");
    backdrop.hidden = !open;
    backdrop.setAttribute("aria-hidden", open ? "false" : "true");
  }

  function openDrawer() {
    document.body.classList.add("la-drawer-open");
    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", "true");
      menuBtn.setAttribute("aria-label", "Close navigation menu");
      menuBtn.setAttribute("title", "Close menu");
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
    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", "false");
      menuBtn.setAttribute("aria-label", "Open navigation menu");
      menuBtn.setAttribute("title", "Menu");
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

  function toggleSidebarCollapse() {
    const collapsed = document.body.classList.toggle("la-sidebar-collapsed");
    hideSidebarTooltip();
    if (collapseBtn) {
      collapseBtn.setAttribute(
        "aria-label",
        collapsed ? "Expand sidebar" : "Collapse sidebar"
      );
      collapseBtn.setAttribute(
        "title",
        collapsed ? "Expand sidebar" : "Collapse sidebar"
      );
      collapseBtn.setAttribute(
        "data-tooltip",
        collapsed ? "Expand sidebar" : "Collapse sidebar"
      );
      const icon = collapseBtn.querySelector("[data-lucide]");
      if (icon) {
        icon.setAttribute("data-lucide", collapsed ? "panel-left-open" : "panel-left-close");
        refreshIcons();
      }
    }
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(updateAllHScrollFades);
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  function announce(message) {
    let live = document.getElementById("la-chat-live");
    if (!live) {
      live = document.createElement("div");
      live.id = "la-chat-live";
      live.className = "la-sr-only";
      live.setAttribute("aria-live", "polite");
      live.setAttribute("aria-atomic", "true");
      document.body.appendChild(live);
    }
    live.textContent = "";
    window.setTimeout(function () {
      live.textContent = message;
    }, 40);
  }

  function isDesktopCollapsed() {
    return (
      window.matchMedia("(min-width: 901px)").matches &&
      document.body.classList.contains("la-sidebar-collapsed")
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

  function hideSidebarTooltip() {
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

  function showSidebarTooltip(trigger) {
    if (!isDesktopCollapsed() || !trigger) return;
    const label = trigger.getAttribute("data-tooltip");
    if (!label) return;
    hideSidebarTooltip();
    tooltipTrigger = trigger;
    const el = ensureTooltipEl();
    el.textContent = label;
    trigger.setAttribute("aria-describedby", "la-sidebar-tooltip");
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
    document.querySelectorAll("[data-tooltip]").forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        if (!isDesktopCollapsed()) return;
        if (tooltipTimer) window.clearTimeout(tooltipTimer);
        tooltipTimer = window.setTimeout(function () {
          showSidebarTooltip(el);
        }, TOOLTIP_SHOW_DELAY);
      });
      el.addEventListener("mouseleave", hideSidebarTooltip);
      el.addEventListener("focus", function () {
        if (!isDesktopCollapsed()) return;
        showSidebarTooltip(el);
      });
      el.addEventListener("blur", hideSidebarTooltip);
    });
  }

  function startNewChat(options) {
    options = options || {};
    openChat({
      source: "new-chat",
      resetConversation: true,
      skipHistory: !!options.skipHistory || !!window.WorkspaceApp,
    });
    announce("Conversation cleared. New chat started.");
  }

  function applyRouteFromLocation(fromPopstate) {
    // Persistent shell: WorkspaceApp owns hash routing.
    if (window.WorkspaceApp) {
      if (chatState.messages.length) {
        showChatView({ nav: "chat" });
        if (!thread.children.length) restoreMessagesToThread();
        syncChatEmptyState();
      } else {
        showHomeView();
      }
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const view = params.get("view");
    const intent = params.get("intent");
    const q = params.get("q");

    if (view === "chat") {
      const forceNew = params.get("new") === "1";
      if (intent === "approach") {
        openChat({
          prompt: PROMPTS.approach,
          source: "approach-navigation",
          intent: "approach",
          resetConversation: true,
          fromPopstate: fromPopstate,
        });
      } else if (intent === "about") {
        openChat({
          prompt: PROMPTS.about,
          source: "about-navigation",
          intent: "about",
          resetConversation: true,
          fromPopstate: fromPopstate,
        });
      } else if (intent === "work") {
        openChat({
          prompt: PROMPTS.work,
          source: "work-navigation",
          intent: "work",
          resetConversation: true,
          fromPopstate: fromPopstate,
        });
      } else if (q) {
        openChat({
          prompt: q,
          source: "query-param",
          resetConversation: true,
          fromPopstate: fromPopstate,
        });
      } else {
        openChat({
          fromPopstate: fromPopstate,
          resetConversation: forceNew,
        });
        if (forceNew) {
          window.history.replaceState({ view: "chat" }, "", chatHistoryUrl({}));
        }
      }
      return;
    }

    if (view === "approach") {
      openChat({
        prompt: PROMPTS.approach,
        source: "approach-navigation",
        intent: "approach",
        resetConversation: true,
        fromPopstate: fromPopstate,
      });
      return;
    }

    if (q) {
      openChat({
        prompt: q,
        source: "query-param",
        resetConversation: true,
        fromPopstate: fromPopstate,
      });
      return;
    }

    showHomeView();
  }

  function init() {
    loadPersistedChat();
    renderSuggestions();
    renderFeatured();
    renderWorkNav();
    bindComposer(input, sendBtn, form, { mode: "home" });
    bindComposer(inputConv, sendBtnConv, formConv, { mode: "followup" });
    bindComposer(inputEmpty, sendBtnEmpty, formEmpty, { mode: "empty" });
    bindTopicPopup();

    const promptScroll = bindHScrollFade(
      suggestionsWrap,
      suggestions,
      "has-overflow-left",
      "has-overflow-right",
      ".la-tile"
    );
    const chatPromptScroll = bindHScrollFade(
      chatSuggestionsWrap,
      chatSuggestions,
      "has-overflow-left",
      "has-overflow-right",
      ".la-tile"
    );
    const workScroll = bindHScrollFade(
      featuredWrap,
      featured,
      "has-work-overflow-left",
      "has-work-overflow-right",
      ".la-project-tile"
    );
    if (promptScroll) hscrollInstances.push(promptScroll);
    if (chatPromptScroll) hscrollInstances.push(chatPromptScroll);
    if (workScroll) hscrollInstances.push(workScroll);
    window.addEventListener("resize", updateAllHScrollFades);

    bindDynamicPrompts(document);
    refreshIcons();
    if (input) autosize(input);
    if (inputConv) autosize(inputConv);
    if (inputEmpty) autosize(inputEmpty);

    const shellOwnsChrome = !!document.getElementById("ws-panel-chat");

    if (!shellOwnsChrome) {
      if (menuBtn) menuBtn.addEventListener("click", toggleDrawer);
      if (backdrop) backdrop.addEventListener("click", closeDrawer);
      if (collapseBtn) {
        collapseBtn.setAttribute("data-tooltip", "Collapse sidebar");
        collapseBtn.addEventListener("click", toggleSidebarCollapse);
      }
    }

    document.querySelectorAll(".la-nav__link[title], .la-chat__new[title]").forEach(function (el) {
      if (!el.getAttribute("data-tooltip") && el.getAttribute("title")) {
        el.setAttribute("data-tooltip", el.getAttribute("title"));
      }
    });
    bindSidebarTooltips();

    if (newChatBtn) {
      newChatBtn.addEventListener("click", function () {
        if (window.WorkspaceApp && typeof window.WorkspaceApp.startNewChat === "function") {
          window.WorkspaceApp.startNewChat();
        } else {
          startNewChat();
        }
      });
    }
    if (sidebarNewChat && !shellOwnsChrome) {
      sidebarNewChat.addEventListener("click", function (e) {
        e.preventDefault();
        startNewChat();
      });
    }

    if (!shellOwnsChrome) {
      document.querySelectorAll("[data-la-about]").forEach(function (el) {
        el.addEventListener("click", function (e) {
          e.preventDefault();
          openChat({
            prompt: PROMPTS.about,
            source: "about-navigation",
            intent: "about",
            resetConversation: true,
          });
        });
      });

      document.querySelectorAll("[data-la-approach]").forEach(function (el) {
        el.addEventListener("click", function (e) {
          e.preventDefault();
          openChat({
            prompt: PROMPTS.approach,
            source: "approach-navigation",
            intent: "approach",
            resetConversation: true,
          });
        });
      });

      document.querySelectorAll("[data-la-work]").forEach(function (el) {
        el.addEventListener("click", function (e) {
          if (document.body.classList.contains("la-case-study-page")) return;
          e.preventDefault();
          openChat({
            prompt: PROMPTS.work,
            source: "work-navigation",
            intent: "work",
            resetConversation: true,
          });
        });
      });

      document.querySelectorAll("[data-la-home]").forEach(function (el) {
        el.addEventListener("click", function (e) {
          e.preventDefault();
          openHome();
        });
      });

      window.addEventListener("popstate", function () {
        applyRouteFromLocation(true);
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (topicOpen) {
          hideTopicPopup();
          return;
        }
        if (!shellOwnsChrome) closeDrawer();
      }
    });

    syncBackdrop();
    syncSendState(input, sendBtn);
    syncSendState(inputConv, sendBtnConv);
    syncSendState(inputEmpty, sendBtnEmpty);

    applyRouteFromLocation(true);
  }

  window.LandingAssistant = {
    openChat: openChat,
    submitChatMessage: submitChatMessage,
    startNewChat: startNewChat,
    showChatWorkspace: showChatWorkspace,
    showHomeView: showHomeView,
    chatState: chatState,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
