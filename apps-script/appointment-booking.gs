/**
 * Falowen appointment booking — Google Sheets + free Apps Script trigger.
 *
 * Install: create a spreadsheet, open Extensions > Apps Script, paste this file
 * into Code.gs, and set Script Properties APPOINTMENT_SYNC_SECRET (long random
 * secret, identical to the server's APPOINTMENTS_SCRIPT_SECRET).
 * Optional: APPOINTMENT_ADMIN_EMAIL for administrator booking notices.
 * Deploy as a Web app, Execute as: Me, Who has access: Anyone.
 * Put the /exec URL in the Vercel server secret APPOINTMENTS_SCRIPT_URL.
 * Run installAppointmentReminderTrigger() ONCE from the script editor to
 * authorize MailApp, install the 15-minute reminder trigger and daily
 * recurring-slot replenishment trigger.
 *
 * IMPORTANT: Never place APPOINTMENT_SYNC_SECRET in client-side VITE_* vars.
 * All access is through /api/appointments with server-held credentials.
 *
 * Appointments are fixed to Africa/Accra (UTC+00:00, no daylight savings).
 */
const APPT_TIME_ZONE = 'Africa/Accra';
const SLOT_HEADERS = ['slotId','date','time','durationMinutes','topic','meetingUrl','status','bookingId','createdAt','originRuleId'];
const RULE_HEADERS = ['ruleId','weekdays','times','durationMinutes','topic','meetingUrl','status','createdAt'];
const RECURRING_HORIZON_DAYS = 56;
const BOOKING_HEADERS = ['bookingId','slotId','date','time','durationMinutes','topic','meetingUrl','name','email','phone','notes','status','createdAt','confirmationSentAt','reminder24SentAt','reminder1SentAt'];
const ALLOWED_DURATIONS = [15, 30, 45, 60, 90, 120];

