/**
 * Write Builder — shared cinematic Demo engine.
 * Orchestrates product interactions; does not replace product behaviour.
 */
(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const settingsBtn = document.getElementById("wb-settings-btn");
  const settingsMenu = document.getElementById("wb-settings-menu");
  const settingsWrap = document.querySelector(".wb-settings-wrap");
  const demoSubmenuTrigger = document.getElementById("wb-settings-demo-trigger");
  const demoSubmenu = document.getElementById("wb-settings-demo-menu");
  const demoCursorEl = document.getElementById("wb-demo-cursor");

  const SCALE = {
    establish: 1,
    feature: 1.2,
    detail: 1.36,
    micro: 1.42,
    edit: 1.38,
    soft: 1.12,
    agent: 1.42,
    prompt: 1.36,
    generate: 1.2,
  };

  const demoEngine = {
    activeDemo: null, // null | create-report | references | review | collaboration | prompt-history
    abort: false,
    cameraMode: null,
    completed: {},
    timers: [],
    phase: null,
    agentPlanFocusReady: false,
  };

  const demoRegistry = {};

  /* —— Helpers —— */
  function refreshIcons() {
    if (typeof lucide !== "undefined") {
      lucide.createIcons({ attrs: { "stroke-width": 1.75 } });
    }
  }

  function Camera() {
    return window.WriteBuilderCamera || null;
  }

  function Compose() {
    return window.WriteBuilderCompose || null;
  }

  function Report() {
    return window.WriteBuilderReport || null;
  }

  function Collab() {
    return window.WriteBuilderCollabDemo || null;
  }

  function holdDemo(ms) {
    const cam = Camera();
    if (cam && typeof cam.holdDemo === "function") return cam.holdDemo(ms);
    return new Promise(function (resolve) {
      const id = window.setTimeout(resolve, ms);
      demoEngine.timers.push(id);
    });
  }

  function trackTimeout(fn, ms) {
    const id = window.setTimeout(fn, ms);
    demoEngine.timers.push(id);
    return id;
  }

  function clearDemoTimers() {
    demoEngine.timers.forEach(function (id) {
      window.clearTimeout(id);
    });
    demoEngine.timers = [];
  }

  function shouldAbort() {
    return !!demoEngine.abort;
  }

  function setDemoPhase(phase) {
    demoEngine.phase = phase || null;
  }

  function resetDemoPhase() {
    demoEngine.phase = null;
    demoEngine.agentPlanFocusReady = false;
  }

  function isComposerLockedPhase() {
    return (
      demoEngine.phase === "customizing-prompt" ||
      demoEngine.phase === "reviewing-prompt" ||
      demoEngine.phase === "submitting"
    );
  }

  function isBlockedCursorTarget(el) {
    if (!el || !isComposerLockedPhase()) return false;
    if (demoEngine.phase === "reviewing-prompt") return true;
    if (demoEngine.phase === "submitting") {
      return !(el.id === "wb-send" || (el.classList && el.classList.contains("wb-send")));
    }
    if (el.closest && el.closest(".wb-chips")) return true;
    if (el.classList && el.classList.contains("wb-chip")) return true;
    if (el.closest && el.closest(".wb-attachment")) return true;
    if (el.closest && el.closest(".wb-composer")) return false;
    if (el.classList && el.classList.contains("wb-token")) return false;
    return true;
  }

  function revealComposerToken(token) {
    const compose = Compose();
    const input =
      (compose && compose.getComposerInput && compose.getComposerInput()) ||
      document.getElementById("wb-composer-input");
    if (!token || !input) return;
    const winY = window.scrollY;
    const inputRect = input.getBoundingClientRect();
    const tokenRect = token.getBoundingClientRect();
    const y = tokenRect.top - inputRect.top + input.scrollTop;
    const margin = 20;
    if (y < input.scrollTop + margin) {
      input.scrollTop = Math.max(0, y - margin);
    } else if (y + tokenRect.height > input.scrollTop + input.clientHeight - margin) {
      input.scrollTop = y + tokenRect.height - input.clientHeight + margin;
    }
    if (window.scrollY !== winY) window.scrollTo(0, winY);
  }

  async function focusTarget(target, options) {
    const cam = Camera();
    if (!cam || !target) return false;
    return cam.focusDemoTarget(target, options || {});
  }

  function getDemoCameraViewportRect() {
    const el = document.getElementById("wb-demo-camera-viewport");
    if (el) {
      const rect = el.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: el.clientWidth || rect.width,
        height: el.clientHeight || rect.height,
        right: rect.right,
        bottom: rect.bottom,
      };
    }
    return {
      left: 0,
      top: 0,
      width: window.innerWidth,
      height: window.innerHeight,
      right: window.innerWidth,
      bottom: window.innerHeight,
    };
  }

  function unionClientRects(a, b) {
    if (!a) return b || null;
    if (!b) return a;
    const left = Math.min(a.left, b.left);
    const top = Math.min(a.top, b.top);
    const right = Math.max(a.right, b.right);
    const bottom = Math.max(a.bottom, b.bottom);
    return {
      left: left,
      top: top,
      right: right,
      bottom: bottom,
      width: right - left,
      height: bottom - top,
    };
  }

  function isPointInCameraSafeZone(x, y, inset) {
    const pad = inset == null ? 0.15 : inset;
    const vp = getDemoCameraViewportRect();
    if (!vp.width || !vp.height) return true;
    const nx = (x - vp.left) / vp.width;
    const ny = (y - vp.top) / vp.height;
    return nx >= pad && nx <= 1 - pad && ny >= pad && ny <= 1 - pad;
  }

  function isRectInCameraSafeZone(rect, inset) {
    if (!isValidClientRect(rect)) return false;
    return isPointInCameraSafeZone(
      rect.left + rect.width * 0.5,
      rect.top + rect.height * 0.5,
      inset
    );
  }

  async function ensureDemoTargetVisible(target, options) {
    options = options || {};
    if (!target) return false;
    let rect = null;
    if (typeof target.getBoundingClientRect === "function") {
      rect = target.getBoundingClientRect();
    } else if (typeof target.left === "number" && typeof target.top === "number") {
      rect = target;
    }
    if (!isValidClientRect(rect)) {
      await waitLayoutFrames(2);
      if (typeof target.getBoundingClientRect === "function") {
        rect = target.getBoundingClientRect();
      }
      if (!isValidClientRect(rect)) return false;
    }
    const inset = options.inset == null ? 0.15 : options.inset;
    if (!options.force && isRectInCameraSafeZone(rect, inset)) return false;
    const cam = Camera();
    const currentScale = cam && cam.getState ? cam.getState().scale : 1;
    const scale =
      options.preferredScale != null
        ? options.preferredScale
        : options.scale != null
          ? options.scale
          : currentScale;
    const duration =
      options.duration != null
        ? options.duration
        : prefersReducedMotion
          ? 60
          : options.large
            ? 920
            : 760;
    await focusTarget(target, {
      scale: scale,
      duration: duration,
      centerX: options.centerX == null ? 0.5 : options.centerX,
      centerY: options.centerY == null ? 0.5 : options.centerY,
      element: options.element || (target && target.nodeType === 1 ? target : null),
    });
    return true;
  }

  const REFERENCES_CAMERA_MODES = {
    "wide-establish": { scale: 1, centerX: 0.5, centerY: 0.5, duration: 800 },
    "citation-paragraph": { scale: 1.22, centerX: 0.5, centerY: 0.5, duration: 700 },
    "inline-reference-detail": { scale: 1.38, centerX: 0.5, centerY: 0.5, duration: 720 },
    "right-panel-detail": { scale: 1.28, centerX: 0.66, centerY: 0.48, duration: 780 },
    "cross-panel-relationship": { scale: 1.13, centerX: 0.52, centerY: 0.5, duration: 820 },
    "right-panel-header": { scale: 1.22, centerX: 0.68, centerY: 0.26, duration: 800 },
  };

  function getReferencesCameraMode() {
    return demoEngine.cameraMode || null;
  }

  function isStableReferencesCameraMode() {
    const mode = getReferencesCameraMode();
    return mode === "inline-reference-detail" || mode === "right-panel-detail";
  }

  async function applyReferencesCameraMode(mode, target, options) {
    options = options || {};
    const preset = REFERENCES_CAMERA_MODES[mode];
    if (!preset || !target) return false;
    const sameMode = demoEngine.cameraMode === mode;
    if (sameMode && !options.force && !options.allowPan) return false;
    if (sameMode && options.allowPan && !options.force) {
      let rect = null;
      if (typeof target.getBoundingClientRect === "function") {
        rect = target.getBoundingClientRect();
      } else if (typeof target.left === "number") {
        rect = target;
      }
      if (rect && isRectInCameraSafeZone(rect, 0.18)) return false;
    }
    demoEngine.cameraMode = mode;
    await focusTarget(target, {
      scale: options.scale != null ? options.scale : preset.scale,
      centerX: options.centerX != null ? options.centerX : preset.centerX,
      centerY: options.centerY != null ? options.centerY : preset.centerY,
      duration:
        options.duration != null
          ? options.duration
          : prefersReducedMotion
            ? 60
            : sameMode
              ? 520
              : preset.duration,
      element: options.element || (target && target.nodeType === 1 ? target : null),
    });
    return true;
  }

  function findDemoScrollParent(el, root) {
    let node = el && el.parentElement;
    while (node && node !== document.body) {
      const style = window.getComputedStyle(node);
      const canScroll =
        (style.overflowY === "auto" || style.overflowY === "scroll") &&
        node.scrollHeight > node.clientHeight + 2;
      if (canScroll) return node;
      if (root && node === root) break;
      node = node.parentElement;
    }
    return root || null;
  }

  async function ensureTargetCenteredInPanel(target, options) {
    options = options || {};
    if (!target) return false;
    await waitLayoutFrames(options.layoutFrames == null ? 2 : options.layoutFrames);
    const root =
      options.panel ||
      document.getElementById("wb-source-panel") ||
      document.getElementById("wb-assistant");
    const scroller = options.scroller || findDemoScrollParent(target, root);
    if (!scroller) return false;
    const report = Report();
    if (report && report.centerTargetInScrollContainer) {
      return report.centerTargetInScrollContainer(target, scroller, {
        topInset: options.topInset == null ? 8 : options.topInset,
        bottomInset: options.bottomInset == null ? 8 : options.bottomInset,
        align: 0.5,
        duration: prefersReducedMotion ? 0 : options.duration == null ? 600 : options.duration,
      });
    }
    const topInset = options.topInset == null ? 64 : options.topInset;
    const bottomInset = options.bottomInset == null ? 64 : options.bottomInset;
    const scrollerRect = scroller.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    if (!isValidClientRect(scrollerRect) || !isValidClientRect(targetRect)) return false;
    const scaleY = scrollerRect.height / Math.max(1, scroller.clientHeight);
    const usable = Math.max(40, scroller.clientHeight - topInset - bottomInset);
    const desired = topInset + usable * 0.5;
    const layoutMid =
      scroller.scrollTop +
      (targetRect.top + targetRect.height * 0.5 - scrollerRect.top) / (scaleY || 1);
    const nextTop = Math.max(
      0,
      Math.min(scroller.scrollHeight - scroller.clientHeight, layoutMid - desired)
    );
    if (Math.abs(nextTop - scroller.scrollTop) < 3) return true;
    await animateComposerScroll(
      scroller,
      nextTop,
      prefersReducedMotion ? 40 : options.duration == null ? 600 : options.duration
    );
    return true;
  }

  async function resetCamera(options) {
    const cam = Camera();
    if (!cam) return;
    return cam.resetDemoCamera(options || {});
  }

  function startCinematic() {
    const cam = Camera();
    if (cam && cam.startCinematicMode) cam.startCinematicMode();
  }

  function endCinematic() {
    const cam = Camera();
    if (cam && cam.endCinematicMode) cam.endCinematicMode();
  }

  /* —— Demo cursor (local user pointer) —— */
  const demoCursor = {
    x: 0,
    y: 0,
    visible: false,
    moving: false,
  };

  // cubic-bezier(0.22, 1, 0.36, 1)
  function easeDemoMotion(t) {
    const u = Math.max(0, Math.min(1, t));
    return sampleCubicBezier(u, 0.22, 1, 0.36, 1);
  }

  function sampleCubicBezier(t, x1, y1, x2, y2) {
    // Solve for parameter where Bezier.x ≈ t, then return Bezier.y
    let guess = t;
    for (let i = 0; i < 5; i++) {
      const x = cubicBezierCoord(guess, x1, x2) - t;
      const dx = cubicBezierDeriv(guess, x1, x2);
      if (Math.abs(dx) < 1e-6) break;
      guess -= x / dx;
      guess = Math.max(0, Math.min(1, guess));
    }
    return cubicBezierCoord(guess, y1, y2);
  }

  function cubicBezierCoord(t, a, b) {
    const mt = 1 - t;
    return 3 * mt * mt * t * a + 3 * mt * t * t * b + t * t * t;
  }

  function cubicBezierDeriv(t, a, b) {
    const mt = 1 - t;
    return 3 * mt * mt * a + 6 * mt * t * (b - a) + 3 * t * t * (1 - b);
  }

  function durationForDistance(dist, options) {
    if (options && options.duration != null) return options.duration;
    if (prefersReducedMotion) return 40;
    if (dist < 90) return 220 + dist * 0.7;
    if (dist < 220) return 320 + (dist - 90) * 0.85;
    if (dist < 420) return 420 + (dist - 220) * 0.55;
    return Math.min(650, 530 + (dist - 420) * 0.28);
  }

  function showDemoCursor() {
    if (!demoCursorEl) return;
    demoCursorEl.hidden = false;
    demoCursor.visible = true;
    document.body.classList.add("wb-demo-cursor-active");
  }

  function hideDemoCursor() {
    if (!demoCursorEl) return;
    demoCursorEl.hidden = true;
    demoCursorEl.classList.remove("is-clicking", "is-editing", "is-blinking");
    demoCursor.visible = false;
    document.body.classList.remove("wb-demo-cursor-active");
    const compose = Compose();
    const input = compose && compose.getComposerInput && compose.getComposerInput();
    if (input) input.classList.remove("is-demo-editing");
    if (compose && compose.clearChipHovers) compose.clearChipHovers();
  }

  function hideDemoPointerKeepLock() {
    if (!demoCursorEl) return;
    demoCursorEl.hidden = true;
    demoCursorEl.classList.remove("is-clicking", "is-editing", "is-blinking");
    demoCursor.visible = false;
  }

  function syncDemoCaretToText(textNode, offset) {
    const caretApi = window.WriteBuilderCaret;
    if (!caretApi || !demoCursorEl) return;
    const compose = Compose();
    const input = compose && compose.getComposerInput && compose.getComposerInput();
    const fallback = (textNode && textNode.parentElement) || input;
    let rect = caretApi.positionVisualCaret(textNode, offset, fallback);
    if (!rect) return;
    if (input && caretApi.keepRectVisibleInScroller) {
      if (caretApi.keepRectVisibleInScroller(input, rect, { padding: 18 })) {
        rect = caretApi.positionVisualCaret(textNode, offset, input) || rect;
      }
    }
    const bar = demoCursorEl.querySelector(".wb-demo-cursor__caret");
    if (bar && rect.height) {
      bar.style.height = Math.max(13, Math.round(rect.height)) + "px";
    }
    placeDemoCursor(rect.left, rect.top);
  }

  function enterDemoTextCaret(textNode, offset) {
    if (!demoCursorEl) return;
    showDemoCursor();
    demoCursorEl.classList.add("is-editing");
    demoCursorEl.classList.remove("is-blinking", "is-clicking");
    const compose = Compose();
    const input = compose && compose.getComposerInput && compose.getComposerInput();
    if (input) input.classList.add("is-demo-editing");
    syncDemoCaretToText(textNode, offset);
  }

  function blinkDemoTextCaret() {
    if (demoCursorEl && demoCursorEl.classList.contains("is-editing")) {
      demoCursorEl.classList.add("is-blinking");
    }
  }

  function exitDemoTextCaret() {
    if (demoCursorEl) {
      demoCursorEl.classList.remove("is-editing", "is-blinking");
    }
    const compose = Compose();
    const input = compose && compose.getComposerInput && compose.getComposerInput();
    if (input) input.classList.remove("is-demo-editing");
  }

  function placeDemoCursor(x, y) {
    if (!demoCursorEl) return;
    if (!isValidCursorPoint(x, y)) return;
    demoCursor.x = x;
    demoCursor.y = y;
    demoCursorEl.style.transform =
      "translate3d(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px, 0)";
  }

  function applyHoverAtPoint(x, y, hoverEl) {
    if (!hoverEl) return;
    const compose = Compose();
    if (!compose || !compose.setChipHover) return;
    const r = hoverEl.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      compose.setChipHover(hoverEl, true);
    }
  }

  function isValidCursorPoint(x, y) {
    return Number.isFinite(x) && Number.isFinite(y) && !(x < 2 && y < 2);
  }

  function readDemoCursorTransform() {
    if (!demoCursorEl) return null;
    const t = demoCursorEl.style.transform || "";
    const m = /translate3d\(\s*(-?[\d.]+)px,\s*(-?[\d.]+)px/.exec(t);
    if (!m) return null;
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    if (!isValidCursorPoint(x, y)) return null;
    return { x: x, y: y };
  }

  function getLiveDemoCursorPoint() {
    if (isValidCursorPoint(demoCursor.x, demoCursor.y)) {
      return { x: demoCursor.x, y: demoCursor.y };
    }
    return readDemoCursorTransform();
  }

  function isValidClientRect(rect) {
    return !!(
      rect &&
      Number.isFinite(rect.left) &&
      Number.isFinite(rect.top) &&
      Number.isFinite(rect.width) &&
      Number.isFinite(rect.height) &&
      rect.width > 1 &&
      rect.height > 1
    );
  }

  async function waitLayoutFrames(count) {
    const n = count == null ? 2 : count;
    const caret = window.WriteBuilderCaret;
    for (let i = 0; i < n; i++) {
      if (caret && caret.waitForLayout) await caret.waitForLayout();
      else {
        await new Promise(function (resolve) {
          window.requestAnimationFrame(resolve);
        });
      }
    }
  }

  function shouldLeadCameraForCursor() {
    return demoEngine.activeDemo === "references";
  }

  async function moveDemoCursorTo(x, y, options) {
    options = options || {};
    if (!demoCursorEl) return;
    if (!isValidCursorPoint(x, y)) return;
    if (
      shouldLeadCameraForCursor() &&
      !options.skipEnsure &&
      !isPointInCameraSafeZone(x, y, 0.02)
    ) {
      await ensureDemoTargetVisible(
        {
          left: x - 4,
          top: y - 4,
          width: 8,
          height: 8,
          right: x + 4,
          bottom: y + 4,
        },
        {
          preferredScale: options.preferredScale,
          centerX: options.centerX,
          centerY: options.centerY,
          duration: options.cameraDuration,
          force: true,
        }
      );
    }
    showDemoCursor();
    const from = getLiveDemoCursorPoint();
    if (!from) {
      placeDemoCursor(x, y);
      applyHoverAtPoint(x, y, options.hoverEl || null);
      return;
    }
    const fromX = from.x;
    const fromY = from.y;
    const dist = Math.hypot(x - fromX, y - fromY);
    const duration = durationForDistance(dist, options);
    const hoverEl = options.hoverEl || null;

    if (prefersReducedMotion || duration <= 0 || dist < 1) {
      placeDemoCursor(x, y);
      applyHoverAtPoint(x, y, hoverEl);
      return;
    }

    demoCursor.moving = true;
    let hoverApplied = false;
    const start = performance.now();
    function liveCursorDest() {
      const el = options.trackEl;
      if (el && el.isConnected) {
        const r = el.getBoundingClientRect();
        if (isValidClientRect(r)) {
          const ox = options.offsetX != null ? options.offsetX : r.width * 0.45;
          const oy = options.offsetY != null ? options.offsetY : r.height * 0.55;
          return { x: r.left + ox, y: r.top + oy };
        }
      }
      return { x: x, y: y };
    }
    await new Promise(function (resolve) {
      function frame(now) {
        if (shouldAbort()) {
          demoCursor.moving = false;
          resolve();
          return;
        }
        const dest = liveCursorDest();
        const t = Math.min(1, (now - start) / duration);
        const e = easeDemoMotion(t);
        const cx = fromX + (dest.x - fromX) * e;
        const cy = fromY + (dest.y - fromY) * e;
        placeDemoCursor(cx, cy);
        if (hoverEl && !hoverApplied) {
          const r = hoverEl.getBoundingClientRect();
          if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
            applyHoverAtPoint(cx, cy, hoverEl);
            hoverApplied = true;
          }
        }
        if (t < 1) {
          window.requestAnimationFrame(frame);
        } else {
          const end = liveCursorDest();
          placeDemoCursor(end.x, end.y);
          applyHoverAtPoint(end.x, end.y, hoverEl);
          demoCursor.moving = false;
          resolve();
        }
      }
      window.requestAnimationFrame(frame);
    });
  }

  async function moveDemoCursorToEl(el, options) {
    options = options || {};
    if (!el) return;
    if (isBlockedCursorTarget(el)) return;
    let rect = el.getBoundingClientRect();
    if (!isValidClientRect(rect)) {
      await waitLayoutFrames(2);
      rect = el.getBoundingClientRect();
    }
    if (!isValidClientRect(rect)) return;
    const ox = options.offsetX != null ? options.offsetX : rect.width * 0.45;
    const oy = options.offsetY != null ? options.offsetY : rect.height * 0.55;
    const destX = rect.left + ox;
    const destY = rect.top + oy;
    if (shouldLeadCameraForCursor() && !options.skipEnsure) {
      const outsideView = !isPointInCameraSafeZone(destX, destY, 0.02);
      const outsideComfort =
        options.ensureVisible &&
        !isStableReferencesCameraMode() &&
        !isPointInCameraSafeZone(destX, destY, 0.18);
      if (outsideView || outsideComfort) {
        await ensureDemoTargetVisible(el, {
          preferredScale: options.preferredScale,
          centerX: options.centerX,
          centerY: options.centerY,
          duration: options.cameraDuration,
          large: options.large,
          element: el,
          force: outsideView,
          inset: outsideComfort ? 0.18 : 0.02,
        });
        await waitLayoutFrames(1);
        rect = el.getBoundingClientRect();
        if (!isValidClientRect(rect)) return;
      }
    }
    await moveDemoCursorTo(
      rect.left + ox,
      rect.top + oy,
      Object.assign({}, options, {
        skipEnsure: true,
        offsetX: ox,
        offsetY: oy,
      })
    );
    if (options.settle === true) {
      await holdDemo(
        options.settleMs == null ? (prefersReducedMotion ? 30 : 140) : options.settleMs
      );
    }
  }

  async function hoverChip(chip, options) {
    options = options || {};
    if (isComposerLockedPhase()) return;
    const compose = Compose();
    if (compose && compose.clearChipHovers) compose.clearChipHovers();
    if (!chip) return;
    await moveDemoCursorToEl(
      chip,
      Object.assign({}, options, {
        hoverEl: chip,
        settle: false,
      })
    );
    if (compose && compose.setChipHover) compose.setChipHover(chip, true);
    const dwell =
      options.dwellMs != null
        ? options.dwellMs
        : options.settleMs != null
          ? options.settleMs
          : prefersReducedMotion
            ? 40
            : 260;
    if (dwell > 0) await holdDemo(dwell);
  }

  async function demoCursorClick(el, options) {
    options = options || {};
    if (el) {
      await moveDemoCursorToEl(
        el,
        Object.assign({}, options, { settle: false })
      );
    }
    if (shouldAbort()) return false;
    const pause = options.preClickMs != null ? options.preClickMs : prefersReducedMotion ? 40 : 180;
    if (pause > 0) await holdDemo(pause);
    if (demoCursorEl) {
      demoCursorEl.classList.add("is-clicking");
      await holdDemo(prefersReducedMotion ? 30 : 90);
      demoCursorEl.classList.remove("is-clicking");
    }
    if (el && typeof el.click === "function") {
      el.click();
    }
    return true;
  }

  function rangeEdgePoint(range, atEnd) {
    if (!range) return null;
    const caret = window.WriteBuilderCaret;
    const node = atEnd ? range.endContainer : range.startContainer;
    const offset = atEnd ? range.endOffset : range.startOffset;
    if (caret && node && node.nodeType === 3) {
      const caretRect = caret.getCaretRectFromTextPosition(node, offset);
      if (
        caretRect &&
        isFinite(caretRect.left) &&
        isFinite(caretRect.top) &&
        !(caretRect.left === 0 && caretRect.top === 0)
      ) {
        return {
          x: caretRect.left,
          y: caretRect.top + (caretRect.height || 16) * 0.55,
        };
      }
    }
    const rects = range.getClientRects();
    let box = null;
    if (rects && rects.length) {
      if (atEnd) {
        for (let i = rects.length - 1; i >= 0; i--) {
          if (isValidClientRect(rects[i])) {
            box = rects[i];
            break;
          }
        }
      } else {
        for (let i = 0; i < rects.length; i++) {
          if (isValidClientRect(rects[i])) {
            box = rects[i];
            break;
          }
        }
      }
    }
    if (!box) box = range.getBoundingClientRect();
    if (!isValidClientRect(box)) return null;
    return {
      x: atEnd ? box.right - 2 : box.left + 2,
      y: box.top + box.height * 0.55,
    };
  }

  async function dragSelectReportPhrase(report, target) {
    if (!report || !target || !target.range) return false;
    const range = target.range;
    const start = rangeEdgePoint(range, false);
    const end = rangeEdgePoint(range, true);
    if (
      !start ||
      !end ||
      !isValidCursorPoint(start.x, start.y) ||
      !isValidCursorPoint(end.x, end.y)
    ) {
      return false;
    }

    await moveDemoCursorTo(start.x, start.y);
    await holdDemo(prefersReducedMotion ? 30 : 80);

    const sel = window.getSelection();
    const live = range.cloneRange();
    const textNode = range.startContainer;
    const startOff = range.startOffset;
    const endOff = range.endOffset;
    const sameTextNode =
      textNode &&
      textNode.nodeType === 3 &&
      range.endContainer === textNode &&
      endOff > startOff &&
      endOff <= (textNode.nodeValue || "").length;
    if (sameTextNode) {
      live.setEnd(textNode, startOff);
      sel.removeAllRanges();
      sel.addRange(live);
      const steps = prefersReducedMotion
        ? 3
        : Math.max(8, Math.min(22, endOff - startOff));
      for (let i = 1; i <= steps; i++) {
        if (shouldAbort()) return false;
        const off = startOff + Math.round(((endOff - startOff) * i) / steps);
        live.setEnd(textNode, off);
        sel.removeAllRanges();
        sel.addRange(live);
        const pt = rangeEdgePoint(live, true);
        if (pt) placeDemoCursor(pt.x, pt.y);
        await holdDemo(prefersReducedMotion ? 8 : 18);
      }
    } else {
      await moveDemoCursorTo(end.x, end.y);
    }
    if (report.applySelectionRange) report.applySelectionRange(range, target.phrase);
    else if (report.selectPhrase) report.selectPhrase(target.phrase);
    return true;
  }

  async function animateComposerScroll(el, toTop, duration) {
    if (!el) return;
    const from = el.scrollTop;
    const max = Math.max(0, el.scrollHeight - el.clientHeight);
    const target = Math.max(0, Math.min(max, toTop));
    if (prefersReducedMotion || Math.abs(target - from) < 1) {
      el.scrollTop = target;
      return;
    }
    const dur = duration == null ? 700 : duration;
    const start = performance.now();
    await new Promise(function (resolve) {
      function frame(now) {
        if (shouldAbort()) {
          resolve();
          return;
        }
        const t = Math.min(1, (now - start) / dur);
        const e = easeDemoMotion(t);
        el.scrollTop = from + (target - from) * e;
        if (t < 1) window.requestAnimationFrame(frame);
        else {
          el.scrollTop = target;
          resolve();
        }
      }
      window.requestAnimationFrame(frame);
    });
  }

  const interactionSimulator = {
    moveTo: moveDemoCursorTo,
    moveToEl: moveDemoCursorToEl,
    hoverChip: hoverChip,
    click: demoCursorClick,
    show: showDemoCursor,
    hide: hideDemoCursor,
    place: placeDemoCursor,
    scrollComposer: animateComposerScroll,
  };

  /* —— Settings → Demo submenu —— */
  const demoSubmenuState = {
    open: false,
    openTimer: null,
    closeTimer: null,
  };

  function isSettingsMenuOpen() {
    return !!(settingsMenu && !settingsMenu.hidden);
  }

  function isDemoSubmenuOpen() {
    return !!(demoSubmenu && !demoSubmenu.hidden && demoSubmenuState.open);
  }

  function clearDemoSubmenuTimers() {
    if (demoSubmenuState.openTimer) {
      window.clearTimeout(demoSubmenuState.openTimer);
      demoSubmenuState.openTimer = null;
    }
    if (demoSubmenuState.closeTimer) {
      window.clearTimeout(demoSubmenuState.closeTimer);
      demoSubmenuState.closeTimer = null;
    }
  }

  function positionDemoSubmenu() {
    if (!demoSubmenu || !demoSubmenuTrigger || demoSubmenu.hidden) return;
    const trigger = demoSubmenuTrigger.getBoundingClientRect();
    const gap = 6;
    const margin = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = demoSubmenu.offsetWidth || 180;
    const height = demoSubmenu.offsetHeight || 140;
    let left = trigger.right + gap;
    let flipLeft = false;
    if (left + width > vw - margin) {
      left = trigger.left - gap - width;
      flipLeft = true;
    }
    if (left < margin) {
      left = margin;
      flipLeft = false;
    }
    let top = trigger.top;
    if (top + height > vh - margin) {
      top = Math.max(margin, vh - margin - height);
    }
    demoSubmenu.style.top = Math.round(top) + "px";
    demoSubmenu.style.left = Math.round(left) + "px";
    demoSubmenu.classList.toggle("is-left", flipLeft);
  }

  function closeDemoSubmenu() {
    clearDemoSubmenuTimers();
    demoSubmenuState.open = false;
    if (demoSubmenu) {
      demoSubmenu.hidden = true;
      demoSubmenu.classList.remove("is-left");
    }
    if (demoSubmenuTrigger) {
      demoSubmenuTrigger.classList.remove("is-open");
      demoSubmenuTrigger.setAttribute("aria-expanded", "false");
    }
  }

  function openDemoSubmenu() {
    if (!demoSubmenu || !isSettingsMenuOpen()) return;
    clearDemoSubmenuTimers();
    demoSubmenuState.open = true;
    demoSubmenu.hidden = false;
    if (demoSubmenuTrigger) {
      demoSubmenuTrigger.classList.add("is-open");
      demoSubmenuTrigger.setAttribute("aria-expanded", "true");
    }
    positionDemoSubmenu();
    syncSettingsDemoItems();
  }

  function scheduleOpenDemoSubmenu() {
    if (isDemoSubmenuOpen()) return;
    clearDemoSubmenuTimers();
    demoSubmenuState.openTimer = window.setTimeout(openDemoSubmenu, 100);
  }

  function scheduleCloseDemoSubmenu() {
    clearDemoSubmenuTimers();
    demoSubmenuState.closeTimer = window.setTimeout(closeDemoSubmenu, 180);
  }

  function toggleDemoSubmenu() {
    if (isDemoSubmenuOpen()) closeDemoSubmenu();
    else openDemoSubmenu();
  }

  function getDemoSubmenuItems() {
    if (!demoSubmenu) return [];
    return Array.prototype.slice.call(
      demoSubmenu.querySelectorAll("[data-demo-play]:not([disabled])")
    );
  }

  function closeSettingsMenu() {
    closeDemoSubmenu();
    if (!settingsMenu) return;
    settingsMenu.hidden = true;
    if (settingsBtn) {
      settingsBtn.setAttribute("aria-expanded", "false");
      settingsBtn.classList.remove("is-active");
    }
  }

  function openSettingsMenu() {
    if (!settingsMenu) return;
    closeDemoSubmenu();
    syncSettingsDemoItems();
    settingsMenu.hidden = false;
    if (settingsBtn) {
      settingsBtn.setAttribute("aria-expanded", "true");
      settingsBtn.classList.add("is-active");
    }
  }

  function toggleSettingsMenu() {
    if (isSettingsMenuOpen()) closeSettingsMenu();
    else openSettingsMenu();
  }

  function syncSettingsDemoItems() {
    const root = settingsWrap || demoSubmenu || settingsMenu;
    if (!root) return;
    root.querySelectorAll("[data-demo-play]").forEach(function (btn) {
      const id = btn.getAttribute("data-demo-play");
      const demo = demoRegistry[id];
      const busy = !!demoEngine.activeDemo;
      const enabled = !!(demo && demo.enabled);
      btn.disabled = !enabled || busy;
      btn.classList.toggle("is-disabled", !enabled);
      btn.classList.toggle("is-running", demoEngine.activeDemo === id);
    });
  }

  // Back-compat stubs (Demo Center removed)
  function closeDemoCenter() {}
  function openDemoCenter() {
    openSettingsMenu();
  }
  function isDemoCenterOpen() {
    return false;
  }
  function renderDemoCenterList() {
    syncSettingsDemoItems();
  }

  /* —— Engine —— */
  async function cancelDemo() {
    const camState = Camera() && Camera().getState ? Camera().getState() : null;
    if (!demoEngine.activeDemo && !(camState && camState.cinematic)) {
      hideDemoCursor();
      return;
    }
    demoEngine.abort = true;
    clearDemoTimers();
    hideDemoCursor();

    const active = demoEngine.activeDemo;
    const demo = active && demoRegistry[active];

    const report = Report();
    if (report && typeof report.stop === "function") {
      try {
        report.stop();
      } catch (err) {
        /* ignore */
      }
    }

    if (active === "collaboration") {
      const collab = Collab();
      if (collab && typeof collab.cancel === "function") {
        await collab.cancel();
      }
    } else {
      endCinematic();
      await resetCamera({ instant: true });
      const compose = Compose();
      if (compose && typeof compose.hideEduPopout === "function") {
        compose.hideEduPopout();
      }
      if (compose && typeof compose.hideContextPreview === "function") {
        compose.hideContextPreview();
      }
    }

    if (demo && typeof demo.cleanup === "function") {
      try {
        await demo.cleanup({ aborted: true });
      } catch (err) {
        /* ignore */
      }
    }

    demoEngine.activeDemo = null;
    demoEngine.abort = false;
    resetDemoPhase();
    syncSettingsDemoItems();
  }

  async function playDemo(id) {
    const demo = demoRegistry[id];
    if (!demo || !demo.enabled || typeof demo.run !== "function") return;
    if (demoEngine.activeDemo) return;

    closeSettingsMenu();
    demoEngine.abort = false;
    demoEngine.activeDemo = id;
    resetDemoPhase();
    syncSettingsDemoItems();
    hideDemoCursor();

    try {
      if (typeof demo.reset === "function") {
        await demo.reset();
      }
      if (shouldAbort()) return;
      await demo.run();
      if (!shouldAbort()) {
        demoEngine.completed[id] = true;
      }
    } catch (err) {
      console.error("[WriteBuilderDemo]", id, err);
    } finally {
      hideDemoCursor();
      if (demoEngine.activeDemo === id) {
        demoEngine.activeDemo = null;
      }
      demoEngine.abort = false;
      resetDemoPhase();
      clearDemoTimers();
      syncSettingsDemoItems();
    }
  }

  /* —— Create Report cinematic —— */
  async function resetCreateReportState() {
    const compose = Compose();
    const report = Report();
    const cam = Camera();
    if (report && typeof report.stop === "function") report.stop();
    if (compose && typeof compose.hideEduPopout === "function") compose.hideEduPopout();
    if (compose && typeof compose.hideContextPreview === "function") compose.hideContextPreview();
    if (compose && typeof compose.requestNewDocument === "function") {
      compose.requestNewDocument();
    }
    if (cam) {
      endCinematic();
      await resetCamera({ instant: true });
    }
    await holdDemo(prefersReducedMotion ? 40 : 180);
  }

  async function waitForEditorView(maxMs) {
    const report = Report();
    const start = performance.now();
    while (performance.now() - start < (maxMs || 4000)) {
      if (shouldAbort()) return false;
      const state = report && report.getState ? report.getState() : null;
      if (state && (state.view === "editor" || state.view === "generating")) return true;
      await holdDemo(80);
    }
    return false;
  }

  async function waitDuringGeneration(minMs, maxMs) {
    const report = Report();
    const start = performance.now();
    const min = minMs == null ? 4500 : minMs;
    const max = maxMs == null ? 7500 : maxMs;
    while (performance.now() - start < max) {
      if (shouldAbort()) return;
      const state = report && report.getState ? report.getState() : null;
      const elapsed = performance.now() - start;
      if (state && state.reportStatus === "complete" && elapsed >= min) return;
      await holdDemo(120);
    }
  }

  async function runCreateReportDemo() {
    const compose = Compose();
    const report = Report();
    const cam = Camera();
    if (!compose || !cam) return;

    startCinematic();
    setDemoPhase("quick-actions");
    if (compose.mountEduForDemo) compose.mountEduForDemo(true);
    if (cam.setInstant) cam.setInstant(1, 0, 0);

    const chipsEl = compose.getChipsEl && compose.getChipsEl();
    const composerEl = compose.getComposerEl && compose.getComposerEl();
    const composerInput =
      (compose.getComposerInput && compose.getComposerInput()) ||
      document.getElementById("wb-composer-input");
    const tofaChip = compose.getTemplateChip && compose.getTemplateChip("tofa");
    const txChip = compose.getTemplateChip && compose.getTemplateChip("transaction-cost");
    const sendBtn = compose.getSendButton && compose.getSendButton();

    // 0.0–0.9 — establish compose
    await holdDemo(prefersReducedMotion ? 180 : 900);
    if (shouldAbort()) return;

    // 0.9–1.6 — camera → Quick Actions
    const qaTarget = chipsEl || composerEl;
    await focusTarget(qaTarget, {
      scale: prefersReducedMotion ? 1.04 : SCALE.feature,
      duration: prefersReducedMotion ? 80 : 700,
      centerX: 0.5,
      centerY: 0.5,
      element: qaTarget,
    });
    await holdDemo(prefersReducedMotion ? 50 : 220);
    if (shouldAbort()) return;

    if (tofaChip) {
      const tr = tofaChip.getBoundingClientRect();
      placeDemoCursor(tr.left - 40, tr.top + tr.height * 0.55);
      showDemoCursor();
    } else if (chipsEl) {
      const r = chipsEl.getBoundingClientRect();
      placeDemoCursor(r.left + 8, r.top + r.height * 0.55);
      showDemoCursor();
    }

    // 1.6–3.8 — TOFA: direct move, instant hover, edu popout, hold
    if (tofaChip) {
      await hoverChip(tofaChip, {
        dwellMs: prefersReducedMotion ? 40 : 280,
      });
      if (compose.showEduPopout) compose.showEduPopout("tofa", tofaChip);
      if (compose.freezeEduPlacement) compose.freezeEduPlacement(true);
      await holdDemo(prefersReducedMotion ? 60 : 200);
    }
    if (shouldAbort()) return;

    const eduCanvas =
      (compose.getEduCanvas && compose.getEduCanvas()) ||
      (compose.getEduPopout && compose.getEduPopout());
    await focusTarget(eduCanvas || tofaChip, {
      scale: prefersReducedMotion ? 1.06 : 1.36,
      duration: prefersReducedMotion ? 80 : 720,
      centerX: 0.5,
      centerY: 0.48,
      element: eduCanvas || tofaChip,
    });
    await holdDemo(prefersReducedMotion ? 180 : 1200);
    if (shouldAbort()) return;

    // 3.8–5.5 — Transaction Cost brief preview, then direct return + click TOFA
    if (txChip && !prefersReducedMotion) {
      if (compose.freezeEduPlacement) compose.freezeEduPlacement(false);
      await focusTarget(chipsEl || txChip, {
        scale: SCALE.feature,
        duration: 480,
        centerX: 0.5,
        centerY: 0.52,
        element: chipsEl || txChip,
      });
      await hoverChip(txChip, { dwellMs: 220 });
      if (compose.showEduPopout) compose.showEduPopout("transaction-cost", txChip);
      if (compose.freezeEduPlacement) compose.freezeEduPlacement(true);
      await holdDemo(700);
      if (shouldAbort()) return;
      if (compose.freezeEduPlacement) compose.freezeEduPlacement(false);
      await hoverChip(tofaChip, { dwellMs: 160 });
      if (compose.showEduPopout) compose.showEduPopout("tofa", tofaChip);
      await holdDemo(120);
    }

    if (tofaChip) {
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 30 : 90);
        demoCursorEl.classList.remove("is-clicking");
      }
      if (compose.freezeEduPlacement) compose.freezeEduPlacement(false);
      if (compose.selectTemplate) compose.selectTemplate("tofa");
      else tofaChip.click();
    }
    if (compose.hideEduPopout) compose.hideEduPopout();
    if (compose.clearChipHovers) compose.clearChipHovers();
    await holdDemo(prefersReducedMotion ? 60 : 420);
    if (shouldAbort()) return;

    // 5.5–6.5 — prompt + context populate
    if (composerEl) {
      await focusTarget(composerEl, {
        scale: prefersReducedMotion ? 1.05 : SCALE.prompt,
        duration: prefersReducedMotion ? 70 : 640,
        centerX: 0.5,
        centerY: 0.5,
        element: composerEl,
      });
    }
    await holdDemo(prefersReducedMotion ? 80 : 320);
    if (shouldAbort()) return;

    // 6.6–10.6 — inspect Treasury Policy and scroll the document preview
    setDemoPhase("context-preview");
    const treasuryChip =
      compose.getContextChip && compose.getContextChip("tofa-treasury");
    if (treasuryChip) {
      await moveDemoCursorToEl(treasuryChip, {
        hoverEl: treasuryChip,
        settle: false,
        offsetX: 18,
        offsetY: 12,
      });
      if (compose.setChipHover) compose.setChipHover(treasuryChip, true);
      await holdDemo(
        prefersReducedMotion
          ? 40
          : (compose.getContextPreviewDelay && compose.getContextPreviewDelay()) || 520
      );
      if (shouldAbort()) return;
      if (compose.showContextPreview) {
        compose.showContextPreview("tofa-treasury", treasuryChip);
      }
      const previewBody =
        (compose.getContextPreviewBody && compose.getContextPreviewBody()) ||
        (compose.getContextPreview && compose.getContextPreview());
      await holdDemo(prefersReducedMotion ? 30 : 80);
      await focusTarget(previewBody || treasuryChip, {
        scale: prefersReducedMotion ? 1.06 : 1.36,
        duration: prefersReducedMotion ? 70 : 660,
        centerX: 0.5,
        centerY: 0.5,
        element: previewBody || treasuryChip,
      });
      if (previewBody) {
        await moveDemoCursorToEl(previewBody, {
          offsetX: 36,
          offsetY: 72,
          settle: false,
        });
      }
      await holdDemo(prefersReducedMotion ? 80 : 550);
      if (previewBody && !prefersReducedMotion) {
        const maxScroll = Math.max(0, previewBody.scrollHeight - previewBody.clientHeight);
        if (maxScroll > 16) {
          const first = Math.min(maxScroll, previewBody.scrollTop + Math.round(maxScroll * 0.32));
          await animateComposerScroll(previewBody, first, 820);
          await holdDemo(400);
          const second = Math.min(maxScroll, previewBody.scrollTop + Math.round(maxScroll * 0.24));
          await animateComposerScroll(previewBody, second, 560);
          await holdDemo(350);
        } else {
          await holdDemo(400);
        }
      } else {
        await holdDemo(prefersReducedMotion ? 80 : 400);
      }
      if (compose.hideContextPreview) compose.hideContextPreview();
      if (compose.setChipHover) compose.setChipHover(treasuryChip, false);
    }
    if (shouldAbort()) return;

    if (composerEl) {
      await focusTarget(composerEl, {
        scale: prefersReducedMotion ? 1.05 : SCALE.prompt,
        duration: prefersReducedMotion ? 60 : 480,
        centerX: 0.5,
        centerY: 0.5,
        element: composerEl,
      });
    }
    await holdDemo(prefersReducedMotion ? 40 : 180);
    if (shouldAbort()) return;

    // 9.1–13.5 — customize 3–4 fields; stay inside Prompt Composer
    setDemoPhase("customizing-prompt");
    if (composerEl) {
      await focusTarget(composerEl, {
        scale: prefersReducedMotion ? 1.05 : SCALE.prompt,
        duration: prefersReducedMotion ? 50 : 280,
        centerX: 0.5,
        centerY: 0.5,
        element: composerEl,
      });
    }
    const fields = [
      { label: "Company name", value: "Horizon Group" },
      { label: "financial arrangement / transaction", value: "cross-currency financing arrangements" },
      { label: "Effective date", value: "1 July 2026" },
      { label: "Amount", value: "AUD 85 million" },
    ];

    for (let i = 0; i < fields.length; i++) {
      if (shouldAbort()) return;
      const field = fields[i];
      const token = compose.findPlaceholder && compose.findPlaceholder(field.label);
      if (!token) continue;
      revealComposerToken(token);
      await moveDemoCursorToEl(token, {
        offsetX: 12,
        offsetY: 8,
        settle: false,
      });
      await holdDemo(prefersReducedMotion ? 40 : 110);
      await compose.typeIntoPlaceholder(field.label, field.value, {
        shouldAbort: shouldAbort,
        selectHoldMs: prefersReducedMotion ? 80 : 260,
        settleMs: 50,
        charDelayMin: 18,
        charDelayMax: 40,
        onCaret: function (textNode, offset) {
          if (!demoCursorEl) return;
          if (!demoCursorEl.classList.contains("is-editing")) {
            enterDemoTextCaret(textNode, offset);
            return;
          }
          demoCursorEl.classList.remove("is-blinking");
          syncDemoCaretToText(textNode, offset);
        },
      });
      blinkDemoTextCaret();
      await holdDemo(prefersReducedMotion ? 40 : 200);
      exitDemoTextCaret();
    }
    if (shouldAbort()) return;

    // 13.5–15.3 — cursor stays put; prompt reviews to the bottom
    setDemoPhase("reviewing-prompt");
    await holdDemo(prefersReducedMotion ? 40 : 300);
    if (composerInput) {
      const maxScroll = Math.max(0, composerInput.scrollHeight - composerInput.clientHeight);
      await animateComposerScroll(
        composerInput,
        maxScroll,
        prefersReducedMotion ? 80 : 1050
      );
    }
    await holdDemo(prefersReducedMotion ? 60 : 550);
    if (shouldAbort()) return;

    // 15.3–15.8 — cursor directly → Send
    setDemoPhase("submitting");
    if (sendBtn) {
      const sr = sendBtn.getBoundingClientRect();
      const dist = Math.hypot(sr.left - demoCursor.x, sr.top - demoCursor.y);
      const sendMs = Math.max(280, Math.min(420, durationForDistance(dist)));
      await moveDemoCursorToEl(sendBtn, {
        duration: prefersReducedMotion ? 80 : sendMs,
        settle: false,
      });
      await holdDemo(prefersReducedMotion ? 40 : 150);
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 30 : 90);
        demoCursorEl.classList.remove("is-clicking");
      }
    }
    setDemoPhase("generating");
    if (compose.clickSend) compose.clickSend();
    else if (sendBtn) sendBtn.click();
    hideDemoCursor();

    // 15.8–16.8 — transition
    await focusTarget(document.getElementById("wb-app") || document.body, {
      scale: prefersReducedMotion ? 1 : 1.04,
      duration: prefersReducedMotion ? 60 : 650,
      centerX: 0.5,
      centerY: 0.5,
    });
    if (shouldAbort()) return;

    await waitForEditorView(4500);
    if (shouldAbort()) return;

    const reportEl = report && report.getReportEl ? report.getReportEl() : null;
    const assistantEl = report && report.getAssistantEl ? report.getAssistantEl() : null;
    const editorShell =
      document.getElementById("wb-editor-view") ||
      document.querySelector(".wb-editor-view") ||
      reportEl;

    // 16.8–17.5 — editor establish
    await focusTarget(editorShell || reportEl, {
      scale: prefersReducedMotion ? 1 : 1,
      duration: prefersReducedMotion ? 60 : 700,
      centerX: 0.5,
      centerY: 0.5,
      element: editorShell || reportEl,
    });
    if (shouldAbort()) return;

    const agentPlanEl = await waitForAgentPlanEl(1600);
    const agentFocus =
      agentPlanEl ||
      (report && report.getAgentPlanEl && report.getAgentPlanEl()) ||
      assistantEl;

    // 17.5–18.4 — strong push into Agent Plan
    if (agentFocus) {
      await focusTarget(agentFocus, {
        scale: prefersReducedMotion ? 1.06 : SCALE.agent,
        duration: prefersReducedMotion ? 80 : 880,
        centerX: 0.5,
        centerY: 0.5,
        element: agentFocus,
      });
    }
    await holdDemo(prefersReducedMotion ? 80 : 300);
    demoEngine.agentPlanFocusReady = true;
    if (shouldAbort()) return;

    // 18.4–21.8 — close-up while analysis tasks progress
    await waitForTodoLabel(/Plan report structure|Draft report/i, prefersReducedMotion ? 900 : 4200);
    if (shouldAbort()) return;

    // 21.8–22.6 — widen as drafting begins
    const dualTarget = reportEl || assistantEl || editorShell;
    await focusTarget(dualTarget, {
      scale: prefersReducedMotion ? 1.03 : SCALE.generate,
      duration: prefersReducedMotion ? 60 : 780,
      centerX: 0.46,
      centerY: 0.5,
      element: dualTarget,
    });

    await waitDuringGeneration(
      prefersReducedMotion ? 1400 : 3000,
      prefersReducedMotion ? 2200 : 4200
    );
    if (shouldAbort()) return;

    // 24.0–26.5 — final reveal / pull back
    await focusTarget(editorShell || reportEl, {
      scale: prefersReducedMotion ? 1.02 : 1.08,
      duration: prefersReducedMotion ? 60 : 680,
      centerX: 0.5,
      centerY: 0.5,
      element: editorShell || reportEl,
    });
    await holdDemo(prefersReducedMotion ? 100 : 700);
    if (shouldAbort()) return;

    await resetCamera({ duration: prefersReducedMotion ? 80 : 850 });
    await holdDemo(prefersReducedMotion ? 100 : 700);
    if (compose.mountEduForDemo) compose.mountEduForDemo(false);
    endCinematic();
  }

  async function waitForAgentPlanEl(maxMs) {
    const start = performance.now();
    while (performance.now() - start < (maxMs || 1600)) {
      if (shouldAbort()) return null;
      const el =
        document.getElementById("wb-assistant-working") ||
        document.getElementById("wb-agent-progress");
      if (el) return el;
      await holdDemo(40);
    }
    return (
      document.getElementById("wb-assistant-working") ||
      document.getElementById("wb-agent-progress")
    );
  }

  async function waitForTodoLabel(pattern, maxMs) {
    const start = performance.now();
    while (performance.now() - start < (maxMs || 4000)) {
      if (shouldAbort()) return;
      const active = document.querySelector(
        "#wb-agent-progress .wb-agent-todo__item.is-active .wb-agent-todo__label"
      );
      const text = active ? (active.textContent || "").trim() : "";
      if (text && pattern.test(text)) return;
      await holdDemo(70);
    }
  }

  /* —— Registry —— */
  demoRegistry["create-report"] = {
    id: "create-report",
    title: "Create a Report",
    description: "Template → prompt → report generation",
    icon: "file-plus-2",
    enabled: true,
    duration: 30500,
    reset: resetCreateReportState,
    run: runCreateReportDemo,
    cleanup: async function (opts) {
      resetDemoPhase();
      const compose = Compose();
      if (compose && compose.freezeEduPlacement) compose.freezeEduPlacement(false);
      if (compose && compose.hideEduPopout) compose.hideEduPopout();
      if (compose && compose.hideContextPreview) compose.hideContextPreview();
      if (compose && compose.mountEduForDemo) compose.mountEduForDemo(false);
      if (compose && compose.clearChipHovers) compose.clearChipHovers();
      endCinematic();
      await resetCamera({ instant: true });
      hideDemoCursor();
      if (opts && opts.aborted && compose && compose.requestNewDocument) {
        compose.requestNewDocument();
      }
    },
  };

  demoRegistry.references = {
    id: "references",
    title: "Evidence & References",
    description: "Citations and source grounding",
    icon: "book-open",
    enabled: true,
    duration: 30500,
    reset: resetReferencesDemoState,
    run: runReferencesDemo,
    cleanup: async function () {
      const report = Report();
      if (report && report.resetEvidenceState) report.resetEvidenceState();
      demoEngine.cameraMode = null;
      endCinematic();
      await resetCamera({ instant: true });
      hideDemoCursor();
    },
  };

  demoRegistry.review = {
    id: "review",
    title: "Show Edits & Comments",
    description: "Review traceability and feedback",
    icon: "list-checks",
    enabled: true,
    duration: 28000,
    reset: resetReviewDemoState,
    run: runReviewDemo,
    cleanup: async function () {
      const report = Report();
      if (report && report.resetReviewState) report.resetReviewState();
      endCinematic();
      await resetCamera({ instant: true });
      hideDemoCursor();
    },
  };

  async function resetReferencesDemoState() {
    const report = Report();
    const cam = Camera();
    if (cam) {
      endCinematic();
      await resetCamera({ instant: true });
    }
    if (report && report.ensureCompletedReport) {
      report.ensureCompletedReport({
        scrollToSelector: '.wb-cite-group[data-cite-group="3,4,5"]',
      });
      if (report.resetEvidenceState) report.resetEvidenceState();
    }
    demoEngine.cameraMode = null;
    await holdDemo(prefersReducedMotion ? 40 : 160);
  }

  async function resetReviewDemoState() {
    const report = Report();
    const cam = Camera();
    if (cam) {
      endCinematic();
      await resetCamera({ instant: true });
    }
    if (report && report.ensureCompletedReport) {
      report.ensureCompletedReport({
        resetRevisions: true,
        resetComments: true,
        scrollToSelector: "#wb-section-impl",
      });
      if (report.resetReviewState) report.resetReviewState();
    }
    await holdDemo(prefersReducedMotion ? 40 : 160);
  }

  async function runReferencesDemo() {
    const report = Report();
    const cam = Camera();
    if (!report || !cam) return;

    if (report.ensureCompletedReport) {
      report.ensureCompletedReport({
        scrollToSelector: '.wb-cite-group[data-cite-group="3,4,5"]',
      });
    }
    if (report.resetEvidenceState) report.resetEvidenceState();
    demoEngine.cameraMode = null;
    const appEl = document.getElementById("wb-app");
    if (appEl) appEl.classList.add("is-assistant-open");
    const fab = document.getElementById("wb-assistant-fab");
    if (fab) fab.hidden = true;

    startCinematic();
    if (cam.setInstant) cam.setInstant(1, 0, 0);

    const reportEl = report.getReportEl && report.getReportEl();
    const editorShell =
      report.getEditorView && report.getEditorView()
        ? report.getEditorView()
        : document.getElementById("wb-editor-view");
    const occList = document.getElementById("wb-source-panel-list");

    function workspaceFrame() {
      const editor = editorShell || reportEl;
      const panel = report.getSourcePanel && report.getSourcePanel();
      const icon = report.getAssistantSourcesBtn && report.getAssistantSourcesBtn();
      let rect = editor ? editor.getBoundingClientRect() : null;
      if (panel && !panel.hidden) rect = unionClientRects(rect, panel.getBoundingClientRect());
      if (icon) rect = unionClientRects(rect, icon.getBoundingClientRect());
      return rect;
    }

    async function clickDemoControl(el) {
      if (!el) return;
      await moveDemoCursorToEl(el, { settle: false });
      report.setControlHover && report.setControlHover(el, true);
      await holdDemo(prefersReducedMotion ? 40 : 140);
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 30 : 70);
        demoCursorEl.classList.remove("is-clicking");
      }
      report.setControlHover && report.setControlHover(el, false);
    }

    async function parkCursorOnPopout(citePop, citeBody) {
      const el = citeBody || citePop;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (!isValidClientRect(r)) return;
      placeDemoCursor(r.left + 28, r.top + Math.min(72, r.height * 0.28));
    }

    // Scene 1 — Inline references [3] → [4] context → [5]
    await holdDemo(prefersReducedMotion ? 180 : 800);
    if (shouldAbort()) return;

    const citeGroup =
      document.querySelector('.wb-cite-group[data-cite-group="3,4,5"]') ||
      document.querySelector('.wb-cite[data-ref="3"]');
    const citePara = citeGroup && citeGroup.closest("p");
    const cite3 =
      document.querySelector('.wb-cite[data-ref="3"][data-cite-group="3,4,5"]') ||
      document.querySelector('.wb-cite[data-ref="3"]');

    await applyReferencesCameraMode("citation-paragraph", citePara || citeGroup || reportEl, {
      element: citePara || citeGroup,
    });
    if (shouldAbort()) return;

    if (cite3) {
      const r = cite3.getBoundingClientRect();
      if (isValidClientRect(r)) {
        placeDemoCursor(r.left - 36, r.top + r.height * 0.5);
        showDemoCursor();
      }
      await clickDemoControl(cite3);
      cite3.classList.remove("is-hover");
      report.openCite(3, cite3);
    }
    if (shouldAbort()) return;

    await waitLayoutFrames(2);
    const citePop = report.getCitePopover && report.getCitePopover();
    const citeBody = report.getCiteBody && report.getCiteBody();
    await applyReferencesCameraMode("inline-reference-detail", citePop || citeBody, {
      element: citePop || citeBody,
      force: true,
    });
    await holdDemo(prefersReducedMotion ? 140 : 850);
    if (shouldAbort()) return;

    const nextBtn = report.getCiteNextBtn && report.getCiteNextBtn();
    if (nextBtn) await clickDemoControl(nextBtn);
    if (report.citeNext) report.citeNext();
    await holdDemo(prefersReducedMotion ? 50 : 200);
    await waitLayoutFrames(2);
    if (shouldAbort()) return;

    await holdDemo(prefersReducedMotion ? 120 : 950);
    parkCursorOnPopout(citePop, citeBody);

    const scrollInfo = report.getCiteBodyScroll && report.getCiteBodyScroll();
    if (citeBody && scrollInfo && !prefersReducedMotion) {
      const viewH = scrollInfo.height || citeBody.clientHeight;
      const markTop = scrollInfo.highlightTop || 0;
      const para = Math.round(Math.min(168, Math.max(96, viewH * 0.4)));
      const up = Math.max(0, (scrollInfo.top || markTop) - para);
      await animateComposerScroll(citeBody, up, 1600);
      await holdDemo(800);
      if (shouldAbort()) return;

      const down = Math.min(
        scrollInfo.max,
        markTop + (scrollInfo.highlightHeight || 28) + para - viewH * 0.2
      );
      await animateComposerScroll(citeBody, down, 1800);
      await holdDemo(900);
    } else {
      await holdDemo(prefersReducedMotion ? 120 : 700);
    }
    if (shouldAbort()) return;

    if (nextBtn && !nextBtn.disabled) {
      await clickDemoControl(nextBtn);
      if (report.citeNext) report.citeNext();
      await holdDemo(prefersReducedMotion ? 80 : 700);
    }
    if (shouldAbort()) return;

    const closeBtn = report.getCiteCloseBtn && report.getCiteCloseBtn();
    if (closeBtn) await clickDemoControl(closeBtn);
    if (report.closeCite) report.closeCite();

    demoEngine.cameraMode = null;
    await applyReferencesCameraMode("citation-paragraph", citePara || reportEl, {
      scale: prefersReducedMotion ? 1.05 : 1.16,
      duration: prefersReducedMotion ? 60 : 680,
      element: citePara || reportEl,
      force: true,
    });
    if (shouldAbort()) return;

    // Scene 2 — Sources Used / View source
    const sourcesBtn = report.getSourcesBtn && report.getSourcesBtn();
    if (sourcesBtn) {
      await ensureDemoTargetVisible(sourcesBtn, {
        preferredScale: prefersReducedMotion ? 1.05 : 1.18,
        centerX: 0.52,
        centerY: 0.42,
        duration: prefersReducedMotion ? 60 : 720,
      });
      await clickDemoControl(sourcesBtn);
      report.openSources();
    }
    if (shouldAbort()) return;

    const sourcesPop = report.getSourcesPopover && report.getSourcesPopover();
    const sourcesRow =
      (report.getSourcesRow && report.getSourcesRow(3)) ||
      (sourcesPop && sourcesPop.querySelector('.wb-sources-list__btn[data-open-ref="3"]'));
    await ensureDemoTargetVisible(sourcesRow || sourcesPop || sourcesBtn, {
      preferredScale: prefersReducedMotion ? 1.06 : 1.28,
      centerX: 0.5,
      centerY: 0.48,
      duration: prefersReducedMotion ? 60 : 620,
      force: true,
    });
    await holdDemo(prefersReducedMotion ? 50 : 160);
    if (sourcesRow) {
      await moveDemoCursorToEl(sourcesRow, { settle: false });
      sourcesRow.classList.add("is-hover");
      report.setControlHover && report.setControlHover(sourcesRow, true);
      await holdDemo(prefersReducedMotion ? 60 : 420);
    }
    if (shouldAbort()) return;

    const openPanelBtn = report.getSourcesOpenPanelBtn && report.getSourcesOpenPanelBtn(3);
    if (openPanelBtn) {
      await moveDemoCursorToEl(openPanelBtn, { settle: false, offsetX: 14, offsetY: 14 });
      await holdDemo(prefersReducedMotion ? 40 : 140);
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 30 : 70);
        demoCursorEl.classList.remove("is-clicking");
      }
      openPanelBtn.click();
    } else if (report.openSourceInPanel) {
      if (report.closeSources) report.closeSources();
      report.openSourceInPanel(3);
    }
    if (sourcesRow) {
      sourcesRow.classList.remove("is-hover");
      report.setControlHover && report.setControlHover(sourcesRow, false);
    }
    if (shouldAbort()) return;

    // Scene 3 — stable right-panel focus
    await waitLayoutFrames(2);
    const sourcePanel = report.getSourcePanel && report.getSourcePanel();
    const sourceViewer = report.getSourceViewer && report.getSourceViewer();
    const sourceIcon = report.getAssistantSourcesBtn && report.getAssistantSourcesBtn();
    await applyReferencesCameraMode("right-panel-detail", sourcePanel || sourceViewer, {
      element: sourcePanel || sourceViewer,
      force: true,
    });
    if (sourceIcon) {
      report.setControlHover && report.setControlHover(sourceIcon, true);
      await holdDemo(prefersReducedMotion ? 40 : 280);
      report.setControlHover && report.setControlHover(sourceIcon, false);
    }
    if (shouldAbort()) return;

    const usageToggle = report.getSourceUsageToggle && report.getSourceUsageToggle();
    if (usageToggle) {
      await applyReferencesCameraMode("right-panel-detail", usageToggle, {
        allowPan: true,
        centerY: 0.55,
        duration: prefersReducedMotion ? 50 : 520,
        element: usageToggle,
      });
      await clickDemoControl(usageToggle);
      if (report.setSourceUsageExpanded) report.setSourceUsageExpanded(true);
      else usageToggle.click();
    }
    await waitLayoutFrames(2);
    if (shouldAbort()) return;

    let occ1 = report.getSourceOccurrenceRow && report.getSourceOccurrenceRow(0);
    if (occ1) {
      await applyReferencesCameraMode("right-panel-detail", occ1, {
        allowPan: true,
        centerY: 0.58,
        duration: prefersReducedMotion ? 50 : 420,
        element: occ1,
      });
      await moveDemoCursorToEl(occ1, { settle: false });
      occ1.classList.add("is-hover");
      if (report.hoverSourceOccurrence) report.hoverSourceOccurrence(0, true);
      await holdDemo(prefersReducedMotion ? 70 : 280);
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 30 : 70);
        demoCursorEl.classList.remove("is-clicking");
      }
      occ1.classList.remove("is-hover");
      if (report.selectSourceOccurrence) await report.selectSourceOccurrence(0);
      else occ1.click();
      await waitLayoutFrames(2);
    }
    if (shouldAbort()) return;

    const mark1 =
      (report.getSourceOccurrenceMark && report.getSourceOccurrenceMark(0)) ||
      (sourceViewer && sourceViewer.querySelector('[data-source-occ="0"]'));
    const mark1Rect =
      (report.getSourceOccurrenceMarkRect && report.getSourceOccurrenceMarkRect(0)) ||
      (mark1 && mark1.getBoundingClientRect());
    const execFrame = unionClientRects(
      occ1 && occ1.getBoundingClientRect(),
      mark1Rect
    );
    if (execFrame) {
      await applyReferencesCameraMode("right-panel-detail", execFrame, {
        allowPan: true,
        element: mark1 || occ1,
      });
    }
    await holdDemo(prefersReducedMotion ? 80 : 820);
    if (shouldAbort()) return;

    // Scene 4 — one zoom-out for Executive Summary ↔ Report
    const host1 = report.getOccurrenceHost && report.getOccurrenceHost(0);
    occ1 = report.getSourceOccurrenceRow && report.getSourceOccurrenceRow(0);
    const pair1 = unionClientRects(
      unionClientRects(
        occ1 && occ1.getBoundingClientRect(),
        host1 && host1.getBoundingClientRect()
      ),
      mark1Rect
    );
    await applyReferencesCameraMode("cross-panel-relationship", pair1 || occ1 || host1, {
      force: true,
      element: host1 || occ1,
    });
    await holdDemo(prefersReducedMotion ? 80 : 820);
    if (shouldAbort()) return;

    const occ3 = report.getSourceOccurrenceRow && report.getSourceOccurrenceRow(2);
    if (occ3) {
      const occ3Probe = occ3.getBoundingClientRect();
      const occTooSmall = !occ3Probe || occ3Probe.height < 28 || occ3Probe.width < 140;
      if (occTooSmall) {
        await applyReferencesCameraMode("right-panel-detail", sourcePanel || occ3, {
          force: true,
          element: sourcePanel || occ3,
        });
      }
      if (report.centerTargetInScrollContainer && occList) {
        await report.centerTargetInScrollContainer(occ3, occList, {
          topInset: 10,
          bottomInset: 10,
          align: 0.5,
          duration: prefersReducedMotion ? 0 : 620,
        });
      } else {
        await ensureTargetCenteredInPanel(occ3, {
          scroller: occList,
          panel: sourcePanel,
          duration: 620,
          topInset: 10,
          bottomInset: 10,
        });
      }
      await waitLayoutFrames(2);
      await moveDemoCursorToEl(occ3, { settle: false });
      occ3.classList.add("is-hover");
      if (report.hoverSourceOccurrence) report.hoverSourceOccurrence(2, true);
      await holdDemo(prefersReducedMotion ? 60 : 280);
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 30 : 70);
        demoCursorEl.classList.remove("is-clicking");
      }
      occ3.classList.remove("is-hover");
      if (report.selectSourceOccurrence) await report.selectSourceOccurrence(2);
      else occ3.click();
      await waitLayoutFrames(2);
      const mark3 =
        (report.getSourceOccurrenceMark && report.getSourceOccurrenceMark(2)) ||
        (sourceViewer && sourceViewer.querySelector('[data-source-occ="2"]'));
      const mark3Rect =
        (report.getSourceOccurrenceMarkRect && report.getSourceOccurrenceMarkRect(2)) ||
        (mark3 && mark3.getBoundingClientRect());
      const host3 = report.getOccurrenceHost && report.getOccurrenceHost(2);
      const pair3 = unionClientRects(
        unionClientRects(
          occ3.getBoundingClientRect(),
          host3 && host3.getBoundingClientRect()
        ),
        mark3Rect
      );
      await applyReferencesCameraMode("cross-panel-relationship", pair3 || mark3Rect || occ3, {
        force: true,
        element: mark3 || host3 || occ3,
      });
    }
    await holdDemo(prefersReducedMotion ? 120 : 700);
    if (shouldAbort()) return;

    // Scene 5 — toggle Source OFF, restore Assistant
    const sourceToggle = report.getAssistantSourcesBtn && report.getAssistantSourcesBtn();
    const assistantPanel = document.getElementById("wb-assistant");
    const assistantHeader =
      (assistantPanel && assistantPanel.querySelector(".wb-assistant__header")) || assistantPanel;
    const headerFrame = unionClientRects(
      assistantHeader && assistantHeader.getBoundingClientRect(),
      sourceToggle && sourceToggle.getBoundingClientRect()
    );
    await applyReferencesCameraMode("right-panel-header", headerFrame || sourceToggle || assistantHeader, {
      force: true,
      element: sourceToggle || assistantHeader,
    });
    if (sourceToggle) {
      await ensureDemoTargetVisible(sourceToggle, {
        preferredScale: prefersReducedMotion ? 1.08 : 1.22,
        centerX: 0.68,
        centerY: 0.26,
        inset: 0.18,
        duration: prefersReducedMotion ? 50 : 420,
      });
      await moveDemoCursorToEl(sourceToggle, { settle: false });
      report.setControlHover && report.setControlHover(sourceToggle, true);
      await holdDemo(prefersReducedMotion ? 50 : 200);
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 30 : 70);
        demoCursorEl.classList.remove("is-clicking");
      }
      sourceToggle.click();
      report.setControlHover && report.setControlHover(sourceToggle, false);
    } else if (report.setRightPanelMode) {
      report.setRightPanelMode("assistant");
    }
    await holdDemo(prefersReducedMotion ? 80 : 300);
    if (shouldAbort()) return;

    await holdDemo(prefersReducedMotion ? 80 : 700);
    if (shouldAbort()) return;

    const restoredWorkspace = unionClientRects(
      (editorShell || reportEl) && (editorShell || reportEl).getBoundingClientRect(),
      assistantPanel && assistantPanel.getBoundingClientRect()
    );
    demoEngine.cameraMode = null;
    await applyReferencesCameraMode("wide-establish", restoredWorkspace || workspaceFrame() || editorShell || reportEl, {
      element: assistantPanel || editorShell || reportEl,
      duration: prefersReducedMotion ? 80 : 900,
      force: true,
    });
    await holdDemo(prefersReducedMotion ? 80 : 500);
    endCinematic();
  }

  async function runReviewDemo() {
    const report = Report();
    const cam = Camera();
    if (!report || !cam) return;

    if (report.ensureCompletedReport) {
      report.ensureCompletedReport({
        resetRevisions: true,
        resetComments: true,
        scrollToSelector: "#wb-section-impl",
      });
    }
    if (report.resetReviewState) report.resetReviewState();

    startCinematic();
    if (cam.setInstant) cam.setInstant(1, 0, 0);

    const reportEl = report.getReportEl && report.getReportEl();
    const editorShell =
      report.getEditorView && report.getEditorView()
        ? report.getEditorView()
        : document.getElementById("wb-editor-view");
    const showEditsBtn = report.getShowEditsBtn && report.getShowEditsBtn();
    const acceptSlot = "rev-collab-alex";
    const revertSlot = "rev-priya-multi";

    async function travelToReportTarget(target, options) {
      options = options || {};
      if (!target) return null;
      const scroller = document.getElementById("wb-report-scroll");
      const scale = options.scale == null ? 1.3 : options.scale;
      if (report.centerTargetInScrollContainer && scroller) {
        await report.centerTargetInScrollContainer(target, scroller, {
          topInset: 72,
          bottomInset: 48,
          align: 0.48,
          minDuration: 700,
          maxDuration: 1100,
          duration: prefersReducedMotion ? 0 : options.scrollDuration,
        });
      } else if (report.scrollReportToEl) {
        report.scrollReportToEl(target, { instant: !!prefersReducedMotion, block: "center" });
      }
      await waitLayoutFrames(2);
      await ensureDemoTargetVisible(target, {
        preferredScale: prefersReducedMotion ? 1.06 : scale,
        centerX: 0.5,
        centerY: 0.48,
        inset: 0.18,
        duration: prefersReducedMotion ? 50 : options.cameraDuration == null ? 520 : options.cameraDuration,
        element: target,
        force: !!options.force,
      });
      return target;
    }

    function getReportBodyFocusRect() {
      const reportBody =
        (report.getReportScroll && report.getReportScroll()) ||
        document.getElementById("wb-report-scroll") ||
        reportEl;
      if (!reportBody || typeof reportBody.getBoundingClientRect !== "function") return null;
      const box = reportBody.getBoundingClientRect();
      if (!isValidClientRect(box)) return null;
      return {
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        right: box.right,
        bottom: box.bottom,
        element: reportBody,
      };
    }

    async function focusRevisionCard(slot, scale) {
      const card =
        (report.getRevisionDetailBySlot && report.getRevisionDetailBySlot(slot)) ||
        (report.getRevisionUnitBySlot && report.getRevisionUnitBySlot(slot));
      await travelToReportTarget(card || reportEl, { scale: scale == null ? 1.32 : scale });
      return card;
    }

    async function focusCommentComposition(textTarget, overlayEl, options) {
      options = options || {};
      const parts = [];
      const textRect =
        textTarget && typeof textTarget.getBoundingClientRect === "function"
          ? textTarget.getBoundingClientRect()
          : textTarget && typeof textTarget.left === "number"
            ? textTarget
            : null;
      if (isValidClientRect(textRect)) parts.push(textRect);
      if (
        overlayEl &&
        !overlayEl.hidden &&
        typeof overlayEl.getBoundingClientRect === "function"
      ) {
        const overlayRect = overlayEl.getBoundingClientRect();
        if (isValidClientRect(overlayRect)) parts.push(overlayRect);
      }
      let frame = parts[0] || null;
      for (let i = 1; i < parts.length; i++) frame = unionClientRects(frame, parts[i]);
      if (!frame) return false;
      await ensureDemoTargetVisible(frame, {
        preferredScale: prefersReducedMotion ? 1.08 : options.scale == null ? 1.34 : options.scale,
        centerX: 0.5,
        centerY: 0.48,
        inset: options.inset == null ? 0.16 : options.inset,
        duration: prefersReducedMotion ? 50 : options.duration == null ? 280 : options.duration,
        force: !!options.force,
        element: options.element || (textTarget && textTarget.nodeType === 1 ? textTarget : null),
      });
      return true;
    }

    async function clickRevisionAction(slot, action) {
      const btn = report.getRevisionActionBtn && report.getRevisionActionBtn(slot, action);
      if (!btn) return false;
      await ensureDemoTargetVisible(btn, {
        preferredScale: prefersReducedMotion ? 1.06 : 1.3,
        centerX: 0.5,
        centerY: 0.5,
        inset: 0.16,
        duration: prefersReducedMotion ? 40 : 360,
        element: btn,
      });
      await moveDemoCursorToEl(btn, { settle: false });
      report.setControlHover && report.setControlHover(btn, true);
      await holdDemo(prefersReducedMotion ? 40 : 180);
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 30 : 80);
        demoCursorEl.classList.remove("is-clicking");
      }
      report.setControlHover && report.setControlHover(btn, false);
      btn.click();
      return true;
    }

    // 0.0–0.8 clean report
    await holdDemo(prefersReducedMotion ? 180 : 800);
    if (shouldAbort()) return;

    // 0.8–2.2 Show Edits ON
    await focusTarget(showEditsBtn || reportEl, {
      scale: prefersReducedMotion ? 1.05 : 1.2,
      duration: prefersReducedMotion ? 70 : 680,
      centerX: 0.52,
      centerY: 0.42,
      element: showEditsBtn,
    });
    await holdDemo(prefersReducedMotion ? 40 : 180);
    if (shouldAbort()) return;

    if (showEditsBtn) {
      const r = showEditsBtn.getBoundingClientRect();
      if (isValidClientRect(r)) {
        placeDemoCursor(r.left - 28, r.top + r.height * 0.5);
        showDemoCursor();
      }
      await moveDemoCursorToEl(showEditsBtn, { settle: false });
      report.setControlHover && report.setControlHover(showEditsBtn, true);
      await holdDemo(prefersReducedMotion ? 40 : 160);
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 30 : 80);
        demoCursorEl.classList.remove("is-clicking");
      }
      report.setControlHover && report.setControlHover(showEditsBtn, false);
      report.setShowEdits(true);
    }
    await waitLayoutFrames(2);
    const reportBodyFrame = getReportBodyFocusRect();
    if (reportBodyFrame) {
      await focusTarget(reportBodyFrame, {
        scale: prefersReducedMotion ? 1.06 : 1.24,
        duration: prefersReducedMotion ? 70 : 720,
        centerX: 0.5,
        centerY: 0.5,
        element: reportBodyFrame.element,
        force: true,
      });
    }
    await holdDemo(prefersReducedMotion ? 80 : 700);
    if (shouldAbort()) return;

    // Revision A — Accept
    await focusRevisionCard(acceptSlot, 1.32);
    await holdDemo(prefersReducedMotion ? 120 : 800);
    if (shouldAbort()) return;
    await clickRevisionAction(acceptSlot, "accept");
    await holdDemo(prefersReducedMotion ? 80 : 720);
    if (shouldAbort()) return;

    const revertCard =
      (report.getRevisionDetailBySlot && report.getRevisionDetailBySlot(revertSlot)) ||
      (report.getRevisionUnitBySlot && report.getRevisionUnitBySlot(revertSlot));
    await travelToReportTarget(revertCard || reportEl, { scale: 1.32 });
    await holdDemo(prefersReducedMotion ? 80 : 700);
    if (shouldAbort()) return;
    await clickRevisionAction(revertSlot, "revert");
    await holdDemo(prefersReducedMotion ? 80 : 720);
    if (shouldAbort()) return;

    if (report.setShowEdits) report.setShowEdits(false);
    await waitLayoutFrames(2);
    if (shouldAbort()) return;
    if (report.closeCommentComposer) report.closeCommentComposer();
    if (report.closeCommentThread) report.closeCommentThread();
    if (report.hideSelectionToolbar) report.hideSelectionToolbar();

    const commentPhrases = [
      "Implementation requirements should be reviewed and confirmed across Tax, Finance and Technology before the proposed implementation date.",
      "reviewed and confirmed across Tax, Finance and Technology",
      "Clear ownership should be established across Tax, Finance and Technology teams",
    ];
    let commentTarget =
      report.prepareVisiblePhrase &&
      report.prepareVisiblePhrase(commentPhrases, { scroll: true });
    let commentHost = commentTarget && commentTarget.host;
    if (!commentTarget || !isValidClientRect(commentTarget.rect)) {
      commentTarget =
        report.prepareVisiblePhrase &&
        report.prepareVisiblePhrase(commentPhrases, { scroll: true });
      commentHost = commentTarget && commentTarget.host;
    }
    if (!commentTarget || !isValidClientRect(commentTarget.rect)) {
      await focusTarget(editorShell || reportEl, {
        scale: 1,
        duration: prefersReducedMotion ? 60 : 700,
        centerX: 0.5,
        centerY: 0.5,
        element: editorShell || reportEl,
      });
      endCinematic();
      return;
    }

    await travelToReportTarget(commentHost || commentTarget.host, { scale: 1.34, force: true });
    await holdDemo(prefersReducedMotion ? 80 : 500);
    if (shouldAbort()) return;

    commentTarget =
      (report.prepareVisiblePhrase &&
        report.prepareVisiblePhrase(commentPhrases, { scroll: false })) ||
      commentTarget;
    commentHost = commentTarget.host || commentHost;

    await dragSelectReportPhrase(report, commentTarget);
    await waitLayoutFrames(1);
    if (shouldAbort()) return;

    const toolbar = report.getSelectionToolbar && report.getSelectionToolbar();
    if (toolbar && toolbar.hidden && report.showSelectionToolbar) {
      report.showSelectionToolbar({ freeze: true });
    } else if (report.freezeSelectionToolbar) {
      report.freezeSelectionToolbar();
    }
    let selRectAfterDrag = commentTarget.rect;
    try {
      if (commentTarget.range && commentTarget.range.getBoundingClientRect) {
        const liveSel = commentTarget.range.getBoundingClientRect();
        if (isValidClientRect(liveSel)) selRectAfterDrag = liveSel;
      }
    } catch (err) {
      selRectAfterDrag = commentTarget.rect;
    }
    await focusCommentComposition(selRectAfterDrag, toolbar, { scale: 1.34, duration: 240 });
    await holdDemo(prefersReducedMotion ? 80 : 500);
    if (shouldAbort()) return;

    const commentBtn = report.getAddCommentBtn && report.getAddCommentBtn();
    if (commentBtn && isValidClientRect(commentBtn.getBoundingClientRect())) {
      await moveDemoCursorToEl(commentBtn, {
        settle: false,
        duration: prefersReducedMotion ? 80 : 400,
        hoverEl: commentBtn,
      });
      report.setControlHover && report.setControlHover(commentBtn, true);
      await holdDemo(prefersReducedMotion ? 40 : 150);
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 30 : 80);
        demoCursorEl.classList.remove("is-clicking");
      }
      report.setControlHover && report.setControlHover(commentBtn, false);
      report.openCommentComposer();
    }
    await waitLayoutFrames(2);
    if (shouldAbort()) return;

    const composer = report.getCommentComposer && report.getCommentComposer();
    if (composer && !composer.hidden) {
      if (report.freezeCommentComposer) report.freezeCommentComposer();
      let selRectForComposer = selRectAfterDrag;
      try {
        if (commentTarget.range && commentTarget.range.getBoundingClientRect) {
          const liveComposerSel = commentTarget.range.getBoundingClientRect();
          if (isValidClientRect(liveComposerSel)) selRectForComposer = liveComposerSel;
        }
      } catch (err) {
        selRectForComposer = selRectAfterDrag;
      }
      await focusCommentComposition(selRectForComposer, composer, { scale: 1.34, duration: 220 });
    }
    await holdDemo(prefersReducedMotion ? 40 : 300);
    if (shouldAbort()) return;

    const commentInput = document.getElementById("wb-comment-composer-input");
    if (commentInput && isValidClientRect(commentInput.getBoundingClientRect())) {
      await moveDemoCursorToEl(commentInput, {
        settle: false,
        duration: prefersReducedMotion ? 70 : 240,
        offsetX: 18,
        offsetY: 16,
      });
      await holdDemo(prefersReducedMotion ? 30 : 120);
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 20 : 70);
        demoCursorEl.classList.remove("is-clicking");
      }
      commentInput.focus();
      commentInput.setSelectionRange(0, 0);
    }
    hideDemoPointerKeepLock();

    const typed = await report.typeComment(
      "Can we confirm this timing with the implementation team?",
      {
        shouldAbort: shouldAbort,
        charDelayMin: 20,
        charDelayMax: 45,
      }
    );
    if (!typed || shouldAbort()) return;
    await holdDemo(prefersReducedMotion ? 40 : 250);

    const submitBtn = document.getElementById("wb-comment-submit");
    if (submitBtn && isValidClientRect(submitBtn.getBoundingClientRect())) {
      showDemoCursor();
      await moveDemoCursorToEl(submitBtn, {
        settle: false,
        duration: prefersReducedMotion ? 70 : 260,
      });
      await holdDemo(prefersReducedMotion ? 40 : 140);
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 30 : 80);
        demoCursorEl.classList.remove("is-clicking");
      }
    }
    report.submitComment();
    await waitLayoutFrames(2);
    await holdDemo(prefersReducedMotion ? 80 : 700);
    if (shouldAbort()) return;

    const commentThreadId = report.getActiveCommentThreadId && report.getActiveCommentThreadId();
    const commentMark = report.getCommentMark && report.getCommentMark(commentThreadId);
    const commentMarker = report.getCommentMarker && report.getCommentMarker(commentThreadId);
    const thread = report.getCommentThread && report.getCommentThread();
    await focusCommentComposition(commentMark || selRectAfterDrag, thread, {
      scale: 1.34,
      duration: 240,
      element: commentMark || commentHost,
    });
    await holdDemo(prefersReducedMotion ? 80 : 750);
    if (shouldAbort()) return;

    if (report.closeCommentThread) report.closeCommentThread();
    await waitLayoutFrames(2);
    await focusCommentComposition(commentMark, commentMarker, {
      scale: 1.34,
      duration: 220,
      force: true,
      element: commentMark || commentHost,
    });
    await holdDemo(prefersReducedMotion ? 80 : 600);
    if (shouldAbort()) return;

    if (commentMarker && isValidClientRect(commentMarker.getBoundingClientRect())) {
      showDemoCursor();
      await moveDemoCursorToEl(commentMarker, {
        settle: false,
        duration: prefersReducedMotion ? 80 : 600,
        hoverEl: commentMarker,
      });
      report.setControlHover && report.setControlHover(commentMarker, true);
      await holdDemo(prefersReducedMotion ? 40 : 180);
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 30 : 80);
        demoCursorEl.classList.remove("is-clicking");
      }
      report.setControlHover && report.setControlHover(commentMarker, false);
      commentMarker.click();
      await waitLayoutFrames(2);
    } else if (commentMark && isValidClientRect(commentMark.getBoundingClientRect())) {
      commentMark.click();
      await waitLayoutFrames(2);
    }
    const reopenedThread = report.getCommentThread && report.getCommentThread();
    await focusCommentComposition(commentMark || selRectAfterDrag, reopenedThread, {
      scale: 1.34,
      duration: 220,
      element: commentMark || commentHost,
    });
    await holdDemo(prefersReducedMotion ? 80 : 900);
    if (shouldAbort()) return;

    if (report.showAlexReplying) report.showAlexReplying(true);
    await holdDemo(prefersReducedMotion ? 60 : 800);
    if (report.addAlexReply) {
      report.addAlexReply(
        "Yes — I'll validate this with Finance and Technology before we finalise the recommendation."
      );
    }
    await holdDemo(prefersReducedMotion ? 80 : 1000);
    if (shouldAbort()) return;

    // 18.0–18.6 Resolve
    const resolveBtn = document.getElementById("wb-comment-resolve");
    if (resolveBtn && isValidClientRect(resolveBtn.getBoundingClientRect())) {
      await moveDemoCursorToEl(resolveBtn, { settle: false });
      report.setControlHover && report.setControlHover(resolveBtn, true);
      await holdDemo(prefersReducedMotion ? 40 : 180);
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 30 : 80);
        demoCursorEl.classList.remove("is-clicking");
      }
      report.setControlHover && report.setControlHover(resolveBtn, false);
      report.resolveActiveComment();
    }
    hideDemoCursor();
    await holdDemo(prefersReducedMotion ? 80 : 500);
    if (shouldAbort()) return;

    await focusTarget(editorShell || reportEl, {
      scale: 1,
      duration: prefersReducedMotion ? 60 : 780,
      centerX: 0.5,
      centerY: 0.5,
      element: editorShell || reportEl,
    });
    await holdDemo(prefersReducedMotion ? 100 : 800);
    endCinematic();
  }

  async function resetCollaborationDemoState() {
    const report = Report();
    const cam = Camera();
    const collab = Collab();
    if (collab && typeof collab.cancel === "function") {
      await collab.cancel();
    }
    if (cam) {
      endCinematic();
      await resetCamera({ instant: true });
    }
    if (report && report.ensureCompletedReport) {
      report.ensureCompletedReport({
        resetRevisions: true,
        resetComments: true,
        resetCollaborationPeople: true,
      });
    }
    if (report && report.resetCollaborationState) {
      report.resetCollaborationState();
    }
    if (report && report.setShowEdits) report.setShowEdits(false);
    demoEngine.cameraMode = null;
    await holdDemo(prefersReducedMotion ? 40 : 120);
  }

  async function runCollaborationFeatureDemo() {
    const report = Report();
    const cam = Camera();
    const collab = Collab();
    if (!report || !cam || !collab) return;

    if (report.ensureCompletedReport) {
      report.ensureCompletedReport({
        resetRevisions: true,
        resetComments: true,
        resetCollaborationPeople: true,
      });
    }
    if (report.resetCollaborationState) report.resetCollaborationState();
    if (report.setShowEdits) report.setShowEdits(false);

    startCinematic();
    if (cam.setInstant) cam.setInstant(1, 0, 0);

    const reportEl = report.getReportEl && report.getReportEl();
    const editorShell =
      (report.getEditorView && report.getEditorView()) ||
      document.getElementById("wb-editor-view");
    const shareBtn = report.getShareBtn && report.getShareBtn();

    await holdDemo(prefersReducedMotion ? 120 : 700);
    if (shouldAbort()) return;

    await focusTarget(shareBtn || reportEl, {
      scale: prefersReducedMotion ? 1.06 : 1.3,
      duration: prefersReducedMotion ? 70 : 520,
      centerX: 0.52,
      centerY: 0.22,
      element: shareBtn || reportEl,
    });
    await holdDemo(prefersReducedMotion ? 40 : 120);
    if (shouldAbort()) return;

    if (shareBtn && isValidClientRect(shareBtn.getBoundingClientRect())) {
      await moveDemoCursorToEl(shareBtn, { settle: false });
      report.setControlHover && report.setControlHover(shareBtn, true);
      await holdDemo(prefersReducedMotion ? 40 : 160);
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 30 : 80);
        demoCursorEl.classList.remove("is-clicking");
      }
      report.setControlHover && report.setControlHover(shareBtn, false);
      if (report.openSharePopover) report.openSharePopover();
      else shareBtn.click();
    }
    await waitLayoutFrames(2);
    if (shouldAbort()) return;

    const sharePopover = report.getSharePopover && report.getSharePopover();
    if (sharePopover && !sharePopover.hidden && shareBtn) {
      const union = unionClientRects(
        shareBtn.getBoundingClientRect(),
        sharePopover.getBoundingClientRect()
      );
      if (isValidClientRect(union)) {
        await focusTarget(union, {
          scale: prefersReducedMotion ? 1.08 : 1.32,
          duration: prefersReducedMotion ? 60 : 380,
          centerX: 0.55,
          centerY: 0.34,
          element: sharePopover,
        });
      }
    }
    demoEngine.cameraMode = "share-detail";
    await holdDemo(prefersReducedMotion ? 40 : 200);
    if (shouldAbort()) return;

    async function waitUntilShare(predicate, timeoutMs) {
      const limit = timeoutMs == null ? 1200 : timeoutMs;
      const start = performance.now();
      while (performance.now() - start < limit) {
        if (shouldAbort()) return false;
        if (predicate()) return true;
        await waitLayoutFrames(1);
      }
      return predicate();
    }

    function isLiveTarget(el) {
      return !!(
        el &&
        el.isConnected &&
        isValidClientRect(el.getBoundingClientRect())
      );
    }

    function isShareOpen() {
      if (report.isShareOpen) return report.isShareOpen();
      const pop = report.getSharePopover && report.getSharePopover();
      return !!(pop && !pop.hidden && pop.isConnected);
    }

    async function queryLiveEl(getter) {
      let el = typeof getter === "function" ? getter() : null;
      if (isLiveTarget(el)) return el;
      await waitLayoutFrames(2);
      el = typeof getter === "function" ? getter() : null;
      return isLiveTarget(el) ? el : null;
    }

    async function keepShareDetailCamera(options) {
      options = options || {};
      const pop = report.getSharePopover && report.getSharePopover();
      if (!isLiveTarget(pop)) return false;
      const rect = pop.getBoundingClientRect();
      const vp = getDemoCameraViewportRect();
      const pad = 28;
      const clipped = rect.bottom > vp.bottom - pad || rect.top < vp.top + pad;
      if (!clipped && !options.force) return false;
      await focusTarget(pop, {
        scale: prefersReducedMotion ? 1.08 : 1.32,
        duration: prefersReducedMotion ? 40 : 180,
        centerX: 0.55,
        centerY: clipped && rect.bottom > vp.bottom - pad ? 0.4 : 0.34,
        element: pop,
      });
      return true;
    }

    async function clickShareControl(el, options) {
      options = options || {};
      let target = el;
      if (!isLiveTarget(target)) {
        await waitLayoutFrames(2);
        target = options.requery ? options.requery() : el;
      }
      if (!isLiveTarget(target)) return false;
      showDemoCursor();
      await moveDemoCursorToEl(target, {
        settle: false,
        duration: options.duration == null ? (prefersReducedMotion ? 50 : 220) : options.duration,
        hoverEl: target,
        offsetX: options.offsetX,
        offsetY: options.offsetY,
      });
      report.setControlHover && report.setControlHover(target, true);
      await holdDemo(prefersReducedMotion ? 20 : options.hoverMs == null ? 200 : options.hoverMs);
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 16 : 50);
        demoCursorEl.classList.remove("is-clicking");
      }
      report.setControlHover && report.setControlHover(target, false);
      if (options.action) options.action(target);
      else target.click();
      await waitLayoutFrames(1);
      return true;
    }

    async function getLiveAddInput() {
      return queryLiveEl(function () {
        return report.getShareAddInput && report.getShareAddInput();
      });
    }

    async function focusShareAdd(options) {
      options = options || {};
      const addInput = await getLiveAddInput();
      if (!addInput) return false;
      return clickShareControl(addInput, {
        duration: prefersReducedMotion ? 40 : options.duration == null ? 220 : options.duration,
        hoverMs: options.hoverMs == null ? 200 : options.hoverMs,
        offsetX: 22,
        offsetY: 12,
        requery: function () {
          return report.getShareAddInput && report.getShareAddInput();
        },
        action: function (el) {
          el.focus();
        },
      });
    }

    async function typeShareName(name) {
      hideDemoPointerKeepLock();
      if (!report.typeShareAdd) return false;
      return report.typeShareAdd(name, {
        shouldAbort: shouldAbort,
        charDelayMin: 35,
        charDelayMax: 65,
        onCaret: function (rect) {
          if (!rect || !demoCursorEl) return;
          if (!isValidCursorPoint(rect.left, rect.top)) return;
          demoCursorEl.classList.add("is-editing");
          placeDemoCursor(rect.left, rect.top);
        },
      });
    }

    function getShareSuggestion(id) {
      return (
        (report.getShareSuggestion && report.getShareSuggestion(id)) ||
        document.querySelector('.wb-share-suggestion[data-add-id="' + id + '"]')
      );
    }

    async function selectShareSuggestion(id, options) {
      options = options || {};
      await waitUntilShare(function () {
        return isLiveTarget(getShareSuggestion(id));
      }, 900);
      await holdDemo(prefersReducedMotion ? 40 : 300);
      const suggestion = await queryLiveEl(function () {
        return getShareSuggestion(id);
      });
      showDemoCursor();
      exitDemoTextCaret();
      if (suggestion) {
        await clickShareControl(suggestion, {
          duration: prefersReducedMotion ? 40 : 280,
          hoverMs: prefersReducedMotion ? 40 : 280,
          requery: function () {
            return getShareSuggestion(id);
          },
          action: options.action
            ? options.action
            : function (el) {
                el.click();
              },
        });
      } else if (options.fallback) {
        options.fallback();
      } else if (report.addPersonById) {
        report.addPersonById(id, options.permission);
      }
      await waitLayoutFrames(2);
    }

    function hasSharePerson(id) {
      const row = report.getSharePersonRow && report.getSharePersonRow(id);
      return !!(row && row.isConnected);
    }

    function sharePersonPermission(id) {
      return report.getSharePersonPermission
        ? report.getSharePersonPermission(id)
        : null;
    }

    async function waitForSharePerson(id, permission) {
      const ready = await waitUntilShare(function () {
        if (!isShareOpen() || !hasSharePerson(id)) return false;
        const row = report.getSharePersonRow(id);
        if (!isLiveTarget(row)) return false;
        if (!permission) return true;
        return sharePersonPermission(id) === permission;
      }, 1400);
      if (report.scrollSharePersonIntoView) report.scrollSharePersonIntoView(id);
      await waitLayoutFrames(1);
      await keepShareDetailCamera();
      return ready;
    }

    async function chooseSharePermission(personId, value) {
      if (report.scrollSharePersonIntoView) report.scrollSharePersonIntoView(personId);
      await waitLayoutFrames(2);
      const trigger = await queryLiveEl(function () {
        return report.getSharePermTrigger && report.getSharePermTrigger(personId);
      });
      if (trigger) {
        await clickShareControl(trigger, {
          duration: prefersReducedMotion ? 40 : 220,
          hoverMs: prefersReducedMotion ? 40 : 200,
          requery: function () {
            return report.getSharePermTrigger && report.getSharePermTrigger(personId);
          },
          action: function (el) {
            if (report.openSharePermMenu) report.openSharePermMenu(personId);
            else el.click();
          },
        });
        await waitUntilShare(function () {
          const menu = document.getElementById("wb-share-perm-menu");
          const option =
            (report.getSharePermOption && report.getSharePermOption(value)) ||
            (menu && menu.querySelector('[data-perm="' + value + '"]'));
          return !!(menu && !menu.hidden && isLiveTarget(option));
        }, 700);
        const option = await queryLiveEl(function () {
          const menu = document.getElementById("wb-share-perm-menu");
          return (
            (report.getSharePermOption && report.getSharePermOption(value)) ||
            (menu && menu.querySelector('[data-perm="' + value + '"]'))
          );
        });
        await holdDemo(prefersReducedMotion ? 20 : 300);
        if (option) {
          await clickShareControl(option, {
            duration: prefersReducedMotion ? 36 : 220,
            hoverMs: prefersReducedMotion ? 40 : 200,
            requery: function () {
              const menu = document.getElementById("wb-share-perm-menu");
              return (
                (report.getSharePermOption && report.getSharePermOption(value)) ||
                (menu && menu.querySelector('[data-perm="' + value + '"]'))
              );
            },
          });
        } else if (report.applySharePermissionChoice) {
          report.applySharePermissionChoice(value);
        }
      } else if (personId === "pending" && report.confirmPendingShareAdd) {
        report.confirmPendingShareAdd();
      } else if (report.setPersonPermission && personId !== "pending") {
        report.setPersonPermission(personId, value);
      }
      await waitLayoutFrames(2);
      return true;
    }

    async function addShareCollaborator(id, name) {
      if (shouldAbort()) return false;
      await waitLayoutFrames(2);
      const focused = await focusShareAdd({
        duration: prefersReducedMotion ? 40 : 220,
        hoverMs: prefersReducedMotion ? 40 : 200,
      });
      if (!focused) return false;
      await typeShareName(name);
      if (shouldAbort()) return false;
      await selectShareSuggestion(id, {
        fallback: function () {
          if (report.addPersonById) report.addPersonById(id);
        },
      });
      return true;
    }

    if (shouldAbort()) return;

    await addShareCollaborator("alex", "Alex Morgan");
    if (!hasSharePerson("alex") && report.addPersonById) report.addPersonById("alex");
    await waitForSharePerson("alex", "edit");
    await holdDemo(prefersReducedMotion ? 40 : 520);
    if (shouldAbort()) return;
    if (!isShareOpen() && report.openSharePopover) {
      report.openSharePopover();
      await waitLayoutFrames(2);
      await keepShareDetailCamera();
    }

    await addShareCollaborator("priya", "Priya Shah");
    if (!hasSharePerson("priya") && report.addPersonById) report.addPersonById("priya");
    await waitForSharePerson("priya", "edit");
    await holdDemo(prefersReducedMotion ? 40 : 520);
    if (shouldAbort()) return;
    if (!isShareOpen() && report.openSharePopover) {
      report.openSharePopover();
      await waitLayoutFrames(2);
      await keepShareDetailCamera();
    }

    await addShareCollaborator("daniel", "Daniel Wong");
    if (!hasSharePerson("daniel") && report.addPersonById) report.addPersonById("daniel");
    await waitForSharePerson("daniel", "edit");
    await holdDemo(prefersReducedMotion ? 40 : 420);
    if (shouldAbort()) return;
    if (!isShareOpen() && report.openSharePopover) {
      report.openSharePopover();
      await waitLayoutFrames(2);
      await keepShareDetailCamera();
    }

    if (report.scrollSharePersonIntoView) report.scrollSharePersonIntoView("daniel");
    await waitLayoutFrames(2);
    await keepShareDetailCamera();
    await chooseSharePermission("daniel", "view");
    if (sharePersonPermission("daniel") !== "view" && report.setPersonPermission) {
      report.setPersonPermission("daniel", "view");
    }
    await waitForSharePerson("daniel", "view");
    await waitLayoutFrames(2);
    await keepShareDetailCamera();
    await holdDemo(prefersReducedMotion ? 60 : 600);
    if (shouldAbort()) return;

    const shareClose = await queryLiveEl(function () {
      return report.getShareCloseBtn && report.getShareCloseBtn();
    });
    if (shareClose) {
      await clickShareControl(shareClose, { duration: prefersReducedMotion ? 70 : 240 });
    } else if (report.closeSharePopover) {
      report.closeSharePopover();
    }
    await waitUntilShare(function () {
      return !isShareOpen();
    }, 600);
    if (report.setPersonPresence) {
      report.setPersonPresence("alex", "viewing", true);
      report.setPersonPresence("priya", "viewing", true);
      report.setPersonPresence("daniel", "viewing", true);
    }
    await waitLayoutFrames(2);

    if (collab.prepareLiveSession) {
      await collab.prepareLiveSession();
    }
    if (collab.setFollowChipDeferred) {
      collab.setFollowChipDeferred(true);
    } else if (report.setFollowChipDeferred) {
      report.setFollowChipDeferred(true);
    }
    const alexTyping = collab.startAlexTyping
      ? collab.startAlexTyping()
      : null;

    demoEngine.cameraMode = "full-app-establish";
    await resetCamera({ duration: prefersReducedMotion ? 50 : 450 });
    await holdDemo(prefersReducedMotion ? 60 : 420);
    if (shouldAbort()) return;

    async function getAlexAvatar() {
      return (
        (report.getCollabAvatar && report.getCollabAvatar("alex")) ||
        document.querySelector('#wb-collab-avatars [data-presence-id="alex"]')
      );
    }

    async function interactAlexAvatarFollow() {
      const presence =
        (report.getCollabPresence && report.getCollabPresence()) ||
        document.getElementById("wb-collab-presence");
      let avatar = await getAlexAvatar();
      if (!avatar) return false;
      demoEngine.cameraMode = "avatar-follow";
      showDemoCursor();
      const moveMs = prefersReducedMotion ? 50 : 560;
      await Promise.all([
        focusTarget(presence || avatar, {
          scale: prefersReducedMotion ? 1.08 : 1.18,
          minScale: prefersReducedMotion ? 1.06 : 1.16,
          maxScale: prefersReducedMotion ? 1.1 : 1.22,
          allowScaleUp: true,
          duration: moveMs,
          centerX: 0.62,
          centerY: 0.22,
          element: avatar,
        }),
        moveDemoCursorToEl(avatar, {
          settle: false,
          duration: moveMs,
          skipEnsure: true,
          trackEl: avatar,
          hoverEl: avatar,
        }),
      ]);
      avatar = await getAlexAvatar();
      if (!avatar) return false;
      if (report.setControlHover) report.setControlHover(avatar, true);
      await holdDemo(prefersReducedMotion ? 40 : 220);
      if (shouldAbort()) return false;
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 16 : 50);
        demoCursorEl.classList.remove("is-clicking");
      }
      if (report.setControlHover) report.setControlHover(avatar, false);
      avatar = await getAlexAvatar();
      if (avatar && typeof avatar.click === "function") avatar.click();
      await waitLayoutFrames(1);
      hideDemoCursor();
      return true;
    }

    async function getLiveFollowChip() {
      const chip =
        (report.getFollowChip && report.getFollowChip()) ||
        document.getElementById("wb-follow-chip");
      if (!chip || chip.hidden || chip.classList.contains("is-fading")) return null;
      return isLiveTarget(chip) ? chip : null;
    }

    async function waitForVisibleFollowChip(ms) {
      const timeout = ms == null ? 900 : ms;
      const start = performance.now();
      while (performance.now() - start < timeout) {
        if (shouldAbort()) return null;
        if (report.syncFollowLayer) report.syncFollowLayer();
        const chip = await getLiveFollowChip();
        if (chip) return chip;
        await holdDemo(40);
      }
      return getLiveFollowChip();
    }

    async function revealFollowChip() {
      if (collab.setFollowChipDeferred) collab.setFollowChipDeferred(false);
      else if (report.setFollowChipDeferred) report.setFollowChipDeferred(false);
      if (report.syncFollowLayer) report.syncFollowLayer();
      await waitLayoutFrames(2);
      return waitForVisibleFollowChip(800);
    }

    async function approachFollowChip(chip) {
      if (!chip || !isLiveTarget(chip)) return false;
      if (report.syncFollowLayer) report.syncFollowLayer();
      await waitLayoutFrames(1);
      const live = (await getLiveFollowChip()) || chip;
      const placement =
        (report.getFollowChipPlacement && report.getFollowChipPlacement()) ||
        (live.classList.contains("is-above") ? "above" : "below");
      const affordanceScale = prefersReducedMotion ? 1.08 : 1.22;
      demoEngine.cameraMode = "follow-affordance";
      if (cam.enterCollaborationEditorLock) {
        cam.enterCollaborationEditorLock(affordanceScale);
      }
      showDemoCursor();
      const moveMs = prefersReducedMotion ? 50 : 550;
      await Promise.all([
        focusTarget(live, {
          scale: affordanceScale,
          minScale: prefersReducedMotion ? 1.08 : 1.2,
          maxScale: prefersReducedMotion ? 1.08 : 1.3,
          allowScaleUp: true,
          duration: moveMs,
          centerX: 0.5,
          centerY: placement === "above" ? 0.36 : 0.62,
          lockX: true,
          element: live,
        }),
        moveDemoCursorToEl(live, {
          settle: false,
          duration: moveMs,
          skipEnsure: true,
          trackEl: live,
          hoverEl: live,
        }),
      ]);
      return true;
    }

    async function clickFollowChipInPlace(chip) {
      let target = (await getLiveFollowChip()) || chip;
      if (!isLiveTarget(target)) return false;
      report.setControlHover && report.setControlHover(target, true);
      await holdDemo(prefersReducedMotion ? 40 : 200);
      if (shouldAbort()) return false;
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 16 : 50);
        demoCursorEl.classList.remove("is-clicking");
      }
      report.setControlHover && report.setControlHover(target, false);
      target = (await getLiveFollowChip()) || target;
      if (isLiveTarget(target)) target.click();
      await waitLayoutFrames(1);
      hideDemoCursor();
      return true;
    }

    async function interactFollowChip(options) {
      options = options || {};
      if (options.reveal) {
        await revealFollowChip();
        await holdDemo(
          prefersReducedMotion
            ? 40
            : options.appearHold == null
              ? 320
              : options.appearHold
        );
      }
      if (shouldAbort()) return false;
      const chip = await waitForVisibleFollowChip(800);
      if (!chip) return false;
      await approachFollowChip(chip);
      if (shouldAbort()) return false;
      await clickFollowChipInPlace(chip);
      return true;
    }

    await interactAlexAvatarFollow();
    demoEngine.cameraMode = "live-edit";
    const alexFrame = cam.getState && cam.getState();
    if (collab.accompanyAlexFollow) {
      await collab.accompanyAlexFollow({
        lockScale: alexFrame && alexFrame.scale,
        lockX: alexFrame && alexFrame.x,
        lockY: alexFrame && alexFrame.y,
        settleScale: prefersReducedMotion ? 1.08 : 1.28,
      });
    }
    if (alexTyping) await alexTyping;
    await holdDemo(prefersReducedMotion ? 60 : 520);
    if (shouldAbort()) return;

    const priyaTyping = collab.startPriyaTyping
      ? collab.startPriyaTyping()
      : null;
    await waitLayoutFrames(2);
    await holdDemo(prefersReducedMotion ? 40 : 280);
    if (shouldAbort()) return;

    await interactFollowChip({ reveal: true, appearHold: prefersReducedMotion ? 40 : 280 });
    demoEngine.cameraMode = "live-edit";
    const priyaFrame = cam.getState && cam.getState();
    if (collab.accompanyPriyaFollow) {
      await collab.accompanyPriyaFollow({
        lockScale: priyaFrame && priyaFrame.scale,
        lockX: priyaFrame && priyaFrame.x,
        lockY: priyaFrame && priyaFrame.y,
        settleScale: prefersReducedMotion ? 1.08 : 1.3,
      });
    } else if (collab.runPriyaLiveSequence) {
      await collab.runPriyaLiveSequence();
    }
    if (priyaTyping) await priyaTyping;
    await holdDemo(prefersReducedMotion ? 80 : 520);
    if (collab.completeLiveSession) {
      await collab.completeLiveSession();
    }
    demoEngine.cameraMode = null;
    hideDemoCursor();
    if (shouldAbort()) return;
    await holdDemo(prefersReducedMotion ? 60 : 200);
  }

  demoRegistry.collaboration = {
    id: "collaboration",
    title: "Live Collaboration",
    description: "Multi-user editing and traceability",
    icon: "users",
    enabled: true,
    duration: 28000,
    reset: resetCollaborationDemoState,
    run: runCollaborationFeatureDemo,
    cleanup: async function () {
      const collab = Collab();
      if (collab && typeof collab.cancel === "function") {
        await collab.cancel();
      }
      const report = Report();
      if (report && report.resetCollaborationState) report.resetCollaborationState();
      endCinematic();
      await resetCamera({ instant: true });
      hideDemoCursor();
    },
  };

  async function resetPromptHistoryDemoState() {
    const report = Report();
    const cam = Camera();
    if (cam) {
      endCinematic();
      await resetCamera({ instant: true });
    }
    if (report && report.ensureCompletedReport) {
      report.ensureCompletedReport({
        resetRevisions: true,
        resetComments: true,
        resetPromptHistory: true,
        scrollTop: 0,
      });
    }
    if (report && report.resetPromptHistoryUi) {
      report.resetPromptHistoryUi({
        clearComposer: true,
        assistantMode: true,
        resetScroll: true,
      });
    }
    if (report && report.setShowEdits) report.setShowEdits(false);
    demoEngine.cameraMode = null;
    hideDemoCursor();
    await holdDemo(prefersReducedMotion ? 40 : 120);
  }

  async function runPromptHistoryDemo() {
    const report = Report();
    const cam = Camera();
    if (!report || !cam) return;

    if (report.ensureCompletedReport) {
      report.ensureCompletedReport({
        resetRevisions: true,
        resetComments: true,
        resetPromptHistory: true,
        scrollTop: 0,
      });
    }
    if (report.resetPromptHistoryUi) {
      report.resetPromptHistoryUi({
        clearComposer: true,
        assistantMode: true,
        resetScroll: true,
      });
    }
    if (report.setShowEdits) report.setShowEdits(false);

    startCinematic();
    if (cam.setInstant) cam.setInstant(1, 0, 0);

    const reportEl = report.getReportEl && report.getReportEl();
    const editorShell =
      (report.getEditorView && report.getEditorView()) ||
      document.getElementById("wb-editor-view");
    const historyBtn = report.getPromptHistoryBtn && report.getPromptHistoryBtn();
    const toneId = (report.getTonePromptId && report.getTonePromptId()) || "ph-today-tone";
    const followUp =
      "Keep all legislative references unchanged and make the conclusion more concise.";
    const caretApi = window.WriteBuilderCaret;

    function lastTextNode(el) {
      if (!el) return null;
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
      let node = null;
      let current;
      while ((current = walker.nextNode())) node = current;
      return node;
    }

    async function waitFor(check, ms) {
      const start = performance.now();
      while (performance.now() - start < (ms || 1600)) {
        if (shouldAbort()) return null;
        const value = check();
        if (value) return value;
        await holdDemo(40);
      }
      return check();
    }

    async function hoverAndClick(el, options) {
      options = options || {};
      if (!el) return false;
      await moveDemoCursorToEl(el, { settle: false });
      if (report.setControlHover) report.setControlHover(el, true);
      await holdDemo(
        prefersReducedMotion ? 40 : options.hoverMs == null ? 180 : options.hoverMs
      );
      if (shouldAbort()) return false;
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 30 : 90);
        demoCursorEl.classList.remove("is-clicking");
      }
      if (report.setControlHover) report.setControlHover(el, false);
      if (typeof el.click === "function") el.click();
      return true;
    }

    async function typeSearch(text) {
      const input = report.getPromptHistorySearch && report.getPromptHistorySearch();
      if (!input) return false;
      input.focus();
      input.value = "";
      if (report.setPromptHistoryQuery) report.setPromptHistoryQuery("");
      for (let i = 0; i < text.length; i++) {
        if (shouldAbort()) return false;
        input.value += text.charAt(i);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        await holdDemo(
          prefersReducedMotion
            ? 20
            : 50 + Math.round(Math.random() * 20)
        );
      }
      return true;
    }

    async function typeAssistantDraft(text) {
      const input = report.getAssistantInput && report.getAssistantInput();
      if (!input) return false;
      input.textContent = "";
      input.appendChild(document.createTextNode(""));
      let node = lastTextNode(input);
      if (!node) {
        node = document.createTextNode("");
        input.appendChild(node);
      }
      if (report.placeAssistantCaretAtEnd) report.placeAssistantCaretAtEnd();
      if (caretApi && caretApi.typeTextWithCaret) {
        await caretApi.typeTextWithCaret(node, text, {
          shouldAbort: shouldAbort,
          charDelayMin: prefersReducedMotion ? 12 : 14,
          charDelayMax: prefersReducedMotion ? 20 : 22,
          onCaret: function () {
            if (report.syncAssistantInputEmpty) report.syncAssistantInputEmpty();
            if (report.placeAssistantCaretAtEnd) report.placeAssistantCaretAtEnd();
          },
        });
        if (report.syncAssistantInputEmpty) report.syncAssistantInputEmpty();
        if (report.placeAssistantCaretAtEnd) report.placeAssistantCaretAtEnd();
        return true;
      }
      input.textContent = text;
      if (report.syncAssistantInputEmpty) report.syncAssistantInputEmpty();
      if (report.placeAssistantCaretAtEnd) report.placeAssistantCaretAtEnd();
      return true;
    }

    function historyRow() {
      return (
        (report.getPromptHistoryRow && report.getPromptHistoryRow(toneId)) ||
        document.querySelector('.wb-prompt-history-row[data-prompt-id="' + toneId + '"]')
      );
    }

    // 0.0–0.5 completed Report establish
    await focusTarget(document.getElementById("wb-app") || editorShell || reportEl, {
      scale: 1,
      duration: prefersReducedMotion ? 40 : 400,
      centerX: 0.5,
      centerY: 0.5,
      element: editorShell || reportEl,
    });
    await holdDemo(prefersReducedMotion ? 80 : 420);
    if (shouldAbort()) return;

    // 0.5–1.2 camera → Prompt History
    if (historyBtn) {
      const histRect = historyBtn.getBoundingClientRect();
      if (isValidClientRect(histRect)) {
        placeDemoCursor(histRect.left - 36, histRect.top + histRect.height * 0.5);
        showDemoCursor();
      }
    }
    await focusTarget(historyBtn || reportEl, {
      scale: prefersReducedMotion ? 1.08 : 1.18,
      duration: prefersReducedMotion ? 60 : 560,
      centerX: 0.74,
      centerY: 0.22,
      element: historyBtn,
    });
    await holdDemo(prefersReducedMotion ? 40 : 60);
    if (shouldAbort()) return;

    // 1.2–1.5 click Prompt History
    await hoverAndClick(historyBtn, { hoverMs: prefersReducedMotion ? 40 : 180 });
    await waitLayoutFrames(2);

    // 1.5–2.6 Prompt History UI reading hold — default rows, no cursor chase
    const popover =
      (report.getPromptHistoryPopover && report.getPromptHistoryPopover()) ||
      document.getElementById("wb-prompt-history-popover");
    await focusTarget(popover || historyBtn || reportEl, {
      scale: prefersReducedMotion ? 1.1 : 1.26,
      duration: prefersReducedMotion ? 60 : 400,
      centerX: 0.8,
      centerY: 0.36,
      element: popover,
    });
    await holdDemo(prefersReducedMotion ? 80 : 780);
    if (shouldAbort()) return;

    // 2.6–4.0 search `tone` then hold filtered result
    const search = report.getPromptHistorySearch && report.getPromptHistorySearch();
    if (search) {
      await moveDemoCursorToEl(search, { settle: false });
      await holdDemo(prefersReducedMotion ? 30 : 120);
      search.focus();
      await typeSearch("tone");
    }
    await holdDemo(prefersReducedMotion ? 60 : 500);
    if (shouldAbort()) return;

    // 4.0–4.7 hover target row, then click View Prompt Trace
    const row = historyRow();
    if (row) {
      await moveDemoCursorToEl(row, { settle: false });
      row.classList.add("is-hover");
      await holdDemo(prefersReducedMotion ? 40 : 400);
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 30 : 90);
        demoCursorEl.classList.remove("is-clicking");
      }
      row.classList.remove("is-hover");
      row.click();
    } else if (report.openPromptTrace) {
      await report.openPromptTrace(toneId);
    }
    await waitLayoutFrames(2);

    // 4.7–7.1 camera → Report Before / After
    const firstSlot = document.querySelector('[data-trace-slot="trace-tone-1"]');
    const card = await waitFor(function () {
      return report.getPromptTraceEl && report.getPromptTraceEl();
    }, 1400);
    await holdDemo(prefersReducedMotion ? 80 : 180);
    await focusTarget(card || firstSlot || reportEl, {
      scale: prefersReducedMotion ? 1.1 : 1.3,
      duration: prefersReducedMotion ? 60 : 720,
      centerX: 0.4,
      centerY: 0.48,
      element: card || firstSlot,
    });
    await holdDemo(prefersReducedMotion ? 120 : 1080);
    if (shouldAbort()) return;

    // 7.1–9.2 Next change — Report scrolls, camera follows the new passage
    const nextBtn = report.getPromptTraceAction && report.getPromptTraceAction("next");
    if (nextBtn) {
      await moveDemoCursorToEl(nextBtn, { settle: false });
      if (report.setControlHover) report.setControlHover(nextBtn, true);
      await holdDemo(prefersReducedMotion ? 40 : 180);
      if (shouldAbort()) return;
      if (demoCursorEl) {
        demoCursorEl.classList.add("is-clicking");
        await holdDemo(prefersReducedMotion ? 30 : 90);
        demoCursorEl.classList.remove("is-clicking");
      }
      if (report.setControlHover) report.setControlHover(nextBtn, false);
      const scrollP =
        report.goPromptTraceChange
          ? report.goPromptTraceChange(1)
          : Promise.resolve(typeof nextBtn.click === "function" ? nextBtn.click() : null);
      await waitLayoutFrames(2);
      const secondSlot = document.querySelector('[data-trace-slot="trace-tone-2"]');
      const nextCard = report.getPromptTraceEl && report.getPromptTraceEl();
      await Promise.all([
        scrollP,
        focusTarget(nextCard || secondSlot || reportEl, {
          scale: prefersReducedMotion ? 1.1 : 1.3,
          duration: prefersReducedMotion ? 50 : 720,
          centerX: 0.4,
          centerY: 0.48,
          element: nextCard || secondSlot,
        }),
      ]);
      await holdDemo(prefersReducedMotion ? 80 : 740);
    }
    if (shouldAbort()) return;

    // 9.2–9.6 cursor → Ask Write in the trace header
    const liveCard = report.getPromptTraceEl && report.getPromptTraceEl();
    if (liveCard) liveCard.classList.add("is-hover");
    const askBtn = report.getPromptTraceAction && report.getPromptTraceAction("ask");
    if (askBtn) {
      await hoverAndClick(askBtn, { hoverMs: prefersReducedMotion ? 40 : 180 });
    } else if (report.askWriteFromHistory) {
      report.askWriteFromHistory(toneId);
    }
    if (liveCard) liveCard.classList.remove("is-hover");
    await waitLayoutFrames(2);

    const assistantInput = report.getAssistantInput && report.getAssistantInput();
    const quoteEl = await waitFor(function () {
      const el = report.getComposerQuote && report.getComposerQuote();
      return el && !el.hidden ? el : null;
    }, 1200);
    const composer =
      document.querySelector(".wb-assistant__composer") ||
      quoteEl ||
      assistantInput;

    // 9.6–11.1 camera → right Composer, then read the quote
    await focusTarget(composer || reportEl, {
      scale: prefersReducedMotion ? 1.12 : 1.34,
      duration: prefersReducedMotion ? 60 : 640,
      centerX: 0.78,
      centerY: 0.7,
      element: composer,
    });
    hideDemoPointerKeepLock();
    if (report.placeAssistantCaretAtEnd) report.placeAssistantCaretAtEnd();
    await holdDemo(prefersReducedMotion ? 80 : 700);
    if (shouldAbort()) return;

    // 11.1–14.0 type under the quote — only the real Composer caret
    if (assistantInput) {
      await typeAssistantDraft(followUp);
    }
    await holdDemo(prefersReducedMotion ? 80 : 560);
    if (shouldAbort()) return;

    hideDemoCursor();
    await focusTarget(document.getElementById("wb-app") || editorShell || reportEl, {
      scale: 1,
      duration: prefersReducedMotion ? 60 : 720,
      centerX: 0.5,
      centerY: 0.5,
      element: editorShell || reportEl,
    });
    await holdDemo(prefersReducedMotion ? 80 : 200);
    endCinematic();
  }

  demoRegistry["prompt-history"] = {
    id: "prompt-history",
    title: "Prompt History",
    description: "Searchable prompts with before/after traceability",
    icon: "history",
    enabled: true,
    duration: 15400,
    reset: resetPromptHistoryDemoState,
    run: runPromptHistoryDemo,
    cleanup: async function () {
      const report = Report();
      if (report && report.resetPromptHistoryUi) {
        report.resetPromptHistoryUi({
          clearComposer: true,
          assistantMode: true,
          resetScroll: true,
        });
      }
      endCinematic();
      await resetCamera({ instant: true });
      hideDemoCursor();
    },
  };

  async function waitForCollabIdleOrComplete() {
    const collab = Collab();
    if (!collab) return;
    // After restart, status becomes running then complete
    let sawRunning = false;
    const start = performance.now();
    while (performance.now() - start < 90000) {
      if (shouldAbort()) {
        if (collab.cancel) await collab.cancel();
        return;
      }
      const status = collab.getStatus ? collab.getStatus() : "idle";
      if (status === "running") sawRunning = true;
      if (sawRunning && status === "complete") return;
      if (sawRunning && status === "idle") return;
      await holdDemo(200);
    }
  }

  /* —— Events —— */
  if (settingsBtn) {
    settingsBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleSettingsMenu();
    });
  }

  if (demoSubmenuTrigger) {
    demoSubmenuTrigger.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (!isDemoSubmenuOpen()) openDemoSubmenu();
    });
    demoSubmenuTrigger.addEventListener("pointerenter", function () {
      if (!isSettingsMenuOpen()) return;
      scheduleOpenDemoSubmenu();
    });
    demoSubmenuTrigger.addEventListener("pointerleave", function () {
      scheduleCloseDemoSubmenu();
    });
  }

  if (demoSubmenu) {
    demoSubmenu.addEventListener("pointerenter", function () {
      clearDemoSubmenuTimers();
      if (isSettingsMenuOpen()) openDemoSubmenu();
    });
    demoSubmenu.addEventListener("pointerleave", function () {
      scheduleCloseDemoSubmenu();
    });
  }

  if (settingsWrap) {
    settingsWrap.addEventListener("click", function (e) {
      const btn = e.target && e.target.closest ? e.target.closest("[data-demo-play]") : null;
      if (!btn || !settingsWrap.contains(btn)) return;
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute("data-demo-play");
      if (id) playDemo(id);
    });
  }

  document.addEventListener("click", function (e) {
    if (settingsWrap && settingsWrap.contains(e.target)) return;
    closeSettingsMenu();
  });

  window.addEventListener("resize", function () {
    if (isDemoSubmenuOpen()) positionDemoSubmenu();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (isDemoSubmenuOpen()) {
        closeDemoSubmenu();
        if (demoSubmenuTrigger) demoSubmenuTrigger.focus();
        e.preventDefault();
        return;
      }
      if (isSettingsMenuOpen()) {
        closeSettingsMenu();
        if (settingsBtn) settingsBtn.focus();
        e.preventDefault();
        return;
      }
    }

    if (isSettingsMenuOpen()) {
      const inSubmenu = isDemoSubmenuOpen();
      const items = getDemoSubmenuItems();
      const active = document.activeElement;
      const itemIndex = items.indexOf(active);

      if (!inSubmenu && active === demoSubmenuTrigger) {
        if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDemoSubmenu();
          if (items[0]) items[0].focus();
          return;
        }
      }

      if (inSubmenu) {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          closeDemoSubmenu();
          if (demoSubmenuTrigger) demoSubmenuTrigger.focus();
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          const next = itemIndex < 0 ? items[0] : items[(itemIndex + 1) % items.length];
          if (next) next.focus();
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev =
            itemIndex < 0
              ? items[items.length - 1]
              : items[(itemIndex - 1 + items.length) % items.length];
          if (prev) prev.focus();
          return;
        }
        if ((e.key === "Enter" || e.key === " ") && itemIndex >= 0) {
          e.preventDefault();
          const id = active.getAttribute("data-demo-play");
          if (id) playDemo(id);
          return;
        }
      }
    }

    if ((e.key === "D" || e.key === "d") && e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target && e.target.isContentEditable)) {
        return;
      }
      openSettingsMenu();
      e.preventDefault();
    }
  });

  // Initial sync
  syncSettingsDemoItems();
  placeDemoCursor(window.innerWidth * 0.5, window.innerHeight * 0.45);

  window.WriteBuilderDemo = {
    play: playDemo,
    cancel: cancelDemo,
    openCenter: openDemoCenter,
    closeCenter: closeDemoCenter,
    registry: demoRegistry,
    getActive: function () {
      return demoEngine.activeDemo;
    },
    getPhase: function () {
      return demoEngine.phase;
    },
    isAgentPlanFocusReady: function () {
      return !!demoEngine.agentPlanFocusReady;
    },
    camera: {
      focusDemoTarget: function (t, o) {
        return focusTarget(t, o);
      },
      focusDemoRect: function (r, o) {
        return focusTarget(r, o);
      },
      resetDemoCamera: resetCamera,
      holdDemo: holdDemo,
      cancelDemo: cancelDemo,
    },
    cursor: interactionSimulator,
  };
})();
