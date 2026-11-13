/**
 * Approach point 4 — Prototype high-risk interactions.
 * Same geometry language as the other Approach previews.
 */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var VIEW_W = 560;
  var VIEW_H = 280;

  var NODE_W = 112;
  var NODE_H = 32;
  var NODE_H_SM = 28;
  var NODE_R = 10;
  var NODE_R_SMALL = 7;
  var DIAMOND = 28;
  var EDGE_RADIUS = 10;
  var EDGE_RADIUS_MOBILE = 8;
  var CARD_W = 216;
  var CARD_H = 44;
  var CARD_W_MOBILE = 152;
  var CARD_H_MOBILE = 36;

  var NODE_ORDER = ["action", "ai", "decide", "review", "outcome"];
  var STATE_ORDER = ["success", "uncertain", "recovery"];

  /** Centred observe layout — simple vertical workflow */
  var INITIAL = {
    action: {
      id: "action",
      type: "step",
      label: "Action",
      x: 224,
      y: 24,
      w: NODE_W,
      h: NODE_H_SM,
    },
    ai: {
      id: "ai",
      type: "step",
      label: "Respond",
      x: 224,
      y: 80,
      w: NODE_W,
      h: NODE_H,
    },
    decide: {
      id: "decide",
      type: "diamond",
      label: "Decide",
      x: 266,
      y: 136,
      size: DIAMOND,
      risk: true,
    },
    review: {
      id: "review",
      type: "step",
      label: "Review",
      x: 224,
      y: 184,
      w: NODE_W,
      h: NODE_H,
    },
    outcome: {
      id: "outcome",
      type: "step",
      label: "Outcome",
      x: 224,
      y: 240,
      w: NODE_W,
      h: NODE_H_SM,
    },
  };

  /** Desktop refined layout — workflow left, prototype right */
  var FINAL_DESKTOP = {
    action: {
      id: "action",
      type: "step",
      label: "Action",
      x: 40,
      y: 16,
      w: NODE_W,
      h: NODE_H_SM,
    },
    ai: {
      id: "ai",
      type: "step",
      label: "Respond",
      x: 40,
      y: 64,
      w: NODE_W,
      h: NODE_H,
    },
    decide: {
      id: "decide",
      type: "diamond",
      label: "Decide",
      x: 82,
      y: 120,
      size: DIAMOND,
      risk: true,
      refined: true,
    },
    review: {
      id: "review",
      type: "step",
      label: "Review",
      x: 40,
      y: 172,
      w: NODE_W,
      h: NODE_H,
    },
    outcome: {
      id: "outcome",
      type: "step",
      label: "Outcome",
      x: 40,
      y: 232,
      w: NODE_W,
      h: NODE_H_SM,
    },
  };

  /** Mobile refined layout — workflow top, prototype below */
  var FINAL_MOBILE = {
    action: {
      id: "action",
      type: "step",
      label: "Action",
      x: 40,
      y: 8,
      w: 96,
      h: 24,
    },
    ai: {
      id: "ai",
      type: "step",
      label: "Respond",
      x: 152,
      y: 8,
      w: 96,
      h: 24,
    },
    decide: {
      id: "decide",
      type: "diamond",
      label: "Decide",
      x: 266,
      y: 10,
      size: 24,
      risk: true,
      refined: true,
    },
    review: {
      id: "review",
      type: "step",
      label: "Review",
      x: 312,
      y: 8,
      w: 96,
      h: 24,
    },
    outcome: {
      id: "outcome",
      type: "step",
      label: "Outcome",
      x: 424,
      y: 8,
      w: 96,
      h: 24,
    },
  };

  var PROTO_DESKTOP = {
    x: 288,
    y: 40,
    w: 248,
    h: 208,
    labelX: 304,
    labelY: 60,
    cards: {
      success: { id: "success", label: "Success", x: 304, y: 76, w: CARD_W, h: CARD_H },
      uncertain: {
        id: "uncertain",
        label: "Uncertain",
        x: 304,
        y: 132,
        w: CARD_W,
        h: CARD_H,
      },
      recovery: {
        id: "recovery",
        label: "Recovery",
        x: 304,
        y: 188,
        w: CARD_W,
        h: CARD_H,
      },
    },
  };

  var PROTO_MOBILE = {
    x: 40,
    y: 56,
    w: 480,
    h: 200,
    labelX: 56,
    labelY: 76,
    cards: {
      success: {
        id: "success",
        label: "Success",
        x: 56,
        y: 88,
        w: 448,
        h: CARD_H_MOBILE,
      },
      uncertain: {
        id: "uncertain",
        label: "Uncertain",
        x: 56,
        y: 136,
        w: 448,
        h: CARD_H_MOBILE,
      },
      recovery: {
        id: "recovery",
        label: "Recovery",
        x: 56,
        y: 184,
        w: 448,
        h: CARD_H_MOBILE,
      },
    },
  };

  var MAIN_EDGES = [
    {
      id: "m1",
      from: "action",
      fromPort: "bottom",
      to: "ai",
      toPort: "top",
      style: "primary",
    },
    {
      id: "m2",
      from: "ai",
      fromPort: "bottom",
      to: "decide",
      toPort: "top",
      style: "primary",
    },
    {
      id: "m3",
      from: "decide",
      fromPort: "bottom",
      to: "review",
      toPort: "top",
      style: "primary",
    },
    {
      id: "m4",
      from: "review",
      fromPort: "bottom",
      to: "outcome",
      toPort: "top",
      style: "primary",
    },
    {
      id: "m5",
      from: "decide",
      fromPort: "right",
      to: "outcome",
      toPort: "right",
      style: "secondary",
    },
  ];

  var MAIN_EDGES_MOBILE = [
    {
      id: "m1",
      from: "action",
      fromPort: "right",
      to: "ai",
      toPort: "left",
      style: "primary",
    },
    {
      id: "m2",
      from: "ai",
      fromPort: "right",
      to: "decide",
      toPort: "left",
      style: "primary",
    },
    {
      id: "m3",
      from: "decide",
      fromPort: "right",
      to: "review",
      toPort: "left",
      style: "primary",
    },
    {
      id: "m4",
      from: "review",
      fromPort: "right",
      to: "outcome",
      toPort: "left",
      style: "primary",
    },
  ];

  var PHASES = [
    { name: "observe", caption: "Identify", duration: 1300 },
    { name: "identify", caption: "Identify", duration: 1300 },
    { name: "isolate", caption: "Isolate", duration: 1600 },
    { name: "test", caption: "Test", duration: 1600 },
    { name: "refine", caption: "Refine", duration: 1000 },
    { name: "hold", caption: "Refine", duration: 800 },
    { name: "reset", caption: "Refine", duration: 400 },
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

  function finalLayout() {
    return cloneLayout(isMobile() ? FINAL_MOBILE : FINAL_DESKTOP);
  }

  function protoConfig() {
    return isMobile() ? PROTO_MOBILE : PROTO_DESKTOP;
  }

  function mainEdgesForMode(mode) {
    if (mode === "final" && isMobile()) return MAIN_EDGES_MOBILE;
    return MAIN_EDGES;
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

    // Same-side ports (e.g. right → right secondary recovery)
    if (fromPort === toPort && (fromPort === "right" || fromPort === "left")) {
      var outerX =
        fromPort === "right"
          ? snap(Math.max(x1, x2) + 24)
          : snap(Math.min(x1, x2) - 24);
      return [[x1, y1], [outerX, y1], [outerX, y2], [x2, y2]];
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

  function buildStateCard(card) {
    var g = el("g", {
      class: "pp-state-card pp-state-card--" + card.id,
      "data-state": card.id,
      transform: "translate(" + card.x + " " + card.y + ")",
    });

    g.appendChild(
      el("rect", {
        class: "pp-state-rect",
        x: "0",
        y: "0",
        width: String(card.w),
        height: String(card.h),
        rx: String(NODE_R),
        ry: String(NODE_R),
      })
    );

    var label = el("text", {
      class: "pp-state-label",
      x: "14",
      y: String(card.h / 2 + 0.5),
      "dominant-baseline": "middle",
    });
    label.textContent = card.label;
    g.appendChild(label);

    var pattern = el("g", {
      class: "pp-state-pattern",
      transform: "translate(" + (card.w - 78) + " " + (card.h / 2 - 8) + ")",
    });

    if (card.id === "success") {
      pattern.appendChild(
        el("rect", {
          class: "pp-skel",
          x: "0",
          y: "0",
          width: "48",
          height: "3",
          rx: "1.5",
        })
      );
      pattern.appendChild(
        el("rect", {
          class: "pp-skel",
          x: "0",
          y: "10",
          width: "34",
          height: "3",
          rx: "1.5",
        })
      );
      pattern.appendChild(
        el("circle", {
          class: "pp-marker pp-marker--filled",
          cx: "60",
          cy: "7",
          r: "4",
        })
      );
    } else if (card.id === "uncertain") {
      pattern.appendChild(
        el("rect", {
          class: "pp-skel pp-skel--short",
          x: "8",
          y: "5",
          width: "28",
          height: "3",
          rx: "1.5",
        })
      );
      pattern.appendChild(
        el("circle", {
          class: "pp-marker pp-marker--outline",
          cx: "56",
          cy: "7",
          r: "4",
        })
      );
    } else {
      pattern.appendChild(
        el("rect", {
          class: "pp-skel",
          x: "0",
          y: "0",
          width: "36",
          height: "8",
          rx: "4",
        })
      );
      pattern.appendChild(
        el("rect", {
          class: "pp-skel",
          x: "0",
          y: "12",
          width: "28",
          height: "8",
          rx: "4",
        })
      );
      pattern.appendChild(
        el("path", {
          class: "pp-return",
          d: "M48 14 H58 V4",
          fill: "none",
        })
      );
    }

    g.appendChild(pattern);
    return g;
  }

  function buildNodeGroup(node) {
    var g = el("g", {
      class:
        "workflow-node pp-node" +
        (node.risk ? " is-risk" : "") +
        (node.refined ? " is-refined" : ""),
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
          class: "wp-decision pp-decision",
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
          class: "wp-step pp-step",
          x: "0",
          y: "0",
          width: String(node.w),
          height: String(node.h),
          rx: String(stepR),
          ry: String(stepR),
        })
      );
      var label = el("text", {
        class: "pp-label",
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

  function PrototypeRiskPreview(root) {
    this.root = root;
    this.caption = root.querySelector(".workflow-preview-caption");
    this.svg = null;
    this.bgG = null;
    this.edgesInitialG = null;
    this.edgesFinalG = null;
    this.nodesG = null;
    this.protoG = null;
    this.focusEl = null;
    this.badgeG = null;
    this.stateEls = {};
    this.nodeEls = {};
    this.layout = cloneLayout(INITIAL);
    this.phaseIndex = 0;
    this.timer = null;
    this.testTimer = null;
    this.visible = false;
    this.running = false;
    this.reduced = prefersReducedMotion();
  }

  PrototypeRiskPreview.prototype.focusRectFor = function (node) {
    var pad = 10;
    if (node.type === "diamond") {
      return {
        x: node.x - pad,
        y: node.y - pad,
        w: node.size + pad * 2,
        h: node.size + pad * 2,
      };
    }
    return {
      x: node.x - pad,
      y: node.y - pad,
      w: node.w + pad * 2,
      h: node.h + pad * 2,
    };
  };

  PrototypeRiskPreview.prototype.badgePosFor = function (node) {
    if (node.type === "diamond") {
      return { x: node.x + node.size + 8, y: node.y - 6 };
    }
    return { x: node.x + node.w + 8, y: node.y - 4 };
  };

  PrototypeRiskPreview.prototype.mount = function () {
    var existing = this.root.querySelector(".workflow-preview-svg");
    if (existing) existing.remove();

    var final = finalLayout();
    var proto = protoConfig();
    var initialEdges = mainEdgesForMode("initial");
    var finalEdges = mainEdgesForMode("final");

    var svg = el("svg", {
      class: "workflow-preview-svg",
      viewBox: "0 0 " + VIEW_W + " " + VIEW_H,
      "aria-hidden": "true",
      focusable: "false",
    });

    var bg = el("g", { class: "background-containers pp-bg" });
    var protoArea = el("g", { class: "pp-prototype-area" });
    protoArea.appendChild(
      el("rect", {
        class: "prototype-area",
        x: String(proto.x),
        y: String(proto.y),
        width: String(proto.w),
        height: String(proto.h),
        rx: "16",
        ry: "16",
      })
    );
    var protoLabel = el("text", {
      class: "pp-proto-label",
      x: String(proto.labelX),
      y: String(proto.labelY),
    });
    protoLabel.textContent = "Prototype";
    protoArea.appendChild(protoLabel);
    bg.appendChild(protoArea);

    var edgesInitial = el("g", {
      class: "workflow-edges workflow-edges--initial",
    });
    var edgesFinal = el("g", {
      class: "workflow-edges workflow-edges--final",
    });
    var nodes = el("g", { class: "workflow-nodes" });
    var protoComponents = el("g", { class: "prototype-components pp-states" });
    var labels = el("g", { class: "labels pp-overlays" });

    // Focus frame
    var focusBox = this.focusRectFor(INITIAL.decide);
    var focus = el("rect", {
      class: "pp-focus-frame",
      x: String(focusBox.x),
      y: String(focusBox.y),
      width: String(focusBox.w),
      height: String(focusBox.h),
      rx: "12",
      ry: "12",
    });
    labels.appendChild(focus);

    // High-risk badge
    var badgePos = this.badgePosFor(INITIAL.decide);
    var badge = el("g", {
      class: "pp-risk-badge",
      transform: "translate(" + badgePos.x + " " + badgePos.y + ")",
    });
    badge.appendChild(
      el("rect", {
        class: "pp-risk-badge-bg",
        x: "0",
        y: "0",
        width: "62",
        height: "18",
        rx: "9",
        ry: "9",
      })
    );
    var badgeText = el("text", {
      class: "pp-risk-badge-text",
      x: "31",
      y: "10",
      "text-anchor": "middle",
      "dominant-baseline": "middle",
    });
    badgeText.textContent = "High risk";
    badge.appendChild(badgeText);
    labels.appendChild(badge);

    initialEdges.forEach(function (edge) {
      var path = buildEdgePath(edge, edgeD(INITIAL, edge));
      path.style.strokeDasharray = "160";
      path.style.strokeDashoffset = "160";
      edgesInitial.appendChild(path);
    });

    finalEdges.forEach(function (edge) {
      var path = buildEdgePath(edge, edgeD(final, edge));
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

    STATE_ORDER.forEach(function (id) {
      var card = buildStateCard(proto.cards[id]);
      protoComponents.appendChild(card);
      self.stateEls[id] = card;
    });

    svg.appendChild(bg);
    svg.appendChild(edgesInitial);
    svg.appendChild(edgesFinal);
    svg.appendChild(nodes);
    svg.appendChild(protoComponents);
    svg.appendChild(labels);

    if (this.caption) {
      this.root.insertBefore(svg, this.caption);
    } else {
      this.root.appendChild(svg);
    }

    this.svg = svg;
    this.bgG = bg;
    this.edgesInitialG = edgesInitial;
    this.edgesFinalG = edgesFinal;
    this.nodesG = nodes;
    this.protoG = protoComponents;
    this.focusEl = focus;
    this.badgeG = badge;

    [edgesInitial, edgesFinal].forEach(function (group) {
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

  PrototypeRiskPreview.prototype.updateOverlays = function (layout) {
    var decide = layout.decide;
    var box = this.focusRectFor(decide);
    if (this.focusEl) {
      this.focusEl.setAttribute("x", String(box.x));
      this.focusEl.setAttribute("y", String(box.y));
      this.focusEl.setAttribute("width", String(box.w));
      this.focusEl.setAttribute("height", String(box.h));
    }
    var badgePos = this.badgePosFor(decide);
    if (this.badgeG) {
      this.badgeG.setAttribute(
        "transform",
        "translate(" + badgePos.x + " " + badgePos.y + ")"
      );
    }
  };

  PrototypeRiskPreview.prototype.setNodeLayout = function (layout, animate) {
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
          "transform 750ms cubic-bezier(0.22, 1, 0.36, 1) " +
          i * 35 +
          "ms, opacity 400ms ease";
      }
      g.setAttribute("transform", "translate(" + node.x + " " + node.y + ")");
      g.classList.toggle("is-risk", !!node.risk);
      g.classList.toggle("is-refined", !!node.refined);
    });
    this.updateOverlays(layout);
  };

  PrototypeRiskPreview.prototype.setEdgesDrawn = function (group, drawn) {
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

  PrototypeRiskPreview.prototype.clearTestHighlight = function () {
    if (this.testTimer) {
      window.clearTimeout(this.testTimer);
      this.testTimer = null;
    }
    STATE_ORDER.forEach(
      function (id) {
        var el = this.stateEls[id];
        if (el) el.classList.remove("is-active");
      }.bind(this)
    );
  };

  PrototypeRiskPreview.prototype.runTestHighlight = function () {
    var self = this;
    this.clearTestHighlight();
    var i = 0;
    var step = function () {
      STATE_ORDER.forEach(function (id) {
        var el = self.stateEls[id];
        if (el) el.classList.remove("is-active");
      });
      if (i >= STATE_ORDER.length) {
        // leave recovery confirmed briefly
        var last = self.stateEls.recovery;
        if (last) last.classList.add("is-active", "is-confirmed");
        return;
      }
      var id = STATE_ORDER[i];
      var card = self.stateEls[id];
      if (card) card.classList.add("is-active");
      i += 1;
      self.testTimer = window.setTimeout(step, 420);
    };
    step();
  };

  PrototypeRiskPreview.prototype.setPhase = function (index) {
    var phase = PHASES[index];
    if (!phase) return;
    this.phaseIndex = index;
    this.root.setAttribute("data-phase", phase.name);
    if (this.caption) this.caption.textContent = phase.caption;

    if (phase.name === "observe") {
      this.clearTestHighlight();
      this.root.classList.remove("is-focused", "is-prototyping", "is-refined");
      this.setNodeLayout(cloneLayout(INITIAL), false);
      this.setEdgesDrawn(this.edgesInitialG, false);
      this.setEdgesDrawn(this.edgesFinalG, false);
      void this.root.offsetWidth;
      this.setNodeLayout(cloneLayout(INITIAL), true);
      var self = this;
      window.setTimeout(function () {
        if (self.phaseIndex === index && self.running) {
          self.setEdgesDrawn(self.edgesInitialG, true);
        }
      }, 240);
    }

    if (phase.name === "identify") {
      this.root.classList.add("is-focused");
      this.root.classList.remove("is-prototyping", "is-refined");
      this.setNodeLayout(cloneLayout(INITIAL), true);
      this.setEdgesDrawn(this.edgesInitialG, true);
    }

    if (phase.name === "isolate") {
      this.clearTestHighlight();
      this.root.classList.add("is-focused", "is-prototyping");
      this.root.classList.remove("is-refined");
      this.setEdgesDrawn(this.edgesInitialG, false);
      this.setEdgesDrawn(this.edgesFinalG, false);
      this.setNodeLayout(finalLayout(), true);
    }

    if (phase.name === "test") {
      this.root.classList.add("is-focused", "is-prototyping");
      this.root.classList.remove("is-refined");
      this.setNodeLayout(finalLayout(), true);
      this.setEdgesDrawn(this.edgesFinalG, false);
      this.runTestHighlight();
    }

    if (phase.name === "refine" || phase.name === "hold") {
      this.clearTestHighlight();
      this.root.classList.remove("is-focused");
      this.root.classList.add("is-prototyping", "is-refined");
      this.setNodeLayout(finalLayout(), true);
      this.setEdgesDrawn(this.edgesFinalG, true);
      // keep recovery card subtly confirmed in refined state
      if (this.stateEls.recovery) {
        this.stateEls.recovery.classList.add("is-confirmed");
      }
    }

    if (phase.name === "reset") {
      this.root.classList.add("is-resetting");
    }
  };

  PrototypeRiskPreview.prototype.showStaticFinal = function () {
    this.stop();
    this.root.classList.remove("is-resetting", "is-focused");
    this.root.classList.add("is-prototyping", "is-refined");
    this.root.setAttribute("data-reduced", "true");
    this.root.setAttribute("data-phase", "hold");
    this.setNodeLayout(finalLayout(), false);
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
    STATE_ORDER.forEach(
      function (id) {
        var el = this.stateEls[id];
        if (el) {
          el.classList.remove("is-active");
          el.classList.toggle("is-confirmed", id === "recovery");
        }
      }.bind(this)
    );
    if (this.caption) this.caption.textContent = "Refine";
  };

  PrototypeRiskPreview.prototype.stop = function () {
    this.running = false;
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    this.clearTestHighlight();
  };

  PrototypeRiskPreview.prototype.scheduleNext = function () {
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

  PrototypeRiskPreview.prototype.start = function () {
    if (this.root.getAttribute("data-approach-active") === "false") return;
    if (this.reduced || this.running) return;
    if (document.visibilityState === "hidden" || !this.visible) return;
    this.running = true;
    this.root.removeAttribute("data-reduced");
    this.root.classList.remove("is-resetting");
    this.setPhase(0);
    this.scheduleNext();
  };

  PrototypeRiskPreview.prototype.pause = function () {
    this.stop();
  };

  PrototypeRiskPreview.prototype.bind = function () {
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

      var mqWidth = window.matchMedia("(max-width: 600px)");
      var onWidth = function () {
        var wasRunning = self.running;
        var phase = self.phaseIndex;
        self.mount();
        if (self.reduced) self.showStaticFinal();
        else if (self.visible) {
          self.setPhase(phase);
          if (wasRunning) {
            self.running = true;
            self.scheduleNext();
          }
        }
      };
      if (mqWidth.addEventListener) mqWidth.addEventListener("change", onWidth);
      else if (mqWidth.addListener) mqWidth.addListener(onWidth);
    }
  };

  function initAll() {
    document
      .querySelectorAll("[data-prototype-preview]")
      .forEach(function (el) {
        new PrototypeRiskPreview(el).bind();
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
