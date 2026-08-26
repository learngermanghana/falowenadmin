import { useEffect, useMemo, useRef, useState } from "react";
import { listClassCohorts } from "../services/liveClassService";
import { normalizeScheduleRules } from "../utils/liveClassScheduling";
import { useToast } from "../context/ToastContext";

const FORMATS = [
  { id: "square", label: "Square post", width: 1080, height: 1080, hint: "Instagram / Facebook" },
  { id: "portrait", label: "Portrait post", width: 1080, height: 1350, hint: "Instagram feed" },
  { id: "story", label: "Story", width: 1080, height: 1920, hint: "Stories / Status" },
];

const TEMPLATES = [
  { id: "academy", label: "Academy Blue", background: "#071a3a", accent: "#f8c84a", soft: "#12366f", text: "#ffffff", layout: "split" },
  { id: "falowen", label: "Falowen Gradient", background: "#111827", accent: "#60a5fa", soft: "#1d4ed8", text: "#ffffff", layout: "diagonal" },
  { id: "gold", label: "Premium Gold", background: "#17120b", accent: "#f7c65a", soft: "#3a2c14", text: "#fffaf0", layout: "editorial" },
  { id: "clean", label: "Clean Light", background: "#f8fafc", accent: "#1d4ed8", soft: "#dbeafe", text: "#0f172a", layout: "clean" },
  { id: "germany", label: "Germany", background: "#111111", accent: "#ef4444", soft: "#facc15", text: "#ffffff", layout: "flag" },
  { id: "green", label: "Fresh Green", background: "#062d25", accent: "#86efac", soft: "#14532d", text: "#f0fdf4", layout: "split" },
];

const panelStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  background: "#fff",
  padding: 16,
};

const inputStyle = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "9px 10px",
  background: "#fff",
  color: "#0f172a",
};

function textValue(...values) {
  return values.map((value) => String(value ?? "").trim()).find(Boolean) || "";
}

function formatDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00Z`) : new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
}

function formatShortDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T00:00:00Z`) : new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

function formatSchedule(scheduleRules = []) {
  const dayNames = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };
  const rules = normalizeScheduleRules(scheduleRules);
  if (!rules.length) return "Schedule to be announced";
  return rules
    .map((rule) => `${dayNames[rule.day] || rule.day} ${rule.startTime}`)
    .join(" • ");
}

function formatFee(value) {
  if (value == null || value === "") return "";
  const numeric = Number(String(value).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) return String(value);
  return `GHS ${numeric.toLocaleString("en-GH", { maximumFractionDigits: 2 })}`;
}

function daysUntil(value) {
  const raw = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const target = new Date(`${raw}T00:00:00Z`).getTime();
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.ceil((target - today) / 86400000);
}

function classSort(left, right) {
  const statusRank = { upcoming: 0, active: 1, draft: 2, graduated: 3, archived: 4 };
  const leftRank = statusRank[String(left.status || "").toLowerCase()] ?? 5;
  const rightRank = statusRank[String(right.status || "").toLowerCase()] ?? 5;
  if (leftRank !== rightRank) return leftRank - rightRank;
  return String(left.startDate || "9999-12-31").localeCompare(String(right.startDate || "9999-12-31"));
}

