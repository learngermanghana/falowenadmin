import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) throw new Error('FIREBASE_PROJECT_ID is required.');

const accessToken = execFileSync('gcloud', ['auth', 'print-access-token'], { encoding: 'utf8' }).trim();
if (!accessToken) throw new Error('Google Cloud did not return an access token.');

const rules = readFileSync('firestore.rules', 'utf8');
const api = 'https://firebaserules.googleapis.com/v1';
const headers = {
  Authorization: 'Bearer ' + accessToken,
  'Content-Type': 'application/json',
};

async function jsonResponse(response) {
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  if (!response.ok) {
    throw new Error('Firebase Rules API request failed (' + response.status + '): ' + JSON.stringify(body));
  }
  return body;
}

// The create call validates the uploaded source and stores an immutable ruleset.
const created = await jsonResponse(await fetch(api + '/projects/' + encodeURIComponent(projectId) + '/rulesets', {
  method: 'POST',
  headers,
  body: JSON.stringify({
    source: {
      files: [{ content: rules, name: 'firestore.rules' }],
      attachmentPoint: 'firestore.googleapis.com/databases/(default)',
    },
  }),
}));
if (!created.name) throw new Error('Firebase Rules API did not return a ruleset name.');

const releaseName = 'projects/' + projectId + '/releases/cloud.firestore';
const release = { name: releaseName, rulesetName: created.name };
await jsonResponse(await fetch(api + '/' + releaseName + '?updateMask=rulesetName', {
  method: 'PATCH',
  headers,
  body: JSON.stringify({ release, updateMask: 'rulesetName' }),
}));
console.log('Deployed Firestore rules release ' + releaseName + ' from ' + created.name + '.');
