/**
 * Approach point 3 — Trust, evidence and recovery preview.
 * Same geometry language as the workflow / responsibility previews.
 */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var VIEW_W = 560;
  var VIEW_H = 280;

  var NODE_W = 112;
  var NODE_H = 32;
  var NODE_W_SM = 96;
  var NODE_H_SM = 28;
  var EVIDENCE_W = 96;
  var EVIDENCE_H = 60;
  var NODE_R = 10;
  var NODE_R_SMALL = 7;
  var EVIDENCE_R = 12;
  var DIAMOND = 28;
  var EDGE_RADIUS = 10;
  var EDGE_RADIUS_MOBILE = 8;
  var COL_X = 224;

  var NODE_ORDER = [
    "input",
    "ai",
    "evidence",
    "decide",
    "output",
    "recover",
  ];

  /** Compact happy-path before evidence expands */
  var INITIAL = {
    input: {
      id: "input",
      type: "step",
      label: "Input",
      x: COL_X,
      y: 48,
      w: NODE_W,
      h: NODE_H_SM,
    },
    ai: {
      id: "ai",
      type: "step",
      label: "Analyse",
      x: COL_X,
      y: 104,
      w: NODE_W,
      h: NODE_H,
      role: "ai",
    },
    evidence: {
      id: "evidence",
      type: "evidence",
      label: "Evidence",
      x: 232,
      y: 112,
      w: EVIDENCE_W,
      h: EVIDENCE_H,
      hidden: true,
    },
    decide: {
      id: "decide",
      type: "diamond",
      label: "Decide",
      x: 266,
      y: 176,
      size: DIAMOND,
      hidden: true,
    },
    output: {
      id: "output",
      type: "step",
      label: "Output",
      x: COL_X,
      y: 176,
      w: NODE_W,
      h: NODE_H_SM,
    },
    recover: {
      id: "recover",
      type: "step",
      label: "Recover",
      x: 400,
      y: 176,
      w: NODE_W_SM,
      h: NODE_H,
      secondary: true,
      hidden: true,
    },
  };

  /** Clarified trust layout — evidence inline, recovery as calm secondary path */
  var FINAL = {
    input: {
      id: "input",
      type: "step",
      label: "Input",
      x: COL_X,
      y: 8,
      w: NODE_W,
      h: NODE_H_SM,
    },
    ai: {
      id: "ai",
      type: "step",
      label: "Analyse",
      x: COL_X,
      y: 52,
      w: NODE_W,
      h: NODE_H,
      role: "ai",
    },
    evidence: {
      id: "evidence",
      type: "evidence",
      label: "Evidence",
      x: 232,
      y: 100,
      w: EVIDENCE_W,
      h: EVIDENCE_H,
    },
    decide: {
      id: "decide",
      type: "diamond",
      label: "Decide",
      x: 266,
      y: 180,
      size: DIAMOND,
      emphasis: true,
    },
    output: {
      id: "output",
      type: "step",
      label: "Output",
      x: COL_X,
      y: 232,
      w: NODE_W,
      h: NODE_H_SM,
    },
    recover: {
      id: "recover",
      type: "step",
      label: "Recover",
      x: 400,
      y: 176,
      w: NODE_W_SM,
      h: NODE_H,
      secondary: true,
    },
  };

  /** Warning badge sits near evidence (top-right), absolute coords */
  var WARNING = { x: 312, y: 92, r: 9 };

  var BUILD_EDGES = [
    {
      id: "b1",
      from: "input",
      fromPort: "bottom",
      to: "ai",
      toPort: "top",
      style: "primary",
    },
    {
      id: "b2",
      from: "ai",
      fromPort: "bottom",
      to: "output",
      toPort: "top",
      style: "primary",
    },
  ];

  var PRIMARY_EDGES = [
    {
      id: "p1",
      from: "input",
      fromPort: "bottom",
      to: "ai",
      toPort: "top",
      style: "primary",
    },
    {
      id: "p2",
      from: "ai",
      fromPort: "bottom",
      to: "evidence",
      toPort: "top",
      style: "primary",
    },
    {
      id: "p3",
      from: "evidence",
      fromPort: "bottom",
      to: "decide",
      toPort: "top",
      style: "primary",
    },
    {
      id: "p4",
      from: "decide",
      fromPort: "bottom",
      to: "output",
      toPort: "top",
      style: "primary",
    },
  ];

  var RECOVERY_EDGES = [
    {
      id: "r1",
      from: "evidence",
      fromPort: "right",
      to: "recover",
      toPort: "left",
      style: "recovery",
    },
    {
      id: "r2",
      from: "recover",
      fromPort: "bottom",
      to: "output",
      toPort: "right",
      style: "recovery",
    },
  ];

  var PHASES = [
    { name: "build", caption: "Explain", duration: 1200 },
    { name: "evidence", caption: "Explain", duration: 1300 },
    { name: "verify", caption: "Verify", duration: 1300 },
    { name: "exception", caption: "Recover", duration: 1200 },
    { name: "stable", caption: "Trust", duration: 1500 },
    { name: "hold", caption: "Trust", duration: 900 },
    { name: "reset", caption: "Trust", duration: 400 },
  ];

  function prefersReducedMotion() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function isMobile() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 600px)").matches
    );
  }

  function cloneLayout(layout) {
    var out = {};
    NODE_ORDER.forEach(function (id) {
      out[id] = Object.assign({}, layout[id]);
    });
    return out;
  }

  function portsFor(node) {
    if (node.type === "diamond") {
      var s = node.size;
      var cx = node.x + s / 2;
      var cy = node.y + s / 2;
      return {
        top: { x: cx, y: node.y },
        right: { x: node.x + s, y: cy },
        bottom: { x: cx, y: node.y + s },
        left: { x: node.x, y: cy },
      };
    }
    return {
      top: { x: node.x + node.w / 2, y: node.y },
      right: { x: node.x + node.w, y: node.y + node.h / 2 },
      bottom: { x: node.x + node.w / 2, y: node.y + node.h },
      left: { x: node.x, y: node.y + node.h / 2 },
    };
  }

  function snap(n) {
    return Math.round(n * 2) / 2;
  }

  function edgeCornerRadius() {
    return isMobile() ? EDGE_RADIUS_MOBILE : EDGE_RADIUS;
  }

  function dist2(a, b) {
    return Math.hypot(b[0] - a[0], b[1] - a[1]);
  }

  function orthogonalWaypoints(x1, y1, fromPort, x2, y2, toPort) {
    x1 = snap(x1);
    y1 = snap(y1);
    x2 = snap(x2);
    y2 = snap(y2);

    if (
      (fromPort === "bottom" && toPort === "top") ||
      (fromPort === "top" && toPort === "bottom")
    ) {
      if (Math.abs(x1 - x2) < 0.5) return [[x1, y1], [x2, y2]];
      var midY = snap((y1 + y2) / 2);
      return [[x1, y1], [x1, midY], [x2, midY], [x2, y2]];
    }

    if (
      (fromPort === "right" && toPort === "left") ||
      (fromPort === "left" && toPort === "right")
    ) {
      if (Math.abs(y1 - y2) < 0.5) return [[x1, y1], [x2, y2]];
      var midX = snap((x1 + x2) / 2);
      return [[x1, y1], [midX, y1], [midX, y2], [x2, y2]];
    }

    if (
      (fromPort === "left" || fromPort === "right") &&
      toPort === "top"
    ) {
      return [[x1, y1], [x2, y1], [x2, y2]];
    }

    if (
      (fromPort === "left" || fromPort === "right") &&
      toPort === "bottom"
    ) {
      return [[x1, y1], [x2, y1], [x2, y2]];
    }

    if (
      (fromPort === "bottom" || fromPort === "top") &&
      (toPort === "left" || toPort === "right")
    ) {
      return [[x1, y1], [x1, y2], [x2, y2]];
    }

    return [[x1, y1], [x1, y2], [x2, y2]];
  }

  function roundedPathFromWaypoints(points, preferredRadius) {
    if (points.length < 2) return "";
    if (points.length === 2) {
      return (
        "M" +
        points[0][0] +
        " " +
        points[0][1] +
        " L" +
        points[1][0] +
        " " +
        points[1][1]
      );
    }

    var d = "M" + points[0][0] + " " + points[0][1];
    for (var i = 1; i < points.length - 1; i++) {
      var prev = points[i - 1];
      var corner = points[i];
      var next = points[i + 1];
      var r = Math.min(
        preferredRadius,
        dist2(prev, corner) / 2,
        dist2(corner, next) / 2
      );
      if (r < 0.5) {
        d += " L" + corner[0] + " " + corner[1];
        continue;
      }
      var len1 = dist2(prev, corner) || 1;
      var len2 = dist2(corner, next) || 1;
      var ax = snap(corner[0] - ((corner[0] - prev[0]) / len1) * r);
      var ay = snap(corner[1] - ((corner[1] - prev[1]) / len1) * r);
      var bx = snap(corner[0] + ((next[0] - corner[0]) / len2) * r);
      var by = snap(corner[1] + ((next[1] - corner[1]) / len2) * r);
      d +=
        " L" +
        ax +
        " " +
        ay +
        " Q" +
        corner[0] +
        " " +
        corner[1] +
        " " +
        bx +
        " " +
        by;
    }
    var last = points[points.length - 1];
    d += " L" + last[0] + " " + last[1];
    return d;
  }

  function edgeD(layout, edge) {
    var fromNode = layout[edge.from];
    var toNode = layout[edge.to];
    var a = portsFor(fromNode)[edge.fromPort];
    var b = portsFor(toNode)[edge.toPort];
    var pts = orthogonalWaypoints(
      a.x,
      a.y,
      edge.fromPort,
      b.x,
      b.y,
      edge.toPort
    );
    return roundedPathFromWaypoints(pts, edgeCornerRadius());
  }

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        node.setAttribute(k, attrs[k]);
      });
    }
    return node;
  }

  function buildEvidenceCard(node) {
    var g = el("g", { class: "tp-evidence-inner" });
    var pad = 10;
    var lineW = node.w - pad * 2;
    var barY = node.h - 16;
    g.appendChild(
      el("rect", {
        class: "tp-evidence-card",
        x: "0",
        y: "0",
        width: String(node.w),
        height: String(node.h),
        rx: String(EVIDENCE_R),
        ry: String(EVIDENCE_R),
      })
    );

    // Abstract source / reasoning lines
    [
      [pad, 12, lineW * 0.72],
      [pad, 22, lineW * 0.55],
      [pad, 32, lineW * 0.66],
    ].forEach(function (line) {
      g.appendChild(
        el("rect", {
          class: "tp-evidence-line",
          x: String(line[0]),
          y: String(line[1]),
          width: String(line[2]),
          height: "3",
          rx: "1.5",
          ry: "1.5",
        })
      );
    });

    // Confidence bar
    g.appendChild(
      el("rect", {
        class: "tp-confidence-track",
        x: String(pad),
        y: String(barY),
        width: String(lineW),
        height: "6",
        rx: "3",
        ry: "3",
      })
    );
    g.appendChild(
      el("rect", {
        class: "tp-confidence-fill",
        x: String(pad),
        y: String(barY),
        width: String(lineW * 0.62),
        height: "6",
        rx: "3",
        ry: "3",
      })
    );

    return g;
  }

  function buildNodeGroup(node) {
    var g = el("g", {
      class:
        "workflow-node tp-node" +
        (node.secondary ? " is-secondary" : "") +
        (node.hidden ? " is-hidden" : "") +
        (node.role === "ai" ? " tp-node--ai" : "") +
        (node.type === "evidence" ? " tp-node--evidence" : ""),
      "data-id": node.id,
      "data-type": node.type,
    });

    if (node.type === "diamond") {
      var bounds = node.size;
      var side = bounds / Math.SQRT2;
      var half = bounds / 2;
      var spin = el("g", {
        class: "wp-decision-spin",
        transform: "translate(" + half + " " + half + ") rotate(45)",
      });
      spin.appendChild(
        el("rect", {
          class: "wp-decision tp-decision",
          x: String(-side / 2),
          y: String(-side / 2),
          width: String(side),
          height: String(side),
          rx: String(NODE_R_SMALL),
          ry: String(NODE_R_SMALL),
        })
      );
      g.appendChild(spin);
    } else if (node.type === "evidence") {
      g.appendChild(buildEvidenceCard(node));
    } else {
      var stepR = node.h <= 30 ? NODE_R_SMALL : NODE_R;
      g.appendChild(
        el("rect", {
          class: "wp-step tp-step",
          x: "0",
          y: "0",
          width: String(node.w),
          height: String(node.h),
          rx: String(stepR),
          ry: String(stepR),
        })
      );
      var label = el("text", {
        class: "tp-label",
        x: String(node.w / 2),
        y: String(node.h / 2 + 0.5),
        "text-anchor": "middle",
        "dominant-baseline": "middle",
      });
      label.textContent = node.label || "";
      g.appendChild(label);
    }

    g.setAttribute("transform", "translate(" + node.x + " " + node.y + ")");
    return g;
  }

  function buildEdgePath(edge, d) {
    return el("path", {
      class: "wp-line wp-line--" + edge.style,
      id: edge.id,
      d: d,
      "data-edge": edge.id,
      fill: "none",
    });
  }

  function measurePath(path) {
    try {
      return path.getTotalLength();
    } catch (err) {
      return 120;
    }
  }

  function TrustEvidencePreview(root) {
    this.root = root;
    this.caption = root.querySelector(".workflow-preview-caption");
    this.svg = null;
    this.edgesBuildG = null;
    this.edgesPrimaryG = null;
    this.edgesRecoveryG = null;
    this.nodesG = null;
    this.warningG = null;
    this.confidenceFill = null;
    this.confidenceFullWidth = 46;
    this.nodeEls = {};
    this.layout = cloneLayout(INITIAL);
    this.phaseIndex = 0;
    this.timer = null;
    this.visible = false;
    this.running = false;
    this.reduced = prefersReducedMotion();
  }

  TrustEvidencePreview.prototype.applyViewportSizes = function () {
    var ew = isMobile() ? 80 : EVIDENCE_W;
    var eh = isMobile() ? 54 : EVIDENCE_H;
    var ex = snap(COL_X + (NODE_W - ew) / 2);
    INITIAL.evidence.w = ew;
    INITIAL.evidence.h = eh;
    INITIAL.evidence.x = ex;
    FINAL.evidence.w = ew;
    FINAL.evidence.h = eh;
    FINAL.evidence.x = ex;
    WARNING.x = ex + ew - 8;
    WARNING.y = FINAL.evidence.y - 8;
  };

  TrustEvidencePreview.prototype.mount = function () {
    var existing = this.root.querySelector(".workflow-preview-svg");
    if (existing) existing.remove();

    this.applyViewportSizes();

    var svg = el("svg", {
      class: "workflow-preview-svg",
      viewBox: "0 0 " + VIEW_W + " " + VIEW_H,
      "aria-hidden": "true",
      focusable: "false",
    });

    var edgesBuild = el("g", {
      class: "workflow-edges workflow-edges--build",
    });
    var edgesPrimary = el("g", {
      class: "workflow-edges workflow-edges--primary",
    });
    var edgesRecovery = el("g", {
      class: "workflow-edges workflow-edges--recovery",
    });
    var nodes = el("g", { class: "workflow-nodes" });
    var warning = el("g", {
      class: "tp-warning",
      transform: "translate(" + WARNING.x + " " + WARNING.y + ")",
    });
    warning.appendChild(
      el("circle", {
        class: "tp-warning-badge",
        cx: String(WARNING.r),
        cy: String(WARNING.r),
        r: String(WARNING.r),
      })
    );
    var bang = el("text", {
      class: "tp-warning-mark",
      x: String(WARNING.r),
      y: String(WARNING.r + 0.5),
      "text-anchor": "middle",
      "dominant-baseline": "middle",
    });
    bang.textContent = "!";
    warning.appendChild(bang);

    BUILD_EDGES.forEach(function (edge) {
      var path = buildEdgePath(edge, edgeD(INITIAL, edge));
      path.style.strokeDasharray = "160";
      path.style.strokeDashoffset = "160";
      edgesBuild.appendChild(path);
    });

    PRIMARY_EDGES.forEach(function (edge) {
      var path = buildEdgePath(edge, edgeD(FINAL, edge));
      path.style.strokeDasharray = "160";
      path.style.strokeDashoffset = "160";
      edgesPrimary.appendChild(path);
    });

    RECOVERY_EDGES.forEach(function (edge) {
      var path = buildEdgePath(edge, edgeD(FINAL, edge));
      path.style.strokeDasharray = "160";
      path.style.strokeDashoffset = "160";
      edgesRecovery.appendChild(path);
    });

    var self = this;
    NODE_ORDER.forEach(function (id) {
      var group = buildNodeGroup(INITIAL[id]);
      nodes.appendChild(group);
      self.nodeEls[id] = group;
    });

    svg.appendChild(edgesBuild);
    svg.appendChild(edgesPrimary);
    svg.appendChild(edgesRecovery);
    svg.appendChild(nodes);
    svg.appendChild(warning);

    if (this.caption) {
      this.root.insertBefore(svg, this.caption);
    } else {
      this.root.appendChild(svg);
    }

    this.svg = svg;
    this.edgesBuildG = edgesBuild;
    this.edgesPrimaryG = edgesPrimary;
    this.edgesRecoveryG = edgesRecovery;
    this.nodesG = nodes;
    this.warningG = warning;
    this.confidenceFill = nodes.querySelector(".tp-confidence-fill");
    if (this.confidenceFill) {
      this.confidenceFullWidth = parseFloat(
        this.confidenceFill.getAttribute("width")
      );
    }

    [edgesBuild, edgesPrimary, edgesRecovery].forEach(function (group) {
      Array.prototype.forEach.call(group.querySelectorAll(".wp-line"), function (
        path
      ) {
        var len = measurePath(path);
        path.style.strokeDasharray = String(len);
        path.style.strokeDashoffset = String(len);
        path.setAttribute("data-length", String(len));
      });
    });
  };

  TrustEvidencePreview.prototype.setNodeLayout = function (
    layout,
    animate,
    options
  ) {
    var self = this;
    options = options || {};
    this.layout = layout;
    NODE_ORDER.forEach(function (id, i) {
      var node = layout[id];
      var g = self.nodeEls[id];
      if (!g) return;
      if (!animate) {
        g.style.transition = "none";
      } else {
        g.style.transition =
          "transform 900ms cubic-bezier(0.22, 1, 0.36, 1) " +
          i * 40 +
          "ms, opacity 400ms ease";
      }
      g.setAttribute("transform", "translate(" + node.x + " " + node.y + ")");
      g.classList.toggle("is-secondary", !!node.secondary);
      g.classList.toggle("is-emphasis", !!node.emphasis);

      var forceHidden = options.hidden && options.hidden[id];
      var forceVisible = options.visible && options.visible[id];
      if (forceHidden) g.classList.add("is-hidden");
      else if (forceVisible) g.classList.remove("is-hidden");
      else g.classList.toggle("is-hidden", !!node.hidden);
    });
  };

  TrustEvidencePreview.prototype.setEdgesDrawn = function (group, drawn) {
    var paths = group.querySelectorAll(".wp-line");
    Array.prototype.forEach.call(paths, function (path, i) {
      var len = path.getAttribute("data-length") || measurePath(path);
      path.style.strokeDasharray = String(len);
      if (drawn) {
        path.style.transitionDelay = i * 80 + "ms";
        path.style.strokeDashoffset = "0";
      } else {
        path.style.transitionDelay = "0ms";
        path.style.strokeDashoffset = String(len);
      }
    });
  };

  TrustEvidencePreview.prototype.setConfidenceLow = function (low) {
    if (!this.confidenceFill) return;
    var full = this.confidenceFullWidth || 46;
    this.confidenceFill.setAttribute(
      "width",
      String(low ? Math.max(18, full * 0.38) : full)
    );
    this.confidenceFill.classList.toggle("is-low", !!low);
  };

  TrustEvidencePreview.prototype.setPhase = function (index) {
    var phase = PHASES[index];
    if (!phase) return;
    this.phaseIndex = index;
    this.root.setAttribute("data-phase", phase.name);
    if (this.caption) this.caption.textContent = phase.caption;

    if (phase.name === "build") {
      this.root.classList.remove("is-warning", "is-recovery-strong");
      this.setConfidenceLow(false);
      this.setNodeLayout(cloneLayout(INITIAL), false, {
        hidden: {
          evidence: true,
          decide: true,
          recover: true,
        },
        visible: {
          input: true,
          ai: true,
          output: true,
        },
      });
      this.setEdgesDrawn(this.edgesBuildG, false);
      this.setEdgesDrawn(this.edgesPrimaryG, false);
      this.setEdgesDrawn(this.edgesRecoveryG, false);
      void this.root.offsetWidth;
      this.setNodeLayout(cloneLayout(INITIAL), true, {
        hidden: {
          evidence: true,
          decide: true,
          recover: true,
        },
      });
      var self = this;
      window.setTimeout(function () {
        if (self.phaseIndex === index && self.running) {
          self.setEdgesDrawn(self.edgesBuildG, true);
        }
      }, 220);
    }

    if (phase.name === "evidence") {
      this.root.classList.remove("is-warning", "is-recovery-strong");
      this.setConfidenceLow(false);
      this.setEdgesDrawn(this.edgesBuildG, false);
      this.setNodeLayout(cloneLayout(FINAL), true, {
        hidden: {
          decide: true,
          recover: true,
        },
        visible: {
          evidence: true,
          input: true,
          ai: true,
          output: true,
        },
      });
    }

    if (phase.name === "verify") {
      this.root.classList.remove("is-warning", "is-recovery-strong");
      this.setConfidenceLow(false);
      this.setNodeLayout(cloneLayout(FINAL), true, {
        hidden: { recover: true },
        visible: {
          evidence: true,
          decide: true,
          input: true,
          ai: true,
          output: true,
        },
      });
      this.setEdgesDrawn(this.edgesPrimaryG, true);
    }

    if (phase.name === "exception") {
      this.root.classList.add("is-warning", "is-recovery-strong");
      this.setConfidenceLow(true);
      this.setNodeLayout(cloneLayout(FINAL), true, {
        visible: {
          evidence: true,
          decide: true,
          recover: true,
          input: true,
          ai: true,
          output: true,
        },
      });
      this.setEdgesDrawn(this.edgesPrimaryG, true);
      this.setEdgesDrawn(this.edgesRecoveryG, true);
    }

    if (phase.name === "stable" || phase.name === "hold") {
      this.root.classList.remove("is-warning");
      this.root.classList.remove("is-recovery-strong");
      this.setConfidenceLow(false);
      this.setNodeLayout(cloneLayout(FINAL), true, {
        visible: {
          evidence: true,
          decide: true,
          recover: true,
          input: true,
          ai: true,
          output: true,
        },
      });
      this.setEdgesDrawn(this.edgesPrimaryG, true);
      this.setEdgesDrawn(this.edgesRecoveryG, true);
    }

    if (phase.name === "reset") {
      this.root.classList.add("is-resetting");
    }
  };

  TrustEvidencePreview.prototype.showStaticFinal = function () {
    this.stop();
    this.root.classList.remove("is-resetting", "is-warning", "is-recovery-strong");
    this.root.setAttribute("data-reduced", "true");
    this.root.setAttribute("data-phase", "hold");
    this.setConfidenceLow(false);
    this.setNodeLayout(cloneLayout(FINAL), false, {
      visible: {
        evidence: true,
        decide: true,
        recover: true,
        input: true,
        ai: true,
        output: true,
      },
    });
    this.setEdgesDrawn(this.edgesBuildG, false);
    this.setEdgesDrawn(this.edgesPrimaryG, true);
    this.setEdgesDrawn(this.edgesRecoveryG, true);
    Array.prototype.forEach.call(
      this.root.querySelectorAll(
        ".workflow-edges--primary .wp-line, .workflow-edges--recovery .wp-line"
      ),
      function (path) {
        path.style.strokeDasharray = "none";
        path.style.strokeDashoffset = "0";
        path.style.transitionDelay = "0ms";
      }
    );
    if (this.caption) this.caption.textContent = "Trust";
  };

  TrustEvidencePreview.prototype.stop = function () {
    this.running = false;
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  };

  TrustEvidencePreview.prototype.scheduleNext = function () {
    var self = this;
    if (!this.running) return;
    var phase = PHASES[this.phaseIndex];
    this.timer = window.setTimeout(function () {
      if (!self.running) return;
      var next = self.phaseIndex + 1;
      if (next >= PHASES.length) {
        self.root.classList.add("is-resetting");
        self.setPhase(0);
        window.setTimeout(function () {
          self.root.classList.remove("is-resetting");
        }, 120);
      } else {
        if (phase.name === "reset") {
          self.root.classList.remove("is-resetting");
        }
        self.setPhase(next);
      }
      self.scheduleNext();
    }, phase.duration);
  };

  TrustEvidencePreview.prototype.start = function () {
    if (this.root.getAttribute("data-approach-active") === "false") return;
    if (this.reduced || this.running) return;
    if (document.visibilityState === "hidden" || !this.visible) return;
    this.running = true;
    this.root.removeAttribute("data-reduced");
    this.root.classList.remove("is-resetting");
    this.setPhase(0);
    this.scheduleNext();
  };

  TrustEvidencePreview.prototype.pause = function () {
    this.stop();
  };

  TrustEvidencePreview.prototype.bind = function () {
    var self = this;
    this.mount();

    if (this.reduced) {
      this.showStaticFinal();
      return;
    }


    // Approach scrollytelling: only run when marked active
    this.root.addEventListener("approach:activate", function () {
      self.visible = true;
      if (self.reduced) {
        if (typeof self.showStaticFinal === "function") self.showStaticFinal();
      } else {
        self.start();
      }
    });
    this.root.addEventListener("approach:deactivate", function () {
      self.visible = false;
      self.pause();
    });
    if (this.root.getAttribute("data-approach-active") === "false") {
      this.visible = false;
    }


    this.setPhase(0);

    if (typeof IntersectionObserver === "function") {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            var allowed = self.root.getAttribute("data-approach-active") !== "false";
            self.visible =
              allowed &&
              entry.isIntersecting &&
              entry.intersectionRatio > 0.2;
            if (self.visible) self.start();
            else self.pause();
          });
        },
        { threshold: [0, 0.2, 0.5] }
      );
      io.observe(this.root);
    } else if (this.root.getAttribute("data-approach-active") !== "false") {
      this.visible = true;
      this.start();
    }

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") self.pause();
      else if (
        self.visible &&
        self.root.getAttribute("data-approach-active") !== "false"
      ) {
        self.start();
      }
    });

    if (typeof window.matchMedia === "function") {
      var mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      var onChange = function () {
        self.reduced = mq.matches;
        if (self.reduced) self.showStaticFinal();
        else if (self.visible) {
          self.mount();
          self.start();
        }
      };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  };

  function initAll() {
    document.querySelectorAll("[data-trust-preview]").forEach(function (el) {
      new TrustEvidencePreview(el).bind();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
