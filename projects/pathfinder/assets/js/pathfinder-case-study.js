/**
 * Pathfinder case study interactions.
 * Image enlargement follows the shared Write modal. Bootstrap owns the carousel.
 */
(function () {
  "use strict";

  var lastFocus = null;
  var previousOverflow = "";

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function initLightbox() {
    var modal = document.getElementById("imageModal");
    var modalImage = document.getElementById("modalImage");
    var closeBtn = document.getElementById("closeModal");
    if (!modal || !modalImage || !closeBtn || modal.dataset.bound === "1") return;
    modal.dataset.bound = "1";

    function close() {
      if (!modal.classList.contains("active")) return;
      modal.classList.remove("active");
      document.body.style.overflow = previousOverflow;
      modalImage.removeAttribute("src");
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
      lastFocus = null;
    }

    document.querySelectorAll("[data-full-image]").forEach(function (trigger) {
      if (!trigger.getAttribute("aria-label")) {
        trigger.setAttribute("aria-label", "View larger image: " + (trigger.getAttribute("data-alt") || "screenshot"));
      }
      trigger.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        lastFocus = trigger;
        previousOverflow = document.body.style.overflow;
        modalImage.src = trigger.getAttribute("data-full-image");
        modalImage.alt = trigger.getAttribute("data-alt") || (trigger.querySelector("img") && trigger.querySelector("img").alt) || "";
        modal.classList.add("active");
        document.body.style.overflow = "hidden";
        closeBtn.focus();
      });
    });

    closeBtn.addEventListener("click", close);
    modal.addEventListener("click", function (event) {
      if (event.target === modal) close();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });
  }

  function initTop() {
    var btn = document.getElementById("pf-top");
    if (!btn) return;
    function onScroll() {
      btn.classList.toggle("is-visible", window.scrollY > 360);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (typeof lucide !== "undefined" && lucide.createIcons) {
      lucide.createIcons({ attrs: { "stroke-width": 1.75 } });
    }
    if (window.GlobalSidebar) {
      GlobalSidebar.init({
        defaultCollapsed: true,
        activeNav: "work",
        activeProjectId: "pathfinder",
        mode: "case-study",
        workHref: "Me.html#la-featured"
      });
    }
    initLightbox();
    initTop();
    var hash = (location.hash || "").replace("#", "");
    if (hash && hash.charAt(0) !== "/") {
      var target = document.getElementById(hash);
      if (target) target.scrollIntoView({ behavior: "auto", block: "start" });
    }
  });
})();
