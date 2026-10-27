export function extendContractDate(value, months) {
  if (![1, 3, 6].includes(months)) throw new Error("Choose a 1, 3 or 6 month extension.");
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error("Set a valid contract end date first.");
  const [, year, month, day] = match.map(Number);
  const original = new Date(Date.UTC(year, month - 1, day));
  if (original.getUTCFullYear() !== year || original.getUTCMonth() !== month - 1 || original.getUTCDate() !== day) throw new Error("Set a valid contract end date first.");
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}
