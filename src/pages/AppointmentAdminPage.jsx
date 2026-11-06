import { useCallback, useEffect, useMemo, useState } from "react";
import { auth } from "../firebase.js";
import "./Appointments.css";

const API = "/api/appointments";
const PUBLIC_PATH = "/book-appointment";
const INITIAL = { topic: "Falowen consultation", date: "", time: "", durationMinutes: "30", meetingUrl: "" };

async function request(url, options = {}) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Please sign in to Falowen Admin.");
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.ok === false) throw new Error(result.error || "Appointment service unavailable.");
  return result;
}
function labelDate(value) {
  try { return new Intl.DateTimeFormat("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(value+"T12:00:00Z")); }
  catch { return value; }
}
function statusClass(status) { return status === "booked" ? "appt-badge is-booked" : "appt-badge"; }

export default function AppointmentAdminPage() {
  const [form,setForm] = useState(INITIAL);
  const [slots,setSlots] = useState([]);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const publicUrl = typeof window === "undefined" ? PUBLIC_PATH : new URL(PUBLIC_PATH,window.location.origin).href;
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await request(API+"?view=admin");
      setSlots(data.slots || []);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const openSlots = useMemo(() => slots.filter(x => x.status === "open").length,[slots]);
  const bookedSlots = useMemo(() => slots.filter(x => x.status === "booked").length,[slots]);

  const save = async event => {
    event.preventDefault(); setBusy(true); setNotice(""); setError("");
    try {
      await request(API,{method:"POST",body:JSON.stringify({...form,action:"addSlot",durationMinutes:Number(form.durationMinutes)})});
      setNotice("Available time saved. It is now visible on the public booking page.");
      setForm(current=>({...INITIAL,topic:current.topic,durationMinutes:current.durationMinutes,meetingUrl:current.meetingUrl}));
      await load();
    } catch(e) {setError(e.message);}
    finally {setBusy(false);}
  };
  const remove = async slot => {
    if (!window.confirm(`Remove ${labelDate(slot.date)} at ${slot.time} from availability?`)) return;
    setBusy(true);setNotice("");setError("");
    try {
      await request(API,{method:"POST",body:JSON.stringify({action:"deleteSlot",slotId:slot.slotId})});
      setNotice("Available time removed.");
      await load();
    } catch(e) {setError(e.message);}
    finally {setBusy(false);}
  };
  const copyLink = async () => {
    try {await navigator.clipboard.writeText(publicUrl);setNotice("Public booking link copied.");setError("");}
    catch {setError("Unable to copy automatically. Select and copy the link below.");}
  };

  return <div className="appt-root">
    <header className="appt-header">
      <span className="appt-eyebrow">FALOWEN ADMIN · APPOINTMENTS</span>
      <h1>Appointment planning</h1>
      <p>Set the times when Falowen can meet. Visitors use one public link to reserve a free slot; confirmed bookings are recorded in Google Sheets for Apps Script reminders.</p>
      <div className="appt-stats"><span><strong>{openSlots}</strong> available</span><span><strong>{bookedSlots}</strong> booked</span><span>Timezone: <strong>Accra / GMT</strong></span></div>
    </header>

    {notice && <div className="appt-message success" role="status">{notice}</div>}
    {error && <div className="appt-message error" role="alert">{error}</div>}

    <div className="appt-columns">
      <section className="appt-panel">
        <h2>Add available time</h2>
        <p className="appt-muted">Publish individual time slots. Booked slots cannot be removed, so an existing appointment is protected.</p>
        <form onSubmit={save} className="appt-form">
          <label>Appointment subject <input required maxLength={120} value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})} placeholder="Falowen consultation" /></label>
          <div className="appt-two">
            <label>Date <input type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></label>
            <label>Start time (GMT) <input type="time" required value={form.time} onChange={e=>setForm({...form,time:e.target.value})} /></label>
          </div>
          <label>Duration <select value={form.durationMinutes} onChange={e=>setForm({...form,durationMinutes:e.target.value})}>
            {[15,30,45,60,90,120].map(n=><option key={n} value={n}>{n} minutes</option>)}
          </select></label>
          <label>Meeting link <span className="appt-optional">(optional, shared only after booking)</span>
            <input type="url" placeholder="https://meet.google.com/..." value={form.meetingUrl} maxLength={400} onChange={e=>setForm({...form,meetingUrl:e.target.value})} /></label>
          <button className="appt-primary" disabled={busy || loading}>{busy?"Saving…":"Add available time"}</button>
        </form>
      </section>
      <section className="appt-panel">
        <h2>Share your booking link</h2>
        <p className="appt-muted">Use the same link for email, WhatsApp, and partnerships. It always shows your current available times.</p>
        <div className="appt-share">
          <input value={publicUrl} readOnly aria-label="Public appointment booking URL" onFocus={e=>e.target.select()} />
          <button type="button" onClick={copyLink}>Copy link</button>
        </div>
        <a className="appt-text-link" href={PUBLIC_PATH} target="_blank" rel="noreferrer">Preview the public booking page</a>
        <div className="appt-info">
          <strong>How reminders work</strong>
          <p>Google Sheets stores each appointment. After you deploy the accompanying Apps Script and install its time trigger, visitors receive confirmation emails and reminders approximately 24 hours and 1 hour before their appointments.</p>
          <p>Times are fixed to Accra (UTC+00:00). Slots you have not published are never available.</p>
        </div>
      </section>
    </div>
    <section className="appt-panel">
      <div className="appt-panel-row"><div><h2>Your appointment slots</h2><p className="appt-muted">Future availability and bookings, with visitor details available only to admins.</p></div><button type="button" className="appt-secondary" onClick={load} disabled={busy||loading}>{loading?"Loading…":"Refresh"}</button></div>
      {loading ? <p>Loading slots…</p> : slots.length === 0 ? <p className="appt-empty">No slots published yet. Add your first available time above.</p> :
      <div className="appt-slot-list">{slots.map(slot=><article key={slot.slotId} className="appt-slot-row">
        <div className="appt-slot-main"><strong>{labelDate(slot.date)}</strong><span>{slot.time} GMT · {slot.durationMinutes} min</span><span className="appt-muted">{slot.topic}</span></div>
        <div className="appt-slot-end">
          <span className={statusClass(slot.status)}>{slot.status==="booked"?"Booked":"Available"}</span>
          {slot.booked ? <div className="appt-booked-contact"><strong>{slot.booked.name}</strong><span>{slot.booked.email}</span>{slot.booked.phone&&<span>{slot.booked.phone}</span>}{slot.booked.notes&&<small>{slot.booked.notes}</small>}</div>
            : <button type="button" className="appt-danger" disabled={busy} onClick={()=>remove(slot)}>Remove slot</button>}
        </div>
      </article>)}</div>}
    </section>
  </div>;
}
