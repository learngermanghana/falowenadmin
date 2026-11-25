import { loadPublicClassCatalogue } from "../services/publicBrochureClassService.js";

export async function loadUpcomingLeadClasses(today, fetchImpl = fetch) {
  const catalogue = await loadPublicClassCatalogue(fetchImpl);
  const groups = [
    ["german", catalogue.classes],
    ["swahili", Array.isArray(catalogue.swahiliClasses) ? catalogue.swahiliClasses : []],
  ];
  return Object.fromEntries(groups.map(([language, courses]) => {
    const choices = new Map();
    for (const course of courses) {
      if (course?.publicVisible !== true || course.registrationOpen !== true ||
          course.status !== "upcoming" || course.availability === "always" || course.isSelfLearning) continue;
      const id = String(course.id || course.slug || "").trim();
      const title = String(course.title || course.name || "").trim();
      const startDate = String(course.startDate || "");
      if (!id || id.length > 160 || !title || title.length > 200 ||
          !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || startDate < today) continue;
      const price = Number(course.tuitionGhs);
      const tuitionGhs = Number.isFinite(price) && price > 0 && price <= 10000000 ? price : null;
      choices.set(id, { id, title, startDate, tuitionGhs });
    }
    return [language, [...choices.values()].sort((a, b) =>
      a.startDate.localeCompare(b.startDate) || a.title.localeCompare(b.title))];
  }));
}

const dateFormat = new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeZone: "UTC" });
const priceFormat = new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 2, minimumFractionDigits: 0 });

export function leadClassDetails(course) {
  const date = new Date(course.startDate + "T00:00:00Z");
  const start = Number.isNaN(date.getTime()) ? "Start date unavailable" : "Starts " + dateFormat.format(date);
  const price = course.tuitionGhs > 0 ? priceFormat.format(course.tuitionGhs) : "Price not published";
  return start + " · " + price;
}
