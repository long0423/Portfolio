/**
 * Agent OS — Agent execution demo fixture (synthetic, deterministic).
 * Single data source for both presentation variants (Before / After), per the
 * shared brief docs/workstreams/agent-os-execution-evolution.md, section C.
 * Event `duration` values are displayed metadata; `at` values are playback ms
 * after the prompt is sent. `log` lines are user-visible workflow records
 * (tool calls, sources, parsed outputs, statuses) — not model reasoning.
 */
(function (window) {
  "use strict";

  const scenario = {
    id: "agent-execution",
    title: "Proposal – Risk Framework Assessment",

    request:
      "Review the current proposal and prepare a risk framework assessment for the steering committee. Focus on delivery, governance, commercial and regulatory risks.",

    context: [
      { id: "demo:proposal-risk-framework", label: "Proposal Risk Framework", kind: "artifact", icon: "file-text" },
      { id: "demo:steering-committee-pack", label: "Steering Committee Pack", kind: "artifact", icon: "presentation" },
      { id: "demo:commercial-model-assumptions", label: "Commercial Model Assumptions", kind: "artifact", icon: "database" },
    ],

    agents: [
      {
        id: "primary",
        name: "Proposal agent",
        role: "Plans, delegates, writes the result",
        primary: true,
        events: [
          {
            id: "p1",
            icon: "files",
            label: "Read request and 3 context files",
            log: [
              "context.load(request, attachments=3)",
              "files: proposal_risk_framework.md · steering_committee_pack.pdf · commercial_model_assumptions.xlsx",
              "parsed: 64 sections · 12 slides · 46 rows",
              "status: completed",
            ],
          },
          {
            id: "p2",
            icon: "bot",
            label: "Started Evidence review agent",
            log: ['agent.spawn("evidence_review")', "scope: sources, requirements · inputs: 3 files", "status: queued"],
          },
          {
            id: "p3",
            icon: "bot",
            label: "Started Controls review agent",
            log: ['agent.spawn("controls_review")', "scope: existing controls, gaps · checks: 6", "status: queued"],
          },
          {
            id: "p4",
            icon: "layers",
            label: "Analysed 9 risk dimensions",
            log: [
              "risk.score(dimensions=9)",
              "inputs: evidence_summary.json · controls_findings.json",
              "scored: 9/9 · flagged: 3",
              "status: completed",
            ],
          },
          {
            id: "p5",
            icon: "chart-column",
            label: "Mapped residual ratings",
            detail: "3 high, 1 moderate, 1 low",
            log: ["risk.residual_map()", "high: governance, delivery, regulatory", "moderate: commercial · low: operational", "status: completed"],
          },
          {
            id: "p6",
            icon: "file-pen-line",
            label: "Drafted assessment",
            detail: "3 priority issues",
            log: ['response.compose(format="assessment")', "sections: issue · evidence · action", "priority_issues: 3 · words: 142", "status: ready"],
          },
        ],
        wait: {
          label: "Waiting on 2 sub-agents",
          op: "agent.await(evidence_review, controls_review)",
          done: "status: 2/2 sub-agents completed",
        },
      },
      {
        id: "evidence",
        name: "Evidence review agent",
        role: "Sources and requirements",
        events: [
          {
            id: "e1",
            icon: "file-search",
            label: "Reviewed Proposal Risk Framework",
            detail: "Sections 2.1, 3.4 and 5.2",
            duration: "3s",
            log: [
              "tool.invoke(document.read)",
              "source: proposal_risk_framework.md",
              "range: §2.1, §3.4, §5.2 · 14 paragraphs · 2 tables",
              "status: completed · 3s",
            ],
          },
          {
            id: "e2",
            icon: "search",
            label: "Searched governance requirements",
            detail: "Found 7 potentially relevant references",
            duration: "12s",
            log: [
              "tool.invoke(knowledge.search)",
              'query: "steering committee governance ownership requirements"',
              "index: governance_library · filters: proposal, FY27",
              "results: 7 references · top_score: 0.82",
              "status: completed · 12s",
            ],
          },
          {
            id: "e3",
            icon: "file-search",
            label: "Reviewed Steering Committee Pack",
            duration: "4s",
            log: [
              "tool.invoke(document.read)",
              "source: steering_committee_pack.pdf · slides 1–12",
              "extract: decision_log, risk_appetite, escalation_path",
              "status: completed · 4s",
            ],
          },
          {
            id: "e4",
            icon: "list-checks",
            label: "Checked delivery-risk criteria",
            duration: "6s",
            log: [
              'rules.evaluate("delivery_risk_criteria")',
              "criteria: 8 · passed: 5 · flagged: 3",
              "flags: milestone_dependencies, data_readiness, resourcing",
              "status: completed · 6s",
            ],
          },
          {
            id: "e5",
            icon: "file-search",
            label: "Reviewed Commercial Assumptions",
            duration: "3s",
            log: [
              "tool.invoke(sheet.read)",
              "source: commercial_model_assumptions.xlsx · tab: Assumptions",
              "rows: 46 · changed_since_v2: 4",
              "status: completed · 3s",
            ],
          },
          {
            id: "e6",
            icon: "list-checks",
            label: "Checked regulatory dependencies",
            duration: "5s",
            log: [
              'rules.evaluate("regulatory_dependencies")',
              "obligations: 3 functions · evidence_gaps: 2",
              "handoff → proposal_agent: evidence_summary.json",
              "status: completed · 5s",
            ],
          },
        ],
      },
      {
        id: "controls",
        name: "Controls review agent",
        role: "Existing controls and gaps",
        events: [
          {
            id: "c1",
            icon: "shield-check",
            label: "Engagement quality review",
            detail: "In place",
            duration: "2s",
            log: ['controls.check("engagement_quality_review")', "evidence: QR-14 · signed_off: true", "result: in_place", "status: completed · 2s"],
          },
          {
            id: "c2",
            icon: "shield-check",
            label: "Independence confirmation",
            detail: "In place",
            duration: "1s",
            log: ['controls.check("independence_confirmation")', "register: independence_log · confirmed: 6/6", "result: in_place", "status: completed · 1s"],
          },
          {
            id: "c3",
            icon: "shield-check",
            label: "Commercial sign-off path",
            detail: "In place",
            duration: "2s",
            log: [
              'controls.check("commercial_signoff_path")',
              "route: commercial_lead → engagement_partner · approvers: 2",
              "result: in_place",
              "status: completed · 2s",
            ],
          },
          {
            id: "c4",
            icon: "circle-alert",
            label: "Named governance owner",
            detail: "Still unassigned in the current pack",
            tone: "gap",
            log: [
              'controls.check("named_governance_owner")',
              "field: pack.governance.owner = null",
              "result: gap · severity: high",
              "note: still unassigned in the current pack",
            ],
          },
          {
            id: "c5",
            icon: "circle-alert",
            label: "Milestone dependency map",
            detail: "Delivery sequence is not locked",
            tone: "gap",
            log: [
              'controls.check("milestone_dependency_map")',
              "milestones: 9 · locked: 0 · draft: v0.3",
              "result: gap · severity: high",
              "note: delivery sequence is not locked",
            ],
          },
          {
            id: "c6",
            icon: "circle-alert",
            label: "Regulatory review slot",
            detail: "Not sequenced against the steering date",
            tone: "gap",
            log: [
              'controls.check("regulatory_review_slot")',
              "steering_date: week 6 · review_slot: unscheduled",
              "result: gap · severity: high",
              "handoff → proposal_agent: controls_findings.json (3 gaps)",
            ],
          },
        ],
      },
    ],

    statusLabels: {
      queued: "Queued",
      running: "Running",
      waiting: "Waiting on 2 sub-agents",
      done: "Completed",
    },

    // Same events, order and statuses in both variants. Before streams every log line at the
    // base pace; After shows only one status line, so its run segment plays time-compressed.
    playback: { before: 1, after: 0.42 },

    run: {
      label: "Worked for 4m 17s",
      summary: "Worked for 4m 17s · 2 sub-agents",
      phases: [
        { at: 0, label: "Proposal agent · Reading request and context" },
        { at: 1000, label: "Proposal agent · Starting 2 sub-agents" },
        { at: 2700, label: "Proposal agent · 2 sub-agents · Reviewing evidence" },
        { at: 7000, label: "Proposal agent · 2 sub-agents · Checking controls" },
        { at: 11600, label: "Proposal agent · Drafting assessment" },
      ],
      steps: [
        { at: 0, agent: "primary", status: "running" },
        { at: 0, agent: "primary", start: "p1" },
        { at: 1000, agent: "primary", done: "p1" },
        { at: 1000, agent: "primary", start: "p2" },
        { at: 1400, agent: "evidence", status: "queued" },
        { at: 1800, agent: "primary", done: "p2" },
        { at: 1800, agent: "primary", start: "p3" },
        { at: 2200, agent: "controls", status: "queued" },
        { at: 2600, agent: "primary", done: "p3" },
        { at: 2700, agent: "primary", status: "waiting" },
        { at: 2900, agent: "evidence", status: "running" },
        { at: 2900, agent: "evidence", start: "e1" },
        { at: 3550, agent: "controls", status: "running" },
        { at: 3550, agent: "controls", start: "c1" },
        { at: 4200, agent: "evidence", done: "e1" },
        { at: 4200, agent: "evidence", start: "e2" },
        { at: 4850, agent: "controls", done: "c1" },
        { at: 4850, agent: "controls", start: "c2" },
        { at: 5500, agent: "evidence", done: "e2" },
        { at: 5500, agent: "evidence", start: "e3" },
        { at: 6150, agent: "controls", done: "c2" },
        { at: 6150, agent: "controls", start: "c3" },
        { at: 6800, agent: "evidence", done: "e3" },
        { at: 6800, agent: "evidence", start: "e4" },
        { at: 7450, agent: "controls", done: "c3" },
        { at: 7450, agent: "controls", start: "c4" },
        { at: 8100, agent: "evidence", done: "e4" },
        { at: 8100, agent: "evidence", start: "e5" },
        { at: 8750, agent: "controls", done: "c4" },
        { at: 8750, agent: "controls", start: "c5" },
        { at: 9400, agent: "evidence", done: "e5" },
        { at: 9400, agent: "evidence", start: "e6" },
        { at: 10050, agent: "controls", done: "c5" },
        { at: 10050, agent: "controls", start: "c6" },
        { at: 10700, agent: "evidence", done: "e6" },
        { at: 10700, agent: "evidence", status: "done" },
        { at: 11350, agent: "controls", done: "c6" },
        { at: 11350, agent: "controls", status: "done", statusDetail: "3 gaps" },
        { at: 11600, agent: "primary", status: "running" },
        { at: 11600, agent: "primary", start: "p4" },
        { at: 12400, agent: "primary", done: "p4" },
        { at: 12400, agent: "primary", start: "p5" },
        { at: 13200, agent: "primary", done: "p5" },
        { at: 13200, agent: "primary", start: "p6" },
        { at: 14000, agent: "primary", done: "p6" },
        { at: 14100, agent: "primary", status: "done" },
      ],
      completeAt: 14400,
    },

    result: {
      lead: "The proposal is broadly viable, but I would address three issues before steering-committee review:",
      points: ["Governance ownership", "Delivery sequencing", "Regulatory dependency"],
      close: "I can turn this into a one-page risk summary or expand it into a full assessment.",
    },

    followUp: {
      prompt: "Turn it into a one-page summary for the committee.",
      agents: [
        {
          id: "primary",
          name: "Proposal agent",
          role: "Plans, delegates, writes the result",
          primary: true,
          events: [
            {
              id: "f1",
              icon: "file-text",
              label: "Reused the assessment from this thread",
              log: ["context.reuse(turn=1)", "status: completed"],
            },
            {
              id: "f2",
              icon: "file-pen-line",
              label: "Drafted one-page summary",
              detail: "3 priority issues",
              log: ['response.compose(format="one_page_summary")', "status: ready"],
            },
          ],
        },
      ],
      run: {
        label: "Worked for 12s",
        summary: "Worked for 12s",
        phases: [{ at: 0, label: "Proposal agent · Drafting one-page summary" }],
        steps: [
          { at: 0, agent: "primary", status: "running" },
          { at: 0, agent: "primary", start: "f1" },
          { at: 700, agent: "primary", done: "f1" },
          { at: 700, agent: "primary", start: "f2" },
          { at: 1500, agent: "primary", done: "f2" },
          { at: 1550, agent: "primary", status: "done" },
        ],
        completeAt: 1700,
      },
      result: {
        lead: "One-page steering-committee summary:",
        points: [
          "Governance ownership — name an accountable owner before the pack is issued.",
          "Delivery sequencing — lock the milestone dependency map.",
          "Regulatory dependency — book the regulatory review before the steering date.",
        ],
        close: "Commercial assumptions and operational controls stay on the monitor list.",
      },
    },
  };

  function buildTimeline(run) {
    const entries = [];
    (run.phases || []).forEach(function (phase) {
      entries.push({ at: phase.at, type: "phase", phase: phase });
    });
    (run.steps || []).forEach(function (step) {
      if (step.status) entries.push({ at: step.at, type: "status", agent: step.agent, status: step.status, detail: step.statusDetail || "" });
      if (step.done) entries.push({ at: step.at, type: "event-done", agent: step.agent, eventId: step.done });
      if (step.start) entries.push({ at: step.at, type: "event-start", agent: step.agent, eventId: step.start });
    });
    entries.push({ at: run.completeAt, type: "complete" });
    const order = { phase: 0, "event-done": 1, status: 2, "event-start": 3, complete: 4 };
    return entries
      .map(function (entry, index) {
        return Object.assign(entry, { seq: index });
      })
      .sort(function (a, b) {
        return a.at - b.at || order[a.type] - order[b.type] || a.seq - b.seq;
      });
  }

  scenario.timeline = buildTimeline(scenario.run);
  scenario.followUp.timeline = buildTimeline(scenario.followUp.run);
  scenario.buildTimeline = buildTimeline;

  window.AgentOSExecutionScenario = scenario;
})(window);
