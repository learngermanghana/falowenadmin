// Canvas-only animation: no image-generation, cloud rendering, or third-party music APIs.
export const VIDEO_THEMES = Object.freeze([
  { id: "blue", label: "Falowen Blue", background: "#0068db", second: "#0ebde9", dark: "#063a78", ink: "#153966", accent: "#10abeb" },
  { id: "midnight", label: "Midnight Premium", background: "#071736", second: "#164f9b", dark: "#071e46", ink: "#112e60", accent: "#60a5fa" },
  { id: "light", label: "Light Minimal", background: "#e7f5ff", second: "#b9e5ff", dark: "#135a9d", ink: "#164376", accent: "#047bd9" },
]);
export const VIDEO_DURATIONS = Object.freeze([8, 12, 15]);
export const VIDEO_RESOLUTIONS = Object.freeze([
  { id: "standard", label: "HD · 720 × 1280", width: 720, height: 1280 },
  { id: "full", label: "Full HD · 1080 × 1920", width: 1080, height: 1920 },
]);
export const MUSIC_CHOICES = Object.freeze([
  { id: "gentle", label: "Gentle piano tones (original)" },
  { id: "bright", label: "Bright synth melody (original)" },
  { id: "none", label: "No music" },
]);

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const appear = (t, start, length = 0.55) => clamp((t - start) / length);
const ease = v => 1 - (1 - clamp(v)) ** 3;
export const videoFileStem = word => "falowen-vocab-" + String(word?.level || "A1").toLowerCase()
  + "-" + (String(word?.german || "word").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 65) || "word").toLowerCase();

export function chooseVocabularyVideoMime(isSupported) {
  const candidates = [
    { mime: "video/mp4;codecs=avc1.42E01E,mp4a.40.2", extension: "mp4" },
    { mime: "video/mp4", extension: "mp4" },
    { mime: "video/webm;codecs=vp9,opus", extension: "webm" },
    { mime: "video/webm;codecs=vp8,opus", extension: "webm" },
    { mime: "video/webm", extension: "webm" },
  ];
  return candidates.find(choice => isSupported(choice.mime)) || null;
}

export function videoStageAt(seconds, duration = 12) {
  const s = clamp(seconds / Math.max(1, duration));
  return s < .18 ? "intro" : s < .4 ? "word" : s < .58 ? "meaning" : s < .83 ? "example" : "outro";
}

// Deterministic, self-composed pitches. These are generated on device from oscillators,
// not copied/downloaded tracks, and can be included in the recorded MediaStream.
export function originalMusicNotes(duration, style = "gentle") {
  if (style === "none") return [];
  const steps = style === "bright" ? [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 783.99, 1046.5]
    : [261.63, 329.63, 392, 523.25, 293.66, 349.23, 440, 392];
  const interval = style === "bright" ? .72 : 1.13;
  const result = [];
  for (let index = 0; index * interval < duration - .65; index += 1) {
    const time = index * interval + .15;
    result.push({
      time, frequency: steps[index % steps.length],
      length: Math.min(style === "bright" ? .52 : 1.1, duration - time),
      volume: style === "bright" ? .043 : .034,
      oscillator: style === "bright" ? "triangle" : "sine",
    });
  }
  return result;
}

