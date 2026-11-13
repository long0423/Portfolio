/**
 * Agent OS Builder — landing state, search, filters, and shell interactions.
 * Future cinematic demos should drive the `state` object rather than DOM handlers.
 */
(function () {
  "use strict";

  const app = document.getElementById("aos-app");
  const THEME_STORAGE_KEY = "write-theme";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DEFAULT_PLACEHOLDER = "Ask me to draft, summarize, or prepare anything…";
  const FOLLOW_UP_PLACEHOLDER = "Send a follow-up…";
  const ARTIFACT_PLACEHOLDER = "Ask about this artifact…";
  const QUOTE_PLACEHOLDER = "Ask a follow-up…";
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 2;
  const ZOOM_STEP = 0.25;

  const AGENTS = [
    {
      id: "risk-framework",
      title: "Proposal – Risk Framework Assessment",
      meta: "Generated 3 artefacts · Completed 2 hrs ago",
      stamp: "2h",
      status: "completed",
      date: "6 Oct",
      reply:
        "I completed the Risk Framework Assessment and generated a storyline, risk register extract, and commercial implications note. Three artefacts are ready in the panel.",
    },
    {
      id: "ace-weekly",
      title: "Meeting Summary – ACE Weekly Check-in",
      meta: "Summary created from Teams transcript · Ready to review",
      stamp: "12m",
      status: "review",
      date: "6 Oct",
      reply:
        "I summarised the ACE Weekly Check-in from the Teams transcript. Decisions, owners, and open questions are ready for review.",
    },
    {
      id: "bluescope-insights",
      title: "Client Insights – Bluescope Manufacturing",
      meta: "Extracted 5 key insights · Draft saved",
      stamp: "1h",
      status: "draft",
      date: "2 Oct",
      reply:
        "Draft insights from the Bluescope manufacturing pack are saved. Five themes are highlighted, including margin pressure and ESG reporting load.",
    },
    {
      id: "tax-use-cases",
      title: "AI Use Cases for Tax Division",
      meta: "3 potential use cases identified · Completed",
      stamp: "Yesterday",
      status: "completed",
      date: "2 Oct",
      reply:
        "I identified three Tax Division use cases: TOFA classification support, transaction-cost analysis, and consolidation joining-event memos.",
    },
    {
      id: "wbs-draft",
      title: "Draft Work Breakdown Structure",
      meta: "AI model drafting structure · In progress",
      stamp: "12m",
      status: "progress",
      date: "2 Oct",
      reply: "Still drafting the work breakdown structure. Workstreams and owners are being aligned to the current proposal scope.",
    },
    {
      id: "commercial-model",
      title: "Commercial Model Draft for Proposal",
      meta: "Financial assumptions generated · Completed",
      stamp: "3d",
      status: "completed",
      date: "25 Sep",
      reply: "Commercial model assumptions are complete, including fee phasing, contingency, and sensitivity ranges for the proposal.",
    },
    {
      id: "conflict-check",
      title: "Conflict Check Analysis – New Client",
      meta: "Flagged 2 potential conflicts · Completed",
      stamp: "3d",
      status: "completed",
      date: "25 Sep",
      reply: "Conflict check is complete. Two potential conflicts were flagged and routed to Risk for confirmation.",
    },
    {
      id: "product-rewrite",
      title: "AI Product Description Rewrite",
      meta: "Rewritten content aligned with PwC tone · In progress",
      stamp: "2h",
      status: "progress",
      date: "25 Sep",
      reply: "The product description rewrite is in progress. Current draft is aligned to PwC tone and ACE positioning.",
    },
    {
      id: "engagement-pulse",
      title: "Engagement Pulse Summary",
      meta: "Team insights summarized from survey data · Archived",
      stamp: "Yesterday",
      status: "archived",
      date: "25 Sep",
      reply: "Engagement Pulse findings have been archived. Team sentiment and recommended actions remain available as artefacts.",
    },
    {
      id: "esg-proposal",
      title: "Proposal – ESG Reporting Framework",
      meta: "Error connecting to compliance database · Generation failed",
      stamp: "1h",
      status: "error",
      date: "25 Sep",
      reply:
        "Generation failed while connecting to the compliance database. Retry after the connection is restored, or continue from the last saved storyline.",
    },
  ];

  const CATEGORY_ICONS = {
    text: "file-text",
    charts: "chart-column",
    presentations: "presentation",
    data: "database",
  };

  const CATEGORY_LABELS = {
    text: "Text",
    charts: "Chart",
    presentations: "Presentation",
    data: "Data model",
  };

  const ARTEFACTS = [
    { id: "precedent-meta", title: "Precedent Meta Analysis", meta: "19 mins ago", category: "text", sort: "recent", owner: "mine", generatedByAgentId: "risk-framework" },
    { id: "wbs", title: "Work Breakdown Structure", meta: "52 mins ago", category: "text", sort: "recent", owner: "mine", generatedByAgentId: "wbs-draft" },
    { id: "precedent-mfg", title: "Precedent Insights Manufacturing", meta: "4 hours ago", category: "text", sort: "recent", owner: "shared", generatedByAgentId: "bluescope-insights" },
    { id: "storyline", title: "Storyline Structure", meta: "2 days ago", category: "presentations", sort: "recent", owner: "mine", generatedByAgentId: "risk-framework" },
    { id: "case-studies", title: "Case Studies Bluescope", meta: "2 days ago", category: "presentations", sort: "recent", owner: "shared", generatedByAgentId: "bluescope-insights" },
    { id: "risk-profile", title: "Risk Profile Bluescope 24/09/2025 V1", meta: "2 days ago", category: "charts", sort: "recent", owner: "mine", generatedByAgentId: "risk-framework" },
    { id: "frameworks", title: "Client Frameworks Bluescope Standard 2025", meta: "4 days ago", category: "data", sort: "recent", owner: "shared", generatedByAgentId: "bluescope-insights" },
    { id: "use-case-map", title: "Tax Division Use Case Map", meta: "1 day ago", category: "charts", sort: "recent", owner: "mine", generatedByAgentId: "tax-use-cases" },
    { id: "commercial-assumptions", title: "Commercial Model Assumptions", meta: "5 days ago", category: "data", sort: "recent", owner: "mine", generatedByAgentId: "commercial-model" },
  ];

  const ARTEFACT_CONTENT = {
    "precedent-meta": {
      kind: "text",
      title: "Proposal Risk Framework Assessment",
      comments: [],
      commentSeq: 0,
      html:
        "<h1>Proposal Risk Framework Assessment</h1>" +
        "<h2>1. Executive Summary</h2>" +
        "<p>This assessment consolidates precedent reviews across comparable industrial engagements and maps residual exposure against the proposed Bluescope risk framework for FY27 planning. The engagement is ready to take into the client workshop once residual High items have named owners.</p>" +
        "<p>Inherent risk remains High in delivery and regulatory. Residual risk improves where stream owners are already named. Commercial exposure is driven by contingency phrasing rather than fee quantum, and should be treated as a wording risk rather than a pricing reset.</p>" +
        "<h2>2. Scope and Objectives</h2>" +
        "<p>The review covers governance, delivery, commercial, and regulatory risk. Findings are drawn from five completed proposal files, the current FY27 risk register extract, and interviews with the engagement partner and delivery lead.</p>" +
        "<p>The objective is to give the team a single residual view before the workshop, confirm owners below Partner level, and lock the storyline annexes that should travel with the proposal.</p>" +
        "<h2>3. Key Risk Areas</h2>" +
        "<h3>Governance</h3>" +
        "<p>Partner ownership is documented. Stream ownership is not consistently named below Partner level, which is the pattern that delayed escalation in two precedent files.</p>" +
        "<h3>Delivery</h3>" +
        "<p>Delivery risk concentrates in data-readiness and decision latency. Precedent files that deferred plant-level data quality into later waves required a mid-engagement reset.</p>" +
        "<h3>Commercial</h3>" +
        "<p>The fee envelope is within market range. Contingency language in the commercial annex still leaves room for the client to reopen scope after kick-off.</p>" +
        "<h3>Regulatory</h3>" +
        "<p>Reporting obligations sit across three functions. Evidence for two controls is incomplete, and external assurance timing is not locked.</p>" +
        "<ul>" +
        "<li>Governance ownership is documented but not consistently named below Partner level.</li>" +
        "<li>Delivery risk concentrates in data-readiness and decision latency.</li>" +
        "<li>Commercial exposure is driven by contingency phrasing rather than fee quantum.</li>" +
        "<li>Regulatory dependencies remain the least evidenced workstream.</li>" +
        "</ul>" +
        "<h2>4. Risk Assessment</h2>" +
        "<p>Residual scoring assumes the current team structure and a fortnightly steerco. If the steerco stays monthly, residual Delivery should remain High through the first wave.</p>" +
        "<table><thead><tr><th>Domain</th><th>Inherent</th><th>Residual</th><th>Owner</th></tr></thead><tbody>" +
        "<tr><td>Governance</td><td>High</td><td>Medium</td><td>Engagement Partner</td></tr>" +
        "<tr><td>Delivery</td><td>High</td><td>High</td><td>Delivery Lead</td></tr>" +
        "<tr><td>Commercial</td><td>Medium</td><td>Medium</td><td>Commercial Lead</td></tr>" +
        "<tr><td>Regulatory</td><td>High</td><td>Medium</td><td>Risk Partner</td></tr>" +
        "</tbody></table>" +
        "<h2>5. Mitigation Actions</h2>" +
        "<ol>" +
        "<li>Name stream owners for every residual High item before the client workshop.</li>" +
        "<li>Move data readiness into wave 1 rather than treating it as an implementation afterthought.</li>" +
        "<li>Tighten contingency language in the commercial annex this week.</li>" +
        "<li>Attach the regulatory dependency register to the storyline pack.</li>" +
        "</ol>" +
        "<h2>6. Recommendations</h2>" +
        "<p>Take a single residual view into the workshop. Confirm owners, issue the updated storyline pack, and schedule the commercial annex review on the critical path. Do not defer data readiness.</p>" +
        "<p>If the client asks to compress the first wave, protect the named-owner and data-readiness actions. Those two items determined whether precedent engagements stayed on plan.</p>",
    },
    wbs: {
      kind: "text",
      title: "Work Breakdown Structure",
      blocks: [
        { type: "h1", text: "Work Breakdown Structure" },
        { type: "p", text: "Draft structure for the Risk Framework Assessment engagement. Streams are aligned to the current proposal scope and still require owner confirmation on two workstreams." },
        { type: "h2", text: "1. Mobilise" },
        { type: "ul", items: ["Kick-off and working cadence", "Access to source files and systems", "RACI and decision rights"] },
        { type: "h2", text: "2. Diagnose" },
        { type: "ul", items: ["Precedent scan", "Current-state risk interviews", "Control mapping"] },
        { type: "h2", text: "3. Design" },
        { type: "ul", items: ["Target framework", "Heat map and residual scoring", "Storyline and artefacts"] },
        { type: "h2", text: "4. Mobilise delivery" },
        { type: "ul", items: ["Implementation roadmap", "Assurance checkpoints", "Handover pack"] },
        { type: "table", headers: ["Stream", "Owner", "Status"], rows: [
          ["Mobilise", "PMO", "Drafted"],
          ["Diagnose", "Risk lead", "In progress"],
          ["Design", "Unassigned", "Open"],
          ["Delivery", "Unassigned", "Open"],
        ] },
      ],
    },
    "precedent-mfg": {
      kind: "text",
      title: "Precedent Insights — Manufacturing",
      blocks: [
        { type: "h1", text: "Precedent Insights — Manufacturing" },
        { type: "p", text: "Themes extracted from comparable manufacturing and industrial clients, with emphasis on margin pressure, reporting load, and operating-model friction." },
        { type: "h2", text: "Recurring themes" },
        { type: "ul", items: [
          "Margin compression from energy and logistics volatility.",
          "ESG reporting load sitting outside core finance processes.",
          "Plant-level data quality delaying group risk aggregation.",
          "Assurance findings repeating where ownership is shared across functions.",
        ] },
        { type: "h2", text: "Implication for Bluescope" },
        { type: "p", text: "The current proposal should treat data readiness as a first-wave workstream rather than an implementation afterthought. Precedent files that skipped this step required a mid-engagement reset." },
      ],
    },
    storyline: {
      kind: "presentation",
      slides: [
        { kicker: "Proposal", title: "Executive overview", bullets: ["Risk Framework Assessment for FY27 planning", "Four risk domains, one integrated storyline", "Decision needed: residual High items and owners"] },
        { kicker: "Landscape", title: "Risk landscape", bullets: ["Inherent risk remains High in delivery and regulatory", "Residual risk improves where named owners exist", "Commercial risk is wording, not quantum"] },
        { kicker: "Governance", title: "Governance risks", bullets: ["Partner ownership is clear; stream owners are not", "Steering cadence is monthly — too slow for residual High", "Escalation path is documented but unused"] },
        { kicker: "Delivery", title: "Delivery risks", bullets: ["Data readiness is the critical path", "Decision latency adds 3–4 weeks in precedent files", "Two workstreams still lack a named lead"] },
        { kicker: "Commercial", title: "Commercial exposure", bullets: ["Fee envelope is within market range", "Contingency phrasing creates reopen risk", "Sensitivity cases are drafted, not socialised"] },
        { kicker: "Regulatory", title: "Regulatory dependencies", bullets: ["Reporting obligations sit across three functions", "Evidence pack is incomplete for two controls", "External assurance timing is not locked"] },
        { kicker: "Actions", title: "Mitigation actions", bullets: ["Name owners before the client workshop", "Move data readiness into wave 1", "Tighten contingency language this week"] },
        { kicker: "Next", title: "Recommended next steps", bullets: ["Confirm residual High owners", "Issue the updated storyline pack", "Schedule the commercial annex review"] },
      ],
    },
    "case-studies": {
      kind: "presentation",
      slides: [
        { kicker: "Bluescope", title: "Case studies overview", bullets: ["Three manufacturing analogues", "Shared pattern: data, ownership, reporting load", "Used to pressure-test the current proposal"] },
        { kicker: "Case 01", title: "Industrial metals group", bullets: ["Reset the risk framework mid-year", "Named stream owners reduced residual High items by half", "Monthly steerco was replaced with fortnightly"] },
        { kicker: "Case 02", title: "Building products network", bullets: ["ESG reporting sat outside finance", "A shared control library cut duplicate evidence", "Plant data quality was the hidden critical path"] },
        { kicker: "Case 03", title: "Integrated manufacturer", bullets: ["Commercial annex reopened twice on contingency wording", "Sensitivity cases needed a single owner", "Handover pack became the lasting artefact"] },
        { kicker: "Pattern", title: "What transfers", bullets: ["Do not defer data readiness", "Name owners at stream level", "Treat contingency language as a risk item"] },
        { kicker: "Use", title: "How we will use this", bullets: ["Annex the three analogues to the storyline", "Mirror the ownership model in the WBS", "Keep the commercial review on the critical path"] },
      ],
    },
    "risk-profile": {
      kind: "chart",
      title: "Risk exposure — Bluescope",
      xLabel: "Risk domain",
      yLabel: "Score (1–5)",
      legendVisible: true,
      categories: ["Governance", "Delivery", "Commercial", "Regulatory", "ESG"],
      series: [
        { name: "Inherent", color: "var(--status-error)", values: [4.4, 4.8, 3.2, 4.6, 3.6] },
        { name: "Residual", color: "var(--status-info)", values: [3.1, 4.1, 2.8, 3.4, 2.9] },
      ],
    },
    "use-case-map": {
      kind: "chart",
      title: "Tax Division use case map",
      xLabel: "Use case",
      yLabel: "Value / effort index",
      legendVisible: true,
      categories: ["TOFA support", "Transaction cost", "Joining events", "Workpapers", "Clearance"],
      series: [
        { name: "Value", color: "var(--status-active)", values: [4.6, 4.1, 3.8, 3.2, 2.7] },
        { name: "Effort", color: "var(--status-warning)", values: [2.4, 3.1, 3.6, 2.1, 2.8] },
      ],
    },
    frameworks: {
      kind: "model",
      nodes: [
        { id: "client", title: "Client", x: 40, y: 48, fields: ["name", "sector", "region"] },
        { id: "framework", title: "Risk framework", x: 276, y: 48, fields: ["version", "owner", "status"] },
        { id: "domain", title: "Risk domain", x: 512, y: 48, fields: ["name", "inherent", "residual"] },
        { id: "control", title: "Control", x: 276, y: 220, fields: ["id", "evidence", "frequency"] },
        { id: "owner", title: "Owner", x: 40, y: 220, fields: ["role", "name", "escalation"] },
        { id: "artefact", title: "Artefact", x: 512, y: 220, fields: ["type", "status", "updated"] },
      ],
      edges: [
        { from: "client", to: "framework" },
        { from: "framework", to: "domain" },
        { from: "framework", to: "control" },
        { from: "owner", to: "framework" },
        { from: "control", to: "artefact" },
        { from: "domain", to: "artefact" },
      ],
    },
    "commercial-assumptions": {
      kind: "model",
      nodes: [
        { id: "engagement", title: "Engagement", x: 276, y: 36, fields: ["name", "start", "duration"] },
        { id: "fee", title: "Fee envelope", x: 40, y: 200, fields: ["currency", "base", "contingency"] },
        { id: "phase", title: "Fee phase", x: 276, y: 200, fields: ["wave", "percent", "trigger"] },
        { id: "sensitivity", title: "Sensitivity", x: 512, y: 200, fields: ["case", "delta", "owner"] },
        { id: "assumption", title: "Assumption", x: 276, y: 352, fields: ["driver", "source", "confidence"] },
      ],
      edges: [
        { from: "engagement", to: "fee" },
        { from: "engagement", to: "phase" },
        { from: "engagement", to: "sensitivity" },
        { from: "fee", to: "assumption" },
        { from: "phase", to: "assumption" },
        { from: "sensitivity", to: "assumption" },
      ],
    },
  };

  ARTEFACTS.forEach(function (item) {
    item.type = item.category;
    item.updatedAt = item.meta;
    item.content = ARTEFACT_CONTENT[item.id] || { kind: item.category, title: item.title, blocks: [] };
    if (item.content.kind === "text" && !item.content.comments) item.content.comments = [];
    if (item.content.kind === "text" && typeof item.content.commentSeq !== "number") item.content.commentSeq = 0;
  });

  const STATUS_TONES = {
    progress: "active",
    draft: "warning",
    review: "warning",
    error: "error",
    completed: "idle",
    archived: "idle",
  };

  const STATUS_LABELS = {
    active: "Running",
    warning: "Needs attention",
    idle: "Idle",
    error: "Error",
  };

  const SUGGEST_PROMPTS = {
    proposal:
      "Draft a client proposal using the Proposal agent. Cover executive summary, strategy, analysis, budget, timeline, scope, risks, benefits and resources.",
    meetings:
      "Prep me for today's meetings: Tax Advice AI at 10:00, ACE Daily Standup at 11:30, and the Bluescope risk review at 15:00.",
    focus:
      "Help me focus before Tax Advice AI — Langfuse. Review the agenda and draft a confirmation note for Xiaowen.",
    emails:
      "Summarise my recent emails, starting with the ACE weekly pack, Bluescope follow-up, and TOFA working notes.",
    conflict:
      "Run a conflict check for the new client intake and summarise the two potential conflicts for Risk confirmation.",
    commercial:
      "Draft the commercial model for the current proposal, including fee phasing, contingency, and sensitivity cases.",
    wbs:
      "Continue drafting the work breakdown structure and align workstreams and owners to the current proposal scope.",
  };

  const STARTER_DEFAULTS = {
    proposal: { title: "Proposal – New engagement", meta: "Agent workspace created · Ready to start", status: "draft" },
    meetings: { title: "Meeting prep – Today", meta: "Briefing workspace created · Ready to start", status: "draft" },
    emails: { title: "Email summary – Inbox", meta: "Mailbox context attached · Ready to start", status: "draft" },
    custom: { title: "New CoE agent", meta: "Blank workspace · Ready to start", status: "draft" },
  };

  const AGENT_SESSIONS = {
    "risk-framework": {
      prompt:
        "Review the current proposal and prepare a risk framework assessment for the steering committee. Focus on delivery, governance, commercial and regulatory risks.",
      result:
        "The proposal is broadly viable, but I would address three issues before steering-committee review: governance ownership, delivery sequencing and regulatory dependency.",
      resultDetail: "I can turn this into a one-page risk summary or expand it into a full assessment.",
      flow: [
        {
          type: "user",
          text:
            "Review the current proposal and prepare a risk framework assessment for the steering committee. Focus on delivery, governance, commercial and regulatory risks.",
        },
        {
          type: "disclosure",
          demo: "agent-work-summary",
          label: "Worked for 4m 17s",
          items: [
            "Reviewed proposal context",
            "Checked risk framework requirements",
            "Compared governance criteria",
            "Drafted assessment structure",
          ],
        },
        {
          type: "disclosure",
          demo: "agent-thought-summary",
          label: "Thought briefly",
          paragraphs: [
            "I interpreted the request as a proposal risk-framework assessment focused on delivery, governance, commercial and regulatory considerations.",
            "The assessment should remain concise enough for steering-committee review while preserving the underlying evidence.",
          ],
        },
        {
          type: "primary",
          paragraphs: [
            "I'll focus the assessment on the risks most likely to affect approval, delivery confidence and governance accountability. That keeps the steering-committee note short without losing the evidence behind each rating.",
            "Commercial and regulatory items stay in scope, but they will be ranked by whether they can actually delay a steering decision.",
          ],
        },
        {
          type: "disclosure",
          demo: "agent-activity-files",
          label: "Explored 5 files · 3 searches",
          events: [
            { icon: "file-search", label: "Reviewed Proposal Risk Framework", detail: "Sections 2.1, 3.4 and 5.2", duration: "3s" },
            { icon: "search", label: "Searched governance requirements", detail: "Found 7 potentially relevant references", duration: "12s" },
            { icon: "file-text", label: "Reviewed Steering Committee Pack", duration: "4s" },
            { icon: "search", label: "Checked delivery-risk criteria", duration: "6s" },
            { icon: "file-search", label: "Reviewed Commercial Assumptions", duration: "3s" },
            { icon: "search", label: "Checked regulatory dependencies", duration: "5s" },
          ],
        },
        {
          type: "primary",
          paragraphs: [
            "I have the current proposal structure and supporting governance requirements. Next I'll map the key risks to practical mitigation actions so the committee can see both the issue and the recommended owner.",
            "The source pack is complete enough to rate residual risk; the gaps are ownership and sequence, not missing evidence.",
          ],
        },
        {
          type: "disclosure",
          demo: "agent-analysis",
          label: "Analysed 9 risk dimensions",
          items: ["Scope", "Risks", "Impact", "Control", "Timing", "Value", "Benefit", "Strategy", "Priority"],
        },
        {
          type: "primary",
          paragraphs: [
            "Three areas stand out as high priority: governance ownership, delivery sequencing and regulatory dependency. The remaining dimensions are either already controlled or can be monitored through the existing engagement process.",
            "I will keep the other six dimensions visible in the appendix so the committee can see what was considered, not only what was escalated.",
          ],
        },
        {
          type: "disclosure",
          label: "Reviewed 7 controls",
          events: [
            { icon: "circle-check", label: "Engagement quality review", duration: "2s" },
            { icon: "circle-check", label: "Independence confirmation", duration: "1s" },
            { icon: "circle-check", label: "Commercial sign-off path", duration: "2s" },
            { icon: "circle", label: "Named governance owner", detail: "Still unassigned in the current pack" },
            { icon: "circle", label: "Milestone dependency map", detail: "Delivery sequence is not locked" },
            { icon: "circle-check", label: "Risk register extract", duration: "3s" },
            { icon: "circle", label: "Regulatory review slot", detail: "Not sequenced against the steering date" },
          ],
        },
        {
          type: "primary",
          paragraphs: [
            "The existing controls reduce several operational risks, but two governance gaps remain unresolved. Those gaps should be closed before the pack is issued, or at least named with an owner and a date.",
            "Quality review, independence and commercial sign-off are already in place; they do not compensate for an unassigned owner or an unlocked delivery sequence.",
          ],
        },
        {
          type: "disclosure",
          label: "Drafted assessment outline",
          items: [
            "Issue, evidence and recommended action for each priority risk",
            "Residual rating after current controls",
            "Steering-committee decision requested",
          ],
        },
        {
          type: "primary",
          paragraphs: [
            "The outline is ready to convert into either a one-page summary or a fuller assessment, depending on how the committee wants to use it.",
            "Either format can keep the same three issues at the top so the conversation stays on the decisions that still need an owner.",
          ],
        },
        {
          type: "disclosure",
          label: "Mapped residual ratings",
          items: [
            "Governance ownership — high residual",
            "Delivery sequencing — high residual",
            "Regulatory dependency — high residual",
            "Commercial assumptions — moderate residual",
            "Operational controls — low residual",
          ],
        },
        {
          type: "primary",
          text: "Residual ratings confirm the same three issues. Commercial and operational items can stay on the monitor list rather than the decision list.",
        },
        {
          type: "final",
          demo: "agent-final-response",
          text: "The proposal is broadly viable, but I would address three issues before steering-committee review:",
          points: ["Governance ownership", "Delivery sequencing", "Regulatory dependency"],
          close: "I can turn this into a one-page risk summary or expand it into a full assessment.",
        },
      ],
    },
    "ace-weekly": {
      prompt:
        "Summarise the ACE Weekly Check-in and extract decisions, owners, and open questions I need before the next standup.",
      result:
        "The meeting confirmed two decisions and four open questions. Owners are assigned for the Langfuse follow-up and Bluescope risk review.",
      resultDetail: "Xiaowen owns the Langfuse confirmation note. The Bluescope risk pack still needs a reviewer before Friday.",
      flow: [
        {
          type: "user",
          text: "Summarise the ACE Weekly Check-in and extract decisions, owners, and open questions I need before the next standup.",
        },
        {
          type: "disclosure",
          demo: "agent-work-summary",
          label: "Worked for 2m 41s",
          items: ["Reviewed meeting transcript", "Extracted decisions and owners", "Captured open questions", "Drafted the review note"],
        },
        {
          type: "disclosure",
          demo: "agent-thought-summary",
          label: "Thought briefly",
          paragraphs: [
            "I treated this as a standup brief: decisions, named owners, and unresolved questions only.",
            "The note should be short enough to scan before the next ACE check-in.",
          ],
        },
        {
          type: "primary",
          text: "I'll pull decisions and owners first, then list the open questions that still need a reviewer.",
        },
        {
          type: "disclosure",
          demo: "agent-activity-files",
          label: "Explored 3 files · 2 searches",
          events: [
            { icon: "file-search", label: "Scanned ACE Weekly transcript", detail: "Decisions, owners and parking-lot items", duration: "8s" },
            { icon: "search", label: "Matched owners to action items", duration: "4s" },
            { icon: "database", label: "Checked prior standup notes", duration: "3s" },
            { icon: "file-text", label: "Reviewed previous action log", duration: "2s" },
          ],
        },
        {
          type: "primary",
          text: "Two decisions are confirmed. Four questions remain open, including the Bluescope reviewer and the Langfuse note.",
        },
        {
          type: "disclosure",
          demo: "agent-analysis",
          label: "Grouped 6 discussion threads",
          items: ["Langfuse follow-up", "Bluescope risk pack", "Tax Advice AI agenda", "Resourcing", "Client comms", "Open actions"],
        },
        {
          type: "primary",
          text: "Xiaowen owns the Langfuse confirmation note. The Bluescope risk pack still needs a named reviewer before Friday.",
        },
        {
          type: "final",
          demo: "agent-final-response",
          text: "Ready-to-review summary:",
          points: [
            "Decisions: Langfuse note assigned to Xiaowen; ACE standup time unchanged",
            "Open: Bluescope reviewer, Friday pack, Tax Advice AI confirmation, resourcing overlap",
          ],
          close: "I can turn this into a standup brief or continue in chat to draft the confirmation note.",
        },
      ],
    },
    "bluescope-insights": {
      prompt:
        "Extract the key Bluescope manufacturing insights and highlight margin, operations, and ESG themes for the client update.",
      result:
        "Five draft insights are ready. The strongest themes are margin pressure in manufacturing and an increasing ESG reporting load.",
      resultDetail: "Operations commentary is still in draft. I can continue in chat to tighten the client-ready wording.",
      flow: [
        {
          type: "user",
          text: "Extract the key Bluescope manufacturing insights and highlight margin, operations, and ESG themes for the client update.",
        },
        {
          type: "disclosure",
          demo: "agent-work-summary",
          label: "Worked for 3m 08s",
          items: ["Reviewed manufacturing pack", "Extracted commercial themes", "Flagged ESG reporting load", "Drafted insight summary"],
        },
        {
          type: "disclosure",
          demo: "agent-thought-summary",
          label: "Thought briefly",
          paragraphs: [
            "The update should stay client-ready: margin, operations and ESG only, without a full manufacturing recap.",
          ],
        },
        {
          type: "primary",
          text: "I'll extract the themes that change the client conversation, then keep the rest as supporting evidence.",
        },
        {
          type: "disclosure",
          demo: "agent-activity-files",
          label: "Explored 4 files · 2 searches",
          events: [
            { icon: "file-search", label: "Reviewed Bluescope manufacturing pack", duration: "7s" },
            { icon: "search", label: "Compared prior client insights", duration: "5s" },
            { icon: "globe", label: "Checked latest ESG reporting notes", duration: "4s" },
            { icon: "file-text", label: "Reviewed Precedent Insights Manufacturing", duration: "3s" },
          ],
        },
        {
          type: "primary",
          text: "Margin pressure and ESG reporting load are the two themes that should lead the client update.",
        },
        {
          type: "disclosure",
          demo: "agent-analysis",
          label: "Analysed 5 insight themes",
          items: ["Margin pressure", "Operations load", "ESG reporting", "Capacity", "Client comms"],
        },
        {
          type: "primary",
          text: "Operations commentary is still in draft. The other four insights are ready to tighten.",
        },
        {
          type: "final",
          demo: "agent-final-response",
          text: "Draft insight set for the client update:",
          points: [
            "Manufacturing margin pressure remains the lead commercial theme",
            "ESG reporting load is increasing and should be called out separately",
            "Operations commentary needs one more pass before sharing",
          ],
          close: "I can continue in chat to tighten the client-ready wording.",
        },
      ],
    },
    "wbs-draft": {
      prompt:
        "Continue drafting the work breakdown structure and align workstreams and owners to the current proposal scope.",
      result:
        "The structure is still drafting. Delivery, commercial, and risk workstreams are in place; owner alignment is the next gap.",
      resultDetail: "Two workstreams still need named owners before the WBS can be shared.",
      flow: [
        {
          type: "user",
          text: "Continue drafting the work breakdown structure and align workstreams and owners to the current proposal scope.",
        },
        {
          type: "disclosure",
          demo: "agent-work-summary",
          label: "Worked for 1m 52s",
          items: ["Reviewed proposal scope", "Mapped workstreams", "Assigned draft owners", "Flagged missing dependencies"],
        },
        {
          type: "disclosure",
          demo: "agent-thought-summary",
          label: "Thought briefly",
          paragraphs: [
            "The WBS should stay aligned to the current proposal scope rather than inventing additional workstreams.",
          ],
        },
        {
          type: "primary",
          text: "I'll keep delivery, commercial and risk as the core workstreams, then flag where owners are still missing.",
        },
        {
          type: "disclosure",
          demo: "agent-activity-files",
          label: "Explored 2 files · 1 search",
          events: [
            { icon: "search", label: "Reviewed current proposal scope", duration: "4s" },
            { icon: "database", label: "Aligned workstreams to owners", duration: "3s" },
            { icon: "file-text", label: "Checked Work Breakdown Structure artefact", duration: "2s" },
          ],
        },
        {
          type: "primary",
          text: "Delivery, commercial and risk are in place. Two workstreams still need named owners before the WBS can be shared.",
        },
        {
          type: "final",
          demo: "agent-final-response",
          text: "Current WBS status:",
          points: ["Core workstreams drafted", "Owner alignment incomplete on two streams", "Dependencies still need a named lead"],
          close: "Continue in chat to assign owners or expand the structure.",
        },
      ],
    },
  };

  const AGENT_DEMO_TARGETS = {
    "risk-framework": "agent-row-proposal",
    "ace-weekly": "agent-row-ace",
    "bluescope-insights": "agent-row-bluescope",
    "wbs-draft": "agent-row-wbs",
    "esg-proposal": "agent-row-esg",
  };

  const state = {
    selectedAgentId: null,
    chatAgentId: null,
    selectedArtefactId: null,
    selectedSuggest: null,
    searchQuery: "",
    artefactQuery: "",
    agentFilter: "all",
    artefactFilter: "all",
    artefactSort: "recent",
    openPopover: null,
    model: "GPT",
    contextItems: [],
    newAgentStarter: "proposal",
    agentsCollapsed: false,
    artefactsCollapsed: false,
    agentPanelState: "list",
    agentPanelView: "list",
    artefactPanelState: "list",
    artefactPanelView: "list",
    agentListScrollTop: 0,
    artefactListScrollTop: 0,
    artefactContextId: null,
    artefactFullscreen: false,
    artefactQuote: null,
    pendingQuotedSelection: null,
    mainChatMode: "landing",
    activeConversationId: null,
    conversations: {},
    activeMainChatSessionId: null,
    chatSessionType: null,
    searchModal: null,
    searchModalQuery: "",
    searchActiveIndex: 0,
  };

  const els = {
    agents: document.getElementById("aos-agents"),
    artefacts: document.getElementById("aos-artefacts"),
    agentsListView: document.getElementById("aos-agents-list-view"),
    agentsDetailView: document.getElementById("aos-agents-detail"),
    artefactsListView: document.getElementById("aos-artefacts-list-view"),
    artefactsDetailView: document.getElementById("aos-artefacts-detail"),
    artefactDetailTitle: document.getElementById("aos-artefact-detail-title"),
    artefactDetailIcon: document.getElementById("aos-artefact-detail-icon"),
    artefactToolbar: document.getElementById("aos-artefact-toolbar"),
    artefactViewer: document.getElementById("aos-artefact-viewer"),
    artefactFs: document.getElementById("aos-artefact-fs"),
    artefactFsTitle: document.getElementById("aos-artefact-fs-title"),
    artefactFsIcon: document.getElementById("aos-artefact-fs-icon"),
    artefactFsToolbar: document.getElementById("aos-artefact-fs-toolbar"),
    artefactFsViewer: document.getElementById("aos-artefact-fs-viewer"),
    composerQuote: document.getElementById("aos-composer-quote"),
    composerQuoteText: document.getElementById("aos-composer-quote-text"),
    composerQuoteMore: document.getElementById("aos-composer-quote-more"),
    textSelBar: document.getElementById("aos-text-selection-bar"),
    textCommentComposer: document.getElementById("aos-text-comment-composer"),
    textCommentThread: document.getElementById("aos-text-comment-thread"),
    agentList: document.getElementById("aos-agent-list"),
    artefactList: document.getElementById("aos-artefact-list"),
    composerInput: document.getElementById("aos-composer-input"),
    searchModal: document.getElementById("aos-search-modal"),
    searchModalInput: document.getElementById("aos-search-modal-input"),
    searchModalHeading: document.getElementById("aos-search-modal-heading"),
    searchModalResults: document.getElementById("aos-search-modal-results"),
    composerContext: document.getElementById("aos-composer-context"),
    composerChips: document.getElementById("aos-composer-chips"),
    composerAgent: document.getElementById("aos-composer-agent"),
    composerAgentDot: document.getElementById("aos-composer-agent-dot"),
    composerAgentLabel: document.getElementById("aos-composer-agent-label"),
    sendBtn: document.getElementById("aos-send"),
    homeHero: document.getElementById("aos-home-hero"),
    suggestRow: document.getElementById("aos-suggest-row"),
    suggestRail: document.getElementById("aos-suggest-rail"),
    session: document.getElementById("aos-session"),
    sessionTitle: document.getElementById("aos-session-title"),
    sessionMeta: document.getElementById("aos-session-meta"),
    thread: document.getElementById("aos-thread"),
    chatStage: document.getElementById("aos-chat-stage"),
    themeToggle: document.getElementById("aos-theme-toggle"),
    toast: document.getElementById("aos-toast"),
    modal: document.getElementById("aos-new-agent-modal"),
    newAgentName: document.getElementById("aos-new-agent-name"),
    modelLabel: document.getElementById("aos-model-label"),
    contextMenu: document.getElementById("aos-context-menu"),
    detailTitle: document.getElementById("aos-detail-title"),
    detailDot: document.getElementById("aos-detail-dot"),
    detailBody: document.getElementById("aos-detail-body"),
  };

  let panelViewTimer = null;
  let artefactPanelViewTimer = null;
  let panelFocusTimer = null;
  const artefactViewState = {};

  let agents = AGENTS.slice();
  let tooltipEl = null;
  let tooltipTimer = null;
  let toastTimer = null;
  let threadFollowBottom = true;
  const RUNTIME_SESSIONS = {};

  function currentConversation() {
    return state.activeConversationId ? state.conversations[state.activeConversationId] || null : null;
  }

  function messageId() {
    return "msg-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function typographicQuote(text) {
    const raw = String(text || "").trim();
    if (!raw) return "";
    return "“" + raw + "”";
  }

  function conversationIdForArtifact(artifactId) {
    return "conv-artifact-" + artifactId;
  }

  function applyMainChatMode(mode) {
    state.mainChatMode = mode === "conversation" ? "conversation" : "landing";
    if (app) app.dataset.chatMode = state.mainChatMode;
    const isConversation = state.mainChatMode === "conversation";
    if (els.homeHero) {
      els.homeHero.classList.toggle("aos-hidden", isConversation);
      els.homeHero.hidden = isConversation;
    }
    if (els.suggestRail) {
      els.suggestRail.classList.toggle("aos-hidden", isConversation);
      els.suggestRail.hidden = isConversation;
    }
    if (els.suggestRow) {
      els.suggestRow.classList.toggle("aos-hidden", isConversation);
      els.suggestRow.hidden = isConversation;
    }
    if (els.session) {
      els.session.classList.toggle("aos-hidden", !isConversation);
      els.session.hidden = !isConversation;
    }
    if (els.chatStage) els.chatStage.classList.toggle("is-session", isConversation);
    syncComposerPlaceholder();
  }

  function pendingQuoteText() {
    if (state.pendingQuotedSelection && state.pendingQuotedSelection.text) {
      return state.pendingQuotedSelection.text;
    }
    if (state.artefactQuote && state.artefactQuote.text) return state.artefactQuote.text;
    if (typeof state.artefactQuote === "string") return state.artefactQuote;
    return "";
  }

  function updateQuoteOverflow() {
    if (!els.composerQuote || !els.composerQuoteText || els.composerQuote.hidden) return;
    const overflow = els.composerQuoteText.scrollHeight > els.composerQuoteText.clientHeight + 2;
    els.composerQuote.classList.toggle("is-overflowing", overflow);
    if (els.composerQuoteMore) {
      els.composerQuoteMore.hidden = !overflow && !els.composerQuote.classList.contains("is-expanded");
    }
  }

  function toggleQuoteExpanded() {
    if (!els.composerQuote) return;
    const expanded = els.composerQuote.classList.toggle("is-expanded");
    if (els.composerQuoteMore) {
      els.composerQuoteMore.setAttribute("aria-expanded", expanded ? "true" : "false");
      els.composerQuoteMore.textContent = expanded ? "Show less" : "Show more";
    }
    updateQuoteOverflow();
  }

  function setPendingQuotedSelection(text, artifactId) {
    const excerpt = String(text || "").trim();
    if (!excerpt) return;
    state.pendingQuotedSelection = {
      text: excerpt,
      artifactId: artifactId || state.artefactContextId || null,
    };
    state.artefactQuote = { text: excerpt, artefactId: artifactId || state.selectedArtefactId };
    if (!els.composerQuote || !els.composerQuoteText) return;
    els.composerQuoteText.textContent = typographicQuote(excerpt);
    els.composerQuote.hidden = false;
    els.composerQuote.classList.remove("is-expanded", "is-overflowing");
    if (els.composerQuoteMore) {
      els.composerQuoteMore.hidden = true;
      els.composerQuoteMore.setAttribute("aria-expanded", "false");
      els.composerQuoteMore.textContent = "Show more";
    }
    refreshIcons();
    requestAnimationFrame(updateQuoteOverflow);
    syncComposerPlaceholder();
  }

  function clearPendingQuotedSelection() {
    state.pendingQuotedSelection = null;
    state.artefactQuote = null;
    if (els.composerQuote) {
      els.composerQuote.hidden = true;
      els.composerQuote.classList.remove("is-expanded", "is-overflowing");
    }
    if (els.composerQuoteText) els.composerQuoteText.textContent = "";
    if (els.composerQuoteMore) {
      els.composerQuoteMore.hidden = true;
      els.composerQuoteMore.setAttribute("aria-expanded", "false");
      els.composerQuoteMore.textContent = "Show more";
    }
    syncComposerPlaceholder();
  }

  function scrollThreadToLatest(force) {
    if (!els.thread) return;
    if (!force && !threadFollowBottom) return;
    els.thread.scrollTop = els.thread.scrollHeight;
  }

  function bindThreadScroll() {
    if (!els.thread) return;
    els.thread.addEventListener(
      "scroll",
      function () {
        const gap = els.thread.scrollHeight - els.thread.scrollTop - els.thread.clientHeight;
        threadFollowBottom = gap < 56;
      },
      { passive: true }
    );
  }

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons({ attrs: { "stroke-width": 1.75 } });
    }
  }

  function getTheme() {
    return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  }

  function syncThemeToggle() {
    if (!els.themeToggle) return;
    const isDark = getTheme() === "dark";
    const label = isDark ? "Light mode" : "Dark mode";
    const icon = els.themeToggle.querySelector("[data-lucide]");
    const span = els.themeToggle.querySelector("span");
    if (span) span.textContent = label;
    if (icon) icon.setAttribute("data-lucide", isDark ? "sun" : "moon");
    refreshIcons();
  }

  function setTheme(theme) {
    const next = theme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
      localStorage.setItem("aos-theme", next);
    } catch (e) {
      /* ignore */
    }
    syncThemeToggle();
  }

  function composerText() {
    return (els.composerInput && els.composerInput.innerText ? els.composerInput.innerText : "").trim();
  }

  function syncSend() {
    if (!els.sendBtn) return;
    const hasText = composerText().length > 0;
    els.sendBtn.disabled = !hasText;
    els.sendBtn.setAttribute("aria-label", hasText ? "Send" : "Send (disabled)");
  }

  function composerPlaceholder() {
    const conv = currentConversation();
    if (state.chatSessionType === "agent" && state.activeMainChatSessionId) {
      return FOLLOW_UP_PLACEHOLDER;
    }
    if (state.mainChatMode === "conversation" && conv && conv.messages && conv.messages.length) {
      return FOLLOW_UP_PLACEHOLDER;
    }
    if (pendingQuoteText()) {
      return QUOTE_PLACEHOLDER;
    }
    if (state.artefactContextId) {
      return ARTIFACT_PLACEHOLDER;
    }
    return DEFAULT_PLACEHOLDER;
  }

  function ensureArtifactConversation(artifact) {
    if (!artifact) return null;
    const id = conversationIdForArtifact(artifact.id);
    if (!state.conversations[id]) {
      state.conversations[id] = {
        id: id,
        type: "artifact",
        artifactId: artifact.id,
        title: artifact.title,
        messages: [],
        initialSelection: null,
        artifactContext: {
          id: artifact.id,
          title: artifact.title,
          type: artifact.category || artifact.type || "text",
        },
      };
    }
    state.activeConversationId = id;
    state.chatSessionType = "artifact";
    state.activeMainChatSessionId = id;
    return state.conversations[id];
  }

  function renderConversationMessage(message, options) {
    options = options || {};
    if (message.role === "user") {
      const wrap = document.createElement("article");
      wrap.className = "aos-detail-block aos-detail-block--user aos-detail-user";
      wrap.dataset.role = "user";
      wrap.dataset.messageId = message.id;
      wrap.setAttribute("data-demo-target", "user-message");
      wrap.innerHTML = '<div class="aos-detail-user__bubble">' + escapeHtml(message.content) + "</div>";
      return wrap;
    }
    return renderAssistantTurn(message, options);
  }

  function renderArtifactConversation(conversation) {
    if (!els.thread || !conversation) return;
    els.thread.innerHTML = "";
    conversation.messages.forEach(function (message) {
      els.thread.appendChild(renderConversationMessage(message));
    });
    if (els.sessionTitle) els.sessionTitle.textContent = conversation.title || "Conversation";
    if (els.sessionMeta) els.sessionMeta.textContent = "Focused on selected artifact content";
    if (els.session) {
      els.session.classList.add("aos-session--artifact");
      els.session.classList.remove("aos-session--agent");
      els.session.setAttribute("data-demo-target", "chat-conversation");
    }
    refreshIcons();
    applyMainChatMode("conversation");
    threadFollowBottom = true;
    requestAnimationFrame(function () {
      scrollThreadToLatest(true);
    });
  }

  function finalTextFromBlocks(blocks) {
    if (!blocks || !blocks.length) return "";
    for (let i = blocks.length - 1; i >= 0; i -= 1) {
      const block = blocks[i];
      if (block && (block.type === "final" || block.type === "final-response")) {
        return block.content || block.text || "";
      }
    }
    const last = blocks[blocks.length - 1];
    return (last && (last.content || last.text)) || "";
  }

  function artifactAssistantBlocks(text, turnIndex) {
    const prompt = String(text || "").toLowerCase();
    if (prompt.indexOf("20") !== -1 || prompt.indexOf("under") !== -1 || prompt.indexOf("short") !== -1) {
      return [
        {
          type: "activity-disclosure",
          label: "Applied the length constraint",
          paragraphs: [
            "I treated this as a wording constraint, not a change to the residual risk view. Ownership, accountability and escalation stay in the sentence.",
          ],
        },
        {
          type: "final",
          content:
            "Clarify governance ownership across critical workstreams to strengthen accountability and escalation before steering committee review.",
        },
      ];
    }
    if (prompt.indexOf("steering") !== -1 || prompt.indexOf("committee") !== -1) {
      return [
        {
          type: "activity-disclosure",
          label: "Thought briefly",
          paragraphs: [
            "I interpreted this as a request to make the language more executive and outcome-focused for steering-committee review.",
          ],
        },
        {
          type: "narrative",
          content: "I'll make the language more executive and outcome-focused.",
        },
        {
          type: "activity-disclosure",
          label: "Checked current document tone",
          events: [
            { icon: "file-text", label: "Selected paragraph" },
            { icon: "file-search", label: "Recommendations section" },
          ],
        },
        {
          type: "final",
          content:
            "Strengthen governance ownership across critical delivery workstreams to provide clear accountability and escalation ahead of steering committee review.",
        },
      ];
    }
    if (prompt.indexOf("concise") !== -1 || prompt.indexOf("action") !== -1 || turnIndex === 0) {
      return [
        {
          type: "activity-disclosure",
          label: "Thought briefly",
          paragraphs: [
            "I interpreted the request as a wording refinement rather than a change to the underlying risk assessment. The governance concepts of ownership, accountability and escalation should remain intact.",
          ],
        },
        {
          type: "narrative",
          content:
            "I'll tighten the wording around ownership, accountability and escalation while keeping the original risk meaning.",
        },
        {
          type: "activity-disclosure",
          label: "Reviewed selected context",
          events: [
            { icon: "file-text", label: "Selected paragraph" },
            { icon: "file-search", label: "Governance recommendations section" },
            { icon: "file-search", label: "Risk ownership table" },
          ],
        },
        {
          type: "narrative",
          content: "The surrounding recommendations use direct action language, so I'll align this sentence with that tone.",
        },
        {
          type: "activity-disclosure",
          label: "Compared 3 related sections",
          items: ["Executive summary", "Governance risks", "Recommended actions"],
        },
        {
          type: "narrative",
          content: "The revised wording can be shorter without losing the governance implication.",
        },
        {
          type: "final",
          content:
            "Clarify governance ownership across key delivery workstreams to strengthen accountability and escalation.",
        },
      ];
    }
    return [
      {
        type: "activity-disclosure",
        label: "Thought briefly",
        paragraphs: ["I treated this as a follow-up on the same selected excerpt, not a new assessment."],
      },
      {
        type: "final",
        content: "The selected excerpt remains the working source. I can refine tone, length, or emphasis as you continue.",
      },
    ];
  }

  let activeReveal = null;

  function cancelActiveReveal(flush) {
    if (!activeReveal) return;
    if (activeReveal.timer) window.clearTimeout(activeReveal.timer);
    if (flush && activeReveal.wrap && activeReveal.remaining && activeReveal.remaining.length) {
      activeReveal.remaining.forEach(function (block, index) {
        activeReveal.wrap.appendChild(renderFlowBlock(block, index));
      });
      refreshIcons();
    }
    activeReveal = null;
  }

  function revealAssistantBlocks(wrap, blocks) {
    cancelActiveReveal(true);
    if (!wrap || !blocks || !blocks.length) return;
    if (prefersReducedMotion) {
      blocks.forEach(function (block, index) {
        wrap.appendChild(renderFlowBlock(block, index));
      });
      refreshIcons();
      return;
    }
    const remaining = blocks.slice();
    activeReveal = { wrap: wrap, remaining: remaining, timer: null };
    function step() {
      if (!activeReveal || activeReveal.wrap !== wrap) return;
      if (activeReveal.attached && !wrap.isConnected) return;
      const block = remaining.shift();
      if (!block) {
        activeReveal = null;
        return;
      }
      wrap.appendChild(renderFlowBlock(block, wrap.children.length));
      activeReveal.attached = true;
      refreshIcons();
      scrollThreadToLatest(false);
      if (remaining.length) {
        activeReveal.timer = window.setTimeout(step, 220);
      } else {
        activeReveal = null;
      }
    }
    step();
  }

  function renderAssistantTurn(message, options) {
    options = options || {};
    const wrap = document.createElement("article");
    wrap.className = "aos-assistant-turn aos-detail-block aos-detail-block--primary";
    wrap.dataset.role = "assistant";
    wrap.dataset.messageId = message.id;
    wrap.setAttribute("data-demo-target", "assistant-message");
    const blocks = (message.blocks && message.blocks.length
      ? message.blocks
      : [{ type: "final", content: message.content || "" }]
    ).map(function (block) {
      return Object.assign({}, block, { nested: true });
    });
    if (options.reveal) {
      revealAssistantBlocks(wrap, blocks);
    } else {
      blocks.forEach(function (block, index) {
        wrap.appendChild(renderFlowBlock(block, index));
      });
    }
    return wrap;
  }

  function appendArtifactTurn(conversation, userText, quoteText) {
    if (!conversation) return;
    cancelActiveReveal(true);
    const userMessage = {
      id: messageId(),
      role: "user",
      content: userText,
      contextRefs: quoteText
        ? [{ type: "artifact-selection", excerpt: quoteText, artifactId: conversation.artifactId }]
        : [],
    };
    const assistantCount = conversation.messages.filter(function (item) {
      return item.role === "assistant";
    }).length;
    const blocks = artifactAssistantBlocks(userText, assistantCount);
    const assistantMessage = {
      id: messageId(),
      role: "assistant",
      blocks: blocks,
      content: finalTextFromBlocks(blocks),
    };
    conversation.messages.push(userMessage, assistantMessage);
    if (!conversation.initialSelection && quoteText) conversation.initialSelection = quoteText;
    if (els.thread) {
      els.thread.appendChild(renderConversationMessage(userMessage));
      els.thread.appendChild(renderConversationMessage(assistantMessage, { reveal: true }));
    }
    refreshIcons();
    threadFollowBottom = true;
    requestAnimationFrame(function () {
      scrollThreadToLatest(true);
    });
  }

  function enterArtifactConversation(artifact, quoteText) {
    const conversation = ensureArtifactConversation(artifact);
    if (quoteText && !conversation.initialSelection) conversation.initialSelection = quoteText;
    ensureArtefactContextChip(artifact);
    if (quoteText) setPendingQuotedSelection(quoteText, artifact.id);
    renderArtifactConversation(conversation);
    syncComposerPlaceholder();
  }

  function syncComposerPlaceholder() {
    if (!els.composerInput) return;
    els.composerInput.setAttribute("data-placeholder", composerPlaceholder());
  }

  function showToast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.hidden = false;
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      els.toast.hidden = true;
    }, 2200);
  }

  function closePopovers(exceptId) {
    document.querySelectorAll(".aos-popover").forEach(function (pop) {
      if (exceptId && pop.id === exceptId) return;
      pop.hidden = true;
    });
    document.querySelectorAll("[aria-expanded='true']").forEach(function (btn) {
      if (btn.hasAttribute("data-collapse")) return;
      if (exceptId && btn.getAttribute("aria-controls") === exceptId) return;
      btn.setAttribute("aria-expanded", "false");
    });
    state.openPopover = exceptId || null;
  }

  function placeFixedPopover(popover, trigger, preferred) {
    popover.style.position = "fixed";
    popover.style.right = "auto";
    popover.hidden = false;
    const rect = trigger.getBoundingClientRect();
    const tip = popover.getBoundingClientRect();
    const gap = 8;
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    let place = preferred === "top" ? "top" : "bottom";
    if (preferred === "top" && spaceAbove < tip.height + gap && spaceBelow > spaceAbove) {
      place = "bottom";
    }
    if (preferred !== "top" && spaceBelow < tip.height + gap && spaceAbove > spaceBelow) {
      place = "top";
    }
    let top = place === "top" ? rect.top - tip.height - gap : rect.bottom + gap;
    let left = rect.left;
    if (left + tip.width > window.innerWidth - 8) left = window.innerWidth - tip.width - 8;
    if (left < 8) left = 8;
    if (left < rect.left && left + tip.width < rect.right) left = Math.max(8, rect.right - tip.width);
    if (top < 8) top = 8;
    if (top + tip.height > window.innerHeight - 8) top = Math.max(8, window.innerHeight - tip.height - 8);
    popover.style.top = Math.round(top) + "px";
    popover.style.left = Math.round(left) + "px";
    popover.dataset.placement = place;
  }

  function togglePopover(btn, popover, preferred) {
    if (!btn || !popover) return;
    const willOpen = popover.hidden;
    closePopovers(willOpen ? popover.id : null);
    popover.hidden = !willOpen;
    btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
    state.openPopover = willOpen ? popover.id : null;
    if (willOpen && popover.classList.contains("aos-popover--fixed")) {
      placeFixedPopover(popover, btn, preferred || popover.getAttribute("data-prefer") || "bottom");
    }
  }

  function searchItems() {
    const type = state.searchModal;
    const q = (state.searchModalQuery || "").trim().toLowerCase();
    if (type === "artifacts") {
      const pool = q
        ? ARTEFACTS.filter(function (item) {
            return (
              item.title.toLowerCase().indexOf(q) !== -1 ||
              item.category.toLowerCase().indexOf(q) !== -1 ||
              item.meta.toLowerCase().indexOf(q) !== -1
            );
          })
        : ARTEFACTS.slice(0, 6);
      return pool.map(function (item) {
        return { kind: "artifact", id: item.id, item: item };
      });
    }
    const pool = q
      ? agents.filter(function (agent) {
          return (
            agent.title.toLowerCase().indexOf(q) !== -1 ||
            agent.meta.toLowerCase().indexOf(q) !== -1 ||
            (agent.status && agent.status.toLowerCase().indexOf(q) !== -1)
          );
        })
      : agents.slice(0, 6);
    return pool.map(function (agent) {
      return { kind: "agent", id: agent.id, item: agent };
    });
  }

  function renderSearchResults() {
    if (!els.searchModalResults) return;
    const items = searchItems();
    if (state.searchActiveIndex >= items.length) state.searchActiveIndex = Math.max(0, items.length - 1);
    els.searchModalResults.innerHTML = "";
    if (!items.length) {
      const empty = createEl("p", "aos-search-modal__empty");
      empty.textContent = state.searchModal === "artifacts" ? "No artefacts found." : "No agents found.";
      els.searchModalResults.appendChild(empty);
      refreshIcons();
      return;
    }
    items.forEach(function (entry, index) {
      if (entry.kind === "artifact") {
        const item = entry.item;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "aos-artefact" + (index === state.searchActiveIndex ? " is-active" : "");
        btn.setAttribute("role", "option");
        btn.setAttribute("aria-selected", index === state.searchActiveIndex ? "true" : "false");
        btn.dataset.searchIndex = String(index);
        btn.dataset.searchId = item.id;
        btn.innerHTML =
          '<span class="aos-artefact__icon"><i data-lucide="' +
          (CATEGORY_ICONS[item.category] || "file-text") +
          '" aria-hidden="true"></i></span><span class="aos-artefact__copy"><p class="aos-artefact__title"></p><p class="aos-artefact__meta"></p></span>';
        btn.querySelector(".aos-artefact__title").textContent = item.title;
        btn.querySelector(".aos-artefact__meta").textContent = item.meta;
        els.searchModalResults.appendChild(btn);
        return;
      }
      const agent = entry.item;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "aos-agent" + (index === state.searchActiveIndex ? " is-active" : "");
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", index === state.searchActiveIndex ? "true" : "false");
      btn.setAttribute("data-demo-target", "search-result-agent");
      btn.dataset.searchIndex = String(index);
      btn.dataset.searchId = agent.id;
      const tone = STATUS_TONES[agent.status] || "idle";
      btn.innerHTML =
        '<span class="aos-agent__dot" data-tone="' +
        tone +
        '"></span><span class="aos-agent__copy"><p class="aos-agent__title"></p><p class="aos-agent__meta-row"><span class="aos-agent__meta"></span><span class="aos-agent__time"></span></p></span>';
      btn.querySelector(".aos-agent__title").textContent = agent.title;
      btn.querySelector(".aos-agent__meta").textContent = agent.meta;
      btn.querySelector(".aos-agent__time").textContent = agent.stamp || "";
      els.searchModalResults.appendChild(btn);
    });
    refreshIcons();
    const active = els.searchModalResults.querySelector(".is-active");
    if (active && active.scrollIntoView) active.scrollIntoView({ block: "nearest" });
  }

  function syncSearchHeading() {
    if (!els.searchModalHeading) return;
    const q = (state.searchModalQuery || "").trim();
    if (state.searchModal === "artifacts") {
      els.searchModalHeading.textContent = q ? "Artefacts" : "Recently opened";
    } else {
      els.searchModalHeading.textContent = q ? "Agents" : "Recent agents";
    }
  }

  function openSearchModal(type) {
    if (!els.searchModal) return;
    closePopovers();
    closeModal();
    hideTooltip();
    state.searchModal = type === "artifacts" ? "artifacts" : "agents";
    state.searchModalQuery = "";
    state.searchActiveIndex = 0;
    els.searchModal.hidden = false;
    els.searchModal.dataset.searchType = state.searchModal;
    if (els.searchModalInput) {
      els.searchModalInput.value = "";
      els.searchModalInput.placeholder = state.searchModal === "artifacts" ? "Search artifacts" : "Search agents";
    }
    const agentBtn = document.getElementById("aos-agent-search-btn");
    const artBtn = document.getElementById("aos-artefact-search-btn");
    if (agentBtn) agentBtn.setAttribute("aria-expanded", state.searchModal === "agents" ? "true" : "false");
    if (artBtn) artBtn.setAttribute("aria-expanded", state.searchModal === "artifacts" ? "true" : "false");
    syncSearchHeading();
    renderSearchResults();
    window.requestAnimationFrame(function () {
      if (els.searchModalInput) els.searchModalInput.focus();
    });
  }

  function closeSearchModal() {
    if (!els.searchModal) return;
    els.searchModal.hidden = true;
    state.searchModal = null;
    state.searchModalQuery = "";
    state.searchActiveIndex = 0;
    const agentBtn = document.getElementById("aos-agent-search-btn");
    const artBtn = document.getElementById("aos-artefact-search-btn");
    if (agentBtn) agentBtn.setAttribute("aria-expanded", "false");
    if (artBtn) artBtn.setAttribute("aria-expanded", "false");
  }

  function selectSearchResult(index) {
    const items = searchItems();
    const entry = items[typeof index === "number" ? index : state.searchActiveIndex];
    if (!entry) return;
    closeSearchModal();
    if (entry.kind === "artifact") {
      openArtefactDetail(entry.id);
      return;
    }
    if (state.agentsCollapsed) setAgentsCollapsed(false);
    const agent = findAgent(entry.id);
    if (agent) openAgentDetail(agent);
  }

  function setRadioGroup(selector, value, attr) {
    document.querySelectorAll(selector).forEach(function (item) {
      const match = item.getAttribute(attr) === value;
      item.classList.toggle("is-selected", match);
      item.setAttribute("aria-checked", match ? "true" : "false");
    });
  }

  function visibleAgents() {
    const q = state.searchQuery.toLowerCase();
    return agents.filter(function (agent) {
      const statusOk = state.agentFilter === "all" || agent.status === state.agentFilter;
      const textOk = !q || agent.title.toLowerCase().indexOf(q) !== -1 || agent.meta.toLowerCase().indexOf(q) !== -1;
      return statusOk && textOk;
    });
  }

  function visibleArtefacts() {
    const q = state.artefactQuery.toLowerCase();
    return ARTEFACTS.filter(function (item) {
      const catOk = state.artefactFilter === "all" || item.category === state.artefactFilter;
      const sortOk =
        state.artefactSort === "recent" ||
        (state.artefactSort === "shared" && item.owner === "shared") ||
        (state.artefactSort === "mine" && item.owner === "mine");
      const textOk = !q || item.title.toLowerCase().indexOf(q) !== -1;
      return catOk && sortOk && textOk;
    });
  }

  function renderAgents() {
    if (!els.agentList) return;
    const items = visibleAgents();
    els.agentList.innerHTML = "";
    if (!items.length) {
      els.agentList.innerHTML = '<p class="aos-empty">No agents match this filter.</p>';
      return;
    }
    let currentDate = "";
    items.forEach(function (agent, index) {
      if (agent.date !== currentDate) {
        currentDate = agent.date;
        const dateEl = document.createElement("p");
        dateEl.className = "aos-date";
        dateEl.textContent = agent.date;
        const wrap = document.createElement("div");
        wrap.className = "aos-date-group";
        wrap.appendChild(dateEl);
        els.agentList.appendChild(wrap);
      }
      const group = els.agentList.lastElementChild;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "aos-agent" + (agent.id === state.chatAgentId ? " is-selected" : "");
      btn.dataset.agentId = agent.id;
      btn.setAttribute("data-demo-target", AGENT_DEMO_TARGETS[agent.id] || (index === 0 ? "recent-agent" : "agent-row-" + agent.id));
      if (index === 0) btn.setAttribute("data-demo-recent", "true");
      const tone = STATUS_TONES[agent.status] || "idle";
      btn.innerHTML =
        '<span class="aos-agent__dot" data-tone="' +
        tone +
        '" data-tooltip="' +
        STATUS_LABELS[tone] +
        '"></span><span class="aos-agent__copy"><p class="aos-agent__title"></p><p class="aos-agent__meta-row"><span class="aos-agent__meta"></span><span class="aos-agent__time"></span></p></span>';
      btn.querySelector(".aos-agent__title").textContent = agent.title;
      btn.querySelector(".aos-agent__meta").textContent = agent.meta;
      btn.querySelector(".aos-agent__time").textContent = agent.stamp || "";
      group.appendChild(btn);
    });
  }

  function renderArtefacts() {
    if (!els.artefactList) return;
    const items = visibleArtefacts();
    els.artefactList.innerHTML = "";
    if (!items.length) {
      els.artefactList.innerHTML = '<p class="aos-empty">No artefacts match this filter.</p>';
      return;
    }
    items.forEach(function (item) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "aos-artefact" + (item.id === state.selectedArtefactId ? " is-selected" : "");
      btn.dataset.artefactId = item.id;
      btn.setAttribute("data-demo-target", "artifact-row");
      btn.innerHTML =
        '<span class="aos-artefact__icon"><i data-lucide="' +
        (CATEGORY_ICONS[item.category] || "file-text") +
        '" aria-hidden="true"></i></span><span class="aos-artefact__copy"><p class="aos-artefact__title"></p><p class="aos-artefact__meta"></p></span>';
      btn.querySelector(".aos-artefact__title").textContent = item.title;
      btn.querySelector(".aos-artefact__meta").textContent = item.meta;
      els.artefactList.appendChild(btn);
    });
    refreshIcons();
  }

  function renderContext() {
    if (!els.composerContext) return;
    const addBtn = document.getElementById("aos-add-context");
    const chipHost = els.composerChips || els.composerContext;
    if (els.composerChips) {
      els.composerChips.innerHTML = "";
    } else {
      els.composerContext.innerHTML = "";
    }
    if (addBtn) {
      const hasContext = state.contextItems.length > 0;
      addBtn.classList.toggle("is-compact", hasContext);
      addBtn.setAttribute("aria-label", "Add context");
      addBtn.setAttribute("title", "Add context");
      addBtn.setAttribute("data-tooltip", "Add context");
      els.composerContext.insertBefore(addBtn, chipHost === els.composerContext ? els.composerContext.firstChild : chipHost);
    }
    state.contextItems.forEach(function (raw) {
      const item = normalizeContext(raw);
      const chip = document.createElement("span");
      chip.className = "aos-attachment";
      chip.innerHTML =
        '<span class="aos-attachment__icon"><i data-lucide="' +
        (item.icon || "paperclip") +
        '" aria-hidden="true"></i></span>' +
        '<span class="aos-attachment__label"></span>' +
        '<button type="button" class="aos-attachment__remove" aria-label="Remove context"><i data-lucide="x" aria-hidden="true"></i></button>';
      chip.querySelector(".aos-attachment__label").textContent = item.label;
      chip.querySelector(".aos-attachment__remove").addEventListener("click", function (e) {
        e.stopPropagation();
        removeContextItem(item.id);
      });
      chipHost.appendChild(chip);
    });
    refreshIcons();
  }

  function normalizeContext(item) {
    if (typeof item === "string") {
      return { id: item, label: item, kind: "generic", icon: "paperclip" };
    }
    return item;
  }

  function removeContextItem(id) {
    state.contextItems = state.contextItems.filter(function (raw) {
      return normalizeContext(raw).id !== id;
    });
    if (state.artefactContextId && ("artefact:" + state.artefactContextId) === id) {
      state.artefactContextId = null;
    }
    renderContext();
    syncComposerPlaceholder();
  }

  function showHome() {
    state.selectedAgentId = null;
    state.chatAgentId = null;
    state.selectedSuggest = null;
    state.activeMainChatSessionId = null;
    state.chatSessionType = null;
    state.activeConversationId = null;
    state.agentPanelView = "list";
    clearPendingQuotedSelection();
    if (els.thread) els.thread.innerHTML = "";
    if (els.session) {
      els.session.classList.remove("aos-session--artifact", "aos-session--agent", "is-handoff");
    }
    applyMainChatMode("landing");
    document.querySelectorAll(".aos-suggest").forEach(function (card) {
      card.classList.remove("is-selected");
    });
    setComposerAgent(null);
    applyAgentPanelState({ animate: false });
    renderAgents();
  }

  function openSession(agent, userPrompt, options) {
    options = options || {};
    state.selectedAgentId = agent.id;
    state.chatAgentId = agent.id;
    state.activeMainChatSessionId = agent.id;
    state.chatSessionType = "agent";
    state.activeConversationId = "conv-agent-" + agent.id;
    applyMainChatMode("conversation");
    if (els.session) {
      els.session.classList.add("aos-session--agent");
      els.session.classList.remove("aos-session--artifact");
      els.session.setAttribute("data-demo-target", "chat-conversation");
    }
    if (els.sessionTitle) els.sessionTitle.textContent = agent.title;
    if (els.sessionMeta) els.sessionMeta.textContent = agent.meta;
    const reply = options.reply || agent.reply;
    if (!AGENT_SESSIONS[agent.id] && !RUNTIME_SESSIONS[agent.id]) {
      RUNTIME_SESSIONS[agent.id] = { flow: [] };
    }
    const session = sessionForAgent(agent);
    if (userPrompt && session.flow && !session.flow.some(function (block) { return block.type === "user" && block.text === userPrompt; })) {
      session.flow.push({ type: "user", text: userPrompt }, { type: "primary", text: reply });
    }
    if (els.thread) {
      els.thread.innerHTML = "";
      if (userPrompt) {
        els.thread.appendChild(renderFlowBlock({ type: "user", text: userPrompt }, 0));
        els.thread.appendChild(renderFlowBlock({ type: "primary", text: reply }, 1));
      } else if (session.flow && session.flow.length) {
        session.flow.forEach(function (block, index) {
          els.thread.appendChild(renderFlowBlock(block, index));
        });
      } else if (reply) {
        els.thread.appendChild(renderFlowBlock({ type: "primary", text: reply }, 0));
      }
      threadFollowBottom = true;
      requestAnimationFrame(function () {
        scrollThreadToLatest(true);
      });
    }
    setComposerAgent(agent);
    syncComposerPlaceholder();
    renderAgents();
    refreshIcons();
  }

  function findAgent(id) {
    return agents.find(function (agent) {
      return agent.id === id;
    });
  }

  function agentContextLabel(agent) {
    if (!agent || !agent.title) return "";
    const parts = agent.title.split("–");
    if (parts.length > 1) return parts[0].trim() + " Agent";
    return agent.title;
  }

  function sessionForAgent(agent) {
    if (!agent) return { flow: [] };
    if (AGENT_SESSIONS[agent.id]) return AGENT_SESSIONS[agent.id];
    if (RUNTIME_SESSIONS[agent.id]) return RUNTIME_SESSIONS[agent.id];
    const prompt = "Continue this workspace and summarise current progress, blockers, and the next recommended action.";
    RUNTIME_SESSIONS[agent.id] = {
      prompt: prompt,
      result: agent.reply,
      resultDetail: "",
      flow: [
        { type: "user", text: prompt },
        {
          type: "disclosure",
          demo: "agent-work-summary",
          label: "Worked for 1m 12s",
          items: ["Reviewed current workspace", "Summarised progress", "Flagged blockers", "Recommended next action"],
        },
        {
          type: "disclosure",
          demo: "agent-thought-summary",
          label: "Thought briefly",
          paragraphs: ["I treated this as a progress check against the stated outcome, not a full re-plan."],
        },
        { type: "primary", text: "I'll summarise progress first, then call out anything that still blocks the next step." },
        {
          type: "disclosure",
          demo: "agent-activity-files",
          label: "Explored 2 files · 1 search",
          events: [
            { icon: "search", label: "Reviewed workspace context", duration: "3s" },
            { icon: "file-search", label: "Checked related artefacts", duration: "2s" },
          ],
        },
        { type: "primary", text: agent.reply },
        {
          type: "final",
          demo: "agent-final-response",
          text: agent.reply,
          close: "Continue in chat to refine the next action.",
        },
      ],
    };
    return RUNTIME_SESSIONS[agent.id];
  }

  function setComposerAgent(agent) {
    if (!els.composerAgent) return;
    if (!agent) {
      els.composerAgent.hidden = true;
      if (els.composerAgentLabel) els.composerAgentLabel.textContent = "";
      return;
    }
    els.composerAgent.hidden = false;
    if (els.composerAgentLabel) els.composerAgentLabel.textContent = agentContextLabel(agent);
    if (els.composerAgentDot) els.composerAgentDot.setAttribute("data-tone", STATUS_TONES[agent.status] || "idle");
  }

  function resolveAgentPanelState() {
    if (state.agentsCollapsed) return "closed";
    if (state.agentPanelView === "detail" && state.selectedAgentId) return "detail";
    return "list";
  }

  function syncCollapseButtons() {
    const collapsed = state.agentsCollapsed;
    const label = collapsed ? "Expand sidebar" : "Collapse sidebar";
    const iconName = collapsed ? "panel-left-open" : "panel-left-close";
    ["aos-agents-collapse", "aos-agents-collapse-detail"].forEach(function (id) {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
      btn.setAttribute("data-tooltip", label);
      const icon = btn.querySelector("[data-lucide]");
      if (icon) icon.setAttribute("data-lucide", iconName);
    });
  }

  function setStackedPanelViews(listView, detailView, next, animate, timerKey) {
    if (!listView || !detailView) return;
    if (timerKey === "artefact" && artefactPanelViewTimer) {
      window.clearTimeout(artefactPanelViewTimer);
      artefactPanelViewTimer = null;
    }
    if (timerKey !== "artefact" && panelViewTimer) {
      window.clearTimeout(panelViewTimer);
      panelViewTimer = null;
    }

    const showDetail = next === "detail";
    if (!animate || prefersReducedMotion) {
      listView.hidden = showDetail;
      detailView.hidden = !showDetail;
      listView.classList.toggle("is-visible", !showDetail);
      detailView.classList.toggle("is-visible", showDetail);
      listView.classList.remove("is-exit", "is-enter");
      detailView.classList.remove("is-exit", "is-enter");
      return;
    }

    const incoming = showDetail ? detailView : listView;
    const outgoing = showDetail ? listView : detailView;
    incoming.hidden = false;
    incoming.classList.add("is-enter");
    incoming.classList.remove("is-visible", "is-exit");
    outgoing.classList.add("is-exit");
    outgoing.classList.remove("is-visible");

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        incoming.classList.remove("is-enter");
        incoming.classList.add("is-visible");
      });
    });

    const timer = window.setTimeout(function () {
      outgoing.hidden = true;
      outgoing.classList.remove("is-exit");
      incoming.classList.add("is-visible");
      incoming.classList.remove("is-enter");
      if (timerKey === "artefact") artefactPanelViewTimer = null;
      else panelViewTimer = null;
    }, 200);
    if (timerKey === "artefact") artefactPanelViewTimer = timer;
    else panelViewTimer = timer;
  }

  function setPanelViews(next, animate) {
    setStackedPanelViews(els.agentsListView, els.agentsDetailView, next, animate, "agent");
  }

  function setArtefactPanelViews(next, animate) {
    setStackedPanelViews(els.artefactsListView, els.artefactsDetailView, next, animate, "artefact");
  }

  function applyAgentPanelState(options) {
    options = options || {};
    const panelState = resolveAgentPanelState();
    state.agentPanelState = panelState;
    if (app) {
      app.dataset.agentsState = panelState;
      app.classList.toggle("is-agents-collapsed", panelState === "closed");
      app.classList.toggle("is-agents-detail", panelState === "detail");
    }
    if (els.agents) els.agents.dataset.panelState = panelState;
    if (panelState === "closed") {
      setPanelViews("list", false);
    } else {
      setPanelViews(panelState, options.animate !== false);
    }
    syncCollapseButtons();
    refreshIcons();
    syncSuggestFade();
  }

  function applyArtefactPanelState(options) {
    options = options || {};
    const panelState = resolveArtefactPanelState();
    state.artefactPanelState = panelState;
    if (app) {
      app.dataset.artefactsState = panelState;
      app.classList.toggle("is-artefacts-collapsed", panelState === "closed");
      app.classList.toggle("is-artefacts-detail", panelState === "detail");
    }
    if (els.artefacts) els.artefacts.dataset.panelState = panelState;
    if (panelState === "closed") {
      setArtefactPanelViews("list", false);
    } else {
      setArtefactPanelViews(panelState, options.animate !== false);
    }
    syncArtefactCollapseButtons();
    refreshIcons();
    syncSuggestFade();
  }

  function resolveArtefactPanelState() {
    if (state.artefactsCollapsed) return "closed";
    if (state.artefactPanelView === "detail" && state.selectedArtefactId) return "detail";
    return "list";
  }

  function syncArtefactCollapseButtons() {
    const collapsed = state.artefactsCollapsed;
    const label = collapsed ? "Expand artefacts" : "Collapse artefacts";
    const iconName = collapsed ? "panel-right-open" : "panel-right-close";
    ["aos-artefacts-collapse", "aos-artefacts-collapse-detail"].forEach(function (id) {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
      btn.setAttribute("data-tooltip", label);
      const icon = btn.querySelector("[data-lucide]");
      if (icon) icon.setAttribute("data-lucide", iconName);
    });
  }

  function scheduleExclusiveExpand(fn, delay) {
    if (panelFocusTimer) {
      window.clearTimeout(panelFocusTimer);
      panelFocusTimer = null;
    }
    if (!delay) {
      fn();
      return;
    }
    panelFocusTimer = window.setTimeout(function () {
      panelFocusTimer = null;
      fn();
    }, delay);
  }

  function createEl(tag, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    return el;
  }

  function setTraceExpanded(trace, open) {
    if (!trace) return;
    const btn = trace.querySelector(".aos-trace__toggle");
    const body = trace.querySelector(".aos-trace__body");
    trace.classList.toggle("is-open", open);
    if (btn) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.ariaExpanded = open;
      const chev = btn.querySelector(".aos-trace__chevron");
      if (chev) {
        const icon = document.createElement("i");
        icon.setAttribute("data-lucide", open ? "chevron-down" : "chevron-right");
        icon.className = "aos-trace__chevron";
        icon.setAttribute("aria-hidden", "true");
        chev.replaceWith(icon);
        refreshIcons();
      }
    }
    if (body) body.setAttribute("aria-hidden", open ? "false" : "true");
  }

  function bindTraceContainer(container) {
    if (!container || container.dataset.traceBound === "true") return;
    container.dataset.traceBound = "true";
    container.addEventListener("click", function (e) {
      const toggle = e.target.closest(".aos-trace__toggle");
      if (!toggle || !container.contains(toggle)) return;
      const trace = toggle.closest(".aos-trace");
      if (!trace) return;
      setTraceExpanded(trace, !trace.classList.contains("is-open"));
    });
  }

  function renderDisclosure(block) {
    const wrap = createEl("div", "aos-trace");
    if (block.demo) wrap.setAttribute("data-demo-target", block.demo);
    const toggle = createEl("button", "aos-trace__toggle");
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", "false");
    const label = createEl("span", "aos-trace__label");
    label.textContent = block.label;
    const chev = document.createElement("i");
    chev.setAttribute("data-lucide", "chevron-right");
    chev.className = "aos-trace__chevron";
    chev.setAttribute("aria-hidden", "true");
    toggle.appendChild(label);
    toggle.appendChild(chev);
    const body = createEl("div", "aos-trace__body");
    body.setAttribute("aria-hidden", "true");
    const inner = createEl("div", "aos-trace__inner");
    if (block.paragraphs) {
      block.paragraphs.forEach(function (text) {
        const p = createEl("p", "aos-trace__copy");
        p.textContent = text;
        inner.appendChild(p);
      });
    }
    if (block.items) {
      const list = createEl("ul", "aos-trace__list");
      block.items.forEach(function (item) {
        const li = createEl("li", "aos-trace__item");
        li.textContent = item;
        list.appendChild(li);
      });
      inner.appendChild(list);
    }
    if (block.events) {
      const list = createEl("ul", "aos-trace__list");
      block.events.forEach(function (event) {
        const li = createEl("li", "aos-trace__event");
        const icon = document.createElement("i");
        icon.setAttribute("data-lucide", event.icon || "search");
        icon.setAttribute("aria-hidden", "true");
        const copy = createEl("div", "aos-trace__event-copy");
        const title = createEl("div");
        title.textContent = event.label;
        copy.appendChild(title);
        if (event.detail) {
          const nested = createEl("p", "aos-trace__nested");
          nested.textContent = event.detail;
          copy.appendChild(nested);
        }
        li.appendChild(icon);
        li.appendChild(copy);
        if (event.duration) {
          const meta = createEl("span", "aos-trace__event-meta");
          meta.textContent = event.duration;
          li.appendChild(meta);
        }
        list.appendChild(li);
      });
      inner.appendChild(list);
    }
    body.appendChild(inner);
    wrap.appendChild(toggle);
    wrap.appendChild(body);
    return wrap;
  }

  function normalizeChatBlock(block) {
    if (!block) return { type: "primary", text: "" };
    const type = block.type;
    if (type === "activity-disclosure") {
      const next = Object.assign({}, block, { type: "disclosure" });
      if (!next.paragraphs && !next.items && !next.events && Array.isArray(block.details)) {
        if (block.details[0] && typeof block.details[0] === "object") {
          next.events = block.details;
        } else {
          next.paragraphs = block.details;
        }
      } else if (!next.paragraphs && typeof block.details === "string") {
        next.paragraphs = [block.details];
      }
      return next;
    }
    if (type === "narrative" || type === "agent-narrative") {
      return Object.assign({}, block, {
        type: "primary",
        text: block.content || block.text,
        paragraphs: block.paragraphs,
      });
    }
    if (type === "final-response") {
      return Object.assign({}, block, {
        type: "final",
        text: block.content || block.text,
      });
    }
    if (type === "final" || type === "primary") {
      return Object.assign({}, block, {
        text: block.text || block.content,
      });
    }
    return block;
  }

  function renderFlowBlock(block, index) {
    block = normalizeChatBlock(block);
    if (block.type === "user") {
      const row = createEl("div", "aos-detail-user");
      row.setAttribute("data-demo-target", "user-message");
      if (index === 0) row.setAttribute("data-demo-agent-user", "agent-user-message");
      const bubble = createEl("div", "aos-detail-user__bubble");
      bubble.textContent = block.text;
      row.appendChild(bubble);
      return row;
    }
    if (block.type === "disclosure") {
      return renderDisclosure(block);
    }
    if (block.type === "final") {
      const section = createEl("section", "aos-detail-primary aos-detail-final");
      if (block.demo) section.setAttribute("data-demo-target", block.demo);
      if (block.text) {
        const p = document.createElement("p");
        p.textContent = block.text;
        section.appendChild(p);
      }
      if (block.points && block.points.length) {
        const list = createEl("ol", "aos-detail-final__list");
        block.points.forEach(function (point) {
          const li = document.createElement("li");
          li.textContent = point;
          list.appendChild(li);
        });
        section.appendChild(list);
      }
      if (block.close) {
        const close = document.createElement("p");
        close.textContent = block.close;
        section.appendChild(close);
      }
      return section;
    }
    const wrap = createEl("div", "aos-detail-primary");
    if (!block.nested) wrap.setAttribute("data-demo-target", "assistant-message");
    const paragraphs = block.paragraphs && block.paragraphs.length ? block.paragraphs : [block.text || ""];
    paragraphs.forEach(function (text) {
      const p = document.createElement("p");
      p.textContent = text;
      wrap.appendChild(p);
    });
    return wrap;
  }

  function renderAgentDetail(agent) {
    if (!agent || !els.detailBody) return;
    const session = sessionForAgent(agent);
    const tone = STATUS_TONES[agent.status] || "idle";
    if (els.detailTitle) els.detailTitle.textContent = agent.title;
    if (els.detailDot) {
      els.detailDot.setAttribute("data-tone", tone);
      els.detailDot.setAttribute("data-tooltip", STATUS_LABELS[tone] || "");
    }
    els.detailBody.innerHTML = "";
    (session.flow || []).forEach(function (block, index) {
      els.detailBody.appendChild(renderFlowBlock(block, index));
    });
    els.detailBody.scrollTop = 0;
    refreshIcons();
  }

  function saveAgentListScroll() {
    if (els.agentList) state.agentListScrollTop = els.agentList.scrollTop;
  }

  function restoreAgentListScroll() {
    if (!els.agentList) return;
    els.agentList.scrollTop = state.agentListScrollTop || 0;
  }

  function openAgentDetail(agent) {
    if (!agent) return;
    if (state.agentPanelView !== "detail") saveAgentListScroll();
    const switchingFromArtefact = resolveArtefactPanelState() === "detail";
    if (switchingFromArtefact) {
      if (state.artefactFullscreen) setArtefactFullscreen(false, { silent: true });
      state.artefactPanelView = "list";
      applyArtefactPanelState({ animate: true });
    }
    state.selectedAgentId = agent.id;
    state.agentPanelView = "detail";
    state.agentsCollapsed = false;
    renderAgentDetail(agent);
    const delay = switchingFromArtefact && !prefersReducedMotion ? 200 : 0;
    scheduleExclusiveExpand(function () {
      applyAgentPanelState({ animate: true });
    }, delay);
  }

  function closeAgentDetail() {
    state.agentPanelView = "list";
    applyAgentPanelState({ animate: true });
    restoreAgentListScroll();
  }

  function renderTransferredSession(agent) {
    const session = sessionForAgent(agent);
    state.selectedAgentId = agent.id;
    state.chatAgentId = agent.id;
    state.activeMainChatSessionId = agent.id;
    state.chatSessionType = "agent";
    state.activeConversationId = "conv-agent-" + agent.id;
    applyMainChatMode("conversation");
    if (els.session) {
      els.session.classList.add("aos-session--agent");
      els.session.classList.remove("aos-session--artifact");
      els.session.setAttribute("data-demo-target", "chat-conversation");
      els.session.classList.remove("is-handoff");
      void els.session.offsetWidth;
      els.session.classList.add("is-handoff");
    }
    if (els.sessionTitle) els.sessionTitle.textContent = agent.title;
    if (els.sessionMeta) els.sessionMeta.textContent = agent.meta;
    if (els.thread) {
      els.thread.innerHTML = "";
      (session.flow || []).forEach(function (block, index) {
        const node = renderFlowBlock(block, index);
        if (block.type === "disclosure") node.setAttribute("data-demo-target", "main-chat-activity");
        els.thread.appendChild(node);
      });
      threadFollowBottom = true;
      els.thread.scrollTop = 0;
    }
    setComposerAgent(agent);
    syncComposerPlaceholder();
    renderAgents();
    refreshIcons();
  }

  function appendFollowUp(text) {
    if (!els.thread || !text) return;
    const agent = findAgent(state.activeMainChatSessionId);
    const session = agent ? sessionForAgent(agent) : null;
    const userBlock = { type: "user", text: text };
    const assistantBlock = {
      type: "primary",
      text: "I'll take that follow-up against the current session and keep the existing conclusions unless you want to change the brief.",
    };
    if (session && session.flow) session.flow.push(userBlock, assistantBlock);
    els.thread.appendChild(renderFlowBlock(userBlock, els.thread.children.length));
    els.thread.appendChild(renderFlowBlock(assistantBlock, els.thread.children.length));
    refreshIcons();
    threadFollowBottom = true;
    requestAnimationFrame(function () {
      scrollThreadToLatest(true);
    });
  }

  function continueInChat() {
    const agent = findAgent(state.selectedAgentId);
    if (!agent) return;
    state.agentPanelView = "list";
    applyAgentPanelState({ animate: true });
    restoreAgentListScroll();
    renderTransferredSession(agent);
    window.setTimeout(
      function () {
        if (els.composerInput) els.composerInput.focus();
      },
      prefersReducedMotion ? 0 : 320
    );
  }

  function setAgentsCollapsed(collapsed) {
    const wasCollapsed = state.agentsCollapsed;
    state.agentsCollapsed = collapsed;
    const reopenDetail = !collapsed && wasCollapsed && state.agentPanelView === "detail" && !!state.selectedAgentId;
    if (reopenDetail) {
      const agent = findAgent(state.selectedAgentId);
      if (agent) renderAgentDetail(agent);
    }
    applyAgentPanelState({ animate: reopenDetail });
    syncSuggestFade();
  }

  function findArtefact(id) {
    return ARTEFACTS.find(function (item) {
      return item.id === id;
    });
  }

  function artefactTypeIcon(art) {
    return CATEGORY_ICONS[art && art.category] || "file-text";
  }

  function currentArtefactViewState() {
    const id = state.selectedArtefactId;
    if (!id) return { zoom: 1, viewMode: "view", page: 0, scrollTop: 0, panX: 0, panY: 0, selectedNodeId: null };
    if (!artefactViewState[id]) {
      artefactViewState[id] = {
        zoom: 1,
        viewMode: "view",
        page: 0,
        scrollTop: 0,
        panX: 0,
        panY: 0,
        selectedNodeId: null,
      };
    }
    return artefactViewState[id];
  }

  function saveArtefactListScroll() {
    if (els.artefactList) state.artefactListScrollTop = els.artefactList.scrollTop;
  }

  function restoreArtefactListScroll() {
    if (!els.artefactList) return;
    els.artefactList.scrollTop = state.artefactListScrollTop || 0;
  }

  function artefactSupportsEdit(art) {
    const kind = art && art.content && art.content.kind;
    return kind === "chart" || kind === "model" || kind === "presentation";
  }

  function artefactViewerHost() {
    return state.artefactFullscreen ? els.artefactFsViewer : els.artefactViewer;
  }

  function artefactToolbarHost() {
    return state.artefactFullscreen ? els.artefactFsToolbar : els.artefactToolbar;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderArtefactTypeIcon(target, art) {
    if (!target) return;
    target.innerHTML = '<i data-lucide="' + artefactTypeIcon(art) + '" aria-hidden="true"></i>';
  }

  function renderViewerToolbar(art) {
    const host = artefactToolbarHost();
    if (!host || !art) return;
    const vs = currentArtefactViewState();
    const kind = art.content && art.content.kind;
    const zoomPct = Math.round(vs.zoom * 100) + "%";
    const editing = vs.viewMode === "edit";
    let html = "";
    if (kind === "text") {
      html =
        '<select class="aos-write-style" data-artefact-action="block-style" aria-label="Text style">' +
        '<option value="p">Normal text</option>' +
        '<option value="h1">Heading 1</option>' +
        '<option value="h2">Heading 2</option>' +
        '<option value="h3">Heading 3</option>' +
        '<option value="ul">Bulleted list</option>' +
        '<option value="ol">Numbered list</option>' +
        "</select>" +
        '<span class="aos-viewer-sep"></span>' +
        '<button type="button" class="aos-write-fmt" data-artefact-action="bold" aria-label="Bold" title="Bold" data-tooltip="Bold">B</button>' +
        '<button type="button" class="aos-write-fmt" data-artefact-action="italic" aria-label="Italic" title="Italic" data-tooltip="Italic">I</button>' +
        '<button type="button" class="aos-write-fmt" data-artefact-action="underline" aria-label="Underline" title="Underline" data-tooltip="Underline">U</button>' +
        '<span class="aos-viewer-sep"></span>' +
        '<button type="button" class="aos-viewer-btn" data-artefact-action="ul" aria-label="Bulleted list" title="Bulleted list" data-tooltip="Bulleted list"><i data-lucide="list" aria-hidden="true"></i></button>' +
        '<button type="button" class="aos-viewer-btn" data-artefact-action="ol" aria-label="Numbered list" title="Numbered list" data-tooltip="Numbered list"><i data-lucide="list-ordered" aria-hidden="true"></i></button>' +
        '<span class="aos-viewer-sep"></span>' +
        '<button type="button" class="aos-viewer-btn" data-artefact-action="undo" aria-label="Undo" title="Undo" data-tooltip="Undo"><i data-lucide="undo-2" aria-hidden="true"></i></button>' +
        '<button type="button" class="aos-viewer-btn" data-artefact-action="redo" aria-label="Redo" title="Redo" data-tooltip="Redo"><i data-lucide="redo-2" aria-hidden="true"></i></button>' +
        '<span class="aos-viewer-sep"></span>' +
        '<button type="button" class="aos-viewer-btn" data-artefact-action="zoom-out" aria-label="Zoom out" title="Zoom out" data-tooltip="Zoom out"><i data-lucide="minus" aria-hidden="true"></i></button>' +
        '<span class="aos-viewer-zoom" data-demo-target="artifact-zoom">' +
        zoomPct +
        "</span>" +
        '<button type="button" class="aos-viewer-btn" data-artefact-action="zoom-in" aria-label="Zoom in" title="Zoom in" data-tooltip="Zoom in"><i data-lucide="plus" aria-hidden="true"></i></button>';
      if (!state.artefactFullscreen) {
        html +=
          '<span class="aos-viewer-sep"></span>' +
          '<button type="button" class="aos-viewer-btn" data-artefact-action="fullscreen" aria-label="Fullscreen" title="Fullscreen" data-tooltip="Fullscreen" data-demo-target="artifact-fullscreen"><i data-lucide="maximize-2" aria-hidden="true"></i></button>';
      }
      host.innerHTML = html;
      return;
    }
    if (artefactSupportsEdit(art)) {
      html +=
        '<button type="button" class="aos-viewer-btn' +
        (editing ? " is-active" : "") +
        '" data-artefact-action="edit" aria-pressed="' +
        (editing ? "true" : "false") +
        '" aria-label="' +
        (editing ? "View" : "Edit") +
        '" title="' +
        (editing ? "View" : "Edit") +
        '" data-tooltip="' +
        (editing ? "View" : "Edit") +
        '" data-demo-target="artifact-edit"><i data-lucide="pencil" aria-hidden="true"></i></button><span class="aos-viewer-sep"></span>';
    }
    html +=
      '<button type="button" class="aos-viewer-btn" data-artefact-action="zoom-out" aria-label="Zoom out" title="Zoom out" data-tooltip="Zoom out"><i data-lucide="minus" aria-hidden="true"></i></button>' +
      '<span class="aos-viewer-zoom" data-demo-target="artifact-zoom">' +
      zoomPct +
      "</span>" +
      '<button type="button" class="aos-viewer-btn" data-artefact-action="zoom-in" aria-label="Zoom in" title="Zoom in" data-tooltip="Zoom in"><i data-lucide="plus" aria-hidden="true"></i></button>' +
      '<button type="button" class="aos-viewer-btn" data-artefact-action="fit" aria-label="Fit to view" title="Fit to view" data-tooltip="Fit to view"><i data-lucide="scan" aria-hidden="true"></i></button>';
    if (kind === "presentation") {
      const slides = art.content.slides || [];
      const page = Math.min(vs.page, Math.max(0, slides.length - 1));
      html +=
        '<span class="aos-viewer-sep"></span>' +
        '<button type="button" class="aos-viewer-btn" data-artefact-action="page-prev" aria-label="Previous slide" title="Previous slide" data-tooltip="Previous slide"><i data-lucide="chevron-left" aria-hidden="true"></i></button>' +
        '<span class="aos-viewer-page">' +
        (slides.length ? page + 1 : 0) +
        " / " +
        slides.length +
        "</span>" +
        '<button type="button" class="aos-viewer-btn" data-artefact-action="page-next" aria-label="Next slide" title="Next slide" data-tooltip="Next slide" data-demo-target="artifact-page-next"><i data-lucide="chevron-right" aria-hidden="true"></i></button>';
    }
    if (!state.artefactFullscreen) {
      html +=
        '<span class="aos-viewer-sep"></span>' +
        '<button type="button" class="aos-viewer-btn" data-artefact-action="fullscreen" aria-label="Fullscreen" title="Fullscreen" data-tooltip="Fullscreen" data-demo-target="artifact-fullscreen"><i data-lucide="maximize-2" aria-hidden="true"></i></button>';
    }
    host.innerHTML = html;
  }

  function blocksToWriteHtml(blocks) {
    return (blocks || [])
      .map(function (block) {
        if (block.type === "h1") return "<h1>" + escapeHtml(block.text || "") + "</h1>";
        if (block.type === "h2") return "<h2>" + escapeHtml(block.text || "") + "</h2>";
        if (block.type === "h3") return "<h3>" + escapeHtml(block.text || "") + "</h3>";
        if (block.type === "p") return "<p>" + escapeHtml(block.text || "") + "</p>";
        if (block.type === "ul") {
          return (
            "<ul>" +
            (block.items || [])
              .map(function (item) {
                return "<li>" + escapeHtml(item) + "</li>";
              })
              .join("") +
            "</ul>"
          );
        }
        if (block.type === "ol") {
          return (
            "<ol>" +
            (block.items || [])
              .map(function (item) {
                return "<li>" + escapeHtml(item) + "</li>";
              })
              .join("") +
            "</ol>"
          );
        }
        if (block.type === "table") {
          return (
            "<table><thead><tr>" +
            (block.headers || [])
              .map(function (cell) {
                return "<th>" + escapeHtml(cell) + "</th>";
              })
              .join("") +
            "</tr></thead><tbody>" +
            (block.rows || [])
              .map(function (row) {
                return (
                  "<tr>" +
                  row
                    .map(function (cell) {
                      return "<td>" + escapeHtml(cell) + "</td>";
                    })
                    .join("") +
                  "</tr>"
                );
              })
              .join("") +
            "</tbody></table>"
          );
        }
        return "";
      })
      .join("");
  }

  function activeWriteDoc() {
    const host = artefactViewerHost();
    return host ? host.querySelector(".aos-write") : null;
  }

  function saveTextWorkspace() {
    const doc = document.querySelector(".aos-artefact-viewer--write .aos-write") || document.querySelector(".aos-write");
    if (!doc) return;
    const art = findArtefact(doc.dataset.artefactId || state.selectedArtefactId);
    if (!art || !art.content || art.content.kind !== "text") return;
    art.content.html = doc.innerHTML;
    const host = doc.closest(".aos-artefact-viewer") || artefactViewerHost();
    if (host && art.id === state.selectedArtefactId) currentArtefactViewState().scrollTop = host.scrollTop;
  }

  const textEditor = {
    savedRange: null,
    pendingComment: null,
    suppress: false,
  };

  function renderTextArtefact(art, host, vs) {
    const content = art.content || {};
    host.className = "aos-artefact-viewer aos-artefact-viewer--write" + (state.artefactFullscreen ? " aos-artefact-viewer--fs" : "");
    const canvas = document.createElement("div");
    canvas.className = "aos-write-canvas";
    const doc = document.createElement("article");
    doc.className = "aos-write";
    doc.setAttribute("contenteditable", "true");
    doc.setAttribute("spellcheck", "true");
    doc.setAttribute("role", "textbox");
    doc.setAttribute("aria-multiline", "true");
    doc.setAttribute("aria-label", art.title + " document");
    doc.setAttribute("data-demo-target", "artifact-text-editor");
    doc.dataset.artefactId = art.id;
    doc.style.setProperty("--artefact-zoom", String(vs.zoom));
    if (content.html) {
      doc.innerHTML = content.html;
    } else {
      doc.innerHTML = blocksToWriteHtml(content.blocks);
      content.html = doc.innerHTML;
    }
    canvas.appendChild(doc);
    host.appendChild(canvas);
    host.scrollTop = vs.scrollTop || 0;
    bindWriteDocument(doc);
  }

  function bindWriteDocument(doc) {
    doc.addEventListener("input", function () {
      if (textEditor.suppress) return;
      saveTextWorkspace();
    });
    doc.addEventListener("mouseup", function () {
      window.setTimeout(function () {
        captureTextSelection({ show: true });
      }, 0);
    });
    doc.addEventListener("keyup", function (e) {
      if (e.key === "Escape") return;
      captureTextSelection({ show: e.shiftKey || e.key.indexOf("Arrow") === 0 });
    });
    doc.addEventListener("click", function (e) {
      const marker = e.target.closest(".aos-comment-marker");
      const mark = e.target.closest("mark.aos-comment-mark");
      const target = marker || mark;
      if (!target || !doc.contains(target)) return;
      e.preventDefault();
      openTextCommentThread(target.getAttribute("data-thread-id"));
    });
  }

  function renderChartArtefact(art, host, vs) {
    const content = art.content || {};
    const categories = content.categories || [];
    const series = content.series || [];
    const width = 500;
    const height = 220;
    const pad = { t: 16, r: 12, b: 36, l: 32 };
    const innerW = width - pad.l - pad.r;
    const innerH = height - pad.t - pad.b;
    let max = 1;
    series.forEach(function (s) {
      (s.values || []).forEach(function (v) {
        if (v > max) max = v;
      });
    });
    const groupW = innerW / Math.max(categories.length, 1);
    const barW = Math.max(8, (groupW * 0.62) / Math.max(series.length, 1));
    let bars = "";
    series.forEach(function (s, si) {
      (s.values || []).forEach(function (v, i) {
        const h = (v / max) * innerH;
        const x = pad.l + i * groupW + (groupW - series.length * barW) / 2 + si * barW;
        const y = pad.t + innerH - h;
        bars +=
          '<rect x="' +
          x.toFixed(1) +
          '" y="' +
          y.toFixed(1) +
          '" width="' +
          barW.toFixed(1) +
          '" height="' +
          Math.max(h, 1).toFixed(1) +
          '" rx="2" fill="' +
          (s.color || "var(--status-info)") +
          '"></rect>';
      });
    });
    let labels = "";
    categories.forEach(function (label, i) {
      labels +=
        '<text x="' +
        (pad.l + i * groupW + groupW / 2).toFixed(1) +
        '" y="' +
        (height - 12) +
        '" text-anchor="middle" fill="currentColor" font-size="10">' +
        escapeHtml(label) +
        "</text>";
    });
    const ticks = [0, 0.5, 1];
    let grid = "";
    ticks.forEach(function (t) {
      const y = pad.t + innerH - t * innerH;
      grid +=
        '<line x1="' +
        pad.l +
        '" x2="' +
        (width - pad.r) +
        '" y1="' +
        y.toFixed(1) +
        '" y2="' +
        y.toFixed(1) +
        '" stroke="currentColor" stroke-opacity="0.18"></line>';
    });
    const legend = content.legendVisible
      ? '<div class="aos-chart-legend">' +
        series
          .map(function (s) {
            return (
              '<span class="aos-chart-legend__item"><span class="aos-chart-legend__swatch" style="background:' +
              s.color +
              '"></span>' +
              escapeHtml(s.name) +
              "</span>"
            );
          })
          .join("") +
        "</div>"
      : "";
    const edit =
      vs.viewMode === "edit"
        ? '<div class="aos-chart-edit">' +
          '<label>Title <input type="text" data-chart-field="title" value="' +
          escapeHtml(content.title || "") +
          '"></label>' +
          '<label>X label <input type="text" data-chart-field="xLabel" value="' +
          escapeHtml(content.xLabel || "") +
          '"></label>' +
          '<label>Y label <input type="text" data-chart-field="yLabel" value="' +
          escapeHtml(content.yLabel || "") +
          '"></label>' +
          '<label><input type="checkbox" data-chart-field="legendVisible"' +
          (content.legendVisible ? " checked" : "") +
          "> Legend</label></div>"
        : "";
    host.className = "aos-artefact-viewer aos-artefact-viewer--canvas" + (state.artefactFullscreen ? " aos-artefact-viewer--fs" : "");
    host.innerHTML =
      '<div class="aos-chart-shell">' +
      edit +
      '<div class="aos-chart-canvas" data-zoom-surface="true" data-fit-target="true">' +
      '<div class="aos-chart-card"><h3 class="aos-chart-card__title">' +
      escapeHtml(content.title || art.title) +
      '</h3><p class="aos-chart-card__axis">' +
      escapeHtml(content.yLabel || "") +
      " · " +
      escapeHtml(content.xLabel || "") +
      '</p><svg class="aos-chart-svg" viewBox="0 0 ' +
      width +
      " " +
      height +
      '" role="img" aria-label="' +
      escapeHtml(content.title || art.title) +
      '">' +
      grid +
      bars +
      labels +
      "</svg>" +
      legend +
      "</div></div></div>";
    applyCanvasTransform(host, vs);
    if (vs.viewMode === "edit") bindChartEdits(art, host);
  }

  function bindChartEdits(art, host) {
    host.querySelectorAll("[data-chart-field]").forEach(function (input) {
      const field = input.getAttribute("data-chart-field");
      input.addEventListener("change", function () {
        if (input.type === "checkbox") art.content[field] = input.checked;
        else art.content[field] = input.value;
        renderArtefactViewer(art);
      });
      if (input.type === "text") {
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") input.blur();
        });
      }
    });
  }

  function renderModelArtefact(art, host, vs) {
    const content = art.content || {};
    const nodes = content.nodes || [];
    const edges = content.edges || [];
    const nodeMap = {};
    nodes.forEach(function (n) {
      nodeMap[n.id] = n;
    });
    let lines = "";
    edges.forEach(function (edge) {
      const a = nodeMap[edge.from];
      const b = nodeMap[edge.to];
      if (!a || !b) return;
      lines +=
        '<line x1="' +
        (a.x + 84) +
        '" y1="' +
        (a.y + 28) +
        '" x2="' +
        (b.x + 84) +
        '" y2="' +
        (b.y + 28) +
        '" stroke="currentColor" stroke-opacity="0.28"></line>';
    });
    const selected = vs.selectedNodeId ? nodeMap[vs.selectedNodeId] : null;
    const inspect =
      vs.viewMode === "edit" && selected
        ? '<div class="aos-model-inspect"><label>Node <input type="text" data-node-field="title" value="' +
          escapeHtml(selected.title) +
          '"></label>' +
          selected.fields
            .map(function (field, i) {
              return (
                '<label>Field <input type="text" data-node-field="field" data-field-index="' +
                i +
                '" value="' +
                escapeHtml(field) +
                '"></label>'
              );
            })
            .join("") +
          "</div>"
        : "";
    host.className = "aos-artefact-viewer aos-artefact-viewer--canvas" + (state.artefactFullscreen ? " aos-artefact-viewer--fs" : "");
    host.innerHTML =
      '<div class="aos-model-shell">' +
      inspect +
      '<div class="aos-model-canvas" data-zoom-surface="true" data-fit-target="true"><div class="aos-model-world">' +
      '<svg aria-hidden="true">' +
      lines +
      "</svg>" +
      nodes
        .map(function (n) {
          return (
            '<button type="button" class="aos-model-node' +
            (n.id === vs.selectedNodeId ? " is-selected" : "") +
            '" data-node-id="' +
            n.id +
            '" style="left:' +
            n.x +
            "px;top:" +
            n.y +
            'px"><p class="aos-model-node__title">' +
            escapeHtml(n.title) +
            "</p>" +
            (n.fields || [])
              .map(function (f) {
                return '<p class="aos-model-node__field">' + escapeHtml(f) + "</p>";
              })
              .join("") +
            "</button>"
          );
        })
        .join("") +
      "</div></div></div>";
    applyCanvasTransform(host, vs);
    host.querySelectorAll("[data-node-id]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        vs.selectedNodeId = btn.getAttribute("data-node-id");
        renderArtefactViewer(art);
      });
      if (vs.viewMode === "edit") {
        btn.addEventListener("pointerdown", function (e) {
          if (e.button !== 0) return;
          e.stopPropagation();
          const node = nodeMap[btn.getAttribute("data-node-id")];
          if (!node) return;
          const startX = e.clientX;
          const startY = e.clientY;
          const origX = node.x;
          const origY = node.y;
          const move = function (ev) {
            node.x = origX + (ev.clientX - startX) / vs.zoom;
            node.y = origY + (ev.clientY - startY) / vs.zoom;
            btn.style.left = node.x + "px";
            btn.style.top = node.y + "px";
          };
          const up = function () {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
            renderArtefactViewer(art);
          };
          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", up);
        });
      }
    });
    if (vs.viewMode === "edit" && selected) {
      host.querySelectorAll("[data-node-field]").forEach(function (input) {
        input.addEventListener("change", function () {
          if (input.getAttribute("data-node-field") === "title") selected.title = input.value;
          else selected.fields[Number(input.getAttribute("data-field-index"))] = input.value;
          renderArtefactViewer(art);
        });
      });
    }
  }

  function renderPresentationArtefact(art, host, vs) {
    const slides = (art.content && art.content.slides) || [];
    if (vs.page >= slides.length) vs.page = Math.max(0, slides.length - 1);
    const slide = slides[vs.page] || { title: art.title, bullets: [], kicker: "" };
    const editing = vs.viewMode === "edit";
    host.className = "aos-artefact-viewer aos-artefact-viewer--deck" + (state.artefactFullscreen ? " aos-artefact-viewer--fs" : "");
    const rail = document.createElement("div");
    rail.className = "aos-deck-rail";
    slides.forEach(function (item, index) {
      const thumb = document.createElement("button");
      thumb.type = "button";
      thumb.className = "aos-deck-thumb" + (index === vs.page ? " is-active" : "");
      thumb.innerHTML = "<span></span>";
      thumb.querySelector("span").textContent = index + 1 + " · " + (item.title || "");
      thumb.addEventListener("click", function () {
        vs.page = index;
        renderArtefactViewer(art);
      });
      rail.appendChild(thumb);
    });
    const stage = document.createElement("div");
    stage.className = "aos-deck-stage";
    const card = document.createElement("article");
    card.className = "aos-slide";
    card.setAttribute("data-fit-target", "true");
    card.setAttribute("data-zoom-surface", "true");
    card.setAttribute("data-editable", editing ? "true" : "false");
    card.style.setProperty("--artefact-zoom", String(vs.zoom));
    const kicker = document.createElement("p");
    kicker.className = "aos-slide__kicker";
    kicker.textContent = slide.kicker || "";
    if (editing) {
      kicker.contentEditable = "true";
      kicker.setAttribute("data-edit-slide", "kicker");
    }
    const title = document.createElement("h3");
    title.className = "aos-slide__title";
    title.textContent = slide.title || "";
    if (editing) {
      title.contentEditable = "true";
      title.setAttribute("data-edit-slide", "title");
    }
    const ul = document.createElement("ul");
    ul.className = "aos-slide__ul";
    (slide.bullets || []).forEach(function (item, i) {
      const li = document.createElement("li");
      li.textContent = item;
      if (editing) {
        li.contentEditable = "true";
        li.setAttribute("data-edit-slide", "bullet");
        li.setAttribute("data-edit-item", String(i));
      }
      ul.appendChild(li);
    });
    card.appendChild(kicker);
    card.appendChild(title);
    card.appendChild(ul);
    stage.appendChild(card);
    host.appendChild(rail);
    host.appendChild(stage);
    if (editing) {
      card.addEventListener("input", function (e) {
        const el = e.target.closest("[data-edit-slide]");
        if (!el) return;
        const field = el.getAttribute("data-edit-slide");
        if (field === "kicker") slide.kicker = el.textContent;
        else if (field === "title") slide.title = el.textContent;
        else if (field === "bullet") slide.bullets[Number(el.getAttribute("data-edit-item"))] = el.textContent;
      });
    }
  }

  function applyCanvasTransform(host, vs) {
    const surface = host.querySelector("[data-zoom-surface]");
    if (!surface) return;
    surface.style.setProperty("--artefact-zoom", String(vs.zoom));
    surface.style.setProperty("--artefact-pan-x", vs.panX + "px");
    surface.style.setProperty("--artefact-pan-y", vs.panY + "px");
  }

  function bindCanvasHost(host) {
    if (!host || host.dataset.canvasBound === "true") return;
    host.dataset.canvasBound = "true";
    host.addEventListener(
      "wheel",
      function (e) {
        const art = findArtefact(state.selectedArtefactId);
        const kind = art && art.content && art.content.kind;
        if (kind !== "chart" && kind !== "model") return;
        e.preventDefault();
        const vs = currentArtefactViewState();
        if (e.ctrlKey || e.metaKey) {
          vs.zoom = clampZoom(vs.zoom + (e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP));
          applyCanvasTransform(host, vs);
          renderViewerToolbar(art);
          refreshIcons();
          return;
        }
        vs.panX -= e.deltaX;
        vs.panY -= e.deltaY;
        applyCanvasTransform(host, vs);
      },
      { passive: false }
    );
    host.addEventListener("pointerdown", function (e) {
      const art = findArtefact(state.selectedArtefactId);
      const kind = art && art.content && art.content.kind;
      if (kind !== "chart" && kind !== "model") return;
      if (e.target.closest("[data-node-id], input, [contenteditable='true']")) return;
      if (e.button !== 0) return;
      const vs = currentArtefactViewState();
      host.classList.add("is-panning");
      const startX = e.clientX;
      const startY = e.clientY;
      const origX = vs.panX;
      const origY = vs.panY;
      const move = function (ev) {
        vs.panX = origX + (ev.clientX - startX);
        vs.panY = origY + (ev.clientY - startY);
        applyCanvasTransform(host, vs);
      };
      const up = function () {
        host.classList.remove("is-panning");
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
  }

  function clampZoom(value) {
    const stepped = Math.round(value / ZOOM_STEP) * ZOOM_STEP;
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Number(stepped.toFixed(2))));
  }

  function isTextArtifact(art) {
    return !!(art && art.content && art.content.kind === "text");
  }

  function cloneLiveRange() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    const doc = activeWriteDoc();
    if (!doc || !doc.contains(range.commonAncestorContainer)) return null;
    if (range.toString().replace(/\s+/g, "") === "") return null;
    return range.cloneRange();
  }

  function captureTextSelection(options) {
    options = options || {};
    if (textEditor.suppress) return null;
    if (els.textCommentComposer && !els.textCommentComposer.hidden) return textEditor.savedRange;
    const range = cloneLiveRange();
    if (!range) {
      textEditor.savedRange = null;
      if (options.show) hideTextSelectionBar();
      syncTextFormatState();
      return null;
    }
    textEditor.savedRange = range;
    syncTextFormatState();
    if (options.show) showTextSelectionBar();
    return range;
  }

  function restoreTextRange() {
    if (!textEditor.savedRange) return false;
    const sel = window.getSelection();
    sel.removeAllRanges();
    try {
      sel.addRange(textEditor.savedRange);
      return true;
    } catch (err) {
      return false;
    }
  }

  function unionClientRects(rects) {
    if (!rects || !rects.length) return null;
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    Array.prototype.forEach.call(rects, function (r) {
      if (!r.width && !r.height) return;
      left = Math.min(left, r.left);
      top = Math.min(top, r.top);
      right = Math.max(right, r.right);
      bottom = Math.max(bottom, r.bottom);
    });
    if (!isFinite(left)) return null;
    return { left: left, top: top, right: right, bottom: bottom, width: right - left, height: bottom - top };
  }

  function getWriteClipRect() {
    const host = artefactViewerHost();
    if (host) return host.getBoundingClientRect();
    return { left: 8, top: 8, right: window.innerWidth - 8, bottom: window.innerHeight - 8, width: window.innerWidth, height: window.innerHeight };
  }

  function rectsOverlap(a, b, pad) {
    pad = pad || 0;
    return !(a.right < b.left - pad || a.left > b.right + pad || a.bottom < b.top - pad || a.top > b.bottom + pad);
  }

  function positionNearSelection(el, range, gap) {
    if (!el || !range) return;
    const sel = unionClientRects(range.getClientRects()) || range.getBoundingClientRect();
    if (!sel || (!sel.width && !sel.height)) return;
    const clip = getWriteClipRect();
    const w = el.offsetWidth || 240;
    const h = el.offsetHeight || 40;
    const candidates = [
      { left: sel.left + sel.width / 2 - w / 2, top: sel.top - gap - h },
      { left: sel.left + sel.width / 2 - w / 2, top: sel.bottom + gap },
      { left: sel.right + gap, top: sel.top + sel.height / 2 - h / 2 },
      { left: sel.left - gap - w, top: sel.top + sel.height / 2 - h / 2 },
    ];
    let chosen = null;
    for (let i = 0; i < candidates.length; i++) {
      let left = Math.min(Math.max(candidates[i].left, clip.left + 8), clip.right - w - 8);
      let top = Math.min(Math.max(candidates[i].top, clip.top + 8), clip.bottom - h - 8);
      const box = { left: left, top: top, right: left + w, bottom: top + h };
      if (!rectsOverlap(box, sel, 2)) {
        chosen = { left: left, top: top };
        break;
      }
    }
    if (!chosen) {
      let top = sel.top - gap - h;
      if (top < clip.top + 8) top = sel.bottom + gap;
      chosen = {
        left: Math.min(Math.max(sel.left, clip.left + 8), clip.right - w - 8),
        top: Math.min(Math.max(top, clip.top + 8), clip.bottom - h - 8),
      };
    }
    el.style.left = Math.round(chosen.left) + "px";
    el.style.top = Math.round(chosen.top) + "px";
  }

  function showTextSelectionBar() {
    if (!els.textSelBar || !textEditor.savedRange) return;
    if (els.textCommentComposer && !els.textCommentComposer.hidden) return;
    if (els.textCommentThread && !els.textCommentThread.hidden) return;
    els.textSelBar.hidden = false;
    els.textSelBar.classList.add("is-visible");
    positionNearSelection(els.textSelBar, textEditor.savedRange, 7);
    syncTextFormatState();
    refreshIcons();
  }

  function hideTextSelectionBar() {
    if (!els.textSelBar) return;
    els.textSelBar.classList.remove("is-visible");
    els.textSelBar.hidden = true;
  }

  function hideTextCommentUI() {
    if (els.textCommentComposer) {
      els.textCommentComposer.hidden = true;
      els.textCommentComposer.classList.remove("is-visible");
      els.textCommentComposer.innerHTML = "";
    }
    if (els.textCommentThread) {
      els.textCommentThread.hidden = true;
      els.textCommentThread.classList.remove("is-visible");
      els.textCommentThread.innerHTML = "";
    }
    textEditor.pendingComment = null;
    const doc = activeWriteDoc();
    if (doc) {
      doc.querySelectorAll("mark.aos-comment-mark.is-active").forEach(function (el) {
        el.classList.remove("is-active");
      });
      doc.querySelectorAll(".aos-comment-marker.is-active").forEach(function (el) {
        el.classList.remove("is-active");
      });
    }
  }

  function hideTextOverlays() {
    hideTextSelectionBar();
    hideTextCommentUI();
  }

  function syncTextFormatState() {
    let bold = false;
    let italic = false;
    let underline = false;
    try {
      bold = document.queryCommandState("bold");
      italic = document.queryCommandState("italic");
      underline = document.queryCommandState("underline");
    } catch (err) {
      /* ignore */
    }
    document.querySelectorAll("[data-artefact-action='bold'], [data-text-action='bold']").forEach(function (btn) {
      btn.classList.toggle("is-active", bold);
      btn.setAttribute("aria-pressed", bold ? "true" : "false");
    });
    document.querySelectorAll("[data-artefact-action='italic'], [data-text-action='italic']").forEach(function (btn) {
      btn.classList.toggle("is-active", italic);
      btn.setAttribute("aria-pressed", italic ? "true" : "false");
    });
    document.querySelectorAll("[data-artefact-action='underline'], [data-text-action='underline']").forEach(function (btn) {
      btn.classList.toggle("is-active", underline);
      btn.setAttribute("aria-pressed", underline ? "true" : "false");
    });
    const styleSel = artefactToolbarHost() && artefactToolbarHost().querySelector(".aos-write-style");
    if (styleSel) {
      let value = "p";
      try {
        const block = (document.queryCommandValue("formatBlock") || "").toLowerCase();
        if (block === "h1" || block === "h2" || block === "h3") value = block;
      } catch (err) {
        /* ignore */
      }
      const doc = activeWriteDoc();
      if (doc && textEditor.savedRange) {
        let node = textEditor.savedRange.commonAncestorContainer;
        if (node.nodeType === 3) node = node.parentElement;
        if (node && node.closest("ul") && !node.closest("ol")) value = "ul";
        if (node && node.closest("ol")) value = "ol";
      }
      styleSel.value = value;
    }
  }

  function applyTextCommand(cmd, value) {
    restoreTextRange();
    const doc = activeWriteDoc();
    if (doc) doc.focus();
    try {
      document.execCommand(cmd, false, value || null);
    } catch (err) {
      /* ignore */
    }
    saveTextWorkspace();
    const live = cloneLiveRange();
    if (live) textEditor.savedRange = live;
    syncTextFormatState();
  }

  function applyTextBlockStyle(value) {
    restoreTextRange();
    const doc = activeWriteDoc();
    if (doc) doc.focus();
    if (value === "ul") document.execCommand("insertUnorderedList", false, null);
    else if (value === "ol") document.execCommand("insertOrderedList", false, null);
    else document.execCommand("formatBlock", false, value);
    saveTextWorkspace();
    const live = cloneLiveRange();
    if (live) textEditor.savedRange = live;
    syncTextFormatState();
  }

  function wrapRangeWithMark(range, className, attrs) {
    if (!range) return null;
    const mark = document.createElement("mark");
    mark.className = className;
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        mark.setAttribute(key, attrs[key]);
      });
    }
    try {
      range.surroundContents(mark);
    } catch (err) {
      mark.appendChild(range.extractContents());
      range.insertNode(mark);
    }
    return mark;
  }

  function unwrapMark(mark) {
    if (!mark || !mark.parentNode) return;
    const parent = mark.parentNode;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  }

  function formatCommentTime(ts) {
    const delta = Date.now() - ts;
    if (delta < 60000) return "Just now";
    if (delta < 3600000) return Math.max(1, Math.round(delta / 60000)) + "m";
    return "Today";
  }

  function ensureArtefactContextChip(art) {
    if (!art) return;
    const chip = {
      id: "artefact:" + art.id,
      label: (CATEGORY_LABELS[art.category] || "Artifact") + " · " + art.title,
      kind: "artifact",
      artefactId: art.id,
      icon: artefactTypeIcon(art),
    };
    const exists = state.contextItems.some(function (raw) {
      return normalizeContext(raw).id === chip.id;
    });
    if (!exists) state.contextItems.push(chip);
    state.artefactContextId = art.id;
    renderContext();
  }

  function setArtefactQuote(text) {
    if (!text) {
      clearPendingQuotedSelection();
      return;
    }
    setPendingQuotedSelection(text, state.selectedArtefactId);
  }

  function askAgentAboutSelection() {
    const range = textEditor.savedRange || cloneLiveRange();
    if (!range) return;
    const text = range.toString().replace(/\s+/g, " ").trim();
    if (!text) return;
    const art = findArtefact(state.selectedArtefactId);
    if (!art) return;
    const active = currentConversation();
    const sameArtifactConversation =
      state.mainChatMode === "conversation" &&
      active &&
      active.type === "artifact" &&
      active.artifactId === art.id;
    if (sameArtifactConversation) {
      ensureArtefactContextChip(art);
      setPendingQuotedSelection(text, art.id);
      applyMainChatMode("conversation");
    } else {
      enterArtifactConversation(art, text);
    }
    hideTextSelectionBar();
    window.getSelection().removeAllRanges();
    if (els.composerInput) els.composerInput.focus();
  }

  function openTextCommentComposer() {
    const range = textEditor.savedRange || cloneLiveRange();
    if (!range || !els.textCommentComposer) return;
    const text = range.toString().replace(/\s+/g, " ").trim();
    if (!text) return;
    hideTextSelectionBar();
    textEditor.pendingComment = { range: range.cloneRange(), text: text };
    window.getSelection().removeAllRanges();
    els.textCommentComposer.hidden = false;
    els.textCommentComposer.innerHTML =
      '<div class="aos-comment-pop__head"><p class="aos-comment-pop__title">Add comment</p></div>' +
      '<textarea class="aos-comment-pop__input" id="aos-text-comment-input" placeholder="Write a comment…" rows="3"></textarea>' +
      '<div class="aos-comment-pop__footer">' +
      '<button type="button" class="aos-btn aos-btn--ghost" data-comment-ui="cancel">Cancel</button>' +
      '<button type="button" class="aos-btn aos-btn--primary" data-comment-ui="submit" disabled>Comment</button>' +
      "</div>";
    els.textCommentComposer.classList.add("is-visible");
    positionNearSelection(els.textCommentComposer, textEditor.pendingComment.range, 10);
    const input = document.getElementById("aos-text-comment-input");
    const submit = els.textCommentComposer.querySelector('[data-comment-ui="submit"]');
    if (input) {
      input.focus();
      input.addEventListener("input", function () {
        if (submit) submit.disabled = !input.value.trim();
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && submit && !submit.disabled) {
          e.preventDefault();
          submitTextComment();
        }
        if (e.key === "Escape") {
          e.preventDefault();
          hideTextCommentUI();
        }
      });
    }
  }

  function submitTextComment() {
    const art = findArtefact(state.selectedArtefactId);
    const draft = textEditor.pendingComment;
    const input = document.getElementById("aos-text-comment-input");
    const text = input && input.value.trim();
    if (!art || !draft || !text) return;
    if (!art.content.comments) art.content.comments = [];
    art.content.commentSeq = (art.content.commentSeq || 0) + 1;
    const threadId = "athread-" + art.content.commentSeq;
    art.content.comments.push({
      id: threadId,
      quote: draft.text,
      status: "open",
      createdAt: Date.now(),
      messages: [{ id: threadId + "-1", author: "Long", text: text, createdAt: Date.now() }],
    });
    textEditor.suppress = true;
    const mark = wrapRangeWithMark(draft.range, "aos-comment-mark", { "data-thread-id": threadId });
    if (mark && mark.parentNode) {
      const marker = document.createElement("button");
      marker.type = "button";
      marker.className = "aos-comment-marker";
      marker.setAttribute("data-thread-id", threadId);
      marker.setAttribute("contenteditable", "false");
      marker.setAttribute("aria-label", "Open comment");
      marker.innerHTML = '<i data-lucide="message-square" aria-hidden="true"></i>';
      if (mark.nextSibling) mark.parentNode.insertBefore(marker, mark.nextSibling);
      else mark.parentNode.appendChild(marker);
    }
    textEditor.suppress = false;
    saveTextWorkspace();
    hideTextCommentUI();
    refreshIcons();
    openTextCommentThread(threadId);
  }

  function findTextComment(threadId) {
    const art = findArtefact(state.selectedArtefactId);
    if (!art || !art.content || !art.content.comments) return null;
    return art.content.comments.find(function (item) {
      return item.id === threadId;
    });
  }

  function openTextCommentThread(threadId) {
    const thread = findTextComment(threadId);
    if (!thread || !els.textCommentThread) return;
    hideTextSelectionBar();
    if (els.textCommentComposer) {
      els.textCommentComposer.hidden = true;
      els.textCommentComposer.classList.remove("is-visible");
    }
    const doc = activeWriteDoc();
    if (doc) {
      doc.querySelectorAll("mark.aos-comment-mark").forEach(function (el) {
        el.classList.toggle("is-active", el.getAttribute("data-thread-id") === threadId);
      });
      doc.querySelectorAll(".aos-comment-marker").forEach(function (el) {
        el.classList.toggle("is-active", el.getAttribute("data-thread-id") === threadId);
      });
    }
    const messages = (thread.messages || [])
      .map(function (msg) {
        return (
          '<div class="aos-comment-msg"><div class="aos-comment-msg__meta"><span class="aos-comment-msg__author">' +
          escapeHtml(msg.author) +
          '</span><span class="aos-comment-msg__time">' +
          escapeHtml(formatCommentTime(msg.createdAt)) +
          '</span></div><p class="aos-comment-msg__body">' +
          escapeHtml(msg.text) +
          "</p></div>"
        );
      })
      .join("");
    els.textCommentThread.hidden = false;
    els.textCommentThread.innerHTML =
      '<div class="aos-comment-pop__head"><p class="aos-comment-pop__title">Comment</p>' +
      '<div class="aos-panel__tools">' +
      (thread.status === "open"
        ? '<button type="button" class="aos-btn aos-btn--ghost" data-comment-ui="resolve">Resolve</button>'
        : '<span class="aos-comment-msg__time">Resolved</span>') +
      '<button type="button" class="aos-icon-btn" data-comment-ui="close" aria-label="Close comment"><i data-lucide="x" aria-hidden="true"></i></button>' +
      "</div></div>" +
      messages +
      (thread.status === "open"
        ? '<textarea class="aos-comment-pop__input" id="aos-text-comment-reply" placeholder="Reply…" rows="2"></textarea>' +
          '<div class="aos-comment-pop__footer"><button type="button" class="aos-btn aos-btn--primary" data-comment-ui="reply">Reply</button></div>'
        : "");
    els.textCommentThread.classList.add("is-visible");
    const mark = doc && doc.querySelector('mark.aos-comment-mark[data-thread-id="' + threadId + '"]');
    if (mark) {
      const range = document.createRange();
      range.selectNode(mark);
      positionNearSelection(els.textCommentThread, range, 10);
    }
    els.textCommentThread.dataset.threadId = threadId;
    refreshIcons();
  }

  function resolveTextComment(threadId) {
    const thread = findTextComment(threadId);
    const doc = activeWriteDoc();
    if (!thread) return;
    thread.status = "resolved";
    if (doc) {
      doc.querySelectorAll('mark.aos-comment-mark[data-thread-id="' + threadId + '"]').forEach(unwrapMark);
      doc.querySelectorAll('.aos-comment-marker[data-thread-id="' + threadId + '"]').forEach(function (el) {
        el.remove();
      });
    }
    saveTextWorkspace();
    hideTextCommentUI();
  }

  function replyTextComment(threadId) {
    const thread = findTextComment(threadId);
    const input = document.getElementById("aos-text-comment-reply");
    const text = input && input.value.trim();
    if (!thread || !text) return;
    thread.messages.push({ id: thread.id + "-" + (thread.messages.length + 1), author: "Long", text: text, createdAt: Date.now() });
    openTextCommentThread(threadId);
  }

  function handleTextAction(action) {
    if (action === "ask") askAgentAboutSelection();
    else if (action === "comment") openTextCommentComposer();
    else if (action === "bold" || action === "italic" || action === "underline") {
      applyTextCommand(action);
      if (els.textSelBar && !els.textSelBar.hidden) showTextSelectionBar();
    }
  }

  function renderArtefactViewer(art) {
    saveTextWorkspace();
    hideTextOverlays();
    const host = artefactViewerHost();
    if (!host || !art) return;
    const vs = currentArtefactViewState();
    if (host.classList.contains("aos-artefact-viewer--scroll") || host.classList.contains("aos-artefact-viewer--write")) {
      vs.scrollTop = host.scrollTop;
    }
    host.innerHTML = "";
    const kind = art.content && art.content.kind;
    if (kind === "chart") renderChartArtefact(art, host, vs);
    else if (kind === "model") renderModelArtefact(art, host, vs);
    else if (kind === "presentation") renderPresentationArtefact(art, host, vs);
    else renderTextArtefact(art, host, vs);
    renderViewerToolbar(art);
    refreshIcons();
  }

  function fitArtefactView() {
    const art = findArtefact(state.selectedArtefactId);
    const host = artefactViewerHost();
    const vs = currentArtefactViewState();
    if (!art || !host) return;
    const target = host.querySelector("[data-fit-target]");
    if (!target) return;
    const kind = art.content && art.content.kind;
    const hostRect = host.getBoundingClientRect();
    if (kind === "text") {
      const natural = 560;
      const available = Math.max(160, hostRect.width - 40);
      vs.zoom = clampZoom(available / natural);
      vs.panX = 0;
      vs.panY = 0;
    } else if (kind === "presentation") {
      const availableW = Math.max(160, hostRect.width - (host.querySelector(".aos-deck-rail") ? 88 : 40));
      const availableH = Math.max(120, hostRect.height - 40);
      vs.zoom = clampZoom(Math.min(availableW / 480, availableH / 270));
    } else {
      const bounds = target.scrollWidth ? { w: target.scrollWidth, h: target.scrollHeight } : target.getBoundingClientRect();
      const w = bounds.w || bounds.width || 560;
      const h = bounds.h || bounds.height || 360;
      vs.zoom = clampZoom(Math.min((hostRect.width - 24) / w, (hostRect.height - 24) / h));
      vs.panX = 16;
      vs.panY = 16;
    }
    renderArtefactViewer(art);
  }

  function setArtefactZoom(next) {
    const vs = currentArtefactViewState();
    vs.zoom = clampZoom(next);
    const art = findArtefact(state.selectedArtefactId);
    if (isTextArtifact(art)) {
      const doc = activeWriteDoc();
      if (doc) doc.style.setProperty("--artefact-zoom", String(vs.zoom));
      renderViewerToolbar(art);
      refreshIcons();
      syncTextFormatState();
      return;
    }
    if (art) renderArtefactViewer(art);
  }

  function setArtefactPage(delta) {
    const art = findArtefact(state.selectedArtefactId);
    if (!art || !art.content || art.content.kind !== "presentation") return;
    const vs = currentArtefactViewState();
    const max = Math.max(0, (art.content.slides || []).length - 1);
    vs.page = Math.min(max, Math.max(0, vs.page + delta));
    renderArtefactViewer(art);
  }

  function toggleArtefactEdit() {
    const art = findArtefact(state.selectedArtefactId);
    if (!art || !artefactSupportsEdit(art)) return;
    const vs = currentArtefactViewState();
    vs.viewMode = vs.viewMode === "edit" ? "view" : "edit";
    renderArtefactViewer(art);
  }

  function setArtefactFullscreen(open, options) {
    options = options || {};
    saveTextWorkspace();
    hideTextOverlays();
    const art = findArtefact(state.selectedArtefactId);
    state.artefactFullscreen = !!open;
    if (els.artefactFs) els.artefactFs.hidden = !open;
    if (app) app.classList.toggle("is-artefact-fullscreen", !!open);
    if (art && !options.silent) renderArtefactDetail(art);
    if (!open && els.artefactFsViewer) els.artefactFsViewer.innerHTML = "";
    if (!open && els.artefactFsToolbar) els.artefactFsToolbar.innerHTML = "";
    refreshIcons();
  }

  function handleArtefactAction(action) {
    if (action === "zoom-in") setArtefactZoom(currentArtefactViewState().zoom + ZOOM_STEP);
    else if (action === "zoom-out") setArtefactZoom(currentArtefactViewState().zoom - ZOOM_STEP);
    else if (action === "fit") fitArtefactView();
    else if (action === "page-prev") setArtefactPage(-1);
    else if (action === "page-next") setArtefactPage(1);
    else if (action === "edit") toggleArtefactEdit();
    else if (action === "fullscreen") setArtefactFullscreen(true);
    else if (action === "bold" || action === "italic" || action === "underline") applyTextCommand(action);
    else if (action === "ul") applyTextBlockStyle("ul");
    else if (action === "ol") applyTextBlockStyle("ol");
    else if (action === "undo") applyTextCommand("undo");
    else if (action === "redo") applyTextCommand("redo");
  }

  function renderArtefactDetail(art) {
    if (!art) return;
    if (els.artefactDetailTitle) els.artefactDetailTitle.textContent = art.title;
    renderArtefactTypeIcon(els.artefactDetailIcon, art);
    if (els.artefactFsTitle) els.artefactFsTitle.textContent = art.title;
    renderArtefactTypeIcon(els.artefactFsIcon, art);
    renderArtefactViewer(art);
  }

  function openArtefactDetail(id) {
    const art = findArtefact(id);
    if (!art) return;
    const alreadyDetail = resolveArtefactPanelState() === "detail";
    if (!alreadyDetail) saveArtefactListScroll();
    const switchingFromAgent = resolveAgentPanelState() === "detail";
    if (switchingFromAgent) {
      state.agentPanelView = "list";
      applyAgentPanelState({ animate: true });
    }
    state.selectedArtefactId = art.id;
    state.artefactPanelView = "detail";
    state.artefactsCollapsed = false;
    renderArtefactDetail(art);
    renderArtefacts();
    const delay = switchingFromAgent && !prefersReducedMotion ? 200 : 0;
    scheduleExclusiveExpand(function () {
      applyArtefactPanelState({ animate: !alreadyDetail || switchingFromAgent });
    }, delay);
  }

  function closeArtefactDetail() {
    saveTextWorkspace();
    hideTextOverlays();
    if (state.artefactFullscreen) setArtefactFullscreen(false, { silent: true });
    state.artefactPanelView = "list";
    applyArtefactPanelState({ animate: true });
    restoreArtefactListScroll();
  }

  function continueArtefactInChat() {
    saveTextWorkspace();
    hideTextOverlays();
    const art = findArtefact(state.selectedArtefactId);
    if (!art) return;
    const chip = {
      id: "artefact:" + art.id,
      label: (CATEGORY_LABELS[art.category] || "Artifact") + " · " + art.title,
      kind: "artifact",
      artefactId: art.id,
      icon: artefactTypeIcon(art),
    };
    const exists = state.contextItems.some(function (raw) {
      return normalizeContext(raw).id === chip.id;
    });
    if (!exists) state.contextItems.push(chip);
    state.artefactContextId = art.id;
    renderContext();
    syncComposerPlaceholder();
    closeArtefactDetail();
    window.setTimeout(
      function () {
        if (els.composerInput) els.composerInput.focus();
      },
      prefersReducedMotion ? 0 : 320
    );
  }

  function setArtefactsCollapsed(collapsed) {
    const wasCollapsed = state.artefactsCollapsed;
    state.artefactsCollapsed = collapsed;
    if (collapsed && state.artefactFullscreen) setArtefactFullscreen(false, { silent: true });
    const reopenDetail = !collapsed && wasCollapsed && state.artefactPanelView === "detail" && !!state.selectedArtefactId;
    if (reopenDetail) {
      const art = findArtefact(state.selectedArtefactId);
      if (art) renderArtefactDetail(art);
    }
    applyArtefactPanelState({ animate: reopenDetail });
    syncSuggestFade();
  }

  function openModal() {
    if (!els.modal) return;
    closePopovers();
    closeSearchModal();
    els.modal.hidden = false;
    state.newAgentStarter = "proposal";
    document.querySelectorAll("[data-starter]").forEach(function (btn) {
      btn.classList.toggle("is-selected", btn.getAttribute("data-starter") === "proposal");
    });
    if (els.newAgentName) {
      els.newAgentName.value = "";
      els.newAgentName.focus();
    }
  }

  function closeModal() {
    if (els.modal) els.modal.hidden = true;
  }

  function ensureTooltip() {
    if (tooltipEl) return tooltipEl;
    tooltipEl = document.createElement("div");
    tooltipEl.className = "aos-tooltip";
    tooltipEl.id = "aos-tooltip";
    tooltipEl.setAttribute("role", "tooltip");
    tooltipEl.hidden = true;
    document.body.appendChild(tooltipEl);
    return tooltipEl;
  }

  function hideTooltip() {
    if (tooltipTimer) {
      window.clearTimeout(tooltipTimer);
      tooltipTimer = null;
    }
    if (tooltipEl) tooltipEl.hidden = true;
  }

  function showTooltip(trigger) {
    const label = trigger.getAttribute("data-tooltip") || trigger.getAttribute("title");
    if (!label) return;
    const el = ensureTooltip();
    el.textContent = label;
    el.hidden = false;
    const rect = trigger.getBoundingClientRect();
    const tip = el.getBoundingClientRect();
    let top = rect.top + rect.height / 2 - tip.height / 2;
    let left = rect.right + 8;
    top = Math.max(8, Math.min(top, window.innerHeight - tip.height - 8));
    if (left + tip.width > window.innerWidth - 8) left = Math.max(8, rect.left - tip.width - 8);
    el.style.top = Math.round(top) + "px";
    el.style.left = Math.round(left) + "px";
  }

  function bindTooltips() {
    document.addEventListener("pointerenter", function (e) {
      const el = e.target.closest && e.target.closest("[data-tooltip]");
      if (!el || (e.pointerType && e.pointerType !== "mouse")) return;
      if (tooltipTimer) window.clearTimeout(tooltipTimer);
      tooltipTimer = window.setTimeout(function () {
        showTooltip(el);
      }, 280);
    }, true);
    document.addEventListener("pointerleave", function (e) {
      const el = e.target.closest && e.target.closest("[data-tooltip]");
      if (el) hideTooltip();
    }, true);
    document.addEventListener("focusin", function (e) {
      if (e.target.closest && e.target.closest("[data-tooltip]")) showTooltip(e.target.closest("[data-tooltip]"));
    });
    document.addEventListener("focusout", hideTooltip);
  }

  function fillPrompt(text) {
    if (!els.composerInput) return;
    els.composerInput.textContent = text;
    syncSend();
    els.composerInput.focus();
  }

  function createAgent() {
    const starter = STARTER_DEFAULTS[state.newAgentStarter] || STARTER_DEFAULTS.custom;
    const title = (els.newAgentName && els.newAgentName.value.trim()) || starter.title;
    const agent = {
      id: "agent-" + Date.now(),
      title: title,
      meta: starter.meta,
      status: starter.status,
      stamp: "1m",
      date: "Today",
      reply: "I've opened a new Agent OS workspace. Add context or ask me to draft, summarise, or prepare the next artefact.",
    };
    agents.unshift(agent);
    closeModal();
    openSession(agent);
    fillPrompt("");
    showToast("Agent created");
  }

  function sendPrompt() {
    const text = composerText();
    if (!text) return;
    const quoteText = pendingQuoteText();
    if (state.chatSessionType === "artifact") {
      const conversation = currentConversation();
      if (conversation) {
        appendArtifactTurn(conversation, text, quoteText);
        clearPendingQuotedSelection();
        els.composerInput.textContent = "";
        syncSend();
        syncComposerPlaceholder();
        return;
      }
    }
    if (state.chatSessionType === "agent" && state.activeMainChatSessionId) {
      appendFollowUp(text);
      clearPendingQuotedSelection();
      els.composerInput.textContent = "";
      syncSend();
      syncComposerPlaceholder();
      return;
    }
    if (state.artefactContextId && quoteText) {
      const art = findArtefact(state.artefactContextId);
      if (art) {
        enterArtifactConversation(art, quoteText);
        appendArtifactTurn(currentConversation(), text, quoteText);
        clearPendingQuotedSelection();
        els.composerInput.textContent = "";
        syncSend();
        syncComposerPlaceholder();
        return;
      }
    }
    let agent = findAgent(state.selectedAgentId);
    if (!agent) {
      agent = {
        id: "agent-" + Date.now(),
        title: text.length > 42 ? text.slice(0, 40) + "…" : text,
        meta: "Just now · In progress",
        stamp: "1m",
        status: "progress",
        date: "Today",
        reply: "Working from your prompt now. I’ll keep artefacts in the right-hand panel as they are generated.",
      };
      agents.unshift(agent);
    }
    openSession(agent, text);
    clearPendingQuotedSelection();
    els.composerInput.textContent = "";
    syncSend();
    syncComposerPlaceholder();
  }

  document.getElementById("aos-header-home").addEventListener("click", showHome);
  document.getElementById("aos-agents-collapse").addEventListener("click", function () {
    setAgentsCollapsed(!state.agentsCollapsed);
  });
  const collapseDetail = document.getElementById("aos-agents-collapse-detail");
  if (collapseDetail) {
    collapseDetail.addEventListener("click", function () {
      setAgentsCollapsed(!state.agentsCollapsed);
    });
  }
  const detailBack = document.getElementById("aos-agent-detail-back");
  if (detailBack) {
    detailBack.addEventListener("click", closeAgentDetail);
  }
  const continueBtn = document.getElementById("aos-continue-in-chat");
  if (continueBtn) {
    continueBtn.addEventListener("click", continueInChat);
  }
  bindTraceContainer(els.detailBody);
  bindTraceContainer(els.thread);
  document.getElementById("aos-artefacts-collapse").addEventListener("click", function () {
    setArtefactsCollapsed(!state.artefactsCollapsed);
  });
  const artefactCollapseDetail = document.getElementById("aos-artefacts-collapse-detail");
  if (artefactCollapseDetail) {
    artefactCollapseDetail.addEventListener("click", function () {
      setArtefactsCollapsed(!state.artefactsCollapsed);
    });
  }
  const artefactBack = document.getElementById("aos-artefact-detail-back");
  if (artefactBack) {
    artefactBack.addEventListener("click", closeArtefactDetail);
  }
  const artefactContinue = document.getElementById("aos-artefact-continue");
  if (artefactContinue) {
    artefactContinue.addEventListener("click", continueArtefactInChat);
  }
  const artefactFsExit = document.getElementById("aos-artefact-fs-exit");
  if (artefactFsExit) {
    artefactFsExit.addEventListener("click", function () {
      setArtefactFullscreen(false);
    });
  }
  function bindArtefactToolbar(host) {
    if (!host || host.dataset.toolbarBound === "true") return;
    host.dataset.toolbarBound = "true";
    host.addEventListener("mousedown", function (e) {
      const control = e.target.closest("[data-artefact-action], .aos-write-fmt, .aos-write-style");
      if (!control || !host.contains(control)) return;
      if (e.target.closest("select")) {
        captureTextSelection();
        return;
      }
      e.preventDefault();
      captureTextSelection();
    });
    host.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-artefact-action]");
      if (!btn || !host.contains(btn) || btn.tagName === "SELECT") return;
      handleArtefactAction(btn.getAttribute("data-artefact-action"));
    });
    host.addEventListener("change", function (e) {
      if (!e.target.matches("[data-artefact-action='block-style']")) return;
      applyTextBlockStyle(e.target.value);
    });
  }
  bindArtefactToolbar(els.artefactToolbar);
  bindArtefactToolbar(els.artefactFsToolbar);
  bindCanvasHost(els.artefactViewer);
  bindCanvasHost(els.artefactFsViewer);
  function onWriteHostScroll(host) {
    if (!state.selectedArtefactId) return;
    currentArtefactViewState().scrollTop = host.scrollTop;
    if (els.textSelBar && !els.textSelBar.hidden && textEditor.savedRange) {
      positionNearSelection(els.textSelBar, textEditor.savedRange, 7);
    }
    if (els.textCommentComposer && !els.textCommentComposer.hidden && textEditor.pendingComment) {
      positionNearSelection(els.textCommentComposer, textEditor.pendingComment.range, 10);
    }
    if (els.textCommentThread && !els.textCommentThread.hidden && els.textCommentThread.dataset.threadId) {
      const mark = activeWriteDoc() && activeWriteDoc().querySelector('mark.aos-comment-mark[data-thread-id="' + els.textCommentThread.dataset.threadId + '"]');
      if (mark) {
        const range = document.createRange();
        range.selectNode(mark);
        positionNearSelection(els.textCommentThread, range, 10);
      }
    }
  }
  if (els.artefactViewer) {
    els.artefactViewer.addEventListener("scroll", function () {
      onWriteHostScroll(els.artefactViewer);
    });
  }
  if (els.artefactFsViewer) {
    els.artefactFsViewer.addEventListener("scroll", function () {
      onWriteHostScroll(els.artefactFsViewer);
    });
  }
  if (els.textSelBar) {
    els.textSelBar.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });
    els.textSelBar.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-text-action]");
      if (!btn) return;
      handleTextAction(btn.getAttribute("data-text-action"));
    });
  }
  if (els.textCommentComposer) {
    els.textCommentComposer.addEventListener("click", function (e) {
      if (e.target.closest('[data-comment-ui="cancel"]')) hideTextCommentUI();
      if (e.target.closest('[data-comment-ui="submit"]')) submitTextComment();
    });
  }
  if (els.textCommentThread) {
    els.textCommentThread.addEventListener("click", function (e) {
      const id = els.textCommentThread.dataset.threadId;
      if (e.target.closest('[data-comment-ui="close"]')) hideTextCommentUI();
      if (e.target.closest('[data-comment-ui="resolve"]')) resolveTextComment(id);
      if (e.target.closest('[data-comment-ui="reply"]')) replyTextComment(id);
    });
  }
  const quoteRemove = document.getElementById("aos-composer-quote-remove");
  if (quoteRemove) {
    quoteRemove.addEventListener("click", function () {
      clearPendingQuotedSelection();
    });
  }
  if (els.composerQuoteMore) {
    els.composerQuoteMore.addEventListener("click", toggleQuoteExpanded);
  }
  document.addEventListener("selectionchange", function () {
    const art = findArtefact(state.selectedArtefactId);
    if (!isTextArtifact(art)) return;
    if (els.textCommentComposer && !els.textCommentComposer.hidden) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      hideTextSelectionBar();
      syncTextFormatState();
      return;
    }
    captureTextSelection({ show: true });
  });
  document.addEventListener("mousedown", function (e) {
    if (e.target.closest("#aos-text-selection-bar, #aos-text-comment-composer, #aos-text-comment-thread, .aos-artefact-viewer-toolbar, .aos-write")) return;
    hideTextOverlays();
  });

  document.getElementById("aos-share-btn").addEventListener("click", function (e) {
    e.stopPropagation();
    togglePopover(e.currentTarget, document.getElementById("aos-share-menu"));
  });
  document.getElementById("aos-share-copy").addEventListener("click", function () {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(function () {
        showToast("Link copied");
      }).catch(function () {
        showToast("Link ready: " + url);
      });
    } else {
      showToast("Link ready");
    }
    closePopovers();
  });

  document.getElementById("aos-settings-btn").addEventListener("click", function (e) {
    e.stopPropagation();
    togglePopover(e.currentTarget, document.getElementById("aos-settings-menu"));
  });
  els.themeToggle.addEventListener("click", function () {
    setTheme(getTheme() === "dark" ? "light" : "dark");
    closePopovers();
  });

  document.getElementById("aos-agent-search-btn").addEventListener("click", function () {
    openSearchModal("agents");
  });
  document.getElementById("aos-artefact-search-btn").addEventListener("click", function () {
    openSearchModal("artifacts");
  });
  if (els.searchModalInput) {
    els.searchModalInput.addEventListener("input", function () {
      state.searchModalQuery = els.searchModalInput.value;
      state.searchActiveIndex = 0;
      syncSearchHeading();
      renderSearchResults();
    });
    els.searchModalInput.addEventListener("keydown", function (e) {
      if (!state.searchModal) return;
      const items = searchItems();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        state.searchActiveIndex = Math.min(items.length - 1, state.searchActiveIndex + 1);
        renderSearchResults();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        state.searchActiveIndex = Math.max(0, state.searchActiveIndex - 1);
        renderSearchResults();
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectSearchResult(state.searchActiveIndex);
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeSearchModal();
      }
    });
  }
  if (els.searchModalResults) {
    els.searchModalResults.addEventListener("mousemove", function (e) {
      const row = e.target.closest("[data-search-index]");
      if (!row) return;
      const next = Number(row.dataset.searchIndex);
      if (Number.isNaN(next) || next === state.searchActiveIndex) return;
      state.searchActiveIndex = next;
      els.searchModalResults.querySelectorAll("[data-search-index]").forEach(function (el) {
        const active = Number(el.dataset.searchIndex) === next;
        el.classList.toggle("is-active", active);
        el.setAttribute("aria-selected", active ? "true" : "false");
      });
    });
    els.searchModalResults.addEventListener("click", function (e) {
      const row = e.target.closest("[data-search-index]");
      if (!row) return;
      selectSearchResult(Number(row.dataset.searchIndex));
    });
  }
  if (els.searchModal) {
    els.searchModal.addEventListener("click", function (e) {
      if (e.target.closest("[data-close-search]")) closeSearchModal();
    });
  }

  document.getElementById("aos-agent-filter-btn").addEventListener("click", function (e) {
    e.stopPropagation();
    togglePopover(e.currentTarget, document.getElementById("aos-agent-filter-menu"));
  });
  document.querySelectorAll("[data-agent-filter]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.agentFilter = btn.getAttribute("data-agent-filter");
      setRadioGroup("[data-agent-filter]", state.agentFilter, "data-agent-filter");
      renderAgents();
      closePopovers();
    });
  });

  document.getElementById("aos-artefact-filter-btn").addEventListener("click", function (e) {
    e.stopPropagation();
    togglePopover(e.currentTarget, document.getElementById("aos-artefact-filter-menu"));
  });
  document.getElementById("aos-artefact-sort").addEventListener("click", function (e) {
    e.stopPropagation();
    togglePopover(e.currentTarget, document.getElementById("aos-artefact-sort-menu"));
  });

  function applyArtefactFilter(value) {
    state.artefactFilter = state.artefactFilter === value ? "all" : value;
    document.querySelectorAll(".aos-chip[data-artefact-filter]").forEach(function (chip) {
      chip.classList.toggle("is-selected", chip.getAttribute("data-artefact-filter") === state.artefactFilter);
    });
    setRadioGroup("#aos-artefact-filter-menu [data-artefact-filter]", state.artefactFilter, "data-artefact-filter");
    renderArtefacts();
    closePopovers();
  }

  document.querySelectorAll("[data-artefact-filter]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyArtefactFilter(btn.getAttribute("data-artefact-filter"));
    });
  });
  document.querySelectorAll("[data-artefact-sort]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.artefactSort = btn.getAttribute("data-artefact-sort");
      setRadioGroup("[data-artefact-sort]", state.artefactSort, "data-artefact-sort");
      const labels = { recent: "Recently opened", shared: "Shared with me", mine: "Created by me" };
      document.getElementById("aos-artefact-sort-label").textContent = labels[state.artefactSort] || "Recently opened";
      renderArtefacts();
      closePopovers();
    });
  });

  document.getElementById("aos-model-btn").addEventListener("click", function (e) {
    e.stopPropagation();
    togglePopover(e.currentTarget, document.getElementById("aos-model-menu"), "top");
  });
  document.querySelectorAll("[data-model]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.model = btn.getAttribute("data-model");
      els.modelLabel.textContent = state.model;
      setRadioGroup("[data-model]", state.model, "data-model");
      document.querySelectorAll("[data-model]").forEach(function (item) {
        const icon = item.querySelector("[data-lucide='check']");
        if (item.getAttribute("data-model") === state.model) {
          if (!icon) {
            item.insertAdjacentHTML("beforeend", '<i data-lucide="check" aria-hidden="true"></i>');
          }
        } else if (icon) {
          icon.remove();
        }
      });
      refreshIcons();
      closePopovers();
    });
  });

  const complianceBtn = document.getElementById("aos-compliance-btn");
  if (complianceBtn) {
    complianceBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      togglePopover(complianceBtn, document.getElementById("aos-compliance-menu"), "top");
    });
  }

  document.getElementById("aos-add-context").addEventListener("click", function (e) {
    e.stopPropagation();
    togglePopover(e.currentTarget, els.contextMenu);
  });
  els.contextMenu.querySelectorAll("[data-context]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const label = btn.getAttribute("data-context");
      if (state.contextItems.indexOf(label) === -1) state.contextItems.push(label);
      renderContext();
      closePopovers();
    });
  });

  document.getElementById("aos-attach-btn").addEventListener("click", function () {
    const label = "File — Working notes.pdf";
    if (state.contextItems.indexOf(label) === -1) state.contextItems.push(label);
    renderContext();
  });

  document.getElementById("aos-new-agent").addEventListener("click", openModal);
  document.getElementById("aos-create-agent").addEventListener("click", createAgent);
  document.querySelectorAll("[data-close-modal]").forEach(function (btn) {
    btn.addEventListener("click", closeModal);
  });
  document.querySelectorAll("[data-starter]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.newAgentStarter = btn.getAttribute("data-starter");
      document.querySelectorAll("[data-starter]").forEach(function (item) {
        item.classList.toggle("is-selected", item === btn);
      });
      if (els.newAgentName && !els.newAgentName.value) {
        els.newAgentName.placeholder = STARTER_DEFAULTS[state.newAgentStarter].title;
      }
    });
  });

  document.querySelectorAll("[data-suggest]").forEach(function (card) {
    card.addEventListener("click", function () {
      const key = card.getAttribute("data-suggest");
      state.selectedSuggest = key;
      document.querySelectorAll(".aos-suggest").forEach(function (el) {
        el.classList.toggle("is-selected", el === card);
      });
      fillPrompt(SUGGEST_PROMPTS[key] || "");
    });
  });

  els.agentList.addEventListener("click", function (e) {
    const btn = e.target.closest(".aos-agent");
    if (!btn) return;
    const agent = findAgent(btn.dataset.agentId);
    if (!agent) return;
    btn.classList.add("is-opening");
    window.setTimeout(function () {
      btn.classList.remove("is-opening");
    }, 160);
    openAgentDetail(agent);
  });

  els.artefactList.addEventListener("click", function (e) {
    const btn = e.target.closest(".aos-artefact");
    if (!btn) return;
    openArtefactDetail(btn.dataset.artefactId);
  });

  els.composerInput.addEventListener("input", syncSend);
  els.composerInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }
  });
  els.sendBtn.addEventListener("click", sendPrompt);

  document.addEventListener("click", function (e) {
    if (
      e.target.closest(".aos-popover-wrap") ||
      e.target.closest(".aos-popover--fixed") ||
      e.target.closest("#aos-add-context") ||
      e.target.closest("#aos-model-btn") ||
      e.target.closest("#aos-compliance-btn")
    ) {
      return;
    }
    closePopovers();
  });

  function syncSuggestFade() {
    const row = els.suggestRow;
    const rail = els.suggestRail;
    if (!row || !rail) return;
    const max = row.scrollWidth - row.clientWidth;
    const hasOverflow = max > 2;
    rail.classList.toggle("has-overflow-end", hasOverflow && row.scrollLeft < max - 2);
    rail.classList.toggle("has-overflow-start", hasOverflow && row.scrollLeft > 2);
  }

  if (els.suggestRow) {
    els.suggestRow.addEventListener("scroll", syncSuggestFade, { passive: true });
    els.suggestRow.addEventListener(
      "wheel",
      function (e) {
        if (e.target.closest(".aos-suggest__preview")) return;
        if (!e.shiftKey) return;
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
        e.preventDefault();
        els.suggestRow.scrollLeft += e.deltaY;
      },
      { passive: false }
    );
    window.addEventListener("resize", syncSuggestFade);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (els.textCommentComposer && !els.textCommentComposer.hidden) {
        e.preventDefault();
        hideTextCommentUI();
        return;
      }
      if (els.textCommentThread && !els.textCommentThread.hidden) {
        e.preventDefault();
        hideTextCommentUI();
        return;
      }
      if (els.textSelBar && !els.textSelBar.hidden) {
        e.preventDefault();
        hideTextSelectionBar();
        return;
      }
      if (state.artefactFullscreen) {
        e.preventDefault();
        setArtefactFullscreen(false);
        return;
      }
      if (state.searchModal) {
        e.preventDefault();
        closeSearchModal();
        return;
      }
      const hadPopover = !!state.openPopover;
      closePopovers();
      closeModal();
      hideTooltip();
      if (!hadPopover && state.artefactPanelState === "detail") {
        closeArtefactDetail();
        return;
      }
      if (!hadPopover && state.agentPanelState === "detail") {
        closeAgentDetail();
      }
    }
  });

  window.AgentOSBuilder = {
    getState: function () {
      return Object.assign({}, state, {
        agentPanelState: resolveAgentPanelState(),
        artefactPanelState: resolveArtefactPanelState(),
        composerPlaceholder: composerPlaceholder(),
        activeConversation: currentConversation(),
        pendingQuotedSelection: state.pendingQuotedSelection,
      });
    },
    setState: function (patch) {
      Object.assign(state, patch || {});
      if (!patch) return;
      if (patch.agentPanelState === "closed") {
        state.agentsCollapsed = true;
      } else if (patch.agentPanelState === "list" || patch.agentPanelState === "detail") {
        state.agentsCollapsed = false;
        state.agentPanelView = patch.agentPanelState;
      }
      if (patch.artefactPanelState === "closed") {
        state.artefactsCollapsed = true;
      } else if (patch.artefactPanelState === "list" || patch.artefactPanelState === "detail") {
        state.artefactsCollapsed = false;
        state.artefactPanelView = patch.artefactPanelState;
      }
      if (patch.selectedAgentId && state.agentPanelView === "detail") {
        const agent = findAgent(state.selectedAgentId);
        if (agent) renderAgentDetail(agent);
      }
      if (patch.selectedArtefactId && state.artefactPanelView === "detail") {
        const art = findArtefact(state.selectedArtefactId);
        if (art) renderArtefactDetail(art);
      }
      if (
        "agentPanelState" in patch ||
        "agentPanelView" in patch ||
        "agentsCollapsed" in patch ||
        "selectedAgentId" in patch
      ) {
        applyAgentPanelState({ animate: false });
      }
      if (
        "artefactPanelState" in patch ||
        "artefactPanelView" in patch ||
        "artefactsCollapsed" in patch ||
        "selectedArtefactId" in patch
      ) {
        applyArtefactPanelState({ animate: false });
      }
    },
  };

  renderAgents();
  renderArtefacts();
  renderContext();
  applyAgentPanelState({ animate: false });
  applyArtefactPanelState({ animate: false });
  applyMainChatMode("landing");
  bindThreadScroll();
  syncThemeToggle();
  syncSend();
  syncComposerPlaceholder();
  bindTooltips();
  refreshIcons();
  syncSuggestFade();

  if (prefersReducedMotion) {
    document.documentElement.style.setProperty("--aos-transition-fast", "0ms");
    document.documentElement.style.setProperty("--aos-transition-sidebar", "0ms");
    document.documentElement.style.setProperty("--aos-transition-panel", "0ms");
  }
})();
