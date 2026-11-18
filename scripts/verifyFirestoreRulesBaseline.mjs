import fs from 'node:fs';

const [canonicalPath, mergedPath] = process.argv.slice(2);
if (!canonicalPath || !mergedPath) {
  console.error('Usage: node scripts/verifyFirestoreRulesBaseline.mjs <canonical-rules> <merged-rules>');
  process.exit(2);
}
const canonical = fs.readFileSync(canonicalPath, 'utf8');
const merged = fs.readFileSync(mergedPath, 'utf8');
const extension = /    \/\* BEGIN_ADMIN_RULES_EXTENSION \*\/\n[\s\S]*?    \/\* END_ADMIN_RULES_EXTENSION \*\/\n\n/;
if (!extension.test(merged) || merged.replace(extension, '') !== canonical) {
  console.error('Firestore deployment blocked: Admin rules must exactly preserve the current Falowen course rules plus the Admin-specific rules extension.');
  process.exit(1);
}
console.log('Firestore rules preserve the current complete Falowen course rules and add the required Admin grants.');
