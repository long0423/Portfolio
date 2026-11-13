/**
 * Approach point 6 — Turn proven patterns into reusable systems.
 * Same geometry language as the other Approach previews.
 */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var VIEW_W = 560;
  var VIEW_H = 280;

  var NODE_R = 10;
  var NODE_R_SMALL = 7;
  var CONTAINER_R = 16;
  var EDGE_RADIUS = 10;
  var EDGE_RADIUS_MOBILE = 8;

  var PRODUCT_IDS = ["a", "b", "c"];
  var PATTERN_IDS = ["composer", "loading", "result", "error"];

  /** Desktop: three products across top, shared system below */
  var DESKTOP = {
    products: {
      a: { id: "a", label: "Product A", x: 24, y: 16, w: 160, h: 96 },
      b: { id: "b", label: "Product B", x: 200, y: 16, w: 160, h: 96 },
      c: { id: "c", label: "Product C", x: 376, y: 16, w: 160, h: 96 },
    },
    system: { x: 120, y: 144, w: 320, h: 120, label: "Shared system" },
    patterns: {
      composer: { id: "composer", label: "Composer", x: 136, y: 172, w: 136, h: 36 },
      loading: { id: "loading", label: "Loading", x: 288, y: 172, w: 136, h: 36 },
      result: { id: "result", label: "Result", x: 136, y: 220, w: 136, h: 36 },
      error: { id: "error", label: "Error", x: 288, y: 220, w: 136, h: 36 },
    },
  };

  /** Mobile: two products + indicator, system below with stacked patterns */
  var MOBILE = {
    products: {
      a: { id: "a", label: "Product A", x: 24, y: 8, w: 200, h: 72 },
      b: { id: "b", label: "Product B", x: 240, y: 8, w: 200, h: 72 },
      c: { id: "c", label: "Product C", x: 456, y: 8, w: 80, h: 72, compact: true },
    },
    system: { x: 40, y: 104, w: 480, h: 160, label: "Shared system" },
    patterns: {
      composer: { id: "composer", label: "Composer", x: 56, y: 132, w: 216, h: 32 },
      loading: { id: "loading", label: "Loading", x: 288, y: 132, w: 216, h: 32 },
      result: { id: "result", label: "Result", x: 56, y: 176, w: 216, h: 32 },
      error: { id: "error", label: "Error", x: 288, y: 176, w: 216, h: 32 },
    },
  };

  /**
   * Intentional initial inconsistency per product (designed offsets).
   * Keys: composer/loading/result mini-blocks inside each product.
   */
  var PRODUCT_VARIANTS = {
    a: {
      composer: { x: 12, y: 28, w: 120, h: 18, r: 8 },
      loading: { x: 12, y: 52, w: 88, h: 10, r: 5 },
      result: { x: 12, y: 68, w: 104, h: 14, r: 7 },
    },
    b: {
      composer: { x: 16, y: 30, w: 128, h: 18, r: 10 },
      loading: { x: 16, y: 54, w: 96, h: 10, r: 4 },
      result: { x: 16, y: 70, w: 112, h: 14, r: 8 },
    },
    c: {
      composer: { x: 14, y: 28, w: 112, h: 18, r: 6 },
      loading: { x: 14, y: 52, w: 80, h: 10, r: 6 },
      result: { x: 14, y: 68, w: 120, h: 14, r: 9 },
    },
  };

  var PRODUCT_VARIANTS_MOBILE = {
    a: {
      composer: { x: 12, y: 26, w: 140, h: 14, r: 7 },
      loading: { x: 12, y: 46, w: 100, h: 8, r: 4 },
      result: { x: 12, y: 58, w: 120, h: 8, r: 4 },
    },
    b: {
      composer: { x: 14, y: 28, w: 148, h: 14, r: 9 },
      loading: { x: 14, y: 48, w: 108, h: 8, r: 5 },
      result: { x: 14, y: 60, w: 128, h: 8, r: 5 },
    },
    c: {
      composer: { x: 12, y: 28, w: 56, h: 12, r: 6 },
      loading: { x: 12, y: 46, w: 40, h: 8, r: 4 },
      result: { x: 12, y: 58, w: 48, h: 8, r: 4 },
    },
  };

  /** Standardised product internals (final reuse state) */
  var PRODUCT_STANDARD = {
    composer: { x: 14, y: 28, w: 120, h: 18, r: 8 },
    loading: { x: 14, y: 52, w: 92, h: 10, r: 5 },
    result: { x: 14, y: 68, w: 108, h: 14, r: 7 },
  };

  var PRODUCT_STANDARD_MOBILE = {
    composer: { x: 12, y: 26, w: 140, h: 14, r: 7 },
    loading: { x: 12, y: 46, w: 104, h: 8, r: 4 },
    result: { x: 12, y: 58, w: 124, h: 8, r: 4 },
  };

  var PHASES = [
    { name: "separate", caption: "Identify", duration: 1400 },
    { name: "identify", caption: "Identify", duration: 1300 },
    { name: "extract", caption: "Extract", duration: 1500 },
    { name: "standardise", caption: "Standardise", duration: 1300 },
    { name: "reuse", caption: "Reuse", duration: 1300 },
    { name: "hold", caption: "Reuse", duration: 800 },
    { name: "reset", caption: "Reuse", duration: 400 },
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

  function layoutConfig() {
    return isMobile() ? MOBILE : DESKTOP;
  }

  function productVariants() {
    return isMobile() ? PRODUCT_VARIANTS_MOBILE : PRODUCT_VARIANTS;
  }

  function productStandard() {
    return isMobile() ? PRODUCT_STANDARD_MOBILE : PRODUCT_STANDARD;
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

  function portsFor(box) {
    return {
      top: { x: box.x + box.w / 2, y: box.y },
      right: { x: box.x + box.w, y: box.y + box.h / 2 },
      bottom: { x: box.x + box.w / 2, y: box.y + box.h },
      left: { x: box.x, y: box.y + box.h / 2 },
    };
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

  function edgeD(fromBox, fromPort, toBox, toPort) {
    var a = portsFor(fromBox)[fromPort];
    var b = portsFor(toBox)[toPort];
    var pts = orthogonalWaypoints(
      a.x,
      a.y,
      fromPort,
      b.x,
      b.y,
      toPort
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

  function measurePath(path) {
    try {
      return path.getTotalLength();
    } catch (err) {
      return 120;
    }
  }

  function buildMiniBlock(spec, className) {
    return el("rect", {
      class: className,
      x: String(spec.x),
      y: String(spec.y),
      width: String(spec.w),
      height: String(spec.h),
      rx: String(spec.r),
      ry: String(spec.r),
    });
  }

  function buildProductGroup(product, variants) {
    var g = el("g", {
      class:
        "sys-product" +
        (product.compact ? " is-compact" : "") +
        " sys-product--" +
        product.id,
      "data-product": product.id,
      transform: "translate(" + product.x + " " + product.y + ")",
    });

    g.appendChild(
      el("rect", {
        class: "sys-product-frame",
        x: "0",
        y: "0",
        width: String(product.w),
        height: String(product.h),
        rx: String(CONTAINER_R),
        ry: String(CONTAINER_R),
      })
    );

    var label = el("text", {
      class: "sys-product-label",
      x: "12",
      y: "18",
    });
    label.textContent = product.compact ? "P" + product.id.toUpperCase() : product.label;
    g.appendChild(label);

    var internals = el("g", { class: "sys-product-internals" });
    var v = variants[product.id];
    internals.appendChild(
      buildMiniBlock(v.composer, "sys-mini sys-mini--composer is-variant")
    );
    internals.appendChild(
      buildMiniBlock(v.loading, "sys-mini sys-mini--loading is-variant")
    );
    internals.appendChild(
      buildMiniBlock(v.result, "sys-mini sys-mini--result is-variant")
    );

    // Standardised layer (hidden until reuse)
    var std = productStandard();
    var stdG = el("g", { class: "sys-product-standard" });
    if (!product.compact) {
      stdG.appendChild(
        buildMiniBlock(std.composer, "sys-mini sys-mini--composer is-standard")
      );
      stdG.appendChild(
        buildMiniBlock(std.loading, "sys-mini sys-mini--loading is-standard")
      );
      stdG.appendChild(
        buildMiniBlock(std.result, "sys-mini sys-mini--result is-standard")
      );
    } else {
      var compactStd = {
        composer: { x: 12, y: 28, w: 56, h: 12, r: 6 },
        loading: { x: 12, y: 46, w: 44, h: 8, r: 4 },
        result: { x: 12, y: 58, w: 48, h: 8, r: 4 },
      };
      stdG.appendChild(
        buildMiniBlock(
          compactStd.composer,
          "sys-mini sys-mini--composer is-standard"
        )
      );
      stdG.appendChild(
        buildMiniBlock(
          compactStd.loading,
          "sys-mini sys-mini--loading is-standard"
        )
      );
      stdG.appendChild(
        buildMiniBlock(compactStd.result, "sys-mini sys-mini--result is-standard")
      );
    }

    g.appendChild(internals);
    g.appendChild(stdG);
    return g;
  }

  function buildPatternCard(pattern) {
    var g = el("g", {
      class: "sys-pattern sys-pattern--" + pattern.id,
      "data-pattern": pattern.id,
      transform: "translate(" + pattern.x + " " + pattern.y + ")",
    });

    g.appendChild(
      el("rect", {
        class: "sys-pattern-card",
        x: "0",
        y: "0",
        width: String(pattern.w),
        height: String(pattern.h),
        rx: String(NODE_R),
        ry: String(NODE_R),
      })
    );

    var label = el("text", {
      class: "sys-pattern-label",
      x: "12",
      y: String(pattern.h / 2 + 0.5),
      "dominant-baseline": "middle",
    });
    label.textContent = pattern.label;
    g.appendChild(label);

    var mark = el("g", {
      class: "sys-pattern-mark",
      transform:
        "translate(" + (pattern.w - 36) + " " + (pattern.h / 2 - 5) + ")",
    });

    if (pattern.id === "composer") {
      mark.appendChild(
        el("rect", {
          class: "sys-mark-line",
          x: "0",
          y: "3",
          width: "16",
          height: "3",
          rx: "1.5",
        })
      );
      mark.appendChild(
        el("circle", {
          class: "sys-mark-dot",
          cx: "24",
          cy: "5",
          r: "4",
        })
      );
    } else if (pattern.id === "loading") {
      mark.appendChild(
        el("rect", {
          class: "sys-mark-line",
          x: "0",
          y: "1",
          width: "22",
          height: "3",
          rx: "1.5",
        })
      );
      mark.appendChild(
        el("rect", {
          class: "sys-mark-line",
          x: "0",
          y: "7",
          width: "14",
          height: "3",
          rx: "1.5",
        })
      );
    } else if (pattern.id === "result") {
      mark.appendChild(
        el("rect", {
          class: "sys-mark-line",
          x: "0",
          y: "0",
          width: "20",
          height: "3",
          rx: "1.5",
        })
      );
      mark.appendChild(
        el("rect", {
          class: "sys-mark-line",
          x: "0",
          y: "6",
          width: "26",
          height: "3",
          rx: "1.5",
        })
      );
    } else {
      mark.appendChild(
        el("rect", {
          class: "sys-mark-line",
          x: "0",
          y: "1",
          width: "18",
          height: "3",
          rx: "1.5",
        })
      );
      mark.appendChild(
        el("rect", {
          class: "sys-mark-chip",
          x: "0",
          y: "6",
          width: "14",
          height: "6",
          rx: "3",
        })
      );
    }

    g.appendChild(mark);
    return g;
  }

  function ReusableSystemPreview(root) {
    this.root = root;
    this.caption = root.querySelector(".workflow-preview-caption");
    this.svg = null;
    this.extractionG = null;
    this.reuseG = null;
    this.productEls = {};
    this.patternEls = {};
    this.systemG = null;
    this.phaseIndex = 0;
    this.timer = null;
    this.identifyTimer = null;
    this.visible = false;
    this.running = false;
    this.reduced = prefersReducedMotion();
  }

  ReusableSystemPreview.prototype.buildEdges = function (cfg, group, kind) {
    var self = this;
    PRODUCT_IDS.forEach(function (id) {
      var product = cfg.products[id];
      var system = cfg.system;
      var d;
      if (kind === "extract") {
        d = edgeD(product, "bottom", system, "top");
      } else {
        d = edgeD(system, "top", product, "bottom");
      }
      var path = el("path", {
        class:
          "wp-line " +
          (kind === "extract" ? "wp-line--secondary sys-edge--extract" : "wp-line--primary sys-edge--reuse"),
        d: d,
        "data-edge": kind + "-" + id,
        fill: "none",
      });
      path.style.strokeDasharray = "160";
      path.style.strokeDashoffset = "160";
      group.appendChild(path);
    });

    Array.prototype.forEach.call(group.querySelectorAll(".wp-line"), function (
      path
    ) {
      var len = measurePath(path);
      path.style.strokeDasharray = String(len);
      path.style.strokeDashoffset = String(len);
      path.setAttribute("data-length", String(len));
    });
  };

  ReusableSystemPreview.prototype.mount = function () {
    var existing = this.root.querySelector(".workflow-preview-svg");
    if (existing) existing.remove();

    var cfg = layoutConfig();
    var variants = productVariants();

    var svg = el("svg", {
      class: "workflow-preview-svg",
      viewBox: "0 0 " + VIEW_W + " " + VIEW_H,
      "aria-hidden": "true",
      focusable: "false",
    });

    var backgrounds = el("g", { class: "system-backgrounds" });
    var extraction = el("g", {
      class: "extraction-edges workflow-edges",
    });
    var reuse = el("g", { class: "reuse-edges workflow-edges" });
    var productsG = el("g", { class: "product-containers" });
    var shared = el("g", { class: "shared-system" });
    var patternsG = el("g", { class: "pattern-components" });

    // Shared system container
    shared.appendChild(
      el("rect", {
        class: "sys-system-frame",
        x: String(cfg.system.x),
        y: String(cfg.system.y),
        width: String(cfg.system.w),
        height: String(cfg.system.h),
        rx: String(CONTAINER_R),
        ry: String(CONTAINER_R),
      })
    );
    var sysLabel = el("text", {
      class: "sys-system-label",
      x: String(cfg.system.x + 16),
      y: String(cfg.system.y + 20),
    });
    sysLabel.textContent = cfg.system.label;
    shared.appendChild(sysLabel);
    backgrounds.appendChild(shared);

    var self = this;
    PRODUCT_IDS.forEach(function (id) {
      var group = buildProductGroup(cfg.products[id], variants);
      productsG.appendChild(group);
      self.productEls[id] = group;
    });

    PATTERN_IDS.forEach(function (id) {
      var card = buildPatternCard(cfg.patterns[id]);
      patternsG.appendChild(card);
      self.patternEls[id] = card;
    });

    this.buildEdges(cfg, extraction, "extract");
    this.buildEdges(cfg, reuse, "reuse");

    svg.appendChild(backgrounds);
    svg.appendChild(extraction);
    svg.appendChild(reuse);
    svg.appendChild(productsG);
    svg.appendChild(patternsG);

    if (this.caption) {
      this.root.insertBefore(svg, this.caption);
    } else {
      this.root.appendChild(svg);
    }

    this.svg = svg;
    this.extractionG = extraction;
    this.reuseG = reuse;
    this.systemG = shared;
    this.cfg = cfg;
  };

  ReusableSystemPreview.prototype.setEdgesDrawn = function (group, drawn) {
    if (!group) return;
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

  ReusableSystemPreview.prototype.clearIdentify = function () {
    if (this.identifyTimer) {
      window.clearTimeout(this.identifyTimer);
      this.identifyTimer = null;
    }
    PRODUCT_IDS.forEach(
      function (id) {
        var g = this.productEls[id];
        if (!g) return;
        g.classList.remove("is-scanning");
        Array.prototype.forEach.call(g.querySelectorAll(".sys-mini"), function (
          mini
        ) {
          mini.classList.remove("is-focused");
        });
      }.bind(this)
    );
  };

  ReusableSystemPreview.prototype.runIdentify = function () {
    var self = this;
    this.clearIdentify();
    var types = ["composer", "loading", "result"];
    var i = 0;
    var step = function () {
      PRODUCT_IDS.forEach(function (id) {
        var g = self.productEls[id];
        if (!g) return;
        Array.prototype.forEach.call(g.querySelectorAll(".sys-mini"), function (
          mini
        ) {
          mini.classList.remove("is-focused");
        });
      });
      if (i >= types.length) return;
      var type = types[i];
      PRODUCT_IDS.forEach(function (id) {
        var g = self.productEls[id];
        if (!g) return;
        var mini = g.querySelector(".sys-mini--" + type + ".is-variant");
        if (mini) mini.classList.add("is-focused");
      });
      i += 1;
      self.identifyTimer = window.setTimeout(step, 320);
    };
    step();
  };

  ReusableSystemPreview.prototype.setPhase = function (index) {
    var phase = PHASES[index];
    if (!phase) return;
    this.phaseIndex = index;
    this.root.setAttribute("data-phase", phase.name);
    if (this.caption) this.caption.textContent = phase.caption;

    if (phase.name === "separate") {
      this.clearIdentify();
      this.root.classList.remove(
        "is-system-visible",
        "is-extracted",
        "is-standardised",
        "is-reused"
      );
      this.setEdgesDrawn(this.extractionG, false);
      this.setEdgesDrawn(this.reuseG, false);
      void this.root.offsetWidth;
    }

    if (phase.name === "identify") {
      this.root.classList.add("is-system-visible");
      this.root.classList.remove("is-extracted", "is-standardised", "is-reused");
      this.setEdgesDrawn(this.extractionG, false);
      this.setEdgesDrawn(this.reuseG, false);
      this.runIdentify();
    }

    if (phase.name === "extract") {
      this.clearIdentify();
      this.root.classList.add("is-system-visible", "is-extracted");
      this.root.classList.remove("is-standardised", "is-reused");
      this.setEdgesDrawn(this.extractionG, true);
      this.setEdgesDrawn(this.reuseG, false);
    }

    if (phase.name === "standardise") {
      this.clearIdentify();
      this.root.classList.add(
        "is-system-visible",
        "is-extracted",
        "is-standardised"
      );
      this.root.classList.remove("is-reused");
      this.setEdgesDrawn(this.extractionG, false);
      this.setEdgesDrawn(this.reuseG, false);
    }

    if (phase.name === "reuse" || phase.name === "hold") {
      this.clearIdentify();
      this.root.classList.add(
        "is-system-visible",
        "is-extracted",
        "is-standardised",
        "is-reused"
      );
      this.setEdgesDrawn(this.extractionG, false);
      this.setEdgesDrawn(this.reuseG, true);
    }

    if (phase.name === "reset") {
      this.root.classList.add("is-resetting");
    }
  };

  ReusableSystemPreview.prototype.showStaticFinal = function () {
    this.stop();
    this.root.classList.remove("is-resetting");
    this.root.classList.add(
      "is-system-visible",
      "is-extracted",
      "is-standardised",
      "is-reused"
    );
    this.root.setAttribute("data-reduced", "true");
    this.root.setAttribute("data-phase", "hold");
    this.setEdgesDrawn(this.extractionG, false);
    this.setEdgesDrawn(this.reuseG, true);
    Array.prototype.forEach.call(this.reuseG.querySelectorAll(".wp-line"), function (
      path
    ) {
      path.style.strokeDasharray = "none";
      path.style.strokeDashoffset = "0";
      path.style.transitionDelay = "0ms";
    });
    if (this.caption) this.caption.textContent = "Reuse";
  };

  ReusableSystemPreview.prototype.stop = function () {
    this.running = false;
    if (this.timer) {
      window.clearTimeout(this.timer);
      this.timer = null;
    }
    this.clearIdentify();
  };

  ReusableSystemPreview.prototype.scheduleNext = function () {
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

  ReusableSystemPreview.prototype.start = function () {
    if (this.root.getAttribute("data-approach-active") === "false") return;
    if (this.reduced || this.running) return;
    if (document.visibilityState === "hidden" || !this.visible) return;
    this.running = true;
    this.root.removeAttribute("data-reduced");
    this.root.classList.remove("is-resetting");
    this.setPhase(0);
    this.scheduleNext();
  };

  ReusableSystemPreview.prototype.pause = function () {
    this.stop();
  };

  ReusableSystemPreview.prototype.bind = function () {
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
    document.querySelectorAll("[data-system-preview]").forEach(function (el) {
      new ReusableSystemPreview(el).bind();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
