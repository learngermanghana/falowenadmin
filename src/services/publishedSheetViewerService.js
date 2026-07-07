const SHEET_TIMEOUT_MS = 10000;

export function toPublishedCsvUrl(pubHtmlUrl = "") {
  const urlText = String(pubHtmlUrl || "").trim();
  if (!urlText) return "";
  if (urlText.includes("output=csv")) return urlText;
  if (urlText.includes("/pubhtml")) return urlText.replace("/pubhtml", "/pub?output=csv");
  if (urlText.includes("/pub?")) return `${urlText}${urlText.includes("?") ? "&" : "?"}output=csv`;
  return urlText;
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

function parseCsv(text = "") {
  const rows = [];
  let currentLine = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (inQuotes && text[index + 1] === '"') {
        currentLine += '""';
        index += 1;
      } else {
        inQuotes = !inQuotes;
        currentLine += char;
      }
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      if (currentLine.trim()) rows.push(parseCsvLine(currentLine));
      currentLine = "";
      continue;
    }

    currentLine += char;
  }

  if (currentLine.trim()) rows.push(parseCsvLine(currentLine));
  return rows;
}

function normalizeHeader(value, index) {
  const cleaned = String(value || "").trim();
  return cleaned || `Column ${index + 1}`;
}

export async function loadPublishedSheetRows(pubHtmlUrl = "") {
  const csvUrl = toPublishedCsvUrl(pubHtmlUrl);
  if (!csvUrl) throw new Error("Missing published sheet URL");

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), SHEET_TIMEOUT_MS);

  try {
    const response = await fetch(csvUrl, { signal: controller.signal, cache: "no-store" });
    if (!response.ok) throw new Error(`Published sheet returned ${response.status}`);

    const csv = await response.text();
    const rows = parseCsv(csv);
    if (!rows.length) return { headers: [], rows: [], csvUrl };

    const headers = rows[0].map(normalizeHeader);
    const dataRows = rows.slice(1).map((cells, index) => {
      const values = {};
      headers.forEach((header, columnIndex) => {
        values[header] = String(cells[columnIndex] || "").trim();
      });
      return {
        id: `${index + 2}-${cells.join("|")}`,
        rowNumber: index + 2,
        cells: headers.map((_, columnIndex) => String(cells[columnIndex] || "").trim()),
        values,
      };
    });

    return { headers, rows: dataRows, csvUrl };
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("Published sheet took too long to load.");
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
