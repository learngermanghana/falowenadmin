# Falowen free appointment booking (Google Sheets + Apps Script)

## What is included

- Admin scheduling: `https://admin.falowen.app/appointments`. Owner creates one-off available date/time slots, 15–120 minutes, an appointment subject, and an optional HTTPS meeting link. Booked slots show visitor details and cannot be deleted.
- Public booking: `https://admin.falowen.app/book-appointment`. Share this reusable link by email or WhatsApp. Visitors see only future free slots, enter name/email/optional phone and note, then confirm.
- Google Sheets is the canonical record. Apps Script uses `LockService` before booking to prevent two visitors getting the same slot, and hides the meeting link until booking.
- `MailApp` sends confirmation and optional admin notification; a single free scheduled trigger checks for 24-hour and 1-hour reminders every 15 minutes.
- No new paid booking SaaS, Firestore polling, paid calendar API, cron on Vercel, or recurring frontend refresh loop. Uses normal Vercel API requests plus free Apps Script/Sheets quotas.

## First-time setup (necessary before URLs are functional)

1. Create **one Google Sheet** named `Falowen Appointments` in the Google account that should send reminder emails. Keep its sharing permissions private.
2. In that sheet open **Extensions → Apps Script**. Put the contents of [appointment-booking.gs](../apps-script/appointment-booking.gs) in `Code.gs`; save. Do **not** mix this file with another `doPost` web app. In Project settings set time zone to **(GMT+00:00) Africa/Accra**.
3. In **Project settings → Script properties**, set:
   - `APPOINTMENT_SYNC_SECRET` = a newly generated, long random secret (at least 32 characters).
   - `APPOINTMENT_ADMIN_EMAIL` = the Falowen email that should receive new booking notices (optional).
4. Click **Deploy → New deployment → Web app**, choose **Execute as: Me** and **Who has access: Anyone**, authorize and copy the `https://script.google.com/macros/s/.../exec` URL. Its write actions are protected by the secret, which is never delivered to the browser. Do not share the script URL.
5. Configure the **falowenadmin Vercel project**, under server environment variables, with:
   - `APPOINTMENTS_SCRIPT_URL` = the `/exec` URL.
   - `APPOINTMENTS_SCRIPT_SECRET` = the **same** random secret in Script properties.
   - `FIREBASE_API_KEY` or the existing `VITE_FIREBASE_API_KEY`, for server verification of admin Firebase ID tokens (already used by other Falowen admin APIs).
   - `FALOWEN_ADMIN_EMAILS` or existing `ADMIN_EMAILS` for admin allowlisting. The appointment API uses the same configured allowlist as the Integration Hub.
   
   Keep both appointment secrets server-side. **Never** prefix these secrets with `VITE_`.
6. In the Apps Script editor, manually run `installAppointmentReminderTrigger()` **once** and grant the requested Google permissions. The script installs one 15-minute time-driven trigger. Running it again replaces its own existing trigger rather than creating duplicates.
7. Deploy Falowen admin. Open `/appointments`, add a slot at least 30 minutes in the future, and use `/book-appointment` in a private browser to book it. Verify **AppointmentSlots** contains a `booked` row and **AppointmentBookings** has exactly one `confirmed` row; refresh the public page and confirm the slot is gone. Verify confirmation email delivery. Only after the time trigger is installed will reminders be automatic.

## Troubleshooting and behavior

- The API returns a clear `503` configuration error until the script URL/secret are configured, rather than pretending a booking succeeded.
- The Apps Script deployment must be published to **Anyone** because the application server calls it without a Google interactive session. Access control is enforced by a private secret and by Falowen Firebase admin authentication for schedule management.
- The public endpoint exposes only date, time, duration and topic. Name, email and phone are available only to the admin route. Meeting links are provided after confirmation, not in public availability data.
- The sheet uses plain-text cells for timestamps and visitor data to avoid spreadsheet formula injection and automatic date conversion. Keep the exact first-row headers if editing sheets manually.
- All appointment times are **Africa/Accra (GMT/UTC+00:00)**. This first version does **not** check Google Calendar/Zoom conflicts or automatically create a Google Meet link: only slots entered in Falowen Admin are offered.
- Double-booking and overlapping admin slots are rejected while Apps Script has a script lock. A visitor cannot reserve more than 3 future confirmed appointments with the same email. To reschedule or cancel a booked appointment, contact Falowen; this first version intentionally does not expose public cancellation.
- Short-notice bookings under 24 hours may not receive a full-day reminder. Reminders are scheduled approximately, not at the exact minute, because time-driven triggers run every 15 minutes.
- Mail sends use the Google account owning the Apps Script deployment. Use the account intended to be visible as the sender. Gmail/MailApp daily quotas apply; consumer accounts currently have **100 email recipients per day** (Google's limit may change). Each booking can use up to **four recipient sends** (visitor confirmation, admin notification, two visitor reminders) across multiple days. Check [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas). No paid email vendor is required for low volumes.
- The Google Sheet and Vercel server project already in use are enough for normal small booking volumes, but **zero additional cost** depends on staying inside existing platform free/paid plan quotas. It is not an unlimited free service.

## Suggested smoke test

1. Create a 30-minute slot 2 days ahead.
2. Check public availability, submit a booking, and verify the success reference and email.
3. Open the booking page in a second browser and verify the slot is unavailable (including simultaneous requests).
4. Make an admin-only slot and delete it before it is booked.
5. Check the Apps Script **Executions** tab after the first automatic trigger and inspect `reminder24SentAt` and `reminder1SentAt` in **AppointmentBookings** at the appropriate times.
