import { useCallback, useEffect, useMemo, useState } from "react";
import { auth } from "../firebase.js";
import "./Appointments.css";

const API = "/api/appointments";
const PUBLIC_URL = "https://falowen.app/book-appointment";
const WEEKDAYS = [{value:1,label:"Mon"},{value:2,label:"Tue"},{value:3,label:"Wed"},{value:4,label:"Thu"},{value:5,label:"Fri"},{value:6,label:"Sat"},{value:0,label:"Sun"}];
const TIMES = ["13:00","14:00","15:00","16:00","17:00"];
const INITIAL_SLOTS = WEEKDAYS.filter(day=>day.value>=1&&day.value<=5)
  .flatMap(day=>TIMES.filter(time=>["14:00","15:00","16:00"].includes(time))
    .map(time=>({weekday:day.value,time})));
const INITIAL = {weeklySlots:INITIAL_SLOTS,topic:"Falowen consultation",durationMinutes:"30",meetingUrl:""};
function timeLabel(time) {
  return new Date("2020-01-01T"+time+":00Z").toLocaleTimeString("en-GB",{
    hour:"numeric",minute:"2-digit",hour12:true,timeZone:"UTC"
  });
}
function labelDate(value) {
  try {return new Intl.DateTimeFormat("en-GB",{weekday:"short",day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(value+"T12:00:00Z"));}
  catch {return value;}
}
async function request(url,options={}) {
  const token=await auth.currentUser?.getIdToken();
  if(!token) throw new Error("Please sign in to Falowen Admin.");
  const response=await fetch(url,{
    ...options,headers:{"Content-Type":"application/json",Authorization:"Bearer "+token,...(options.headers||{})},cache:"no-store"
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||data.ok===false) throw new Error(data.error||"Appointment service unavailable.");
  return data;
}
function weeklyKey(day,time){return day+"@"+time;}
function savedSchedule(rules) {
  const active=rules.filter(rule=>rule.status==="active");
  if(!active.length) return rules.length ? {...INITIAL,weeklySlots:[]} : INITIAL;
  const latest=active[active.length-1];
  const deduped=new Map();
  active.forEach(rule=>{
    // Older Apps Script deployments return weekday/time cross-products.
    const pairs=Array.isArray(rule.weeklySlots) ? rule.weeklySlots :
      (rule.weekdays||[]).flatMap(weekday=>(rule.times||[]).map(time=>({weekday,time})));
    pairs.forEach(slot=>{
      if(Number.isInteger(slot.weekday)&&typeof slot.time==="string") {
        deduped.set(weeklyKey(slot.weekday,slot.time),{weekday:slot.weekday,time:slot.time});
      }
    });
  });
  return {weeklySlots:[...deduped.values()],topic:latest.topic||INITIAL.topic,
    durationMinutes:String(latest.durationMinutes||30),meetingUrl:latest.meetingUrl||""};
}

export default function AppointmentAdminPage() {
  const [slots,setSlots]=useState([]);
  const [recurring,setRecurring]=useState(INITIAL);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const load=useCallback(async()=>{
    setLoading(true);setError("");
    try {
      const data=await request(API+"?view=admin");
      setSlots(data.slots||[]);
      setRecurring(savedSchedule(data.rules||[]));
    } catch(e) {setError(e.message);}
    finally {setLoading(false);}
  },[]);
  useEffect(()=>{load();},[load]);
  const selected=useMemo(()=>new Set(recurring.weeklySlots.map(slot=>weeklyKey(slot.weekday,slot.time))),[recurring.weeklySlots]);
  const openSlots=useMemo(()=>slots.filter(slot=>slot.status==="open").length,[slots]);
  const booked=useMemo(()=>slots.filter(slot=>slot.status==="booked"),[slots]);
  const toggleSlot=(weekday,time)=>{
    const key=weeklyKey(weekday,time);
    setRecurring(current=>({
      ...current,weeklySlots:selected.has(key)
        ?current.weeklySlots.filter(slot=>weeklyKey(slot.weekday,slot.time)!==key)
        :[...current.weeklySlots,{weekday,time}]
    }));
  };
  const toggleDay=weekday=>{
    const fullDay=TIMES.every(time=>selected.has(weeklyKey(weekday,time)));
    setRecurring(current=>({
      ...current,weeklySlots:[
        ...current.weeklySlots.filter(slot=>slot.weekday!==weekday),
        ...(fullDay?[]:TIMES.map(time=>({weekday,time})))
      ]
    }));
  };
  const save=async event=>{
    event.preventDefault();setBusy(true);setNotice("");setError("");
    try {
      const result=await request(API,{method:"POST",body:JSON.stringify({
        ...recurring,action:"saveWeeklySchedule",durationMinutes:Number(recurring.durationMinutes)
      })});
      setNotice("Weekly timetable updated. "+result.removed+" old open times removed; "+
        result.generated+" new times added. Confirmed bookings are unchanged.");
      await load();
    } catch(e) {
      setError(e.message==="Unknown appointment action."
        ?"Update and redeploy the appointment Apps Script to enable the new weekly timetable."
        :e.message);
    } finally {setBusy(false);}
  };
  const copyLink=async()=>{
    try {await navigator.clipboard.writeText(PUBLIC_URL);setNotice("Booking link copied.");setError("");}
    catch {setError("Unable to copy automatically. Select and copy the link below.");}
  };
  return <div className="appt-root">
    <header className="appt-header">
      <span className="appt-eyebrow">FALOWEN ADMIN · APPOINTMENTS</span>
      <h1>Appointment planning</h1>
      <p>Choose your weekly times, then save. The new timetable replaces the old one automatically.</p>
      <div className="appt-stats"><span><strong>{openSlots}</strong> open times</span><span><strong>{booked.length}</strong> booked</span><span>Accra / GMT</span></div>
    </header>
    {notice&&<div className="appt-message success" role="status">{notice}</div>}
    {error&&<div className="appt-message error" role="alert">{error}</div>}
    <section className="appt-panel appt-recurring">
      <div className="appt-panel-row">
        <div>
          <span className="appt-eyebrow">REPEATS EVERY WEEK</span>
          <h2>Your weekly timetable</h2>
          <p className="appt-muted">Tick the times you are available. Untick Wednesday at 2 PM, for example, and it disappears from future booking availability when you save. Tap a day heading to select or clear that whole day.</p>
        </div>
        <span className="appt-badge">Accra / GMT</span>
      </div>
      <form className="appt-form" onSubmit={save}>
        <div className="appt-weekly-scroll">
          <table className="appt-weekly-table">
            <thead><tr><th scope="col">Time</th>{WEEKDAYS.map(day=><th scope="col" key={day.value}>
              <button type="button" className="appt-day-toggle" disabled={busy||loading}
                aria-label={"Toggle all "+day.label+" times"} onClick={()=>toggleDay(day.value)}>{day.label}</button>
            </th>)}</tr></thead>
            <tbody>{TIMES.map(time=><tr key={time}>
              <th scope="row">{timeLabel(time)}</th>
              {WEEKDAYS.map(day=>{
                const enabled=selected.has(weeklyKey(day.value,time));
                return <td key={day.value}><button type="button"
                  className={"appt-grid-cell"+(enabled?" selected":"")}
                  aria-label={day.label+" "+timeLabel(time)} aria-pressed={enabled}
                  disabled={busy||loading} onClick={()=>toggleSlot(day.value,time)}>
                  {enabled?"✓":"–"}
                </button></td>;
              })}
            </tr>)}</tbody>
          </table>
        </div>
        <div className="appt-recurring-grid">
          <label>Meeting subject
            <input value={recurring.topic} maxLength={120} required
              onChange={e=>setRecurring({...recurring,topic:e.target.value})}/>
          </label>
          <label>Appointment length
            <select value={recurring.durationMinutes}
              onChange={e=>setRecurring({...recurring,durationMinutes:e.target.value})}>
              {[15,30,45,60,90,120].map(n=><option key={n} value={n}>{n} minutes</option>)}
            </select>
          </label>
        </div>
        <details className="appt-optional-settings">
          <summary>Meeting link (optional)</summary>
          <label>Custom meeting link
            <input type="url" value={recurring.meetingUrl} maxLength={400}
              placeholder="Leave blank to use your saved Zoom room"
              onChange={e=>setRecurring({...recurring,meetingUrl:e.target.value})}/>
          </label>
        </details>
        <div className="appt-recurring-actions">
          <p className="appt-muted"><strong>{selected.size}</strong> times per week. Save replaces all previous unbooked availability; existing confirmed bookings stay booked.</p>
          <button className="appt-primary" disabled={loading||busy}>{busy?"Saving…":"Save weekly timetable"}</button>
        </div>
      </form>
    </section>
    <div className="appt-columns">
      <section className="appt-panel">
        <h2>Share your booking link</h2>
        <p className="appt-muted">Visitors will only see the times currently available.</p>
        <div className="appt-share">
          <input value={PUBLIC_URL} readOnly aria-label="Public booking link" onFocus={e=>e.target.select()}/>
          <button type="button" onClick={copyLink}>Copy link</button>
        </div>
        <a className="appt-text-link" href={PUBLIC_URL} target="_blank" rel="noreferrer">Preview booking page</a>
      </section>
      <section className="appt-panel">
        <div className="appt-panel-row">
          <div><h2>Confirmed appointments</h2><p className="appt-muted">Existing bookings stay confirmed even when you change your weekly timetable.</p></div>
          <button type="button" className="appt-secondary" onClick={load} disabled={busy||loading}>Refresh</button>
        </div>
        {loading?<p>Loading…</p>:!booked.length?<p className="appt-empty">No upcoming bookings.</p>:
          <div className="appt-slot-list">{booked.map(slot=><article className="appt-slot-row" key={slot.slotId}>
            <div className="appt-slot-main"><strong>{labelDate(slot.date)}</strong><span>{slot.time} GMT · {slot.durationMinutes} min</span>
              <span className="appt-muted">{slot.topic}</span></div>
            {slot.booked&&<div className="appt-booked-contact"><strong>{slot.booked.name}</strong>
              <span>{slot.booked.email}</span>{slot.booked.phone&&<span>{slot.booked.phone}</span>}
              {slot.booked.notes&&<small>{slot.booked.notes}</small>}</div>}
          </article>)}</div>}
      </section>
    </div>
  </div>;
}
