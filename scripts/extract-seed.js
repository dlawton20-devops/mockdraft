#!/usr/bin/env node
/**
 * Extract TOP_PROSPECTS and PROSPECT_UPDATES from app.js
 * Run: node scripts/extract-seed.js
 */
const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '../public/app.js');
const dataDir = path.join(__dirname, '../data');
const code = fs.readFileSync(appPath, 'utf8');

function extractJsLiteral(code, varName, isArray) {
  const startMark = `const ${varName}=`;
  const idx = code.indexOf(startMark);
  if (idx === -1) return null;
  const start = idx + startMark.length;
  const open = isArray ? '[' : '{';
  const close = isArray ? ']' : '}';
  let depth = 0;
  let i = start;
  let inStr = false, strCh = null, escaped = false;
  while (i < code.length) {
    const c = code[i];
    if (escaped) { escaped = false; i++; continue; }
    if (c === '\\') { escaped = true; i++; continue; }
    if (!inStr) {
      if (c === '"' || c === "'" || c === '`') { inStr = true; strCh = c; }
      else if (c === open) depth++;
      else if (c === close) { depth--; if (depth === 0) return code.slice(start, i + 1); }
    } else if (c === strCh) inStr = false;
    i++;
  }
  return null;
}

const prospectsStr = extractJsLiteral(code, 'TOP_PROSPECTS', true);
const updatesStr = extractJsLiteral(code, 'PROSPECT_UPDATES', false);

if (!prospectsStr) {
  console.error('Could not extract TOP_PROSPECTS');
  process.exit(1);
}

let prospects, updates;
try {
  prospects = new Function('return ' + prospectsStr)();
} catch (e) {
  console.error('Parse TOP_PROSPECTS failed:', e.message);
  process.exit(1);
}
try {
  updates = updatesStr ? new Function('return ' + updatesStr)() : {};
} catch (e) {
  updates = {};
}

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, 'seed-prospects.json'), JSON.stringify(prospects, null, 2));
fs.writeFileSync(path.join(dataDir, 'prospect-updates.json'), JSON.stringify(updates, null, 2));
console.log('Extracted', prospects.length, 'prospects,', Object.keys(updates).length, 'updates');
