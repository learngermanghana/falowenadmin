/**
 * Falowen appointment API — tiny same-origin proxy to Apps Script.
 * No secrets in browser or Firebase/Firestore writes. Admin actions are
 * protected by existing Falowen Firebase login and admin email allowlist.
 */
const DEFAULT_ADMIN_EMAILS = ['moxflex@gmail.com'];
const MAX_BODY_CHARS = 5000;
const DURATIONS = new Set([15,30,45,60,90,120]);

export function appointmentError(message, code = 'invalid_request', statusCode = 400) {
  return Object.assign(new Error(message), {code,statusCode});
}
function getEnv(name) {
  return String(process.env[name] || '').trim();
}
function admins() {
  const setting = getEnv('FALOWEN_ADMIN_EMAILS') || getEnv('ADMIN_EMAILS');
  return new Set((setting ? setting.split(',') : DEFAULT_ADMIN_EMAILS).map(x => x.trim().toLowerCase()).filter(Boolean));
}
async function assertAdmin(req) {
  const token = /^Bearer\s+(.+)$/i.exec(String(req.headers.authorization || ''))?.[1]?.trim();
  if (!token) throw appointmentError('Please sign in to Falowen Admin.', 'unauthorized', 401);
  const key = getEnv('FIREBASE_API_KEY') || getEnv('VITE_FIREBASE_API_KEY');
  if (!key) throw appointmentError('Firebase verification is not configured.', 'not_configured', 503);
  const result = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key='+encodeURIComponent(key),{
    method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({idToken:token})
  });
  const payload = await result.json().catch(() => ({}));
  const user = payload.users?.[0];
  if (!result.ok || !user?.localId) throw appointmentError('Your admin login has expired.', 'unauthorized', 401);
  if (!admins().has(String(user.email || '').toLowerCase())) {
    throw appointmentError('Administrator access is required.', 'forbidden', 403);
  }
}
function clean(value, max) {
  return String(value == null ? '' : value).trim().slice(0,max);
}
export function validateAppointmentAction(action, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw appointmentError('Invalid booking data.');
  }
  if (action === 'book') {
    if (clean(input.website,100)) throw appointmentError('Invalid booking request.');
    const slotId = clean(input.slotId,100);
    const name = clean(input.name,120);
    const email = clean(input.email,254).toLowerCase();
    const phone = clean(input.phone,40);
    const notes = clean(input.notes,500);
    if (!/^[0-9a-f-]{30,40}$/i.test(slotId)) throw appointmentError('Choose a valid available time.');
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw appointmentError('Your name and a valid email are required.');
    }
    return {action,slotId,name,email,phone,notes,website:''};
  }
  if (action === 'addSlot') {
    const date = clean(input.date,10), time = clean(input.time,5);
    const durationMinutes = Number(input.durationMinutes);
    const topic = clean(input.topic,120) || 'Falowen appointment';
    const meetingUrl = clean(input.meetingUrl,400);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      throw appointmentError('Enter a date and time.');
    }
    if (!DURATIONS.has(durationMinutes)) throw appointmentError('Select an available appointment duration.');
    if (meetingUrl && !/^https:\/\/[^\s]+$/i.test(meetingUrl)) throw appointmentError('Meeting links must use HTTPS.');
    return {action,date,time,durationMinutes,topic,meetingUrl};
  }

  if (action === 'saveWeeklySchedule') {
    const raw = input.weeklySlots;
    if (!Array.isArray(raw) || raw.length > 42) throw appointmentError('Choose up to 42 weekly times.');
    const weeklySlots = [];
    const seen = new Set();
    for (const slot of raw) {
      const weekday = slot?.weekday;
      const time = clean(slot?.time,5);
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6 ||
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        throw appointmentError('Choose a valid day and time.');
      }
      const key = weekday+'@'+time;
      if (!seen.has(key)) {seen.add(key);weeklySlots.push({weekday,time});}
    }
    const durationMinutes = Number(input.durationMinutes);
    if (!DURATIONS.has(durationMinutes)) throw appointmentError('Choose a valid duration.');
    weeklySlots.sort((a,b)=>a.weekday-b.weekday || a.time.localeCompare(b.time));
    for (let i=1;i<weeklySlots.length;i++) {
      const previous=weeklySlots[i-1], current=weeklySlots[i];
      if (previous.weekday === current.weekday &&
          (Number(current.time.slice(0,2))*60+Number(current.time.slice(3))) -
          (Number(previous.time.slice(0,2))*60+Number(previous.time.slice(3))) < durationMinutes) {
        throw appointmentError('Times on the same day overlap. Adjust the duration or selection.');
      }
    }
    const meetingUrl = clean(input.meetingUrl,400);
    if (meetingUrl && !/^https:\/\/[^\s]+$/i.test(meetingUrl)) {
      throw appointmentError('Meeting links must use HTTPS.');
    }
    return {action,weeklySlots,durationMinutes,topic:clean(input.topic,120)||'Falowen consultation',meetingUrl};
  }
  if (action === 'addRecurringRule') {
    const weekdays = Array.isArray(input.weekdays) ? [...new Set(input.weekdays.map(Number))] : [];
    const times = Array.isArray(input.times) ? [...new Set(input.times.map(x => clean(x,5)))].sort() : [];
    const durationMinutes = Number(input.durationMinutes);
    const topic = clean(input.topic,120) || 'Falowen consultation';
    const meetingUrl = clean(input.meetingUrl,400);
    if (!weekdays.length || weekdays.length > 7 || weekdays.some(n => !Number.isInteger(n) || n < 0 || n > 6)) {
      throw appointmentError('Choose at least one weekday.');
    }
    if (!times.length || times.length > 6 || times.some(t => !/^([01]\d|2[0-3]):[0-5]\d$/.test(t))) {
      throw appointmentError('Choose up to six valid appointment times.');
    }
    if (!DURATIONS.has(durationMinutes)) throw appointmentError('Choose a valid duration.');
    if (times.some((time,i) => i > 0 && (Number(time.slice(0,2))*60+Number(time.slice(3,5))) -
      (Number(times[i-1].slice(0,2))*60+Number(times[i-1].slice(3,5))) < durationMinutes)) {
      throw appointmentError('Selected recurring times overlap. Reduce the duration or choose wider spacing.');
    }
    if (meetingUrl && !/^https:\/\/[^\s]+$/i.test(meetingUrl)) throw appointmentError('Meeting links must use HTTPS.');
    return {action,weekdays,times,durationMinutes,topic,meetingUrl};
  }
  if (action === 'stopRecurringRule') {
    const ruleId = clean(input.ruleId,100);
    if (!/^[0-9a-f-]{30,40}$/i.test(ruleId)) throw appointmentError('Invalid recurring schedule.');
    return {action,ruleId};
  }
  if (action === 'deleteSlot') {
    const slotId = clean(input.slotId,100);
    if (!/^[0-9a-f-]{30,40}$/i.test(slotId)) throw appointmentError('Invalid slot.');
    return {action,slotId};
  }
  throw appointmentError('Unknown appointment action.');
}
async function scriptRequest(action, values = {}) {
  const url = getEnv('APPOINTMENTS_SCRIPT_URL');
  const secret = getEnv('APPOINTMENTS_SCRIPT_SECRET');
  if (!url || !secret) throw appointmentError('Appointment service needs the Apps Script URL and secret configured.','not_configured',503);
  const target = new URL(url);
  if (target.protocol !== 'https:' || target.hostname !== 'script.google.com' || !/^\/macros\/s\/.+\/exec$/.test(target.pathname)) {
    throw appointmentError('Invalid Apps Script configuration.','not_configured',503);
  }
  const response = await fetch(target.toString(),{
    method:'POST',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({action,...values,secret}),
    redirect:'follow',
    signal:AbortSignal.timeout(25000)
  });
  if (!response.ok) throw appointmentError('Appointment spreadsheet service is unavailable.','upstream_error',502);
  const text = await response.text();
  let data;
  try { data = JSON.parse(text); } catch {
    throw appointmentError('The Apps Script deployment did not return JSON. Check access permissions and deployment URL.','upstream_error',502);
  }
  if (data?.ok !== true) {
    const code = clean(data?.code,60) || 'upstream_error';
    const status = code === 'slot_unavailable' || code === 'overlap' || code === 'booked' || code === 'booking_limit' ? 409
      : code === 'unauthorized' ? 502 : code === 'server_error' || code === 'invalid_sheet' ? 502 : 400;
    throw appointmentError(clean(data?.error,240) || 'Appointment request failed.',code,status);
  }
  return data;
}
export default async function appointmentHandler(req,res) {
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  if (!['GET','POST'].includes(req.method)) {
    res.setHeader('Allow','GET, POST');
    return res.status(405).json({ok:false,error:'Method not allowed.'});
  }
  try {
    if (req.method === 'GET') {
      const view = String(req.query?.view || 'public');
      if (view !== 'public' && view !== 'admin') throw appointmentError('Invalid appointment view.');
      if (view === 'admin') await assertAdmin(req);
      const result = await scriptRequest(view === 'admin' ? 'adminList' : 'list');
      return res.status(200).json(result);
    }
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    if (raw.length > MAX_BODY_CHARS) throw appointmentError('Your request is too large.');
    let body;
    try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); }
    catch { throw appointmentError('Invalid JSON request.'); }
    const action = clean(body.action,30);
    if (action !== 'book') await assertAdmin(req);
    const payload = validateAppointmentAction(action,body);
    if (action === 'addSlot' || action === 'addRecurringRule' || action === 'saveWeeklySchedule') {
      if (!payload.meetingUrl) {
        const defaultMeeting = getEnv('APPOINTMENTS_DEFAULT_MEETING_URL');
        if (defaultMeeting && /^https:\/\/[^\s]+$/i.test(defaultMeeting)) payload.meetingUrl = defaultMeeting;
      }
    }
    const result = await scriptRequest(action,payload);
    return res.status(200).json(result);
  } catch(error) {
    const status = Number(error?.statusCode) || 502;
    if (status >= 500) console.error('Appointment API error:',error);
    return res.status(status).json({ok:false,code:error?.code || 'server_error',
      error:status >= 500 && !['not_configured','upstream_error'].includes(error?.code)
        ? 'Appointment service is temporarily unavailable.' : String(error?.message || 'Could not process request.')});
  }
}
