import { useEffect, useMemo, useState } from "react";
import {
  getUpcomingHolidays,
  importHolidays,
  sendHolidayNoticeNow,
  syncHolidaysToSheet,
  updateHoliday,
} from "../services/holidayCalendarService";
import { listClasses } from "../services/classesService";
import OperationsCommunicationPanel from "../components/OperationsCommunicationPanel";

const currentYear = new Date().getFullYear();

function getAdminNote(holiday) {
  return holiday.adminNote ?? holiday.notes ?? "";
}

function formatNoticeTimestamp(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.toDate === "function") return value.toDate().toLocaleString();
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000).toLocaleString();
  return String(value);
}

function formatNoticeStatus(holiday) {
  const status = holiday.noticeStatus || "not_scheduled";
  if (status === "sent") {
    const count = Number(holiday.noticeRecipientCount);
    return Number.isFinite(count) ? `Sent to ${count} student${count === 1 ? "" : "s"}` : "Sent";
  }
  if (status === "failed") return "Failed";
  if (status === "no_recipients") return "No recipients";
  if (holiday.schoolClosed && holiday.autoSendNotice && status === "scheduled") {
    return "Scheduled for 7:00 AM";
  }
  if (!holiday.schoolClosed) return "Not scheduled — school open";
  return "Not scheduled";
}

