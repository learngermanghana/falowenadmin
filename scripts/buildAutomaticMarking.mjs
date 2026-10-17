// Bundle the SAME tutor marking pipeline for Firebase; do not fork its parsers.
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
// Apply the same marking patches used by the Admin production build before bundling.
const commands = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts['sync:build'].split(' && ');
let markingPatches = false;
for (const command of commands) {
  if (command === 'node scripts/repairAnswersJson.mjs') markingPatches = true;
  if (command === 'node scripts/patchA1AttendanceDayLabels.mjs') break;
  if (markingPatches && /^node scripts\/[^ ]+\.mjs$/.test(command)) execFileSync(process.execPath, [command.slice(5)], { cwd: root, stdio: 'inherit' });
}
await build({
  stdin: { contents: `export { markSubmissionWithAI } from './src/services/markingService.js';`, resolveDir: root },
  outfile: path.join(root, 'functions/automaticMarkingPipeline.cjs'),
  bundle: true, minify: true, platform: 'node', target: 'node22', format: 'cjs',
  external: ['firebase-admin', './automaticMarkingContext.js'],
  define: { 'import.meta.env': '{}' },
  plugins: [{ name: 'server-marking-adapters', setup(build) {
    build.onResolve({ filter: /firebase\/firestore$|\/firebase\.js$/ }, () => ({ path: path.join(root, 'scripts/automatic-marking/firebase.mjs') }));
    build.onLoad({ filter: /src\/services\/(markingService|markingServiceBase)\.js$/ }, async ({ path: file }) => ({
      contents: `import { markingTransport } from './automaticMarkingContext.js';\n` + fs.readFileSync(file, 'utf8').replace(/\bfetch\(/g, 'markingTransport('), loader: 'js', resolveDir: path.dirname(file),
    }));
  }}],
});
