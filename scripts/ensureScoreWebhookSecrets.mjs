// Run under the SAME authenticated Google service account as Firebase deployment.
// Copy existing runtime score settings only when needed; never print credentials.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
const { scoreWebhookConfig } = createRequire(import.meta.url)('../functions/scoreWebhookConfig.js');
const project = process.env.FIREBASE_PROJECT_ID;
if (project !== 'falowen-examiner-trainer') throw new Error('Refusing to configure a different Firebase project');
const runtime = JSON.parse(process.env.CLOUD_RUNTIME_CONFIG || '{}');
const settings = scoreWebhookConfig(runtime);
const command = args => execFileSync('gcloud', [...args, '--project', project], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
for (const [name, value] of [['SCORES_WEBHOOK_URL', settings.url], ['SCORES_WEBHOOK_TOKEN', settings.token]]) {
  let existing = '';
  try { existing = command(['secrets', 'versions', 'access', 'latest', '--secret', name]); } catch { /* Provision below if existing configuration is available. */ }
  if (!value && existing) continue;
  if (!value) throw new Error(`${name} is unavailable in Firebase. Reuse the existing Admin score settings in the protected runtime config; no new Sheet is needed.`);
  if (existing === value) continue;
  let exists = false;
  try { command(['secrets', 'describe', name]); exists = true; } catch { /* Create only this exact named secret. */ }
  if (!exists) command(['secrets', 'create', name, '--replication-policy=automatic']);
  execFileSync('gcloud', ['secrets', 'versions', 'add', name, '--data-file=-', '--project', project], {
    input: value, stdio: ['pipe', 'pipe', 'pipe'],
  });
}
// Names/GID are non-secret selectors, but must also match the existing Sheet.
const dotenv = `functions/.env.${project}`;
if (settings.sheetName) fs.appendFileSync(dotenv, `SCORES_WEBHOOK_SHEET_NAME=${JSON.stringify(settings.sheetName)}\n`);
if (settings.sheetGid) fs.appendFileSync(dotenv, `SCORES_WEBHOOK_SHEET_GID=${JSON.stringify(settings.sheetGid)}\n`);
console.log('Existing score webhook settings are available in the production Firebase project.');
