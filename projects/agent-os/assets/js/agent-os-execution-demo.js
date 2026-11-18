/**
 * Agent OS — Agent execution demo (controlled playback + cinematic camera).
 * One fixture (agent-os-execution-scenario.js), one playback controller, two presentation variants:
 *   before — process-first visibility (concept reconstruction of the earlier execution UI)
 *   after  — outcome-first clarity (one live status line, prominent result, collapsed per-agent activity)
 * Renders through the Builder's shared chat renderers via window.AgentOSBuilder.chat.
 * The camera only transforms #aos-demo-camera-stage (Write-style); product layout is never changed.
 * Contract: docs/workstreams/agent-os-execution-evolution.md, sections C and F.
 */
(function (window, document) {
  "use strict";

  const scenario = window.AgentOSExecutionScenario;
  const builder = window.AgentOSBuilder;
  if (!scenario || !builder || !builder.chat) return;

  const ui = builder.chat;
  const app = ui.els.app;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const VARIANT_IDS = {
    before: "agent-execution-before",
    after: "agent-execution-after",
  };

  const STAGES = ["idle", "landing", "submitted", "running", "result", "details", "follow-up", "complete"];

  function DemoCancelled() {}
  function DemoStop() {}

  const ctl = {
    variant: null,
    stage: "idle",
    token: 0,
    running: false,
    instant: false,
    until: null,
    pending: new Map(),
    saved: null,
    messages: [],
    turns: [],
    followUpsSent: 0,
    stageLog: [],
    startedAt: 0,
  };

  /* —— Scheduling (single tracked timer pool) —— */

  function guard(token) {
    if (token !== ctl.token) throw new DemoCancelled();
  }

  function wait(token, ms) {
    guard(token);
    if (ctl.instant || ms <= 0) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      const key = { kind: "timeout", id: 0, reject: reject, finish: resolve };
      key.id = window.setTimeout(function () {
        ctl.pending.delete(key);
        if (token !== ctl.token) reject(new DemoCancelled());
        else resolve();
      }, ms);
      ctl.pending.set(key, true);
    });
  }

  function waitUntil(token, origin, ms) {
    return wait(token, origin + ms - performance.now());
  }

  function animate(token, duration, onFrame) {
    guard(token);
    if (ctl.instant || duration <= 0) {
      onFrame(1);
      return Promise.resolve();
    }
    return new Promise(function (resolve, reject) {
      const key = { kind: "raf", id: 0, reject: reject, finish: null };
      const start = performance.now();
      key.finish = function () {
        onFrame(1);
        resolve();
      };
      function frame(now) {
        if (token !== ctl.token) {
          ctl.pending.delete(key);
          reject(new DemoCancelled());
          return;
        }
        const t = Math.min(1, (now - start) / duration);
        onFrame(t);
        if (t >= 1) {
          ctl.pending.delete(key);
          resolve();
          return;
        }
        key.id = window.requestAnimationFrame(frame);
      }
      ctl.pending.set(key, true);
      key.id = window.requestAnimationFrame(frame);
    });
  }

  function cancelKey(key) {
    if (key.kind === "raf") window.cancelAnimationFrame(key.id);
    else window.clearTimeout(key.id);
  }

  function clearScheduled() {
    ctl.pending.forEach(function (_, key) {
      cancelKey(key);
      key.reject(new DemoCancelled());
    });
    ctl.pending.clear();
    stopFollow();
    stopLogFollowers();
    stopCameraTrack();
  }

  function fastForward() {
    if (!ctl.running || ctl.instant) return;
    ctl.instant = true;
    if (app) app.classList.add("aos-demo-instant");
    hideCursor();
    resetCamera();
    const keys = Array.from(ctl.pending.keys());
    ctl.pending.clear();
    keys.forEach(function (key) {
      cancelKey(key);
      key.finish();
    });
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) fastForward();
  });

  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  /* —— Stage tracking —— */

  function logMark(name, kind) {
    ctl.stageLog.push({ stage: name, kind: kind || "mark", ms: Math.round(performance.now() - ctl.startedAt), wall: Date.now() });
  }

  function setStage(name) {
    ctl.stage = name;
    logMark(name, "stage");
    if (app) app.dataset.demoStage = name;
    document.dispatchEvent(new CustomEvent("aos-demo-stage", { detail: { variant: ctl.variant, stage: name } }));
    if (ctl.until && ctl.until === name) throw new DemoStop();
  }

  function mark(name) {
    logMark(name, "mark");
  }

  /* —— Camera: Write-style transform on the camera stage, clamped to cover the viewport —— */

  const cameraView = document.getElementById("aos-demo-camera-viewport");
  const cameraStage = document.getElementById("aos-demo-camera-stage");
  const CAMERA_MAX_SCALE = 1.85;
  const camera = { scale: 1, x: 0, y: 0, trackRaf: 0 };

  function cameraMetrics() {
    const vpW = cameraView ? cameraView.clientWidth : window.innerWidth;
    const vpH = cameraView ? cameraView.clientHeight : window.innerHeight;
    return {
      vpW: vpW,
      vpH: vpH,
      coverW: app ? app.offsetWidth : vpW,
      coverH: app ? app.offsetHeight : vpH,
    };
  }

  function clampCamera(state) {
    const m = cameraMetrics();
    const scale = clampNumber(state.scale == null ? 1 : state.scale, 1, CAMERA_MAX_SCALE);
    if (scale <= 1.0005) return { scale: 1, x: 0, y: 0 };
    return {
      scale: scale,
      x: clampNumber(state.x || 0, Math.min(0, m.vpW - m.coverW * scale), 0),
      y: clampNumber(state.y || 0, Math.min(0, m.vpH - m.coverH * scale), 0),
    };
  }

  function paintCamera(state) {
    const c = clampCamera(state);
    camera.scale = c.scale;
    camera.x = c.x;
    camera.y = c.y;
    if (!cameraStage) return c;
    if (c.scale === 1 && c.x === 0 && c.y === 0) cameraStage.style.removeProperty("transform");
    else cameraStage.style.transform = "translate3d(" + c.x.toFixed(2) + "px," + c.y.toFixed(2) + "px,0) scale(" + c.scale.toFixed(4) + ")";
    renderCursor();
    return c;
  }

  function resolveTargets(target) {
    const value = typeof target === "function" ? target() : target;
    return (Array.isArray(value) ? value : [value]).filter(Boolean);
  }

  // Union of the targets' boxes in untransformed stage pixels (independent of the current camera).
  function stageRect(target) {
    const els = resolveTargets(target);
    if (!els.length || !cameraStage) return null;
    const origin = cameraStage.getBoundingClientRect();
    let l = Infinity;
    let t = Infinity;
    let r = -Infinity;
    let b = -Infinity;
    els.forEach(function (el) {
      const rect = el.getBoundingClientRect();
      if (!rect.width && !rect.height) return;
      l = Math.min(l, rect.left);
      t = Math.min(t, rect.top);
      r = Math.max(r, rect.right);
      b = Math.max(b, rect.bottom);
    });
    if (!isFinite(l)) return null;
    const s = camera.scale;
    return { left: (l - origin.left) / s, top: (t - origin.top) / s, width: (r - l) / s, height: (b - t) / s };
  }

  function solveCamera(rect, opts) {
    const m = cameraMetrics();
    const pad = opts.pad == null ? 40 : opts.pad;
    let s = opts.scale;
    if (s == null) s = Math.min((m.vpW - pad * 2) / rect.width, (m.vpH - pad * 2) / rect.height);
    s = clampNumber(s, opts.minScale || 1, Math.min(opts.maxScale || CAMERA_MAX_SCALE, CAMERA_MAX_SCALE));
    const fx = rect.left + rect.width * (opts.focusX == null ? 0.5 : opts.focusX);
    const fy = rect.top + rect.height * (opts.focusY == null ? 0.5 : opts.focusY);
    return clampCamera({
      scale: s,
      x: m.vpW * (opts.anchorX == null ? 0.5 : opts.anchorX) - fx * s,
      y: m.vpH * (opts.anchorY == null ? 0.5 : opts.anchorY) - fy * s,
    });
  }

  function cameraActive() {
    return !ctl.instant && !prefersReducedMotion && !!cameraStage;
  }

  function cameraSet(target, opts) {
    if (!cameraActive()) return;
    stopCameraTrack();
    const rect = stageRect(target);
    if (rect) paintCamera(solveCamera(rect, opts || {}));
  }

  // While moving, the stage is composited (smooth motion); at rest it re-rasterises crisply.
  async function cameraMotion(token, duration, onFrame) {
    if (cameraStage) cameraStage.classList.add("is-camera-moving");
    try {
      await animate(token, duration, onFrame);
    } finally {
      if (cameraStage) cameraStage.classList.remove("is-camera-moving");
    }
  }

  // The end frame is re-solved every frame from the live target, so the move lands on
  // the target even if content shifts while the camera travels.
  function cameraTo(token, target, opts, duration) {
    if (!cameraActive()) return Promise.resolve();
    stopCameraTrack();
    opts = opts || {};
    const from = { scale: camera.scale, x: camera.x, y: camera.y };
    let last = null;
    return cameraMotion(token, duration, function (t) {
      const rect = stageRect(target);
      if (rect) last = solveCamera(rect, opts);
      if (!last) return;
      const e = easeInOut(t);
      paintCamera({
        scale: from.scale + (last.scale - from.scale) * e,
        x: from.x + (last.x - from.x) * e,
        y: from.y + (last.y - from.y) * e,
      });
    });
  }

  // Slow push-in around the current frame centre (keeps a held shot alive without panning).
  function cameraPushIn(token, deltaScale, duration) {
    if (!cameraActive()) return Promise.resolve();
    stopCameraTrack();
    const m = cameraMetrics();
    const from = { scale: camera.scale, x: camera.x, y: camera.y };
    const cx = (m.vpW / 2 - from.x) / from.scale;
    const cy = (m.vpH / 2 - from.y) / from.scale;
    return cameraMotion(token, duration, function (t) {
      const s = from.scale + deltaScale * easeInOut(t);
      paintCamera({ scale: s, x: m.vpW / 2 - cx * s, y: m.vpH / 2 - cy * s });
    });
  }

  function cameraHome(token, duration) {
    if (!cameraActive()) return Promise.resolve();
    stopCameraTrack();
    const from = { scale: camera.scale, x: camera.x, y: camera.y };
    return cameraMotion(token, duration, function (t) {
      const e = easeInOut(t);
      paintCamera({ scale: from.scale + (1 - from.scale) * e, x: from.x * (1 - e), y: from.y * (1 - e) });
    });
  }

  // Keeps a framed target steady while its content updates (translation only, damped).
  function startCameraTrack(target, opts) {
    stopCameraTrack();
    if (!cameraActive()) return;
    const locked = Object.assign({}, opts || {}, { scale: camera.scale });
    function step() {
      const rect = stageRect(target);
      if (rect) {
        const want = solveCamera(rect, locked);
        const dx = want.x - camera.x;
        const dy = want.y - camera.y;
        if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) paintCamera({ scale: camera.scale, x: camera.x + dx * 0.1, y: camera.y + dy * 0.1 });
      }
      camera.trackRaf = window.requestAnimationFrame(step);
    }
    camera.trackRaf = window.requestAnimationFrame(step);
  }

  function stopCameraTrack() {
    if (camera.trackRaf) window.cancelAnimationFrame(camera.trackRaf);
    camera.trackRaf = 0;
  }

  function resetCamera() {
    stopCameraTrack();
    paintCamera({ scale: 1, x: 0, y: 0 });
  }

  /* —— Thread follow scroll —— */

  const follower = { raf: 0 };

  function stopFollow() {
    if (follower.raf) window.cancelAnimationFrame(follower.raf);
    follower.raf = 0;
  }

  function followThread() {
    const thread = ui.els.thread;
    if (!thread) return;
    if (ctl.instant || prefersReducedMotion) {
      thread.scrollTop = thread.scrollHeight;
      return;
    }
    if (follower.raf) return;
    function step() {
      const target = thread.scrollHeight - thread.clientHeight;
      const delta = target - thread.scrollTop;
      if (Math.abs(delta) < 0.75) {
        thread.scrollTop = target;
        follower.raf = 0;
        return;
      }
      thread.scrollTop += delta * 0.14;
      follower.raf = window.requestAnimationFrame(step);
    }
    follower.raf = window.requestAnimationFrame(step);
  }

  /* —— Bounded activity logs (Before): content accumulates inside a fixed-height surface —— */

  const logFollowers = new Map();

  function updateLogClip(box) {
    const wrap = box.parentElement;
    if (!wrap) return;
    const hidden = box.scrollHeight - box.clientHeight;
    const top = box.scrollTop > 2;
    const bottom = hidden - box.scrollTop > 2;
    if (wrap.classList.contains("is-clipped-top") !== top) wrap.classList.toggle("is-clipped-top", top);
    if (wrap.classList.contains("is-clipped-bottom") !== bottom) wrap.classList.toggle("is-clipped-bottom", bottom);
  }

  function followLog(box) {
    if (!box || box.dataset.hold === "1") return;
    if (ctl.instant || prefersReducedMotion) {
      box.scrollTop = box.scrollHeight;
      updateLogClip(box);
      return;
    }
    if (logFollowers.has(box)) return;
    function step() {
      if (box.dataset.hold === "1") {
        logFollowers.delete(box);
        return;
      }
      const target = box.scrollHeight - box.clientHeight;
      const delta = target - box.scrollTop;
      if (Math.abs(delta) < 0.75) {
        box.scrollTop = target;
        updateLogClip(box);
        logFollowers.delete(box);
        return;
      }
      box.scrollTop += delta * 0.18;
      updateLogClip(box);
      logFollowers.set(box, window.requestAnimationFrame(step));
    }
    logFollowers.set(box, window.requestAnimationFrame(step));
  }

  function stopLogFollowers() {
    logFollowers.forEach(function (id) {
      window.cancelAnimationFrame(id);
    });
    logFollowers.clear();
  }

  function bindLogBox(box) {
    box.addEventListener("scroll", function () {
      updateLogClip(box);
      if (box.dataset.hold === "user" && box.scrollHeight - box.clientHeight - box.scrollTop < 4) delete box.dataset.hold;
    }, { passive: true });
    box.addEventListener("wheel", function (e) {
      if (e.deltaY < 0) box.dataset.hold = "user";
    }, { passive: true });
  }

  function scrollLog(token, box, delta, duration) {
    if (!box) return Promise.resolve();
    box.dataset.hold = "1";
    const from = box.scrollTop;
    const to = clampNumber(from + delta, 0, box.scrollHeight - box.clientHeight);
    return animate(token, duration, function (t) {
      box.scrollTop = from + (to - from) * easeInOut(t);
      updateLogClip(box);
    });
  }

  async function releaseLog(token, box, duration) {
    if (!box) return;
    const from = box.scrollTop;
    await animate(token, duration, function (t) {
      box.scrollTop = from + (box.scrollHeight - box.clientHeight - from) * easeInOut(t);
      updateLogClip(box);
    });
    delete box.dataset.hold;
    followLog(box);
  }

  /* —— Demo cursor: anchored to stage content, so camera moves carry it with the UI —— */

  const cursor = {
    el: document.getElementById("aos-demo-cursor"),
    lx: 0,
    ly: 0,
  };

  function viewOrigin() {
    const r = cameraView ? cameraView.getBoundingClientRect() : { left: 0, top: 0 };
    return { left: r.left, top: r.top };
  }

  function toStageLocal(sx, sy) {
    const o = viewOrigin();
    return { x: (sx - o.left - camera.x) / camera.scale, y: (sy - o.top - camera.y) / camera.scale };
  }

  function renderCursor() {
    if (!cursor.el || cursor.el.hidden) return;
    const o = viewOrigin();
    const x = o.left + camera.x + cursor.lx * camera.scale;
    const y = o.top + camera.y + cursor.ly * camera.scale;
    cursor.el.style.transform = "translate3d(" + Math.round(x * 10) / 10 + "px," + Math.round(y * 10) / 10 + "px,0)";
  }

  function placeCursorLocal(lx, ly) {
    cursor.lx = lx;
    cursor.ly = ly;
    renderCursor();
  }

  function showCursor(sx, sy) {
    if (!cursor.el || ctl.instant) return;
    const p = toStageLocal(sx, sy);
    cursor.el.hidden = false;
    placeCursorLocal(p.x, p.y);
    void cursor.el.offsetWidth;
    cursor.el.classList.add("is-visible");
  }

  function showCursorNear(el, dx, dy, anchorX) {
    if (!el) return;
    const p = targetPoint(el, anchorX);
    const o = viewOrigin();
    showCursor(o.left + camera.x + p.x * camera.scale + (dx || 0), o.top + camera.y + p.y * camera.scale + (dy || 0));
  }

  function fadeCursor() {
    if (!cursor.el) return;
    cursor.el.classList.remove("is-visible", "is-clicking", "is-typing");
  }

  function hideCursor() {
    if (!cursor.el) return;
    fadeCursor();
    cursor.el.hidden = true;
  }

  // Target point in stage-local pixels; anchorX picks a horizontal position inside the element.
  function targetPoint(el, anchorX) {
    const rect = el.getBoundingClientRect();
    const sx = anchorX == null ? rect.left + Math.min(rect.width * 0.5, 28) : rect.left + rect.width * anchorX;
    return toStageLocal(sx, rect.top + rect.height * 0.55);
  }

  function cursorTo(token, el, duration, anchorX) {
    if (!el || ctl.instant || !cursor.el) return Promise.resolve();
    const fromX = cursor.lx;
    const fromY = cursor.ly;
    return animate(token, duration, function (t) {
      const p = targetPoint(el, anchorX);
      const k = easeInOut(t);
      placeCursorLocal(fromX + (p.x - fromX) * k, fromY + (p.y - fromY) * k);
    });
  }

  async function press(token, el) {
    if (!ctl.instant && cursor.el) {
      cursor.el.classList.add("is-clicking");
      await wait(token, 110);
      cursor.el.classList.remove("is-clicking");
    }
    if (el) el.click();
  }

  /* —— Builder state —— */

  const delegate = {
    onSend: function (text) {
      if (ctl.running) return false;
      runUserFollowUp(text);
      return true;
    },
    onRelease: function () {
      ctl.token += 1;
      clearScheduled();
      ctl.running = false;
      restoreBuilder();
      ctl.variant = null;
      ctl.stage = "idle";
    },
  };

  function primeSession() {
    if (!ctl.saved) {
      const current = builder.getState();
      ctl.saved = {
        context: ui.getContextItems(),
        agentsCollapsed: !!current.agentsCollapsed,
        artefactsCollapsed: !!current.artefactsCollapsed,
      };
    }
    builder.setState({ agentsCollapsed: true, artefactsCollapsed: true });
    ui.setContextItems(scenario.context);
    ui.beginSession(delegate, { id: "demo-" + scenario.id, title: scenario.title });
    ui.setComposerText("");
    ui.setComposerLocked(true);
    ui.syncComposer();
  }

  function restoreBuilder() {
    stopFollow();
    stopLogFollowers();
    resetCamera();
    hideCursor();
    if (ui.els.composerInput) ui.els.composerInput.classList.remove("is-demo-typing");
    if (ctl.saved) {
      ui.setContextItems(ctl.saved.context);
      builder.setState({ agentsCollapsed: ctl.saved.agentsCollapsed, artefactsCollapsed: ctl.saved.artefactsCollapsed });
      ctl.saved = null;
    }
    ui.setComposerText("");
    ui.setComposerLocked(false);
    if (app) {
      delete app.dataset.demo;
      delete app.dataset.demoStage;
      app.classList.remove("aos-demo-instant");
    }
    ctl.messages = [];
    ctl.turns = [];
    ctl.followUpsSent = 0;
  }

  /* —— Thread nodes —— */

  function enter(node) {
    if (!ctl.instant && !prefersReducedMotion) node.classList.add("aos-demo-enter");
    return node;
  }

  function appendToThread(node) {
    if (!ui.els.thread) return node;
    ui.els.thread.appendChild(enter(node));
    followThread();
    return node;
  }

  function appendUserMessage(text) {
    const node = ui.renderFlowBlock({ type: "user", text: text }, ctl.messages.length);
    ctl.messages.push({ role: "user", content: text });
    appendToThread(node);
    ui.syncComposer();
    return node;
  }

  function statusText(status, detail) {
    const label = scenario.statusLabels[status] || status;
    return detail ? label + " · " + detail : label;
  }

  function findAgent(agents, agentId) {
    return agents.find(function (a) {
      return a.id === agentId;
    });
  }

  function findEvent(agents, agentId, eventId) {
    const agent = findAgent(agents, agentId);
    return agent ? agent.events.find(function (e) { return e.id === eventId; }) : null;
  }

  function completedEventNode(event) {
    return ui.renderTraceEvent({
      id: event.id,
      icon: event.icon,
      label: event.label,
      detail: event.detail,
      duration: event.duration,
      tone: event.tone,
    });
  }

  /* —— Presenter: Before (process-first, dense bounded logs) —— */

  // Middle log lines are scheduled between each event's start and completion, in the same timeline.
  function withLogLines(spec) {
    const starts = {};
    const extra = [];
    spec.timeline.forEach(function (entry) {
      if (entry.type === "event-start") starts[entry.eventId] = entry.at;
    });
    spec.timeline.forEach(function (entry) {
      if (entry.type !== "event-done") return;
      const event = findEvent(spec.agents, entry.agent, entry.eventId);
      const middle = (event && event.log ? event.log : []).slice(1, -1);
      const t0 = starts[entry.eventId];
      middle.forEach(function (line, i) {
        extra.push({ at: Math.round(t0 + ((i + 1) / (middle.length + 1)) * (entry.at - t0)), type: "log-line", agent: entry.agent, eventId: entry.eventId, line: line });
      });
    });
    const order = { phase: 0, "event-done": 1, status: 2, "event-start": 3, "log-line": 4, complete: 5 };
    return spec.timeline
      .concat(extra)
      .map(function (entry, index) {
        return Object.assign({}, entry, { seq: index });
      })
      .sort(function (a, b) {
        return a.at - b.at || order[a.type] - order[b.type] || a.seq - b.seq;
      });
  }

  function createBeforeTurn(spec) {
    const root = ui.createEl("article", "aos-assistant-turn aos-exec aos-exec--before");
    root.dataset.role = "assistant";
    root.setAttribute("data-demo-target", "assistant-message");
    root.setAttribute("data-demo-variant", "before");
    const cards = {};
    const doneCounts = {};
    let grid = null;
    let waitEntry = null;

    function add(node, parent) {
      (parent || root).appendChild(enter(node));
      return node;
    }

    function codeLine(text, extraClass) {
      const p = ui.createEl("p", "aos-trace__nested aos-exec-log__code" + (extraClass ? " " + extraClass : ""));
      p.textContent = text;
      return p;
    }

    function buildCard(agent) {
      const card = ui.createEl("section", "aos-exec-agent" + (agent.primary ? " aos-exec-agent--primary" : ""));
      card.dataset.agentId = agent.id;
      card.setAttribute("data-demo-target", "execution-agent-" + agent.id);
      const head = ui.createEl("header", "aos-exec-agent__head");
      const icon = ui.createEl("span", "aos-exec-agent__icon");
      icon.appendChild(ui.lucideIcon(agent.primary ? "sparkles" : "bot"));
      const name = ui.createEl("span", "aos-exec-agent__name");
      name.textContent = agent.name;
      const count = ui.createEl("span", "aos-exec-agent__count");
      count.textContent = "0/" + agent.events.length;
      const chip = ui.createEl("span", "aos-exec-agent__status");
      head.appendChild(icon);
      head.appendChild(name);
      head.appendChild(count);
      head.appendChild(chip);
      const role = ui.createEl("p", "aos-exec-agent__role");
      role.textContent = agent.role;
      const wrap = ui.createEl("div", "aos-exec-logwrap");
      const box = ui.createEl("div", "aos-exec-log");
      box.setAttribute("data-demo-target", "execution-log-" + agent.id);
      const list = ui.createEl("ul", "aos-trace__list aos-exec-agent__events");
      box.appendChild(list);
      wrap.appendChild(box);
      bindLogBox(box);
      card.appendChild(head);
      card.appendChild(role);
      card.appendChild(wrap);
      doneCounts[agent.id] = 0;
      return card;
    }

    function ensureCard(agentId) {
      if (cards[agentId]) return cards[agentId];
      const agent = findAgent(spec.agents, agentId);
      const card = buildCard(agent);
      cards[agentId] = card;
      if (agent.primary) {
        add(card);
      } else {
        if (!grid) {
          grid = ui.createEl("div", "aos-exec-agents");
          grid.setAttribute("data-demo-target", "execution-sub-agents");
          add(grid);
        }
        add(card, grid);
      }
      followThread();
      return card;
    }

    function boxOf(card) {
      return card.querySelector(".aos-exec-log");
    }

    function listOf(card) {
      return card.querySelector(".aos-exec-agent__events");
    }

    function setStatus(card, status, detail) {
      card.dataset.status = status;
      card.querySelector(".aos-exec-agent__status").textContent = statusText(status, detail);
    }

    function startEntry(card, label, firstLine, id, tone) {
      const li = ui.createEl("li", "aos-trace__event aos-exec-entry");
      if (id) li.dataset.eventId = id;
      if (tone) li.classList.add("is-" + tone);
      const copy = ui.createEl("div", "aos-trace__event-copy");
      const title = ui.createEl("div", "aos-exec-entry__label");
      title.textContent = label;
      copy.appendChild(title);
      if (firstLine) copy.appendChild(codeLine(firstLine));
      li.appendChild(copy);
      ui.setTraceEventStatus(li, "active");
      add(li, listOf(card));
      followLog(boxOf(card));
      return li;
    }

    function finishEntry(card, li, lastLine, duration, tone) {
      if (lastLine) li.querySelector(".aos-trace__event-copy").appendChild(codeLine(lastLine, "aos-exec-log__code--status"));
      ui.setTraceEventStatus(li, "done");
      if (tone === "gap") {
        li.querySelector(".aos-trace__status").replaceWith(ui.lucideIcon("circle-alert", "aos-trace__status"));
      }
      if (duration) {
        const meta = ui.createEl("span", "aos-trace__event-meta");
        meta.textContent = duration;
        li.appendChild(meta);
      }
      followLog(boxOf(card));
    }

    function progressLine() {
      return spec.agents
        .filter(function (a) { return !a.primary; })
        .map(function (a) { return a.id + "_review " + (doneCounts[a.id] || 0) + "/" + a.events.length; })
        .join(" · ");
    }

    return {
      root: root,
      card: function (agentId) {
        return cards[agentId] || null;
      },
      apply: function (entry) {
        if (entry.type === "status") {
          const card = ensureCard(entry.agent);
          setStatus(card, entry.status, entry.detail);
          const agent = findAgent(spec.agents, entry.agent);
          if (agent.primary && entry.status === "waiting" && agent.wait && !waitEntry) {
            waitEntry = startEntry(card, agent.wait.label, agent.wait.op, "wait");
            waitEntry.querySelector(".aos-trace__event-copy").appendChild(codeLine("progress: " + progressLine(), "aos-exec-log__code--live"));
          } else if (agent.primary && entry.status === "running" && waitEntry && !waitEntry.dataset.closed) {
            waitEntry.dataset.closed = "1";
            finishEntry(card, waitEntry, agent.wait.done);
          }
        } else if (entry.type === "event-start") {
          const card = ensureCard(entry.agent);
          const event = findEvent(spec.agents, entry.agent, entry.eventId);
          startEntry(card, event.label + (event.detail ? " — " + event.detail : ""), event.log && event.log[0], event.id, event.tone);
        } else if (entry.type === "log-line") {
          const card = ensureCard(entry.agent);
          const li = card.querySelector('[data-event-id="' + entry.eventId + '"]');
          if (li) li.querySelector(".aos-trace__event-copy").appendChild(enter(codeLine(entry.line)));
          followLog(boxOf(card));
        } else if (entry.type === "event-done") {
          const card = ensureCard(entry.agent);
          const event = findEvent(spec.agents, entry.agent, entry.eventId);
          const li = card.querySelector('[data-event-id="' + entry.eventId + '"]');
          const log = event.log || [];
          if (li) finishEntry(card, li, log.length > 1 ? log[log.length - 1] : null, event.duration, event.tone);
          doneCounts[entry.agent] = (doneCounts[entry.agent] || 0) + 1;
          const agent = findAgent(spec.agents, entry.agent);
          card.querySelector(".aos-exec-agent__count").textContent = doneCounts[entry.agent] + "/" + agent.events.length;
          if (waitEntry && !waitEntry.dataset.closed) {
            const live = waitEntry.querySelector(".aos-exec-log__code--live");
            if (live) live.textContent = "progress: " + progressLine();
          }
        }
      },
      finish: function () {
        add(
          ui.renderFlowBlock(
            { type: "final", text: spec.result.lead, points: spec.result.points, close: spec.result.close, plain: true, demo: "execution-result" },
            0
          )
        );
        followThread();
      },
    };
  }

  /* —— Presenter: After (outcome-first) —— */

  function createAfterTurn(spec) {
    const root = ui.createEl("article", "aos-assistant-turn aos-exec aos-exec--after");
    root.dataset.role = "assistant";
    root.setAttribute("data-demo-target", "assistant-message");
    root.setAttribute("data-demo-variant", "after");
    const firstPhase = spec.run.phases && spec.run.phases[0];
    const status = ui.renderDisclosure({
      variant: "run",
      id: "run-summary",
      label: firstPhase ? firstPhase.label : spec.run.label,
      disabled: true,
      demo: "execution-summary",
    });
    status.classList.add("is-running");
    root.appendChild(status);
    const toggle = status.querySelector(".aos-trace__toggle");
    const label = status.querySelector(".aos-trace__label");
    const inner = status.querySelector(".aos-trace__inner");
    const finalStatus = {};
    const agentRows = {};
    let resultNode = null;

    function setLabel(text) {
      label.textContent = text;
      if (ctl.instant || prefersReducedMotion) return;
      label.classList.remove("is-swapping");
      void label.offsetWidth;
      label.classList.add("is-swapping");
    }

    function buildDetails() {
      spec.agents.forEach(function (agent) {
        const state = finalStatus[agent.id] || { status: "done", detail: "" };
        const row = ui.renderDisclosure({
          variant: "agent",
          icon: agent.primary ? "sparkles" : "bot",
          label: agent.name,
          meta: statusText(state.status, state.detail) + " · " + agent.events.length + " events",
          demo: "execution-agent-" + agent.id,
        });
        row.dataset.agentId = agent.id;
        const list = ui.createEl("ul", "aos-trace__list");
        agent.events.forEach(function (event) {
          list.appendChild(completedEventNode(event));
        });
        row.querySelector(".aos-trace__inner").appendChild(list);
        agentRows[agent.id] = row;
        inner.appendChild(row);
      });
    }

    return {
      root: root,
      status: status,
      summaryToggle: function () {
        return toggle;
      },
      agentRow: function (agentId) {
        return agentRows[agentId] || null;
      },
      agentToggle: function (agentId) {
        return agentRows[agentId] ? agentRows[agentId].querySelector(".aos-trace__toggle") : null;
      },
      result: function () {
        return resultNode;
      },
      apply: function (entry) {
        if (entry.type === "phase") {
          setLabel(entry.phase.label);
        } else if (entry.type === "status") {
          finalStatus[entry.agent] = { status: entry.status, detail: entry.detail };
        } else if (entry.type === "complete") {
          status.classList.remove("is-running");
          toggle.disabled = false;
          setLabel(spec.run.summary);
          buildDetails();
        }
      },
      finish: function () {
        resultNode = ui.renderFlowBlock(
          { type: "final", lead: spec.result.lead, points: spec.result.points, close: spec.result.close, demo: "execution-result" },
          0
        );
        root.appendChild(enter(resultNode));
        followThread();
      },
    };
  }

  const PRESENTERS = {
    before: createBeforeTurn,
    after: createAfterTurn,
  };

  /* —— Shared playback —— */

  function mainSpec() {
    return { agents: scenario.agents, run: scenario.run, timeline: scenario.timeline, result: scenario.result };
  }

  function followUpSpec() {
    const f = scenario.followUp;
    return { agents: f.agents, run: f.run, timeline: f.timeline, result: f.result };
  }

  function playbackScale(variant) {
    return (scenario.playback && scenario.playback[variant]) || 1;
  }

  async function runTurn(token, spec, options) {
    options = options || {};
    const scale = options.timeScale || 1;
    const timeline = ctl.variant === "before" ? withLogLines(spec) : spec.timeline;
    const turn = PRESENTERS[ctl.variant](spec);
    ctl.turns.push(turn);
    appendToThread(turn.root);
    const start = performance.now();
    for (let i = 0; i < timeline.length; i += 1) {
      const entry = timeline[i];
      if (!ctl.instant) {
        const delay = entry.at * scale - (performance.now() - start);
        if (delay > 0) await wait(token, delay);
      }
      guard(token);
      turn.apply(entry);
      if (!timeline[i + 1] || timeline[i + 1].at !== entry.at) ui.refreshIcons();
    }
    turn.finish();
    ui.refreshIcons();
    ctl.messages.push({
      role: "assistant",
      variant: ctl.variant,
      runLabel: spec.run.label,
      agents: spec.agents.map(function (agent) {
        return agent.name;
      }),
      result: spec.result,
    });
    return turn;
  }

  async function typePrompt(token, text, duration) {
    const input = ui.els.composerInput;
    ui.setComposerText("");
    if (ctl.instant) {
      ui.setComposerText(text);
      return;
    }
    if (input) input.classList.add("is-demo-typing");
    if (cursor.el) cursor.el.classList.add("is-typing");
    const per = duration / text.length;
    const start = performance.now();
    for (let i = 1; i <= text.length; i += 1) {
      ui.setComposerText(text.slice(0, i));
      const due = i * per - (performance.now() - start);
      if (due > 0) await wait(token, due);
      else guard(token);
    }
    await wait(token, 140);
    if (input) input.classList.remove("is-demo-typing");
    if (cursor.el) cursor.el.classList.remove("is-typing");
  }

  async function sendComposer(token) {
    const text = ui.els.composerInput ? ui.els.composerInput.textContent.trim() : "";
    await cursorTo(token, ui.els.sendBtn, 360);
    await press(token);
    fadeCursor();
    ui.setComposerText("");
    appendUserMessage(text);
  }

  async function submitPrompt(token, text, typeMs) {
    await cursorTo(token, ui.els.composerInput, 420);
    await press(token);
    await typePrompt(token, text, typeMs);
    await sendComposer(token);
  }

  /* —— Camera framings (measured from live DOM targets) —— */

  function wideTargets() {
    return [ui.els.session, ui.els.composer];
  }

  function userBubble(index) {
    const bubbles = ui.els.thread ? ui.els.thread.querySelectorAll(".aos-detail-user") : [];
    return bubbles[index == null ? bubbles.length - 1 : index] || null;
  }

  const SHOT = {
    wide: { pad: 22, maxScale: 1.2 },
    close: { pad: 26, maxScale: 1.78 },
    loading: { pad: 40, maxScale: 1.68, anchorY: 0.46 },
    result: { pad: 56, maxScale: 1.5, focusY: 0.48 },
    detail: { pad: 48, maxScale: 1.62 },
    row: { pad: 44, maxScale: 1.7 },
  };

  const TOGGLE_ANCHOR = 0.985;

  /* —— Scripts —— */

  async function scriptLanding(token) {
    primeSession();
    ui.setComposerText(scenario.request);
    setStage("landing");
    cameraSet(wideTargets, SHOT.wide);
    const send = ui.els.sendBtn;
    if (send) showCursorNear(send, -150, -74);
    await wait(token, 260);
  }

  async function scriptBefore(token) {
    await scriptLanding(token);
    await sendComposer(token);
    setStage("submitted");
    setStage("running");
    mark("establish");
    const runStart = performance.now();
    const at = function (ms) {
      return waitUntil(token, runStart, ms * playbackScale("before"));
    };
    let turnRef = null;
    const turnPromise = runTurn(token, mainSpec(), { timeScale: playbackScale("before") }).then(function (turn) {
      turnRef = turn;
      return turn;
    });
    const latestTurn = function () {
      return ctl.turns[ctl.turns.length - 1];
    };
    const cardOf = function (agentId) {
      return function () {
        const turn = turnRef || latestTurn();
        return turn && turn.card ? turn.card(agentId) : null;
      };
    };
    const cameraPromise = (async function () {
      await at(2600);
      await cameraTo(token, cardOf("evidence"), SHOT.close, 1050);
      mark("focus-evidence");
      startCameraTrack(cardOf("evidence"), SHOT.close);
      await at(6750);
      await cameraTo(token, cardOf("controls"), SHOT.close, 1000);
      mark("focus-controls");
      startCameraTrack(cardOf("controls"), SHOT.close);
      await at(7750);
      const controlsCard = cardOf("controls")();
      const log = controlsCard ? controlsCard.querySelector(".aos-exec-log") : null;
      if (log) {
        showCursorNear(log, -40, 70, 0.93);
        await cursorTo(token, log, 380, 0.93);
        await scrollLog(token, log, -170, 700);
        mark("log-scrolled");
        await at(9200);
        await releaseLog(token, log, 520);
      }
      fadeCursor();
      await at(9800);
      await cameraTo(token, wideTargets, SHOT.wide, 1200);
      mark("pullback");
    })();
    await Promise.all([turnPromise, cameraPromise]);
    setStage("result");
    mark("outcome");
    await wait(token, 3000);
  }

  async function scriptAfter(token) {
    await scriptLanding(token);
    await sendComposer(token);
    setStage("submitted");
    setStage("running");
    mark("establish");
    const runStart = performance.now();
    const turnPromise = runTurn(token, mainSpec(), { timeScale: playbackScale("after") });
    const cameraPromise = (async function () {
      await waitUntil(token, runStart, 120);
      const turnNow = ctl.turns[ctl.turns.length - 1];
      const statusEl = turnNow ? turnNow.summaryToggle() : null;
      const loadingTarget = function () {
        return [userBubble(0), statusEl];
      };
      await cameraTo(token, loadingTarget, SHOT.loading, 1050);
      mark("loading-focus");
      const total = scenario.run.completeAt * playbackScale("after");
      const remaining = total - (performance.now() - runStart) - 120;
      if (remaining > 400) await cameraPushIn(token, 0.06, remaining);
    })();
    const results = await Promise.all([turnPromise, cameraPromise]);
    const turn = results[0];
    setStage("result");
    await cameraTo(token, function () { return [userBubble(0), turn.root]; }, SHOT.result, 950);
    mark("result-shot");
    await wait(token, 650);

    const summary = turn.summaryToggle();
    showCursorNear(summary, 120, 90, TOGGLE_ANCHOR);
    await cursorTo(token, summary, 420, TOGGLE_ANCHOR);
    await press(token, summary);
    setStage("details");
    await wait(token, 200);
    await cameraTo(token, turn.status, SHOT.detail, 720);
    mark("details-open");
    await wait(token, 380);

    const controls = turn.agentToggle("controls");
    await cursorTo(token, controls, 400, TOGGLE_ANCHOR);
    await press(token, controls);
    await wait(token, 200);
    await cameraTo(token, function () { return turn.agentRow("controls"); }, SHOT.row, 720);
    mark("agent-detail");
    await wait(token, 1200);
    await press(token, controls);
    await wait(token, 240);
    await cursorTo(token, summary, 380, TOGGLE_ANCHOR);
    await press(token, summary);
    fadeCursor();
    await wait(token, 180);
    await cameraTo(token, wideTargets, SHOT.wide, 950);
    mark("overview");
    await wait(token, 320);

    ctl.followUpsSent += 1;
    showCursorNear(ui.els.composerInput, 240, -36);
    await submitPrompt(token, scenario.followUp.prompt, 740);
    setStage("follow-up");
    await runTurn(token, followUpSpec());
    mark("refined");
    await wait(token, 1150);
  }

  const SCRIPTS = {
    before: scriptBefore,
    after: scriptAfter,
  };

  /* —— Public controller —— */

  function normalizeVariant(value) {
    const v = String(value || "").toLowerCase();
    if (v === "before" || v === VARIANT_IDS.before) return "before";
    if (v === "after" || v === VARIANT_IDS.after) return "after";
    return null;
  }

  function cancel() {
    ctl.token += 1;
    clearScheduled();
    hideCursor();
    if (ctl.running) {
      ctl.running = false;
      ui.setComposerLocked(false);
      if (ui.els.composerInput) ui.els.composerInput.classList.remove("is-demo-typing");
    }
  }

  function reset() {
    const active = ctl.stage !== "idle" || ctl.running || !!ctl.saved;
    cancel();
    resetCamera();
    if (!active) return;
    ui.detachSession();
    ui.goHome();
    restoreBuilder();
    ctl.variant = null;
    ctl.stage = "idle";
    ctl.stageLog = [];
  }

  function settleInstant() {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        if (app) app.classList.remove("aos-demo-instant");
      });
    });
  }

  // After a cinematic run the camera eases back to the plain Builder view.
  function settleCamera(token) {
    if (camera.scale === 1 && camera.x === 0 && camera.y === 0) return;
    wait(token, 1400)
      .then(function () {
        return cameraHome(token, 900);
      })
      .catch(function () {});
  }

  async function play(variant, options) {
    options = options || {};
    const key = normalizeVariant(variant || ctl.variant);
    if (!key) throw new Error("Unknown demo variant: " + variant);
    reset();
    ctl.variant = key;
    ctl.instant = !!options.instant || document.hidden || prefersReducedMotion;
    ctl.until = options.until || null;
    ctl.stageLog = [];
    ctl.startedAt = performance.now();
    const token = ++ctl.token;
    ctl.running = true;
    if (app) {
      app.dataset.demo = VARIANT_IDS[key];
      app.classList.toggle("aos-demo-instant", ctl.instant);
    }
    let outcome = "complete";
    try {
      await SCRIPTS[key](token);
      setStage("complete");
    } catch (err) {
      if (err instanceof DemoStop) outcome = "stopped";
      else if (err instanceof DemoCancelled) outcome = "cancelled";
      else {
        console.error("Agent execution demo failed", err);
        outcome = "error";
      }
    } finally {
      if (token === ctl.token) {
        ctl.running = false;
        ctl.until = null;
        hideCursor();
        stopCameraTrack();
        ui.setComposerLocked(false);
        ui.syncComposer();
        if (ctl.instant) {
          resetCamera();
          settleInstant();
        } else if (outcome === "complete") {
          settleCamera(token);
        }
        ctl.instant = false;
      }
    }
    return { variant: VARIANT_IDS[key], stage: ctl.stage, outcome: outcome };
  }

  async function prime(variant) {
    const key = normalizeVariant(variant);
    if (!key) throw new Error("Unknown demo variant: " + variant);
    reset();
    ctl.variant = key;
    if (app) app.dataset.demo = VARIANT_IDS[key];
    ctl.startedAt = performance.now();
    primeSession();
    ctl.stage = "landing";
    if (app) app.dataset.demoStage = "landing";
    ui.setComposerLocked(false);
    return { variant: VARIANT_IDS[key], stage: ctl.stage };
  }

  function goTo(variant, stage) {
    if (STAGES.indexOf(stage) === -1) throw new Error("Unknown demo stage: " + stage);
    return play(variant, { instant: true, until: stage === "complete" ? null : stage });
  }

  function replay() {
    return play(ctl.variant || "after");
  }

  async function runUserFollowUp(text) {
    if (!ctl.variant) return;
    const token = ++ctl.token;
    ctl.running = true;
    ctl.instant = document.hidden || prefersReducedMotion;
    stopCameraTrack();
    ui.setComposerLocked(true);
    try {
      appendUserMessage(text);
      const first = ctl.followUpsSent === 0;
      ctl.followUpsSent += 1;
      const spec = first
        ? followUpSpec()
        : Object.assign({}, followUpSpec(), {
            result: {
              lead: "I'll keep the same three issues at the top and apply that change to the summary.",
              points: [],
              close: "",
            },
          });
      setStage("follow-up");
      await runTurn(token, spec);
      setStage("complete");
    } catch (err) {
      if (!(err instanceof DemoCancelled) && !(err instanceof DemoStop)) console.error(err);
    } finally {
      if (token === ctl.token) {
        ctl.running = false;
        ui.setComposerLocked(false);
        ui.syncComposer();
        if (ctl.instant) settleInstant();
        ctl.instant = false;
      }
    }
  }

  function snapshot() {
    return {
      variant: ctl.variant ? VARIANT_IDS[ctl.variant] : null,
      stage: ctl.stage,
      running: ctl.running,
      messages: ctl.messages.slice(),
      stageLog: ctl.stageLog.slice(),
      camera: { scale: camera.scale, x: camera.x, y: camera.y },
      scenarioId: scenario.id,
    };
  }

  /* —— Settings → Demo submenu —— */

  const menu = document.getElementById("aos-settings-menu");
  const trigger = document.getElementById("aos-settings-demo-trigger");
  const submenu = document.getElementById("aos-settings-demo-menu");
  let submenuCloseTimer = 0;

  function positionSubmenu() {
    if (!submenu || !trigger || submenu.hidden) return;
    const t = trigger.getBoundingClientRect();
    const m = menu ? menu.getBoundingClientRect() : t;
    const width = submenu.offsetWidth || 200;
    const height = submenu.offsetHeight || 120;
    let left = m.left - width - 6;
    let flipRight = false;
    if (left < 8) {
      left = m.right + 6;
      flipRight = true;
    }
    let top = t.top - 6;
    if (top + height > window.innerHeight - 8) top = Math.max(8, window.innerHeight - height - 8);
    submenu.style.left = Math.round(left) + "px";
    submenu.style.top = Math.round(top) + "px";
    submenu.classList.toggle("is-right", flipRight);
  }

  function openSubmenu() {
    if (!submenu || !trigger || !menu || menu.hidden) return;
    window.clearTimeout(submenuCloseTimer);
    submenu.hidden = false;
    trigger.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    submenu.querySelectorAll("[data-aos-demo]").forEach(function (item) {
      item.classList.toggle("is-selected", !!ctl.variant && item.getAttribute("data-aos-demo") === VARIANT_IDS[ctl.variant]);
    });
    positionSubmenu();
  }

  function closeSubmenu() {
    if (!submenu || !trigger) return;
    submenu.hidden = true;
    trigger.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  }

  if (trigger && submenu) {
    trigger.addEventListener("click", function (e) {
      e.stopPropagation();
      openSubmenu();
    });
    trigger.addEventListener("mouseenter", openSubmenu);
    [trigger, submenu].forEach(function (el) {
      el.addEventListener("mouseleave", function () {
        window.clearTimeout(submenuCloseTimer);
        submenuCloseTimer = window.setTimeout(function () {
          if (!submenu.matches(":hover") && !trigger.matches(":hover")) closeSubmenu();
        }, 220);
      });
    });
    submenu.addEventListener("mouseenter", function () {
      window.clearTimeout(submenuCloseTimer);
    });
    submenu.addEventListener("click", function (e) {
      const item = e.target.closest("[data-aos-demo], [data-aos-demo-action]");
      if (!item) return;
      e.stopPropagation();
      closeSubmenu();
      ui.closePopovers();
      if (item.getAttribute("data-aos-demo-action") === "reset") {
        reset();
        return;
      }
      play(item.getAttribute("data-aos-demo"));
    });
    if (menu) {
      new MutationObserver(function () {
        if (menu.hidden) closeSubmenu();
      }).observe(menu, { attributes: true, attributeFilter: ["hidden"] });
    }
    window.addEventListener("resize", positionSubmenu);
  }

  /* —— Public API + URL entry points —— */

  const api = {
    variants: Object.assign({}, VARIANT_IDS),
    stages: STAGES.slice(),
    scenario: scenario,
    play: play,
    prime: prime,
    goTo: goTo,
    replay: replay,
    reset: reset,
    cancel: cancel,
    getState: snapshot,
  };

  window.AgentOSExecutionDemo = api;
  builder.demo = api;

  const params = new URLSearchParams(window.location.search);
  const requested = normalizeVariant(params.get("demo"));
  if (requested) {
    const stage = params.get("stage");
    const autoplay = params.get("autoplay") !== "0";
    window.setTimeout(function () {
      if (stage) goTo(requested, stage);
      else if (autoplay) play(requested);
      else prime(requested);
    }, 400);
  }
})(window, document);