function appointmentText_(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max || 500);
}
function appointmentError_(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}
function appointmentJson_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function appointmentReadPayload_(e) {
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  if (raw.length > 10000) appointmentError_('invalid_request','Request is too large.');
  return JSON.parse(raw);
}
function appointmentAuthorize_(payload) {
  const expected = PropertiesService.getScriptProperties().getProperty('APPOINTMENT_SYNC_SECRET');
  if (!expected || !payload || String(payload.secret || '') !== expected) {
    appointmentError_('unauthorized', 'Appointment integration not configured or invalid secret.');
  }
}
function appointmentSheet_(name, headers) {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  if (!book) appointmentError_('not_configured','Attach this script to its appointment spreadsheet.');
  const sheet = book.getSheetByName(name) || book.insertSheet(name);
  if (!sheet.getLastRow()) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  } else {
    const actual = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
    // Safe upgrade for existing AppointmentSlots sheets from the first version.
    if (name === 'AppointmentSlots' && actual[9] === '' &&
        SLOT_HEADERS.slice(0,9).every((key,i) => actual[i] === key)) {
      sheet.getRange(1,10).setValue('originRuleId');
      actual[9] = 'originRuleId';
    }
    if (headers.some((header, i) => actual[i] !== header)) {
      appointmentError_('invalid_sheet', name + ' header mismatch. Do not reorder columns.');
    }
  }
  return sheet;
}
function appointmentRows_(sheet, headers) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, headers.length).getDisplayValues().map((cells, index) => {
    const row = { rowNumber: index + 2 };
    headers.forEach((key, i) => { row[key] = cells[i]; });
    return row;
  });
}
function appointmentAppend_(sheet, values) {
  const row = sheet.getLastRow() + 1;
  // Force plain text, avoiding automatic date parsing and spreadsheet formulas.
  const safeValues = values.map(value => {
    const text = appointmentText_(value, 1000);
    return /^[=+\-@]/.test(text) ? "'" + text : text;
  });
  const range = sheet.getRange(row, 1, 1, values.length);
  range.setNumberFormat('@');
  range.setValues([safeValues]);
  return row;
}
function appointmentStart_(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    appointmentError_('invalid_time','Use a valid date and 24-hour time.');
  }
  const start = new Date(date + 'T' + time + ':00Z');
  if (Number.isNaN(start.getTime()) ||
      Utilities.formatDate(start, 'Etc/GMT', 'yyyy-MM-dd') !== date ||
      Utilities.formatDate(start, 'Etc/GMT', 'HH:mm') !== time) {
    appointmentError_('invalid_time','Invalid appointment date or time.');
  }
  return start;
}
function appointmentSlotPublic_(slot) {
  return {
    slotId: slot.slotId, date: slot.date, time: slot.time,
    durationMinutes: Number(slot.durationMinutes), topic: slot.topic,
    timezone: APPT_TIME_ZONE
  };
}
function appointmentList_(admin) {
  const slots = appointmentRows_(appointmentSheet_('AppointmentSlots', SLOT_HEADERS), SLOT_HEADERS);
  const bookings = admin ? appointmentRows_(appointmentSheet_('AppointmentBookings', BOOKING_HEADERS), BOOKING_HEADERS) : [];
  const bookingById = {};
  bookings.forEach(b => { bookingById[b.bookingId] = b; });
  const now = Date.now();
  const items = slots.filter(slot => {
    const start = appointmentStart_(slot.date, slot.time).getTime();
    return admin ? start >= now - 24 * 3600000 : (slot.status === 'open' && start > now + 15 * 60000);
  }).sort((a,b) => appointmentStart_(a.date,a.time) - appointmentStart_(b.date,b.time));
  const filtered = items.slice(0, 300);
  if (!admin) return { ok:true, timezone:APPT_TIME_ZONE, slots:filtered.map(appointmentSlotPublic_) };
  return {
    ok:true, timezone:APPT_TIME_ZONE,
    rules: appointmentRows_(appointmentSheet_('AppointmentRules',RULE_HEADERS),RULE_HEADERS).map(rule => ({
      ruleId:rule.ruleId,weekdays:rule.weekdays.split(',').map(Number),times:rule.times.split(','),
      durationMinutes:Number(rule.durationMinutes),topic:rule.topic,status:rule.status,createdAt:rule.createdAt
    })),
    slots:filtered.map(slot => ({
      ...appointmentSlotPublic_(slot), status:slot.status,originRuleId:slot.originRuleId,
      meetingUrl:slot.meetingUrl, booked:bookingById[slot.bookingId] ? {
        bookingId:slot.bookingId, name:bookingById[slot.bookingId].name,
        email:bookingById[slot.bookingId].email, phone:bookingById[slot.bookingId].phone,
        notes:bookingById[slot.bookingId].notes
      } : null
    }))
  };
}
function appointmentWithLock_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) appointmentError_('busy','The booking system is busy. Please retry.');
  try { return fn(); } finally { lock.releaseLock(); }
}
function appointmentAddSlot_(payload) {
  const date = appointmentText_(payload.date, 10);
  const time = appointmentText_(payload.time, 5);
  const duration = Number(payload.durationMinutes);
  const topic = appointmentText_(payload.topic, 120) || 'Falowen appointment';
  const meetingUrl = appointmentText_(payload.meetingUrl, 400);
  if (!ALLOWED_DURATIONS.includes(duration)) appointmentError_('invalid_duration','Choose a supported appointment duration.');
  if (meetingUrl && !/^https:\/\/[^\s]+$/i.test(meetingUrl)) {
    appointmentError_('invalid_link','Meeting links must use HTTPS.');
  }
  const start = appointmentStart_(date,time).getTime();
  if (start < Date.now() + 30 * 60000 || start > Date.now() + 180 * 86400000) {
    appointmentError_('invalid_time','Availability must be between 30 minutes and 180 days from now.');
  }
  return appointmentWithLock_(() => {
    const sheet = appointmentSheet_('AppointmentSlots', SLOT_HEADERS);
    const overlapping = appointmentRows_(sheet,SLOT_HEADERS).some(slot => {
      if (slot.status === 'deleted') return false;
      const existing = appointmentStart_(slot.date,slot.time).getTime();
      const existingEnd = existing + Number(slot.durationMinutes) * 60000;
      return start < existingEnd && start + duration * 60000 > existing;
    });
    if (overlapping) appointmentError_('overlap','This time overlaps an existing slot.');
    const slotId = Utilities.getUuid();
    appointmentAppend_(sheet,[slotId,date,time,duration,topic,meetingUrl,'open','',new Date().toISOString(),'']);
    return {ok:true,slotId};
  });
}

