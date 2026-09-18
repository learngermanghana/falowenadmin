import { useEffect, useMemo, useState } from "react";
import { loadShareablePublicClasses } from "../services/publicBrochureClassService.js";
import {
  BROCHURE_WHATSAPP_MESSAGE,
  buildBrochureWhatsappUrl,
  buildClassBrochureMessage,
  buildClassBrochureUrl,
  formatBrochureDate,
  formatBrochureFee,
  formatBrochureSchedule,
  normalizeGhanaWhatsappNumber,
} from "../utils/brochureWhatsapp.js";

function classKey(klass = {}) {
  return String(klass.id || klass.slug || klass.classId || klass.title || klass.name || "").trim();
}

export default function BrochureWhatsappPanel({ pushToast }) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(BROCHURE_WHATSAPP_MESSAGE);
  const [classes, setClasses] = useState([]);
  const [selectedClassKey, setSelectedClassKey] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [classError, setClassError] = useState("");

  useEffect(() => {
    let active = true;
    setLoadingClasses(true);
    setClassError("");
    loadShareablePublicClasses()
      .then((rows) => {
        if (!active) return;
        setClasses(rows);
      })
      .catch((error) => {
        if (!active) return;
        setClasses([]);
        setClassError(error?.message || "Could not load upcoming classes.");
      })
      .finally(() => {
        if (active) setLoadingClasses(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedClass = useMemo(
    () => classes.find((klass) => classKey(klass) === selectedClassKey) || null,
    [classes, selectedClassKey],
  );

  const brochureLink = useMemo(
    () => selectedClass ? buildClassBrochureUrl(selectedClass) : "",
    [selectedClass],
  );

  const normalizedPhone = useMemo(() => normalizeGhanaWhatsappNumber(phone), [phone]);
  const whatsappLink = useMemo(
    () => selectedClass ? buildBrochureWhatsappUrl(phone, message) : "",
    [phone, message, selectedClass],
  );

  const selectClass = (klass) => {
    setSelectedClassKey(classKey(klass));
    setMessage(buildClassBrochureMessage(klass));
  };

  const openWhatsapp = () => {
    if (!selectedClass) {
      pushToast?.({ type: "error", message: "Select an available class first." });
      return;
    }
    if (!whatsappLink) {
      pushToast?.({ type: "error", message: "Enter a valid Ghana WhatsApp number." });
      return;
    }
    window.open(whatsappLink, "_blank", "noopener,noreferrer");
  };

  const copyWhatsappLink = async () => {
    if (!whatsappLink) {
      pushToast?.({ type: "error", message: selectedClass ? "Enter a valid Ghana WhatsApp number first." : "Select an available class first." });
      return;
    }
    try {
      await navigator.clipboard.writeText(whatsappLink);
      pushToast?.({ type: "success", message: "WhatsApp link copied." });
    } catch {
      pushToast?.({ type: "info", message: "Could not copy automatically. Open WhatsApp instead." });
    }
  };

  const copyBrochureLink = async () => {
    if (!brochureLink) {
      pushToast?.({ type: "error", message: "Select an available class first." });
      return;
    }
    try {
      await navigator.clipboard.writeText(brochureLink);
      pushToast?.({ type: "success", message: "Class brochure link copied." });
    } catch {
      pushToast?.({ type: "info", message: "Could not copy the brochure link automatically." });
    }
  };

  const resetMessage = () => {
    setMessage(selectedClass ? buildClassBrochureMessage(selectedClass) : BROCHURE_WHATSAPP_MESSAGE);
  };

  return (
    <div style={{ maxWidth: 900, display: "grid", gap: 16 }}>
      <div>
        <h2 style={{ margin: "0 0 6px" }}>Send available class brochure</h2>
        <p style={{ margin: 0, color: "#64748b", lineHeight: 1.55 }}>
          Select a class from the same live public catalogue used by Falowen’s brochure pages. Falowen automatically builds that class’s brochure link, start date, schedule and fee, then prepares the WhatsApp message.
        </p>
      </div>

      <section style={{ border: "1px solid #dbe3ef", borderRadius: 12, padding: 12, background: "#f8fafc", display: "grid", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <strong>Classes currently available for registration</strong>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Choose the class you discussed with the lead.</div>
          </div>
          {!loadingClasses && !classError && <span style={{ fontSize: 12, color: "#475569" }}>{classes.length} available</span>}
        </div>

        {loadingClasses && <p style={{ margin: 0, color: "#64748b" }}>Loading available classes…</p>}
        {classError && <p style={{ margin: 0, color: "#b91c1c" }}>{classError}</p>}
        {!loadingClasses && !classError && !classes.length && (
          <p style={{ margin: 0, color: "#64748b" }}>No public class is currently open for registration.</p>
        )}

        {!!classes.length && (
          <div style={{ display: "grid", gap: 8 }}>
            {classes.map((klass) => {
              const key = classKey(klass);
              const selected = key === selectedClassKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectClass(klass)}
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderRadius: 10,
                    border: selected ? "2px solid #2563eb" : "1px solid #cbd5e1",
                    background: selected ? "#eff6ff" : "#fff",
                    color: "#0f172a",
                    cursor: "pointer",
                    display: "grid",
                    gap: 5,
                  }}
                >
                  <span style={{ fontWeight: 800 }}>{klass.title || klass.name || klass.className || klass.classId || "Available class"}</span>
                  <span style={{ fontSize: 13, color: "#475569" }}>
                    Starts {formatBrochureDate(klass.startDate || klass.startsAt)} · {formatBrochureFee(klass)}
                  </span>
                  <span style={{ fontSize: 12, color: "#64748b" }}>{formatBrochureSchedule(klass)}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selectedClass && (
        <section style={{ border: "1px solid #bfdbfe", borderRadius: 12, padding: 12, background: "#eff6ff", display: "grid", gap: 8 }}>
          <div style={{ fontWeight: 800, color: "#1e3a8a" }}>Selected brochure</div>
          <div style={{ fontWeight: 700 }}>{selectedClass.title || selectedClass.name || selectedClass.className || selectedClass.classId}</div>
          <div style={{ fontSize: 13, color: "#334155" }}>
            Start: {formatBrochureDate(selectedClass.startDate || selectedClass.startsAt)} · Fee: {formatBrochureFee(selectedClass)}
          </div>
          <div style={{ fontSize: 13, color: "#334155" }}>{formatBrochureSchedule(selectedClass)}</div>
          <input
            value={brochureLink}
            readOnly
            aria-label="Public class brochure link"
            style={{ width: "100%", padding: "9px 10px", borderRadius: 8, border: "1px solid #93c5fd", background: "#fff" }}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={() => window.open(brochureLink, "_blank", "noopener,noreferrer")}>Open brochure</button>
            <button type="button" onClick={copyBrochureLink} style={{ background: "#fff", color: "#1a2233", border: "1px solid #93c5fd" }}>
              Copy brochure link
            </button>
          </div>
        </section>
      )}

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontWeight: 700 }}>Client WhatsApp number</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="024 123 4567 or +233 24 123 4567"
          style={{ width: "100%", padding: "11px 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}
        />
        <small style={{ color: normalizedPhone ? "#15803d" : "#64748b" }}>
          {normalizedPhone ? `WhatsApp number: +${normalizedPhone}` : "Use a 10-digit Ghana number or include the +233 country code."}
        </small>
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span style={{ fontWeight: 700 }}>Message to client</span>
        <textarea
          rows={13}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          style={{ width: "100%", minHeight: 270, padding: 12, borderRadius: 8, border: "1px solid #cbd5e1", lineHeight: 1.5 }}
        />
      </label>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={openWhatsapp} disabled={!selectedClass || !whatsappLink}>Open WhatsApp</button>
        <button
          type="button"
          onClick={copyWhatsappLink}
          disabled={!selectedClass || !whatsappLink}
          style={{ background: "#fff", color: "#1a2233", border: "1px solid #cbd5e1" }}
        >
          Copy WhatsApp link
        </button>
        <button type="button" onClick={resetMessage} style={{ background: "#fff", color: "#1a2233", border: "1px solid #cbd5e1" }}>
          Reset message
        </button>
      </div>

      <p style={{ margin: 0, padding: 12, borderRadius: 8, background: "#ecfdf5", color: "#166534" }}>
        <strong>No attachment needed:</strong> the selected class’s public Falowen brochure page is included in the message automatically.
      </p>
    </div>
  );
}
