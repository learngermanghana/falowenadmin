import { useMemo, useState } from "react";
import {
  BROCHURE_WHATSAPP_MESSAGE,
  buildBrochureWhatsappUrl,
  normalizeGhanaWhatsappNumber,
} from "../utils/brochureWhatsapp.js";

export default function BrochureWhatsappPanel({ pushToast }) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(BROCHURE_WHATSAPP_MESSAGE);
  const normalizedPhone = useMemo(() => normalizeGhanaWhatsappNumber(phone), [phone]);
  const whatsappLink = useMemo(() => buildBrochureWhatsappUrl(phone, message), [phone, message]);

  const openWhatsapp = () => {
    if (!whatsappLink) {
      pushToast?.({ type: "error", message: "Enter a valid Ghana WhatsApp number and a message." });
      return;
    }
    window.open(whatsappLink, "_blank", "noopener,noreferrer");
  };

  const copyLink = async () => {
    if (!whatsappLink) {
      pushToast?.({ type: "error", message: "Enter a valid Ghana WhatsApp number first." });
      return;
    }
    try {
      await navigator.clipboard.writeText(whatsappLink);
      pushToast?.({ type: "success", message: "WhatsApp link copied." });
    } catch {
      pushToast?.({ type: "info", message: "Could not copy automatically. Open WhatsApp instead." });
    }
  };

  return (
    <div style={{ maxWidth: 760, display: "grid", gap: 16 }}>
      <div>
        <h2 style={{ margin: "0 0 6px" }}>Send class brochure on WhatsApp</h2>
        <p style={{ margin: 0, color: "#64748b" }}>
          Enter the number from the call. WhatsApp will open with the registration and free-learning information ready to send.
        </p>
      </div>

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
          style={{ width: "100%", minHeight: 280, padding: 12, borderRadius: 8, border: "1px solid #cbd5e1", lineHeight: 1.5 }}
        />
      </label>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={openWhatsapp} disabled={!whatsappLink}>Open WhatsApp</button>
        <button type="button" onClick={copyLink} disabled={!whatsappLink} style={{ background: "#fff", color: "#1a2233", border: "1px solid #cbd5e1" }}>
          Copy WhatsApp link
        </button>
        <button type="button" onClick={() => setMessage(BROCHURE_WHATSAPP_MESSAGE)} style={{ background: "#fff", color: "#1a2233", border: "1px solid #cbd5e1" }}>
          Reset message
        </button>
      </div>

      <p style={{ margin: 0, padding: 12, borderRadius: 8, background: "#fefce8", color: "#854d0e" }}>
        <strong>Remember:</strong> the message is prefilled automatically. Attach the brochure file in WhatsApp before you press Send.
      </p>
    </div>
  );
}
