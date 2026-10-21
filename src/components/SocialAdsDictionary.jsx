import { useEffect, useRef, useState } from "react";
import { SOCIAL_ADS_DICTIONARY } from "../data/socialAdsDictionary.js";

const SIZES = { portrait: [1080, 1350], square: [1080, 1080], story: [1080, 1920] };
const FIELD = { width: "100%", boxSizing: "border-box", padding: 10, border: "1px solid #cbd5e1", borderRadius: 9 };
const PANEL = { border: "1px solid #dbe3ed", borderRadius: 13, padding: 14, display: "grid", gap: 11, background: "#f8fafc" };
const STORAGE_KEY = "falowen-social-ad-design-default-v1";
const DEFAULT_DESIGN = {
  brightness: 112, overlay: 45, overlayStyle: "gradient", zoom: 100, cropX: 50, cropY: 50,
  headlineColor: "highlight", highlightWord: "German",
};
const PRESETS = {
  balanced: { brightness: 112, overlay: 45, overlayStyle: "gradient", headlineColor: "highlight" },
  contrast: { brightness: 106, overlay: 60, overlayStyle: "gradient", headlineColor: "highlight" },
  natural: { brightness: 115, overlay: 30, overlayStyle: "vignette", headlineColor: "white" },
};
const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

function normalizeDesign(input = {}) {
  return {
    brightness: clamp(input.brightness ?? DEFAULT_DESIGN.brightness, 75, 145),
    overlay: clamp(input.overlay ?? DEFAULT_DESIGN.overlay, 0, 80),
    overlayStyle: ["gradient", "solid", "vignette"].includes(input.overlayStyle) ? input.overlayStyle : "gradient",
    zoom: clamp(input.zoom ?? 100, 100, 175),
    cropX: clamp(input.cropX ?? 50, 0, 100),
    cropY: clamp(input.cropY ?? 50, 0, 100),
    headlineColor: ["highlight", "white", "gold"].includes(input.headlineColor) ? input.headlineColor : "highlight",
    highlightWord: String(input.highlightWord ?? "German").slice(0, 50),
  };
}
function savedDesign() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return normalizeDesign(saved || DEFAULT_DESIGN);
  } catch {
    return { ...DEFAULT_DESIGN };
  }
}
function wrapLines(ctx, value, maxWidth) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const candidate = line ? line + " " + word : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });
  if (line) lines.push(line);
  return lines;
}
function loadPhoto(url) {
  return new Promise((resolve, reject) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("This photo cannot be loaded for PNG export. Upload a downloaded Pexels photo, or use a direct image URL that permits cross-origin images."));
    img.src = url;
  });
}
function drawPhoto(ctx, img, w, h, design) {
  const scale = Math.max(w / img.width, h / img.height) * (design.zoom / 100);
  const sourceW = Math.min(img.width, w / scale);
  const sourceH = Math.min(img.height, h / scale);
  const sourceX = (img.width - sourceW) * (design.cropX / 100);
  const sourceY = (img.height - sourceH) * (design.cropY / 100);
  ctx.save();
  ctx.filter = "brightness(" + design.brightness + "%)";
  ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, w, h);
  ctx.restore();
}
function drawOverlay(ctx, w, h, design) {
  const strength = design.overlay / 100;
  if (design.overlayStyle === "solid") {
    ctx.fillStyle = "rgba(5, 19, 42, " + strength + ")";
  } else if (design.overlayStyle === "vignette") {
    const gradient = ctx.createRadialGradient(w * 0.5, h * 0.45, w * 0.1, w * 0.5, h * 0.45, Math.max(w, h) * 0.72);
    gradient.addColorStop(0, "rgba(5, 19, 42, " + (strength * 0.18) + ")");
    gradient.addColorStop(1, "rgba(5, 19, 42, " + Math.min(0.96, strength * 1.55) + ")");
    ctx.fillStyle = gradient;
  } else {
    // Keep faces visible at the centre; deepen the navy behind logo and CTA.
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, "rgba(5, 19, 42, " + Math.min(0.95, strength * 1.3) + ")");
    gradient.addColorStop(0.32, "rgba(5, 19, 42, " + (strength * 0.78) + ")");
    gradient.addColorStop(0.58, "rgba(5, 19, 42, " + (strength * 0.55) + ")");
    gradient.addColorStop(1, "rgba(5, 19, 42, " + Math.min(0.96, strength * 1.65) + ")");
    ctx.fillStyle = gradient;
  }
  ctx.fillRect(0, 0, w, h);
}
function accentedText(ctx, line, x, y, design) {
  if (design.headlineColor !== "highlight" || !design.highlightWord.trim()) {
    ctx.fillStyle = design.headlineColor === "gold" ? "#ffcb47" : "#ffffff";
    ctx.fillText(line, x, y);
    return;
  }
  const needle = design.highlightWord.trim();
  const index = line.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) {
    ctx.fillStyle = "#ffffff";
    ctx.fillText(line, x, y);
    return;
  }
  const before = line.slice(0, index);
  const match = line.slice(index, index + needle.length);
  const after = line.slice(index + needle.length);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(before, x, y);
  const matchX = x + ctx.measureText(before).width;
  ctx.fillStyle = "#ffcb47";
  ctx.fillText(match, matchX, y);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(after, matchX + ctx.measureText(match).width, y);
}
function drawPoster(ctx, w, h, item, fields, design) {
  const { headline, subheading, benefits, ctaLabel } = fields;
  const margin = 80, maxWidth = w - margin * 2;
  const benefitY = h - 255, heroTop = Math.round(h * (h <= 1100 ? 0.32 : h <= 1400 ? 0.35 : 0.38));

  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.shadowColor = "rgba(4, 14, 31, 0.45)";
  ctx.shadowBlur = 13;
  ctx.fillStyle = "#ffcb47";
  ctx.font = "800 46px Arial, sans-serif";
  ctx.fillText("FALOWEN", margin, Math.round(h * 0.085));

  let headlineLines = [];
  let subtitleLines = [];
  let titleSize = 82;
  const subtitleSize = 35;
  for (let size = 82; size >= 52; size -= 3) {
    ctx.font = "800 " + size + "px Arial, sans-serif";
    const nextHeadline = wrapLines(ctx, headline, maxWidth);
    ctx.font = "400 " + subtitleSize + "px Arial, sans-serif";
    const nextSubtitle = wrapLines(ctx, subheading, maxWidth);
    const required = size + Math.max(0, nextHeadline.length - 1) * size * 1.12
      + 36 + subtitleSize + Math.max(0, nextSubtitle.length - 1) * 46;
    headlineLines = nextHeadline;
    subtitleLines = nextSubtitle;
    titleSize = size;
    if (heroTop + required <= benefitY - 25 && nextHeadline.length <= 4 && nextSubtitle.length <= 3) break;
  }
  ctx.font = "800 " + titleSize + "px Arial, sans-serif";
  headlineLines.slice(0, 4).forEach((line, index) => {
    accentedText(ctx, line, margin, heroTop + titleSize + index * titleSize * 1.12, design);
  });
  const titleBottom = heroTop + titleSize + Math.max(0, Math.min(4, headlineLines.length) - 1) * titleSize * 1.12;
  ctx.fillStyle = "#f3f6fd";
  ctx.font = "400 " + subtitleSize + "px Arial, sans-serif";
  subtitleLines.slice(0, 3).forEach((line, index) => {
    ctx.fillText(line, margin, titleBottom + 37 + subtitleSize + index * 46);
  });

  ctx.shadowBlur = 6;
  ctx.font = "700 26px Arial, sans-serif";
  ctx.fillStyle = "#f9fafb";
  const benefitLabel = benefits.trim() || (item.type === "ad" ? "LEARN GERMAN" : "GERMAN LEARNING MOTIVATION");
  wrapLines(ctx, benefitLabel, maxWidth).slice(0, 2).forEach((line, index) => {
    ctx.fillText(line, margin, benefitY + index * 32);
  });

  ctx.shadowBlur = 0;
  const bannerY = h - 205;
  ctx.fillStyle = "#ffcb47";
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") ctx.roundRect(margin, bannerY, maxWidth, 89, 13);
  else ctx.rect(margin, bannerY, maxWidth, 89);
  ctx.fill();
  ctx.fillStyle = "#102344";
  ctx.font = "800 35px Arial, sans-serif";
  const cta = ctaLabel.trim() || "Start learning today";
  let text = cta;
  while (text.length > 1 && ctx.measureText(text).width > maxWidth - 140) text = text.slice(0, -1);
  ctx.fillText(text, margin + 30, bannerY + 58);
  ctx.font = "800 41px Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("→", w - margin - 29, bannerY + 58);
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 34px Arial, sans-serif";
  ctx.fillText("falowen.app", margin, h - 59);
  ctx.fillStyle = "#e2e8f0";
  ctx.textAlign = "right";
  ctx.font = "23px Arial, sans-serif";
  ctx.fillText(item.type === "ad" ? "LEARN GERMAN" : "KEEP LEARNING", w - margin, h - 62);
  ctx.textAlign = "left";
}

