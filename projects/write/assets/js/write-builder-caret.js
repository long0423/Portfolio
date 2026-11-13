/**
 * Shared caret geometry + cinematic typing helpers.
 * Used by Create Report local demo caret and Live Collaboration remote caret.
 */
(function (global) {
  "use strict";

  function rectFromClient(caretRect) {
    if (!caretRect || !(caretRect.height || caretRect.top || caretRect.left)) return null;
    return {
      top: caretRect.top,
      left: caretRect.left,
      height: caretRect.height,
      width: caretRect.width || 0,
      bottom: caretRect.bottom,
      right: caretRect.right || caretRect.left,
    };
  }

  function measureEmptyInsertion(textNode) {
    const parent = textNode && textNode.parentNode;
    if (!parent) return null;
    const probe = document.createElement("span");
    probe.setAttribute("data-caret-probe", "1");
    probe.appendChild(document.createTextNode("\u200b"));
    probe.style.cssText =
      "display:inline;padding:0;margin:0;border:0;font:inherit;line-height:inherit;";
    parent.insertBefore(probe, textNode.nextSibling);
    const r = probe.getBoundingClientRect();
    parent.removeChild(probe);
    return rectFromClient(r);
  }

  function getCaretRectFromTextPosition(textNode, offset) {
    if (!textNode || textNode.nodeType !== 3) return null;
    const value = textNode.nodeValue || "";
    const safeOffset = Math.max(0, Math.min(offset == null ? value.length : offset, value.length));

    if (!value.length) {
      return measureEmptyInsertion(textNode);
    }

    const range = document.createRange();
    // Always glue the caret to the trailing edge of the last *rendered* character.
    // Collapsed end-of-node ranges can report a predicted/next-line point.
    if (safeOffset > 0) {
      range.setStart(textNode, safeOffset - 1);
      range.setEnd(textNode, safeOffset);
      const glyphRects = range.getClientRects();
      if (glyphRects.length) {
        const last = glyphRects[glyphRects.length - 1];
        return rectFromClient({
          top: last.top,
          left: last.right,
          height: last.height,
          width: 0,
          bottom: last.bottom,
          right: last.right,
        });
      }
    }

    range.setStart(textNode, safeOffset);
    range.collapse(true);
    let rects = range.getClientRects();
    let caretRect = rects.length ? rects[0] : range.getBoundingClientRect();

    return rectFromClient(caretRect) || (safeOffset === 0 ? measureEmptyInsertion(textNode) : null);
  }

  function positionVisualCaret(textNode, offset, fallbackEl) {
    const rect = getCaretRectFromTextPosition(textNode, offset);
    if (rect) return rect;
    if (!fallbackEl || typeof fallbackEl.getBoundingClientRect !== "function") return null;
    const box = fallbackEl.getBoundingClientRect();
    return {
      top: box.top + 2,
      left: box.left,
      height: Math.max(14, Math.min(22, box.height || 16)),
      width: 0,
      bottom: box.top + 18,
      right: box.left,
    };
  }

  function waitForLayout() {
    return new Promise(function (resolve) {
      window.requestAnimationFrame(function () {
        resolve();
      });
    });
  }

  function keepRectVisibleInScroller(scroller, rect, options) {
    if (!scroller || !rect) return false;
    options = options || {};
    const pad = options.padding == null ? 16 : options.padding;
    const box = scroller.getBoundingClientRect();
    let dy = 0;
    if (rect.bottom > box.bottom - pad) dy = rect.bottom - (box.bottom - pad);
    else if (rect.top < box.top + pad) dy = rect.top - (box.top + pad);
    if (Math.abs(dy) < 1) return false;
    const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    const next = Math.max(0, Math.min(max, scroller.scrollTop + dy));
    if (Math.abs(next - scroller.scrollTop) < 1) return false;
    const winY = window.scrollY;
    scroller.scrollTop = next;
    if (window.scrollY !== winY) window.scrollTo(0, winY);
    return true;
  }

  function getHumanTypingDelay(ch, prevCh, options) {
    options = options || {};
    if (options.reduced) return Math.round(8 + Math.random() * 8);

    const letterMin = options.charDelayMin == null ? 20 : options.charDelayMin;
    const letterMax = options.charDelayMax == null ? 45 : options.charDelayMax;
    let delay;

    if (ch === "\n") {
      delay = 100 + Math.random() * 80;
    } else if (ch === " ") {
      delay = 20 + Math.random() * 15;
    } else if (/[.,;:!?—–]/.test(ch)) {
      delay = 50 + Math.random() * 50;
    } else {
      delay = letterMin + Math.random() * Math.max(0, letterMax - letterMin);
    }

    if (prevCh === " " && Math.random() < 0.22) {
      delay += 40 + Math.random() * 50;
    } else if (prevCh === "," || prevCh === ";") {
      delay += 20 + Math.random() * 40;
    } else if (prevCh === ".") {
      delay += 40 + Math.random() * 60;
    }

    if (prevCh === " " && Math.random() < 0.07) {
      delay += 100 + Math.random() * 80;
    }

    return Math.max(12, Math.round(delay));
  }

  async function typeTextWithCaret(textNode, text, options) {
    options = options || {};
    if (!textNode || text == null) return false;
    const shouldAbort = options.shouldAbort;
    const onCaret = options.onCaret;
    const value0 = textNode.nodeValue || "";

    for (let i = 0; i < text.length; i++) {
      if (shouldAbort && shouldAbort()) return false;
      const ch = text.charAt(i);
      const prevCh = i > 0 ? text.charAt(i - 1) : value0.slice(-1);
      textNode.nodeValue = value0 + text.slice(0, i + 1);
      await waitForLayout();
      if (typeof options.onChar === "function") options.onChar(ch, i);
      if (onCaret) onCaret(textNode, (textNode.nodeValue || "").length, ch);
      await new Promise(function (resolve) {
        window.setTimeout(resolve, getHumanTypingDelay(ch, prevCh, options));
      });
    }
    return true;
  }

  global.WriteBuilderCaret = {
    getCaretRectFromTextPosition: getCaretRectFromTextPosition,
    positionVisualCaret: positionVisualCaret,
    waitForLayout: waitForLayout,
    keepRectVisibleInScroller: keepRectVisibleInScroller,
    getHumanTypingDelay: getHumanTypingDelay,
    typeTextWithCaret: typeTextWithCaret,
  };
})(window);
