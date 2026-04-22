// Script: baixa NVI/ARA/ACF da ABíbliaDigital e salva em /public/bible/{version}/{abbrev}/{chapter}.json
// Também gera /public/bible/index.json com a lista de livros e contagem de capítulos.
// Uso: node scripts/download-bible.mjs

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'public', 'bible');

const VERSIONS = ['nvi', 'ara', 'acf'];

// Books: importa do mesmo arquivo do app (mantém abbrevs alinhados)
const BOOKS = [
  { name: 'Gênesis', abbrev: 'gn', testament: 'VT', chapters: 50, group: 'Pentateuco' },
  { name: 'Êxodo', abbrev: 'ex', testament: 'VT', chapters: 40, group: 'Pentateuco' },
  { name: 'Levítico', abbrev: 'lv', testament: 'VT', chapters: 27, group: 'Pentateuco' },
  { name: 'Números', abbrev: 'nm', testament: 'VT', chapters: 36, group: 'Pentateuco' },
  { name: 'Deuteronômio', abbrev: 'dt', testament: 'VT', chapters: 34, group: 'Pentateuco' },
  { name: 'Josué', abbrev: 'js', testament: 'VT', chapters: 24, group: 'Históricos' },
  { name: 'Juízes', abbrev: 'jz', testament: 'VT', chapters: 21, group: 'Históricos' },
  { name: 'Rute', abbrev: 'rt', testament: 'VT', chapters: 4, group: 'Históricos' },
  { name: '1 Samuel', abbrev: '1sm', testament: 'VT', chapters: 31, group: 'Históricos' },
  { name: '2 Samuel', abbrev: '2sm', testament: 'VT', chapters: 24, group: 'Históricos' },
  { name: '1 Reis', abbrev: '1rs', testament: 'VT', chapters: 22, group: 'Históricos' },
  { name: '2 Reis', abbrev: '2rs', testament: 'VT', chapters: 25, group: 'Históricos' },
  { name: '1 Crônicas', abbrev: '1cr', testament: 'VT', chapters: 29, group: 'Históricos' },
  { name: '2 Crônicas', abbrev: '2cr', testament: 'VT', chapters: 36, group: 'Históricos' },
  { name: 'Esdras', abbrev: 'ed', testament: 'VT', chapters: 10, group: 'Históricos' },
  { name: 'Neemias', abbrev: 'ne', testament: 'VT', chapters: 13, group: 'Históricos' },
  { name: 'Ester', abbrev: 'et', testament: 'VT', chapters: 10, group: 'Históricos' },
  { name: 'Jó', abbrev: 'jó', testament: 'VT', chapters: 42, group: 'Poéticos' },
  { name: 'Salmos', abbrev: 'sl', testament: 'VT', chapters: 150, group: 'Poéticos' },
  { name: 'Provérbios', abbrev: 'pv', testament: 'VT', chapters: 31, group: 'Poéticos' },
  { name: 'Eclesiastes', abbrev: 'ec', testament: 'VT', chapters: 12, group: 'Poéticos' },
  { name: 'Cânticos', abbrev: 'ct', testament: 'VT', chapters: 8, group: 'Poéticos' },
  { name: 'Isaías', abbrev: 'is', testament: 'VT', chapters: 66, group: 'Profetas Maiores' },
  { name: 'Jeremias', abbrev: 'jr', testament: 'VT', chapters: 52, group: 'Profetas Maiores' },
  { name: 'Lamentações', abbrev: 'lm', testament: 'VT', chapters: 5, group: 'Profetas Maiores' },
  { name: 'Ezequiel', abbrev: 'ez', testament: 'VT', chapters: 48, group: 'Profetas Maiores' },
  { name: 'Daniel', abbrev: 'dn', testament: 'VT', chapters: 12, group: 'Profetas Maiores' },
  { name: 'Oséias', abbrev: 'os', testament: 'VT', chapters: 14, group: 'Profetas Menores' },
  { name: 'Joel', abbrev: 'jl', testament: 'VT', chapters: 3, group: 'Profetas Menores' },
  { name: 'Amós', abbrev: 'am', testament: 'VT', chapters: 9, group: 'Profetas Menores' },
  { name: 'Obadias', abbrev: 'ob', testament: 'VT', chapters: 1, group: 'Profetas Menores' },
  { name: 'Jonas', abbrev: 'jn', testament: 'VT', chapters: 4, group: 'Profetas Menores' },
  { name: 'Miquéias', abbrev: 'mq', testament: 'VT', chapters: 7, group: 'Profetas Menores' },
  { name: 'Naum', abbrev: 'na', testament: 'VT', chapters: 3, group: 'Profetas Menores' },
  { name: 'Habacuque', abbrev: 'hc', testament: 'VT', chapters: 3, group: 'Profetas Menores' },
  { name: 'Sofonias', abbrev: 'sf', testament: 'VT', chapters: 3, group: 'Profetas Menores' },
  { name: 'Ageu', abbrev: 'ag', testament: 'VT', chapters: 2, group: 'Profetas Menores' },
  { name: 'Zacarias', abbrev: 'zc', testament: 'VT', chapters: 14, group: 'Profetas Menores' },
  { name: 'Malaquias', abbrev: 'ml', testament: 'VT', chapters: 4, group: 'Profetas Menores' },
  { name: 'Mateus', abbrev: 'mt', testament: 'NT', chapters: 28, group: 'Evangelhos' },
  { name: 'Marcos', abbrev: 'mc', testament: 'NT', chapters: 16, group: 'Evangelhos' },
  { name: 'Lucas', abbrev: 'lc', testament: 'NT', chapters: 24, group: 'Evangelhos' },
  { name: 'João', abbrev: 'jo', testament: 'NT', chapters: 21, group: 'Evangelhos' },
  { name: 'Atos', abbrev: 'at', testament: 'NT', chapters: 28, group: 'Histórico' },
  { name: 'Romanos', abbrev: 'rm', testament: 'NT', chapters: 16, group: 'Cartas Paulinas' },
  { name: '1 Coríntios', abbrev: '1co', testament: 'NT', chapters: 16, group: 'Cartas Paulinas' },
  { name: '2 Coríntios', abbrev: '2co', testament: 'NT', chapters: 13, group: 'Cartas Paulinas' },
  { name: 'Gálatas', abbrev: 'gl', testament: 'NT', chapters: 6, group: 'Cartas Paulinas' },
  { name: 'Efésios', abbrev: 'ef', testament: 'NT', chapters: 6, group: 'Cartas Paulinas' },
  { name: 'Filipenses', abbrev: 'fp', testament: 'NT', chapters: 4, group: 'Cartas Paulinas' },
  { name: 'Colossenses', abbrev: 'cl', testament: 'NT', chapters: 4, group: 'Cartas Paulinas' },
  { name: '1 Tessalonicenses', abbrev: '1ts', testament: 'NT', chapters: 5, group: 'Cartas Paulinas' },
  { name: '2 Tessalonicenses', abbrev: '2ts', testament: 'NT', chapters: 3, group: 'Cartas Paulinas' },
  { name: '1 Timóteo', abbrev: '1tm', testament: 'NT', chapters: 6, group: 'Cartas Paulinas' },
  { name: '2 Timóteo', abbrev: '2tm', testament: 'NT', chapters: 4, group: 'Cartas Paulinas' },
  { name: 'Tito', abbrev: 'tt', testament: 'NT', chapters: 3, group: 'Cartas Paulinas' },
  { name: 'Filemom', abbrev: 'fm', testament: 'NT', chapters: 1, group: 'Cartas Paulinas' },
  { name: 'Hebreus', abbrev: 'hb', testament: 'NT', chapters: 13, group: 'Cartas Gerais' },
  { name: 'Tiago', abbrev: 'tg', testament: 'NT', chapters: 5, group: 'Cartas Gerais' },
  { name: '1 Pedro', abbrev: '1pe', testament: 'NT', chapters: 5, group: 'Cartas Gerais' },
  { name: '2 Pedro', abbrev: '2pe', testament: 'NT', chapters: 3, group: 'Cartas Gerais' },
  { name: '1 João', abbrev: '1jo', testament: 'NT', chapters: 5, group: 'Cartas Gerais' },
  { name: '2 João', abbrev: '2jo', testament: 'NT', chapters: 1, group: 'Cartas Gerais' },
  { name: '3 João', abbrev: '3jo', testament: 'NT', chapters: 1, group: 'Cartas Gerais' },
  { name: 'Judas', abbrev: 'jd', testament: 'NT', chapters: 1, group: 'Cartas Gerais' },
  { name: 'Apocalipse', abbrev: 'ap', testament: 'NT', chapters: 22, group: 'Profecia' },
];

