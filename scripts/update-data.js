#!/usr/bin/env node
/**
 * Update prospect data: apply PROSPECT_UPDATES, ML grade adjustment
 * Run: node scripts/update-data.js
 * Output: data/prospects.json
 */
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

function combineScore(prospect) {
  const r = {
    QB: { forty: [4.55, 4.95], vert: [28, 36], broad: [102, 118] },
    RB: { forty: [4.35, 4.65], vert: [32, 42], broad: [115, 130] },
    WR: { forty: [4.28, 4.60], vert: [33, 43], broad: [118, 134] },
    TE: { forty: [4.50, 4.85], vert: [30, 39], broad: [112, 126] },
    OT: { forty: [4.90, 5.40], vert: [25, 34], broad: [100, 116] },
    IOL: { forty: [4.95, 5.40], vert: [24, 33], broad: [98, 114] },
    EDGE: { forty: [4.45, 4.85], vert: [30, 40], broad: [112, 128] },
    DT: { forty: [4.80, 5.30], vert: [25, 35], broad: [100, 118] },
    LB: { forty: [4.42, 4.80], vert: [30, 40], broad: [112, 128] },
    CB: { forty: [4.28, 4.55], vert: [34, 44], broad: [120, 136] },
    S: { forty: [4.32, 4.60], vert: [33, 42], broad: [118, 132] },
  }[prospect.pos] || { forty: [4.5, 4.9], vert: [30, 40], broad: [110, 130] };
  const c = prospect.combine || {};
  let total = 0, n = 0;
  if (c.forty != null) {
    const [lo, hi] = r.forty;
    total += Math.max(0, Math.min(1, 1 - (c.forty - lo) / (hi - lo)));
    n++;
  }
  if (c.vert != null) {
    const [lo, hi] = r.vert;
    total += Math.max(0, Math.min(1, (c.vert - lo) / (hi - lo)));
    n++;
  }
  if (c.broad != null) {
    const [lo, hi] = r.broad;
    total += Math.max(0, Math.min(1, (c.broad - lo) / (hi - lo)));
    n++;
  }
  return n > 0 ? (total / n) * 100 : 50;
}

let prospects = [];
try {
  prospects = JSON.parse(fs.readFileSync(path.join(dataDir, 'seed-prospects.json'), 'utf8'));
} catch (e) {
  console.error('Run extract-seed.js first');
  process.exit(1);
}

// Merge combine overrides (from import-combine.js)
let combineOverrides = {};
try {
  combineOverrides = JSON.parse(fs.readFileSync(path.join(dataDir, 'combine-overrides.json'), 'utf8'));
} catch (e) {}

prospects = prospects.map((p) => {
  const co = combineOverrides[p.name];
  if (co) {
    const merged = { ...(p.combine || {}), ...co };
    merged._status = 'official';
    return { ...p, combine: merged };
  }
  return p;
});

const updates = {};
try {
  Object.assign(updates, JSON.parse(fs.readFileSync(path.join(dataDir, 'prospect-updates.json'), 'utf8')));
} catch (e) {}

let mlK = 0.04;
try {
  const ml = JSON.parse(fs.readFileSync(path.join(dataDir, 'ml-coefficients.json'), 'utf8'));
  mlK = ml.combineScoreToGrade ?? 0.04;
} catch (e) {
  require('./ml-combine-impact.js');
  const ml = JSON.parse(fs.readFileSync(path.join(dataDir, 'ml-coefficients.json'), 'utf8'));
  mlK = ml.combineScoreToGrade ?? 0.04;
}

const out = prospects.map(p => {
  let grade = p.grade || 80;
  const u = updates[p.name];
  if (u && u.delta) grade += u.delta;
  const cs = combineScore(p);
  if (p.combine && (p.combine.forty || p.combine.vert || p.combine.broad)) {
    grade += (cs - 50) * mlK;
  }
  grade = Math.round(Math.max(50, Math.min(99, grade)));
  return { ...p, grade };
});

fs.writeFileSync(path.join(dataDir, 'prospects.json'), JSON.stringify(out, null, 2));
fs.writeFileSync(path.join(dataDir, 'last-update.json'), JSON.stringify({ at: new Date().toISOString() }, null, 2));
console.log('Updated', out.length, 'prospects -> data/prospects.json');
