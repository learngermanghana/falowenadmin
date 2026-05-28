import { useEffect, useMemo, useState } from "react";
import {
  getUpcomingHolidays,
  importHolidays,
  syncHolidaysToSheet,
  updateHoliday,
} from "../services/holidayCalendarService";

const currentYear = new Date().getFullYear();

function getAdminNote(holiday) {
  return holiday.adminNote ?? holiday.notes ?? "";
}

export default function HolidayCalendarPage() {
  const [year, setYear] = useState(currentYear);
  const [holidays, setHolidays] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [updatingDate, setUpdatingDate] = useState("");

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

  async function handleUpdate(date, fields) {
    setUpdatingDate(date);
    try {
      await updateHoliday({ date, countryCode: "GH", ...fields });
      setHolidays((prev) => prev.map((holiday) => (holiday.date === date ? { ...holiday, ...fields } : holiday)));
      setStatus(`Updated holiday for ${date}.`);
    } catch (error) {
      setStatus(error.message || "Update failed.");
    } finally {
      setUpdatingDate("");
    }
  }

  return (
    <div className="page-container">
      <h1>Holiday Calendar (Ghana)</h1>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
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

      <div style={{ overflowX: "auto" }}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Holiday</th>
              <th>Type</th>
              <th>School Closed</th>
              <th>Action</th>
              <th>Admin Note</th>
              <th>Student Message</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map((holiday) => {
              const adminNote = getAdminNote(holiday);
              const studentMessage = holiday.studentMessage || "";
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
                        adminNote,
                        studentMessage,
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
                        setHolidays((prev) => prev.map((item) => (
                          item.date === holiday.date ? { ...item, adminNote: nextAdminNote } : item
                        )));
                      }}
                      onBlur={(e) => handleUpdate(holiday.date, {
                        schoolClosed: holiday.schoolClosed,
                        adminNote: e.target.value,
                        studentMessage,
                      })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={studentMessage}
                      placeholder="Optional student message"
                      onChange={(e) => {
                        const nextStudentMessage = e.target.value;
                        setHolidays((prev) => prev.map((item) => (
                          item.date === holiday.date ? { ...item, studentMessage: nextStudentMessage } : item
                        )));
                      }}
                      onBlur={(e) => handleUpdate(holiday.date, {
                        schoolClosed: holiday.schoolClosed,
                        adminNote,
                        studentMessage: e.target.value,
                      })}
                    />
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