export default function HolidayCalendarPage() {
  const [year, setYear] = useState(currentYear);
  const [holidays, setHolidays] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [updatingDate, setUpdatingDate] = useState("");
  const [sendingDate, setSendingDate] = useState("");
  const [classes, setClasses] = useState([]);

  const yearOptions = useMemo(() => [currentYear, currentYear + 1], []);

  async function loadHolidays(selectedYear) {
    setLoading(true);
    try {
      const list = await getUpcomingHolidays({ year: selectedYear, countryCode: "GH" });
      setHolidays(list);
      setStatus(`Loaded ${list.length} upcoming holiday(s) for ${selectedYear}.`);
    } catch (error) {
      setStatus(error.message || "Failed to load holidays.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHolidays(year);
  }, [year]);

  useEffect(() => {
    let cancelled = false;

    listClasses()
      .then((rows) => {
        if (!cancelled) setClasses(Array.isArray(rows) ? rows : []);
      })
      .catch((error) => {
        if (!cancelled) setStatus(error.message || "Failed to load classes.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleImport() {
    setLoading(true);
    try {
      const result = await importHolidays({ year, countryCode: "GH" });
      await loadHolidays(year);
      setStatus(`Import complete for ${year}. Imported: ${result.imported || 0}.`);
    } catch (error) {
      setStatus(error.message || "Import failed.");
      setLoading(false);
    }
  }

  async function handleSyncSheet() {
    setSyncing(true);
    try {
      await syncHolidaysToSheet(year);
      setStatus("Holidays synced to Google Sheet.");
    } catch (error) {
      setStatus(`Google Sheet sync failed: ${error.message || "Unknown error."}`);
    } finally {
      setSyncing(false);
    }
  }

  function buildHolidayUpdate(holiday, fields = {}) {
    const nextHoliday = { ...holiday, ...fields };
    return {
      schoolClosed: Boolean(nextHoliday.schoolClosed),
      adminNote: getAdminNote(nextHoliday),
      studentMessage: nextHoliday.studentMessage || "",
      autoSendNotice: Boolean(nextHoliday.autoSendNotice),
      noticeAudienceType: nextHoliday.noticeAudienceType === "class" ? "class" : "all_active",
      noticeClassName: nextHoliday.noticeAudienceType === "class" ? (nextHoliday.noticeClassName || "") : "",
    };
  }

  async function handleUpdate(date, fields) {
    const holiday = holidays.find((item) => item.date === date);
    if (!holiday) return;

    const payload = buildHolidayUpdate(holiday, fields);
    setUpdatingDate(date);
    try {
      const result = await updateHoliday({ date, countryCode: "GH", ...payload });
      setHolidays((prev) => prev.map((item) => (
        item.date === date
          ? {
            ...item,
            ...payload,
            schoolClosed: typeof result.schoolClosed === "boolean" ? result.schoolClosed : payload.schoolClosed,
            autoSendNotice: typeof result.autoSendNotice === "boolean" ? result.autoSendNotice : payload.autoSendNotice,
            noticeStatus: result.noticeStatus || item.noticeStatus,
          }
          : item
      )));
      setStatus(`Updated holiday for ${date}.`);
    } catch (error) {
      setStatus(error.message || "Update failed.");
    } finally {
      setUpdatingDate("");
    }
  }

  async function handleSendNow(holiday) {
    const payload = buildHolidayUpdate(holiday);
    setSendingDate(holiday.date);
    try {
      const result = await sendHolidayNoticeNow(holiday.date, {
        countryCode: holiday.countryCode || "GH",
        ...payload,
      });
      setHolidays((prev) => prev.map((item) => (
        item.date === holiday.date
          ? {
            ...item,
            noticeStatus: result.noticeStatus || "sent",
            noticeSentAt: result.noticeSentAt ?? null,
            noticeRecipientCount: result.noticeRecipientCount ?? 0,
            noticeAttemptedCount: result.noticeAttemptedCount ?? item.noticeAttemptedCount,
            noticeLastError: result.noticeLastError || "",
          }
          : item
      )));
      if (result.noticeStatus === "no_recipients") {
        setStatus(`No active recipients found for ${holiday.date}; no email was sent.`);
      } else {
        setStatus(`Holiday notice processed for ${holiday.date}. Sent: ${result.noticeRecipientCount || 0}.`);
      }
    } catch (error) {
      setStatus(error.message || "Notice send failed.");
    } finally {
      setSendingDate("");
    }
  }

  function updateLocalHoliday(date, fields) {
    setHolidays((prev) => prev.map((item) => (item.date === date ? { ...item, ...fields } : item)));
  }

  return (
    <div className="page-container holiday-calendar-page">
      <h1>Holiday Calendar (Ghana)</h1>
      <OperationsCommunicationPanel context="holidays" />

      <div className="holiday-calendar-toolbar" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <label htmlFor="holiday-year">Year:</label>
        <select id="holiday-year" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {yearOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <button type="button" onClick={handleImport} disabled={loading}>Import Ghana holidays</button>
        <button type="button" onClick={handleSyncSheet} disabled={loading || syncing}>
          {syncing ? "Syncing..." : "Sync to Holidays Sheet"}
        </button>
      </div>

      {status ? <p>{status}</p> : null}

      <div className="holiday-calendar-table-wrap" style={{ overflowX: "auto" }}>
        <table className="holiday-calendar-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Holiday</th>
              <th>Type</th>
              <th>School Closed</th>
              <th>Action</th>
              <th>Admin Note</th>
              <th>Student Message</th>
              <th>Auto Send Notice</th>
              <th>Send Timing</th>
              <th>Audience</th>
              <th>Manual Send</th>
              <th>Notice Status</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map((holiday) => {
              const adminNote = getAdminNote(holiday);
              const studentMessage = holiday.studentMessage || "";
              const noticeAudienceType = holiday.noticeAudienceType === "class" ? "class" : "all_active";
              const noticeStatus = formatNoticeStatus(holiday);
              return (
                <tr key={`${holiday.countryCode}_${holiday.date}`}>
                  <td>{holiday.date}</td>
                  <td>{holiday.name || holiday.localName}</td>
                  <td>{Array.isArray(holiday.types) ? holiday.types.join(", ") : ""}</td>
                  <td>{holiday.schoolClosed ? "YES" : "NO"}</td>
                  <td>
                    <button
                      type="button"
                      disabled={updatingDate === holiday.date}
                      onClick={() => handleUpdate(holiday.date, {
                        schoolClosed: !holiday.schoolClosed,
                        ...(!holiday.schoolClosed ? {} : { autoSendNotice: false }),
                      })}
                    >
                      Set {holiday.schoolClosed ? "NO" : "YES"}
                    </button>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={adminNote}
                      placeholder="Admin note"
                      onChange={(e) => {
                        const nextAdminNote = e.target.value;
                        updateLocalHoliday(holiday.date, { adminNote: nextAdminNote });
                      }}
                      onBlur={(e) => handleUpdate(holiday.date, { adminNote: e.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={studentMessage}
                      placeholder="Optional student message"
                      onChange={(e) => {
                        const nextStudentMessage = e.target.value;
                        updateLocalHoliday(holiday.date, { studentMessage: nextStudentMessage });
                      }}
                      onBlur={(e) => handleUpdate(holiday.date, { studentMessage: e.target.value })}
                    />
                  </td>
                  <td>
                    <select
                      value={holiday.autoSendNotice ? "YES" : "NO"}
                      disabled={updatingDate === holiday.date || !holiday.schoolClosed}
                      onChange={(e) => handleUpdate(holiday.date, { autoSendNotice: e.target.value === "YES" })}
                    >
                      <option value="NO">NO</option>
                      <option value="YES">YES</option>
                    </select>
                  </td>
                  <td>{holiday.schoolClosed ? "Automatically sends 1 day before holiday at 7:00 AM Ghana time" : "Automatic email is off because school is open."}</td>
                  <td>
                    <select
                      value={noticeAudienceType}
                      disabled={updatingDate === holiday.date}
                      onChange={(e) => handleUpdate(holiday.date, {
                        noticeAudienceType: e.target.value,
                        noticeClassName: e.target.value === "class" ? holiday.noticeClassName : "",
                      })}
                    >
                      <option value="all_active">All active students</option>
                      <option value="class">Selected class only</option>
                    </select>
                    {noticeAudienceType === "class" ? (
                      <select
                        value={holiday.noticeClassName || ""}
                        disabled={updatingDate === holiday.date}
                        onChange={(e) => handleUpdate(holiday.date, { noticeClassName: e.target.value })}
                      >
                        <option value="">Select class</option>
                        {classes.map((klass) => {
                          const className = klass.name || klass.className || klass.classId || klass.id;
                          return className ? <option key={className} value={className}>{className}</option> : null;
                        })}
                      </select>
                    ) : null}
                  </td>
                  <td>
                    <button
                      type="button"
                      disabled={sendingDate === holiday.date || updatingDate === holiday.date}
                      onClick={() => handleSendNow(holiday)}
                    >
                      {sendingDate === holiday.date
                        ? "Sending..."
                        : holiday.schoolClosed
                          ? "Send no-class notice now"
                          : "Send holiday update now"}
                    </button>
                  </td>
                  <td>
                    <div>{noticeStatus}</div>
                    {holiday.noticeStatus === "sent" && typeof holiday.noticeRecipientCount === "number" ? (
                      <div>Delivered: {holiday.noticeRecipientCount}</div>
                    ) : null}
                    {typeof holiday.noticeAttemptedCount === "number" && holiday.noticeAttemptedCount > holiday.noticeRecipientCount ? (
                      <div>Attempted: {holiday.noticeAttemptedCount}</div>
                    ) : null}
                    {holiday.noticeSentAt ? <div>Last sent: {formatNoticeTimestamp(holiday.noticeSentAt)}</div> : null}
                    {holiday.noticeLastError ? <div>Error: {holiday.noticeLastError}</div> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
