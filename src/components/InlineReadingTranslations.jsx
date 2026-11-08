import React, { useMemo, useState } from "react";
import { getReadingPhraseTranslations, segmentReadingPhrases } from "../data/readingPhraseTranslations";
import { getPresenterReadingPhraseTranslations } from "../data/presenterReadingPhraseTranslations.js";
import "./InlineReadingTranslations.css";

/**
 * Readings in teaching slides are different from student workbook texts.
 * When an assignment ID is given, use its verified presenter-only vocabulary.
 * This component never translates answers or makes external requests.
 */
export default function InlineReadingTranslations({ text = "", level = "", day = 0, assignmentId = "" }) {
  const scope = String(level).toUpperCase() + ":" + String(day) + ":" + String(assignmentId) + ":" + String(text);
  const [selection, setSelection] = useState({ scope: "", index: -1 });
  const entries = useMemo(
    () => assignmentId
      ? getPresenterReadingPhraseTranslations(assignmentId)
      : getReadingPhraseTranslations(level, day),
    [level, day, assignmentId],
  );
  const segments = useMemo(
    () => segmentReadingPhrases(text, entries, ["B2", "C1", "C2"].includes(String(level).toUpperCase()) ? 1 : 9),
    [text, entries],
  );
  const activeIndex = selection.scope === scope ? selection.index : -1;

  return (
    <span data-reading-inline-translations={String(level).toUpperCase()} style={{ whiteSpace: "pre-line" }}>
      {segments.map((segment, index) => {
        if (!segment.en) return <React.Fragment key={index}>{segment.text}</React.Fragment>;
        const open = activeIndex === index;
        return (
          <span key={index} style={{ display: "inline", position: "relative" }}>
            <button
              type="button"
              className="reading-glossary-trigger"
              data-reading-glossary-phrase={segment.de}
              aria-label={`Show English meaning of ${segment.de}`}
              aria-expanded={open}
              onClick={() => setSelection({ scope, index: open ? -1 : index })}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setSelection({ scope, index: -1 });
                  event.stopPropagation();
                }
              }}
              style={{
                background: "transparent",
                border: 0,
                padding: 0,
                margin: 0,
                font: "inherit",
                verticalAlign: "baseline",
                display: "inline",
                cursor: "pointer",
                color: "#075985",
                textDecoration: "underline",
                textDecorationStyle: "dotted",
                textUnderlineOffset: "3px",
                fontWeight: 650,
                borderRadius: 3,
              }}
            >
              {segment.text}
            </button>
            {open ? (
              <span
                role="status"
                lang="en"
                data-reading-meaning="true"
                style={{
                  position: "absolute",
                  top: "calc(100% + 7px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 40,
                  display: "block",
                  width: "max-content",
                  maxWidth: "min(280px, 75vw)",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #bae6fd",
                  background: "#f0f9ff",
                  boxShadow: "0 6px 20px rgba(15,23,42,.18)",
                  color: "#0c4a6e",
                  fontSize: 14,
                  lineHeight: 1.4,
                  whiteSpace: "normal",
                  textAlign: "left",
                  fontWeight: 400,
                }}
              >
                <strong style={{ display: "block", marginBottom: 3, color: "#075985" }}>{segment.de}</strong>
                {segment.en}
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}