export default function SocialAdsDictionary() {
  const [selected, setSelected] = useState(0);
  const [headline, setHeadline] = useState(SOCIAL_ADS_DICTIONARY[0].headline);
  const [subheading, setSubheading] = useState(SOCIAL_ADS_DICTIONARY[0].subheading);
  const [benefits, setBenefits] = useState("Live classes • A1–B2 • Exam prep");
  const [ctaLabel, setCtaLabel] = useState("Start learning today");
  const [photoUrl, setPhotoUrl] = useState("");
  const [format, setFormat] = useState("portrait");
  const [design, setDesign] = useState(savedDesign);
  const [preset, setPreset] = useState("custom");
  const [saveMessage, setSaveMessage] = useState("");
  const [status, setStatus] = useState(() => {
    try { return JSON.parse(localStorage.getItem("falowen-social-ads-status") || "{}"); }
    catch { return {}; }
  });
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [captionEdit, setCaptionEdit] = useState("");
  const canvas = useRef(null);
  const fileUrl = useRef("");
  const item = SOCIAL_ADS_DICTIONARY[selected];
  const caption = captionEdit || (item.type === "ad"
    ? headline + "\n\n" + subheading + "\n\n" + (benefits ? benefits + "\n\n" : "") + "Explore German learning at https://falowen.app\n\n#LearnGerman #DeutschLernen #Falowen #GermanLanguage"
    : headline + "\n\n" + subheading + "\n\nKeep learning with Falowen: https://falowen.app\n\n#GermanMotivation #LearnGerman #Falowen");

  const changeDesign = (key, value) => {
    setDesign((current) => normalizeDesign({ ...current, [key]: value }));
    setPreset("custom");
    setSaveMessage("");
  };
  const applyPreset = (name) => {
    if (!PRESETS[name]) return;
    setDesign((current) => normalizeDesign({ ...current, ...PRESETS[name] }));
    setPreset(name);
    setSaveMessage("");
  };
  const choose = (index) => {
    const next = SOCIAL_ADS_DICTIONARY[index];
    if (!next) return;
    if (fileUrl.current) { URL.revokeObjectURL(fileUrl.current); fileUrl.current = ""; }
    setSelected(index);
    setHeadline(next.headline);
    setSubheading(next.subheading);
    setBenefits(next.type === "ad" ? "Live classes • A1–B2 • Exam prep" : "");
    setCtaLabel(next.type === "ad" ? "Start learning today" : "Keep going with Falowen");
    setCaptionEdit("");
    setPhotoUrl("");
    setError("");
    // The chosen design continues across all 21 reusable posts.
  };
  const searchLink = "https://www.pexels.com/search/" + encodeURIComponent(item.photoSearch.replace(/\s+/g, "-")) + "/";

  useEffect(() => {
    let alive = true;
    setReady(false);
    setError("");
    (async () => {
      const node = canvas.current;
      if (!node) return;
      const [w, h] = SIZES[format];
      node.width = w;
      node.height = h;
      const ctx = node.getContext("2d");
      if (!ctx) { if (alive) setError("Your browser cannot render this poster."); return; }
      const background = ctx.createLinearGradient(0, 0, w, h);
      background.addColorStop(0, "#0b214a");
      background.addColorStop(1, "#183f75");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, w, h);
      if (photoUrl) {
        try {
          const img = await loadPhoto(photoUrl);
          if (!alive) return;
          drawPhoto(ctx, img, w, h, design);
          drawOverlay(ctx, w, h, design);
        } catch (err) {
          if (alive) { setReady(false); setError(err.message); }
          return;
        }
      }
      drawPoster(ctx, w, h, item, { headline, subheading, benefits, ctaLabel }, design);
      if (alive) setReady(true);
    })();
    return () => { alive = false; };
  }, [headline, subheading, benefits, ctaLabel, photoUrl, format, design, item]);

  useEffect(() => () => { if (fileUrl.current) URL.revokeObjectURL(fileUrl.current); }, []);
  const upload = (file) => {
    if (!file) return;
    if (fileUrl.current) URL.revokeObjectURL(fileUrl.current);
    fileUrl.current = URL.createObjectURL(file);
    setPhotoUrl(fileUrl.current);
  };
  const mark = (value) => {
    const next = { ...status, [item.id]: value };
    setStatus(next);
    try { localStorage.setItem("falowen-social-ads-status", JSON.stringify(next)); } catch { /* local browser setting */ }
  };
  const saveDefaults = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(design));
      setSaveMessage("Saved for future adverts in this browser.");
    } catch {
      setSaveMessage("Browser storage is unavailable. You can still export this poster.");
    }
  };
  const exportImage = () => {
    if (!ready || !canvas.current) return;
    try {
      canvas.current.toBlob((blob) => {
        if (!blob) { setError("Image export failed. Upload the photo directly and try again."); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "falowen-" + item.date + "-" + item.type + "-" + format + ".png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, "image/png");
    } catch {
      setError("This photo prevents canvas export. Upload a downloaded Pexels photo instead.");
    }
  };

  return <section style={{ display: "grid", gap: 16 }}>
    <header>
      <h2 style={{ margin: "0 0 6px" }}>Ads &amp; Motivation Dictionary</h2>
      <p style={{ margin: 0, color: "#64748b" }}>21 reusable Tuesday and Friday posts, October–December 2026. Bright, face-friendly photos, adjustable gradients and a consistent Falowen call to action.</p>
    </header>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))", gap: 18, alignItems: "start" }}>
      <div style={{ display: "grid", gap: 14 }}>
        <div style={PANEL}>
          <strong>1. Post details</strong>
          <label>Choose scheduled post
            <select value={selected} onChange={(e) => choose(Number(e.target.value))} style={FIELD}>
              {SOCIAL_ADS_DICTIONARY.map((row, index) => <option value={index} key={row.id}>{row.date} · {row.type === "ad" ? "Ad" : "Motivation"} · {row.headline}</option>)}
            </select>
          </label>
          <label>Headline<input value={headline} onChange={(e) => setHeadline(e.target.value)} style={FIELD} /></label>
          <label>Supporting text<textarea rows={2} value={subheading} onChange={(e) => setSubheading(e.target.value)} style={FIELD} /></label>
          <label>Benefit line (optional)<input value={benefits} maxLength={140} onChange={(e) => setBenefits(e.target.value)} placeholder="Live classes • A1–B2 • Exam prep" style={FIELD} /></label>
          <label>Yellow CTA text<input value={ctaLabel} maxLength={65} onChange={(e) => setCtaLabel(e.target.value)} style={FIELD} /></label>
          <label>Export size
            <select value={format} onChange={(e) => setFormat(e.target.value)} style={FIELD}>
              <option value="portrait">Instagram portrait · 1080 × 1350</option>
              <option value="square">Square feed · 1080 × 1080</option>
              <option value="story">Story / status · 1080 × 1920</option>
            </select>
          </label>
        </div>
        <div style={PANEL}>
          <strong>2. Background picture</strong>
          <a href={searchLink} target="_blank" rel="noreferrer">Find free photos for “{item.photoSearch}” on Pexels ↗</a>
          <small>Use a direct image address, not a Pexels webpage link. Check the photo licence before publishing.</small>
          <label>Direct image URL
            <input type="url" placeholder="https://images.pexels.com/photos/..." value={photoUrl.startsWith("blob:") ? "" : photoUrl} onChange={(e) => { setPhotoUrl(e.target.value); }} style={FIELD} />
          </label>
          <label>Or upload a downloaded image<input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0])} /></label>
          <small>Uploading the image is best for reliable PNG export. If there is no photo, the design exports on a navy gradient.</small>
          <strong>Photo positioning</strong>
          <label>Zoom · {design.zoom}%<input aria-label="Photo zoom" type="range" min="100" max="175" value={design.zoom} onChange={(e) => changeDesign("zoom", Number(e.target.value))} style={{ width: "100%" }} /></label>
          <label>Move left / right · {design.cropX}%<input aria-label="Photo horizontal position" type="range" min="0" max="100" value={design.cropX} onChange={(e) => changeDesign("cropX", Number(e.target.value))} style={{ width: "100%" }} /></label>
          <label>Move up / down · {design.cropY}%<input aria-label="Photo vertical position" type="range" min="0" max="100" value={design.cropY} onChange={(e) => changeDesign("cropY", Number(e.target.value))} style={{ width: "100%" }} /></label>
        </div>
        <div style={PANEL}>
          <strong>3. Advert appearance</strong>
          <label>Design preset
            <select value={preset} onChange={(e) => applyPreset(e.target.value)} style={FIELD}>
              <option value="custom">Custom / saved settings</option>
              <option value="balanced">Falowen Bright · recommended</option>
              <option value="contrast">High contrast text</option>
              <option value="natural">Natural photo</option>
            </select>
          </label>
          <label>Photo brightness · {design.brightness}%
            <input aria-label="Photo brightness" type="range" min="75" max="145" value={design.brightness} onChange={(e) => changeDesign("brightness", Number(e.target.value))} style={{ width: "100%" }} />
          </label>
          <label>Dark overlay strength · {design.overlay}%
            <input aria-label="Dark overlay strength" type="range" min="0" max="80" value={design.overlay} onChange={(e) => changeDesign("overlay", Number(e.target.value))} style={{ width: "100%" }} />
          </label>
          <fieldset style={{ border: "1px solid #dbe3ed", borderRadius: 9, padding: 10 }}>
            <legend>Overlay style</legend>
            {[
              ["gradient", "Navy gradient (keeps faces visible)"],
              ["solid", "Solid navy"],
              ["vignette", "Soft vignette"],
            ].map(([value, label]) => <label key={value} style={{ display: "block", margin: "7px 0", cursor: "pointer" }}>
              <input type="radio" name="social-ad-overlay" value={value} checked={design.overlayStyle === value} onChange={() => changeDesign("overlayStyle", value)} /> {label}
            </label>)}
          </fieldset>
          <label>Headline colour
            <select value={design.headlineColor} onChange={(e) => changeDesign("headlineColor", e.target.value)} style={FIELD}>
              <option value="highlight">White with yellow emphasis</option>
              <option value="white">All white</option>
              <option value="gold">All Falowen yellow</option>
            </select>
          </label>
          {design.headlineColor === "highlight" && <label>Words to highlight (when in headline)
            <input value={design.highlightWord} onChange={(e) => changeDesign("highlightWord", e.target.value)} placeholder="German" style={FIELD} />
          </label>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={saveDefaults}>Save as my default</button>
            <button type="button" onClick={() => { setDesign({ ...DEFAULT_DESIGN }); setPreset("balanced"); setSaveMessage(""); }}>Reset Falowen style</button>
          </div>
          {saveMessage && <small role="status">{saveMessage}</small>}
          <small>Design defaults are saved only in this browser; changing them does not alter published posts or the vocabulary/class editors.</small>
        </div>
        <div style={PANEL}>
          <strong>4. Publishing</strong>
          <label>Publication status
            <select value={status[item.id] || "Draft"} onChange={(e) => mark(e.target.value)} style={FIELD}>
              <option>Draft</option><option>Ready</option><option>Published</option>
            </select>
          </label>
          <small>Status is saved in this browser, not shared across admin accounts.</small>
        </div>
      </div>
      <div style={{ display: "grid", gap: 12, padding: 16, border: "1px solid #dbe3ed", borderRadius: 14, background: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <strong>Live poster preview</strong>
          <button type="button" disabled={!ready} onClick={exportImage}>{ready ? "Export PNG" : "Rendering..."}</button>
        </div>
        <canvas ref={canvas} aria-label="Preview of the social media advert" role="img" style={{ width: "100%", height: "auto", borderRadius: 12, background: "#0b214a" }} />
        {error && <p role="alert" style={{ color: "#b91c1c", margin: 0 }}>{error}</p>}
        <label>Instagram caption
          <textarea value={caption} rows={7} onChange={(e) => setCaptionEdit(e.target.value)} style={FIELD} />
        </label>
        <button type="button" onClick={() => navigator.clipboard.writeText(caption).catch(() => setError("Could not copy. Select the caption text manually."))}>Copy caption + hashtags</button>
      </div>
    </div>
  </section>;
}
