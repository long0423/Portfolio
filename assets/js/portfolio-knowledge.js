/**
 * Portfolio knowledge base for the AI-native landing page.
 * Local keyword-matched assistant — not a live LLM.
 * Content sourced from existing case study pages and resume.
 */
window.PortfolioKnowledge = (function () {
  "use strict";

  const profile = {
    name: "Long Geng",
    shortName: "Long",
    initials: "L",
    email: "michaelgeng0423@gmail.com",
    linkedin: "https://www.linkedin.com/in/long-geng/",
    resume: "assets/media/Resume-Long-Geng.pdf",
    // Total experience counts calendar years from here (no start month is established)
    careerStartYear: 2017,
  };

  /** Years of professional experience at the given date (default: now). */
  function experienceYears(now) {
    return Math.max(0, (now || new Date()).getFullYear() - profile.careerStartYear);
  }

  /** "9+ years" in 2026, "10+ years" in 2027, … */
  function experienceText(now) {
    return `${experienceYears(now)}+ years`;
  }

  /** Experience text in a span that is refreshed if the page stays open into a new year. */
  function experienceHtml() {
    return `<span data-experience-years>${experienceText()}</span>`;
  }

  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") return;
      const text = experienceText();
      document.querySelectorAll("[data-experience-years]").forEach((el) => {
        if (el.textContent !== text) el.textContent = text;
      });
    });
  }

  /** Canonical recommendation order: AI-native first, then additional product work. */
  const projects = [
    {
      id: "write",
      name: "Tax Advice AI",
      shortName: "Tax Advice AI",
      category: "AI-assisted tax drafting workspace",
      href: "Me.html#/project/tax-advice",
      thumb: "assets/images/shared/write.svg",
      keywords: ["write", "tax", "taxadvice", "tax advice", "drafting", "advice"],
      blurb:
        "Redesign of Tax Advice AI into an AI-agent-enabled drafting and review experience for complex tax advisory workflows.",
      recommendReason:
        "Best for generative AI drafting and review workflows with knowledge grounding and professional oversight.",
      featured: true,
      isRecentlyUpdated: true,
      isAiNative: true,
      facts: [
        "<strong>Role:</strong> Design lead for the redesign.",
        "<strong>Focus:</strong> One prompt input to start, an agent sidebar for guidance, and citations and source panels beside the draft.",
        "<strong>Delivery:</strong> Phased milestones, shaped by user and engineering feedback.",
      ],
      preview: {
        kind: "identity",
        category: "AI drafting and review \u00b7 Tax",
        summary: "An agent-enabled drafting workspace where tax teams draft advice, check sources and review AI output.",
        image: "assets/images/shared/write.svg",
        alt: "Write logo with a \u201cBuild for AI\u201d label",
      },
    },
    {
      id: "pathfinder",
      name: "Regulatory Pathfinder",
      shortName: "Pathfinder",
      shortTitle: "Pathfinder",
      category: "AI-assisted regulatory assurance",
      href: "Me.html#/project/pathfinder",
      thumb: "projects/pathfinder/assets/images/regulatory-pathfinder-thumbnail.svg",
      keywords: [
        "regulatory pathfinder",
        "pathfinder",
        "regulatory assurance",
        "regulatory testing",
        "control assessment",
        "controls experience",
        "control workspace",
        "design effectiveness",
        "operating effectiveness",
        "incident triage",
        "five ws",
        "evidence review",
        "audit trail",
      ],
      blurb:
        "AI assistance designed into a regulatory assurance workspace, inside controls, test plans and review.",
      recommendReason:
        "Best for complex assurance workflows, inspectable AI assistance, and human review across controls, tests and incidents.",
      featured: true,
      isRecentlyUpdated: true,
      isAiNative: true,
      preview: {
        kind: "identity",
        category: "AI-assisted regulatory assurance",
        summary: "AI suggestions, test-plan drafts and triage inside an assurance workspace, where a person still decides.",
        image: "projects/pathfinder/assets/images/regulatory-pathfinder-thumbnail.svg",
        alt: "Pathfinder logo with a \u201cBuild for AI\u201d label",
      },
    },
    {
      id: "agentos",
      name: "AgentOS",
      shortName: "AgentOS",
      category: "Enterprise AI agent workspace",
      href: "Me.html#/project/agent-os",
      thumb: "assets/images/shared/agentOS.svg",
      keywords: [
        "agentos",
        "agent os",
        "agent experience",
        "agent workspace",
        "proposal",
        "agents",
        "unification",
        "agentic",
        "management system",
      ],
      blurb:
        "Core experience for AgentOS, PwC\u2019s agent workspace \u2014 agents, conversation and artefacts in one three-panel layout.",
      recommendReason:
        "Best for agent workspaces, multi-agent execution and showing outcomes before activity.",
      featured: true,
      isRecentlyUpdated: true,
      isAiNative: true,
      facts: [
        "<strong>Role:</strong> Design lead.",
        "<strong>Focus:</strong> A three-panel workspace that gives agents, conversation and artefacts each a clear place.",
        "<strong>Recent:</strong> An outcome-first view of multi-agent runs, shown in a working prototype demo beside a reconstruction of the earlier view.",
      ],
      preview: {
        kind: "identity",
        category: "Enterprise AI agent workspace",
        summary: "A workspace for agents, conversation and artefacts, with agent activity shown on demand.",
        image: "assets/images/shared/agentOS.svg",
        alt: "AgentOS logo with a \u201cBuild for AI\u201d label",
      },
    },
    {
      id: "chatpwc",
      name: "ChatPwC",
      shortName: "ChatPwC",
      category: "Enterprise AI chat",
      href: "Me.html#/project/chatpwc",
      thumb: "assets/images/shared/chatpwc_front_img.svg",
      keywords: ["chatpwc", "chat pwc", "chat"],
      blurb:
        "Enterprise AI chat workspace with agent, prompt and chat-history navigation. Full case study in preparation.",
      recommendReason:
        "An early look at enterprise AI chat; the full case study is in preparation.",
      featured: true,
      isRecentlyUpdated: true,
      isAiNative: true,
      facts: ["<strong>Status:</strong> The full case study is in preparation."],
      preview: {
        kind: "identity",
        category: "Enterprise AI chat",
        summary: "An enterprise AI chat workspace with agent, prompt and chat-history navigation.",
        image: "assets/images/shared/chatpwc_front_img.svg",
        alt: "ChatPwC logo with a \u201cBuild for AI\u201d label",
      },
    },
    {
      id: "enterprise-ai-design-system",
      name: "Enterprise AI Design System",
      shortName: "AI Design System",
      shortTitle: "AI Design System",
      category: "Platform / Design System",
      href: "Me.html#/project/ai-design-system",
      thumb: "projects/ai-design-system/assets/images/enterprise-ai-design-system-thumbnail.svg",
      keywords: [
        "design system",
        "ai design system",
        "ai-native design system",
        "enterprise ai design system",
        "interaction system",
        "component library",
        "shared components",
        "design language",
        "reusable patterns",
        "platform design",
        "system upgrade",
        "appkit",
      ],
      blurb:
        "Transformation of a traditional enterprise SaaS design system into a modern AI-native interaction system aligned with PwC design guidance and current AI product patterns.",
      recommendReason:
        "Best for reusable AI interaction patterns, components, and platform-level design-system work across multiple products.",
      featured: true,
      isRecentlyUpdated: true,
      isAiNative: false,
      isAiNativeSystem: true,
      facts: [
        "<strong>Focus:</strong> Prompt composers, agent states, citations, source chips, artefacts, loading, permission and recovery states.",
        "<strong>Status:</strong> Case study in progress.",
      ],
      preview: {
        kind: "identity",
        category: "Platform \u00b7 AI-native design system",
        summary: "Shared AI-native patterns, from prompt composer to agent and recovery states, across several AI products.",
        image: "projects/ai-design-system/assets/images/enterprise-ai-design-system-thumbnail.svg",
        alt: "Design system wordmark with a \u201cBuild for AI\u201d label",
      },
    },
    {
      id: "map",
      name: "M&A Path",
      shortName: "M&A Path",
      category: "Deals workflow platform",
      href: "Me.html#/project/ma-path",
      thumb: "assets/images/shared/MAP_front_img.svg",
      keywords: [
        "m&a",
        "merger",
        "acquisition",
        "deals",
      ],
      blurb:
        "M&A web application for PwC Deals \u2014 unifying fragmented deal data, collaboration, and decision workflows.",
      recommendReason:
        "Best for complex deal workflows, dense data views and hands-on front-end delivery.",
      featured: true,
      isAiNative: false,
      navOlder: true,
      facts: [
        "<strong>Role:</strong> UX/UI Design Lead and front-end developer.",
        "<strong>Focus:</strong> Deal data, workplans, RAID logs, tables and charts for PwC Deals teams.",
        "<strong>Build:</strong> Coded several pages and fixed UI issues in React.",
      ],
      preview: {
        kind: "product",
        category: "Deals workflow platform",
        summary: "A deals workflow application that brings deal data, workplans and team collaboration into one place.",
        image: "assets/images/shared/MAP_front_img.svg",
        alt: "M&A Path screens: an Integration Management Office page with module cards, beside financial dashboard charts",
      },
    },
    {
      id: "pulse",
      name: "Engagement Pulse",
      shortName: "Engagement Pulse",
      category: "Engagement insights",
      href: "Me.html#/project/pulse",
      thumb: "assets/images/shared/pulse_front_img.svg",
      keywords: ["pulse", "engagement"],
      blurb: "Redesign of Engagement Pulse for clearer real-time insights.",
      recommendReason:
        "Best for engagement insights, data visualisation, and actionable reporting.",
      featured: true,
      isAiNative: false,
      navOlder: true,
      facts: [
        "<strong>Role:</strong> UX/UI designer.",
        "<strong>Focus:</strong> Dashboard, survey creation, results, history and comparison, rebuilt on PwC\u2019s design system.",
      ],
      preview: {
        kind: "product",
        category: "Engagement surveys and insights",
        summary: "A redesign of a team survey platform for clearer results, survey management and insights.",
        image: "assets/images/shared/pulse_front_img.svg",
        alt: "Engagement Pulse dashboard with surveys, team scores and a results chart, beside a mobile survey question",
      },
    },
    {
      id: "dcb",
      name: "Digital Customer Blueprint",
      shortName: "Digital Customer Blueprint",
      category: "Customer journey platform",
      href: "Me.html#/project/dcb",
      thumb: "assets/images/shared/dcb_front_img.svg",
      keywords: ["dcb", "blueprint", "customer", "journey"],
      blurb: "PwC platform for mapping and improving customer journeys.",
      recommendReason:
        "Best for service design, journey mapping, and large information structures.",
      featured: true,
      isAiNative: false,
      navOlder: true,
      facts: [
        "<strong>Role:</strong> UX/UI designer.",
        "<strong>Focus:</strong> Map templates, commenting, Jira links, version history and folders.",
        "<strong>Also:</strong> Designed and built the product\u2019s landing page.",
      ],
      preview: {
        kind: "product",
        category: "Journey mapping platform",
        summary: "A collaborative tool for building and sharing customer journey maps from templates.",
        image: "assets/images/shared/dcb_front_img.svg",
        alt: "Digital Customer Blueprint journey map with phases, storyboard photos and insight rows",
      },
    },

    /*
     * Independent Labs: personal products and explorations outside professional work.
     * group: "labs" keeps them out of every professional list (featured, recommendations,
     * AI-native groupings and the professional Projects order). On the public site they use
     * the same project access gate (project-access.js). Their detail pages (file) are not
     * published, so no Lab may be switched to "public" access until its page is.
     * displayTitle is the canonical product name for navigation, cards and Library;
     * name stays the full descriptive title for headings, descriptions and accessible names.
     */
    {
      id: "layout-studio",
      group: "labs",
      stage: "built",
      slug: "layout-studio",
      file: "projects/layout-studio/index.html",
      name: "Watch Face Layout Studio",
      shortName: "Layout Studio",
      displayTitle: "Watchface Layout Studio",
      category: "Design tool \u00b7 Wearable UI",
      status: "Built \u00b7 private",
      href: "Me.html#/project/layout-studio",
      thumb: "projects/layout-studio/assets/images/layout-studio-thumbnail.webp",
      thumbAlt: "Layout Studio editor showing a round 454 by 454 watch face",
      keywords: ["layout studio", "watch face", "watchface", "venu", "smartwatch", "wearable"],
      blurb: "A local-first visual editor for designing and testing round smartwatch layouts.",
      recommendReason: "A built and tested design tool for round watch-face layouts.",
      preview: {
        kind: "product",
        category: "Design tool \u00b7 Built, private repository",
        summary: "A local-first editor for designing and testing round smartwatch layouts against realistic data.",
        image: "projects/layout-studio/assets/images/layout-studio-thumbnail.webp",
        alt: "Layout Studio editor with a round watch face showing the time, gauges and arcs, between settings panels",
      },
      ctaLabel: "Open case study",
      featured: false,
    },
    {
      id: "garmin-health-companion",
      group: "labs",
      stage: "exploration",
      slug: "garmin-health-companion",
      file: "projects/labs/index.html?id=garmin-health-companion",
      name: "Garmin Health Companion",
      shortName: "Health Companion",
      displayTitle: "Garmin Health Companion",
      category: "Health analytics \u00b7 AI",
      status: "Exploration",
      href: "Me.html#/project/garmin-health-companion",
      thumb: "projects/labs/assets/images/garmin-health-companion.webp",
      thumbAlt: "Concept illustration of health and training trends over twelve weeks",
      keywords: ["garmin health", "health companion", "hrv", "recovery", "sleep trend"],
      blurb: "Understanding training, recovery and wellbeing over time.",
      preview: {
        kind: "concept",
        category: "Health analytics \u00b7 Exploration, private",
        summary: "Exploring how sleep, HRV and training load could be read together over months.",
        image: "projects/labs/assets/images/garmin-health-companion.webp",
        alt: "Concept illustration: a twelve-week heart rate variability chart with a dip after high-load weeks",
      },
      ctaLabel: "Open concept overview",
      featured: false,
      concept: {
        statusLabel: "Exploration \u00b7 private development",
        statusNote:
          "An early private prototype uses synthetic data only. Nothing is released, and no personal health records are shown here.",
        disclaimer: "An independent personal project. It is not made, endorsed or supported by Garmin.",
      },
    },
    {
      id: "ai-design-review",
      group: "labs",
      stage: "concept",
      slug: "ai-design-review",
      file: "projects/labs/index.html?id=ai-design-review",
      name: "AI Design Review Assistant",
      shortName: "Design Review Assistant",
      displayTitle: "AI Design Review",
      category: "AI tools \u00b7 Design education",
      status: "Concept",
      href: "Me.html#/project/ai-design-review",
      thumb: "projects/labs/assets/images/ai-design-review.webp",
      thumbAlt: "Concept illustration of a resume page with numbered annotations and review notes",
      keywords: ["design review assistant", "ai design review", "portfolio review", "resume review", "portfolio feedback"],
      blurb: "Clearer, more actionable portfolio and resume feedback.",
      preview: {
        kind: "concept",
        category: "AI tools \u00b7 Concept",
        summary: "A concept for portfolio and resume feedback anchored to the exact line it refers to.",
        image: "projects/labs/assets/images/ai-design-review.webp",
        alt: "Concept illustration: a sample resume with one line highlighted and a numbered suggestion beside it",
      },
      ctaLabel: "Open concept overview",
      featured: false,
      concept: {
        statusLabel: "Concept",
        statusNote: "This is a concept. No working reviewer exists yet.",
      },
    },
    {
      id: "trainer-workspace",
      group: "labs",
      stage: "concept",
      slug: "trainer-workspace",
      file: "projects/labs/index.html?id=trainer-workspace",
      name: "Personal Trainer Workspace",
      shortName: "Trainer Workspace",
      displayTitle: "Trainer Workspace",
      category: "Fitness \u00b7 Coaching",
      status: "Concept",
      href: "Me.html#/project/trainer-workspace",
      thumb: "projects/labs/assets/images/trainer-workspace.webp",
      thumbAlt: "Concept illustration of a weekly coaching check-in with sessions, a progress trend and notes",
      keywords: ["personal trainer", "trainer workspace", "coaching workspace", "coach and client"],
      blurb: "A shared space for coaches and clients between sessions.",
      preview: {
        kind: "concept",
        category: "Fitness \u00b7 Concept",
        summary: "A concept for a shared weekly check-in between a coach and a client.",
        image: "projects/labs/assets/images/trainer-workspace.webp",
        alt: "Concept illustration: a weekly check-in with sessions completed, a strength trend and a coach\u2019s note",
      },
      ctaLabel: "Open concept overview",
      featured: false,
      concept: {
        statusLabel: "Concept",
        statusNote: "This is a concept. No working product exists yet.",
      },
    },
  ];

  function workProjects() {
    return projects.filter((p) => p.group !== "labs");
  }

  function labProjects() {
    return projects.filter((p) => p.group === "labs");
  }

  const RECOMMEND_PROJECT_IDS = [
    "write",
    "pathfinder",
    "agentos",
    "chatpwc",
    "enterprise-ai-design-system",
    "map",
    "pulse",
    "dcb",
  ];

  const suggestedPrompts = [
    { id: "roleAndImpact", label: "What AI products has Long designed?" },
    { label: "Explore Regulatory Pathfinder" },
    { label: "Tell me about AgentOS" },
    { label: "Tell me about Tax Advice AI" },
    { id: "process", label: "What is Long\u2019s AI-first approach?" },
    { id: "prototyping", label: "How hands-on is Long with prototyping and code?" },
    { id: "aiTrust", label: "How does he design trustworthy human\u2013AI interactions?" },
    { id: "labs", label: "What are Long\u2019s Independent Labs?" },
  ];

  const topicSuggestions = [
    { id: "recommend", label: "Recommended case studies", prompt: "Which case study should I review first?" },
    { id: "experience", label: "Background and experience", prompt: "Tell me about Long\u2019s background and experience." },
    { id: "collaboration", label: "Working with product and engineering", prompt: "How does he collaborate with product and engineering teams?" },
    { id: "designSystem", label: "AI-native design system", prompt: "How did Long build an AI-native design system?" },
    { id: "strengths", label: "Strengths as an AI product designer", prompt: "What makes Long a strong AI product designer?" },
  ];

  const unknownFollowUps = [
    { id: "roleAndImpact", label: "See his AI product work", prompt: "What AI products has Long designed?" },
    { id: "process", label: "Explore his AI-first approach", prompt: "What is Long\u2019s AI-first approach?" },
    { id: "recommend", label: "Choose a case study", prompt: "Which case study should I review first?" },
  ];

  const intentKeywords = {
    roleAndImpact: [
      "role",
      "impact",
      "contribution",
      "responsibility",
      "ownership",
      "outcome",
      "result",
    ],
    aiTrust: [
      "trust",
      "responsible ai",
      "human in the loop",
      "human-in-the-loop",
      "explainability",
      "confidence",
      "evidence",
      "source",
      "error",
      "oversight",
      "approval",
    ],
    collaboration: [
      "collaborate",
      "collaboration",
      "team",
      "product manager",
      "pm",
      "developer",
      "engineer",
      "stakeholder",
      "leadership",
    ],
    process: [
      "process",
      "approach",
      "solve",
      "complex",
      "method",
      "design thinking",
      "how does he design",
      "how do you design",
      "how does long approach",
      "ai product design",
      "ai-first",
      "ai first",
    ],
    strengths: [
      "strength",
      "why hire",
      "fit",
      "different",
      "what makes",
      "strong ai product",
      "strong product designer",
    ],
    aiNative: [
      "ai-native",
      "ai native",
      "which projects are ai",
      "ai native project",
      "ai-native product",
      "ai native product",
    ],
    designSystem: [
      "design system",
      "ai design system",
      "ai-native design system",
      "ai native design system",
      "enterprise ai design system",
      "interaction system",
      "component library",
      "shared components",
      "design language",
      "reusable patterns",
      "platform design",
      "system upgrade",
      "modernise the ai design system",
      "modernize the ai design system",
      "build an ai-native design system",
    ],
    recommend: [
      "which case",
      "case study",
      "case studies",
      "review first",
      "start with",
      "recommend",
      "where should i",
      "best case study",
      "best work",
      "strongest work",
      "strongest project",
      "portfolio",
      "relevant portfolio",
      "project impact",
      "ai product",
      "agent product",
      "generative ai",
      "ai-native",
      "ai native",
      "selected work",
      "show me long",
      "show me long's selected",
      "show me long’s selected",
    ],
    prototyping: [
      "prototyp",
      "hands-on",
      "hands on",
      "in code",
      "coding",
      "code",
      "front-end",
      "frontend",
      "front end",
      "implementation",
      "pull request",
      "react",
      "javascript",
    ],
    labs: [
      "independent lab",
      "independent labs",
      "side project",
      "side projects",
      "personal project",
      "personal projects",
      "outside work",
      "outside the brief",
      "own projects",
      "experiments",
    ],
    projects: [
      "project",
      "projects",
      "case study",
      "case studies",
      "portfolio",
      "selected work",
      "show me",
      "strongest",
      "best work",
      "ai product",
      "generative ai",
    ],
    experience: [
      "experience",
      "background",
      "pwc",
      "career",
      "resume",
      "cv",
      "tell me about long",
      "about long",
      "desert software",
      "monash",
      "tutor",
      "umbrella",
      "shengxiao",
      "before pwc",
      "earlier role",
      "education",
    ],
    skills: ["skill", "capability", "tool", "figma", "sketch"],
    contact: ["contact", "email", "linkedin", "reach", "get in touch"],
  };

  /** Priority order for keyword intents (after exact prompt / project match). */
  const intentPriority = [
    "labs",
    "prototyping",
    "roleAndImpact",
    "aiTrust",
    "designSystem",
    "collaboration",
    "process",
    "strengths",
    "aiNative",
    "recommend",
    "projects",
    "experience",
    "skills",
    "contact",
  ];

  function getProjectsByIds(ids) {
    return ids
      .map((id) => projects.find((p) => p.id === id))
      .filter(Boolean);
  }

  function getAiNativeProjects() {
    return workProjects().filter((p) => p.isAiNative);
  }

  function getAiNativeSystemProjects() {
    return workProjects().filter((p) => p.isAiNativeSystem);
  }

  function getAdditionalProjects() {
    return workProjects().filter((p) => !p.isAiNative && !p.isAiNativeSystem);
  }

  function linkList(ids) {
    return getProjectsByIds(ids)
      .map(
        (p) =>
          `<a class="answer-link" href="${p.href}">${p.name} <i data-lucide="arrow-up-right" aria-hidden="true"></i></a>`
      )
      .join("");
  }

  function aiNativeLabelHtml() {
    return '<span class="ai-native-label">AI native</span>';
  }

  function aiNativeSystemLabelHtml() {
    return '<span class="ai-native-label">AI-native system</span>';
  }

  function projectLabelHtml(project) {
    if (project.group === "labs") return `<span class="ai-native-label">${project.status}</span>`;
    if (project.isAiNative) return aiNativeLabelHtml();
    if (project.isAiNativeSystem) return aiNativeSystemLabelHtml();
    return "";
  }

  function answerRecHtml(project) {
    const label = projectLabelHtml(project);
    return `
      <a class="answer-rec" href="${project.href}">
        <span class="answer-rec__title-row">
          <span class="answer-rec__name">${project.name}</span>
          ${label}
        </span>
        <span class="answer-rec__meta">${project.recommendReason || project.blurb}</span>
      </a>`;
  }

  function buildRecommendHtml() {
    const ai = getAiNativeProjects();
    const systems = getAiNativeSystemProjects();
    const additional = getAdditionalProjects();
    return `
        <p class="answer-lead">Start with <a class="answer-inline-link" href="Me.html#/project/tax-advice">Tax Advice AI</a>, <a class="answer-inline-link" href="Me.html#/project/pathfinder">Regulatory Pathfinder</a> or <a class="answer-inline-link" href="Me.html#/project/agent-os">AgentOS</a>. They give the clearest view of Long\u2019s AI-native product work, where AI is part of the core workflow: generative drafting with sources, assistance inside a regulated review process, and agent workspaces.</p>
        <h3>AI-native products</h3>
        <div class="answer-recs">
          ${ai.map(answerRecHtml).join("")}
        </div>
        ${
          systems.length
            ? `<h3>AI-native systems</h3>
        <div class="answer-recs">
          ${systems.map(answerRecHtml).join("")}
        </div>`
            : ""
        }
        <h3>Additional product work</h3>
        <div class="answer-recs">
          ${additional.map(answerRecHtml).join("")}
        </div>
      `;
  }

  function buildAiNativeHtml() {
    const ai = getAiNativeProjects();
    return `
        <p class="answer-lead">These products are AI-native: AI is central to the core workflow and interaction model rather than being added as a secondary feature.</p>
        <div class="answer-recs">
          ${ai.map(answerRecHtml).join("")}
        </div>
      `;
  }

  function buildGroupedProjectCardsHtml(projectList) {
    const ai = projectList.filter((p) => p.isAiNative);
    const systems = projectList.filter((p) => p.isAiNativeSystem);
    const additional = projectList.filter(
      (p) => !p.isAiNative && !p.isAiNativeSystem
    );
    let html = "";
    if (ai.length) {
      html +=
        '<h3>AI-native products</h3><div class="la-project-cards">' +
        ai.map(projectCardHtml).join("") +
        "</div>";
    }
    if (systems.length) {
      html +=
        '<h3>AI-native systems</h3><div class="la-project-cards">' +
        systems.map(projectCardHtml).join("") +
        "</div>";
    }
    if (additional.length) {
      html +=
        '<h3>Additional product work</h3><div class="la-project-cards">' +
        additional.map(projectCardHtml).join("") +
        "</div>";
    }
    return html;
  }

  const responses = {
    strengths: {
      title: "What makes Long a strong AI product designer?",
      html: `
        <p class="answer-lead">Long is strongest where enterprise AI is complex: multi-step workflows, decisions shared between people and AI, and products that have to stay clear under real working pressure.</p>
        <ul>
          <li><strong>Enterprise AI products:</strong> Design lead on AI products for tax advice drafting, regulatory assurance and agent workspaces at PwC Australia.</li>
          <li><strong>Workflow clarity:</strong> Turns dense registers, drafts and agent runs into flows people can scan, act on and review.</li>
          <li><strong>Trust by design:</strong> Keeps sources, suggestions and approvals visible, so AI output is checked before it counts.</li>
          <li><strong>Prototypes in code:</strong> Uses AI-assisted development to make ideas testable early, and stays close to engineering through delivery.</li>
          <li><strong>Reusable systems:</strong> Turns proven interactions into shared AI patterns rather than one-off screens.</li>
        </ul>
        <div class="answer-links">${linkList(["write", "pathfinder", "agentos"])}</div>
      `,
      projectIds: [],
    },
    roleAndImpact: {
      title: "AI product work and his role",
      html: `
        <p class="answer-lead">At PwC Australia\u2019s AI Centre of Excellence, Long has been the design lead on several enterprise AI products. His part is the interaction model, the structure and the review flow: where AI helps, and where a person decides.</p>
        <ul>
          <li><strong>Tax Advice AI (Write):</strong> Led the redesign of a limited editor into an agent-enabled drafting and review workspace, with sources and citations beside the draft, delivered in phased milestones.</li>
          <li><strong>Regulatory Pathfinder:</strong> Helped bring AI into a regulatory assurance workspace \u2014 attribute suggestions, test-plan drafting and incident triage that wait for a person to accept. Shown in a working prototype; no measured rollout is claimed.</li>
          <li><strong>AgentOS:</strong> Design lead on PwC\u2019s agent workspace: a three-panel layout for agents, conversation and artefacts. A later refinement, shown in a prototype demo, puts the outcome of multi-agent runs before agent activity.</li>
          <li><strong>Enterprise AI Design System:</strong> Redesigned a traditional enterprise design system into shared AI-native patterns for several AI products. Case study in progress.</li>
        </ul>
        <p>Other PwC product work: UX/UI lead and front-end developer on M&amp;A Path, and UX/UI designer on Engagement Pulse and Digital Customer Blueprint. The ChatPwC case study is in preparation. Impact is described by what changed in each workflow rather than with metrics.</p>
        <div class="answer-links">${linkList(["write", "pathfinder", "agentos", "enterprise-ai-design-system"])}</div>
      `,
      projectIds: [],
    },
    process: {
      title: "His AI-first approach",
      html: `
        <p class="answer-lead">Long designs AI-first and prototype-first. He uses AI to turn ideas into working experiences early, then applies design judgment, real feedback and engineering discipline to make them useful, reliable and worth building.</p>
        <h3>Six stages</h3>
        <ul>
          <li><strong>1. Frame the opportunity</strong> \u2014 bring together goals, constraints and existing knowledge, so AI has enough context to explore meaningful solutions.</li>
          <li><strong>2. Prototype first</strong> \u2014 turn a focused brief into a working prototype people can explore and question.</li>
          <li><strong>3. Direct the experience</strong> \u2014 refine flows, information architecture, interaction states, accessibility and visual consistency through rapid critique.</li>
          <li><strong>4. Challenge with evidence</strong> \u2014 test the prototype with real scenarios and people before assumptions become expensive decisions.</li>
          <li><strong>5. Build with fidelity</strong> \u2014 extend the design system with AI-native patterns and distil its principles into a reusable UX skill, so developers can build with AI while preserving design fidelity.</li>
          <li><strong>6. Iterate &amp; ship</strong> \u2014 with AI-assisted development, turn feedback into focused UI and UX improvements, validate changes in code and open pull requests for review.</li>
        </ul>
        <p>Research, sketches and wireframes still have their place \u2014 he uses them when they add value, not as fixed steps before anyone can try the idea.</p>
        <div class="answer-links">
          <a class="answer-link" href="Me.html#/approach">See the approach <i data-lucide="arrow-up-right" aria-hidden="true"></i></a>
          ${linkList(["write", "pathfinder", "agentos"])}
        </div>
      `,
      projectIds: [],
    },
    aiTrust: {
      title: "How does he design trustworthy human\u2013AI interactions?",
      html: `
        <p class="answer-lead">For Long, trustworthy AI means the work stays inspectable: people can see what the AI did, why an output appeared, and how to change or refuse it.</p>
        <ul>
          <li><strong>Visible activity:</strong> Show what agents are doing in a form people can follow \u2014 outcome first, details on demand.</li>
          <li><strong>Evidence beside the output:</strong> Keep sources, citations and evidence attached to the draft or result where review matters.</li>
          <li><strong>Honest status:</strong> Treat a generated result, a reviewed finding and an approved decision as different states.</li>
          <li><strong>Human decision points:</strong> Suggestions sit beside the original value, and nothing changes until someone accepts, confirms or saves.</li>
          <li><strong>Stated limits and recovery:</strong> Say where a feature stops, and design permission, error and recovery states as real paths.</li>
        </ul>
        <p>These patterns show up in Regulatory Pathfinder\u2019s attribute suggestions, test plans and incident triage, Tax Advice AI\u2019s citations and source panels, and the AgentOS outcome-first view of agent runs.</p>
        <div class="answer-links">${linkList(["pathfinder", "write", "agentos"])}</div>
      `,
      projectIds: [],
    },
    designSystem: {
      title: "How did Long build an AI-native design system?",
      html: `
        <p class="answer-lead">Long redesigned a traditional enterprise SaaS design system into an AI-native interaction system for PwC\u2019s AI products.</p>
        <ul>
          <li>Modernised the visual language while staying aligned with PwC design guidance.</li>
          <li>Added AI-specific patterns: prompt composers, agent states, citations, source chips, artifacts, loading, permission and recovery states.</li>
          <li>Standardised interaction behaviour across multiple AI products, not only the look of components.</li>
          <li>Built reusable foundations that support consistency, scalability and design-to-development alignment.</li>
        </ul>
        <p>This is platform work shared by several products rather than a standalone product experience. The full case study is still being written.</p>
        <div class="answer-links">
          <a class="answer-link" href="Me.html#/project/ai-design-system">Explore Enterprise AI Design System <i data-lucide="arrow-up-right" aria-hidden="true"></i></a>
        </div>
      `,
      projectIds: ["enterprise-ai-design-system"],
    },
    collaboration: {
      title: "How does he collaborate with product and engineering teams?",
      html: `
        <p class="answer-lead">Long works as the design lead inside cross-functional AI teams: aligning scope early, making ideas concrete with prototypes, and staying close to implementation detail.</p>
        <ul>
          <li><strong>With product:</strong> Agrees the problem, the scope and what \u201cgood enough\u201d looks like before polishing.</li>
          <li><strong>With engineering:</strong> Treats technical constraints as design input \u2014 splitting complex features into phases or finding alternative solutions.</li>
          <li><strong>With specialists:</strong> Works with domain experts, such as tax specialists, so flows match real professional judgement.</li>
          <li><strong>Through prototypes:</strong> Working prototypes and clearly defined interaction states keep design and build aligned.</li>
        </ul>
        <p>On Tax Advice AI, engineering feedback turned one ambitious feature into phased milestones. On Regulatory Pathfinder, design reviews with product and engineering decided where AI was allowed to act.</p>
        <div class="answer-links">${linkList(["write", "pathfinder"])}</div>
      `,
      projectIds: [],
    },
    prototyping: {
      title: "Prototyping and code",
      html: `
        <p class="answer-lead">Long is a designer who works in code. He uses AI-assisted development to get ideas into working prototypes early, and stays close to the code as designs move toward release.</p>
        <ul>
          <li><strong>Prototype first:</strong> A focused brief becomes a working prototype people can explore and question, before detailed specs.</li>
          <li><strong>Front-end delivery:</strong> On M&amp;A Path he was UX/UI Design Lead and front-end developer, coding pages and fixing UI issues in React.</li>
          <li><strong>Changes in code:</strong> In his current approach, AI-assisted development turns feedback into focused UI and UX improvements that are validated in code and opened as pull requests for review.</li>
          <li><strong>Portfolio prototypes:</strong> The AgentOS execution demos run in a working front-end prototype built for this portfolio; the \u201cBefore\u201d view is a concept reconstruction.</li>
          <li><strong>Independent Labs:</strong> He built and tested Watch Face Layout Studio with AI-assisted development, owning product direction, design, verification and release scope.</li>
        </ul>
        <p>In delivery he works alongside engineering, preserving the details, behaviours and consistency of the validated experience.</p>
        <div class="answer-links">
          <a class="answer-link" href="Me.html#/approach">See the approach <i data-lucide="arrow-up-right" aria-hidden="true"></i></a>
          ${linkList(["map", "agentos", "layout-studio"])}
        </div>
      `,
      projectIds: [],
    },
    recommend: {
      title: "Which case study should I review first?",
      html: null, // built via buildRecommendHtml()
      buildHtml: buildRecommendHtml,
      projectIds: [],
      groupedCards: false,
    },
    aiNative: {
      title: "Which projects are AI native?",
      html: null,
      buildHtml: buildAiNativeHtml,
      projectIds: [],
      groupedCards: false,
    },
    labs: {
      title: "Independent Labs",
      html: `
        <p class="answer-lead">Independent Labs collects products, tools and experiments Long works on outside professional work. None of them is publicly released.</p>
        <ul>
          <li><strong>Watch Face Layout Studio:</strong> built and tested (v0.1.0) in a private repository.</li>
          <li><strong>Garmin Health Companion:</strong> a private exploration that runs on synthetic data.</li>
          <li><strong>AI Design Review Assistant</strong> and <strong>Personal Trainer Workspace:</strong> concepts.</li>
        </ul>
      `,
      projectIds: ["layout-studio", "garmin-health-companion", "ai-design-review", "trainer-workspace"],
    },
    projects: {
      title: "Selected work",
      html: `
        <p class="answer-lead">Start with the AI products \u2014 Tax Advice AI, Regulatory Pathfinder and AgentOS \u2014 then the Enterprise AI Design System and other enterprise product work.</p>
      `,
      projectIds: RECOMMEND_PROJECT_IDS.slice(),
      groupedCards: true,
    },
    experience: {
      title: "Background & experience",
      get html() {
        return `
        <p class="answer-lead">Long is an AI product designer with ${experienceHtml()} across product design and front-end development. Since 2020 he has led UX/UI and AI product design at PwC Australia\u2019s AI Centre of Excellence.</p>
        <ul>
          <li><strong>PwC Australia (2020 \u2013 now):</strong> Design lead on Tax Advice AI, Regulatory Pathfinder and AgentOS; redesigned the Enterprise AI Design System; UX/UI lead and front-end developer on M&amp;A Path.</li>
          <li><strong>Monash University (2022):</strong> Part-time UX/UI bootcamp tutor.</li>
          <li><strong>Desert Software (2017 \u2013 2020):</strong> Front-end developer and product designer.</li>
          <li><strong>Earlier (2016 \u2013 2017):</strong> Web developer and UX/UI designer roles; Master of Information Technology, Monash University.</li>
        </ul>
        <div class="la-actions">
          <a class="la-action" href="assets/media/Resume-Long-Geng.pdf" target="_blank" rel="noopener">Open resume</a>
          <a class="la-action" href="Me.html" data-prompt="What AI products has Long designed?">See AI product work</a>
        </div>
      `;
      },
      projectIds: [],
    },
    skills: {
      title: "Skills",
      html: `
        <p class="answer-lead">Product design with enough engineering to prototype, build and review in code.</p>
        <ul>
          <li><strong>Product and interaction design:</strong> Interaction models, information architecture and complex workflows, in Figma and, earlier, Sketch.</li>
          <li><strong>AI and agent UX:</strong> Human-in-the-loop review, evidence and citations, agent workspaces and progressive disclosure.</li>
          <li><strong>Design systems:</strong> AI-native components, states and patterns shared across products.</li>
          <li><strong>Front-end and AI-assisted development:</strong> HTML, CSS, JavaScript and React; Cursor for working prototypes and focused UI changes in code.</li>
        </ul>
        <div class="answer-links"><a class="answer-link" href="Me.html#/library/skills">Skills and tools in the Library <i data-lucide="arrow-up-right" aria-hidden="true"></i></a></div>
      `,
      projectIds: [],
    },
    resume: {
      title: "Resume",
      html: `
        <p class="answer-lead">You can open Long’s resume as a PDF, or continue with project impact and case study recommendations here.</p>
        <div class="la-actions">
          <a class="la-action la-action--primary" href="assets/media/Resume-Long-Geng.pdf" target="_blank" rel="noopener">Open resume</a>
          <a class="la-action" href="Me.html" data-prompt="Which case study should I review first?">Choose a case study</a>
        </div>
      `,
      projectIds: [],
    },
    contact: {
      title: "Contact",
      html: `
        <p class="answer-lead">Reach Long by email or LinkedIn.</p>
        <ul>
          <li>Email: <a href="mailto:michaelgeng0423@gmail.com">michaelgeng0423@gmail.com</a></li>
          <li>LinkedIn: <a href="https://www.linkedin.com/in/long-geng/" target="_blank" rel="noopener">linkedin.com/in/long-geng</a></li>
        </ul>
      `,
      projectIds: [],
    },
    unknown: {
      title: "How I can help",
      html: `
        <p class="answer-lead">I can help you explore Long\u2019s AI product work, his AI-first approach, how he prototypes and works with engineering, his experience, and his Independent Labs. For portfolio examples, start with the AI-native work below.</p>
      `,
      projectIds: RECOMMEND_PROJECT_IDS.slice(),
      groupedCards: true,
      showFollowUps: true,
    },
  };

  // Alias resume → experience-style intent handling
  responses.resume = responses.resume;

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .replace(/[–—]/g, "-")
      .replace(/\s+/g, " ")
      .trim();
  }

  function matchProject(query) {
    const q = normalize(query);
    let best = null;
    let bestLen = 0;
    projects.forEach((project) => {
      const keys = project.keywords.concat([project.name, project.shortName, project.shortTitle].filter(Boolean));
      keys.forEach((key) => {
        const nk = normalize(key);
        if (!nk || nk.length < 3) return;
        if (q.includes(nk) && nk.length > bestLen) {
          best = project;
          bestLen = nk.length;
        }
      });
    });
    return best;
  }

  function pathfinderLink(id, label) {
    const href = id ? "Me.html#/project/pathfinder/" + id : "Me.html#/project/pathfinder";
    return `<a class="answer-link" href="${href}">${label} <i data-lucide="arrow-up-right" aria-hidden="true"></i></a>`;
  }

  function pathfinderAnswer(query) {
    const q = normalize(query);
    let title = "Regulatory Pathfinder";
    let body = "";

    if (/control workspace|controls experience|five w|control table|attribute/.test(q)) {
      title = "Controls experience in Regulatory Pathfinder";
      body = `
        <p class="answer-lead">Long kept the control register as the working surface. The table is for scanning identity, description and definition status; columns can be reduced so design and operating status stay readable, and AI opens on the same record.</p>
        <ul>
          <li>A configured view keeps design and operating test status in reach.</li>
          <li>AI attribute suggestions show the original value, the suggestion and the reason.</li>
          <li>Keep and accept are the only ways a value changes.</li>
        </ul>`;
    } else if (/artificial intelligence|\bai\b|agent|suggestion|human/.test(q)) {
      title = "How AI fits into Regulatory Pathfinder";
      body = `
        <p class="answer-lead">AI in Pathfinder drafts, suggests and explains. It does not approve a control conclusion, a test result, or an incident.</p>
        <ul>
          <li>Attribute review keeps source values distinct from suggestions.</li>
          <li>Test plans can be drafted with Pathfinder Agent and are saved only when a person chooses to save.</li>
          <li>Incident triage can recommend a next step. Confirm, override and export stay with the practitioner. Some further breach assessment is outside the current prototype.</li>
        </ul>`;
    } else if (/review|trace|audit|evidence/.test(q)) {
      title = "Review and traceability in Regulatory Pathfinder";
      body = `
        <p class="answer-lead">A generated result, a reviewed finding and an approved conclusion are different states. The result view keeps the conclusion, the procedures, the evidence and the review status in one place.</p>
        <ul>
          <li>Each procedure can show what was tested, what was done, and which sources were in scope.</li>
          <li>Evidence stays inside the run rather than in a separate archive.</li>
          <li>This is a review trail for the product workflow. It is not a claim of formal audit certification.</li>
        </ul>`;
    } else if (/incident|triage|breach|exception/.test(q)) {
      title = "Incidents and issues in Regulatory Pathfinder";
      body = `
        <p class="answer-lead">Incident triage follows the same pattern as controls and test plans: the AI can recommend a next step and show its reasoning, but the decision stays with a person.</p>
        <ul>
          <li>A triage result is a recommendation until someone confirms or overrides it.</li>
          <li>Confirm, override and export stay with the practitioner.</li>
          <li>Where further assessment is outside the current prototype, the screen says so.</li>
        </ul>`;
    } else if (/challenge|problem|difficult|leadership|role|led|approach/.test(q)) {
      title = "Long’s design leadership on Regulatory Pathfinder";
      body = `
        <p class="answer-lead">Long led the UX/UI: the interaction model, the information architecture and the shared patterns. He did not own model training or the backend platform.</p>
        <ul>
          <li>The product already had registers and records. The design work was where AI should appear inside them.</li>
          <li>Suggestions stay next to the original value, plans stay editable, and a result is not treated as approved.</li>
          <li>The same pattern — contextual help, then an explicit human action — is used for attributes, test plans and incident triage.</li>
        </ul>`;
    } else {
      body = `
        <p class="answer-lead"><strong>Regulatory Pathfinder</strong> started as a conventional assurance workspace. Long’s design work brought AI into the control, the test plan and the review, without treating a suggestion as a decision.</p>
        <h3>Quick scan</h3>
        <ul>
          <li><strong>Problem:</strong> Help had to appear inside an existing register and review flow, not in a separate chat.</li>
          <li><strong>Role:</strong> UX/UI Design Lead, PwC AI Centre of Excellence. Interaction design for AI assistance, not model training.</li>
          <li><strong>Approach:</strong> Suggest beside the original value, draft inside the plan, and keep evidence and review on the result.</li>
          <li><strong>Outcomes:</strong> The prototype shows that pattern. It does not claim measured savings or a finished breach-assessment system.</li>
        </ul>`;
    }

    const sections =
      pathfinderLink("challenge", "Challenge") +
      pathfinderLink("evolution", "Evolution") +
      pathfinderLink("workflow", "AI in the work") +
      pathfinderLink("iteration", "Iteration") +
      pathfinderLink("test-planning", "Test plans") +
      pathfinderLink("review", "Review") +
      pathfinderLink("traceability", "Evidence") +
      pathfinderLink("incidents", "Incidents") +
      pathfinderLink("", "Full case study");

    return {
      title: title,
      html: body + `<div class="answer-links">${sections}</div>`,
    };
  }

  function matchKeywordIntent(q) {
    for (let i = 0; i < intentPriority.length; i++) {
      const intent = intentPriority[i];
      const keys = intentKeywords[intent] || [];
      if (keys.some((k) => q.includes(normalize(k)))) {
        return intent;
      }
    }
    return null;
  }

  function resolveIntent(query) {
    const q = normalize(query);

    // Exact prompt labels (quick prompts, topics, follow-ups)
    const allLabeled = suggestedPrompts
      .concat(unknownFollowUps)
      .concat(
        topicSuggestions.map((t) => ({ id: t.id || null, label: t.prompt, prompt: t.prompt }))
      );

    for (let i = 0; i < allLabeled.length; i++) {
      const item = allLabeled[i];
      const label = normalize(item.label);
      const prompt = normalize(item.prompt || item.label);
      if (q === label || q === prompt) {
        if (item.id && responses[item.id]) return item.id;
        const match = suggestedPrompts.find((p) => normalize(p.label) === prompt);
        if (match && match.id && responses[match.id]) return match.id;
      }
    }

    // Follow-up short labels → their prompt intents
    const follow = unknownFollowUps.find((f) => normalize(f.label) === q);
    if (follow) return follow.id;

    // 1. Specific project name (when asking about a project)
    const project = matchProject(q);
    if (project && /(tell me|about|show|open|what is|what was|case|role|impact|scan|challenge|how did|how does|explore)/.test(q)) {
      return { type: "project", project };
    }

    // Resume-specific
    if (/\bresume\b|\bcv\b/.test(q)) return "resume";

    // 2–8. Priority keyword intents
    const keywordIntent = matchKeywordIntent(q);
    if (keywordIntent) {
      if (keywordIntent === "experience" && /\bresume\b|\bcv\b/.test(q)) return "resume";
      return keywordIntent;
    }

    if (project) return { type: "project", project };
    return "unknown";
  }

  function projectCardHtml(project) {
    const label = projectLabelHtml(project);
    const accessibleName = project.group === "labs"
      ? `${project.name} (${project.status})`
      : project.isAiNative
      ? `${project.name} (AI native)`
      : project.isAiNativeSystem
      ? `${project.name} (AI-native system)`
      : project.name;
    return `
      <a class="la-project-card" href="${project.href}" aria-label="${accessibleName}">
        <img class="la-project-card__thumb" src="${project.thumb}" alt="" width="56" height="36" loading="lazy" />
        <span class="la-project-card__title-row">
          <span class="la-project-card__name">${project.displayTitle || project.name}</span>
          ${label}
        </span>
        <i data-lucide="arrow-up-right" aria-hidden="true"></i>
      </a>
    `;
  }

  function buildProjectResponse(project, query) {
    if (project.id === "pathfinder") {
      const answer = pathfinderAnswer(query || "");
      return {
        intent: "project",
        title: answer.title,
        html: answer.html,
        showFollowUps: false,
      };
    }
    if (project.group === "labs") {
      const note = project.concept
        ? project.concept.statusNote
        : "Built and tested with AI-assisted development (v0.1.0). The repository is private and the tool is not publicly released. The canvas is a browser approximation, not a device-verified preview.";
      return {
        intent: "project",
        title: project.name,
        html: `
        <p class="answer-lead"><strong>${project.name}</strong> — ${project.blurb}</p>
        <p>An Independent Labs project. ${note}</p>
        <div class="answer-links">
          <a class="answer-link" href="${project.href}">${project.ctaLabel} <i data-lucide="arrow-up-right" aria-hidden="true"></i></a>
        </div>
      `,
        showFollowUps: false,
      };
    }
    return {
      intent: "project",
      title: project.name,
      html: `
        <p class="answer-lead"><strong>${project.name}</strong> \u2014 ${project.blurb}</p>
        ${project.facts ? `<ul>${project.facts.map((f) => `<li>${f}</li>`).join("")}</ul>` : ""}
        <div class="answer-links">
          <a class="answer-link" href="${project.href}">Open case study <i data-lucide="arrow-up-right" aria-hidden="true"></i></a>
        </div>
      `,
      showFollowUps: false,
    };
  }

  function getResponse(query) {
    const resolved = resolveIntent(query);

    if (resolved && typeof resolved === "object" && resolved.type === "project") {
      return buildProjectResponse(resolved.project, query);
    }

    const intent = typeof resolved === "string" ? resolved : "unknown";
    const base = responses[intent] || responses.unknown;
    const bodyHtml =
      typeof base.buildHtml === "function" ? base.buildHtml() : base.html || "";

    let cardsHtml = "";
    if (base.projectIds && base.projectIds.length) {
      const list = getProjectsByIds(base.projectIds);
      cardsHtml = base.groupedCards
        ? buildGroupedProjectCardsHtml(list)
        : `<div class="la-project-cards">${list.map(projectCardHtml).join("")}</div>`;
    }

    return {
      intent,
      title: base.title,
      html: bodyHtml + cardsHtml,
      showFollowUps: !!base.showFollowUps || intent === "unknown",
    };
  }

  function getFeaturedProjects() {
    return workProjects().filter((p) => p.featured);
  }

  /** Professional projects only, in their established order. */
  function getAllProjects() {
    return workProjects();
  }

  function getLabProjects() {
    return labProjects();
  }

  function getProjectById(id) {
    return projects.find((p) => p.id === id) || null;
  }

  return {
    profile,
    projects,
    suggestedPrompts,
    topicSuggestions,
    unknownFollowUps,
    getResponse,
    getFeaturedProjects,
    getAllProjects,
    getLabProjects,
    getProjectById,
    experienceYears,
    experienceText,
    experienceHtml,
    getAiNativeProjects,
    getAiNativeSystemProjects,
    getAdditionalProjects,
    projectCardHtml,
  };
})();
