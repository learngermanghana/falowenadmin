import { useCallback, useEffect, useMemo, useState } from "react";
import "./Appointments.css";

const API = "/api/appointments";
const EMPTY = { name:"",email:"",phone:"",notes:"",website:"" };

function readableDate(value) {
  try {
    return new Intl.DateTimeFormat("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(value+"T12:00:00Z"));
  } catch {return value;}
}

export default function AppointmentBookingPage() {
  const [slots,setSlots] = useState([]);
  const [selected,setSelected] = useState("");
  const [form,setForm] = useState(EMPTY);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [confirmation,setConfirmation] = useState(null);
  const load = useCallback(async () => {
    setLoading(true);setError("");
    try {
      const res = await fetch(API+"?view=public",{headers:{accept:"application/json"},cache:"no-store"});
      const data = await res.json().catch(()=>({}));
      if (!res.ok || data.ok === false) throw new Error(data.error || "The booking calendar is temporarily unavailable.");
      setSlots(data.slots || []);
    } catch(e) {setError(e.message);}
    finally {setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);
  const groups = useMemo(()=>{
    return slots.reduce((all,slot)=>{
      (all[slot.date] ||= []).push(slot);
      return all;
    },{});
  },[slots]);
  const chosen = slots.find(slot=>slot.slotId===selected);
  const submit = async event => {
    event.preventDefault();
    if (!chosen) {setError("Choose an available appointment time.");return;}
    setBusy(true);setError("");
    try {
      const response = await fetch(API,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({...form,slotId:chosen.slotId,action:"book"})
      });
      const result = await response.json().catch(()=>({}));
      if (!response.ok || result.ok === false) {
        if (result.code === "slot_unavailable") {setSlots(current=>current.filter(item=>item.slotId!==chosen.slotId));setSelected("");}
        throw new Error(result.error || "Could not confirm your appointment.");
      }
      setConfirmation({...result,email:form.email,confirmationEmailSent:result.confirmationEmailSent});
      setSlots(current=>current.filter(item=>item.slotId!==chosen.slotId));
      setSelected("");setForm(EMPTY);
    } catch(e) {setError(e.message);}
    finally {setBusy(false);}
  };

  return <div className="appt-root appt-public">
    <header className="appt-header">
      <span className="appt-eyebrow">FALOWEN · SCHEDULE A MEETING</span>
      <h1>Book an appointment</h1>
      <p>Choose a convenient time to meet with our team. No account or payment is needed.</p>
      <div className="appt-timezone">All appointment times are shown in <strong>Accra, Ghana (GMT / UTC+00:00)</strong>.</div>
    </header>

    {confirmation ? <section className="appt-panel appt-confirmation" role="status">
      <div className="appt-success-mark">✓</div>
      <h2>Your appointment is confirmed</h2>
      <p><strong>{confirmation.topic}</strong></p>
      <p>{readableDate(confirmation.date)} · {confirmation.time} GMT</p>
      <p>Booking confirmation: <strong>{confirmation.bookingId}</strong></p>
      <p>{confirmation.confirmationEmailSent
        ? "A confirmation email was sent to "+confirmation.email+". Appointment reminders will be sent before your meeting."
        : "Your booking is saved, but the confirmation email could not be sent. Please keep these details and contact Falowen if needed."}</p>
      <button type="button" className="appt-secondary" onClick={()=>{setConfirmation(null);load();}}>Book another appointment</button>
    </section> : <>
      {error && <div className="appt-message error" role="alert">{error}</div>}
      <section className="appt-panel">
        <div className="appt-panel-row"><div><h2>1. Choose your appointment time</h2><p className="appt-muted">Only times published by Falowen are displayed.</p></div>
          <button type="button" onClick={load} disabled={busy||loading} className="appt-secondary">{loading?"Loading…":"Refresh times"}</button>
        </div>
        {loading ? <p>Loading available appointments…</p> : !slots.length ? <p className="appt-empty">No appointment times are available right now. Please check again later or contact Falowen.</p> :
        <div className="appt-day-groups">
          {Object.entries(groups).map(([date,daySlots])=><div key={date} className="appt-day">
            <h3>{readableDate(date)}</h3>
            <div className="appt-time-grid">{daySlots.map(slot=><button
              key={slot.slotId} type="button" className={`appt-time-button ${selected===slot.slotId?"is-selected":""}`}
              aria-pressed={selected===slot.slotId} disabled={busy}
              onClick={()=>{setSelected(slot.slotId);setError("");}}>
              <strong>{slot.time} GMT</strong><span>{slot.durationMinutes} minutes</span><small>{slot.topic}</small>
            </button>)}</div>
          </div>)}
        </div>}
      </section>
      {chosen && <section className="appt-panel">
        <h2>2. Confirm your details</h2>
        <p className="appt-muted">You selected <strong>{readableDate(chosen.date)} at {chosen.time} GMT</strong> for {chosen.durationMinutes} minutes.</p>
        <form className="appt-form" onSubmit={submit}>
          <div className="appt-two">
            <label>Your full name <input required minLength={2} maxLength={120} autoComplete="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
            <label>Email for confirmation and reminders <input required type="email" maxLength={254} autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
          </div>
          <label>Phone or WhatsApp <span className="appt-optional">(optional)</span><input type="tel" maxLength={40} autoComplete="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
          <label>What would you like to discuss? <span className="appt-optional">(optional)</span>
            <textarea rows={3} maxLength={500} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="A short note helps our team prepare."/></label>
          <div className="appt-honeypot" aria-hidden="true"><label>Website <input tabIndex={-1} autoComplete="off" value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/></label></div>
          <p className="appt-privacy">We use these details only to organise your meeting and send appointment-related emails. Your contact information is not shown publicly.</p>
          <button type="submit" className="appt-primary" disabled={busy}>{busy?"Confirming appointment…":"Confirm appointment"}</button>
        </form>
      </section>}
    </>}
    <footer className="appt-footer">Falowen · Appointment scheduling</footer>
  </div>;
}