function draftFromClass(klass = {}) {
  const level = textValue(klass.levelId, klass.level, klass.program);
  const name = textValue(klass.name, klass.className, klass.title, level ? `${level} German Class` : "German Class");
  const startDate = formatDate(klass.startDate);
  const endDate = formatShortDate(klass.endDate);
  const mode = textValue(klass.learningMode, klass.mode, klass.location);
  const fee = formatFee(klass.tuitionFee ?? klass.fee ?? klass.price);
  const classUrl = textValue(klass.classUrl, klass.registrationUrl, klass.url);
  const registerUrl = classUrl
    ? classUrl.startsWith("http") ? classUrl : `https://www.falowen.app${classUrl.startsWith("/") ? classUrl : `/${classUrl}`}`
    : "https://www.falowen.app/classes";

  return {
    eyebrow: "LEARN GERMAN WITH US",
    className: name,
    level: level || "German A1–C1",
    startDate: startDate || "Starting soon",
    schedule: formatSchedule(klass.scheduleRules),
    mode: mode || "Online & in-person options",
    fee: fee || "Contact us for fees",
    duration: endDate ? `Runs until ${endDate}` : "",
    cta: "REGISTER NOW",
    website: registerUrl,
    phone: textValue(klass.phone, klass.contactPhone),
    footer: "Learn Language Education Academy • Powered by Falowen",
  };
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (!words.length) return y;
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  if (line) lines.push(line);

  const visible = lines.slice(0, maxLines);
  if (lines.length > maxLines && visible.length) {
    let last = visible[visible.length - 1];
    while (last && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    visible[visible.length - 1] = `${last}…`;
  }

  visible.forEach((item, index) => ctx.fillText(item, x, y + index * lineHeight));
  return y + visible.length * lineHeight;
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawCoverImage(ctx, image, x, y, width, height) {
  if (!image) return;
  const imageRatio = image.width / image.height;
  const boxRatio = width / height;
  let sx = 0;
  let sy = 0;
  let sw = image.width;
  let sh = image.height;

  if (imageRatio > boxRatio) {
    sw = image.height * boxRatio;
    sx = (image.width - sw) / 2;
  } else {
    sh = image.width / boxRatio;
    sy = (image.height - sh) / 2;
  }
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

function loadLocalImage(src) {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function drawPosterBackground(ctx, width, height, template, photo) {
  ctx.fillStyle = template.background;
  ctx.fillRect(0, 0, width, height);

  if (template.layout === "diagonal") {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, template.background);
    gradient.addColorStop(0.56, template.soft);
    gradient.addColorStop(1, template.background);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  if (template.layout === "flag") {
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, width, height * 0.34);
    ctx.fillStyle = "#d91f26";
    ctx.fillRect(0, height * 0.34, width, height * 0.33);
    ctx.fillStyle = "#f2c500";
    ctx.fillRect(0, height * 0.67, width, height * 0.33);
    ctx.fillStyle = "rgba(0,0,0,.52)";
    ctx.fillRect(0, 0, width, height);
  }

  if (photo) {
    if (template.layout === "clean") {
      drawCoverImage(ctx, photo, width * 0.55, 0, width * 0.45, height * 0.54);
      const gradient = ctx.createLinearGradient(width * 0.48, 0, width, 0);
      gradient.addColorStop(0, template.background);
      gradient.addColorStop(1, "rgba(248,250,252,.08)");
      ctx.fillStyle = gradient;
      ctx.fillRect(width * 0.42, 0, width * 0.58, height * 0.58);
    } else {
      drawCoverImage(ctx, photo, width * 0.58, 0, width * 0.42, height);
      const gradient = ctx.createLinearGradient(width * 0.45, 0, width, 0);
      gradient.addColorStop(0, template.background);
      gradient.addColorStop(0.72, "rgba(0,0,0,.15)");
      gradient.addColorStop(1, "rgba(0,0,0,.28)");
      ctx.fillStyle = gradient;
      ctx.fillRect(width * 0.38, 0, width * 0.62, height);
    }
  } else {
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = template.accent;
    ctx.beginPath();
    ctx.arc(width * 0.87, height * 0.14, width * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width * 0.8, height * 0.82, width * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

async function renderPoster(canvas, data, template, format, photoSrc) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const width = format.width;
  const height = format.height;
  canvas.width = width;
  canvas.height = height;
  const photo = await loadLocalImage(photoSrc);

  drawPosterBackground(ctx, width, height, template, photo);

  const pad = Math.round(width * 0.075);
  const contentWidth = photo && template.layout !== "clean" ? width * 0.54 - pad : width - pad * 2;
  const titleMax = Math.max(430, contentWidth);
  const top = height * 0.11;

  ctx.fillStyle = template.accent;
  ctx.font = `700 ${Math.round(width * 0.027)}px Arial, sans-serif`;
  ctx.letterSpacing = "2px";
  ctx.fillText(String(data.eyebrow || "").toUpperCase(), pad, top);

  ctx.fillStyle = template.text;
  ctx.font = `800 ${Math.round(width * (format.id === "story" ? 0.068 : 0.062))}px Arial, sans-serif`;
  let y = top + width * 0.09;
  y = wrapText(ctx, data.className, pad, y, titleMax, width * 0.073, format.id === "story" ? 4 : 3);

  ctx.fillStyle = template.accent;
  ctx.font = `800 ${Math.round(width * 0.04)}px Arial, sans-serif`;
  ctx.fillText(data.level, pad, y + width * 0.03);
  y += width * 0.09;

  const detailRows = [
    ["START", data.startDate],
    ["SCHEDULE", data.schedule],
    ["MODE", data.mode],
    ["FEE", data.fee],
  ].filter(([, value]) => String(value || "").trim());

  detailRows.forEach(([label, value]) => {
    ctx.fillStyle = template.accent;
    ctx.font = `800 ${Math.round(width * 0.022)}px Arial, sans-serif`;
    ctx.fillText(label, pad, y);
    ctx.fillStyle = template.text;
    ctx.font = `600 ${Math.round(width * 0.029)}px Arial, sans-serif`;
    y = wrapText(ctx, value, pad, y + width * 0.037, titleMax, width * 0.038, 2) + width * 0.024;
  });

  if (data.duration) {
    ctx.fillStyle = template.text;
    ctx.globalAlpha = 0.82;
    ctx.font = `500 ${Math.round(width * 0.025)}px Arial, sans-serif`;
    ctx.fillText(data.duration, pad, y);
    ctx.globalAlpha = 1;
    y += width * 0.055;
  }

  const buttonWidth = Math.min(titleMax, width * 0.38);
  const buttonHeight = width * 0.09;
  roundRect(ctx, pad, y, buttonWidth, buttonHeight, buttonHeight / 2);
  ctx.fillStyle = template.accent;
  ctx.fill();
  ctx.fillStyle = template.layout === "clean" ? "#ffffff" : template.background;
  ctx.font = `800 ${Math.round(width * 0.027)}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(data.cta, pad + buttonWidth / 2, y + buttonHeight / 2 + 1);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const footerY = height - pad * 0.72;
  ctx.fillStyle = template.text;
  ctx.globalAlpha = 0.92;
  ctx.font = `600 ${Math.round(width * 0.023)}px Arial, sans-serif`;
  const websiteText = String(data.website || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  ctx.fillText(websiteText, pad, footerY - width * 0.043);
  if (data.phone) {
    ctx.font = `500 ${Math.round(width * 0.021)}px Arial, sans-serif`;
    ctx.fillText(data.phone, pad, footerY - width * 0.01);
  }
  ctx.globalAlpha = 0.72;
  ctx.font = `500 ${Math.round(width * 0.019)}px Arial, sans-serif`;
  wrapText(ctx, data.footer, pad, footerY + width * 0.025, width - pad * 2, width * 0.026, 2);
  ctx.globalAlpha = 1;
}

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#334155" }}>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={inputStyle} />
    </label>
  );
}

export default function SocialMediaPage() {
  const { pushToast } = useToast();
  const canvasRef = useRef(null);
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [formatId, setFormatId] = useState(FORMATS[0].id);
  const [photoSrc, setPhotoSrc] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(draftFromClass({}));

  const template = useMemo(() => TEMPLATES.find((item) => item.id === templateId) || TEMPLATES[0], [templateId]);
  const format = useMemo(() => FORMATS.find((item) => item.id === formatId) || FORMATS[0], [formatId]);
  const selectedClass = useMemo(() => classes.find((item) => item.id === selectedClassId) || null, [classes, selectedClassId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const rows = (await listClassCohorts()).slice().sort(classSort);
        setClasses(rows);
        const preferred = rows.find((item) => String(item.status || "").toLowerCase() === "upcoming") || rows[0] || null;
        if (preferred) {
          setSelectedClassId(preferred.id);
          setDraft(draftFromClass(preferred));
        }
      } catch (err) {
        setError(err?.message || "Failed to load classes");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    void renderPoster(canvasRef.current, draft, template, format, photoSrc);
  }, [draft, template, format, photoSrc]);

  const chooseClass = (classId) => {
    setSelectedClassId(classId);
    const klass = classes.find((item) => item.id === classId);
    if (klass) setDraft(draftFromClass(klass));
  };

  const resetFromClass = () => {
    if (!selectedClass) return;
    setDraft(draftFromClass(selectedClass));
    pushToast({ type: "info", message: "Poster details reset from the selected class." });
  };

  const updateDraft = (field, value) => setDraft((current) => ({ ...current, [field]: value }));

  const uploadPhoto = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      pushToast({ type: "error", message: "Please choose an image file." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoSrc(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => pushToast({ type: "error", message: "Could not read that image." });
    reader.readAsDataURL(file);
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        pushToast({ type: "error", message: "Could not export this image." });
        return;
      }
      const link = document.createElement("a");
      const className = String(draft.className || "class-promo").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      link.href = URL.createObjectURL(blob);
      link.download = `${className || "class-promo"}-${format.id}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      pushToast({ type: "success", message: "Promo image exported as PNG." });
    }, "image/png");
  };

  const caption = useMemo(() => {
    const parts = [
      `German class registration is open: ${draft.className}.`,
      draft.startDate ? `Starts: ${draft.startDate}.` : "",
      draft.schedule ? `Schedule: ${draft.schedule}.` : "",
      draft.mode ? `${draft.mode}.` : "",
      draft.website ? `Register: ${draft.website}` : "",
      "#LearnGerman #GermanInGhana #Falowen",
    ].filter(Boolean);
    return parts.join("\n");
  }, [draft]);

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      pushToast({ type: "success", message: "Social media caption copied." });
    } catch {
      pushToast({ type: "info", message: "Copy the caption manually from the box." });
    }
  };

  const startDays = selectedClass ? daysUntil(selectedClass.startDate) : null;

  return (
    <div style={{ display: "grid", gap: 16, padding: 16 }}>
      <section style={panelStyle}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0 }}>Social Media</h1>
            <p style={{ margin: "6px 0 0", color: "#64748b", maxWidth: 760 }}>
              Select an upcoming class, choose a reusable design, adjust the auto-filled details, then export a ready PNG for Instagram, Facebook, WhatsApp Status, or Stories.
            </p>
          </div>
          {selectedClass && startDays != null && (
            <span style={{ borderRadius: 999, padding: "7px 11px", background: startDays >= 0 ? "#ecfdf5" : "#f8fafc", color: startDays >= 0 ? "#047857" : "#64748b", fontWeight: 700, fontSize: 13 }}>
              {startDays === 0 ? "Starts today" : startDays > 0 ? `Starts in ${startDays} day${startDays === 1 ? "" : "s"}` : "Already started"}
            </span>
          )}
        </div>
      </section>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "minmax(300px, 430px) minmax(0, 1fr)", alignItems: "start" }}>
        <div style={{ display: "grid", gap: 14 }}>
          <section style={panelStyle}>
            <h2 style={{ margin: "0 0 12px", fontSize: 17 }}>1. Choose class</h2>
            {loading ? <p>Loading classes...</p> : null}
            {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
            {!loading && !error && (
              <select value={selectedClassId} onChange={(event) => chooseClass(event.target.value)} style={inputStyle}>
                {classes.length === 0 ? <option value="">No classes found</option> : null}
                {classes.map((klass) => (
                  <option key={klass.id} value={klass.id}>
                    {klass.name || klass.levelId || klass.id} · {klass.status || "no status"} · {formatShortDate(klass.startDate) || "no start date"}
                  </option>
                ))}
              </select>
            )}
            <button type="button" onClick={resetFromClass} disabled={!selectedClass} style={{ marginTop: 10 }}>
              Reset details from class
            </button>
          </section>

          <section style={panelStyle}>
            <h2 style={{ margin: "0 0 12px", fontSize: 17 }}>2. Choose template</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
              {TEMPLATES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTemplateId(item.id)}
                  style={{
                    minHeight: 76,
                    borderRadius: 12,
                    border: templateId === item.id ? `2px solid ${item.accent}` : "1px solid #cbd5e1",
                    background: item.background,
                    color: item.text,
                    padding: 10,
                    fontWeight: 800,
                    textAlign: "left",
                  }}
                >
                  <span style={{ display: "block", width: 26, height: 5, borderRadius: 999, background: item.accent, marginBottom: 8 }} />
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={{ margin: "0 0 12px", fontSize: 17 }}>3. Size & photo</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {FORMATS.map((item) => (
                <label key={item.id} style={{ display: "flex", gap: 9, alignItems: "center", cursor: "pointer" }}>
                  <input type="radio" name="promo-format" checked={formatId === item.id} onChange={() => setFormatId(item.id)} />
                  <span><strong>{item.label}</strong> <small style={{ color: "#64748b" }}>({item.hint})</small></span>
                </label>
              ))}
              <label style={{ display: "grid", gap: 6, marginTop: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Optional student/class photo</span>
                <input type="file" accept="image/*" onChange={(event) => uploadPhoto(event.target.files?.[0] || null)} />
              </label>
              {photoSrc ? <button type="button" onClick={() => setPhotoSrc("")}>Remove photo</button> : null}
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={{ margin: "0 0 12px", fontSize: 17 }}>4. Edit poster details</h2>
            <div style={{ display: "grid", gap: 10 }}>
              <Field label="Small heading" value={draft.eyebrow} onChange={(value) => updateDraft("eyebrow", value)} />
              <Field label="Class name" value={draft.className} onChange={(value) => updateDraft("className", value)} />
              <Field label="Level" value={draft.level} onChange={(value) => updateDraft("level", value)} />
              <Field label="Start date" value={draft.startDate} onChange={(value) => updateDraft("startDate", value)} />
              <Field label="Schedule" value={draft.schedule} onChange={(value) => updateDraft("schedule", value)} />
              <Field label="Mode / location" value={draft.mode} onChange={(value) => updateDraft("mode", value)} />
              <Field label="Fee" value={draft.fee} onChange={(value) => updateDraft("fee", value)} />
              <Field label="Duration / extra line" value={draft.duration} onChange={(value) => updateDraft("duration", value)} />
              <Field label="Button text" value={draft.cta} onChange={(value) => updateDraft("cta", value)} />
              <Field label="Registration URL" value={draft.website} onChange={(value) => updateDraft("website", value)} />
              <Field label="Phone (optional)" value={draft.phone} onChange={(value) => updateDraft("phone", value)} />
              <Field label="Footer" value={draft.footer} onChange={(value) => updateDraft("footer", value)} />
            </div>
          </section>
        </div>

        <div style={{ display: "grid", gap: 14, position: "sticky", top: 12 }}>
          <section style={{ ...panelStyle, display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 17 }}>Live preview</h2>
                <small style={{ color: "#64748b" }}>{format.width} × {format.height}px PNG</small>
              </div>
              <button type="button" onClick={exportImage} style={{ fontWeight: 800 }}>
                Export PNG
              </button>
            </div>
            <div style={{ display: "grid", placeItems: "center", borderRadius: 14, background: "#e2e8f0", padding: 12, overflow: "auto" }}>
              <canvas
                ref={canvasRef}
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: format.id === "story" ? 460 : 650,
                  height: "auto",
                  borderRadius: 10,
                  boxShadow: "0 18px 45px rgba(15,23,42,.18)",
                }}
              />
            </div>
          </section>

          <section style={panelStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
              <h2 style={{ margin: 0, fontSize: 17 }}>Ready caption</h2>
              <button type="button" onClick={copyCaption}>Copy caption</button>
            </div>
            <textarea readOnly rows={7} value={caption} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.45 }} />
          </section>
        </div>
      </div>
    </div>
  );
}
