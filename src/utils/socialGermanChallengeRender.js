import {chooseSocialMp4Mime} from "./socialMp4Export.js";
// Browser-only canvas renderer. No paid video or image generation API.
export const CHALLENGE_EXPORT_SIZES = {
  portrait: { width: 1080, height: 1350, label: "Instagram portrait" },
  square: { width: 1080, height: 1080, label: "Square post" },
  story: { width: 1080, height: 1920, label: "TikTok / Reels / Shorts" },
};
export const CHALLENGE_VIDEO_SECONDS = 12;
export const CHALLENGE_SCENES = [
  { id: "hook", label: "Hook", seconds: "0–2s" },
  { id: "question", label: "Question", seconds: "2–7s" },
  { id: "answer", label: "Answer", seconds: "7–10s" },
  { id: "cta", label: "Falowen CTA", seconds: "10–12s" },
];
export function sceneAtTime(seconds) {
  const t = Math.max(0, Number(seconds) || 0);
  if (t < 2) return 0;
  if (t < 7) return 1;
  if (t < 10) return 2;
  return 3;
}
export function challengeVideoMime(isTypeSupported) {
  return chooseSocialMp4Mime(isTypeSupported);
}

export function challengeFileStem(challenge) {
  return "falowen-german-challenge-" + String(challenge?.id || "post").replace(/[^a-z0-9-]/gi, "").toLowerCase();
}
// Use one logical 1080px artboard for every canvas. Preview, PNG and MediaRecorder
// output then have identical geometry regardless of their physical pixel size.
// CSS can size the canvas, but it cannot fix text drawn at raw pixel coordinates.
export const CHALLENGE_ARTBOARD_WIDTH = 1080;

export function challengeFrameLayout(width, height, topicLineCount = 1) {
  const scale = Number(width) / CHALLENGE_ARTBOARD_WIDTH;
  const h = Number(height) / scale;
  const margin = 76;
  const eyebrowY = Math.max(206, h * 0.145);
  const headingY = eyebrowY + 78;
  const topicY = headingY + 58;
  const cardTop = Math.max(topicY + (Math.max(1, topicLineCount) - 1) * 39 + 66, h * 0.29);
  const cardBottom = h - 240;
  return {
    w: CHALLENGE_ARTBOARD_WIDTH, h, scale, margin,
    eyebrowY, headingY, topicY,
    cardLeft: margin, cardRight: CHALLENGE_ARTBOARD_WIDTH - margin,
    cardTop, cardBottom, cardHeight: cardBottom - cardTop,
    footerTop: h - 182, footerBottom: h - 100,
    footerTextY: h - 128, bottomLineY: h - 57,
  };
}

function rounded(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

function splitText(ctx, value, maxWidth) {
  const lines = [];
  String(value || "").split(/\r?\n/).forEach((paragraph) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) { lines.push(""); return; }
    let line = "";
    for (const word of words) {
      const candidate = line ? line + " " + word : word;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else line = candidate;
    }
    if (line) lines.push(line);
  });
  return lines;
}

function textAtSize(ctx, text, maxWidth, size, weight = 700) {
  ctx.font = weight + " " + size + "px Arial, sans-serif";
  const lines = splitText(ctx, text, maxWidth);
  const leading = size * 1.27;
  return {
    lines, size, leading, height: lines.length * leading,
    widthFits: lines.every((line) => ctx.measureText(line).width <= maxWidth),
  };
}

function fitLines(ctx, value, maxWidth, maxHeight, startSize = 62, floor = 24, weight = 700) {
  for (let size = startSize; size >= floor; size -= 2) {
    const result = textAtSize(ctx, value, maxWidth, size, weight);
    if (result.widthFits && result.height <= maxHeight) return { ...result, overflow: false };
  }
  const result = textAtSize(ctx, value, maxWidth, floor, weight);
  return { ...result, overflow: true };
}

