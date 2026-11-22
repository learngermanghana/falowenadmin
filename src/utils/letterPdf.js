// Lightweight, dependency-free A4 PDF writer for editable Admin letter drafts.
// This is intentionally NOT the authoritative enrollment/contract PDF generator.
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const LEFT = 54;
const RIGHT = PAGE_WIDTH - 54;
const BOTTOM = 112;
const BLUE = "0.18 0.33 0.89";
const INK = "0.09 0.14 0.24";
const MUTED = "0.39 0.46 0.56";
const printable = (value) => String(value ?? "").replace(/\r\n?/g, "\n").replace(/₵/g, "GHS ");

const WIN_ANSI = new Map([
  [0x20ac, 128], [0x201a, 130], [0x0192, 131], [0x201e, 132],
  [0x2026, 133], [0x2020, 134], [0x2021, 135], [0x02c6, 136],
  [0x2030, 137], [0x0160, 138], [0x2039, 139], [0x0152, 140],
  [0x017d, 142], [0x2018, 145], [0x2019, 146], [0x201c, 147],
  [0x201d, 148], [0x2022, 149], [0x2013, 150], [0x2014, 151],
  [0x02dc, 152], [0x2122, 153], [0x0161, 154], [0x203a, 155],
  [0x0153, 156], [0x017e, 158], [0x0178, 159],
]);

function pdfLiteral(value) {
  let result = "";
  for (const character of printable(value)) {
    const cp = character.codePointAt(0);
    const byte = cp < 128 || (cp >= 160 && cp <= 255) ? cp : WIN_ANSI.get(cp);
    if (byte == null) { result += "?"; continue; }
    if (byte === 40 || byte === 41 || byte === 92) result += "\\" + String.fromCharCode(byte);
    else if (byte < 32 || byte > 126) result += "\\" + byte.toString(8).padStart(3, "0");
    else result += String.fromCharCode(byte);
  }
  return result;
}

function widthEstimate(text, size) {
  return Array.from(printable(text)).reduce((sum, ch) => {
    if (/\s/.test(ch)) return sum + size * 0.27;
    if (/[ilI!.,:;|']/u.test(ch)) return sum + size * 0.25;
    if (/[mwMW@%]/u.test(ch)) return sum + size * 0.83;
    return sum + size * 0.51;
  }, 0);
}

function wrappedLines(text, size, maxWidth) {
  const words = printable(text).trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (let word of words) {
    if (line && widthEstimate(line + " " + word, size) <= maxWidth) {
      line += " " + word;
      continue;
    }
    if (line) { lines.push(line); line = ""; }
    while (word && widthEstimate(word, size) > maxWidth) {
      let take = 1;
      while (take < word.length && widthEstimate(word.slice(0, take + 1), size) <= maxWidth) take++;
      lines.push(word.slice(0, take));
      word = word.slice(take);
    }
    line = word;
  }
  if (line) lines.push(line);
  return lines;
}

function drawText(commands, x, y, value, size = 11, color = INK, bold = false) {
  commands.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${color} rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${pdfLiteral(value)}) Tj ET`);
}

function buildPages({ heading, body, recipient, reference, signatory, date }) {
  const pages = [];
  let commands = [];
  let y = 0;
  const addPage = (continued) => {
    commands = [];
    pages.push(commands);
    commands.push(`${BLUE} rg 0 836 595.28 5 re f`);
    drawText(commands, LEFT, 789, "Falowen", 25, BLUE, true);
    drawText(commands, LEFT, 769, "LEARN LANGUAGE EDUCATION ACADEMY", 9, MUTED, true);
    commands.push(`${BLUE} RG 1.5 w ${LEFT} 751 m ${RIGHT} 751 l S`);
    drawText(commands, LEFT, 717, continued ? heading + " (continued)" : heading, 17, INK, true);
    if (!continued) {
      drawText(commands, LEFT, 693, "Date: " + date, 9.5, MUTED);
      if (reference) drawText(commands, LEFT, 677, "Reference: " + reference, 9.5, MUTED);
      if (recipient) {
        const lines = wrappedLines("To: " + recipient, 9.5, RIGHT - LEFT);
        let position = reference ? 662 : 677;
        for (const line of lines) { drawText(commands, LEFT, position, line, 9.5, MUTED); position -= 14; }
        y = position - 16;
      } else y = reference ? 642 : 659;
    } else y = 685;
  };
  const ensure = (height) => { if (y - height < BOTTOM) addPage(true); };
  addPage(false);
  for (const paragraph of printable(body).split("\n")) {
    if (!paragraph.trim()) { ensure(10); y -= 10; continue; }
    for (const line of wrappedLines(paragraph, 11.3, RIGHT - LEFT)) {
      ensure(17);
      drawText(commands, LEFT, y, line, 11.3);
      y -= 18;
    }
  }
  ensure(86);
  y -= 37;
  drawText(commands, LEFT, y, signatory, 11, INK, true);
  drawText(commands, LEFT, y - 17, "For Falowen Administration", 9, MUTED);
  pages.forEach((page, index) => {
    page.push(`0.80 0.84 0.90 RG 0.65 w ${LEFT} 80 m ${RIGHT} 80 l S`);
    drawText(page, LEFT, 64, "Falowen · Learn Language Education Academy".replace("·", "-"), 8, MUTED);
    drawText(page, LEFT, 49, "DRAFT - Review and authorise before official use.", 8, MUTED);
    drawText(page, RIGHT - 44, 49, `${index + 1} / ${pages.length}`, 8, MUTED);
  });
  return pages;
}

function assemblePdf(pages) {
  const objects = [null]; // Object ids are 1-based.
  const add = (data) => { objects.push(data); return objects.length - 1; };
  const catalogId = add("");
  const pagesId = add("");
  const regularId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const boldId = add("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const pageIds = [];
  pages.forEach((commands) => {
    const stream = commands.join("\n") + "\n";
    const streamId = add(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
    pageIds.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${regularId} 0 R /F2 ${boldId} 0 R >> >> /Contents ${streamId} 0 R >>`));
  });
  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const startxref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id++) pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;
  return new Blob([pdf], { type: "application/pdf" });
}

export function createLetterPdfBlob({ heading, body, recipient = "", reference = "", signatory = "Falowen Administration", date = "" } = {}) {
  if (!String(heading || "").trim() || !String(body || "").trim()) {
    throw new Error("A heading and document body are required.");
  }
  return assemblePdf(buildPages({ heading, body, recipient, reference, signatory, date }));
}
