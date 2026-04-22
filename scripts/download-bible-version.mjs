// Runner por versão única — usado para paralelizar downloads (nvi/ara/acf).
// Uso: node scripts/download-bible-version.mjs <version>
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'bible');

const version = process.argv[2];
if (!['nvi', 'ara', 'acf'].includes(version)) {
  console.error('Uso: node scripts/download-bible-version.mjs <nvi|ara|acf>');
  process.exit(1);
}

const BOOKS = [
  { abbrev: 'gn', chapters: 50 }, { abbrev: 'ex', chapters: 40 }, { abbrev: 'lv', chapters: 27 },
  { abbrev: 'nm', chapters: 36 }, { abbrev: 'dt', chapters: 34 }, { abbrev: 'js', chapters: 24 },
  { abbrev: 'jz', chapters: 21 }, { abbrev: 'rt', chapters: 4 }, { abbrev: '1sm', chapters: 31 },
  { abbrev: '2sm', chapters: 24 }, { abbrev: '1rs', chapters: 22 }, { abbrev: '2rs', chapters: 25 },
  { abbrev: '1cr', chapters: 29 }, { abbrev: '2cr', chapters: 36 }, { abbrev: 'ed', chapters: 10 },
  { abbrev: 'ne', chapters: 13 }, { abbrev: 'et', chapters: 10 }, { abbrev: 'jó', chapters: 42 },
  { abbrev: 'sl', chapters: 150 }, { abbrev: 'pv', chapters: 31 }, { abbrev: 'ec', chapters: 12 },
  { abbrev: 'ct', chapters: 8 }, { abbrev: 'is', chapters: 66 }, { abbrev: 'jr', chapters: 52 },
  { abbrev: 'lm', chapters: 5 }, { abbrev: 'ez', chapters: 48 }, { abbrev: 'dn', chapters: 12 },
  { abbrev: 'os', chapters: 14 }, { abbrev: 'jl', chapters: 3 }, { abbrev: 'am', chapters: 9 },
  { abbrev: 'ob', chapters: 1 }, { abbrev: 'jn', chapters: 4 }, { abbrev: 'mq', chapters: 7 },
  { abbrev: 'na', chapters: 3 }, { abbrev: 'hc', chapters: 3 }, { abbrev: 'sf', chapters: 3 },
  { abbrev: 'ag', chapters: 2 }, { abbrev: 'zc', chapters: 14 }, { abbrev: 'ml', chapters: 4 },
  { abbrev: 'mt', chapters: 28 }, { abbrev: 'mc', chapters: 16 }, { abbrev: 'lc', chapters: 24 },
  { abbrev: 'jo', chapters: 21 }, { abbrev: 'at', chapters: 28 }, { abbrev: 'rm', chapters: 16 },
  { abbrev: '1co', chapters: 16 }, { abbrev: '2co', chapters: 13 }, { abbrev: 'gl', chapters: 6 },
  { abbrev: 'ef', chapters: 6 }, { abbrev: 'fp', chapters: 4 }, { abbrev: 'cl', chapters: 4 },
  { abbrev: '1ts', chapters: 5 }, { abbrev: '2ts', chapters: 3 }, { abbrev: '1tm', chapters: 6 },
  { abbrev: '2tm', chapters: 4 }, { abbrev: 'tt', chapters: 3 }, { abbrev: 'fm', chapters: 1 },
  { abbrev: 'hb', chapters: 13 }, { abbrev: 'tg', chapters: 5 }, { abbrev: '1pe', chapters: 5 },
  { abbrev: '2pe', chapters: 3 }, { abbrev: '1jo', chapters: 5 }, { abbrev: '2jo', chapters: 1 },
  { abbrev: '3jo', chapters: 1 }, { abbrev: 'jd', chapters: 1 }, { abbrev: 'ap', chapters: 22 },
];

const BOLLS_VERSION_MAP = { nvi: 'NVIPT', ara: 'ARA', acf: 'ACF11' };
const BOLLS_BOOK_IDS = (() => { const m = {}; BOOKS.forEach((b, i) => { m[b.abbrev] = i + 1; }); return m; })();

const PRIMARY = 'https://www.abibliadigital.com.br/api';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchPrimary(version, abbrev, chapter) {
  const res = await fetch(`${PRIMARY}/verses/${version}/${encodeURIComponent(abbrev)}/${chapter}`, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`primary ${res.status}`);
  const data = await res.json();
  if (!data.verses?.length) throw new Error('primary empty');
  return data.verses.map(v => ({ number: v.number, text: String(v.text || '').trim() }));
}

async function fetchBolls(version, abbrev, chapter) {
  const tr = BOLLS_VERSION_MAP[version];
  const bookId = BOLLS_BOOK_IDS[abbrev];
  const res = await fetch(`https://bolls.life/get-text/${tr}/${bookId}/${chapter}/`, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`bolls ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) throw new Error('bolls empty');
  return data.map(v => ({ number: v.verse, text: String(v.text || '').replace(/<[^>]+>/g, '').trim() }));
}

async function fetchChapter(version, abbrev, chapter) {
  // bolls primeiro (mais estável e rápido)
  for (let r = 0; r < 2; r++) {
    try { return await fetchBolls(version, abbrev, chapter); }
    catch { await sleep(200); }
  }
  for (let r = 0; r < 2; r++) {
    try { return await fetchPrimary(version, abbrev, chapter); }
    catch { await sleep(200); }
  }
  throw new Error('all sources failed');
}

async function fileExists(p) { try { await fs.access(p); return true; } catch { return false; } }

const stats = { ok: 0, skip: 0, fail: 0, failed: [] };
const start = Date.now();

for (const book of BOOKS) {
  const dir = path.join(OUT_DIR, version, book.abbrev);
  await fs.mkdir(dir, { recursive: true });
  for (let c = 1; c <= book.chapters; c++) {
    const out = path.join(dir, `${c}.json`);
    if (await fileExists(out)) { stats.skip++; continue; }
    try {
      const verses = await fetchChapter(version, book.abbrev, c);
      await fs.writeFile(out, JSON.stringify({ v: verses }), 'utf-8');
      stats.ok++;
      if (stats.ok % 25 === 0) console.log(`[${version}] ok=${stats.ok} skip=${stats.skip} fail=${stats.fail} (${book.abbrev} ${c})`);
      await sleep(60);
    } catch (e) {
      stats.fail++;
      stats.failed.push(`${book.abbrev}/${c}: ${e.message}`);
      await sleep(300);
    }
  }
}

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log(`[${version}] FIM. ok=${stats.ok} skip=${stats.skip} fail=${stats.fail} em ${elapsed}s`);
if (stats.failed.length) {
  await fs.writeFile(path.join(OUT_DIR, `_failed_${version}.txt`), stats.failed.join('\n'), 'utf-8');
}
