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
  if (typeof isTypeSupported !== "function") return "";
  return ["video/mp4;codecs=avc1.42E01E", "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"]
    .find((format) => isTypeSupported(format)) || "";
}
export function challengeFileStem(challenge) {
  return "falowen-german-challenge-" + String(challenge?.id || "post").replace(/[^a-z0-9-]/gi, "").toLowerCase();
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
      } else { line = candidate; }
    }
    if (line) lines.push(line);
  });
  return lines;
}
function fitLines(ctx, value, maxWidth, maxHeight, startSize = 53, floor = 24) {
  for (let size = startSize; size >= floor; size -= 2) {
    ctx.font = "700 " + size + "px Arial, sans-serif";
    const lines = splitText(ctx, value, maxWidth);
    const leading = size * 1.29;
    if (lines.length * leading <= maxHeight && lines.every((line) => ctx.measureText(line).width <= maxWidth)) {
      return { lines, size, leading };
    }
  }
  ctx.font = "700 " + floor + "px Arial, sans-serif";
  const lines = splitText(ctx, value, maxWidth);
  const leading = floor * 1.25;
  const limit = Math.max(1, Math.floor(maxHeight / leading));
  // Never silently truncate a question or its options: visually indicate when custom
  // manual content is too long, and reject exporting that frame from the editor.
  return { lines: lines.slice(0, limit), size: floor, leading, overflow: lines.length > limit || lines.some(line => ctx.measureText(line).width > maxWidth) };
}
export function challengeTextFits(ctx, entry, copy, width, height, scene) {
  if (!entry || !copy) return false;
  const w = width, h = height;
  const boxHeight = h * (scene === 2 ? 0.47 : 0.51);
  const content = scene === 2 ? String(copy.reveal || "") + "\n\n" + String(copy.explanation || "")
    : scene === 3 ? "Learn German with confidence.\nfalowen.app"
    : scene === 0 ? String(copy.hook || "")
    : String(copy.challenge || "");
  return !fitLines(ctx, content, w - 205, boxHeight - 115, scene === 2 ? 48 : 53).overflow;
}
export function renderChallengeFrame(canvas, entry, copy, scene = 1, tick = 0) {
  if (!canvas || !entry || !copy) return false;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  const w = canvas.width, h = canvas.height;
  const selectedScene = Math.max(0, Math.min(3, Number(scene) || 0));
  ctx.clearRect(0, 0, w, h);
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#081a37"); bg.addColorStop(1, "#19477d");
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,203,71,0.08)";
  ctx.beginPath(); ctx.arc(w * 0.97, h * 0.18, w * 0.38, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(w * 0.08, h * 0.83, w * 0.30, 0, Math.PI * 2); ctx.fill();
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffcb47";
  ctx.font = "900 54px Arial, sans-serif";
  ctx.fillText("FALOWEN", 75, 116);
  ctx.textAlign = "right";
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "700 30px Arial, sans-serif";
  ctx.fillText(entry.level + "  •  " + String(entry.type).toUpperCase(), w - 75, 113);
  ctx.textAlign = "left";
  const heading = selectedScene === 0 ? "CAN YOU DO IT?"
    : selectedScene === 1 ? (entry.type === "dialogue" ? "SPEAK REAL GERMAN" : "YOUR CHALLENGE")
    : selectedScene === 2 ? (entry.type === "dialogue" ? "WHAT IT MEANS" : "THE ANSWER")
    : "KEEP LEARNING";
  ctx.fillStyle = "#ffcb47";
  ctx.font = "900 47px Arial, sans-serif";
  ctx.fillText(heading, 76, h * 0.225);
  ctx.fillStyle = "#e2e8f0";
  ctx.font = "30px Arial, sans-serif";
  ctx.fillText(entry.topic.slice(0, 62), 79, h * 0.225 + 50);
  const top = h * 0.31, bottomSpace = h * 0.17;
  const cardH = h - top - bottomSpace;
  rounded(ctx, 65, top, w - 130, cardH, 32);
  ctx.fillStyle = selectedScene === 2 ? "#183e64" : "#132e54";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,203,71,0.24)";
  ctx.lineWidth = 3; ctx.stroke();

  const raw = selectedScene === 0 ? copy.hook : selectedScene === 1 ? copy.challenge
    : selectedScene === 2 ? copy.reveal + "\n\n" + copy.explanation
    : "Learn German with confidence.\nfalowen.app";
  const fit = fitLines(ctx, raw, w - 210, cardH - 115, selectedScene === 2 ? 48 : 53);
  ctx.fillStyle = selectedScene === 2 ? "#ffffff" : "#f7faff";
  ctx.font = "700 " + fit.size + "px Arial, sans-serif";
  let y = top + Math.max(90, (cardH - fit.lines.length * fit.leading) / 2);
  for (const line of fit.lines) {
    if (selectedScene === 2 && line.toLowerCase().includes("falowen")) ctx.fillStyle = "#ffcb47";
    else ctx.fillStyle = "#f7faff";
    ctx.fillText(line, 105, y);
    y += fit.leading;
  }
  // A countdown in the question phase gives viewers a reason to stay until reveal.
  if (selectedScene === 1) {
    const count = Math.max(1, 5 - Math.floor(Math.max(0, tick - 2)));
    ctx.fillStyle = "#ffcb47";
    ctx.font = "900 80px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(count), w / 2, h - bottomSpace * 0.46);
    ctx.textAlign = "left";
  }
  if (selectedScene === 2) {
    ctx.fillStyle = "#ffcb47";
    ctx.font = "700 30px Arial, sans-serif";
    ctx.fillText("✓  SAVE THIS FOR REVISION", 83, h - bottomSpace * 0.46);
  }
  if (selectedScene === 0 || selectedScene === 3) {
    ctx.fillStyle = "#ffcb47";
    ctx.font = "700 33px Arial, sans-serif";
    ctx.fillText("falowen.app", 80, h - bottomSpace * 0.48);
  }
  ctx.fillStyle = "#cbd5e1";
  ctx.font = "24px Arial, sans-serif";
  ctx.fillText(entry.type === "exam" ? "Original exam-style practice · not an official exam question" : "Learn German • A1–B2", 78, h - 55);
  return !fit.overflow;
}