function fitAnswer(ctx, copy, maxWidth, maxHeight) {
  const answer = String(copy.reveal || "");
  const explanation = String(copy.explanation || "");
  const dividerGap = 67;
  // The correct German and its explanation get independent type scales.
  // Fit both together instead of putting one unbounded text block in the card.
  for (let answerSize = 66; answerSize >= 26; answerSize -= 2) {
    const main = textAtSize(ctx, answer, maxWidth, answerSize, 800);
    if (!main.widthFits) continue;
    for (let detailSize = 41; detailSize >= 22; detailSize -= 1) {
      const detail = textAtSize(ctx, explanation, maxWidth, detailSize, 500);
      if (!detail.widthFits) continue;
      if (main.height + dividerGap + detail.height <= maxHeight) {
        return { main, detail, gap: dividerGap, height: main.height + dividerGap + detail.height, overflow: false };
      }
    }
  }
  return { overflow: true };
}

function prepareChallengeText(ctx, entry, copy, selectedScene, canvasWidth, canvasHeight) {
  const scale = canvasWidth / CHALLENGE_ARTBOARD_WIDTH;
  if (!(scale > 0) || !(canvasHeight > 0)) return null;
  const h = canvasHeight / scale;
  const eyebrowY = Math.max(206, h * 0.145);
  const topicY = eyebrowY + 78 + 58;
  const topic = fitLines(ctx, entry.topic || "", 916, 82, 32, 24, 500);
  const layout = challengeFrameLayout(canvasWidth, canvasHeight, topic.lines.length);
  if (topic.overflow || layout.cardHeight < 270) return { layout, topic, overflow: true };
  const availableWidth = layout.cardRight - layout.cardLeft - 112;
  const availableHeight = layout.cardHeight - 165;
  const raw = selectedScene === 0 ? copy.hook
    : selectedScene === 1 ? copy.challenge
    : "Learn German with confidence.\nfalowen.app";
  const answer = selectedScene === 2
    ? fitAnswer(ctx, copy, availableWidth, availableHeight)
    : null;
  const content = selectedScene === 2 ? null
    : fitLines(ctx, raw, availableWidth, availableHeight, selectedScene === 3 ? 67 : 64, 24, 800);
  return { layout, topic, answer, content, overflow: Boolean(answer?.overflow || content?.overflow) };
}

export function challengeTextFits(ctx, entry, copy, width, height, scene) {
  if (!ctx || !entry || !copy) return false;
  const selectedScene = Math.max(0, Math.min(3, Number(scene) || 0));
  const prepared = prepareChallengeText(ctx, entry, copy, selectedScene, width, height);
  return Boolean(prepared && !prepared.overflow);
}

function drawLines(ctx, fit, x, startBaseline, color, weight = 700) {
  ctx.font = weight + " " + fit.size + "px Arial, sans-serif";
  ctx.fillStyle = color;
  fit.lines.forEach((line, index) => ctx.fillText(line, x, startBaseline + index * fit.leading));
}