const PRIMARY = 'https://www.abibliadigital.com.br/api';
// fallback: bolls.life translation IDs
const BOLLS_VERSION_MAP = { nvi: 'NVIPT', ara: 'ARA', acf: 'ACF11' };

// Mapping abbrev pt -> bolls book ID (canonical 1..66 order matches our list)
const BOLLS_BOOK_IDS = (() => {
  const map = {};
  BOOKS.forEach((b, i) => { map[b.abbrev] = i + 1; });
  return map;
})();

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchPrimary(version, abbrev, chapter) {
  const url = `${PRIMARY}/verses/${version}/${encodeURIComponent(abbrev)}/${chapter}`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`primary ${res.status}`);
  const data = await res.json();
  if (!data.verses || !Array.isArray(data.verses) || data.verses.length === 0) throw new Error('primary empty');
  return data.verses.map(v => ({ number: v.number, text: String(v.text || '').trim() }));
}

async function fetchBolls(version, abbrev, chapter) {
  const tr = BOLLS_VERSION_MAP[version];
  const bookId = BOLLS_BOOK_IDS[abbrev];
  if (!tr || !bookId) throw new Error('bolls map missing');
  const url = `https://bolls.life/get-text/${tr}/${bookId}/${chapter}/`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`bolls ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) throw new Error('bolls empty');
  return data.map(v => ({
    number: v.verse,
    text: String(v.text || '').replace(/<[^>]+>/g, '').trim(),
  }));
}

async function fetchChapter(version, abbrev, chapter) {
  const attempts = [
    () => fetchPrimary(version, abbrev, chapter),
    () => fetchBolls(version, abbrev, chapter),
  ];
  let lastErr;
  for (let i = 0; i < attempts.length; i++) {
    for (let retry = 0; retry < 3; retry++) {
      try {
        return await attempts[i]();
      } catch (e) {
        lastErr = e;
        await sleep(300 + retry * 500);
      }
    }
  }
  throw lastErr;
}

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function processBook(version, book, stats) {
  const dir = path.join(OUT_DIR, version, book.abbrev);
  await ensureDir(dir);
  for (let c = 1; c <= book.chapters; c++) {
    const out = path.join(dir, `${c}.json`);
    if (await fileExists(out)) {
      stats.skipped++;
      continue;
    }
    try {
      const verses = await fetchChapter(version, book.abbrev, c);
      await fs.writeFile(out, JSON.stringify({ v: verses }), 'utf-8');
      stats.ok++;
      process.stdout.write(`\r[${version}] ${book.abbrev} ${c}/${book.chapters} ok=${stats.ok} skip=${stats.skipped} fail=${stats.fail}     `);
      // Rate limit: pequena pausa entre chapters
      await sleep(120);
    } catch (e) {
      stats.fail++;
      stats.failed.push(`${version}/${book.abbrev}/${c}: ${e.message}`);
      process.stdout.write(`\n[FAIL] ${version}/${book.abbrev}/${c}: ${e.message}\n`);
      await sleep(500);
    }
  }
}

async function main() {
  await ensureDir(OUT_DIR);

  // Index
  const index = {
    versions: VERSIONS,
    books: BOOKS.map(b => ({
      name: b.name,
      abbrev: { pt: b.abbrev, en: b.abbrev },
      testament: b.testament,
      chapters: b.chapters,
      group: b.group,
    })),
  };
  await fs.writeFile(path.join(OUT_DIR, 'index.json'), JSON.stringify(index), 'utf-8');
  console.log(`Index gravado: ${path.join(OUT_DIR, 'index.json')}`);

  for (const version of VERSIONS) {
    const stats = { ok: 0, skipped: 0, fail: 0, failed: [] };
    console.log(`\n=== Versão ${version.toUpperCase()} ===`);
    for (const book of BOOKS) {
      await processBook(version, book, stats);
    }
    console.log(`\n[${version}] concluído. ok=${stats.ok} skip=${stats.skipped} fail=${stats.fail}`);
    if (stats.failed.length) {
      const failPath = path.join(OUT_DIR, `_failed_${version}.txt`);
      await fs.writeFile(failPath, stats.failed.join('\n'), 'utf-8');
      console.log(`Lista de falhas: ${failPath}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
