const {test}=require('node:test');
const assert=require('node:assert/strict');
const {scoreWebhookConfig}=require('./scoreWebhookConfig');
test('reuses existing Admin VITE settings including the exact sheet GID',()=>{
 assert.deepEqual(scoreWebhookConfig({}, {VITE_SCORES_WEBHOOK_URL:' https://example.test ',VITE_SCORES_WEBHOOK_TOKEN:'token',VITE_SCORES_WEBHOOK_SHEET_NAME:'scores_backup',VITE_SCORES_WEBHOOK_SHEET_GID:'123'}),
  {url:'https://example.test',token:'token',sheetName:'scores_backup',sheetGid:'123'});
});
test('reads shared Firebase runtime config and prefers mounted production secrets',()=>{
 const runtime={scores:{webhook_url:'https://example.test',webhook_token:'old',sheet_name:'scores_backup',sheet_gid:'123'}};
 assert.deepEqual(scoreWebhookConfig(runtime,{SCORES_WEBHOOK_TOKEN:'current'}),{url:'https://example.test',token:'current',sheetName:'scores_backup',sheetGid:'123'});
});
