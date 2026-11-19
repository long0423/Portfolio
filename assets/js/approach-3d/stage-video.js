/**
 * Approach — pre-rendered stage videos (Blender). Each stage listed in STAGE_VIDEOS
 * plays its MP4 in the stage container: loaded only when the stage is shown, muted
 * and inline, holding its final frame. Reduced motion shows the final frame as a
 * still until Replay is pressed.
 */
const ROOT = new URL("../../", import.meta.url);

export const STAGE_VIDEOS = {
  0: {
    src: "media/approach/stage-01.mp4",
    poster: "images/approach/stage-01-video.webp",
    end: "images/approach/stage-01-video-end.webp",
  },
  1: {
    src: "media/approach/stage-02.mp4",
    poster: "images/approach/stage-02-video.webp",
    end: "images/approach/stage-02-video-end.webp",
  },
  2: {
    src: "media/approach/stage-03.mp4",
    poster: "images/approach/stage-03-video.webp",
    end: "images/approach/stage-03-video-end.webp",
  },
  3: {
    src: "media/approach/stage-04.mp4",
    poster: "images/approach/stage-04-video.webp",
    end: "images/approach/stage-04-video-end.webp",
  },
  4: {
    src: "media/approach/stage-05.mp4",
    poster: "images/approach/stage-05-video.webp",
    end: "images/approach/stage-05-video-end.webp",
  },
  5: {
    src: "media/approach/stage-06.mp4",
    poster: "images/approach/stage-06-video.webp",
    end: "images/approach/stage-06-video-end.webp",
  },
};

export class StageVideo {
  constructor(host) {
    this.host = host;
    this.active = null;
    this.resume = false;
    const v = (this.video = document.createElement("video"));
    v.className = "approach-3d__video";
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("muted", "");
    v.setAttribute("aria-hidden", "true");
    v.preload = "none";
    v.disablePictureInPicture = true;
    v.addEventListener("playing", () => host.classList.add("is-playing"));
    v.addEventListener("pause", () => host.classList.remove("is-playing"));
    v.addEventListener("ended", () => host.classList.remove("is-playing"));
    // A file that cannot be loaded or decoded falls back to the stage's final still
    v.addEventListener("error", () => {
      if (this.active != null && v.getAttribute("src")) this.showEnd(STAGE_VIDEOS[this.active]);
    });
    const replay = host.querySelector("[data-approach-replay]");
    host.insertBefore(v, replay || null);
  }

  has(index) {
    return !!STAGE_VIDEOS[index];
  }

  url(path) {
    return new URL(path, ROOT).href;
  }

  show(index, { still = false } = {}) {
    const cfg = STAGE_VIDEOS[index];
    this.active = index;
    this.resume = false;
    this.host.classList.add("is-video");
    if (still) {
      this.showEnd(cfg);
      return;
    }
    this.start(cfg);
  }

  replay() {
    if (this.active == null) return;
    this.start(STAGE_VIDEOS[this.active]);
  }

  hide() {
    if (this.active == null) return;
    this.video.pause();
    this.active = null;
    this.resume = false;
    this.host.classList.remove("is-video", "is-playing");
  }

  /** Pause while the stage is off screen or the page is hidden; continue when back. */
  setVisible(visible) {
    const v = this.video;
    if (this.active == null) return;
    if (!visible && !v.paused && !v.ended) {
      v.pause();
      this.resume = true;
    } else if (visible && this.resume) {
      this.resume = false;
      this.play();
    }
  }

  start(cfg) {
    const v = this.video;
    const src = this.url(cfg.src);
    v.poster = this.url(cfg.poster);
    if (v.getAttribute("src") !== src) {
      v.src = src;
      v.preload = "auto";
    }
    try {
      v.currentTime = 0;
    } catch (e) {}
    this.play(cfg);
  }

  play(cfg) {
    const p = this.video.play();
    // Autoplay can be refused (low-power modes); show the final frame and let Replay start it
    if (p && p.catch) {
      p.catch((err) => {
        if (err && err.name === "AbortError") return;
        if (this.active != null) this.showEnd(cfg || STAGE_VIDEOS[this.active]);
      });
    }
  }

  showEnd(cfg) {
    const v = this.video;
    v.pause();
    if (v.getAttribute("src")) {
      v.removeAttribute("src");
      v.load();
    }
    v.poster = this.url(cfg.end);
    this.host.classList.remove("is-playing");
  }

  dispose() {
    this.video.pause();
    this.video.removeAttribute("src");
    this.video.load();
  }
}