export function renderChallengeFrame(canvas, entry, copy, scene = 1, tick = 0) {
  if (!canvas || !entry || !copy) return false;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  const selectedScene = Math.max(0, Math.min(3, Number(scene) || 0));
  const prepared = prepareChallengeText(ctx, entry, copy, selectedScene, canvas.width, canvas.height);
  if (!prepared) return false;
  const { layout, topic, content, answer } = prepared;
  const { w, h, scale, cardLeft, cardRight, cardTop, cardBottom, cardHeight } = layout;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#081a37");
  bg.addColorStop(1, "#19477d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,203,71,0.07)";
  ctx.beginPath();
  ctx.arc(w * 0.94, h * 0.19, w * 0.37, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(148,197,253,0.06)";
  ctx.beginPath();
  ctx.arc(w * 0.08, h * 0.83, w * 0.30, 0, Math.PI * 2);
  ctx.fill();

  // Header uses two independently measured zones, never two overlapping text runs.
  ctx.fillStyle = "#ffcb47";
  ctx.font = "900 68px Arial, sans-serif";
  ctx.fillText("FALOWEN", 76, 133);

  const label = String(entry.level || "A1").toUpperCase() + "  •  " + String(entry.type || "challenge").toUpperCase();
  ctx.font = "700 27px Arial, sans-serif";
  const labelWidth = Math.min(385, Math.max(215, ctx.measureText(label).width + 48));
  const labelX = w - 76 - labelWidth;
  rounded(ctx, labelX, 82, labelWidth, 69, 23);
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.17)";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#eef4ff";
  ctx.textAlign = "center";
  ctx.fillText(label, labelX + labelWidth / 2, 127);
  ctx.textAlign = "left";

  const headings = [
    "CAN YOU DO IT?",
    entry.type === "dialogue" ? "SPEAK REAL GERMAN" : "YOUR CHALLENGE",
    entry.type === "dialogue" ? "WHAT IT MEANS" : "THE ANSWER",
    "KEEP LEARNING",
  ];
  ctx.fillStyle = "#b8d6ff";
  ctx.font = "800 25px Arial, sans-serif";
  ctx.fillText("GERMAN PRACTICE  /  " + String(entry.level || "A1").toUpperCase(), 78, layout.eyebrowY);
  const title = fitLines(ctx, headings[selectedScene], 926, 85, 66, 45, 900);
  drawLines(ctx, title, 78, layout.headingY, "#ffcb47", 900);
  drawLines(ctx, topic, 80, layout.topicY, "#e2e8f0", 500);

  rounded(ctx, cardLeft, cardTop, cardRight - cardLeft, cardHeight, 34);
  ctx.fillStyle = selectedScene === 2 ? "#173c63" : "#112e52";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,203,71,0.35)";
  ctx.lineWidth = 3;
  ctx.stroke();

  if (!prepared.overflow) {
    if (selectedScene === 2) {
      ctx.fillStyle = "#ffcb47";
      ctx.font = "800 25px Arial, sans-serif";
      ctx.fillText("CORRECT GERMAN", cardLeft + 55, cardTop + 62);
      const combinedHeight = answer.height;
      const availableHeight = cardHeight - 165;
      const blockTop = cardTop + 102 + (availableHeight - combinedHeight) / 2;
      drawLines(ctx, answer.main, cardLeft + 56, blockTop + answer.main.size, "#ffffff", 800);
      const dividerY = blockTop + answer.main.height + 28;
      ctx.fillStyle = "rgba(255,203,71,0.50)";
      ctx.fillRect(cardLeft + 55, dividerY, cardRight - cardLeft - 110, 2);
      drawLines(ctx, answer.detail, cardLeft + 56, dividerY + 45 + answer.detail.size, "#d7e8ff", 500);
    } else {
      const textStart = cardTop + 82 + (cardHeight - 165 - content.height) / 2 + content.size;
      drawLines(ctx, content, cardLeft + 56, textStart, "#f7faff", 800);
    }
  } else {
    // Preview clearly signals invalid custom text; the export path rejects it.
    ctx.fillStyle = "#fecaca";
    ctx.font = "700 34px Arial, sans-serif";
    ctx.fillText("Text zu lang – bitte kürzen.", cardLeft + 50, cardTop + 110);
  }

  rounded(ctx, 76, layout.footerTop, w - 152, layout.footerBottom - layout.footerTop, 22);
  ctx.fillStyle = "rgba(255,203,71,0.12)";
  ctx.fill();
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffcb47";
  ctx.font = "800 34px Arial, sans-serif";
  const count = Math.max(1, 5 - Math.floor(Math.max(0, tick - 2)));
  const footer = selectedScene === 2 ? "SAVE THIS FOR REVISION"
    : selectedScene === 1 ? "ANSWER IN " + count + "..."
    : selectedScene === 3 ? "START LEARNING AT FALOWEN.APP"
    : "LEARN GERMAN WITH FALOWEN";
  ctx.fillText(footer, w / 2, layout.footerTextY);
  ctx.fillStyle = "#dbeafe";
  ctx.font = "500 27px Arial, sans-serif";
  ctx.fillText(
    entry.type === "exam" ? "Original exam-style practice · Not an official exam paper" : "falowen.app  •  Learn German  •  A1–B2",
    w / 2,
    layout.bottomLineY,
  );
  ctx.textAlign = "left";
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  return !prepared.overflow;
}
