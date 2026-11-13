/**
 * Approach point 2 — Human / AI responsibility preview.
 * Reuses the same geometry language as the workflow preview (rounded orthogonal edges, ports, phases).
 */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var VIEW_W = 560;
  var VIEW_H = 280;

  var NODE_W = 104;
  var NODE_H = 32;
  var NODE_W_SM = 88;
  var NODE_H_SM = 28;
  var NODE_R = 10;
  var NODE_R_SMALL = 7;
  var DIAMOND = 28;
  var EDGE_RADIUS = 10;
  var EDGE_RADIUS_MOBILE = 8;

  var NODE_ORDER = [
    "input",
    "analyse",
    "review",
    "draft",
    "decide",
    "approve",
    "outcome",
  ];

  /** Neutral shared chain — 8px grid, unclassified workflow */
  var INITIAL = {
    input: {
      id: "input",
      type: "step",
      role: "neutral",
      label: "Input",
      x: 32,
      y: 124,
      w: NODE_W_SM,
      h: NODE_H_SM,
    },
    analyse: {
      id: "analyse",
      type: "step",
      role: "ai",
      label: "Analyse",
      x: 136,
      y: 120,
      w: NODE_W,
      h: NODE_H,
    },
    review: {
      id: "review",
      type: "step",
      role: "human",
      label: "Review",
      x: 256,
      y: 120,
      w: NODE_W,
      h: NODE_H,
    },
    draft: {
      id: "draft",
      type: "step",
      role: "ai",
      label: "Draft",
      x: 376,
      y: 120,
      w: NODE_W,
      h: NODE_H,
    },
    decide: {
      id: "decide",
      type: "diamond",
      role: "human",
      label: "Decide",
      x: 504,
      y: 122,
      size: DIAMOND,
    },
    approve: {
      id: "approve",
      type: "step",
      role: "human",
      label: "Approve",
      x: 376,
      y: 184,
      w: NODE_W,
      h: NODE_H,
    },
    outcome: {
      id: "outcome",
      type: "step",
      role: "neutral",
      label: "Outcome",
      x: 376,
      y: 232,
      w: NODE_W,
      h: NODE_H_SM,
    },
  };

  /**
   * Final dual-lane layout.
   * AI lane top: Analyse, Draft
   * Human lane bottom: Review, Decide, Approve → Outcome
   * Zigzag handoffs: AI → Human → AI → Human → Outcome
   */
  var FINAL = {
    input: {
      id: "input",
      type: "step",
      role: "neutral",
      label: "Input",
      x: 228,
      y: 8,
      w: NODE_W_SM,
      h: NODE_H_SM,
    },
    analyse: {
      id: "analyse",
      type: "step",
      role: "ai",
      label: "Analyse",
      x: 72,
      y: 72,
      w: NODE_W,
      h: NODE_H,
    },
    draft: {
      id: "draft",
      type: "step",
      role: "ai",
      label: "Draft",
      x: 344,
      y: 72,
      w: NODE_W,
      h: NODE_H,
    },
    review: {
      id: "review",
      type: "step",
      role: "human",
      label: "Review",
      x: 72,
      y: 176,
      w: NODE_W,
      h: NODE_H,
      emphasis: true,
    },
    decide: {
      id: "decide",
      type: "diamond",
      role: "human",
      label: "Decide",
      x: 266,
      y: 178,
      size: DIAMOND,
      emphasis: true,
    },
    approve: {
      id: "approve",
      type: "step",
      role: "human",
      label: "Approve",
      x: 368,
      y: 176,
      w: NODE_W,
      h: NODE_H,
      emphasis: true,
    },
    outcome: {
      id: "outcome",
      type: "step",
      role: "neutral",
      label: "Outcome",
      x: 368,
      y: 232,
      w: NODE_W,
      h: NODE_H_SM,
    },
  };

  var LANES = {
    ai: { x: 40, y: 48, w: 480, h: 80, label: "AI", labelX: 52, labelY: 66 },
    human: {
      x: 40,
      y: 152,
      w: 480,
      h: 104,
      label: "Human",
      labelX: 52,
      labelY: 170,
    },
  };

  var INITIAL_EDGES = [
    {
      id: "e1",
      from: "input",
      fromPort: "right",
      to: "analyse",
      toPort: "left",
      style: "secondary",
    },
    {
      id: "e2",
      from: "analyse",
      fromPort: "right",
      to: "review",
      toPort: "left",
      style: "primary",
    },
    {
      id: "e3",
      from: "review",
      fromPort: "right",
      to: "draft",
      toPort: "left",
      style: "primary",
    },
    {
      id: "e4",
      from: "draft",
      fromPort: "right",
      to: "decide",
      toPort: "left",
      style: "primary",
    },
    {
      id: "e5",
      from: "decide",
      fromPort: "bottom",
      to: "approve",
      toPort: "top",
      style: "secondary",
    },
    {
      id: "e6",
      from: "approve",
      fromPort: "bottom",
      to: "outcome",
      toPort: "top",
      style: "secondary",
    },
  ];

  var FINAL_EDGES = [
    {
      id: "f1",
      from: "input",
      fromPort: "bottom",
      to: "analyse",
      toPort: "top",
      style: "primary",
    },
    {
      id: "f2",
      from: "analyse",
      fromPort: "bottom",
      to: "review",
      toPort: "top",
      style: "handoff",
    },
    {
      id: "f3",
      from: "review",
      fromPort: "right",
      to: "draft",
      toPort: "bottom",
      style: "handoff",
    },
    {
      id: "f4",
      from: "draft",
      fromPort: "bottom",
      to: "decide",
      toPort: "top",
      style: "handoff",
    },
    {
      id: "f5",
      from: "decide",
      fromPort: "right",
      to: "approve",
      toPort: "left",
      style: "primary",
    },
    {
      id: "f6",
      from: "approve",
      fromPort: "bottom",
      to: "outcome",
      toPort: "top",
      style: "approval",
    },
  ];

  var PHASES = [
    { name: "shared", caption: "Assess", duration: 1400 },
    { name: "assess", caption: "Assess", duration: 1400 },
    { name: "assign", caption: "Assign", duration: 1800 },
    { name: "handoff", caption: "Handoff", duration: 1600 },
    { name: "hold", caption: "Control", duration: 1200 },
    { name: "reset", caption: "Control", duration: 400 },
  ];

  var ASSESS_ORDER = [
    "input",
    "analyse",
    "review",
    "draft",
    "decide",
    "approve",
    "outcome",
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

  function buildNodeGroup(node) {
    var g = el("g", {
      class:
        "workflow-node rp-node rp-node--" +
        node.role +
        (node.emphasis ? " is-emphasis" : ""),
      "data-id": node.id,
      "data-type": node.type,
      "data-role": node.role,
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
          class: "wp-decision rp-decision",
          x: String(-side / 2),
          y: String(-side / 2),
          width: String(side),
          height: String(side),
          rx: String(NODE_R_SMALL),
          ry: String(NODE_R_SMALL),
        })
      );
      g.appendChild(spin);
    } else {
      var stepR = node.h <= 30 ? NODE_R_SMALL : NODE_R;
      g.appendChild(
        el("rect", {
          class: "wp-step rp-step",
          x: "0",
          y: "0",
          width: String(node.w),
          height: String(node.h),
          rx: String(stepR),
          ry: String(stepR),
        })
      );
      var label = el("text", {
        class: "rp-label",
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

  function HumanAIResponsibilityPreview(root) {
    this.root = root;
    this.caption = root.querySelector(".workflow-preview-caption");
    this.svg = null;
    this.lanesG = null;
    this.edgesInitialG = null;
    this.edgesFinalG = null;
    this.nodesG = null;
    this.handoffMarkersG = null;
    this.nodeEls = {};
    this.layout = cloneLayout(INITIAL);
    this.phaseIndex = 0;
    this.timer = null;
    this.assessTimer = null;
    this.visible = false;
    this.running = false;
    this.reduced = prefersReducedMotion();
  }

  HumanAIResponsibilityPreview.prototype.mount = function () {
    var existing = this.root.querySelector(".workflow-preview-svg");
    if (existing) existing.remove();

    var svg = el("svg", {
      class: "workflow-preview-svg",
      viewBox: "0 0 " + VIEW_W + " " + VIEW_H,
      "aria-hidden": "true",
      focusable: "false",
    });

    var lanes = el("g", { class: "rp-lanes" });
    ["ai", "human"].forEach(function (key) {
      var lane = LANES[key];
      var g = el("g", {
        class: "rp-lane rp-lane--" + key,
        "data-lane": key,
      });
      g.appendChild(
        el("rect", {
          class: "responsibility-lane",
          x: String(lane.x),
          y: String(lane.y),
          width: String(lane.w),
          height: String(lane.h),
          rx: "16",
          ry: "16",
        })
      );
      var label = el("text", {
        class: "rp-lane-label",
        x: String(lane.labelX),
        y: String(lane.labelY),
      });
      label.textContent = lane.label;
      g.appendChild(label);
      lanes.appendChild(g);
    });

    var edgesInitial = el("g", {
      class: "workflow-edges workflow-edges--initial",
    });
    var edgesFinal = el("g", {
      class: "workflow-edges workflow-edges--final",
    });
    var handoffMarkers = el("g", { class: "rp-handoff-markers" });
    var nodes = el("g", { class: "workflow-nodes" });

    INITIAL_EDGES.forEach(function (edge) {
      var path = buildEdgePath(edge, edgeD(INITIAL, edge));
      path.style.strokeDasharray = "160";
      path.style.strokeDashoffset = "160";
      edgesInitial.appendChild(path);
    });

    FINAL_EDGES.forEach(function (edge) {
      var path = buildEdgePath(edge, edgeD(FINAL, edge));
      path.style.strokeDasharray = "160";
      path.style.strokeDashoffset = "160";
      edgesFinal.appendChild(path);
    });

    var self = this;
    NODE_ORDER.forEach(function (id) {
      var group = buildNodeGroup(INITIAL[id]);
      nodes.appendChild(group);
      self.nodeEls[id] = group;
    });

    svg.appendChild(lanes);
    svg.appendChild(edgesInitial);
    svg.appendChild(edgesFinal);
    svg.appendChild(handoffMarkers);
    svg.appendChild(nodes);

    if (this.caption) {
      this.root.insertBefore(svg, this.caption);
    } else {
      this.root.appendChild(svg);
    }

    this.svg = svg;
    this.lanesG = lanes;
    this.edgesInitialG = edgesInitial;
    this.edgesFinalG = edgesFinal;
    this.handoffMarkersG = handoffMarkers;
    this.nodesG = nodes;

    Array.prototype.forEach.call(
      edgesInitial.querySelectorAll(".wp-line"),
      function (path) {
        var len = measurePath(path);
        path.style.strokeDasharray = String(len);
        path.style.strokeDashoffset = String(len);
        path.setAttribute("data-length", String(len));
      }
    );
    Array.prototype.forEach.call(
      edgesFinal.querySelectorAll(".wp-line"),
      function (path) {
        var len = measurePath(path);
        path.style.strokeDasharray = String(len);
        path.style.strokeDashoffset = String(len);
        path.setAttribute("data-length", String(len));

        var edgeId = path.getAttribute("data-edge");
        var spec = FINAL_EDGES.filter(function (e) {
          return e.id === edgeId;
        })[0];
        if (spec && spec.style === "handoff") {
          try {
            var mid = path.getPointAtLength(len / 2);
            handoffMarkers.appendChild(
              el("circle", {
                class: "rp-handoff-dot",
                cx: String(snap(mid.x)),
                cy: String(snap(mid.y)),
                r: "3",
                "data-for": edgeId,
              })
            );
          } catch (err) {
            /* ignore */
          }
        }
      }
    );
  };

  HumanAIResponsibilityPreview.prototype.setNodeLayout = function (
    layout,
    animate,
    revealRoles
  ) {
    var self = this;
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
      g.classList.toggle("is-emphasis", !!node.emphasis);
      g.classList.toggle("is-role-revealed", !!revealRoles);
      g.setAttribute("data-role", node.role);
    });
  };

  HumanAIResponsibilityPreview.prototype.setEdgesDrawn = function (
    group,
    drawn
  ) {
    var paths = group.querySelectorAll(".wp-line");
    Array.prototype.forEach.call(paths, function (path, i) {
      var len = path.getAttribute("data-length") || measurePath(path);
      path.style.strokeDasharray = String(len);
      if (drawn) {
        path.style.transitionDelay = i * 70 + "ms";
        path.style.strokeDashoffset = "0";
      } else {
        path.style.transitionDelay = "0ms";
        path.style.strokeDashoffset = String(len);
      }
    });
  };

  HumanAIResponsibilityPreview.prototype.clearAssessHighlight = function () {
    if (this.assessTimer) {
      window.clearTimeout(this.assessTimer);
      this.assessTimer = null;
    }
    NODE_ORDER.forEach(
      function (id) {
        var g = this.nodeEls[id];
        if (g) g.classList.remove("is-assessing");
      }.bind(this)
    );
  };

  HumanAIResponsibilityPreview.prototype.runAssessHighlight = function () {
    var self = this;
    this.clearAssessHighlight();
    var i = 0;
    var step = function () {
      NODE_ORDER.forEach(function (id) {
        var g = self.nodeEls[id];
        if (g) g.classList.remove("is-assessing");
      });
      if (i >= ASSESS_ORDER.length) return;
      var id = ASSESS_ORDER[i];
      var g = self.nodeEls[id];
      if (g) g.classList.add("is-assessing");
      i += 1;
      self.assessTimer = window.setTimeout(step, 180);
    };
    step();
  };

  HumanAIResponsibilityPreview.prototype.setPhase = function (index) {
    var phase = PHASES[index];
    if (!phase) return;
    this.phaseIndex = index;
    this.root.setAttribute("data-phase", phase.name);
    if (this.caption) this.caption.textContent = phase.caption;

    if (phase.name === "shared") {
      this.clearAssessHighlight();
      this.root.classList.remove("is-roles-active");
      this.setNodeLayout(cloneLayout(INITIAL), false, false);
      this.setEdgesDrawn(this.edgesInitialG, false);
      this.setEdgesDrawn(this.edgesFinalG, false);
      void this.root.offsetWidth;
      this.setNodeLayout(cloneLayout(INITIAL), true, false);
      var self = this;
      window.setTimeout(function () {
        if (self.phaseIndex === index && self.running) {
          self.setEdgesDrawn(self.edgesInitialG, true);
        }
      }, 280);
    }

    if (phase.name === "assess") {
      this.root.classList.add("is-roles-active");
      this.setNodeLayout(cloneLayout(INITIAL), true, false);
      this.setEdgesDrawn(this.edgesInitialG, true);
      this.runAssessHighlight();
    }

    if (phase.name === "assign") {
      this.clearAssessHighlight();
      this.root.classList.add("is-roles-active");
      this.setEdgesDrawn(this.edgesInitialG, false);
      this.setEdgesDrawn(this.edgesFinalG, false);
      this.setNodeLayout(cloneLayout(FINAL), true, true);
    }

    if (phase.name === "handoff") {
      this.root.classList.add("is-roles-active");
      this.setNodeLayout(cloneLayout(FINAL), true, true);
      this.setEdgesDrawn(this.edgesFinalG, true);
    }

    if (phase.name === "hold") {
      this.root.classList.add("is-roles-active");
      this.setNodeLayout(cloneLayout(FINAL), true, true);
      this.setEdgesDrawn(this.edgesFinalG, true);
    }

    if (phase.name === "reset") {
      this.root.classList.add("is-resetting");
    }
  };

  HumanAIResponsibilityPreview.prototype.showStaticFinal = function () {
    this.stop();
    this.clearAssessHighlight();
    this.root.classList.remove("is-resetting");
    this.root.classList.add("is-roles-active");
    this.root.setAttribute("data-reduced", "true");
    this.root.setAttribute("data-phase", "hold");
    this.setNodeLayout(cloneLayout(FINAL), false, true);
    this.setEdgesDrawn(this.edgesInitialG, false);
    this.setEdgesDrawn(this.edgesFinalG, true);
    Array.prototype.forEach.call(
      this.edgesFinalG.querySelectorAll(".wp-line"),
      function (path) {
        path.style.strokeDasharray = "none";
        path.style.strokeDashoffset = "0";
        path.style.transitionDelay = "0ms";
      }
    );
    if (this.caption) this.caption.textContent = "Control";
  };

  HumanAIResponsibilityPreview.prototype.stop = function () {
    this.running = false;
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    this.clearAssessHighlight();
  };

  HumanAIResponsibilityPreview.prototype.scheduleNext = function () {
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

  HumanAIResponsibilityPreview.prototype.start = function () {
    if (this.root.getAttribute("data-approach-active") === "false") return;
    if (this.reduced || this.running) return;
    if (document.visibilityState === "hidden" || !this.visible) return;
    this.running = true;
    this.root.removeAttribute("data-reduced");
    this.root.classList.remove("is-resetting");
    this.setPhase(0);
    this.scheduleNext();
  };

  HumanAIResponsibilityPreview.prototype.pause = function () {
    this.stop();
  };

  HumanAIResponsibilityPreview.prototype.bind = function () {
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
    document
      .querySelectorAll("[data-responsibility-preview]")
      .forEach(function (el) {
        new HumanAIResponsibilityPreview(el).bind();
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
