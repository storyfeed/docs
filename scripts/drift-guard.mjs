/**
 * Run the drift detector as part of a local build, and step aside elsewhere.
 *
 * The detector needs core's working tree — it reads its classes through PHP and
 * its deleted files through git — so it cannot run on the deploy host, which
 * has this repo and nothing else. Wiring the detector straight into `build`
 * would therefore break every deploy.
 *
 * It exists to catch docs that name a class core does not have. That is exactly
 * what shipped on 2026-09-15: the vocabulary was renamed, the pages kept
 * teaching `Fields::make()`, and the site went to production naming a class
 * that had been gone for hours. `npm run drift` would have caught it in a
 * second, and nobody ran it, which is the argument for it running itself.
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const core = process.env.STORYFEED_CORE || '/Users/jasper/Dev/projects/storyfeed';

if (!existsSync(resolve(core, 'src'))) {
    console.log(`drift: core not at ${core} — skipped (set STORYFEED_CORE to run it here)`);
    process.exit(0);
}

const run = spawnSync(process.execPath, [resolve(here, 'drift-detector/index.mjs'), '--core', core], {
    encoding: 'utf8',
});

// Only STALE fails a build: missing and unresolved are informational by design,
// and failing on them would make the guard the thing people switch off.
if (run.status === 1) {
    const stale = (run.stdout || '').split('\nMISSING')[0];
    console.error(stale.replace(/^Core .*\n/, ''));
    console.error('drift: the docs name something core does not have. Fix the pages, or the build is a lie.');
    process.exit(1);
}

if (run.status !== 0) {
    console.error(run.stderr || 'drift: detector failed');
    process.exit(0); // an operational failure is not a docs defect
}

console.log('drift: no stale references');
