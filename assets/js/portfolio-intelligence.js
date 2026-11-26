/**
 * Portfolio Intelligence, phase 1.
 * Routes known prompts and project navigation without a model.
 * A live model is optional and loopback-only; this file has no API key.
 * Analytics events store categories, never the visitor's prompt text.
 */
(function (factory) {
  var api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.PortfolioIntelligence = api.attach(window);
})(function () {
  var BOUNDARY =
    "I can help you explore Long's work, experience, skills and projects. What would you like to know?";
  var STORAGE_KEY = "pi-events";
  var MAX_EVENTS = 80;
  var MODEL_URL = "http://127.0.0.1:8788/ask";
  var PUBLIC_MODEL_URL = "https://portfolio-ai.michaelgeng0423.workers.dev/ask";
  var HEALTH_URL = "http://127.0.0.1:8788/health";
  var MODEL_TIMEOUT_MS = 12000;
  var PRODUCTION_AI_ENABLED = false;
  var TURNSTILE_SITE_KEY = "0x4AAAAAAGTISoFr1WIJ4fa5";
  var TURNSTILE_ACTION = "portfolio-ai";
  var TURNSTILE_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  var AI_DISCLOSURE = "AI-generated \u00b7 Based on public portfolio information";
  var AI_BEFORE_NOTE = "AI responses use public portfolio information. Avoid sharing confidential details.";
  var GENERIC_HELP = "I can help you explore Long's work, experience, skills and projects. What would you like to know?";
  var CURATED_FOLLOW_UP = "This follow-up uses the curated portfolio response.";
  var PRIVACY_NOTE = "This answer is AI-generated from published portfolio information. Please don't include confidential details. Responses can be imperfect.";
  var QUOTA_NOTE = "The model quota is exhausted, so this answer uses the curated portfolio responses.";
  var DAY_NOTE = "Today's assistant capacity is used up, so this answer uses the curated portfolio responses.";
  var UNAVAILABLE_NOTE = "The assistant is unavailable right now, so this answer uses the curated portfolio responses.";
  var VERIFY_NOTE = "This message could not be verified, so this answer uses the curated portfolio responses.";
  var TIMEOUT_NOTE = "The assistant took too long, so this answer uses the curated portfolio responses.";
  var NETWORK_NOTE = "The assistant could not be reached, so this answer uses the curated portfolio responses.";

  var FIXTURE = {
    visits: [12, 18, 9, 15, 22, 17, 14],
    projects: [
      ["Regulatory Pathfinder", 20],
      ["AgentOS", 14],
      ["Tax Advice AI", 11],
    ],
    categories: [
      ["AI Design", 9],
      ["Project Access", 6],
      ["Experience", 4],
    ],
    previews: 18,
    accessRequests: 3,
    newChats: 7,
  };

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[–—]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeHtml(text) {
    return String(text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function loopbackHost(hostname) {
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
  }

  function endpointFor(backend) {
    return backend === "public" ? PUBLIC_MODEL_URL : MODEL_URL;
  }

  function stripDisplayNotes(text) {
    return String(text || "")
      .replace(/AI-generated\s*·\s*Based on public portfolio information/gi, " ")
      .replace(/This answer is AI-generated from published portfolio information\. Please don't include confidential details\. Responses can be imperfect\./gi, " ")
      .replace(/Please don't include confidential details\./gi, " ")
      .replace(/AI responses use public portfolio information\. Avoid sharing confidential details\./gi, " ")
      .replace(/This follow-up uses the curated portfolio response\./gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isGenericNonAnswer(text) {
    return normalize(stripDisplayNotes(text)) === normalize(GENERIC_HELP);
  }

  function conversationalText(result) {
    var source = result && result.contextText != null ? result.contextText : String((result && result.html) || "").replace(/<[^>]*>/g, " ");
    return stripDisplayNotes(source).slice(0, 400);
  }

  function pushTurn(turns, question, result, onDomain) {
    var next = (turns || []).slice();
    var plain = conversationalText(result);
    if (!plain || isGenericNonAnswer(plain)) return next;
    next.push({ q: String(question || "").slice(0, 400), a: plain, onDomain: !!onDomain });
    if (next.length > 2) next.shift();
    return next;
  }

  function priorMessages(turns) {
    var prior = [];
    (turns || []).forEach(function (turn) {
      prior.push({ role: "user", text: turn.q });
      prior.push({ role: "assistant", text: turn.a });
    });
    return prior.slice(-4);
  }

  function publicAskBody(question, prior, token) {
    return {
      question: String(question || "").slice(0, 800),
      prior: (prior || []).slice(-4),
      turnstile: String(token || ""),
    };
  }

  function loadTurnstile(target) {
    if (target.turnstile && typeof target.turnstile.render === "function") return Promise.resolve();
    var doc = target.document;
    if (!doc || typeof doc.createElement !== "function" || typeof doc.querySelector !== "function") return Promise.resolve();
    var existing = doc.querySelector("script[data-pi-turnstile]");
    if (existing) {
      return new Promise(function (resolve) {
        if (target.turnstile) resolve();
        else existing.addEventListener("load", function () { resolve(); });
      });
    }
    return new Promise(function (resolve) {
      var script = doc.createElement("script");
      script.src = TURNSTILE_SCRIPT;
      script.async = true;
      script.defer = true;
      script.setAttribute("data-pi-turnstile", "1");
      script.onload = function () { resolve(); };
      script.onerror = function () { resolve(); };
      (doc.head || doc.documentElement).appendChild(script);
    });
  }

  function turnstileContainer(target) {
    if (target.turnstileContainer) return target.turnstileContainer;
    var doc = target.document;
    if (!doc || typeof doc.createElement !== "function") return "#pi-turnstile";
    var node = doc.getElementById && doc.getElementById("pi-turnstile");
    if (node) return node;
    node = doc.createElement("div");
    node.id = "pi-turnstile";
    node.style.cssText = "min-height:0;margin:0 0 8px;";
    var anchor = doc.querySelector(".la-composer-wrap--conversation") || doc.body;
    if (anchor && anchor.insertBefore) anchor.insertBefore(node, anchor.firstChild || null);
    else if (doc.body && doc.body.appendChild) doc.body.appendChild(node);
    return node;
  }

  function acquireTurnstileToken(siteKey, host) {
    if (!siteKey) return Promise.resolve("");
    var target = host || (typeof window !== "undefined" ? window : {});
    return loadTurnstile(target).then(function () {
      var api = target.turnstile;
      if (!api || typeof api.render !== "function") return "";
      return new Promise(function (resolve) {
        var settled = false;
        function done(value) {
          if (settled) return;
          settled = true;
          clearTimeout(target.turnstileTimer);
          resolve(value || "");
        }
        target.turnstileDone = done;
        target.turnstileTimer = setTimeout(function () { done(""); }, 20000);
        var options = {
          sitekey: siteKey,
          action: TURNSTILE_ACTION,
          appearance: "interaction-only",
          callback: function (token) { if (target.turnstileDone) target.turnstileDone(token); },
          "error-callback": function () { if (target.turnstileDone) target.turnstileDone(""); },
          "timeout-callback": function () { if (target.turnstileDone) target.turnstileDone(""); },
          "expired-callback": function () {
            if (!target.turnstileRetried && target.turnstileWidgetId != null && typeof api.reset === "function") {
              target.turnstileRetried = true;
              try { api.reset(target.turnstileWidgetId); } catch (err) { if (target.turnstileDone) target.turnstileDone(""); }
              return;
            }
            if (target.turnstileDone) target.turnstileDone("");
          },
        };
        try {
          if (target.turnstileWidgetId != null && typeof api.reset === "function") {
            target.turnstileRetried = false;
            api.reset(target.turnstileWidgetId);
            return;
          }
          target.turnstileWidgetId = api.render(turnstileContainer(target), options);
        } catch (err) {
          done("");
        }
      });
    });
  }

  function mountAiNotice(doc, hostname, search) {
    if (!doc || backendChoice(hostname, search) !== "public" || typeof doc.querySelectorAll !== "function") return 0;
    var wraps = doc.querySelectorAll(".la-composer-wrap");
    var added = 0;
    for (var i = 0; i < wraps.length; i++) {
      if (wraps[i].querySelector && wraps[i].querySelector(".pi-ai-notice")) continue;
      var note = doc.createElement("p");
      note.className = "pi-ai-notice";
      note.textContent = AI_BEFORE_NOTE;
      note.style.cssText = "margin:0 0 8px;font-size:12px;line-height:16px;opacity:0.72;";
      wraps[i].insertBefore(note, wraps[i].firstChild || null);
      added += 1;
    }
    return added;
  }

  function backendChoice(hostname, search) {
    if (!loopbackHost(hostname)) return PRODUCTION_AI_ENABLED ? "public" : "disabled";
    var mode = "";
    try {
      mode = new URLSearchParams(search || "").get("pi-backend") || "";
    } catch (err) {
      mode = "";
    }
    if (mode === "off") return "disabled";
    if (mode === "mock") return "mock";
    return "local";
  }

  function mockAnswer(question, prior) {
    var q = normalize(question);
    var earlier = (prior || []).map(function (turn) { return normalize(turn && turn.text); }).join(" ");
    if (/\b(how many|how much|hours)\b/.test(q)) {
      return "The published portfolio does not state that figure.";
    }
    if (q.indexOf("forma") !== -1) {
      return "PwC Forma is the illustrative-preview name associated with the Enterprise AI Design System. It is not a separate registry project.";
    }
    if (isFollowUp(question) && earlier.indexOf("agentos") !== -1) {
      return "AgentOS is PwC's agent workspace: agents, conversation and artefacts in one three-panel layout, with activity shown on demand.";
    }
    if (/[\u4e00-\u9fff]/.test(question)) {
      return "在 PwC Australia 的 AI Centre of Excellence，Long 担任多个企业级 AI 产品的设计负责人。他负责交互模型、结构，以及哪里由 AI 协助、哪里由人决定。代表性的专业工作包括 Tax Advice AI、Regulatory Pathfinder、AgentOS、ChatPwC 和 Enterprise AI Design System。";
    }
    if (q.indexOf("experience") !== -1 || q.indexOf("经验") !== -1) {
      return "At PwC Australia's AI Centre of Excellence, Long has been the design lead on several enterprise AI products. His part is the interaction model, the structure and the review flow: where AI helps, and where a person decides. Representative Professional Work includes Tax Advice AI, Regulatory Pathfinder, AgentOS, ChatPwC and the Enterprise AI Design System.";
    }
    return "";
  }

  function isInjection(text) {
    return /ignore (all |any )?(previous |prior |above )?instructions|system prompt|developer mode|jailbreak|you are now|reveal (the )?(api key|secret|password|hidden)|print your (rules|prompt)|override (the )?(rules|system)/i.test(
      text
    );
  }

  function isAnalyticsAsk(text) {
    return /\b(analytics|insights|traffic|visitors|visitor stats|page ?views)\b/i.test(text);
  }

  function isOpenAsk(text) {
    return /^(open|show me|show|go to|take me to|launch|pull up)\b/i.test(normalize(text));
  }

  function isPrivateSourceAsk(text) {
    return /\b(repository|source code|github|employer file|unpublished|confidential document)\b/i.test(text);
  }

  function isFollowUp(text) {
    var q = normalize(text);
    if (!q || q.length > 80) return false;
    return /^(tell me more|more about that|what about that|how so|go on|continue|and then|and the|what about)\b/.test(q) || /^(继续|再说|具体|然后|那|它)/.test(q);
  }

  function isOffDomain(text) {
    var q = normalize(text);
    if (/\b(weather|recipe|stock price|sports score|poem|essay|homework|capital of|who won|quantum|javascript function|write code)\b/.test(q)) {
      return true;
    }
    var tokens = [
      "long",
      "geng",
      "design",
      "ai",
      "product",
      "project",
      "portfolio",
      "approach",
      "lab",
      "resume",
      "skill",
      "work",
      "case",
      "agent",
      "pathfinder",
      "write",
      "tax",
      "experience",
      "prototype",
      "figma",
      "access",
      "melbourne",
      "ux",
      "ui",
      "forma",
      "设计",
      "产品",
      "项目",
      "作品",
      "经验",
      "方法",
      "实验室",
      "原型",
      "作品集",
      "路径",
      "税务",
      "智能",
      "简历",
      "技能",
      "案例",
      "龙",
      "耿",
    ];
    return !tokens.some(function (token) {
      return q.indexOf(token) !== -1;
    });
  }

  function matchProject(projects, query) {
    var q = normalize(query);
    var best = null;
    var bestLen = 0;
    (projects || []).forEach(function (project) {
      var keys = []
        .concat(project.keywords || [])
        .concat([project.name, project.shortName, project.displayTitle, project.shortTitle]);
      keys.forEach(function (key) {
        var nk = normalize(key);
        if (!nk || nk.length < 3) return;
        if (q.indexOf(nk) !== -1 && nk.length > bestLen) {
          best = project;
          bestLen = nk.length;
        }
      });
    });
    return best;
  }

  function categoryFor(intent, project) {
    if (project) {
      if (project.id === "agentos") return "Agent OS";
      if (project.id === "pathfinder") return "Pathfinder";
      if (project.group === "labs") return "Independent Labs";
      return "Project Access";
    }
    var map = {
      roleAndImpact: "AI Design",
      aiTrust: "AI Design",
      aiNative: "AI Design",
      process: "AI Design",
      prototyping: "AI Design",
      designSystem: "AI Design",
      strengths: "AI Design",
      collaboration: "Experience",
      experience: "Experience",
      resume: "Experience",
      skills: "Skills",
      labs: "Independent Labs",
      projects: "Project Access",
      recommend: "Project Access",
    };
    return map[intent] || "Other";
  }

  function paragraph(text) {
    return '<p class="answer-lead">' + escapeHtml(text) + "</p>";
  }

  function response(kind, title, html, extra) {
    var base = { kind: kind, intent: kind, title: title, html: html, showFollowUps: false };
    if (extra) {
      Object.keys(extra).forEach(function (key) {
        base[key] = extra[key];
      });
    }
    return base;
  }

  function fixtureHtml() {
    var days = ["1", "2", "3", "4", "5", "6", "7"];
    var visitRows = FIXTURE.visits
      .map(function (n, i) {
        return "<li>Day " + days[i] + ": " + n + "</li>";
      })
      .join("");
    var projectRows = FIXTURE.projects
      .map(function (row) {
        return "<li>" + escapeHtml(row[0]) + ": " + row[1] + "</li>";
      })
      .join("");
    var categoryRows = FIXTURE.categories
      .map(function (row) {
        return "<li>" + escapeHtml(row[0]) + ": " + row[1] + "</li>";
      })
      .join("");
    return (
      paragraph(
        "Synthetic local fixture for layout only. These numbers are not live analytics and do not describe real visitors."
      ) +
      "<h3>Visits over 7 days</h3><ul>" +
      visitRows +
      "</ul><h3>Most-viewed projects</h3><ul>" +
      projectRows +
      "</ul><h3>Question categories</h3><ul>" +
      categoryRows +
      "</ul><ul><li>Project previews opened: " +
      FIXTURE.previews +
      "</li><li>Request-access actions: " +
      FIXTURE.accessRequests +
      "</li><li>New Chat starts: " +
      FIXTURE.newChats +
      "</li></ul>"
    );
  }

  /**
   * Pure routing decision. Side effects (navigation, events, model calls) stay in attach().
   * ctx.projects: portfolio project list. ctx.loopback / ctx.fixture: environment flags.
   */
  function classify(question, ctx) {
    ctx = ctx || {};
    var text = String(question || "").trim();
    if (!text) return { kind: "ignore" };
    if (isInjection(text)) {
      return { kind: "boundary", category: "Other", response: response("boundary", "How I can help", paragraph(BOUNDARY)) };
    }
    if (isAnalyticsAsk(text)) {
      if (ctx.loopback && ctx.fixture) {
        return {
          kind: "analytics-fixture",
          category: "Other",
          response: response("analytics-fixture", "Portfolio insights", fixtureHtml()),
        };
      }
      var body = ctx.loopback
        ? "Portfolio analytics are not connected. An authenticated owner session and a backend aggregate are required before any figures can appear. There is no live data on this page."
        : "Portfolio analytics are available only in an authenticated owner session. This public assistant cannot show them.";
      return {
        kind: "analytics-unavailable",
        category: "Other",
        response: response("analytics-unavailable", "Portfolio insights", paragraph(body)),
      };
    }
    if (isPrivateSourceAsk(text)) {
      return {
        kind: "boundary",
        category: "Project Access",
        response: response(
          "boundary",
          "How I can help",
          paragraph(
            "I can't open private repositories, employer files, or unpublished source. I can help you explore the public portfolio. " +
              BOUNDARY
          )
        ),
      };
    }
    if (isOpenAsk(text)) {
      var project = matchProject(ctx.projects, text);
      if (!project) {
        return {
          kind: "unknown-project",
          category: "Project Access",
          response: response(
            "unknown-project",
            "Project",
            paragraph("I couldn't match that to a project on this portfolio. " + BOUNDARY)
          ),
        };
      }
      var slug = project.slug || (ctx.slugFor ? ctx.slugFor(project) : "");
      return {
        kind: "navigate",
        category: categoryFor(null, project),
        projectId: project.id,
        slug: slug,
        response: response(
          "navigate",
          project.displayTitle || project.name,
          paragraph(
            "Opening " +
              (project.displayTitle || project.name) +
              ". Public pages open directly. Preview-only and restricted projects stay on the existing project preview, with the same request-access step."
          )
        ),
      };
    }
    if (isOffDomain(text)) {
      if (ctx.priorOnDomain && isFollowUp(text)) return { kind: "converse", category: "Other" };
      return { kind: "boundary", category: "Other", response: response("boundary", "How I can help", paragraph(BOUNDARY)) };
    }
    return { kind: "curated", category: null };
  }

  function plainAnswerHtml(text, projects) {
    var clean = String(text || "")
      .replace(/<[^>]*>/g, "")
      .replace(/\u0000/g, "")
      .slice(0, 4000)
      .trim();
    if (!clean) return "";
    var body = clean
      .split(/\n{2,}/)
      .map(function (part) {
        return paragraph(part);
      })
      .join("");
    var links = [];
    (projects || []).forEach(function (project) {
      var name = project.displayTitle || project.name;
      if (!name || clean.toLowerCase().indexOf(String(name).toLowerCase()) === -1) return;
      var slug = project.slug || "";
      var href = project.href || (slug ? "Me.html#/project/" + slug : "");
      if (!href) return;
      links.push('<a class="answer-link" href="' + escapeHtml(href) + '">' + escapeHtml(name) + "</a>");
    });
    if (!links.length) return body;
    return body + '<div class="answer-links">' + links.join("") + "</div>";
  }

  function attach(window) {
    var doc = window.document;
    var memory = [];
    var turns = [];
    var modelMode = "pending";
    var probe;

    function allowProps(props) {
      var allowed = {};
      var keys = ["category", "intent", "slug", "view", "section", "ms", "target", "status", "quickPrompt"];
      keys.forEach(function (key) {
        if (props && props[key] != null && typeof props[key] !== "object") allowed[key] = props[key];
      });
      return allowed;
    }

    function track(name, props) {
      if (!/^[a-z_]+$/.test(name)) return;
      var event = { name: name, t: Date.now(), props: allowProps(props) };
      memory.push(event);
      if (memory.length > MAX_EVENTS) memory.shift();
      try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
      } catch (err) {
        /* storage unavailable; the in-memory buffer still covers this page */
      }
    }

    function context() {
      var loc = window.location;
      var params = new URLSearchParams(loc.search || "");
      var pk = window.PortfolioKnowledge;
      var slugs = window.WorkspaceApp && window.WorkspaceApp.PROJECT_ID_TO_SLUG;
      return {
        projects: pk && pk.projects ? pk.projects : [],
        loopback: loopbackHost(loc.hostname),
        fixture: params.get("pi-owner-fixture") === "1",
        backend: backendChoice(loc.hostname, loc.search),
        fault: params.get("pi-mock") || "",
        priorOnDomain: turns.length > 0 && !!turns[turns.length - 1].onDomain,
        slugFor: function (project) {
          if (project.slug) return project.slug;
          return slugs && slugs[project.id] ? slugs[project.id] : "";
        },
      };
    }

    function curated(question) {
      var pk = window.PortfolioKnowledge;
      if (!pk || typeof pk.getResponse !== "function") {
        return response("boundary", "How I can help", paragraph(BOUNDARY));
      }
      return pk.getResponse(question);
    }

    function quickPromptId(question) {
      var pk = window.PortfolioKnowledge;
      var list = pk && pk.suggestedPrompts ? pk.suggestedPrompts : [];
      var q = normalize(question);
      for (var i = 0; i < list.length; i++) {
        if (normalize(list[i].label) === q) return list[i].id || "prompt-" + i;
      }
      return "";
    }

    function remember(question, result, onDomain) {
      var next = pushTurn(turns, question, result, onDomain);
      turns.splice(0, turns.length);
      next.forEach(function (turn) { turns.push(turn); });
    }

    function ensureModel() {
      if (!context().loopback) {
        modelMode = "offline";
        return Promise.resolve(modelMode);
      }
      if (modelMode !== "pending") return Promise.resolve(modelMode);
      if (!probe) {
        var controller = typeof window.AbortController === "function" ? new window.AbortController() : null;
        var timer = window.setTimeout(function () {
          if (controller) controller.abort();
        }, 800);
        probe = window
          .fetch(HEALTH_URL, { signal: controller ? controller.signal : undefined })
          .then(function (res) {
            return res.json();
          })
          .then(function (data) {
            window.clearTimeout(timer);
            modelMode = data && (data.status === "simulated" || data.status === "configured") ? data.status : "unconfigured";
            return modelMode;
          })
          .catch(function () {
            window.clearTimeout(timer);
            modelMode = "offline";
            return modelMode;
          });
      }
      return probe;
    }

    function unavailable(fallback, lead) {
      return response("model-unavailable", fallback.title || "How I can help", paragraph(lead) + (fallback.html || ""));
    }

    function tryModel(question, fallback, finish, backend, token) {
      var controller = typeof window.AbortController === "function" ? new window.AbortController() : null;
      var timer = window.setTimeout(function () {
        if (controller) controller.abort();
      }, MODEL_TIMEOUT_MS);
      var prior = priorMessages(turns);
      var payload = backend === "public"
        ? publicAskBody(question, prior, token)
        : { question: String(question).slice(0, 800), prior: prior };
      window
        .fetch(endpointFor(backend), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller ? controller.signal : undefined,
        })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, status: res.status, data: data };
          });
        })
        .then(function (result) {
          window.clearTimeout(timer);
          var data = result.data || {};
          if (data.status === "unconfigured") {
            finish(fallback);
            return;
          }
          if (data.status === "boundary" || data.status === "generic" || isGenericNonAnswer(data.answer)) {
            var generic = isGenericNonAnswer(data.answer || GENERIC_HELP);
            if (generic) {
              finish(curatedFollowUp(question));
              return;
            }
            var boundary = response("boundary", "How I can help", paragraph(data.answer || BOUNDARY));
            remember(question, boundary, false);
            finish(boundary);
            return;
          }
          if (data.status === "unverified") {
            finish(unavailable(fallback, VERIFY_NOTE));
            return;
          }
          if (result.status === 429 || data.status === "quota") {
            finish(unavailable(fallback, data.reason === "day" ? DAY_NOTE : QUOTA_NOTE));
            return;
          }
          if (!result.ok || data.status === "invalid" || !data.answer) {
            finish(unavailable(fallback, UNAVAILABLE_NOTE));
            return;
          }
          var kind = data.status === "simulated" ? "model-simulated" : "model-draft";
          var note = kind === "model-simulated"
            ? paragraph("Simulated local draft. No model provider was called.")
            : paragraph(AI_DISCLOSURE) + paragraph(PRIVACY_NOTE);
          var projects = window.PortfolioKnowledge && window.PortfolioKnowledge.projects;
          var spoken = response(kind, "Public portfolio", plainAnswerHtml(data.answer, projects) + note, { contextText: data.answer });
          remember(question, spoken, true);
          finish(spoken);
        })
        .catch(function (err) {
          window.clearTimeout(timer);
          var timedOut = err && err.name === "AbortError";
          finish(unavailable(fallback, timedOut ? TIMEOUT_NOTE : NETWORK_NOTE));
        });
    }

    function curatedFollowUp(question) {
      var priorText = turns.map(function (turn) { return turn.q + " " + turn.a; }).join(" ");
      var card = null;
      if (/agent\s*os|agentos/i.test(priorText) && window.PortfolioKnowledge && window.PortfolioKnowledge.getResponse) {
        card = window.PortfolioKnowledge.getResponse("What is Agent OS?");
      }
      if (card && card.html && !isGenericNonAnswer(card.html)) {
        var alreadyShown = /three-panel/i.test(priorText) && /role:\s*design lead/i.test(priorText);
        var body = alreadyShown
          ? paragraph(CURATED_FOLLOW_UP) + paragraph("AgentOS is PwC's agent workspace: agents, conversation and artefacts in one three-panel layout, with activity shown on demand.")
          : paragraph(CURATED_FOLLOW_UP) + card.html;
        var spoken = response("curated", card.title || "AgentOS", body, {
          contextText: alreadyShown
            ? "AgentOS is PwC's agent workspace: agents, conversation and artefacts in one three-panel layout, with activity shown on demand."
            : conversationalText({ html: card.html }),
        });
        remember(question, spoken, true);
        return spoken;
      }
      return response("boundary", "How I can help", paragraph(GENERIC_HELP));
    }

    function deliverMock(question, fallback, fault, finish) {
      var faults = {
        timeout: TIMEOUT_NOTE,
        network: NETWORK_NOTE,
        verify: VERIFY_NOTE,
        day: DAY_NOTE,
        quota: QUOTA_NOTE,
        fail: UNAVAILABLE_NOTE,
      };
      if (faults[fault]) {
        finish(unavailable(fallback, faults[fault]));
        return;
      }
      var prior = priorMessages(turns);
      var text = fault === "malformed"
        ? "<script>alert(1)</script>At PwC Australia's AI Centre of Excellence, Long has been the design lead on several enterprise AI products."
        : mockAnswer(question, prior);
      if (!text) {
        remember(question, fallback, true);
        finish(fallback);
        return;
      }
      var projects = window.PortfolioKnowledge && window.PortfolioKnowledge.projects;
      var spoken = response(
        "model-simulated",
        "Public portfolio",
        plainAnswerHtml(text, projects) + paragraph("Mock local draft. No model provider was called."),
        { contextText: text }
      );
      remember(question, spoken, true);
      finish(spoken);
    }

    function answer(question, cb) {
      var settled = false;
      function finish(value) {
        if (settled) return;
        settled = true;
        cb(value);
      }
      var decision;
      try {
        decision = classify(question, context());
      } catch (err) {
        finish(curated(question));
        return;
      }
      if (decision.kind === "ignore") {
        finish(response("boundary", "How I can help", paragraph(BOUNDARY)));
        return;
      }
      var promptId = quickPromptId(question);
      if (decision.kind === "navigate" && window.WorkspaceApp && typeof window.WorkspaceApp.navigate === "function") {
        window.WorkspaceApp.navigate({ view: "project", project: decision.slug });
      }
      if (decision.kind !== "curated" && decision.kind !== "converse") {
        track("chat_prompt_submitted", {
          category: decision.category || "Other",
          quickPrompt: promptId,
        });
        track("chat_intent_classified", { intent: decision.kind, category: decision.category || "Other" });
        finish(decision.response);
        return;
      }

      var local =
        decision.kind === "converse"
          ? response("boundary", "How I can help", paragraph(BOUNDARY))
          : curated(question);
      var intent = local && local.intent ? local.intent : "unknown";
      var category = categoryFor(intent, null);
      track("chat_prompt_submitted", { category: category, quickPrompt: promptId });
      track("chat_intent_classified", { intent: String(intent), category: category });
      var ctxNow = context();
      var canModel = ctxNow.backend !== "disabled" && !promptId && (decision.kind === "converse" || decision.kind === "curated");
      if (!canModel) {
        remember(question, local, intent !== "unknown");
        finish(local);
        return;
      }
      if (ctxNow.backend === "mock") {
        deliverMock(question, local, ctxNow.fault, finish);
        return;
      }
      if (ctxNow.backend === "public") {
        var publicFallback = decision.kind === "converse" ? response("boundary", "How I can help", paragraph(BOUNDARY)) : local;
        acquireTurnstileToken(TURNSTILE_SITE_KEY).then(function (token) {
          if (!token) {
            finish(unavailable(publicFallback, VERIFY_NOTE));
            return;
          }
          tryModel(question, publicFallback, finish, "public", token);
        });
        return;
      }
      ensureModel().then(function (mode) {
        if (mode === "simulated" || mode === "configured") {
          var fallback = decision.kind === "converse" ? response("boundary", "How I can help", paragraph(BOUNDARY)) : local;
          tryModel(question, fallback, finish, "local");
          return;
        }
        remember(question, local, intent !== "unknown");
        finish(local);
      });
    }

    var visibleSince = 0;
    var activeView = "";

    function currentView() {
      var hash = window.location.hash || "#/";
      var library = hash.match(/^#\/library\/([a-z0-9-]+)/i);
      if (library) return { view: "library", section: library[1] };
      if (hash.indexOf("#/project/") === 0) return { view: "project", section: hash.split("/")[2] || "" };
      if (hash.indexOf("#/approach") === 0) return { view: "approach", section: "" };
      if (hash.indexOf("#/library") === 0) return { view: "library", section: "" };
      if (hash.indexOf("#/resume") === 0) return { view: "resume", section: "" };
      if (hash.indexOf("#/contact") === 0) return { view: "contact", section: "" };
      return { view: "chat", section: "" };
    }

    function flushDwell() {
      if (!visibleSince) return;
      var ms = Date.now() - visibleSince;
      visibleSince = 0;
      if (ms >= 1000) track("view_engaged", { view: activeView || "chat", ms: Math.round(ms) });
    }

    function markVisible() {
      var route = currentView();
      activeView = route.view;
      if (doc.visibilityState === "visible") visibleSince = Date.now();
      track("portfolio_viewed", { view: route.view, section: route.section });
      if (route.view === "library" && route.section) {
        track("library_section_opened", { view: "library", section: route.section });
      }
    }

    function init() {
      try {
        var stored = window.sessionStorage.getItem(STORAGE_KEY);
        if (stored) memory = JSON.parse(stored).slice(-MAX_EVENTS);
      } catch (err) {
        memory = [];
      }
      markVisible();
      mountAiNotice(doc, window.location.hostname, window.location.search);
      window.addEventListener("hashchange", function () {
        flushDwell();
        markVisible();
      });
      doc.addEventListener("visibilitychange", function () {
        if (doc.visibilityState === "hidden") flushDwell();
        else visibleSince = Date.now();
      });
      doc.addEventListener("click", function (event) {
        var node = event.target && event.target.closest ? event.target : null;
        if (!node || !node.closest) return;
        if (node.closest("#la-nav-new-chat, .la-chat__new")) turns = [];
        var projectLink = node.closest("[data-project-id]");
        if (projectLink) {
          track("project_card_opened", { slug: projectLink.getAttribute("data-project-id") || "" });
        }
        var contact = node.closest("a[href]");
        if (contact) {
          var href = contact.getAttribute("href") || "";
          if (href.indexOf("mailto:") === 0) track("contact_clicked", { target: "email" });
          else if (href.indexOf("linkedin.com") !== -1) track("contact_clicked", { target: "linkedin" });
        }
        if (node.closest("#pa-contact")) {
          track("project_access_requested", { target: "preview" });
        }
      });
      if (window.PortfolioAccess && !window.PortfolioAccess.__piWrapped) {
        var original = window.PortfolioAccess.open;
        window.PortfolioAccess.open = function (options) {
          options = options || {};
          track("project_preview_opened", { slug: options.slug || options.id || "" });
          return original.apply(this, arguments);
        };
        window.PortfolioAccess.__piWrapped = true;
      }
    }

    if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
    else init();

    return { answer: answer, track: track, classify: classify, events: function () { return memory.slice(); } };
  }

  return {
    BOUNDARY: BOUNDARY,
    classify: classify,
    categoryFor: categoryFor,
    normalize: normalize,
    isFollowUp: isFollowUp,
    plainAnswerHtml: plainAnswerHtml,
    attach: attach,
    loopbackHost: loopbackHost,
    backendChoice: backendChoice,
    mockAnswer: mockAnswer,
    PRODUCTION_AI_ENABLED: PRODUCTION_AI_ENABLED,
    TURNSTILE_SITE_KEY: TURNSTILE_SITE_KEY,
    TURNSTILE_ACTION: TURNSTILE_ACTION,
    AI_DISCLOSURE: AI_DISCLOSURE,
    AI_BEFORE_NOTE: AI_BEFORE_NOTE,
    PRIVACY_NOTE: PRIVACY_NOTE,
    publicAskBody: publicAskBody,
    conversationalText: conversationalText,
    isGenericNonAnswer: isGenericNonAnswer,
    pushTurn: pushTurn,
    priorMessages: priorMessages,
    GENERIC_HELP: GENERIC_HELP,
    acquireTurnstileToken: acquireTurnstileToken,
    mountAiNotice: mountAiNotice,
  };
});
