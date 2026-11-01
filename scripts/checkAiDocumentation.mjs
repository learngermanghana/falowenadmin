#!/usr/bin/env node
// Documentation-only, no API calls or credentials required.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const required=[
 "AGENTS.md","README.md","docs/ai/README.md","docs/ai/architecture.md",
 "docs/ai/content-source-of-truth.md","docs/automatic-course-marking.md",
 "docs/structured-submission-contract.md","docs/music-studio.md",
 "docs/music-analytics.md","docs/live-class-curriculum-contract.md",
 "docs/integration-event-hub.md",".env.example",".gitignore"
];
const problems=[];
for(const p of required)if(!fs.existsSync(path.join(root,p)))problems.push("Missing: "+p);
for(const p of required.filter(x=>x==="AGENTS.md"||x.startsWith("docs/ai/"))){
 const s=fs.readFileSync(path.join(root,p),"utf8");
 for(const m of s.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){
  const target=m[1].split("#")[0];
  if (!target||/^(https?:|mailto:)/.test(target))continue;
  const resolved=path.resolve(root,path.dirname(p),decodeURIComponent(target));
  if(!resolved.startsWith(root+path.sep)||!fs.existsSync(resolved))problems.push(p+": broken link "+target);
 }
}
const example=fs.readFileSync(path.join(root,".env.example"),"utf8");
if(!example.includes("VITE_FIREBASE_PROJECT_ID="))problems.push("Missing browser SDK template setting");
if(!/replace-with/.test(example))problems.push("Template must use placeholders");
if(/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(example))problems.push("Private key found in template");
const ignore=fs.readFileSync(path.join(root,".gitignore"),"utf8");
if(!/^\.env$/m.test(ignore)||!/^!\.env\.example$/m.test(ignore))problems.push("Local environment ignores missing");
if(problems.length){console.error(problems.join("\n"));process.exitCode=1;}
else console.log("Falowen Admin AI docs and local environment template validated.");
