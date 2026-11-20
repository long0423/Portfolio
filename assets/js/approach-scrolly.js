/**
 * Approach page — stage controller.
 * Embedded in the workspace it runs in click mode; as a standalone page it maps
 * native scroll progress to stages 0–5. Every stage change is announced with an
 * `approach:step` event, which drives the 3D stage (assets/js/approach-3d/main.js).
 */
(function () {
  "use strict";

  var STEPS = [
    {
      title: "Frame the opportunity",
      desc: "I bring together goals, constraints and existing knowledge to frame the opportunity — giving AI enough context to start exploring meaningful solutions.",
      scene: "Working from his laptop, the designer gathers requirements, customer feedback, goals and constraints on the wall display; they sort into columns and converge into one focused brief.",
    },
    {
      title: "Prototype first",
      desc: "I use AI to make ideas tangible early, turning a focused brief into a working prototype that people can explore and question — learning through interaction, not static concepts.",
      scene: "The brief docks into an AI workspace. A working support inbox assembles from components, and selecting a request opens it with an AI-drafted reply.",
    },
    {
      title: "Direct the experience",
      desc: "I refine the experience through rapid critique and iteration — shaping flows, information architecture, interaction states, accessibility and visual consistency.",
      scene: "The designer points out a buried reply action and a crowded navigation, then types his direction to the AI: the reply moves to the top, order details become light context and the actions become consistent.",
    },
    {
      title: "Challenge with evidence",
      desc: "I put the prototype in front of real scenarios and people, using feedback and evidence to challenge assumptions before they become expensive decisions.",
      scene: "A support lead reviews the prototype with the designer. Pointing to the Send button on the wall display, she raises that agents need to check a draft before it sends; he adds a review step from his laptop, and she confirms the revised Review & send flow.",
    },
    {
      title: "Build with fidelity",
      desc: "I extended our enterprise design system with AI-native patterns and distilled its principles into a reusable UX skill, helping developers build with AI while preserving design fidelity.",
      scene: "The designer presents Relay UI, his AI-native design system of tokens, components and AI patterns, on the wall display and distils it into a reusable UX skill. Seated at his workstation with his screen shared, the engineer asks his AI coding assistant to build the reply draft; it applies the skill and uses the system's components. The designer points out a plain Send where the design specifies Review & send; the engineer fixes it and the build matches the design.",
    },
    {
      title: "Iterate & ship",
      desc: "With AI-assisted development, I turn feedback into focused UI and UX improvements, validate changes in code, and open pull requests for review.",
      scene: "Support feedback shows agents can't tell whether a draft has been reviewed, and a small fix is agreed. The designer types the change for an AI assistant with his screen shared on the wall display, accepts a new review-state badge in the code, compares before and after in the preview, runs local checks and opens a pull request that waits for team review.",
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
    this.sceneEl = root.querySelector("[data-approach-3d]");
    this.buttons = Array.prototype.slice.call(
      root.querySelectorAll(".approach-rail__btn")
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

  ApproachScrolly.prototype.setStep = function (index, options) {
    options = options || {};
    index = Math.max(0, Math.min(this.stepCount - 1, index));
    if (index === this.activeIndex && !options.force) return;

    var prev = this.activeIndex;
    this.activeIndex = index;
    var step = STEPS[index];

    if (this.titleEl) this.titleEl.textContent = step.title;
    if (this.descEl) this.descEl.textContent = step.desc;
    if (this.sceneEl) {
      this.sceneEl.setAttribute("aria-label", step.scene);
      this.sceneEl.setAttribute("data-stage", String(index + 1));
    }

    this.buttons.forEach(function (btn, i) {
      var active = i === index;
      btn.classList.toggle("is-active", active);
      if (active) btn.setAttribute("aria-current", "step");
      else btn.removeAttribute("aria-current");
    });

    if (prev !== index) {
      this.root.dispatchEvent(new CustomEvent("approach:step", { detail: { index: index } }));
    }
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

  // Reserve the height of the longest title and description at the current width so the stage
  // below never moves between stages: invisible copies of every stage's text share one grid
  // cell with the live element, which stays the only announced content.
  ApproachScrolly.prototype.reserveCopySpace = function () {
    [
      [this.titleEl, "title"],
      [this.descEl, "desc"],
    ].forEach(function (pair) {
      var el = pair[0];
      if (!el || !el.parentNode || el.parentNode.classList.contains("approach-copy-slot")) return;
      var slot = document.createElement("div");
      slot.className = "approach-copy-slot";
      el.parentNode.insertBefore(slot, el);
      slot.appendChild(el);
      STEPS.forEach(function (step) {
        var sizer = document.createElement(el.tagName === "P" ? "p" : "div");
        sizer.className = el.className + " approach-copy-sizer";
        sizer.setAttribute("aria-hidden", "true");
        sizer.textContent = step[pair[1]];
        slot.appendChild(sizer);
      });
    });
  };

  ApproachScrolly.prototype.bind = function () {
    var self = this;
    this.reserveCopySpace();

    if (this.root._approachScrollyBound) {
      this.setStep(this.isClickMode() ? 0 : this.progressToIndex(), {
        force: true,
      });
      return this;
    }
    this.root._approachScrollyBound = true;

    this.buttons.forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        var index = parseInt(btn.getAttribute("data-step"), 10);
        if (!isNaN(index)) self.scrollToStep(index);
      });
      btn.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = Math.min(self.stepCount - 1, i + 1);
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = Math.max(0, i - 1);
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = self.stepCount - 1;
        if (next === null) return;
        e.preventDefault();
        self.buttons[next].focus();
        self.buttons[next].click();
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
