#!/usr/bin/env node
/**
 * Import combine data from NFL.com or similar sources.
 * Accepts JSON array or CSV from stdin or a file.
 *
 * Usage:
 *   node scripts/import-combine.js                    # paste JSON/CSV, then Ctrl+D
 *   node scripts/import-combine.js < combine-data.json
 *   node scripts/import-combine.js combine-data.json
 *
 * JSON format (array of objects):
 *   [{"name":"Sonny Styles","forty":4.46,"vert":43.5,"broad":134,"cone":7.09,"shuttle":4.26}, ...]
 *
 * CSV format (header row required):
 *   name,pos,forty,bench,vert,broad,cone,shuttle
 *   Sonny Styles,LB,4.46,,43.5,134,7.09,4.26
 *
 * Output: data/combine-overrides.json (merged with existing)
 * Run "npm run data" after import to regenerate prospects.json
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const dataDir = path.join(__dirname, '../data');
const overridesPath = path.join(dataDir, 'combine-overrides.json');

const COMBINE_KEYS = ['forty', 'bench', 'vert', 'broad', 'cone', 'shuttle'];

// Normalize names for matching (expert mock typos -> our spelling)
const NAME_ALIASES = {
  'Reuben Bain Jr.': 'Rueben Bain Jr.',
  'Reuben Bain': 'Rueben Bain Jr.',
  'Arvelle Reese': 'Arvell Reese',
  'Arvell Reese': 'Arvell Reese',
  'Jemod McCoy': 'Jermod McCoy',
  'Maki Lemon': 'Makai Lemon',
  'Kadyn McDonald': 'Kayden McDonald',
  'Akeem Mesidor': 'Akheem Mesidor',
  'KC Conception': 'KC Concepcion',
  'Lee Huner': 'Lee Hunter',
  'Emmanual Pregnon': 'Emmanuel Pregnon',
  'Monroe Freelign': 'Monroe Freeling',
  'Emmanual McNeil-Warren': 'Emmanuel McNeil-Warren',
  'Max Iheanacho': 'Max Iheanachor',
  'Brandon Cissee': 'Brandon Cisse',
};

function normalizeName(name) {
  if (!name || typeof name !== 'string') return null;
  const trimmed = name.trim();
  return NAME_ALIASES[trimmed] || trimmed;
}

function parseNum(val) {
  if (val === null || val === undefined || val === '' || val === '--' || val === 'DNP') return null;
  const n = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

function parseJson(input) {
  try {
    const data = JSON.parse(input);
    return Array.isArray(data) ? data : [data];
  } catch (e) {
    return null;
  }
}

function parseCsv(input) {
  const lines = input.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const nameIdx = header.findIndex(h => h === 'name' || h === 'player');
  if (nameIdx === -1) return [];
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(',').map(v => v.trim());
    const name = vals[nameIdx];
    if (!name) continue;
    const row = { name };
    header.forEach((h, j) => {
      if (h === 'name' || h === 'player') return;
      const v = vals[j];
      if (COMBINE_KEYS.includes(h)) row[h] = parseNum(v);
      else if (h === 'pos') row.pos = v;
    });
    rows.push(row);
  }
  return rows;
}

function toCombineOverride(row) {
  const name = normalizeName(row.name);
  if (!name) return null;
  const combine = { _status: 'official' };
  for (const k of COMBINE_KEYS) {
    const v = row[k] ?? row[k.toLowerCase()];
    const n = parseNum(v);
    if (n !== null) combine[k] = k === 'bench' ? Math.round(n) : parseFloat(n.toFixed(2));
    else if (v !== undefined && v !== '') combine[k] = null; // explicit DNP
  }
  if (Object.keys(combine).length <= 1) return null; // only _status
  return { name, combine };
}

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(chunks.join('')));
  });
}

async function main() {
  let input = '';
  const fileArg = process.argv[2];
  if (fileArg) {
    try {
      input = fs.readFileSync(path.resolve(fileArg), 'utf8');
    } catch (e) {
      console.error('Could not read file:', fileArg, e.message);
      process.exit(1);
    }
  } else {
    input = await readStdin();
  }

  if (!input.trim()) {
    console.error('No input. Paste JSON or CSV, or pass a file path.');
    console.error('Example JSON: [{"name":"Sonny Styles","forty":4.46,"vert":43.5,"broad":134}]');
    process.exit(1);
  }

  let rows = parseJson(input);
  if (!rows) rows = parseCsv(input);
  if (!rows.length) {
    console.error('Could not parse JSON array or CSV. Check format.');
    process.exit(1);
  }

  const overrides = {};
  try {
    const existing = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
    Object.assign(overrides, existing);
  } catch (e) {
    // no existing file
  }

  let count = 0;
  for (const row of rows) {
    const parsed = toCombineOverride(row);
    if (parsed) {
      overrides[parsed.name] = parsed.combine;
      count++;
    }
  }

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(overridesPath, JSON.stringify(overrides, null, 2));
  console.log(`Imported ${count} prospect(s) -> ${overridesPath}`);
  console.log('Run "npm run data" to regenerate prospects.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
