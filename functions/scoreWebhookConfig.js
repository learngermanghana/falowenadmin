// Accept the names already used by Admin and its protected Firebase runtime config.
function scoreWebhookConfig(runtime = {}, env = process.env) {
  const scores = runtime.scores || runtime.integrations?.scores || {};
  const pick = (...values) => values.map(v => String(v ?? '').trim()).find(Boolean) || '';
  return {
    url: pick(env.SCORES_WEBHOOK_URL, env.VITE_SCORES_WEBHOOK_URL, scores.webhook_url, scores.url, runtime.SCORES_WEBHOOK_URL, runtime.VITE_SCORES_WEBHOOK_URL),
    token: pick(env.SCORES_WEBHOOK_TOKEN, env.VITE_SCORES_WEBHOOK_TOKEN, scores.webhook_token, scores.token, runtime.SCORES_WEBHOOK_TOKEN, runtime.VITE_SCORES_WEBHOOK_TOKEN),
    sheetName: pick(env.SCORES_WEBHOOK_SHEET_NAME, env.VITE_SCORES_WEBHOOK_SHEET_NAME, scores.sheet_name, scores.sheetName),
    sheetGid: pick(env.SCORES_WEBHOOK_SHEET_GID, env.VITE_SCORES_WEBHOOK_SHEET_GID, scores.sheet_gid, scores.sheetGid),
  };
}
module.exports = { scoreWebhookConfig };
