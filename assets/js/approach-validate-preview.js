/**
 * Approach point 5 — Validate with users and delivery teams.
 * Same geometry language as the other Approach previews.
 */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var VIEW_W = 560;
  var VIEW_H = 280;

  var NODE_W = 112;
  var NODE_H = 32;
  var PROTO_W = 120;
  var PROTO_H = 52;
  var NODE_R = 10;
  var NODE_R_SMALL = 7;
  var EDGE_RADIUS = 10;
  var EDGE_RADIUS_MOBILE = 8;
  var TOKEN_W = 18;
  var TOKEN_H = 8;

  var NODE_ORDER = ["user", "product", "engineering", "prototype", "refined"];

  var LAYOUT = {
    user: {
      id: "user",
      type: "step",
      label: "User",
      x: 224,
      y: 16,
      w: NODE_W,
      h: NODE_H,
      role: "stakeholder",
    },
    product: {
      id: "product",
      type: "step",
      label: "Product",
      x: 40,
      y: 110,
      w: NODE_W,
      h: NODE_H,
      role: "stakeholder",
    },
    engineering: {
      id: "engineering",
      type: "step",
      label: "Engineering",
      x: 408,
      y: 110,
      w: 120,
      h: NODE_H,
      role: "stakeholder",
    },
    prototype: {
      id: "prototype",
      type: "prototype",
      label: "Prototype",
      x: 220,
      y: 100,
      w: PROTO_W,
      h: PROTO_H,
      role: "prototype",
    },
    refined: {
      id: "refined",
      type: "step",
      label: "Refined",
      x: 220,
      y: 220,
      w: PROTO_W,
      h: NODE_H,
      role: "result",
    },
  };

  var LAYOUT_MOBILE = {
    user: {
      id: "user",
      type: "step",
      label: "User",
      x: 224,
      y: 8,
      w: 96,
      h: 28,
      role: "stakeholder",
    },
    product: {
      id: "product",
      type: "step",
      label: "Product",
      x: 24,
      y: 96,
      w: 96,
      h: 28,
      role: "stakeholder",
    },
    engineering: {
      id: "engineering",
      type: "step",
      label: "Engineering",
      x: 424,
      y: 96,
      w: 112,
      h: 28,
      role: "stakeholder",
    },
    prototype: {
      id: "prototype",
      type: "prototype",
      label: "Prototype",
      x: 212,
      y: 88,
      w: 112,
      h: 48,
      role: "prototype",
    },
    refined: {
      id: "refined",
      type: "step",
      label: "Refined",
      x: 212,
      y: 220,
      w: 112,
      h: 28,
      role: "result",
    },
  };

  var EDGES = [
    {
      id: "e-user",
      from: "user",
      fromPort: "bottom",
      to: "prototype",
      toPort: "top",
      style: "primary",
      stakeholder: "user",
    },
    {
      id: "e-product",
      from: "product",
      fromPort: "right",
      to: "prototype",
      toPort: "left",
      style: "primary",
      stakeholder: "product",
    },
    {
      id: "e-engineering",
      from: "engineering",
      fromPort: "left",
      to: "prototype",
      toPort: "right",
      style: "primary",
      stakeholder: "engineering",
    },
    {
      id: "e-refined",
      from: "prototype",
      fromPort: "bottom",
      to: "refined",
      toPort: "top",
      style: "primary",
      stakeholder: null,
    },
  ];

  var PHASES = [
    { name: "prototype", caption: "Prototype", duration: 1200 },
    { name: "user", caption: "Validate", duration: 1100 },
    { name: "product", caption: "Validate", duration: 1100 },
    { name: "engineering", caption: "Validate", duration: 1100 },
    { name: "deliver", caption: "Deliver", duration: 1200 },
    { name: "hold", caption: "Deliver", duration: 900 },
    { name: "reset", caption: "Deliver", duration: 400 },
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

  function activeLayout() {
    var src = isMobile() ? LAYOUT_MOBILE : LAYOUT;
    var out = {};
    NODE_ORDER.forEach(function (id) {
      out[id] = Object.assign({}, src[id]);
    });
    return out;
  }

  function portsFor(node) {
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

  function buildPrototypeInner(node) {
    var g = el("g", { class: "vp-proto-inner" });
    var pad = 14;
    var lineW = node.w - pad * 2;

    // Abstract content below the title — matures via data-maturity on root
    [
      { cls: "vp-skel vp-skel-a", y: 26, w: 0.42 },
      { cls: "vp-skel vp-skel-b", y: 34, w: 0.62 },
    ].forEach(function (line) {
      g.appendChild(
        el("rect", {
          class: line.cls,
          x: String(pad),
          y: String(line.y),
          width: String(lineW * line.w),
          height: "3",
          rx: "1.5",
          ry: "1.5",
        })
      );
    });

    g.appendChild(
      el("rect", {
        class: "vp-confidence-track",
        x: String(pad),
        y: String(node.h - 11),
        width: String(lineW),
        height: "5",
        rx: "2.5",
        ry: "2.5",
      })
    );
    g.appendChild(
      el("rect", {
        class: "vp-confidence-fill",
        x: String(pad),
        y: String(node.h - 11),
        width: String(lineW * 0.35),
        height: "5",
        rx: "2.5",
        ry: "2.5",
      })
    );

    return g;
  }

  function buildNodeGroup(node) {
    var g = el("g", {
      class:
        "workflow-node vp-node vp-node--" +
        (node.role || "step") +
        (node.id === "prototype" ? " vp-node--prototype" : ""),
      "data-id": node.id,
      "data-type": node.type,
      "data-role": node.role || "step",
    });

    var stepR = node.h <= 30 ? NODE_R_SMALL : NODE_R;
    if (node.type === "prototype") stepR = NODE_R;

    g.appendChild(
      el("rect", {
        class: "wp-step vp-step",
        x: "0",
        y: "0",
        width: String(node.w),
        height: String(node.h),
        rx: String(stepR),
        ry: String(stepR),
      })
    );

    if (node.type === "prototype") {
      var name = el("text", {
        class: "vp-label vp-proto-name",
        x: String(node.w / 2),
        y: "15",
        "text-anchor": "middle",
        "dominant-baseline": "middle",
      });
      name.textContent = node.label;
      g.appendChild(name);
      g.appendChild(buildPrototypeInner(node));
    } else {
      var label = el("text", {
        class: "vp-label",
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
      class:
        "wp-line wp-line--" +
        edge.style +
        (edge.stakeholder ? " vp-edge--" + edge.stakeholder : " vp-edge--refined"),
      id: edge.id,
      d: d,
      "data-edge": edge.id,
      "data-stakeholder": edge.stakeholder || "",
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

  function ValidateCollaborationPreview(root) {
    this.root = root;
    this.caption = root.querySelector(".workflow-preview-caption");
    this.svg = null;
    this.edgesG = null;
    this.nodesG = null;
    this.tokensG = null;
    this.edgeEls = {};
    this.nodeEls = {};
    this.tokenEl = null;
    this.layout = activeLayout();
    this.phaseIndex = 0;
    this.timer = null;
    this.tokenRaf = null;
    this.visible = false;
    this.running = false;
    this.reduced = prefersReducedMotion();
    this.maturity = 0;
  }

  ValidateCollaborationPreview.prototype.mount = function () {
    var existing = this.root.querySelector(".workflow-preview-svg");
    if (existing) existing.remove();

    this.layout = activeLayout();
    var layout = this.layout;

    var svg = el("svg", {
      class: "workflow-preview-svg",
      viewBox: "0 0 " + VIEW_W + " " + VIEW_H,
      "aria-hidden": "true",
      focusable: "false",
    });

    var edges = el("g", { class: "workflow-edges vp-edges" });
    var nodes = el("g", { class: "workflow-nodes" });
    var tokens = el("g", { class: "vp-tokens" });

    var self = this;
    EDGES.forEach(function (edge) {
      var path = buildEdgePath(edge, edgeD(layout, edge));
      var len = 160;
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
      edges.appendChild(path);
      self.edgeEls[edge.id] = path;
    });

    NODE_ORDER.forEach(function (id) {
      var group = buildNodeGroup(layout[id]);
      nodes.appendChild(group);
      self.nodeEls[id] = group;
    });

    var token = el("rect", {
      class: "vp-feedback-token",
      x: "0",
      y: "0",
      width: String(TOKEN_W),
      height: String(TOKEN_H),
      rx: String(TOKEN_H / 2),
      ry: String(TOKEN_H / 2),
    });
    tokens.appendChild(token);

    svg.appendChild(edges);
    svg.appendChild(nodes);
    svg.appendChild(tokens);

    if (this.caption) {
      this.root.insertBefore(svg, this.caption);
    } else {
      this.root.appendChild(svg);
    }

    this.svg = svg;
    this.edgesG = edges;
    this.nodesG = nodes;
    this.tokensG = tokens;
    this.tokenEl = token;

    Array.prototype.forEach.call(edges.querySelectorAll(".wp-line"), function (
      path
    ) {
      var len = measurePath(path);
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
      path.setAttribute("data-length", String(len));
    });

    this.hideToken();
  };

  ValidateCollaborationPreview.prototype.hideToken = function () {
    if (!this.tokenEl) return;
    this.tokenEl.style.opacity = "0";
    this.tokenEl.setAttribute("transform", "translate(-40 -40)");
  };

  ValidateCollaborationPreview.prototype.setMaturity = function (level) {
    this.maturity = level;
    this.root.setAttribute("data-maturity", String(level));
    var proto = this.nodeEls.prototype;
    if (!proto) return;
    var layout = this.layout.prototype;
    var lineW = layout.w - 28;
    var fill = proto.querySelector(".vp-confidence-fill");
    var name = proto.querySelector(".vp-proto-name");
    var skelA = proto.querySelector(".vp-skel-a");
    var skelB = proto.querySelector(".vp-skel-b");
    var skelWidths = [
      [0.42, 0.28],
      [0.58, 0.45],
      [0.7, 0.62],
      [0.78, 0.7],
    ];
    var pair = skelWidths[Math.min(level, 3)];
    if (skelA) skelA.setAttribute("width", String(lineW * pair[0]));
    if (skelB) {
      skelB.setAttribute("width", String(lineW * pair[1]));
      skelB.setAttribute("x", "14");
    }
    if (fill) {
      var ratios = [0.35, 0.52, 0.7, 0.88];
      fill.setAttribute("width", String(lineW * ratios[Math.min(level, 3)]));
    }
    if (name) {
      name.textContent = level >= 3 ? "Refined" : "Prototype";
    }
    proto.classList.toggle("is-refined", level >= 3);
  };

  ValidateCollaborationPreview.prototype.setEdgeDrawn = function (edgeId, drawn) {
    var path = this.edgeEls[edgeId];
    if (!path) return;
    var len = path.getAttribute("data-length") || measurePath(path);
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = drawn ? "0" : String(len);
  };

  ValidateCollaborationPreview.prototype.setStakeholderVisible = function (
    id,
    visible
  ) {
    var g = this.nodeEls[id];
    if (!g) return;
    g.classList.toggle("is-hidden", !visible);
    g.classList.toggle("is-active", !!visible);
  };

  ValidateCollaborationPreview.prototype.setRefinedVisible = function (visible) {
    var g = this.nodeEls.refined;
    if (!g) return;
    g.classList.toggle("is-hidden", !visible);
  };

  ValidateCollaborationPreview.prototype.cancelTokenAnim = function () {
    if (this.tokenRaf) {
      window.cancelAnimationFrame(this.tokenRaf);
      this.tokenRaf = null;
    }
  };

  ValidateCollaborationPreview.prototype.animateTokenAlong = function (
    edgeId,
    duration,
    done
  ) {
    var self = this;
    var path = this.edgeEls[edgeId];
    if (!path || !this.tokenEl) {
      if (done) done();
      return;
    }

    this.cancelTokenAnim();
    var len = measurePath(path);
    var token = this.tokenEl;
    var start = null;

    token.style.opacity = "1";

    var step = function (ts) {
      if (!self.running && !self.reduced) {
        self.hideToken();
        if (done) done();
        return;
      }
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / duration);
      // ease-in-out
      var eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      try {
        var pt = path.getPointAtLength(len * eased);
        token.setAttribute(
          "transform",
          "translate(" +
            (pt.x - TOKEN_W / 2) +
            " " +
            (pt.y - TOKEN_H / 2) +
            ")"
        );
      } catch (err) {
        /* ignore */
      }
      if (t < 1) {
        self.tokenRaf = window.requestAnimationFrame(step);
      } else {
        self.tokenRaf = null;
        window.setTimeout(function () {
          self.hideToken();
          if (done) done();
        }, 80);
      }
    };

    this.tokenRaf = window.requestAnimationFrame(step);
  };

  ValidateCollaborationPreview.prototype.setPhase = function (index) {
    var phase = PHASES[index];
    if (!phase) return;
    this.phaseIndex = index;
    this.root.setAttribute("data-phase", phase.name);
    if (this.caption) this.caption.textContent = phase.caption;

    var self = this;

    if (phase.name === "prototype") {
      this.cancelTokenAnim();
      this.hideToken();
      this.setMaturity(0);
      NODE_ORDER.forEach(function (id) {
        var g = self.nodeEls[id];
        if (!g) return;
        g.style.transition = "none";
        g.setAttribute(
          "transform",
          "translate(" + self.layout[id].x + " " + self.layout[id].y + ")"
        );
      });
      this.setStakeholderVisible("user", false);
      this.setStakeholderVisible("product", false);
      this.setStakeholderVisible("engineering", false);
      this.setRefinedVisible(false);
      EDGES.forEach(function (edge) {
        self.setEdgeDrawn(edge.id, false);
      });
      void this.root.offsetWidth;
      this.nodeEls.prototype.classList.remove("is-hidden");
    }

    if (phase.name === "user") {
      this.setStakeholderVisible("user", true);
      this.setStakeholderVisible("product", false);
      this.setStakeholderVisible("engineering", false);
      this.setRefinedVisible(false);
      this.setEdgeDrawn("e-user", true);
      this.setEdgeDrawn("e-product", false);
      this.setEdgeDrawn("e-engineering", false);
      this.setEdgeDrawn("e-refined", false);
      this.animateTokenAlong("e-user", 520, function () {
        if (self.phaseIndex === index) self.setMaturity(1);
      });
    }

    if (phase.name === "product") {
      this.setStakeholderVisible("user", true);
      this.setStakeholderVisible("product", true);
      this.setStakeholderVisible("engineering", false);
      this.setRefinedVisible(false);
      this.setEdgeDrawn("e-user", true);
      this.setEdgeDrawn("e-product", true);
      this.setEdgeDrawn("e-engineering", false);
      this.setEdgeDrawn("e-refined", false);
      this.setMaturity(1);
      this.animateTokenAlong("e-product", 520, function () {
        if (self.phaseIndex === index) self.setMaturity(2);
      });
    }

    if (phase.name === "engineering") {
      this.setStakeholderVisible("user", true);
      this.setStakeholderVisible("product", true);
      this.setStakeholderVisible("engineering", true);
      this.setRefinedVisible(false);
      this.setEdgeDrawn("e-user", true);
      this.setEdgeDrawn("e-product", true);
      this.setEdgeDrawn("e-engineering", true);
      this.setEdgeDrawn("e-refined", false);
      this.setMaturity(2);
      this.animateTokenAlong("e-engineering", 520, function () {
        if (self.phaseIndex === index) self.setMaturity(3);
      });
    }

    if (phase.name === "deliver" || phase.name === "hold") {
      this.cancelTokenAnim();
      this.hideToken();
      this.setStakeholderVisible("user", true);
      this.setStakeholderVisible("product", true);
      this.setStakeholderVisible("engineering", true);
      this.setRefinedVisible(true);
      this.setEdgeDrawn("e-user", true);
      this.setEdgeDrawn("e-product", true);
      this.setEdgeDrawn("e-engineering", true);
      this.setEdgeDrawn("e-refined", true);
      this.setMaturity(3);
    }

    if (phase.name === "reset") {
      this.root.classList.add("is-resetting");
    }
  };

  ValidateCollaborationPreview.prototype.showStaticFinal = function () {
    this.stop();
    this.root.classList.remove("is-resetting");
    this.root.setAttribute("data-reduced", "true");
    this.root.setAttribute("data-phase", "hold");
    this.setStakeholderVisible("user", true);
    this.setStakeholderVisible("product", true);
    this.setStakeholderVisible("engineering", true);
    this.setRefinedVisible(true);
    EDGES.forEach(
      function (edge) {
        this.setEdgeDrawn(edge.id, true);
        var path = this.edgeEls[edge.id];
        if (path) {
          path.style.strokeDasharray = "none";
          path.style.strokeDashoffset = "0";
        }
      }.bind(this)
    );
    this.setMaturity(3);
    this.hideToken();
    if (this.caption) this.caption.textContent = "Deliver";
  };

  ValidateCollaborationPreview.prototype.stop = function () {
    this.running = false;
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    this.cancelTokenAnim();
  };

  ValidateCollaborationPreview.prototype.scheduleNext = function () {
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

  ValidateCollaborationPreview.prototype.start = function () {
    if (this.root.getAttribute("data-approach-active") === "false") return;
    if (this.reduced || this.running) return;
    if (document.visibilityState === "hidden" || !this.visible) return;
    this.running = true;
    this.root.removeAttribute("data-reduced");
    this.root.classList.remove("is-resetting");
    this.setPhase(0);
    this.scheduleNext();
  };

  ValidateCollaborationPreview.prototype.pause = function () {
    this.stop();
  };

  ValidateCollaborationPreview.prototype.bind = function () {
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
        var phase = self.phaseIndex;
        self.mount();
        if (self.reduced) self.showStaticFinal();
        else if (self.visible) {
          self.setPhase(phase);
          if (!self.running) self.start();
        }
      };
      if (mqWidth.addEventListener) mqWidth.addEventListener("change", onWidth);
      else if (mqWidth.addListener) mqWidth.addListener(onWidth);
    }
  };

  function initAll() {
    document.querySelectorAll("[data-validate-preview]").forEach(function (el) {
      new ValidateCollaborationPreview(el).bind();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
