import { useEffect, useState } from "react";
export default function SignatureUploadPanel({ request }) {
  const [notice, setNotice] = useState({ kind: "loading", text: "Checking saved signature…" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    request("signature").then(data => {
      if (active) setNotice(data.installed
        ? { kind: "success", text: "Signature is saved and ready for new agreement receipts." }
        : { kind: "info", text: data.driveConfigured ? "Private Drive signature is configured. Test signing to confirm access." : "No signature has been uploaded yet. Choose your signature PNG below." });
    }).catch(() => { if (active) setNotice({ kind: "error", text: "Could not check the saved signature. Refresh the page to retry; this does not mean your previous upload failed." }); });
    return () => { active = false; };
  }, [request]);
  async function upload(event) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    setBusy(true); setNotice({ kind: "loading", text: "Uploading and saving your signature…" });
    try {
      if (!/\.png$/i.test(file.name) || (file.type && file.type !== "image/png")) throw new Error("Choose the signature PNG image. PDF files and page screenshots cannot be uploaded as a signature.");
      if (file.size > 70000) throw new Error("Choose a PNG under 70 KB.");
      const bytes = new Uint8Array(await file.arrayBuffer()); let binary = ""; for (const byte of bytes) binary += String.fromCharCode(byte);
      await request("signature", { png: btoa(binary) });
      setNotice({ kind: "success", text: "Signature uploaded successfully and saved. New receipts will use it; existing PDFs are unchanged." });
    } catch (e) { setNotice({ kind: "error", text: e.message }); }
    finally { setBusy(false); }
  }
  return <div aria-busy={busy}>
    <div className={`signature-notice signature-notice--${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"} aria-live="polite">{notice.text}</div>
    <label>Install / replace the authorised Falowen director signature (private PNG, max 70 KB)<input type="file" accept="image/png" disabled={busy} onChange={upload} /></label>
  </div>;
}
