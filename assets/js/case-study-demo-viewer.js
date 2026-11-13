/**
 * Reusable cinematic demo viewer for case studies.
 * Video sources are assigned only after the user opens a demo.
 */
(function (window, document) {
  "use strict";

  var caseStudyDemos = {
    createReport: {
      src: "assets/videos/create-report-demo.mp4",
      poster: "assets/images/Write-optimised-1.png",
      title: "Create a Report"
    },
    evidence: {
      src: "assets/videos/evidence-demo.mp4",
      poster: "assets/images/Write-optimised-2.png",
      title: "Evidence & References"
    },
    showEdits: {
      src: "assets/videos/show-edits-demo.mp4",
      poster: "assets/images/Write-optimised-4.png",
      title: "Show Edits & Comments"
    },
    liveCollaboration: {
      src: "assets/videos/live-collaboration-demo.mp4",
      poster: "assets/images/Write-share-1.png",
      title: "Live Collaboration"
    },
    promptHistory: {
      src: "assets/videos/prompt-history-demo.mp4",
      poster: "assets/images/Write-prompt-history-1.png",
      title: "Prompt History"
    }
  };

  var SPINNER_DELAY = 400;
  var CLOSE_MS = 180;

  var state = {
    open: false,
    closing: false,
    ready: false,
    buffering: false,
    intent: "play",
    resumeAttempts: 0,
    demo: null,
    video: null,
    videoListeners: [],
    nodes: null,
    lastFocused: null,
    spinnerTimer: null,
    progressRaf: null,
    bound: false
  };

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function refreshIcons(root) {
    if (typeof lucide === "undefined" || typeof lucide.createIcons !== "function") return;
    try {
      lucide.createIcons({ attrs: { "stroke-width": 1.75 }, root: root || document });
    } catch (err) {
      lucide.createIcons({ attrs: { "stroke-width": 1.75 } });
    }
  }

  function definedProps(obj) {
    var out = {};
    if (!obj) return out;
    Object.keys(obj).forEach(function (key) {
      if (obj[key] != null && obj[key] !== "") out[key] = obj[key];
    });
    return out;
  }

  function resolveDemo(input) {
    if (!input) return null;
    if (typeof input === "string") {
      return caseStudyDemos[input] ? Object.assign({}, caseStudyDemos[input]) : null;
    }
    var base = input.id && caseStudyDemos[input.id] ? caseStudyDemos[input.id] : {};
    var demo = Object.assign({}, base, definedProps(input));
    if (!demo.src) return null;
    demo.title = demo.title || "Product demo";
    return demo;
  }

  function demoFromTrigger(el) {
    if (!el) return null;
    return resolveDemo({
      id: el.getAttribute("data-case-study-demo"),
      src: el.getAttribute("data-demo-src"),
      poster: el.getAttribute("data-demo-poster"),
      title: el.getAttribute("data-demo-title")
    });
  }

  function lockScroll() {
    document.documentElement.classList.add("cs-demo-scroll-lock");
    document.body.classList.add("cs-demo-scroll-lock");
  }

  function unlockScroll() {
    document.documentElement.classList.remove("cs-demo-scroll-lock");
    document.body.classList.remove("cs-demo-scroll-lock");
  }

  function ensureViewer() {
    if (state.nodes) return state.nodes;

    var root = document.createElement("div");
    root.className = "cs-demo-viewer";
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    root.innerHTML =
      '<div class="cs-demo-viewer__backdrop" data-cs-demo-close="true"></div>' +
      '<button type="button" class="cs-demo-viewer__close" title="Close" aria-label="Close demo">' +
        '<i data-lucide="x" aria-hidden="true"></i>' +
      "</button>" +
      '<div class="cs-demo-viewer__dialog" role="dialog" aria-modal="true" aria-label="Product demo">' +
        '<div class="cs-demo-viewer__stage">' +
          '<img class="cs-demo-viewer__poster" alt="">' +
          '<div class="cs-demo-viewer__spinner" aria-hidden="true"></div>' +
          '<button type="button" class="cs-demo-viewer__overlay-btn cs-demo-viewer__play" hidden title="Play" aria-label="Play demo">' +
            '<i data-lucide="play" aria-hidden="true"></i>' +
          "</button>" +
          '<button type="button" class="cs-demo-viewer__overlay-btn cs-demo-viewer__replay" hidden title="Replay" aria-label="Replay demo">' +
            '<i data-lucide="rotate-ccw" aria-hidden="true"></i>' +
          "</button>" +
          '<div class="cs-demo-viewer__progress" aria-hidden="true">' +
            '<span class="cs-demo-viewer__progress-bar"></span>' +
          "</div>" +
        "</div>" +
      "</div>";

    document.body.appendChild(root);
    refreshIcons(root);

    state.nodes = {
      root: root,
      dialog: root.querySelector(".cs-demo-viewer__dialog"),
      stage: root.querySelector(".cs-demo-viewer__stage"),
      poster: root.querySelector(".cs-demo-viewer__poster"),
      close: root.querySelector(".cs-demo-viewer__close"),
      play: root.querySelector(".cs-demo-viewer__play"),
      replay: root.querySelector(".cs-demo-viewer__replay"),
      progress: root.querySelector(".cs-demo-viewer__progress-bar")
    };

    root.addEventListener("click", function (event) {
      if (event.target.closest("[data-cs-demo-close]")) closeCaseStudyDemo();
    });
    state.nodes.close.addEventListener("click", closeCaseStudyDemo);
    state.nodes.stage.addEventListener("click", function (event) {
      if (event.target.closest(".cs-demo-viewer__overlay-btn")) return;
      togglePlayback();
    });
    state.nodes.play.addEventListener("click", function (event) {
      event.stopPropagation();
      playVideo();
    });
    state.nodes.replay.addEventListener("click", function (event) {
      event.stopPropagation();
      replayVideo();
    });

    return state.nodes;
  }

  function bindGlobalEvents() {
    if (state.bound) return;
    state.bound = true;
    document.addEventListener("keydown", onKeydown);
  }

  function onKeydown(event) {
    if (!state.open) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeCaseStudyDemo();
      return;
    }
    if (event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      if (state.video && state.video.ended) replayVideo();
      else togglePlayback();
    }
  }

  function clearSpinnerTimer() {
    if (state.spinnerTimer) {
      window.clearTimeout(state.spinnerTimer);
      state.spinnerTimer = null;
    }
  }

  function setLoading(isLoading) {
    if (!state.nodes) return;
    state.nodes.root.classList.toggle("is-loading", !!isLoading);
  }

  function setProgress(ratio) {
    if (!state.nodes || !state.nodes.progress) return;
    var value = Math.max(0, Math.min(1, ratio || 0));
    state.nodes.progress.style.transform = "scaleX(" + value + ")";
  }

  function stopProgress() {
    if (state.progressRaf) {
      window.cancelAnimationFrame(state.progressRaf);
      state.progressRaf = null;
    }
  }

  function tickProgress() {
    if (!state.video || !state.open) return;
    var duration = state.video.duration;
    if (duration && isFinite(duration)) {
      setProgress(state.video.currentTime / duration);
    }
    state.progressRaf = window.requestAnimationFrame(tickProgress);
  }

  function isNativeEnded(video) {
    return !!(video && video.ended === true);
  }

  function updatePlaybackUI() {
    if (!state.nodes) return;
    var video = state.video;
    var ended = isNativeEnded(video);
    var showPlay = !!(
      video &&
      state.ready &&
      !ended &&
      !state.buffering &&
      state.intent === "pause"
    );
    state.nodes.root.classList.toggle("is-ended", ended);
    state.nodes.root.classList.toggle("is-paused", showPlay);
    state.nodes.play.hidden = !showPlay;
    state.nodes.replay.hidden = !ended;
  }

  function playVideo() {
    var video = state.video;
    if (!video) return Promise.resolve();
    state.intent = "play";
    var playPromise = video.play();
    if (!playPromise || typeof playPromise.then !== "function") {
      updatePlaybackUI();
      return Promise.resolve();
    }
    return playPromise.then(function () {
      updatePlaybackUI();
    }).catch(function (error) {
      console.error("Unable to resume demo video", error);
      if (video.error) {
        console.error("MediaError", video.error.code, video.error.message);
      }
      updatePlaybackUI();
    });
  }

  function replayVideo() {
    var video = state.video;
    if (!video) return;
    state.intent = "play";
    state.buffering = false;
    state.resumeAttempts = 0;
    try {
      video.currentTime = 0;
    } catch (err) {}
    setProgress(0);
    playVideo();
  }

  function togglePlayback() {
    var video = state.video;
    if (!video) return;
    if (isNativeEnded(video)) {
      replayVideo();
      return;
    }
    if (state.intent === "pause" || video.paused) {
      playVideo();
      return;
    }
    state.intent = "pause";
    video.pause();
    updatePlaybackUI();
  }

  function onVideoPause(video) {
    if (!state.open || state.closing || state.video !== video) return;
    if (isNativeEnded(video)) {
      state.buffering = false;
      setLoading(false);
      updatePlaybackUI();
      return;
    }
    if (state.intent === "pause") {
      updatePlaybackUI();
      return;
    }
    state.buffering = true;
    setLoading(true);
    updatePlaybackUI();
    if (state.resumeAttempts < 2) {
      state.resumeAttempts += 1;
      playVideo();
    }
  }

  function onVideoWaiting() {
    if (!state.open || state.closing) return;
    state.buffering = true;
    setLoading(true);
    updatePlaybackUI();
  }

  function onVideoPlaying(video) {
    if (state.video !== video) return;
    state.buffering = false;
    state.resumeAttempts = 0;
    markReady();
    updatePlaybackUI();
  }

  function onVideoEnded(video) {
    if (state.video !== video) return;
    state.buffering = false;
    setLoading(false);
    updatePlaybackUI();
    if (video.duration && isFinite(video.duration)) setProgress(1);
  }

  function onVideoError(video) {
    clearSpinnerTimer();
    setLoading(false);
    if (video && video.error) {
      console.error("Demo video error", video.error.code, video.error.message);
    }
    updatePlaybackUI();
  }

  function bindVideo(video, handler, type) {
    video.addEventListener(type, handler);
    state.videoListeners.push({ video: video, type: type, handler: handler });
  }

  function unbindVideoListeners() {
    state.videoListeners.forEach(function (item) {
      item.video.removeEventListener(item.type, item.handler);
    });
    state.videoListeners = [];
  }

  function releaseVideo() {
    stopProgress();
    clearSpinnerTimer();
    setLoading(false);
    unbindVideoListeners();
    var video = state.video;
    state.video = null;
    state.ready = false;
    state.buffering = false;
    state.resumeAttempts = 0;
    if (!video) return;
    try {
      video.pause();
    } catch (err) {}
    video.removeAttribute("src");
    video.removeAttribute("poster");
    try {
      video.load();
    } catch (err) {}
    if (video.parentNode) video.parentNode.removeChild(video);
  }

  function applyMediaRatio(width, height) {
    if (!state.nodes || !state.nodes.dialog || !width || !height) return;
    var ratio = width / height;
    if (!isFinite(ratio) || ratio <= 0) return;
    state.nodes.dialog.style.setProperty("--cs-demo-ratio", width + " / " + height);
    state.nodes.dialog.style.setProperty("--cs-demo-ratio-num", String(ratio));
  }

  function applyVideoRatio() {
    var video = state.video;
    if (!video) return;
    applyMediaRatio(video.videoWidth, video.videoHeight);
  }

  function markReady() {
    if (!state.video || state.ready) return;
    state.ready = true;
    applyVideoRatio();
    clearSpinnerTimer();
    setLoading(false);
    state.video.classList.add("is-ready");
    updatePlaybackUI();
    if (!state.progressRaf) tickProgress();
  }

  function mountVideo(demo) {
    releaseVideo();
    var video = document.createElement("video");
    video.className = "cs-demo-viewer__video";
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.controls = false;
    video.preload = "auto";
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("muted", "");
    video.setAttribute("aria-label", demo.title);
    if (demo.poster) video.setAttribute("poster", demo.poster);

    bindVideo(video, function () { applyVideoRatio(); }, "loadedmetadata");
    bindVideo(video, function () { markReady(); }, "canplay");
    bindVideo(video, function () { onVideoPlaying(video); }, "playing");
    bindVideo(video, function () { onVideoWaiting(); }, "waiting");
    bindVideo(video, function () { onVideoWaiting(); }, "stalled");
    bindVideo(video, function () { onVideoPause(video); }, "pause");
    bindVideo(video, function () { updatePlaybackUI(); }, "play");
    bindVideo(video, function () { onVideoEnded(video); }, "ended");
    bindVideo(video, function () { onVideoError(video); }, "error");

    state.nodes.stage.appendChild(video);
    state.video = video;
    state.ready = false;
    state.buffering = false;
    state.intent = "play";
    state.resumeAttempts = 0;
    updatePlaybackUI();

    state.spinnerTimer = window.setTimeout(function () {
      if (!state.ready && state.open) setLoading(true);
    }, SPINNER_DELAY);

    video.src = demo.src;
    video.load();
    playVideo();
  }

  function resetViewer(demo) {
    state.nodes.dialog.setAttribute("aria-label", demo.title);
    state.nodes.poster.src = demo.poster || "";
    state.nodes.poster.alt = demo.title;
    state.intent = "play";
    state.buffering = false;
    state.ready = false;
    state.resumeAttempts = 0;
    state.nodes.root.classList.remove("is-ended", "is-paused", "is-loading");
    setProgress(0);
    state.nodes.play.hidden = true;
    state.nodes.replay.hidden = true;
  }

  function openCaseStudyDemo(config) {
    var demo = resolveDemo(config);
    if (!demo || !demo.src) {
      if (typeof console !== "undefined" && console.error) {
        console.error("CaseStudyDemoViewer: missing demo src", config);
      }
      return;
    }

    if (state.open) {
      closeCaseStudyDemo();
      window.setTimeout(function () {
        openCaseStudyDemo(demo);
      }, prefersReducedMotion() ? 0 : CLOSE_MS);
      return;
    }

    bindGlobalEvents();
    ensureViewer();
    state.demo = demo;
    state.lastFocused = document.activeElement;
    resetViewer(demo);
    lockScroll();

    state.nodes.root.hidden = false;
    state.nodes.root.setAttribute("aria-hidden", "false");
    state.open = true;
    state.closing = false;

    window.requestAnimationFrame(function () {
      state.nodes.root.classList.add("is-open");
    });

    mountVideo(demo);
    if (state.nodes.close) state.nodes.close.focus();
  }

  function closeCaseStudyDemo() {
    if (!state.open || state.closing || !state.nodes) return;
    state.closing = true;
    state.nodes.root.classList.remove("is-open");
    state.nodes.root.classList.add("is-closing");
    if (state.video) {
      try {
        state.video.pause();
      } catch (err) {}
    }

    var delay = prefersReducedMotion() ? 0 : CLOSE_MS;
    window.setTimeout(function () {
      releaseVideo();
      state.nodes.root.classList.remove("is-closing");
      state.nodes.root.hidden = true;
      state.nodes.root.setAttribute("aria-hidden", "true");
      unlockScroll();
      state.open = false;
      state.closing = false;
      state.demo = null;
      if (state.lastFocused && typeof state.lastFocused.focus === "function") {
        state.lastFocused.focus();
      }
    }, delay);
  }

  function bindTriggers(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var triggers = scope.querySelectorAll("[data-case-study-demo], [data-demo-src]");
    Array.prototype.forEach.call(triggers, function (el) {
      if (el.getAttribute("data-cs-demo-bound") === "true") return;
      el.setAttribute("data-cs-demo-bound", "true");
      el.addEventListener("click", function () {
        openCaseStudyDemo(demoFromTrigger(el));
      });
    });
  }

  window.caseStudyDemos = caseStudyDemos;
  window.openCaseStudyDemo = openCaseStudyDemo;
  window.CaseStudyDemoViewer = {
    demos: caseStudyDemos,
    open: openCaseStudyDemo,
    close: closeCaseStudyDemo,
    bind: bindTriggers
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bindTriggers(document);
    });
  } else {
    bindTriggers(document);
  }
})(window, document);
