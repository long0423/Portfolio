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
  };

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
        "agent",
        "proposal",
        "agents",
        "unification",
        "ams",
        "agentic",
        "management system",
      ],
      blurb:
        "Foundational experience and visual language for AgentOS — a 3-panel workspace spanning sources, chat, and creation.",
      recommendReason:
        "Best for agent operations, multi-panel workflows, human oversight, and scalable interaction patterns.",
      featured: true,
      isRecentlyUpdated: true,
      isAiNative: true,
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
        "Enterprise AI chat focused on agent navigation, prompt history, and a calm conversation workspace.",
      recommendReason:
        "Best for enterprise conversational AI, context management, and reusable assistant experiences.",
      featured: true,
      isRecentlyUpdated: true,
      isAiNative: true,
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
    },
    {
      id: "map",
      name: "M&A Path",
      shortName: "M&A Path",
      category: "Deals workflow platform",
      href: "Me.html#/project/ma-path",
      thumb: "assets/images/shared/MAP_front_img.svg",
      keywords: [
        "map",
        "m&a",
        "merger",
        "acquisition",
        "deals",
        "pathfinder",
        "path",
      ],
      blurb:
        "M&A web application for PwC Deals — unifying fragmented deal data, collaboration, and decision workflows.",
      recommendReason:
        "Best for complex professional workflows and structured decision support.",
      featured: true,
      isAiNative: false,
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
    },
  ];

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
    {
      id: "strengths",
      label: "What makes Long a strong AI product designer?",
    },
    {
      id: "roleAndImpact",
      label: "What was his role and impact on key projects?",
    },
    {
      id: "process",
      label: "How does he approach complex AI problems?",
    },
    {
      id: "aiTrust",
      label: "How does he design trustworthy human–AI interactions?",
    },
    {
      id: "designSystem",
      label: "How did Long build an AI-native design system?",
    },
    {
      id: "collaboration",
      label: "How does he collaborate with product and engineering teams?",
    },
    {
      id: "recommend",
      label: "Which case study should I review first?",
    },
    {
      label: "Explore Regulatory Pathfinder",
    },
  ];

  const topicSuggestions = [
    {
      label: "Role and project impact",
      prompt: "What was his role and impact on key projects?",
    },
    {
      label: "AI design approach",
      prompt: "How does he approach complex AI problems?",
    },
    {
      label: "Trust and human oversight",
      prompt: "How does he design trustworthy human–AI interactions?",
    },
    {
      label: "Collaboration and leadership",
      prompt: "How does he collaborate with product and engineering teams?",
    },
    {
      label: "Recommended case studies",
      prompt: "Which case study should I review first?",
    },
  ];

  const unknownFollowUps = [
    {
      id: "roleAndImpact",
      label: "Review his project impact",
      prompt: "What was his role and impact on key projects?",
    },
    {
      id: "process",
      label: "Explore his AI design approach",
      prompt: "How does he approach complex AI problems?",
    },
    {
      id: "recommend",
      label: "Choose a case study",
      prompt: "Which case study should I review first?",
    },
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
    ],
    skills: ["skill", "capability", "tool", "prototype", "figma", "system"],
    contact: ["contact", "email", "linkedin", "reach", "get in touch"],
  };

  /** Priority order for keyword intents (after exact prompt / project match). */
  const intentPriority = [
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
    return projects.filter((p) => p.isAiNative);
  }

  function getAiNativeSystemProjects() {
    return projects.filter((p) => p.isAiNativeSystem);
  }

  function getAdditionalProjects() {
    return projects.filter((p) => !p.isAiNative && !p.isAiNativeSystem);
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
        <p class="answer-lead">Start with <a class="answer-inline-link" href="Me.html#/project/tax-advice">Tax Advice AI</a>, <a class="answer-inline-link" href="Me.html#/project/pathfinder">Regulatory Pathfinder</a>, <a class="answer-inline-link" href="Me.html#/project/agent-os">AgentOS</a>, or <a class="answer-inline-link" href="Me.html#/project/chatpwc">ChatPwC</a>. These projects best demonstrate Long’s experience designing AI-native products where AI is central to the product workflow rather than an added feature. Review one of these first if you want the clearest signal on agent UX, generative workflows, and enterprise AI interaction design.</p>
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
        <p class="answer-lead">Long is strongest where enterprise AI is complex — multi-step workflows, mixed human/AI decisions, and systems that need to stay clear under real operational pressure.</p>
        <ul>
          <li><strong>Enterprise AI focus:</strong> Designs products used in tax, deals, agent operations, and advisory workflows — not decorative AI demos.</li>
          <li><strong>Workflow clarity:</strong> Turns dense decision points, system states, and information architecture into usable end-to-end experiences.</li>
          <li><strong>Agent &amp; trust patterns:</strong> Experienced with agent UX, human-in-the-loop review, evidence, and explainability where outputs must be checked.</li>
          <li><strong>Cross-constraint thinking:</strong> Balances user needs with business requirements and engineering feasibility.</li>
          <li><strong>Reusable systems:</strong> Builds interaction patterns and structures that can scale across products, not one-off screens.</li>
        </ul>
        <div class="answer-links">${linkList(["agentos", "pathfinder", "write"])}</div>
      `,
      projectIds: [],
    },
    roleAndImpact: {
      title: "What was his role and impact on key projects?",
      html: `
        <p class="answer-lead">Across recent work, Long has led or shaped foundational UX for AI products — owning interaction models, system structure, and the clarity of review/decision flows.</p>
        <h3>Selected examples</h3>
        <ul>
          <li><strong>AgentOS:</strong> Led design for the foundational experience, system identity, and visual language — including a 3-panel model for sources, chat, and creation that reduced tool fragmentation.</li>
          <li><strong>Tax Advice AI (Write):</strong> Led the redesign from a limited editor into an AI-agent-enabled drafting and review workspace, defining the core interaction model for real advisory workflows.</li>
          <li><strong>Regulatory Pathfinder:</strong> Led UX/UI for an AI-assisted assurance workspace, connecting controls, test planning, evidence, review and incident triage while keeping recommendations inspectable.</li>
          <li><strong>M&amp;A Path:</strong> As UX/UI Design Lead (and front-end collaborator), unified fragmented deal data and collaboration flows into a clearer decision-support application for Deals teams.</li>
        </ul>
        <p>Impact shows up as reduced workflow complexity, a more consistent interaction model, clearer review and decision-making, and patterns that can be reused across products. Measured business results are only stated where a case study has evidence for them.</p>
        <div class="answer-links">${linkList(["pathfinder", "agentos", "write", "map"])}</div>
      `,
      projectIds: [],
    },
    process: {
      title: "How does he approach complex AI problems?",
      html: `
        <p class="answer-lead">He approaches complex AI as a workflow and decision-design problem first — then shapes the model interaction around where people actually need control.</p>
        <h3>Working approach</h3>
        <ul>
          <li><strong>1. Map the real workflow</strong> — identify decision points, handoffs, and failure moments before designing UI.</li>
          <li><strong>2. Separate AI vs human responsibility</strong> — be explicit about what the system proposes and what people must approve or correct.</li>
          <li><strong>3. Design evidence &amp; recovery</strong> — define confidence, sources, exceptions, and what happens when the model is wrong.</li>
          <li><strong>4. Prototype the riskiest interaction early</strong> — validate the hard path before polishing secondary screens.</li>
          <li><strong>5. Align with PM, engineering, SMEs and users</strong> — pressure-test assumptions with the people who own the domain and the build.</li>
          <li><strong>6. Productise what works</strong> — convert proven patterns into reusable components and behaviours.</li>
        </ul>
        <div class="answer-links">${linkList(["pathfinder", "agentos", "write"])}</div>
      `,
      projectIds: [],
    },
    aiTrust: {
      title: "How does he design trustworthy human–AI interactions?",
      html: `
        <p class="answer-lead">Trustworthy AI UX, for Long, means the system stays inspectable — people can see what the AI is doing, why an output appeared, and how to challenge or recover from it.</p>
        <ul>
          <li><strong>Visible system activity:</strong> Make loading, processing, and agent state understandable instead of hiding behind a black box.</li>
          <li><strong>Evidence and rationale:</strong> Surface sources, citations, and supporting context where review matters — especially in assurance and advisory work.</li>
          <li><strong>Honest confidence:</strong> Design uncertainty and partial answers without presenting generated output as unquestionable truth.</li>
          <li><strong>Human approval points:</strong> Keep meaningful checkpoints for review, edits, and sign-off in the workflow.</li>
          <li><strong>Exceptions and recovery:</strong> Support corrections, permission issues, and error states as first-class paths, not afterthoughts.</li>
        </ul>
        <p>These patterns show up in Regulatory Pathfinder’s attribute review and test results, AgentOS’s source-to-output journey, Tax Advice AI’s drafting/review model, and ChatPwC’s agent-side navigation and history.</p>
        <div class="answer-links">${linkList(["pathfinder", "agentos", "write", "chatpwc"])}</div>
      `,
      projectIds: [],
    },
    designSystem: {
      title: "How did Long build an AI-native design system?",
      html: `
        <p class="answer-lead">Long transformed a traditional enterprise SaaS design system into an AI-native interaction system designed for modern enterprise AI products.</p>
        <ul>
          <li>Modernised the visual language while remaining aligned with PwC design guidance.</li>
          <li>Added AI-specific patterns such as prompt composers, agent states, citations, source chips, artifacts, loading, permission and recovery states.</li>
          <li>Standardised interaction behaviour across multiple AI products rather than only refreshing visual components.</li>
          <li>Created reusable foundations that improved consistency, scalability and design-to-development alignment.</li>
        </ul>
        <p>This is platform and design-system work that supports products like Tax Advice AI, AgentOS, and ChatPwC — not a standalone product experience.</p>
        <div class="answer-links">
          <a class="answer-link" href="Me.html#/project/ai-design-system">Explore Enterprise AI Design System <i data-lucide="arrow-up-right" aria-hidden="true"></i></a>
        </div>
      `,
      projectIds: ["enterprise-ai-design-system"],
    },
    collaboration: {
      title: "How does he collaborate with product and engineering teams?",
      html: `
        <p class="answer-lead">Long operates as a design lead across complex AI workstreams — aligning scope early, reducing ambiguity with prototypes, and staying close to implementation detail.</p>
        <ul>
          <li><strong>With PMs:</strong> Aligns on problem framing, MVP scope, and what “good enough” looks like before over-designing.</li>
          <li><strong>With engineering:</strong> Explores options with clear trade-offs, and designs for reusable components and feasible states.</li>
          <li><strong>With SMEs &amp; stakeholders:</strong> Incorporates domain feedback so flows match real advisory and operational judgement.</li>
          <li><strong>Through artefacts:</strong> Uses prototypes, behaviour notes, edge cases, and state definitions to keep delivery aligned.</li>
          <li><strong>Operating model:</strong> Comfortable owning design end-to-end across multiple products without relying on a large design team.</li>
        </ul>
        <p>This shows up in how AgentOS and Tax Advice AI moved from concept through iterative validation with cross-disciplinary teams.</p>
        <div class="answer-links">${linkList(["agentos", "write"])}</div>
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
    projects: {
      title: "Selected work",
      html: `
        <p class="answer-lead">Start with the AI-native products — Tax Advice AI, Regulatory Pathfinder, AgentOS, and ChatPwC — then explore additional enterprise product work.</p>
      `,
      projectIds: RECOMMEND_PROJECT_IDS.slice(),
      groupedCards: true,
    },
    experience: {
      title: "Background & experience",
      html: `
        <p class="answer-lead">Long is a Product &amp; UX Designer with 8+ years blending design and development, focused on enterprise AI products at PwC Australia.</p>
        <ul>
          <li><strong>Focus:</strong> Complex AI workflows across tax, deals, document intelligence, and agent operations.</li>
          <li><strong>Recent ownership:</strong> Led foundational design for AgentOS, the redesign of Tax Advice AI (Write), and the UX/UI of Regulatory Pathfinder.</li>
          <li><strong>Working style:</strong> Close collaboration with PMs, engineers, and SMEs from concept through release.</li>
        </ul>
        <div class="la-actions">
          <a class="la-action" href="assets/media/Resume-Long-Geng.pdf" target="_blank" rel="noopener">Open resume</a>
          <a class="la-action" href="Me.html" data-prompt="What was his role and impact on key projects?">Review project impact</a>
        </div>
      `,
      projectIds: [],
    },
    skills: {
      title: "Skills",
      html: `
        <p class="answer-lead">Core strengths sit at the intersection of AI product UX, enterprise workflow design, and implementation-aware collaboration.</p>
        <ul>
          <li><strong>AI / agent UX:</strong> Human-in-the-loop systems, drafting/review, multi-panel workspaces</li>
          <li><strong>Systems thinking:</strong> Information architecture, progressive disclosure, reusable patterns</li>
          <li><strong>Delivery:</strong> Prototyping, design-engineering handoff, and hands-on front-end collaboration</li>
        </ul>
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
        <p class="answer-lead">I can help you explore Long’s project impact, AI design approach, collaboration style, experience, and selected case studies. If you want portfolio examples, start with the AI-native work below.</p>
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
        <p class="answer-lead">Long designed the control library as the working surface. The table is for scanning identity, definition and status. Five Ws and the detail drawer add the narrative, attributes, risk and linkages without forcing every column to stay open.</p>
        <ul>
          <li>View settings choose which columns are visible.</li>
          <li>Five Ws stay attached to the same control row.</li>
          <li>AI attribute suggestions show the original, the suggestion and the reason, and wait for keep or accept.</li>
        </ul>`;
    } else if (/artificial intelligence|\bai\b|agent|suggestion|human/.test(q)) {
      title = "How AI fits into Regulatory Pathfinder";
      body = `
        <p class="answer-lead">AI in Pathfinder drafts, suggests and explains. It does not approve a control conclusion, a test result, or an incident.</p>
        <ul>
          <li>Attribute review keeps source values distinct from suggestions.</li>
          <li>Test plans can be drafted with Pathfinder Agent and are saved only when a person chooses to save.</li>
          <li>Incident triage can recommend a next step. Confirmation, override and breach recording stay with the practitioner. Some further breach assessment is outside the current prototype.</li>
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
        <p class="answer-lead">Incidents are a connected workstream, not a separate product. The register shows stage, triage outcome and status. Opening a matter reuses the detail drawer.</p>
        <ul>
          <li>A triage result is a recommendation until someone confirms or overrides it.</li>
          <li>The prototype says when further assessment sits outside the current scope.</li>
          <li>Canvas is another way to inspect the same matters. It does not replace confirmation.</li>
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
        topicSuggestions.map((t) => ({ id: null, label: t.prompt, prompt: t.prompt }))
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
    const accessibleName = project.isAiNative
      ? `${project.name} (AI native)`
      : project.isAiNativeSystem
      ? `${project.name} (AI-native system)`
      : project.name;
    return `
      <a class="la-project-card" href="${project.href}" aria-label="${accessibleName}">
        <img class="la-project-card__thumb" src="${project.thumb}" alt="" width="56" height="36" loading="lazy" />
        <span class="la-project-card__title-row">
          <span class="la-project-card__name">${project.name}</span>
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
    return {
      intent: "project",
      title: project.name,
      html: `
        <p class="answer-lead"><strong>${project.name}</strong> — ${project.blurb}</p>
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
    return projects.filter((p) => p.featured);
  }

  function getAllProjects() {
    return projects.slice();
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
    getAiNativeProjects,
    getAiNativeSystemProjects,
    getAdditionalProjects,
    projectCardHtml,
  };
})();
