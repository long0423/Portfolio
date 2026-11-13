/**
 * Write Builder — Report Editing Workspace
 * Compose → generating → editor view, streaming report + assistant.
 */
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const app = document.querySelector(".wb-app");
  const composeView = document.getElementById("wb-compose-view");
  const editorView = document.getElementById("wb-editor-view");
  const reportDoc = document.getElementById("wb-report-doc");
  const reportScroll = document.getElementById("wb-report-scroll");
  const reportStatus = document.getElementById("wb-report-status");
  const reportTitle = document.getElementById("wb-report-title");
  const assistantThread = document.getElementById("wb-assistant-thread");
  const assistantInput = document.getElementById("wb-assistant-input");
  const assistantSend = document.getElementById("wb-assistant-send");
  const composerQuote = document.getElementById("wb-composer-quote");
  const composerQuoteText = document.getElementById("wb-composer-quote-text");
  const composerQuoteMore = document.getElementById("wb-composer-quote-more");
  const composerQuoteRemove = document.getElementById("wb-composer-quote-remove");
  const versionsList = document.getElementById("wb-versions-list");
  const sourcesBtn = document.getElementById("wb-sources-btn");
  const sourcesPopover = document.getElementById("wb-sources-popover");
  const versionsBtn = document.getElementById("wb-versions-btn");
  const versionsPopover = document.getElementById("wb-versions-popover");
  const assistantFab = document.getElementById("wb-assistant-fab");
  const assistantClose = document.getElementById("wb-assistant-close");
  const promptHistoryBtn = document.getElementById("wb-prompt-history-btn");
  const promptHistoryPopover = document.getElementById("wb-prompt-history-popover");
  const promptHistorySearch = document.getElementById("wb-prompt-history-search");
  const promptHistoryBody = document.getElementById("wb-prompt-history-body");
  const renameBtn = document.getElementById("wb-report-rename");
  const newThreadBtn = document.getElementById("wb-new-thread");
  const exportBtn = document.getElementById("wb-export-btn");
  const showEditsBtn = document.getElementById("wb-show-edits");
  const navItems = document.querySelectorAll(".wb-nav__item");

  const workspace = {
    view: "compose", // compose | generating | editor
    reportStatus: "idle", // idle | generating | complete
    assistantStatus: "idle", // idle | working | streaming | complete
    reportVersion: 0,
    userScrolledAway: false,
    abort: false,
    timers: [],
    versions: [],
    didAutoCollapseSidebar: false,
    activeCiteId: null,
    citeGroup: [],
    citeGroupIndex: 0,
    citeGroupKey: null,
    citeAnchorFrozen: false,
    showEdits: false,
    revisions: [],
    revisionSeq: 0,
    suppressEditCapture: false,
    userEditTimer: null,
    userEditTarget: null,
    userEditBefore: null,
    commentThreads: [],
    commentSeq: 0,
    selectionContext: null,
    selectionAnchor: null,
    activeCommentThreadId: null,
    pendingCommentDraft: null,
    askRightText: null,
    submittedPrompt: null,
    rightPanelMode: "assistant",
    activeSourceId: null,
    activeOccurrenceId: null,
    sourceUsageExpanded: false,
    sourceScrollById: {},
    activePromptTraceId: null,
    activePromptTraceChangeId: null,
    promptHistoryCopiedTimer: null,
    composerContext: null,
  };

  const CITE_MARKS = ["", "[1]", "[2]", "[3]", "[4]", "[5]", "[6]", "[7]", "[8]"];

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cite(n, groupIds) {
    const ids = groupIds && groupIds.length ? groupIds : [n];
    const groupKey = ids.join(",");
    return (
      '<button type="button" class="wb-cite" contenteditable="false" data-ref="' +
      n +
      '" data-cite-group="' +
      escapeHtml(groupKey) +
      '" aria-label="Open reference ' +
      n +
      '">' +
      CITE_MARKS[n] +
      "</button>"
    );
  }

  function cites(ids) {
    return (
      '<span class="wb-cite-group" contenteditable="false" data-cite-group="' +
      escapeHtml(ids.join(",")) +
      '">' +
      ids
        .map(function (id) {
          return cite(id, ids);
        })
        .join("") +
      "</span>"
    );
  }

  function citePreviewHeading(level, text, page) {
    const tag = level === 1 ? "h3" : "h4";
    return (
      "<" +
      tag +
      ' data-cite-page="' +
      page +
      '">' +
      text +
      "</" +
      tag +
      ">"
    );
  }

  function citePreviewP(text, page) {
    return '<p data-cite-page="' + page + '">' + text + "</p>";
  }

  function buildTofaCitePreview() {
    const paper =
      '<h3 class="wb-cite-popover__paper" data-cite-page="1">TOFA Considerations for Cross-Currency Financing Arrangements</h3>';
    const before =
      paper +
      citePreviewHeading(1, "1. Executive Summary", 2) +
      citePreviewP(
        "This paper records a working classification and implementation view for Horizon Group’s proposed cross-currency financing arrangements. The facilities are expected to have a headline principal of AUD 85 million and a proposed commencement date of 1 July 2026, subject to final term sheets, counterparty approval and treasury system readiness.",
        2
      ) +
      citePreviewP(
        "On the facts currently available, the arrangements appear capable of being financial arrangements under Division 230. The most material sensitivities are election status, the tax timing method, and FX measurement where contract currency and functional currency differ.",
        3
      ) +
      citePreviewHeading(1, "2. Scope and Background", 4) +
      citePreviewP(
        "Horizon Group is assumed to be an Australian-resident company or tax consolidated group preparing Australian-dollar financial statements. Scope is limited to the Division 230 classification question, the choice of timing method, foreign-exchange interactions, and the operational work needed before 1 July 2026.",
        4
      ) +
      citePreviewP(
        "The review relies on public TOFA themes, draft commercial assumptions, and the group’s existing treasury operating model. Missing term-sheet fields, rate history and election registers are treated as open items rather than assumed away.",
        5
      ) +
      citePreviewHeading(1, "3. Arrangement Overview", 6) +
      citePreviewP(
        "The contemplated facilities are expected to create contractual rights to receive, and obligations to provide, cash or cash-equivalent amounts over time. Principal is currently modelled at AUD 85 million, with one or more legs denominated in a foreign currency.",
        6
      ) +
      citePreviewP(
        "Cash-flow profiles may include periodic coupons, reset dates, optional early termination and settlement in a currency other than the group’s functional currency. If the facilities are booked as a programme, each draw should inherit the same classification logic unless a later term sheet changes the rights and obligations.",
        7
      ) +
      citePreviewHeading(1, "4. Division 230 Applicability", 8) +
      citePreviewP(
        "Division 230 applies to gains and losses from financial arrangements, subject to population tests, elections and statutory exceptions. The first question is whether Horizon Group is inside the TOFA population or otherwise elects into the regime.",
        8
      ) +
      citePreviewP(
        "A population or election-in conclusion should be evidenced from the group’s latest income-year position, not inferred from the existence of treasury activity. If Horizon Group is outside the statutory population and does not elect in, the remainder of this paper becomes a contingency analysis rather than an operating design.",
        8
      ) +
      citePreviewHeading(2, "4.1 Financial arrangement definition", 9) +
      citePreviewP(
        "A financial arrangement generally involves a right to receive, or an obligation to provide, a financial benefit that is cash or a cash equivalent in substance. Horizon Group’s proposed facilities appear to satisfy that definition because the commercial bargain is the exchange of cash over time rather than the delivery of a non-financial asset.",
        9
      ) +
      citePreviewP(
        "Related rights and obligations should be tested together where they are priced or managed as a single package. Where a facility is bundled with an embedded option or a separately documented hedge, the classification paper should state whether the components are one arrangement or more than one.",
        9
      ) +
      citePreviewP(
        "That choice affects both timing and the data fields required in the financial-arrangement register. A working description is enough for a prototype classification, but it is not enough for a signed memo.",
        9
      ) +
      citePreviewHeading(2, "4.2 Rights and obligations", 10) +
      citePreviewP(
        "Classification should test whether a financial benefit is to be received or provided, whether that benefit is cash or cash-equivalent in substance, and whether any exception applies. For Horizon Group, the rights and obligations attached to the AUD 85 million facilities are expected to be cash-settlable.",
        10
      ) +
      citePreviewP(
        "The memo should identify each material right, the person obliged to perform, and the circumstances in which performance can be accelerated, netted or terminated. Incomplete counterparties or missing optionalities are not fatal to a working view, but they should be listed as information gaps with an owner and a date.",
        10
      ) +
      citePreviewP(
        "Where more than one entity in the group is a party to the same facility, the paper should record which entity holds the relevant rights and which entity bears the corresponding obligation. That allocation matters for both the Division 230 analysis and the later mapping of tax lots.",
        10
      ) +
      citePreviewP(
        "If a guarantee, indemnity or close-out right can change the economic outcome, it should be described even where the current working assumption is that the feature will not be exercised. Features that are remote still belong in the fact pattern.",
        11
      ) +
      citePreviewHeading(2, "4.3 Cash-settlable features", 11) +
      citePreviewP(
        "Cash-settlable features include payment schedules, close-out amounts, and the ability to settle a foreign-currency obligation by delivering Australian-dollar cash of equivalent value. Those features support a financial-arrangement conclusion even where the instrument has a commercial funding purpose.",
        11
      ) +
      citePreviewP(
        "If a leg can be settled only by delivery of a specific non-cash asset, that fact should be recorded and the exception analysis updated. No such feature is currently described in the draft terms.",
        11
      ) +
      citePreviewP(
        "Netting, early termination and cash-settled optionality should be captured in the same schedule as ordinary coupons. Period-end extracts that omit those features will understate the rights and obligations being tested.",
        11
      ) +
      citePreviewHeading(2, "4.4 Relevant exclusions", 12) +
      citePreviewP(
        "Arrangements that are solely equity interests, or that fall within specific statutory exceptions, may sit outside the core TOFA recognition rules even where cash flows appear financing-like. The current draft does not indicate an equity-only outcome for the Horizon Group facilities.",
        12
      ) +
      citePreviewP(
        "Exclusion screening should still be completed before the classification paper is issued. Residual uncertainty should be disclosed rather than omitted, with an owner and a review date.",
        12
      ) +
      citePreviewP(
        "If facts later change—for example through amendment of terms or the addition of an equity conversion feature—the exception analysis should be refreshed rather than carried forward by default.",
        12
      ) +
      citePreviewHeading(1, "5. Tax Timing Methods", 13) +
      citePreviewP(
        "Timing under TOFA may follow compounding accruals, realisation, or an elected method such as fair value. The choice should be documented against certainty of overall gain or loss, election status, and the quality of source data.",
        13
      ) +
      citePreviewP(
        "For Horizon Group, the method decision is not only a tax-technical choice. It determines which treasury extracts must be production-ready by 1 July 2026, how often Tax will need valuation support, and how large the first-year true-up is likely to be if estimates later move.",
        13
      ) +
      citePreviewHeading(2, "5.1 Accruals method", 13) +
      citePreviewP(
        "Teams are encouraged to test whether overall gains or losses can be estimated with sufficient certainty before selecting an accruals path. Where estimates are unstable, a more realisation-oriented approach may reduce later true-up complexity.",
        13
      ) +
      citePreviewP(
        "For the Horizon Group facilities, compounding accruals may be relevant if TOFA applies and no fair-value or other elected method governs the position. That conclusion depends on whether sufficiently certain overall gains or losses can be estimated from the 1 July 2026 cash-flow schedule.",
        14
      ) +
      citePreviewP(
        "Accruals workpapers should show the method chosen, the certainty assessment, and the data fields required each period. True-up mechanics should be agreed with finance before go-live.",
        14
      ) +
      citePreviewHeading(2, "5.2 Realisation method", 14) +
      citePreviewP(
        "If certainty thresholds are not met, realisation concepts may be more appropriate. Realisation is typically closer to settlement events and can reduce estimate volatility, at the cost of a weaker match to commercial accruals.",
        14
      ) +
      citePreviewP(
        "A realisation path still requires complete settlement data and a clear mapping from treasury events to tax lots. Missing event types are a common cause of later reconstruction work.",
        14
      ) +
      citePreviewP(
        "Where some legs can be estimated with certainty and others cannot, the paper should state whether a mixed method is available or whether a single method will be applied to the package.",
        15
      ) +
      citePreviewHeading(2, "5.3 Foreign exchange retranslation", 15) +
      citePreviewP(
        "Where contract currency and functional currency differ, FX movements may affect the amount and timing of recognised gains or losses, depending on the method and elections applied. Retranslation should be specified in the classification paper rather than inferred from accounting policy alone.",
        15
      ) +
      citePreviewP(
        "The AUD 85 million headline principal is an Australian-dollar equivalent used for planning. If a material portion of the cash flows is denominated in another currency, period-end translation can change both the recognised gain or loss and the evidence Tax needs from the rate hierarchy.",
        15
      ) +
      citePreviewP(
        "Systems should capture principal and FX components consistently for tax workpapers. Period-end reviews commonly compare accounting FX results with the tax method selected under TOFA, and document residual measurement uncertainty before positions are locked.",
        15
      ) +
      citePreviewHeading(1, "6. Elections", 16) +
      citePreviewP(
        "Where TOFA applies, elections can materially affect timing. Common considerations include fair value, foreign exchange retranslation, hedging, and reliance on financial reports. Election status should be validated before classification is finalised.",
        16
      ) +
      citePreviewP(
        "For Horizon Group, the election register should be reviewed against the proposed 1 July 2026 commencement so that any gap is visible before the facilities are booked. A lightweight RACI for election changes reduces rework when instruments are amended or rolled.",
        16
      );
    const evidence =
      '<p data-cite-page="16"><mark class="wb-cite-mark" id="wb-cite-highlight">Where TOFA applies, organisations typically need clear ownership of classification memos, election monitoring, and reconciliations between accounting balances and tax lots.</mark></p>';
    const after =
      citePreviewP(
        "Control frameworks usually assign reviewers for classification changes, model updates and return disclosure labels. Documentation standards should cover both the initial conclusion and subsequent amendments if commercial terms change.",
        16
      ) +
      citePreviewP(
        "Election monitoring is most effective when treasury deal capture, accounting policy and tax ownership are aligned before the arrangement is executed. Without that alignment, teams often discover method conflicts only at period end.",
        17
      ) +
      citePreviewHeading(2, "6.1 Reliance on financial reports", 17) +
      citePreviewP(
        "Reliance on financial reports, where available, can reduce the distance between accounting balances and tax lots. The election is only useful if the underlying reports can be reconciled to the financial-arrangement register on a timely basis.",
        17
      ) +
      citePreviewP(
        "If Horizon Group intends to rely on financial reports for some but not all of the proposed facilities, the coverage of the election should be evidenced rather than assumed from group accounting policy.",
        17
      ) +
      citePreviewHeading(2, "6.2 Fair value election", 17) +
      citePreviewP(
        "A fair-value election should not be assumed merely because the instruments will be marked to market for accounting. The tax election, its date, and its coverage of the proposed facilities must be evidenced.",
        17
      ) +
      citePreviewP(
        "Fair-value operation depends on reliable valuation feeds. Those feeds are currently an open item and should be listed in the implementation plan with an owner and a production date.",
        18
      ) +
      citePreviewHeading(2, "6.3 Hedging election", 18) +
      citePreviewP(
        "If Horizon Group intends to treat any foreign-currency leg as a hedge for tax purposes, the hedging election and designation records should be assembled before 1 July 2026. Missing designations are a recurring cause of later true-up work.",
        18
      ) +
      citePreviewP(
        "Designation files should identify the hedged risk, the hedging instrument, and the date on which the relationship was established. Retrospective reconstruction is rarely satisfactory for a period-end review.",
        18
      ) +
      citePreviewHeading(1, "7. Foreign Exchange Considerations", 19) +
      citePreviewP(
        "Cross-currency financing creates measurement questions even after the TOFA inclusion conclusion is reached. The paper separates principal recognition from FX translation so that source-system design can follow the tax method.",
        19
      ) +
      citePreviewP(
        "Where functional currency and contract currency differ, FX movements may create separate or integrated tax outcomes depending on elections and the character of the arrangement. Horizon Group should identify the contract currency of each leg and the rate source that will be used at period end.",
        19
      ) +
      citePreviewP(
        "Where rate history is incomplete, provisional workpapers should flag the open item and the date at which FX measurement can be revalidated. Open items should record any missing rate history or incomplete cash-flow schedules that could undermine FX measurement.",
        20
      ) +
      citePreviewHeading(1, "8. Systems and Data", 21) +
      citePreviewP(
        "Implementation work commonly spans tax, finance and treasury teams, with clear ownership for memos, election registers and reconciliations. Guidance-style materials also highlight the need to align deal capture in treasury systems with the tax lots used for accruals or realisation calculations.",
        21
      ) +
      citePreviewP(
        "A practical control set often includes a classification checklist, election register, data mapping from treasury systems, and documented review of tax return disclosures. Gaps in source data remain a common cause of process failure.",
        21
      ) +
      citePreviewP(
        "Go-live criteria frequently require evidence that reconciliations can be completed within reporting timelines. Training materials for reviewers should explain how to challenge classification changes and incomplete data feeds.",
        22
      ) +
      citePreviewHeading(1, "9. Governance and Next Steps", 23) +
      citePreviewP(
        "The working recommendation is to complete exclusion screening, confirm election status, and lock a timing-method paper before the facilities are booked. Residual uncertainties should remain visible in the file rather than being closed by silence.",
        23
      ) +
      citePreviewP(
        "Prototype guidance summary only — not PwC client advice. This excerpt is demo and reference content for the Write playground and is not an official extract.",
        24
      );
    return { before: before, evidence: evidence, after: after };
  }

  const TOFA_CITE_PREVIEW = buildTofaCitePreview();

  const REFERENCE_SOURCES = {
    1: {
      id: 1,
      source: "Australian Taxation Office",
      title: "Taxation of financial arrangements (TOFA)",
      domain: "ato.gov.au",
      summary: "Overview of Division 230 application and population tests",
      before:
        "<p>The ATO publishes overview guidance explaining when TOFA may apply to taxpayers and how Division 230 interacts with ordinary tax concepts for financing and treasury arrangements.</p>" +
        "<p>TOFA is designed to reduce mismatches between commercial and tax timing for financial arrangements, subject to population tests, elections and specific exceptions.</p>" +
        "<p>In practice, teams usually start by confirming whether the taxpayer is inside the TOFA population and whether the instrument creates rights or obligations to receive or provide a financial benefit.</p>",
      evidence:
        "<p>Division 230 generally applies to gains and losses from <mark class=\"wb-cite-mark\" id=\"wb-cite-highlight\">financial arrangements</mark>. Whether an arrangement is a financial arrangement depends on the rights and obligations to receive or provide a financial benefit, and on the taxpayer’s circumstances.</p>",
      after:
        "<p>Taxpayers should confirm elections, exceptions and record-keeping requirements before relying on a TOFA outcome for return preparation.</p>" +
        "<p>Where facts remain incomplete, a provisional classification may be useful for planning, but it should be revisited once final terms, counterparties and currencies are known.</p>" +
        "<p>Systems and process readiness—particularly cash-flow mapping and period-end reconciliations—often determine whether a TOFA conclusion is operable in practice.</p>" +
        "<p>This excerpt is demo/reference content for the Write playground and is not an official ATO extract.</p>",
    },
    2: {
      id: 2,
      source: "Federal Register of Legislation",
      title: "Income Tax Assessment Act 1997 — Division 230",
      domain: "legislation.gov.au",
      summary: "Legislative framework for financial arrangements and tax timing",
      before:
        "<p>Division 230 of the ITAA 1997 sets out the TOFA framework for recognising gains and losses from financial arrangements.</p>" +
        "<p>The Division includes rules on scope, timing methods, elections and particular classes of arrangement that may sit inside or outside the core provisions.</p>" +
        "<p>Readers typically review the meaning of financial benefit, cash or cash-equivalent outcomes, and how related rights and obligations are tested together.</p>",
      evidence:
        "<p><mark class=\"wb-cite-mark\" id=\"wb-cite-highlight\">A financial arrangement generally involves a right to receive, or an obligation to provide, a financial benefit that is cash or a cash equivalent in substance, subject to statutory exceptions and related provisions.</mark></p>",
      after:
        "<p>Timing methods and elections can materially change the income years in which gains and losses are recognised.</p>" +
        "<p>Where an elected method applies, the interaction with accounting balances and tax lots should be documented so period-end reviews remain traceable.</p>" +
        "<p>Classification papers commonly record both the inclusion analysis and any exception relied on, together with residual uncertainties.</p>" +
        "<p>Demo excerpt only — not a verbatim statutory quotation for advice purposes.</p>",
    },
    3: {
      id: 3,
      source: "PwC public tax guidance",
      title: "Australian TOFA considerations",
      domain: "pwc.com.au",
      summary: "Practical classification, elections and systems readiness themes",
      pages: 34,
      before: TOFA_CITE_PREVIEW.before,
      evidence: TOFA_CITE_PREVIEW.evidence,
      after: TOFA_CITE_PREVIEW.after,
    },
    4: {
      id: 4,
      source: "Australian Taxation Office",
      title: "TOFA timing methods overview",
      domain: "ato.gov.au",
      summary: "Accruals, realisation and elected timing methods under TOFA",
      pages: 34,
      before:
        citePreviewHeading(1, "5. Tax Timing Methods", 13) +
        citePreviewP(
          "Timing under TOFA may follow compounding accruals, realisation, or elected methods such as fair value, depending on the arrangement and elections.",
          13
        ) +
        citePreviewP(
          "Overview materials usually contrast how accruals spreads recognition over the life of an arrangement with realisation approaches tied more closely to settlement events.",
          13
        ) +
        citePreviewHeading(2, "5.1 Accruals method", 13) +
        citePreviewP(
          "An accruals path is typically considered where the overall gain or loss can be estimated with sufficient certainty from the expected cash-flow schedule.",
          13
        ) +
        citePreviewP(
          "Workpapers should record the certainty assessment and the data fields required to operate the calculation each period before the method is locked.",
          14
        ),
      evidence:
        '<p data-cite-page="14"><mark class="wb-cite-mark" id="wb-cite-highlight">Teams are encouraged to test whether overall gains or losses can be estimated with sufficient certainty before selecting an accruals path. Where estimates are unstable, a more realisation-oriented approach may reduce later true-up complexity.</mark></p>',
      after:
        citePreviewP(
          "If certainty thresholds are not met, realisation concepts may be more appropriate.",
          14
        ) +
        citePreviewHeading(2, "5.2 Realisation method", 14) +
        citePreviewP(
          "Realisation is typically closer to settlement events and can reduce estimate volatility, at the cost of a weaker match to commercial accruals.",
          14
        ) +
        citePreviewP(
          "Election status should be confirmed before modelling cash-tax differences for planning or provisioning.",
          15
        ) +
        citePreviewP(
          "Demo reference content for portfolio interaction only.",
          15
        ),
    },
    5: {
      id: 5,
      source: "Federal Register of Legislation",
      title: "Division 230 — foreign exchange interactions",
      domain: "legislation.gov.au",
      summary: "FX measurement interactions with TOFA recognition",
      before:
        "<p>Foreign currency denominated arrangements can create separate measurement questions under TOFA and related FX provisions.</p>" +
        "<p>Where functional currency and contract currency differ, design papers usually identify how principal and FX components will be captured in source systems.</p>",
      evidence:
        "<p>Election choices can change whether FX volatility is recognised on an integrated or more separate basis for tax purposes.</p>" +
        "<p><mark class=\"wb-cite-mark\" id=\"wb-cite-highlight\">Where contract currency and functional currency differ, FX movements may affect the amount and timing of recognised gains or losses, depending on the method and elections applied.</mark></p>" +
        "<p><mark class=\"wb-cite-mark\">Systems should capture principal and FX components consistently for tax workpapers.</mark> Period-end reviews commonly compare accounting FX results with the tax method selected under TOFA, and document residual measurement uncertainty before positions are locked.</p>" +
        "<p>Where rate history is incomplete, provisional workpapers should flag the open item and the date at which FX measurement can be revalidated.</p>",
      after:
        "<p>Open items should record any missing rate history or incomplete cash-flow schedules that could undermine FX measurement.</p>" +
        "<p>Implementation checklists often include rate sources, reset dates and reconciliation points between treasury and tax lots.</p>" +
        "<p>Short demo excerpt — not formal legislative advice.</p>",
    },
    6: {
      id: 6,
      source: "PwC public tax guidance",
      title: "TOFA compliance and controls",
      domain: "pwc.com.au",
      summary: "Documentation, period-end controls and accountability",
      before:
        "<p>Compliance programmes for TOFA typically emphasise documentation, period-end controls and clear accountability across tax and finance.</p>" +
        "<p>Operating models often separate deal capture, classification approval, calculation ownership and disclosure review.</p>" +
        "<p>Control narratives usually describe how election registers are maintained and how changes are authorised.</p>",
      evidence:
        "<p><mark class=\"wb-cite-mark\" id=\"wb-cite-highlight\">A practical control set often includes a classification checklist, election register, data mapping from treasury systems, and documented review of tax return disclosures.</mark></p>",
      after:
        "<p>Gaps in source data remain a common cause of process failure.</p>" +
        "<p>Go-live criteria frequently require evidence that reconciliations can be completed within reporting timelines.</p>" +
        "<p>Training materials for reviewers should explain how to challenge classification changes and incomplete data feeds.</p>" +
        "<p>Demo content for the Write playground.</p>",
    },
    7: {
      id: 7,
      source: "Australian Taxation Office",
      title: "Financial arrangements — exceptions and carve-outs",
      domain: "ato.gov.au",
      summary: "Exceptions that may take arrangements outside core TOFA rules",
      before:
        "<p>Not every financing or investment position sits inside TOFA. Exceptions and carve-outs can remove arrangements from the core rules.</p>" +
        "<p>Overview guidance encourages teams to test both inclusion criteria and relevant exceptions before locking a conclusion.</p>" +
        "<p>Equity-like outcomes, specific statutory carve-outs and related-party fact patterns are frequent areas of early screening.</p>",
      evidence:
        "<p><mark class=\"wb-cite-mark\" id=\"wb-cite-highlight\">Arrangements that are solely equity interests, or that fall within specific statutory exceptions, may sit outside the core TOFA recognition rules even where cash flows appear financing-like.</mark> Where an exception is relied on, documentation should explain why the cash-flow profile alone is not decisive.</p>",
      after:
        "<p>Classification should test both inclusion criteria and relevant exceptions before a conclusion is locked.</p>" +
        "<p>If facts later change—for example through amendment of terms—the exception analysis should be refreshed.</p>" +
        "<p>Residual uncertainty can be tracked as an open item with an owner and review date.</p>" +
        "<p>Prototype excerpt only.</p>",
    },
    8: {
      id: 8,
      source: "PwC public tax guidance",
      title: "TOFA elections and treasury process design",
      domain: "pwc.com.au",
      summary: "Election monitoring linked to treasury operating models",
      before:
        "<p>Public guidance on TOFA elections often links tax method choices to how treasury books and monitors instruments day to day.</p>" +
        "<p>Design notes typically call out which team owns the election register and how amendments are approved when deal terms change.</p>",
      evidence:
        "<p>Where hedging or fair-value elections are considered, commentary stresses early alignment between accounting policy and tax elections. <mark class=\"wb-cite-mark\" id=\"wb-cite-highlight\">Election monitoring is most effective when treasury deal capture, accounting policy and tax ownership are aligned before the arrangement is executed.</mark></p>" +
        "<p><mark class=\"wb-cite-mark\">Without that alignment, teams often discover method conflicts only at period end.</mark> A lightweight RACI for election changes reduces rework when instruments are amended or rolled.</p>",
      after:
        "<p>Implementation plans also record the system fields needed to evidence the election each reporting period.</p>" +
        "<p>Demo materials should make clear that election choice is both a tax and an operating-model decision.</p>" +
        "<p>Prototype guidance summary only — not PwC client advice.</p>",
    },
  };

  function sourceOccMark(index, html) {
    return (
      '<p data-source-occ-block="' +
      index +
      '"><mark class="wb-cite-mark wb-source-panel__mark" data-source-occ="' +
      index +
      '">' +
      html +
      "</mark></p>"
    );
  }

  function buildTofaConsiderationsDocument() {
    return {
      id: 3,
      title: "TOFA Considerations",
      paperTitle: "TOFA Considerations for Cross-Currency Financing Arrangements",
      metadata: "PDF · 34 pages",
      estimatedPages: 34,
      sections: [
        {
          id: "s1",
          heading: "1. Executive Summary",
          page: 2,
          paragraphs: [
            "This paper records a working classification and implementation view for Horizon Group’s proposed cross-currency financing arrangements. The facilities are expected to have a headline principal of AUD 85 million and a proposed commencement date of 1 July 2026, subject to final term sheets, counterparty approval and treasury system readiness.",
            "On the facts currently available, the arrangements appear capable of being financial arrangements under Division 230 of the Income Tax Assessment Act 1997. The most material sensitivities are election status, the appropriate tax timing method, and the measurement of foreign-exchange movements where contract currency and functional currency differ.",
            "The paper is a prototype advisory note for the Write playground. It is not tax advice, legal advice, or a PwC client deliverable. Conclusions should be revisited once commercial terms, elections and data feeds are confirmed.",
          ],
        },
        {
          id: "s2",
          heading: "2. Scope and Background",
          page: 4,
          paragraphs: [
            "Horizon Group is assumed to be an Australian-resident company or tax consolidated group preparing Australian-dollar financial statements. The group is considering a package of cross-currency financing arrangements that combine funding, risk-management and return-enhancement objectives.",
            "Scope is limited to the Division 230 classification question, the choice of timing method, foreign-exchange interactions, and the operational work needed to implement any resulting tax treatment before 1 July 2026. Other regimes—including withholding, thin capitalisation and anti-avoidance—are flagged only where they may interact with the TOFA conclusion.",
            "The review relies on public TOFA themes, draft commercial assumptions supplied in the prompt, and the group’s existing treasury operating model. Missing term-sheet fields, rate history and election registers are treated as open items rather than assumed away.",
            "This paper is written for Tax, Finance and Treasury readers who need a shared working view rather than a final opinion. It is intended to be attached to the classification file and updated as commercial terms lock. Where a later memo supersedes a conclusion in this draft, the superseded paragraph should be marked rather than deleted, so the audit trail remains readable.",
            "The proposed 1 July 2026 commencement is treated as a design constraint. If the facilities are booked earlier, or if a staggered drawdown is used, the same analytical structure still applies but the data cut-off dates in sections 9 and 10 will need to move.",
          ],
        },
        {
          id: "s3",
          heading: "3. Arrangement Overview",
          page: 6,
          paragraphs: [
            "The contemplated facilities are expected to create contractual rights to receive, and obligations to provide, cash or cash-equivalent amounts over time. Principal is currently modelled at AUD 85 million, with one or more legs denominated in a foreign currency.",
            "Cash-flow profiles may include periodic coupons, reset dates, optional early termination and settlement in a currency other than the group’s functional currency. Exact counterparties, tenors and optionality remain to be confirmed.",
            "Treasury’s working assumption is that the arrangements will be captured in the financial-arrangement register from the proposed go-live date and mapped to tax lots used for period-end review. That assumption should be tested against current ERP and deal-capture capability.",
            "A working description is enough for a prototype classification, but it is not enough for a signed memo. The file should later record each facility identifier, the currency of each cash flow, the day-count convention, and whether any option can convert a cash settlement into delivery of a non-financial asset. Those fields determine both the Division 230 tests and the extracts required from the treasury system.",
            "If Horizon Group ultimately books the AUD 85 million as a programme rather than a single trade, each draw should still inherit the same classification logic unless a later term sheet changes the rights and obligations. Programme-level elections should be checked so that a later draw does not silently fall outside an earlier election.",
          ],
        },
        {
          id: "s4",
          heading: "4. Division 230 Applicability",
          page: 8,
          paragraphs: [
            "Division 230 applies to gains and losses from financial arrangements, subject to population tests, elections and statutory exceptions. The first question is whether Horizon Group is inside the TOFA population or otherwise elects into the regime.",
            sourceOccMark(
              0,
              "The cross-currency financing arrangements are expected to fall within the scope of Division 230, subject to confirmation of the relevant rights and obligations and the absence of applicable exclusions. Whether an arrangement is a financial arrangement depends on the rights and obligations to receive or provide a financial benefit, and on the taxpayer’s circumstances. A provisional inclusion conclusion is appropriate on the current facts, but it should not be locked until exclusions are screened and the cash-settlable character of each leg is documented."
            ),
            "The remainder of this section records the tests that should appear in the classification memo. Those tests are written so that a later reviewer can see which facts were available on the date of this draft and which were still open.",
            "A population or election-in conclusion should be evidenced from the group’s latest income-year position, not inferred from the existence of treasury activity. If Horizon Group is outside the statutory population and does not elect in, the remainder of this paper becomes a contingency analysis rather than an operating design.",
          ],
        },
        {
          id: "s4-1",
          heading: "4.1 Financial arrangement definition",
          page: 9,
          paragraphs: [
            sourceOccMark(
              1,
              "A financial arrangement generally involves a right to receive, or an obligation to provide, a financial benefit that is cash or a cash equivalent in substance. Horizon Group’s proposed facilities appear to satisfy that definition because the commercial bargain is the exchange of cash over time rather than the delivery of a non-financial asset. Related rights and obligations should be tested together where they are priced or managed as a single package."
            ),
            "Where a facility is bundled with an embedded option or a separately documented hedge, the classification paper should state whether the components are one arrangement or more than one. That choice affects both timing and the data fields required in the register.",
          ],
        },
        {
          id: "s4-2",
          heading: "4.2 Rights and obligations",
          page: 10,
          paragraphs: [
            sourceOccMark(
              3,
              "Classification should test whether a financial benefit is to be received or provided, whether that benefit is cash or cash-equivalent in substance, and whether any exception applies. For Horizon Group, the rights and obligations attached to the AUD 85 million facilities are expected to be cash-settlable. The memo should identify each material right, the person obliged to perform, and the circumstances in which performance can be accelerated, netted or terminated."
            ),
            "Incomplete counterparties or missing optionalities are not fatal to a working view, but they should be listed as information gaps with an owner and a date.",
          ],
        },
        {
          id: "s4-3",
          heading: "4.3 Cash-settlable features",
          page: 11,
          paragraphs: [
            "Cash-settlable features include payment schedules, close-out amounts, and the ability to settle a foreign-currency obligation by delivering Australian-dollar cash of equivalent value. Those features support a financial-arrangement conclusion even where the instrument has a commercial funding purpose.",
            "If a leg can be settled only by delivery of a specific non-cash asset, that fact should be recorded and the exception analysis updated. No such feature is currently described in the draft terms.",
          ],
        },
        {
          id: "s4-4",
          heading: "4.4 Relevant exclusions",
          page: 12,
          paragraphs: [
            "Arrangements that are solely equity interests, or that fall within specific statutory exceptions, may sit outside the core TOFA recognition rules even where cash flows appear financing-like. The current draft does not indicate an equity-only outcome for the Horizon Group facilities.",
            "Exclusion screening should still be completed before the classification paper is issued. Residual uncertainty should be disclosed rather than omitted.",
          ],
        },
        {
          id: "s5",
          heading: "5. Tax Timing Methods",
          page: 13,
          paragraphs: [
            "Timing under TOFA may follow compounding accruals, realisation, or an elected method such as fair value. The choice should be documented against certainty of overall gain or loss, election status, and the quality of source data.",
            "For Horizon Group, the method decision is not only a tax-technical choice. It determines which treasury extracts must be production-ready by 1 July 2026, how often Tax will need valuation support, and how large the first-year true-up is likely to be if estimates later move.",
          ],
        },
        {
          id: "s5-1",
          heading: "5.1 Accruals method",
          page: 13,
          paragraphs: [
            sourceOccMark(
              4,
              "Teams are encouraged to test whether overall gains or losses can be estimated with sufficient certainty before selecting an accruals path. Where estimates are unstable, a more realisation-oriented approach may reduce later true-up complexity. For the Horizon Group facilities, compounding accruals may be relevant if TOFA applies and no fair-value or other elected method governs the position. That conclusion depends on whether sufficiently certain overall gains or losses can be estimated from the 1 July 2026 cash-flow schedule."
            ),
            "Accruals workpapers should show the method chosen, the certainty assessment, and the data fields required each period. True-up mechanics should be agreed with finance before go-live.",
          ],
        },
        {
          id: "s5-2",
          heading: "5.2 Realisation method",
          page: 14,
          paragraphs: [
            "If certainty thresholds are not met, realisation concepts may be more appropriate. Realisation is typically closer to settlement events and can reduce estimate volatility, at the cost of a weaker match to commercial accruals.",
            "A realisation path still requires complete settlement data and a clear mapping from treasury events to tax lots.",
          ],
        },
        {
          id: "s5-3",
          heading: "5.3 Fair value method",
          page: 15,
          paragraphs: [
            "A fair-value election, where available and made, can change both the amount and the income years in which gains and losses are recognised. Horizon Group should confirm whether any fair-value election is already in force before modelling the AUD 85 million facilities.",
            "Fair-value operation depends on reliable valuation feeds. Those feeds are currently an open item.",
          ],
        },
        {
          id: "s5-4",
          heading: "5.4 Foreign exchange retranslation",
          page: 15,
          paragraphs: [
            "Where contract currency and functional currency differ, FX movements may affect the amount and timing of recognised gains or losses, depending on the method and elections applied. Retranslation should be specified in the classification paper rather than inferred from accounting policy alone.",
          ],
        },
        {
          id: "s6",
          heading: "6. Elections",
          page: 16,
          paragraphs: [
            sourceOccMark(
              2,
              "Where TOFA applies, elections can materially affect timing. Common considerations include fair value, foreign exchange retranslation, hedging, and reliance on financial reports. Election status should be validated before classification is finalised. For Horizon Group, the election register should be reviewed against the proposed 1 July 2026 commencement so that any gap is visible before the facilities are booked."
            ),
          ],
        },
        {
          id: "s6-1",
          heading: "6.1 Reliance on financial reports",
          page: 17,
          paragraphs: [
            "Reliance on financial reports, where available, can reduce the distance between accounting balances and tax lots. The election is only useful if the underlying reports can be reconciled to the financial-arrangement register on a timely basis.",
          ],
        },
        {
          id: "s6-2",
          heading: "6.2 Fair value election",
          page: 17,
          paragraphs: [
            "A fair-value election should not be assumed merely because the instruments will be marked to market for accounting. The tax election, its date, and its coverage of the proposed facilities must be evidenced.",
          ],
        },
        {
          id: "s6-3",
          heading: "6.3 Hedging election",
          page: 18,
          paragraphs: [
            "If Horizon Group intends to treat any foreign-currency leg as a hedge for tax purposes, the hedging election and designation records should be assembled before 1 July 2026. Missing designations are a recurring cause of later true-up work.",
          ],
        },
        {
          id: "s7",
          heading: "7. Foreign Exchange Considerations",
          page: 19,
          paragraphs: [
            "Cross-currency financing creates measurement questions even after the TOFA inclusion conclusion is reached. The paper separates principal recognition from FX translation so that source-system design can follow the tax method.",
            "The AUD 85 million headline principal is an Australian-dollar equivalent used for planning. If a material portion of the cash flows is denominated in another currency, period-end translation can change both the recognised gain or loss and the evidence Tax needs from the rate hierarchy. That is why FX is treated as a first-class design topic rather than a year-end adjustment.",
          ],
        },
        {
          id: "s7-1",
          heading: "7.1 Currency movements",
          page: 19,
          paragraphs: [
            "Where functional currency and contract currency differ, FX movements may create separate or integrated tax outcomes depending on elections and the character of the arrangement. Horizon Group should identify the contract currency of each leg and the rate source that will be used at period end.",
          ],
        },
        {
          id: "s7-2",
          heading: "7.2 Translation gains and losses",
          page: 20,
          paragraphs: [
            "Translation gains and losses should be mapped to the same tax lots as the underlying principal. Incomplete rate history should be flagged as an open item with a revalidation date.",
          ],
        },
        {
          id: "s7-3",
          heading: "7.3 Hedging interaction",
          page: 20,
          paragraphs: [
            "Hedge accounting and tax hedging are not automatically aligned. If a designated hedge exists for accounting, the tax paper should state whether the same relationship is relied on for TOFA and what evidence supports that view.",
          ],
        },
        {
          id: "s8",
          heading: "8. Accounting Interaction",
          page: 21,
          paragraphs: [
            "Accounting classification, measurement and hedge accounting influence the data Horizon Group already holds. They do not, by themselves, determine the TOFA conclusion.",
          ],
        },
        {
          id: "s8-1",
          heading: "8.1 Classification",
          page: 21,
          paragraphs: [
            "Accounting classification of the facilities as financial liabilities or derivatives is a useful input to the tax memo. Differences should be explained rather than forced into alignment.",
          ],
        },
        {
          id: "s8-2",
          heading: "8.2 Measurement",
          page: 22,
          paragraphs: [
            "Amortised-cost or fair-value measurement in the accounts can supply effective-interest inputs for an accruals calculation. Those inputs still need a tax overlay for elections, exceptions and FX method.",
          ],
        },
        {
          id: "s8-3",
          heading: "8.3 Hedge accounting",
          page: 22,
          paragraphs: [
            "If hedge accounting is applied, documentation already prepared for auditors can often be reused for tax—provided the tax election position is separately confirmed.",
          ],
        },
        {
          id: "s9",
          heading: "9. Treasury and Operational Data",
          page: 23,
          paragraphs: [
            "Implementation typically requires deal terms, payment schedules, effective-interest inputs, FX rates and counterparty identifiers. Gaps in source data are a common cause of TOFA process failure.",
          ],
        },
        {
          id: "s9-1",
          heading: "9.1 Financial arrangement register",
          page: 23,
          paragraphs: [
            "The register should uniquely identify each arrangement, its TOFA conclusion, the method applied, and the owner of the classification memo. Horizon Group should confirm whether the current register can hold an AUD 85 million cross-currency package as one or several lots.",
          ],
        },
        {
          id: "s9-2",
          heading: "9.2 Valuation data",
          page: 24,
          paragraphs: [
            "Valuation data are required if a fair-value or retranslation path is used. Rate sources, reset dates and hierarchy of fallback rates should be written down before go-live.",
          ],
        },
        {
          id: "s9-3",
          heading: "9.3 Settlement data",
          page: 24,
          paragraphs: [
            "Settlement files must distinguish principal, coupon and FX components. Without that split, period-end reconciliations will not support either accruals or realisation.",
          ],
        },
        {
          id: "s10",
          heading: "10. Implementation Requirements",
          page: 25,
          paragraphs: [
            "Where TOFA applies, organisations typically need clear ownership of classification memos, election monitoring, and reconciliations between accounting balances and tax lots. Horizon Group should treat 1 July 2026 as a hard design date rather than a reporting-only date.",
            "A practical implementation plan usually has four workstreams: systems, data, controls and governance. Each workstream should have an owner, a May 2026 checkpoint, and a written fail-forward path if a feed is not ready. The cost of a temporary spreadsheet is acceptable only if the control owner, the reconciling items and the retirement date are written down.",
          ],
        },
        {
          id: "s10-1",
          heading: "10.1 Systems",
          page: 25,
          paragraphs: [
            sourceOccMark(
              5,
              "Confirm whether existing treasury and ERP feeds can support accruals calculations. Define hand-offs between front office, finance and tax. Establish period-end reconciliation between accounting and tax balances. For Horizon Group, systems should capture principal and FX components consistently so that the chosen TOFA method can be operated each period without a manual spreadsheet rebuild."
            ),
          ],
        },
        {
          id: "s10-2",
          heading: "10.2 Data",
          page: 26,
          paragraphs: [
            "Data requirements include deal terms, payment schedules, effective-interest inputs, FX rates and counterparty identifiers. Open fields should be assigned to treasury or finance with a due date before May 2026.",
          ],
        },
        {
          id: "s10-3",
          heading: "10.3 Controls",
          page: 26,
          paragraphs: [
            "A practical control set often includes a classification checklist, election register, data mapping from treasury systems, and documented review of tax-return disclosures.",
          ],
        },
        {
          id: "s10-4",
          heading: "10.4 Governance",
          page: 27,
          paragraphs: [
            sourceOccMark(
              6,
              "Implementation should include a coordinated review of data sources, tax calculations, system configuration and governance controls. Clear ownership should be established across Tax, Finance and Technology teams, with validation completed before the proposed go-live date. Material transactions should follow a documented classification checklist before booking. Horizon Group should agree reviewers for classification changes, model updates and return disclosure labels."
            ),
          ],
        },
        {
          id: "s11",
          heading: "11. Assumptions and Information Gaps",
          page: 28,
          paragraphs: [
            "Key assumptions: the taxpayer is within the TOFA population or elects in where available; financial statements are prepared under Australian Accounting Standards; amounts, counterparties and dates in the prompt are placeholders pending confirmation.",
            "Material gaps: final term sheets, election register extracts, FX rate history, and evidence that treasury feeds can support the selected timing method by 1 July 2026.",
          ],
        },
        {
          id: "s12",
          heading: "12. Key Risks",
          page: 29,
          paragraphs: [
            "Fact uncertainty may change the TOFA conclusion. Outdated or undocumented elections can reverse expected timing. Manual workarounds increase error and review risk. Mixed-currency cash flows can create unexpected volatility. Other tax regimes may still apply alongside TOFA.",
            "Each risk should have an owner and a decision date. Unowned risks tend to reappear at return time.",
          ],
        },
        {
          id: "s13",
          heading: "13. Recommended Actions",
          page: 30,
          paragraphs: [
            sourceOccMark(
              7,
              "Confirm the final deal terms, counterparties, currencies and timeline. Validate TOFA population status and current elections. Prepare a classification paper with alternative outcomes and sensitivities. Map data and systems requirements with finance and treasury by 15 May 2026. Agree governance, review points and documentation standards before go-live. These actions should be completed before Horizon Group relies on a TOFA outcome for the AUD 85 million facilities."
            ),
          ],
        },
        {
          id: "s14",
          heading: "14. Appendix A — Arrangement Details",
          page: 31,
          paragraphs: [
            "Working draft: Horizon Group cross-currency financing arrangements; headline principal AUD 85 million; proposed commencement 1 July 2026; functional currency Australian dollars; one or more foreign-currency legs. Counterparties, coupons, optionality and security remain to be confirmed.",
            "Fields still required before the classification paper can be issued: facility identifiers; drawdown calendar; coupon formula; reset dates; early-termination mechanics; netting rights; governing law; and whether any security interest changes the cash-settlable analysis. Until those fields are complete, quantitative illustrations in this paper remain planning figures only.",
          ],
        },
        {
          id: "s15",
          heading: "15. Appendix B — Relevant Elections",
          page: 32,
          paragraphs: [
            "Checklist for file: population / election-in status; fair value; foreign-exchange retranslation; hedging; reliance on financial reports. Record the date each election was made, the instruments covered, and the person responsible for monitoring changes.",
          ],
        },
        {
          id: "s16",
          heading: "16. Appendix C — Source References",
          page: 33,
          paragraphs: [
            "This paper draws on public TOFA themes, Division 230 concepts, and prototype implementation guidance used in the Write playground. It is not an official ATO extract or a substitute for advice on Horizon Group’s particular facts.",
            "Readers should treat every quantitative figure in this draft as a placeholder until the commercial terms are locked.",
          ],
        },
      ],
    };
  }

  const SOURCE_DOCUMENTS = (function () {
    const docs = {};
    docs[3] = buildTofaConsiderationsDocument();
    Object.keys(REFERENCE_SOURCES).forEach(function (key) {
      const id = Number(key);
      if (docs[id]) return;
      const src = REFERENCE_SOURCES[id];
      docs[id] = {
        id: id,
        title: src.title,
        paperTitle: src.title,
        metadata: "PDF · 12 pages",
        estimatedPages: 12,
        sections: [
          {
            id: "overview",
            heading: "Overview",
            page: 1,
            paragraphs: [src.before, src.evidence, src.after].filter(Boolean),
          },
        ],
      };
    });
    return docs;
  })();

  const SOURCE_OCCURRENCE_META = {
    3: [
      {
        page: 8,
        sourceSection: "4. Division 230 Applicability",
        sourceSectionId: "s4",
        sourceOcc: 0,
        section: "Executive Summary",
        excerpt:
          "This draft outlines a structured approach to assessing whether the proposed arrangement is likely to fall within Australia’s TOFA framework under Division 230, and the practical steps needed to implement any resulting tax treatment.",
        sourceExcerpt:
          "The cross-currency financing arrangements are expected to fall within the scope of Division 230, subject to confirmation of the relevant rights and obligations and the absence of applicable exclusions.",
      },
      {
        page: 9,
        sourceSection: "4.1 Financial arrangement definition",
        sourceSectionId: "s4-1",
        sourceOcc: 1,
        section: "TOFA Framework",
        excerpt:
          "Division 230 provides a framework for recognising gains and losses from financial arrangements. A detailed review of the relevant elections, data requirements and system configuration should be completed before implementation.",
        sourceExcerpt:
          "A financial arrangement generally involves a right to receive, or an obligation to provide, a financial benefit that is cash or a cash equivalent in substance.",
      },
      {
        page: 16,
        sourceSection: "6. Elections",
        sourceSectionId: "s6",
        sourceOcc: 2,
        section: "Relevant Elections",
        excerpt:
          "Where TOFA applies, elections can materially affect timing. Common considerations include fair value, foreign exchange retranslation, hedging, and reliance on financial reports.",
        sourceExcerpt:
          "Where TOFA applies, elections can materially affect timing. Common considerations include fair value, foreign exchange retranslation, hedging, and reliance on financial reports.",
      },
      {
        page: 10,
        sourceSection: "4.2 Rights and obligations",
        sourceSectionId: "s4-2",
        sourceOcc: 3,
        section: "Classification Assessment",
        excerpt:
          "The group should complete a detailed review of the proposed transaction, including the relevant financial arrangements, elections and tax timing methods. Additional data should also be obtained before the implementation approach is finalised.",
        sourceExcerpt:
          "Classification should test whether a financial benefit is to be received or provided, whether that benefit is cash or cash-equivalent in substance, and whether any exception applies.",
      },
      {
        page: 13,
        sourceSection: "5.1 Accruals method",
        sourceSectionId: "s5-1",
        sourceOcc: 4,
        section: "Tax Timing Methods",
        excerpt:
          "If TOFA applies and no fair-value or other elected method governs the position, compounding accruals may be relevant where sufficiently certain overall gains or losses can be estimated. Otherwise, realisation concepts may drive timing, and FX measurement should be considered alongside the chosen method.",
        sourceExcerpt:
          "Teams are encouraged to test whether overall gains or losses can be estimated with sufficient certainty before selecting an accruals path.",
      },
      {
        page: 25,
        sourceSection: "10.1 Systems",
        sourceSectionId: "s10-1",
        sourceOcc: 5,
        section: "Systems and Processes",
        excerpt:
          "Confirm whether existing treasury and ERP feeds can support accruals calculations, and establish period-end reconciliation between accounting and tax balances.",
        sourceExcerpt:
          "Confirm whether existing treasury and ERP feeds can support accruals calculations. Define hand-offs between front office, finance and tax.",
      },
      {
        page: 27,
        sourceSection: "10.4 Governance",
        sourceSectionId: "s10-4",
        sourceOcc: 6,
        section: "Governance and Controls",
        excerpt:
          "Implementation should include a coordinated review of data sources, tax calculations, system configuration and governance controls, with clear ownership across Tax, Finance and Technology.",
        sourceExcerpt:
          "Implementation should include a coordinated review of data sources, tax calculations, system configuration and governance controls.",
      },
      {
        page: 30,
        sourceSection: "13. Recommended Actions",
        sourceSectionId: "s13",
        sourceOcc: 7,
        section: "Recommended Next Steps",
        excerpt:
          "Agree governance, review points, and documentation standards before go-live. These actions should be completed before Horizon Group relies on a TOFA outcome for the facilities.",
        sourceExcerpt:
          "Agree governance, review points and documentation standards before go-live. These actions should be completed before Horizon Group relies on a TOFA outcome for the AUD 85 million facilities.",
      },
    ],
  };

  const WORKING_BY_PROGRESS = [
    { until: 0.08, label: "Understand request", todo: 0 },
    { until: 0.18, label: "Review selected context", todo: 1 },
    { until: 0.28, label: "Check Division 230 considerations", todo: 2 },
    { until: 0.38, label: "Identify assumptions and information gaps", todo: 3 },
    { until: 0.48, label: "Plan report structure", todo: 4 },
    { until: 0.72, label: "Draft report", todo: 5 },
    { until: 0.88, label: "Validate evidence and references", todo: 6 },
    { until: 1.01, label: "Finalise recommendations", todo: 7 },
  ];

  const AGENT_TODO_PLAN = [
    "Understand request",
    "Review selected context",
    "Check Division 230 considerations",
    "Identify assumptions and information gaps",
    "Plan report structure",
    "Draft report",
    "Validate evidence and references",
    "Finalise recommendations",
  ];

  const agentPlanState = {
    activeIndex: 0,
    floorIndex: 0,
  };

  function resetAgentPlanState() {
    agentPlanState.activeIndex = 0;
    agentPlanState.floorIndex = 0;
  }

  const ANALYSIS_PHASE_STEPS = [
    { label: "Understand request", todo: 0 },
    { label: "Review Financial arrangements register", todo: 1 },
    { label: "Check Division 230 considerations", todo: 2 },
    { label: "Identify assumptions and information gaps", todo: 3 },
    { label: "Plan report structure", todo: 4 },
  ];

  const REPORT_BLOCKS = [
    {
      delay: 500,
      html:
        "<h1>TOFA Classification and Implementation Advisory Report</h1>" +
        '<p class="wb-doc-disclaimer">Demo portfolio content only — not tax advice, legal advice, or a PwC client deliverable.</p>',
    },
    {
      delay: 420,
      html:
        '<h2 id="wb-section-exec">Executive Summary</h2>' +
        "<p data-trace-slot=\"trace-exec\">This draft outlines a structured approach to assessing whether the proposed arrangement is likely to fall within Australia’s Taxation of Financial Arrangements (TOFA) framework under Division 230 of the <em>Income Tax Assessment Act 1997</em>" +
        cites([2, 3]) +
        ", and the practical steps needed to implement any resulting tax treatment.</p>",
    },
    {
      delay: 380,
      html:
        "<p data-rev-slot=\"rev-alex-tofa\">On the facts provided, the arrangement may require assessment under the TOFA framework" +
        cite(1) +
        ". Material open points remain around elections, timing methods, foreign exchange exposure, and systems readiness. The sections below summarise the key considerations, risks, and recommended next steps for review with tax and finance stakeholders.</p>",
    },
    {
      delay: 560,
      html:
        "<h2>1. Background Facts and Assumptions</h2>" +
        "<h3>1.1 Entity Background</h3>" +
        "<p data-rev-slot=\"rev-alex-entity\" data-trace-slot=\"trace-tone-2\">The draft assumes an Australian-resident company or tax consolidated group entering a financing or treasury arrangement with both domestic and cross-border features. Final advice should confirm residency, grouping, accounting framework and the commercial purpose of the arrangement before classification is locked.</p>",
    },
    {
      delay: 340,
      html:
        "<h3>1.2 Description of Arrangement</h3>" +
        "<p data-rev-slot=\"rev-daniel-date\" data-trace-slot=\"trace-tone-1\">The arrangement is expected to involve contractual rights and obligations to receive or provide cash or a cash equivalent over time. The commercial objective appears to include funding, risk management, or return enhancement. The transaction is expected to complete by 30 June 2026. Exact instrument terms, counterparties, and cash-flow profiles remain to be confirmed.</p>" +
        "<p data-collab-slot=\"priya-demo\" data-rev-slot=\"rev-collab-priya\">The transaction is expected to complete in June, subject to final approval.</p>",
    },
    {
      delay: 360,
      html:
        "<h3>1.3 Key Assumptions</h3>" +
        "<ul>" +
        "<li>The taxpayer is within the TOFA population, or otherwise elects into TOFA where available" +
        cite(1) +
        ".</li>" +
        "<li>No specific anti-avoidance conclusion is reached in this draft.</li>" +
        "<li>Financial statements are prepared under Australian Accounting Standards unless stated otherwise.</li>" +
        "<li>Amounts, counterparties, and dates in the user prompt are placeholders pending confirmation.</li>" +
        "</ul>",
    },
    {
      delay: 600,
      html:
        "<h2>2. TOFA Framework</h2>" +
        "<h3>2.1 Overview of Division 230</h3>" +
        "<p data-rev-slot=\"rev-priya-framework\">Division 230 provides a framework for recognising gains and losses from financial arrangements. A detailed review of the relevant elections, data requirements and system configuration should be completed before implementation" +
        cites([2, 3]) +
        ". It is intended to improve alignment between tax and commercial recognition of financial outcomes.</p>",
    },
    {
      delay: 380,
      html:
        "<h3>2.2 Scope and Application</h3>" +
        "<p>Whether TOFA applies depends on the nature of the rights and obligations, the taxpayer’s circumstances, and any applicable carve-outs. Arrangements that are solely equity interests, or that fall within specific exceptions, may sit outside the core TOFA rules" +
        cite(7) +
        ".</p>",
    },
    {
      delay: 360,
      html:
        "<h3>2.3 Relevant Elections</h3>" +
        "<p>Where TOFA applies, elections can materially affect timing. Common considerations include fair value, foreign exchange retranslation, hedging, and reliance on financial reports. Election status should be validated before classification is finalised" +
        cites([3, 8]) +
        ".</p>",
    },
    {
      delay: 580,
      html:
        "<h2>3. Classification Assessment</h2>" +
        "<h3>3.1 Financial Arrangements</h3>" +
        "<p data-rev-slot=\"rev-priya-multi\">The group should complete a detailed review of the proposed transaction, including the relevant financial arrangements, elections and tax timing methods. Additional data should also be obtained before the implementation approach is finalised" +
        cites([2, 3, 7]) +
        ". Classification should test: (1) whether a financial benefit is to be received or provided; (2) whether that benefit is cash or cash-equivalent in substance; and (3) whether exceptions apply.</p>",
    },
    {
      delay: 400,
      html:
        "<h3>3.2 Relevant Tax Timing Methods</h3>" +
        "<p>If TOFA applies and no fair-value or other elected method governs the position, compounding accruals may be relevant where sufficiently certain overall gains or losses can be estimated" +
        cites([3, 4, 5]) +
        ". Otherwise, realisation concepts may drive timing, and FX measurement should be considered alongside the chosen method.</p>",
    },
    {
      delay: 400,
      html:
        "<h3>3.3 Foreign Exchange Considerations</h3>" +
        "<p>Where functional currency and contract currency differ, FX movements may create separate or integrated tax outcomes depending on elections and the character of the arrangement" +
        cite(5) +
        ". Systems must capture both principal and FX components consistently.</p>",
    },
    {
      delay: 560,
      html:
        "<h2>4. Key Tax Implications</h2>" +
        "<h3>4.1 Recognition and Timing</h3>" +
        "<p>Tax recognition may diverge from commercial settlement dates. Accruals methods can front-load or smooth gains and losses relative to cash" +
        cite(4) +
        ". Stakeholders should model P&amp;L and tax payable impacts across the expected life of the arrangement.</p>",
    },
    {
      delay: 360,
      html:
        "<h3>4.2 Gains and Losses</h3>" +
        "<p data-rev-slot=\"rev-daniel-gains\">TOFA generally treats relevant gains and losses on revenue account, subject to specific interactions with other provisions. Characterisation for other regimes (for example, withholding or thin capitalisation overlays) should be reviewed separately before filing positions are locked.</p>",
    },
    {
      delay: 420,
      html:
        "<h3>4.3 Compliance Considerations</h3>" +
        "<table>" +
        "<thead><tr><th>Area</th><th>Draft observation</th><th>Owner</th></tr></thead>" +
        "<tbody>" +
        "<tr><td>Classification memo</td><td>Document TOFA / non-TOFA conclusion and elections relied on" +
        cite(6) +
        "</td><td>Tax</td></tr>" +
        "<tr><td>Data mapping</td><td>Align cash flows, FX, and accounting balances to tax lots</td><td>Finance / Tax</td></tr>" +
        "<tr><td>Return disclosures</td><td>Confirm labels, workpapers, and review controls</td><td>Tax compliance</td></tr>" +
        "</tbody></table>",
    },
    {
      delay: 600,
      id: "wb-section-impl",
      html:
        "<h2 id=\"wb-section-impl\">5. Implementation Considerations</h2>" +
        "<h3>5.1 Data Requirements</h3>" +
        "<p data-trace-slot=\"trace-impl\">Implementation typically requires deal terms, payment schedules, effective interest inputs, FX rates, and counterparty identifiers. Gaps in source data are a common cause of TOFA process failure" +
        cite(6) +
        ".</p>" +
        "<p data-collab-slot=\"alex-demo\" data-rev-slot=\"rev-collab-alex\">Implementation requirements should be reviewed and confirmed across Tax, Finance and Technology before the proposed implementation date.</p>",
    },
    {
      delay: 360,
      html:
        "<h3>5.2 Systems and Processes</h3>" +
        "<ul>" +
        "<li>Confirm whether existing treasury / ERP feeds can support accruals calculations.</li>" +
        "<li>Define hand-offs between front office, finance, and tax.</li>" +
        "<li>Establish period-end reconciliation between accounting and tax balances" +
        cite(3) +
        ".</li>" +
        "</ul>",
    },
    {
      delay: 340,
      html:
        "<h3>5.3 Governance and Controls</h3>" +
        "<p data-rev-slot=\"rev-alex-impl\">Implementation should include a coordinated review of data sources, tax calculations, system configuration and governance controls. Clear ownership should be established across Tax, Finance and Technology teams, with validation completed before the proposed go-live date. Material transactions should follow a documented classification checklist before booking" +
        cites([3, 6]) +
        ".</p>",
    },
    {
      delay: 520,
      id: "wb-section-risks",
      html:
        "<h2 id=\"wb-section-risks\">6. Risks and Open Items</h2>" +
        "<ul>" +
        "<li><strong>Fact uncertainty:</strong> incomplete commercial terms may change the TOFA conclusion.</li>" +
        "<li><strong>Election integrity:</strong> outdated or undocumented elections can reverse expected timing.</li>" +
        "<li><strong>Systems gap:</strong> manual workarounds increase error and review risk.</li>" +
        "<li><strong>FX complexity:</strong> mixed-currency cash flows can create unexpected volatility" +
        cite(5) +
        ".</li>" +
        "<li><strong>Interaction risk:</strong> other tax regimes may still apply alongside TOFA.</li>" +
        "</ul>",
    },
    {
      delay: 480,
      html:
        "<h2>7. Recommended Next Steps</h2>" +
        "<ol>" +
        "<li>Confirm the final deal terms, counterparties, currencies, and timeline.</li>" +
        "<li>Validate TOFA population status and current elections" +
        cite(1) +
        ".</li>" +
        "<li>Prepare a classification paper with alternative outcomes and sensitivities.</li>" +
        "<li data-rev-slot=\"rev-long-next\">Map data and systems requirements with finance and treasury by 15 May 2026.</li>" +
        "<li>Agree governance, review points, and documentation standards before go-live" +
        cite(3) +
        ".</li>" +
        "</ol>",
    },
    {
      delay: 450,
      html:
        "<h2>Conclusion</h2>" +
        "<p>This draft provides a working structure for a TOFA classification and implementation discussion. It should be refined once the commercial terms and election position are confirmed. No conclusion in this document should be treated as final advice.</p>",
    },
  ];

  const STRENGTHENED_EXEC =
    "<p>This advisory draft assesses whether the proposed arrangement is likely to fall within Australia’s TOFA framework and what implementation actions follow from that classification.</p>" +
    "<p><strong>Preliminary view:</strong> on the facts currently available, the arrangement appears capable of being a financial arrangement under Division 230. The most material sensitivities are (1) election status, (2) the appropriate tax timing method, and (3) foreign exchange measurement.</p>" +
    "<p><strong>What this means for stakeholders:</strong> tax outcomes may be recognised earlier or more smoothly than cash settlement. Before the arrangement is executed, the business should confirm elections, validate data feeds, and document the classification rationale, open risks, and owners for next steps.</p>" +
    "<p>The remainder of this report expands the framework, classification tests, implications, implementation requirements, and recommended actions.</p>";

  const ASSISTANT_FINAL_HTML =
    "<p>I've drafted a TOFA Classification and Implementation Advisory Report based on the context you provided.</p>" +
    "<p>The draft covers:</p>" +
    "<ul>" +
    "<li>Background facts and assumptions</li>" +
    "<li>Relevant TOFA framework and scope</li>" +
    "<li>Classification considerations</li>" +
    "<li>Tax timing and foreign exchange implications</li>" +
    "<li>Implementation requirements</li>" +
    "<li>Key risks and open items</li>" +
    "<li>Recommended next steps</li>" +
    "</ul>" +
    "<p>You can edit the report directly, or ask me to revise a section.</p>";

  const sourcesList = document.getElementById("wb-sources-list");
  const citePopover = document.getElementById("wb-cite-popover");
  const citeSourceEl = document.getElementById("wb-cite-source");
  const citeTitleEl = document.getElementById("wb-cite-title");
  const citePageEl = document.getElementById("wb-cite-page");
  const citeBodyEl = document.getElementById("wb-cite-body");
  const citeCloseBtn = document.getElementById("wb-cite-close");
  const citeViewBtn = document.getElementById("wb-cite-view");
  const citeNav = document.getElementById("wb-cite-nav");
  const citePrevBtn = document.getElementById("wb-cite-prev");
  const citeNextBtn = document.getElementById("wb-cite-next");
  const citeCounter = document.getElementById("wb-cite-counter");
  const assistantEl = document.getElementById("wb-assistant");
  const assistantWriteEl = document.getElementById("wb-assistant-write");
  const sourcePanelEl = document.getElementById("wb-source-panel");
  const sourcePanelTitle = document.getElementById("wb-source-panel-title");
  const sourcePanelMeta = document.getElementById("wb-source-panel-meta");
  const sourcePanelViewer = document.getElementById("wb-source-panel-viewer");
  const sourcePanelCount = document.getElementById("wb-source-panel-count");
  const sourcePanelList = document.getElementById("wb-source-panel-list");
  const sourcePanelUsage = document.getElementById("wb-source-panel-usage");
  const sourceUsageToggle = document.getElementById("wb-source-usage-toggle");
  const sourcePanelPage = document.getElementById("wb-source-panel-page");
  const assistantSourcesBtn = document.getElementById("wb-assistant-sources");
  const shareBtn = document.getElementById("wb-share-btn");
  const sharePopover = document.getElementById("wb-share-popover");
  const sharePeople = document.getElementById("wb-share-people");
  const shareAddInput = document.getElementById("wb-share-add-input");
  const shareSuggestions = document.getElementById("wb-share-suggestions");
  const sharePending = document.getElementById("wb-share-pending");
  const sharePermMenu = document.getElementById("wb-share-perm-menu");
  const shareToast = document.getElementById("wb-share-toast");
  const shareCopyBtn = document.getElementById("wb-share-copy");
  const shareCloseBtn = document.getElementById("wb-share-close");
  const shareAccessBtn = document.getElementById("wb-share-access-btn");
  const shareAccessMenu = document.getElementById("wb-share-access-menu");
  const collabDemoBtn = document.getElementById("wb-collab-demo-btn");
  const collabDemoLive = document.getElementById("wb-collab-demo-live");
  const collabAvatars = document.getElementById("wb-collab-avatars");
  const collabOverflow = document.getElementById("wb-collab-overflow");
  const remoteCursor = document.getElementById("wb-remote-cursor");
  const remoteSelection = document.getElementById("wb-remote-selection");
  const remoteLayer = document.getElementById("wb-remote-layer");
  const reportFlow = document.getElementById("wb-report-flow");
  const followChip = document.getElementById("wb-follow-chip");
  const followLayer = document.getElementById("wb-report-follow-layer");
  const demoCameraViewport = document.getElementById("wb-demo-camera-viewport");
  const demoCameraStage = document.getElementById("wb-demo-camera-stage");
  const demoOverlayLayer = document.getElementById("wb-demo-overlay-layer");
  const presencePopover = document.getElementById("wb-presence-popover");
  const selectionToolbar = document.getElementById("wb-selection-toolbar");
  const askRightBtn = document.getElementById("wb-ask-right-btn");
  const addCommentBtn = document.getElementById("wb-add-comment-btn");
  const commentComposer = document.getElementById("wb-comment-composer");
  const commentThreadEl = document.getElementById("wb-comment-thread");
  const assistantSelectionContext = document.getElementById(
    "wb-assistant-selection-context"
  );
  const assistantSelectionQuote = document.getElementById(
    "wb-assistant-selection-quote"
  );
  const assistantSelectionClear = document.getElementById(
    "wb-assistant-selection-clear"
  );
  const assistantSelectionActions = document.getElementById(
    "wb-assistant-selection-actions"
  );
  const syncStatus = document.getElementById("wb-sync-status");

  const stageOverlayHome = {
    cite: citePopover && citePopover.parentElement,
    selection: selectionToolbar && selectionToolbar.parentElement,
    composer: commentComposer && commentComposer.parentElement,
    thread: commentThreadEl && commentThreadEl.parentElement,
  };

  const COLLAB_DIRECTORY = [
    {
      id: "alex",
      name: "Alex Morgan",
      initials: "AM",
      accent: "alex",
      defaultPermission: "edit",
    },
    {
      id: "priya",
      name: "Priya Shah",
      initials: "PS",
      accent: "priya",
      defaultPermission: "edit",
    },
    {
      id: "daniel",
      name: "Daniel Wong",
      initials: "DW",
      accent: "daniel",
      defaultPermission: "edit",
    },
    {
      id: "jordan",
      name: "Jordan Lee",
      initials: "JL",
      accent: "owner",
      defaultPermission: "edit",
    },
  ];

  const OWNER_PERSON = {
    id: "long",
    name: "Long",
    initials: "LG",
    accent: "owner",
  };

  function getPersonProfile(authorOrId) {
    if (!authorOrId) return OWNER_PERSON;
    if (authorOrId === "Long" || authorOrId === "long") return OWNER_PERSON;
    const byId = COLLAB_DIRECTORY.find(function (p) {
      return p.id === authorOrId;
    });
    if (byId) return byId;
    const byName = COLLAB_DIRECTORY.find(function (p) {
      return p.name === authorOrId;
    });
    return byName || OWNER_PERSON;
  }

  function personAvatarHtml(person, sizeClass) {
    const profile = typeof person === "string" ? getPersonProfile(person) : person;
    return (
      '<span class="wb-collab-avatar ' +
      (sizeClass || "wb-collab-avatar--sm") +
      " wb-collab-avatar--" +
      profile.accent +
      '" aria-hidden="true">' +
      escapeHtml(profile.initials) +
      "</span>"
    );
  }

  const ALEX_DEMO = {
    id: "alex",
    slot: "alex-demo",
    revSlot: "rev-collab-alex",
    firstName: "Alex",
    original:
      "Implementation requirements should be reviewed before completion.",
    revised:
      "Implementation requirements should be reviewed and confirmed across Tax, Finance and Technology before the proposed implementation date.",
    selectPhrase:
      "Implementation requirements should be reviewed before completion.",
    prefix: "",
    typingSpeed: 1.08,
    versionLabel: "Alex Morgan updated Implementation Considerations",
    highlightPhrase: "across Tax, Finance and Technology before the proposed implementation date",
  };
  const ALEX_OFFSCREEN_INDEX = 34;
  const ALEX_ARRIVAL_INDEX = 46;
  const PRIYA_OFFSCREEN_INDEX = 39;

  const PRIYA_DEMO = {
    id: "priya",
    slot: "priya-demo",
    revSlot: "rev-collab-priya",
    firstName: "Priya",
    original:
      "The transaction is expected to complete in June, subject to final approval.",
    revised:
      "The transaction is expected to complete by 30 June 2026, subject to final approval and confirmation that the required finance and technology implementation activities have been completed.",
    selectPhrase:
      "The transaction is expected to complete in June, subject to final approval.",
    prefix: "",
    typingSpeed: 1.12,
    versionLabel: "Priya Shah updated transaction timeline",
    highlightPhrase: "by 30 June 2026, subject to final approval and confirmation",
  };

  const collaboration = {
    peopleWithAccess: [
      {
        id: "long",
        name: "Long",
        initials: "LG",
        accent: "owner",
        permission: "owner",
        presence: "idle",
        active: false,
      },
    ],
    demoStatus: "idle",
    remoteCursor: null,
    activeEditorId: null,
    liveEditSlot: null,
    demoVersionLabels: [],
    timers: [],
    abort: false,
    generalAccess: "restricted",
    demoAutoFollow: true,
    programmaticScroll: false,
    focusTarget: null,
    focusPersonId: null,
    alexTypingIndex: 0,
    typingEpoch: 0,
    caretOwnerId: null,
    priyaTypingIndex: 0,
    followTravel: null,
    followTravelActive: false,
    typingJobs: {},
    followFrame: null,
    followChipFading: false,
    followChipFadePromise: null,
    deferFollowChip: false,
    followedPersonId: null,
  };
  let pendingShareAdd = null;
  let sharePermMenuContext = null;

  function collabDelay(ms) {
    return new Promise(function (resolve) {
      if (collaboration.abort) {
        resolve();
        return;
      }
      const entry = { id: null, resolve: resolve };
      entry.id = window.setTimeout(function () {
        collaboration.timers = collaboration.timers.filter(function (t) {
          return t !== entry;
        });
        resolve();
      }, prefersReducedMotion ? Math.min(ms, 40) : ms);
      collaboration.timers.push(entry);
    });
  }

  function clearCollabTimers() {
    collaboration.timers.forEach(function (entry) {
      window.clearTimeout(entry.id);
      if (entry.resolve) entry.resolve();
    });
    collaboration.timers = [];
  }

  function findCollabPerson(id) {
    return collaboration.peopleWithAccess.find(function (p) {
      return p.id === id;
    });
  }

  function permissionLabel(permission) {
    if (permission === "owner") return "Owner";
    if (permission === "edit") return "Can edit";
    return "Can view";
  }

  function presenceLabel(presence) {
    if (presence === "editing") return "Editing";
    if (presence === "viewing") return "Viewing";
    return "Idle";
  }

  function renderSharePeople() {
    if (!sharePeople) return;
    sharePeople.innerHTML = collaboration.peopleWithAccess
      .map(function (person) {
        const isOwner = person.permission === "owner";
        const statusText =
          person.active && collaboration.demoStatus !== "idle"
            ? presenceLabel(person.presence)
            : isOwner
              ? "Owner"
              : permissionLabel(person.permission);
        return (
          '<li class="wb-share-person" data-person-id="' +
          person.id +
          '">' +
          '<span class="wb-collab-avatar wb-collab-avatar--' +
          person.accent +
          '" aria-hidden="true">' +
          escapeHtml(person.initials) +
          "</span>" +
          '<span class="wb-share-person__info">' +
          '<span class="wb-share-person__name">' +
          escapeHtml(person.name) +
          "</span>" +
          '<span class="wb-share-person__meta">' +
          escapeHtml(statusText) +
          "</span></span>" +
          (isOwner
            ? '<span class="wb-share-person__perm">Owner</span>'
            : '<button type="button" class="wb-share-perm" data-person-id="' +
              person.id +
              '" aria-haspopup="menu" aria-expanded="false" aria-label="Permission for ' +
              escapeHtml(person.name) +
              '">' +
              escapeHtml(permissionLabel(person.permission)) +
              "</button>") +
          "</li>"
        );
      })
      .join("");
  }

  function clearPendingShareAdd() {
    pendingShareAdd = null;
    if (sharePending) {
      sharePending.hidden = true;
      sharePending.innerHTML = "";
    }
    closeSharePermMenu();
  }

  function renderPendingShareAdd() {
    clearPendingShareAdd();
  }

  function stagePendingSharePerson(id) {
    clearPendingShareAdd();
    return !!addPersonById(id);
  }

  function confirmPendingShareAdd() {
    if (!pendingShareAdd) return null;
    const added = addPersonById(pendingShareAdd.id);
    clearPendingShareAdd();
    return added;
  }

  function closeSharePermMenu() {
    if (sharePermMenu) sharePermMenu.hidden = true;
    sharePermMenuContext = null;
    document.querySelectorAll(".wb-share-perm[aria-expanded='true']").forEach(function (btn) {
      btn.setAttribute("aria-expanded", "false");
    });
  }

  function scrollSharePersonIntoView(personId) {
    const row =
      personId === "pending"
        ? sharePending && sharePending.querySelector(".wb-share-person")
        : sharePeople && sharePeople.querySelector('.wb-share-person[data-person-id="' + personId + '"]');
    if (!row) return false;
    const scroller = row.closest(".wb-share-people") || sharePeople;
    if (scroller && scroller.scrollHeight > scroller.clientHeight + 2) {
      const rowTop = row.offsetTop;
      const rowBottom = rowTop + row.offsetHeight;
      const pad = 8;
      if (rowTop < scroller.scrollTop + pad) {
        scroller.scrollTop = Math.max(0, rowTop - pad);
      } else if (rowBottom > scroller.scrollTop + scroller.clientHeight - pad) {
        scroller.scrollTop = rowBottom - scroller.clientHeight + pad;
      }
    } else if (typeof row.scrollIntoView === "function") {
      row.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    return true;
  }

  function getSharePermTrigger(personId) {
    if (personId === "pending") {
      return sharePending ? sharePending.querySelector("[data-pending-perm]") : null;
    }
    return sharePeople
      ? sharePeople.querySelector('.wb-share-perm[data-person-id="' + personId + '"]')
      : null;
  }

  function getSharePermOption(value) {
    return sharePermMenu
      ? sharePermMenu.querySelector('[data-perm="' + value + '"]')
      : null;
  }

  function openSharePermMenu(trigger) {
    if (!sharePermMenu || !trigger || !sharePopover) return false;
    const pending = trigger.hasAttribute("data-pending-perm");
    const personId = trigger.getAttribute("data-person-id");
    if (pending) return false;
    const current =
      findCollabPerson(personId) && findCollabPerson(personId).permission;
    sharePermMenuContext = { type: "person", id: personId };
    sharePermMenu.querySelectorAll("[data-perm]").forEach(function (btn) {
      const value = btn.getAttribute("data-perm");
      btn.classList.toggle("is-selected", value === current);
      btn.hidden = false;
    });
    sharePermMenu.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    const popRect = sharePopover.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const scale = popRect.width / (sharePopover.offsetWidth || popRect.width) || 1;
    const menuWidth = sharePermMenu.offsetWidth || 148;
    const menuHeight = sharePermMenu.offsetHeight || 112;
    const localPopW = sharePopover.clientWidth;
    const localPopH = sharePopover.clientHeight;
    const triggerLocalTop = (triggerRect.top - popRect.top) / scale;
    const triggerLocalBottom = (triggerRect.bottom - popRect.top) / scale;
    const triggerLocalRight = (triggerRect.right - popRect.left) / scale;
    let left = triggerLocalRight - menuWidth;
    if (left < 8) left = 8;
    if (left + menuWidth > localPopW - 8) left = Math.max(8, localPopW - menuWidth - 8);
    const spaceBelow = localPopH - triggerLocalBottom;
    const spaceAbove = triggerLocalTop;
    let top;
    if (spaceBelow >= menuHeight + 8) {
      top = triggerLocalBottom + 4;
    } else if (spaceAbove >= menuHeight + 8) {
      top = triggerLocalTop - menuHeight - 4;
    } else if (spaceAbove > spaceBelow) {
      top = 8;
    } else {
      top = Math.max(8, localPopH - menuHeight - 8);
    }
    sharePermMenu.style.left = Math.round(left) + "px";
    sharePermMenu.style.top = Math.round(top) + "px";
    return true;
  }

  function applySharePermissionChoice(value) {
    if (!sharePermMenuContext) return false;
    if (sharePermMenuContext.type === "pending") {
      closeSharePermMenu();
      return false;
    }
    const id = sharePermMenuContext.id;
    closeSharePermMenu();
    return setPersonPermission(id, value);
  }

  function setPersonPermission(id, permission) {
    const person = findCollabPerson(id);
    if (!person || person.permission === "owner") return false;
    if (permission === "remove") {
      collaboration.peopleWithAccess = collaboration.peopleWithAccess.filter(function (p) {
        return p.id !== id;
      });
      if (!demoCamera.cinematic) showShareToast(person.name + " removed");
    } else if (permission === "edit" || permission === "view") {
      person.permission = permission;
    } else {
      return false;
    }
    renderSharePeople();
    renderCollabAvatars();
    return true;
  }

  function renderCollabAvatars() {
    if (!collabAvatars) return;
    const active = collaboration.peopleWithAccess.filter(function (p) {
      return p.active && p.id !== "long";
    });
    const maxVisible = window.innerWidth < 900 ? 1 : 3;
    const visible = active.slice(0, maxVisible);
    const overflow = active.length - visible.length;

    collabAvatars.innerHTML = visible
      .map(function (person) {
        const status = presenceLabel(person.presence);
        const followable = canFollowPerson(person.id);
        const followed = collaboration.followedPersonId === person.id;
        const tip = followable ? "Follow " + person.name : person.name + " · " + status;
        return (
          '<button type="button" class="wb-collab-avatar wb-collab-avatar--btn wb-collab-avatar--' +
          person.accent +
          (person.presence === "editing" ? " is-editing" : "") +
          (followable ? " is-followable wb-tip" : "") +
          (followed ? " is-followed" : "") +
          '" data-presence-id="' +
          person.id +
          '" data-tip="' +
          escapeHtml(tip) +
          '" aria-label="' +
          escapeHtml(tip) +
          '" title="' +
          escapeHtml(tip) +
          '">' +
          escapeHtml(person.initials) +
          "</button>"
        );
      })
      .join("");

    if (collabOverflow) {
      if (overflow > 0) {
        collabOverflow.hidden = false;
        collabOverflow.textContent = "+" + overflow;
        collabOverflow.title = active
          .slice(maxVisible)
          .map(function (p) {
            return p.name;
          })
          .join(", ");
      } else {
        collabOverflow.hidden = true;
      }
    }
  }

  function showShareToast(message) {
    if (!shareToast) return;
    shareToast.hidden = false;
    shareToast.textContent = message;
    window.setTimeout(function () {
      if (shareToast.textContent === message) shareToast.hidden = true;
    }, 2200);
  }

  function setSyncStatus(text) {
    if (!syncStatus) return;
    if (!text) {
      syncStatus.hidden = true;
      syncStatus.textContent = "";
      return;
    }
    syncStatus.hidden = false;
    syncStatus.textContent = text;
  }

  function getCollabTarget(slot) {
    return reportDoc && reportDoc.querySelector('[data-collab-slot="' + slot + '"]');
  }

  function getAlexTarget() {
    return getCollabTarget(ALEX_DEMO.slot);
  }

  function getPriyaTarget() {
    return getCollabTarget(PRIYA_DEMO.slot);
  }

  function getCollabAvatar(id) {
    return collabAvatars
      ? collabAvatars.querySelector('[data-presence-id="' + id + '"]')
      : null;
  }

  function getFollowTargetForPerson(personId) {
    if (!personId) return null;
    const person = findCollabPerson(personId);
    if (!person) return null;
    if (
      collaboration.remoteCursor &&
      collaboration.remoteCursor.personId === personId &&
      collaboration.remoteCursor.target
    ) {
      return collaboration.remoteCursor.target;
    }
    const editing =
      person.presence === "editing" ||
      !!collaboration.typingJobs[personId] ||
      collaboration.focusPersonId === personId ||
      collaboration.activeEditorId === personId;
    if (!editing) return null;
    if (personId === "priya") return getPriyaTarget();
    if (personId === "alex") return getAlexTarget();
    return getCollabTarget(personId + "-demo");
  }

  function canFollowPerson(personId) {
    return !!getFollowTargetForPerson(personId);
  }

  function setFollowedAvatar(personId) {
    collaboration.followedPersonId = personId || null;
    renderCollabAvatars();
  }

  function clearFollowedAvatar() {
    if (!collaboration.followedPersonId) return;
    collaboration.followedPersonId = null;
    renderCollabAvatars();
  }

  function followCollaborator(personId) {
    const target = getFollowTargetForPerson(personId);
    if (!target) return Promise.resolve(false);
    if (presencePopover) presencePopover.hidden = true;
    setFollowedAvatar(personId);
    const travel = startFollowTravel(target);
    travel.then(
      function () {
        clearFollowedAvatar();
      },
      function () {
        clearFollowedAvatar();
      }
    );
    return travel;
  }

  function getRemoteAnchorEl() {
    return reportFlow || reportDoc || reportScroll;
  }

  function ensureRemoteLayerInReport() {
    const anchor = getRemoteAnchorEl();
    if (!remoteLayer || !anchor) return;
    if (remoteLayer.parentElement !== anchor) {
      anchor.appendChild(remoteLayer);
    }
  }

  function clientPointToReportLocal(clientX, clientY) {
    const anchor = getRemoteAnchorEl();
    if (!anchor) return { x: clientX, y: clientY };
    if (typeof viewportPointToStageLocal === "function") {
      const local = viewportPointToStageLocal(clientX, clientY);
      const box = anchor.getBoundingClientRect();
      const origin = viewportPointToStageLocal(box.left, box.top);
      return { x: local.x - origin.x, y: local.y - origin.y };
    }
    const box = anchor.getBoundingClientRect();
    const scale = demoCamera && demoCamera.scale > 0 ? demoCamera.scale : 1;
    return {
      x: (clientX - box.left) / scale,
      y: (clientY - box.top) / scale,
    };
  }

  function setRemoteAccent(personId) {
    const accent = personId === "priya" ? "priya" : "alex";
    if (remoteCursor) {
      remoteCursor.classList.remove("is-alex", "is-priya");
      remoteCursor.classList.add("is-" + accent);
      const label = remoteCursor.querySelector(".wb-remote-cursor__label");
      if (label) {
        label.textContent = personId === "priya" ? "Priya" : "Alex";
      }
    }
    if (remoteSelection) {
      remoteSelection.classList.remove("is-alex", "is-priya");
      remoteSelection.classList.add("is-" + accent);
    }
    collaboration.activeEditorId = personId;
  }

  function placeRemoteCursorAtPoint(left, top, target, extra) {
    if (!remoteCursor) return;
    extra = extra || {};
    ensureRemoteLayerInReport();
    remoteCursor.hidden = false;
    remoteCursor.style.transition = "opacity 120ms ease";
    remoteCursor.style.transitionProperty = "opacity";
    remoteCursor.style.top = Math.round(top) + "px";
    remoteCursor.style.left = Math.round(left) + "px";
    const anchor = getRemoteAnchorEl();
    if (anchor) {
      remoteCursor.classList.toggle("is-label-left", left > anchor.clientWidth - 140);
    }
    collaboration.remoteCursor = {
      top: top,
      left: left,
      offset: extra.offset,
      target: target || null,
      personId: collaboration.activeEditorId,
    };
    updateFollowChip();
  }

  function ensureTargetTextNode(target, text) {
    if (!target) return null;
    if (target.childNodes.length === 1 && target.firstChild.nodeType === 3) {
      target.firstChild.nodeValue = text;
    } else {
      target.textContent = text;
    }
    if (target.offsetHeight || target.offsetWidth) {
      /* force layout so the next Range sees the committed string */
    }
    return target.firstChild && target.firstChild.nodeType === 3
      ? target.firstChild
      : null;
  }

  function currentRemoteTextNode(target) {
    if (!target) return null;
    if (target.childNodes.length === 1 && target.firstChild.nodeType === 3) {
      return target.firstChild;
    }
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null);
    let last = null;
    let node;
    while ((node = walker.nextNode())) last = node;
    return last;
  }

  function resolveRemoteCaretRange(target, offset) {
    const textNode = currentRemoteTextNode(target);
    if (!textNode) return null;
    const value = textNode.nodeValue || "";
    const rendered = target.textContent || "";
    const safeOffset = Math.max(
      0,
      Math.min(
        offset == null ? value.length : offset,
        value.length,
        rendered.length
      )
    );
    const range = document.createRange();
    if (safeOffset > 0) {
      range.setStart(textNode, safeOffset - 1);
      range.setEnd(textNode, safeOffset);
    } else {
      range.setStart(textNode, 0);
      range.collapse(true);
    }
    return {
      range: range,
      textNode: textNode,
      offset: safeOffset,
      renderedLength: rendered.length,
    };
  }

  function measureRemoteCaretRange(info) {
    if (!info || !info.range) return null;
    const rects = info.range.getClientRects();
    if (rects.length) {
      const last = rects[rects.length - 1];
      return {
        top: last.top,
        left: last.right,
        height: last.height,
        width: 0,
        bottom: last.bottom,
        right: last.right,
      };
    }
    const caretApi = window.WriteBuilderCaret;
    if (caretApi && info.textNode) {
      return caretApi.positionVisualCaret(info.textNode, info.offset, info.range.startContainer);
    }
    return getCaretClientRect(
      info.textNode && info.textNode.parentNode,
      info.offset
    );
  }

  function renderRemoteCaret(target, offset, opts) {
    opts = opts || {};
    if (!remoteCursor || !target) {
      hideRemoteCursor();
      return null;
    }
    if (opts.ownerId && collaboration.caretOwnerId && opts.ownerId !== collaboration.caretOwnerId) {
      return null;
    }
    remoteCursor.classList.toggle("is-typing", opts.typing !== false);
    const info = resolveRemoteCaretRange(target, offset);
    if (!info) return null;
    const caretRect = measureRemoteCaretRange(info);
    if (!caretRect) return null;
    const local = clientPointToReportLocal(caretRect.left, caretRect.top);
    placeRemoteCursorAtPoint(local.x, local.y, target, { offset: info.offset });
    return info;
  }

  function placeRemoteCaretAtOffset(target, offset, opts) {
    renderRemoteCaret(target, offset, opts);
  }

  function placeRemoteCursorOnTarget(target, offsetRatio, atEnd) {
    if (!remoteCursor || !target) {
      hideRemoteCursor();
      return;
    }
    const textLen =
      (target.firstChild && target.firstChild.nodeType === 3
        ? target.firstChild.nodeValue.length
        : (target.textContent || "").length) || 0;
    const offset = atEnd
      ? textLen
      : Math.max(0, Math.floor(textLen * (typeof offsetRatio === "number" ? offsetRatio : 0.35)));
    placeRemoteCaretAtOffset(target, offset, { typing: false });
  }

  function hideRemoteCursor() {
    if (remoteCursor) {
      remoteCursor.hidden = true;
      remoteCursor.classList.remove("is-typing", "is-label-left");
    }
    if (remoteSelection) {
      remoteSelection.hidden = true;
      remoteSelection.style.width = "0";
    }
    collaboration.remoteCursor = null;
    collaboration.activeEditorId = null;
    updateFollowChip();
  }

  function showRemoteSelectionOnPhrase(target, phrase) {
    if (!remoteSelection || !target || !phrase) return false;
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      const idx = node.nodeValue.indexOf(phrase);
      if (idx === -1) continue;
      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + phrase.length);
      const rects = Array.prototype.slice.call(range.getClientRects());
      if (!rects.length) return false;
      // Cover full selection bounds
      let top = rects[0].top;
      let left = rects[0].left;
      let right = rects[0].right;
      let bottom = rects[0].bottom;
      rects.forEach(function (r) {
        top = Math.min(top, r.top);
        left = Math.min(left, r.left);
        right = Math.max(right, r.right);
        bottom = Math.max(bottom, r.bottom);
      });
      const local = clientPointToReportLocal(left, top);
      const localBR = clientPointToReportLocal(right, bottom);
      remoteSelection.hidden = false;
      remoteSelection.style.top = Math.round(local.y) + "px";
      remoteSelection.style.left = Math.round(local.x) + "px";
      remoteSelection.style.width = Math.round(localBR.x - local.x) + "px";
      remoteSelection.style.height = Math.round(localBR.y - local.y) + "px";
      placeRemoteCursorAtPoint(localBR.x, local.y, target);
      return true;
    }
    return false;
  }

  function clearLiveAttribution() {
    if (!reportDoc) return;
    reportDoc.querySelectorAll(".wb-live-attribution, .wb-live-trace").forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    reportDoc.querySelectorAll(".is-live-edited").forEach(function (el) {
      el.classList.remove("is-live-edited", "is-alex", "is-priya");
    });
  }

  function showLiveAttribution(target, personId) {
    if (!target) return;
    const person = getPersonProfile(personId);
    const existing = target.parentNode && target.parentNode.querySelector(
      '.wb-live-attribution[data-person="' + personId + '"]'
    );
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);

    const chip = document.createElement("div");
    chip.className = "wb-live-attribution is-" + person.accent;
    chip.setAttribute("data-person", personId);
    chip.innerHTML =
      personAvatarHtml(person, "wb-collab-avatar--xs") +
      '<span class="wb-live-attribution__name">' +
      escapeHtml(person.name.split(" ")[0]) +
      " edited this</span>";

    target.classList.add("is-live-edited", "is-" + person.accent);
    if (target.nextSibling) {
      target.parentNode.insertBefore(chip, target.nextSibling);
    } else {
      target.parentNode.appendChild(chip);
    }

    window.setTimeout(function () {
      chip.classList.add("is-fading");
      target.classList.add("is-trace-fading");
    }, prefersReducedMotion ? 400 : 1800);
    window.setTimeout(function () {
      if (chip.parentNode) chip.parentNode.removeChild(chip);
      target.classList.remove("is-live-edited", "is-alex", "is-priya", "is-trace-fading");
    }, prefersReducedMotion ? 700 : 2800);
  }

  function clearCollabDemoRevisions() {
    const slots = [ALEX_DEMO.revSlot, PRIYA_DEMO.revSlot];
    workspace.revisions = workspace.revisions.filter(function (r) {
      return slots.indexOf(r.slot) === -1;
    });
    if (collaboration.demoVersionLabels.length && workspace.versions) {
      workspace.versions = workspace.versions.filter(function (v) {
        return collaboration.demoVersionLabels.indexOf(v.label) === -1;
      });
      renderVersions();
    }
    collaboration.demoVersionLabels = [];
  }

  function registerCollabRevision(demo, original, revised) {
    workspace.revisions.forEach(function (r) {
      if (r.slot === demo.revSlot && r.status === "pending") r.status = "accepted";
    });
    createRevision({
      slot: demo.revSlot,
      author: getPersonProfile(demo.id).name,
      authorId: demo.id,
      authorType: "collaborator",
      originalText: original,
      revisedText: revised,
      highlightPhrase: demo.highlightPhrase,
      timestamp: Date.now(),
      expanded: true,
    });
    const rev = workspace.revisions[workspace.revisions.length - 1];
    rev.originalHtml = original;
    addVersion(demo.versionLabel);
    collaboration.demoVersionLabels.push(demo.versionLabel);
    if (workspace.showEdits) {
      applyShowEditsMarkup({ animateId: rev.id });
    }
  }

  function humanCharDelay(ch, prevCh, speed, rhythm) {
    const factor = typeof speed === "number" ? speed : 1;
    if (prefersReducedMotion) return Math.round(4 + Math.random() * 6);

    let delay;
    if (ch === "\n") {
      delay = 60 + Math.random() * 40;
    } else if (ch === " ") {
      delay = 10 + Math.random() * 8;
      if (Math.random() < 0.1) delay += 20 + Math.random() * 30;
    } else if (/\d/.test(ch)) {
      delay = 14 + Math.random() * 10;
    } else {
      delay = 12 + Math.random() * 12;
    }

    if (prevCh === ",") delay += 18 + Math.random() * 22;
    else if (prevCh === ".") delay += 40 + Math.random() * 40;
    else if (prevCh === ";" || prevCh === ":") delay += 24 + Math.random() * 26;
    else if (prevCh === "-" || prevCh === "—") delay += 18 + Math.random() * 18;

    if (rhythm) {
      if (rhythm.burstLeft > 0) {
        delay = Math.min(delay, 12 + Math.random() * 8);
        rhythm.burstLeft -= 1;
      } else if (ch !== " " && Math.random() < 0.07) {
        rhythm.burstLeft = 2 + Math.floor(Math.random() * 3);
      }
    }

    return Math.max(8, Math.round(delay * factor));
  }

  function waitAnimationFrame() {
    return new Promise(function (resolve) {
      window.requestAnimationFrame(function () {
        resolve();
      });
    });
  }

  function setDemoTypingIndex(demo, index) {
    const safe = Math.max(0, Math.min(index, (demo.revised || "").length));
    if (demo.id === "priya") collaboration.priyaTypingIndex = safe;
    else collaboration.alexTypingIndex = safe;
    return safe;
  }

  function getDemoTypingIndex(demo) {
    if (demo.id === "priya") return collaboration.priyaTypingIndex || 0;
    return collaboration.alexTypingIndex || 0;
  }

  function applyTypingIndex(target, demo, index, opts) {
    opts = opts || {};
    const safe = setDemoTypingIndex(demo, index);
    const text = (demo.revised || "").slice(0, safe);
    ensureTargetTextNode(target, text);
    renderRemoteCaret(target, safe, {
      typing: opts.typing !== false,
      ownerId: demo && demo.id,
    });
    demoCamera.focusOffset = safe;
    demoCamera.focusElement = target;
    return safe;
  }

  function isTypingJobCurrent(demo, epoch) {
    return (
      !collaboration.abort &&
      collaboration.typingEpoch === epoch &&
      collaboration.caretOwnerId === demo.id
    );
  }

  async function remoteTypingLoop(target, demo, options) {
    options = options || {};
    const full = demo.revised || "";
    const prefix = demo.prefix || "";
    let typingIndex = Math.max(
      0,
      Math.min(
        options.startIndex == null ? prefix.length : options.startIndex,
        full.length
      )
    );
    const endIndex = Math.max(
      typingIndex,
      Math.min(options.endIndex == null ? full.length : options.endIndex, full.length)
    );
    const holdCamera = options.holdCamera !== false;
    const rhythm = { burstLeft: 0 };
    const epoch = options.epoch != null ? options.epoch : collaboration.typingEpoch;

    if (!isTypingJobCurrent(demo, epoch)) return typingIndex;

    if (remoteCursor) remoteCursor.classList.add("is-typing");
    const initial = full.slice(0, typingIndex);
    if ((target.textContent || "") !== initial) {
      ensureTargetTextNode(target, initial);
    }
    setDemoTypingIndex(demo, typingIndex);
    await waitAnimationFrame();
    if (!isTypingJobCurrent(demo, epoch)) return typingIndex;
    renderRemoteCaret(target, typingIndex, { typing: true, ownerId: demo.id });

    let charsSinceSafeCheck = 0;
    while (typingIndex < endIndex) {
      if (!isTypingJobCurrent(demo, epoch)) return typingIndex;
      const prevCh = typingIndex > 0 ? full.charAt(typingIndex - 1) : "";
      typingIndex += 1;
      const ch = full.charAt(typingIndex - 1);
      const rendered = full.slice(0, typingIndex);
      ensureTargetTextNode(target, rendered);
      setDemoTypingIndex(demo, typingIndex);

      await waitAnimationFrame();
      if (!isTypingJobCurrent(demo, epoch)) return typingIndex;
      renderRemoteCaret(target, typingIndex, { typing: true, ownerId: demo.id });
      demoCamera.focusOffset = typingIndex;
      demoCamera.focusElement = target;

      charsSinceSafeCheck += 1;
      if (holdCamera && (ch === "\n" || charsSinceSafeCheck >= 14 || typingIndex === endIndex)) {
        charsSinceSafeCheck = 0;
        await ensureDemoCameraSafeZone(target, typingIndex);
      }

      let delay = humanCharDelay(
        ch,
        prevCh,
        options.speed != null ? options.speed : demo.typingSpeed,
        rhythm
      );
      if (rendered.endsWith("Technology,")) delay += 30 + Math.random() * 40;
      else if (rendered.endsWith("approval and")) delay += 24 + Math.random() * 36;
      else if (rendered.endsWith("Finance and")) delay += 20 + Math.random() * 28;

      await collabDelay(delay);
    }

    if (endIndex >= full.length && isTypingJobCurrent(demo, epoch)) {
      ensureTargetTextNode(target, full);
      setDemoTypingIndex(demo, full.length);
      await waitAnimationFrame();
      if (isTypingJobCurrent(demo, epoch)) {
        renderRemoteCaret(target, full.length, { typing: true, ownerId: demo.id });
      }
    }
    if (remoteCursor && options.keepTyping !== true && isTypingJobCurrent(demo, epoch)) {
      remoteCursor.classList.remove("is-typing");
    }
    return typingIndex;
  }

  async function typeHumanRevision(target, demo, options) {
    return remoteTypingLoop(target, demo, options);
  }

  async function performLiveReplace(demo, options) {
    options = options || {};
    const target = getCollabTarget(demo.slot);
    if (!target) return false;
    if (collaboration.abort) return false;

    const current = plainTextFromHtml(target.innerHTML).replace(/\s+/g, " ").trim();
    const startIndex = options.startIndex == null ? 0 : options.startIndex;
    const continuePartial = startIndex > 0 || options.skipIntroTheater === true;
    if (
      !continuePartial &&
      current !== demo.original &&
      current.indexOf(demo.selectPhrase) === -1 &&
      current !== demo.revised
    ) {
      return false;
    }

    collaboration.liveEditSlot = demo.slot;
    workspace.suppressEditCapture = true;
    collaboration.typingEpoch += 1;
    collaboration.caretOwnerId = demo.id;
    setRemoteAccent(demo.id);

    if (!continuePartial) {
      if (current !== demo.original) {
        ensureTargetTextNode(target, demo.original);
      }

      placeRemoteCursorOnTarget(target, 0.35, false);
      await collabDelay(prefersReducedMotion ? 40 : 160);
      if (collaboration.abort) {
        workspace.suppressEditCapture = false;
        collaboration.liveEditSlot = null;
        return false;
      }

      showRemoteSelectionOnPhrase(target, demo.selectPhrase);
      await collabDelay(prefersReducedMotion ? 80 : 240);
      if (collaboration.abort) {
        workspace.suppressEditCapture = false;
        collaboration.liveEditSlot = null;
        return false;
      }

      if (remoteSelection) remoteSelection.classList.add("is-deleting");
      await collabDelay(prefersReducedMotion ? 40 : 100);
      if (remoteSelection) {
        remoteSelection.classList.remove("is-deleting");
        remoteSelection.hidden = true;
      }

      const startText = demo.prefix || "";
      ensureTargetTextNode(target, startText);
      await waitAnimationFrame();
      if (remoteCursor) remoteCursor.classList.add("is-typing");
      placeRemoteCaretAtOffset(target, startText.length, { immediate: true, typing: true });
      await collabDelay(prefersReducedMotion ? 20 : 60);
      if (collaboration.abort) {
        if (remoteCursor) remoteCursor.classList.remove("is-typing");
        workspace.suppressEditCapture = false;
        collaboration.liveEditSlot = null;
        return false;
      }
    } else if (remoteSelection) {
      remoteSelection.hidden = true;
    }

    await remoteTypingLoop(target, demo, Object.assign({ epoch: collaboration.typingEpoch }, options));
    if (collaboration.abort) {
      if (remoteCursor) remoteCursor.classList.remove("is-typing");
      workspace.suppressEditCapture = false;
      collaboration.liveEditSlot = null;
      return false;
    }

    ensureTargetTextNode(target, demo.revised);
    target.setAttribute("data-rev-slot", demo.revSlot);
    target.setAttribute("data-collab-slot", demo.slot);
    await waitAnimationFrame();
    placeRemoteCaretAtOffset(target, demo.revised.length, { immediate: true, typing: false });
    if (remoteCursor) remoteCursor.classList.remove("is-typing");
    workspace.suppressEditCapture = false;
    collaboration.liveEditSlot = null;

    registerCollabRevision(demo, demo.original, demo.revised);
    showLiveAttribution(target, demo.id);
    return true;
  }

  function resetCollabDemoParagraphs() {
    workspace.suppressEditCapture = true;
    clearLiveAttribution();
    clearCollabDemoRevisions();

    [ALEX_DEMO, PRIYA_DEMO].forEach(function (demo) {
      let el = getCollabTarget(demo.slot);
      if (el) {
        const unit = el.closest(".wb-rev-unit");
        if (unit) unwrapRevisionUnit(unit);
        el = getCollabTarget(demo.slot);
      }
      if (el) {
        el.textContent = demo.original;
        el.setAttribute("data-rev-slot", demo.revSlot);
        el.setAttribute("data-collab-slot", demo.slot);
      }
    });

    workspace.suppressEditCapture = false;
    collaboration.alexTypingIndex = 0;
    collaboration.priyaTypingIndex = 0;
    collaboration.typingEpoch += 1;
    collaboration.caretOwnerId = null;
    if (workspace.showEdits) applyShowEditsMarkup();
  }

  function pulseShowEditsHint() {
    if (!showEditsBtn || workspace.showEdits) return;
    showEditsBtn.classList.add("is-attention");
    window.setTimeout(function () {
      showEditsBtn.classList.remove("is-attention");
    }, 1000);
  }

  function setPersonPresence(id, presence, active) {
    const person = findCollabPerson(id);
    if (!person) return;
    if (typeof active === "boolean") person.active = active;
    person.presence = presence;
    renderCollabAvatars();
    renderSharePeople();
  }

  function updateDemoButton() {
    if (!collabDemoBtn) return;
    let icon = collabDemoBtn.querySelector("[data-lucide]");
    let label = collabDemoBtn.querySelector("span");
    if (!icon || !label) {
      collabDemoBtn.innerHTML =
        '<i data-lucide="play" class="wb-btn__icon" aria-hidden="true"></i><span></span>';
      icon = collabDemoBtn.querySelector("[data-lucide]");
      label = collabDemoBtn.querySelector("span");
    }
    if (collaboration.demoStatus === "running") {
      collabDemoBtn.disabled = true;
      label.textContent = "Collaboration running";
      icon.setAttribute("data-lucide", "activity");
      if (collabDemoLive) collabDemoLive.textContent = "Collaboration demo started";
    } else if (collaboration.demoStatus === "complete") {
      collabDemoBtn.disabled = false;
      label.textContent = "Restart collaboration demo";
      icon.setAttribute("data-lucide", "rotate-ccw");
      if (collabDemoLive) collabDemoLive.textContent = "Collaboration demo completed";
    } else {
      collabDemoBtn.disabled = false;
      label.textContent = "Start collaboration demo";
      icon.setAttribute("data-lucide", "play");
      if (collabDemoLive) collabDemoLive.textContent = "";
    }
    refreshIcons();
  }

  function closeSharePopover() {
    if (sharePopover) sharePopover.hidden = true;
    if (shareBtn) shareBtn.setAttribute("aria-expanded", "false");
    if (shareAccessMenu) shareAccessMenu.hidden = true;
    if (shareAccessBtn) shareAccessBtn.setAttribute("aria-expanded", "false");
    closeSharePermMenu();
    clearPendingShareAdd();
  }

  function openSharePopover() {
    if (!shareBtn || !sharePopover) return false;
    renderSharePeople();
    setGeneralAccess(collaboration.generalAccess);
    if (sharePopover.hidden) {
      togglePopover(shareBtn, sharePopover);
    }
    if (shareAccessMenu) shareAccessMenu.hidden = true;
    if (shareAccessBtn) shareAccessBtn.setAttribute("aria-expanded", "false");
    closeSharePermMenu();
    refreshIcons();
    return !sharePopover.hidden;
  }

  function setGeneralAccess(mode) {
    collaboration.generalAccess = mode === "link" ? "link" : "restricted";
    const restricted = collaboration.generalAccess === "restricted";
    if (shareAccessBtn) {
      const label = restricted
        ? "General access: Restricted"
        : "General access: Anyone with the link";
      shareAccessBtn.setAttribute("aria-label", label);
      shareAccessBtn.title = label;
      const icon = shareAccessBtn.querySelector("[data-lucide]");
      if (icon) icon.setAttribute("data-lucide", restricted ? "lock" : "globe-2");
    }
    if (shareAccessMenu) {
      shareAccessMenu.querySelectorAll("[data-access]").forEach(function (btn) {
        const selected = btn.getAttribute("data-access") === collaboration.generalAccess;
        btn.classList.toggle("is-selected", selected);
        btn.setAttribute("aria-checked", selected ? "true" : "false");
      });
    }
    refreshIcons();
  }

  function flashLinkCopied() {
    if (!shareCopyBtn) return;
    const prev = shareCopyBtn.getAttribute("title") || "Copy link";
    shareCopyBtn.title = "Link copied";
    shareCopyBtn.classList.add("is-copied");
    shareCopyBtn.setAttribute("aria-label", "Link copied");
    window.setTimeout(function () {
      shareCopyBtn.title = prev;
      shareCopyBtn.classList.remove("is-copied");
      shareCopyBtn.setAttribute("aria-label", "Copy share link");
    }, 1600);
  }

  function isTargetInReportViewport(target) {
    if (!target || !reportScroll) return true;
    const rect = target.getBoundingClientRect();
    const scrollRect = reportScroll.getBoundingClientRect();
    return !(rect.bottom < scrollRect.top + 40 || rect.top > scrollRect.bottom - 40);
  }

  function isFollowChipLocked() {
    return !!(collaboration.followChipFading || collaboration.followTravelActive);
  }

  function getReportEditorEl() {
    return (
      (followLayer && followLayer.closest(".wb-report")) ||
      (followChip && followChip.closest(".wb-report")) ||
      document.getElementById("wb-report")
    );
  }

  function getScrollLocalBox(reportEl) {
    if (!reportEl) return null;
    const header = reportEl.querySelector(".wb-report__header");
    const toolbar = reportEl.querySelector(".wb-report__toolbar");
    const top =
      (header ? header.offsetHeight : 0) +
      (toolbar ? toolbar.offsetHeight : 0);
    return {
      top: Math.max(0, top),
      left: 0,
      width: reportEl.clientWidth,
      height: Math.max(0, reportEl.clientHeight - top),
    };
  }

  function syncFollowLayer() {
    const reportEl = getReportEditorEl();
    if (!followLayer || !reportEl || !reportScroll) return;
    const box = getScrollLocalBox(reportEl);
    if (!box) return;
    followLayer.style.top = box.top + "px";
    followLayer.style.left = box.left + "px";
    followLayer.style.width = box.width + "px";
    followLayer.style.height = box.height + "px";
    followLayer.style.right = "auto";
    followLayer.style.bottom = "auto";
  }

  function getFollowChipPlacement() {
    if (!followChip || followChip.hidden) return null;
    if (followChip.classList.contains("is-above")) return "above";
    if (followChip.classList.contains("is-below")) return "below";
    return null;
  }

  function getFollowChipFocusRect() {
    if (!followChip || followChip.hidden || !reportScroll) return null;
    const chipR = followChip.getBoundingClientRect();
    const scrollR = reportScroll.getBoundingClientRect();
    if (!chipR || !scrollR || !(scrollR.height > 0)) return null;
    const above = followChip.classList.contains("is-above");
    const width = Math.max(180, scrollR.width * 0.72);
    const left = scrollR.left + (scrollR.width - width) / 2;
    const context = Math.max(168, Math.min(scrollR.height * 0.48, 280));
    if (above) {
      const top = chipR.top;
      const height = Math.min(context, Math.max(140, scrollR.bottom - top));
      return makeFocusRect(left, top, width, height);
    }
    const bottom = chipR.bottom;
    const height = Math.min(context, Math.max(140, bottom - scrollR.top));
    return makeFocusRect(left, bottom - height, width, height);
  }

  function positionFollowChip(below) {
    if (!followChip) return;
    syncFollowLayer();
    followChip.classList.toggle("is-above", !below);
    followChip.classList.toggle("is-below", below);
    followChip.style.top = "";
    followChip.style.bottom = "";
  }

  function unmountFollowChip() {
    if (!followChip) return;
    followChip.style.pointerEvents = "none";
    followChip.classList.remove("is-hover", "is-above", "is-below");
    const label = followChip.querySelector(".wb-follow-chip__label");
    const dir = followChip.querySelector(".wb-follow-chip__dir");
    if (label) label.textContent = "";
    if (dir) dir.innerHTML = "";
    followChip.hidden = true;
    followChip.classList.remove("is-fading");
    followChip.style.top = "";
    followChip.style.bottom = "";
    followChip.style.pointerEvents = "";
  }

  function setFollowChipDeferred(deferred) {
    collaboration.deferFollowChip = !!deferred;
    if (collaboration.deferFollowChip) {
      unmountFollowChip();
    } else {
      updateFollowChip();
    }
    return collaboration.deferFollowChip;
  }

  function updateFollowChip() {
    if (!followChip || !reportScroll) {
      if (followChip) followChip.hidden = true;
      return;
    }
    if (collaboration.deferFollowChip) {
      if (!followChip.hidden) unmountFollowChip();
      return;
    }
    if (isFollowChipLocked()) return;
    const cursorPerson =
      collaboration.remoteCursor && collaboration.remoteCursor.personId;
    const personId = collaboration.focusPersonId || cursorPerson || "alex";
    let target = collaboration.focusTarget;
    if (
      collaboration.remoteCursor &&
      collaboration.remoteCursor.target &&
      (!collaboration.focusPersonId || cursorPerson === collaboration.focusPersonId)
    ) {
      target = collaboration.remoteCursor.target;
    }
    if (!target || collaboration.demoStatus !== "running") {
      unmountFollowChip();
      return;
    }
    if (isTargetInReportViewport(target)) {
      unmountFollowChip();
      return;
    }
    const person = getPersonProfile(personId);
    const first = (person.name || "").split(" ")[0];
    const known = !!first;
    const rect = target.getBoundingClientRect();
    const scrollRect = reportScroll.getBoundingClientRect();
    const below = rect.top > scrollRect.bottom - 40;
    const label = followChip.querySelector(".wb-follow-chip__label");
    const dir = followChip.querySelector(".wb-follow-chip__dir");
    let avatar = followChip.querySelector(".wb-follow-chip__avatar");
    followChip.classList.remove("is-fading");
    followChip.style.pointerEvents = "";
    followChip.hidden = false;
    positionFollowChip(below);
    if (!avatar) {
      avatar = document.createElement("span");
      followChip.insertBefore(avatar, followChip.firstChild);
    }
    avatar.className =
      "wb-follow-chip__avatar wb-collab-avatar wb-collab-avatar--xs wb-collab-avatar--" +
      (person.accent || "owner");
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = person.initials || "";
    if (label) {
      label.textContent = known ? first + " is editing" : "Someone is editing";
    }
    if (dir) {
      dir.innerHTML = below
        ? '<i data-lucide="arrow-down" aria-hidden="true"></i>'
        : '<i data-lucide="arrow-up" aria-hidden="true"></i>';
    }
    followChip.setAttribute(
      "aria-label",
      known ? "Follow " + person.name : "Follow collaborator"
    );
    refreshIcons();
  }

  function fadeFollowChip() {
    if (!followChip) return collaboration.followChipFadePromise || Promise.resolve();
    if (collaboration.followChipFading) {
      return collaboration.followChipFadePromise || Promise.resolve();
    }
    if (followChip.hidden) {
      unmountFollowChip();
      return Promise.resolve();
    }
    collaboration.followChipFading = true;
    followChip.style.pointerEvents = "none";
    followChip.classList.remove("is-hover");
    followChip.classList.add("is-fading");
    const duration = prefersReducedMotion ? 40 : 150;
    collaboration.followChipFadePromise = new Promise(function (resolve) {
      let done = false;
      function finish() {
        if (done) return;
        done = true;
        followChip.removeEventListener("transitionend", onEnd);
        unmountFollowChip();
        if (!collaboration.followTravel) {
          collaboration.followChipFading = false;
        }
        resolve();
      }
      function onEnd(e) {
        if (e.target !== followChip) return;
        if (e.propertyName && e.propertyName !== "opacity") return;
        finish();
      }
      followChip.addEventListener("transitionend", onEnd);
      window.setTimeout(finish, duration + 40);
    });
    return collaboration.followChipFadePromise;
  }

  async function focusCollabTarget(target, personId, force) {
    collaboration.focusTarget = target || null;
    collaboration.focusPersonId = personId || null;
    if (!target) return false;

    const shouldFollow = force || collaboration.demoAutoFollow;
    if (!shouldFollow) {
      updateFollowChip();
      return false;
    }

    if (isTargetInReportViewport(target) && !force) {
      updateFollowChip();
      return true;
    }

    collaboration.programmaticScroll = true;
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    });
    await collabDelay(prefersReducedMotion ? 40 : 450);
    collaboration.programmaticScroll = false;
    updateFollowChip();
    return true;
  }

  function ensureAccess(id, permission) {
    let person = findCollabPerson(id);
    if (person) {
      if (permission) person.permission = permission;
      return person;
    }
    const dir = COLLAB_DIRECTORY.find(function (p) {
      return p.id === id;
    });
    if (!dir) return null;
    person = {
      id: dir.id,
      name: dir.name,
      initials: dir.initials,
      accent: dir.accent,
      permission: permission || dir.defaultPermission,
      presence: "idle",
      active: false,
    };
    collaboration.peopleWithAccess.push(person);
    return person;
  }

  /* —— Demo camera (cinematic collaboration recording) —— */
  const DEMO_CAMERA_DEBUG = false;
  const DEMO_CAMERA_MAX_SCALE = 1.45;
  const DEMO_CAMERA_EDIT_SCALE = 1.38;
  const DEMO_CAMERA_REPORT_SCALE = 1.18;
  const demoCamera = {
    active: false,
    cinematic: false,
    scale: 1,
    x: 0,
    y: 0,
    target: null,
    focusElement: null,
    focusPhrase: null,
    focusOffset: null,
    durationMs: 750,
    correcting: false,
    mode: null,
    lockX: null,
  };
  let demoCameraDebugEls = null;
  let demoInteractionBlocker = null;
  let demoCameraResizeObserver = null;
  let demoCameraResizeTimer = null;
  let demoCameraAnim = null;
  const CAMERA_SAFE_ZONE = {
    minX: 0.35,
    maxX: 0.65,
    minY: 0.25,
    maxY: 0.75,
  };

  function demoCameraEase() {
    return "cubic-bezier(0.22, 1, 0.36, 1)";
  }

  function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function cameraEaseProgress(t) {
    const u = Math.max(0, Math.min(1, t));
    let guess = u;
    for (let i = 0; i < 5; i++) {
      const mt = 1 - guess;
      const x = 3 * mt * mt * guess * 0.22 + 3 * mt * guess * guess * 0.36 + guess * guess * guess - u;
      const dx = 3 * mt * mt * 0.22 + 6 * mt * guess * (0.36 - 0.22) + 3 * guess * guess * (1 - 0.36);
      if (Math.abs(dx) < 1e-6) break;
      guess = clampNumber(guess - x / dx, 0, 1);
    }
    const mt = 1 - guess;
    return 3 * mt * mt * guess * 1 + 3 * mt * guess * guess * 1 + guess * guess * guess;
  }

  function getCameraViewportMetrics() {
    if (!demoCameraViewport) {
      return { width: window.innerWidth, height: window.innerHeight, left: 0, top: 0 };
    }
    const rect = demoCameraViewport.getBoundingClientRect();
    return {
      width: demoCameraViewport.clientWidth || rect.width,
      height: demoCameraViewport.clientHeight || rect.height,
      left: rect.left,
      top: rect.top,
    };
  }

  function getCameraStageMetrics() {
    if (!demoCameraStage) {
      return getCameraViewportMetrics();
    }
    return {
      width: demoCameraStage.clientWidth || demoCameraStage.offsetWidth,
      height: demoCameraStage.clientHeight || demoCameraStage.offsetHeight,
    };
  }

  function getCameraCoverageMetrics() {
    const vp = getCameraViewportMetrics();
    const app = document.getElementById("wb-app");
    const el = app || demoCameraStage;
    if (!el) {
      return { width: vp.width, height: vp.height };
    }
    return {
      width: el.clientWidth || el.offsetWidth || vp.width,
      height: el.clientHeight || el.offsetHeight || vp.height,
    };
  }

  function getCameraTranslationBounds(scale) {
    const vp = getCameraViewportMetrics();
    const cover = getCameraCoverageMetrics();
    const s = clampNumber(scale == null ? 1 : scale, 1, DEMO_CAMERA_MAX_SCALE);
    const scaledW = cover.width * s;
    const scaledH = cover.height * s;
    return {
      minX: Math.min(0, vp.width - scaledW),
      maxX: 0,
      minY: Math.min(0, vp.height - scaledH),
      maxY: 0,
      scale: s,
      vp: vp,
      cover: cover,
    };
  }

  function clampCameraTransform(state) {
    state = state || {};
    let scale = clampNumber(state.scale == null ? 1 : state.scale, 1, DEMO_CAMERA_MAX_SCALE);
    const bounds = getCameraTranslationBounds(scale);
    if (scale <= 1.001) {
      return {
        scale: 1,
        x: 0,
        y: 0,
        bounds: {
          minX: 0,
          maxX: 0,
          minY: 0,
          maxY: 0,
          scale: 1,
          vp: bounds.vp,
          cover: bounds.cover,
        },
      };
    }
    return {
      scale: scale,
      x: clampNumber(state.x || 0, bounds.minX, bounds.maxX),
      y: clampNumber(state.y || 0, bounds.minY, bounds.maxY),
      bounds: bounds,
    };
  }

  function getValidCameraTransform(state) {
    return clampCameraTransform(state);
  }

  function cancelDemoCameraAnim() {
    if (demoCameraAnim && demoCameraAnim.raf) {
      window.cancelAnimationFrame(demoCameraAnim.raf);
    }
    demoCameraAnim = null;
  }

  function paintDemoCameraState(state) {
    const clamped = clampCameraTransform(state);
    demoCamera.scale = clamped.scale;
    demoCamera.x = clamped.x;
    demoCamera.y = clamped.y;
    if (!demoCameraStage) return clamped;
    demoCameraStage.style.transition = "none";
    if (clamped.scale === 1 && clamped.x === 0 && clamped.y === 0) {
      demoCameraStage.style.transform = "";
      demoCameraStage.style.removeProperty("transform");
    } else {
      demoCameraStage.style.transform =
        "translate3d(" +
        clamped.x.toFixed(2) +
        "px, " +
        clamped.y.toFixed(2) +
        "px, 0) scale(" +
        clamped.scale +
        ")";
    }
    return clamped;
  }

  function animateDemoCameraTo(target, durationMs) {
    const to = clampCameraTransform(target);
    const from = {
      scale: demoCamera.scale,
      x: demoCamera.x,
      y: demoCamera.y,
    };
    cancelDemoCameraAnim();
    const duration =
      prefersReducedMotion || !durationMs || durationMs <= 0 ? 0 : durationMs;
    if (duration <= 0) {
      paintDemoCameraState(to);
      return Promise.resolve(to);
    }
    document.body.classList.add("wb-demo-camera-active");
    demoCamera.active = true;
    return new Promise(function (resolve) {
      const start = performance.now();
      const anim = { raf: 0 };
      demoCameraAnim = anim;
      function frame(now) {
        if (demoCameraAnim !== anim || collaboration.abort) {
          resolve(
            clampCameraTransform({
              scale: demoCamera.scale,
              x: demoCamera.x,
              y: demoCamera.y,
            })
          );
          return;
        }
        const t = Math.min(1, (now - start) / duration);
        const e = cameraEaseProgress(t);
        paintDemoCameraState({
          scale: from.scale + (to.scale - from.scale) * e,
          x: from.x + (to.x - from.x) * e,
          y: from.y + (to.y - from.y) * e,
        });
        if (t < 1) {
          anim.raf = window.requestAnimationFrame(frame);
        } else {
          paintDemoCameraState(to);
          if (demoCameraAnim === anim) demoCameraAnim = null;
          resolve(to);
        }
      }
      anim.raf = window.requestAnimationFrame(frame);
    });
  }

  function getUntransformedStageOrigin() {
    if (!demoCameraViewport) return { x: 0, y: 0 };
    const vp = demoCameraViewport.getBoundingClientRect();
    const cs = window.getComputedStyle(demoCameraViewport);
    const borderLeft = parseFloat(cs.borderLeftWidth) || 0;
    const borderTop = parseFloat(cs.borderTopWidth) || 0;
    const padLeft = parseFloat(cs.paddingLeft) || 0;
    const padTop = parseFloat(cs.paddingTop) || 0;
    return {
      x: vp.left + borderLeft + padLeft + (demoCameraStage ? demoCameraStage.offsetLeft : 0),
      y: vp.top + borderTop + padTop + (demoCameraStage ? demoCameraStage.offsetTop : 0),
    };
  }

  function getOverlayCoordinateRoot() {
    return demoOverlayLayer || demoCameraStage || null;
  }

  function readStageLocalTransform() {
    if (demoCameraStage) {
      const raw = window.getComputedStyle(demoCameraStage).transform;
      if (raw && raw !== "none") {
        try {
          return new DOMMatrix(raw);
        } catch (err) {
          /* fall through */
        }
      }
    }
    return new DOMMatrix();
  }

  /**
   * Maps overlay-root / camera-stage local pixels → viewport/client pixels
   * using the currently painted transform (including in-flight CSS transitions).
   *
   * The painted origin of local (0, 0) is the overlay root's transformed
   * top-left. Translation is already in that origin — only the linear
   * scale/skew from the camera matrix is applied on top.
   */
  function getCurrentCameraMatrix() {
    const root = getOverlayCoordinateRoot();
    const linear = readStageLocalTransform();
    linear.e = 0;
    linear.f = 0;
    if (root) {
      const box = root.getBoundingClientRect();
      return new DOMMatrix().translate(box.left, box.top).multiply(linear);
    }
    const origin = getUntransformedStageOrigin();
    return new DOMMatrix().translate(origin.x, origin.y).multiply(readStageLocalTransform());
  }

  function invertCameraMatrix(matrix) {
    if (!matrix) return new DOMMatrix();
    try {
      const inverse = matrix.inverse();
      if (inverse && Number.isFinite(inverse.a) && Number.isFinite(inverse.e)) {
        return inverse;
      }
    } catch (err) {
      /* fall through */
    }
    return new DOMMatrix();
  }

  function viewportPointToStageLocal(x, y) {
    const local = new DOMPoint(x, y).matrixTransform(invertCameraMatrix(getCurrentCameraMatrix()));
    return { x: local.x, y: local.y };
  }

  /**
   * Camera planner: invert the logical CSS translate+scale relative to the
   * untransformed stage origin. Overlay placement must use
   * viewportPointToStageLocal() instead — that matches the overlay root's
   * painted containing block.
   */
  function clientPointToStageLocal(clientX, clientY) {
    const origin = getUntransformedStageOrigin();
    const full = new DOMMatrix().translate(origin.x, origin.y).multiply(readStageLocalTransform());
    const local = new DOMPoint(clientX, clientY).matrixTransform(invertCameraMatrix(full));
    return { x: local.x, y: local.y };
  }

  function viewportRectToStageLocal(rect) {
    if (!rect) return null;
    const tl = viewportPointToStageLocal(rect.left, rect.top);
    const br = viewportPointToStageLocal(
      rect.right != null ? rect.right : rect.left + (rect.width || 0),
      rect.bottom != null ? rect.bottom : rect.top + (rect.height || 0)
    );
    return {
      left: tl.x,
      top: tl.y,
      right: br.x,
      bottom: br.y,
      width: br.x - tl.x,
      height: br.y - tl.y,
    };
  }

  function copySpaceRect(rect) {
    if (!rect) return null;
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width != null ? rect.width : rect.right - rect.left,
      height: rect.height != null ? rect.height : rect.bottom - rect.top,
      right: rect.right != null ? rect.right : rect.left + rect.width,
      bottom: rect.bottom != null ? rect.bottom : rect.top + rect.height,
    };
  }

  function overlayUsesStageSpace(el) {
    return !!(el && el.classList.contains("is-stage-mounted") && demoOverlayLayer && demoCamera.cinematic);
  }

  function isOverlayStageMounted(el) {
    return overlayUsesStageSpace(el);
  }

  function getWindowClampRect() {
    return {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      right: window.innerWidth,
      bottom: window.innerHeight,
    };
  }

  function getViewportBoxRect() {
    const vp = getCameraViewportMetrics();
    return {
      left: vp.left,
      top: vp.top,
      width: vp.width,
      height: vp.height,
      right: vp.left + vp.width,
      bottom: vp.top + vp.height,
    };
  }

  /**
   * Convert a viewport-space rect into the overlay's positioning space.
   * Stage-mounted cinematic overlays use camera-stage local pixels.
   * Body-fixed overlays keep viewport/client pixels.
   */
  function rectToOverlaySpace(rect, el) {
    if (!rect) return null;
    return overlayUsesStageSpace(el) ? viewportRectToStageLocal(rect) : copySpaceRect(rect);
  }

  function applyOverlayPosition(el, left, top) {
    if (!el) return;
    el.style.left = Math.round(left) + "px";
    el.style.top = Math.round(top) + "px";
  }

  function mountOneOverlayForDemo(el, homeParent, stageMount) {
    if (!el) return;
    if (stageMount && demoOverlayLayer) {
      if (el.parentElement !== demoOverlayLayer) {
        demoOverlayLayer.appendChild(el);
      }
      el.classList.add("is-stage-mounted");
      if (demoOverlayLayer) demoOverlayLayer.setAttribute("aria-hidden", "false");
    } else {
      const home = homeParent || document.body;
      if (el.parentElement !== home) {
        home.appendChild(el);
      }
      el.classList.remove("is-stage-mounted");
      el.style.left = "";
      el.style.top = "";
    }
  }

  function mountReportOverlaysForDemo(stageMount) {
    mountOneOverlayForDemo(citePopover, stageOverlayHome.cite, stageMount);
    mountOneOverlayForDemo(selectionToolbar, stageOverlayHome.selection, stageMount);
    mountOneOverlayForDemo(commentComposer, stageOverlayHome.composer, stageMount);
    mountOneOverlayForDemo(commentThreadEl, stageOverlayHome.thread, stageMount);
    if (!stageMount && demoOverlayLayer) {
      const hasEdu = demoOverlayLayer.querySelector(".wb-edu-popout");
      if (!hasEdu && !demoOverlayLayer.children.length) {
        demoOverlayLayer.setAttribute("aria-hidden", "true");
      }
    }
  }

  function makeFocusRect(left, top, width, height) {
    const w = Math.max(width || 0, 1);
    const h = Math.max(height || 0, 2);
    return {
      left: left,
      top: top,
      width: w,
      height: h,
      right: left + w,
      bottom: top + h,
      centerX: left + w / 2,
      centerY: top + h / 2,
    };
  }

  function getRangeFocusRect(range) {
    if (!range) return null;
    const rects = range.getClientRects();
    if (rects && rects.length) {
      // Prefer the last visible line for caret-like collapsed ranges
      if (range.collapsed) {
        const last = rects[rects.length - 1];
        return makeFocusRect(last.left, last.top, Math.max(last.width, 2), Math.max(last.height, 14));
      }
      // For multi-line selections, focus the first line (editing start)
      const first = rects[0];
      return makeFocusRect(first.left, first.top, Math.max(first.width, 2), Math.max(first.height, 14));
    }
    const br = range.getBoundingClientRect();
    if (!br || (!(br.width || br.height) && !br.top && !br.left)) return null;
    return makeFocusRect(br.left, br.top, br.width || 2, br.height || 16);
  }

  function getCaretClientRect(target, offset) {
    if (!target) return null;
    const textNode =
      target.firstChild && target.firstChild.nodeType === 3 ? target.firstChild : null;
    if (!textNode) {
      const rect = target.getBoundingClientRect();
      return makeFocusRect(rect.left + 8, rect.top + 4, 2, Math.min(rect.height, 18) || 16);
    }
    const value = textNode.nodeValue || "";
    const safeOffset = Math.max(0, Math.min(offset == null ? value.length : offset, value.length));
    const range = document.createRange();
    if (safeOffset > 0) {
      range.setStart(textNode, safeOffset - 1);
      range.setEnd(textNode, safeOffset);
      const rects = range.getClientRects();
      if (rects.length) {
        const last = rects[rects.length - 1];
        return makeFocusRect(last.right, last.top, 2, Math.max(last.height, 14));
      }
    }
    range.setStart(textNode, safeOffset);
    range.collapse(true);
    return getRangeFocusRect(range);
  }

  function getPhraseClientRect(target, phrase) {
    if (!target || !phrase) return null;
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      const idx = node.nodeValue.indexOf(phrase);
      if (idx === -1) continue;
      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + phrase.length);
      return getRangeFocusRect(range);
    }
    return null;
  }

  function getElementLineFocusRect(element) {
    if (!element) return null;
    const textNode =
      element.firstChild && element.firstChild.nodeType === 3 ? element.firstChild : null;
    if (textNode && textNode.nodeValue) {
      const end = Math.min(Math.max(24, Math.floor(textNode.nodeValue.length * 0.35)), textNode.nodeValue.length);
      const range = document.createRange();
      range.setStart(textNode, 0);
      range.setEnd(textNode, end);
      const rect = getRangeFocusRect(range);
      if (rect) return rect;
    }
    const box = element.getBoundingClientRect();
    // Avoid framing an entire tall paragraph — use a single-line band near the start
    return makeFocusRect(box.left, box.top, box.width, Math.min(box.height, 22));
  }

  /**
   * Resolve the most precise focus geometry available.
   * Accepts HTMLElement | DOMRect-like | Range | prebuilt focus rect.
   */
  function getDemoFocusRect(target) {
    if (!target) return null;

    if (typeof Range !== "undefined" && target instanceof Range) {
      return getRangeFocusRect(target);
    }
    if (target.startContainer && typeof target.collapse === "function") {
      return getRangeFocusRect(target);
    }

    if (
      typeof target.top === "number" &&
      typeof target.left === "number" &&
      !target.nodeType &&
      typeof target.getBoundingClientRect !== "function"
    ) {
      const width = target.width != null ? target.width : target.right - target.left;
      const height = target.height != null ? target.height : target.bottom - target.top;
      return makeFocusRect(target.left, target.top, width, height);
    }

    if (target.nodeType === 1 || (target.getBoundingClientRect && target.nodeType !== 3)) {
      // Priority: live remote caret on this target
      if (
        collaboration.remoteCursor &&
        collaboration.remoteCursor.target === target
      ) {
        const liveOffset =
          typeof collaboration.remoteCursor.offset === "number"
            ? collaboration.remoteCursor.offset
            : (target.textContent || "").length;
        const caret = getCaretClientRect(target, liveOffset);
        if (caret) return caret;
      }
      return getElementLineFocusRect(target);
    }

    return null;
  }

  function resolveCameraLockX(options, scale, preferredX, localX, vp) {
    options = options || {};
    const lockX =
      options.lockX === false
        ? null
        : typeof options.lockX === "number"
          ? options.lockX
          : options.lockX === true || demoCamera.mode === "collaboration-editor"
            ? demoCamera.lockX
            : null;
    if (typeof lockX === "number") return lockX;
    return vp.width * preferredX - localX * scale;
  }

  function isCameraScreenInSafeZone(screenX, screenY, zone) {
    const safe = zone || CAMERA_SAFE_ZONE;
    return (
      screenX >= safe.minX &&
      screenX <= safe.maxX &&
      screenY >= safe.minY &&
      screenY <= safe.maxY
    );
  }

  function computeDemoCameraTransform(focusRect, options) {
    options = options || {};
    const vp = getCameraViewportMetrics();
    const preferredX =
      options.preferredScreenX != null
        ? options.preferredScreenX
        : options.centerX == null
          ? 0.5
          : options.centerX;
    const preferredY =
      options.preferredScreenY != null
        ? options.preferredScreenY
        : options.centerY == null
          ? 0.5
          : options.centerY;
    let scale = options.scale == null ? DEMO_CAMERA_EDIT_SCALE : options.scale;
    if (prefersReducedMotion) scale = Math.min(scale, 1.04);
    scale = clampNumber(scale, 1, DEMO_CAMERA_MAX_SCALE);
    const allowScaleUp = options.allowScaleUp === true || options.maxScale != null;
    const maxScale = clampNumber(
      options.maxScale == null ? Math.max(scale, 1.3) : options.maxScale,
      scale,
      DEMO_CAMERA_MAX_SCALE
    );
    const zone = options.safeZone || CAMERA_SAFE_ZONE;
    const local = clientPointToStageLocal(focusRect.centerX, focusRect.centerY);

    function solveAtScale(s) {
      const desiredX = vp.width * preferredX - local.x * s;
      const desiredY = vp.height * preferredY - local.y * s;
      const x = resolveCameraLockX(options, s, preferredX, local.x, vp);
      const clamped = clampCameraTransform({
        scale: s,
        x: typeof x === "number" ? x : desiredX,
        y: desiredY,
      });
      const screenX = vp.width ? (local.x * clamped.scale + clamped.x) / vp.width : preferredX;
      const screenY = vp.height ? (local.y * clamped.scale + clamped.y) / vp.height : preferredY;
      return {
        scale: clamped.scale,
        x: clamped.x,
        y: clamped.y,
        minX: clamped.bounds.minX,
        minY: clamped.bounds.minY,
        maxX: clamped.bounds.maxX,
        maxY: clamped.bounds.maxY,
        desiredCenterX: vp.width * preferredX,
        desiredCenterY: vp.height * preferredY,
        localX: local.x,
        localY: local.y,
        screenX: screenX,
        screenY: screenY,
        vp: vp,
        stage: clamped.bounds.cover,
      };
    }

    let result = solveAtScale(scale);
    if (allowScaleUp && !prefersReducedMotion && !isCameraScreenInSafeZone(result.screenX, result.screenY, zone)) {
      let s = scale;
      while (s < maxScale - 0.001 && !isCameraScreenInSafeZone(result.screenX, result.screenY, zone)) {
        s = Math.min(maxScale, +(s + 0.04).toFixed(3));
        result = solveAtScale(s);
      }
    }
    return result;
  }

  function applyDemoCameraTransform() {
    paintDemoCameraState({
      scale: demoCamera.scale,
      x: demoCamera.x,
      y: demoCamera.y,
    });
  }

  function setDemoCameraInstant(scale, x, y) {
    cancelDemoCameraAnim();
    paintDemoCameraState({
      scale: scale == null ? 1 : scale,
      x: x || 0,
      y: y || 0,
    });
  }

  function clearDemoCameraDebug() {
    if (!demoCameraDebugEls) return;
    Object.keys(demoCameraDebugEls).forEach(function (key) {
      const el = demoCameraDebugEls[key];
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
    demoCameraDebugEls = null;
  }

  function updateDemoCameraDebug(focusRect, computed) {
    if (!DEMO_CAMERA_DEBUG) {
      clearDemoCameraDebug();
      return;
    }
    if (!demoCameraDebugEls) {
      demoCameraDebugEls = {
        viewport: document.createElement("div"),
        target: document.createElement("div"),
        center: document.createElement("div"),
        label: document.createElement("div"),
      };
      demoCameraDebugEls.viewport.className =
        "wb-demo-camera-debug wb-demo-camera-debug--viewport";
      demoCameraDebugEls.target.className =
        "wb-demo-camera-debug wb-demo-camera-debug--target";
      demoCameraDebugEls.center.className =
        "wb-demo-camera-debug wb-demo-camera-debug--center";
      demoCameraDebugEls.label.className = "wb-demo-camera-debug__label";
      document.body.appendChild(demoCameraDebugEls.viewport);
      document.body.appendChild(demoCameraDebugEls.target);
      document.body.appendChild(demoCameraDebugEls.center);
      document.body.appendChild(demoCameraDebugEls.label);
    }

    const vp = getCameraViewportMetrics();
    demoCameraDebugEls.viewport.style.left = vp.left + "px";
    demoCameraDebugEls.viewport.style.top = vp.top + "px";
    demoCameraDebugEls.viewport.style.width = vp.width + "px";
    demoCameraDebugEls.viewport.style.height = vp.height + "px";

    if (focusRect) {
      demoCameraDebugEls.target.hidden = false;
      demoCameraDebugEls.center.hidden = false;
      demoCameraDebugEls.target.style.left = focusRect.left + "px";
      demoCameraDebugEls.target.style.top = focusRect.top + "px";
      demoCameraDebugEls.target.style.width = focusRect.width + "px";
      demoCameraDebugEls.target.style.height = focusRect.height + "px";
      demoCameraDebugEls.center.style.left = vp.left + (computed ? computed.desiredCenterX : vp.width / 2) + "px";
      demoCameraDebugEls.center.style.top = vp.top + (computed ? computed.desiredCenterY : vp.height / 2) + "px";
    } else {
      demoCameraDebugEls.target.hidden = true;
      demoCameraDebugEls.center.hidden = true;
    }

    demoCameraDebugEls.label.textContent = [
      "scale=" + demoCamera.scale.toFixed(3),
      "x=" + demoCamera.x.toFixed(1) + " y=" + demoCamera.y.toFixed(1),
      computed
        ? "clamp x[" +
          computed.minX.toFixed(1) +
          ",0] y[" +
          computed.minY.toFixed(1) +
          ",0]"
        : "",
      "vp=" + Math.round(vp.width) + "×" + Math.round(vp.height),
    ]
      .filter(Boolean)
      .join("\n");
  }

  function refreshRemoteChromeAfterCamera() {
    updateFollowChip();
  }

  function isCaretInCameraSafeZone(clientX, clientY) {
    const vp = getCameraViewportMetrics();
    if (!vp.width || !vp.height) return true;
    const nx = (clientX - vp.left) / vp.width;
    const ny = (clientY - vp.top) / vp.height;
    return nx >= 0.2 && nx <= 0.8 && ny >= 0.25 && ny <= 0.75;
  }

  /**
   * Soft pan (no zoom change) if the live caret leaves the inner safe zone.
   */
  async function ensureDemoCameraSafeZone(target, offset) {
    if (
      !demoCamera.active ||
      demoCamera.correcting ||
      !demoCamera.cinematic ||
      demoCamera.scale <= 1.02 ||
      !target
    ) {
      return false;
    }
    const caret = getCaretClientRect(target, offset);
    if (!caret) return false;
    if (demoCamera.mode === "collaboration-editor") {
      const vp = getCameraViewportMetrics();
      const ny = vp.height ? (caret.centerY - vp.top) / vp.height : 0.5;
      if (ny >= 0.16 && ny <= 0.84) return false;
    } else if (isCaretInCameraSafeZone(caret.centerX, caret.centerY)) {
      return false;
    }

    demoCamera.correcting = true;
    await focusDemoTarget(caret, {
      scale: demoCamera.scale,
      duration: prefersReducedMotion ? 60 : 280,
      centerX: 0.5,
      centerY: demoCamera.mode === "collaboration-editor" ? 0.48 : 0.5,
      lockX: demoCamera.mode === "collaboration-editor" ? true : undefined,
      element: target,
      offset: offset,
    });
    demoCamera.correcting = false;
    return true;
  }

  async function focusDemoTarget(target, options) {
    options = options || {};
    if (!demoCameraStage || !demoCameraViewport || !target) {
      return false;
    }

    const focusRect = getDemoFocusRect(target);
    if (!focusRect) return false;

    let scale = options.scale == null ? DEMO_CAMERA_EDIT_SCALE : options.scale;
    if (prefersReducedMotion) scale = Math.min(scale, 1.04);
    scale = clampNumber(scale, 1, DEMO_CAMERA_MAX_SCALE);

    const duration = options.instant
      ? 0
      : prefersReducedMotion
        ? 80
        : options.duration == null
          ? 750
          : options.duration;

    document.body.classList.add("wb-demo-camera-active");
    demoCamera.active = true;
    demoCamera.durationMs = duration;

    // Force layout so inverse-transform reads are stable.
    void demoCameraStage.offsetWidth;

    const computed = computeDemoCameraTransform(focusRect, {
      scale: scale,
      minScale: options.minScale,
      maxScale: options.maxScale,
      allowScaleUp: options.allowScaleUp,
      preferredScreenX: options.preferredScreenX,
      preferredScreenY: options.preferredScreenY,
      centerX: options.centerX == null ? 0.5 : options.centerX,
      centerY: options.centerY == null ? 0.5 : options.centerY,
      lockX: options.lockX,
      safeZone: options.safeZone,
    });

    demoCamera.target = focusRect;
    demoCamera.focusElement =
      options.element ||
      (target && target.nodeType === 1 ? target : demoCamera.focusElement);
    if (options.phrase != null) demoCamera.focusPhrase = options.phrase;
    if (options.offset != null) demoCamera.focusOffset = options.offset;

    await animateDemoCameraTo(computed, duration);
    updateDemoCameraDebug(focusRect, computed);

    if (collaboration.abort) return false;
    refreshRemoteChromeAfterCamera();
    const postRect =
      (demoCamera.focusElement && getDemoFocusRect(demoCamera.focusElement)) ||
      (target && target.nodeType === 1 ? getDemoFocusRect(target) : null);
    if (postRect) updateDemoCameraDebug(postRect, computed);
    return true;
  }

  async function resetDemoCamera(options) {
    options = options || {};
    const duration = options.instant
      ? 0
      : prefersReducedMotion
        ? 60
        : options.duration == null
          ? 900
          : options.duration;
    demoCamera.target = null;
    demoCamera.focusElement = null;
    demoCamera.focusPhrase = null;
    demoCamera.focusOffset = null;
    demoCamera.mode = null;
    demoCamera.lockX = null;
    demoCamera.durationMs = duration;
    if (duration > 0) {
      document.body.classList.add("wb-demo-camera-active");
      demoCamera.active = true;
      await animateDemoCameraTo({ scale: 1, x: 0, y: 0 }, duration);
    } else {
      cancelDemoCameraAnim();
      paintDemoCameraState({ scale: 1, x: 0, y: 0 });
    }
    demoCamera.active = false;
    document.body.classList.remove("wb-demo-camera-active");
    cancelDemoCameraAnim();
    paintDemoCameraState({ scale: 1, x: 0, y: 0 });
    clearDemoCameraDebug();
    refreshRemoteChromeAfterCamera();
  }

  function refocusDemoCameraAfterResize() {
    if (!demoCamera.active || !demoCamera.cinematic || demoCamera.scale <= 1.01) return;
    let target = null;
    if (demoCamera.focusPhrase && demoCamera.focusElement) {
      target = getPhraseClientRect(demoCamera.focusElement, demoCamera.focusPhrase);
    }
    if (!target && demoCamera.focusElement && demoCamera.focusOffset != null) {
      target = getCaretClientRect(demoCamera.focusElement, demoCamera.focusOffset);
    }
    if (!target && demoCamera.focusElement) {
      target = demoCamera.focusElement;
    }
    if (!target && collaboration.remoteCursor && collaboration.remoteCursor.target) {
      const live = collaboration.remoteCursor.target;
      const liveOffset =
        typeof collaboration.remoteCursor.offset === "number"
          ? collaboration.remoteCursor.offset
          : (live.textContent || "").length;
      target = getCaretClientRect(live, liveOffset);
    }
    if (!target) return;
    focusDemoTarget(target, {
      scale: demoCamera.scale,
      duration: 0,
      instant: true,
      element: demoCamera.focusElement,
      phrase: demoCamera.focusPhrase,
      offset: demoCamera.focusOffset,
    });
  }

  function scheduleDemoCameraResizeRefocus() {
    if (demoCameraResizeTimer) window.clearTimeout(demoCameraResizeTimer);
    demoCameraResizeTimer = window.setTimeout(function () {
      demoCameraResizeTimer = null;
      refocusDemoCameraAfterResize();
    }, 120);
  }

  function ensureDemoCameraResizeBindings() {
    if (!demoCameraViewport || demoCameraResizeObserver) return;
    if (typeof ResizeObserver !== "undefined") {
      demoCameraResizeObserver = new ResizeObserver(function () {
        scheduleDemoCameraResizeRefocus();
      });
      demoCameraResizeObserver.observe(demoCameraViewport);
      if (app) demoCameraResizeObserver.observe(app);
    }
    window.addEventListener("resize", scheduleDemoCameraResizeRefocus);
  }

  function blockCinematicInteractions(e) {
    if (!demoCamera.cinematic) return;
    // Allow programmatic demo orchestration (untrusted events).
    if (e.isTrusted === false) return;
    if (e.type === "keydown" && e.key === "Escape") return;
    if (e.type === "keydown") {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
  }

  function startCinematicMode() {
    demoCamera.cinematic = true;
    document.body.classList.add("wb-demo-cinematic");
    ensureDemoCameraResizeBindings();
    mountReportOverlaysForDemo(true);
    if (!demoInteractionBlocker) {
      demoInteractionBlocker = function (e) {
        blockCinematicInteractions(e);
      };
      document.addEventListener("pointerdown", demoInteractionBlocker, true);
      document.addEventListener("click", demoInteractionBlocker, true);
      document.addEventListener("keydown", demoInteractionBlocker, true);
    }
  }

  function endCinematicMode() {
    cancelDemoCameraAnim();
    demoCamera.cinematic = false;
    document.body.classList.remove("wb-demo-cinematic");
    mountReportOverlaysForDemo(false);
    if (demoInteractionBlocker) {
      document.removeEventListener("pointerdown", demoInteractionBlocker, true);
      document.removeEventListener("click", demoInteractionBlocker, true);
      document.removeEventListener("keydown", demoInteractionBlocker, true);
      demoInteractionBlocker = null;
    }
  }

  async function cancelCinematicCollaborationDemo() {
    collaboration.abort = true;
    clearCollabTimers();
    endCinematicMode();
    await resetDemoCamera({ instant: true });
    hideRemoteCursor();
    unmountFollowChip();
    setSyncStatus("");
    setPersonPresence("alex", "idle", false);
    setPersonPresence("priya", "idle", false);
    collaboration.demoStatus = "idle";
    collaboration.liveEditSlot = null;
    collaboration.focusTarget = null;
    collaboration.focusPersonId = null;
    collaboration.demoAutoFollow = true;
    collaboration.deferFollowChip = false;
    collaboration.followedPersonId = null;
    collaboration.followTravelActive = false;
    updateDemoButton();
    renderCollabAvatars();
    renderSharePeople();
    collaboration.abort = false;
  }

  function enterCollaborationEditorLock(scale) {
    const body = reportScroll || document.getElementById("wb-report-scroll");
    const useScale = scale == null ? 1.36 : scale;
    demoCamera.mode = null;
    demoCamera.lockX = null;
    if (body && typeof body.getBoundingClientRect === "function") {
      const box = body.getBoundingClientRect();
      const rect = makeFocusRect(box.left, box.top, box.width, Math.max(box.height, 80));
      const computed = computeDemoCameraTransform(rect, {
        scale: useScale,
        centerX: 0.5,
        centerY: 0.48,
        lockX: false,
      });
      demoCamera.lockX = computed.x;
    } else {
      demoCamera.lockX = demoCamera.x;
    }
    demoCamera.mode = "collaboration-editor";
    return demoCamera.lockX;
  }

  /**
   * Shared collaboration camera language for Alex / Priya edit shots.
   * In collaboration-editor mode, X is locked to the Report Editor.
   */
  async function focusCollabEditCamera(target, demo, options) {
    options = options || {};
    if (!target) return false;

    collaboration.programmaticScroll = true;
    if (typeof centerTargetInScrollContainer === "function" && reportScroll) {
      await centerTargetInScrollContainer(target, reportScroll, {
        topInset: 72,
        bottomInset: 48,
        align: 0.48,
        minDuration: options.scrollMs == null ? 900 : Math.min(900, options.scrollMs),
        maxDuration: options.scrollMs == null ? 1300 : options.scrollMs,
      });
    } else {
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
      });
      await collabDelay(prefersReducedMotion ? 40 : options.scrollMs == null ? 420 : options.scrollMs);
    }
    collaboration.programmaticScroll = false;
    unmountFollowChip();
    if (collaboration.abort) return false;

    const phrase = (demo && demo.selectPhrase) || options.phrase || null;
    let focusTarget =
      (phrase && getPhraseClientRect(target, phrase)) ||
      getCaretClientRect(
        target,
        Math.floor(((target.textContent || "").length || 1) * (options.caretRatio == null ? 0.35 : options.caretRatio))
      ) ||
      target;

    const scale =
      options.scale == null
        ? prefersReducedMotion
          ? 1.04
          : 1.36
        : options.scale;
    const lockEditor = demoCamera.mode === "collaboration-editor" || options.lockX === true;

    await focusDemoTarget(focusTarget, {
      scale: scale,
      duration: prefersReducedMotion
        ? 80
        : options.duration == null
          ? 820
          : options.duration,
      centerX: 0.5,
      centerY: options.centerY == null ? 0.48 : options.centerY,
      lockX: lockEditor ? true : options.lockX,
      element: target,
      phrase: phrase,
      offset: options.offset,
    });
    return true;
  }

  async function autoFollowCollabTarget(target, personId, demo) {
    if (!target) return false;
    collaboration.demoAutoFollow = true;
    collaboration.focusTarget = target;
    collaboration.focusPersonId = personId || null;
    await focusCollabEditCamera(target, demo, {
      scale: prefersReducedMotion ? 1.04 : 1.36,
      duration: prefersReducedMotion ? 80 : 700,
      scrollMs: prefersReducedMotion ? 40 : 900,
    });
    await collabDelay(prefersReducedMotion ? 40 : 220);
    return true;
  }

  function abortLiveCollabVisuals() {
    collaboration.typingEpoch += 1;
    collaboration.caretOwnerId = null;
    cancelDemoCameraAnim();
    endCinematicMode();
    demoCamera.mode = null;
    demoCamera.lockX = null;
    setDemoCameraInstant(1, 0, 0);
    document.body.classList.remove("wb-demo-camera-active");
    if (demoCameraStage) {
      demoCameraStage.style.transition = "none";
      demoCameraStage.style.transform = "none";
    }
    demoCamera.active = false;
  }

  function ensureTargetBelowReportViewport(target) {
    if (!target || !reportScroll) return false;
    const rect = target.getBoundingClientRect();
    const view = reportScroll.getBoundingClientRect();
    if (rect.top > view.bottom - 36) return true;
    const extra = view.bottom - rect.top + 72;
    reportScroll.scrollTop = Math.max(0, reportScroll.scrollTop - extra);
    return true;
  }

  function captureFollowFrame(options) {
    options = options || {};
    const scale =
      options.lockScale != null
        ? options.lockScale
        : demoCamera.scale > 1 ? demoCamera.scale : prefersReducedMotion ? 1.06 : 1.3;
    const x =
      typeof options.lockX === "number"
        ? options.lockX
        : typeof demoCamera.x === "number"
          ? demoCamera.x
          : demoCamera.lockX;
    const y =
      typeof options.lockY === "number"
        ? options.lockY
        : typeof demoCamera.y === "number"
          ? demoCamera.y
          : 0;
    const clamped = clampCameraTransform({ scale: scale, x: x, y: y });
    collaboration.followFrame = { scale: clamped.scale, x: clamped.x, y: clamped.y };
    demoCamera.lockX = clamped.x;
    demoCamera.mode = "collaboration-editor";
    paintDemoCameraState(clamped);
    return collaboration.followFrame;
  }

  function lockCollaborationCamera() {
    const frame = collaboration.followFrame;
    if (!frame) return;
    const clamped = clampCameraTransform(frame);
    collaboration.followFrame = { scale: clamped.scale, x: clamped.x, y: clamped.y };
    demoCamera.lockX = clamped.x;
    demoCamera.mode = "collaboration-editor";
    paintDemoCameraState(clamped);
  }

  async function travelToLiveEditor(target) {
    if (!target) return false;
    collaboration.followTravelActive = true;
    try {
      fadeFollowChip();
      const cinematic = !!demoCamera.cinematic;
      if (cinematic) {
        captureFollowFrame({
          lockScale: demoCamera.scale,
          lockX: typeof demoCamera.x === "number" ? demoCamera.x : demoCamera.lockX,
          lockY: demoCamera.y,
        });
        lockCollaborationCamera();
      }
      collaboration.programmaticScroll = true;
      if (reportScroll) {
        await centerTargetInScrollContainer(target, reportScroll, {
          topInset: 8,
          bottomInset: 8,
          align: 0.48,
          minDuration: prefersReducedMotion ? 40 : 900,
          maxDuration: prefersReducedMotion ? 80 : 1300,
          easing: "collab-follow",
        });
      }
      collaboration.programmaticScroll = false;
      if (cinematic) lockCollaborationCamera();
      unmountFollowChip();
      return true;
    } finally {
      collaboration.followTravelActive = false;
    }
  }

  function startFollowTravel(target) {
    if (!target) {
      fadeFollowChip();
      collaboration.followTravel = Promise.resolve(false);
      return collaboration.followTravel;
    }
    if (collaboration.followTravel) return collaboration.followTravel;
    const travel = travelToLiveEditor(target).then(function (ok) {
      if (collaboration.followTravel === travel) {
        collaboration.followTravel = null;
        collaboration.followChipFading = false;
        collaboration.followChipFadePromise = null;
      }
      return ok;
    });
    collaboration.followTravel = travel;
    return travel;
  }

  function awaitFollowTravel() {
    return collaboration.followTravel || Promise.resolve(false);
  }

  async function trackEditorCameraWhile(promise, getFocus, options) {
    options = options || {};
    const frame = collaboration.followFrame || captureFollowFrame(options);
    const scale = options.scale != null ? options.scale : frame.scale;
    const lockX = typeof options.lockX === "number" ? options.lockX : frame.x;
    let running = true;
    promise.then(
      function () {
        running = false;
      },
      function () {
        running = false;
      }
    );
    while (running) {
      if (collaboration.abort) return false;
      const focus = typeof getFocus === "function" ? getFocus() : getFocus;
      if (focus) {
        const focusRect =
          (focus.nodeType === 1 ? getElementLineFocusRect(focus) : null) ||
          (typeof focus.getBoundingClientRect === "function"
            ? makeFocusRect(
                focus.getBoundingClientRect().left,
                focus.getBoundingClientRect().top,
                focus.getBoundingClientRect().width,
                Math.min(focus.getBoundingClientRect().height, 22)
              )
            : null);
        if (focusRect) {
          const computed = computeDemoCameraTransform(focusRect, {
            scale: scale,
            centerX: 0.5,
            centerY: options.centerY == null ? 0.48 : options.centerY,
            lockX: lockX,
          });
          const clamped = clampCameraTransform({
            scale: computed.scale,
            x: typeof lockX === "number" ? lockX : computed.x,
            y: computed.y,
          });
          demoCamera.lockX = clamped.x;
          paintDemoCameraState(clamped);
        }
      }
      await waitAnimationFrame();
    }
    return true;
  }

  async function followRemoteEditor(target, options) {
    options = options || {};
    if (!target) return false;
    if (!collaboration.followFrame || !collaboration.followTravel) {
      captureFollowFrame(options);
    }
    lockCollaborationCamera();
    if (!collaboration.followTravel) {
      startFollowTravel(target);
    }
    await awaitFollowTravel();
    lockCollaborationCamera();
    unmountFollowChip();
    collaboration.followTravel = null;
    collaboration.followChipFading = false;
    collaboration.followChipFadePromise = null;
    if (collaboration.abort) return false;
    if (options.skipSettle) return true;
    const liveScale =
      options.settleScale != null
        ? options.settleScale
        : prefersReducedMotion
          ? 1.08
          : 1.3;
    await focusDemoTarget(target, {
      scale: liveScale,
      duration: prefersReducedMotion ? 40 : 420,
      centerX: 0.5,
      centerY: 0.48,
      lockX: true,
      element: target,
    });
    captureFollowFrame({
      lockScale: demoCamera.scale,
      lockX: demoCamera.x,
      lockY: demoCamera.y,
    });
    return !collaboration.abort;
  }

  function startContinuousRevision(demo, options) {
    options = options || {};
    if (!demo) return Promise.resolve(false);
    if (collaboration.typingJobs[demo.id]) return collaboration.typingJobs[demo.id];
    const target = getCollabTarget(demo.slot);
    if (!target) return Promise.resolve(false);

    collaboration.typingEpoch += 1;
    collaboration.caretOwnerId = demo.id;
    const epoch = collaboration.typingEpoch;
    setPersonPresence(demo.id, "editing", true);
    setRemoteAccent(demo.id);
    collaboration.liveEditSlot = demo.slot;
    collaboration.focusTarget = target;
    collaboration.focusPersonId = demo.id;
    workspace.suppressEditCapture = true;
    if (remoteSelection) remoteSelection.hidden = true;
    applyTypingIndex(target, demo, getDemoTypingIndex(demo), { typing: true });
    if (remoteCursor) remoteCursor.classList.add("is-typing");
    updateFollowChip();
    window.requestAnimationFrame(function () {
      updateFollowChip();
    });

    const job = (async function () {
      await remoteTypingLoop(target, demo, {
        startIndex: getDemoTypingIndex(demo),
        holdCamera: false,
        speed: options.speed,
        epoch: epoch,
      });
      if (collaboration.abort) return false;
      ensureTargetTextNode(target, demo.revised);
      setDemoTypingIndex(demo, demo.revised.length);
      target.setAttribute("data-rev-slot", demo.revSlot);
      target.setAttribute("data-collab-slot", demo.slot);
      await waitAnimationFrame();
      placeRemoteCaretAtOffset(target, demo.revised.length, {
        immediate: true,
        typing: false,
      });
      if (remoteCursor) remoteCursor.classList.remove("is-typing");
      registerCollabRevision(demo, demo.original, demo.revised);
      showLiveAttribution(target, demo.id);
      return true;
    })();
    collaboration.typingJobs[demo.id] = job;
    job.then(
      function () {
        if (collaboration.typingJobs[demo.id] === job) {
          collaboration.typingJobs[demo.id] = null;
        }
      },
      function () {
        if (collaboration.typingJobs[demo.id] === job) {
          collaboration.typingJobs[demo.id] = null;
        }
      }
    );
    return job;
  }

  function awaitContinuousRevision(demo) {
    if (!demo) return Promise.resolve(false);
    return collaboration.typingJobs[demo.id] || Promise.resolve(true);
  }

  async function prepareLiveSession() {
    if (collaboration.demoStatus === "running") return false;
    collaboration.abort = false;
    clearCollabTimers();
    resetCollabDemoParagraphs();
    hideRemoteCursor();
    ensureRemoteLayerInReport();
    if (presencePopover) presencePopover.hidden = true;
    closeSharePopover();

    ensureAccess("alex", "edit");
    ensureAccess("priya", "edit");
    setPersonPresence("alex", "viewing", true);
    setPersonPresence("priya", "viewing", true);
    if (findCollabPerson("daniel")) {
      setPersonPresence("daniel", "viewing", true);
    }
    collaboration.demoStatus = "running";
    collaboration.liveEditSlot = null;
    collaboration.demoAutoFollow = false;
    collaboration.focusTarget = null;
    collaboration.focusPersonId = null;
    collaboration.followTravel = null;
    collaboration.followTravelActive = false;
    collaboration.typingJobs = {};
    collaboration.followFrame = null;
    collaboration.followChipFading = false;
    collaboration.followChipFadePromise = null;
    collaboration.deferFollowChip = false;
    collaboration.followedPersonId = null;
    updateDemoButton();
    renderCollabAvatars();
    renderSharePeople();

    if (!demoCamera.cinematic) startCinematicMode();
    document.body.classList.add("wb-demo-camera-active");
    demoCamera.active = true;

    const alexTarget = getAlexTarget();
    if (alexTarget) ensureTargetBelowReportViewport(alexTarget);
    syncFollowLayer();
    return true;
  }

  function startAlexTyping() {
    return startContinuousRevision(ALEX_DEMO, { speed: 1.38 });
  }

  function startPriyaTyping() {
    setPersonPresence("alex", "viewing", true);
    return startContinuousRevision(PRIYA_DEMO);
  }

  async function beginAlexOffscreenEdit() {
    startAlexTyping();
    await waitAnimationFrame();
    updateFollowChip();
    return true;
  }

  async function accompanyAlexFollow(options) {
    const target = getAlexTarget();
    if (!target) return false;
    return followRemoteEditor(target, options || {});
  }

  async function finishAlexVisibleEdit() {
    return awaitContinuousRevision(ALEX_DEMO);
  }

  async function beginPriyaOffscreenEdit() {
    setPersonPresence("alex", "viewing", true);
    startPriyaTyping();
    await waitAnimationFrame();
    updateFollowChip();
    return true;
  }

  async function accompanyPriyaFollow(options) {
    const target = getPriyaTarget();
    if (!target) return false;
    return followRemoteEditor(target, options || {});
  }

  async function finishPriyaVisibleEdit() {
    return awaitContinuousRevision(PRIYA_DEMO);
  }

  async function runPriyaLiveSequence() {
    await beginPriyaOffscreenEdit();
    await collabDelay(prefersReducedMotion ? 60 : 400);
    if (collaboration.abort) return false;
    await accompanyPriyaFollow();
    if (collaboration.abort) return false;
    return finishPriyaVisibleEdit();
  }

  async function completeLiveSession() {
    setPersonPresence("priya", "viewing", true);
    hideRemoteCursor();
    collaboration.focusTarget = null;
    collaboration.focusPersonId = null;
    updateFollowChip();

    demoCamera.mode = null;
    await resetDemoCamera({ duration: prefersReducedMotion ? 80 : 800 });
    if (collaboration.abort) {
      abortLiveCollabVisuals();
      return false;
    }

    setPersonPresence("alex", "viewing", true);
    setPersonPresence("priya", "viewing", true);
    if (findCollabPerson("daniel")) {
      setPersonPresence("daniel", "viewing", true);
    }
    collaboration.demoStatus = "complete";
    workspace.suppressEditCapture = false;
    updateDemoButton();
    renderCollabAvatars();
    renderSharePeople();
    endCinematicMode();
    return true;
  }

  async function runLiveCollaborationEdits() {
    if (collaboration.demoStatus === "running") return;
    const prepared = await prepareLiveSession();
    if (!prepared) return;
    const alexTyping = startAlexTyping();
    await collabDelay(prefersReducedMotion ? 60 : 400);
    if (collaboration.abort) {
      abortLiveCollabVisuals();
      return;
    }
    await accompanyAlexFollow();
    if (collaboration.abort) {
      abortLiveCollabVisuals();
      return;
    }
    await alexTyping;
    if (collaboration.abort) {
      abortLiveCollabVisuals();
      return;
    }
    await collabDelay(prefersReducedMotion ? 80 : 450);
    if (collaboration.abort) {
      abortLiveCollabVisuals();
      return;
    }
    const priyaTyping = startPriyaTyping();
    await collabDelay(prefersReducedMotion ? 60 : 400);
    if (collaboration.abort) {
      abortLiveCollabVisuals();
      return;
    }
    await accompanyPriyaFollow();
    if (collaboration.abort) {
      abortLiveCollabVisuals();
      return;
    }
    await priyaTyping;
    if (collaboration.abort) {
      abortLiveCollabVisuals();
      return;
    }
    await collabDelay(prefersReducedMotion ? 80 : 550);
    await completeLiveSession();
  }

  async function runCollaborationDemo() {
    return runLiveCollaborationEdits();
  }



  function restartCollaborationDemo() {
    collaboration.abort = true;
    clearCollabTimers();
    endCinematicMode();
    setDemoCameraInstant(1, 0, 0);
    document.body.classList.remove("wb-demo-camera-active");
    if (demoCameraStage) {
      demoCameraStage.style.transition = "none";
      demoCameraStage.style.transform = "none";
    }
    demoCamera.active = false;
    demoCamera.target = null;
    resetCollabDemoParagraphs();
    hideRemoteCursor();
    unmountFollowChip();
    setSyncStatus("");
    collaboration.peopleWithAccess.forEach(function (p) {
      if (p.id === "long") return;
      p.active = false;
      p.presence = "idle";
    });
    collaboration.demoStatus = "idle";
    collaboration.liveEditSlot = null;
    collaboration.demoAutoFollow = true;
    collaboration.focusTarget = null;
    collaboration.focusPersonId = null;
    updateDemoButton();
    renderCollabAvatars();
    renderSharePeople();
    window.setTimeout(function () {
      collaboration.abort = false;
      runCollaborationDemo();
    }, 40);
  }

  function resetCollaborationPeopleToOwner() {
    collaboration.peopleWithAccess = [
      {
        id: "long",
        name: "Long",
        initials: "LG",
        accent: "owner",
        permission: "owner",
        presence: "idle",
        active: false,
      },
    ];
    hideRemoteCursor();
    if (presencePopover) presencePopover.hidden = true;
    clearPendingShareAdd();
    renderCollabAvatars();
    renderSharePeople();
  }

  function resetCollaborationState() {
    collaboration.abort = true;
    clearCollabTimers();
    collaboration.demoStatus = "idle";
    collaboration.liveEditSlot = null;
    collaboration.demoVersionLabels = [];
    collaboration.peopleWithAccess = [
      {
        id: "long",
        name: "Long",
        initials: "LG",
        accent: "owner",
        permission: "owner",
        presence: "idle",
        active: false,
      },
    ];
    clearLiveAttribution();
    hideRemoteCursor();
    setSyncStatus("");
    if (presencePopover) presencePopover.hidden = true;
    closeSharePopover();
    if (shareAddInput) shareAddInput.value = "";
    if (shareSuggestions) shareSuggestions.hidden = true;
    clearPendingShareAdd();
    if (shareToast) shareToast.hidden = true;
    if (showEditsBtn) showEditsBtn.classList.remove("is-attention");
    collaboration.generalAccess = "restricted";
    collaboration.demoAutoFollow = true;
    collaboration.focusTarget = null;
    collaboration.focusPersonId = null;
    collaboration.alexTypingIndex = 0;
    collaboration.priyaTypingIndex = 0;
    collaboration.typingEpoch += 1;
    collaboration.caretOwnerId = null;
    collaboration.followTravel = null;
    collaboration.followTravelActive = false;
    collaboration.typingJobs = {};
    collaboration.followFrame = null;
    collaboration.followChipFading = false;
    collaboration.followChipFadePromise = null;
    collaboration.deferFollowChip = false;
    collaboration.followedPersonId = null;
    resetCollabDemoParagraphs();
    unmountFollowChip();
    collaboration.abort = false;
    updateDemoButton();
    renderCollabAvatars();
    renderSharePeople();
  }

  function openPresencePopover(personId, anchor) {
    const person = findCollabPerson(personId);
    if (!person || !presencePopover || !anchor) return;
    const canFollow =
      collaboration.remoteCursor &&
      collaboration.remoteCursor.target &&
      (collaboration.remoteCursor.personId === person.id ||
        person.presence === "editing");
    const first = person.name.split(" ")[0];
    presencePopover.hidden = false;
    presencePopover.innerHTML =
      '<p class="wb-presence-popover__name">' +
      escapeHtml(person.name) +
      "</p>" +
      '<p class="wb-presence-popover__status">' +
      escapeHtml(presenceLabel(person.presence)) +
      " this report</p>" +
      '<p class="wb-presence-popover__perm">' +
      escapeHtml(permissionLabel(person.permission)) +
      "</p>" +
      (canFollow
        ? '<button type="button" class="wb-btn wb-btn--ghost wb-presence-popover__follow" id="wb-follow-person">Follow ' +
          escapeHtml(first) +
          "</button>"
        : "");
    const rect = anchor.getBoundingClientRect();
    presencePopover.style.top = Math.round(rect.bottom + 8) + "px";
    presencePopover.style.left = Math.round(Math.max(12, rect.left - 40)) + "px";
    refreshIcons();
    const follow = document.getElementById("wb-follow-person");
    if (follow) {
      follow.addEventListener("click", function () {
        followCollaborator(person.id);
      });
    }
  }

  function renderShareSuggestions(query) {
    if (!shareSuggestions) return;
    const q = (query || "").trim().toLowerCase();
    if (!q) {
      shareSuggestions.hidden = true;
      shareSuggestions.innerHTML = "";
      return;
    }
    const matches = COLLAB_DIRECTORY.filter(function (person) {
      const already = findCollabPerson(person.id);
      if (already) return false;
      return (
        person.name.toLowerCase().indexOf(q) !== -1 ||
        person.initials.toLowerCase().indexOf(q) !== -1
      );
    });
    if (!matches.length) {
      shareSuggestions.hidden = true;
      shareSuggestions.innerHTML = "";
      return;
    }
    shareSuggestions.hidden = false;
    shareSuggestions.innerHTML = matches
      .map(function (person) {
        return (
          '<li><button type="button" class="wb-share-suggestion" data-add-id="' +
          person.id +
          '">' +
          '<span class="wb-collab-avatar wb-collab-avatar--' +
          person.accent +
          '" aria-hidden="true">' +
          escapeHtml(person.initials) +
          "</span>" +
          escapeHtml(person.name) +
          "</button></li>"
        );
      })
      .join("");
  }

  function addPersonById(id, permission) {
    const dir = COLLAB_DIRECTORY.find(function (p) {
      return p.id === id;
    });
    if (!dir || findCollabPerson(id)) return null;
    const nextPermission =
      permission === "edit" || permission === "view" ? permission : "edit";
    const person = {
      id: dir.id,
      name: dir.name,
      initials: dir.initials,
      accent: dir.accent,
      permission: nextPermission,
      presence: "idle",
      active: false,
    };
    collaboration.peopleWithAccess.push(person);
    renderSharePeople();
    renderCollabAvatars();
    if (shareAddInput) shareAddInput.value = "";
    if (shareSuggestions) {
      shareSuggestions.hidden = true;
      shareSuggestions.innerHTML = "";
    }
    if (!demoCamera.cinematic) {
      showShareToast(
        dir.name +
          " now has " +
          (nextPermission === "edit" ? "edit" : "view") +
          " access"
      );
    }
    return person;
  }

  function refreshIcons() {
    if (typeof lucide !== "undefined") {
      lucide.createIcons({ attrs: { "stroke-width": 1.75 } });
    }
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      const id = window.setTimeout(resolve, prefersReducedMotion ? Math.min(ms, 40) : ms);
      workspace.timers.push(id);
    });
  }

  function clearTimers() {
    workspace.timers.forEach(function (id) {
      window.clearTimeout(id);
    });
    workspace.timers = [];
  }

  function setDocumentsNavActive() {
    navItems.forEach(function (n) {
      const label = (n.textContent || "").trim();
      const isDocs = label === "Documents";
      n.classList.toggle("is-active", isDocs);
      if (isDocs) n.setAttribute("aria-current", "page");
      else n.removeAttribute("aria-current");
    });
  }

  function clearNavActive() {
    navItems.forEach(function (n) {
      n.classList.remove("is-active");
      n.removeAttribute("aria-current");
    });
  }

  function renderVersions() {
    if (!versionsList) return;
    versionsList.innerHTML = workspace.versions
      .map(function (v) {
        return (
          "<li>" +
          '<span class="wb-versions-list__title">Version ' +
          v.n +
          "</span>" +
          '<span class="wb-versions-list__meta">' +
          v.label +
          "</span>" +
          "</li>"
        );
      })
      .join("");
  }

  function addVersion(label) {
    workspace.reportVersion += 1;
    workspace.versions.unshift({
      n: workspace.reportVersion,
      label: label,
    });
    renderVersions();
  }

  function plainTextFromHtml(html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html || "";
    return (tmp.textContent || "").replace(/\s+/g, " ").trim();
  }

  function tokenizeWords(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .trim()
      .split(/(\s+)/)
      .filter(function (t) {
        return t.length;
      });
  }

  function wordDiffTokens(originalText, revisedText) {
    const a = tokenizeWords(originalText).filter(function (t) {
      return !/^\s+$/.test(t);
    });
    const b = tokenizeWords(revisedText).filter(function (t) {
      return !/^\s+$/.test(t);
    });
    const n = a.length;
    const m = b.length;
    const dp = [];
    for (let i = 0; i <= n; i++) {
      dp[i] = new Array(m + 1);
      dp[i][0] = 0;
    }
    for (let j = 0; j <= m; j++) dp[0][j] = 0;
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
        else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
    const ops = [];
    let i = n;
    let j = m;
    while (i > 0 && j > 0) {
      if (a[i - 1] === b[j - 1]) {
        ops.unshift({ type: "equal", text: a[i - 1] });
        i--;
        j--;
      } else if (dp[i - 1][j] >= dp[i][j - 1]) {
        ops.unshift({ type: "delete", text: a[i - 1] });
        i--;
      } else {
        ops.unshift({ type: "insert", text: b[j - 1] });
        j--;
      }
    }
    while (i > 0) {
      ops.unshift({ type: "delete", text: a[i - 1] });
      i--;
    }
    while (j > 0) {
      ops.unshift({ type: "insert", text: b[j - 1] });
      j--;
    }
    return ops;
  }

  function inferChanges(originalText, revisedText) {
    const ops = wordDiffTokens(originalText, revisedText);
    const changes = [];
    let i = 0;
    while (i < ops.length) {
      if (ops[i].type === "equal") {
        i++;
        continue;
      }
      const deleted = [];
      const inserted = [];
      while (i < ops.length && ops[i].type !== "equal") {
        if (ops[i].type === "delete") deleted.push(ops[i].text);
        if (ops[i].type === "insert") inserted.push(ops[i].text);
        i++;
      }
      if (deleted.length && inserted.length) {
        changes.push({
          type: "replace",
          original: deleted.join(" "),
          revised: inserted.join(" "),
        });
      } else if (deleted.length) {
        changes.push({ type: "delete", original: deleted.join(" "), revised: "" });
      } else if (inserted.length) {
        changes.push({ type: "insert", original: "", revised: inserted.join(" ") });
      }
    }
    return changes;
  }

  function isHeavyRewrite(originalText, revisedText) {
    const ops = wordDiffTokens(originalText, revisedText);
    if (!ops.length) return false;
    let equal = 0;
    let changed = 0;
    ops.forEach(function (op) {
      if (op.type === "equal") equal += 1;
      else changed += 1;
    });
    return changed > equal * 1.4 || equal / ops.length < 0.35;
  }

  function renderDiffHtml(originalText, revisedText, mode) {
    if (isHeavyRewrite(originalText, revisedText)) {
      if (mode === "before") {
        return (
          '<span class="wb-rev-heavy-before">' +
          escapeHtml(originalText) +
          "</span>"
        );
      }
      return (
        '<span class="wb-rev-heavy-after">' + escapeHtml(revisedText) + "</span>"
      );
    }
    const ops = wordDiffTokens(originalText, revisedText);
    return ops
      .map(function (op) {
        const t = escapeHtml(op.text);
        if (mode === "before") {
          if (op.type === "insert") return "";
          if (op.type === "delete") return '<del class="wb-rev-del">' + t + "</del>";
          return t;
        }
        if (op.type === "delete") return "";
        if (op.type === "insert") return '<ins class="wb-rev-ins-mark">' + t + "</ins>";
        return t;
      })
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatRevTime(ts) {
    const d = new Date(ts || Date.now());
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return sameDay ? "Today, " + time : d.toLocaleDateString([], { month: "short", day: "numeric" }) + ", " + time;
  }

  function createRevision(opts) {
    workspace.revisionSeq += 1;
    const originalText = opts.originalText || "";
    const revisedText = opts.revisedText || "";
    const rev = {
      id: "rev-" + workspace.revisionSeq,
      sectionId: opts.sectionId || null,
      slot: opts.slot || null,
      author: opts.author || "Long",
      authorType: opts.authorType || "user",
      authorId: opts.authorId || getPersonProfile(opts.author || "Long").id,
      timestamp: opts.timestamp || Date.now(),
      originalText: originalText,
      revisedText: revisedText,
      changes: opts.changes || inferChanges(originalText, revisedText),
      status: opts.status || "pending",
      highlightPhrase: opts.highlightPhrase || null,
      expanded: opts.expanded === true,
      versionLabel: opts.versionLabel || null,
    };
    workspace.revisions.push(rev);
    return rev;
  }

  function pendingRevisions() {
    return workspace.revisions.filter(function (r) {
      return r.status === "pending";
    });
  }

  function findRevisionTarget(rev) {
    if (!reportDoc) return null;
    if (rev.slot) {
      return reportDoc.querySelector('[data-rev-slot="' + rev.slot + '"]');
    }
    if (rev.sectionId) {
      return document.getElementById(rev.sectionId);
    }
    return null;
  }

  function wrapInsertedPhrase(el, phrase) {
    if (!el || !phrase) return;
    const needle = phrase.trim();
    if (!needle) return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement || node.parentElement.closest(".wb-cite, .wb-rev-detail")) continue;
      const idx = node.nodeValue.indexOf(needle);
      if (idx === -1) continue;
      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + needle.length);
      const span = document.createElement("span");
      span.className = "wb-rev-ins";
      range.surroundContents(span);
      return;
    }
  }

  function clearInlineRevisionMarks(root) {
    if (!root) return;
    root.querySelectorAll(".wb-rev-ins").forEach(function (span) {
      const parent = span.parentNode;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
      parent.normalize();
    });
  }

  function buildRevisionDetail(rev, expanded) {
    const person = getPersonProfile(rev.authorId || rev.author);
    const detail = document.createElement("div");
    detail.className = "wb-rev-detail" + (expanded ? " is-expanded" : "");
    detail.setAttribute("data-revision-id", rev.id);
    detail.innerHTML =
      '<div class="wb-rev-detail__header">' +
      '<button type="button" class="wb-rev-detail__summary" aria-expanded="' +
      (expanded ? "true" : "false") +
      '">' +
      personAvatarHtml(person, "wb-collab-avatar--sm") +
      '<span class="wb-rev-detail__identity">' +
      '<span class="wb-rev-detail__name">' +
      escapeHtml(person.name) +
      "</span>" +
      '<span class="wb-rev-detail__sub">Edited · ' +
      escapeHtml(formatRevTime(rev.timestamp)) +
      "</span></span>" +
      '<span class="wb-rev-detail__chevron" aria-hidden="true">' +
      '<i data-lucide="' +
      (expanded ? "chevron-up" : "chevron-down") +
      '"></i></span>' +
      "</button>" +
      '<div class="wb-rev-detail__actions"' +
      (expanded ? "" : " hidden") +
      ">" +
      '<button type="button" class="wb-btn wb-btn--ghost wb-rev-detail__action" data-rev-action="revert">Revert</button>' +
      '<button type="button" class="wb-btn wb-btn--ghost wb-rev-detail__action" data-rev-action="accept">Accept</button>' +
      "</div></div>" +
      '<div class="wb-rev-detail__body"' +
      (expanded ? "" : " hidden") +
      ">" +
      '<div class="wb-rev-detail__block"><span class="wb-rev-detail__label">Before</span>' +
      '<p class="wb-rev-detail__text">' +
      renderDiffHtml(rev.originalText, rev.revisedText, "before") +
      "</p></div>" +
      '<div class="wb-rev-detail__block"><span class="wb-rev-detail__label">After</span>' +
      '<p class="wb-rev-detail__text">' +
      renderDiffHtml(rev.originalText, rev.revisedText, "after") +
      "</p></div></div>";
    return detail;
  }

  function unwrapRevisionUnit(unit) {
    if (!unit || !unit.parentNode) return;
    if (unit.classList.contains("wb-rev-unit--li")) {
      clearInlineRevisionMarks(unit);
      const detail = unit.querySelector(".wb-rev-detail");
      const bar = unit.querySelector(".wb-rev-bar");
      if (detail) detail.remove();
      if (bar) bar.remove();
      unit.classList.remove("wb-rev-unit", "wb-rev-unit--li", "is-expanded");
      unit.removeAttribute("data-revision-id");
      return;
    }
    const main = unit.querySelector(".wb-rev-main");
    const host = unit.parentNode;
    if (!main) {
      host.removeChild(unit);
      return;
    }
    while (main.firstChild) {
      const child = main.firstChild;
      if (child.classList && child.classList.contains("wb-rev-detail")) {
        main.removeChild(child);
        continue;
      }
      clearInlineRevisionMarks(child);
      host.insertBefore(child, unit);
    }
    host.removeChild(unit);
  }

  function clearShowEditsMarkup() {
    if (!reportDoc) return;
    workspace.suppressEditCapture = true;
    reportDoc.querySelectorAll(".wb-rev-unit").forEach(unwrapRevisionUnit);
    reportDoc.querySelectorAll(".wb-rev-ins").forEach(function (span) {
      const parent = span.parentNode;
      if (!parent) return;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
      parent.normalize();
    });
    const empty = document.getElementById("wb-edits-empty");
    if (empty && empty.parentNode) empty.parentNode.removeChild(empty);
    reportDoc.classList.remove("is-showing-edits");
    workspace.suppressEditCapture = false;
  }

  function applyShowEditsMarkup(opts) {
    if (!reportDoc) return;
    clearShowEditsMarkup();
    workspace.suppressEditCapture = true;
    reportDoc.classList.add("is-showing-edits");

    const pending = pendingRevisions();
    if (!pending.length) {
      const empty = document.createElement("p");
      empty.id = "wb-edits-empty";
      empty.className = "wb-edits-empty";
      empty.textContent = "No tracked edits yet.";
      reportDoc.insertBefore(empty, reportDoc.firstChild);
      workspace.suppressEditCapture = false;
      refreshIcons();
      return;
    }

    const animateId = opts && opts.animateId;
    pending.forEach(function (rev) {
      const target = findRevisionTarget(rev);
      if (!target || target.closest(".wb-rev-unit")) return;
      if (
        collaboration.liveEditSlot &&
        target.getAttribute("data-collab-slot") === collaboration.liveEditSlot
      ) {
        return;
      }

      const expanded = rev.expanded === true;

      const bar = document.createElement("button");
      bar.type = "button";
      bar.className = "wb-rev-bar";
      bar.setAttribute("aria-label", "Toggle revision details");

      if (target.tagName === "LI") {
        target.classList.add("wb-rev-unit", "wb-rev-unit--li");
        if (expanded) target.classList.add("is-expanded");
        if (animateId && rev.id === animateId) target.classList.add("is-entering");
        target.setAttribute("data-revision-id", rev.id);
        target.insertBefore(bar, target.firstChild);
        if (rev.highlightPhrase) wrapInsertedPhrase(target, rev.highlightPhrase);
        else {
          const firstInsert = (rev.changes || []).find(function (c) {
            return c.type === "insert" || c.type === "replace";
          });
          if (firstInsert && firstInsert.revised) {
            wrapInsertedPhrase(target, firstInsert.revised.split(/\s+/).slice(0, 8).join(" "));
          }
        }
        target.appendChild(buildRevisionDetail(rev, expanded));
        return;
      }

      const unit = document.createElement("div");
      unit.className =
        "wb-rev-unit" +
        (expanded ? " is-expanded" : "") +
        (animateId && rev.id === animateId ? " is-entering" : "");
      unit.setAttribute("data-revision-id", rev.id);

      const main = document.createElement("div");
      main.className = "wb-rev-main";

      const parent = target.parentNode;
      parent.insertBefore(unit, target);
      main.appendChild(target);
      unit.appendChild(bar);
      unit.appendChild(main);

      if (rev.highlightPhrase) wrapInsertedPhrase(target, rev.highlightPhrase);
      else {
        const firstInsert = (rev.changes || []).find(function (c) {
          return c.type === "insert" || c.type === "replace";
        });
        if (firstInsert && firstInsert.revised) {
          const words = firstInsert.revised.split(/\s+/).slice(0, 8).join(" ");
          wrapInsertedPhrase(target, words);
        }
      }

      main.appendChild(buildRevisionDetail(rev, expanded));
    });

    workspace.suppressEditCapture = false;
    refreshIcons();
  }

  function setShowEdits(on) {
    workspace.showEdits = !!on;
    if (showEditsBtn) {
      showEditsBtn.setAttribute("aria-pressed", on ? "true" : "false");
      showEditsBtn.classList.toggle("is-active", !!on);
      showEditsBtn.title = on ? "Hide edits" : "Show edits";
      const label = showEditsBtn.querySelector("span");
      if (label) label.textContent = on ? "Hide edits" : "Show edits";
    }
    if (on) {
      pendingRevisions().forEach(function (rev) {
        rev.expanded = true;
      });
      applyShowEditsMarkup();
    } else {
      clearShowEditsMarkup();
    }
    refreshIcons();
    window.requestAnimationFrame(repositionCommentUi);
    if (workspace.activePromptTraceId) {
      renderActivePromptTrace({ scroll: false, enter: false });
    }
  }

  function toggleRevisionExpanded(revId) {
    const rev = workspace.revisions.find(function (r) {
      return r.id === revId;
    });
    if (!rev || rev.status !== "pending") return;
    rev.expanded = !rev.expanded;
    if (!workspace.showEdits) return;
    const unit = reportDoc && reportDoc.querySelector('.wb-rev-unit[data-revision-id="' + revId + '"]');
    if (!unit) return;
    const detail = unit.querySelector(".wb-rev-detail");
    const body = unit.querySelector(".wb-rev-detail__body");
    const actions = unit.querySelector(".wb-rev-detail__actions");
    const summary = unit.querySelector(".wb-rev-detail__summary");
    unit.classList.toggle("is-expanded", rev.expanded);
    if (detail) detail.classList.toggle("is-expanded", rev.expanded);
    if (body) body.hidden = !rev.expanded;
    if (actions) actions.hidden = !rev.expanded;
    if (summary) summary.setAttribute("aria-expanded", rev.expanded ? "true" : "false");
    if (summary) {
      const chevron = summary.querySelector(".wb-rev-detail__chevron i, .wb-rev-detail__chevron svg");
      if (chevron && chevron.setAttribute) {
        chevron.setAttribute("data-lucide", rev.expanded ? "chevron-up" : "chevron-down");
      }
    }
    refreshIcons();
    if (rev.expanded && unit) {
      unit.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest" });
    }
  }

  function wrapPhraseWithClass(el, phrase, className) {
    if (!el || !phrase) return null;
    const needle = String(phrase).trim();
    if (!needle) return null;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement || node.parentElement.closest(".wb-cite, .wb-rev-detail, .wb-comment-marker")) {
        continue;
      }
      const idx = node.nodeValue.indexOf(needle);
      if (idx === -1) continue;
      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + needle.length);
      const mark = document.createElement("mark");
      mark.className = className;
      try {
        range.surroundContents(mark);
        return mark;
      } catch (err) {
        return null;
      }
    }
    return null;
  }

  function clearResolvedChangeEmphasis(el) {
    if (!el || !el.parentNode) return;
    el.classList.remove("is-on", "wb-resolved-change");
    if (el.classList.contains("wb-resolved-change-mark")) {
      unwrapMarkPreserveChildren(el);
    }
  }

  function playResolvedChangeEmphasis(el) {
    if (!el) return;
    el.classList.add("wb-resolved-change");
    if (prefersReducedMotion) {
      el.classList.add("is-on");
      window.setTimeout(function () {
        clearResolvedChangeEmphasis(el);
      }, 500);
      return;
    }
    window.requestAnimationFrame(function () {
      el.classList.add("is-on");
      window.setTimeout(function () {
        el.classList.remove("is-on");
        window.setTimeout(function () {
          clearResolvedChangeEmphasis(el);
        }, 350);
      }, 500);
    });
  }

  function emphasizeResolvedRevision(rev, kind) {
    if (!rev) return;
    const el = findRevisionTarget(rev);
    if (!el) return;
    const phrase =
      kind === "revert"
        ? String(rev.originalText || "").trim().split(". ")[0]
        : rev.highlightPhrase || "";
    const mark = wrapPhraseWithClass(el, phrase, "wb-resolved-change-mark wb-resolved-change");
    playResolvedChangeEmphasis(mark || el);
  }

  function acceptRevision(revId) {
    const rev = workspace.revisions.find(function (r) {
      return r.id === revId;
    });
    if (!rev || rev.status !== "pending") return;
    rev.status = "accepted";
    if (workspace.showEdits) {
      const unit = reportDoc && reportDoc.querySelector('.wb-rev-unit[data-revision-id="' + revId + '"]');
      if (unit) unwrapRevisionUnit(unit);
      if (!pendingRevisions().length) applyShowEditsMarkup();
    }
    window.requestAnimationFrame(function () {
      emphasizeResolvedRevision(rev, "accept");
    });
  }

  function revertRevision(revId) {
    const rev = workspace.revisions.find(function (r) {
      return r.id === revId;
    });
    if (!rev || rev.status !== "pending") return;
    workspace.suppressEditCapture = true;
    const unit = reportDoc && reportDoc.querySelector('.wb-rev-unit[data-revision-id="' + revId + '"]');
    if (unit) unwrapRevisionUnit(unit);
    const el = findRevisionTarget(rev);
    if (el) {
      if (rev.restoreSiblings && rev.originalHtml) {
        const block = el.closest(".wb-doc-block") || el.parentElement;
        const exec = document.getElementById("wb-section-exec");
        Array.prototype.slice.call(block.children).forEach(function (node) {
          if (node !== exec && node.tagName !== "H2") block.removeChild(node);
        });
        const temp = document.createElement("div");
        temp.innerHTML = rev.originalHtml;
        while (temp.firstChild) block.appendChild(temp.firstChild);
      } else if (rev.originalHtml) {
        el.innerHTML = rev.originalHtml;
      } else {
        el.textContent = rev.originalText;
      }
      refreshIcons();
    }
    rev.status = "reverted";
    rev.revisedText = rev.originalText;
    addVersion(
      rev.authorType === "collaborator"
        ? "Reverted collaborator edit"
        : "Reverted edit by " + (rev.author || "Long")
    );
    workspace.suppressEditCapture = false;
    if (workspace.showEdits) applyShowEditsMarkup();
    window.requestAnimationFrame(function () {
      emphasizeResolvedRevision(rev, "revert");
    });
  }

  const DEMO_REVISION_SEEDS = [
    {
      slot: "rev-alex-tofa",
      authorId: "alex",
      author: "Alex Morgan",
      authorType: "collaborator",
      versionLabel: "TOFA assessment refined by Alex Morgan",
      originalText:
        "On the facts provided, the arrangement may have TOFA implications. Material open points remain around elections, timing methods, foreign exchange exposure, and systems readiness. The sections below summarise the key considerations, risks, and recommended next steps for review with tax and finance stakeholders.",
      revisedText:
        "On the facts provided, the arrangement may require assessment under the TOFA framework. Material open points remain around elections, timing methods, foreign exchange exposure, and systems readiness. The sections below summarise the key considerations, risks, and recommended next steps for review with tax and finance stakeholders.",
      highlightPhrase: "may require assessment under the TOFA framework",
      timestampOffset: -42 * 60000,
    },
    {
      slot: "rev-daniel-date",
      authorId: "daniel",
      author: "Daniel Wong",
      authorType: "collaborator",
      versionLabel: "Implementation date updated by Daniel Wong",
      originalText:
        "The arrangement is expected to involve contractual rights and obligations to receive or provide cash or a cash equivalent over time. The commercial objective appears to include funding, risk management, or return enhancement. The transaction is expected to complete in June. Exact instrument terms, counterparties, and cash-flow profiles remain to be confirmed.",
      revisedText:
        "The arrangement is expected to involve contractual rights and obligations to receive or provide cash or a cash equivalent over time. The commercial objective appears to include funding, risk management, or return enhancement. The transaction is expected to complete by 30 June 2026. Exact instrument terms, counterparties, and cash-flow profiles remain to be confirmed.",
      highlightPhrase: "by 30 June 2026",
      timestampOffset: -36 * 60000,
    },
    {
      slot: "rev-alex-entity",
      authorId: "alex",
      author: "Alex Morgan",
      authorType: "collaborator",
      versionLabel: "Entity background rewritten by Alex Morgan",
      originalText:
        "The draft assumes an Australian-resident company (or Australian tax consolidated group) considering a financing or treasury arrangement with both domestic and cross-border features. Final advice should confirm the entity’s residency, grouping, and accounting framework.",
      revisedText:
        "The draft assumes an Australian-resident company or tax consolidated group entering a financing or treasury arrangement with both domestic and cross-border features. Final advice should confirm residency, grouping, accounting framework and the commercial purpose of the arrangement before classification is locked.",
      highlightPhrase:
        "confirm residency, grouping, accounting framework and the commercial purpose of the arrangement before classification is locked",
      timestampOffset: -30 * 60000,
    },
    {
      slot: "rev-priya-framework",
      authorId: "priya",
      author: "Priya Shah",
      authorType: "collaborator",
      versionLabel: "TOFA framework clarified by Priya Shah",
      originalText:
        "Division 230 provides a framework for recognising gains and losses from financial arrangements, generally on a compounding accruals or realisation basis, subject to elections and exceptions. It is intended to improve alignment between tax and commercial recognition of financial outcomes.",
      revisedText:
        "Division 230 provides a framework for recognising gains and losses from financial arrangements. A detailed review of the relevant elections, data requirements and system configuration should be completed before implementation. It is intended to improve alignment between tax and commercial recognition of financial outcomes.",
      highlightPhrase:
        "A detailed review of the relevant elections, data requirements and system configuration should be completed before implementation",
      timestampOffset: -24 * 60000,
    },
    {
      slot: "rev-priya-multi",
      authorId: "priya",
      author: "Priya Shah",
      authorType: "collaborator",
      versionLabel: "Classification narrative rewritten by Priya Shah",
      originalText:
        "The group should review the transaction. Additional information may be needed. Classification should test: (1) whether a financial benefit is to be received or provided; (2) whether that benefit is cash or cash-equivalent in substance; and (3) whether exceptions apply.",
      revisedText:
        "The group should complete a detailed review of the proposed transaction, including the relevant financial arrangements, elections and tax timing methods. Additional data should also be obtained before the implementation approach is finalised. Classification should test: (1) whether a financial benefit is to be received or provided; (2) whether that benefit is cash or cash-equivalent in substance; and (3) whether exceptions apply.",
      highlightPhrase:
        "complete a detailed review of the proposed transaction, including the relevant financial arrangements, elections and tax timing methods",
      timestampOffset: -18 * 60000,
    },
    {
      slot: "rev-daniel-gains",
      authorId: "daniel",
      author: "Daniel Wong",
      authorType: "collaborator",
      versionLabel: "Gains and losses wording updated by Daniel Wong",
      originalText:
        "TOFA generally treats relevant gains and losses on revenue account, subject to specific interactions with other provisions. Characterisation for other regimes (for example, withholding or thin capitalisation overlays) should be reviewed separately.",
      revisedText:
        "TOFA generally treats relevant gains and losses on revenue account, subject to specific interactions with other provisions. Characterisation for other regimes (for example, withholding or thin capitalisation overlays) should be reviewed separately before filing positions are locked.",
      highlightPhrase: "before filing positions are locked",
      timestampOffset: -12 * 60000,
    },
    {
      slot: "rev-alex-impl",
      authorId: "alex",
      author: "Alex Morgan",
      authorType: "collaborator",
      versionLabel: "Implementation paragraph rewritten by Alex Morgan",
      originalText:
        "Implementation of TOFA will require updates to existing processes. The organisation should review relevant systems and controls before implementation. Material transactions should follow a documented classification checklist before booking.",
      revisedText:
        "Implementation should include a coordinated review of data sources, tax calculations, system configuration and governance controls. Clear ownership should be established across Tax, Finance and Technology teams, with validation completed before the proposed go-live date. Material transactions should follow a documented classification checklist before booking.",
      highlightPhrase:
        "coordinated review of data sources, tax calculations, system configuration and governance controls",
      timestampOffset: -8 * 60000,
    },
    {
      slot: "rev-collab-alex",
      authorId: "alex",
      author: "Alex Morgan",
      authorType: "collaborator",
      versionLabel: "Implementation requirements refined by Alex Morgan",
      originalText:
        "Implementation requirements should be reviewed before completion.",
      revisedText:
        "Implementation requirements should be reviewed and confirmed across Tax, Finance and Technology before the proposed implementation date.",
      highlightPhrase: "reviewed and confirmed across Tax, Finance and Technology",
      timestampOffset: -6 * 60000,
      applyRevisedToDom: true,
    },
    {
      slot: "rev-long-next",
      authorId: "long",
      author: "Long",
      authorType: "user",
      versionLabel: "Next-step timing updated by Long",
      originalText: "Map data and systems requirements with finance and treasury.",
      revisedText: "Map data and systems requirements with finance and treasury by 15 May 2026.",
      highlightPhrase: "by 15 May 2026",
      timestampOffset: -4 * 60000,
    },
  ];

  function seedDemoRevisions() {
    if (!reportDoc) return;
    const seedHtml = {
      "rev-alex-tofa":
        "On the facts provided, the arrangement may have TOFA implications" +
        cite(1) +
        ". Material open points remain around elections, timing methods, foreign exchange exposure, and systems readiness. The sections below summarise the key considerations, risks, and recommended next steps for review with tax and finance stakeholders.",
      "rev-priya-framework":
        "Division 230 provides a framework for recognising gains and losses from financial arrangements, generally on a compounding accruals or realisation basis, subject to elections and exceptions" +
        cite(2) +
        ". It is intended to improve alignment between tax and commercial recognition of financial outcomes.",
      "rev-priya-multi":
        "The group should review the transaction. Additional information may be needed" +
        cites([2, 7]) +
        ". Classification should test: (1) whether a financial benefit is to be received or provided; (2) whether that benefit is cash or cash-equivalent in substance; and (3) whether exceptions apply.",
      "rev-alex-impl":
        "Implementation of TOFA will require updates to existing processes. The organisation should review relevant systems and controls before implementation. Material transactions should follow a documented classification checklist before booking" +
        cite(6) +
        ".",
      "rev-collab-alex": "Implementation requirements should be reviewed before completion.",
    };
    DEMO_REVISION_SEEDS.forEach(function (seed, index) {
      const el = reportDoc.querySelector('[data-rev-slot="' + seed.slot + '"]');
      if (!el) return;
      if (seed.applyRevisedToDom && seed.revisedText) {
        el.textContent = seed.revisedText;
      }
      const rev = createRevision({
        slot: seed.slot,
        author: seed.author,
        authorId: seed.authorId,
        authorType: seed.authorType,
        originalText: seed.originalText,
        revisedText: seed.revisedText || plainTextFromHtml(el.innerHTML),
        highlightPhrase: seed.highlightPhrase,
        timestamp: Date.now() + (seed.timestampOffset || 0),
        expanded: index < 2,
        versionLabel: seed.versionLabel,
      });
      if (seedHtml[seed.slot]) rev.originalHtml = seedHtml[seed.slot];
      else rev.originalHtml = null;
      if (seed.versionLabel) addVersion(seed.versionLabel);
    });
  }

  function resetRevisionState() {
    clearShowEditsMarkup();
    workspace.revisions = [];
    workspace.revisionSeq = 0;
    workspace.showEdits = false;
    workspace.suppressEditCapture = false;
    workspace.userEditTarget = null;
    workspace.userEditBefore = null;
    if (workspace.userEditTimer) {
      window.clearTimeout(workspace.userEditTimer);
      workspace.userEditTimer = null;
    }
    if (showEditsBtn) {
      showEditsBtn.setAttribute("aria-pressed", "false");
      showEditsBtn.classList.remove("is-active");
      showEditsBtn.title = "Show edits";
      const label = showEditsBtn.querySelector("span");
      if (label) label.textContent = "Show edits";
    }
  }

  function editableRevisionHost(node) {
    if (!node || !reportDoc || !reportDoc.contains(node)) return null;
    const el = node.nodeType === 3 ? node.parentElement : node;
    if (!el) return null;
    if (el.closest(".wb-rev-detail, .wb-cite, .wb-cite-group")) return null;
    return el.closest("p, li, h3, td, th");
  }

  function commitUserEditSession() {
    if (workspace.suppressEditCapture || !workspace.userEditTarget) return;
    const el = workspace.userEditTarget;
    const before = workspace.userEditBefore;
    workspace.userEditTarget = null;
    workspace.userEditBefore = null;
    if (!el || !reportDoc.contains(el) || before == null) return;
    const after = plainTextFromHtml(el.innerHTML);
    if (!after || after === before) return;

    let slot = el.getAttribute("data-rev-slot");
    if (!slot) {
      workspace.revisionSeq += 1;
      slot = "rev-user-" + workspace.revisionSeq;
      el.setAttribute("data-rev-slot", slot);
    }

    const existing = workspace.revisions.find(function (r) {
      return r.slot === slot && r.status === "pending";
    });
    if (existing) {
      existing.revisedText = after;
      existing.changes = inferChanges(existing.originalText, after);
      existing.timestamp = Date.now();
      existing.highlightPhrase = null;
      existing.author = "Long";
      existing.authorType = "user";
    } else {
      createRevision({
        slot: slot,
        author: "Long",
        authorType: "user",
        originalText: before,
        revisedText: after,
        timestamp: Date.now(),
        expanded: true,
      });
      addVersion("Edited by Long");
    }
    if (workspace.showEdits) applyShowEditsMarkup();
  }

  function scheduleUserEditCommit(el) {
    if (workspace.suppressEditCapture || !el) return;
    if (workspace.userEditTarget && workspace.userEditTarget !== el) {
      commitUserEditSession();
    }
    if (!workspace.userEditTarget) {
      workspace.userEditTarget = el;
      if (workspace.userEditBefore == null) {
        workspace.userEditBefore = plainTextFromHtml(el.innerHTML);
      }
    }
    if (workspace.userEditTimer) window.clearTimeout(workspace.userEditTimer);
    workspace.userEditTimer = window.setTimeout(function () {
      commitUserEditSession();
    }, 1000);
  }

  function setReportStatus(text, shimmer) {
    if (!reportStatus) return;
    if (!text) {
      reportStatus.hidden = true;
      reportStatus.textContent = "";
      reportStatus.classList.remove("is-shimmer");
      return;
    }
    reportStatus.hidden = false;
    reportStatus.textContent = text;
    reportStatus.classList.toggle("is-shimmer", !!shimmer && !prefersReducedMotion);
  }

  function closePopovers() {
    if (sourcesPopover) sourcesPopover.hidden = true;
    if (versionsPopover) versionsPopover.hidden = true;
    if (promptHistoryPopover) promptHistoryPopover.hidden = true;
    closeSharePopover();
    if (sourcesBtn) sourcesBtn.setAttribute("aria-expanded", "false");
    if (versionsBtn) versionsBtn.setAttribute("aria-expanded", "false");
    if (promptHistoryBtn) promptHistoryBtn.setAttribute("aria-expanded", "false");
    if (presencePopover) presencePopover.hidden = true;
  }

  function closeCitePopover() {
    if (!citePopover) return;
    citePopover.hidden = true;
    workspace.activeCiteId = null;
    workspace.citeGroup = [];
    workspace.citeGroupIndex = 0;
    workspace.citeGroupKey = null;
    workspace.citeAnchorFrozen = false;
    document.querySelectorAll(".wb-cite.is-active").forEach(function (el) {
      el.classList.remove("is-active");
    });
  }

  function parseCiteGroupFromEl(el) {
    if (!el) return [];
    const raw = el.getAttribute("data-cite-group") || el.getAttribute("data-ref");
    if (!raw) return [];
    return raw
      .split(",")
      .map(function (s) {
        return Number(s.trim());
      })
      .filter(function (n) {
        return !isNaN(n) && REFERENCE_SOURCES[n];
      });
  }

  function updateCiteNav() {
    const group = workspace.citeGroup || [];
    const multi = group.length > 1;
    if (citeNav) citeNav.hidden = !multi;
    if (!multi) return;

    const idx = workspace.citeGroupIndex;
    const total = group.length;
    if (citeCounter) citeCounter.textContent = idx + 1 + "/" + total;
    if (citePrevBtn) {
      citePrevBtn.disabled = idx <= 0;
      citePrevBtn.setAttribute("aria-disabled", idx <= 0 ? "true" : "false");
    }
    if (citeNextBtn) {
      citeNextBtn.disabled = idx >= total - 1;
      citeNextBtn.setAttribute("aria-disabled", idx >= total - 1 ? "true" : "false");
    }
  }

  function setActiveCiteMarker(refId, groupKey) {
    document.querySelectorAll(".wb-cite.is-active").forEach(function (el) {
      el.classList.remove("is-active");
    });
    let selector = '.wb-cite[data-ref="' + refId + '"]';
    if (groupKey) {
      const grouped = document.querySelector(
        '.wb-cite[data-ref="' + refId + '"][data-cite-group="' + groupKey + '"]'
      );
      if (grouped) {
        grouped.classList.add("is-active");
        return;
      }
    }
    const first = document.querySelector(selector);
    if (first) first.classList.add("is-active");
  }

  function syncCiteViewButton(src) {
    if (!citeViewBtn) return;
    if (src) {
      citeViewBtn.disabled = false;
      citeViewBtn.setAttribute("data-source-id", String(src.id));
      if (src.url) citeViewBtn.setAttribute("data-url", src.url);
      else citeViewBtn.removeAttribute("data-url");
    } else {
      citeViewBtn.disabled = true;
      citeViewBtn.removeAttribute("data-url");
      citeViewBtn.removeAttribute("data-source-id");
    }
  }

  function updateCitePageIndicator() {
    if (!citePageEl || !citeBodyEl) return;
    const src = workspace.activeCiteId != null ? REFERENCE_SOURCES[workspace.activeCiteId] : null;
    const total = (src && src.pages) || 0;
    if (!total) {
      citePageEl.hidden = true;
      citePageEl.textContent = "";
      return;
    }
    citePageEl.hidden = false;
    const mid = citeBodyEl.scrollTop + citeBodyEl.clientHeight * 0.42;
    let page = 1;
    citeBodyEl.querySelectorAll("[data-cite-page]").forEach(function (node) {
      if (node.offsetTop <= mid) {
        page = Number(node.getAttribute("data-cite-page")) || page;
      }
    });
    citePageEl.textContent = page + " / " + total;
  }

  function scrollCiteHighlightIntoView() {
    window.requestAnimationFrame(function () {
      const highlight =
        (citeBodyEl && citeBodyEl.querySelector("#wb-cite-highlight")) ||
        (citeBodyEl && citeBodyEl.querySelector(".wb-cite-mark"));
      if (!highlight || !citeBodyEl) return;
      const viewH = citeBodyEl.clientHeight;
      let offset;
      if (highlight.offsetHeight > viewH * 0.6) {
        offset = highlight.offsetTop - viewH * 0.28;
      } else {
        offset =
          highlight.offsetTop - viewH / 2 + highlight.offsetHeight / 2;
      }
      citeBodyEl.scrollTop = Math.max(0, offset);
      updateCitePageIndicator();
    });
  }

  function buildCiteEvidenceHtml(src) {
    if (src.evidence) return src.evidence;
    if (src.highlight) {
      return (
        '<p class="wb-cite-popover__passage"><mark class="wb-cite-mark" id="wb-cite-highlight">' +
        escapeHtml(src.highlight) +
        "</mark></p>"
      );
    }
    return "";
  }

  function fillCitePopoverContent(refId, animate) {
    const src = REFERENCE_SOURCES[refId];
    if (!src || !citeBodyEl) return;

    const apply = function () {
      if (citeSourceEl) {
        citeSourceEl.textContent = src.source || src.domain || "Source";
      }
      if (citeTitleEl) citeTitleEl.textContent = src.title;
      syncCiteViewButton(src);
      citeBodyEl.innerHTML =
        '<div class="wb-cite-popover__context">' +
        (src.before || "") +
        buildCiteEvidenceHtml(src) +
        (src.after || "") +
        "</div>";
      updateCiteNav();
      refreshIcons();
      scrollCiteHighlightIntoView();
      window.requestAnimationFrame(updateCitePageIndicator);
    };

    if (animate && !prefersReducedMotion && citePopover) {
      citePopover.classList.add("is-content-fading");
      window.setTimeout(function () {
        apply();
        citePopover.classList.remove("is-content-fading");
      }, 180);
    } else {
      apply();
    }
  }

  function resolveCitePositionAnchor(anchor, group) {
    if (group && group.length > 1 && anchor && anchor.closest) {
      const groupEl = anchor.closest(".wb-cite-group");
      if (groupEl) return groupEl;
    }
    return anchor || document.body;
  }

  function openCitePopover(refId, anchor, groupOverride) {
    const src = REFERENCE_SOURCES[refId];
    if (!src || !citePopover || !citeBodyEl) return;
    closePopovers();

    const group =
      groupOverride && groupOverride.length
        ? groupOverride.slice()
        : parseCiteGroupFromEl(anchor);
    const normalized = group.length ? group : [refId];
    let index = normalized.indexOf(refId);
    if (index < 0) index = 0;

    const groupKey = normalized.join(",");
    const wasOpen = citePopover && !citePopover.hidden;
    const sameGroupSession =
      wasOpen &&
      workspace.citeAnchorFrozen &&
      workspace.citeGroupKey === groupKey &&
      normalized.length > 1;

    workspace.citeGroup = normalized;
    workspace.citeGroupIndex = index;
    workspace.activeCiteId = normalized[index];
    workspace.citeGroupKey = groupKey;

    setActiveCiteMarker(workspace.activeCiteId, groupKey);
    fillCitePopoverContent(workspace.activeCiteId, sameGroupSession);

    if (!sameGroupSession) {
      const positionAnchor = resolveCitePositionAnchor(anchor, normalized);
      positionCitePopover(positionAnchor);
      workspace.citeAnchorFrozen = normalized.length > 1;
    }

    refreshIcons();

    if (!citePopover.hasAttribute("tabindex")) {
      citePopover.setAttribute("tabindex", "-1");
    }
    try {
      citePopover.focus({ preventScroll: true });
    } catch (err) {
      citePopover.focus();
    }
  }

  function navigateCiteGroup(delta) {
    const group = workspace.citeGroup || [];
    if (group.length < 2) return;
    const next = workspace.citeGroupIndex + delta;
    if (next < 0 || next >= group.length) return;
    workspace.citeGroupIndex = next;
    workspace.activeCiteId = group[next];
    setActiveCiteMarker(workspace.activeCiteId, group.join(","));
    fillCitePopoverContent(workspace.activeCiteId, true);
    // Keep popover fixed for the citation-group session
  }

  function renderSourcesList() {
    if (!sourcesList) return;
    const used = {};
    if (reportDoc) {
      reportDoc.querySelectorAll(".wb-cite[data-ref]").forEach(function (el) {
        used[el.getAttribute("data-ref")] = true;
      });
    }
    const ids = Object.keys(REFERENCE_SOURCES)
      .map(Number)
      .filter(function (id) {
        return used[String(id)] || Object.keys(used).length === 0;
      })
      .sort(function (a, b) {
        return a - b;
      });

    // If no cites yet (pre-generation), show the full demo set
    const listIds =
      Object.keys(used).length === 0
        ? Object.keys(REFERENCE_SOURCES)
            .map(Number)
            .sort(function (a, b) {
              return a - b;
            })
        : ids;

    sourcesList.innerHTML = listIds
      .map(function (id) {
        const src = REFERENCE_SOURCES[id];
        const body =
          src.source +
          (src.summary ? " · " + src.summary : src.domain ? " · " + src.domain : "");
        return (
          '<li><div class="wb-sources-list__row">' +
          '<button type="button" class="wb-sources-list__btn" data-open-ref="' +
          id +
          '">' +
          '<span class="wb-sources-list__title">[' +
          id +
          "] " +
          src.title +
          "</span>" +
          '<span class="wb-sources-list__meta">' +
          body +
          "</span>" +
          "</button>" +
          '<button type="button" class="wb-icon-btn wb-cite-popover__icon-btn wb-sources-list__open" data-open-panel="' +
          id +
          '" aria-label="View source" title="View source">' +
          '<i data-lucide="external-link" aria-hidden="true"></i>' +
          "</button>" +
          "</div></li>"
        );
      })
      .join("");
    refreshIcons();
  }

  function nearestReportHeading(el) {
    let node = el;
    while (node && node !== reportDoc) {
      let prev = node.previousElementSibling;
      while (prev) {
        if (prev.tagName === "H2" || prev.tagName === "H3" || prev.tagName === "H1") {
          return (prev.textContent || "").replace(/\s+/g, " ").trim();
        }
        prev = prev.previousElementSibling;
      }
      node = node.parentElement;
    }
    return "Report";
  }

  function excerptFromBlock(el, limit) {
    const raw = ((el && el.textContent) || "")
      .replace(/\[\d+\]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!raw) return "";
    const max = limit || 160;
    return raw.length > max ? raw.slice(0, max).replace(/\s+\S*$/, "") + "…" : raw;
  }

  function collectSourceOccurrences(sourceId) {
    if (!reportDoc) return [];
    const cites = reportDoc.querySelectorAll('.wb-cite[data-ref="' + sourceId + '"]');
    const meta = SOURCE_OCCURRENCE_META[sourceId] || [];
    const items = [];
    cites.forEach(function (citeEl, i) {
      const block = citeEl.closest("p, li, td, h2, h3") || citeEl.parentElement;
      const extra = meta[i] || {};
      const sourceOcc = extra.sourceOcc != null ? extra.sourceOcc : i;
      items.push({
        id: extra.id || String(sourceId) + "-" + i,
        sourceId: sourceId,
        index: i,
        sectionId: extra.sectionId || extra.sourceSectionId || "",
        sectionLabel: extra.section || nearestReportHeading(block),
        section: extra.section || nearestReportHeading(block),
        reportRange: extra.reportRange || { citeIndex: i },
        reportExcerpt: extra.excerpt || excerptFromBlock(block, 160),
        excerpt: extra.excerpt || excerptFromBlock(block, 160),
        sourceSectionId: extra.sourceSectionId || "",
        sourceSection: extra.sourceSection || "",
        sourceRange: extra.sourceRange || { sourceOcc: sourceOcc, sectionId: extra.sourceSectionId || "" },
        sourceOcc: sourceOcc,
        sourceExcerpt: extra.sourceExcerpt || extra.excerpt || "",
        sourcePageEstimate: extra.page || null,
      });
    });
    return items;
  }

  function getOccurrenceCiteEl(sourceId, index) {
    if (!reportDoc) return null;
    return reportDoc.querySelectorAll('.wb-cite[data-ref="' + sourceId + '"]')[index] || null;
  }

  function getOccurrenceHost(citeEl) {
    return (citeEl && citeEl.closest("p, li, td, h2, h3")) || citeEl || null;
  }

  function clearSourceUsageHighlights() {
    if (!reportDoc) return;
    reportDoc.querySelectorAll(".wb-cite.is-source-linked").forEach(function (el) {
      el.classList.remove("is-source-linked");
    });
    reportDoc.querySelectorAll(".wb-cite-host").forEach(function (el) {
      el.classList.remove("is-source-hover", "is-source-current", "wb-cite-host");
    });
  }

  function applySourceUsageHighlights(sourceId, currentIndex) {
    clearSourceUsageHighlights();
    if (!reportDoc || sourceId == null) return;
    reportDoc.querySelectorAll('.wb-cite[data-ref="' + sourceId + '"]').forEach(function (citeEl, i) {
      citeEl.classList.add("is-source-linked");
      const host = getOccurrenceHost(citeEl);
      if (!host) return;
      host.classList.add("wb-cite-host");
      if (currentIndex === i) host.classList.add("is-source-current");
    });
  }

  function setSourceOccurrenceHover(index, on) {
    if (!reportDoc || workspace.activeSourceId == null) return;
    const citeEl = getOccurrenceCiteEl(workspace.activeSourceId, index);
    const host = getOccurrenceHost(citeEl);
    if (host && !host.classList.contains("is-source-current")) {
      host.classList.toggle("is-source-hover", !!on);
    }
    if (sourcePanelList) {
      const row = sourcePanelList.querySelector('[data-occ-index="' + index + '"]');
      if (row) row.classList.toggle("is-hover", !!on);
    }
    if (sourcePanelViewer) {
      const sourceOcc = getOccurrenceSourceOcc(workspace.activeSourceId, index);
      getSourceOccurrenceMarks(sourceOcc).forEach(function (mark) {
        if (workspace.activeOccurrenceId === index) mark.classList.add("is-hot");
        else mark.classList.toggle("is-hot", !!on);
      });
    }
  }

  function saveSourceScroll() {
    if (workspace.activeSourceId == null || !sourcePanelViewer) return;
    workspace.sourceScrollById[workspace.activeSourceId] = sourcePanelViewer.scrollTop;
  }

  function restoreSourceScroll(sourceId) {
    if (!sourcePanelViewer) return;
    const saved = workspace.sourceScrollById[sourceId];
    if (saved == null) return;
    sourcePanelViewer.scrollTop = saved;
  }

  function syncSourceIconState() {
    const btn = assistantSourcesBtn || document.getElementById("wb-assistant-sources");
    if (!btn) return;
    const on = workspace.rightPanelMode === "source";
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("title", "Sources");
    btn.setAttribute("aria-label", "Sources");
  }

  function setRightPanelMode(mode) {
    const next = mode === "source" ? "source" : "assistant";
    if (workspace.rightPanelMode === "source" && next !== "source") {
      saveSourceScroll();
    }
    workspace.rightPanelMode = next;
    if (assistantEl) assistantEl.classList.toggle("is-source-mode", next === "source");
    if (assistantWriteEl) assistantWriteEl.hidden = next === "source";
    if (sourcePanelEl) sourcePanelEl.hidden = next !== "source";
    syncSourceIconState();
    if (next !== "source") {
      clearSourceUsageHighlights();
    } else if (workspace.activeSourceId != null) {
      applySourceUsageHighlights(workspace.activeSourceId, workspace.activeOccurrenceId);
      window.requestAnimationFrame(function () {
        if (workspace.activeOccurrenceId == null) {
          restoreSourceScroll(workspace.activeSourceId);
        }
        updateSourcePageEstimate();
      });
    }
  }

  function renderSourceDocumentHtml(doc) {
    if (!doc) return "";
    const title = doc.paperTitle
      ? '<h2 class="wb-source-panel__doc-title">' + escapeHtml(doc.paperTitle) + "</h2>"
      : "";
    const sections = (doc.sections || [])
      .map(function (sec) {
        const heading = sec.heading
          ? '<h3 class="wb-source-panel__h">' + escapeHtml(sec.heading) + "</h3>"
          : "";
        const body = (sec.paragraphs || [])
          .map(function (para) {
            if (!para) return "";
            if (para.charAt(0) === "<") return para;
            return "<p>" + para + "</p>";
          })
          .join("");
        return (
          '<section class="wb-source-panel__sec" data-source-section="' +
          escapeHtml(sec.id || "") +
          '" data-page="' +
          (sec.page || 1) +
          '">' +
          heading +
          body +
          "</section>"
        );
      })
      .join("");
    return '<div class="wb-source-panel__doc">' + title + sections + "</div>";
  }

  function updateSourcePageEstimate() {
    if (!sourcePanelPage || !sourcePanelViewer) return;
    const doc = SOURCE_DOCUMENTS[workspace.activeSourceId];
    if (!doc || !doc.estimatedPages) {
      sourcePanelPage.hidden = true;
      sourcePanelPage.textContent = "";
      return;
    }
    sourcePanelPage.hidden = false;
    const mid = sourcePanelViewer.scrollTop + sourcePanelViewer.clientHeight * 0.18;
    let page = 1;
    sourcePanelViewer.querySelectorAll("[data-page]").forEach(function (sec) {
      if (sec.offsetTop <= mid) page = Number(sec.getAttribute("data-page")) || page;
    });
    sourcePanelPage.textContent = page + " / " + doc.estimatedPages;
  }

  function setSourceUsageExpanded(on) {
    workspace.sourceUsageExpanded = !!on;
    if (sourceUsageToggle) {
      sourceUsageToggle.setAttribute("aria-expanded", on ? "true" : "false");
      const icon = sourceUsageToggle.querySelector("[data-lucide], svg");
      if (icon && icon.setAttribute) icon.setAttribute("data-lucide", on ? "chevron-up" : "chevron-down");
    }
    if (sourcePanelList) sourcePanelList.hidden = !on;
    refreshIcons();
  }

  function renderSourcePanel(sourceId, options) {
    options = options || {};
    const src = REFERENCE_SOURCES[sourceId];
    const doc = SOURCE_DOCUMENTS[sourceId];
    if (!src && !doc) return;
    const occurrences = collectSourceOccurrences(sourceId);
    if (sourcePanelTitle) sourcePanelTitle.textContent = (doc && doc.title) || (src && src.title) || "Source";
    if (sourcePanelMeta) {
      sourcePanelMeta.textContent =
        (doc && doc.metadata) ||
        ((src && src.source) || (src && src.domain) || "Source") +
          (src && src.summary ? " · " + src.summary : "");
    }
    if (sourcePanelViewer) {
      sourcePanelViewer.innerHTML = doc
        ? renderSourceDocumentHtml(doc)
        : '<div class="wb-source-panel__doc">' +
          ((src && src.before) || "") +
          (src ? buildCiteEvidenceHtml(src).replace(/id="wb-cite-highlight"/g, 'data-source-highlight="true"') : "") +
          ((src && src.after) || "") +
          "</div>";
      if (!options.skipRestore) {
        window.requestAnimationFrame(function () {
          if (options.keepScroll || workspace.sourceScrollById[sourceId] != null) {
            restoreSourceScroll(sourceId);
          }
          updateSourcePageEstimate();
        });
      }
    }
    if (sourcePanelUsage) sourcePanelUsage.hidden = occurrences.length === 0;
    if (sourcePanelCount) {
      const n = occurrences.length;
      sourcePanelCount.textContent =
        n === 0 ? "" : "Used " + n + (n === 1 ? " time" : " times") + " in this report";
    }
    if (sourcePanelList) {
      sourcePanelList.innerHTML = occurrences
        .map(function (occ, i) {
          const num = String(i + 1).padStart(2, "0");
          const page =
            occ.sourcePageEstimate != null
              ? '<span class="wb-source-occ__page">p. ' + occ.sourcePageEstimate + "</span>"
              : "";
          return (
            '<li><button type="button" class="wb-source-occ" data-occ-index="' +
            i +
            '">' +
            '<span class="wb-source-occ__num">' +
            num +
            "</span>" +
            '<span class="wb-source-occ__body">' +
            '<span class="wb-source-occ__head">' +
            '<span class="wb-source-occ__section">' +
            escapeHtml(occ.section) +
            "</span>" +
            page +
            "</span>" +
            '<span class="wb-source-occ__excerpt">' +
            escapeHtml(occ.excerpt) +
            "</span>" +
            "</span></button></li>"
          );
        })
        .join("");
    }
    setSourceUsageExpanded(!!workspace.sourceUsageExpanded);
  }

  const occurrenceNav = { gen: 0 };
  const scrollAnimState = typeof WeakMap === "function" ? new WeakMap() : null;

  function getOccurrenceRecord(sourceId, index) {
    if (sourceId == null || index == null) return null;
    const items = collectSourceOccurrences(sourceId);
    return items[index] || null;
  }

  function getOccurrenceSourceOcc(sourceId, index) {
    const occ = getOccurrenceRecord(sourceId, index);
    if (occ && occ.sourceOcc != null) return occ.sourceOcc;
    return index;
  }

  function getSourceOccurrenceMarks(sourceOcc) {
    if (!sourcePanelViewer || sourceOcc == null) return [];
    return Array.prototype.slice.call(
      sourcePanelViewer.querySelectorAll('[data-source-occ="' + sourceOcc + '"]')
    );
  }

  function getSourceOccurrenceMarkRect(index) {
    const sourceOcc = getOccurrenceSourceOcc(workspace.activeSourceId, index);
    const marks = getSourceOccurrenceMarks(sourceOcc);
    if (!marks.length) return null;
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    marks.forEach(function (mark) {
      const rect = mark.getBoundingClientRect();
      left = Math.min(left, rect.left);
      top = Math.min(top, rect.top);
      right = Math.max(right, rect.right);
      bottom = Math.max(bottom, rect.bottom);
    });
    return {
      left: left,
      top: top,
      right: right,
      bottom: bottom,
      width: right - left,
      height: bottom - top,
    };
  }

  function waitOccurrenceLayout() {
    return new Promise(function (resolve) {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(resolve);
      });
    });
  }

  function getContainerScaleY(container) {
    if (!container) return 1;
    const visual = container.getBoundingClientRect().height;
    const layout = container.clientHeight || 1;
    const scale = visual / layout;
    return scale > 0.05 ? scale : 1;
  }

  function getLayoutOffsetTop(el, container) {
    const scaleY = getContainerScaleY(container);
    const elRect = el.getBoundingClientRect();
    const box = container.getBoundingClientRect();
    return container.scrollTop + (elRect.top - box.top) / scaleY;
  }

  function getLayoutHeight(el, container) {
    return el.getBoundingClientRect().height / getContainerScaleY(container);
  }

  function getTargetsLayoutRange(targets, container) {
    let minTop = Infinity;
    let maxBottom = -Infinity;
    targets.forEach(function (el) {
      if (!el) return;
      const top = getLayoutOffsetTop(el, container);
      const height = getLayoutHeight(el, container);
      if (top < minTop) minTop = top;
      if (top + height > maxBottom) maxBottom = top + height;
    });
    if (!isFinite(minTop) || !isFinite(maxBottom)) return null;
    return {
      top: minTop,
      bottom: maxBottom,
      mid: (minTop + maxBottom) / 2,
      height: maxBottom - minTop,
    };
  }

  function occurrenceScrollDuration(container, nextTop, min, max) {
    if (!container) return min;
    const dist = Math.abs(nextTop - container.scrollTop);
    const span = Math.max(1, container.clientHeight);
    const t = Math.min(1, dist / (span * 2.4));
    return Math.round(min + (max - min) * t);
  }

  function cancelScrollAnimation(container) {
    if (!container || !scrollAnimState) return;
    const job = scrollAnimState.get(container);
    if (job) {
      job.cancelled = true;
      scrollAnimState.delete(container);
    }
  }

  function cancelOccurrenceNavigation() {
    occurrenceNav.gen += 1;
    if (sourcePanelViewer) cancelScrollAnimation(sourcePanelViewer);
    if (reportScroll) cancelScrollAnimation(reportScroll);
    if (sourcePanelList) cancelScrollAnimation(sourcePanelList);
    return occurrenceNav.gen;
  }

  function sampleCubicBezier(u, a, b) {
    return (((1 - 3 * b + 3 * a) * u + (3 * b - 6 * a)) * u + 3 * a) * u;
  }

  function sampleCubicBezierDerivative(u, a, b) {
    return 3 * (1 - 3 * b + 3 * a) * u * u + 2 * (3 * b - 6 * a) * u + 3 * a;
  }

  function cubicBezierY(t, x1, y1, x2, y2) {
    let u = t;
    for (let i = 0; i < 6; i++) {
      const x = sampleCubicBezier(u, x1, x2) - t;
      const dx = sampleCubicBezierDerivative(u, x1, x2);
      if (Math.abs(dx) < 1e-6) break;
      u = Math.max(0, Math.min(1, u - x / dx));
    }
    return sampleCubicBezier(u, y1, y2);
  }

  function easeScrollProgress(t, easing) {
    if (easing === "collab-follow") {
      return cubicBezierY(t, 0.22, 1, 0.36, 1);
    }
    return 1 - Math.pow(1 - t, 3);
  }

  function animateScrollTo(container, toTop, duration, easing) {
    return new Promise(function (resolve) {
      if (!container) {
        resolve(false);
        return;
      }
      cancelScrollAnimation(container);
      const max = Math.max(0, container.scrollHeight - container.clientHeight);
      const target = Math.max(0, Math.min(max, toTop));
      const from = container.scrollTop;
      if (prefersReducedMotion || duration === 0 || Math.abs(target - from) < 2) {
        container.scrollTop = target;
        resolve(true);
        return;
      }
      const dur = duration == null ? 750 : duration;
      const job = { cancelled: false };
      if (scrollAnimState) scrollAnimState.set(container, job);
      const start = performance.now();
      function frame(now) {
        if (job.cancelled) {
          resolve(false);
          return;
        }
        const t = Math.min(1, (now - start) / dur);
        const e = easeScrollProgress(t, easing);
        container.scrollTop = from + (target - from) * e;
        if (t < 1) {
          window.requestAnimationFrame(frame);
          return;
        }
        if (scrollAnimState && scrollAnimState.get(container) === job) {
          scrollAnimState.delete(container);
        }
        container.scrollTop = target;
        resolve(true);
      }
      window.requestAnimationFrame(frame);
    });
  }

  function centerTargetInScrollContainer(target, container, options) {
    return centerTargetWithClamping({
      target: target,
      container: container,
      topInset: options && options.topInset,
      bottomInset: options && options.bottomInset,
      align: options && options.align,
      duration: options && options.duration,
      minDuration: options && options.minDuration,
      maxDuration: options && options.maxDuration,
      instant: options && options.instant,
      easing: options && options.easing,
    });
  }

  function centerTargetWithClamping(options) {
    options = options || {};
    const container = options.container;
    const targets = (Array.isArray(options.target) ? options.target : [options.target]).filter(Boolean);
    if (!container || !targets.length) return Promise.resolve(false);
    const range = getTargetsLayoutRange(targets, container);
    if (!range) return Promise.resolve(false);
    const topInset = options.topInset == null ? 64 : options.topInset;
    const bottomInset = options.bottomInset == null ? 56 : options.bottomInset;
    const align = options.align == null ? 0.5 : options.align;
    const viewH = container.clientHeight;
    const usable = Math.max(40, viewH - topInset - bottomInset);
    const max = Math.max(0, container.scrollHeight - viewH);
    let nextTop;
    if (range.height >= usable) {
      nextTop = range.top - topInset;
    } else {
      const desired = topInset + usable * align;
      nextTop = range.mid - desired;
      const visibleTop = range.top - nextTop;
      const visibleBottom = range.bottom - nextTop;
      if (visibleTop < topInset) nextTop = range.top - topInset;
      if (visibleBottom > viewH - bottomInset) nextTop = range.bottom - (viewH - bottomInset);
    }
    nextTop = Math.max(0, Math.min(max, nextTop));
    let duration = options.duration;
    if (duration == null) {
      duration = occurrenceScrollDuration(
        container,
        nextTop,
        options.minDuration == null ? 650 : options.minDuration,
        options.maxDuration == null ? 900 : options.maxDuration
      );
    }
    if (prefersReducedMotion || options.instant) duration = 0;
    return animateScrollTo(container, nextTop, duration, options.easing);
  }

  function highlightSourceOccurrenceMarks(sourceOcc, options) {
    options = options || {};
    if (!sourcePanelViewer) return [];
    sourcePanelViewer.querySelectorAll(".wb-source-panel__mark.is-hot").forEach(function (el) {
      el.classList.remove("is-hot");
    });
    const marks = getSourceOccurrenceMarks(sourceOcc);
    marks.forEach(function (mark) {
      mark.classList.add("is-hot");
    });
    if (options.scroll === false || !marks.length) return marks;
    centerTargetInScrollContainer(marks, sourcePanelViewer, {
      topInset: 64,
      bottomInset: 56,
      align: 0.5,
      instant: options.instant,
      minDuration: 650,
      maxDuration: 1000,
    });
    return marks;
  }

  function highlightSourceOccurrenceMark(index, options) {
    const sourceOcc = getOccurrenceSourceOcc(workspace.activeSourceId, index);
    return highlightSourceOccurrenceMarks(sourceOcc, options);
  }

  function syncActiveOccurrenceRow(index) {
    if (!sourcePanelList) return null;
    let active = null;
    sourcePanelList.querySelectorAll(".wb-source-occ").forEach(function (row) {
      const on = Number(row.getAttribute("data-occ-index")) === index;
      row.classList.toggle("is-active", on);
      if (on) active = row;
    });
    return active;
  }

  function selectSourceOccurrence(index, options) {
    options = options || {};
    const token = cancelOccurrenceNavigation();
    workspace.activeOccurrenceId = index;
    const occ = getOccurrenceRecord(workspace.activeSourceId, index);
    const sourceOcc = occ && occ.sourceOcc != null ? occ.sourceOcc : index;
    const row = syncActiveOccurrenceRow(index);
    applySourceUsageHighlights(workspace.activeSourceId, index);
    highlightSourceOccurrenceMarks(sourceOcc, { scroll: false });

    if (options.scroll === false && options.scrollSource === false && options.scrollList === false) {
      return Promise.resolve(true);
    }

    const instant = !!options.instant || prefersReducedMotion;
    return waitOccurrenceLayout().then(function () {
      if (token !== occurrenceNav.gen) return false;
      const marks = getSourceOccurrenceMarks(sourceOcc);
      const citeEl = getOccurrenceCiteEl(workspace.activeSourceId, index);
      const host = getOccurrenceHost(citeEl);
      const tasks = [];
      if (collaboration) collaboration.programmaticScroll = true;
      if (options.scrollList !== false && row && sourcePanelList) {
        tasks.push(
          centerTargetInScrollContainer(row, sourcePanelList, {
            topInset: 10,
            bottomInset: 10,
            align: 0.5,
            instant: instant,
            minDuration: 420,
            maxDuration: 700,
            duration: options.listDuration,
          })
        );
      }
      if (options.scrollSource !== false && marks.length && sourcePanelViewer) {
        tasks.push(
          centerTargetInScrollContainer(marks, sourcePanelViewer, {
            topInset: 64,
            bottomInset: 56,
            align: 0.5,
            instant: instant,
            minDuration: 650,
            maxDuration: 1000,
            duration: options.sourceDuration,
          })
        );
      }
      if (options.scroll !== false && host && reportScroll) {
        tasks.push(
          centerTargetInScrollContainer(host, reportScroll, {
            topInset: 72,
            bottomInset: 48,
            align: 0.48,
            instant: instant,
            minDuration: 600,
            maxDuration: 850,
            duration: options.reportDuration,
          })
        );
      }
      return Promise.all(tasks).then(function () {
        if (collaboration) collaboration.programmaticScroll = false;
        if (token !== occurrenceNav.gen) return false;
        applySourceUsageHighlights(workspace.activeSourceId, index);
        highlightSourceOccurrenceMarks(sourceOcc, { scroll: false });
        saveSourceScroll();
        updateSourcePageEstimate();
        return true;
      });
    });
  }

  function showSourceEmptyState() {
    if (sourcePanelTitle) sourcePanelTitle.textContent = "No source selected";
    if (sourcePanelMeta) {
      sourcePanelMeta.textContent = "Open a source from Sources Used to inspect it here.";
    }
    if (sourcePanelPage) {
      sourcePanelPage.hidden = true;
      sourcePanelPage.textContent = "";
    }
    if (sourcePanelViewer) sourcePanelViewer.innerHTML = "";
    if (sourcePanelUsage) sourcePanelUsage.hidden = true;
    if (sourcePanelList) sourcePanelList.innerHTML = "";
  }

  function openSourceInPanel(sourceId, occurrenceId) {
    const id = Number(sourceId);
    if (!REFERENCE_SOURCES[id] && !SOURCE_DOCUMENTS[id]) return false;
    if (app) app.classList.add("is-assistant-open");
    if (assistantFab) assistantFab.hidden = true;
    closeCitePopover();
    closeSourcesUsedPopover();
    const same = workspace.activeSourceId === id && sourcePanelViewer && sourcePanelViewer.innerHTML;
    workspace.activeSourceId = id;
    const occIndex =
      occurrenceId != null && occurrenceId !== "" && !isNaN(Number(occurrenceId))
        ? Number(occurrenceId)
        : null;
    if (occIndex != null) {
      workspace.sourceUsageExpanded = true;
      if (!same) renderSourcePanel(id, { skipRestore: true });
      else setSourceUsageExpanded(true);
      setRightPanelMode("source");
      return selectSourceOccurrence(occIndex);
    }
    workspace.activeOccurrenceId = null;
    workspace.sourceUsageExpanded = false;
    if (!same) renderSourcePanel(id);
    else setSourceUsageExpanded(false);
    setRightPanelMode("source");
    applySourceUsageHighlights(id, null);
    return Promise.resolve(true);
  }

  function toggleSourcePanelMode() {
    if (workspace.rightPanelMode === "source") {
      setRightPanelMode("assistant");
      return;
    }
    if (app) app.classList.add("is-assistant-open");
    if (assistantFab) assistantFab.hidden = true;
    closeSourcesUsedPopover();
    closeCitePopover();
    if (workspace.activeSourceId != null) {
      if (!sourcePanelViewer || !sourcePanelViewer.innerHTML) {
        renderSourcePanel(workspace.activeSourceId, { keepScroll: true });
      }
      setRightPanelMode("source");
      return;
    }
    showSourceEmptyState();
    setRightPanelMode("source");
  }

  function resetSourcePanelState() {
    workspace.activeSourceId = null;
    workspace.activeOccurrenceId = null;
    workspace.sourceUsageExpanded = false;
    workspace.sourceScrollById = {};
    clearSourceUsageHighlights();
    showSourceEmptyState();
    setRightPanelMode("assistant");
  }

  function positionCitePopover(anchor) {
    if (!citePopover || !anchor) return;
    const margin = 14;
    const gap = 11;
    const stageSpace = overlayUsesStageSpace(citePopover);
    const rect = rectToOverlaySpace(anchor.getBoundingClientRect(), citePopover);
    const clamp = stageSpace
      ? viewportRectToStageLocal(getViewportBoxRect())
      : getWindowClampRect();
    if (!rect || !clamp) return;
    const viewW = clamp.width;
    const viewH = clamp.height;

    let popW = Math.min(384, viewW - margin * 2);
    const maxH = Math.min(420, viewH - margin * 2);

    if (viewW < 640) {
      popW = viewW - margin * 2;
    }

    citePopover.style.width = popW + "px";
    citePopover.style.maxHeight = maxH + "px";
    citePopover.hidden = false;

    const measuredH = Math.min(citePopover.offsetHeight || maxH, maxH);

    let left = rect.left + rect.width / 2 - popW / 2;
    let top = rect.top - measuredH - gap;
    const minLeft = clamp.left + margin;
    const maxRight = clamp.right - margin;
    const minTop = clamp.top + margin;
    const maxBottom = clamp.bottom - margin;

    if (top < minTop) {
      const belowTop = rect.bottom + gap;
      if (belowTop + measuredH <= maxBottom) {
        top = belowTop;
      } else {
        const spaceAbove = rect.top - minTop;
        const spaceBelow = maxBottom - rect.bottom;
        top =
          spaceAbove >= spaceBelow
            ? minTop
            : Math.max(minTop, maxBottom - measuredH);
      }
    }

    if (left < minLeft) left = minLeft;
    if (left + popW > maxRight) {
      left = Math.max(minLeft, maxRight - popW);
    }

    applyOverlayPosition(citePopover, left, top);
  }

  function togglePopover(btn, pop) {
    if (!btn || !pop) return;
    const open = pop.hidden;
    closePopovers();
    closeCitePopover();
    if (open) {
      if (pop === sourcesPopover) renderSourcesList();
      if (pop === promptHistoryPopover) {
        syncCurrentPromptIntoHistory();
        if (promptHistorySearch) promptHistorySearch.value = "";
        renderPromptHistory("");
      }
      pop.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      refreshIcons();
    }
  }

  // —— Prompt History + Prompt Trace ——
  function hoursAgo(h) {
    return Date.now() - h * 60 * 60 * 1000;
  }
  function daysAgo(d) {
    return Date.now() - d * 24 * 60 * 60 * 1000;
  }

  const TONE_PROMPT =
    "Refine the tone of this section to be suitable for internal tax advisory review rather than client-facing communication.";

  let promptHistory = [
    {
      id: "ph-today-2",
      text: "Strengthen the executive summary and make the key risks clearer for tax and finance stakeholders.",
      createdAt: hoursAgo(1),
      context: "TOFA",
      label: "Executive summary",
      isCurrent: false,
      changes: [
        {
          id: "ph-today-2-c1",
          sectionId: "trace-exec",
          sectionTitle: "Executive Summary",
          beforeText:
            "This note looks at whether the proposed deal might fall under Australia’s TOFA rules and sketches some next steps for the team.",
          afterText:
            "This draft outlines a structured approach to assessing whether the proposed arrangement is likely to fall within Australia’s Taxation of Financial Arrangements (TOFA) framework under Division 230 of the Income Tax Assessment Act 1997, and the practical steps needed to implement any resulting tax treatment.",
          reportExcerpt: "This draft outlines a structured approach",
        },
      ],
    },
    {
      id: "ph-today-tone",
      text: TONE_PROMPT,
      createdAt: hoursAgo(2),
      context: "TOFA",
      label: "Tone refinement",
      isCurrent: false,
      changes: [
        {
          id: "ph-today-tone-c1",
          sectionId: "trace-tone-1",
          sectionTitle: "1.2 Description of Arrangement",
          beforeText:
            "The commercial arrangement encompasses rights and obligations regarding service delivery commitments, fee arrangements, professional obligations, and stakeholder contracts. Key components include service agreements, professional indemnity arrangements, operating leases, equipment contracts, and employment agreements.",
          afterText:
            "The arrangement is supported by formal engagement letters and related contractual documents, incorporating standard terms of business, professional standards, and risk management requirements. It also includes ongoing obligations relating to quality assurance, confidentiality, independence, and professional compliance, which inform the nature and timing of the underlying financial rights and obligations.",
          reportExcerpt: "The arrangement is expected to involve contractual rights",
        },
        {
          id: "ph-today-tone-c2",
          sectionId: "trace-tone-2",
          sectionTitle: "1.1 Entity Background",
          beforeText:
            "The client is an Australian business pursuing a new financing opportunity with both local and international partners, designed to support growth and broader treasury objectives.",
          afterText:
            "The draft assumes an Australian-resident company or tax consolidated group entering a financing or treasury arrangement with both domestic and cross-border features. Final advice should confirm residency, grouping, accounting framework and the commercial purpose of the arrangement before classification is locked.",
          reportExcerpt: "The draft assumes an Australian-resident company",
        },
      ],
    },
    {
      id: "ph-today-3",
      text: "Review the implementation considerations for Finance and Technology before the proposed go-live date.",
      createdAt: hoursAgo(3),
      context: "TOFA, Australia",
      label: "Implementation",
      isCurrent: false,
      changes: [
        {
          id: "ph-today-3-c1",
          sectionId: "trace-impl",
          sectionTitle: "5.1 Data Requirements",
          beforeText:
            "The team will need the usual deal information and some FX inputs before go-live. Missing data has caused issues on similar projects.",
          afterText:
            "Implementation typically requires deal terms, payment schedules, effective interest inputs, FX rates, and counterparty identifiers. Gaps in source data are a common cause of TOFA process failure.",
          reportExcerpt: "Implementation typically requires deal terms",
        },
      ],
    },
    {
      id: "ph-today-4",
      text: "Summarise the main tax risks and unresolved assumptions in the current TOFA draft.",
      createdAt: hoursAgo(5),
      context: "TOFA",
      label: "Risks",
      isCurrent: false,
      changes: [
        {
          id: "ph-today-4-c1",
          sectionId: "trace-exec",
          sectionTitle: "Executive Summary",
          beforeText:
            "A few risks remain open and should be discussed with the client once more facts are available.",
          afterText:
            "This draft outlines a structured approach to assessing whether the proposed arrangement is likely to fall within Australia’s Taxation of Financial Arrangements (TOFA) framework under Division 230 of the Income Tax Assessment Act 1997, and the practical steps needed to implement any resulting tax treatment.",
          reportExcerpt: "This draft outlines a structured approach",
        },
      ],
    },
    {
      id: "ph-yest-1",
      text: "Draft client advice on the Australian tax treatment of the proposed financing arrangement.",
      createdAt: daysAgo(1) + 4 * 60 * 60 * 1000,
      context: "Australia",
      label: "First draft",
      isCurrent: false,
      changes: [
        {
          id: "ph-yest-1-c1",
          sectionId: "trace-tone-1",
          sectionTitle: "1.2 Description of Arrangement",
          beforeText:
            "The proposed financing arrangement should be described once the commercial papers are available.",
          afterText:
            "The arrangement is expected to involve contractual rights and obligations to receive or provide cash or a cash equivalent over time. The commercial objective appears to include funding, risk management, or return enhancement. The transaction is expected to complete by 30 June 2026. Exact instrument terms, counterparties, and cash-flow profiles remain to be confirmed.",
          reportExcerpt: "The arrangement is expected to involve contractual rights",
        },
      ],
    },
    {
      id: "ph-yest-2",
      text: "Compare the relevant TOFA timing methods for this arrangement and note practical trade-offs.",
      createdAt: daysAgo(1) + 2 * 60 * 60 * 1000,
      context: "TOFA",
      label: "Timing methods",
      isCurrent: false,
      changes: [
        {
          id: "ph-yest-2-c1",
          sectionId: "trace-exec",
          sectionTitle: "Executive Summary",
          beforeText:
            "Timing method selection is still open and should be compared once the cash-flow profile is confirmed.",
          afterText:
            "This draft outlines a structured approach to assessing whether the proposed arrangement is likely to fall within Australia’s Taxation of Financial Arrangements (TOFA) framework under Division 230 of the Income Tax Assessment Act 1997, and the practical steps needed to implement any resulting tax treatment.",
          reportExcerpt: "This draft outlines a structured approach",
        },
      ],
    },
    {
      id: "ph-yest-3",
      text: "Identify the key information still required from the client before classification can be finalised.",
      createdAt: daysAgo(1),
      context: "TOFA, Australia",
      label: "Information request",
      isCurrent: false,
      changes: [
        {
          id: "ph-yest-3-c1",
          sectionId: "trace-impl",
          sectionTitle: "5.1 Data Requirements",
          beforeText:
            "Further client information is required before the classification can be completed.",
          afterText:
            "Implementation typically requires deal terms, payment schedules, effective interest inputs, FX rates, and counterparty identifiers. Gaps in source data are a common cause of TOFA process failure.",
          reportExcerpt: "Implementation typically requires deal terms",
        },
      ],
    },
    {
      id: "ph-week-1",
      text: "Prepare a first draft of advice on foreign exchange implications under the TOFA framework.",
      createdAt: daysAgo(7),
      context: "TOFA",
      label: "FX draft",
      isCurrent: false,
      changes: [
        {
          id: "ph-week-1-c1",
          sectionId: "trace-impl",
          sectionTitle: "5.1 Data Requirements",
          beforeText:
            "Foreign exchange implications should be considered once the currency mix is known.",
          afterText:
            "Implementation typically requires deal terms, payment schedules, effective interest inputs, FX rates, and counterparty identifiers. Gaps in source data are a common cause of TOFA process failure.",
          reportExcerpt: "Implementation typically requires deal terms",
        },
      ],
    },
    {
      id: "ph-month-1",
      text: "Draft an Australian tax implications report for the proposed transaction and related implementation steps.",
      createdAt: daysAgo(30),
      context: "Australia",
      label: "Initial report",
      isCurrent: false,
      changes: [
        {
          id: "ph-month-1-c1",
          sectionId: "trace-exec",
          sectionTitle: "Executive Summary",
          beforeText:
            "This report will summarise the Australian tax implications of the proposed transaction once the facts are confirmed.",
          afterText:
            "This draft outlines a structured approach to assessing whether the proposed arrangement is likely to fall within Australia’s Taxation of Financial Arrangements (TOFA) framework under Division 230 of the Income Tax Assessment Act 1997, and the practical steps needed to implement any resulting tax treatment.",
          reportExcerpt: "This draft outlines a structured approach",
        },
      ],
    },
  ];

  promptHistory.forEach(function (item) {
    item.affectedSectionCount = (item.changes || []).length;
  });

  function getPromptHistoryGroup(ts) {
    const d = new Date(ts);
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startYesterday = new Date(startToday);
    startYesterday.setDate(startYesterday.getDate() - 1);
    const startWeek = new Date(startToday);
    startWeek.setDate(startWeek.getDate() - 7);
    if (d >= startToday) return "Today";
    if (d >= startYesterday) return "Yesterday";
    if (d >= startWeek) return "One week ago";
    return "One month ago";
  }

  function formatPromptHistoryTime(createdAt, group) {
    const d = new Date(createdAt);
    const now = new Date();
    const g = group || getPromptHistoryGroup(createdAt);

    if (g === "Today") {
      const mins = Math.max(0, Math.round((now - d) / 60000));
      if (mins < 60) return Math.max(1, mins) + "m";
      const hours = Math.max(1, Math.round(mins / 60));
      return hours + "h";
    }

    if (g === "Yesterday") {
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }

    const sameYear = d.getFullYear() === now.getFullYear();
    if (!sameYear) {
      const yy = String(d.getFullYear()).slice(-2);
      return (
        d.toLocaleDateString([], { day: "numeric", month: "short" }) + " " + yy
      );
    }
    return d.toLocaleDateString([], { day: "numeric", month: "short" });
  }

  function formatPromptHistoryTimeTitle(createdAt, group) {
    const d = new Date(createdAt);
    const now = new Date();
    const g = group || getPromptHistoryGroup(createdAt);

    if (g === "Today") {
      const mins = Math.max(0, Math.round((now - d) / 60000));
      if (mins < 60) {
        const m = Math.max(1, mins);
        return m === 1 ? "1 minute ago" : m + " minutes ago";
      }
      const hours = Math.max(1, Math.round(mins / 60));
      return hours === 1 ? "1 hour ago" : hours + " hours ago";
    }

    if (g === "Yesterday") {
      return (
        "Yesterday at " +
        d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      );
    }

    return d.toLocaleDateString([], {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function syncCurrentPromptIntoHistory() {
    promptHistory.forEach(function (item) {
      item.isCurrent = false;
    });
    if (!workspace.submittedPrompt || !workspace.submittedPrompt.text) return;
    const text = workspace.submittedPrompt.text;
    const contexts = (workspace.submittedPrompt.contexts || []).join(", ");
    let current = promptHistory.find(function (item) {
      return item.isCurrent || item.id === "ph-current" || item.text === text;
    });
    if (current) {
      current.text = text;
      current.context = contexts;
      current.createdAt = Date.now();
      current.isCurrent = true;
      current.id = "ph-current";
      if (!current.changes) current.changes = [];
      current.affectedSectionCount = current.changes.length;
    } else {
      promptHistory.unshift({
        id: "ph-current",
        text: text,
        createdAt: Date.now(),
        context: contexts,
        isCurrent: true,
        label: "Current prompt",
        changes: [],
        affectedSectionCount: 0,
      });
    }
    // Keep current first among same-day items
    promptHistory.sort(function (a, b) {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      return b.createdAt - a.createdAt;
    });
  }

  function renderPromptHistory(query) {
    if (!promptHistoryBody) return;
    const q = String(query || "")
      .trim()
      .toLowerCase();
    const filtered = promptHistory.filter(function (item) {
      if (!q) return true;
      const sectionHay = (item.changes || [])
        .map(function (change) {
          return (change.sectionTitle || "") + " " + (change.reportExcerpt || "");
        })
        .join(" ");
      const hay =
        (item.text || "") +
        " " +
        (item.context || "") +
        " " +
        (item.label || "") +
        " " +
        sectionHay +
        (item.isCurrent ? " current" : "");
      return hay.toLowerCase().indexOf(q) !== -1;
    });

    if (!filtered.length) {
      promptHistoryBody.innerHTML =
        '<p class="wb-prompt-history-empty">No matching prompts</p>';
      return;
    }

    const order = ["Today", "Yesterday", "One week ago", "One month ago"];
    const groups = {};
    filtered.forEach(function (item) {
      const g = getPromptHistoryGroup(item.createdAt);
      if (!groups[g]) groups[g] = [];
      groups[g].push(item);
    });

    promptHistoryBody.innerHTML = order
      .filter(function (label) {
        return groups[label] && groups[label].length;
      })
      .map(function (label) {
        return (
          '<section class="wb-prompt-history-group">' +
          '<p class="wb-prompt-history-group__label">' +
          escapeHtml(label) +
          "</p>" +
          '<ul class="wb-prompt-history-list">' +
          groups[label]
            .map(function (item) {
              const timeLabel = formatPromptHistoryTime(item.createdAt, label);
              const timeTitle = formatPromptHistoryTimeTitle(item.createdAt, label);
              const showCurrent = !!item.isCurrent;
              const selected = workspace.activePromptTraceId === item.id;
              return (
                '<li><div class="wb-prompt-history-row' +
                (selected ? " is-selected" : "") +
                '" role="button" tabindex="0" data-prompt-id="' +
                escapeHtml(item.id) +
                '" aria-label="View prompt trace">' +
                '<span class="wb-prompt-history-row__text">' +
                escapeHtml(item.text) +
                "</span>" +
                '<span class="wb-prompt-history-row__trail">' +
                '<span class="wb-prompt-history-row__actions">' +
                '<button type="button" class="wb-icon-btn wb-prompt-history-row__action wb-tip" data-history-action="copy" data-tip="Copy prompt" aria-label="Copy prompt" title="Copy prompt" data-default-label="Copy prompt">' +
                '<i data-lucide="copy" aria-hidden="true"></i></button>' +
                '<button type="button" class="wb-icon-btn wb-prompt-history-row__action wb-tip" data-history-action="ask" data-tip="Ask Write" aria-label="Ask Write" title="Ask Write">' +
                '<i data-lucide="sparkles" aria-hidden="true"></i></button>' +
                "</span>" +
                (showCurrent
                  ? '<span class="wb-prompt-history-row__current">Current</span>'
                  : '<span class="wb-prompt-history-row__meta" title="' +
                    escapeHtml(timeTitle) +
                    '">' +
                    escapeHtml(timeLabel) +
                    "</span>") +
                "</span></div></li>"
              );
            })
            .join("") +
          "</ul></section>"
        );
      })
      .join("");
    refreshIcons();
  }

  function getPromptHistoryItem(id) {
    return promptHistory.find(function (item) {
      return item.id === id;
    });
  }

  function getPromptHistoryChanges(item) {
    return (item && item.changes) || [];
  }

  function formatPromptTraceStamp(createdAt) {
    const group = getPromptHistoryGroup(createdAt);
    if (group === "Today") {
      const mins = Math.max(0, Math.round((Date.now() - createdAt) / 60000));
      if (mins < 60) return Math.max(1, mins) + "m ago";
      return Math.max(1, Math.round(mins / 60)) + "h ago";
    }
    if (group === "Yesterday") return "Yesterday";
    return formatPromptHistoryTime(createdAt, group);
  }

  function placeAssistantCaretAtEnd() {
    if (!assistantInput) return;
    assistantInput.focus();
    const range = document.createRange();
    range.selectNodeContents(assistantInput);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function prefillAssistantPrompt(text, options) {
    options = options || {};
    if (!assistantInput) return false;
    closePopovers();
    openAssistantPanel();
    if (workspace.rightPanelMode === "source") {
      setRightPanelMode("assistant");
    }
    assistantInput.textContent = text == null ? "" : String(text);
    syncAssistantInputEmpty();
    if (options.focus !== false) placeAssistantCaretAtEnd();
    return true;
  }

  function fallbackCopyText(text) {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.left = "-9999px";
    document.body.appendChild(field);
    field.select();
    try {
      document.execCommand("copy");
    } catch (err) {
      /* ignore */
    }
    document.body.removeChild(field);
  }

  function markPromptCopied(button) {
    if (!button) return;
    if (workspace.promptHistoryCopiedTimer) {
      window.clearTimeout(workspace.promptHistoryCopiedTimer);
    }
    const label = "Copied";
    button.classList.add("is-copied");
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
    button.setAttribute("data-tip", label);
    const icon = button.querySelector("[data-lucide]");
    if (icon) icon.setAttribute("data-lucide", "check");
    refreshIcons();
    workspace.promptHistoryCopiedTimer = window.setTimeout(function () {
      const original = button.getAttribute("data-default-label") || "Copy prompt";
      button.classList.remove("is-copied");
      button.setAttribute("aria-label", original);
      button.setAttribute("title", original);
      button.setAttribute("data-tip", original);
      const nextIcon = button.querySelector("[data-lucide]");
      if (nextIcon) nextIcon.setAttribute("data-lucide", "copy");
      refreshIcons();
      workspace.promptHistoryCopiedTimer = null;
    }, 1000);
  }

  function copyPromptHistoryText(text, button) {
    const value = String(text || "");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(null, function () {
        fallbackCopyText(value);
      });
    } else {
      fallbackCopyText(value);
    }
    markPromptCopied(button);
  }

  function copyPromptHistoryById(id, button) {
    const item = getPromptHistoryItem(id);
    if (!item) return false;
    copyPromptHistoryText(item.text, button);
    return true;
  }

  function syncComposerQuoteDisclosure() {
    if (!composerQuote || !composerQuoteText || !composerQuoteMore) return;
    if (composerQuote.hidden) {
      composerQuote.classList.remove("is-overflowing", "is-expanded");
      composerQuoteMore.hidden = true;
      return;
    }
    if (composerQuote.classList.contains("is-expanded")) {
      composerQuoteMore.hidden = false;
      composerQuoteMore.textContent = "Show less";
      composerQuoteMore.setAttribute("aria-expanded", "true");
      return;
    }
    composerQuoteMore.textContent = "Show more";
    window.requestAnimationFrame(function () {
      if (!composerQuoteText || composerQuote.hidden) return;
      const lineHeight = parseFloat(getComputedStyle(composerQuoteText).lineHeight) || 18;
      const lines = composerQuoteText.scrollHeight / lineHeight;
      const needsToggle = lines > 3.25;
      composerQuote.classList.toggle("is-overflowing", needsToggle);
      composerQuoteMore.hidden = !needsToggle;
      composerQuoteMore.textContent = "Show more";
      composerQuoteMore.setAttribute("aria-expanded", "false");
    });
  }

  function renderComposerQuote() {
    const ctx = workspace.composerContext;
    if (!composerQuote || !composerQuoteText) return;
    if (!ctx || ctx.type !== "prompt-history" || !ctx.text) {
      composerQuote.hidden = true;
      composerQuote.classList.remove("is-expanded", "is-overflowing");
      composerQuoteText.textContent = "";
      if (composerQuoteMore) composerQuoteMore.hidden = true;
      return;
    }
    composerQuote.hidden = false;
    composerQuote.classList.remove("is-expanded");
    composerQuoteText.textContent = ctx.text;
    if (composerQuoteMore) {
      composerQuoteMore.hidden = true;
      composerQuoteMore.textContent = "Show more";
      composerQuoteMore.setAttribute("aria-expanded", "false");
    }
    syncComposerQuoteDisclosure();
    refreshIcons();
  }

  function setComposerPromptHistoryContext(item) {
    if (!item) return false;
    workspace.composerContext = {
      type: "prompt-history",
      sourceId: item.id,
      text: item.text,
      timestamp: item.createdAt,
    };
    renderComposerQuote();
    return true;
  }

  function clearComposerPromptHistoryContext() {
    workspace.composerContext = null;
    renderComposerQuote();
  }

  function toggleComposerQuoteExpanded() {
    if (!composerQuote || composerQuote.hidden) return;
    const expanded = composerQuote.classList.toggle("is-expanded");
    if (composerQuoteMore) {
      composerQuoteMore.textContent = expanded ? "Show less" : "Show more";
      composerQuoteMore.setAttribute("aria-expanded", expanded ? "true" : "false");
      if (!expanded) syncComposerQuoteDisclosure();
    }
  }

  function askWriteFromHistory(id) {
    const item = getPromptHistoryItem(id);
    if (!item) return false;
    closePopovers();
    openAssistantPanel();
    if (workspace.rightPanelMode === "source") {
      setRightPanelMode("assistant");
    }
    setComposerPromptHistoryContext(item);
    if (assistantInput) {
      assistantInput.setAttribute("data-placeholder", "Ask Write…");
      assistantInput.setAttribute("aria-label", "Ask Write");
    }
    syncAssistantInputEmpty();
    placeAssistantCaretAtEnd();
    return true;
  }

  function getTraceTargetEl(change) {
    if (!reportDoc || !change) return null;
    if (change.sectionId) {
      const slotted = reportDoc.querySelector(
        '[data-trace-slot="' + change.sectionId + '"]'
      );
      if (slotted) return slotted;
    }
    if (change.reportExcerpt) {
      const blocks = reportDoc.querySelectorAll("p, li, h2, h3");
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        if (block.closest(".wb-prompt-trace, .wb-rev-detail")) continue;
        if ((block.textContent || "").indexOf(change.reportExcerpt) !== -1) {
          return block;
        }
      }
    }
    if (change.sectionTitle) {
      const headings = reportDoc.querySelectorAll("h2, h3");
      for (let i = 0; i < headings.length; i++) {
        if ((headings[i].textContent || "").trim() === change.sectionTitle) {
          let next = headings[i].nextElementSibling;
          while (next && !/^(P|LI|UL|OL)$/.test(next.tagName)) {
            next = next.nextElementSibling;
          }
          return next || headings[i];
        }
      }
    }
    return null;
  }

  function getTraceAnchorHost(target) {
    if (!target) return null;
    return target.closest(".wb-rev-unit") || target;
  }

  function clearPromptTraceHighlights() {
    if (!reportDoc) return;
    reportDoc.querySelectorAll(".wb-prompt-trace-mark").forEach(function (mark) {
      const parent = mark.parentNode;
      if (!parent) return;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
    });
    reportDoc.querySelectorAll(".wb-prompt-trace-anchor").forEach(function (el) {
      el.classList.remove("wb-prompt-trace-anchor", "is-active");
    });
  }

  function applyPromptTraceHighlight(target, active) {
    if (!target) return;
    target.classList.add("wb-prompt-trace-anchor");
    let mark = null;
    if (
      target.childNodes.length === 1 &&
      target.firstElementChild &&
      target.firstElementChild.classList.contains("wb-prompt-trace-mark")
    ) {
      mark = target.firstElementChild;
    } else {
      mark = document.createElement("span");
      mark.className = "wb-prompt-trace-mark";
      while (target.firstChild) mark.appendChild(target.firstChild);
      target.appendChild(mark);
    }
    mark.classList.toggle("is-active", !!active);
  }

  function removePromptTraceCard() {
    const existing = document.getElementById("wb-prompt-trace");
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
  }

  function closePromptTrace() {
    workspace.activePromptTraceId = null;
    workspace.activePromptTraceChangeId = null;
    clearPromptTraceHighlights();
    removePromptTraceCard();
    if (promptHistoryBody && promptHistoryPopover && !promptHistoryPopover.hidden) {
      renderPromptHistory(promptHistorySearch && promptHistorySearch.value);
    }
  }

  function ensurePromptTraceEl() {
    let el = document.getElementById("wb-prompt-trace");
    if (el) return el;
    el = document.createElement("div");
    el.id = "wb-prompt-trace";
    el.className = "wb-diff-surface wb-diff-surface--prompt-trace wb-prompt-trace";
    el.setAttribute("contenteditable", "false");
    el.setAttribute("role", "region");
    el.setAttribute("aria-label", "Prompt trace");
    return el;
  }

  function getActivePromptTrace() {
    const item = getPromptHistoryItem(workspace.activePromptTraceId);
    if (!item) return null;
    const changes = getPromptHistoryChanges(item);
    if (!changes.length) return { item: item, changes: [], change: null, index: -1 };
    let index = changes.findIndex(function (change) {
      return change.id === workspace.activePromptTraceChangeId;
    });
    if (index < 0) index = 0;
    return { item: item, changes: changes, change: changes[index], index: index };
  }

  function renderActivePromptTrace(options) {
    options = options || {};
    const state = getActivePromptTrace();
    if (!state || !state.item) {
      closePromptTrace();
      return Promise.resolve(false);
    }
    const item = state.item;
    const change = state.change;
    const changes = state.changes;
    const index = state.index;
    if (change) workspace.activePromptTraceChangeId = change.id;

    clearPromptTraceHighlights();
    changes.forEach(function (entry, i) {
      applyPromptTraceHighlight(getTraceTargetEl(entry), i === index);
    });

    const card = ensurePromptTraceEl();
    const host = getTraceAnchorHost(getTraceTargetEl(change)) || (reportDoc && reportDoc.lastElementChild);
    if (host && card.parentNode !== host.parentNode) {
      host.insertAdjacentElement("afterend", card);
    } else if (host && card.previousElementSibling !== host) {
      host.insertAdjacentElement("afterend", card);
    }

    const multi = changes.length > 1;
    const stamp = formatPromptTraceStamp(item.createdAt);
    const section = change ? change.sectionTitle : "";
    const promptText = item.text || "";
    const beforeText = change ? change.beforeText : "No recorded original content.";
    const afterText = change ? change.afterText : "No recorded generated content.";

    card.innerHTML =
      '<div class="wb-diff-surface__header">' +
      '<div class="wb-diff-surface__lead">' +
      '<span class="wb-diff-surface__icon" aria-hidden="true">' +
      '<i data-lucide="history"></i></span>' +
      '<div class="wb-diff-surface__identity">' +
      '<p class="wb-diff-surface__prompt" title="' +
      escapeHtml(promptText) +
      '">' +
      escapeHtml(promptText) +
      "</p>" +
      "</div></div>" +
      '<div class="wb-diff-surface__toolbar">' +
      '<button type="button" class="wb-icon-btn wb-tip" data-trace-action="copy" data-tip="Copy prompt" aria-label="Copy prompt" title="Copy prompt" data-default-label="Copy prompt">' +
      '<i data-lucide="copy" aria-hidden="true"></i></button>' +
      '<button type="button" class="wb-icon-btn wb-tip" data-trace-action="ask" data-tip="Ask Write" aria-label="Ask Write" title="Ask Write">' +
      '<i data-lucide="sparkles" aria-hidden="true"></i></button>' +
      '<button type="button" class="wb-icon-btn wb-tip wb-diff-surface__close" data-trace-action="close" data-tip="Close trace" aria-label="Close trace" title="Close trace">' +
      '<i data-lucide="x" aria-hidden="true"></i></button>' +
      "</div></div>" +
      '<div class="wb-diff-surface__cols">' +
      '<div class="wb-diff-surface__pane wb-diff-surface__pane--before">' +
      '<span class="wb-diff-surface__label">Before</span>' +
      '<p class="wb-diff-surface__text wb-rev-del">' +
      escapeHtml(beforeText) +
      "</p></div>" +
      '<div class="wb-diff-surface__pane wb-diff-surface__pane--after">' +
      '<span class="wb-diff-surface__label">After</span>' +
      '<p class="wb-diff-surface__text wb-rev-ins-mark">' +
      escapeHtml(afterText) +
      "</p></div></div>" +
      (stamp || section || multi
        ? '<div class="wb-diff-surface__utility">' +
          '<p class="wb-diff-surface__meta">' +
          escapeHtml([stamp, section].filter(Boolean).join(" · ")) +
          "</p>" +
          (multi
            ? '<div class="wb-diff-surface__nav" role="group" aria-label="Prompt changes">' +
              '<button type="button" class="wb-icon-btn wb-tip" data-trace-action="prev" data-tip="Previous change" aria-label="Previous change" title="Previous change"' +
              (index <= 0 ? " disabled" : "") +
              '><i data-lucide="chevron-left" aria-hidden="true"></i></button>' +
              '<span class="wb-diff-surface__counter">' +
              (index + 1) +
              " / " +
              changes.length +
              "</span>" +
              '<button type="button" class="wb-icon-btn wb-tip" data-trace-action="next" data-tip="Next change" aria-label="Next change" title="Next change"' +
              (index >= changes.length - 1 ? " disabled" : "") +
              '><i data-lucide="chevron-right" aria-hidden="true"></i></button>' +
              "</div>"
            : "") +
          "</div>"
        : "");

    refreshIcons();

    const scrollTarget = host || card;
    const reveal = function () {
      if (options.enter !== false) {
        card.classList.remove("is-enter");
        void card.offsetWidth;
        card.classList.add("is-enter");
      }
    };

    if (options.scroll === false || !reportScroll || !scrollTarget) {
      reveal();
      return Promise.resolve(true);
    }

    if (options.swap) {
      card.classList.add("is-swap");
      window.setTimeout(function () {
        card.classList.remove("is-swap");
      }, prefersReducedMotion ? 40 : 180);
    }

    return centerTargetInScrollContainer(scrollTarget, reportScroll, {
      align: 0.45,
      topInset: 72,
      bottomInset: 80,
      minDuration: options.minDuration == null ? 650 : options.minDuration,
      maxDuration: options.maxDuration == null ? 900 : options.maxDuration,
      instant: !!options.instant,
    }).then(function () {
      reveal();
      return true;
    });
  }

  function openPromptTrace(id, changeId, options) {
    const item = getPromptHistoryItem(id);
    if (!item) return Promise.resolve(false);
    closePopovers();
    const changes = getPromptHistoryChanges(item);
    workspace.activePromptTraceId = item.id;
    workspace.activePromptTraceChangeId =
      changeId || (changes[0] && changes[0].id) || null;
    return renderActivePromptTrace(
      Object.assign({ scroll: true, enter: true }, options || {})
    );
  }

  function goPromptTraceChange(delta) {
    const state = getActivePromptTrace();
    if (!state || !state.changes.length) return Promise.resolve(false);
    const next = Math.max(0, Math.min(state.changes.length - 1, state.index + delta));
    if (next === state.index) return Promise.resolve(false);
    workspace.activePromptTraceChangeId = state.changes[next].id;
    return renderActivePromptTrace({ scroll: true, enter: false, swap: true });
  }

  function handlePromptTraceAction(action, button) {
    const state = getActivePromptTrace();
    if (action === "close") {
      closePromptTrace();
      return;
    }
    if (action === "prev") {
      goPromptTraceChange(-1);
      return;
    }
    if (action === "next") {
      goPromptTraceChange(1);
      return;
    }
    if (!state || !state.item) return;
    if (action === "copy") {
      copyPromptHistoryText(state.item.text, button);
      return;
    }
    if (action === "ask") {
      askWriteFromHistory(state.item.id);
    }
  }

  function setPromptHistoryQuery(query) {
    if (promptHistorySearch) promptHistorySearch.value = query == null ? "" : String(query);
    renderPromptHistory(query);
  }

  function resetPromptHistoryUi(options) {
    options = options || {};
    closePromptTrace();
    setPromptHistoryQuery("");
    closePopovers();
    if (options.clearComposer !== false) {
      if (assistantInput) assistantInput.textContent = "";
      clearComposerPromptHistoryContext();
      syncAssistantInputEmpty();
    }
    if (options.assistantMode !== false) {
      setRightPanelMode("assistant");
    }
    if (reportScroll && options.resetScroll !== false) {
      reportScroll.scrollTop = 0;
    }
  }

  function handlePromptHistoryRowActivate(row, event) {
    if (!row) return;
    if (event && event.target && event.target.closest("[data-history-action]")) return;
    openPromptTrace(row.getAttribute("data-prompt-id"));
  }

  function autoCollapseSidebarOnce() {
    if (workspace.didAutoCollapseSidebar) return;
    workspace.didAutoCollapseSidebar = true;
    if (
      window.WriteBuilderCompose &&
      typeof window.WriteBuilderCompose.setSidebarCollapsed === "function"
    ) {
      window.WriteBuilderCompose.setSidebarCollapsed(true);
    } else if (app) {
      app.classList.add("is-sidebar-collapsed");
    }
  }

  function syncAssistantInputEmpty() {
    if (!assistantInput) return;
    const empty = !(assistantInput.textContent || "").trim();
    assistantInput.classList.toggle("is-empty", empty);
    if (assistantSend && workspace.assistantStatus !== "working" && workspace.assistantStatus !== "streaming") {
      assistantSend.disabled = empty;
      assistantSend.setAttribute("aria-label", empty ? "Send (disabled)" : "Send");
      const icon = assistantSend.querySelector("[data-lucide]");
      if (icon) icon.setAttribute("data-lucide", "arrow-up");
      refreshIcons();
    }
  }

  function setAssistantSendGenerating(on) {
    if (!assistantSend) return;
    if (on) {
      assistantSend.disabled = false;
      assistantSend.classList.add("is-generating");
      assistantSend.setAttribute("aria-label", "Stop generation");
      const icon = assistantSend.querySelector("[data-lucide]");
      if (icon) icon.setAttribute("data-lucide", "square");
    } else {
      assistantSend.classList.remove("is-generating");
      syncAssistantInputEmpty();
    }
    refreshIcons();
  }

  function setSubmittedPromptSnapshot(promptText, contexts) {
    const text = String(promptText || "").replace(/\s+$/g, "");
    if (!text) {
      workspace.submittedPrompt = null;
      return;
    }
    workspace.submittedPrompt = {
      text: text,
      contexts: Array.isArray(contexts)
        ? contexts.filter(Boolean).map(function (c) {
            return String(c);
          })
        : [],
      expanded: false,
    };
  }

  function clearSubmittedPrompt() {
    workspace.submittedPrompt = null;
    const existing = document.getElementById("wb-assistant-prompt");
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
  }

  function syncSubmittedPromptToggle() {
    const wrap = document.getElementById("wb-assistant-prompt");
    if (!wrap || !workspace.submittedPrompt) return;
    const textEl = wrap.querySelector(".wb-assistant-prompt__text");
    const toggle = wrap.querySelector(".wb-assistant-prompt__toggle");
    const fade = wrap.querySelector(".wb-assistant-prompt__fade");
    if (!textEl || !toggle) return;
    if (workspace.submittedPrompt.expanded) {
      toggle.hidden = false;
      toggle.textContent = "Show less";
      toggle.setAttribute("aria-expanded", "true");
      if (fade) fade.hidden = true;
      return;
    }
    const needsToggle = textEl.scrollHeight > textEl.clientHeight + 1;
    toggle.hidden = !needsToggle;
    toggle.textContent = "Show more";
    toggle.setAttribute("aria-expanded", "false");
    if (fade) fade.hidden = !needsToggle;
  }

  function renderSubmittedPromptPreview() {
    if (!assistantThread || !workspace.submittedPrompt) return null;
    const existing = document.getElementById("wb-assistant-prompt");
    if (existing) existing.remove();

    const snap = workspace.submittedPrompt;
    const wrap = document.createElement("div");
    wrap.className =
      "wb-assistant-msg wb-assistant-prompt" +
      (snap.expanded ? " is-expanded" : "");
    wrap.id = "wb-assistant-prompt";

    if (snap.contexts && snap.contexts.length) {
      const chips = document.createElement("div");
      chips.className = "wb-assistant-prompt__chips";
      snap.contexts.forEach(function (label) {
        const chip = document.createElement("span");
        chip.className = "wb-assistant-prompt__chip";
        chip.textContent = label;
        chips.appendChild(chip);
      });
      wrap.appendChild(chips);
    }

    const body = document.createElement("div");
    body.className = "wb-assistant-prompt__body";

    const textEl = document.createElement("div");
    textEl.className = "wb-assistant-prompt__text";
    textEl.textContent = snap.text;
    body.appendChild(textEl);

    const fade = document.createElement("div");
    fade.className = "wb-assistant-prompt__fade";
    fade.setAttribute("aria-hidden", "true");
    if (snap.expanded) fade.hidden = true;
    body.appendChild(fade);
    wrap.appendChild(body);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "wb-assistant-prompt__toggle";
    toggle.id = "wb-assistant-prompt-toggle";
    toggle.setAttribute("aria-controls", "wb-assistant-prompt");
    toggle.setAttribute("aria-expanded", snap.expanded ? "true" : "false");
    toggle.textContent = snap.expanded ? "Show less" : "Show more";
    wrap.appendChild(toggle);

    assistantThread.insertBefore(wrap, assistantThread.firstChild);
    window.requestAnimationFrame(function () {
      syncSubmittedPromptToggle();
    });
    return wrap;
  }

  function toggleSubmittedPromptExpanded() {
    if (!workspace.submittedPrompt) return;
    const wrap = document.getElementById("wb-assistant-prompt");
    const wasExpanded = workspace.submittedPrompt.expanded;
    workspace.submittedPrompt.expanded = !wasExpanded;
    if (wrap) {
      wrap.classList.toggle("is-expanded", workspace.submittedPrompt.expanded);
    }
    syncSubmittedPromptToggle();
    if (!workspace.submittedPrompt.expanded && wrap && assistantThread) {
      // Keep prompt near top after collapse
      const top = wrap.offsetTop - 8;
      if (assistantThread.scrollTop > top) {
        assistantThread.scrollTop = Math.max(0, top);
      }
    }
  }

  function appendAssistantWorking() {
    const wrap = document.createElement("div");
    wrap.className = "wb-assistant-msg wb-assistant-msg--assistant";
    wrap.id = "wb-assistant-working";

    const head = document.createElement("div");
    head.className = "wb-agent-todo__head";
    head.textContent = "Agent plan";

    const label = document.createElement("div");
    label.className = "wb-assistant-msg__working is-shimmer";
    label.id = "wb-assistant-working-label";
    label.hidden = true;
    label.textContent = AGENT_TODO_PLAN[0];

    const progress = document.createElement("ul");
    progress.className = "wb-agent-todo";
    progress.id = "wb-agent-progress";
    progress.setAttribute("aria-label", "Agent plan");

    wrap.appendChild(head);
    wrap.appendChild(label);
    wrap.appendChild(progress);
    assistantThread.appendChild(wrap);
    renderAgentTodo(0, { reset: true });
    assistantThread.scrollTop = assistantThread.scrollHeight;
    return label;
  }

  function renderAgentTodo(activeIndex, options) {
    options = options || {};
    const list = document.getElementById("wb-agent-progress");
    const labelEl = document.getElementById("wb-assistant-working-label");
    if (!list) return;
    if (options.reset) resetAgentPlanState();
    let active = activeIndex == null ? -1 : activeIndex;
    const completeAll = !!options.completeAll;
    if (!options.reset && !completeAll && active >= 0 && active < agentPlanState.activeIndex) {
      return false;
    }
    if (
      !options.reset &&
      !completeAll &&
      active === agentPlanState.activeIndex &&
      !options.force &&
      !options.activeLabel
    ) {
      return true;
    }
    if (active >= 0) agentPlanState.activeIndex = active;
    if (completeAll) agentPlanState.activeIndex = AGENT_TODO_PLAN.length - 1;
    const overrideLabel = options.activeLabel;

    list.innerHTML = "";
    AGENT_TODO_PLAN.forEach(function (text, i) {
      const li = document.createElement("li");
      li.className = "wb-agent-todo__item";
      let state = "pending";
      if (completeAll || i < active) state = "done";
      else if (i === active) state = "active";
      li.classList.add("is-" + state);
      li.setAttribute("data-state", state);
      const labelText = state === "active" && overrideLabel ? overrideLabel : text;
      const stateLabel =
        state === "done" ? "completed" : state === "active" ? "in progress" : "pending";
      li.setAttribute("aria-label", labelText + " — " + stateLabel);

      const marker = document.createElement("span");
      marker.className = "wb-agent-todo__marker";
      marker.setAttribute("aria-hidden", "true");
      const icon = document.createElement("i");
      icon.setAttribute(
        "data-lucide",
        state === "done" ? "circle-check" : state === "active" ? "loader-circle" : "circle"
      );
      if (state === "active") icon.className = "wb-agent-todo__spinner";
      marker.appendChild(icon);

      const task = document.createElement("span");
      task.className = "wb-agent-todo__label";
      task.textContent = labelText;

      li.appendChild(marker);
      li.appendChild(task);
      list.appendChild(li);
    });
    refreshIcons();

    if (labelEl) {
      if (completeAll) {
        labelEl.hidden = false;
        labelEl.classList.remove("is-shimmer");
        labelEl.textContent = "Report draft ready";
      } else if (active >= 0 && active < AGENT_TODO_PLAN.length) {
        labelEl.hidden = true;
        labelEl.textContent = overrideLabel || AGENT_TODO_PLAN[active];
      }
    }
    if (assistantThread && options.scroll !== false) {
      assistantThread.scrollTop = assistantThread.scrollHeight;
    }
    return true;
  }

  function renderAgentProgressList(activeLabel, completedLabels) {
    // Compatibility shim: map label → todo index
    let idx = AGENT_TODO_PLAN.indexOf(activeLabel);
    if (idx < 0) {
      for (let i = 0; i < WORKING_BY_PROGRESS.length; i++) {
        if (WORKING_BY_PROGRESS[i].label === activeLabel) {
          idx = WORKING_BY_PROGRESS[i].todo;
          break;
        }
      }
    }
    if (idx < 0) idx = Math.min(completedLabels ? completedLabels.length : 0, AGENT_TODO_PLAN.length - 1);
    renderAgentTodo(idx, { activeLabel: activeLabel });
  }

  async function waitForCinematicAgentPlanFocus() {
    const demo = window.WriteBuilderDemo;
    if (!demo || typeof demo.getActive !== "function" || demo.getActive() !== "create-report") {
      return;
    }
    if (typeof demo.isAgentPlanFocusReady === "function" && demo.isAgentPlanFocusReady()) {
      return;
    }
    const start = performance.now();
    while (performance.now() - start < 4500) {
      if (workspace.abort) return;
      if (demo.isAgentPlanFocusReady && demo.isAgentPlanFocusReady()) return;
      await delay(40);
    }
  }

  async function runCinematicAnalysisPhase(labelEl) {
    await waitForCinematicAgentPlanFocus();
    if (workspace.abort) return;
    for (let i = 0; i < ANALYSIS_PHASE_STEPS.length; i++) {
      if (workspace.abort) return;
      const step = ANALYSIS_PHASE_STEPS[i];
      renderAgentTodo(step.todo, { activeLabel: step.label });
      if (labelEl) labelEl.textContent = step.label;
      await delay(prefersReducedMotion ? 60 : 700 + Math.floor(Math.random() * 80));
    }
    renderAgentTodo(5, { activeLabel: "Draft report", force: true });
    if (labelEl) {
      labelEl.textContent = "Draft report";
      labelEl.dataset.todoStep = "5";
    }
    agentPlanState.floorIndex = 5;
  }

  function appendAssistantMessage(html, withSuggestions) {
    const wrap = document.createElement("div");
    wrap.className = "wb-assistant-msg wb-assistant-msg--assistant";
    const body = document.createElement("div");
    body.className = "wb-assistant-msg__body";
    body.innerHTML = html;
    wrap.appendChild(body);
    if (withSuggestions) {
      const suggestions = document.createElement("div");
      suggestions.className = "wb-assistant-suggestions";
      [
        { key: "risks", label: "Summarise the key risks" },
        { key: "exec", label: "Strengthen the executive summary" },
        { key: "impl", label: "Review implementation steps" },
      ].forEach(function (s) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "wb-btn wb-btn--ghost wb-assistant-suggestion";
        btn.dataset.suggestion = s.key;
        btn.textContent = s.label;
        suggestions.appendChild(btn);
      });
      wrap.appendChild(suggestions);
    }
    assistantThread.appendChild(wrap);
    assistantThread.scrollTop = assistantThread.scrollHeight;
    return wrap;
  }

  function appendUserMessage(text, quote) {
    const wrap = document.createElement("div");
    wrap.className = "wb-assistant-msg wb-assistant-msg--user";
    if (quote && quote.text) {
      const quoted = document.createElement("div");
      quoted.className = "wb-assistant-msg__quote";
      quoted.textContent = quote.text;
      wrap.appendChild(quoted);
    }
    const bubble = document.createElement("div");
    bubble.className = "wb-assistant-msg__bubble";
    bubble.textContent = text;
    wrap.appendChild(bubble);
    assistantThread.appendChild(wrap);
    assistantThread.scrollTop = assistantThread.scrollHeight;
  }

  function maybeAutoScrollReport() {
    if (!reportScroll) return;
    const distanceFromBottom =
      reportScroll.scrollHeight - reportScroll.scrollTop - reportScroll.clientHeight;
    if (distanceFromBottom > 120) {
      workspace.userScrolledAway = true;
      return;
    }
    workspace.userScrolledAway = false;
    reportScroll.scrollTop = reportScroll.scrollHeight;
  }

  function updateWorkingLabel(labelEl, progress) {
    if (!labelEl) return;
    for (let i = 0; i < WORKING_BY_PROGRESS.length; i++) {
      if (progress <= WORKING_BY_PROGRESS[i].until) {
        const step = WORKING_BY_PROGRESS[i];
        const next = step.label;
        if (labelEl.dataset.todoStep !== String(step.todo)) {
          const applied = renderAgentTodo(step.todo, { activeLabel: next, scroll: false });
          if (applied) {
            labelEl.dataset.todoStep = String(step.todo);
            labelEl.textContent = next;
          }
        }
        return;
      }
    }
  }

  function chunkInterval() {
    if (prefersReducedMotion) return 8;
    return 22 + Math.floor(Math.random() * 28); // 22–49ms
  }

  function splitWordChunks(text) {
    const parts = text.match(/\S+\s*/g);
    if (!parts || !parts.length) return text ? [text] : [];
    const chunks = [];
    let i = 0;
    while (i < parts.length) {
      const n = prefersReducedMotion
        ? Math.min(parts.length - i, 14)
        : 3 + Math.floor(Math.random() * 6); // 3–8 words
      chunks.push(parts.slice(i, i + n).join(""));
      i += n;
    }
    return chunks;
  }

  async function streamTextInto(el, text) {
    const chunks = splitWordChunks(text);
    for (let i = 0; i < chunks.length; i++) {
      if (workspace.abort) {
        el.appendChild(document.createTextNode(chunks.slice(i).join("")));
        maybeAutoScrollReport();
        return;
      }
      el.appendChild(document.createTextNode(chunks[i]));
      maybeAutoScrollReport();
      await delay(chunkInterval());
    }
  }

  async function streamDomChildren(target, sourceEl) {
    const children = Array.prototype.slice.call(sourceEl.childNodes);
    for (let c = 0; c < children.length; c++) {
      if (workspace.abort) {
        for (let r = c; r < children.length; r++) {
          target.appendChild(children[r].cloneNode(true));
        }
        maybeAutoScrollReport();
        return;
      }
      await streamDomNode(target, children[c]);
    }
  }

  async function streamDomNode(parent, node) {
    if (workspace.abort) {
      parent.appendChild(node.cloneNode(true));
      maybeAutoScrollReport();
      return;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      await streamTextInto(parent, node.textContent || "");
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName;

    if (node.classList && node.classList.contains("wb-cite-group")) {
      parent.appendChild(node.cloneNode(true));
      renderSourcesList();
      maybeAutoScrollReport();
      await delay(prefersReducedMotion ? 10 : 45);
      return;
    }

    if (node.classList && node.classList.contains("wb-cite")) {
      parent.appendChild(node.cloneNode(true));
      renderSourcesList();
      maybeAutoScrollReport();
      await delay(prefersReducedMotion ? 10 : 40);
      return;
    }

    if (/^H[1-6]$/.test(tag)) {
      const heading = document.createElement(tag);
      if (node.id) heading.id = node.id;
      heading.innerHTML = node.innerHTML;
      parent.appendChild(heading);
      maybeAutoScrollReport();
      await delay(prefersReducedMotion ? 40 : 160 + Math.floor(Math.random() * 90));
      return;
    }

    if (tag === "TABLE") {
      const table = node.cloneNode(false);
      parent.appendChild(table);
      const sections = Array.prototype.slice.call(node.children);
      for (let s = 0; s < sections.length; s++) {
        const section = sections[s];
        const secEl = document.createElement(section.tagName);
        table.appendChild(secEl);
        const rows = Array.prototype.slice.call(section.children);
        for (let r = 0; r < rows.length; r++) {
          if (workspace.abort) {
            for (let rr = r; rr < rows.length; rr++) {
              secEl.appendChild(rows[rr].cloneNode(true));
            }
            break;
          }
          const row = rows[r];
          const tr = document.createElement("tr");
          secEl.appendChild(tr);
          const cells = Array.prototype.slice.call(row.children);
          for (let c = 0; c < cells.length; c++) {
            const cell = cells[c];
            const td = document.createElement(cell.tagName);
            tr.appendChild(td);
            await streamDomChildren(td, cell);
          }
          maybeAutoScrollReport();
          await delay(prefersReducedMotion ? 20 : 70);
        }
      }
      return;
    }

    if (tag === "BR") {
      parent.appendChild(document.createElement("br"));
      return;
    }

    const el = document.createElement(tag);
    if (node.className) el.className = node.className;
    if (node.id) el.id = node.id;
    if (node.getAttribute && node.getAttribute("data-rev-slot")) {
      el.setAttribute("data-rev-slot", node.getAttribute("data-rev-slot"));
    }
    if (node.getAttribute && node.getAttribute("data-collab-slot")) {
      el.setAttribute("data-collab-slot", node.getAttribute("data-collab-slot"));
    }
    parent.appendChild(el);

    if (tag === "LI") {
      // Stream list item content; marker appears with the element
      await streamDomChildren(el, node);
      await delay(prefersReducedMotion ? 15 : 50);
      return;
    }

    await streamDomChildren(el, node);

    if (tag === "P" || tag === "UL" || tag === "OL") {
      await delay(prefersReducedMotion ? 20 : 90 + Math.floor(Math.random() * 80));
    }
  }

  async function streamHtmlBlock(container, html) {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    container.classList.add("is-visible");
    await streamDomChildren(container, tmp);
  }

  async function streamReportBlocks(workingLabel) {
    if (!reportDoc) return;
    reportDoc.innerHTML = "";
    workspace.userScrolledAway = false;
    const total = REPORT_BLOCKS.length;

    for (let i = 0; i < total; i++) {
      if (workspace.abort) return;
      const block = REPORT_BLOCKS[i];
      updateWorkingLabel(workingLabel, (i + 0.35) / total);

      const el = document.createElement("div");
      el.className = "wb-doc-block is-visible";
      if (block.id) el.id = block.id + "-wrap";
      reportDoc.appendChild(el);

      await streamHtmlBlock(el, block.html);
      if (workspace.abort) return;

      updateWorkingLabel(workingLabel, (i + 1) / total);
      renderSourcesList();

      // Brief beat between major sections
      const sectionPause = prefersReducedMotion
        ? 20
        : Math.min(220, Math.max(120, (block.delay || 320) * 0.35));
      await delay(sectionPause);
    }
  }

  async function streamHtmlIntoElement(el, html) {
    el.innerHTML = "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    await streamDomChildren(el, tmp);
  }

  async function streamAssistantFinal() {
    const working = document.getElementById("wb-assistant-working");
    if (working) working.remove();
    workspace.assistantStatus = "streaming";
    const wrap = appendAssistantMessage("", true);
    const body = wrap.querySelector(".wb-assistant-msg__body");
    const suggestions = wrap.querySelector(".wb-assistant-suggestions");
    if (suggestions) suggestions.hidden = true;

    await streamHtmlIntoElement(body, ASSISTANT_FINAL_HTML);
    if (workspace.abort) {
      workspace.assistantStatus = "complete";
      return;
    }
    if (suggestions) suggestions.hidden = false;
    workspace.assistantStatus = "complete";
  }

  async function enterEditorAndGenerate() {
    workspace.abort = false;
    resetAgentPlanState();
    workspace.view = "generating";
    workspace.reportStatus = "generating";
    workspace.assistantStatus = "working";
    workspace.versions = [];
    workspace.reportVersion = 0;
    workspace.didAutoCollapseSidebar = false;
    resetRevisionState();
    resetCollaborationState();
    resetCommentState();
    clearTimers();
    closePopovers();
    closeCitePopover();

    if (assistantThread) assistantThread.innerHTML = "";
    if (reportDoc) reportDoc.innerHTML = "";
    if (assistantInput) {
      assistantInput.textContent = "";
    }
    clearComposerPromptHistoryContext();
    syncAssistantInputEmpty();

    setDocumentsNavActive();
    setReportStatus("Generating report", true);
    setAssistantSendGenerating(true);
    autoCollapseSidebarOnce();
    if (reportDoc) reportDoc.setAttribute("contenteditable", "false");

    if (composeView) composeView.classList.add("is-exiting");
    if (editorView) {
      editorView.hidden = false;
      editorView.removeAttribute("hidden");
      editorView.setAttribute("aria-hidden", "false");
    }
    if (app) {
      app.classList.add("is-editor-view");
      if (window.matchMedia("(max-width: 900px)").matches) {
        app.classList.add("is-assistant-open");
      }
    }
    // Show submitted prompt immediately so conversation context is visible
    if (workspace.submittedPrompt) {
      workspace.submittedPrompt.expanded = false;
      renderSubmittedPromptPreview();
      syncCurrentPromptIntoHistory();
    }
    refreshIcons();
    await delay(prefersReducedMotion ? 0 : 280);

    if (workspace.abort) return;

    if (composeView) composeView.classList.remove("is-exiting");
    workspace.view = "editor";

    const workingLabel = appendAssistantWorking();
    workingLabel.textContent = "Understand request";
    syncSubmittedPromptToggle();

    const cinematicCreate =
      window.WriteBuilderDemo &&
      typeof window.WriteBuilderDemo.getActive === "function" &&
      window.WriteBuilderDemo.getActive() === "create-report";

    if (cinematicCreate) {
      await runCinematicAnalysisPhase(workingLabel);
    } else {
      renderAgentTodo(0);
      await delay(prefersReducedMotion ? 40 : 700);
    }
    if (workspace.abort) {
      finalizeGeneration(false);
      return;
    }

    await streamReportBlocks(workingLabel);
    if (workspace.abort) {
      finalizeGeneration(false);
      return;
    }

    await delay(prefersReducedMotion ? 40 : 350);
    renderAgentTodo(AGENT_TODO_PLAN.length - 1, { completeAll: true });
    await delay(prefersReducedMotion ? 40 : 500);
    await streamAssistantFinal();
    if (workspace.abort) {
      finalizeGeneration(false);
      return;
    }

    finalizeGeneration(true);
  }

  function finalizeGeneration(completed) {
    const working = document.getElementById("wb-assistant-working");
    if (working && completed) {
      renderAgentTodo(AGENT_TODO_PLAN.length - 1, { completeAll: true });
    }
    clearTimers();
    workspace.reportStatus = "complete";
    workspace.assistantStatus = "complete";
    setAssistantSendGenerating(false);
    if (reportDoc) reportDoc.setAttribute("contenteditable", "true");
    renderSourcesList();

    if (completed) {
      addVersion("Initial AI draft");
      seedDemoRevisions();
      ensureAccess("alex", "edit");
      ensureAccess("priya", "view");
      renderSharePeople();
      renderCollabAvatars();
      setReportStatus("Report ready", false);
      window.setTimeout(function () {
        if (workspace.reportStatus === "complete") setReportStatus("", false);
      }, 1000);
    } else {
      setReportStatus("", false);
      if (workspace.reportVersion === 0 && reportDoc && reportDoc.children.length) {
        addVersion("Partial draft (stopped)");
      }
    }

    if (window.WriteBuilderCompose && typeof window.WriteBuilderCompose.onGenerationEnded === "function") {
      window.WriteBuilderCompose.onGenerationEnded(completed);
    }
  }

  function stopGeneration() {
    workspace.abort = true;
    resetAgentPlanState();
    clearTimers();
    closeCitePopover();
    // Keep already-generated blocks; do not invent uncreated sections
    if (reportDoc) {
      reportDoc.querySelectorAll(".wb-doc-block:not(.is-visible)").forEach(function (el) {
        el.classList.add("is-visible");
      });
    }
    const working = document.getElementById("wb-assistant-working");
    if (working && workspace.assistantStatus === "working") {
      working.remove();
      appendAssistantMessage("<p>Generation stopped. You can keep editing what’s already drafted, or ask me to continue a section.</p>", false);
    }
    renderSourcesList();
    finalizeGeneration(false);
  }

  function highlightSection(sectionEl) {
    if (!sectionEl) return;
    let target = sectionEl;
    if (sectionEl.tagName === "H2") {
      // wrap following siblings until next h2 — highlight the h2 parent block
      target = sectionEl.closest(".wb-doc-block") || sectionEl;
    }
    target.classList.add("wb-section-updated");
    const badge = document.createElement("span");
    badge.className = "wb-updated-badge";
    badge.textContent = "Updated";
    if (sectionEl.tagName === "H2" && !sectionEl.querySelector(".wb-updated-badge")) {
      sectionEl.appendChild(badge);
    }
    target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
    window.setTimeout(function () {
      target.classList.add("is-fading");
    }, 200);
    window.setTimeout(function () {
      target.classList.remove("wb-section-updated", "is-fading");
      if (badge.parentNode) badge.parentNode.removeChild(badge);
    }, 1800);
  }

  async function runFollowUp(key, userText, quote) {
    if (workspace.assistantStatus === "working" || workspace.assistantStatus === "streaming") return;
    workspace.abort = false;
    appendUserMessage(userText, quote);
    workspace.assistantStatus = "working";
    setAssistantSendGenerating(true);

    const label = appendAssistantWorking();
    const shortSteps =
      key === "risks"
        ? ["Reviewing risk section", "Summarising key risks"]
        : key === "exec"
          ? ["Reviewing executive summary", "Strengthening key messages"]
          : ["Reviewing implementation section", "Structuring recommendations"];

    for (let i = 0; i < shortSteps.length; i++) {
      if (workspace.abort) break;
      label.textContent = shortSteps[i];
      await delay(prefersReducedMotion ? 40 : 350);
    }

    const working = document.getElementById("wb-assistant-working");
    if (working) working.remove();
    workspace.assistantStatus = "streaming";

    if (key === "risks") {
      appendAssistantMessage(
        "<p>Here are the key risks emerging from the draft:</p>" +
          "<ul>" +
          "<li><strong>Fact uncertainty</strong> — incomplete terms could change the TOFA conclusion.</li>" +
          "<li><strong>Election integrity</strong> — undocumented elections create timing risk.</li>" +
          "<li><strong>Systems gap</strong> — manual TOFA processes increase error risk.</li>" +
          "<li><strong>FX complexity</strong> — mixed-currency flows can add volatility.</li>" +
          "<li><strong>Interaction risk</strong> — other tax rules may still apply beside TOFA.</li>" +
          "</ul>" +
          "<p>I can expand any of these into mitigation actions if useful.</p>",
        false
      );
      const risks = document.getElementById("wb-section-risks");
      if (risks) highlightSection(risks);
    } else if (key === "exec") {
      appendAssistantMessage(
        "<p>I’ve strengthened the executive summary to lead with the preliminary view, the main sensitivities, and what stakeholders should do next.</p>" +
          "<p>The updated summary is highlighted in the report.</p>",
        false
      );
      const exec = document.getElementById("wb-section-exec");
      if (exec) {
        const block = exec.closest(".wb-doc-block") || exec.parentElement;
        clearShowEditsMarkup();
        const beforeEls = Array.prototype.slice
          .call(block.children)
          .filter(function (node) {
            return node !== exec && node.tagName !== "H2";
          });
        const originalText = beforeEls
          .map(function (n) {
            return plainTextFromHtml(n.outerHTML);
          })
          .join(" ");

        beforeEls.forEach(function (node) {
          block.removeChild(node);
        });
        const temp = document.createElement("div");
        temp.innerHTML = STRENGTHENED_EXEC;
        const firstP = temp.querySelector("p");
        if (firstP) firstP.setAttribute("data-rev-slot", "rev-alex-exec");
        while (temp.firstChild) block.appendChild(temp.firstChild);

        const revisedText = Array.prototype.slice
          .call(block.children)
          .filter(function (node) {
            return node !== exec && node.tagName !== "H2";
          })
          .map(function (n) {
            return plainTextFromHtml(n.outerHTML);
          })
          .join(" ");

        // Replace any prior pending exec revision
        workspace.revisions.forEach(function (r) {
          if (
            (r.slot === "rev-alex-exec" || r.slot === "rev-ai-exec") &&
            r.status === "pending"
          ) {
            r.status = "accepted";
          }
        });

        createRevision({
          slot: "rev-alex-exec",
          sectionId: "wb-section-exec",
          author: "Alex Morgan",
          authorId: "alex",
          authorType: "collaborator",
          originalText: originalText,
          revisedText: revisedText,
          highlightPhrase: "Preliminary view",
          timestamp: Date.now(),
          expanded: true,
        });
        const execRev = workspace.revisions[workspace.revisions.length - 1];
        execRev.originalHtml = beforeEls.map(function (n) { return n.outerHTML; }).join("");
        execRev.restoreSiblings = true;
        highlightSection(exec);
        addVersion("Executive summary updated by Alex Morgan");
        if (workspace.showEdits) applyShowEditsMarkup();
      }
    } else if (key === "impl") {
      appendAssistantMessage(
        "<p>Suggested implementation focus areas:</p>" +
          "<ol>" +
          "<li>Lock the commercial term sheet and cash-flow schedule.</li>" +
          "<li>Confirm TOFA elections and ownership of the classification memo.</li>" +
          "<li>Map treasury / ERP data fields needed for accruals and FX.</li>" +
          "<li>Stand up period-end reconciliations between accounting and tax.</li>" +
          "<li>Agree go-live controls, reviewers, and documentation standards.</li>" +
          "</ol>" +
          "<p>Section 5 in the report covers these themes in more detail.</p>",
        false
      );
      const impl = document.getElementById("wb-section-impl");
      if (impl) highlightSection(impl);
    }

    workspace.assistantStatus = "complete";
    setAssistantSendGenerating(false);
  }

  function returnToCompose() {
    workspace.abort = true;
    resetAgentPlanState();
    clearTimers();
    closePopovers();
    closeCitePopover();
    workspace.view = "compose";
    workspace.reportStatus = "idle";
    workspace.assistantStatus = "idle";
    workspace.versions = [];
    workspace.reportVersion = 0;
    workspace.userScrolledAway = false;
    workspace.didAutoCollapseSidebar = false;
    resetRevisionState();
    resetCollaborationState();
    resetCommentState();
    clearSubmittedPrompt();

    if (app) {
      app.classList.remove("is-editor-view", "is-assistant-open");
    }
    if (editorView) {
      editorView.hidden = true;
      editorView.setAttribute("aria-hidden", "true");
    }
    if (composeView) {
      composeView.hidden = false;
      composeView.removeAttribute("hidden");
      composeView.setAttribute("aria-hidden", "false");
      composeView.classList.remove("is-exiting");
    }
    if (reportDoc) reportDoc.innerHTML = "";
    if (assistantThread) assistantThread.innerHTML = "";
    resetSourcePanelState();
    setReportStatus("", false);
    clearNavActive();
    setAssistantSendGenerating(false);
    refreshIcons();
  }

  // —— Selection toolbar + anchored comments ——
  function formatCommentTime(ts) {
    const d = new Date(ts || Date.now());
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (sameDay) return "Today, " + time;
    return (
      d.toLocaleDateString([], { month: "short", day: "numeric" }) + ", " + time
    );
  }

  function findCommentThread(id) {
    return workspace.commentThreads.find(function (t) {
      return t.id === id;
    });
  }

  function openCommentCount(thread) {
    return (thread.comments || []).length;
  }

  function resetCommentState() {
    hideSelectionToolbar();
    closeCommentComposer();
    closeCommentThread();
    clearAskRightSelectionHighlight();
    clearAskRightContext();
    workspace.commentThreads = [];
    workspace.commentSeq = 0;
    workspace.selectionContext = null;
    workspace.selectionAnchor = null;
    workspace.activeCommentThreadId = null;
    workspace.pendingCommentDraft = null;
    workspace.askRightText = null;
    if (reportDoc) {
      reportDoc.querySelectorAll("mark.wb-comment-mark, mark.wb-ask-selection").forEach(unwrapMarkPreserveChildren);
      reportDoc.querySelectorAll(".wb-comment-marker").forEach(function (el) {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
    }
  }

  function unwrapMarkPreserveChildren(mark) {
    if (!mark || !mark.parentNode) return;
    const parent = mark.parentNode;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  }

  function selectionIsInsideReport(range) {
    if (!reportDoc || !range) return false;
    const node = range.commonAncestorContainer;
    const el = node.nodeType === 1 ? node : node.parentElement;
    if (!el || !reportDoc.contains(el)) return false;
    if (el.closest(".wb-rev-detail, .wb-cite-popover, .wb-comment-marker")) return false;
    return true;
  }

  function getActiveReportSelection() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
    const range = sel.getRangeAt(0);
    if (!selectionIsInsideReport(range)) return null;
    const text = String(sel.toString() || "").replace(/\s+/g, " ").trim();
    if (!text) return null;
    const section =
      (range.startContainer.nodeType === 1
        ? range.startContainer
        : range.startContainer.parentElement) &&
      (range.startContainer.nodeType === 1
        ? range.startContainer
        : range.startContainer.parentElement
      ).closest("p, li, h1, h2, h3, h4, td, th, [data-rev-slot], [data-collab-slot]");
    return {
      text: text,
      range: range.cloneRange(),
      sectionId:
        (section &&
          (section.getAttribute("data-collab-slot") ||
            section.getAttribute("data-rev-slot") ||
            section.id ||
            null)) ||
        null,
      sectionEl: section || null,
    };
  }

  function captureSelectionContext() {
    const ctx = getActiveReportSelection();
    workspace.selectionContext = ctx;
    return ctx;
  }

  function isFiniteVisibleRect(rect) {
    return !!(
      rect &&
      isFinite(rect.left) &&
      isFinite(rect.top) &&
      rect.width > 0 &&
      rect.height > 0 &&
      !(rect.left === 0 && rect.top === 0 && rect.width < 2)
    );
  }

  function copyClientRect(rect) {
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      right: rect.right != null ? rect.right : rect.left + rect.width,
      bottom: rect.bottom != null ? rect.bottom : rect.top + rect.height,
    };
  }

  function getSelectionClientRects(range) {
    if (!range) return [];
    try {
      return Array.prototype.slice.call(range.getClientRects() || []);
    } catch (err) {
      return [];
    }
  }

  function getBottomMostClientRect(range) {
    const rects = getSelectionClientRects(range);
    let pick = null;
    for (let i = 0; i < rects.length; i++) {
      if (!isFiniteVisibleRect(rects[i])) continue;
      if (!pick || rects[i].bottom > pick.bottom) pick = rects[i];
    }
    if (!pick) {
      try {
        const box = range.getBoundingClientRect();
        if (isFiniteVisibleRect(box)) pick = box;
      } catch (err) {
        pick = null;
      }
    }
    return pick ? copyClientRect(pick) : null;
  }

  function getTopMostClientRect(range) {
    const rects = getSelectionClientRects(range);
    let pick = null;
    for (let i = 0; i < rects.length; i++) {
      if (!isFiniteVisibleRect(rects[i])) continue;
      if (!pick || rects[i].top < pick.top) pick = rects[i];
    }
    if (!pick) {
      try {
        const box = range.getBoundingClientRect();
        if (isFiniteVisibleRect(box)) pick = box;
      } catch (err) {
        pick = null;
      }
    }
    return pick ? copyClientRect(pick) : null;
  }

  function getSelectionExtentRect(range) {
    const rects = getSelectionClientRects(range).filter(isFiniteVisibleRect);
    if (!rects.length) return getTopMostClientRect(range);
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    rects.forEach(function (rect) {
      left = Math.min(left, rect.left);
      top = Math.min(top, rect.top);
      right = Math.max(right, rect.right);
      bottom = Math.max(bottom, rect.bottom);
    });
    return copyClientRect({
      left: left,
      top: top,
      width: right - left,
      height: bottom - top,
      right: right,
      bottom: bottom,
    });
  }

  function getSelectionAnchorRect(range, options) {
    options = options || {};
    if (!range) return null;
    if (options.preferEnd) return getBottomMostClientRect(range);
    return getTopMostClientRect(range);
  }

  function getAnchorRectWithFallback(range, host) {
    const fromRange = getTopMostClientRect(range);
    if (fromRange) return fromRange;
    if (host && typeof host.getBoundingClientRect === "function") {
      const box = host.getBoundingClientRect();
      if (isFiniteVisibleRect(box)) return copyClientRect(box);
    }
    return null;
  }

  function getEditorRelativePosition(rect) {
    if (!reportScroll || !rect) return null;
    const box = reportScroll.getBoundingClientRect();
    const scaleY = box.height / Math.max(1, reportScroll.clientHeight);
    return {
      top: reportScroll.scrollTop + (rect.top - box.top) / (scaleY || 1),
      left: reportScroll.scrollLeft + (rect.left - box.left) / (scaleY || 1),
    };
  }

  function captureSelectionAnchor(range, host) {
    const topRect = getAnchorRectWithFallback(range, host);
    if (!topRect) {
      return workspace.selectionAnchor || null;
    }
    const bottomRect = getBottomMostClientRect(range) || topRect;
    const extentRect = getSelectionExtentRect(range) || topRect;
    const liveRange = range ? range.cloneRange() : null;
    const viewportRects = getSelectionClientRects(range).filter(isFiniteVisibleRect).map(copyClientRect);
    const useStage = !!(demoCamera.cinematic && demoOverlayLayer);
    const localRects = useStage ? viewportRects.map(viewportRectToStageLocal) : viewportRects.map(copyClientRect);
    const localBounds = useStage ? viewportRectToStageLocal(extentRect) : copyClientRect(extentRect);
    const localAnchorRect = useStage ? viewportRectToStageLocal(topRect) : copyClientRect(topRect);
    workspace.selectionAnchor = {
      range: liveRange,
      rects: viewportRects,
      localRects: localRects,
      localBounds: localBounds,
      localAnchorRect: localAnchorRect,
      preferredAnchorPoint: localBounds
        ? { x: localBounds.left, y: localAnchorRect ? localAnchorRect.top : localBounds.top }
        : null,
      space: useStage ? "stage" : "viewport",
      anchorRect: topRect,
      extentRect: extentRect,
      rect: topRect,
      bottomRect: bottomRect,
      clientX: extentRect.left,
      clientY: topRect.top,
      stagePosition: useStage && localBounds ? { x: localBounds.left, y: localAnchorRect ? localAnchorRect.top : localBounds.top } : null,
      editorPosition: getEditorRelativePosition(topRect),
      host: host || null,
      placedLeft: workspace.selectionAnchor ? workspace.selectionAnchor.placedLeft : null,
      placedTop: workspace.selectionAnchor ? workspace.selectionAnchor.placedTop : null,
    };
    return workspace.selectionAnchor;
  }

  function refreshSelectionAnchor() {
    const prev = workspace.selectionAnchor;
    const range = (prev && prev.range) || (workspace.selectionContext && workspace.selectionContext.range);
    const host =
      (prev && prev.host) ||
      (workspace.selectionContext && workspace.selectionContext.sectionEl) ||
      getRangeHostBlock(range);
    return captureSelectionAnchor(range, host);
  }

  function clearSelectionAnchor() {
    workspace.selectionAnchor = null;
  }

  function getOverlayClampRect(space) {
    let box = null;
    if (reportScroll) {
      const next = reportScroll.getBoundingClientRect();
      if (isFiniteVisibleRect(next)) box = copyClientRect(next);
    }
    if (!box) box = getWindowClampRect();
    if (space === "stage") return viewportRectToStageLocal(box);
    return box;
  }

  function measureSelectionGeometryInSpace(range, space, fallback) {
    const liveRects = range
      ? getSelectionClientRects(range).filter(isFiniteVisibleRect).map(copyClientRect)
      : [];
    const liveExtent = range ? getSelectionExtentRect(range) : null;
    if (space === "stage") {
      return {
        rects:
          liveRects.length
            ? liveRects.map(viewportRectToStageLocal)
            : (fallback && fallback.localRects) || [],
        extent:
          liveExtent
            ? viewportRectToStageLocal(liveExtent)
            : (fallback && (fallback.localBounds || fallback.localAnchorRect)) || null,
      };
    }
    return {
      rects: liveRects.length ? liveRects : (fallback && fallback.rects) || [],
      extent: liveExtent || (fallback && (fallback.extentRect || fallback.anchorRect)) || null,
    };
  }

  function boxesOverlap(a, b, pad) {
    const p = pad == null ? 0 : pad;
    if (!a || !b) return false;
    return !(
      a.right <= b.left - p ||
      a.left >= b.right + p ||
      a.bottom <= b.top - p ||
      a.top >= b.bottom + p
    );
  }

  function makeClientBox(left, top, width, height) {
    return {
      left: left,
      top: top,
      width: width,
      height: height,
      right: left + width,
      bottom: top + height,
    };
  }

  function getSelectionOverlayPlacement(options) {
    options = options || {};
    const clamp = options.clampRect || getOverlayClampRect();
    const margin = options.margin == null ? 12 : options.margin;
    const gap = options.gap == null ? 8 : options.gap;
    const width = options.overlayWidth || 220;
    const height = options.overlayHeight || 40;
    const minLeft = clamp.left + margin;
    const maxRight = clamp.right - margin;
    const minTop = clamp.top + margin;
    const maxBottom = clamp.bottom - margin;
    const w = Math.min(width, Math.max(40, maxRight - minLeft));
    const h = Math.min(height, Math.max(40, maxBottom - minTop));
    let selRects = options.selectionRects;
    if ((!selRects || !selRects.length) && options.anchorRange) {
      selRects = getSelectionClientRects(options.anchorRange)
        .filter(isFiniteVisibleRect)
        .map(copyClientRect);
    }
    const extent =
      options.extentRect ||
      (options.anchorRange ? getSelectionExtentRect(options.anchorRange) : null) ||
      (selRects && selRects.length
        ? {
            left: Math.min.apply(
              null,
              selRects.map(function (r) {
                return r.left;
              })
            ),
            top: Math.min.apply(
              null,
              selRects.map(function (r) {
                return r.top;
              })
            ),
            right: Math.max.apply(
              null,
              selRects.map(function (r) {
                return r.right;
              })
            ),
            bottom: Math.max.apply(
              null,
              selRects.map(function (r) {
                return r.bottom;
              })
            ),
          }
        : null) ||
      (selRects && selRects[0]) ||
      null;
    if (extent && extent.width == null) {
      extent.width = extent.right - extent.left;
      extent.height = extent.bottom - extent.top;
    }
    if (!extent) return null;

    function overlapsSelection(box) {
      if (boxesOverlap(box, extent, gap)) return true;
      if (!selRects) return false;
      for (let i = 0; i < selRects.length; i++) {
        if (boxesOverlap(box, selRects[i], Math.max(0, gap - 2))) return true;
      }
      return false;
    }

    function make(placement, x, y) {
      const left = Math.max(minLeft, Math.min(x, maxRight - w));
      const top = Math.max(minTop, Math.min(y, maxBottom - h));
      const box = makeClientBox(left, top, w, h);
      const fits =
        box.left >= minLeft - 0.5 &&
        box.right <= maxRight + 0.5 &&
        box.top >= minTop - 0.5 &&
        box.bottom <= maxBottom + 0.5;
      const overlaps = overlapsSelection(box);
      return {
        x: left,
        y: top,
        placement: placement,
        box: box,
        overlapsSel: overlaps,
        valid: !overlaps && fits,
      };
    }

    const leftAlign = extent.left;
    const tries = [
      make("above", leftAlign, extent.top - h - gap),
      make("below", leftAlign, extent.bottom + gap),
      make("above", extent.right - w, extent.top - h - gap),
      make("below", extent.right - w, extent.bottom + gap),
      make("right", extent.right + gap, extent.top),
      make("right", extent.right + gap, extent.bottom - h),
      make("left", extent.left - w - gap, extent.top),
      make("left", extent.left - w - gap, extent.bottom - h),
    ];
    for (let i = 0; i < tries.length; i++) {
      if (tries[i] && tries[i].valid) return tries[i];
    }
    for (let i = 0; i < tries.length; i++) {
      if (tries[i] && !tries[i].overlapsSel) return tries[i];
    }
    return tries[1] || tries[0];
  }

  function ensureRoomForOverlay(height, options) {
    if (!reportScroll || !workspace.selectionAnchor) return;
    options = options || {};
    const gap = options.gap == null ? 10 : options.gap;
    const width = options.width || options.fallbackWidth || 360;
    const space = demoCamera.cinematic && demoOverlayLayer ? "stage" : "viewport";
    const geom = measureSelectionGeometryInSpace(
      workspace.selectionAnchor.range,
      space,
      workspace.selectionAnchor
    );
    const trial = getSelectionOverlayPlacement({
      selectionRects: geom.rects,
      extentRect: geom.extent,
      overlayWidth: width,
      overlayHeight: height || 160,
      gap: gap,
      clampRect: getOverlayClampRect(space),
    });
    if (trial && trial.valid && (trial.placement === "above" || trial.placement === "below" || trial.placement === "right")) {
      return;
    }
    const clamp = getOverlayClampRect(space);
    const rect = geom.extent;
    if (!rect || !clamp) return;
    const need = (height || 160) + gap + 16;
    const spaceAbove = rect.top - clamp.top;
    const spaceBelow = clamp.bottom - rect.bottom;
    if (spaceAbove >= need || spaceBelow >= need) return;
    if (spaceAbove >= spaceBelow) {
      reportScroll.scrollTop -= need - spaceAbove;
    } else {
      reportScroll.scrollTop += need - spaceBelow;
    }
    refreshSelectionAnchor();
  }

  function setOverlayAnchorFrozen(el, frozen) {
    if (!el) return;
    el.classList.toggle("is-anchor-frozen", !!frozen);
  }

  function positionOverlayOnSelectionAnchor(el, options) {
    options = options || {};
    if (!el) return false;
    const anchor = workspace.selectionAnchor;
    if (!anchor || !(anchor.anchorRect || anchor.extentRect || anchor.rect || anchor.localBounds)) {
      return false;
    }
    const gap = options.gap == null ? 8 : options.gap;
    const width = el.offsetWidth || options.fallbackWidth || 220;
    const height = el.offsetHeight || options.fallbackHeight || 40;
    const space = overlayUsesStageSpace(el) ? "stage" : "viewport";
    const geom = measureSelectionGeometryInSpace(anchor.range, space, anchor);
    const placement = getSelectionOverlayPlacement({
      selectionRects: geom.rects,
      extentRect: geom.extent,
      overlayWidth: width,
      overlayHeight: height,
      gap: gap,
      clampRect: getOverlayClampRect(space),
      preferredPlacement: options.preferredPlacement || "above",
    });
    if (!placement) return false;
    el.classList.toggle("is-below", placement.placement === "below");
    el.setAttribute("data-placement", placement.placement);
    applyOverlayPosition(el, placement.x, placement.y);
    anchor.placedLeft = placement.x;
    anchor.placedTop = placement.y;
    anchor.placement = placement.placement;
    if (space === "stage") {
      anchor.stagePosition = { x: placement.x, y: placement.y };
    }
    return true;
  }

  function positionNearRect(el, rect, opts) {
    if (!el || !rect) return;
    const gap = (opts && opts.gap) || 10;
    const preferAbove = !opts || opts.preferAbove !== false;
    const width = el.offsetWidth || 280;
    const height = el.offsetHeight || 40;
    const margin = 14;
    const localRect = rectToOverlaySpace(rect, el);
    const clamp = overlayUsesStageSpace(el)
      ? viewportRectToStageLocal(getViewportBoxRect())
      : getWindowClampRect();
    if (!localRect || !clamp) return;
    const minLeft = clamp.left + margin;
    const maxRight = clamp.right - margin;
    const minTop = clamp.top + margin;
    const maxBottom = clamp.bottom - margin;

    let left = localRect.left + localRect.width / 2 - width / 2;
    left = Math.max(minLeft, Math.min(left, maxRight - width));
    let top;
    if (preferAbove && localRect.top - height - gap >= minTop) {
      top = localRect.top - height - gap;
      el.classList.remove("is-below");
    } else if (localRect.bottom + height + gap <= maxBottom) {
      top = localRect.bottom + gap;
      el.classList.add("is-below");
    } else {
      top = Math.max(minTop, Math.min(localRect.top - height - gap, maxBottom - height));
      el.classList.toggle("is-below", top > localRect.top);
    }
    applyOverlayPosition(el, left, top);
  }

  function showSelectionToolbar(options) {
    options = options || {};
    if (
      selectionToolbar &&
      selectionToolbar.classList.contains("is-anchor-frozen") &&
      !options.force &&
      !options.fromScroll
    ) {
      return;
    }
    const ctx = getActiveReportSelection() || workspace.selectionContext;
    if (ctx) workspace.selectionContext = ctx;
    if (!ctx || !selectionToolbar) {
      hideSelectionToolbar();
      return;
    }
    if (commentComposer && !commentComposer.hidden) return;
    if (commentThreadEl && !commentThreadEl.hidden) return;
    const host = ctx.sectionEl || getRangeHostBlock(ctx.range);
    const anchor = captureSelectionAnchor(ctx.range, host);
    if (!anchor || !anchor.anchorRect) {
      hideSelectionToolbar();
      return;
    }
    if (reportScroll) {
      const scrollRect = reportScroll.getBoundingClientRect();
      if (
        anchor.anchorRect.bottom < scrollRect.top + 8 ||
        anchor.anchorRect.top > scrollRect.bottom - 8
      ) {
        hideSelectionToolbar();
        return;
      }
    }
    selectionToolbar.hidden = false;
    selectionToolbar.classList.add("is-visible");
    positionOverlayOnSelectionAnchor(selectionToolbar, { gap: 7, fallbackWidth: 220, fallbackHeight: 36 });
    setOverlayAnchorFrozen(selectionToolbar, options.freeze !== false);
    refreshIcons();
  }

  function hideSelectionToolbar(options) {
    options = options || {};
    if (!selectionToolbar) return;
    const finish = function () {
      selectionToolbar.classList.remove("is-visible", "is-anchor-frozen");
      selectionToolbar.hidden = true;
      if (!options.keepAnchor && (!commentComposer || commentComposer.hidden)) {
        clearSelectionAnchor();
      }
    };
    if (options.fade && !selectionToolbar.hidden) {
      selectionToolbar.classList.remove("is-visible");
      window.setTimeout(finish, prefersReducedMotion ? 0 : 90);
      return;
    }
    finish();
  }

  function clearAskRightSelectionHighlight() {
    if (!reportDoc) return;
    reportDoc.querySelectorAll("mark.wb-ask-selection").forEach(unwrapMarkPreserveChildren);
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

  function clearAskRightContext() {
    workspace.askRightText = null;
    if (assistantSelectionContext) assistantSelectionContext.hidden = true;
    if (assistantSelectionQuote) assistantSelectionQuote.textContent = "";
    if (assistantInput) {
      assistantInput.setAttribute("data-placeholder", "Ask Write…");
      assistantInput.setAttribute("aria-label", "Ask Write");
    }
  }

  function setAskRightContext(text) {
    workspace.askRightText = text;
    if (assistantSelectionContext) assistantSelectionContext.hidden = false;
    if (assistantSelectionQuote) {
      assistantSelectionQuote.textContent = '"' + text + '"';
    }
    if (assistantInput) {
      assistantInput.setAttribute("data-placeholder", "Ask Write about this selection");
      assistantInput.setAttribute("aria-label", "Ask Write about selected text");
      assistantInput.focus();
    }
    syncAssistantInputEmpty();
    refreshIcons();
  }

  function openAssistantPanel() {
    if (app) app.classList.add("is-assistant-open");
    if (assistantFab) assistantFab.hidden = true;
  }

  function askRightAboutSelection() {
    const ctx = workspace.selectionContext || captureSelectionContext();
    hideSelectionToolbar();
    if (!ctx) return;
    workspace.suppressEditCapture = true;
    clearAskRightSelectionHighlight();
    const mark = wrapRangeWithMark(ctx.range.cloneRange(), "wb-ask-selection");
    workspace.suppressEditCapture = false;
    window.getSelection().removeAllRanges();
    openAssistantPanel();
    setAskRightContext(ctx.text);
    window.setTimeout(function () {
      if (mark && mark.parentNode) unwrapMarkPreserveChildren(mark);
    }, prefersReducedMotion ? 600 : 2200);
  }

  function runAskRightQuickAction(action) {
    const selected = workspace.askRightText || "";
    const prompts = {
      improve: "Improve the wording of this selection while keeping the meaning.",
      explain: "Explain this selection in plain language.",
      concise: "Make this selection more concise without losing key meaning.",
    };
    const prompt = prompts[action] || "Help with this selection.";
    const message =
      (selected ? 'Regarding: "' + selected + '"\n\n' : "") + prompt;
    if (assistantInput) {
      assistantInput.textContent = "";
      syncAssistantInputEmpty();
    }
    appendUserMessage(message);
    workspace.assistantStatus = "working";
    setAssistantSendGenerating(true);
    const label = appendAssistantWorking();
    label.textContent =
      action === "explain"
        ? "Explaining selection"
        : action === "concise"
          ? "Tightening wording"
          : "Improving wording";
    delay(prefersReducedMotion ? 40 : 700).then(function () {
      const working = document.getElementById("wb-assistant-working");
      if (working) working.remove();
      let html;
      if (action === "explain") {
        html =
          "<p>This passage sets an expectation stakeholders can verify. In review, confirm the factual anchors (dates, owners, dependencies) and whether any caveats should sit beside the claim.</p>";
      } else if (action === "concise") {
        html =
          "<p>Suggested tighter wording:</p><p><em>" +
          escapeHtml(selected || "Selected text") +
          "</em> → keep the core claim, drop soft fillers, and keep one concrete condition if needed.</p>";
      } else {
        html =
          "<p>Suggested rewrite:</p><p>" +
          escapeHtml(
            selected
              ? selected.replace(/\s+/g, " ").replace(/\.$/, "") +
                  ", subject to confirmation with the responsible owners."
              : "Refined wording will appear here."
          ) +
          "</p>";
      }
      appendAssistantMessage(html, false);
      workspace.assistantStatus = "complete";
      setAssistantSendGenerating(false);
    });
  }

  function closeCommentComposer() {
    if (!commentComposer) return;
    commentComposer.hidden = true;
    commentComposer.classList.remove("is-visible", "is-anchor-frozen");
    commentComposer.innerHTML = "";
    workspace.pendingCommentDraft = null;
    if (!selectionToolbar || selectionToolbar.hidden) clearSelectionAnchor();
  }

  function closeCommentThread() {
    if (!commentThreadEl) return;
    commentThreadEl.hidden = true;
    commentThreadEl.classList.remove("is-visible", "is-anchor-frozen");
    commentThreadEl.innerHTML = "";
    workspace.activeCommentThreadId = null;
    if (reportDoc) {
      reportDoc.querySelectorAll("mark.wb-comment-mark.is-active").forEach(function (m) {
        m.classList.remove("is-active");
      });
      reportDoc.querySelectorAll(".wb-comment-marker.is-active").forEach(function (m) {
        m.classList.remove("is-active");
      });
    }
  }

  function openCommentComposer() {
    const live = getActiveReportSelection();
    const ctx = live || workspace.selectionContext || captureSelectionContext();
    if (!ctx || !commentComposer) return;
    closeCommentThread();
    const host = ctx.sectionEl || getRangeHostBlock(ctx.range);
    if (!workspace.selectionAnchor || !workspace.selectionAnchor.anchorRect) {
      captureSelectionAnchor(ctx.range, host);
    }
    hideSelectionToolbar({ keepAnchor: true, fade: true });
    workspace.pendingCommentDraft = {
      text: ctx.text,
      range: ctx.range.cloneRange(),
      sectionId: ctx.sectionId,
    };
    window.getSelection().removeAllRanges();
    const person = OWNER_PERSON;
    commentComposer.hidden = false;
    commentComposer.innerHTML =
      '<div class="wb-comment-composer__head">' +
      '<p class="wb-comment-composer__title">' +
      personAvatarHtml(person, "wb-collab-avatar--sm") +
      "<span>Add comment</span></p></div>" +
      '<textarea class="wb-comment-composer__input" id="wb-comment-composer-input" placeholder="Write a comment…" rows="3"></textarea>' +
      '<div class="wb-comment-composer__footer">' +
      '<button type="button" class="wb-btn wb-btn--ghost" id="wb-comment-cancel">Cancel</button>' +
      '<button type="button" class="wb-btn wb-btn--primary" id="wb-comment-submit" disabled>Comment</button>' +
      "</div>";
    commentComposer.classList.add("is-visible");
    ensureRoomForOverlay(commentComposer.offsetHeight || 180, {
      width: commentComposer.offsetWidth || 360,
      gap: 10,
    });
    if (!workspace.selectionAnchor || !workspace.selectionAnchor.anchorRect) {
      captureSelectionAnchor(ctx.range, host);
    }
    positionOverlayOnSelectionAnchor(commentComposer, {
      gap: 10,
      fallbackWidth: 360,
      fallbackHeight: 180,
    });
    setOverlayAnchorFrozen(commentComposer, true);
    refreshIcons();
    const input = document.getElementById("wb-comment-composer-input");
    const submit = document.getElementById("wb-comment-submit");
    const cancel = document.getElementById("wb-comment-cancel");
    if (input) {
      input.focus();
      input.addEventListener("input", function () {
        if (submit) submit.disabled = !(input.value || "").trim();
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !submit.disabled) {
          e.preventDefault();
          submitCommentFromComposer();
        }
      });
    }
    if (cancel) cancel.addEventListener("click", closeCommentComposer);
    if (submit) submit.addEventListener("click", submitCommentFromComposer);
  }

  function createCommentMarker(threadId, count) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "wb-comment-marker";
    btn.setAttribute("data-thread-id", threadId);
    btn.setAttribute("contenteditable", "false");
    btn.setAttribute("aria-label", "Open comment thread");
    btn.innerHTML =
      '<i data-lucide="message-square" aria-hidden="true"></i>' +
      (count > 1
        ? '<span class="wb-comment-marker__count">' + count + "</span>"
        : '<span class="wb-comment-marker__count" hidden></span>');
    return btn;
  }

  function updateCommentMarker(thread) {
    if (!reportDoc || !thread) return;
    const marker = reportDoc.querySelector(
      '.wb-comment-marker[data-thread-id="' + thread.id + '"]'
    );
    if (!marker) return;
    const count = openCommentCount(thread);
    let countEl = marker.querySelector(".wb-comment-marker__count");
    if (!countEl) {
      countEl = document.createElement("span");
      countEl.className = "wb-comment-marker__count";
      marker.appendChild(countEl);
    }
    if (count > 1) {
      countEl.hidden = false;
      countEl.textContent = String(count);
    } else {
      countEl.hidden = true;
      countEl.textContent = "";
    }
    refreshIcons();
  }

  function submitCommentFromComposer() {
    const draft = workspace.pendingCommentDraft;
    const input = document.getElementById("wb-comment-composer-input");
    const text = input && (input.value || "").trim();
    if (!draft || !text) return;

    workspace.commentSeq += 1;
    const threadId = "cthread-" + workspace.commentSeq;
    const thread = {
      id: threadId,
      sectionId: draft.sectionId,
      reportRangeId: threadId,
      reportRange: {
        selectedText: draft.text,
        sectionId: draft.sectionId,
      },
      anchor: {
        selectedText: draft.text,
        startOffset: 0,
        endOffset: draft.text.length,
      },
      status: "open",
      comments: [
        {
          id: "cmsg-" + workspace.commentSeq + "-1",
          authorId: OWNER_PERSON.id,
          text: text,
          timestamp: Date.now(),
        },
      ],
    };
    workspace.commentThreads.push(thread);

    workspace.suppressEditCapture = true;
    let mark = null;
    try {
      mark = wrapRangeWithMark(draft.range, "wb-comment-mark", {
        "data-thread-id": threadId,
      });
    } catch (err) {
      mark = null;
    }
    if (!mark && draft.sectionId && reportDoc) {
      // Fallback: find matching text in section
      const section =
        reportDoc.querySelector('[data-collab-slot="' + draft.sectionId + '"]') ||
        reportDoc.querySelector('[data-rev-slot="' + draft.sectionId + '"]') ||
        document.getElementById(draft.sectionId);
      if (section) {
        const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT, null);
        let node;
        while ((node = walker.nextNode())) {
          const idx = node.nodeValue.indexOf(draft.text);
          if (idx === -1) continue;
          const range = document.createRange();
          range.setStart(node, idx);
          range.setEnd(node, idx + draft.text.length);
          mark = wrapRangeWithMark(range, "wb-comment-mark", {
            "data-thread-id": threadId,
          });
          break;
        }
      }
    }
    if (mark && mark.parentNode) {
      const marker = createCommentMarker(threadId, 1);
      if (mark.nextSibling) mark.parentNode.insertBefore(marker, mark.nextSibling);
      else mark.parentNode.appendChild(marker);
    }
    workspace.suppressEditCapture = false;
    closeCommentComposer();
    refreshIcons();
    openCommentThread(threadId);
    maybeSimulateCollaboratorReply(threadId);
  }

  function renderCommentMessage(msg, threadId) {
    const person = getPersonProfile(msg.authorId);
    const canEdit = msg.authorId === OWNER_PERSON.id;
    return (
      '<div class="wb-comment-msg" data-comment-id="' +
      escapeHtml(msg.id) +
      '">' +
      personAvatarHtml(person, "wb-collab-avatar--sm") +
      '<div class="wb-comment-msg__content"><div class="wb-comment-msg__top">' +
      '<div class="wb-comment-msg__meta"><span class="wb-comment-msg__author">' +
      escapeHtml(person.name) +
      '</span><span class="wb-comment-msg__time">' +
      escapeHtml(formatCommentTime(msg.timestamp)) +
      "</span></div>" +
      (canEdit
        ? '<div class="wb-comment-msg__menu-wrap">' +
          '<button type="button" class="wb-icon-btn" data-comment-menu="' +
          escapeHtml(msg.id) +
          '" aria-label="Comment actions" title="More">' +
          '<i data-lucide="ellipsis" aria-hidden="true"></i></button>' +
          '<div class="wb-comment-msg__menu" data-comment-menu-panel="' +
          escapeHtml(msg.id) +
          '" hidden>' +
          '<button type="button" data-comment-edit="' +
          escapeHtml(msg.id) +
          '">Edit</button>' +
          '<button type="button" data-comment-delete="' +
          escapeHtml(msg.id) +
          '">Delete</button></div></div>'
        : "") +
      '</div><p class="wb-comment-msg__body" data-comment-body="' +
      escapeHtml(msg.id) +
      '">' +
      escapeHtml(msg.text) +
      "</p></div></div>"
    );
  }

  function openCommentThread(threadId) {
    const thread = findCommentThread(threadId);
    if (!thread || thread.status !== "open" || !commentThreadEl) return;
    closeCommentComposer();
    hideSelectionToolbar();
    workspace.activeCommentThreadId = threadId;

    if (reportDoc) {
      reportDoc.querySelectorAll("mark.wb-comment-mark.is-active").forEach(function (m) {
        m.classList.remove("is-active");
      });
      reportDoc.querySelectorAll(".wb-comment-marker.is-active").forEach(function (m) {
        m.classList.remove("is-active");
      });
      const mark = reportDoc.querySelector(
        'mark.wb-comment-mark[data-thread-id="' + threadId + '"]'
      );
      const marker = reportDoc.querySelector(
        '.wb-comment-marker[data-thread-id="' + threadId + '"]'
      );
      if (mark) mark.classList.add("is-active");
      if (marker) marker.classList.add("is-active");
    }

    const person = OWNER_PERSON;
    commentThreadEl.hidden = false;
    commentThreadEl.innerHTML =
      '<div class="wb-comment-thread__head">' +
      '<p class="wb-comment-thread__title">Comments</p>' +
      '<div class="wb-comment-thread__actions">' +
      '<button type="button" class="wb-icon-btn" id="wb-comment-resolve" aria-label="Resolve thread" title="Resolve thread">' +
      '<i data-lucide="circle-check" aria-hidden="true"></i></button>' +
      '<button type="button" class="wb-icon-btn" id="wb-comment-close" aria-label="Close" title="Close">' +
      '<i data-lucide="x" aria-hidden="true"></i></button></div></div>' +
      '<div class="wb-comment-thread__list" id="wb-comment-thread-list">' +
      thread.comments
        .map(function (msg) {
          return renderCommentMessage(msg, threadId);
        })
        .join("") +
      "</div>" +
      '<div class="wb-comment-typing" id="wb-comment-typing" hidden></div>' +
      '<div class="wb-comment-thread__reply">' +
      personAvatarHtml(person, "wb-collab-avatar--sm") +
      '<div class="wb-comment-thread__composer">' +
      '<textarea class="wb-comment-thread__reply-input" id="wb-comment-reply-input" placeholder="Reply..." rows="1"></textarea>' +
      '<button type="button" class="wb-icon-btn wb-comment-thread__send" id="wb-comment-reply-submit" disabled aria-label="Send reply">' +
      '<i data-lucide="arrow-up" aria-hidden="true"></i></button>' +
      "</div></div>";
    commentThreadEl.classList.add("is-visible");

    positionCommentThreadOnLinkedRange(threadId);
    refreshIcons();
    bindCommentThreadEvents(threadId);
  }

  function resolveCommentLinkedRange(threadId) {
    if (!reportDoc || !threadId) return null;
    const mark = reportDoc.querySelector('mark.wb-comment-mark[data-thread-id="' + threadId + '"]');
    if (mark) {
      const range = document.createRange();
      range.selectNodeContents(mark);
      return { range: range, host: mark };
    }
    const thread = findCommentThread(threadId);
    const text = thread && thread.reportRange && thread.reportRange.selectedText;
    if (text) {
      const found = findTextRangeInReport(text);
      if (found) return { range: found, host: getRangeHostBlock(found) };
    }
    return null;
  }

  function positionCommentThreadOnLinkedRange(threadId) {
    if (!commentThreadEl) return false;
    const linked = resolveCommentLinkedRange(threadId);
    if (!linked) return false;
    captureSelectionAnchor(linked.range, linked.host);
    ensureRoomForOverlay(commentThreadEl.offsetHeight || 220, {
      width: commentThreadEl.offsetWidth || 360,
      gap: 10,
    });
    if (!workspace.selectionAnchor || !workspace.selectionAnchor.extentRect) {
      captureSelectionAnchor(linked.range, linked.host);
    }
    positionOverlayOnSelectionAnchor(commentThreadEl, {
      gap: 10,
      fallbackWidth: 360,
      fallbackHeight: 220,
    });
    setOverlayAnchorFrozen(commentThreadEl, !!demoCamera.cinematic);
    return true;
  }

  function bindCommentThreadEvents(threadId) {
    const resolveBtn = document.getElementById("wb-comment-resolve");
    const closeBtn = document.getElementById("wb-comment-close");
    const replyInput = document.getElementById("wb-comment-reply-input");
    const replySubmit = document.getElementById("wb-comment-reply-submit");
    if (resolveBtn) {
      resolveBtn.addEventListener("click", function () {
        resolveCommentThread(threadId);
      });
    }
    if (closeBtn) closeBtn.addEventListener("click", closeCommentThread);
    if (replyInput && replySubmit) {
      function syncReplySend() {
        replySubmit.disabled = !(replyInput.value || "").trim();
      }
      function autosizeReply() {
        const composer = replyInput.closest(".wb-comment-thread__composer");
        replyInput.style.height = "auto";
        const scrollH = replyInput.scrollHeight;
        const singleLine = scrollH <= 30;
        if (composer) composer.classList.toggle("is-multiline", !singleLine);
        if (singleLine) {
          replyInput.style.height = "";
          replyInput.style.overflowY = "hidden";
        } else {
          replyInput.style.height = Math.min(scrollH, 96) + "px";
          replyInput.style.overflowY = "auto";
        }
      }
      function submitReply() {
        const text = (replyInput.value || "").trim();
        if (!text) return;
        addCommentReply(threadId, OWNER_PERSON.id, text);
        replyInput.value = "";
        replyInput.style.height = "";
        syncReplySend();
        autosizeReply();
      }
      replyInput.addEventListener("input", function () {
        syncReplySend();
        autosizeReply();
      });
      replyInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (!replySubmit.disabled) submitReply();
        }
      });
      replySubmit.addEventListener("click", submitReply);
      autosizeReply();
    }
    if (!commentThreadEl) return;
    commentThreadEl.querySelectorAll("[data-comment-menu]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = btn.getAttribute("data-comment-menu");
        const wrap = btn.closest(".wb-comment-msg__menu-wrap");
        const panel = commentThreadEl.querySelector(
          '[data-comment-menu-panel="' + id + '"]'
        );
        commentThreadEl.querySelectorAll(".wb-comment-msg__menu").forEach(function (p) {
          if (p !== panel) p.hidden = true;
        });
        commentThreadEl.querySelectorAll(".wb-comment-msg__menu-wrap").forEach(function (w) {
          if (w !== wrap) w.classList.remove("is-open");
        });
        if (panel) {
          panel.hidden = !panel.hidden;
          if (wrap) wrap.classList.toggle("is-open", !panel.hidden);
        }
      });
    });
    commentThreadEl.querySelectorAll("[data-comment-edit]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        startEditComment(threadId, btn.getAttribute("data-comment-edit"));
      });
    });
    commentThreadEl.querySelectorAll("[data-comment-delete]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        deleteComment(threadId, btn.getAttribute("data-comment-delete"));
      });
    });
  }

  function addCommentReply(threadId, authorId, text, opts) {
    const thread = findCommentThread(threadId);
    if (!thread || thread.status !== "open") return;
    workspace.commentSeq += 1;
    thread.comments.push({
      id: "cmsg-" + workspace.commentSeq,
      authorId: authorId,
      text: text,
      timestamp: Date.now(),
    });
    updateCommentMarker(thread);
    if (workspace.activeCommentThreadId === threadId) {
      openCommentThread(threadId);
      if (opts && opts.scrollReply) {
        const list = document.getElementById("wb-comment-thread-list");
        if (list) list.scrollTop = list.scrollHeight;
      }
    }
  }

  function startEditComment(threadId, commentId) {
    const thread = findCommentThread(threadId);
    if (!thread) return;
    const msg = thread.comments.find(function (c) {
      return c.id === commentId;
    });
    if (!msg || msg.authorId !== OWNER_PERSON.id) return;
    const body = commentThreadEl &&
      commentThreadEl.querySelector('[data-comment-body="' + commentId + '"]');
    if (!body) return;
    body.contentEditable = "true";
    body.focus();
    const range = document.createRange();
    range.selectNodeContents(body);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    function commit() {
      body.contentEditable = "false";
      body.removeEventListener("blur", commit);
      body.removeEventListener("keydown", onKey);
      const next = (body.textContent || "").trim();
      if (!next) {
        body.textContent = msg.text;
        return;
      }
      msg.text = next;
      msg.timestamp = Date.now();
      openCommentThread(threadId);
    }
    function onKey(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        body.blur();
      }
      if (e.key === "Escape") {
        body.textContent = msg.text;
        body.blur();
      }
    }
    body.addEventListener("blur", commit);
    body.addEventListener("keydown", onKey);
    commentThreadEl.querySelectorAll(".wb-comment-msg__menu").forEach(function (p) {
      p.hidden = true;
    });
  }

  function removeThreadAnchors(threadId) {
    if (!reportDoc) return;
    workspace.suppressEditCapture = true;
    reportDoc
      .querySelectorAll('mark.wb-comment-mark[data-thread-id="' + threadId + '"]')
      .forEach(unwrapMarkPreserveChildren);
    reportDoc
      .querySelectorAll('.wb-comment-marker[data-thread-id="' + threadId + '"]')
      .forEach(function (el) {
        if (el.parentNode) el.parentNode.removeChild(el);
      });
    workspace.suppressEditCapture = false;
  }

  function deleteComment(threadId, commentId) {
    const thread = findCommentThread(threadId);
    if (!thread) return;
    const msg = thread.comments.find(function (c) {
      return c.id === commentId;
    });
    if (!msg || msg.authorId !== OWNER_PERSON.id) return;
    thread.comments = thread.comments.filter(function (c) {
      return c.id !== commentId;
    });
    if (!thread.comments.length) {
      workspace.commentThreads = workspace.commentThreads.filter(function (t) {
        return t.id !== threadId;
      });
      removeThreadAnchors(threadId);
      closeCommentThread();
      return;
    }
    updateCommentMarker(thread);
    openCommentThread(threadId);
  }

  function resolveCommentThread(threadId) {
    const thread = findCommentThread(threadId);
    if (!thread) return;
    thread.status = "resolved";
    removeThreadAnchors(threadId);
    closeCommentThread();
  }

  function maybeSimulateCollaboratorReply(threadId) {
    if (
      window.WriteBuilderDemo &&
      typeof window.WriteBuilderDemo.getActive === "function" &&
      window.WriteBuilderDemo.getActive() === "review"
    ) {
      return;
    }
    const alex = findCollabPerson("alex");
    const alexPresent =
      alex &&
      alex.active &&
      (alex.presence === "viewing" ||
        alex.presence === "editing" ||
        collaboration.demoStatus === "complete" ||
        collaboration.demoStatus === "running");
    if (!alexPresent) return;
    const thread = findCommentThread(threadId);
    if (!thread || thread.comments.length !== 1) return;

    window.setTimeout(function () {
      if (workspace.activeCommentThreadId !== threadId) return;
      const typing = document.getElementById("wb-comment-typing");
      if (typing) {
        typing.hidden = false;
        typing.innerHTML =
          personAvatarHtml(getPersonProfile("alex"), "wb-collab-avatar--sm") +
          '<span>Alex is replying<span class="wb-comment-typing__dots"></span></span>';
        refreshIcons();
      }
      window.setTimeout(function () {
        if (!findCommentThread(threadId) || findCommentThread(threadId).status !== "open") {
          return;
        }
        addCommentReply(
          threadId,
          "alex",
          "Agreed. I suggest clarifying the implementation dependency.",
          { scrollReply: true }
        );
      }, prefersReducedMotion ? 80 : 1200);
    }, prefersReducedMotion ? 80 : 2000);
  }

  function repositionCommentUi(fromScroll) {
    if (selectionToolbar && !selectionToolbar.hidden) {
      if (selectionToolbar.classList.contains("is-anchor-frozen") && demoCamera.cinematic && !fromScroll) {
        // Frozen cinematic stage-local position stays put during camera moves.
      } else {
        const ctx = workspace.selectionContext || getActiveReportSelection();
        if (!ctx) {
          hideSelectionToolbar();
        } else {
          const host = ctx.sectionEl || getRangeHostBlock(ctx.range);
          const anchor = captureSelectionAnchor(ctx.range, host);
          if (!anchor || !anchor.anchorRect) {
            hideSelectionToolbar();
          } else if (reportScroll) {
            const scrollRect = reportScroll.getBoundingClientRect();
            if (
              anchor.anchorRect.bottom < scrollRect.top + 8 ||
              anchor.anchorRect.top > scrollRect.bottom - 8
            ) {
              hideSelectionToolbar();
            } else {
              positionOverlayOnSelectionAnchor(selectionToolbar, {
                gap: 7,
                fallbackWidth: 220,
                fallbackHeight: 36,
              });
            }
          } else {
            positionOverlayOnSelectionAnchor(selectionToolbar, {
              gap: 7,
              fallbackWidth: 220,
              fallbackHeight: 36,
            });
          }
        }
      }
    }
    if (commentComposer && !commentComposer.hidden && workspace.pendingCommentDraft) {
      if (commentComposer.classList.contains("is-anchor-frozen") && demoCamera.cinematic && !fromScroll) {
        // Keep the handoff position stable during cinematic camera holds.
      } else {
        try {
          const host = getRangeHostBlock(workspace.pendingCommentDraft.range);
          captureSelectionAnchor(workspace.pendingCommentDraft.range, host);
          positionOverlayOnSelectionAnchor(commentComposer, {
            gap: 7,
            fallbackWidth: 360,
            fallbackHeight: 180,
          });
        } catch (err) {
          closeCommentComposer();
        }
      }
    }
    if (commentThreadEl && !commentThreadEl.hidden && workspace.activeCommentThreadId) {
      if (commentThreadEl.classList.contains("is-anchor-frozen") && demoCamera.cinematic && !fromScroll) {
        return;
      }
      positionCommentThreadOnLinkedRange(workspace.activeCommentThreadId);
    }
  }

  function handleReportSelectionChange() {
    if (workspace.view !== "editor" && workspace.view !== "generating") return;
    if (workspace.reportStatus !== "complete") return;
    if (commentComposer && !commentComposer.hidden) return;
    if (document.activeElement && commentComposer && commentComposer.contains(document.activeElement)) {
      return;
    }
    if (document.activeElement && commentThreadEl && commentThreadEl.contains(document.activeElement)) {
      return;
    }
    window.requestAnimationFrame(function () {
      const ctx = getActiveReportSelection();
      if (!ctx) {
        hideSelectionToolbar();
        return;
      }
      workspace.selectionContext = ctx;
      showSelectionToolbar({ force: true });
    });
  }

  // —— Event bindings ——
  if (reportScroll) {
    reportScroll.addEventListener("scroll", function () {
      if (!reportScroll) return;
      const distanceFromBottom =
        reportScroll.scrollHeight - reportScroll.scrollTop - reportScroll.clientHeight;
      workspace.userScrolledAway = distanceFromBottom > 120;
    });
  }

  if (reportDoc) {
    reportDoc.addEventListener("click", function (e) {
      const citeBtn = e.target.closest(".wb-cite");
      if (citeBtn && reportDoc.contains(citeBtn)) {
        e.preventDefault();
        e.stopPropagation();
        const id = Number(citeBtn.getAttribute("data-ref"));
        if (workspace.rightPanelMode === "source") {
          openSourceInPanel(id);
        } else {
          openCitePopover(id, citeBtn);
        }
        return;
      }

      const commentMarker = e.target.closest(".wb-comment-marker");
      if (commentMarker && reportDoc.contains(commentMarker)) {
        e.preventDefault();
        e.stopPropagation();
        hideSelectionToolbar();
        openCommentThread(commentMarker.getAttribute("data-thread-id"));
        return;
      }

      const commentMark = e.target.closest("mark.wb-comment-mark");
      if (commentMark && reportDoc.contains(commentMark) && !e.target.closest(".wb-cite")) {
        e.preventDefault();
        e.stopPropagation();
        hideSelectionToolbar();
        openCommentThread(commentMark.getAttribute("data-thread-id"));
        return;
      }

      const revAction = e.target.closest("[data-rev-action]");
      if (revAction) {
        e.preventDefault();
        e.stopPropagation();
        const detail = revAction.closest(".wb-rev-detail");
        const revId = detail && detail.getAttribute("data-revision-id");
        if (!revId) return;
        if (revAction.getAttribute("data-rev-action") === "accept") acceptRevision(revId);
        if (revAction.getAttribute("data-rev-action") === "revert") revertRevision(revId);
        return;
      }

      const summary = e.target.closest(".wb-rev-detail__summary, .wb-rev-bar");
      if (summary) {
        e.preventDefault();
        e.stopPropagation();
        const unit = summary.closest(".wb-rev-unit");
        const revId = unit && unit.getAttribute("data-revision-id");
        if (revId) toggleRevisionExpanded(revId);
      }
    });

    reportDoc.addEventListener("focusin", function (e) {
      if (workspace.suppressEditCapture) return;
      const host = editableRevisionHost(e.target);
      if (!host) return;
      if (workspace.userEditTarget && workspace.userEditTarget !== host) {
        commitUserEditSession();
      }
      workspace.userEditTarget = host;
      workspace.userEditBefore = plainTextFromHtml(host.innerHTML);
    });

    reportDoc.addEventListener("input", function (e) {
      if (workspace.suppressEditCapture) return;
      hideSelectionToolbar();
      const host = editableRevisionHost(e.target) || workspace.userEditTarget;
      if (host) scheduleUserEditCommit(host);
    });

    reportDoc.addEventListener("focusout", function () {
      window.setTimeout(function () {
        if (!reportDoc.contains(document.activeElement)) {
          commitUserEditSession();
        }
      }, 0);
    });

    reportDoc.addEventListener("mouseup", function () {
      handleReportSelectionChange();
    });
    reportDoc.addEventListener("keyup", function (e) {
      if (e.key === "Escape") return;
      handleReportSelectionChange();
    });
  }

  if (citeCloseBtn) {
    citeCloseBtn.addEventListener("click", function () {
      closeCitePopover();
    });
  }

  if (citeViewBtn) {
    citeViewBtn.addEventListener("click", function () {
      const id = workspace.activeCiteId;
      if (id == null) return;
      openSourceInPanel(id);
    });
  }

  if (citePrevBtn) {
    citePrevBtn.addEventListener("click", function () {
      navigateCiteGroup(-1);
    });
  }
  if (citeNextBtn) {
    citeNextBtn.addEventListener("click", function () {
      navigateCiteGroup(1);
    });
  }

  if (citeBodyEl) {
    citeBodyEl.addEventListener("scroll", updateCitePageIndicator, { passive: true });
  }

  if (sourcesList) {
    sourcesList.addEventListener("click", function (e) {
      const panelBtn = e.target.closest("[data-open-panel]");
      if (panelBtn && sourcesList.contains(panelBtn)) {
        e.preventDefault();
        e.stopPropagation();
        const panelId = Number(panelBtn.getAttribute("data-open-panel"));
        closeSourcesUsedPopover();
        openSourceInPanel(panelId);
        return;
      }
      const btn = e.target.closest("[data-open-ref]");
      if (!btn) return;
      const id = Number(btn.getAttribute("data-open-ref"));
      closePopovers();
      const firstCite = reportDoc && reportDoc.querySelector('.wb-cite[data-ref="' + id + '"]');
      if (firstCite) {
        firstCite.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
        openCitePopover(id, firstCite);
      } else {
        openCitePopover(id, sourcesBtn, [id]);
      }
    });
  }

  if (sourceUsageToggle) {
    sourceUsageToggle.addEventListener("click", function () {
      setSourceUsageExpanded(!workspace.sourceUsageExpanded);
    });
  }

  if (sourcePanelViewer) {
    sourcePanelViewer.addEventListener("scroll", function () {
      saveSourceScroll();
      updateSourcePageEstimate();
    });
  }

  if (sourcePanelList) {
    let lastOccHover = null;
    sourcePanelList.addEventListener("pointerover", function (e) {
      const row = e.target.closest("[data-occ-index]");
      if (!row || !sourcePanelList.contains(row)) return;
      const idx = Number(row.getAttribute("data-occ-index"));
      if (lastOccHover === idx) return;
      if (lastOccHover != null) setSourceOccurrenceHover(lastOccHover, false);
      lastOccHover = idx;
      setSourceOccurrenceHover(idx, true);
    });
    sourcePanelList.addEventListener("pointerout", function (e) {
      const row = e.target.closest("[data-occ-index]");
      if (!row || !sourcePanelList.contains(row)) return;
      const nextRow =
        e.relatedTarget && e.relatedTarget.closest
          ? e.relatedTarget.closest("[data-occ-index]")
          : null;
      if (nextRow === row) return;
      const idx = Number(row.getAttribute("data-occ-index"));
      if (lastOccHover === idx) {
        setSourceOccurrenceHover(idx, false);
        lastOccHover = null;
      }
    });
    sourcePanelList.addEventListener("click", function (e) {
      const row = e.target.closest("[data-occ-index]");
      if (!row || !sourcePanelList.contains(row)) return;
      selectSourceOccurrence(Number(row.getAttribute("data-occ-index")));
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (citePopover && !citePopover.hidden) {
        closeCitePopover();
        e.preventDefault();
      }
      return;
    }
    if (!citePopover || citePopover.hidden) return;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

    const active = document.activeElement;
    if (
      active &&
      (active.isContentEditable ||
        active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.tagName === "SELECT")
    ) {
      return;
    }

    const insideInspector =
      active &&
      (citePopover === active ||
        citePopover.contains(active) ||
        (active.classList && active.classList.contains("wb-cite")));
    if (!insideInspector) return;

    e.preventDefault();
    if (e.key === "ArrowLeft") navigateCiteGroup(-1);
    if (e.key === "ArrowRight") navigateCiteGroup(1);
  });

  window.addEventListener("resize", function () {
    if (!citePopover || citePopover.hidden || !workspace.activeCiteId) return;
    updateCiteNav();
    if (workspace.citeAnchorFrozen) return;
    const active = document.querySelector(".wb-cite.is-active");
    if (active) positionCitePopover(active);
  });

  document.querySelectorAll(".wb-toolbar-btn[data-cmd]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const cmd = btn.getAttribute("data-cmd");
      if (!cmd) return;
      if (cmd === "createLink") {
        const url = window.prompt("Enter URL");
        if (url) document.execCommand(cmd, false, url);
        return;
      }
      if (cmd === "formatBlock") {
        document.execCommand("formatBlock", false, "p");
        return;
      }
      document.execCommand(cmd, false, null);
    });
  });

  if (renameBtn && reportTitle) {
    renameBtn.addEventListener("click", function () {
      reportTitle.focus();
      const range = document.createRange();
      range.selectNodeContents(reportTitle);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    });
  }

  if (sourcesBtn) {
    sourcesBtn.addEventListener("click", function () {
      togglePopover(sourcesBtn, sourcesPopover);
    });
  }
  if (versionsBtn) {
    versionsBtn.addEventListener("click", function () {
      togglePopover(versionsBtn, versionsPopover);
    });
  }
  if (promptHistoryBtn) {
    promptHistoryBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      togglePopover(promptHistoryBtn, promptHistoryPopover);
    });
  }
  if (promptHistorySearch) {
    promptHistorySearch.addEventListener("input", function () {
      renderPromptHistory(promptHistorySearch.value);
    });
    promptHistorySearch.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }
  if (promptHistoryBody) {
    promptHistoryBody.addEventListener("click", function (e) {
      const actionBtn = e.target.closest("[data-history-action]");
      const row = e.target.closest(".wb-prompt-history-row");
      if (actionBtn && row) {
        e.preventDefault();
        e.stopPropagation();
        const id = row.getAttribute("data-prompt-id");
        const action = actionBtn.getAttribute("data-history-action");
        if (action === "copy") copyPromptHistoryById(id, actionBtn);
        else if (action === "ask") askWriteFromHistory(id);
        return;
      }
      if (!row) return;
      e.preventDefault();
      handlePromptHistoryRowActivate(row, e);
    });
    promptHistoryBody.addEventListener("keydown", function (e) {
      const row = e.target.closest(".wb-prompt-history-row");
      if (!row || row !== e.target) return;
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      handlePromptHistoryRowActivate(row, e);
    });
  }

  document.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-trace-action]");
    if (!btn) return;
    const card = document.getElementById("wb-prompt-trace");
    if (!card || !card.contains(btn)) return;
    e.preventDefault();
    handlePromptTraceAction(btn.getAttribute("data-trace-action"), btn);
  });
  if (shareBtn) {
    shareBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      renderSharePeople();
      updateDemoButton();
      setGeneralAccess(collaboration.generalAccess);
      togglePopover(shareBtn, sharePopover);
      if (shareAccessMenu) shareAccessMenu.hidden = true;
      if (shareAccessBtn) shareAccessBtn.setAttribute("aria-expanded", "false");
      refreshIcons();
    });
  }
  if (shareCloseBtn) {
    shareCloseBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      closeSharePopover();
    });
  }
  if (shareAccessBtn) {
    shareAccessBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (!shareAccessMenu) return;
      const open = shareAccessMenu.hidden;
      shareAccessMenu.hidden = !open;
      shareAccessBtn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) refreshIcons();
    });
  }
  if (shareAccessMenu) {
    shareAccessMenu.addEventListener("click", function (e) {
      const item = e.target.closest("[data-access]");
      if (!item) return;
      e.stopPropagation();
      setGeneralAccess(item.getAttribute("data-access"));
      shareAccessMenu.hidden = true;
      if (shareAccessBtn) shareAccessBtn.setAttribute("aria-expanded", "false");
    });
  }
  if (sharePeople) {
    sharePeople.addEventListener("click", function (e) {
      const trigger = e.target.closest(".wb-share-perm");
      if (!trigger) return;
      e.preventDefault();
      e.stopPropagation();
      if (trigger.getAttribute("aria-expanded") === "true") {
        closeSharePermMenu();
        return;
      }
      openSharePermMenu(trigger);
    });
  }
  if (sharePending) {
    sharePending.addEventListener("click", function (e) {
      const trigger = e.target.closest("[data-pending-perm]");
      if (!trigger) return;
      e.preventDefault();
      e.stopPropagation();
      if (trigger.getAttribute("aria-expanded") === "true") {
        closeSharePermMenu();
        return;
      }
      openSharePermMenu(trigger);
    });
  }
  if (sharePermMenu) {
    sharePermMenu.addEventListener("click", function (e) {
      const item = e.target.closest("[data-perm]");
      if (!item) return;
      e.preventDefault();
      e.stopPropagation();
      applySharePermissionChoice(item.getAttribute("data-perm"));
    });
  }
  if (shareAddInput) {
    shareAddInput.addEventListener("input", function () {
      if (pendingShareAdd) clearPendingShareAdd();
      closeSharePermMenu();
      renderShareSuggestions(shareAddInput.value);
    });
  }
  if (shareSuggestions) {
    shareSuggestions.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-add-id]");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      addPersonById(btn.getAttribute("data-add-id"));
    });
  }
  if (shareCopyBtn) {
    shareCopyBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      const link = window.location.href.split("#")[0] + "#shared-report";
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(
          function () {
            flashLinkCopied();
          },
          function () {
            flashLinkCopied();
            showShareToast("Link ready");
          }
        );
      } else {
        flashLinkCopied();
        showShareToast("Link ready: " + link);
      }
    });
  }
  if (collabAvatars) {
    collabAvatars.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-presence-id]");
      if (!btn) return;
      e.stopPropagation();
      const personId = btn.getAttribute("data-presence-id");
      if (canFollowPerson(personId)) {
        followCollaborator(personId);
        return;
      }
      openPresencePopover(personId, btn);
    });
  }
  if (followChip) {
    followChip.addEventListener("click", function () {
      followChip.classList.add("is-pressed");
      window.setTimeout(function () {
        followChip.classList.remove("is-pressed");
      }, 100);
      const target =
        (collaboration.remoteCursor && collaboration.remoteCursor.target) ||
        collaboration.focusTarget ||
        getPriyaTarget() ||
        getAlexTarget();
      if (target) startFollowTravel(target);
      else followChip.hidden = true;
    });
  }
  if (reportScroll) {
    reportScroll.addEventListener("scroll", function () {
      updateFollowChip();
      repositionCommentUi(true);
      if (
        collaboration.demoStatus === "running" &&
        !collaboration.programmaticScroll
      ) {
        collaboration.demoAutoFollow = false;
      }
    });
  }
  window.addEventListener("resize", function () {
    syncFollowLayer();
    renderCollabAvatars();
    if (collaboration.remoteCursor && collaboration.remoteCursor.target) {
      const t = collaboration.remoteCursor.target;
      const offset =
        typeof collaboration.remoteCursor.offset === "number"
          ? collaboration.remoteCursor.offset
          : (t.textContent || "").length;
      placeRemoteCaretAtOffset(t, offset, {
        typing: !!(remoteCursor && remoteCursor.classList.contains("is-typing")),
      });
    }
    repositionCommentUi();
  });

  if (assistantSourcesBtn) {
    assistantSourcesBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      toggleSourcePanelMode();
    });
  }

  document.addEventListener("click", function (e) {
    if (e.target && e.target.isConnected === false) return;
    if (!e.target.closest(".wb-popover-wrap")) closePopovers();
    if (
      shareAccessMenu &&
      !shareAccessMenu.hidden &&
      !e.target.closest("#wb-share-access-menu") &&
      !e.target.closest("#wb-share-access-btn")
    ) {
      shareAccessMenu.hidden = true;
      if (shareAccessBtn) shareAccessBtn.setAttribute("aria-expanded", "false");
    }
    if (
      sharePermMenu &&
      !sharePermMenu.hidden &&
      !e.target.closest("#wb-share-perm-menu") &&
      !e.target.closest(".wb-share-perm")
    ) {
      closeSharePermMenu();
    }
    if (
      presencePopover &&
      !presencePopover.hidden &&
      !e.target.closest("#wb-presence-popover") &&
      !e.target.closest("[data-presence-id]")
    ) {
      presencePopover.hidden = true;
    }
    if (
      citePopover &&
      !citePopover.hidden &&
      !e.target.closest("#wb-cite-popover") &&
      !e.target.closest(".wb-cite") &&
      !e.target.closest("[data-open-ref]")
    ) {
      closeCitePopover();
    }
    if (
      selectionToolbar &&
      !selectionToolbar.hidden &&
      !e.target.closest("#wb-selection-toolbar") &&
      !e.target.closest("#wb-report-doc")
    ) {
      hideSelectionToolbar();
    }
    if (
      commentComposer &&
      !commentComposer.hidden &&
      !e.target.closest("#wb-comment-composer") &&
      !e.target.closest("#wb-add-comment-btn")
    ) {
      closeCommentComposer();
    }
    if (
      commentThreadEl &&
      !commentThreadEl.hidden &&
      !e.target.closest("#wb-comment-thread") &&
      !e.target.closest(".wb-comment-marker") &&
      !e.target.closest("mark.wb-comment-mark")
    ) {
      closeCommentThread();
    }
  });

  document.addEventListener("selectionchange", function () {
    if (workspace.reportStatus !== "complete") return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      if (
        !(commentComposer && !commentComposer.hidden) &&
        !(
          document.activeElement &&
          selectionToolbar &&
          selectionToolbar.contains(document.activeElement)
        )
      ) {
        hideSelectionToolbar();
      }
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && demoCamera.cinematic) {
      if (window.WriteBuilderDemo && typeof window.WriteBuilderDemo.cancel === "function") {
        window.WriteBuilderDemo.cancel();
      } else {
        cancelCinematicCollaborationDemo();
      }
      e.preventDefault();
      return;
    }
    if (e.key !== "Escape") return;
    if (workspace.activePromptTraceId) {
      closePromptTrace();
      e.preventDefault();
      return;
    }
    if (selectionToolbar && !selectionToolbar.hidden) {
      hideSelectionToolbar();
      e.preventDefault();
      return;
    }
    if (commentComposer && !commentComposer.hidden) {
      closeCommentComposer();
      e.preventDefault();
      return;
    }
    if (commentThreadEl && !commentThreadEl.hidden) {
      closeCommentThread();
      e.preventDefault();
      return;
    }
    if (shareAccessMenu && !shareAccessMenu.hidden) {
      shareAccessMenu.hidden = true;
      if (shareAccessBtn) shareAccessBtn.setAttribute("aria-expanded", "false");
      e.preventDefault();
      return;
    }
    if (sharePopover && !sharePopover.hidden) {
      closeSharePopover();
      e.preventDefault();
      return;
    }
    if (
      (promptHistoryPopover && !promptHistoryPopover.hidden) ||
      (sourcesPopover && !sourcesPopover.hidden) ||
      (versionsPopover && !versionsPopover.hidden)
    ) {
      closePopovers();
      e.preventDefault();
    }
  });

  if (askRightBtn) {
    askRightBtn.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });
    askRightBtn.addEventListener("click", function (e) {
      e.preventDefault();
      askRightAboutSelection();
    });
  }
  if (addCommentBtn) {
    addCommentBtn.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });
    addCommentBtn.addEventListener("click", function (e) {
      e.preventDefault();
      openCommentComposer();
    });
  }
  if (assistantSelectionClear) {
    assistantSelectionClear.addEventListener("click", function () {
      clearAskRightContext();
      clearAskRightSelectionHighlight();
    });
  }
  if (assistantSelectionActions) {
    assistantSelectionActions.addEventListener("click", function (e) {
      const btn = e.target.closest("[data-ask-action]");
      if (!btn) return;
      runAskRightQuickAction(btn.getAttribute("data-ask-action"));
    });
  }

  if (showEditsBtn) {
    showEditsBtn.addEventListener("click", function () {
      setShowEdits(!(showEditsBtn.getAttribute("aria-pressed") === "true"));
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      flashExport();
    });
  }

  function flashExport() {
    if (!exportBtn) return;
    const prev = exportBtn.querySelector("span");
    if (prev) prev.textContent = "Exported";
    window.setTimeout(function () {
      if (prev) prev.textContent = "Export";
    }, 1200);
  }

  if (newThreadBtn) {
    newThreadBtn.addEventListener("click", function () {
      if (window.WriteBuilderCompose && typeof window.WriteBuilderCompose.requestNewDocument === "function") {
        window.WriteBuilderCompose.requestNewDocument();
      }
    });
  }

  if (assistantFab) {
    assistantFab.addEventListener("click", function () {
      if (app) app.classList.add("is-assistant-open");
    });
  }
  if (assistantClose) {
    assistantClose.addEventListener("click", function () {
      if (app) app.classList.remove("is-assistant-open");
    });
  }

  if (assistantThread) {
    assistantThread.addEventListener("click", function (e) {
      const promptToggle = e.target.closest("#wb-assistant-prompt-toggle");
      if (promptToggle) {
        e.preventDefault();
        toggleSubmittedPromptExpanded();
        return;
      }
      const btn = e.target.closest("[data-suggestion]");
      if (!btn) return;
      const key = btn.getAttribute("data-suggestion");
      runFollowUp(key, btn.textContent.trim());
    });
  }

  if (assistantInput) {
    assistantInput.addEventListener("input", syncAssistantInputEmpty);
    syncAssistantInputEmpty();
  }
  if (composerQuoteRemove) {
    composerQuoteRemove.addEventListener("click", function (e) {
      e.preventDefault();
      clearComposerPromptHistoryContext();
      if (assistantInput) assistantInput.focus();
      placeAssistantCaretAtEnd();
    });
  }
  if (composerQuoteMore) {
    composerQuoteMore.addEventListener("click", function (e) {
      e.preventDefault();
      toggleComposerQuoteExpanded();
    });
  }

  if (assistantSend) {
    assistantSend.addEventListener("click", function () {
      if (workspace.assistantStatus === "working" || workspace.assistantStatus === "streaming") {
        workspace.abort = true;
        stopGeneration();
        return;
      }
      const text = (assistantInput && assistantInput.textContent || "").trim();
      if (!text) return;
      const quote = workspace.composerContext;
      assistantInput.textContent = "";
      clearComposerPromptHistoryContext();
      syncAssistantInputEmpty();

      const withSelection =
        workspace.askRightText
          ? 'Regarding: "' + workspace.askRightText + '"\n\n' + text
          : text;

      const lower = text.toLowerCase();
      if (lower.indexOf("risk") !== -1) {
        runFollowUp("risks", withSelection, quote);
      } else if (lower.indexOf("executive") !== -1 || lower.indexOf("summary") !== -1) {
        runFollowUp("exec", withSelection, quote);
      } else if (lower.indexOf("implement") !== -1) {
        runFollowUp("impl", withSelection, quote);
      } else {
        appendUserMessage(withSelection, quote);
        workspace.assistantStatus = "working";
        setAssistantSendGenerating(true);
        const label = appendAssistantWorking();
        label.textContent = workspace.askRightText
          ? "Reviewing selection"
          : quote
            ? "Reviewing your follow-up"
            : "Reviewing your question";
        delay(prefersReducedMotion ? 40 : 600).then(function () {
          const working = document.getElementById("wb-assistant-working");
          if (working) working.remove();
          appendAssistantMessage(
            workspace.askRightText
              ? "<p>I've noted the selected passage. I can improve wording, explain it, or make it more concise — or tell me how you'd like it changed.</p>"
              : "<p>I can help refine this draft. Try asking me to summarise the key risks, strengthen the executive summary, or review implementation steps.</p>",
            true
          );
          workspace.assistantStatus = "complete";
          setAssistantSendGenerating(false);
        });
      }
    });
  }

  // Public API for compose shell + cinematic demos
  function showEditorShellForDemo() {
    if (composeView) {
      composeView.hidden = true;
      composeView.classList.remove("is-exiting");
      composeView.setAttribute("aria-hidden", "true");
    }
    if (editorView) {
      editorView.hidden = false;
      editorView.removeAttribute("hidden");
      editorView.setAttribute("aria-hidden", "false");
    }
    if (app) {
      app.classList.add("is-editor-view");
      if (window.matchMedia("(max-width: 900px)").matches) {
        app.classList.add("is-assistant-open");
      }
    }
    workspace.view = "editor";
    autoCollapseSidebarOnce();
  }

  function injectReportBlocksInstant() {
    if (!reportDoc) return;
    reportDoc.innerHTML = "";
    REPORT_BLOCKS.forEach(function (block) {
      const el = document.createElement("div");
      el.className = "wb-doc-block is-visible";
      if (block.id) el.id = block.id + "-wrap";
      el.innerHTML = block.html;
      reportDoc.appendChild(el);
    });
    reportDoc.setAttribute("contenteditable", "true");
  }

  function ensureAssistantCompleteMessage() {
    if (!assistantThread) return;
    const hasFinal = assistantThread.querySelector(".wb-assistant-msg--assistant .wb-assistant-msg__body");
    if (hasFinal) return;
    assistantThread.innerHTML = "";
    const wrap = appendAssistantMessage(ASSISTANT_FINAL_HTML, true);
    if (wrap) {
      const suggestions = wrap.querySelector(".wb-assistant-suggestions");
      if (suggestions) suggestions.hidden = false;
    }
  }

  function ensureCompletedReportForDemo(options) {
    options = options || {};
    closePopovers();
    closeCitePopover();
    hideSelectionToolbar();
    closeCommentComposer();
    closeCommentThread();
    if (typeof closeSharePopover === "function") closeSharePopover();
    if (options.resetPromptHistory !== false) {
      closePromptTrace();
      if (promptHistorySearch) promptHistorySearch.value = "";
    }

    const hasCites = !!(reportDoc && reportDoc.querySelector(".wb-cite"));
    const isComplete = workspace.reportStatus === "complete" && hasCites;

    if (!isComplete || options.forceInject) {
      showEditorShellForDemo();
      resetRevisionState();
      resetCommentState();
      injectReportBlocksInstant();
      workspace.reportStatus = "complete";
      workspace.assistantStatus = "complete";
      workspace.view = "editor";
      setReportStatus("", false);
      setAssistantSendGenerating(false);
      ensureAssistantCompleteMessage();
      renderSourcesList();
      seedDemoRevisions();
      renderSharePeople();
      renderCollabAvatars();
    } else {
      showEditorShellForDemo();
      setShowEdits(false);
      if (options.resetRevisions) {
        resetRevisionState();
        seedDemoRevisions();
      } else if (!workspace.revisions.length) {
        seedDemoRevisions();
      }
      if (options.resetComments !== false) {
        resetCommentState();
      }
    }

    setShowEdits(false);
    if (options.resetCollaborationPeople) {
      resetCollaborationPeopleToOwner();
    } else {
      ensureAccess("alex", "edit");
      ensureAccess("priya", "view");
      setPersonPresence("alex", "viewing", true);
      setPersonPresence("priya", "viewing", true);
    }
    if (reportScroll && options.scrollTop != null) {
      reportScroll.scrollTop = options.scrollTop;
    } else if (reportScroll && options.scrollToSelector) {
      const target = reportDoc && reportDoc.querySelector(options.scrollToSelector);
      if (target) {
        collaboration.programmaticScroll = true;
        target.scrollIntoView({ block: "center", behavior: "auto" });
        collaboration.programmaticScroll = false;
      }
    } else if (reportScroll) {
      reportScroll.scrollTop = Math.min(220, reportScroll.scrollHeight * 0.08);
    }
    refreshIcons();
    return true;
  }

  function findTextRangeInReport(phrase) {
    if (!reportDoc || !phrase) return null;
    const walker = document.createTreeWalker(reportDoc, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest(".wb-rev-detail, .wb-prompt-trace, .wb-cite, .wb-comment-marker, .wb-comment-mark")) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let node;
    while ((node = walker.nextNode())) {
      const idx = node.nodeValue.indexOf(phrase);
      if (idx === -1) continue;
      const range = document.createRange();
      range.setStart(node, idx);
      range.setEnd(node, idx + phrase.length);
      return range;
    }
    const blocks = reportDoc.querySelectorAll("p, li, h2, h3, td");
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (block.closest(".wb-rev-detail, .wb-prompt-trace")) continue;
      const hay = block.textContent || "";
      const at = hay.indexOf(phrase);
      if (at === -1) continue;
      const cross = rangeFromElementText(block, at, at + phrase.length);
      if (cross) return cross;
    }
    return null;
  }

  function rangeFromElementText(root, start, end) {
    if (!root) return null;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let seen = 0;
    let startNode = null;
    let startOff = 0;
    let endNode = null;
    let endOff = 0;
    let node;
    while ((node = walker.nextNode())) {
      const len = node.nodeValue.length;
      if (!startNode && seen + len > start) {
        startNode = node;
        startOff = start - seen;
      }
      if (seen + len >= end) {
        endNode = node;
        endOff = end - seen;
        break;
      }
      seen += len;
    }
    if (!startNode || !endNode) return null;
    const range = document.createRange();
    range.setStart(startNode, startOff);
    range.setEnd(endNode, endOff);
    return range;
  }

  function isUsableClientRect(rect) {
    return !!(
      rect &&
      isFinite(rect.left) &&
      isFinite(rect.top) &&
      rect.width > 1 &&
      rect.height > 1
    );
  }

  function getRangeHostBlock(range) {
    const node =
      (range && range.commonAncestorContainer && range.commonAncestorContainer.nodeType === 1
        ? range.commonAncestorContainer
        : range && range.startContainer && range.startContainer.parentElement) || null;
    return node && node.closest ? node.closest("p, li, h2, h3, td") : node;
  }

  function applyReportSelectionRange(range, phrase) {
    if (!range) return null;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    const host = getRangeHostBlock(range);
    const slotHost =
      host && host.closest ? host.closest("[data-rev-slot], [data-collab-slot]") : null;
    workspace.selectionContext = {
      text: phrase || range.toString(),
      range: range.cloneRange(),
      sectionId: slotHost
        ? slotHost.getAttribute("data-rev-slot") || slotHost.getAttribute("data-collab-slot")
        : null,
      sectionEl: host,
    };
    captureSelectionAnchor(range, host);
    window.requestAnimationFrame(function () {
      showSelectionToolbar({ freeze: true });
    });
    return range;
  }

  function selectReportPhrase(phrase) {
    const range = findTextRangeInReport(phrase);
    if (!range) return null;
    return applyReportSelectionRange(range, phrase);
  }

  function prepareVisiblePhrase(phrases, options) {
    options = options || {};
    const list = Array.isArray(phrases) ? phrases : [phrases];
    let found = null;
    for (let i = 0; i < list.length; i++) {
      const phrase = list[i];
      const range = findTextRangeInReport(phrase);
      if (!range) continue;
      found = {
        phrase: phrase,
        range: range,
        host: getRangeHostBlock(range),
        rect: range.getBoundingClientRect(),
      };
      break;
    }
    if (!found && reportDoc) {
      const fallback =
        reportDoc.querySelector("[data-rev-slot=\"rev-collab-alex\"]") ||
        reportDoc.querySelector("[data-rev-slot=\"rev-alex-impl\"]") ||
        reportDoc.querySelector("#wb-section-impl") ||
        reportDoc.querySelector("p");
      if (fallback && fallback.firstChild && fallback.firstChild.nodeType === 3) {
        const text = (fallback.textContent || "").trim();
        const slice = text.slice(0, Math.min(72, text.length));
        const range = findTextRangeInReport(slice);
        if (range) {
          found = {
            phrase: slice,
            range: range,
            host: fallback,
            rect: range.getBoundingClientRect(),
          };
        }
      }
    }
    if (!found) return null;
    if (options.scroll !== false && found.host && typeof found.host.scrollIntoView === "function") {
      const box = found.rect;
      const scroller = reportScroll && reportScroll.getBoundingClientRect();
      const offscreen =
        !isUsableClientRect(box) ||
        (scroller && (box.bottom < scroller.top + 24 || box.top > scroller.bottom - 24));
      if (offscreen) {
        collaboration.programmaticScroll = true;
        found.host.scrollIntoView({ block: "center", behavior: "auto" });
        collaboration.programmaticScroll = false;
        found.rect = found.range.getBoundingClientRect();
      }
    }
    if (!isUsableClientRect(found.rect)) return null;
    return found;
  }

  function getRevisionActionBtn(slot, action) {
    const detail = getRevisionDetailBySlot(slot);
    return detail ? detail.querySelector('[data-rev-action="' + action + '"]') : null;
  }

  function scrollReportToEl(el, options) {
    if (!el || typeof el.scrollIntoView !== "function") return false;
    options = options || {};
    collaboration.programmaticScroll = true;
    el.scrollIntoView({
      block: options.block || "center",
      behavior: options.instant === false && !prefersReducedMotion ? "smooth" : "auto",
    });
    collaboration.programmaticScroll = false;
    return true;
  }

  function getRevisionElBySlot(slot) {
    if (!reportDoc || !slot) return null;
    const unit = reportDoc.querySelector('.wb-rev-unit[data-revision-id]');
    // Prefer unit that wraps the slot element
    const slotEl = reportDoc.querySelector('[data-rev-slot="' + slot + '"]');
    if (!slotEl) return null;
    return slotEl.closest(".wb-rev-unit") || slotEl.querySelector(".wb-rev-detail") || slotEl;
  }

  function getRevisionDetailBySlot(slot) {
    const unit = getRevisionElBySlot(slot);
    if (!unit) return null;
    return unit.querySelector(".wb-rev-detail") || unit;
  }

  function setControlHoverState(el, hovered) {
    if (!el) return;
    el.classList.toggle("is-hover", !!hovered);
  }

  function openSourcesUsedPopover() {
    if (!sourcesBtn || !sourcesPopover) return false;
    if (sourcesPopover.hidden) {
      togglePopover(sourcesBtn, sourcesPopover);
    }
    return !sourcesPopover.hidden;
  }

  function closeSourcesUsedPopover() {
    if (sourcesPopover) sourcesPopover.hidden = true;
    if (sourcesBtn) sourcesBtn.setAttribute("aria-expanded", "false");
  }

  function getTextareaCaretRect(textarea) {
    if (!textarea) return null;
    const value = textarea.value || "";
    const offset = textarea.selectionEnd == null ? value.length : textarea.selectionEnd;
    const style = window.getComputedStyle(textarea);
    const mirror = document.createElement("div");
    const props = [
      "boxSizing",
      "width",
      "height",
      "overflowX",
      "overflowY",
      "borderTopWidth",
      "borderRightWidth",
      "borderBottomWidth",
      "borderLeftWidth",
      "paddingTop",
      "paddingRight",
      "paddingBottom",
      "paddingLeft",
      "fontStyle",
      "fontVariant",
      "fontWeight",
      "fontStretch",
      "fontSize",
      "fontFamily",
      "lineHeight",
      "letterSpacing",
      "textTransform",
      "textAlign",
      "whiteSpace",
      "wordBreak",
      "wordSpacing",
    ];
    props.forEach(function (prop) {
      mirror.style[prop] = style[prop];
    });
    const box = textarea.getBoundingClientRect();
    if (
      !textarea.isConnected ||
      !isFinite(box.left) ||
      !isFinite(box.top) ||
      box.width < 2 ||
      box.height < 2
    ) {
      return null;
    }
    mirror.style.position = "fixed";
    mirror.style.left = box.left + "px";
    mirror.style.top = box.top + "px";
    mirror.style.visibility = "hidden";
    mirror.style.pointerEvents = "none";
    mirror.style.whiteSpace = "pre-wrap";
    mirror.style.wordWrap = "break-word";
    mirror.style.overflow = "hidden";
    const before = document.createTextNode(value.slice(0, offset));
    const marker = document.createElement("span");
    marker.textContent = "\u200b";
    mirror.appendChild(before);
    mirror.appendChild(marker);
    document.body.appendChild(mirror);
    mirror.scrollTop = textarea.scrollTop;
    const markBox = marker.getBoundingClientRect();
    document.body.removeChild(mirror);
    if (!markBox || !isFinite(markBox.left) || !isFinite(markBox.top)) return null;
    return {
      left: markBox.left,
      top: markBox.top,
      height: markBox.height || parseFloat(style.lineHeight) || 16,
      width: 0,
      bottom: markBox.bottom,
      right: markBox.left,
    };
  }

  async function typeIntoCommentComposer(text, options) {
    options = options || {};
    const input = document.getElementById("wb-comment-composer-input");
    const submit = document.getElementById("wb-comment-submit");
    if (!input) return false;
    const caretApi = window.WriteBuilderCaret;
    input.value = "";
    input.focus();
    input.setSelectionRange(0, 0);
    if (submit) submit.disabled = true;

    for (let i = 0; i < text.length; i++) {
      if (options.shouldAbort && options.shouldAbort()) return false;
      const ch = text.charAt(i);
      const prevCh = i > 0 ? text.charAt(i - 1) : "";
      input.value += ch;
      const len = input.value.length;
      input.selectionStart = len;
      input.selectionEnd = len;
      if (submit) submit.disabled = !(input.value || "").trim();
      input.dispatchEvent(new Event("input", { bubbles: true }));
      if (caretApi && caretApi.waitForLayout) await caretApi.waitForLayout();
      else {
        await new Promise(function (resolve) {
          window.requestAnimationFrame(resolve);
        });
      }
      if (typeof options.onCaret === "function") {
        const rect = getTextareaCaretRect(input);
        if (rect) options.onCaret(rect, input);
      }
      const delayMs =
        caretApi && caretApi.getHumanTypingDelay
          ? caretApi.getHumanTypingDelay(ch, prevCh, {
              reduced: prefersReducedMotion,
              charDelayMin: options.charDelayMin || 20,
              charDelayMax: options.charDelayMax || 45,
            })
          : prefersReducedMotion
            ? 8
            : (options.charDelayMin || 20) +
              Math.floor(
                Math.random() * ((options.charDelayMax || 45) - (options.charDelayMin || 20))
              );
      await new Promise(function (resolve) {
        window.setTimeout(resolve, delayMs);
      });
    }
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
    if (submit) submit.disabled = !(input.value || "").trim();
    return true;
  }

  async function typeIntoShareAdd(text, options) {
    options = options || {};
    if (!shareAddInput) return false;
    const caretApi = window.WriteBuilderCaret;
    shareAddInput.value = "";
    shareAddInput.focus();
    shareAddInput.setSelectionRange(0, 0);
    renderShareSuggestions("");

    for (let i = 0; i < text.length; i++) {
      if (options.shouldAbort && options.shouldAbort()) return false;
      const ch = text.charAt(i);
      const prevCh = i > 0 ? text.charAt(i - 1) : "";
      shareAddInput.value += ch;
      const len = shareAddInput.value.length;
      shareAddInput.selectionStart = len;
      shareAddInput.selectionEnd = len;
      shareAddInput.dispatchEvent(new Event("input", { bubbles: true }));
      if (caretApi && caretApi.waitForLayout) await caretApi.waitForLayout();
      else {
        await new Promise(function (resolve) {
          window.requestAnimationFrame(resolve);
        });
      }
      if (typeof options.onCaret === "function") {
        const rect = getTextareaCaretRect(shareAddInput);
        if (rect) options.onCaret(rect, shareAddInput);
      }
      const delayMs =
        caretApi && caretApi.getHumanTypingDelay
          ? caretApi.getHumanTypingDelay(ch, prevCh, {
              reduced: prefersReducedMotion,
              charDelayMin: options.charDelayMin || 22,
              charDelayMax: options.charDelayMax || 40,
            })
          : prefersReducedMotion
            ? 8
            : 22 + Math.floor(Math.random() * 18);
      await new Promise(function (resolve) {
        window.setTimeout(resolve, delayMs);
      });
    }
    shareAddInput.focus();
    shareAddInput.setSelectionRange(shareAddInput.value.length, shareAddInput.value.length);
    return true;
  }

  function showAlexReplyingState(visible, label) {
    const typing = document.getElementById("wb-comment-typing");
    if (!typing) return;
    if (!visible) {
      typing.hidden = true;
      typing.innerHTML = "";
      return;
    }
    typing.hidden = false;
    typing.innerHTML =
      personAvatarHtml(getPersonProfile("alex"), "wb-collab-avatar--sm") +
      "<span>" +
      (label || "Alex is replying") +
      '<span class="wb-comment-typing__dots"></span></span>';
    refreshIcons();
  }

  async function animateReportScrollBy(delta, duration) {
    if (!reportScroll) return;
    const from = reportScroll.scrollTop;
    const to = Math.max(0, from + delta);
    if (prefersReducedMotion || Math.abs(to - from) < 1) {
      reportScroll.scrollTop = to;
      return;
    }
    const dur = duration == null ? 700 : duration;
    const start = performance.now();
    await new Promise(function (resolve) {
      function frame(now) {
        const t = Math.min(1, (now - start) / dur);
        const e = 1 - Math.pow(1 - t, 3);
        reportScroll.scrollTop = from + (to - from) * e;
        if (t < 1) window.requestAnimationFrame(frame);
        else resolve();
      }
      window.requestAnimationFrame(frame);
    });
  }

  syncSourceIconState();

  window.WriteBuilderReport = {
    start: function (opts) {
      if (opts && typeof opts === "object") {
        setSubmittedPromptSnapshot(opts.prompt, opts.contexts);
      }
      return enterEditorAndGenerate();
    },
    stop: function () {
      stopGeneration();
    },
    reset: function () {
      returnToCompose();
    },
    getState: function () {
      return {
        view: workspace.view,
        reportStatus: workspace.reportStatus,
        assistantStatus: workspace.assistantStatus,
        reportVersion: workspace.reportVersion,
      };
    },
    getReportEl: function () {
      return document.getElementById("wb-report") || reportDoc;
    },
    getAssistantEl: function () {
      return document.querySelector(".wb-assistant") || document.getElementById("wb-assistant");
    },
    getAgentPlanEl: function () {
      return (
        document.getElementById("wb-assistant-working") ||
        document.getElementById("wb-agent-progress") ||
        document.querySelector(".wb-agent-todo")
      );
    },
    getEditorView: function () {
      return editorView;
    },
    getReportScroll: function () {
      return reportScroll;
    },
    getReportDoc: function () {
      return reportDoc;
    },
    ensureCompletedReport: ensureCompletedReportForDemo,
    mountOverlaysForDemo: mountReportOverlaysForDemo,
    setShowEdits: setShowEdits,
    getShowEdits: function () {
      return !!workspace.showEdits;
    },
    openCite: function (refId, anchor) {
      const el =
        anchor ||
        (reportDoc &&
          reportDoc.querySelector(
            '.wb-cite[data-ref="' + refId + '"][data-cite-group*="' + refId + '"]'
          )) ||
        (reportDoc && reportDoc.querySelector('.wb-cite[data-ref="' + refId + '"]'));
      if (!el) return false;
      openCitePopover(Number(refId), el);
      return true;
    },
    closeCite: closeCitePopover,
    citeNext: function () {
      navigateCiteGroup(1);
    },
    citePrev: function () {
      navigateCiteGroup(-1);
    },
    getCitePopover: function () {
      return citePopover;
    },
    getCiteHighlight: function () {
      return (
        (citeBodyEl && citeBodyEl.querySelector("#wb-cite-highlight")) ||
        (citeBodyEl && citeBodyEl.querySelector(".wb-cite-mark"))
      );
    },
    getCiteNextBtn: function () {
      return citeNextBtn;
    },
    getCiteCloseBtn: function () {
      return citeCloseBtn;
    },
    getCiteBody: function () {
      return citeBodyEl;
    },
    scrollCiteBody: function (top) {
      if (!citeBodyEl) return;
      citeBodyEl.scrollTop = Math.max(0, top);
    },
    getCiteBodyScroll: function () {
      if (!citeBodyEl) return null;
      return {
        top: citeBodyEl.scrollTop,
        max: Math.max(0, citeBodyEl.scrollHeight - citeBodyEl.clientHeight),
        height: citeBodyEl.clientHeight,
        highlightTop: (function () {
          const mark =
            citeBodyEl.querySelector("#wb-cite-highlight") ||
            citeBodyEl.querySelector(".wb-cite-mark");
          return mark ? mark.offsetTop : 0;
        })(),
        highlightHeight: (function () {
          const mark =
            citeBodyEl.querySelector("#wb-cite-highlight") ||
            citeBodyEl.querySelector(".wb-cite-mark");
          return mark ? mark.offsetHeight : 0;
        })(),
      };
    },
    openSources: openSourcesUsedPopover,
    closeSources: closeSourcesUsedPopover,
    getSourcesBtn: function () {
      return sourcesBtn;
    },
    getSourcesPopover: function () {
      return sourcesPopover;
    },
    getSourcesOpenPanelBtn: function (refId) {
      return sourcesPopover
        ? sourcesPopover.querySelector('.wb-sources-list__open[data-open-panel="' + refId + '"]')
        : null;
    },
    getSourcesRow: function (refId) {
      const btn = sourcesPopover
        ? sourcesPopover.querySelector('.wb-sources-list__btn[data-open-ref="' + refId + '"]')
        : null;
      return btn ? btn.closest(".wb-sources-list__row") : null;
    },
    openSourceInPanel: openSourceInPanel,
    setRightPanelMode: setRightPanelMode,
    getRightPanelMode: function () {
      return workspace.rightPanelMode;
    },
    getSourcePanel: function () {
      return sourcePanelEl;
    },
    getSourceViewer: function () {
      return sourcePanelViewer;
    },
    getSourceUsageToggle: function () {
      return sourceUsageToggle;
    },
    setSourceUsageExpanded: setSourceUsageExpanded,
    getAssistantSourcesBtn: function () {
      return assistantSourcesBtn;
    },
    getPromptHistoryBtn: function () {
      return promptHistoryBtn;
    },
    getPromptHistoryPopover: function () {
      return promptHistoryPopover;
    },
    getPromptHistorySearch: function () {
      return promptHistorySearch;
    },
    getPromptHistoryRow: function (id) {
      return promptHistoryBody
        ? promptHistoryBody.querySelector('.wb-prompt-history-row[data-prompt-id="' + id + '"]')
        : null;
    },
    getPromptHistoryAction: function (id, action) {
      const row = promptHistoryBody
        ? promptHistoryBody.querySelector('.wb-prompt-history-row[data-prompt-id="' + id + '"]')
        : null;
      return row ? row.querySelector('[data-history-action="' + action + '"]') : null;
    },
    openPromptHistory: function () {
      if (!promptHistoryBtn || !promptHistoryPopover) return false;
      if (promptHistoryPopover.hidden) {
        togglePopover(promptHistoryBtn, promptHistoryPopover);
      }
      return !promptHistoryPopover.hidden;
    },
    closePromptHistory: function () {
      if (promptHistoryPopover) promptHistoryPopover.hidden = true;
      if (promptHistoryBtn) promptHistoryBtn.setAttribute("aria-expanded", "false");
    },
    setPromptHistoryQuery: setPromptHistoryQuery,
    openPromptTrace: openPromptTrace,
    closePromptTrace: closePromptTrace,
    goPromptTraceChange: goPromptTraceChange,
    getPromptTraceEl: function () {
      return document.getElementById("wb-prompt-trace");
    },
    getPromptTraceAction: function (action) {
      const card = document.getElementById("wb-prompt-trace");
      return card ? card.querySelector('[data-trace-action="' + action + '"]') : null;
    },
    copyPromptHistory: copyPromptHistoryById,
    askWriteFromHistory: askWriteFromHistory,
    prefillAssistantPrompt: prefillAssistantPrompt,
    placeAssistantCaretAtEnd: placeAssistantCaretAtEnd,
    resetPromptHistoryUi: resetPromptHistoryUi,
    getAssistantInput: function () {
      return assistantInput;
    },
    getComposerQuote: function () {
      return composerQuote;
    },
    getComposerContext: function () {
      return workspace.composerContext;
    },
    clearComposerPromptHistoryContext: clearComposerPromptHistoryContext,
    syncAssistantInputEmpty: syncAssistantInputEmpty,
    getTonePromptId: function () {
      return "ph-today-tone";
    },
    getTonePromptText: function () {
      return TONE_PROMPT;
    },
    scrollSourceViewer: function (toTop, options) {
      if (!sourcePanelViewer) return;
      const max = Math.max(0, sourcePanelViewer.scrollHeight - sourcePanelViewer.clientHeight);
      const top = Math.max(0, Math.min(max, toTop == null ? 0 : toTop));
      if (options && options.instant) sourcePanelViewer.scrollTop = top;
      else sourcePanelViewer.scrollTo({ top: top, behavior: prefersReducedMotion ? "auto" : "smooth" });
    },
    getSourceOccurrenceRow: function (index) {
      return sourcePanelList
        ? sourcePanelList.querySelector('[data-occ-index="' + index + '"]')
        : null;
    },
    hoverSourceOccurrence: setSourceOccurrenceHover,
    selectSourceOccurrence: selectSourceOccurrence,
    getOccurrenceRecord: function (index) {
      return getOccurrenceRecord(workspace.activeSourceId, index);
    },
    getSourceOccurrenceMark: function (index) {
      const marks = getSourceOccurrenceMarks(getOccurrenceSourceOcc(workspace.activeSourceId, index));
      return marks[0] || null;
    },
    getSourceOccurrenceMarks: function (index) {
      return getSourceOccurrenceMarks(getOccurrenceSourceOcc(workspace.activeSourceId, index));
    },
    getSourceOccurrenceMarkRect: getSourceOccurrenceMarkRect,
    centerTargetInScrollContainer: centerTargetInScrollContainer,
    centerTargetWithClamping: centerTargetWithClamping,
    getOccurrenceHost: function (index) {
      return getOccurrenceHost(getOccurrenceCiteEl(workspace.activeSourceId, index));
    },
    ensureOccurrenceVisible: function (index, options) {
      const host = getOccurrenceHost(getOccurrenceCiteEl(workspace.activeSourceId, index));
      if (host && reportScroll) {
        centerTargetInScrollContainer(host, reportScroll, {
          topInset: 72,
          bottomInset: 48,
          align: 0.48,
          instant: options && options.instant,
          minDuration: 600,
          maxDuration: 850,
        });
      } else if (host) {
        scrollReportToEl(host, options || { block: "center" });
      }
      return host;
    },
    getShowEditsBtn: function () {
      return showEditsBtn;
    },
    getRevisionDetailBySlot: getRevisionDetailBySlot,
    getRevisionUnitBySlot: getRevisionElBySlot,
    getRevisionIdBySlot: function (slot) {
      for (let i = 0; i < workspace.revisions.length; i++) {
        if (workspace.revisions[i].slot === slot) return workspace.revisions[i].id;
      }
      return null;
    },
    toggleRevision: function (revId) {
      toggleRevisionExpanded(revId);
    },
    getRevisionActionBtn: getRevisionActionBtn,
    acceptRevision: acceptRevision,
    revertRevision: revertRevision,
    scrollReportToEl: scrollReportToEl,
    prepareVisiblePhrase: prepareVisiblePhrase,
    applySelectionRange: applyReportSelectionRange,
    selectPhrase: selectReportPhrase,
    showSelectionToolbar: showSelectionToolbar,
    hideSelectionToolbar: hideSelectionToolbar,
    freezeSelectionToolbar: function () {
      setOverlayAnchorFrozen(selectionToolbar, true);
    },
    freezeCommentComposer: function () {
      setOverlayAnchorFrozen(commentComposer, true);
    },
    getSelectionToolbar: function () {
      return selectionToolbar;
    },
    getAddCommentBtn: function () {
      return addCommentBtn;
    },
    openCommentComposer: openCommentComposer,
    closeCommentComposer: closeCommentComposer,
    submitComment: submitCommentFromComposer,
    typeComment: typeIntoCommentComposer,
    getCommentComposer: function () {
      return commentComposer;
    },
    getCommentThread: function () {
      return commentThreadEl;
    },
    closeCommentThread: closeCommentThread,
    getCommentMark: function (threadId) {
      const id = threadId || workspace.activeCommentThreadId;
      return reportDoc && id
        ? reportDoc.querySelector('mark.wb-comment-mark[data-thread-id="' + id + '"]')
        : null;
    },
    getCommentMarker: function (threadId) {
      const id = threadId || workspace.activeCommentThreadId;
      return reportDoc && id
        ? reportDoc.querySelector('.wb-comment-marker[data-thread-id="' + id + '"]')
        : null;
    },
    getSelectionOverlayPlacement: getSelectionOverlayPlacement,
    getActiveCommentThreadId: function () {
      return workspace.activeCommentThreadId;
    },
    resolveActiveComment: function () {
      if (workspace.activeCommentThreadId) {
        resolveCommentThread(workspace.activeCommentThreadId);
      }
    },
    showAlexReplying: showAlexReplyingState,
    addAlexReply: function (text) {
      const id = workspace.activeCommentThreadId;
      if (!id) return false;
      showAlexReplyingState(false);
      addCommentReply(id, "alex", text || "Yes — I'll validate this with Finance and Technology before we finalise the recommendation.", {
        scrollReply: true,
      });
      return true;
    },
    setControlHover: setControlHoverState,
    animateReportScrollBy: animateReportScrollBy,
    resetReviewState: function () {
      resetCommentState();
      resetRevisionState();
      seedDemoRevisions();
      setShowEdits(false);
      closeCitePopover();
      closeSourcesUsedPopover();
      if (typeof closeSharePopover === "function") closeSharePopover();
    },
    resetEvidenceState: function () {
      closeCitePopover();
      closeSourcesUsedPopover();
      if (typeof closeSharePopover === "function") closeSharePopover();
      setShowEdits(false);
      hideSelectionToolbar();
      closeCommentComposer();
      closeCommentThread();
      resetSourcePanelState();
    },
    resetCollaborationState: resetCollaborationState,
    openSharePopover: openSharePopover,
    closeSharePopover: closeSharePopover,
    getShareBtn: function () {
      return shareBtn;
    },
    getSharePopover: function () {
      return sharePopover;
    },
    isShareOpen: function () {
      return !!(sharePopover && !sharePopover.hidden && sharePopover.isConnected);
    },
    getSharePersonPermission: function (id) {
      const person = findCollabPerson(id);
      return person ? person.permission : null;
    },
    getShareAddInput: function () {
      return shareAddInput;
    },
    getShareCloseBtn: function () {
      return shareCloseBtn;
    },
    getShareSuggestion: function (id) {
      return shareSuggestions
        ? shareSuggestions.querySelector('[data-add-id="' + id + '"]')
        : null;
    },
    getSharePersonRow: function (id) {
      return sharePeople
        ? sharePeople.querySelector('.wb-share-person[data-person-id="' + id + '"]')
        : null;
    },
    typeShareAdd: typeIntoShareAdd,
    addPersonById: addPersonById,
    stagePendingSharePerson: stagePendingSharePerson,
    confirmPendingShareAdd: confirmPendingShareAdd,
    openSharePermMenu: function (personId) {
      const trigger = getSharePermTrigger(personId);
      return trigger ? openSharePermMenu(trigger) : false;
    },
    closeSharePermMenu: closeSharePermMenu,
    scrollSharePersonIntoView: scrollSharePersonIntoView,
    getSharePermTrigger: getSharePermTrigger,
    getSharePermOption: getSharePermOption,
    getSharePending: function () {
      return sharePending;
    },
    applySharePermissionChoice: applySharePermissionChoice,
    setPersonPermission: setPersonPermission,
    setPersonPresence: setPersonPresence,
    getFollowChip: function () {
      return followChip;
    },
    getFollowChipPlacement: getFollowChipPlacement,
    getFollowChipFocusRect: getFollowChipFocusRect,
    setFollowChipDeferred: setFollowChipDeferred,
    syncFollowLayer: syncFollowLayer,
    getCollabPresence: function () {
      return document.getElementById("wb-collab-presence");
    },
    getCollabAvatar: getCollabAvatar,
    getFollowTargetForPerson: getFollowTargetForPerson,
    canFollowPerson: canFollowPerson,
    followCollaborator: followCollaborator,
    clearFollowedAvatar: clearFollowedAvatar,
    getAlexTarget: getAlexTarget,
    getPriyaTarget: getPriyaTarget,
  };

  window.WriteBuilderCamera = {
    focusDemoTarget: focusDemoTarget,
    focusDemoRect: function (rect, options) {
      return focusDemoTarget(rect, options || {});
    },
    resetDemoCamera: resetDemoCamera,
    holdDemo: function (ms) {
      return collabDelay(ms);
    },
    startCinematicMode: startCinematicMode,
    endCinematicMode: endCinematicMode,
    setInstant: setDemoCameraInstant,
    getState: function () {
      return {
        active: demoCamera.active,
        cinematic: demoCamera.cinematic,
        scale: demoCamera.scale,
        x: demoCamera.x,
        y: demoCamera.y,
        mode: demoCamera.mode,
        lockX: demoCamera.lockX,
      };
    },
    enterCollaborationEditorLock: enterCollaborationEditorLock,
    clampTransform: clampCameraTransform,
    getValidTransform: getValidCameraTransform,
    getTranslationBounds: getCameraTranslationBounds,
  };

  window.WriteBuilderCollabDemo = {
    run: runLiveCollaborationEdits,
    runLiveEdits: runLiveCollaborationEdits,
    prepareLiveSession: prepareLiveSession,
    startAlexTyping: startAlexTyping,
    startPriyaTyping: startPriyaTyping,
    beginAlexOffscreenEdit: beginAlexOffscreenEdit,
    beginPriyaOffscreenEdit: beginPriyaOffscreenEdit,
    accompanyAlexFollow: accompanyAlexFollow,
    accompanyPriyaFollow: accompanyPriyaFollow,
    followRemoteEditor: followRemoteEditor,
    finishAlexVisibleEdit: finishAlexVisibleEdit,
    finishPriyaVisibleEdit: finishPriyaVisibleEdit,
    runPriyaLiveSequence: runPriyaLiveSequence,
    completeLiveSession: completeLiveSession,
    awaitFollowTravel: awaitFollowTravel,
    followCollaborator: followCollaborator,
    setFollowChipDeferred: setFollowChipDeferred,
    cancel: cancelCinematicCollaborationDemo,
    restart: restartCollaborationDemo,
    getStatus: function () {
      return collaboration.demoStatus;
    },
    getAlexTypingIndex: function () {
      return collaboration.alexTypingIndex || 0;
    },
    getPriyaTypingIndex: function () {
      return collaboration.priyaTypingIndex || 0;
    },
    getFollowFrame: function () {
      return collaboration.followFrame;
    },
  };
})();
