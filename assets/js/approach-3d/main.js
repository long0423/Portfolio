/**
 * Approach — stage media. Listens for `approach:step` from approach-scrolly.js.
 * Stages listed in STAGE_VIDEOS play their pre-rendered MP4; any other stage shows its
 * rendered still. The real-time scene (director.js) is kept as an opt-in review fallback
 * (?approach3d) and is only downloaded then.
 */
import { StageVideo } from "./stage-video.js";

async function init() {
  const root = document.querySelector("[data-approach-scrolly]");
  const host = document.querySelector("[data-approach-3d]");
  if (!root || !host) return;
  const canvasHost = host.querySelector(".approach-3d__viewport");
  const replayBtn = host.querySelector("[data-approach-replay]");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Credits disclosure: Escape or a click elsewhere closes it
  const credits = document.querySelector("[data-approach-credits]");
  if (credits) {
    credits.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !credits.open) return;
      credits.open = false;
      credits.querySelector("summary").focus();
    });
    document.addEventListener("click", (e) => {
      if (credits.open && !credits.contains(e.target)) credits.open = false;
    });
  }

  const videos = new StageVideo(host);
  const REALTIME = new URLSearchParams(window.location.search).has("approach3d") || host.hasAttribute("data-approach-realtime");
  let director = null;
  let directorLoad = null;
  const loadDirector = () => {
    if (!directorLoad) {
      directorLoad = import("./director.js")
        .then(({ createDirector }) =>
          createDirector(canvasHost, {
            onComplete() {
              host.classList.remove("is-playing");
            },
          })
        )
        .catch(() => null)
        .then((d) => {
          director = d;
          if (!d) host.classList.add("is-fallback");
          return d;
        });
    }
    return directorLoad;
  };

  const activeIndex = () => {
    const btn = root.querySelector(".approach-rail__btn[aria-current='step']");
    const n = btn ? parseInt(btn.getAttribute("data-step"), 10) : 0;
    return isNaN(n) ? 0 : n;
  };

  let current = -1;
  const show = (index, opts) => {
    const still = motionQuery.matches;
    current = index;
    host.setAttribute("data-stage", String(index + 1));
    if (videos.has(index)) {
      if (director) director.hold();
      videos.show(index, { still });
      return;
    }
    videos.hide();
    // Without a video, the stage keeps its rendered still; the real-time scene (and its download)
    // is only used when explicitly requested for review (?approach3d)
    if (!REALTIME) {
      host.classList.remove("is-settled");
      return;
    }
    if (director) {
      director.play(index, { ...opts, still });
      host.classList.toggle("is-playing", !still);
      return;
    }
    // Real-time fallback: keep the stage poster visible until the scene is ready
    host.classList.remove("is-settled");
    loadDirector().then((d) => {
      if (!d || current !== index || videos.has(index)) return;
      d.play(index, { fromCurrent: false, still });
      host.classList.toggle("is-playing", !still);
      window.setTimeout(() => host.classList.add("is-settled"), still ? 0 : 450);
    });
  };

  root.addEventListener("approach:step", (e) => {
    if (e.detail.index !== current) show(e.detail.index, { fromCurrent: true });
  });

  if (replayBtn) {
    replayBtn.addEventListener("click", () => {
      const index = current < 0 ? activeIndex() : current;
      if (videos.has(index)) {
        videos.replay();
        return;
      }
      if (!director) return;
      director.play(index, { fromCurrent: false });
      host.classList.add("is-playing");
    });
  }

  // Pause when the stage is off screen or the page is hidden
  let onScreen = true;
  const sync = () => {
    const visible = onScreen && document.visibilityState === "visible";
    if (director) director.setVisible(visible);
    videos.setVisible(visible);
  };
  const io = new IntersectionObserver((entries) => {
    onScreen = entries.some((en) => en.isIntersecting);
    sync();
  });
  io.observe(host);
  document.addEventListener("visibilitychange", sync);

  motionQuery.addEventListener("change", () => show(current < 0 ? activeIndex() : current, { fromCurrent: false }));

  window.addEventListener("pagehide", () => {
    io.disconnect();
    videos.dispose();
    if (director) director.dispose();
  }, { once: true });

  show(activeIndex(), { fromCurrent: false });
  requestAnimationFrame(() => {
    host.classList.add("is-ready");
    if (videos.has(current)) window.setTimeout(() => host.classList.add("is-settled"), motionQuery.matches ? 0 : 450);
  });

  // Inspection hooks for local review and QA
  window.Approach3D = {
    play: (i) => show(i, { fromCurrent: true }),
    replay: () => (videos.has(current) ? videos.replay() : director && director.replay()),
    seek(i, t) {
      if (!director) return;
      director.index = i;
      director.snapProps = director.snapPoses = director.snapCam = null;
      for (const kind in director.W.people) director.W.people[kind].prevState = null;
      director.playing = false;
      director.stage.stop();
      director.t = t;
      director.renderAt(t);
    },
    /** Render the current frame from another viewpoint (review close-ups). */
    view(pos, target) {
      if (!director) return;
      director.stage.setCamera(pos, target);
      director.stage.render();
    },
    get state() {
      const v = videos.video;
      const video = videos.active == null ? null : { stage: videos.active, src: v.currentSrc, paused: v.paused, ended: v.ended, time: v.currentTime, ready: v.readyState };
      const base = { current, video, director: director ? "loaded" : directorLoad ? "loading" : "not loaded" };
      if (!director) return base;
      const characters = {};
      for (const kind in director.W.people) characters[kind] = director.W.authored(kind) ? "authored" : "built-in";
      return { ...base, index: director.index, t: director.t, playing: director.playing, frames: director.stage.frame, running: director.stage.running, characters };
    },
  };
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
