# Falowen free appointment booking (Google Sheets + Apps Script)

## What is included

- Admin scheduling: `https://admin.falowen.app/appointments`. Owner selects reusable weekly afternoon availability (default UI selection: Monday–Friday, 14:00/15:00/16:00 GMT, 30-minute appointments) or one-off slots. Weekly rules fill an eight-week window and replenish daily. Booked slots remain protected. Meeting links may be overridden for individual slots.
- Public booking: `https://admin.falowen.app/book-appointment`. Share this reusable link by email or WhatsApp. Visitors see only future free slots, enter name/email/optional phone and note, then confirm.
- Google Sheets is the canonical record. Apps Script uses `LockService` before booking to prevent two visitors getting the same slot, and hides the meeting link until booking.
- `MailApp` sends confirmations and optional admin notifications; one 15-minute time trigger checks reminders and one lightweight daily trigger replenishes recurring availability.
- No new paid booking SaaS, Firestore polling, paid calendar API, cron on Vercel, or recurring frontend refresh loop. Uses normal Vercel API requests plus free Apps Script/Sheets quotas.

## First-time setup (necessary before URLs are functional)

1. Create **one Google Sheet** named `Falowen Appointments` in the Google account that should send reminder emails. Keep its sharing permissions private.
2. In that sheet open **Extensions → Apps Script**. Put the contents of [appointment-booking.gs](../apps-script/appointment-booking.gs) in `Code.gs`; save. Do **not** mix this file with another `doPost` web app. In Project settings set time zone to **(GMT+00:00) Africa/Accra**.
3. In **Project settings → Script properties**, set:
   - `APPOINTMENT_SYNC_SECRET` = a newly generated, long random secret (at least 32 characters).
   - `APPOINTMENT_ADMIN_EMAIL` = the Falowen email that should receive new booking notices (optional).
4. Click **Deploy → New deployment → Web app**, choose **Execute as: Me** and **Who has access: Anyone**, authorize and copy the `https://script.google.com/macros/s/.../exec` URL. Its write actions are protected by the secret, which is never delivered to the browser. Do not share the script URL.
5. Configure the **attendance Vercel project** (which serves admin.falowen.app), under server environment variables, with:
   - `APPOINTMENTS_SCRIPT_URL` = the `/exec` URL.
   - `APPOINTMENTS_SCRIPT_SECRET` = the **same** random secret in Script properties.
   - `APPOINTMENTS_DEFAULT_MEETING_URL` = the reusable HTTPS Zoom join link; server-only, injected on creation of slots/rules when the link field is blank. The link is sent to a visitor only after booking.
   - `FIREBASE_API_KEY` or the existing `VITE_FIREBASE_API_KEY`, for server verification of admin Firebase ID tokens (already used by other Falowen admin APIs).
   - `FALOWEN_ADMIN_EMAILS` or existing `ADMIN_EMAILS` for admin allowlisting. The appointment API uses the same configured allowlist as the Integration Hub.
   
   Keep both appointment secrets server-side. **Never** prefix these secrets with `VITE_`.
6. In the Apps Script editor, manually run `installAppointmentReminderTrigger()` **once** and grant the requested Google permissions. The script installs two triggers: reminders every 15 minutes, and recurrence replenishment daily. Running it again replaces these triggers rather than creating duplicates.
7. Deploy Falowen admin. Open `/appointments`, add a slot at least 30 minutes in the future, and use `/book-appointment` in a private browser to book it. Verify **AppointmentSlots** contains a `booked` row and **AppointmentBookings** has exactly one `confirmed` row; refresh the public page and confirm the slot is gone. Verify confirmation email delivery. Only after the time trigger is installed will reminders be automatic.


## Updating an existing deployed Apps Script (required for recurrence)

The current Vercel interface alone cannot enable recurring rules if your Google Sheet still runs the original version of `Code.gs`. Update the *existing* spreadsheet-bound Apps Script:

1. Open **Falowen Appointments** Google Sheet → **Extensions → Apps Script**.
2. Replace the complete contents of `Code.gs` with the latest [appointment-booking.gs](../apps-script/appointment-booking.gs) from this repository and save.
3. Open **Deploy → Manage deployments** → select your existing Web app → **Edit (pencil)** → choose **New version** → **Deploy**. This updates the existing `/exec` deployment without changing the URL. Merely saving the script editor code does **not** update the deployed version.
4. Select and run `installAppointmentReminderTrigger()` one time to install both scheduled triggers. Keep your existing `APPOINTMENT_SYNC_SECRET` Script Property unchanged.
5. Open the Falowen admin planner, choose the weekdays and afternoon times you want, then click **Save recurring availability**. Nothing is published until you click Save. The `AppointmentRules` tab is created automatically; the existing `AppointmentSlots` sheet receives an additional `originRuleId` column automatically and its old bookings are kept. No manual Sheet column changes are needed.

### Recurrence behavior

- Selected weekdays/times repeat weekly in Accra GMT. The script generates slots for the next **56 days** initially and adds newly needed dates daily using the Script trigger. It does not call Vercel repeatedly.
- An existing overlapping slot (one-off, recurring, or booked) is never duplicated. A manually deleted recurring occurrence stays removed for that date.
- **Stop repeating** disables the schedule and removes only future open occurrences from that rule. Already confirmed bookings remain and their reminders continue.
- The Vercel server attaches the saved default Zoom join URL (with its password embedded) to slots/rules when an override isn't supplied. The public availability endpoint never returns the Zoom URL. Confirmation/reminder email includes it.
- The initial UI selections are suggestions only: **Monday to Friday**, **2 PM, 3 PM, and 4 PM**, each **30 minutes**. Adjust freely before saving.
- These recurring times do **not** check your Zoom or Google Calendar for conflicts, and they are not a claim that you're free at every suggested time. Publish only days you can keep consistently.

## Troubleshooting and behavior

- The API returns a clear `503` configuration error until the script URL/secret are configured, rather than pretending a booking succeeded.
- The Apps Script deployment must be published to **Anyone** because the application server calls it without a Google interactive session. Access control is enforced by a private secret and by Falowen Firebase admin authentication for schedule management.
- The public endpoint exposes only date, time, duration and topic. Name, email and phone are available only to the admin route. Meeting links are provided after confirmation, not in public availability data.
- The sheet uses plain-text cells for timestamps and visitor data to avoid spreadsheet formula injection and automatic date conversion. Keep the exact first-row headers if editing sheets manually.
- All appointment times are **Africa/Accra (GMT/UTC+00:00)**. This first version does **not** check Google Calendar/Zoom conflicts or automatically create a Google Meet link: only one-off slots and weekly rules explicitly saved in Falowen Admin are offered.
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
