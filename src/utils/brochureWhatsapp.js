export const BROCHURE_WHATSAPP_MESSAGE = `Thank you for the call. Here is the brochure for the next class.

To register for a class, visit:

https://www.falowen.app

You can also start learning German for free on our YouTube channel:

https://www.youtube.com/@LLEAGhana

If you have any further questions or need assistance with registration, simply reply to this message.`;

export function normalizeGhanaWhatsappNumber(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("233") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return "";
}

export function buildBrochureWhatsappUrl(phone, message = BROCHURE_WHATSAPP_MESSAGE) {
  const normalizedPhone = normalizeGhanaWhatsappNumber(phone);
  if (!normalizedPhone || !String(message).trim()) return "";
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(String(message).trim())}`;
}
