#!/usr/bin/env node
/**
 * ML-style combine impact model
 * Learns grade adjustment from historical combine + draft position
 * Output: data/ml-coefficients.json
 */
const fs = require('fs');
const path = require('path');

const COMBINE_RANGES = {
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
};

// Historical: combine metrics + draft round (1-7)
const HISTORICAL = [
  { name: 'Nick Emmanwori', pos: 'S', forty: 4.38, vert: 43, broad: 138, draftRound: 2 },
  { name: 'Isaiah Simmons', pos: 'LB', forty: 4.39, vert: 39, broad: 132, draftRound: 1 },
  { name: 'Owen Pappoe', pos: 'LB', forty: 4.39, vert: 35.5, broad: 126, draftRound: 5 },
  { name: 'Davis Tull', pos: 'LB', forty: 4.59, vert: 42.5, broad: 132, draftRound: 5 },
  { name: 'Calvin Johnson', pos: 'WR', forty: 4.35, vert: 42.5, broad: 139, draftRound: 1 },
  { name: 'DK Metcalf', pos: 'WR', forty: 4.33, vert: 40.5, broad: 134, draftRound: 2 },
  { name: 'Micah Parsons', pos: 'LB', forty: 4.39, vert: 34, broad: 126, draftRound: 1 },
  { name: 'Devin White', pos: 'LB', forty: 4.42, vert: 39.5, broad: 128, draftRound: 1 },
  { name: 'Roquan Smith', pos: 'LB', forty: 4.51, vert: 33.5, broad: 113, draftRound: 1 },
  { name: 'Fred Warner', pos: 'LB', forty: 4.64, vert: 36.5, broad: 118, draftRound: 3 },
  { name: 'Saquon Barkley', pos: 'RB', forty: 4.40, vert: 41, broad: 132, draftRound: 1 },
  { name: 'Derrick Henry', pos: 'RB', forty: 4.54, vert: 37, broad: 130, draftRound: 2 },
];

function combineScore(pos, forty, vert, broad) {
  const r = COMBINE_RANGES[pos] || COMBINE_RANGES.LB;
  let total = 0, n = 0;
  if (forty != null && r.forty) {
    const [lo, hi] = r.forty;
    total += 1 - (forty - lo) / (hi - lo);
    n++;
  }
  if (vert != null && r.vert) {
    const [lo, hi] = r.vert;
    total += (vert - lo) / (hi - lo);
    n++;
  }
  if (broad != null && r.broad) {
    const [lo, hi] = r.broad;
    total += (broad - lo) / (hi - lo);
    n++;
  }
  return n > 0 ? (total / n) * 100 : 50;
}

// draftRound 1-2 = high grade; 3-4 = mid; 5-7 = lower
// Expected grade (rough): R1 = 90+, R2 = 82-89, R3 = 75-81, R4 = 68-74, R5+ = <68
// We want: gradeAdjustment = f(combineScore) such that higher combine → higher grade
// Simple linear: gradeAdjustment = (combineScore - 50) * k
// Fit k: minimize error between predicted grade and actual grade
// We don't have grade, we have draft round. Map round -> expected grade: R1=92, R2=85, R3=78, R4=71, R5=64
const ROUND_TO_GRADE = { 1: 92, 2: 85, 3: 78, 4: 71, 5: 64, 6: 57, 7: 50 };

const scores = HISTORICAL.map(h => ({
  ...h,
  score: combineScore(h.pos, h.forty, h.vert, h.broad),
  expectedGrade: ROUND_TO_GRADE[h.draftRound] || 70,
}));

// Simple linear regression: gradeAdjustment = (score - 50) * k
// We want: baseGrade + adjustment ≈ expectedGrade
// So: adjustment = (score - 50) * k
// Fit k: minimize sum((expectedGrade - 80 - (score-50)*k)^2) assuming baseGrade 80
// d/dk: sum(-2*(expectedGrade-80-(score-50)*k)*(score-50)) = 0
// k = sum((expectedGrade-80)*(score-50)) / sum((score-50)^2)
let sumNum = 0, sumDen = 0;
for (const s of scores) {
  const x = s.score - 50;
  const y = s.expectedGrade - 80;
  sumNum += x * y;
  sumDen += x * x;
}
const k = sumDen > 0 ? sumNum / sumDen : 0.04;

const coefficients = {
  combineScoreToGrade: k,
  formula: `gradeAdjustment = (combineScore - 50) * ${k.toFixed(4)}`,
  trainedAt: new Date().toISOString(),
  sampleSize: scores.length,
};

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, 'ml-coefficients.json'), JSON.stringify(coefficients, null, 2));
console.log('ML coefficients:', coefficients.formula);
