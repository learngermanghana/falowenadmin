export function normalizeStudentPracticeItems(items = []) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;

      const prompts = Array.isArray(item.prompts)
        ? item.prompts.map((prompt) => String(prompt || "").trim()).filter(Boolean)
        : [];
      const modelItems = Array.isArray(item.modelItems)
        ? item.modelItems.map((model) => String(model || "").trim()).filter(Boolean)
        : [];
      const instruction = String(item.instruction || item.detail || "").trim();
      const title = String(item.title || `Übung ${index + 1}`).trim();
      const minutes = Number(item.minutes || 0) || 0;

      if (!instruction && prompts.length === 0) return null;

      return {
        ...item,
        title,
        instruction,
        prompts,
        modelItems,
        minutes,
      };
    })
    .filter(Boolean);
}
