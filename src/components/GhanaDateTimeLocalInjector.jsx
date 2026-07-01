import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const GHANA_TIMEZONE = "Africa/Accra";
const TARGET_SELECTOR = 'input[type="datetime-local"]';
const ADJUSTED_ATTRIBUTE = "data-falowen-ghana-time-adjusted";
const NOTICE_ATTRIBUTE = "data-falowen-ghana-time-notice";

function formatParts(value, timeZone = GHANA_TIMEZONE) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

export function toGhanaDateTimeLocal(localValue) {
  const value = String(localValue || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  const ghana = formatParts(parsed, GHANA_TIMEZONE);
  return ghana ? `${ghana.date}T${ghana.time}` : value;
}

function setReactInputValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  if (setter) setter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function isRescheduleInput(input) {
  const form = input.closest("form");
  const text = String(form?.textContent || "").toLowerCase();
  return text.includes("update session once") && text.includes("new selected date and time");
}

function addGhanaTimeNotice(input) {
  const label = input.closest("label");
  if (!label || label.querySelector(`[${NOTICE_ATTRIBUTE}]`)) return;
  const notice = document.createElement("small");
  notice.setAttribute(NOTICE_ATTRIBUTE, "true");
  notice.textContent = "Enter the new date and time in Ghana time (Africa/Accra).";
  Object.assign(notice.style, {
    display: "block",
    marginTop: "4px",
    color: "#1e40af",
    fontWeight: "700",
  });
  label.appendChild(notice);
}

export function applyGhanaDateTimeInputs(root = document) {
  if (!root?.querySelectorAll || typeof window === "undefined") return 0;
  let adjusted = 0;

  root.querySelectorAll(TARGET_SELECTOR).forEach((input) => {
    if (!isRescheduleInput(input)) return;
    addGhanaTimeNotice(input);
    if (input.hasAttribute(ADJUSTED_ATTRIBUTE)) return;

    input.setAttribute(ADJUSTED_ATTRIBUTE, "true");
    const ghanaValue = toGhanaDateTimeLocal(input.value);
    if (ghanaValue && ghanaValue !== input.value) {
      setReactInputValue(input, ghanaValue);
      adjusted += 1;
    }
  });

  return adjusted;
}

export default function GhanaDateTimeLocalInjector() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/live-classes") return undefined;
    applyGhanaDateTimeInputs(document);

    const observer = new MutationObserver(() => applyGhanaDateTimeInputs(document));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [location.pathname]);

  return null;
}
