import test from "node:test";
import assert from "node:assert/strict";
import {
  csvToObjects,
  dedupeStudentLeads,
  extractSheetGidFromPublishedHtml,
  fetchStudentLeads,
  normalizeStudentLeadRows,
  publishedHtmlTablesToObjects,
  publishedSheetCsvCandidates,
  publishedSheetHtmlCandidates,
  publishedSheetToCsvUrl,
} from "../src/services/studentLeadService.js";

test("published sheet URL starts with the safer pub CSV endpoint for Leads", () => {
  assert.equal(
    publishedSheetToCsvUrl("https://docs.google.com/spreadsheets/d/e/abc123/pubhtml"),
    "https://docs.google.com/spreadsheets/d/e/abc123/pub?output=csv&sheet=Leads",
  );
});

test("published sheet URL candidates include gid fallback before named sheet URLs", () => {
  assert.deepEqual(
    publishedSheetCsvCandidates("https://docs.google.com/spreadsheets/d/e/abc123/pubhtml", "Leads", "987654321"),
    [
      "https://docs.google.com/spreadsheets/d/e/abc123/pub?gid=987654321&single=true&output=csv",
      "https://docs.google.com/spreadsheets/d/e/abc123/pub?output=csv&sheet=Leads",
      "https://docs.google.com/spreadsheets/d/e/abc123/gviz/tq?tqx=out:csv&sheet=Leads",
      "https://docs.google.com/spreadsheets/d/e/abc123/pub?output=csv",
    ],
  );
});


test("published sheet HTML candidates include gid-specific published table fallback", () => {
  assert.deepEqual(
    publishedSheetHtmlCandidates("https://docs.google.com/spreadsheets/d/e/abc123/pubhtml", "Leads", "987654321"),
    [
      "https://docs.google.com/spreadsheets/d/e/abc123/pubhtml?gid=987654321&single=true",
      "https://docs.google.com/spreadsheets/d/e/abc123/pubhtml?sheet=Leads&single=true",
      "https://docs.google.com/spreadsheets/d/e/abc123/pubhtml",
    ],
  );
});

test("published HTML parser extracts lead table rows", () => {
  const html = `
    <html><body><table>
      <tr><th>Name</th><th>Email</th><th>Phone</th><th>Level</th></tr>
      <tr><td>Ama &amp; Kojo</td><td>ama@example.com</td><td>0241111111</td><td>a1</td></tr>
    </table></body></html>
  `;

  assert.deepEqual(publishedHtmlTablesToObjects(html), [[{
    name: "Ama & Kojo",
    email: "ama@example.com",
    phone: "0241111111",
    level: "a1",
  }]]);
});

test("fetchStudentLeads falls back to published HTML table when CSV endpoints return student directory data", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).endsWith("/pubhtml")) {
      return {
        ok: true,
        text: async () => '<a href="?gid=777&single=true">Leads</a>',
      };
    }
    if (String(url).includes("output=csv") || String(url).includes("tqx=out:csv")) {
      return {
        ok: true,
        text: async () => "student code,class name,name,email,phone,level\nS1,A1 Existing,Existing,old@example.com,0240000000,A1",
      };
    }
    if (String(url).includes("pubhtml?gid=777")) {
      return {
        ok: true,
        text: async () => `
          <table>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Level</th></tr>
            <tr><td>New Lead</td><td>lead@example.com</td><td>0241111111</td><td>A2</td></tr>
          </table>
        `,
      };
    }
    return { ok: false, text: async () => "" };
  };

  try {
    const result = await fetchStudentLeads("https://docs.google.com/spreadsheets/d/e/abc123/pubhtml");
    assert.deepEqual(result.leads, [{
      id: "lead@example.com",
      name: "New Lead",
      email: "lead@example.com",
      number: "0241111111",
      level: "A2",
    }]);
    assert.equal(result.sourceUrl, "https://docs.google.com/spreadsheets/d/e/abc123/pubhtml?gid=777&single=true");
    assert.ok(calls.some((url) => url.includes("output=csv")));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("extracts Leads gid from published html tab markup", () => {
  const html = '<a href="/spreadsheets/d/e/abc/pubhtml?gid=12345&single=true">Leads</a><a href="?gid=999">Students</a>';
  assert.equal(extractSheetGidFromPublishedHtml(html, "Leads"), "12345");
});

test("CSV parser keeps quoted commas and maps lead headers", () => {
  const rows = csvToObjects('name,email,phone,level\n"Asadu, Felix",felix@example.com,0244000000,A1');
  assert.deepEqual(rows, [{ name: "Asadu, Felix", email: "felix@example.com", phone: "0244000000", level: "A1" }]);
});

test("student leads only expose name email number and level", () => {
  const result = normalizeStudentLeadRows([
    { name: "Ama Boat", email: "ama@example.com", phone: "0241111111", level: "a2", class_name: "Hidden class" },
  ]);

  assert.deepEqual(result.leads, [{
    id: "ama@example.com",
    name: "Ama Boat",
    email: "ama@example.com",
    number: "0241111111",
    level: "A2",
  }]);
});

test("duplicate leads are hidden by email first, then phone, then name and level", () => {
  const result = dedupeStudentLeads([
    { name: "Ama", email: "AMA@EXAMPLE.COM", number: "0241111111", level: "A1" },
    { name: "Ama Other", email: "ama@example.com", number: "0242222222", level: "A2" },
    { name: "Kojo", email: "", number: "0243333333", level: "B1" },
    { name: "Kojo Alt", email: "", number: "+233243333333", level: "B1" },
    { name: "No Contact", email: "", number: "", level: "C1" },
    { name: " no   contact ", email: "", number: "", level: "c1" },
  ]);

  assert.equal(result.duplicateCount, 3);
  assert.equal(result.leads.length, 3);
  assert.deepEqual(result.leads.map((lead) => lead.name), ["Ama", "Kojo", "No Contact"]);
});
