// Legacy submissions use assignment: true as a flag, not as their display title.
export function assignmentTitle(...candidates) {
  return candidates.find(value => typeof value === "string"
    && value.trim() && !/^(true|false)$/i.test(value.trim()))?.trim() || "";
}
