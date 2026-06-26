import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase.js";

function normalizeDate(value) {
  const date = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

export async function loadSchoolClosures({ countryCode = "GH" } = {}) {
  const code = String(countryCode || "GH").trim().toUpperCase() || "GH";
  const snapshot = await getDocs(
    query(collection(db, "holidayCalendar"), where("countryCode", "==", code)),
  );

  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((holiday) => holiday.schoolClosed === true && normalizeDate(holiday.date))
    .map((holiday) => ({
      id: holiday.id,
      date: normalizeDate(holiday.date),
      name: String(holiday.name || holiday.localName || "School holiday").trim(),
      schoolClosed: true,
      countryCode: code,
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export async function loadSchoolClosureDates(options = {}) {
  const holidays = await loadSchoolClosures(options);
  return holidays.map((holiday) => holiday.date);
}