function round(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
function fitFont(ctx, value, max, preferred, weight = 800, minimum = 46) {
  let size = preferred;
  while (size > minimum) {
    ctx.font = weight + " " + size + "px system-ui, Arial, sans-serif";
    if (ctx.measureText(value).width <= max) break;
    size -= 3;
  }
  ctx.font = weight + " " + size + "px system-ui, Arial, sans-serif";
  return size;
}
function linesFor(ctx, raw, maxWidth, maxLines = 3) {
  const words = String(raw || "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = (line ? line + " " : "") + word;
    if (line && ctx.measureText(next).width > maxWidth) { lines.push(line); line = word; }
    else line = next;
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const limited = lines.slice(0, maxLines);
  let last = limited[maxLines - 1];
  while (last.length && ctx.measureText(last + "…").width > maxWidth) last = last.slice(0, -1);
  limited[maxLines - 1] = last + "…";
  return limited;
}
function centeredLines(ctx, value, cx, top, maxWidth, fontSize, lineHeight, maxLines, color, weight = 600) {
  ctx.fillStyle = color;
  ctx.font = weight + " " + fontSize + "px system-ui, Arial, sans-serif";
  ctx.textAlign = "center";
  const arr = linesFor(ctx, value, maxWidth, maxLines);
  for (let i = 0; i < arr.length; i += 1) ctx.fillText(arr[i], cx, top + i * lineHeight);
  return top + arr.length * lineHeight;
}
function drawBrand(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.font = "900 " + size + "px system-ui, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("falowen.", x, y);
}
function withAlpha(ctx, amount, draw) {
  if (amount <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(amount);
  draw();
  ctx.restore();
}
export function renderVocabularyFrame(canvas, word, settings = {}, seconds = 7) {
  if (!canvas || !word) return;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  const theme = VIDEO_THEMES.find(t => t.id === settings.theme) || VIDEO_THEMES[0];
  const duration = VIDEO_DURATIONS.includes(Number(settings.duration)) ? Number(settings.duration) : 12;
  const s = clamp(seconds / duration);
  const width = canvas.width, height = canvas.height;
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.scale(width / 1080, height / 1920);

  const bg = ctx.createLinearGradient(0, 0, 1080, 1920);
  bg.addColorStop(0, theme.background);
  bg.addColorStop(1, theme.second);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1920);
  const pulse = 32 * Math.sin(s * Math.PI * 2);
  ctx.globalAlpha = theme.id === "light" ? .3 : .16;
  ctx.fillStyle = theme.id === "light" ? "#ffffff" : "#caf8ff";
  ctx.beginPath(); ctx.arc(1050, 240 + pulse, 330, 0, 2 * Math.PI); ctx.fill();
  ctx.beginPath(); ctx.arc(-80, 1640 - pulse, 350, 0, 2 * Math.PI); ctx.fill();
  ctx.globalAlpha = 1;

  const white = theme.id === "light" ? theme.ink : "#ffffff";
  // Opening logo is deliberately brief to reach the word quickly in Reels/Shorts.
  const introAlpha = s < .13 ? 1 : clamp((.24 - s) / .11);
  withAlpha(ctx, introAlpha, () => {
    ctx.strokeStyle = theme.id === "light" ? "#237db4" : "#a5dcff";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(540, 870, 340 + 12 * Math.sin(s * 12), 0, 2 * Math.PI); ctx.stroke();
    const logoScale = .86 + .14 * ease(appear(s, 0, .08));
    ctx.save(); ctx.translate(540, 800); ctx.scale(logoScale, logoScale);
    fitFont(ctx, "Falowen", 760, 146, 900); ctx.fillStyle = white; ctx.textAlign = "center";
    ctx.fillText("Falowen", 0, 0);
    centeredLines(ctx, "YOUR GERMAN CONVERSATION PARTNER", 0, 66, 830, 36, 47, 2, white, 700);
    ctx.restore();
    centeredLines(ctx, "Learn something new every day", 540, 1320, 800, 33, 44, 2, white);
  });

  const mainAlpha = appear(s, .15, .10);
  withAlpha(ctx, mainAlpha, () => {
    drawBrand(ctx, 75, 140, 71, white);
    round(ctx, 745, 76, 263, 68, 34, theme.id === "light" ? "#ffffff" : "#ffffff2b");
    ctx.textAlign = "center"; ctx.fillStyle = theme.dark; ctx.font = "800 30px system-ui, Arial, sans-serif";
    if (theme.id !== "light") ctx.fillStyle = "#ffffff";
    ctx.fillText("GERMAN · " + (word.level || "A1").toUpperCase(), 876, 121);
    ctx.textAlign = "center";
    ctx.font = "800 43px system-ui, Arial, sans-serif"; ctx.fillStyle = white;
    ctx.fillText("WORT DES TAGES", 540, 360);

    const slide = (1 - ease(appear(s, .16, .12))) * 200;
    ctx.save();
    ctx.translate(0, slide);
    ctx.shadowColor = "#032b5b40"; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
    round(ctx, 78, 440, 924, 775, 62, "#ffffff");
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    round(ctx, 120, 485, 840, 89, 45, "#e9f5ff");
    centeredLines(ctx, "GERMAN WORD · " + (word.level || "A1").toUpperCase(), 540, 542, 760, 31, 43, 1, theme.dark, 800);
    const german = String(word.german || "").trim();
    fitFont(ctx, german, 814, 108, 850, 42);
    ctx.fillStyle = theme.ink; ctx.textAlign = "center";
    const wordLine = linesFor(ctx, german, 810, 2);
    wordLine.forEach((line, i) => ctx.fillText(line, 540, 750 + i * 105));
    withAlpha(ctx, appear(s, .34, .08), () => {
      ctx.fillStyle = "#65758b"; ctx.font = "500 29px system-ui, Arial, sans-serif";
      ctx.fillText("ENGLISH MEANING", 540, 915);
      const meaning = String(word.english || "").trim();
      fitFont(ctx, meaning, 800, 64, 750, 38);
      const meaningLines = linesFor(ctx, meaning, 800, 2);
      ctx.fillStyle = theme.ink;
      meaningLines.forEach((line, i) => ctx.fillText(line, 540, 1005 + i * 76));
    });
    ctx.restore();

    withAlpha(ctx, appear(s, .49, .09), () => {
      round(ctx, 78, 1270, 924, 380, 47, "#f4fbff");
      ctx.fillStyle = theme.dark; ctx.textAlign = "center";
      ctx.font = "800 29px system-ui, Arial, sans-serif";
      ctx.fillText("USE IT IN A SENTENCE", 540, 1340);
      centeredLines(ctx, word.exampleDE || " ", 540, 1426, 818, 42, 60, 2, theme.ink, 800);
      centeredLines(ctx, word.exampleEN || " ", 540, 1584, 818, 31, 42, 2, "#65758b", 500);
    });

    ctx.fillStyle = white; ctx.textAlign = "left"; ctx.font = "700 31px system-ui, Arial, sans-serif";
    ctx.fillText("Learn German with Falowen", 76, 1802);
    ctx.textAlign = "right"; ctx.fillText("falowen.app", 1002, 1802);
  });

  // Branded ending, no lengthy logo outro that would suppress useful word exposure.
  const endAlpha = appear(s, .85, .1);
  withAlpha(ctx, endAlpha, () => {
    ctx.fillStyle = theme.dark; ctx.globalAlpha *= .93;
    ctx.fillRect(0, 0, 1080, 1920);
    ctx.globalAlpha = 1;
    drawBrand(ctx, 230, 770, 137, "#ffffff");
    centeredLines(ctx, "Save this word for later", 540, 940, 890, 55, 70, 2, "#ffffff", 700);
    centeredLines(ctx, "Learn German • A1 to C2", 540, 1080, 890, 36, 48, 2, "#ccedff", 500);
    centeredLines(ctx, "falowen.app", 540, 1640, 850, 47, 65, 1, "#ffffff", 700);
  });
  ctx.restore();
}
