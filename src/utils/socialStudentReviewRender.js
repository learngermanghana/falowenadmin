import { STUDENT_REVIEW_FORMATS } from "../data/socialStudentReviews.js";

export function reviewImageFileName(studentName, formatId) {
  const slug = String(studentName || "student")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    .slice(0, 70) || "student";
  const format = STUDENT_REVIEW_FORMATS.some((item) => item.id === formatId) ? formatId : "portrait";
  return `falowen-review-${slug}-${format}.png`;
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function wrapReviewText(ctx, text, maxWidth) {
  const paragraphs = String(text || "").trim().split(/\n/);
  const lines = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) { lines.push(""); continue; }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (!line || ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

export function fitReviewText(ctx, text, width, height, preferredSize = 49) {
  // All lines must fit; never silently crop a student's words.
  for (let size = preferredSize; size >= 24; size -= 1) {
    ctx.font = `500 ${size}px Arial, sans-serif`;
    const lines = wrapReviewText(ctx, text, width);
    const lineHeight = Math.ceil(size * 1.42);
    if (lines.length * lineHeight <= height && lines.every((line) => ctx.measureText(line).width <= width)) {
      return { fits: true, fontSize: size, lineHeight, lines };
    }
  }
  ctx.font = "500 24px Arial, sans-serif";
  return { fits: false, fontSize: 24, lineHeight: 35, lines: wrapReviewText(ctx, text, width) };
}

export function drawStudentReviewPoster(canvas, review, formatId = "portrait") {
  const format = STUDENT_REVIEW_FORMATS.find((item) => item.id === formatId) || STUDENT_REVIEW_FORMATS[0];
  if (!canvas) return { fits: false, format };
  canvas.width = format.width;
  canvas.height = format.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { fits: false, format };

  const { width: w, height: h } = format;
  const tall = h > 1400;
  const square = h === 1080;
  const background = ctx.createLinearGradient(0, 0, w, h);
  background.addColorStop(0, "#071831");
  background.addColorStop(0.55, "#103b79");
  background.addColorStop(1, "#1763ad");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);

  ctx.globalAlpha = 0.15;
  ctx.fillStyle = "#78bfff";
  ctx.beginPath(); ctx.arc(w + 45, 60, 360, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#f8cc60";
  ctx.beginPath(); ctx.arc(-70, h - 80, 255, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Identical Falowen masthead for every reviewer and export ratio.
  roundedRect(ctx, 70, 64, 15, 77, 6);
  ctx.fillStyle = "#f3c969"; ctx.fill();
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 49px Arial, sans-serif";
  ctx.fillText("FALOWEN", 110, 111);
  ctx.font = "bold 17px Arial, sans-serif";
  ctx.fillStyle = "#c3d8ef";
  ctx.fillText("LEARN LANGUAGE EDUCATION ACADEMY", 112, 142);
  ctx.fillStyle = "#f5ce76";
  ctx.font = "bold 19px Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("STUDENT VOICES", w - 70, 103);
  ctx.textAlign = "left";

  const card = { x: 64, y: tall ? 226 : 215, width: w - 128, height: h - (tall ? 405 : 360) };
  ctx.shadowColor = "rgba(0, 11, 33, .24)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 14;
  roundedRect(ctx, card.x, card.y, card.width, card.height, 35);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const innerLeft = card.x + 66;
  const innerRight = card.x + card.width - 66;
  roundedRect(ctx, innerLeft, card.y + 54, 240, 47, 23);
  ctx.fillStyle = "#e9f2ff"; ctx.fill();
  ctx.fillStyle = "#1a4c85";
  ctx.font = "bold 19px Arial, sans-serif";
  ctx.fillText("REAL STUDENT REVIEW", innerLeft + 20, card.y + 85);

  ctx.fillStyle = "#e3ad36";
  ctx.textAlign = "right";
  ctx.font = "bold 39px Arial, sans-serif";
  ctx.fillText("★".repeat(Math.max(1, Math.min(5, Number(review?.rating) || 5))), innerRight, card.y + 89);
  ctx.textAlign = "left";

  ctx.fillStyle = "#bad3f5";
  ctx.font = "bold 115px Georgia, serif";
  ctx.fillText("“", innerLeft - 7, card.y + 201);

  const quoteTop = card.y + 183;
  const separatorY = card.y + card.height - 158;
  const quoteBottom = separatorY - 34;
  const availableHeight = quoteBottom - quoteTop;
  const quote = String(review?.review || "").trim();
  const fitted = fitReviewText(ctx, quote, innerRight - innerLeft, availableHeight, tall ? 61 : square ? 45 : 50);

  ctx.save();
  ctx.beginPath();
  ctx.rect(innerLeft, quoteTop, innerRight - innerLeft, availableHeight);
  ctx.clip();
  ctx.fillStyle = "#193254";
  ctx.font = `500 ${fitted.fontSize}px Arial, sans-serif`;
  ctx.textBaseline = "top";
  const textHeight = fitted.lines.length * fitted.lineHeight;
  let lineY = quoteTop + Math.max(0, (availableHeight - textHeight) / 2);
  for (const line of fitted.lines) {
    ctx.fillText(line, innerLeft, lineY);
    lineY += fitted.lineHeight;
  }
  ctx.restore();
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#dce7f4";
  ctx.fillRect(innerLeft, separatorY, innerRight - innerLeft, 2);
  const studentName = String(review?.studentName || "").trim() || "Falowen student";
  const nameSize = studentName.length > 29 ? 30 : 36;
  ctx.fillStyle = "#0e315e";
  ctx.font = `bold ${nameSize}px Arial, sans-serif`;
  ctx.fillText(studentName, innerLeft, separatorY + 57);
  const source = String(review?.source || "Student feedback").trim();
  const course = String(review?.course || "").trim();
  ctx.font = "22px Arial, sans-serif";
  ctx.fillStyle = "#59738f";
  ctx.fillText([course, source].filter(Boolean).join("  •  "), innerLeft, separatorY + 97);

  ctx.fillStyle = "#f3cb6d";
  ctx.fillRect(70, h - 110, 85, 5);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 29px Arial, sans-serif";
  ctx.fillText("Learn German with confidence.", 70, h - 66);
  ctx.fillStyle = "#d3e9ff";
  ctx.font = "23px Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("www.falowen.app", w - 70, h - 67);
  ctx.textAlign = "left";
  return { fits: fitted.fits, format, textLines: fitted.lines.length, fontSize: fitted.fontSize };
}
