import { useEffect, useMemo, useState } from "react";
import { listClasses } from "../services/classesService.js";
import { saveAnnouncementRow } from "../services/communicationService.js";

function normalize(value) {
  return String(value || "").trim();
}

function classNameOf(entry = {}) {
  return normalize(entry.name || entry.className || entry.classId || entry.id);
}

function isActiveClass(entry = {}) {
  if (entry.archived === true || entry.isArchived === true || entry.active === false) return false;
  const status = normalize(entry.status || entry.state).toLowerCase();
  return !["archived", "inactive", "completed", "complete", "cancelled", "canceled", "closed", "deleted"].includes(status);
}

function publicSlideUrl(courseId = "", slide = null) {
  const base = `${window.location.origin}/teaching-slides/public/${encodeURIComponent(String(courseId || "").toUpperCase())}/print`;
  return slide?.id ? `${base}#print-${encodeURIComponent(slide.id)}` : base;
}

export default function SlideClassShare({ courseId, slide = null }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    listClasses()
      .then((rows) => {
        if (!active) return;
        setClasses((Array.isArray(rows) ? rows : []).filter(isActiveClass));
      })
      .catch(() => { if (active) setClasses([]); });
    return () => { active = false; };
  }, []);

  const shareUrl = useMemo(() => publicSlideUrl(courseId, slide), [courseId, slide]);
  const lessonLabel = normalize(slide?.day || slide?.title || slide?.topic);
  const announcement = useMemo(() => {
    const lesson = lessonLabel ? ` for ${lessonLabel}${slide?.title && slide.title !== lessonLabel ? ` · ${slide.title}` : ""}` : "";
    return `Hi everyone, please review the teaching slides${lesson}. Open the student slide pack here: ${shareUrl}`;
  }, [lessonLabel, shareUrl, slide?.title]);

  async function sendToClass() {
    if (!selectedClass || sending) return;
    setSending(true);
    setMessage("");
    try {
      const receipt = await saveAnnouncementRow({
        announcement,
        className: selectedClass,
        date: new Date().toISOString().slice(0, 10),
        link: shareUrl,
        topic: "Teaching Slides",
        deliveryMode: "auto",
      });
      if (receipt?.sheet?.success && receipt?.sheet?.unverified) {
        setMessage(receipt.sheet.message || "Share request sent; final delivery could not be verified in the browser.");
      } else {
        setMessage(receipt?.sheet?.message || receipt?.firestore?.message || "Teaching slides sent through Falowen Communication.");
      }
    } catch (error) {
      setMessage(error?.message || "Could not share the teaching slides.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="slide-email-share">
      <label>
        Share with class through Falowen:
        <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)} disabled={sending}>
          <option value="">Select class</option>
          {classes.map((entry) => {
            const name = classNameOf(entry);
            return name ? <option key={normalize(entry.id || entry.classId || name)} value={name}>{name}</option> : null;
          })}
        </select>
      </label>
      <button type="button" className="slide-mailto-link" onClick={sendToClass} disabled={!selectedClass || sending}>
        {sending ? "Sending…" : "Share student slide link"}
      </button>
      <p className="slide-email-help">{message || "Uses Falowen Communication; student email addresses stay private."}</p>
    </div>
  );
}
