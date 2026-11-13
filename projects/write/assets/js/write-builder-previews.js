/**
 * Context-chip mini document viewer — structured source data + shared renderers.
 * Content is fictional Horizon Group prototype material, not live client files.
 */
(function (global) {
  "use strict";

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function applyMark(text, mark) {
    var safe = esc(text);
    if (!mark) return safe;
    var needle = esc(mark);
    var idx = safe.indexOf(needle);
    if (idx === -1) return safe;
    return (
      safe.slice(0, idx) +
      '<mark class="wb-source-preview__mark">' +
      needle +
      "</mark>" +
      safe.slice(idx + needle.length)
    );
  }

  function renderTable(headers, rows, opts) {
    opts = opts || {};
    var html = '<table class="wb-source-preview__table"><thead><tr>';
    headers.forEach(function (h) {
      html += "<th>" + esc(h) + "</th>";
    });
    html += "</tr></thead><tbody>";
    rows.forEach(function (row, i) {
      var cells = row.cells || row;
      var id = row.id || "";
      var relevant = !!(row.relevant || (opts.highlightId && id === opts.highlightId) || i === opts.highlightIndex);
      html +=
        "<tr" +
        (relevant ? ' class="is-relevant"' : "") +
        (id ? ' data-row-id="' + esc(id) + '"' : "") +
        (relevant ? " data-preview-focus" : "") +
        ">";
      cells.forEach(function (cell) {
        html += "<td>" + esc(cell) + "</td>";
      });
      html += "</tr>";
    });
    html += "</tbody></table>";
    return html;
  }

  function renderBlocks(blocks, mark) {
    var usedMark = false;
    return (blocks || [])
      .map(function (block) {
        if (block.type === "table") {
          return (
            '<div class="wb-source-preview__table-wrap">' +
            renderTable(block.headers, block.rows, { highlightIndex: block.highlightIndex }) +
            "</div>"
          );
        }
        if (block.type === "ul") {
          return (
            "<ul class=\"wb-source-preview__list\">" +
            (block.items || [])
              .map(function (item) {
                return "<li>" + esc(item) + "</li>";
              })
              .join("") +
            "</ul>"
          );
        }
        if (block.type === "invoice") {
          return (
            '<article class="wb-source-preview__invoice">' +
            '<p class="wb-source-preview__invoice-head">' +
            esc(block.supplier) +
            " · " +
            esc(block.number) +
            "</p>" +
            '<p class="wb-source-preview__invoice-meta">' +
            esc(block.date) +
            " · " +
            esc(block.period) +
            "</p>" +
            "<p>" +
            esc(block.description) +
            "</p>" +
            '<p class="wb-source-preview__invoice-amt">' +
            esc(block.amount) +
            "</p>" +
            "</article>"
          );
        }
        var text = block.text || "";
        var html = applyMark(text, !usedMark ? mark : "");
        if (mark && html.indexOf("wb-source-preview__mark") !== -1) usedMark = true;
        return "<p>" + html + "</p>";
      })
      .join("");
  }

  function renderDocument(data) {
    var html = '<div class="wb-source-preview__doc">';
    if (data.docTitle) {
      html += '<p class="wb-source-preview__doc-kicker">' + esc(data.docKicker || "Internal document") + "</p>";
      html += '<h3 class="wb-source-preview__doc-title">' + esc(data.docTitle) + "</h3>";
    }
    (data.sections || []).forEach(function (section) {
      html +=
        '<section class="wb-source-preview__section" data-preview-page="' +
        esc(section.page || 1) +
        '"' +
        (section.id ? ' data-preview-anchor="' + esc(section.id) + '"' : "") +
        (section.focus ? " data-preview-focus" : "") +
        ">";
      if (section.heading) html += "<h4>" + esc(section.heading) + "</h4>";
      html += renderBlocks(section.blocks, section.mark);
      html += "</section>";
    });
    html += "</div>";
    return html;
  }

  function renderSpreadsheet(data) {
    return (
      '<div class="wb-source-preview__sheet">' +
      renderTable(data.columns, data.rows, { highlightId: data.highlightId }) +
      "</div>"
    );
  }

  function renderLegislation(data) {
    var html = '<div class="wb-source-preview__leg">';
    (data.sections || []).forEach(function (section) {
      html +=
        '<section class="wb-source-preview__leg-item" data-preview-page="' +
        esc(section.page || 1) +
        '"' +
        (section.id ? ' data-preview-anchor="' + esc(section.id) + '"' : "") +
        (section.focus ? " data-preview-focus" : "") +
        ">";
      if (section.code) html += '<p class="wb-source-preview__leg-num">' + esc(section.code) + "</p>";
      if (section.heading) html += '<p class="wb-source-preview__leg-name">' + esc(section.heading) + "</p>";
      (section.paragraphs || []).forEach(function (para, i) {
        html += "<p>" + applyMark(para, i === 0 ? section.mark : "") + "</p>";
      });
      html += "</section>";
    });
    html += "</div>";
    return html;
  }

  function renderPreview(data) {
    if (data.type === "spreadsheet") return renderSpreadsheet(data);
    if (data.type === "legislation" || data.type === "guidance") return renderLegislation(data);
    return renderDocument(data);
  }

  function kindFromType(type) {
    if (type === "spreadsheet") return "sheet";
    if (type === "legislation" || type === "guidance") return "legislation";
    return "document";
  }

  function row(id, cells, relevant) {
    return { id: id, cells: cells, relevant: !!relevant };
  }

  var REGISTER_COLUMNS = [
    "Arrangement ID",
    "Entity",
    "Instrument",
    "Counterparty",
    "Currency",
    "Notional",
    "Start Date",
    "Maturity",
    "Interest Rate",
    "Hedge Designation",
    "Status",
  ];

  var REGISTER_ROWS = [
    row("FA-014", ["FA-014", "Horizon Holdings Pty Ltd", "Revolving facility", "Westpac", "AUD", "AUD 40m", "12 Jan 2024", "12 Jan 2027", "BBSW + 1.05%", "N/A", "Active"]),
    row("FA-009", ["FA-009", "Horizon Treasury Pty Ltd", "Interest-rate swap", "CBA", "AUD", "AUD 60m", "30 Sep 2024", "30 Sep 2029", "Pay 3.85% fixed", "Cash flow hedge", "Active"]),
    row("FA-001", ["FA-001", "Horizon Finance Pty Ltd", "Cross-currency swap", "ANZ", "AUD/USD", "AUD 85m", "01 Jul 2026", "30 Jun 2031", "BBSW + 1.45%", "Cash flow hedge", "Active"], true),
    row("FA-002", ["FA-002", "Horizon Holdings Pty Ltd", "Term loan", "CBA", "AUD", "AUD 120m", "15 Mar 2025", "15 Mar 2030", "BBSW + 1.20%", "N/A", "Active"]),
    row("FA-003", ["FA-003", "Horizon Operations Pty Ltd", "FX forward", "NAB", "AUD/USD", "USD 12.5m", "01 Aug 2026", "30 Nov 2026", "Forward 0.6620", "Forecast hedge", "Active"]),
    row("FA-004", ["FA-004", "Horizon Finance Pty Ltd", "Interest-rate swap", "ANZ", "AUD", "AUD 50m", "01 Jul 2025", "01 Jul 2030", "Pay 4.10% fixed", "Cash flow hedge", "Active"]),
    row("FA-005", ["FA-005", "Horizon International Pty Ltd", "Cross-currency swap", "HSBC", "AUD/EUR", "EUR 18m", "20 Nov 2025", "20 Nov 2028", "BBSW + 1.30%", "Cash flow hedge", "Active"]),
    row("FA-006", ["FA-006", "Horizon Group Pty Ltd", "Commercial paper", "CBA", "AUD", "AUD 25m", "04 Feb 2026", "04 Aug 2026", "BBSW + 0.55%", "N/A", "Active"]),
    row("FA-007", ["FA-007", "Horizon Operations Pty Ltd", "FX forward", "Westpac", "AUD/USD", "USD 8.0m", "15 Sep 2026", "15 Dec 2026", "Forward 0.6585", "Forecast hedge", "Active"]),
    row("FA-008", ["FA-008", "Horizon Property Pty Ltd", "Term loan", "NAB", "AUD", "AUD 32m", "01 Dec 2023", "01 Dec 2028", "BBSW + 1.35%", "N/A", "Active"]),
    row("FA-010", ["FA-010", "Horizon Treasury Pty Ltd", "FX forward", "ANZ", "AUD/GBP", "GBP 4.2m", "10 Oct 2026", "10 Jan 2027", "Forward 0.5240", "Forecast hedge", "Active"]),
    row("FA-011", ["FA-011", "Horizon Finance Pty Ltd", "Revolving facility", "MUFG", "AUD", "AUD 75m", "28 Jun 2024", "28 Jun 2027", "BBSW + 0.95%", "N/A", "Active"]),
    row("FA-012", ["FA-012", "Horizon Services Pty Ltd", "Interest-rate swap", "NAB", "AUD", "AUD 20m", "15 Jan 2025", "15 Jan 2028", "Pay 3.95% fixed", "Cash flow hedge", "Active"]),
    row("FA-013", ["FA-013", "Horizon International Pty Ltd", "Term loan", "HSBC", "USD", "USD 22m", "03 Apr 2024", "03 Apr 2029", "SOFR + 1.60%", "N/A", "Active"]),
    row("FA-015", ["FA-015", "Horizon Treasury Pty Ltd", "Cross-currency swap", "BNP", "AUD/USD", "AUD 15m", "18 May 2025", "18 May 2027", "BBSW + 1.25%", "Fair value hedge", "Active"]),
    row("FA-016", ["FA-016", "Horizon Operations Pty Ltd", "FX forward", "CBA", "AUD/NZD", "NZD 6.5m", "22 Jul 2026", "22 Oct 2026", "Forward 1.0820", "Forecast hedge", "Active"]),
    row("FA-017", ["FA-017", "Horizon Holdings Pty Ltd", "Standby letter of credit", "ANZ", "AUD", "AUD 8m", "01 Jul 2025", "30 Jun 2027", "0.55% p.a. fee", "N/A", "Review"]),
    row("FA-018", ["FA-018", "Horizon Finance Pty Ltd", "Interest-rate cap", "UBS", "AUD", "AUD 35m", "01 Oct 2025", "01 Oct 2028", "Cap 5.25%", "Cash flow hedge", "Active"]),
    row("FA-019", ["FA-019", "Horizon Group Pty Ltd", "Term loan", "Westpac", "AUD", "AUD 90m", "09 Sep 2022", "09 Sep 2027", "BBSW + 1.15%", "N/A", "Active"]),
    row("FA-020", ["FA-020", "Horizon Treasury Pty Ltd", "FX swap", "NAB", "AUD/USD", "USD 10m", "02 Jun 2026", "02 Sep 2026", "Near/far points", "N/A", "Active"]),
    row("FA-021", ["FA-021", "Horizon International Pty Ltd", "Cross-currency swap", "Deutsche", "AUD/JPY", "JPY 1.8bn", "14 Feb 2025", "14 Feb 2030", "BBSW + 1.40%", "Cash flow hedge", "Active"]),
    row("FA-022", ["FA-022", "Horizon Property Pty Ltd", "Interest-rate swap", "CBA", "AUD", "AUD 28m", "01 Mar 2024", "01 Mar 2029", "Pay 4.05% fixed", "Cash flow hedge", "Active"]),
    row("FA-023", ["FA-023", "Horizon Finance Pty Ltd", "Bank guarantee", "ANZ", "AUD", "AUD 3.5m", "11 Nov 2025", "11 Nov 2026", "0.70% p.a. fee", "N/A", "Active"]),
    row("FA-024", ["FA-024", "Horizon Operations Pty Ltd", "FX forward", "HSBC", "AUD/USD", "USD 5.8m", "08 Jan 2027", "08 Apr 2027", "Forward 0.6610", "Forecast hedge", "Draft"]),
    row("FA-025", ["FA-025", "Horizon Treasury Pty Ltd", "Interest-rate swap", "MUFG", "AUD", "AUD 45m", "20 Aug 2025", "20 Aug 2030", "Pay 3.70% fixed", "Cash flow hedge", "Active"]),
    row("FA-026", ["FA-026", "Horizon Holdings Pty Ltd", "Revolving facility", "NAB", "AUD", "AUD 20m", "16 Apr 2023", "16 Apr 2026", "BBSW + 1.10%", "N/A", "Maturing"]),
    row("FA-027", ["FA-027", "Horizon Finance Pty Ltd", "Cross-currency swap", "CBA", "AUD/USD", "AUD 12m", "01 Jul 2024", "01 Jul 2027", "BBSW + 1.35%", "Cash flow hedge", "Active"]),
    row("FA-028", ["FA-028", "Horizon Services Pty Ltd", "Term loan", "Westpac", "AUD", "AUD 14m", "27 Oct 2023", "27 Oct 2028", "BBSW + 1.50%", "N/A", "Active"]),
    row("FA-029", ["FA-029", "Horizon International Pty Ltd", "FX forward", "ANZ", "AUD/SGD", "SGD 9.1m", "19 Sep 2026", "19 Dec 2026", "Forward 0.8680", "Forecast hedge", "Active"]),
    row("FA-030", ["FA-030", "Horizon Treasury Pty Ltd", "Overnight facility", "RBA / ANZ", "AUD", "AUD 10m", "01 Jul 2026", "Open", "Cash rate + 0.25%", "N/A", "Standby"]),
    row("FA-031", ["FA-031", "Horizon Group Pty Ltd", "Interest-rate swap", "ANZ", "AUD", "AUD 70m", "15 Jun 2023", "15 Jun 2028", "Pay 3.55% fixed", "Cash flow hedge", "Active"]),
    row("FA-032", ["FA-032", "Horizon Finance Pty Ltd", "Term loan", "HSBC", "AUD", "AUD 55m", "02 May 2026", "02 May 2031", "BBSW + 1.28%", "N/A", "Committed"]),
    row("FA-033", ["FA-033", "Horizon Operations Pty Ltd", "Commodity collar", "Macquarie", "AUD", "AUD 6m", "01 Jan 2026", "31 Dec 2026", "Collar 82–96", "N/A", "Active"]),
    row("FA-034", ["FA-034", "Horizon Property Pty Ltd", "Cross-currency swap", "NAB", "AUD/USD", "AUD 9m", "21 Dec 2025", "21 Dec 2028", "BBSW + 1.55%", "Fair value hedge", "Active"]),
    row("FA-035", ["FA-035", "Horizon Treasury Pty Ltd", "FX forward", "UBS", "AUD/EUR", "EUR 7.4m", "03 Mar 2027", "03 Jun 2027", "Forward 0.5985", "Forecast hedge", "Draft"]),
    row("FA-036", ["FA-036", "Horizon Holdings Pty Ltd", "Term loan", "MUFG", "AUD", "AUD 48m", "08 Jul 2022", "08 Jul 2027", "BBSW + 1.22%", "N/A", "Active"]),
    row("FA-037", ["FA-037", "Horizon Finance Pty Ltd", "Interest-rate swap", "Westpac", "AUD", "AUD 85m", "01 Jul 2026", "30 Jun 2031", "Pay 3.90% fixed", "Cash flow hedge", "Pending"]),
    row("FA-038", ["FA-038", "Horizon International Pty Ltd", "Revolving facility", "HSBC", "USD", "USD 15m", "30 Nov 2024", "30 Nov 2027", "SOFR + 1.40%", "N/A", "Active"]),
    row("FA-039", ["FA-039", "Horizon Services Pty Ltd", "FX forward", "CBA", "AUD/USD", "USD 3.2m", "14 Feb 2026", "14 May 2026", "Forward 0.6645", "Forecast hedge", "Settled"]),
    row("FA-040", ["FA-040", "Horizon Group Pty Ltd", "Guarantee facility", "ANZ", "AUD", "AUD 5m", "01 Jul 2025", "30 Jun 2028", "0.60% p.a. fee", "N/A", "Active"]),
    row("FA-041", ["FA-041", "Horizon Treasury Pty Ltd", "Cross-currency swap", "ANZ", "AUD/USD", "AUD 6.5m", "16 Aug 2023", "16 Aug 2026", "BBSW + 1.18%", "Cash flow hedge", "Maturing"]),
    row("FA-042", ["FA-042", "Horizon Finance Pty Ltd", "Commercial paper", "NAB", "AUD", "AUD 18m", "21 Apr 2026", "21 Jul 2026", "BBSW + 0.48%", "N/A", "Active"]),
  ];

  var LEDGER_COLUMNS = [
    "ID",
    "Supplier",
    "Cost category",
    "Description",
    "Amount",
    "GST",
    "Transaction phase",
    "Preliminary tax treatment",
    "Evidence status",
  ];

  var LEDGER_ROWS = [
    row("TX-001", ["TX-001", "Allens", "Legal due diligence", "Vendor legal DD, data-room review and issues list", "AUD 620,000", "AUD 62,000", "Pre-bid", "Capital — acquisition", "Complete"]),
    row("TX-002", ["TX-002", "PwC Tax", "Tax structuring advice", "Bid structure, BidCo funding and stamp duty map", "AUD 285,000", "AUD 28,500", "Pre-bid", "Revenue / mixed", "Complete"], true),
    row("TX-003", ["TX-003", "PwC", "Financial due diligence", "Quality of earnings and working-capital diligence", "AUD 910,000", "AUD 91,000", "Pre-bid", "Capital — acquisition", "Complete"]),
    row("TX-004", ["TX-004", "KPMG", "Valuation", "Independent valuation of Northshore enterprise value", "AUD 240,000", "AUD 24,000", "Pre-bid", "Capital — acquisition", "Complete"]),
    row("TX-005", ["TX-005", "ANZ", "Debt financing fees", "Commitment and arrangement fee on AUD term facility", "AUD 380,000", "AUD 38,000", "Financing", "Financing — specific", "Invoiced"]),
    row("TX-006", ["TX-006", "Allens", "SPA negotiation", "Share sale agreement, warranties and completion accounts", "AUD 740,000", "AUD 74,000", "Negotiation", "Capital — acquisition", "Invoiced"]),
    row("TX-007", ["TX-007", "Horizon PMO", "Integration planning", "Day-1 operating model and synergy workstream", "AUD 165,000", "AUD 16,500", "Integration", "Revenue — post-deal", "Open"]),
    row("TX-008", ["TX-008", "Accenture", "IT migration", "ERP cutover design and data-migration runbook", "AUD 420,000", "AUD 42,000", "Integration", "Capital / software", "Open"]),
    row("TX-009", ["TX-009", "Mercer", "Employee retention", "Key-person retention pool design for Northshore", "AUD 95,000", "AUD 9,500", "Integration", "Revenue — employment", "Draft"]),
    row("TX-010", ["TX-010", "FIRB counsel", "Regulatory filing", "FIRB application and foreign-investment correspondence", "AUD 78,000", "AUD 7,800", "Regulatory", "Capital — acquisition", "Complete"]),
    row("TX-011", ["TX-011", "Allens", "Legal due diligence", "Employment, IP and material-contracts workstream", "AUD 310,000", "AUD 31,000", "Pre-bid", "Capital — acquisition", "Complete"]),
    row("TX-012", ["TX-012", "PwC Tax", "Tax structuring advice", "TOFA interaction of BidCo cross-currency funding", "AUD 140,000", "AUD 14,000", "Financing", "Revenue — tax advice", "Invoiced"]),
    row("TX-013", ["TX-013", "Herbert Smith Freehills", "SPA negotiation", "Warranty insurance placement support", "AUD 86,000", "AUD 8,600", "Negotiation", "Capital — acquisition", "Invoiced"]),
    row("TX-014", ["TX-014", "Deloitte", "Financial due diligence", "Net-debt and leakages bridge", "AUD 190,000", "AUD 19,000", "Pre-bid", "Capital — acquisition", "Complete"]),
    row("TX-015", ["TX-015", "CBA", "Debt financing fees", "Agency and participation fees", "AUD 95,000", "AUD 9,500", "Financing", "Financing — specific", "Invoiced"]),
    row("TX-016", ["TX-016", "PwC", "Financial modelling", "Bid model, cases and board pack", "AUD 210,000", "AUD 21,000", "Pre-bid", "Capital — acquisition", "Complete"]),
    row("TX-017", ["TX-017", "Allens", "Legal due diligence", "Property and environmental addendum", "AUD 125,000", "AUD 12,500", "Pre-bid", "Capital — acquisition", "Complete"]),
    row("TX-018", ["TX-018", "NSW Revenue", "Stamp duty estimate", "Duty estimate on share acquisition — reserved", "AUD 1,640,000", "AUD 0", "Completion", "Stamp duty", "Accrued"]),
    row("TX-019", ["TX-019", "Computershare", "Regulatory filing", "ASIC forms and share-register updates", "AUD 18,400", "AUD 1,840", "Completion", "Capital — acquisition", "Open"]),
    row("TX-020", ["TX-020", "Horizon Treasury", "Debt financing fees", "Internal treasury execution support", "AUD 42,000", "AUD 4,200", "Financing", "Revenue — internal", "Open"]),
    row("TX-021", ["TX-021", "PwC Tax", "Tax structuring advice", "Consolidation joining-date paper for Northshore", "AUD 118,000", "AUD 11,800", "Structuring", "Revenue — tax advice", "Invoiced"]),
    row("TX-022", ["TX-022", "KPMG", "Valuation", "PPA and identifiable-intangibles draft", "AUD 160,000", "AUD 16,000", "Completion", "Capital — acquisition", "Draft"]),
    row("TX-023", ["TX-023", "Allens", "SPA negotiation", "Disclosure letter and specific indemnities", "AUD 155,000", "AUD 15,500", "Negotiation", "Capital — acquisition", "Invoiced"]),
    row("TX-024", ["TX-024", "JLL", "Valuation", "Property desktop reviews — three sites", "AUD 48,000", "AUD 4,800", "Pre-bid", "Capital — acquisition", "Complete"]),
    row("TX-025", ["TX-025", "Aon", "Insurance due diligence", "W&I and operational insurance gap review", "AUD 62,000", "AUD 6,200", "Pre-bid", "Capital — acquisition", "Complete"]),
    row("TX-026", ["TX-026", "Accenture", "IT migration", "Identity, access and payroll cutover", "AUD 275,000", "AUD 27,500", "Integration", "Revenue — post-deal", "Open"]),
    row("TX-027", ["TX-027", "Horizon PMO", "Integration planning", "Culture and communications workstream", "AUD 54,000", "AUD 5,400", "Integration", "Revenue — post-deal", "Open"]),
    row("TX-028", ["TX-028", "Ashurst", "Regulatory filing", "Competition informal clearance correspondence", "AUD 96,000", "AUD 9,600", "Regulatory", "Capital — acquisition", "Complete"]),
    row("TX-029", ["TX-029", "PwC", "Financial due diligence", "Customer concentration and backlog testing", "AUD 145,000", "AUD 14,500", "Pre-bid", "Capital — acquisition", "Complete"]),
    row("TX-030", ["TX-030", "ANZ", "Debt financing fees", "Hedging execution fee for AUD/USD CCS", "AUD 28,000", "AUD 2,800", "Financing", "Financing — specific", "Invoiced"]),
    row("TX-031", ["TX-031", "Allens", "Legal due diligence", "Litigation and warranty claims workstream", "AUD 88,000", "AUD 8,800", "Pre-bid", "Capital — acquisition", "Complete"]),
    row("TX-032", ["TX-032", "Mercer", "Employee retention", "Change-in-control bonus legal review", "AUD 36,000", "AUD 3,600", "Integration", "Revenue — employment", "Draft"]),
    row("TX-033", ["TX-033", "PwC Tax", "Tax structuring advice", "Withholding and non-resident vendor issues", "AUD 72,000", "AUD 7,200", "Structuring", "Revenue — tax advice", "Invoiced"]),
    row("TX-034", ["TX-034", "Printers / data room", "Other transaction costs", "Intralinks data-room licence — six months", "AUD 41,000", "AUD 4,100", "Pre-bid", "Capital — acquisition", "Complete"]),
    row("TX-035", ["TX-035", "E&Y", "Financial due diligence", "IT and cyber addendum", "AUD 130,000", "AUD 13,000", "Pre-bid", "Capital — acquisition", "Complete"]),
    row("TX-036", ["TX-036", "Allens", "SPA negotiation", "Completion-accounts protocol", "AUD 64,000", "AUD 6,400", "Negotiation", "Capital — acquisition", "Invoiced"]),
    row("TX-037", ["TX-037", "Horizon Finance", "Integration planning", "Finance systems mapping to Horizon chart", "AUD 39,000", "AUD 3,900", "Integration", "Revenue — post-deal", "Open"]),
    row("TX-038", ["TX-038", "ASIC agent", "Regulatory filing", "Company-secretarial completion pack", "AUD 12,800", "AUD 1,280", "Completion", "Capital — acquisition", "Open"]),
    row("TX-039", ["TX-039", "PwC", "Financial modelling", "Synergy case refresh for Investment Committee", "AUD 78,000", "AUD 7,800", "Negotiation", "Capital — acquisition", "Complete"]),
    row("TX-040", ["TX-040", "Westpac", "Debt financing fees", "Unused-line fee accrual — Q4", "AUD 22,500", "AUD 2,250", "Financing", "Financing — specific", "Accrued"]),
    row("TX-041", ["TX-041", "KPMG", "Valuation", "Earn-out probability-weighted scenarios", "AUD 55,000", "AUD 5,500", "Negotiation", "Capital — acquisition", "Draft"]),
    row("TX-042", ["TX-042", "Allens", "Legal due diligence", "Change-of-control consent tracker", "AUD 47,000", "AUD 4,700", "Pre-bid", "Capital — acquisition", "Complete"]),
    row("TX-043", ["TX-043", "Accenture", "IT migration", "Customer-portal rebrand and DNS cutover", "AUD 112,000", "AUD 11,200", "Integration", "Revenue — post-deal", "Open"]),
    row("TX-044", ["TX-044", "PwC Tax", "Tax structuring advice", "Indirect-tax mapping of invoice pack", "AUD 51,000", "AUD 5,100", "Completion", "Revenue — tax advice", "Open"]),
    row("TX-045", ["TX-045", "Travel / meetings", "Other transaction costs", "Deal-team travel — Sydney / Melbourne / Singapore", "AUD 34,600", "AUD 3,460", "Negotiation", "Revenue — mixed", "Complete"]),
    row("TX-046", ["TX-046", "Herbert Smith Freehills", "Regulatory filing", "Foreign counsel Singapore holding-company memo", "AUD 67,000", "AUD 0", "Structuring", "Capital — acquisition", "Complete"]),
    row("TX-047", ["TX-047", "Horizon PMO", "Integration planning", "Day-100 benefits tracking workbook", "AUD 28,000", "AUD 2,800", "Integration", "Revenue — post-deal", "Open"]),
    row("TX-048", ["TX-048", "ANZ", "Debt financing fees", "Legal counsel to lenders — cost recovery", "AUD 84,000", "AUD 8,400", "Financing", "Financing — specific", "Invoiced"]),
    row("TX-049", ["TX-049", "Allens", "SPA negotiation", "Post-completion claims protocol", "AUD 39,500", "AUD 3,950", "Completion", "Capital — acquisition", "Draft"]),
    row("TX-050", ["TX-050", "PwC", "Financial due diligence", "Final bring-down procedures", "AUD 72,000", "AUD 7,200", "Completion", "Capital — acquisition", "Open"]),
    row("TX-051", ["TX-051", "Mercer", "Employee retention", "Northshore STI / LTI harmonisation paper", "AUD 44,000", "AUD 4,400", "Integration", "Revenue — employment", "Draft"]),
    row("TX-052", ["TX-052", "Printers / data room", "Other transaction costs", "Printing of Investment Committee packs", "AUD 6,800", "AUD 680", "Negotiation", "Revenue — mixed", "Complete"]),
  ];

  var ENTITY_COLUMNS = [
    "Entity",
    "ABN",
    "Jurisdiction",
    "Ownership",
    "Tax status",
    "Tax losses",
    "Franking balance",
    "Asset base",
    "Joining status",
  ];

  var ENTITY_ROWS = [
    row("E-01", ["Horizon Group Pty Ltd", "18 004 112 901", "Australia", "Head company", "Consolidated head", "AUD 11.4m", "AUD 1.12m", "AUD 186.0m", "Head company"]),
    row("E-02", ["Horizon Holdings Pty Ltd", "44 221 908 331", "Australia", "100%", "MEC member", "AUD 0.0m", "AUD 0.18m", "AUD 42.6m", "Existing member"]),
    row("E-03", ["Horizon Finance Pty Ltd", "67 118 440 229", "Australia", "100%", "MEC member", "AUD 0.4m", "AUD 0.06m", "AUD 98.2m", "Existing member"]),
    row("E-04", ["Horizon Treasury Pty Ltd", "91 330 551 018", "Australia", "100%", "MEC member", "AUD 0.0m", "AUD 0.02m", "AUD 6.8m", "Existing member"]),
    row("E-05", ["Horizon Operations Pty Ltd", "25 774 102 664", "Australia", "100%", "MEC member", "AUD 1.1m", "AUD 0.31m", "AUD 54.4m", "Existing member"]),
    row("E-06", ["Horizon Services Pty Ltd", "53 882 019 447", "Australia", "100%", "MEC member", "AUD 0.2m", "AUD 0.09m", "AUD 8.1m", "Existing member"]),
    row("E-07", ["Horizon Property Pty Ltd", "12 609 773 882", "Australia", "100%", "MEC member", "AUD 0.0m", "AUD 0.14m", "AUD 31.5m", "Existing member"]),
    row("E-08", ["Horizon International Pty Ltd", "38 451 226 790", "Australia", "100%", "MEC member", "AUD 0.8m", "AUD 0.00m", "AUD 27.9m", "Existing member"]),
    row("E-09", ["Horizon Digital Pty Ltd", "70 193 884 226", "Australia", "100%", "MEC member", "AUD 2.6m", "AUD 0.00m", "AUD 9.4m", "Existing member"]),
    row("E-10", ["Horizon Logistics Pty Ltd", "84 267 551 903", "Australia", "100%", "MEC member", "AUD 0.0m", "AUD 0.05m", "AUD 12.7m", "Existing member"]),
    row("E-11", ["Northshore Holdings Pty Ltd", "29 908 114 550", "Australia", "Proposed 100%", "Standalone", "AUD 0.62m", "AUD 0.21m", "AUD 41.0m", "Joining 1 Jul 2026"], true),
    row("E-12", ["Northshore Ops Pty Ltd", "61 772 440 118", "Australia", "100% of Northshore", "Standalone", "AUD 0.18m", "AUD 0.04m", "AUD 19.6m", "Joining 1 Jul 2026"]),
    row("E-13", ["Northshore Property Pty Ltd", "47 331 908 662", "Australia", "100% of Northshore", "Standalone", "AUD 0.00m", "AUD 0.07m", "AUD 14.2m", "Joining 1 Jul 2026"]),
    row("E-14", ["Horizon Singapore Pte Ltd", "202014488C", "Singapore", "100%", "Foreign", "n/a", "n/a", "SGD 8.4m", "Excluded — foreign"]),
    row("E-15", ["Horizon UK Limited", "11844721", "United Kingdom", "100%", "Foreign", "n/a", "n/a", "GBP 3.1m", "Excluded — foreign"]),
    row("E-16", ["Horizon US Inc.", "87-4401922", "United States", "100%", "Foreign", "n/a", "n/a", "USD 5.6m", "Excluded — foreign"]),
    row("E-17", ["Horizon Dormant No. 4 Pty Ltd", "15 002 884 119", "Australia", "100%", "Dormant member", "AUD 0.05m", "AUD 0.00m", "AUD 0.1m", "Existing member"]),
    row("E-18", ["Write BidCo Pty Ltd", "99 610 228 447", "Australia", "100%", "New MEC member", "AUD 0.00m", "AUD 0.00m", "AUD 0.2m", "Existing — vehicle"]),
  ];

  var JOIN_COLUMNS = [
    "Asset category",
    "Accounting value",
    "Existing tax value",
    "Step 1 adjustment",
    "ACA allocation",
    "Proposed tax cost",
  ];

  var JOIN_ROWS = [
    row("J-01", ["Cash and cash equivalents", "2.14", "2.14", "0.00", "2.14", "2.14"]),
    row("J-02", ["Trade receivables", "6.42", "6.42", "0.00", "6.42", "6.42"]),
    row("J-03", ["Other receivables", "0.88", "0.88", "0.00", "0.88", "0.88"]),
    row("J-04", ["Inventory — finished goods", "3.10", "2.94", "0.08", "3.16", "3.16"]),
    row("J-05", ["Inventory — WIP", "0.74", "0.71", "0.02", "0.76", "0.76"]),
    row("J-06", ["Prepayments", "0.36", "0.36", "0.00", "0.36", "0.36"]),
    row("J-07", ["Plant and equipment", "8.20", "7.45", "0.40", "8.70", "8.70"]),
    row("J-08", ["Motor vehicles", "0.64", "0.51", "0.04", "0.68", "0.68"]),
    row("J-09", ["Fixtures and fittings", "1.12", "0.86", "0.06", "1.18", "1.18"]),
    row("J-10", ["Leasehold improvements", "1.84", "1.10", "0.12", "2.04", "2.04"]),
    row("J-11", ["Computer hardware", "0.58", "0.41", "0.03", "0.61", "0.61"]),
    row("J-12", ["Software — purchased", "1.26", "0.92", "0.08", "1.38", "1.38"]),
    row("J-13", ["Software — internally generated", "2.40", "0.00", "0.20", "1.10", "1.10"]),
    row("J-14", ["Customer relationships", "4.20", "0.00", "0.00", "3.85", "3.85"], true),
    row("J-15", ["Brands and trade names", "1.80", "0.00", "0.00", "1.45", "1.45"]),
    row("J-16", ["Customer contracts", "2.15", "0.00", "0.00", "1.92", "1.92"]),
    row("J-17", ["Order backlog", "0.46", "0.00", "0.00", "0.40", "0.40"]),
    row("J-18", ["Goodwill / residual", "18.04", "0.00", "0.00", "18.90", "18.90"]),
    row("J-19", ["Land", "3.60", "2.80", "0.20", "3.90", "3.90"]),
    row("J-20", ["Buildings", "5.10", "3.40", "0.30", "5.55", "5.55"]),
    row("J-21", ["Investment in Northshore Ops", "4.80", "4.80", "0.00", "reset n/a", "reset n/a"]),
    row("J-22", ["Deferred tax assets", "0.92", "0.92", "-0.18", "0.74", "0.74"]),
    row("J-23", ["Trade payables", "-3.28", "-3.28", "0.00", "-3.28", "-3.28"]),
    row("J-24", ["Accrued expenses", "-1.14", "-1.14", "0.00", "-1.14", "-1.14"]),
    row("J-25", ["Employee provisions", "-1.62", "-1.62", "0.00", "-1.62", "-1.62"]),
    row("J-26", ["Warranty provisions", "-0.48", "-0.48", "0.04", "-0.44", "-0.44"]),
    row("J-27", ["Lease liabilities", "-2.05", "-2.05", "0.00", "-2.05", "-2.05"]),
    row("J-28", ["Deferred revenue", "-0.72", "-0.72", "0.06", "-0.66", "-0.66"]),
    row("J-29", ["Borrowings — external", "-6.40", "-6.40", "0.00", "-6.40", "-6.40"]),
    row("J-30", ["Related-party loan", "-2.20", "-2.20", "0.00", "-2.20", "-2.20"]),
    row("J-31", ["Deferred tax liabilities", "-1.08", "-1.08", "0.15", "-0.93", "-0.93"]),
    row("J-32", ["Make-good provision", "-0.22", "-0.22", "0.00", "-0.22", "-0.22"]),
    row("J-33", ["Contingent consideration", "-0.85", "0.00", "-0.85", "-0.85", "-0.85"]),
    row("J-34", ["Other resettable assets", "0.31", "0.18", "0.02", "0.34", "0.34"]),
  ];

  var LOSS_COLUMNS = [
    "Income year",
    "Loss type",
    "Opening balance",
    "Current-year loss",
    "Utilised",
    "Transferred",
    "Adjustments",
    "Closing balance",
  ];

  var LOSS_ROWS = [
    row("L-18R", ["FY2018", "Revenue", "0.00", "2.40", "0.00", "0.00", "0.00", "2.40"]),
    row("L-19R", ["FY2019", "Revenue", "2.40", "1.85", "0.60", "0.00", "0.00", "3.65"]),
    row("L-19C", ["FY2019", "Net capital", "0.00", "1.20", "0.00", "0.00", "0.00", "1.20"]),
    row("L-20R", ["FY2020", "Revenue", "3.65", "0.90", "0.40", "0.00", "0.00", "4.15"]),
    row("L-21R", ["FY2021", "Revenue", "4.15", "0.00", "1.20", "0.00", "0.00", "2.95"]),
    row("L-21C", ["FY2021", "Net capital", "1.20", "0.80", "0.00", "0.00", "0.00", "2.00"]),
    row("L-22R", ["FY2022", "Revenue", "2.95", "8.40", "0.00", "0.00", "0.00", "11.35"], true),
    row("L-23R", ["FY2023", "Revenue", "11.35", "3.20", "1.05", "0.00", "0.00", "13.50"]),
    row("L-23C", ["FY2023", "Net capital", "2.00", "1.40", "0.20", "0.00", "0.00", "3.20"]),
    row("L-24R", ["FY2024", "Revenue", "13.50", "0.80", "2.10", "0.00", "0.00", "12.20"]),
    row("L-24C", ["FY2024", "Net capital", "3.20", "0.00", "0.40", "0.00", "0.00", "2.80"]),
    row("L-25R", ["FY2025", "Revenue", "12.20", "1.60", "0.00", "0.00", "0.00", "13.80"]),
    row("L-26R", ["FY2026", "Revenue", "13.80", "0.00", "2.40", "0.00", "0.00", "11.40"]),
    row("L-26C", ["FY2026", "Net capital", "2.80", "0.15", "0.00", "0.00", "0.00", "2.95"]),
    row("L-TOTR", ["Total", "Revenue", "—", "—", "—", "—", "—", "11.40"]),
    row("L-TOTC", ["Total", "Net capital", "—", "—", "—", "—", "—", "2.95"]),
  ];

  var OWN_COLUMNS = ["Effective date", "Shareholder", "Ownership %", "Event", "Supporting document"];

  var OWN_ROWS = [
    row("O-01", ["1 Jul 2018", "Horizon Holdings Pty Ltd", "100.0%", "Incorporation / opening register", "Form 201 / constitution"]),
    row("O-02", ["12 Mar 2019", "Horizon Holdings Pty Ltd", "100.0%", "Share issue — 2,000,000 ordinary", "Share certificate 019"]),
    row("O-03", ["8 Sep 2020", "Horizon Group Pty Ltd", "100.0%", "Internal transfer from Holdings", "Share transfer form ST-20-04"]),
    row("O-04", ["1 Feb 2021", "Horizon Group Pty Ltd", "82.0%", "Issue to Northbridge Capital", "Subscription deed 2021-02"]),
    row("O-05", ["1 Feb 2021", "Northbridge Capital Pty Ltd", "18.0%", "Minority subscription", "Subscription deed 2021-02"]),
    row("O-06", ["30 Jun 2022", "Horizon Group Pty Ltd", "100.0%", "Buy-back of Northbridge parcel", "Buy-back agreement BB-22"]),
    row("O-07", ["18 Nov 2023", "Horizon Group Pty Ltd", "100.0%", "Internal restructure — class conversion", "Board minutes 18 Nov 2023"]),
    row("O-08", ["4 Aug 2025", "Horizon Group Pty Ltd", "100.0%", "No change — register confirmation", "Registry extract Aug 2025"]),
    row("O-09", ["15 Mar 2026", "Horizon Group Pty Ltd", "100.0%", "No change — pre-deal bring-down", "Registry extract Mar 2026"]),
    row("O-10", ["1 Jul 2026", "Horizon Group Pty Ltd", "100.0%", "Proposed — Northshore joining (no share change)", "Draft completion agenda"], true),
  ];

  var SOURCE_PREVIEW_DATA = {
    "tofa-treasury": {
      type: "pdf",
      title: "Treasury policy",
      icon: "file-text",
      meta: "PDF · 24 pages · Updated 12 Aug",
      pages: 24,
      docKicker: "Horizon Group · Policy POL-TRS-04",
      docTitle: "Treasury Risk Management Policy",
      sections: [
        {
          id: "purpose",
          heading: "1. Purpose",
          page: 2,
          blocks: [
            {
              type: "p",
              text: "This policy establishes Horizon Group’s framework for managing funding, liquidity, interest-rate exposure, foreign-exchange exposure and counterparty risk across the Australian tax-consolidated group and nominated overseas subsidiaries.",
            },
            {
              type: "p",
              text: "It is intended to keep commercial treasury decisions, accounting designations and tax timing assessments aligned, and to ensure every material arrangement can be reconstructed from a single register.",
            },
          ],
        },
        {
          id: "scope",
          heading: "2. Scope",
          page: 3,
          blocks: [
            {
              type: "p",
              text: "The policy applies to Horizon Group Pty Ltd and controlled entities, Group Treasury, Group Finance, approved financing arrangements and derivative instruments executed for the group.",
            },
            {
              type: "ul",
              items: [
                "Bank debt, commercial paper and intra-group funding",
                "Interest-rate swaps, FX forwards and cross-currency swaps",
                "Guarantees, standby letters of credit and committed facilities",
              ],
            },
            {
              type: "p",
              text: "Operating subsidiaries may not execute external derivatives. Horizon Treasury Pty Ltd is the only approved booking entity unless the CFO grants a written exception.",
            },
          ],
        },
        {
          id: "governance",
          heading: "3. Governance",
          page: 5,
          blocks: [
            {
              type: "p",
              text: "The Board, through the Finance Committee, approves this policy and reviews material exceptions each quarter. The Group Treasurer is responsible for execution, register integrity and monthly reporting.",
            },
            {
              type: "p",
              text: "Tax and Accounting must be consulted before execution of any material or non-standard arrangement, including cross-currency financing, structured derivatives and any instrument that may require a TOFA election or hedge designation.",
            },
          ],
        },
        {
          id: "delegated",
          heading: "4. Delegated Authorities",
          page: 7,
          blocks: [
            {
              type: "p",
              text: "Authorities are measured on a group-consolidated notional basis. Splitting a transaction to stay under a threshold is a policy breach.",
            },
            {
              type: "table",
              headers: ["Transaction type", "Approval threshold", "Approver"],
              rows: [
                ["Debt facilities", "≤ AUD 50m", "Group Treasurer"],
                ["Debt facilities", "> AUD 50m", "CFO"],
                ["Derivative arrangements", "≤ AUD 25m", "Group Treasurer"],
                ["Material / non-standard", "Any", "CFO + Finance Committee"],
              ],
            },
            {
              type: "p",
              text: "The proposed AUD 85 million cross-currency financing commencing 1 July 2026 sits above both the debt and material-arrangement thresholds and requires CFO plus Finance Committee approval.",
            },
          ],
        },
        {
          id: "instruments",
          heading: "5. Approved Instruments",
          page: 9,
          blocks: [
            {
              type: "p",
              text: "Approved instruments are limited to bank debt, commercial paper, interest-rate swaps, FX forwards and cross-currency swaps that hedge an identified commercial exposure or funding need.",
            },
            {
              type: "p",
              text: "Exotic options, leveraged swaps and instruments with embedded leverage require Finance Committee approval and a documented tax and accounting paper before term-sheet signature.",
            },
          ],
        },
        {
          id: "fx",
          heading: "6. Foreign Exchange Risk",
          page: 11,
          blocks: [
            {
              type: "p",
              text: "Treasury identifies transactional, translational and forecast exposures each month. Forecast exposures may be hedged once the underlying cash flow is assessed as highly probable.",
            },
            {
              type: "p",
              text: "Hedge documentation must record the exposure, instrument, notional, tenor and objective before trade date. Undocumented FX trades are reported as exceptions.",
            },
          ],
        },
        {
          id: "ir",
          heading: "7. Interest Rate Risk",
          page: 13,
          blocks: [
            {
              type: "p",
              text: "Horizon targets 40–70% of drawn term debt on a fixed or swapped basis over a rolling 36-month horizon. Floating residual risk is accepted within that band.",
            },
            {
              type: "p",
              text: "Interest-rate swaps used against the 1 July 2026 cross-currency funding must match payment dates on the AUD leg and be recorded against the same register ID family.",
            },
          ],
        },
        {
          id: "cross-currency-financing",
          heading: "8. Cross-Currency Financing",
          page: 14,
          focus: true,
          mark: "Material arrangements require Tax review to assess relevant tax timing and foreign exchange implications.",
          blocks: [
            {
              type: "p",
              text: "Cross-currency arrangements must be recorded in the Financial Arrangements Register and supported by executed agreements, valuation data and documented hedge objectives.",
            },
            {
              type: "p",
              text: "Cross-currency swaps with a notional amount above AUD 25 million require CFO approval and must be recorded in the Financial Arrangements Register within two business days of execution.",
            },
            {
              type: "p",
              text: "Material arrangements require Tax review to assess relevant tax timing and foreign exchange implications. For Horizon Finance Pty Ltd’s AUD 85 million ANZ cross-currency swap commencing 1 July 2026, Tax is to confirm Division 230 classification, election status and the proposed cash-flow hedge designation before the first reset date.",
            },
            {
              type: "p",
              text: "Valuations are sourced from the executing bank and reconciled to Horizon’s treasury system at each month-end. Differences above AUD 50,000 are escalated to the Group Treasurer.",
            },
          ],
        },
        {
          id: "liquidity",
          heading: "9. Liquidity Management",
          page: 16,
          blocks: [
            {
              type: "p",
              text: "Horizon maintains a minimum liquidity buffer of AUD 40 million, comprising undrawn committed facilities and available cash, tested weekly.",
            },
            {
              type: "p",
              text: "Facility maturity is staggered so that no more than 35% of committed external debt matures in any rolling 12-month period. Cash-forecasting covers a 13-week and 12-month horizon.",
            },
          ],
        },
        {
          id: "counterparty",
          heading: "10. Counterparty Risk",
          page: 18,
          blocks: [
            {
              type: "p",
              text: "External financial counterparties must hold a long-term credit rating of A- or better from S&P or equivalent. Exposure limits are set by counterparty and product in the appendix.",
            },
            {
              type: "p",
              text: "ANZ, CBA, NAB, Westpac, HSBC and MUFG are currently approved. New counterparties require Treasurer and CFO approval.",
            },
          ],
        },
        {
          id: "documentation",
          heading: "11. Documentation",
          page: 19,
          blocks: [
            {
              type: "p",
              text: "Each arrangement file must contain the executed agreement, trade confirmation, independent or bank valuation, approval record, accounting designation and tax assessment.",
            },
            {
              type: "p",
              text: "Missing tax assessments are treated as an open control exception and block any subsequent increase in notional on the same instrument family.",
            },
          ],
        },
        {
          id: "monitoring",
          heading: "12. Monitoring and Reporting",
          page: 20,
          blocks: [
            {
              type: "p",
              text: "Treasury reports monthly to the CFO on register completeness, hedge effectiveness, liquidity and counterparty utilisation.",
            },
            {
              type: "p",
              text: "The Finance Committee receives a quarterly pack. This policy is reviewed annually or after any material change in the funding programme.",
            },
          ],
        },
        {
          id: "exceptions",
          heading: "13. Exceptions",
          page: 21,
          blocks: [
            {
              type: "p",
              text: "Exceptions require written CFO approval and, where the notional exceeds AUD 25 million, noting at the next Finance Committee meeting.",
            },
            {
              type: "p",
              text: "Retrospective documentation of a trade already executed is an exception, not ordinary process, and is recorded against the relevant register ID.",
            },
          ],
        },
        {
          id: "appendix",
          heading: "14. Appendix — Approved Counterparties",
          page: 23,
          blocks: [
            {
              type: "table",
              headers: ["Counterparty", "Products", "Limit", "Rating"],
              rows: [
                ["ANZ", "Debt, IRS, CCS, FX", "AUD 200m", "AA-"],
                ["CBA", "Debt, IRS, FX", "AUD 180m", "AA-"],
                ["NAB", "Debt, IRS, FX", "AUD 150m", "AA-"],
                ["Westpac", "Debt, IRS, FX", "AUD 150m", "AA-"],
                ["HSBC", "CCS, FX, USD debt", "AUD 80m", "A+"],
                ["MUFG", "Debt, IRS", "AUD 75m", "A"],
              ],
            },
            {
              type: "p",
              text: "Limits are group-consolidated and include drawn debt plus the mark-to-market and potential future exposure of derivatives.",
            },
          ],
        },
      ],
    },
    "tofa-register": {
      type: "spreadsheet",
      title: "Financial arrangements register",
      icon: "sheet",
      meta: "XLSX · 42 arrangements · Updated 2 days ago",
      footer: "42 arrangements · 11 columns",
      cornerMeta: "42 rows",
      columns: REGISTER_COLUMNS,
      rows: REGISTER_ROWS,
      highlightId: "FA-001",
    },
    "tofa-div230": {
      type: "legislation",
      title: "Division 230",
      icon: "landmark",
      meta: "Legislation · Current compilation",
      pages: 86,
      sections: [
        {
          id: "overview",
          code: "Div 230",
          heading: "Overview",
          page: 1,
          paragraphs: [
            "This compilation is a working paraphrase of Division 230 of the Income Tax Assessment Act 1997 for prototype review only. It is not official legislative text.",
            "The Division sets a framework for bringing to account gains and losses from financial arrangements, subject to thresholds, exceptions and elections.",
          ],
        },
        {
          id: "scope",
          code: "230-5",
          heading: "Scope of Division 230",
          page: 3,
          paragraphs: [
            "The Division applies to an entity’s gains and losses from financial arrangements where the entity is in the TOFA population or has made a relevant election, and no exception takes the arrangement out.",
          ],
        },
        {
          id: "what-is-fa",
          code: "230-45",
          heading: "What constitutes a financial arrangement",
          page: 8,
          focus: true,
          mark: "cash-settlable right to receive, or obligation to provide, a financial benefit",
          paragraphs: [
            "An entity has a financial arrangement where, under an arrangement, it has a cash-settlable right to receive, or obligation to provide, a financial benefit. Cash-settability includes rights that will or may be settled in money or that can readily be converted into money.",
            "Horizon Finance Pty Ltd’s AUD 85 million cross-currency swap with ANZ commencing 1 July 2026 is the working example used in this file: periodic exchange of interest and principal legs is treated as a candidate financial arrangement pending exception testing.",
          ],
        },
        {
          id: "cash-settlable",
          code: "230-45(2)",
          heading: "Cash-settlable rights and obligations",
          page: 10,
          paragraphs: [
            "A right or obligation is cash-settlable if it is to be settled by money, a money equivalent, or by an asset that is readily convertible into money, or if there is a market practice of cash settlement.",
          ],
        },
        {
          id: "exceptions",
          code: "230-45 / 230-310",
          heading: "Exceptions",
          page: 14,
          paragraphs: [
            "Specified exceptions can take an arrangement outside the Division, including certain equity interests, insurance, and short-term arrangements that meet the relevant tests. Exception claims are documented before a timing method is applied.",
          ],
        },
        {
          id: "accruals",
          code: "230-100",
          heading: "Accruals method",
          page: 22,
          paragraphs: [
            "Where a sufficiently certain overall gain or loss can be estimated, the compounding accruals method spreads that gain or loss over the period to which it relates. Reset dates, notional exchanges and premium or discount are brought into the estimate.",
          ],
        },
        {
          id: "realisation",
          code: "230-150",
          heading: "Realisation method",
          page: 28,
          paragraphs: [
            "Where an overall gain or loss is not sufficiently certain, gains and losses are generally brought to account when they are realised. Partial realisations and ceasing to have the arrangement are typical realisation events.",
          ],
        },
        {
          id: "fair-value",
          code: "230-180",
          heading: "Fair value method",
          page: 34,
          paragraphs: [
            "If a fair-value election is in force and the arrangement is accounted for at fair value through profit or loss, tax timing can follow that fair-value movement, subject to the election’s integrity rules.",
          ],
        },
        {
          id: "fx-retrans",
          code: "230-220",
          heading: "Foreign exchange retranslation",
          page: 41,
          paragraphs: [
            "A foreign-exchange retranslation election can align tax FX movements with the accounting treatment for nominated arrangements. Cross-currency swaps require a clear allocation between interest, principal and FX components.",
          ],
        },
        {
          id: "hedging",
          code: "230-255",
          heading: "Hedging financial arrangements",
          page: 48,
          paragraphs: [
            "Hedging financial-arrangement rules may allow tax timing to follow the hedged item where designation, documentation and effectiveness requirements are met. Horizon’s proposed cash-flow hedge of the 1 July 2026 AUD 85 million arrangement is tested against these requirements in the working file.",
          ],
        },
        {
          id: "reports",
          code: "230-210",
          heading: "Reliance on financial reports",
          page: 55,
          paragraphs: [
            "In limited cases an entity may rely on audited financial reports for tax timing if the statutory conditions are met. Reliance is an election outcome, not a default.",
          ],
        },
        {
          id: "elections",
          code: "230-150 / elections",
          heading: "Elections",
          page: 60,
          paragraphs: [
            "Fair value, FX retranslation, hedging and financial-reports elections have commencement, irrevocability and integrity consequences. Election status for Horizon Group is recorded in the entity tax profile and must be confirmed before a method is applied to FA-001.",
          ],
        },
        {
          id: "balancing",
          code: "230-395",
          heading: "Balancing adjustments",
          page: 68,
          paragraphs: [
            "Ceasing to have a financial arrangement, or a transfer that is treated as a cessation, generally triggers a balancing adjustment so that remaining unrecognised gains or losses are brought to account.",
          ],
        },
        {
          id: "interaction",
          code: "230-500",
          heading: "Interaction with other provisions",
          page: 74,
          paragraphs: [
            "The Division interacts with ordinary income, forex, withholding and consolidation cost-setting rules. Where another provision is specifically turned off, that outcome is recorded in the classification paper.",
          ],
        },
        {
          id: "records",
          code: "230-395 / records",
          heading: "Record keeping",
          page: 80,
          paragraphs: [
            "Records must be sufficient to explain the classification, elections, estimates, realisations and hedge designations. Register extracts, confirmations and valuation files are the working evidence set for Horizon’s treasury population.",
          ],
        },
      ],
    },
    "tofa-ato": {
      type: "guidance",
      title: "ATO TOFA guidance",
      icon: "globe",
      meta: "Guidance · Internal working summary",
      pages: 22,
      sections: [
        {
          id: "overview",
          code: "Ch 1",
          heading: "TOFA overview",
          page: 1,
          paragraphs: [
            "This note is a paraphrased working summary of published ATO TOFA themes for prototype use. It is not official ATO wording and should not be cited as a ruling.",
            "TOFA is concerned with when gains and losses from financial arrangements are recognised, not with inventing a separate commercial characterisation.",
          ],
        },
        {
          id: "who",
          code: "Ch 2",
          heading: "Who the rules apply to",
          page: 3,
          paragraphs: [
            "Start with population tests and any elective entry. Horizon Group’s aggregated turnover and financial-asset tests are recorded in the entity tax profile before instrument-level work begins.",
          ],
        },
        {
          id: "concepts",
          code: "Ch 3",
          heading: "Financial arrangement concepts",
          page: 5,
          focus: true,
          mark: "rights or obligations to receive or provide a financial benefit",
          paragraphs: [
            "Confirm whether the instrument creates rights or obligations to receive or provide a financial benefit, and whether those rights are cash-settlable. Cross-currency swaps typically meet that starting description.",
          ],
        },
        {
          id: "timing",
          code: "Ch 4",
          heading: "Tax timing methods",
          page: 8,
          paragraphs: [
            "Default compounding accruals or realisation depends on whether overall outcomes can be estimated with sufficient certainty. Fair value, retranslation and hedging are election-driven alternatives.",
          ],
        },
        {
          id: "elections",
          code: "Ch 5",
          heading: "Elections",
          page: 10,
          paragraphs: [
            "Record which elections are in force, their start date and whether they cover the relevant arrangement class. Do not model cash-tax differences until election status is confirmed.",
          ],
        },
        {
          id: "fx",
          code: "Ch 6",
          heading: "Foreign currency arrangements",
          page: 12,
          paragraphs: [
            "Separate interest, principal and FX components for cross-currency financing. The 1 July 2026 AUD 85 million ANZ swap is the Horizon example used in this working file.",
          ],
        },
        {
          id: "hedge",
          code: "Ch 7",
          heading: "Hedging arrangements",
          page: 14,
          paragraphs: [
            "Hedge tax timing follows the hedged item only where designation and effectiveness evidence exists. Accounting designation alone is not treated as sufficient.",
          ],
        },
        {
          id: "records",
          code: "Ch 8",
          heading: "Record keeping",
          page: 16,
          paragraphs: [
            "Classification papers, register extracts, confirmations and month-end valuations are the minimum pack before a filing position is taken.",
          ],
        },
        {
          id: "issues",
          code: "Ch 9",
          heading: "Common implementation issues",
          page: 18,
          paragraphs: [
            "Cash-flow mapping, missing lot IDs and FX capture gaps are the usual reasons a technically supportable conclusion cannot be operated in the tax engine.",
          ],
        },
        {
          id: "examples",
          code: "Ch 10",
          heading: "Examples",
          page: 19,
          paragraphs: [
            "Worked examples in this file use Horizon Finance Pty Ltd, a five-year AUD/USD cross-currency swap, notional AUD 85 million, effective 1 July 2026, designated as a cash-flow hedge pending Tax sign-off.",
          ],
        },
        {
          id: "faq",
          code: "Ch 11",
          heading: "FAQ / practical considerations",
          page: 21,
          paragraphs: [
            "If register data and the executed confirmation disagree, stop modelling and reconcile the instrument ID. Do not average notionals across unmatched trades.",
          ],
        },
      ],
    },
    "tx-ledger": {
      type: "spreadsheet",
      title: "Transaction cost ledger",
      icon: "sheet",
      meta: "XLSX · 68 entries · Updated yesterday",
      footer: "68 entries · 9 columns",
      cornerMeta: "68 entries",
      columns: LEDGER_COLUMNS,
      rows: LEDGER_ROWS,
      highlightId: "TX-002",
    },
    "tx-structure": {
      type: "pdf",
      title: "Deal structure summary",
      icon: "file-text",
      meta: "PDF · 18 pages · Draft v7",
      pages: 18,
      docKicker: "Horizon Group · Project Northshore",
      docTitle: "Deal Structure Summary",
      sections: [
        {
          id: "overview",
          heading: "1. Transaction overview",
          page: 1,
          blocks: [
            {
              type: "p",
              text: "Horizon Group is acquiring 100% of the issued shares in Northshore Holdings Pty Ltd through Write BidCo Pty Ltd. The working headline consideration is AUD 85 million, plus customary working-capital and net-debt adjustments.",
            },
          ],
        },
        {
          id: "parties",
          heading: "2. Parties",
          page: 2,
          blocks: [
            {
              type: "table",
              headers: ["Role", "Entity"],
              rows: [
                ["Acquirer / head company", "Horizon Group Pty Ltd"],
                ["Bid vehicle", "Write BidCo Pty Ltd"],
                ["Target", "Northshore Holdings Pty Ltd"],
                ["Operating subsidiary", "Northshore Ops Pty Ltd"],
              ],
            },
          ],
        },
        {
          id: "legal",
          heading: "3. Legal structure",
          page: 4,
          blocks: [
            {
              type: "p",
              text: "Share sale of Northshore Holdings. No asset sale. Existing Northshore financing is to be refinanced at completion except for specified intra-group balances.",
            },
          ],
        },
        {
          id: "consideration",
          heading: "4. Purchase consideration",
          page: 5,
          focus: true,
          mark: "Estimated cash consideration is AUD 85 million",
          blocks: [
            {
              type: "p",
              text: "Estimated cash consideration is AUD 85 million, plus a completion-accounts adjustment against a locked-box or completion NAV schedule still under negotiation.",
            },
            {
              type: "p",
              text: "An earn-out of up to AUD 6 million is contemplated against FY27 Northshore EBIT. Probability-weighted accounting and tax treatment remains open.",
            },
          ],
        },
        {
          id: "funding",
          heading: "5. Funding",
          page: 7,
          blocks: [
            {
              type: "p",
              text: "Consideration is expected from existing cash and a committed AUD term facility. Residual USD exposure on imported inventory contracts may be hedged with the ANZ cross-currency programme dated 1 July 2026.",
            },
          ],
        },
        {
          id: "vehicle",
          heading: "6. Acquisition vehicle",
          page: 8,
          blocks: [
            {
              type: "p",
              text: "Write BidCo Pty Ltd is a wholly-owned Australian company formed to acquire Northshore and join the Horizon tax-consolidated group on completion.",
            },
          ],
        },
        {
          id: "steps",
          heading: "7. Key transaction steps",
          page: 10,
          blocks: [
            {
              type: "ul",
              items: [
                "Sign SPA and pay deposit",
                "FIRB and other conditions",
                "Draw debt / execute hedges",
                "Completion and share transfer",
                "Join Northshore to the MEC group",
              ],
            },
          ],
        },
        {
          id: "completion",
          heading: "8. Completion mechanics",
          page: 12,
          blocks: [
            {
              type: "p",
              text: "Completion is targeted for 1 July 2026, subject to FIRB and customary conditions. Funds flow through BidCo. Share registers update on the same day.",
            },
          ],
        },
        {
          id: "costs",
          heading: "9. Transaction costs",
          page: 13,
          blocks: [
            {
              type: "p",
              text: "Gross adviser, financing and duty costs currently sit in the Transaction Cost Ledger. Tax treatment is not uniform: acquisition-capital, financing-specific and post-deal revenue items are coded separately.",
            },
          ],
        },
        {
          id: "integration",
          heading: "10. Integration plan",
          page: 14,
          blocks: [
            {
              type: "p",
              text: "Finance, payroll and customer-portal cutover is planned across the first 100 days. Northshore brands are retained for 18 months.",
            },
          ],
        },
        {
          id: "dates",
          heading: "11. Key dates",
          page: 16,
          blocks: [
            {
              type: "table",
              headers: ["Milestone", "Date"],
              rows: [
                ["SPA signing (target)", "15 May 2026"],
                ["FIRB lodgement", "22 May 2026"],
                ["Completion / joining", "1 July 2026"],
                ["Completion accounts", "31 August 2026"],
              ],
            },
          ],
        },
        {
          id: "open",
          heading: "12. Open matters",
          page: 17,
          blocks: [
            {
              type: "p",
              text: "Open: earn-out drafting, W&I policy, locked-box leakage list, and Tax confirmation of BidCo funding / TOFA interaction for the AUD 85 million hedge.",
            },
          ],
        },
      ],
    },
    "tx-invoices": {
      type: "pdf",
      title: "Adviser invoices",
      icon: "files",
      meta: "PDF · 37 pages · 12 invoices",
      pages: 37,
      docKicker: "Horizon Group · Project Northshore",
      docTitle: "Adviser invoice pack",
      sections: [
        {
          id: "cover",
          heading: "Pack contents",
          page: 1,
          blocks: [
            {
              type: "p",
              text: "Twelve invoices supporting the Transaction Cost Ledger. Amounts below are extracts for review, not a substitute for the PDF image of each invoice.",
            },
          ],
        },
        {
          id: "inv-4412",
          heading: "Invoice extract",
          page: 3,
          blocks: [
            {
              type: "invoice",
              supplier: "Allens",
              number: "INV-4412",
              date: "18 Mar 2026",
              period: "1 Jan – 28 Feb 2026",
              description: "Legal due diligence — corporate, contracts and issues list for Northshore Holdings.",
              amount: "AUD 1,200,000 inc. GST",
            },
          ],
        },
        {
          id: "inv-4418",
          heading: "Invoice extract",
          page: 6,
          blocks: [
            {
              type: "invoice",
              supplier: "Allens",
              number: "INV-4418",
              date: "4 Apr 2026",
              period: "1 Mar – 31 Mar 2026",
              description: "SPA negotiation, disclosure letter and warranty schedule.",
              amount: "AUD 740,000 inc. GST",
            },
          ],
        },
        {
          id: "inv-3304",
          heading: "Invoice extract",
          page: 10,
          focus: true,
          mark: "Tax structuring for BidCo and the 1 July 2026 funding / hedge package",
          blocks: [
            {
              type: "p",
              text: "Tax structuring for BidCo and the 1 July 2026 funding / hedge package is coded to the tax-advisory workstream in the ledger.",
            },
            {
              type: "invoice",
              supplier: "PwC Tax",
              number: "INV-3304",
              date: "12 Apr 2026",
              period: "1 Feb – 31 Mar 2026",
              description: "Tax structuring advice — BidCo, stamp-duty map, consolidation joining date and TOFA interaction of the AUD 85 million cross-currency hedge.",
              amount: "AUD 425,000 inc. GST",
            },
          ],
        },
        {
          id: "inv-2281",
          heading: "Invoice extract",
          page: 14,
          blocks: [
            {
              type: "invoice",
              supplier: "PwC",
              number: "INV-2281",
              date: "21 Mar 2026",
              period: "6 Jan – 15 Mar 2026",
              description: "Financial due diligence — quality of earnings, working capital and net-debt bridge.",
              amount: "AUD 910,000 inc. GST",
            },
          ],
        },
        {
          id: "inv-2288",
          heading: "Invoice extract",
          page: 17,
          blocks: [
            {
              type: "invoice",
              supplier: "PwC",
              number: "INV-2288",
              date: "2 May 2026",
              period: "16 Mar – 30 Apr 2026",
              description: "Financial modelling and Investment Committee pack refresh.",
              amount: "AUD 288,000 inc. GST",
            },
          ],
        },
        {
          id: "inv-k-11",
          heading: "Invoice extract",
          page: 20,
          blocks: [
            {
              type: "invoice",
              supplier: "KPMG",
              number: "KPMG-4411",
              date: "8 Apr 2026",
              period: "1 Mar – 31 Mar 2026",
              description: "Independent valuation of Northshore enterprise value.",
              amount: "AUD 240,000 inc. GST",
            },
          ],
        },
        {
          id: "inv-anz-1",
          heading: "Invoice extract",
          page: 23,
          blocks: [
            {
              type: "invoice",
              supplier: "ANZ",
              number: "ANZ-FAC-906",
              date: "20 Jun 2026",
              period: "Facility close",
              description: "Debt financing — commitment and arrangement fee on the AUD term facility.",
              amount: "AUD 380,000 inc. GST",
            },
          ],
        },
        {
          id: "inv-acc-1",
          heading: "Invoice extract",
          page: 26,
          blocks: [
            {
              type: "invoice",
              supplier: "Accenture",
              number: "ACC-1902",
              date: "28 Jun 2026",
              period: "1 May – 20 Jun 2026",
              description: "Integration planning — ERP cutover design and data-migration runbook.",
              amount: "AUD 420,000 inc. GST",
            },
          ],
        },
        {
          id: "inv-hsf-1",
          heading: "Invoice extract",
          page: 29,
          blocks: [
            {
              type: "invoice",
              supplier: "Herbert Smith Freehills",
              number: "HSF-7721",
              date: "11 May 2026",
              period: "1 Apr – 30 Apr 2026",
              description: "Warranty insurance placement and disclosure support.",
              amount: "AUD 86,000 inc. GST",
            },
          ],
        },
        {
          id: "inv-mer-1",
          heading: "Invoice extract",
          page: 31,
          blocks: [
            {
              type: "invoice",
              supplier: "Mercer",
              number: "MER-330",
              date: "3 Jun 2026",
              period: "May 2026",
              description: "Employee retention pool design for Northshore key persons.",
              amount: "AUD 95,000 inc. GST",
            },
          ],
        },
        {
          id: "inv-firb",
          heading: "Invoice extract",
          page: 33,
          blocks: [
            {
              type: "invoice",
              supplier: "FIRB counsel",
              number: "REG-118",
              date: "16 May 2026",
              period: "May 2026",
              description: "Regulatory filing — FIRB application and correspondence.",
              amount: "AUD 78,000 inc. GST",
            },
          ],
        },
        {
          id: "inv-aon",
          heading: "Invoice extract",
          page: 35,
          blocks: [
            {
              type: "invoice",
              supplier: "Aon",
              number: "AON-5520",
              date: "9 Apr 2026",
              period: "March 2026",
              description: "Insurance due diligence — W&I and operational gap review.",
              amount: "AUD 62,000 inc. GST",
            },
          ],
        },
      ],
    },
    "tx-guidance": {
      type: "guidance",
      title: "Transaction-cost tax guidance",
      icon: "landmark",
      meta: "Guidance · Internal working summary",
      pages: 16,
      sections: [
        {
          id: "character",
          code: "§1",
          heading: "Character of costs",
          page: 1,
          focus: true,
          mark: "purpose of the outlay and the asset or arrangement it relates to",
          paragraphs: [
            "Acquisition, financing, integration and disposal costs can have different tax treatments. The starting point is the purpose of the outlay and the asset or arrangement it relates to.",
          ],
        },
        {
          id: "acquisition",
          code: "§2",
          heading: "Acquisition costs",
          page: 3,
          paragraphs: [
            "Costs that are incurred to acquire the shares or assets generally follow a capital path unless a specific deduction applies. SPA, legal DD and valuation invoices in the Northshore pack are coded on that basis pending allocation.",
          ],
        },
        {
          id: "financing",
          code: "§3",
          heading: "Financing costs",
          page: 5,
          paragraphs: [
            "Facility fees, hedge execution costs and lender-counsel recovery sit with the funding package. Specific provisions may apply; they are not automatically treated as acquisition capital.",
          ],
        },
        {
          id: "integration",
          code: "§4",
          heading: "Integration and post-deal costs",
          page: 7,
          paragraphs: [
            "Day-1 cutover, retention design and rebrand work after 1 July 2026 is generally tested as post-deal expenditure. Capitalisation is only used where a recognised asset is being created.",
          ],
        },
        {
          id: "evidence",
          code: "§5",
          heading: "Evidence",
          page: 9,
          paragraphs: [
            "Invoices, engagement letters and allocation papers should identify the workstream, entity and whether the cost is capital or revenue in nature. Mixed invoices are split before a filing position is taken.",
          ],
        },
        {
          id: "duty",
          code: "§6",
          heading: "Stamp duty and mixed invoices",
          page: 11,
          paragraphs: [
            "Duty estimates and mixed legal invoices are the usual areas of uncertainty on an AUD 85 million share deal. Document the allocation before year-end.",
          ],
        },
        {
          id: "next",
          code: "§7",
          heading: "Recommended next steps",
          page: 14,
          paragraphs: [
            "Reconcile the ledger to the twelve-invoice pack, lock workstream codes, and obtain Tax sign-off on financing versus acquisition splits before completion accounts close.",
          ],
        },
      ],
    },
    "tc-structure": {
      type: "pdf",
      title: "Group structure chart",
      icon: "network",
      meta: "PDF · 12 pages · Horizon Group",
      pages: 12,
      docKicker: "Horizon Group · Tax consolidation pack",
      docTitle: "Group structure",
      sections: [
        {
          id: "overview",
          heading: "Group overview",
          page: 1,
          blocks: [
            {
              type: "p",
              text: "Horizon Group Pty Ltd is the head company of the Australian MEC group. Write BidCo Pty Ltd is the acquisition vehicle for Northshore. Foreign subsidiaries remain outside the Australian group.",
            },
          ],
        },
        {
          id: "head",
          heading: "Head company",
          page: 2,
          blocks: [
            {
              type: "p",
              text: "Horizon Group Pty Ltd (ABN 18 004 112 901) lodges the consolidated return and holds 100% of the Australian operating chain following the 2022 Northbridge buy-back.",
            },
          ],
        },
        {
          id: "au",
          heading: "Australian subsidiaries",
          page: 4,
          focus: true,
          mark: "Northshore Holdings Pty Ltd is proposed to join on 1 July 2026",
          blocks: [
            {
              type: "p",
              text: "Northshore Holdings Pty Ltd is proposed to join on 1 July 2026 together with Northshore Ops Pty Ltd and Northshore Property Pty Ltd.",
            },
            {
              type: "table",
              headers: ["Entity", "Ownership", "Jur.", "Proposed status"],
              rows: [
                ["Horizon Group Pty Ltd", "Head company", "AU", "Head company"],
                ["Horizon Finance Pty Ltd", "100%", "AU", "Existing member"],
                ["Horizon Treasury Pty Ltd", "100%", "AU", "Existing member"],
                ["Write BidCo Pty Ltd", "100%", "AU", "Existing vehicle"],
                ["Northshore Holdings Pty Ltd", "Proposed 100%", "AU", "Joining entity"],
                ["Northshore Ops Pty Ltd", "100% of Northshore", "AU", "Joining entity"],
                ["Northshore Property Pty Ltd", "100% of Northshore", "AU", "Joining entity"],
              ],
              highlightIndex: 4,
            },
          ],
        },
        {
          id: "foreign",
          heading: "Foreign subsidiaries",
          page: 6,
          blocks: [
            {
              type: "table",
              headers: ["Entity", "Ownership", "Jur.", "Status"],
              rows: [
                ["Horizon Singapore Pte Ltd", "100%", "SG", "Excluded — foreign"],
                ["Horizon UK Limited", "100%", "UK", "Excluded — foreign"],
                ["Horizon US Inc.", "100%", "US", "Excluded — foreign"],
              ],
            },
          ],
        },
        {
          id: "ownership",
          heading: "Ownership percentages",
          page: 7,
          blocks: [
            {
              type: "p",
              text: "All Australian members are wholly owned. No minority interests remain after 30 June 2022. Northshore will be wholly owned from completion.",
            },
          ],
        },
        {
          id: "joining",
          heading: "Proposed joining entities",
          page: 8,
          blocks: [
            {
              type: "p",
              text: "Joining entities are Northshore Holdings, Northshore Ops and Northshore Property. Write BidCo is already a member and is not a joining entity.",
            },
          ],
        },
        {
          id: "dates",
          heading: "Joining dates",
          page: 9,
          blocks: [
            {
              type: "p",
              text: "Proposed joining date is 1 July 2026, aligned to Horizon’s income year and the Northshore completion agenda.",
            },
          ],
        },
        {
          id: "excluded",
          heading: "Excluded entities",
          page: 11,
          blocks: [
            {
              type: "p",
              text: "Foreign subsidiaries and any entity that is not a wholly-owned Australian resident company are excluded. Horizon Dormant No. 4 Pty Ltd remains an existing dormant member.",
            },
          ],
        },
      ],
    },
    "tc-profile": {
      type: "spreadsheet",
      title: "Entity tax profile",
      icon: "sheet",
      meta: "XLSX · 18 entities · FY26",
      footer: "18 entities · 9 columns",
      cornerMeta: "18 entities",
      columns: ENTITY_COLUMNS,
      rows: ENTITY_ROWS,
      highlightId: "E-11",
    },
    "tc-joining": {
      type: "spreadsheet",
      title: "Joining calculations",
      icon: "table-2",
      meta: "XLSX · 34 asset categories · Draft ACA",
      footer: "34 asset categories · 6 columns",
      cornerMeta: "34 categories",
      columns: JOIN_COLUMNS,
      rows: JOIN_ROWS,
      highlightId: "J-14",
    },
    "tc-guidance": {
      type: "legislation",
      title: "Consolidation legislation & ATO guidance",
      icon: "landmark",
      meta: "Legislation · Current compilation",
      pages: 40,
      sections: [
        {
          id: "membership",
          code: "Div 703",
          heading: "Membership",
          page: 2,
          paragraphs: [
            "A joining entity must be a wholly-owned subsidiary of the head company, subject to specified exceptions and grouping rules. This note paraphrases the working tests only.",
          ],
        },
        {
          id: "joining",
          code: "Div 705",
          heading: "Joining event",
          page: 8,
          focus: true,
          mark: "tax cost setting applies to reset the tax values of resettable assets",
          paragraphs: [
            "On joining, tax cost setting applies to reset the tax values of resettable assets by reference to the allocable cost amount. Northshore’s proposed joining date of 1 July 2026 is the working fact in this file.",
          ],
        },
        {
          id: "aca",
          code: "705-60",
          heading: "Allocable cost amount",
          page: 14,
          paragraphs: [
            "ACA steps start from the cost of membership interests and adjust for liabilities, losses and other specified amounts. Draft numbers sit in the joining workbook.",
          ],
        },
        {
          id: "attributes",
          code: "Div 707",
          heading: "Inherited attributes",
          page: 22,
          paragraphs: [
            "Losses, franking and other attributes may be transferred, transferred with restrictions, or remain with the joining entity depending on the rules applied.",
          ],
        },
        {
          id: "elections",
          code: "Div 715 / elections",
          heading: "Elections and compliance",
          page: 30,
          paragraphs: [
            "Joining notices, choice timing and interaction with existing Horizon elections are recorded before implementation. Do not assume Northshore elections survive unmodified.",
          ],
        },
      ],
    },
    "tl-schedule": {
      type: "spreadsheet",
      title: "Tax loss schedule",
      icon: "sheet",
      meta: "XLSX · FY2018–FY2026 · Draft",
      footer: "FY2018–FY2026 · 8 columns",
      cornerMeta: "16 rows",
      columns: LOSS_COLUMNS,
      rows: LOSS_ROWS,
      highlightId: "L-22R",
    },
    "tl-ownership": {
      type: "spreadsheet",
      title: "Ownership history",
      icon: "table-2",
      meta: "XLSX · Continuity file",
      footer: "10 events · 5 columns",
      cornerMeta: "10 events",
      columns: OWN_COLUMNS,
      rows: OWN_ROWS,
      highlightId: "O-04",
    },
    "tl-activity": {
      type: "pdf",
      title: "Business activity summary",
      icon: "file-text",
      meta: "PDF · 31 pages · FY24–FY26",
      pages: 31,
      docKicker: "Horizon Group · Continuity pack",
      docTitle: "Business activity summary",
      sections: [
        {
          id: "exec",
          heading: "Executive overview",
          page: 1,
          blocks: [
            {
              type: "p",
              text: "Horizon Group finances group operations and manages treasury exposures for Australian and selected cross-border subsidiaries. The proposed 1 July 2026 Northshore acquisition is the only material structural change in the current draft facts.",
            },
          ],
        },
        {
          id: "model",
          heading: "Business model",
          page: 3,
          blocks: [
            {
              type: "p",
              text: "The group earns a margin on intra-group financing, recovers selected treasury support costs, and holds operating subsidiaries in logistics, digital and property services.",
            },
          ],
        },
        {
          id: "products",
          heading: "Products and services",
          page: 5,
          blocks: [
            {
              type: "p",
              text: "Core offerings are group funding, liquidity management, FX cover for forecast exposures, and shared finance services billed to operating entities.",
            },
          ],
        },
        {
          id: "customers",
          heading: "Customer segments",
          page: 7,
          blocks: [
            {
              type: "p",
              text: "Internal counterparties are Horizon operating entities. Limited third-party treasury support is provided to two long-standing Australian customers under existing MSAs.",
            },
          ],
        },
        {
          id: "revenue",
          heading: "Revenue streams",
          page: 9,
          focus: true,
          mark: "Interest and fee income from intra-group financing",
          blocks: [
            {
              type: "p",
              text: "Interest and fee income from intra-group financing remains the primary Australian revenue stream, plus limited third-party treasury support charges.",
            },
          ],
        },
        {
          id: "geo",
          heading: "Geographic operations",
          page: 11,
          blocks: [
            {
              type: "p",
              text: "Australia is the principal place of business. Singapore, the UK and the US hold overseas customer and treasury support functions and are not Australian group members.",
            },
          ],
        },
        {
          id: "employees",
          heading: "Employees",
          page: 13,
          blocks: [
            {
              type: "p",
              text: "FY26 headcount is 184 in Australia (including 11 in Group Treasury and Tax). Northshore would add approximately 96 employees from 1 July 2026.",
            },
          ],
        },
        {
          id: "assets",
          heading: "Assets",
          page: 15,
          blocks: [
            {
              type: "p",
              text: "Material Australian assets are intra-group loan books, treasury derivatives (including the AUD 85 million ANZ cross-currency swap), property held in Horizon Property Pty Ltd, and operating plant in Horizon Operations.",
            },
          ],
        },
        {
          id: "contracts",
          heading: "Key contracts",
          page: 17,
          blocks: [
            {
              type: "p",
              text: "Bank facility agreements, ISDA/CSA sets with approved counterparties, and two third-party treasury MSAs. Northshore customer contracts transfer by change-of-control consent.",
            },
          ],
        },
        {
          id: "tech",
          heading: "Technology platforms",
          page: 19,
          blocks: [
            {
              type: "p",
              text: "Horizon runs a single ERP and a treasury workstation. Northshore’s ledger is planned to migrate in the first 100 days after completion.",
            },
          ],
        },
        {
          id: "changes",
          heading: "Material business changes",
          page: 21,
          blocks: [
            {
              type: "p",
              text: "No cessation of the financing or treasury businesses is recorded. The Northbridge minority in 2021–22 did not change the business carried on.",
            },
          ],
        },
        {
          id: "mna",
          heading: "Acquisitions / disposals",
          page: 23,
          blocks: [
            {
              type: "p",
              text: "The only proposed acquisition in the current pack is Northshore Holdings for approximately AUD 85 million, completion targeted 1 July 2026.",
            },
          ],
        },
        {
          id: "fy24",
          heading: "FY2024 activities",
          page: 25,
          blocks: [
            {
              type: "p",
              text: "Refinanced the Westpac term loan, extended the MUFG revolver, and continued intra-group funding of Operations and International.",
            },
          ],
        },
        {
          id: "fy25",
          heading: "FY2025 activities",
          page: 27,
          blocks: [
            {
              type: "p",
              text: "Added the HSBC EUR cross-currency swap and expanded the forecast FX programme. No change to the Australian business mix.",
            },
          ],
        },
        {
          id: "fy26",
          heading: "FY2026 activities",
          page: 29,
          blocks: [
            {
              type: "p",
              text: "Prepare BidCo, Northshore diligence and the 1 July 2026 funding / hedge package. Continuity analysis treats the acquisition as an expansion of the existing group financing and operating model, not a new business.",
            },
          ],
        },
      ],
    },
    "tl-guidance": {
      type: "guidance",
      title: "Loss continuity guidance",
      icon: "landmark",
      meta: "Guidance · Internal working summary",
      pages: 14,
      sections: [
        {
          id: "cot",
          code: "Div 165",
          heading: "Continuity of ownership",
          page: 2,
          focus: true,
          mark: "more than 50% continuity of ownership",
          paragraphs: [
            "Companies generally need to maintain more than 50% continuity of ownership through the ownership test period to utilise prior-year losses. This is a working paraphrase, not official text.",
          ],
        },
        {
          id: "sbt",
          code: "Div 165",
          heading: "Business continuity",
          page: 6,
          paragraphs: [
            "Where ownership continuity is failed, the same-business or similar-business tests may still allow utilisation if the business has been carried on in the required way.",
          ],
        },
        {
          id: "horizon",
          code: "Application",
          heading: "Horizon working facts",
          page: 9,
          paragraphs: [
            "Horizon Group returned to 100% ownership on 30 June 2022 after the Northbridge buy-back. FY22 is the largest revenue-loss year in the schedule (closing AUD 11.35m that year).",
          ],
        },
        {
          id: "evidence",
          code: "Evidence",
          heading: "Evidence",
          page: 12,
          paragraphs: [
            "Ownership registers, constitution rights and a concise business-activity narrative are required before a utilisation position is finalised. The Northshore joining does not, by itself, change Horizon’s ownership of itself.",
          ],
        },
      ],
    },
    "generic-board": {
      type: "pdf",
      title: "Board paper",
      icon: "file-text",
      meta: "PDF · 8 pages · Horizon Group",
      pages: 8,
      docKicker: "Finance Committee",
      docTitle: "Treasury programme — 1 July 2026",
      sections: [
        {
          id: "rec",
          heading: "Recommendation",
          page: 1,
          focus: true,
          mark: "Indicative value of the primary cross-currency arrangement is AUD 85 million",
          blocks: [
            {
              type: "p",
              text: "Approve progression of the proposed financing and implementation work for the Horizon Group treasury programme from 1 July 2026.",
            },
            {
              type: "p",
              text: "Indicative value of the primary cross-currency arrangement is AUD 85 million. Tax, Finance and Technology are to confirm systems readiness before execution.",
            },
          ],
        },
        {
          id: "why",
          heading: "Why this paper",
          page: 3,
          blocks: [
            {
              type: "p",
              text: "The arrangement sits above the AUD 50 million debt and material-arrangement thresholds in the Treasury Risk Management Policy.",
            },
          ],
        },
        {
          id: "next",
          heading: "Next steps",
          page: 6,
          blocks: [
            {
              type: "p",
              text: "Collect the Financial Arrangements Register extract, Tax’s Division 230 note, and executed hedge documentation before the June Finance Committee.",
            },
          ],
        },
      ],
    },
    "generic-notes": {
      type: "pdf",
      title: "Working notes",
      icon: "files",
      meta: "Notes · Internal",
      pages: 6,
      docKicker: "Tax working file",
      docTitle: "TOFA classification — open items",
      sections: [
        {
          id: "open",
          heading: "Open questions",
          page: 1,
          focus: true,
          mark: "AUD/USD cross-currency arrangement",
          blocks: [
            {
              type: "p",
              text: "Confirm counterparties, cash-flow profile and whether a hedge designation will be made for the AUD/USD cross-currency arrangement.",
            },
          ],
        },
        {
          id: "next",
          heading: "Next steps",
          page: 3,
          blocks: [
            {
              type: "p",
              text: "Collect the financial arrangements register extract and Treasury policy sections on approved instruments before the classification memo is locked.",
            },
          ],
        },
        {
          id: "facts",
          heading: "Working facts",
          page: 5,
          blocks: [
            {
              type: "p",
              text: "Horizon Group · FA-001 · ANZ · AUD 85 million · effective 1 July 2026 · proposed cash-flow hedge.",
            },
          ],
        },
      ],
    },
    "generic-guidance": {
      type: "guidance",
      title: "Relevant tax guidance",
      icon: "landmark",
      meta: "Guidance · Internal working summary",
      pages: 5,
      sections: [
        {
          id: "use",
          code: "Use",
          heading: "Use in this draft",
          page: 1,
          focus: true,
          mark: "identify information gaps before recommendations are finalised",
          paragraphs: [
            "Apply the relevant Australian tax guidance to the selected arrangement, and identify information gaps before recommendations are finalised.",
          ],
        },
        {
          id: "evidence",
          code: "Evidence",
          heading: "Evidence",
          page: 3,
          paragraphs: [
            "Support material conclusions with the attached files and legislation extracts rather than general statements of principle.",
          ],
        },
      ],
    },
  };

  function get(sourceId) {
    var data = SOURCE_PREVIEW_DATA[sourceId];
    if (!data) return null;
    return {
      id: sourceId,
      type: data.type,
      title: data.title,
      icon: data.icon,
      meta: data.meta,
      kind: kindFromType(data.type),
      pages: data.pages || 0,
      footer: data.footer || "",
      showPager: !!data.pages && data.type !== "spreadsheet",
      cornerMeta: data.cornerMeta || "",
      html: renderPreview(data),
    };
  }

  global.WriteBuilderSourcePreviews = {
    get: get,
    has: function (id) {
      return !!SOURCE_PREVIEW_DATA[id];
    },
  };
})(window);
