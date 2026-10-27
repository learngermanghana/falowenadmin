"use strict";
const admin = require('firebase-admin');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { createHandler } = require('./musicStudio');
const key = defineSecret('GEMINI_API_KEY');
let runtimeConfig = {};
try { runtimeConfig = JSON.parse(process.env.CLOUD_RUNTIME_CONFIG || '{}'); } catch { /* owner hash fallback */ }
exports.musicStudio = onRequest({
  region: 'us-central1', timeoutSeconds: 300, memory: '256MiB', cpu: 'gcf_gen1',
  minInstances: 0, maxInstances: 1, concurrency: 1,
  cors: ['https://admin.falowen.app', 'http://localhost:5173'], secrets: [key],
}, createHandler({ db: admin.firestore(), verifyToken: token => admin.auth().verifyIdToken(token), key: () => key.value(), runtimeConfig }));
