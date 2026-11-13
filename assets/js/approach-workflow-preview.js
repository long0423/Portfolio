/**
 * Approach workflow preview — port-accurate SVG geometry + phased motion.
 */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var VIEW_W = 560;
  var VIEW_H = 280;

  var NODE_W = 112;
  var NODE_H = 36;
  var NODE_R = 10; // --radius-node-medium
  var NODE_R_SMALL = 7; // --radius-node-small (compact steps / decision)
  var DIAMOND = 28; // axis-aligned bounds of decision
  var ACTOR_R = 6;
  var COL_X = 224; // centred column (560/2 - 112/2)
  var EDGE_RADIUS = 10;
  var EDGE_RADIUS_MOBILE = 8;

  /**
   * Final clarified layout (8px grid).
   * Primary column centred; symmetric revise / approve branches.
   */
  var FINAL = {
    input: { id: "input", type: "step", x: COL_X, y: 24, w: NODE_W, h: NODE_H },
    review: { id: "review", type: "step", x: COL_X, y: 88, w: NODE_W, h: NODE_H },
    decision: { id: "decision", type: "diamond", x: 266, y: 144, size: DIAMOND },
    revise: { id: "revise", type: "step", x: 80, y: 196, w: NODE_W, h: NODE_H, secondary: true },
    approve: { id: "approve", type: "step", x: 368, y: 196, w: NODE_W, h: NODE_H },
    outcome: { id: "outcome", type: "step", x: 368, y: 248, w: NODE_W, h: 28 },
    actorA: { id: "actorA", type: "actor", x: 198, y: 100, r: ACTOR_R },
    actorB: { id: "actorB", type: "actor", x: 490, y: 208, r: ACTOR_R },
  };

  /**
   * Designed initial layout — near-structure offsets (12–24px), no overlaps.
   */
  var INITIAL = {
    input: { id: "input", type: "step", x: 208, y: 32, w: NODE_W, h: NODE_H },
    review: { id: "review", type: "step", x: 248, y: 80, w: NODE_W, h: NODE_H },
    decision: { id: "decision", type: "diamond", x: 304, y: 136, size: DIAMOND },
    revise: { id: "revise", type: "step", x: 64, y: 208, w: NODE_W, h: NODE_H, secondary: true },
    approve: { id: "approve", type: "step", x: 384, y: 184, w: NODE_W, h: NODE_H },
    outcome: { id: "outcome", type: "step", x: 400, y: 240, w: NODE_W, h: 28 },
    actorA: { id: "actorA", type: "actor", x: 176, y: 96, r: ACTOR_R },
    actorB: { id: "actorB", type: "actor", x: 504, y: 124, r: ACTOR_R },
  };

  var NODE_ORDER = [
    "input",
    "review",
    "decision",
    "revise",
    "approve",
    "outcome",
    "actorA",
    "actorB",
  ];

  /** Edge specs: fromId, fromPort, toId, toPort, style — all routes are rounded-orthogonal */
  var INITIAL_EDGES = [
    { id: "e1", from: "input", fromPort: "right", to: "review", toPort: "left", style: "secondary" },
    { id: "e2", from: "actorA", fromPort: "right", to: "review", toPort: "left", style: "secondary" },
    { id: "e3", from: "review", fromPort: "bottom", to: "decision", toPort: "top", style: "primary" },
    { id: "e4", from: "decision", fromPort: "left", to: "revise", toPort: "top", style: "secondary" },
    { id: "e5", from: "decision", fromPort: "right", to: "approve", toPort: "top", style: "primary" },
    { id: "e6", from: "approve", fromPort: "bottom", to: "outcome", toPort: "top", style: "primary" },
    { id: "e7", from: "actorB", fromPort: "bottom", to: "approve", toPort: "top", style: "secondary" },
    { id: "e8", from: "revise", fromPort: "right", to: "outcome", toPort: "left", style: "secondary" },
  ];

  var FINAL_EDGES = [
    { id: "f1", from: "input", fromPort: "bottom", to: "review", toPort: "top", style: "primary" },
    { id: "f2", from: "review", fromPort: "bottom", to: "decision", toPort: "top", style: "primary" },
    { id: "f3", from: "decision", fromPort: "left", to: "revise", toPort: "top", style: "secondary" },
    { id: "f4", from: "decision", fromPort: "right", to: "approve", toPort: "top", style: "primary" },
    { id: "f5", from: "approve", fromPort: "bottom", to: "outcome", toPort: "top", style: "primary" },
    { id: "f6", from: "actorA", fromPort: "right", to: "review", toPort: "left", style: "secondary" },
    { id: "f7", from: "actorB", fromPort: "left", to: "approve", toPort: "right", style: "secondary" },
  ];

  var PHASES = [
    { name: "discover", caption: "Observe", duration: 1200 },
    { name: "connect", caption: "Map", duration: 1400 },
    { name: "identify", caption: "Identify", duration: 1400 },
    { name: "reorganize", caption: "Clarify", duration: 1400 },
    { name: "finalize", caption: "Clarify", duration: 1000 },
    { name: "hold", caption: "Clarify", duration: 1100 },
    { name: "reset", caption: "Clarify", duration: 400 },
  ];

  function prefersReducedMotion() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function cloneLayout(layout) {
    var out = {};
    NODE_ORDER.forEach(function (id) {
      out[id] = Object.assign({}, layout[id]);
    });
    return out;
  }

  /** Derive cardinal ports from node bounds (absolute coordinates). */
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
    if (node.type === "actor") {
      var ax = node.x + node.r;
      var ay = node.y + node.r;
      return {
        top: { x: ax, y: node.y },
        right: { x: node.x + node.r * 2, y: ay },
        bottom: { x: ax, y: node.y + node.r * 2 },
        left: { x: node.x, y: ay },
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
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 600px)").matches
    ) {
      return EDGE_RADIUS_MOBILE;
    }
    return EDGE_RADIUS;
  }

  function dist2(a, b) {
    return Math.hypot(b[0] - a[0], b[1] - a[1]);
  }

  /**
   * Build orthogonal waypoints from port directions.
   * First segment leaves source port axis-aligned; last segment enters target port axis-aligned.
   */
  function orthogonalWaypoints(x1, y1, fromPort, x2, y2, toPort) {
    x1 = snap(x1);
    y1 = snap(y1);
    x2 = snap(x2);
    y2 = snap(y2);

    // Vertical primary: bottom → top / top → bottom
    if (
      (fromPort === "bottom" && toPort === "top") ||
      (fromPort === "top" && toPort === "bottom")
    ) {
      if (Math.abs(x1 - x2) < 0.5) return [[x1, y1], [x2, y2]];
      var midY = snap((y1 + y2) / 2);
      return [[x1, y1], [x1, midY], [x2, midY], [x2, y2]];
    }

    // Horizontal: right ↔ left
    if (
      (fromPort === "right" && toPort === "left") ||
      (fromPort === "left" && toPort === "right")
    ) {
      if (Math.abs(y1 - y2) < 0.5) return [[x1, y1], [x2, y2]];
      var midX = snap((x1 + x2) / 2);
      return [[x1, y1], [midX, y1], [midX, y2], [x2, y2]];
    }

    // Decision / branch: side → top (symmetric elbows)
    if (
      (fromPort === "left" || fromPort === "right") &&
      toPort === "top"
    ) {
      return [[x1, y1], [x2, y1], [x2, y2]];
    }

    // Side → bottom
    if (
      (fromPort === "left" || fromPort === "right") &&
      toPort === "bottom"
    ) {
      return [[x1, y1], [x2, y1], [x2, y2]];
    }

    // Vertical leave → side enter
    if (
      (fromPort === "bottom" || fromPort === "top") &&
      (toPort === "left" || toPort === "right")
    ) {
      return [[x1, y1], [x1, y2], [x2, y2]];
    }

    // Fallback L-elbow
    return [[x1, y1], [x1, y2], [x2, y2]];
  }

  /** Convert orthogonal waypoints into a path with quadratic rounded elbows. */
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
      class: "workflow-node" + (node.secondary ? " is-secondary" : ""),
      "data-id": node.id,
      "data-type": node.type,
    });

    if (node.type === "diamond") {
      // Rounded square rotated 45° — ports still use axis-aligned bounds
      var bounds = node.size;
      var side = bounds / Math.SQRT2;
      var half = bounds / 2;
      var spin = el("g", {
        class: "wp-decision-spin",
        transform:
          "translate(" + half + " " + half + ") rotate(45)",
      });
      spin.appendChild(
        el("rect", {
          class: "wp-decision",
          x: String(-side / 2),
          y: String(-side / 2),
          width: String(side),
          height: String(side),
          rx: String(NODE_R_SMALL),
          ry: String(NODE_R_SMALL),
        })
      );
      g.appendChild(spin);
    } else if (node.type === "actor") {
      g.appendChild(
        el("circle", {
          class: "wp-actor",
          cx: String(node.r),
          cy: String(node.r),
          r: String(node.r),
        })
      );
    } else {
      var stepR = node.h <= 30 ? NODE_R_SMALL : NODE_R;
      g.appendChild(
        el("rect", {
          class: "wp-step",
          x: "0",
          y: "0",
          width: String(node.w),
          height: String(node.h),
          rx: String(stepR),
          ry: String(stepR),
        })
      );
    }

    g.setAttribute("transform", "translate(" + node.x + " " + node.y + ")");
    return g;
  }

  function buildEdgePath(edge, d, groupClass) {
    return el("path", {
      class:
        "wp-line wp-line--" +
        edge.style +
        (groupClass ? " " + groupClass : ""),
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

  function ApproachWorkflowPreview(root) {
    this.root = root;
    this.caption = root.querySelector(".workflow-preview-caption");
    this.svg = null;
    this.edgesInitialG = null;
    this.edgesFinalG = null;
    this.nodesG = null;
    this.nodeEls = {};
    this.initialEdgeEls = {};
    this.finalEdgeEls = {};
    this.layout = cloneLayout(INITIAL);
    this.phaseIndex = 0;
    this.timer = null;
    this.visible = false;
    this.running = false;
    this.reduced = prefersReducedMotion();
  }

  ApproachWorkflowPreview.prototype.mount = function () {
    var existing = this.root.querySelector(".workflow-preview-svg");
    if (existing) existing.remove();

    var svg = el("svg", {
      class: "workflow-preview-svg",
      viewBox: "0 0 " + VIEW_W + " " + VIEW_H,
      "aria-hidden": "true",
      focusable: "false",
    });

    var edgesInitial = el("g", { class: "workflow-edges workflow-edges--initial" });
    var edgesFinal = el("g", { class: "workflow-edges workflow-edges--final" });
    var nodes = el("g", { class: "workflow-nodes" });

    INITIAL_EDGES.forEach(function (edge) {
      var path = buildEdgePath(edge, edgeD(INITIAL, edge));
      var len = 160;
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
      edgesInitial.appendChild(path);
    });

    FINAL_EDGES.forEach(function (edge) {
      var path = buildEdgePath(edge, edgeD(FINAL, edge));
      var len = 160;
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
      edgesFinal.appendChild(path);
    });

    var self = this;
    NODE_ORDER.forEach(function (id) {
      var group = buildNodeGroup(INITIAL[id]);
      nodes.appendChild(group);
      self.nodeEls[id] = group;
    });

    svg.appendChild(edgesInitial);
    svg.appendChild(edgesFinal);
    svg.appendChild(nodes);

    var caption = this.caption;
    if (caption) {
      this.root.insertBefore(svg, caption);
    } else {
      this.root.appendChild(svg);
    }

    this.svg = svg;
    this.edgesInitialG = edgesInitial;
    this.edgesFinalG = edgesFinal;
    this.nodesG = nodes;

    // Measure real path lengths after mount
    Array.prototype.forEach.call(edgesInitial.querySelectorAll(".wp-line"), function (path) {
      var len = measurePath(path);
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
      path.setAttribute("data-length", String(len));
      self.initialEdgeEls[path.getAttribute("data-edge")] = path;
    });
    Array.prototype.forEach.call(edgesFinal.querySelectorAll(".wp-line"), function (path) {
      var len = measurePath(path);
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
      path.setAttribute("data-length", String(len));
      self.finalEdgeEls[path.getAttribute("data-edge")] = path;
    });
  };

  ApproachWorkflowPreview.prototype.setNodeLayout = function (layout, animate) {
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
          "transform 900ms cubic-bezier(0.22, 1, 0.36, 1) " + i * 40 + "ms, opacity 400ms ease";
      }
      g.setAttribute("transform", "translate(" + node.x + " " + node.y + ")");
      g.classList.toggle("is-secondary", !!node.secondary);
    });
  };

  ApproachWorkflowPreview.prototype.setEdgesDrawn = function (group, drawn) {
    var paths = group.querySelectorAll(".wp-line");
    Array.prototype.forEach.call(paths, function (path) {
      var len = path.getAttribute("data-length") || measurePath(path);
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = drawn ? "0" : String(len);
    });
  };

  ApproachWorkflowPreview.prototype.setPhase = function (index) {
    var phase = PHASES[index];
    if (!phase) return;
    this.phaseIndex = index;
    this.root.setAttribute("data-phase", phase.name);
    if (this.caption) this.caption.textContent = phase.caption;

    if (phase.name === "discover") {
      this.setNodeLayout(cloneLayout(INITIAL), false);
      this.root.classList.remove("is-muted-secondary");
      this.setEdgesDrawn(this.edgesInitialG, false);
      this.setEdgesDrawn(this.edgesFinalG, false);
      // force reflow then allow fade-in
      void this.root.offsetWidth;
      this.setNodeLayout(cloneLayout(INITIAL), true);
    }

    if (phase.name === "connect") {
      this.setNodeLayout(cloneLayout(INITIAL), true);
      this.setEdgesDrawn(this.edgesInitialG, true);
    }

    if (phase.name === "identify") {
      this.root.classList.add("is-muted-secondary");
    }

    if (phase.name === "reorganize") {
      // Preferred sync: edges fade via CSS; then nodes move to final
      this.setEdgesDrawn(this.edgesInitialG, false);
      this.setNodeLayout(cloneLayout(FINAL), true);
    }

    if (phase.name === "finalize") {
      this.setNodeLayout(cloneLayout(FINAL), true);
      this.setEdgesDrawn(this.edgesFinalG, true);
    }

    if (phase.name === "hold") {
      this.setNodeLayout(cloneLayout(FINAL), true);
      this.setEdgesDrawn(this.edgesFinalG, true);
      this.root.classList.add("is-muted-secondary");
    }

    if (phase.name === "reset") {
      this.root.classList.add("is-resetting");
    }
  };

  ApproachWorkflowPreview.prototype.showStaticFinal = function () {
    this.stop();
    this.root.classList.remove("is-resetting");
    this.root.setAttribute("data-reduced", "true");
    this.root.setAttribute("data-phase", "hold");
    this.root.classList.add("is-muted-secondary");
    this.setNodeLayout(cloneLayout(FINAL), false);
    this.setEdgesDrawn(this.edgesInitialG, false);
    this.setEdgesDrawn(this.edgesFinalG, true);
    // solid lines for static view
    Array.prototype.forEach.call(this.edgesFinalG.querySelectorAll(".wp-line"), function (path) {
      path.style.strokeDasharray = "none";
      path.style.strokeDashoffset = "0";
    });
    if (this.caption) this.caption.textContent = "Clarify";
  };

  ApproachWorkflowPreview.prototype.stop = function () {
    this.running = false;
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
  };

  ApproachWorkflowPreview.prototype.scheduleNext = function () {
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

  ApproachWorkflowPreview.prototype.start = function () {
    if (this.root.getAttribute("data-approach-active") === "false") return;
    if (this.reduced || this.running) return;
    if (document.visibilityState === "hidden" || !this.visible) return;
    this.running = true;
    this.root.removeAttribute("data-reduced");
    this.root.classList.remove("is-resetting");
    this.setPhase(0);
    this.scheduleNext();
  };

  ApproachWorkflowPreview.prototype.pause = function () {
    this.stop();
  };

  ApproachWorkflowPreview.prototype.bind = function () {
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
    document.querySelectorAll("[data-workflow-preview]").forEach(function (el) {
      new ApproachWorkflowPreview(el).bind();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
