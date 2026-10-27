import { useEffect, useMemo, useState } from "react";
import { loadPublishedSheetRows } from "../services/publishedSheetViewerService.js";

const buttonStyle = {
  border: "1px solid #d0d7de",
  borderRadius: 8,
  padding: "8px 12px",
  background: "#fff",
  cursor: "pointer",
};

function compactCell(value = "") {
  const text = String(value || "").trim();
  return text.length > 90 ? `${text.slice(0, 87)}...` : text;
}

export default function PublishedSheetManager({ title, description, publishedUrl, onRemoveRow }) {
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removingRowNumber, setRemovingRowNumber] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

  const visibleHeaders = useMemo(() => headers.slice(0, 8), [headers]);

  async function loadRows() {
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const result = await loadPublishedSheetRows(publishedUrl);
      setHeaders(result.headers);
      setRows(result.rows);
    } catch (error) {
      setHeaders([]);
      setRows([]);
      setMessage({ type: "error", text: error?.message || "Could not load the published sheet table. The embedded sheet below can still be viewed." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, [publishedUrl]);

  async function handleRemove(row) {
    const confirmed = window.confirm(`Remove row ${row.rowNumber} from the Google Sheet? This cannot be undone.`);
    if (!confirmed) return;

    setRemovingRowNumber(row.rowNumber);
    setMessage({ type: "", text: "" });
    try {
      await onRemoveRow(row);
      setRows((current) => current.filter((item) => item.rowNumber !== row.rowNumber));
      setMessage({ type: "success", text: `Row ${row.rowNumber} removed from the sheet.` });
      await loadRows();
    } catch (error) {
      setMessage({ type: "error", text: error?.message || "Failed to remove row from sheet." });
    } finally {
      setRemovingRowNumber(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div>
        <h2 style={{ margin: "0 0 4px" }}>{title}</h2>
        {description ? <p style={{ margin: 0, opacity: 0.78 }}>{description}</p> : null}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={loadRows} disabled={loading} style={buttonStyle}>
          {loading ? "Refreshing..." : "Refresh table"}
        </button>
        <a href={publishedUrl} target="_blank" rel="noreferrer" style={{ ...buttonStyle, textDecoration: "none", color: "inherit" }}>
          Open published sheet
        </a>
      </div>

      {message.text ? (
        <p style={{ margin: 0, color: message.type === "error" ? "#b42318" : "#067647" }}>{message.text}</p>
      ) : null}

      <div style={{ border: "1px solid #d0d7de", borderRadius: 10, overflow: "hidden", background: "#fff" }}>
        <iframe
          src={publishedUrl}
          title={title}
          style={{ width: "100%", minHeight: 420, border: 0 }}
        />
      </div>

      <div style={{ overflowX: "auto", border: "1px solid #d0d7de", borderRadius: 10 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #d0d7de", padding: 8 }}>Sheet row</th>
              {visibleHeaders.map((header) => (
                <th key={header} style={{ textAlign: "left", borderBottom: "1px solid #d0d7de", padding: 8 }}>{header}</th>
              ))}
              <th style={{ textAlign: "left", borderBottom: "1px solid #d0d7de", padding: 8 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={{ borderBottom: "1px solid #edf2f7", padding: 8 }}>{row.rowNumber}</td>
                {visibleHeaders.map((header, index) => (
                  <td key={`${row.id}-${header}`} style={{ borderBottom: "1px solid #edf2f7", padding: 8 }} title={row.cells[index] || ""}>
                    {compactCell(row.cells[index]) || "—"}
                  </td>
                ))}
                <td style={{ borderBottom: "1px solid #edf2f7", padding: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleRemove(row)}
                    disabled={removingRowNumber === row.rowNumber}
                    style={{ ...buttonStyle, borderColor: "#f3b4b4", color: "#b42318" }}
                  >
                    {removingRowNumber === row.rowNumber ? "Removing..." : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={visibleHeaders.length + 2} style={{ padding: 12, opacity: 0.75 }}>
                  {loading ? "Loading sheet rows..." : "No rows loaded from the published CSV view."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
