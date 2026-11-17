import { useEffect, useState } from "react";
import { doc, getDocFromServer, setDoc, Timestamp } from "firebase/firestore";
import { Navigate } from "react-router-dom";
import { db } from "../firebase.js";
import { useAuth } from "../context/AuthContext.jsx";
import CourseDiscountLinks from "./CourseDiscountLinks.jsx";

const CODE = "UH-KISWAHILI-A1";
const URL = "https://www.falowen.app/signup?invite=" + CODE;
const invitation = doc(db, "universityInvitations", CODE);

function localInputValue(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export default function UniversityInvitationsPage() {
  const { role } = useAuth();
  const [tab, setTab] = useState("university");
  const [savedExpiry, setSavedExpiry] = useState(null);
  const [expiry, setExpiry] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (role !== "admin") return;
    let active = true;
    getDocFromServer(invitation).then(snapshot => {
      if (!active) return;
      const date = snapshot.data()?.expiresAt?.toDate();
      if (date) {
        setSavedExpiry(date);
        setExpiry(localInputValue(date));
      }
    }).catch(() => {
      if (active) setError("Could not load the current invitation expiry. Refresh to try again.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [role]);

  if (role !== "admin") return <Navigate to="/" replace />;

  async function save(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    const date = new Date(expiry);
    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) {
      setError("Choose a future date and time.");
      return;
    }
    setSaving(true);
    try {
      await setDoc(invitation, { expiresAt: Timestamp.fromDate(date) });
      setSavedExpiry(date);
      setNotice("Invitation expiry saved.");
    } catch {
      setError("Could not save the expiry. Try saving again.");
    } finally {
      setSaving(false);
    }
  }

  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return <main style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
    <h1>Invitations</h1>
    <nav aria-label="Invitation sections" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
      <button type="button" aria-pressed={tab === "university"} onClick={() => setTab("university")}>University invitation</button>
      <button type="button" aria-pressed={tab === "discounts"} onClick={() => setTab("discounts")}>Discount Links</button>
    </nav>
    {tab === "discounts" ? <CourseDiscountLinks /> : <section className="card">
      <h2>University of Hamburg · Kiswahili A1</h2>
      <p><a href={URL}>{URL}</a></p>
      <p>This link registers learners for Kiswahili A1. On approval, Falowen assigns the next open Swahili A1 class and starts six months of complimentary access.</p>
      <p>{loading ? "Loading expiry…" : savedExpiry
        ? `${savedExpiry > new Date() ? "Expires" : "Expired"} on ${savedExpiry.toLocaleString()} (${zone}).`
        : "No expiry configured. Set an expiry to open registration."}</p>
      <form onSubmit={save} style={{ display: "grid", gap: 8 }}>
        <label htmlFor="invitation-expiry">Expiry date and time ({zone})</label>
        <input id="invitation-expiry" type="datetime-local" required value={expiry}
          onChange={event => setExpiry(event.target.value)} disabled={loading || saving} />
        <button type="submit" disabled={loading || saving}>{saving ? "Saving…" : "Save expiry"}</button>
      </form>
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}
    </section>}
  </main>;
}
