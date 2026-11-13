/**
 * Approach page — full-shell sticky scrollytelling controller.
 * Native scroll only; maps scroll progress to steps 0–5.
 */
(function () {
  "use strict";

  var STEPS = [
    {
      title: "Understand the workflow and decision points",
      desc: "Map the real process, handoffs, and where judgement matters before designing screens.",
    },
    {
      title: "Define AI and human responsibilities",
      desc: "Be explicit about what the system proposes and what people must approve, edit, or override.",
    },
    {
      title: "Design trust, evidence and recovery",
      desc: "Surface status, sources, confidence, exceptions, and clear paths when the model is wrong.",
    },
    {
      title: "Prototype high-risk interactions",
      desc: "Validate the hardest interaction early — not the easiest happy path.",
    },
    {
      title: "Validate with users and delivery teams",
      desc: "Pressure-test with PMs, engineers, SMEs, and the people who use the product.",
    },
    {
      title: "Turn proven patterns into reusable systems",
      desc: "Convert what works into shared components and behaviours across products.",
    },
  ];

  function prefersReducedMotion() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function isMobileLayout() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 800px)").matches
    );
  }

  function ApproachScrolly(root) {
    this.root = root;
    this.shell = root.querySelector(".approach-page-shell");
    this.stage = root.querySelector(".approach-scrollytelling-stage");
    this.track = root.querySelector(".approach-scroll-track");
    this.titleEl = root.querySelector("[data-approach-title]");
    this.descEl = root.querySelector("[data-approach-desc]");
    this.buttons = Array.prototype.slice.call(
      root.querySelectorAll(".approach-rail__btn")
    );
    this.panels = Array.prototype.slice.call(
      root.querySelectorAll(".approach-panel")
    );
    this.stepCount = STEPS.length;
    this.activeIndex = -1;
    this.ticking = false;
    this.jumping = false;
  }

  ApproachScrolly.prototype.isClickMode = function () {
    return (
      this.root.getAttribute("data-approach-mode") === "click" ||
      this.root.classList.contains("approach-in-conversation") ||
      isMobileLayout()
    );
  };

  ApproachScrolly.prototype.previewRoot = function (panel) {
    return panel ? panel.querySelector(".approach-preview") : null;
  };

  ApproachScrolly.prototype.activatePreview = function (panel, on) {
    var preview = this.previewRoot(panel);
    if (!preview) return;
    preview.setAttribute("data-approach-active", on ? "true" : "false");
    preview.dispatchEvent(
      new CustomEvent(on ? "approach:activate" : "approach:deactivate", {
        bubbles: false,
      })
    );
  };

  ApproachScrolly.prototype.setStep = function (index, options) {
    options = options || {};
    index = Math.max(0, Math.min(this.stepCount - 1, index));
    if (index === this.activeIndex && !options.force) return;

    var prev = this.activeIndex;
    this.activeIndex = index;
    var step = STEPS[index];

    if (this.titleEl) this.titleEl.textContent = step.title;
    if (this.descEl) this.descEl.textContent = step.desc;

    this.buttons.forEach(function (btn, i) {
      var active = i === index;
      btn.classList.toggle("is-active", active);
      if (active) btn.setAttribute("aria-current", "step");
      else btn.removeAttribute("aria-current");
    });

    var self = this;
    this.panels.forEach(function (panel, i) {
      var active = i === index;
      panel.classList.toggle("is-active", active);
      if (active) {
        panel.hidden = false;
        void panel.offsetWidth;
        panel.classList.add("is-visible");
        self.activatePreview(panel, true);
      } else {
        panel.classList.remove("is-visible");
        self.activatePreview(panel, false);
        if (prev === i || options.force) {
          window.setTimeout(function () {
            if (!panel.classList.contains("is-active")) panel.hidden = true;
          }, 320);
        } else if (!panel.classList.contains("is-active")) {
          panel.hidden = true;
        }
      }
    });
  };

  ApproachScrolly.prototype.progressToIndex = function () {
    if (this.isClickMode()) {
      return this.activeIndex < 0 ? 0 : this.activeIndex;
    }

    var rect = this.root.getBoundingClientRect();
    var travel = Math.max(1, rect.height - window.innerHeight);
    var scrolled = Math.min(travel, Math.max(0, -rect.top));
    var progress = scrolled / travel;
    var index = Math.floor(progress * this.stepCount);
    if (progress >= 1) index = this.stepCount - 1;
    return Math.max(0, Math.min(this.stepCount - 1, index));
  };

  ApproachScrolly.prototype.onScroll = function () {
    if (this.jumping || this.isClickMode()) return;
    this.setStep(this.progressToIndex());
  };

  ApproachScrolly.prototype.requestScrollUpdate = function () {
    var self = this;
    if (this.ticking) return;
    this.ticking = true;
    window.requestAnimationFrame(function () {
      self.ticking = false;
      self.onScroll();
    });
  };

  ApproachScrolly.prototype.scrollToStep = function (index) {
    index = Math.max(0, Math.min(this.stepCount - 1, index));

    if (this.isClickMode()) {
      this.setStep(index, { force: true });
      return;
    }

    var rect = this.root.getBoundingClientRect();
    var absoluteTop = rect.top + window.scrollY;
    var travel = Math.max(1, this.root.offsetHeight - window.innerHeight);
    var target = absoluteTop + ((index + 0.35) / this.stepCount) * travel;

    this.jumping = true;
    this.setStep(index, { force: true });
    window.scrollTo({
      top: target,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });

    var self = this;
    window.setTimeout(
      function () {
        self.jumping = false;
        self.onScroll();
      },
      prefersReducedMotion() ? 40 : 500
    );
  };

  ApproachScrolly.prototype.bind = function () {
    var self = this;

    if (this.root._approachScrollyBound) {
      this.setStep(this.isClickMode() ? 0 : this.progressToIndex(), {
        force: true,
      });
      return this;
    }
    this.root._approachScrollyBound = true;

    this.buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var index = parseInt(btn.getAttribute("data-step"), 10);
        if (!isNaN(index)) self.scrollToStep(index);
      });
    });

    window.addEventListener(
      "scroll",
      function () {
        self.requestScrollUpdate();
      },
      { passive: true }
    );

    window.addEventListener("resize", function () {
      self.requestScrollUpdate();
    });

    this.setStep(this.isClickMode() ? 0 : this.progressToIndex(), {
      force: true,
    });
    return this;
  };

  function initRoot(el) {
    if (!el) return null;
    if (el._approachScrollyInstance) {
      return el._approachScrollyInstance.bind();
    }
    var instance = new ApproachScrolly(el);
    el._approachScrollyInstance = instance;
    instance.bind();
    return instance;
  }

  function init() {
    document.querySelectorAll("[data-approach-scrolly]").forEach(initRoot);
  }

  window.ApproachScrolly = {
    init: init,
    initRoot: initRoot,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
