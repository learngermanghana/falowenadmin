async function postAppsScript(url, payload, post = fetch) {
  if (!url) {
    throw Object.assign(new Error("The requested integration webhook is not configured on the server."), { statusCode: 503 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await post(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: controller.signal,
    });
    const text = await response.text();
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      throw Object.assign(new Error("The Apps Script webhook returned an invalid response."), { statusCode: 502 });
    }

    if (!response.ok || body?.ok === false) {
      throw Object.assign(
        new Error(body?.error || `The Apps Script webhook failed (${response.status}).`),
        { statusCode: 502, upstreamStatus: response.status },
      );
    }
    return { body, status: response.status };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw Object.assign(new Error("The Apps Script webhook timed out."), { statusCode: 504 });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function verifiedScoreReceipt(body = {}) {
  return body?.ok === true && (
    body.action === "upsertScoreRows"
    || body.mode === "upsert"
    || body.upsert === true
  );
}

async function upsertScoreRows(config, { rows, eventId, requestedBy }, post) {
  const upstream = await postAppsScript(config.url, {
    ...(config.token ? { token: config.token } : {}),
    ...(config.sheetName ? { sheet_name: config.sheetName } : {}),
    ...(config.sheetGid ? { sheet_gid: config.sheetGid } : {}),
    event_id: eventId,
    source: "falowen-admin",
    ...(requestedBy ? { requested_by: requestedBy } : {}),
    action: "upsertScoreRows",
    mode: "upsert",
    dedupe_columns: ["studentcode", "assignment_id"],
    remove_duplicate_rows: true,
    create_missing_columns: true,
    rows,
  }, post);
  if (!verifiedScoreReceipt(upstream.body)) {
    throw Object.assign(
      new Error("The deployed score-sheet webhook is still append-only. Upgrade and redeploy its Apps Script."),
      { statusCode: 409 },
    );
  }
  return upstream;
}

module.exports = { postAppsScript, verifiedScoreReceipt, upsertScoreRows };
