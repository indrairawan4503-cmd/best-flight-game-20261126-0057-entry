// Canyon Run — hand-in program (Node 22, standard library only).
// I wrote this file myself for the Canyon Run entry: it copies the static game/
// folder and the screenshots/ folder beside it into the grader output directory
// (or $MAKEFUN_OUTPUT_DIR outside the grader) and writes /output/dossier.json
// through the vendored make.fun library, so the judge can read the game offline.
// Run it twice and the two output trees are byte-identical by construction:
// the inputs are fixed files and the dossier builder is deterministic.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// Scorer caps: 4 screenshots at most, each under 256 KiB; game/ under 993 files
// and 48 MiB in total; text budget 160 KiB; no game path over 1000 bytes.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
