import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase.js";
import { getUpcomingHolidays } from "./holidayCalendarService.js";

function normalizeDate(value) {
  const date = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "";
}

function normalizeHoliday(holiday = {}, countryCode = "GH") {
  const date = normalizeDate(holiday.date);
  if (!date || holiday.schoolClosed !== true) return null;
  return {
    id: holiday.id || `${countryCode}_${date}`,
    date,
    name: String(holiday.name || holiday.localName || "School holiday").trim(),
    schoolClosed: true,
    countryCode,
  };
}

function yearRange(startDate = "", endDate = "") {
  const currentYear = new Date().getUTCFullYear();
  const startYear = Number(String(startDate || "").slice(0, 4)) || currentYear;
  const suppliedEndYear = Number(String(endDate || "").slice(0, 4));
  const endYear = Math.max(startYear + 2, suppliedEndYear || startYear);
  return Array.from({ length: Math.min(4, endYear - startYear + 1) }, (_, index) => startYear + index);
}

async function loadFromHolidayApi({ countryCode, startDate, endDate }) {
  const results = [];
  for (const year of yearRange(startDate, endDate)) {
    const holidays = await getUpcomingHolidays({ year, countryCode });
    holidays.forEach((holiday) => results.push(holiday));
  }
  return results;
}

export async function loadSchoolClosures({ countryCode = "GH", startDate = "", endDate = "" } = {}) {
  const code = String(countryCode || "GH").trim().toUpperCase() || "GH";
  let holidays = [];

  try {
    const snapshot = await getDocs(
      query(collection(db, "holidayCalendar"), where("countryCode", "==", code)),
    );
    holidays = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch (firestoreError) {
    try {
      holidays = await loadFromHolidayApi({ countryCode: code, startDate, endDate });
    } catch (apiError) {
      const error = new Error("Could not load the school holiday calendar. The class was not scheduled to avoid creating sessions on closed dates.");
      error.cause = apiError || firestoreError;
      throw error;
    }
  }

  const unique = new Map();
  holidays.forEach((holiday) => {
    const normalized = normalizeHoliday(holiday, code);
    if (normalized) unique.set(normalized.date, normalized);
  });

  return [...unique.values()].sort((left, right) => left.date.localeCompare(right.date));
}

export async function loadSchoolClosureDates(options = {}) {
  const holidays = await loadSchoolClosures(options);
  return holidays.map((holiday) => holiday.date);
}