/**
 * One weekly rule lives in AppointmentRules and keeps a rolling 8-week window.
 * Generated availability remains ordinary AppointmentSlots rows, so the
 * existing atomic booking and reminder logic works without change.
 */
function appointmentRuleInput_(payload) {
  const days = Array.isArray(payload.weekdays) ? [...new Set(payload.weekdays.map(Number))].sort() : [];
  const times = Array.isArray(payload.times) ? [...new Set(payload.times.map(x => appointmentText_(x,5)))].sort() : [];
  const duration = Number(payload.durationMinutes);
  const topic = appointmentText_(payload.topic,120) || 'Falowen consultation';
  const meetingUrl = appointmentText_(payload.meetingUrl,400);
  if (!days.length || days.length > 7 || days.some(d => !Number.isInteger(d) || d < 0 || d > 6)) {
    appointmentError_('invalid_days','Choose at least one weekday.');
  }
  if (!times.length || times.length > 6 || times.some(t => !/^([01]\d|2[0-3]):[0-5]\d$/.test(t))) {
    appointmentError_('invalid_times','Choose valid recurring times.');
  }
  if (!ALLOWED_DURATIONS.includes(duration)) appointmentError_('invalid_duration','Choose an allowed duration.');
  if (times.some((t,i) => i > 0 && (Number(t.slice(0,2))*60+Number(t.slice(3,5))) -
      (Number(times[i-1].slice(0,2))*60+Number(times[i-1].slice(3,5))) < duration)) {
    appointmentError_('overlap','Recurring times overlap. Shorten appointments or choose wider times.');
  }
  if (meetingUrl && !/^https:\/\/[^\s]+$/i.test(meetingUrl)) {
    appointmentError_('invalid_link','Meeting links must use HTTPS.');
  }
  return {days,times,duration,topic,meetingUrl};
}
function appointmentGenerateRecurringSlots_() {
  // Caller must hold the script lock. Never regenerate a manually removed occurrence.
  const ruleSheet = appointmentSheet_('AppointmentRules',RULE_HEADERS);
  const rules = appointmentRows_(ruleSheet,RULE_HEADERS).filter(r => r.status === 'active');
  if (!rules.length) return 0;
  const sheet = appointmentSheet_('AppointmentSlots',SLOT_HEADERS);
  const existing = appointmentRows_(sheet,SLOT_HEADERS);
  const newlyAdded = [];
  const today = new Date();
  const startDay = Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate());
  const now = Date.now();
  const createdAt = new Date().toISOString();
  rules.forEach(rule => {
    const days = rule.weekdays.split(',').map(Number);
    const times = rule.times.split(',');
    const duration = Number(rule.durationMinutes);
    if (!ALLOWED_DURATIONS.includes(duration)) return;
    for (let day = 0; day <= RECURRING_HORIZON_DAYS; day++) {
      const dateUtc = new Date(startDay + day*86400000);
      if (!days.includes(dateUtc.getUTCDay())) continue;
      const date = Utilities.formatDate(dateUtc,'Etc/GMT','yyyy-MM-dd');
      times.forEach(time => {
        const start = appointmentStart_(date,time).getTime();
        if (start <= now + 30*60000) return;
        const full = existing.concat(newlyAdded);
        // A deleted occurrence is a one-day exception and must stay deleted.
        const alreadyFromRule = full.some(slot =>
          slot.originRuleId === rule.ruleId && slot.date === date && slot.time === time);
        if (alreadyFromRule) return;
        const overlaps = full.some(slot => {
          if (slot.status === 'deleted') return false;
          const otherStart = appointmentStart_(slot.date,slot.time).getTime();
          return start < otherStart + Number(slot.durationMinutes)*60000 &&
            start + duration*60000 > otherStart;
        });
        if (overlaps) return;
        newlyAdded.push({
          slotId:Utilities.getUuid(),date,time,durationMinutes:duration,
          topic:rule.topic,meetingUrl:rule.meetingUrl,status:'open',
          bookingId:'',createdAt,originRuleId:rule.ruleId
        });
      });
    }
  });
  if (newlyAdded.length) {
    const data = newlyAdded.map(slot => [
      slot.slotId,slot.date,slot.time,slot.durationMinutes,slot.topic,
      slot.meetingUrl,'open','',slot.createdAt,slot.originRuleId
    ].map(value => {
      const v = appointmentText_(value,1000);
      return /^[=+\-@]/.test(v) ? "'" + v : v;
    }));
    const range = sheet.getRange(sheet.getLastRow()+1,1,data.length,SLOT_HEADERS.length);
    range.setNumberFormat('@');
    range.setValues(data);
  }
  return newlyAdded.length;
}
function appointmentAddRecurringRule_(payload) {
  const config = appointmentRuleInput_(payload);
  return appointmentWithLock_(() => {
    const sheet = appointmentSheet_('AppointmentRules',RULE_HEADERS);
    const active = appointmentRows_(sheet,RULE_HEADERS).filter(rule => rule.status === 'active');
    if (active.length >= 10) appointmentError_('rule_limit','Stop an old recurring rule before adding more.');
    const identical = active.some(rule => rule.weekdays === config.days.join(',') &&
      rule.times === config.times.join(',') && Number(rule.durationMinutes) === config.duration);
    if (identical) appointmentError_('duplicate_rule','That recurring schedule is already active.');
    const ruleId = Utilities.getUuid();
    appointmentAppend_(sheet,[
      ruleId,config.days.join(','),config.times.join(','),config.duration,
      config.topic,config.meetingUrl,'active',new Date().toISOString()
    ]);
    const generated = appointmentGenerateRecurringSlots_();
    return {ok:true,ruleId,generated};
  });
}
function appointmentStopRecurringRule_(payload) {
  const ruleId = appointmentText_(payload.ruleId,100);
  return appointmentWithLock_(() => {
    const ruleSheet = appointmentSheet_('AppointmentRules',RULE_HEADERS);
    const rule = appointmentRows_(ruleSheet,RULE_HEADERS).find(x => x.ruleId === ruleId);
    if (!rule) appointmentError_('not_found','Recurring schedule not found.');
    if (rule.status !== 'active') appointmentError_('invalid_rule','Recurring schedule is already stopped.');
    ruleSheet.getRange(rule.rowNumber,7).setValue('stopped');
    const slotSheet = appointmentSheet_('AppointmentSlots',SLOT_HEADERS);
    const slots = appointmentRows_(slotSheet,SLOT_HEADERS);
    let removed = 0;
    // Cancel only open instances; confirmed appointments always remain booked.
    slots.forEach(slot => {
      if (slot.originRuleId !== ruleId || slot.status !== 'open') return;
      slotSheet.getRange(slot.rowNumber,7).setValue('deleted');
      removed++;
    });
    return {ok:true,removed};
  });
}
function refreshAppointmentRecurringSlots() {
  return appointmentWithLock_(() => ({generated:appointmentGenerateRecurringSlots_()}));
}

