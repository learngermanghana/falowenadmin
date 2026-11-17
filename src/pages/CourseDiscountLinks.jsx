import { useEffect, useState } from "react";
import { auth } from "../firebase.js";

const campus = "https://www.falowen.app";
const endpoint = campus + "/api/course-discounts/admin";
const levels = ["A1", "A2", "B1", "B2", "C1"];
const defaults = { program: "german", level: "A1", tuition: "3000", kind: "percent", value: "", limit: "1", expiresAt: "" };
const shareUrl = code => campus + "/signup?discount=" + code;

async function request(path = "", { method = "GET", body, signal } = {}) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in again to manage discount links.");
  const response = await fetch(endpoint + path, {
    method, signal,
    headers: { Authorization: "Bearer " + token, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Could not manage discount links.");
  return payload;
}

function offerStatus(link) {
  if (link.revoked) return "Revoked";
  if (link.expiresAt <= Date.now()) return "Expired";
  if (link.redeemed >= link.limit) return "Redeemed";
  if (link.allocated >= link.limit) return "Fully reserved";
  return "Active";
}

const price = pesewas => new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(pesewas / 100);

export default function CourseDiscountLinks() {
  const [links, setLinks] = useState(null);
  const [form, setForm] = useState(defaults);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    request("", { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setLinks(result.links); })
      .catch(reason => { if (!controller.signal.aborted) setError(reason.message); });
    return () => controller.abort();
  }, []);

  const field = event => setForm(current => ({ ...current, [event.target.name]: event.target.value }));
  const create = async event => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const date = new Date(form.expiresAt);
      if (!Number.isFinite(date.getTime())) throw new Error("Choose a valid expiry date.");
      const result = await request("", { method: "POST", body: { ...form, expiresAt: date.toISOString() } });
      setLinks(current => [result.link, ...(current || [])]);
      setForm(current => ({ ...current, value: "" }));
      setNotice("Discount link created.");
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  const revoke = async link => {
    if (!window.confirm("Revoke this link for new students? Students who already applied it keep their price.")) return;
    setBusy(true);
    setError("");
    try {
      await request("/" + link.code + "/revoke", { method: "POST" });
      setLinks(current => current.map(row => row.code === link.code ? { ...row, revoked: true } : row));
      setNotice("Discount link revoked.");
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async code => {
    try {
      await navigator.clipboard.writeText(shareUrl(code));
      setNotice("Signup link copied.");
    } catch {
      setError("Copy the signup link from the list.");
    }
  };

  return <div style={{ display: "grid", gap: 16 }}>
    <section className="card">
      <h2>Create discount link</h2>
      <form onSubmit={create} style={{ display: "grid", gap: 12 }}>
        <label>Language <select value={form.program} onChange={event => {
          const program = event.target.value;
          setForm(current => ({ ...current, program, level: program === "swahili" ? "A1" : current.level,
            tuition: program === "german" ? defaults.tuition : "" }));
        }}>
          <option value="german">German</option><option value="swahili">Swahili</option>
        </select></label>
        <label>Level <select name="level" value={form.level} onChange={field}>
          {(form.program === "swahili" ? ["A1"] : levels).map(level => <option key={level}>{level}</option>)}
        </select></label>
        <label>Original course fee (GHS) <input name="tuition" type="number" min="10" max="100000" step="0.01" value={form.tuition} onChange={field} required /></label>
        <label>Discount type <select name="kind" value={form.kind} onChange={field}>
          <option value="percent">Percentage</option><option value="fixed">Fixed amount (GHS)</option>
        </select></label>
        <label>{form.kind === "percent" ? "Discount (%)" : "Discount (GHS)"} <input name="value" type="number" min="0.01"
          max={form.kind === "percent" ? "99.99" : undefined} step="0.01" value={form.value} onChange={field} required /></label>
        <label>Maximum uses <input name="limit" type="number" min="1" max="1000" step="1" value={form.limit} onChange={field} required /></label>
        <label>Expires ({Intl.DateTimeFormat().resolvedOptions().timeZone}) <input name="expiresAt" type="datetime-local"
          value={form.expiresAt} onChange={field} required /></label>
        <button type="submit" disabled={busy}>{busy ? "Saving…" : "Generate signup link"}</button>
      </form>
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}
    </section>
    <section className="card">
      <h2>Recent discount links</h2>
      {links === null && !error && <p role="status">Loading discount links…</p>}
      {links?.length === 0 && <p>No discount links yet.</p>}
      {links?.map(link => <article key={link.code} style={{ borderTop: "1px solid #cbd5e1", padding: "12px 0" }}>
        <strong>{link.program === "swahili" ? "Swahili" : "German"} · {link.level} · {offerStatus(link)}</strong>
        <p>{price(link.original)} tuition · {price(link.discount)} discount · {price(link.total)} final tuition</p>
        <p>{link.allocated} / {link.limit} allocated · {link.redeemed} paid · Expires {new Date(link.expiresAt).toLocaleString()}</p>
        <p><a href={shareUrl(link.code)} target="_blank" rel="noreferrer">Open signup link</a>{" "}
          <button type="button" onClick={() => copy(link.code)}>Copy link</button>{" "}
          {!link.revoked && <button type="button" onClick={() => revoke(link)} disabled={busy}>Revoke</button>}</p>
      </article>)}
    </section>
  </div>;
}
