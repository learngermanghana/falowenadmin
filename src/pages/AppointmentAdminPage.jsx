import { useCallback, useEffect, useMemo, useState } from "react";
import { auth } from "../firebase.js";
import "./Appointments.css";

const API = "/api/appointments";
const PUBLIC_URL = "https://falowen.app/book-appointment";
const INITIAL = { topic: "Falowen consultation", date: "", time: "", durationMinutes: "30", meetingUrl: "" };
const WEEKDAYS = [{value:1,label:"Mon"},{value:2,label:"Tue"},{value:3,label:"Wed"},{value:4,label:"Thu"},{value:5,label:"Fri"},{value:6,label:"Sat"},{value:0,label:"Sun"}];
const AFTERNOON_TIMES = ["13:00","14:00","15:00","16:00","17:00"];
const RECURRING_INITIAL = { weekdays:[1,2,3,4,5],times:["14:00","15:00","16:00"],topic:"Falowen consultation",durationMinutes:"30",meetingUrl:"" };
function timeLabel(time) { return new Date("2020-01-01T"+time+":00Z").toLocaleTimeString("en-GB",{hour:"numeric",minute:"2-digit",hour12:true,timeZone:"UTC"}); }

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
  const [rules,setRules] = useState([]);
  const [recurring,setRecurring] = useState(RECURRING_INITIAL);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const publicUrl = PUBLIC_URL;
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await request(API+"?view=admin");
      setSlots(data.slots || []);
      setRules(data.rules || []);
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

  const toggleDay = day => setRecurring(current => ({
    ...current,weekdays:current.weekdays.includes(day)
      ? current.weekdays.filter(x=>x!==day)
      : [...current.weekdays,day].sort((a,b)=>a-b)
  }));
  const toggleTime = time => setRecurring(current => ({
    ...current,times:current.times.includes(time)
      ? current.times.filter(x=>x!==time)
      : [...current.times,time].sort()
  }));
  const saveRecurring = async event => {
    event.preventDefault();setBusy(true);setNotice("");setError("");
    try {
      if (!recurring.weekdays.length || !recurring.times.length) throw new Error("Choose weekdays and at least one afternoon time.");
      const result = await request(API,{method:"POST",body:JSON.stringify({
        ...recurring,action:"addRecurringRule",durationMinutes:Number(recurring.durationMinutes)
      })});
      setNotice("Weekly availability saved. "+result.generated+" upcoming slots prepared; more will be added automatically.");
      await load();
    } catch(e) {
      setError(e.message === "Unknown appointment action."
        ? "Update the Google Apps Script Code.gs and redeploy its Web app to enable recurring appointments."
        : e.message);
    } finally {setBusy(false);}
  };
  const stopRecurring = async rule => {
    if (!window.confirm("Stop this weekly schedule? Available future slots from it will be removed, but bookings stay confirmed.")) return;
    setBusy(true);setNotice("");setError("");
    try {
      const result = await request(API,{method:"POST",body:JSON.stringify({action:"stopRecurringRule",ruleId:rule.ruleId})});
      setNotice("Recurring schedule stopped. "+result.removed+" unbooked slots removed; existing bookings preserved.");
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


    <section className="appt-panel appt-recurring">
      <div className="appt-panel-row">
        <div>
          <span className="appt-eyebrow">FAST WEEKLY SETUP</span>
          <h2>Recurring afternoon availability</h2>
          <p className="appt-muted">Choose your usual weekdays and afternoon times once. Falowen keeps the next eight weeks open automatically, without publishing slots one at a time.</p>
        </div>
        <span className="appt-badge">Accra / GMT</span>
      </div>
      <form onSubmit={saveRecurring} className="appt-form">
        <div className="appt-recurring-grid">
          <fieldset className="appt-choice-group">
            <legend>Which days are you free?</legend>
            <div className="appt-choice-row">{WEEKDAYS.map(day=>
              <button key={day.value} type="button" className={"appt-choice"+(recurring.weekdays.includes(day.value)?" selected":"")}
                aria-pressed={recurring.weekdays.includes(day.value)} onClick={()=>toggleDay(day.value)} disabled={busy}>{day.label}</button>
            )}</div>
          </fieldset>
          <fieldset className="appt-choice-group">
            <legend>Pick your usual afternoon start times</legend>
            <div className="appt-choice-row">{AFTERNOON_TIMES.map(time=>
              <button key={time} type="button" className={"appt-choice"+(recurring.times.includes(time)?" selected":"")}
                aria-pressed={recurring.times.includes(time)} onClick={()=>toggleTime(time)} disabled={busy}>{timeLabel(time)}</button>
            )}</div>
          </fieldset>
        </div>
        <div className="appt-recurring-grid">
          <label>Appointment subject
            <input maxLength={120} required value={recurring.topic}
              onChange={e=>setRecurring({...recurring,topic:e.target.value})}/>
          </label>
          <label>Duration per appointment
            <select value={recurring.durationMinutes} onChange={e=>setRecurring({...recurring,durationMinutes:e.target.value})}>
              {[15,30,45,60,90,120].map(n=><option key={n} value={n}>{n} minutes</option>)}
            </select>
          </label>
        </div>
        <label>Meeting link override <span className="appt-optional">(optional — your saved Zoom room is used automatically)</span>
          <input type="url" placeholder="Leave blank to use your default Zoom room" value={recurring.meetingUrl}
            maxLength={400} onChange={e=>setRecurring({...recurring,meetingUrl:e.target.value})}/>
        </label>
        <div className="appt-recurring-actions">
          <p className="appt-muted">
            <strong>{recurring.weekdays.length*recurring.times.length}</strong> possible slots per week.
            Public visitors see only open times. Booked slots cannot be offered twice.
          </p>
          <button className="appt-primary" disabled={busy||loading||!recurring.weekdays.length||!recurring.times.length}>
            {busy?"Saving…":"Save recurring availability"}
          </button>
        </div>
      </form>
      {rules.length>0&&<div className="appt-rules">
        <h3>Saved weekly schedules</h3>
        {rules.map(rule=><div key={rule.ruleId} className="appt-rule-row">
          <div>
            <strong>{rule.topic}</strong>
            <p className="appt-muted">{(rule.weekdays||[]).map(day=>WEEKDAYS.find(x=>x.value===day)?.label).filter(Boolean).join(", ")}
              {" · "}{(rule.times||[]).map(timeLabel).join(", ")}{" · "}{rule.durationMinutes} min</p>
          </div>
          {rule.status==="active"
            ? <button type="button" className="appt-danger" disabled={busy} onClick={()=>stopRecurring(rule)}>Stop repeating</button>
            : <span className="appt-badge is-booked">Stopped</span>}
        </div>)}
      </div>}
    </section>

    <div className="appt-columns">
      <section className="appt-panel">
        <h2>Add available time</h2>
        <p className="appt-muted">For a one-off exception, add one specific date below. Otherwise, use the weekly schedule above.</p>
        <form onSubmit={save} className="appt-form">
          <label>Appointment subject <input required maxLength={120} value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})} placeholder="Falowen consultation" /></label>
          <div className="appt-two">
            <label>Date <input type="date" required value={form.date} onChange={e=>setForm({...form,date:e.target.value})} /></label>
            <label>Start time (GMT) <input type="time" required value={form.time} onChange={e=>setForm({...form,time:e.target.value})} /></label>
          </div>
          <label>Duration <select value={form.durationMinutes} onChange={e=>setForm({...form,durationMinutes:e.target.value})}>
            {[15,30,45,60,90,120].map(n=><option key={n} value={n}>{n} minutes</option>)}
          </select></label>
          <label>Meeting link override <span className="appt-optional">(optional — your default Zoom room is used automatically)</span>
            <input type="url" placeholder="Leave blank to use your default Zoom room" value={form.meetingUrl} maxLength={400} onChange={e=>setForm({...form,meetingUrl:e.target.value})} /></label>
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
        <a className="appt-text-link" href={PUBLIC_URL} target="_blank" rel="noreferrer">Preview the public booking page</a>
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