function appointmentDeleteSlot_(payload) {
  const slotId = appointmentText_(payload.slotId,100);
  return appointmentWithLock_(() => {
    const sheet = appointmentSheet_('AppointmentSlots',SLOT_HEADERS);
    const slot = appointmentRows_(sheet,SLOT_HEADERS).find(x => x.slotId === slotId);
    if (!slot) appointmentError_('not_found','Availability slot was not found.');
    if (slot.status !== 'open') appointmentError_('booked','Booked appointments cannot be deleted here.');
    sheet.getRange(slot.rowNumber,7).setValue('deleted');
    return {ok:true};
  });
}
function appointmentValidEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}
function appointmentEscapeHtml_(value) {
  return String(value || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function appointmentDateLabel_(booking) {
  return booking.date + ' at ' + booking.time + ' GMT (Accra)';
}
function appointmentEmail_(booking, reminderLabel) {
  const label = reminderLabel || 'confirmed';
  const title = label === 'confirmed' ? 'Your Falowen appointment is confirmed'
    : label === '24h' ? 'Reminder: Falowen appointment tomorrow'
    : 'Reminder: Your Falowen appointment is coming up';
  const meeting = booking.meetingUrl ? '\nMeeting link: ' + booking.meetingUrl : '\nFalowen will provide meeting details.';
  const body = 'Hello ' + booking.name + ',\n\n' +
    (label === 'confirmed' ? 'Your appointment is confirmed.' : 'This is a reminder of your confirmed appointment.') +
    '\n\nSubject: ' + booking.topic + '\nDate and time: ' + appointmentDateLabel_(booking) +
    '\nDuration: ' + booking.durationMinutes + ' minutes' + meeting +
    '\n\nIf you need to change your booking, please reply to this email.\n\nFalowen';
  const html = '<p>Hello ' + appointmentEscapeHtml_(booking.name) + ',</p><p>' +
    (label === 'confirmed' ? 'Your appointment is confirmed.' : 'This is a reminder of your confirmed appointment.') +
    '</p><p><b>Subject:</b> ' + appointmentEscapeHtml_(booking.topic) +
    '<br><b>Date and time:</b> ' + appointmentEscapeHtml_(appointmentDateLabel_(booking)) +
    '<br><b>Duration:</b> ' + appointmentEscapeHtml_(booking.durationMinutes) + ' minutes</p>' +
    (booking.meetingUrl ? '<p><a href="' + appointmentEscapeHtml_(booking.meetingUrl) + '">Join meeting</a></p>' : '<p>Falowen will provide meeting details.</p>') +
    '<p>If you need to change your booking, please reply to this email.</p><p>Falowen</p>';
  MailApp.sendEmail({to:booking.email,subject:title,body:body,htmlBody:html,name:'Falowen'});
}
function appointmentBook_(payload) {
  // Hidden bot field; browsers do not display it.
  if (appointmentText_(payload.website,100)) appointmentError_('invalid_request','Invalid booking request.');
  const slotId = appointmentText_(payload.slotId,100);
  const name = appointmentText_(payload.name,120);
  const email = appointmentText_(payload.email,254).toLowerCase();
  const phone = appointmentText_(payload.phone,40);
  const notes = appointmentText_(payload.notes,500);
  if (name.length < 2 || !appointmentValidEmail_(email)) {
    appointmentError_('invalid_contact','Enter your name and a valid email address.');
  }
  const booked = appointmentWithLock_(() => {
    const slotSheet = appointmentSheet_('AppointmentSlots',SLOT_HEADERS);
    const slot = appointmentRows_(slotSheet,SLOT_HEADERS).find(x => x.slotId === slotId);
    if (!slot || slot.status !== 'open' || appointmentStart_(slot.date,slot.time).getTime() < Date.now() + 15*60000) {
      appointmentError_('slot_unavailable','This slot is no longer available. Please choose another time.');
    }
    const bookSheet = appointmentSheet_('AppointmentBookings',BOOKING_HEADERS);
    const existing = appointmentRows_(bookSheet,BOOKING_HEADERS);
    const activeForEmail = existing.filter(b => b.email.toLowerCase() === email &&
      b.status === 'confirmed' && appointmentStart_(b.date,b.time).getTime() > Date.now());
    if (activeForEmail.length >= 3) {
      appointmentError_('booking_limit','You already have three upcoming appointments. Please contact Falowen.');
    }
    const bookingId = Utilities.getUuid();
    const record = {
      bookingId,slotId,date:slot.date,time:slot.time,durationMinutes:slot.durationMinutes,
      topic:slot.topic,meetingUrl:slot.meetingUrl,name,email,phone,notes
    };
    const row = appointmentAppend_(bookSheet,[
      bookingId,slotId,slot.date,slot.time,slot.durationMinutes,slot.topic,slot.meetingUrl,
      name,email,phone,notes,'confirmed',new Date().toISOString(),'','',''
    ]);
    slotSheet.getRange(slot.rowNumber,7,1,2).setValues([['booked',bookingId]]);
    return { record, row };
  });
  let emailSent = false;
  try {
    appointmentEmail_(booked.record,'confirmed');
    appointmentSheet_('AppointmentBookings',BOOKING_HEADERS).getRange(booked.row,14).setValue(new Date().toISOString());
    emailSent = true;
  } catch (error) {
    console.error('Appointment confirmation mail failed',String(error));
  }
  const adminEmail = appointmentText_(PropertiesService.getScriptProperties().getProperty('APPOINTMENT_ADMIN_EMAIL'),254);
  if (appointmentValidEmail_(adminEmail) && adminEmail.toLowerCase() !== email) {
    try {
      MailApp.sendEmail({
        to:adminEmail,subject:'New Falowen appointment — ' + booked.record.date,
        body:'New booking from ' + name + ' (' + email + ', ' + phone + ').\n' +
             'Topic: ' + booked.record.topic + '\nDate: ' + appointmentDateLabel_(booked.record) +
             '\nNotes: ' + notes
      });
    } catch (error) { console.error('Admin appointment mail failed',String(error)); }
  }
  return {ok:true,bookingId:booked.record.bookingId,date:booked.record.date,time:booked.record.time,
    topic:booked.record.topic,timezone:APPT_TIME_ZONE,confirmationEmailSent:emailSent};
}
function doPost(e) {
  try {
    const payload = appointmentReadPayload_(e);
    appointmentAuthorize_(payload);
    const action = appointmentText_(payload.action,30);
    if (action === 'list') return appointmentJson_(appointmentList_(false));
    if (action === 'adminList') return appointmentJson_(appointmentList_(true));
    if (action === 'addSlot') return appointmentJson_(appointmentAddSlot_(payload));
    if (action === 'addRecurringRule') return appointmentJson_(appointmentAddRecurringRule_(payload));
    if (action === 'stopRecurringRule') return appointmentJson_(appointmentStopRecurringRule_(payload));
    if (action === 'deleteSlot') return appointmentJson_(appointmentDeleteSlot_(payload));
    if (action === 'book') return appointmentJson_(appointmentBook_(payload));
    return appointmentJson_({ok:false,code:'invalid_action',error:'Unknown appointment action.'});
  } catch(error) {
    return appointmentJson_({ok:false,code:error.code || 'server_error',error:String(error.message || error)});
  }
}
function sendAppointmentReminders() {
  return appointmentWithLock_(() => {
    const sheet = appointmentSheet_('AppointmentBookings',BOOKING_HEADERS);
    const rows = appointmentRows_(sheet,BOOKING_HEADERS);
    const now = Date.now();
    let sent24 = 0, sent1 = 0, failed = 0;
    rows.forEach(b => {
      if (b.status !== 'confirmed') return;
      const minutesUntil = (appointmentStart_(b.date,b.time).getTime() - now)/60000;
      if (minutesUntil < 0 || minutesUntil > 24*60) return;
      const type = minutesUntil <= 60 ? '1h' : '24h';
      const targetColumn = type === '1h' ? 16 : 15;
      if (type === '1h' && b.reminder1SentAt) return;
      if (type === '24h' && b.reminder24SentAt) return;
      try {
        appointmentEmail_(b,type);
        sheet.getRange(b.rowNumber,targetColumn).setValue(new Date().toISOString());
        if (type === '1h') sent1++; else sent24++;
      } catch(error) {
        failed++; console.error('Appointment reminder failed for ' + b.bookingId, String(error));
      }
    });
    return {sent24,sent1,failed};
  });
}
function installAppointmentReminderTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => ['sendAppointmentReminders','refreshAppointmentRecurringSlots'].includes(trigger.getHandlerFunction()))
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('sendAppointmentReminders').timeBased().everyMinutes(15).create();
  ScriptApp.newTrigger('refreshAppointmentRecurringSlots').timeBased().everyDays(1).atHour(5).create();
  refreshAppointmentRecurringSlots();
  return 'Falowen appointment reminders (15 min) and rolling recurring times (daily) installed.';
}
