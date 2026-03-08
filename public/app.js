// ============================================================
// 2026 NFL DRAFT SIMULATOR — app.js
// Full sim with Combine, Trades, Predict Mode
// ============================================================

const POS_COLORS={QB:'#e74c3c',RB:'#2ecc71',WR:'#3498db',TE:'#e67e22',OT:'#9b59b6',IOL:'#8e44ad',EDGE:'#c0392b',DT:'#e74c3c',LB:'#f39c12',CB:'#1abc9c',S:'#2980b9'};
const POS_GROUPS={QB:['QB'],RB:['RB'],WR:['WR'],TE:['TE'],OL:['OT','IOL'],OT:['OT'],IOL:['IOL'],EDGE:['EDGE'],DL:['DT'],DT:['DT'],LB:['LB'],CB:['CB'],S:['S'],DB:['CB','S']};
function posMatchesNeed(pos,need){return(POS_GROUPS[need]||[need]).includes(pos);}

// Modern NFL positional draft value — premium vs devalued positions
const POS_DRAFT_VALUE={QB:1.0,EDGE:1.0,OT:0.97,CB:0.95,WR:0.93,DT:0.88,IOL:0.85,LB:0.82,S:0.80,TE:0.75,RB:0.60};

// Positions teams absolutely won't draft early due to established starters
const ROSTER_LOCKS={
  ATL:['RB'],BAL:['RB'],BUF:['RB'],CHI:['RB'],CIN:['RB'],DAL:['RB'],
  DEN:['RB'],DET:['RB'],GB:['RB'],HOU:['RB'],IND:['RB'],JAX:['RB'],
  KC:['RB'],LAC:['RB'],LAR:['RB'],MIA:['RB'],MIN:['RB'],NE:['RB'],
  NO:['RB'],NYJ:['RB'],PHI:['RB'],PIT:['RB'],SEA:['RB'],SF:['RB'],
  TB:['RB'],TEN:['RB'],WAS:['RB']
};
// Contract/injury concerns — team may draft here despite incumbent (e.g. RB with 1yr left, injured backup)
const ROSTER_EXPIRING={
  SEA:['RB']  // Ken Walker unsigned, Charbonnet injured + 1yr left
};

// ===== COMBINE MEASUREMENT RANGES BY POSITION =====
const COMBINE_RANGES={
  QB:  {forty:[4.55,4.95],bench:[14,22],vert:[28,36],broad:[102,118],cone:[6.80,7.40],shuttle:[4.10,4.50]},
  RB:  {forty:[4.35,4.65],bench:[16,26],vert:[32,42],broad:[115,130],cone:[6.60,7.20],shuttle:[4.00,4.35]},
  WR:  {forty:[4.28,4.60],bench:[10,20],vert:[33,43],broad:[118,134],cone:[6.50,7.10],shuttle:[3.95,4.30]},
  TE:  {forty:[4.50,4.85],bench:[18,28],vert:[30,39],broad:[112,126],cone:[6.80,7.35],shuttle:[4.10,4.45]},
  OT:  {forty:[4.90,5.40],bench:[22,35],vert:[25,34],broad:[100,116],cone:[7.20,8.00],shuttle:[4.40,4.90]},
  IOL: {forty:[4.95,5.40],bench:[22,36],vert:[24,33],broad:[98,114],cone:[7.30,8.10],shuttle:[4.45,4.95]},
  EDGE:{forty:[4.45,4.85],bench:[20,32],vert:[30,40],broad:[112,128],cone:[6.70,7.30],shuttle:[4.10,4.45]},
  DT:  {forty:[4.80,5.30],bench:[24,40],vert:[25,35],broad:[100,118],cone:[7.10,7.90],shuttle:[4.30,4.80]},
  LB:  {forty:[4.42,4.80],bench:[18,30],vert:[30,40],broad:[112,128],cone:[6.70,7.30],shuttle:[4.05,4.40]},
  CB:  {forty:[4.28,4.55],bench:[10,20],vert:[34,44],broad:[120,136],cone:[6.40,7.00],shuttle:[3.90,4.25]},
  S:   {forty:[4.32,4.60],bench:[14,22],vert:[33,42],broad:[118,132],cone:[6.50,7.10],shuttle:[3.95,4.30]},
};

const COMBINE_LABELS={forty:'40-Yard Dash',bench:'Bench Press',vert:'Vertical Jump',broad:'Broad Jump',cone:'3-Cone Drill',shuttle:'20-Yd Shuttle'};
const COMBINE_UNITS={forty:'s',bench:' reps',vert:'"',broad:'"',cone:'s',shuttle:'s'};
const COMBINE_LOWER_BETTER={forty:true,cone:true,shuttle:true};

// All position groups run all 6 standard athletic tests at the NFL Combine.
// The only common exception: QBs rarely bench press 225 lbs.
// Individual players may opt out of any drill (injury, pro day preference).
const POS_DRILLS={
  QB:  {forty:true,bench:false,vert:true,broad:true,cone:true,shuttle:true},
  RB:  {forty:true,bench:true,vert:true,broad:true,cone:true,shuttle:true},
  WR:  {forty:true,bench:true,vert:true,broad:true,cone:true,shuttle:true},
  TE:  {forty:true,bench:true,vert:true,broad:true,cone:true,shuttle:true},
  OT:  {forty:true,bench:true,vert:true,broad:true,cone:true,shuttle:true},
  IOL: {forty:true,bench:true,vert:true,broad:true,cone:true,shuttle:true},
  EDGE:{forty:true,bench:true,vert:true,broad:true,cone:true,shuttle:true},
  DT:  {forty:true,bench:true,vert:true,broad:true,cone:true,shuttle:true},
  LB:  {forty:true,bench:true,vert:true,broad:true,cone:true,shuttle:true},
  CB:  {forty:true,bench:true,vert:true,broad:true,cone:true,shuttle:true},
  S:   {forty:true,bench:true,vert:true,broad:true,cone:true,shuttle:true},
};

// Prospect grade updates from combine, experts, news (apply delta to base grade)
const PROSPECT_UPDATES={
  'Sonny Styles':{delta:2,source:'2026 Combine — LB record 43.5" vert, 4.46 forty. Historic athlete.',date:'2026-02-26'},
  'Dillon Thieneman':{delta:3,source:'2026 Combine — 4.35 forty (4th fastest S), 41" vert, 1.52 10-yd split. Locked in 1st round.',date:'2026-02-27'},
  'Carnell Tate':{delta:-4,source:'2026 Combine — disappointing 4.53 forty. Bills GM Beane: "He\'s pretty slow." Skipped positional drills.',date:'2026-02-28'},
  'Kenyon Sadiq':{delta:2,source:'2026 Combine — TE record 4.39 forty, 43.5" vert, 11\'1" broad. Clear TE1.',date:'2026-02-27'},
  'Emmanuel McNeil-Warren':{delta:-3,source:'2026 Combine — 4.52 forty, inconsistent drills. Underwhelmed vs elite safety class.',date:'2026-02-27'},
  'Malachi Fields':{delta:-4,source:'2026 Combine — 4.61 forty + concentration drops in on-field drills. Stock down.',date:'2026-02-28'},
  'Omar Cooper Jr.':{delta:3,source:'2026 Combine — 4.42 forty. Daniel Jeremiah bumped to No. 19 on updated big board.',date:'2026-02-28'},
  'Arvell Reese':{delta:2,source:'2026 Combine — 4.47 forty, 6th best 10-yd split (1.58) all-time for edge rushers.',date:'2026-02-26'},
  'Jeremiyah Love':{delta:1,source:'2026 Combine — 4.36 forty at 214 lbs validated elite speed.',date:'2026-02-28'},
  'David Bailey':{delta:1,source:'2026 Combine — 4.50 forty. "Performed like a bona fide top-5 pick."',date:'2026-02-26'},
  'Rueben Bain Jr.':{delta:-2,source:'2026 Combine — 30 7/8" arms (4th shortest among edge rushers since 1999) raised ceiling concerns.',date:'2026-02-26'},
  'Eli Stowers':{delta:6,source:'2026 Combine — TE records: 45.5" vertical and 11\'3" broad jump. Both all-time records for TEs.',date:'2026-02-27'},
  'Mike Washington Jr.':{delta:5,source:'2026 Combine — 4.33 forty (fastest RB) at 223 lbs. Stock up to Day 2 consideration.',date:'2026-02-28'},
  'Deion Burks':{delta:5,source:'2026 Combine — 4.30 forty, 42.5" vert, 10\'11" broad. 3rd fastest overall at combine.',date:'2026-02-28'},
  'Zachariah Branch':{delta:4,source:'2026 Combine — 4.35 forty. NFL.com stock up to top-40 consideration.',date:'2026-02-28'},
};

// Expert consensus big board — UPDATED POST-2026 COMBINE (Feb 26 – Mar 1)
// Key movers: Sonny Styles ↑ top-5, Dillon Thieneman ↑ 1st round lock, Kenyon Sadiq ↑ TE record,
//             Carnell Tate ↓ (4.53 forty), Emmanuel McNeil-Warren ↓, Malachi Fields ↓ dropped.
// Sources: Kiper (ESPN), Jeremiah (NFL Network), Brugler (The Athletic), NFL.com big board
const EXPERT_CONSENSUS_BIG_BOARD=[
  'Fernando Mendoza','David Bailey','Sonny Styles','Arvell Reese','Caleb Downs','Keldric Faulk',
  'Jeremiyah Love','Francis Mauigoa','Spencer Fano','Rueben Bain Jr.','Kenyon Sadiq','Makai Lemon',
  'Mansoor Delane','Dillon Thieneman','Jermod McCoy','Peter Woods','Olaivavega Ioane','Omar Cooper Jr.',
  'Carnell Tate','Jordyn Tyson','Akheem Mesidor','Denzel Boston','Cashius Howell','CJ Allen',
  'Avieon Terrell','T.J. Parker','Monroe Freeling','Colton Hood','KC Concepcion','Caleb Lomu',
  'Kayden McDonald','Blake Miller'
];
function getExpertConsensusRank(name){
  const idx=EXPERT_CONSENSUS_BIG_BOARD.indexOf(name);
  return idx>=0?idx+1:999;
}
// Expert consensus pick at each slot (1-32) — for Compare view
function getExpertConsensusPickAtSlot(slot1Based){
  const idx=slot1Based-1;
  return EXPERT_CONSENSUS_BIG_BOARD[idx]||null;
}

// Historical NFL combine results for comparison (name, pos, year, team, forty, vert, broad, weight, cone, shuttle)
const HISTORICAL_COMBINE=[
  {name:'Nick Emmanwori',pos:'S',year:2025,team:'Seahawks',forty:4.38,vert:43,broad:138,weight:220,cone:null,shuttle:null},
  {name:'Isaiah Simmons',pos:'LB',year:2020,team:'Cardinals',forty:4.39,vert:39,broad:132,weight:238,cone:null,shuttle:null},
  {name:'Owen Pappoe',pos:'LB',year:2023,team:'Cardinals',forty:4.39,vert:35.5,broad:126,weight:225,cone:null,shuttle:null},
  {name:'Davis Tull',pos:'LB',year:2015,team:'Saints',forty:4.59,vert:42.5,broad:132,weight:246,cone:null,shuttle:null},
  {name:'Calvin Johnson',pos:'WR',year:2007,team:'Lions',forty:4.35,vert:42.5,broad:139,weight:239,cone:null,shuttle:null},
  {name:'DK Metcalf',pos:'WR',year:2019,team:'Seahawks',forty:4.33,vert:40.5,broad:134,weight:228,cone:7.38,shuttle:null},
  {name:'Micah Parsons',pos:'LB',year:2021,team:'Cowboys',forty:4.39,vert:34,broad:126,weight:246,cone:null,shuttle:null},
  {name:'Shaquem Griffin',pos:'LB',year:2018,team:'Seahawks',forty:4.38,vert:null,broad:117,weight:227,cone:null,shuttle:null},
  {name:'Tremaine Edmunds',pos:'LB',year:2018,team:'Bills',forty:4.54,vert:35.5,broad:122,weight:253,cone:null,shuttle:null},
  {name:'Devin White',pos:'LB',year:2019,team:'Buccaneers',forty:4.42,vert:39.5,broad:128,weight:237,cone:null,shuttle:null},
  {name:'Roquan Smith',pos:'LB',year:2018,team:'Bears',forty:4.51,vert:33.5,broad:113,weight:236,cone:null,shuttle:null},
  {name:'Fred Warner',pos:'LB',year:2018,team:'49ers',forty:4.64,vert:36.5,broad:118,weight:236,cone:null,shuttle:null},
  {name:'Derrick Henry',pos:'RB',year:2016,team:'Titans',forty:4.54,vert:37,broad:130,weight:247,cone:null,shuttle:null},
  {name:'Saquon Barkley',pos:'RB',year:2018,team:'Giants',forty:4.40,vert:41,broad:132,weight:233,cone:null,shuttle:null},
  {name:'Patrick Mahomes',pos:'QB',year:2017,team:'Chiefs',forty:4.80,vert:30,broad:114,weight:230,cone:null,shuttle:null},
  {name:'Josh Allen',pos:'QB',year:2018,team:'Bills',forty:4.75,vert:33.5,broad:119,weight:237,cone:null,shuttle:null},
];

// Position-specific on-field drills (what scouts actually watch at combine)
const POS_FIELD_DRILLS={
  QB:  ['Throwing drills (short/intermediate/deep)','Accuracy on the move','Footwork drops','Red zone throws','Scramble throws'],
  RB:  ['Pass-catching drills','Blitz pickup/pass protection','Agility gauntlet','Zone run footwork'],
  WR:  ['Route running (short/intermediate/deep)','Gauntlet catching','Contested catch','Release drills','Return skills'],
  TE:  ['Route running','Inline blocking','Detached blocking','Receiving drills'],
  OT:  ['Pass-set and kick-slide','Mirror drill','Run-block footwork','Pull and lead','Combo blocks'],
  IOL: ['Pass-set and kick-slide','Mirror drill','Run-block footwork','Pull and lead','Combo blocks'],
  EDGE:['Get-off and speed rush','Bull rush/power','Pass-rush counters','Run defense hands','Drop into coverage'],
  DT:  ['Get-off and penetration','Two-gap run defense','Pass-rush hands','Bull rush/swim','Lateral movement'],
  LB:  ['Coverage (man and zone)','Blitz timing','Open-field tackling','Block shedding','Drop drills'],
  CB:  ['Backpedal and break','Press and re-route','Transition drills','Ball drills','Tackling'],
  S:   ['Backpedal and break','Robber/cover-2 deep','Box run support','Blitz timing','Ball-hawking drills'],
};

// ===== TRADE VALUE CHART (simplified Jimmy Johnson) =====
function getPickValue(overall){
  if(overall<=0) return 3000;
  return Math.round(3000*Math.pow(0.985,overall-1));
}

// ===== 32 NFL TEAMS =====
const TEAMS=[
  {abbr:'LV',name:'Las Vegas Raiders',color:'#a5acaf',needs:['QB','OL','WR','CB','EDGE'],
   tendency:{bpa:0.3,posPrefs:['QB','WR'],conf:'Big Ten',tradeUp:true}},
  {abbr:'NYJ',name:'New York Jets',color:'#125740',needs:['QB','CB','WR','DL','OL'],
   tendency:{bpa:0.4,posPrefs:['QB','EDGE'],conf:'SEC',tradeUp:true}},
  {abbr:'ARI',name:'Arizona Cardinals',color:'#97233f',needs:['QB','OL','EDGE','S','DL'],
   tendency:{bpa:0.3,posPrefs:['QB','OL'],conf:'Big 12',tradeUp:false}},
  {abbr:'TEN',name:'Tennessee Titans',color:'#4b92db',needs:['WR','OL','EDGE','CB','DL'],
   tendency:{bpa:0.5,posPrefs:['OL','EDGE'],conf:'SEC',tradeUp:false}},
  {abbr:'NYG',name:'New York Giants',color:'#0b2265',needs:['WR','OL','CB','EDGE','QB'],
   tendency:{bpa:0.3,posPrefs:['WR','EDGE'],conf:'Big Ten',tradeUp:true}},
  {abbr:'CLE',name:'Cleveland Browns',color:'#311d00',needs:['WR','QB','OL','EDGE','CB'],
   tendency:{bpa:0.4,posPrefs:['QB','OL'],conf:'SEC',tradeUp:false}},
  {abbr:'WAS',name:'Washington Commanders',color:'#5a1414',needs:['OL','DL','EDGE','CB','LB'],
   tendency:{bpa:0.5,posPrefs:['DL','OL'],conf:'ACC',tradeUp:false}},
  {abbr:'NO',name:'New Orleans Saints',color:'#d3bc8d',needs:['QB','WR','OL','CB','DL'],
   tendency:{bpa:0.4,posPrefs:['QB','WR'],conf:'SEC',tradeUp:true}},
  {abbr:'KC',name:'Kansas City Chiefs',color:'#e31837',needs:['WR','OL','EDGE','CB','DL'],
   tendency:{bpa:0.6,posPrefs:['WR','CB'],conf:'Big 12',tradeUp:false}},
  {abbr:'CIN',name:'Cincinnati Bengals',color:'#fb4f14',needs:['OL','DL','EDGE','CB','LB'],
   tendency:{bpa:0.5,posPrefs:['OL','EDGE'],conf:'Big Ten',tradeUp:false}},
  {abbr:'MIA',name:'Miami Dolphins',color:'#008e97',needs:['QB','OL','EDGE','S','LB'],
   tendency:{bpa:0.4,posPrefs:['QB','OL'],conf:'ACC',tradeUp:true}},
  {abbr:'DAL',name:'Dallas Cowboys',color:'#003594',needs:['OL','DL','EDGE','WR','CB'],
   tendency:{bpa:0.5,posPrefs:['OL','DL'],conf:'Big 12',tradeUp:false}},
  {abbr:'ATL',name:'Atlanta Falcons',color:'#a71930',needs:['EDGE','DL','OL','S','CB'],
   tendency:{bpa:0.4,posPrefs:['EDGE','CB'],conf:'SEC',tradeUp:true}},
  {abbr:'BAL',name:'Baltimore Ravens',color:'#241773',needs:['OL','WR','CB','EDGE','S'],
   tendency:{bpa:0.7,posPrefs:['EDGE','OL'],conf:'ACC',tradeUp:false}},
  {abbr:'TB',name:'Tampa Bay Buccaneers',color:'#d50a0a',needs:['DL','OL','EDGE','S','CB'],
   tendency:{bpa:0.5,posPrefs:['DL','S'],conf:'SEC',tradeUp:false}},
  {abbr:'IND',name:'Indianapolis Colts',color:'#002c5f',needs:['WR','OL','CB','EDGE','DL'],
   tendency:{bpa:0.4,posPrefs:['WR','OL'],conf:'Big Ten',tradeUp:true}},
  {abbr:'DET',name:'Detroit Lions',color:'#0076b6',needs:['CB','EDGE','DL','OL','S'],
   tendency:{bpa:0.6,posPrefs:['EDGE','CB'],conf:'Big Ten',tradeUp:false}},
  {abbr:'MIN',name:'Minnesota Vikings',color:'#4f2683',needs:['OL','EDGE','S','DL','CB'],
   tendency:{bpa:0.5,posPrefs:['OL','CB'],conf:'Big Ten',tradeUp:false}},
  {abbr:'CAR',name:'Carolina Panthers',color:'#0085ca',needs:['OL','WR','EDGE','DL','CB'],
   tendency:{bpa:0.4,posPrefs:['OL','WR'],conf:'ACC',tradeUp:false}},
  {abbr:'GB',name:'Green Bay Packers',color:'#203731',needs:['DL','EDGE','OL','S','CB'],
   tendency:{bpa:0.7,posPrefs:['DL','EDGE'],conf:'Big Ten',tradeUp:false}},
  {abbr:'PIT',name:'Pittsburgh Steelers',color:'#ffb612',needs:['WR','OL','CB','EDGE','DL'],
   tendency:{bpa:0.6,posPrefs:['WR','OL'],conf:'ACC',tradeUp:false}},
  {abbr:'LAC',name:'Los Angeles Chargers',color:'#0080c6',needs:['EDGE','OL','WR','DL','CB'],
   tendency:{bpa:0.5,posPrefs:['EDGE','OL'],conf:'Pac-12',tradeUp:false}},
  {abbr:'PHI',name:'Philadelphia Eagles',color:'#004c54',needs:['CB','EDGE','LB','S','DL'],
   tendency:{bpa:0.6,posPrefs:['CB','EDGE'],conf:'SEC',tradeUp:true}},
  {abbr:'JAX',name:'Jacksonville Jaguars',color:'#006778',needs:['OL','WR','CB','EDGE','DL'],
   tendency:{bpa:0.4,posPrefs:['OL','EDGE'],conf:'SEC',tradeUp:false}},
  {abbr:'CHI',name:'Chicago Bears',color:'#0b162a',needs:['OL','WR','EDGE','DL','CB'],
   tendency:{bpa:0.5,posPrefs:['OL','WR'],conf:'Big Ten',tradeUp:false}},
  {abbr:'BUF',name:'Buffalo Bills',color:'#00338d',needs:['WR','OL','DL','EDGE','CB'],
   tendency:{bpa:0.6,posPrefs:['WR','DL'],conf:'ACC',tradeUp:false}},
  {abbr:'SF',name:'San Francisco 49ers',color:'#aa0000',needs:['WR','OL','CB','S','EDGE'],
   tendency:{bpa:0.5,posPrefs:['WR','CB'],conf:'Pac-12',tradeUp:true}},
  {abbr:'HOU',name:'Houston Texans',color:'#03202f',needs:['OL','EDGE','CB','DL','WR'],
   tendency:{bpa:0.5,posPrefs:['OL','EDGE'],conf:'SEC',tradeUp:false}},
  {abbr:'LAR',name:'Los Angeles Rams',color:'#003594',needs:['OL','CB','EDGE','S','WR'],
   tendency:{bpa:0.4,posPrefs:['OL','CB'],conf:'Pac-12',tradeUp:true}},
  {abbr:'DEN',name:'Denver Broncos',color:'#fb4f14',needs:['OL','EDGE','WR','CB','DL'],
   tendency:{bpa:0.5,posPrefs:['OL','EDGE'],conf:'Pac-12',tradeUp:false}},
  {abbr:'NE',name:'New England Patriots',color:'#002244',needs:['WR','OL','CB','EDGE','DL'],
   tendency:{bpa:0.7,posPrefs:['OL','CB'],conf:'Big Ten',tradeUp:false}},
  {abbr:'SEA',name:'Seattle Seahawks',color:'#002244',needs:['OL','EDGE','DL','RB','CB','LB'],
   tendency:{bpa:0.5,posPrefs:['OL','EDGE'],conf:'Pac-12',tradeUp:false}},
];

// Conference mapping for schools (for tendency matching)
const SCHOOL_CONF={
  'Indiana':'Big Ten','Notre Dame':'Independent','Texas Tech':'Big 12','Ohio State':'Big Ten',
  'Miami':'ACC','LSU':'SEC','USC':'Pac-12','Penn State':'Big Ten','Tennessee':'SEC','Utah':'Big 12',
  'Toledo':'MAC','Oregon':'Big Ten','Arizona State':'Big 12','Washington':'Big Ten',
  'Texas A&M':'SEC','Georgia':'SEC','Clemson':'ACC','Alabama':'SEC','Auburn':'SEC',
  'Oklahoma':'SEC','Cincinnati':'Big 12','Missouri':'SEC','Notre Dame':'Independent',
  'South Carolina':'SEC','Florida':'SEC','Texas':'SEC','Louisville':'ACC',
  'Ole Miss':'SEC','West Virginia':'Big 12','Michigan':'Big Ten','Stanford':'ACC',
  'Florida State':'ACC','Wisconsin':'Big Ten','Iowa':'Big Ten','Michigan State':'Big Ten',
  'UCLA':'Big Ten','Virginia Tech':'ACC','North Carolina':'ACC','Mississippi State':'SEC',
  'TCU':'Big 12','Baylor':'Big 12','Kansas State':'Big 12','Pittsburgh':'ACC',
  'NC State':'ACC','Maryland':'Big Ten','Arkansas':'SEC','Kentucky':'SEC',
  'Minnesota':'Big Ten','Illinois':'Big Ten','Purdue':'Big Ten','Nebraska':'Big Ten',
  'Colorado':'Big 12','Arizona':'Big 12','BYU':'Big 12','Iowa State':'Big 12',
  'Oregon State':'Pac-12','Washington State':'Pac-12','SMU':'ACC','UCF':'Big 12',
  'Houston':'Big 12','Fresno State':'MWC','San Diego State':'MWC','Boise State':'MWC',
  'Memphis':'AAC','Tulane':'AAC','Liberty':'CUSA','App State':'Sun Belt',
  'Coastal Carolina':'Sun Belt','James Madison':'Sun Belt','Marshall':'Sun Belt',
  'Georgia Tech':'ACC','Duke':'ACC','Wake Forest':'ACC','Syracuse':'ACC',
  'Boston College':'ACC','Virginia':'ACC','Rutgers':'Big Ten',
  'Northwestern':'Big Ten','Vanderbilt':'SEC',
};

// ===== 2026 NFL DRAFT ORDER =====
// Round 1 pick order based on 2025 season records (worst → best).
// Teams without a R1 pick (traded away): ATL, GB, IND, JAX
// Teams with 2 R1 picks: NYJ (picks 2+16 via IND), DAL (picks 12+20 via GB),
//                        LAR (picks 13 via ATL + pick 28), KC (picks 9+31)
// CLE also holds JAX's R1 pick — reflected in their early slot.
const ROUND1_PICKS=[
  'LV','NYJ','ARI','TEN','NYG','CLE','WAS','NO','KC','CIN',
  'MIA','DAL','LAR','BAL','TB','NYJ','DET','MIN','CAR','DAL',
  'PIT','LAC','PHI','CHI','BUF','SF','HOU','LAR','DEN','NE','KC','SEA'
];

// ===== REAL PROSPECTS (Top 75+) =====
const TOP_PROSPECTS=[
{name:'Fernando Mendoza',pos:'QB',school:'Indiana',grade:97,height:'6-5',weight:225,
 bio:'Mendoza is a very accurate thrower with excellent size, toughness and athleticism. He operates well out of shotgun and leans heavily on the RPO game with fast hands and good decisions. His size, arm talent and competitive nature draw comparisons to Matt Ryan.',
 strengths:['Elite arm talent and accuracy on all three levels','Extremely tough — absorbs big hits in the pocket','Excellent size at 6-5, 225 with enough athleticism','Clutch performer in big moments'],
 weaknesses:['Holds the ball too long hunting big plays','Limited experience outside RPO-heavy system','Needs to improve anticipation on NFL throws'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Jeremiyah Love',pos:'RB',school:'Notre Dame',grade:94,height:'6-0',weight:214,
 bio:'Love is a dynamic weapon as a runner and receiver. He explodes to and through the hole with elite speed to capture the corner. His 4.36 forty at the 2026 Combine validated his elite speed — one analyst called him "#1 overall player on the board." Electric spin move and rare ability to make defenders miss.',
 strengths:['Official 4.36 forty (2nd fastest RB at combine)','Home run hitter who can score from anywhere','Exceptional receiver — 64 career catches','Electric spin move and elusiveness'],
 weaknesses:['Runs high and narrow on inside runs','Doesn\'t always let blocks develop','Pass protection still developing'],
 combine:{forty:4.36,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'David Bailey',pos:'EDGE',school:'Texas Tech',grade:95,height:'6-4',weight:252,
 bio:'Bailey is an ultra-explosive edge rusher with outstanding production. His 4.50 forty and 10\'9" broad jump at the 2026 Combine drew raves — scouts said he "performed like a bona fide top-5 pick." His game is all about get-off and winning early in the down with a devastating dip/rip move.',
 strengths:['Official 4.50 forty — elite get-off confirmed','Elite speed-to-power conversion','Devastating dip/rip and inside spin','Outstanding production vs quality competition'],
 weaknesses:['Inconsistent against the run','Can struggle holding point of attack','Speed-to-power still developing'],
 combine:{forty:4.50,bench:null,vert:35,broad:129,cone:null,shuttle:null,_status:'official'}},
{name:'Arvell Reese',pos:'EDGE',school:'Ohio State',grade:95,height:'6-4',weight:243,
 bio:'Reese is a fluid and explosive athlete Ohio State used as a chess piece. His 4.47 forty at the 2026 Combine featured the 6th best 10-yard split (1.58) all-time among edge rushers, confirming elite first-step explosion. He projects as a top-5 pass rusher with elite speed, bend and the ability to overpower blockers.',
 strengths:['Official 4.47 forty — 6th best 10-yd split all-time for EDGE','Versatile — plays multiple positions','Matches and mirrors TEs/RBs in coverage','Elite chase speed from the back side'],
 weaknesses:['Lacks a fully polished rush plan','Can be late off the snap','Still learning consistent leverage'],
 combine:{forty:4.47,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Sonny Styles',pos:'LB',school:'Ohio State',grade:94,height:'6-5',weight:244,
 bio:'Styles is a tall, long and rangy linebacker who transitioned from safety. Historic 2026 Combine: 43.5" vertical (best ever for LB), 4.46 forty (fastest among LBs), 11\'2" broad jump. Elite athlete with Fred Warner-level instincts. Now in top-5 conversation.',
 strengths:['Historic combine — 43.5" vert, 4.46 forty, 11\'2" broad','Outstanding coverage — carries slot WRs and mirrors TEs','Explosive blitzer who overwhelms RBs','Elite range and instincts vs the run'],
 weaknesses:['Still refining play strength at POA','Less experience reading run keys','Can get caught when blocks arrive quickly'],
 combine:{forty:4.46,bench:null,vert:43.5,broad:134,cone:7.09,shuttle:4.26,_status:'official'}},
{name:'Rueben Bain Jr.',pos:'EDGE',school:'Miami',grade:94,height:'6-2',weight:255,
 bio:'Bain is a thick, square edge rusher whose tape is littered with disruption. At the 2026 Combine he skipped athletic testing but measured at just 30 7/8" arm length — 4th shortest among edge rushers since 1999 — raising legitimate ceiling questions vs long-armed NFL tackles. He wins with leverage, power and an unrelenting motor.',
 strengths:['Wins with leverage, power and polish','Nasty chop/rip and Euro step moves','Ragdolls TEs with unrelenting motor','Takes over games in big moments'],
 weaknesses:['30 7/8" arms — 4th shortest EDGE since 1999 (ceiling concern)','Lacks elite get-off speed','Not a dynamic athlete in space'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Carnell Tate',pos:'WR',school:'Ohio State',grade:93,height:'6-2',weight:195,
 bio:'Tate is a tall, long wideout with outstanding tape but his 4.53 forty at the 2026 Combine was a significant disappointment. Bills GM Brandon Beane said "He\'s pretty slow." He also skipped positional drills. His pro day will be crucial. Strong hands and beautiful deep-ball tracking remain elite.',
 strengths:['Excellent vertical threat who tracks deep balls','Strong hands and reliable in traffic','Outstanding suddenness to beat press','Extra gear when ball is in the air'],
 weaknesses:['4.53 forty raised serious speed questions — stock down','Skipped positional drills at combine (pro day critical)','Not exceptionally dynamic after catch'],
 combine:{forty:4.53,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Mansoor Delane',pos:'CB',school:'LSU',grade:93,height:'6-1',weight:190,
 bio:'Delane is one of the most consistent players in the class. Extremely loose and fluid in coverage with the tools to match up with every style of receiver.',
 strengths:['Elite fluidity and change of direction','Adept at press with re-route and mirror','Physical, reliable tackler in run support','Instinctive in zone with outstanding awareness'],
 weaknesses:['Could be more aggressive with ball production','Doesn\'t create many turnovers','Can be slow reacting to double moves'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Caleb Downs',pos:'S',school:'Ohio State',grade:94,height:'6-0',weight:205,
 bio:'Downs is a versatile safety with outstanding instincts. Excels against the run, dependable tackler, handles communication. Coaches rave about his intelligence and leadership.',
 strengths:['Versatile — nickel, strong safety, box','Outstanding instincts and intelligence','Excellent blitzer with timing and feel','Plug-and-play starter who elevates others'],
 weaknesses:['Lacks elite "wow" athletic traits','Limited ball production — 6 career INTs','Doesn\'t have true center-field range'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Makai Lemon',pos:'WR',school:'USC',grade:92,height:'5-11',weight:195,
 bio:'Lemon is a wideout with a running back\'s body and linebacker\'s temperament. Wins with quickness, understands tempo, ultra-competitive after the catch. Amon-Ra St. Brown comparisons are warranted.',
 strengths:['Outstanding slot receiver with elite quickness','Plays bigger than 5-11 — wins contested catches','Ultra-competitive after catch, breaks tackles','Complete route runner with zone feel'],
 weaknesses:['Limited size may hurt outside','Not a true deep threat','Could struggle vs elite press'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Olaivavega Ioane',pos:'IOL',school:'Penn State',grade:92,height:'6-3',weight:315,
 bio:'Ioane was a dominant left guard with a thick build and outstanding strength. In the run game he latches, runs his feet and finishes. Tremendous upper torque.',
 strengths:['Outstanding strength and power at POA','Tremendous upper torque to toss defenders','Excellent awareness on stunts and games','Dominant run blocker with nasty temperament'],
 weaknesses:['Occasionally loses against speed','Limited to guard — no tackle versatility','Needs to improve lateral mobility'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Francis Mauigoa',pos:'OT',school:'Miami',grade:91,height:'6-5',weight:320,
 bio:'Mauigoa is a big, powerful right tackle with a massive lower body and firm base. Patient with his punch, strong hands to steer and control. Immediately dominant in the run game.',
 strengths:['Massive lower body provides elite anchor','Can uproot and displace in run game','Fluid mover with strong controlling hands','Projects as dominant run blocker'],
 weaknesses:['Average foot quickness out of stance','Struggles redirecting at second level','Needs refinement vs speed rushers'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Jermod McCoy',pos:'CB',school:'Tennessee',grade:91,height:'6-0',weight:188,
 bio:'McCoy had an outstanding 2024 season but missed 2025 with an ACL tear. At his best in press coverage with elite ball skills and ability to elevate.',
 strengths:['Elite press technique with excellent balance','Outstanding ball skills — elevates and makes plays','Good speed and recovery to mirror','Sets traps in zone with sink-and-recover'],
 weaknesses:['Coming off torn ACL — missed full 2025','Lacks physicality in run support','Struggled vs Jeremiah Smith in playoff game'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Spencer Fano',pos:'OT',school:'Utah',grade:91,height:'6-5',weight:315,
 bio:'Fano measured at 6\'6", 302 lbs at the 2026 Combine with a 4.91 forty. Excellent size, strength and quickness. Easily covers up speed rushers and stalls bull rushers with core strength. Outstanding play temperament and consistently regarded as a top OT prospect.',
 strengths:['Quick to cover up speed rushers','Excellent core strength and knee bend','Explosive run blocker who latches and dumps','Quick to climb and wall off LBs'],
 weaknesses:['4.91 forty — average lateral quickness for OT at his size','Occasionally oversets vs inside counters','Still developing as a pass protector'],
 combine:{forty:4.91,bench:null,vert:32,broad:111,cone:7.34,shuttle:4.67,_status:'official'}},
{name:'Emmanuel McNeil-Warren',pos:'S',school:'Toledo',grade:90,height:'6-2',weight:210,
 bio:'McNeil-Warren is a tall safety with fantastic production. At the 2026 Combine he ran a 4.52 forty with a 35.5" vertical and inconsistent drills — his athletic profile didn\'t stand out among an elite safety class. Stock down. His small-school tape still flashes Pro Bowl potential.',
 strengths:['Outstanding ball production and playmaking on tape','Physical striker with big hits vs run','Fluid change of direction in coverage','Versatile deep/box role'],
 weaknesses:['2026 Combine — 4.52 forty underwhelmed (stock down)','Inconsistent drill performance vs elite safety class','Small-school competition questions'],
 combine:{forty:4.52,bench:null,vert:35.5,broad:122,cone:null,shuttle:null,_status:'official'}},
{name:'Kenyon Sadiq',pos:'TE',school:'Oregon',grade:90,height:'6-2',weight:245,
 bio:'Sadiq broke the all-time NFL Combine record for tight ends with a 4.39 forty — surpassing Vernon Davis\'s 4.40 from 2006. He added a 43.5" vertical and 11\'1" broad jump. He is the clear TE1 in this class and a top-20 pick. Explosive release and rare speed at the position.',
 strengths:['2026 Combine TE record — 4.39 forty (surpassed Vernon Davis)','43.5" vertical and 11\'1" broad jump — elite combine trio','Dynamic run-after-catch on screens','Versatile alignment — attached, slot, backfield'],
 weaknesses:['Lacks ideal height for TE','Inconsistent hands — concentration drops','Skipped on-field drills after testing (some scouts noted concern)'],
 combine:{forty:4.39,bench:null,vert:43.5,broad:133,cone:null,shuttle:null,_status:'official'}},
{name:'Jordyn Tyson',pos:'WR',school:'Arizona State',grade:90,height:'6-1',weight:195,
 bio:'Tyson is an explosive receiver with fluid movement and creative route-running. Tracks deep balls with ease and can hover waiting for the ball.',
 strengths:['Elite deep-ball tracking','Fluid with creative route-running','Outstanding acceleration when ball is in air','Effective after catch with wiggle and speed'],
 weaknesses:['Durability issues throughout college','Slight frame — may need more mass','Inconsistent against physical press'],
 combine:{forty:null,bench:26,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Denzel Boston',pos:'WR',school:'Washington',grade:89,height:'6-3',weight:210,
 bio:'Boston is a big-framed wideout with exceptional ball skills. Huge catch radius, plays above the rim in the red zone. Courtland Sutton comparisons.',
 strengths:['Outstanding ball winner with huge catch radius','Physical after the catch','Red zone weapon who plays above the rim','Powers through press coverage'],
 weaknesses:['Lacks elite separation speed','Not a dynamic route runner underneath','Relies more on physicality than finesse'],
 combine:{forty:4.45,bench:null,vert:35,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Omar Cooper Jr.',pos:'WR',school:'Indiana',grade:89,height:'6-1',weight:200,
 bio:'Cooper ran a 4.42 forty at the 2026 Combine and earned a bump into Daniel Jeremiah\'s top-20 (No. 19). Strong, reliable and fearless over the middle — his game-winner vs Penn State exemplifies his competitive DNA. Fernando Mendoza\'s top target at Indiana.',
 strengths:['2026 Combine — 4.42 forty; Jeremiah ranked No. 19 post-combine','Fearless over the middle — combat catches','Power to break tackles after catch','Elevates and wins contested catches'],
 weaknesses:['Not an elite separator','Limited deep-threat ability','Needs more consistency in releases'],
 combine:{forty:4.42,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Akheem Mesidor',pos:'EDGE',school:'Miami',grade:89,height:'6-3',weight:265,
 bio:'Mesidor was highly productive with ideal frame, relentless motor and pass-rush instincts. His game is about power — shakes, bulls, pushes and pulls for pressures.',
 strengths:['Powerful shake/bull move off the edge','Relentless motor and hand usage','Ideal frame and length','Dominant vs TEs in run defense'],
 weaknesses:['Lacks elite burst and speed','Can\'t consistently win with speed','Needs wider pass-rush repertoire'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Cashius Howell',pos:'EDGE',school:'Texas A&M',grade:88,height:'6-2',weight:248,
 bio:'Howell impressed at the 2026 Combine with a 4.59 forty despite his compact frame — validators of his elite twitch. Undersized but with outstanding tenacity and production. Wins with speed, power or instinctive counters. Plays with violence and awareness.',
 strengths:['2026 Combine — 4.59 forty at 248 lbs validates elite twitch','Outstanding twitch and counters','Explosive gap shooter vs the run','Plays with violence and high effort'],
 weaknesses:['Undersized — lacks ideal length','May struggle at POA vs bigger tackles','Needs to prove game translates without ideal size'],
 combine:{forty:4.59,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'CJ Allen',pos:'LB',school:'Georgia',grade:88,height:'6-1',weight:235,
 bio:'Allen is productive and intelligent, plays bigger than his size. Explosive striker with high tackling batting average. Georgia staff raves about his character and leadership.',
 strengths:['Outstanding run-game instincts and effort','Explosive striker with reliable tackling','Instinctive zone dropper','Elite character and leadership'],
 weaknesses:['Tightness shows up in man coverage','Doesn\'t have elite sideline-to-sideline range','Needs to improve shedding OL blocks'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Dillon Thieneman',pos:'S',school:'Oregon',grade:88,height:'6-1',weight:205,
 bio:'Thieneman\'s 2026 Combine performance locked in his first-round status. He ran a 4.35 forty (4th fastest safety), posted a 41" vertical, and had a 1.52 10-yard split. Multiple analysts now project him as a top-20 pick. The tape-to-testing translation is elite — a versatile chess piece in any scheme.',
 strengths:['2026 Combine — 4.35 forty (4th fastest S), 41" vert, 1.52 10-yd split','Locked in as first-round pick post-combine','Fluid change of direction in slot','Trusts eyes and explodes into the alley'],
 weaknesses:['Occasional fly-by missed tackles','Doesn\'t always break down in open field','Could be more physical at POA'],
 combine:{forty:4.35,bench:null,vert:41,broad:125,cone:null,shuttle:null,_status:'official'}},
{name:'Blake Miller',pos:'OT',school:'Clemson',grade:87,height:'6-6',weight:318,
 bio:'Miller is an iron man — 54 starts at RT. High school wrestler with ideal size, length and strength. His 5.18 forty at the 2026 Combine was below average for tackles but acceptable given his 6\'6", 317 lb frame. Latches and controls with strong hands. An anchor RT at the next level.',
 strengths:['Ideal size and length for NFL RT','Strong hands that latch and control','Can sink and anchor vs power','Outstanding experience — 54 starts'],
 weaknesses:['5.18 forty — limited athleticism for LT consideration','Struggles to redirect in space','Limited left tackle upside'],
 combine:{forty:5.18,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Monroe Freeling',pos:'OT',school:'Georgia',grade:87,height:'6-6',weight:310,
 bio:'Freeling has ideal size, bend and agility for LT. Quick out of stance, bends easily and redirects vs counters. Excels on combo blocks. Playing his best late in the year.',
 strengths:['Ideal size and agility for LT','Excellent combo blocker','Smooth redirection vs counters','High upside with room to improve'],
 weaknesses:['Needs to add core strength','Gets tugged when defenders reach his chest','Battled injuries in 2025'],
 combine:{forty:4.93,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Colton Hood',pos:'CB',school:'Tennessee',grade:87,height:'5-11',weight:190,
 bio:'Hood has excellent play speed and toughness. Patient in press, fluid to turn and mirror. Consistently in position and willing vs the run.',
 strengths:['Excellent play speed and fluid COD','Patient and balanced in press','Physical and reliable tackler','Consistently in position on deep routes'],
 weaknesses:['Average size may limit outside matchups','Gets grabby when ball is in the air','Limited ball production'],
 combine:{forty:4.44,bench:null,vert:40.5,broad:125,cone:null,shuttle:null,_status:'official'}},
{name:'Lee Hunter',pos:'DT',school:'Texas Tech',grade:86,height:'6-2',weight:315,
 bio:'Hunter is a thick, wide-bodied DT dominant against the run. Can bend and leverage single blocks then chuck them aside. Dominant in CFP game vs Oregon.',
 strengths:['Dominant run defender at POA','Outstanding lateral range for size','High floor as run stuffer','Elite potential shown in CFP game'],
 weaknesses:['Raw as a pass rusher — too upright','Needs to improve get-off on passing downs','Limited pass-rush plan'],
 combine:{forty:null,bench:null,vert:21.5,broad:100,cone:null,shuttle:null,_status:'official'}},
{name:'Keldric Faulk',pos:'EDGE',school:'Auburn',grade:91,height:'6-5',weight:265,
 bio:'Faulk is a long, versatile edge defender with ideal size and frame for the NFL. He skipped the 40-yard dash at the combine but posted a 35" vertical and 9\'9" broad jump in athletic testing and impressed in on-field drills. His length, energy and character have made him a consensus top-12 prospect.',
 strengths:['Ideal frame and length for NFL edge','Loose, fluid — plays multiple positions','Outstanding run defense holding POA','High motor with relentless effort'],
 weaknesses:['Skipped the 40-yard dash (pro day will matter)','Needs more polished pass-rush plan','Bend around the arc could improve'],
 combine:{forty:null,bench:null,vert:35,broad:117,cone:null,shuttle:null,_status:'official'}},
{name:'Kadyn Proctor',pos:'OT',school:'Alabama',grade:86,height:'6-7',weight:335,
 bio:'Proctor is enormous with excellent feet for his size. Can uncoil hips and displace defenders. Highest upside of any blocker in the class.',
 strengths:['Massive frame with rare athleticism','Uncoils hips to displace in run game','Agile enough to play tackle at 6-7, 335','Highest upside blocker in the class'],
 weaknesses:['Needs to manage weight','Occasionally reacts late off snap','Can be beaten by quick inside moves'],
 combine:{forty:5.21,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Avieon Terrell',pos:'CB',school:'Clemson',grade:85,height:'5-10',weight:185,
 bio:'Terrell skipped the 40 at the combine but posted a 34" vertical and 10\'3" broad jump and impressed in on-field drills. Projects best as an NFL nickel with feisty, competitive instincts. Stellar blitzer with quick feet and smooth COD.',
 strengths:['Elite quickness and COD for slot','Aggressive and physical in run support','Stellar blitzer with timing','Impressive combine on-field drills'],
 weaknesses:['Undersized — projects as nickel only','Struggles outside on go balls','Gets walled off by bigger WRs'],
 combine:{forty:null,bench:null,vert:34,broad:123,cone:null,shuttle:null,_status:'official'}},
{name:'Caleb Lomu',pos:'OT',school:'Utah',grade:85,height:'6-6',weight:305,
 bio:'Lomu has an ideal frame with room to add weight. Stays square, reworks hands well, excellent awareness vs stunts.',
 strengths:['Ideal frame with room for growth','Excellent awareness vs stunts/games','Stays square and reworks hands','Outstanding technique and fundamentals'],
 weaknesses:['Lacks knock-back power in run game','Needs to add significant core strength','Plays a bit upright in pass pro'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'T.J. Parker',pos:'EDGE',school:'Clemson',grade:85,height:'6-4',weight:260,
 bio:'Parker had 11 sacks in 2024 but production dropped to 5 in 2025. At the 2026 Combine he ran a 4.68 forty with a 34" vertical and 10\'0" broad jump — respectable but not elite. Rugged pass rusher with powerful shake/bull. Strong Senior Bowl performance keeps him in day-2 range.',
 strengths:['Powerful shake/bull off the edge','Versatile — rushes inside over guards','Generates knock-back power at POA','Strong Senior Bowl showing'],
 weaknesses:['Production dropped significantly in 2025','4.68 forty — lacks elite burst outside','Not dynamic in space'],
 combine:{forty:4.68,bench:null,vert:34,broad:120,cone:null,shuttle:null,_status:'official'}},
{name:'KC Concepcion',pos:'WR',school:'Texas A&M',grade:84,height:'6-0',weight:185,
 bio:'Concepcion has elite burst and speed that jumps off the screen. Dynamic with ball in hands, immediate catch-to-run transition.',
 strengths:['Elite burst and speed off snap','Dynamic run-after-catch','Immediate catch-to-run transition','Creates massive separation'],
 weaknesses:['Inconsistent hands — concentration drops','Undersized frame','Needs to be more dependable catcher'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Max Iheanachor',pos:'OT',school:'Arizona State',grade:84,height:'6-6',weight:320,
 bio:'Iheanachor is raw but talented. Moved from Nigeria at 13, didn\'t play football until JuCo. Tape full of clues he could be one of the best OL in this class.',
 strengths:['Raw tools suggest elite potential','Explosive with knock-back power in run','Athletic on pulls and second-level','Rapid development from JuCo'],
 weaknesses:['Very raw technique — late to punch','Lacks polish in pass protection','Limited football experience'],
 combine:{forty:4.91,bench:null,vert:null,broad:115,cone:null,shuttle:null,_status:'official'}},
{name:'Kayden McDonald',pos:'DT',school:'Ohio State',grade:84,height:'6-3',weight:310,
 bio:'McDonald has excellent size and strength. At his best against the run — presses out blocks with violent torque. Firm and stout guard to guard.',
 strengths:['Excellent size and strength','Presses out blocks with violent torque','Reliable and stout guard to guard','Steady, dependable presence'],
 weaknesses:['Not a lateral chase player','Lacks twitch as a pass rusher','Limited ceiling — more role player'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Caleb Banks',pos:'DT',school:'Florida',grade:83,height:'6-4',weight:295,
 bio:'Banks measured at 6\'6", 327 lbs at the 2026 Combine with the longest wingspan among DTs since 1999. He ran a 5.04 forty. Elite size and length. Impressive 2024 tape but missed most of 2025 with broken foot. When healthy and motivated, he can be a game-wrecking interior force.',
 strengths:['Longest wingspan among DTs since 1999 at combine','Athletic with excellent length for the position','Twitch in hands and feet as rusher','Elite flashes when fully motivated'],
 weaknesses:['5.04 forty — average athleticism for DT','Injury — broken foot limited all of 2025','Frustratingly inconsistent effort'],
 combine:{forty:5.04,bench:null,vert:32,broad:114,cone:null,shuttle:null,_status:'official'}},
{name:'Brandon Cisse',pos:'CB',school:'South Carolina',grade:83,height:'6-1',weight:185,
 bio:'Cisse is fast and twitchy with vision to close space and make plays. Loose and fluid, will likely rise through the spring.',
 strengths:['Elite speed and closing ability','Loose, fluid athlete','Plays with vision to read QB','Projects to improve with NFL coaching'],
 weaknesses:['Not physical in press','Lacks run support aggression','Focus issues lead to inconsistency'],
 combine:{forty:null,bench:null,vert:41,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Peter Woods',pos:'DT',school:'Clemson',grade:88,height:'6-2',weight:300,
 bio:'Woods has fabulous quickness and violent hands. Holds POA with leverage and lower-body strength. Lateral range outside the tackle box. A consensus first-round interior disruptor.',
 strengths:['Fabulous quickness for his size','Violent hands that jolt blockers','Outstanding lateral range for DT','Holds POA with leverage'],
 weaknesses:['Not consistent game to game','Gets wiped on down blocks','Lack of length exposes his chest'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'R Mason Thomas',pos:'EDGE',school:'Oklahoma',grade:83,height:'6-2',weight:250,
 bio:'Thomas is instinctive and physical. Covers ground with first three steps, multiple ways to win. Maniacal energy despite drawing extra blockers.',
 strengths:['Outstanding first-step quickness','Multiple pass-rush moves','Physical and relentless at POA','Maniacal energy even when doubled'],
 weaknesses:['Lacks ideal height and length','Stiff when dropping into coverage','Doesn\'t fit the traditional prototype'],
 combine:{forty:4.67,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Ty Simpson',pos:'QB',school:'Alabama',grade:82,height:'6-2',weight:210,
 bio:'Simpson has sound mechanics, touch and accuracy. Quick feet, compact delivery, enough arm. Good athlete on designed boots. Play tailed off late with injuries.',
 strengths:['Sound mechanics with compact delivery','Good touch and accuracy','Athletic on boots and rollouts','Composed game manager'],
 weaknesses:['Slightly undersized','Play tailed off late in 2025','Only 15 career starts','Gets sped up when pocket collapses'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Christen Miller',pos:'DT',school:'Georgia',grade:82,height:'6-3',weight:305,
 bio:'Miller has ideal size with a quick first step and swipe/club moves. Makes plays on slants. Gifted athlete with development room.',
 strengths:['Quick first step for size','Effective swipe/club moves','Good lateral quickness','Gifted athlete in ideal frame'],
 weaknesses:['Gets segmented — stops feet throwing hands','Can get turned at POA','More disruptive than productive'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Anthony Hill Jr.',pos:'LB',school:'Texas',grade:82,height:'6-2',weight:240,
 bio:'Hill is a fluid mover with outstanding size and speed. Instincts and speed put him in position to make plays. Outstanding closing speed from the back side.',
 strengths:['Elite athleticism and COD','Outstanding closing speed','Matches up with athletic TEs','Superb blitzer using speed'],
 weaknesses:['Isn\'t physical taking on blockers','Not an aggressive player','Relies too much on athleticism'],
 combine:{forty:4.51,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Jadarian Price',pos:'RB',school:'Notre Dame',grade:81,height:'5-10',weight:210,
 bio:'Price ran a 4.49 forty with a 35" vertical and 10\'4" broad jump at the 2026 Combine. Solid but not elite athletic profile. A compact RB with terrific vision and supreme contact balance. Dynamic kick returner with 2 TDs in 2025.',
 strengths:['Outstanding vision and patience','Supreme contact balance','Quick to neutralize blitzers in pass pro','Dynamic kickoff returner — 2 TDs in 2025'],
 weaknesses:['4.49 forty — not elite speed for RB','Fumble issues — 3 inside the 10 in 2025','Not elite receiver out of backfield'],
 combine:{forty:4.49,bench:null,vert:35,broad:124,cone:null,shuttle:null,_status:'official'}},
{name:'Malachi Fields',pos:'WR',school:'Notre Dame',grade:81,height:'6-4',weight:215,
 bio:'Fields struggled at the 2026 Combine — his 4.61 forty confirmed limited separation speed, and he dropped passes in on-field drills. NFL.com listed him as a Day 3 stock-down. Still a big-bodied red zone weapon with 50/50 ball skills, but expectations must reset.',
 strengths:['Dominant 50/50 ball winner on tape','Powers through press','Excellent red zone weapon with his size','Good blocking effort for a receiver'],
 weaknesses:['2026 Combine — 4.61 forty (stock down); dropped passes in drills','Lacks speed to separate vs man coverage','Not a dynamic route runner underneath'],
 combine:{forty:4.61,bench:null,vert:38,broad:124,cone:6.98,shuttle:4.35,_status:'official'}},
{name:'Keionte Scott',pos:'CB',school:'Miami',grade:81,height:'5-11',weight:190,
 bio:'Scott is a dynamic nickel — excellent force player, blitzer and energy provider. Generates negative plays in the run game by combining burst and block avoidance.',
 strengths:['Dynamic nickel with burst and ball skills','Excellent blitzer with finishing ability','Outstanding in run support','Provides explosive energy'],
 weaknesses:['Older prospect at 24','Fly-by missed tackles','Limited man coverage experience'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Antonio Williams',pos:'WR',school:'Clemson',grade:80,height:'5-10',weight:185,
 bio:'Williams has outstanding short-area quickness, ball skills and YAC ability. Explodes off the ball, sets up defenders, creates separation. Ideal slot receiver.',
 strengths:['Elite short-area quickness and stop/start','Outstanding ball skills — plays above rim','Excellent YAC ability','Perfect slot receiver profile'],
 weaknesses:['Undersized at 5-10, 185','Limited to the slot','May struggle vs physical press'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Zion Young',pos:'EDGE',school:'Missouri',grade:80,height:'6-4',weight:265,
 bio:'Young is big and powerful with heavy hands to jolt blockers. Destroys TEs assigned to block him. Firm at POA with tremendous effort. Strong Senior Bowl.',
 strengths:['Heavy hands that jolt blockers','Excellent length and power at POA','Destroys TEs in run game','Three-down value with strong motor'],
 weaknesses:['Herky-jerky mover, lacks fluidity','Not dynamic off the edge','No elite get-off or speed rush'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Jake Golday',pos:'LB',school:'Cincinnati',grade:80,height:'6-3',weight:230,
 bio:'Golday is tall, lean and fast. Lined up in the box, on the edge and over the slot. Game predicated on speed to beat blockers to spots.',
 strengths:['Outstanding speed and burst','Versatile — box, edge, slot','Fantastic lateral range from back side','Size/length to clog throwing lanes'],
 weaknesses:['Lacks ideal physicality vs blockers','Struggles to escape once engaged','Lean frame may limit durability'],
 combine:{forty:4.62,bench:null,vert:39,broad:125,cone:null,shuttle:null,_status:'official'}},
{name:'Deion Burks',pos:'WR',school:'Oklahoma',grade:79,height:'5-11',weight:198,
 bio:'Burks had one of the best combine showings of any WR — a 4.30 forty (3rd overall at the combine), 42.5" vertical and 10\'11" broad jump. His athletic profile is elite and cemented his Day 2 draft grade. Outstanding route-running polish and YAC ability complete the package.',
 strengths:['2026 Combine — 4.30 forty (3rd overall), 42.5" vert, 10\'11" broad','Outstanding route-running polish','Varies tempo to keep defenders off balance','Effective YAC through the catch'],
 weaknesses:['Undersized frame limits outside potential','Concentration drops in college','Needs more overall consistency'],
 combine:{forty:4.30,bench:null,vert:42.5,broad:131,cone:null,shuttle:null,_status:'official'}},
{name:'Zachariah Branch',pos:'WR',school:'Georgia',grade:79,height:'5-9',weight:180,
 bio:'Branch ran a 4.35 forty at the 2026 Combine with crisp route-running that NFL.com highlighted as a Day 3 stock-up. Now in top-40 pick consideration. A compact slot WR with elite speed — track champion with electric kick return ability.',
 strengths:['2026 Combine — 4.35 forty; NFL.com stock up to top-40','Elite speed — track champion','Electric as receiver and returner','Elite stop/start on pivot routes'],
 weaknesses:['Not natural hands — body catches','Compact frame limits to slot','Limited route tree beyond quick game'],
 combine:{forty:4.35,bench:20,vert:38,broad:125,cone:null,shuttle:null,_status:'official'}},
{name:'Dante Moore',pos:'QB',school:'Oregon',grade:78,height:'6-2',weight:215,
 bio:'Moore has a live arm and good mobility. Showed growth after transferring to Oregon. Arm talent to make all throws but needs better processing.',
 strengths:['Live arm for all the throws','Good mobility and athleticism','Growth trajectory after transfer','Composed in big moments'],
 weaknesses:['Decision-making needs work','Processing too slow vs pressure','Inconsistent intermediate accuracy','Still developing as full-field reader'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Chris Bell',pos:'WR',school:'Louisville',grade:86,height:'6-2',weight:220,
 bio:'Bell is a big, physical outside receiver with excellent hands and red zone ability. Broke out in 2025 with dominant SEC performances. Plays bigger than his measurables with outstanding body control.',
 strengths:['Physical outside receiver who wins at catch point','Outstanding body control on contested balls','Strong hands and reliable target','Red zone weapon with size and leaping ability'],
 weaknesses:['Not an elite separator underneath','Lacks top-end speed to threaten deep consistently','Route tree needs more refinement','Can be re-routed by physical press'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'LT Overton',pos:'DT',school:'Alabama',grade:85,height:'6-5',weight:278,
 bio:'Overton is a massive, versatile defensive lineman with rare athleticism for his size. Plays inside and outside with disruptive potential. A former five-star recruit whose tools are finally translating to production.',
 strengths:['Rare size/athleticism combination','Versatile — lines up inside and outside','Outstanding length to control blocks','Flashes elite pass-rush potential'],
 weaknesses:['Inconsistent effort and motor','Still learning to use his tools consistently','Can get washed in the run game','Production hasn\'t matched his talent'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Emmanuel Pregnon',pos:'IOL',school:'Oregon',grade:84,height:'6-5',weight:318,
 bio:'Pregnon is a massive, physical guard who moves well for his size. Nasty temperament in the run game with strong hands to latch and drive. Anchored Oregon\'s dominant offensive line.',
 strengths:['Massive frame with excellent movement skills','Physical, nasty run blocker','Strong anchor in pass protection','Experienced starter with leadership'],
 weaknesses:['Can get beat by quick interior rushers','Occasionally overextends in pass pro','Limited tackle versatility','Needs to improve hand placement'],
 combine:{forty:5.21,bench:null,vert:35,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'D\'Angelo Ponds',pos:'CB',school:'Indiana',grade:84,height:'5-9',weight:170,
 bio:'Ponds is a feisty, competitive corner with outstanding ball skills despite his smaller frame. Quick feet and fluid hips allow him to mirror receivers. Was a key piece in Indiana\'s breakout 2025 season.',
 strengths:['Elite ball skills and instincts','Quick feet with fluid change of direction','Competitive and physical despite size','Outstanding in zone coverage'],
 weaknesses:['Undersized at 5-9, 170','Will struggle vs bigger outside WRs','Lacks ideal length for press','Run support can be an issue'],
 combine:{forty:null,bench:null,vert:43.5,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Kamari Ramsey',pos:'S',school:'USC',grade:83,height:'6-0',weight:205,
 bio:'Ramsey is a versatile, hard-hitting safety with range and instincts. Physical striker against the run who also covers ground in the deep half. Emerged as one of the top safeties in the class.',
 strengths:['Versatile — plays deep, box, and slot','Physical striker with big hits','Good range and closing speed','Outstanding football intelligence'],
 weaknesses:['Can be late reacting to play-action','Occasional missed tackles in space','Needs to improve ball production','Gets caught peeking in the backfield'],
 combine:{forty:4.47,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Gabe Jacas',pos:'EDGE',school:'Illinois',grade:83,height:'6-4',weight:255,
 bio:'Jacas is a long, athletic edge rusher who pairs length with closing speed. Active hands and a developing rush plan make him a rising prospect. Had a breakout 2025 campaign in the Big Ten.',
 strengths:['Outstanding length and athleticism','Active hands to defeat blocks','Closing speed on the quarterback','Versatile — drops into coverage'],
 weaknesses:['Still developing pass-rush plan','Can get washed at POA vs power','Inconsistent leverage and pad level','Limited power-rush repertoire'],
 combine:{forty:null,bench:30,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Gennings Dunker',pos:'OT',school:'Iowa',grade:82,height:'6-5',weight:315,
 bio:'Dunker is a mauling, physical tackle who dominates in the run game. Iowa product with outstanding technique and strength. Projects as a starting right tackle with guard versatility.',
 strengths:['Outstanding run blocker — finishes blocks','Strong hands and excellent grip strength','Sound technique and footwork','Physical, nasty temperament'],
 weaknesses:['Lacks elite foot speed for LT','Can struggle vs speed rushers','Limited lateral mobility','Pass protection ceiling is average'],
 combine:{forty:5.18,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Isaiah World',pos:'OT',school:'Oregon',grade:82,height:'6-6',weight:310,
 bio:'World has ideal size and length for the NFL with outstanding athleticism. Moves well on combo blocks and can climb to the second level. Raw but tools are enticing.',
 strengths:['Ideal size and length for NFL tackle','Athletic on combo blocks','Can climb and wall off linebackers','High upside with development'],
 weaknesses:['Raw technique — needs coaching','Inconsistent anchor in pass pro','Gets caught lunging at times','Needs to add functional strength'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Germie Bernard',pos:'WR',school:'Alabama',grade:81,height:'6-1',weight:204,
 bio:'Bernard is a dynamic, versatile receiver who can line up anywhere. Explosive after the catch with excellent speed. Emerged as Alabama\'s go-to target in 2025 with reliable production.',
 strengths:['Dynamic run-after-catch ability','Excellent speed and acceleration','Versatile — inside and outside','Reliable hands in traffic'],
 weaknesses:['Not an elite contested-catch winner','Undersized for outside role','Route tree still developing','Can disappear in big moments'],
 combine:{forty:4.45,bench:null,vert:32.5,broad:125,cone:null,shuttle:null,_status:'official'}},
{name:'Chris Brazzell II',pos:'WR',school:'Tennessee',grade:80,height:'6-5',weight:200,
 bio:'Brazzell is a massive outside receiver in the Mike Evans mold. Uses his size and length to dominate at the catch point. Red zone nightmare for defenders with his ability to high-point the football.',
 strengths:['Massive frame at 6-5 — huge catch radius','Dominates at the catch point','Outstanding red zone target','Tracks and high-points deep balls'],
 weaknesses:['Not a quick separator underneath','Lacks elite speed for his size','Inconsistent route runner','Can be jammed off the line'],
 combine:{forty:4.37,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Elijah Sarratt',pos:'WR',school:'Indiana',grade:80,height:'6-2',weight:209,
 bio:'Sarratt is a reliable, well-rounded receiver who stretches the field and works the red zone. Clutch performer who showed up in big games during Indiana\'s breakout 2025 season.',
 strengths:['Reliable and clutch in big moments','Good size to win contested catches','Stretches the field vertically','Physical after the catch'],
 weaknesses:['Doesn\'t create much separation','Average route-running technique','Not dynamic with ball in hands','Limited YAC ability'],
 combine:{forty:4.61,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Max Klare',pos:'TE',school:'Ohio State',grade:79,height:'6-5',weight:243,
 bio:'Klare is a long, athletic tight end with vertical speed. Can stretch the seam and create mismatches. Emerged as a key target in Ohio State\'s offense. Excellent blocker for his build.',
 strengths:['Outstanding vertical speed for TE','Creates mismatches down the seam','Good blocker willing to engage','Long frame with catch radius'],
 weaknesses:['Thin frame — needs to add mass','Not a YAC threat','Inconsistent hands under pressure','Limited route tree beyond verticals'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Harold Perkins Jr.',pos:'LB',school:'LSU',grade:79,height:'6-1',weight:225,
 bio:'Perkins is an explosive, twitchy linebacker with pass-rush ability. Injuries limited his college career, but the talent is undeniable. Offers scheme versatility as a blitzer and edge setter.',
 strengths:['Explosive first step as a blitzer','Outstanding twitch and athleticism','Versatile — edge, off-ball, coverage','Elite closing speed'],
 weaknesses:['Extensive injury history','Hasn\'t stayed healthy for full season','Undersized at POA','Still learning to read and react'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Keith Abney II',pos:'CB',school:'Arizona State',grade:80,height:'6-0',weight:190,
 bio:'Abney is a versatile cover corner with outstanding zone awareness. Physical and willing in run support. His combination of coverage ability and toughness makes him a day-two target.',
 strengths:['Versatile — plays zone and man','Physical and willing tackler','Outstanding zone awareness and instincts','Good ball skills on throws his way'],
 weaknesses:['Lacks elite speed and recovery','Can be beat by double moves','Not a true shutdown corner','Tightness shows in transition'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Garrett Nussmeier',pos:'QB',school:'LSU',grade:78,height:'6-2',weight:210,
 bio:'Nussmeier has a quick release and good arm talent. Competitive and tough in the pocket. Flashed elite potential but struggled with consistency and turnovers during his LSU career.',
 strengths:['Quick release with good velocity','Competitive and tough in the pocket','Can make off-platform throws','Flashes elite processing'],
 weaknesses:['Turnover-prone — poor decisions','Inconsistent accuracy','Struggles under pressure','Pocket presence needs work'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Carson Beck',pos:'QB',school:'Miami',grade:77,height:'6-4',weight:220,
 bio:'Beck transferred from Georgia to Miami after mixed results. Has ideal size and arm talent for the NFL. Needs to prove he can be consistent and stay healthy after a turbulent college career.',
 strengths:['Ideal NFL size and arm strength','Experience in big-game moments','Can make all the throws','Good touch on intermediate routes'],
 weaknesses:['Turnover issues throughout career','Durability concerns','Decision-making under pressure','Needs to prove he can lead consistently'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Mike Washington Jr.',pos:'RB',school:'Arkansas',grade:77,height:'6-2',weight:223,
 bio:'Washington ran the fastest 40 among all running backs at the 2026 Combine — a 4.33 at 223 pounds. He also added a 39" vertical and 10\'8" broad jump. Stock up significantly to Day 2 consideration. A big, powerful back with 1,070 yards and 8 TDs in 2025 at Arkansas.',
 strengths:['2026 Combine — 4.33 forty (fastest RB) at 223 lbs','39" vertical and 10\'8" broad jump — elite athleticism','Outstanding vision and patience at LOS','Effective stiff arm to shed tacklers'],
 weaknesses:['Runs upright — limited leverage at contact','Pass protection needs significant work','Limited receiving usage in college'],
 combine:{forty:4.33,bench:null,vert:39,broad:128,cone:null,shuttle:null,_status:'official'}},
{name:'Romello Height',pos:'EDGE',school:'Texas Tech',grade:79,height:'6-3',weight:240,
 bio:'Height is an explosive, high-motor edge rusher with dynamic pass-rush ability. Pairs well with teammate David Bailey in Texas Tech\'s front. Can be a situational impact player on day one.',
 strengths:['Explosive first step and closing speed','High motor with relentless effort','Dynamic situational pass rusher','Good bend and flexibility'],
 weaknesses:['Undersized for every-down role','Needs to add significant mass','Struggles holding POA vs run','One-dimensional speed rusher currently'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'A.J. Haulcy',pos:'S',school:'LSU',grade:78,height:'6-0',weight:222,
 bio:'Haulcy is a physical, hard-hitting safety with outstanding striking ability. Fills the alley aggressively and makes plays on the ball. A tone-setter in LSU\'s secondary.',
 strengths:['Physical striker — delivers big hits','Outstanding in run support','Good ball skills and awareness','Aggressive downhill player'],
 weaknesses:['Limited range in deep coverage','Can be a liability in man coverage','Takes poor angles in space','Overly aggressive — freelances too much'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Eli Stowers',pos:'TE',school:'Vanderbilt',grade:78,height:'6-4',weight:235,
 bio:'Stowers set the all-time NFL Combine records for tight ends in both the vertical jump (45.5") and broad jump (11\'3"), making him the most explosive TE ever tested. Added a 4.51 forty. His combine performance is historic and shot him up draft boards. Field-stretching seam threat with natural hands.',
 strengths:['2026 Combine — ALL-TIME TE records: 45.5" vert and 11\'3" broad jump','Explosive seam threat who creates mismatches','Natural hands and body control','Rare athletic ceiling for the position'],
 weaknesses:['Thin frame — needs to bulk up','Blocking is a major weakness','Vanderbilt competition level — needs to prove vs elite DEs','Limited in-line TE experience'],
 combine:{forty:4.51,bench:null,vert:45.5,broad:135,cone:null,shuttle:null,_status:'official'}},
{name:'Jonah Coleman',pos:'RB',school:'Washington',grade:76,height:'5-10',weight:215,
 bio:'Coleman is a compact, powerful runner who transferred to Washington and immediately produced. He declined to do athletic testing at the 2026 Combine — pro day will be critical. Runs with violence and pad level. Three-down potential with toughness in pass protection.',
 strengths:['Runs with power and low pad level','Excellent contact balance','Tough and willing pass protector','Productive — consistent yardage'],
 weaknesses:['Lacks elite breakaway speed','Did not test athletically at combine (pro day key)','Limited big-play ability','Older prospect with mileage'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Nicholas Singleton',pos:'RB',school:'Penn State',grade:76,height:'6-0',weight:225,
 bio:'Singleton is a big, physical back with outstanding speed for his size. Former five-star recruit who showed flashes of dominance. He fractured the 5th metatarsal in his right foot at the Senior Bowl and was ruled out of all on-field work at the 2026 Combine. One-cut downhill runner with home-run potential once healthy.',
 strengths:['Outstanding speed for his size','One-cut, downhill running style','Home-run threat on any carry','Physical and hard to bring down'],
 weaknesses:['Fractured foot — missed Senior Bowl and 2026 Combine on-field work','Inconsistent vision and patience','Limited receiving skills','Fumble issues in college'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Derrick Moore',pos:'EDGE',school:'Michigan',grade:78,height:'6-5',weight:260,
 bio:'Moore is a long, powerful edge defender with NFL size. Physical run defender who can also generate pressure. Michigan product with outstanding technique and discipline.',
 strengths:['Excellent size and length','Physical and stout vs the run','Good hand usage and technique','Disciplined edge setter'],
 weaknesses:['Lacks elite burst off the edge','Stiff in space and coverage','Limited pass-rush ceiling','Not a dynamic athlete'],
 combine:{forty:null,bench:null,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Josiah Trotter',pos:'LB',school:'Missouri',grade:77,height:'6-2',weight:237,
 bio:'Trotter is a physical, downhill linebacker with outstanding run-defense instincts. Son of NFL veteran Jeremiah Trotter. Tackles with authority and fills gaps aggressively.',
 strengths:['Physical tackler with authority','Outstanding run-defense instincts','NFL bloodlines and character','Fills gaps aggressively'],
 weaknesses:['Limited in coverage — stiff hips','Not a sideline-to-sideline athlete','Struggles vs athletic TEs','Needs to improve pass drops'],
 combine:{forty:null,bench:27,vert:null,broad:null,cone:null,shuttle:null,_status:'official'}},
{name:'Caleb Tiernan',pos:'OT',school:'Northwestern',grade:77,height:'6-7',weight:325,
 bio:'Tiernan has massive size and length. Athletic for his frame with the ability to play right tackle or kick inside to guard. Showed improvement throughout 2025.',
 strengths:['Massive frame with outstanding length','Versatile — tackle and guard','Athletic for 6-7, 325','Improved steadily through college'],
 weaknesses:['Needs to improve anchor','Can be beaten by inside moves','Occasionally oversets in pass pro','Needs more consistency'],
 combine:{forty:null,bench:null,vert:35.5,broad:111,cone:null,shuttle:null,_status:'official'}},
];

// ===== BIO GENERATION SYSTEM =====
const GEN_FIRST=['Jaylen','Trevon','Marcus','DeShawn','Malik','Keion','Bryce','Darius','Cam','Jalen',
'Aidan','Kobe','Xavier','Tyree','Nolan','Quentin','Rashad','Zavier','Isaiah','Kaelen',
'Andre','Bryson','Devonte','Elijah','Fabian','Gavin','Hakeem','Ivan','Jamal','Keenan',
'Landon','Micah','Nate','Omar','Preston','Quinn','Rodney','Silas','Titus','Uriah',
'Vance','Wesley','Xander','Yosef','Zeke','Alonzo','Braden','Cortez','Donovan','Emmett',
'Felix','Grant','Hector','Isaac','Jared','Kendall','Levi','Mason','Nelson','Owen',
'Pierce','Reed','Santino','Trevor','Ulysses','Virgil','Warren','Yuri','Zander','Amir',
'Blaine','Craig','Deon','Ervin','Flynn','Gideon','Heath','Ike','Jacoby','Kelvin',
'Lorenzo','Myles','Nasir','Orlando','Pablo','Reese','Samson','Tobias','Vernon','Wade',
'Armani','Brock','Cedric','Drake','Ellis','Franco','Gray','Hugo','Idris','Jonas'];
const GEN_LAST=['Williams','Johnson','Davis','Smith','Brown','Jackson','Thomas','Wilson','Harris','Robinson',
'Taylor','Anderson','White','Thompson','Martinez','Clark','Lewis','Walker','Young','Hall',
'Allen','King','Scott','Adams','Green','Baker','Hill','Nelson','Carter','Mitchell',
'Perez','Roberts','Turner','Phillips','Campbell','Parker','Evans','Edwards','Collins','Stewart',
'Morris','Murphy','Rivera','Cook','Rogers','Morgan','Peterson','Cooper','Reed','Bailey',
'Bell','Howard','Ward','Watson','Brooks','Price','Gray','James','Hughes','Sanders',
'Bennett','Long','Patterson','Powell','Jenkins','Perry','Russell','Sullivan','Owens','Palmer',
'Dixon','Hunt','Burke','Hayes','Griffin','Stone','Bishop','Lambert','Norris',
'Casey','Mack','Fleming','Gibbs','Harmon','York','Pace','Vance','Tate','Kirk',
'Bates','Mosley','Simmons','Marsh','Kane','Lynch','Poole','West','Chase','Miles'];
const GEN_SCHOOLS=['Michigan','Texas','Oregon','Penn State','Georgia','Alabama','Ohio State','USC','Oklahoma',
'Clemson','LSU','Florida','Tennessee','Notre Dame','Miami','Florida State','Auburn','Wisconsin',
'Iowa','Michigan State','UCLA','Stanford','Virginia Tech','North Carolina','Mississippi State',
'Ole Miss','TCU','Baylor','Kansas State','Pittsburgh','West Virginia','NC State','Maryland',
'Arkansas','Kentucky','South Carolina','Minnesota','Illinois','Purdue','Nebraska','Colorado',
'Arizona','Utah State','Boise State','Memphis','SMU','Tulane','UCF','Cincinnati','Houston',
'BYU','Iowa State','Oregon State','Washington State','San Diego State','Fresno State','Liberty',
'Coastal Carolina','James Madison','Marshall','App State','Air Force','Army','Navy','Toledo',
'Northern Illinois','Western Michigan','Georgia Tech','Duke','Wake Forest','Syracuse','Boston College','Virginia','Louisville','Rutgers'];
const POS_POOL=['QB','RB','RB','WR','WR','WR','WR','WR','TE','OT','OT','OT','IOL','IOL','EDGE','EDGE','EDGE','DT','DT','LB','LB','CB','CB','CB','S','S'];

const BIO_T={
  QB:'{name} is a {adj} quarterback from {school}. Shows {s1} and can {s2}. Needs to improve {w1} to reach his ceiling.',
  RB:'{name} is a {adj} running back from {school}. Brings {s1} and shows {s2}. Needs to work on {w1} but projects as a contributor.',
  WR:'{name} is a {adj} wide receiver from {school}. Features {s1} and {s2}. Needs to develop {w1} but brings enough talent.',
  TE:'{name} is a {adj} tight end from {school}. Provides {s1} and shows {s2}. Needs to improve {w1} to become a starter.',
  OT:'{name} is a {adj} offensive tackle from {school}. Brings {s1} and demonstrates {s2}. Needs to refine {w1}.',
  IOL:'{name} is a {adj} interior lineman from {school}. Plays with {s1} and shows {s2}. His {w1} will need NFL coaching.',
  EDGE:'{name} is a {adj} edge rusher from {school}. Features {s1} and shows {s2}. Needs to develop {w1} to be complete.',
  DT:'{name} is a {adj} defensive tackle from {school}. Brings {s1} and shows {s2}. Needs to improve {w1}.',
  LB:'{name} is a {adj} linebacker from {school}. Plays with {s1} and demonstrates {s2}. Needs to refine {w1} to be three-down.',
  CB:'{name} is a {adj} cornerback from {school}. Has {s1} and shows {s2} in coverage. Needs to improve {w1}.',
  S:'{name} is a {adj} safety from {school}. Brings {s1} and provides {s2}. Needs to work on {w1}.',
};
const ADJ_P={QB:['pro-style','dual-threat','pocket','athletic','strong-armed'],RB:['explosive','physical','versatile','shifty','dynamic'],WR:['athletic','smooth','physical','explosive','polished'],TE:['athletic','versatile','physical','receiving','blocking'],OT:['massive','athletic','powerful','technical','long-armed'],IOL:['powerful','mauling','versatile','athletic','tough'],EDGE:['explosive','physical','relentless','twitchy','powerful'],DT:['stout','powerful','disruptive','athletic','quick'],LB:['instinctive','physical','rangy','athletic','aggressive'],CB:['fluid','athletic','physical','instinctive','quick'],S:['versatile','physical','instinctive','rangy','hard-hitting']};
const S_P={QB:[['good arm strength','solid accuracy','quick release','pocket awareness','good touch'],['extending plays','composure under pressure','reading defenses','good mobility','play-action']],RB:[['excellent vision','good burst','reliable hands','strong balance','powerful lower body'],['breaking tackles','pass protection','open-field speed','patience','receiving skills']],WR:[['good route-running','excellent hands','quality speed','contested catches','crisp releases'],['reliable in traffic','good YAC','deep speed','red-zone presence','competitive mentality']],TE:[['solid receiving','quality blocking','good athleticism','reliable hands','versatile alignment'],['creating mismatches','run-blocking technique','seam-stretch','competitive after catch','football IQ']],OT:[['strong anchor','good footwork','excellent length','run-game power','solid technique'],['mirroring rushers','strong punch','combo-blocking','second-level reach','toughness']],IOL:[['strong anchor','powerful hands','good technique','quality awareness','solid run blocking'],['pulling ability','stunt awareness','consistent pad level','toughness','pass protection']],EDGE:[['good first step','effective hands','quality bend','solid motor','speed to power'],['effective counters','strong hands at POA','quality run defense','pursuit effort','versatility']],DT:[['stout at POA','quality hands','good anchor','two-gap ability','solid run defense'],['generating push','active hands','penetration quickness','solid motor','gap control']],LB:[['quality instincts','solid tackling','good speed','stack and shed','pursuit angles'],['blitzing ability','coverage awareness','toughness','sideline range','leadership']],CB:[['quality ball skills','good footwork','fluid hips','mirroring ability','press technique'],['zone instincts','closing speed','competitive toughness','click-and-close','run support']],S:[['quality range','good tackling','instinctive play','covering ground','communication'],['box play','ball-hawking','blitzing','versatile deployment','run support']]};
const W_P={QB:['footwork under pressure','post-snap reads','deep accuracy','red-zone decisions','pocket presence'],RB:['pass protection','ball security','patience','route polish','durability'],WR:['route consistency','drop rate','physicality vs press','blocking effort','separation underneath'],TE:['blocking consistency','separation ability','route polish','run-after-catch'],OT:['pass-set quickness','recovery vs inside moves','functional strength','technique consistency'],IOL:['lateral mobility','hand placement','ability in space','recovery after punch'],EDGE:['run-defense consistency','rush plan','edge-setting','counter development'],DT:['pass-rush technique','lateral movement','conditioning','consistency of effort'],LB:['coverage vs backs','block shedding','lateral agility','open-field tackling'],CB:['physicality at catch point','recovery speed','press consistency','ball production'],S:['man-coverage technique','deep range','tackling consistency','discipline in zone']};

const RED_FLAGS=['Off-field concerns','Injury history','Character questions','Maturity concerns','Failed team interviews','Medical red flag','Work ethic questions','Off-field incident'];

function seededRand(seed){return function(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};}
const srand=seededRand(2026);
function pickR(a){return a[Math.floor(srand()*a.length)];}

// ===== GENERATE COMBINE MEASURABLES =====
function genCombine(pos,gradeBonus,isTopProspect){
  const r=COMBINE_RANGES[pos]||COMBINE_RANGES.LB;
  const drills=POS_DRILLS[pos]||POS_DRILLS.LB;
  const gb=Math.max(-1,Math.min(1,(gradeBonus||0)/20));
  const res={};
  // ~15% of top prospects opt out of some drills (wait for pro day)
  const optOutChance=isTopProspect?0.15:0.08;
  for(const k of Object.keys(r)){
    if(!drills[k]) continue; // position doesn't do this drill
    if(srand()<optOutChance){res[k]=null;continue;} // opted out / DNP
    const[lo,hi]=r[k];
    const range=hi-lo;
    let base=lo+srand()*range;
    if(COMBINE_LOWER_BETTER[k]) base-=gb*(range*0.3);
    else base+=gb*(range*0.3);
    base=Math.max(lo-range*0.1,Math.min(hi+range*0.1,base));
    res[k]=k==='bench'?Math.round(base):parseFloat(base.toFixed(2));
  }
  // combineStatus: 'projected' for all since combine is ongoing
  res._status='projected';
  return res;
}

function findCombineComparables(prospect){
  const c=prospect.combine;if(!c||!c.forty&&!c.vert&&!c.broad) return [];
  const pForty=c.forty,pVert=c.vert,pBroad=c.broad,pWt=prospect.weight||220;
  const scored=HISTORICAL_COMBINE.map(h=>{
    let dist=0,n=0;
    if(pForty!=null&&h.forty!=null){dist+=Math.pow((pForty-h.forty)*20,2);n++;}
    if(pVert!=null&&h.vert!=null){dist+=Math.pow((pVert-h.vert)/2,2);n++;}
    if(pBroad!=null&&h.broad!=null){dist+=Math.pow((pBroad-h.broad)/4,2);n++;}
    if(pWt&&h.weight){dist+=Math.pow((pWt-h.weight)/15,2);n++;}
    if(n===0) return {h,score:999};
    return {h,score:dist/n};
  });
  scored.sort((a,b)=>a.score-b.score);
  return scored.slice(0,5).map(s=>s.h);
}

function getCombineScore(prospect){
  if(!prospect.combine) return 50;
  const r=COMBINE_RANGES[prospect.pos]||COMBINE_RANGES.LB;
  let total=0,count=0;
  for(const k of Object.keys(r)){
    const[lo,hi]=r[k];
    const val=prospect.combine[k];
    if(val===undefined||val===null) continue;
    let pct;
    if(COMBINE_LOWER_BETTER[k]) pct=1-(val-lo)/(hi-lo);
    else pct=(val-lo)/(hi-lo);
    total+=Math.max(0,Math.min(1,pct));
    count++;
  }
  return count>0?(total/count)*100:50;
}

// ===== GENERATE ALL PROSPECTS =====
let ALL_PROSPECTS=[];
const usedNames=new Set();
window.__PROSPECTS_OVERRIDE=null;
fetch('/api/prospects').then(r=>r.ok?r.json():null).then(d=>{if(d?.prospects)window.__PROSPECTS_OVERRIDE=d.prospects;}).catch(()=>{});

function generateProspects(){
  const base=window.__PROSPECTS_OVERRIDE||TOP_PROSPECTS;
  const useOverride=!!window.__PROSPECTS_OVERRIDE;
  ALL_PROSPECTS=base.map(p=>{
    const grade=useOverride?(p.grade||80):(p.grade||80)+(PROSPECT_UPDATES[p.name]?.delta||0);
    const bonus=(grade-80)/3;
    const combine=(p.combine&&p.combine._status==='official')?p.combine:genCombine(p.pos,bonus,true);
    return{...p,grade,id:p.name.replace(/\s/g,'-').toLowerCase(),combine};
  });
  base.forEach(p=>usedNames.add(p.name));
  const roundGrades=[{min:75,max:80},{min:68,max:76},{min:60,max:69},{min:52,max:61},{min:44,max:53},{min:36,max:45}];
  let needed=260-ALL_PROSPECTS.length, gradeIdx=0;
  const meas={QB:{h:['6-1','6-2','6-3','6-4','6-5'],w:[205,210,215,220,225,230]},RB:{h:['5-9','5-10','5-11','6-0','6-1'],w:[195,200,205,210,215,220]},WR:{h:['5-10','5-11','6-0','6-1','6-2','6-3','6-4'],w:[175,180,185,190,195,200,205,210]},TE:{h:['6-3','6-4','6-5','6-6'],w:[240,245,250,255,260]},OT:{h:['6-4','6-5','6-6','6-7'],w:[300,305,310,315,320,325]},IOL:{h:['6-2','6-3','6-4','6-5'],w:[300,305,310,315,320]},EDGE:{h:['6-2','6-3','6-4','6-5'],w:[240,245,250,255,260,265]},DT:{h:['6-1','6-2','6-3','6-4','6-5'],w:[290,295,300,305,310,315]},LB:{h:['6-0','6-1','6-2','6-3','6-4'],w:[225,230,235,240,245]},CB:{h:['5-10','5-11','6-0','6-1','6-2'],w:[180,185,190,195,200]},S:{h:['5-11','6-0','6-1','6-2','6-3'],w:[195,200,205,210,215]}};
  while(needed>0){
    const pos=pickR(POS_POOL);let first,last,fn;let att=0;
    do{first=pickR(GEN_FIRST);last=pickR(GEN_LAST);fn=first+' '+last;att++;}while(usedNames.has(fn)&&att<50);
    if(usedNames.has(fn)) continue; usedNames.add(fn);
    const school=pickR(GEN_SCHOOLS);
    const gi=Math.min(gradeIdx,roundGrades.length-1);
    const grade=Math.round(roundGrades[gi].min+srand()*(roundGrades[gi].max-roundGrades[gi].min));
    const adj=pickR(ADJ_P[pos]||['athletic']);
    const s1=pickR((S_P[pos]||[['']])[0]);const s2=pickR((S_P[pos]||[[''],['x']])[1]);
    const w1=pickR(W_P[pos]||['technique']);
    const bio=(BIO_T[pos]||'{name} is a prospect from {school}.').replace('{name}',fn).replace('{adj}',adj).replace('{school}',school).replace('{s1}',s1).replace('{s2}',s2).replace('{w1}',w1);
    const allS=[...(S_P[pos]||[[],[]])[0],...(S_P[pos]||[[],[]])[1]];
    const strengths=[];const usS=new Set();for(let i=0;i<3;i++){let s=pickR(allS);let a=0;while(usS.has(s)&&a<20){s=pickR(allS);a++;}usS.add(s);strengths.push(s.charAt(0).toUpperCase()+s.slice(1));}
    const allW=W_P[pos]||['technique'];const weaknesses=[];const usW=new Set();for(let i=0;i<2;i++){let w=pickR(allW);let a=0;while(usW.has(w)&&a<20){w=pickR(allW);a++;}usW.add(w);weaknesses.push('Needs to improve '+w);}
    const pm=meas[pos]||{h:['6-1'],w:[210]};
    const bonus=(grade-60)/5;
    const prospect={id:fn.replace(/\s/g,'-').toLowerCase(),name:fn,pos,school,grade,bio,strengths,weaknesses,height:pickR(pm.h),weight:pickR(pm.w),combine:null};
    if(srand()<0.10){prospect.redFlag=pickR(RED_FLAGS);}
    ALL_PROSPECTS.push(prospect);
    needed--;if(needed%30===0)gradeIdx++;
  }
  ALL_PROSPECTS.sort((a,b)=>{
    if(window.expertMode){
      const ra=getExpertConsensusRank(a.name),rb=getExpertConsensusRank(b.name);
      if(ra!==rb) return ra-rb;
    }
    return b.grade-a.grade;
  });
}

// ===== DRAFT STATE =====
const TOTAL_ROUNDS=7, PICKS_PER_ROUND=32, TOTAL_PICKS=224;
let mode='manual', userTeamIdx=-1, currentPick=0;
let draftResults=[], available=[], pickOwnership=[];
window.expertMode=false;
let activeRoundTab=0, activePosFilter='ALL';
let simRunning=false, simTimer=null, resultsRoundTab=0;
let tradeLog=[];

function initPickOwnership(){
  pickOwnership=[];
  for(let i=0;i<TOTAL_PICKS;i++){
    const round=Math.floor(i/PICKS_PER_ROUND);
    if(round===0){
      // Round 1: use actual 2026 draft order
      const abbr=ROUND1_PICKS[i%PICKS_PER_ROUND];
      pickOwnership[i]=TEAMS.findIndex(t=>t.abbr===abbr);
    } else {
      // Rounds 2-7: all 32 teams pick once per round in base order
      pickOwnership[i]=i%PICKS_PER_ROUND;
    }
  }
}
function getTeamForPick(p){return pickOwnership[p];}
function getRoundForPick(p){return Math.floor(p/PICKS_PER_ROUND);}

// ===== GRADING =====
const GRADE_LETTERS=['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-'];
const GRADE_VALUES=[12,11,10,9,8,7,6,5,4,3,2,1];
function gradeColor(g){if(g.startsWith('A'))return'grade-a';if(g.startsWith('B'))return'grade-b';if(g.startsWith('C'))return'grade-c';return'grade-d';}

function gradePick(pickNum,prospect,teamIdx){
  const rank=ALL_PROSPECTS.indexOf(prospect);
  const combineBonus=(getCombineScore(prospect)-50)/25;
  let score=50+(pickNum-rank)*1.5+combineBonus*3;
  const team=TEAMS[teamIdx];
  const ni=team.needs.findIndex(n=>posMatchesNeed(prospect.pos,n));
  if(ni===0)score+=14;else if(ni===1)score+=10;else if(ni===2)score+=6;else if(ni>=3)score+=3;
  const locks=ROSTER_LOCKS[team.abbr]||[];
  if(locks.some(lp=>posMatchesNeed(prospect.pos,lp)))score-=20;
  const posVal=POS_DRAFT_VALUE[prospect.pos]||0.85;
  if(ni===-1&&posVal<0.75&&pickNum<64)score-=10;
  if(score>=72)return'A+';if(score>=65)return'A';if(score>=58)return'A-';
  if(score>=51)return'B+';if(score>=45)return'B';if(score>=39)return'B-';
  if(score>=33)return'C+';if(score>=27)return'C';if(score>=21)return'C-';
  if(score>=15)return'D+';if(score>=9)return'D';return'D-';
}
function gradeToNum(g){const i=GRADE_LETTERS.indexOf(g);return i>=0?GRADE_VALUES[i]:5;}
function numToGrade(n){
  if(n>=11.5)return'A+';if(n>=10.5)return'A';if(n>=9.5)return'A-';
  if(n>=8.5)return'B+';if(n>=7.5)return'B';if(n>=6.5)return'B-';
  if(n>=5.5)return'C+';if(n>=4.5)return'C';if(n>=3.5)return'C-';
  if(n>=2.5)return'D+';if(n>=1.5)return'D';return'D-';
}
function getTeamDraftGrade(ti){
  const picks=draftResults.filter(r=>r&&r.teamIdx===ti);
  if(!picks.length)return null;
  return numToGrade(picks.reduce((s,p)=>s+gradeToNum(p.grade),0)/picks.length);
}

// ===== AI PICK LOGIC =====
function scoreProspects(pickNum,predictMode){
  const teamIdx=getTeamForPick(pickNum);
  const team=TEAMS[teamIdx];
  const round=getRoundForPick(pickNum);
  const locks=ROSTER_LOCKS[team.abbr]||[];
  const scored=available.map(p=>{
    let score=p.grade;
    const combineScore=getCombineScore(p);
    score+=(combineScore-50)*(predictMode?0.2:0.15);
    const posVal=POS_DRAFT_VALUE[p.pos]||0.85;
    const wouldLock=locks.some(lp=>posMatchesNeed(p.pos,lp));
    const isExpiring=(ROSTER_EXPIRING[team.abbr]||[]).some(ep=>posMatchesNeed(p.pos,ep));
    const isLocked=wouldLock&&!isExpiring;
    const ni=team.needs.findIndex(n=>posMatchesNeed(p.pos,n));
    if(predictMode){
      if(ni===0)score+=16;else if(ni===1)score+=12;else if(ni===2)score+=7;else if(ni>=3)score+=3;
    }else{
      if(ni!==-1)score+=(5-ni)*3;
    }
    if(p.pos==='QB'&&!team.needs.includes('QB'))score-=(predictMode?20:18);
    if(round>=4&&p.pos==='QB'&&!team.needs.includes('QB'))score-=10;
    if(isLocked){score-=40;if(round<=2)score-=15;}
    if(ni===-1){
      score-=(1-posVal)*30;
      if(round<=2)score-=(1-posVal)*20;
    }
    let tendencyMatch=false;
    if(team.tendency){
      if(predictMode){const bpaW=team.tendency.bpa||0.5;score=score*(1-bpaW*0.3)+p.grade*(bpaW*0.3);}
      if(team.tendency.posPrefs.some(pp=>posMatchesNeed(p.pos,pp))){score+=(predictMode?3:2);tendencyMatch=true;}
      const conf=SCHOOL_CONF[p.school]||'';
      if(conf===team.tendency.conf)score+=(predictMode?1.5:1);
    }
    const expectedSlot=ALL_PROSPECTS.indexOf(p);
    const slide=pickNum-expectedSlot;
    if(p.grade>=93&&slide>10)score+=25*posVal;
    if(p.grade>=90&&slide>15)score+=20*posVal;
    if(slide>6)score+=(slide-6)*3*posVal;
    if(slide>14)score+=(slide-14)*5*posVal;
    if(p.redFlag)score-=(predictMode?10:(8+srand()*6));
    if(window.expertMode){
      const crank=getExpertConsensusRank(p.name);
      if(crank<999) score+=(33-crank)*0.6;
    }
    score+=(srand()-0.5)*(predictMode?1.5:2.5);
    return{prospect:p,score,combineScore,needIndex:ni,isLocked,slide,posVal,tendencyMatch,rank:ALL_PROSPECTS.indexOf(p)+1};
  });
  scored.sort((a,b)=>b.score-a.score);
  return{scored,team,teamIdx,round};
}

function aiPick(pickNum,predictMode){
  const{scored,team,teamIdx}=scoreProspects(pickNum,predictMode);
  const winner=scored[0];
  if(!winner) return available[0];
  // Collect top 3 runners-up from different position groups
  const runnersUp=[];
  const seenPos=new Set([winner.prospect.pos]);
  for(let i=1;i<scored.length&&runnersUp.length<3;i++){
    if(!seenPos.has(scored[i].prospect.pos)){
      seenPos.add(scored[i].prospect.pos);
      runnersUp.push(scored[i]);
    }
  }
  winner.prospect._pickContext={winner,runnersUp,teamNeeds:team.needs,teamAbbr:team.abbr,teamName:team.name};
  return winner.prospect;
}

function makePick(prospect){
  const teamIdx=getTeamForPick(currentPick);
  const grade=gradePick(currentPick,prospect,teamIdx);
  draftResults[currentPick]={prospect,teamIdx,grade};
  available=available.filter(p=>p!==prospect);
  currentPick++;
  updatePickCounter();
}

// ===== TRADE SYSTEM =====
function getTeamPicks(teamIdx){
  const picks=[];
  for(let i=currentPick;i<TOTAL_PICKS;i++){
    if(pickOwnership[i]===teamIdx) picks.push(i);
  }
  return picks;
}

function findTradeOffers(){
  if(currentPick>=TOTAL_PICKS) return[];
  const myTeam=getTeamForPick(currentPick);
  const myVal=getPickValue(currentPick);
  const offers=[];
  for(let ti=0;ti<32;ti++){
    if(ti===myTeam) continue;
    const theirPicks=getTeamPicks(ti);
    if(theirPicks.length<2) continue;
    for(const tp of theirPicks){
      if(tp<=currentPick) continue;
      const theirVal=getPickValue(tp);
      if(theirVal>=myVal) continue;
      const deficit=myVal-theirVal;
      const extraPick=theirPicks.find(p2=>p2!==tp&&p2>currentPick&&Math.abs(getPickValue(p2)-deficit)<deficit*0.5);
      if(extraPick){
        const totalOffer=theirVal+getPickValue(extraPick);
        const fairness=totalOffer/myVal;
        if(fairness>=0.85&&fairness<=1.4){
          const recv=[tp,extraPick].sort((a,b)=>a-b);
          offers.push({teamIdx:ti,teamName:TEAMS[ti].name,teamAbbr:TEAMS[ti].abbr,teamColor:TEAMS[ti].color,
            give:[currentPick],receive:recv,
            giveVal:myVal,receiveVal:totalOffer,fairness});
        }
      }
    }
  }
  offers.sort((a,b)=>b.receiveVal-a.receiveVal);
  return offers.slice(0,6);
}

function executeTrade(offer){
  const myTeamIdx=getTeamForPick(offer.give[0]);
  for(const gp of offer.give) pickOwnership[gp]=offer.teamIdx;
  for(const rp of offer.receive) pickOwnership[rp]=myTeamIdx;
  tradeLog.push({pick:currentPick,from:TEAMS[myTeamIdx].abbr,to:offer.teamAbbr,give:offer.give.map(p=>p+1),receive:offer.receive.map(p=>p+1)});
}

// ===== PREDICT MODE =====
function generatePickReason(pickNum,prospect,team,ni,combineScore,slide,isLocked,runnersUp){
  const parts=[];
  const rank=ALL_PROSPECTS.indexOf(prospect)+1;
  const posVal=POS_DRAFT_VALUE[prospect.pos]||0.85;
  if(ni===0) parts.push(`${prospect.pos} is the ${team.abbr}'s #1 need`);
  else if(ni===1) parts.push(`${prospect.pos} is a top-2 need for ${team.abbr}`);
  else if(ni>=0) parts.push(`Fills a positional need at ${prospect.pos}`);
  else if(isLocked) parts.push(`Unusual pick — ${team.abbr} already has an established ${prospect.pos} on the roster`);
  else parts.push(`Best player available regardless of positional need`);
  if(rank<=5) parts.push(`Elite prospect ranked #${rank} overall (${prospect.grade} grade)`);
  else if(rank<=15) parts.push(`Top-15 talent ranked #${rank} overall`);
  else if(rank<=32) parts.push(`First-round caliber at #${rank} on the board`);
  else if(rank<=64) parts.push(`Day 2 value — ranked #${rank} overall`);
  if(combineScore>70) parts.push(`Outstanding combine (${Math.round(combineScore)}/100)`);
  else if(combineScore>55) parts.push(`Solid combine showing (${Math.round(combineScore)}/100)`);
  else if(combineScore<35) parts.push(`Poor combine (${Math.round(combineScore)}/100) — tape is better than testing`);
  if(team.tendency&&team.tendency.posPrefs.some(pp=>posMatchesNeed(prospect.pos,pp))) parts.push(`Fits ${team.abbr}'s historical draft preference for ${prospect.pos}`);
  if(posVal<0.75&&ni===-1&&pickNum<32) parts.push(`${prospect.pos} is a devalued position in the modern NFL — teams rarely spend premium picks here without a specific need`);
  if(slide>10) parts.push(`Significant value — slid ${slide} spots past expected range`);
  else if(slide>5) parts.push(`Good value at this spot`);
  else if(slide<-8) parts.push(`Slight reach, but fills a critical roster hole`);
  if(prospect.redFlag) parts.push(`⚠ ${prospect.redFlag} may have caused a slide`);
  if(runnersUp&&runnersUp.length){
    const also=runnersUp.map(r=>{
      const rni=team.needs.findIndex(n=>posMatchesNeed(r.prospect.pos,n));
      const note=rni>=0?` (${team.abbr} need #${rni+1})`:'';
      return `${r.prospect.name} (${r.prospect.pos}, ${r.prospect.grade})${note}`;
    });
    parts.push(`Also considered: ${also.join('; ')}`);
  }
  return parts.join('. ')+'.';
}

function runPredictDraft(){
  generateProspects();
  available=[...ALL_PROSPECTS];
  initPickOwnership();
  const results=[];
  for(let i=0;i<TOTAL_PICKS;i++){
    const{scored,team,teamIdx}=scoreProspects(i,true);
    const winner=scored[0];
    const prospect=winner?winner.prospect:available[0];
    const grade=gradePick(i,prospect,teamIdx);
    const runnersUp=[];
    const seenPos=new Set([prospect.pos]);
    for(let j=1;j<scored.length&&runnersUp.length<2;j++){
      if(!seenPos.has(scored[j].prospect.pos)){seenPos.add(scored[j].prospect.pos);runnersUp.push(scored[j]);}
    }
    const reason=generatePickReason(i,prospect,team,winner.needIndex,winner.combineScore,winner.slide,winner.isLocked,runnersUp);
    const confidence=Math.min(95,Math.max(25,85-i*0.25-(Math.floor(i/32)*5)));
    results.push({pick:i,teamIdx,prospect,grade,confidence:Math.round(confidence),reason});
    available=available.filter(p=>p!==prospect);
  }
  return results;
}

// ===== NAVIGATION =====
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');}

function goHome(){
  stopSim();currentPick=0;draftResults=[];available=[];userTeamIdx=-1;mode='manual';tradeLog=[];
  ALL_PROSPECTS.forEach(p=>delete p._pickContext);
  showScreen('homeScreen');updatePickCounter();
  const cb=document.getElementById('expertModeCheck');if(cb)cb.checked=!!window.expertMode;
}
function toggleExpertMode(){
  window.expertMode=!!document.getElementById('expertModeCheck')?.checked;
}
function showTeamSelect(){renderTeamGrid();showScreen('teamSelectScreen');}

function startFullAuto(){
  mode='auto';userTeamIdx=-1;initDraft();showScreen('draftScreen');updateControls();
}
function selectTeam(idx){
  mode='manual';userTeamIdx=idx;initDraft();showScreen('draftScreen');updateControls();
}

function renderPredictRound(picks){
  const g=document.getElementById('resultsGrid');g.innerHTML='';
  picks.forEach((r,idx)=>{
    const team=TEAMS[r.teamIdx];const{prospect,grade,confidence,reason}=r;
    const wrapper=document.createElement('div');wrapper.className='predict-pick-wrapper';wrapper.style.animation=`fadeSlideUp 0.3s ease ${idx*0.03}s both`;
    const row=document.createElement('div');row.className='result-row predict-row';
    row.innerHTML=`
      <div class="result-pick-num">${r.pick+1}</div>
      <div class="result-team-logo" style="background:${team.color}">${team.abbr}</div>
      <div class="result-info">
        <div class="result-team-name">${team.name}</div>
        <div class="result-player-name">${prospect.name}${prospect.redFlag?'<span class="red-flag-sm">⚠</span>':''}</div>
      </div>
      <div class="result-pos">${prospect.pos}</div>
      <div class="result-school">${prospect.school}</div>
      <div class="result-grade-badge ${gradeColor(grade)}">${grade}</div>
      <div class="confidence-pill">${confidence}%</div>
      <div class="expand-arrow">▾</div>
    `;
    const reasonDiv=document.createElement('div');reasonDiv.className='pick-reason';
    reasonDiv.innerHTML=`<div class="reason-icon">💡</div><div class="reason-text">${reason||''}</div>`;
    row.addEventListener('click',()=>{
      wrapper.classList.toggle('expanded');
    });
    const viewBtn=document.createElement('button');viewBtn.className='reason-view-btn';viewBtn.textContent='View Profile';
    viewBtn.addEventListener('click',(e)=>{e.stopPropagation();openPlayerModal(prospect);});
    reasonDiv.appendChild(viewBtn);
    wrapper.appendChild(row);wrapper.appendChild(reasonDiv);g.appendChild(wrapper);
  });
}

function startPredictMode(){
  showScreen('resultsScreen');
  const results=runPredictDraft();
  resultsRoundTab=0;
  document.getElementById('resultsSubtitle').textContent='AI-Predicted Mock Draft — Click any pick to see the reasoning';
  document.getElementById('resultsGradeHero').style.display='none';
  window._predictResults=results;
  renderPredictRound(results.slice(0,PICKS_PER_ROUND));
  const tabContainer=document.getElementById('resultsRoundTabs');tabContainer.innerHTML='';
  for(let i=0;i<TOTAL_ROUNDS;i++){
    const btn=document.createElement('button');btn.className='rr-tab'+(i===0?' active':'');
    btn.textContent='Round '+(i+1);
    btn.onclick=()=>{
      tabContainer.querySelectorAll('.rr-tab').forEach(t=>t.classList.remove('active'));
      btn.classList.add('active');
      renderPredictRound(window._predictResults.slice(i*PICKS_PER_ROUND,(i+1)*PICKS_PER_ROUND));
    };
    tabContainer.appendChild(btn);
  }
}

// ===== INIT DRAFT =====
function initDraft(){
  currentPick=0;draftResults=[];tradeLog=[];
  generateProspects();available=[...ALL_PROSPECTS];
  initPickOwnership();activeRoundTab=0;activePosFilter='ALL';stopSim();
  renderRoundTabs();renderDraftBoard();renderBPA();renderPositionFilters();
  updateOnTheClock();updatePickCounter();updateCenterPanel();updateControls();updateMyGrade();
}

// ===== CONTROLS =====
function isUserPick(){
  if(mode==='auto'||userTeamIdx<0)return false;
  return getTeamForPick(currentPick)===userTeamIdx;
}
function updateControls(){
  const btnNext=document.getElementById('btnNextPick');
  const btnSim=document.getElementById('btnSimToMe');
  const btnAuto=document.getElementById('btnAutoPick');
  const btnAll=document.getElementById('btnSimAll');
  const btnTrade=document.getElementById('btnTrade');
  if(currentPick>=TOTAL_PICKS){btnNext.disabled=true;btnSim.disabled=true;btnAuto.disabled=true;btnAll.disabled=true;if(btnTrade)btnTrade.style.display='none';return;}
  if(mode==='auto'){
    btnNext.style.display='';btnNext.disabled=false;
    btnSim.style.display='none';btnAuto.style.display='none';
    btnAll.style.display='';btnAll.disabled=false;
    if(btnTrade)btnTrade.style.display='none';
  }else{
    const up=isUserPick();
    btnNext.style.display=up?'none':'';btnNext.disabled=false;
    btnSim.style.display=up?'none':'';btnSim.disabled=false;
    btnAuto.style.display=up?'':'none';btnAuto.disabled=false;
    btnAll.style.display='';btnAll.disabled=false;
    if(btnTrade)btnTrade.style.display=up?'':'none';
  }
}

// ===== ON THE CLOCK =====
function updateOnTheClock(){
  if(currentPick>=TOTAL_PICKS)return;
  const teamIdx=getTeamForPick(currentPick),team=TEAMS[teamIdx];
  const round=getRoundForPick(currentPick)+1,pickInRound=(currentPick%PICKS_PER_ROUND)+1;
  const otc=document.getElementById('onTheClock');
  otc.className='on-the-clock'+(isUserPick()?' user-pick':'');
  document.getElementById('clockLogo').style.background=team.color;
  document.getElementById('clockLogo').textContent=team.abbr;
  document.getElementById('clockTeamName').textContent=team.name;
  document.getElementById('clockPickNum').textContent=`Round ${round} — Pick ${pickInRound} (Overall #${currentPick+1})`;
  document.getElementById('clockNeeds').innerHTML=team.needs.map(n=>`<span class="need-tag">${n}</span>`).join('');
}
function updatePickCounter(){
  const r=Math.min(getRoundForPick(currentPick)+1,7),p=Math.min((currentPick%PICKS_PER_ROUND)+1,32);
  document.getElementById('pickCounter').textContent=`Round ${r} • Pick ${p}/32`;
}

// ===== ROUND TABS =====
function renderRoundTabs(){
  const c=document.getElementById('roundTabs');c.innerHTML='';
  for(let i=0;i<TOTAL_ROUNDS;i++){
    const btn=document.createElement('button');
    btn.className='round-tab';
    const cur=getRoundForPick(Math.min(currentPick,TOTAL_PICKS-1));
    if(i===cur)btn.classList.add('active');
    if(i<cur)btn.classList.add('has-pick');
    btn.textContent=`Rd ${i+1}`;
    btn.onclick=()=>{activeRoundTab=i;renderRoundTabs();renderDraftBoard();};
    c.appendChild(btn);
  }
  activeRoundTab=getRoundForPick(Math.min(currentPick,TOTAL_PICKS-1));
}

// ===== DRAFT BOARD =====
function renderDraftBoard(){
  const list=document.getElementById('draftPicksList');list.innerHTML='';
  const start=activeRoundTab*PICKS_PER_ROUND,end=start+PICKS_PER_ROUND;
  for(let i=start;i<end;i++){
    const teamIdx=getTeamForPick(i),team=TEAMS[teamIdx],result=draftResults[i];
    const row=document.createElement('div');row.className='draft-pick-row';row.id='pick-row-'+i;
    if(i===currentPick)row.classList.add('current');
    if(i<currentPick)row.classList.add('completed');
    if(mode==='manual'&&teamIdx===userTeamIdx)row.classList.add('user-team');
    let inner=`<div class="pick-number">${i+1}</div><div class="pick-team-logo-sm" style="background:${team.color}">${team.abbr}</div><div class="pick-details"><div class="team-name-sm">${team.name}</div>${result?`<div class="player-picked">${result.prospect.name} — ${result.prospect.pos}</div>`:''}</div>`;
    if(result)inner+=`<div class="pick-grade-badge ${gradeColor(result.grade)}">${result.grade}</div>`;
    row.innerHTML=inner;
    if(result)row.onclick=()=>openPlayerModal(result.prospect);
    list.appendChild(row);
  }
  const cur=document.getElementById('pick-row-'+currentPick);
  if(cur)cur.scrollIntoView({behavior:'smooth',block:'nearest'});
}

// ===== BPA =====
function renderBPA(){
  const list=document.getElementById('bpaList');
  list.innerHTML=available.map((p,i)=>`<div class="bpa-row" onclick="openPlayerModal(ALL_PROSPECTS[${ALL_PROSPECTS.indexOf(p)}])"><div class="bpa-rank">${i+1}</div><div class="bpa-name">${p.name}</div><div class="bpa-pos">${p.pos}</div><div class="bpa-grade">${p.grade}</div></div>`).join('');
}

// ===== MY GRADE =====
function updateMyGrade(){
  const panel=document.getElementById('myGradePanel');
  if(mode==='auto'||userTeamIdx<0){panel.style.display='none';return;}
  const grade=getTeamDraftGrade(userTeamIdx);
  if(!grade){panel.style.display='none';return;}
  panel.style.display='';
  const picks=draftResults.filter(r=>r&&r.teamIdx===userTeamIdx);
  document.getElementById('myGradeDisplay').innerHTML=`<div class="my-grade-letter ${gradeColor(grade)}">${grade}</div><div class="my-grade-details">${TEAMS[userTeamIdx].name}<br>${picks.length} pick${picks.length>1?'s':''} made</div>`;
}

// ===== CENTER PANEL =====
function updateCenterPanel(){
  const disp=document.getElementById('pickDisplay'),userArea=document.getElementById('userPickArea');
  if(currentPick>=TOTAL_PICKS){
    disp.classList.add('active');userArea.classList.remove('active');
    document.getElementById('pickAnnouncement').innerHTML=`<div class="pa-label">Draft Complete</div><div class="pa-name" style="margin-top:16px">All 224 Picks Are In</div>`;
    setTimeout(showResults,1500);return;
  }
  if(isUserPick()){disp.classList.remove('active');userArea.classList.add('active');renderProspectList();}
  else{disp.classList.add('active');userArea.classList.remove('active');showWaiting();}
}
function showWaiting(){
  const team=TEAMS[getTeamForPick(currentPick)];
  document.getElementById('pickAnnouncement').innerHTML=`<div class="pa-label">Pick ${currentPick+1}</div><div class="pa-team" style="font-size:22px;color:var(--text-primary);margin-top:8px">${team.name}</div><div style="color:var(--text-muted);margin-top:8px;font-size:14px">Use the controls above to advance</div>`;
}
function showPickAnnouncement(result){
  const{prospect,teamIdx,grade}=result;const team=TEAMS[teamIdx];
  const pc=POS_COLORS[prospect.pos]||'#3498db';const ini=prospect.name.split(' ').map(w=>w[0]).join('');
  const disp=document.getElementById('pickDisplay');disp.classList.add('active');
  document.getElementById('userPickArea').classList.remove('active');
  const ctx=prospect._pickContext;
  let breakdownHTML='';
  if(ctx){
    const needsHTML=ctx.teamNeeds.map((n,i)=>`<span class="pa-need-tag${posMatchesNeed(prospect.pos,n)?' pa-need-filled':''}">${i===0?'&#9733; ':''}${n}</span>`).join('');
    const w=ctx.winner;
    const needLabel=w.needIndex===0?'Fills #1 need':w.needIndex===1?'Fills top-2 need':w.needIndex>=0?'Fills positional need':'Best player available';
    const factors=[needLabel];
    if(w.combineScore>70)factors.push('Elite athleticism');
    else if(w.combineScore>55)factors.push('Solid athletic testing');
    else if(w.combineScore<35)factors.push('Below-average testing');
    if(w.slide>10)factors.push(`Slid ${w.slide} spots — great value`);
    else if(w.slide>5)factors.push('Good value at this slot');
    else if(w.slide<-8)factors.push('Slight reach');
    if(w.tendencyMatch)factors.push(`Fits ${ctx.teamAbbr} draft tendencies`);
    if(prospect.redFlag)factors.push(`Warning: ${prospect.redFlag}`);
    let runnersHTML='';
    if(ctx.runnersUp.length){
      runnersHTML='<div class="pa-runners-label">Also Considered</div><div class="pa-runners">';
      ctx.runnersUp.forEach(r=>{
        const rni=ctx.teamNeeds.findIndex(n=>posMatchesNeed(r.prospect.pos,n));
        const rNeedLabel=rni===0?'#1 need':rni>=0?'Need #'+(rni+1):'Non-need';
        const rpc=POS_COLORS[r.prospect.pos]||'#3498db';
        runnersHTML+=`<div class="pa-runner"><div class="pa-runner-avatar" style="background:${rpc}">${r.prospect.name.split(' ').map(x=>x[0]).join('')}</div><div class="pa-runner-info"><div class="pa-runner-name">${r.prospect.name}</div><div class="pa-runner-meta">${r.prospect.pos} — ${r.prospect.school} — Grade ${r.prospect.grade}</div><div class="pa-runner-reason">${rNeedLabel} · Ranked #${r.rank}</div></div></div>`;
      });
      runnersHTML+='</div>';
    }
    breakdownHTML=`<div class="pa-breakdown"><div class="pa-needs-row">${needsHTML}</div><div class="pa-why-label">Why This Pick</div><div class="pa-factors">${factors.map(f=>`<span class="pa-factor">${f}</span>`).join('')}</div>${runnersHTML}</div>`;
    delete prospect._pickContext;
  }
  document.getElementById('pickAnnouncement').innerHTML=`<div class="animate-in"><div class="pa-label">Pick ${currentPick}</div><div class="pa-team">The ${team.name} select</div><div class="pa-avatar" style="background:${pc}">${ini}</div><div class="pa-name">${prospect.name}</div><div class="pa-details">${prospect.pos} — ${prospect.school}${prospect.height?' — '+prospect.height+', '+prospect.weight+' lbs':''}</div><div class="pa-grade-badge ${gradeColor(grade)}">${grade}</div>${breakdownHTML}<button class="pa-view-btn" onclick="openPlayerModal(ALL_PROSPECTS[${ALL_PROSPECTS.indexOf(prospect)}])">View Player Profile</button></div>`;
}

// ===== PROSPECT LIST =====
function renderPositionFilters(){
  const ps=['ALL','QB','RB','WR','TE','OT','IOL','EDGE','DT','LB','CB','S'];
  document.getElementById('positionFilters').innerHTML=ps.map(p=>`<button class="pos-filter${p===activePosFilter?' active':''}" onclick="activePosFilter='${p}';renderPositionFilters();renderProspectList()">${p}</button>`).join('');
}
function renderProspectList(){
  const c=document.getElementById('availableProspects');const search=(document.getElementById('searchInput').value||'').toLowerCase();
  const ut=TEAMS[userTeamIdx];
  let filtered=available.filter(p=>{
    const ms=!search||p.name.toLowerCase().includes(search)||p.school.toLowerCase().includes(search)||p.pos.toLowerCase().includes(search);
    const mp=activePosFilter==='ALL'||p.pos===activePosFilter;return ms&&mp;
  });
  c.innerHTML='';
  filtered.slice(0,50).forEach(p=>{
    const pc=POS_COLORS[p.pos]||'#3498db';const rank=ALL_PROSPECTS.indexOf(p)+1;
    const isNeed=ut.needs.some(n=>posMatchesNeed(p.pos,n));
    const ini=p.name.split(' ').map(w=>w[0]).join('');
    const row=document.createElement('div');row.className='prospect-row';
    row.innerHTML=`<div class="pr-rank">${rank}</div><div class="pr-avatar" style="background:${pc}">${ini}</div><div class="pr-info"><div class="pr-name">${p.name}${isNeed?'<span class="need-star"> ★ NEED</span>':''}${p.redFlag?'<span class="red-flag-tag"> ⚠ '+p.redFlag+'</span>':''}</div><div class="pr-meta">${p.pos} • ${p.school}${p.height?' • '+p.height+', '+p.weight+' lbs':''}</div></div><div class="pr-grade-col"><div class="pr-grade-val">${p.grade}</div><div class="pr-grade-lbl">Grade</div></div><div class="pr-actions"><button class="info-btn" title="View Profile">i</button><button class="draft-btn">Draft</button></div>`;
    row.querySelector('.info-btn').addEventListener('click',e=>{e.stopPropagation();openPlayerModal(p);});
    row.querySelector('.draft-btn').addEventListener('click',e=>{e.stopPropagation();userDraftPlayer(p);});
    row.addEventListener('click',()=>openPlayerModal(p));
    c.appendChild(row);
  });
}

function userDraftPlayer(prospect){
  spawnConfetti();makePick(prospect);
  const result=draftResults[currentPick-1];showPickAnnouncement(result);
  renderDraftBoard();renderRoundTabs();renderBPA();updateMyGrade();
  setTimeout(()=>{if(currentPick>=TOTAL_PICKS)updateCenterPanel();else{updateOnTheClock();updateControls();updateCenterPanel();}},1200);
}

// ===== SIM CONTROLS =====
function stopSim(){simRunning=false;if(simTimer){clearTimeout(simTimer);simTimer=null;}}

function simNextPick(){
  if(currentPick>=TOTAL_PICKS||simRunning)return;
  if(isUserPick()){updateCenterPanel();updateControls();return;}
  const prospect=aiPick(currentPick);makePick(prospect);
  showPickAnnouncement(draftResults[currentPick-1]);
  const cr=getRoundForPick(currentPick-1);if(cr!==activeRoundTab){activeRoundTab=cr;renderRoundTabs();}
  renderDraftBoard();renderBPA();updateMyGrade();
  setTimeout(()=>{if(currentPick>=TOTAL_PICKS)updateCenterPanel();else{updateOnTheClock();updateControls();updateCenterPanel();}},300);
}

function simToMyPick(){if(currentPick>=TOTAL_PICKS||simRunning)return;simRunning=true;runSimToMe();}
function runSimToMe(){
  if(!simRunning||currentPick>=TOTAL_PICKS){stopSim();updateControls();return;}
  if(isUserPick()){stopSim();updateOnTheClock();updateControls();updateCenterPanel();return;}
  const speed=parseInt(document.getElementById('speedSelect').value);
  const prospect=aiPick(currentPick);makePick(prospect);showPickAnnouncement(draftResults[currentPick-1]);
  const cr=getRoundForPick(currentPick-1);if(cr!==activeRoundTab){activeRoundTab=cr;renderRoundTabs();}
  renderDraftBoard();renderBPA();updateMyGrade();
  if(currentPick>=TOTAL_PICKS){stopSim();setTimeout(()=>updateCenterPanel(),500);return;}
  if(isUserPick()){stopSim();setTimeout(()=>{updateOnTheClock();updateControls();updateCenterPanel();},400);return;}
  simTimer=setTimeout(runSimToMe,speed);
}

function autoPickForMe(){if(currentPick>=TOTAL_PICKS||!isUserPick())return;userDraftPlayer(aiPick(currentPick));}

function simRestOfDraft(){if(currentPick>=TOTAL_PICKS||simRunning)return;simRunning=true;runSimAll();}
function runSimAll(){
  if(!simRunning||currentPick>=TOTAL_PICKS){stopSim();updateControls();if(currentPick>=TOTAL_PICKS)updateCenterPanel();return;}
  const speed=parseInt(document.getElementById('speedSelect').value);
  const prospect=aiPick(currentPick);makePick(prospect);showPickAnnouncement(draftResults[currentPick-1]);
  const cr=getRoundForPick(currentPick-1);if(cr!==activeRoundTab){activeRoundTab=cr;renderRoundTabs();}
  renderDraftBoard();renderBPA();updateMyGrade();
  if(currentPick>=TOTAL_PICKS){stopSim();setTimeout(()=>updateCenterPanel(),500);return;}
  simTimer=setTimeout(runSimAll,speed);
}

// ===== TRADE MODAL =====
function showTradeModal(){
  const offers=findTradeOffers();
  const modal=document.getElementById('tradeModal');
  const body=document.getElementById('tradeModalBody');
  if(!offers.length){
    body.innerHTML='<p style="color:var(--text-secondary);text-align:center;padding:20px">No trade offers available for this pick.</p>';
    modal.classList.add('active');return;
  }
  body.innerHTML=`<h3 style="margin-bottom:16px;font-size:15px">Trade Down from Pick #${currentPick+1}</h3><p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px">Your pick value: <strong style="color:var(--accent-gold)">${getPickValue(currentPick)} pts</strong></p><div class="trade-offers">${offers.map((o,i)=>`
    <div class="trade-offer" onclick="acceptTrade(${i})">
      <div class="to-team"><div class="pick-team-logo-sm" style="background:${o.teamColor}">${o.teamAbbr}</div><strong>${o.teamName}</strong></div>
      <div class="to-details">
        <div class="to-give"><span class="to-label">You give:</span> Pick #${o.give.map(p=>p+1).join(', #')}<span class="to-val">(${o.giveVal} pts)</span></div>
        <div class="to-receive"><span class="to-label">You get:</span> Pick #${o.receive.map(p=>p+1).join(', #')}<span class="to-val">(${o.receiveVal} pts)</span></div>
      </div>
      <div class="to-btn">Accept</div>
    </div>
  `).join('')}</div>`;
  modal.classList.add('active');
  window._tradeOffers=offers;
}

function acceptTrade(idx){
  const offer=window._tradeOffers[idx];
  executeTrade(offer);
  document.getElementById('tradeModal').classList.remove('active');
  renderDraftBoard();updateOnTheClock();updateControls();updateCenterPanel();
}

function closeTradeModal(){document.getElementById('tradeModal').classList.remove('active');}

// ===== PLAYER MODAL =====
function openPlayerModal(prospect){
  const modal=document.getElementById('playerModal'),body=document.getElementById('modalBody');
  const pc=POS_COLORS[prospect.pos]||'#3498db';const ini=prospect.name.split(' ').map(w=>w[0]).join('');
  const rank=ALL_PROSPECTS.indexOf(prospect)+1;
  let projRound='UDFA';
  if(rank<=32)projRound='Round 1';else if(rank<=64)projRound='Round 2';else if(rank<=96)projRound='Round 3';
  else if(rank<=128)projRound='Round 4';else if(rank<=160)projRound='Round 5';else if(rank<=192)projRound='Round 6';else if(rank<=224)projRound='Round 7';
  const cs=prospect.combine?Math.round(getCombineScore(prospect)):'-';

  const isRealProspect=!!TOP_PROSPECTS.find(tp=>tp.name===prospect.name);
  let combineHTML='';
  if(prospect.combine){
    const isProjected=prospect.combine._status==='projected';
    const statusLabel=isProjected?'<span class="combine-status projected">Projected</span>':'<span class="combine-status official">Official</span>';
    combineHTML=`<div class="pm-section-title" style="color:var(--accent-blue)">Athletic Testing ${statusLabel}</div>`;
    if(isProjected) combineHTML+=`<div class="combine-disclaimer"><strong>⚠ These numbers are projected estimates, not official results.</strong> The 2026 NFL Combine is in progress. Projections are based on position-average ranges adjusted by scouting grade. Official measurements will replace these as they are released. Check <a href="https://www.nfl.com/combine/" target="_blank" rel="noopener" style="color:var(--accent-blue)">NFL.com/combine</a> for real results.</div>`;
    // Check if fully DNP (official status, all drill values null)
    const drills=POS_DRILLS[prospect.pos]||POS_DRILLS.LB;
    const applicableDrillKeys=Object.keys(COMBINE_LABELS).filter(k=>drills[k]);
    const isFullDNP=prospect.combine._status==='official'&&applicableDrillKeys.every(k=>prospect.combine[k]===null);
    if(isFullDNP){
      combineHTML+=`<div class="combine-dnp-full" style="padding:16px 20px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:10px;margin:12px 0;color:var(--text-secondary);font-size:14px;text-align:center;">Did not participate in athletic testing — will test at Pro Day</div>`;
    } else {
    combineHTML+='<div class="combine-grid">';
    for(const k of applicableDrillKeys){
      const val=prospect.combine[k];
      if(val===null){
        combineHTML+=`<div class="combine-stat dnp"><div class="cs-label">${COMBINE_LABELS[k]}</div><div class="cs-value cs-dnp">DNP</div><div class="cs-dnp-note">Did not participate — will test at Pro Day</div></div>`;
        continue;
      }
      if(val===undefined) continue;
      const range=COMBINE_RANGES[prospect.pos]||COMBINE_RANGES.LB;
      const[lo,hi]=range[k];
      let pct;if(COMBINE_LOWER_BETTER[k])pct=1-(val-lo)/(hi-lo);else pct=(val-lo)/(hi-lo);
      pct=Math.max(0,Math.min(1,pct))*100;
      const color=pct>70?'var(--grade-a)':pct>40?'var(--grade-b)':'var(--grade-c)';
      combineHTML+=`<div class="combine-stat"><div class="cs-label">${COMBINE_LABELS[k]}${isProjected?' <span style="color:var(--grade-c);font-size:8px">EST</span>':''}</div><div class="cs-value">${val}${COMBINE_UNITS[k]}</div><div class="cs-bar-bg"><div class="cs-bar" style="width:${pct}%;background:${color}"></div></div></div>`;
    }
    const drillCount=Object.keys(drills).filter(k=>drills[k]).length;
    const doneCount=Object.keys(drills).filter(k=>drills[k]&&prospect.combine[k]!==null&&prospect.combine[k]!==undefined).length;
    combineHTML+=`</div><div style="margin:8px 0 16px;font-size:12px;color:var(--text-muted)">Projected Combine Score: <strong style="color:var(--accent-blue)">${cs}/100</strong> &bull; ${doneCount}/${drillCount} drills${isProjected?' (all estimated)':''}</div>`;
    } // end else (not full DNP)
  }
  const comparables=findCombineComparables(prospect);
  if(comparables.length&&prospect.combine&&(prospect.combine.forty||prospect.combine.vert||prospect.combine.broad)){
    const isOfficial=prospect.combine._status==='official';
    combineHTML+=`<div class="pm-section-title" style="color:var(--accent-gold);margin-top:12px">Similar NFL Combine Performers</div>${!isOfficial?'<div class="comp-note">Projected testing — similar athletic profiles from historical NFL combine data</div>':''}<div class="combine-comparables">`;
    comparables.forEach(h=>{
      const parts=[];if(h.forty)parts.push(h.forty.toFixed(2)+'s 40');if(h.vert)parts.push(h.vert+'" vert');if(h.broad)parts.push(Math.floor(h.broad/12)+"'"+Math.round(h.broad%12)+'" broad');
      combineHTML+=`<div class="comp-card"><div class="comp-name">${h.name}</div><div class="comp-meta">${h.pos} &bull; ${h.year} &bull; ${h.team}</div><div class="comp-stats">${parts.join(' &bull; ')}</div></div>`;
    });
    combineHTML+=`</div>`;
  }
  // Position-specific on-field drills
  const fieldDrills=POS_FIELD_DRILLS[prospect.pos]||[];
  if(fieldDrills.length){
    combineHTML+=`<div class="pm-section-title" style="color:var(--text-muted);font-size:12px;margin-top:4px">${prospect.pos} Combine On-Field Drills</div><div class="field-drills">${fieldDrills.map(d=>'<span class="field-drill-tag">'+d+'</span>').join('')}</div>`;
  }

  const redFlagHTML=prospect.redFlag?`<div class="pm-red-flag"><span class="rf-icon">⚠</span> <strong>${prospect.redFlag}</strong> — This concern may cause the player to slide on draft day despite his talent level.</div>`:'';

  body.innerHTML=`
    <div class="player-modal-header"><div class="pm-avatar" style="background:${pc}">${ini}</div><div class="pm-info"><div class="pm-name">${prospect.name}</div><div class="pm-meta">${prospect.pos} • ${prospect.school}</div>${prospect.height?`<div class="pm-measurements">${prospect.height}, ${prospect.weight} lbs</div>`:''}<div class="pm-grade-row"><div class="pm-badge grade-a">Grade: ${prospect.grade}</div><div class="pm-badge" style="background:rgba(255,255,255,0.06);color:var(--text-secondary)">Rank #${rank}</div><div class="pm-badge" style="background:rgba(255,255,255,0.06);color:var(--text-secondary)">${projRound}</div>${prospect.redFlag?'<div class="pm-badge" style="background:rgba(239,68,68,0.15);color:var(--accent-red)">⚠ Flag</div>':''}</div></div></div>
    ${redFlagHTML}
    <div class="pm-bio">${prospect.bio}</div>
    ${!isRealProspect?'<div class="data-notice">This is a simulated prospect created for later-round depth. Name, school, and scouting data are procedurally generated.</div>':''}
    ${combineHTML}
    <div class="pm-section-title strengths">Strengths</div><ul class="pm-list strengths">${(prospect.strengths||[]).map(s=>'<li>'+s+'</li>').join('')}</ul>
    <div class="pm-section-title weaknesses">Weaknesses</div><ul class="pm-list weaknesses">${(prospect.weaknesses||[]).map(w=>'<li>'+w+'</li>').join('')}</ul>
    ${isRealProspect?`<div class="data-notice" style="border-color:rgba(59,130,246,0.2);background:rgba(59,130,246,0.04);color:var(--text-muted)">Scouting analysis based on publicly available film evaluation and draft coverage. For official evaluations, see NFL.com.</div>`:''}
    <div class="pm-external-links">
      ${isRealProspect?`<a href="https://www.nfl.com/prospects/?query=${encodeURIComponent(prospect.name)}" target="_blank" rel="noopener" class="pm-nfl-link">View on NFL.com Prospects &rarr;</a>`:''}
      ${isRealProspect?`<a href="https://www.espn.com/nfl/draft/rounds/_/round/1" target="_blank" rel="noopener" class="pm-nfl-link" style="margin-left:6px">ESPN Draft &rarr;</a>`:''}
    </div>
  `;
  modal.classList.add('active');
}
function closePlayerModal(){document.getElementById('playerModal').classList.remove('active');}
function closeModal(e){if(e.target===document.getElementById('playerModal'))closePlayerModal();}

// ===== RESULTS =====
function showResults(){
  stopSim();showScreen('resultsScreen');resultsRoundTab=0;
  if(mode==='manual'&&userTeamIdx>=0){
    const grade=getTeamDraftGrade(userTeamIdx),team=TEAMS[userTeamIdx];
    const picks=draftResults.filter(r=>r&&r.teamIdx===userTeamIdx);
    document.getElementById('resultsSubtitle').textContent=`Your ${team.name} Draft Class`;
    document.getElementById('resultsGradeHero').style.display='flex';
    document.getElementById('resultsGradeHero').innerHTML=`<div class="rgh-letter ${gradeColor(grade||'C')}">${grade||'C'}</div><div class="rgh-info"><div class="rgh-team">${team.name}</div><div class="rgh-detail">${picks.length} picks • Overall Draft Grade${tradeLog.length?' • '+tradeLog.length+' trade(s) made':''}</div></div>`;
  }else{
    document.getElementById('resultsSubtitle').textContent='2026 NFL Draft — Full Results';
    document.getElementById('resultsGradeHero').style.display='none';
  }
  renderResultsRoundTabs();renderResultsGrid();
}

function renderResultsRoundTabs(){
  const c=document.getElementById('resultsRoundTabs');let tabs='';
  if(mode==='manual'&&userTeamIdx>=0)tabs+=`<button class="rr-tab${resultsRoundTab===-1?' active':''}" onclick="resultsRoundTab=-1;renderResultsRoundTabs();renderResultsGrid()">My Picks</button>`;
  tabs+=`<button class="rr-tab${resultsRoundTab===-2?' active':''}" onclick="resultsRoundTab=-2;renderResultsRoundTabs();renderResultsGrid()">Compare to Experts</button>`;
  for(let i=0;i<TOTAL_ROUNDS;i++)tabs+=`<button class="rr-tab${resultsRoundTab===i?' active':''}" onclick="resultsRoundTab=${i};renderResultsRoundTabs();renderResultsGrid()">Round ${i+1}</button>`;
  c.innerHTML=tabs;
}

function renderResultsGrid(){
  const grid=document.getElementById('resultsGrid');const compareSection=document.getElementById('resultsCompareSection');
  const compareGrid=document.getElementById('resultsCompareGrid');
  if(resultsRoundTab===-2){
    grid.style.display='none';if(compareSection)compareSection.style.display='block';
    if(compareGrid){
      compareGrid.innerHTML='<div class="compare-row compare-header"><div>Pick</div><div>Team</div><div>Our Pick</div><div>Expert Consensus</div><div>Match</div></div>';
      for(let i=0;i<32;i++){
        const r=draftResults[i];const expert=getExpertConsensusPickAtSlot(i+1);
        const ourPick=r?.prospect?.name||'—';const match=ourPick===expert;
        const team=r?TEAMS[r.teamIdx]:null;const teamAbbr=team?.abbr||'—';const teamColor=team?.color||'#333';
        const row=document.createElement('div');row.className='compare-row'+(match?' match':'');
        row.innerHTML=`<div class="compare-pick">${i+1}</div><div class="compare-team" style="background:${teamColor}">${teamAbbr}</div><div class="compare-ours">${ourPick}</div><div class="compare-expert">${expert||'—'}</div><div class="compare-match">${match?'✓' :'—'}</div>`;
        compareGrid.appendChild(row);
      }
    }
    return;
  }
  if(compareSection)compareSection.style.display='none';grid.style.display='grid';
  grid.innerHTML='';
  let picks=[];
  if(resultsRoundTab===-1&&mode==='manual')picks=draftResults.map((r,i)=>r?{...r,pickNum:i}:null).filter(r=>r&&r.teamIdx===userTeamIdx);
  else{const s=resultsRoundTab*PICKS_PER_ROUND,e=s+PICKS_PER_ROUND;for(let i=s;i<e;i++)if(draftResults[i])picks.push({...draftResults[i],pickNum:i});}
  picks.forEach((result,idx)=>{
    const{prospect,teamIdx,grade,pickNum}=result;const team=TEAMS[teamIdx];const isUser=(mode==='manual'&&teamIdx===userTeamIdx);
    const row=document.createElement('div');row.className='result-row'+(isUser?' user-pick-result':'');
    row.style.animation=`fadeSlideUp 0.3s ease ${idx*0.03}s both`;row.onclick=()=>openPlayerModal(prospect);
    row.innerHTML=`<div class="result-pick-num">${pickNum+1}</div><div class="result-team-logo" style="background:${team.color}">${team.abbr}</div><div class="result-info"><div class="result-team-name">${team.name}${isUser?' <span style="color:var(--accent-gold);font-weight:700">(YOU)</span>':''}</div><div class="result-player-name">${prospect.name}</div></div><div class="result-pos">${prospect.pos}</div><div class="result-school">${prospect.school}</div><div class="result-grade-badge ${gradeColor(grade)}">${grade}</div>`;
    grid.appendChild(row);
  });
}

// ===== TEAM GRID =====
function renderTeamGrid(){
  const grid=document.getElementById('teamGrid');grid.innerHTML='';
  TEAMS.forEach((team,i)=>{
    const card=document.createElement('div');card.className='team-card';card.onclick=()=>selectTeam(i);
    card.innerHTML=`<div class="team-logo-circle" style="background:${team.color}">${team.abbr}</div><div class="team-info"><h3>${team.name}</h3><div class="pick-num">Pick #${i+1} each round</div></div>`;
    grid.appendChild(card);
  });
}

// ===== CONFETTI =====
function spawnConfetti(){
  const c=document.getElementById('confettiContainer');const colors=['#013369','#d50a0a','#c9b037','#22c55e','#3b82f6','#fff'];
  for(let i=0;i<50;i++){const el=document.createElement('div');el.className='confetti';el.style.left=Math.random()*100+'%';el.style.background=colors[Math.floor(Math.random()*colors.length)];el.style.width=(Math.random()*8+4)+'px';el.style.height=(Math.random()*8+4)+'px';el.style.borderRadius=Math.random()>0.5?'50%':'2px';el.style.animationDuration=(Math.random()*2+1.5)+'s';el.style.animationDelay=(Math.random()*0.5)+'s';c.appendChild(el);setTimeout(()=>el.remove(),4000);}
}

// ===== LEGAL PAGES =====
const LEGAL_PAGES = {
  about: `<h1>About Draft Simulator</h1>
<p>Draft Simulator is an independent, fan-made NFL mock draft tool that lets you experience the thrill of the NFL Draft. Our AI engine uses team needs, combine measurables, player grades, and historical tendencies to simulate realistic draft scenarios.</p>
<h2>Features</h2>
<ul>
<li><strong>Draft for Your Team</strong> — Control every pick for your favorite franchise</li>
<li><strong>Full Mock Draft</strong> — Watch the AI run all 224 picks</li>
<li><strong>Predict the Draft</strong> — AI-generated predictions with explanations</li>
<li><strong>Combine Data</strong> — Position-specific measurements (official when available, projected otherwise)</li>
<li><strong>Trade System</strong> — Trade picks using the Jimmy Johnson value chart</li>
<li><strong>Grading</strong> — Every pick graded A+ to D- based on value and need</li>
</ul>
<h2>Data Sources & Expert Comparison</h2>
<p>Prospect grades and scouting reports are based on publicly available information from NFL.com, ESPN, and other draft media. Combine measurements are sourced from official NFL Combine results when available, or projected based on position averages and pro day estimates.</p>
<p><strong>Expert mock drafts we reference:</strong></p>
<ul>
<li><a href="https://www.espn.com/nfl/draft2026/story/_/id/47989848/2026-nfl-mock-draft-kiper-32-picks-pre-combine-predictions-round-1" target="_blank" rel="noopener">Mel Kiper (ESPN)</a></li>
<li><a href="https://www.nfl.com/news/daniel-jeremiah-2026-nfl-mock-draft-2-0" target="_blank" rel="noopener">Daniel Jeremiah (NFL.com)</a></li>
<li><a href="https://www.nfl.com/news/bucky-brooks-2026-nfl-mock-draft-2-0-jets-grab-edge-rusher-receiver-rams-double-dip-on-dbs" target="_blank" rel="noopener">Bucky Brooks (NFL.com)</a></li>
<li><a href="https://www.nbcsports.com/nfl/news/2026-nfl-mock-draft-pre-nfl-combine-mendoza-remains-no-1-overall-but-giants-go-defense-at-no-5" target="_blank" rel="noopener">Eric Froton (NBC Sports)</a></li>
<li><a href="https://www.sportingnews.com/us/nfl/news/nfl-mock-drafts-2026-latest-mel-kiper-daniel-jeremiah/a56ef658d0a93ed560070f92" target="_blank" rel="noopener">Sporting News comparison (Vinnie Iyer + all experts)</a></li>
</ul>
<p><strong>Combine data:</strong> <a href="https://www.nfl.com/combine/tracker/live-results/" target="_blank" rel="noopener">NFL.com Combine Tracker</a></p>
<p><em>Our rankings are independent and may differ from expert mocks. Consensus picks (e.g. Mendoza #1, Sonny Styles in the teens) are noted where relevant. Enable "Expert mode" to use a consensus big board based on these experts.</em></p>
<p>View official prospect profiles at <a href="https://www.nfl.com/prospects/" target="_blank" rel="noopener">NFL.com/prospects</a>.</p>`,

  terms: `<h1>Terms of Service</h1>
<p><em>Last updated: February 2026</em></p>
<h2>1. Acceptance of Terms</h2>
<p>By accessing and using Draft Simulator ("the Service"), you agree to be bound by these Terms of Service.</p>
<h2>2. Description of Service</h2>
<p>Draft Simulator is an entertainment tool that simulates NFL draft scenarios. It is not a gambling or betting service. All predictions and simulations are for entertainment purposes only.</p>
<h2>3. User Accounts</h2>
<p>You may create an account to access premium features. You are responsible for maintaining the security of your account and password. You must provide accurate information when creating an account.</p>
<h2>4. Premium Subscriptions</h2>
<p>Premium features require a paid subscription. Subscriptions renew automatically unless cancelled. You may cancel at any time through your account settings or by contacting us. Refunds are handled on a case-by-case basis.</p>
<h2>5. Acceptable Use</h2>
<p>You agree not to: (a) use the Service for any illegal purpose; (b) attempt to gain unauthorized access; (c) scrape or harvest data from the Service; (d) resell or redistribute the Service.</p>
<h2>6. Intellectual Property</h2>
<p>The Service's code, design, and original content are our intellectual property. NFL team names, player names, and statistics are used for informational/editorial purposes under fair use. NFL logos and trademarks are property of the National Football League.</p>
<h2>7. Disclaimer of Warranties</h2>
<p>The Service is provided "as is" without warranties of any kind. We do not guarantee the accuracy of predictions, grades, or combine data.</p>
<h2>8. Limitation of Liability</h2>
<p>We shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</p>
<h2>9. Changes to Terms</h2>
<p>We reserve the right to modify these terms at any time. Continued use after changes constitutes acceptance.</p>`,

  privacy: `<h1>Privacy Policy</h1>
<p><em>Last updated: February 2026</em></p>
<h2>1. Information We Collect</h2>
<p><strong>Account Information:</strong> Email address and encrypted password when you create an account.</p>
<p><strong>Usage Data:</strong> Mock draft results you choose to save, team preferences, and basic analytics (page views, feature usage).</p>
<p><strong>Payment Data:</strong> Processed by Stripe. We never see or store your full credit card number.</p>
<h2>2. How We Use Your Information</h2>
<ul>
<li>To provide and maintain the Service</li>
<li>To process subscription payments</li>
<li>To save your mock draft history</li>
<li>To improve the Service based on usage patterns</li>
</ul>
<h2>3. Third-Party Services</h2>
<p><strong>Supabase:</strong> Database and authentication. <a href="https://supabase.com/privacy" target="_blank" rel="noopener">Supabase Privacy Policy</a></p>
<p><strong>Stripe:</strong> Payment processing. <a href="https://stripe.com/privacy" target="_blank" rel="noopener">Stripe Privacy Policy</a></p>
<p><strong>Twitter/X:</strong> Embedded timelines on news pages. Subject to <a href="https://twitter.com/en/privacy" target="_blank" rel="noopener">X Privacy Policy</a></p>
<h2>4. Data Retention</h2>
<p>Account and draft data is retained while your account is active. You may request deletion of your account and all associated data at any time.</p>
<h2>5. Your Rights (GDPR/UK)</h2>
<p>You have the right to: access your data, correct inaccurate data, request deletion, and data portability. Contact us to exercise these rights.</p>
<h2>6. Cookies</h2>
<p>We use essential cookies for authentication. No advertising or tracking cookies are used.</p>
<h2>7. Contact</h2>
<p>For privacy inquiries, contact us via the email associated with this service.</p>`,

  disclaimer: `<h1>NFL Disclaimer</h1>
<p><strong>This is an independent fan-made draft simulator for entertainment purposes only.</strong></p>
<p>Draft Simulator is NOT affiliated with, endorsed by, sponsored by, or connected to the National Football League (NFL), any NFL team, the NFL Players Association (NFLPA), or any related entity.</p>
<h2>Use of Names and Data</h2>
<p>Team names, city names, and player names are used for informational and editorial purposes only, consistent with fair use principles. No team logos, NFL shield, or trademarked imagery is used in this application.</p>
<p>Combine measurements, when marked as "Official," are sourced from publicly available results reported by NFL.com and media outlets. When marked as "Projected," they are estimates based on position averages and should not be treated as factual.</p>
<h2>Predictions and Grades</h2>
<p>All mock draft predictions, pick grades, and player evaluations are generated by our AI algorithm for entertainment. They do not represent insider knowledge, official NFL evaluations, or guaranteed outcomes.</p>
<h2>External Links</h2>
<p>Links to NFL.com, ESPN.com, SB Nation team blogs, and Twitter/X are provided for convenience. We have no control over and assume no responsibility for their content.</p>
<h2>Official Resources</h2>
<p>For official NFL prospect information, visit <a href="https://www.nfl.com/prospects/" target="_blank" rel="noopener">NFL.com Prospects</a>.</p>`,

  dataSources: `<h1>Data Sources & Expert Comparison</h1>
<p>Draft Simulator uses publicly available prospect data and expert mock drafts to power its simulations. Here's where our information comes from and how we compare to the experts.</p>
<h2>Expert Mock Drafts</h2>
<p>We reference the latest mock drafts from leading draft analysts. Rankings may differ — our simulator uses its own grading and team-need logic.</p>
<ul>
<li><a href="https://www.espn.com/nfl/draft2026/story/_/id/47989848/2026-nfl-mock-draft-kiper-32-picks-pre-combine-predictions-round-1" target="_blank" rel="noopener">Mel Kiper (ESPN)</a> — Pre-combine 32-pick mock</li>
<li><a href="https://www.nfl.com/news/daniel-jeremiah-2026-nfl-mock-draft-2-0" target="_blank" rel="noopener">Daniel Jeremiah (NFL.com)</a> — Mock Draft 2.0</li>
<li><a href="https://www.nfl.com/news/bucky-brooks-2026-nfl-mock-draft-2-0-jets-grab-edge-rusher-receiver-rams-double-dip-on-dbs" target="_blank" rel="noopener">Bucky Brooks (NFL.com)</a> — Mock Draft 2.0</li>
<li><a href="https://www.nbcsports.com/nfl/news/2026-nfl-mock-draft-pre-nfl-combine-mendoza-remains-no-1-overall-but-giants-go-defense-at-no-5" target="_blank" rel="noopener">Eric Froton (NBC Sports)</a> — Pre-combine mock</li>
<li><a href="https://www.sportingnews.com/us/nfl/news/nfl-mock-drafts-2026-latest-mel-kiper-daniel-jeremiah/a56ef658d0a93ed560070f92" target="_blank" rel="noopener">Sporting News</a> — Side-by-side comparison (Kiper, Jeremiah, Brooks, Froton, Iyer)</li>
</ul>
<h2>Combine Data</h2>
<p><a href="https://www.nfl.com/combine/tracker/live-results/" target="_blank" rel="noopener">NFL.com Combine Tracker</a> — Official live results. You can import combine data via our import script to update prospect measurables.</p>
<h2>Disclaimer</h2>
<p>Our rankings are independent and may differ from expert mocks. Consensus picks (e.g. Fernando Mendoza #1 overall, Sonny Styles commonly in the teens) are reflected in our "Expert mode" big board. Enable Expert mode on the home screen to simulate using a consensus ranking derived from these analysts.</p>`,
};

function showLegalPage(page) {
  const content = document.getElementById('legalContent');
  content.innerHTML = LEGAL_PAGES[page] || '<p>Page not found.</p>';
  showScreen('legalScreen');
}

// ===== SHARE DRAFT =====
function shareDraft(){
  const subtitle = document.getElementById('resultsSubtitle')?.textContent || '2026 NFL Mock Draft';
  const grade = document.getElementById('resultsGradeHero')?.querySelector('.rgh-letter')?.textContent || '';
  const gradeText = grade ? ` — Grade: ${grade}` : '';
  const text = `I just ran a 2026 NFL Mock Draft${gradeText}! Check out the full results:\n\n🏈 ${subtitle}\n\nhttps://mockdraft.onrender.com\n\n#NFLDraft #MockDraft #NFL2026`;
  if(navigator.share){
    navigator.share({ title:'2026 NFL Mock Draft', text, url:'https://mockdraft.onrender.com' }).catch(()=>{});
  } else {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank', 'width=560,height=400');
  }
}

// ===== THEME TOGGLE =====
function applyTheme(theme){
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const btn = document.getElementById('themeToggle');
  if(btn) btn.setAttribute('data-theme', theme);
  // Reload Twitter embeds so they reflect the new theme
  if(window.twttr && window.twttr.widgets && document.querySelector('.twitter-timeline')){
    window.twttr.widgets.load();
  }
}
function toggleTheme(){
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}
function initTheme(){
  const saved = localStorage.getItem('theme') || 'dark';
  applyTheme(saved);
}

// ===== COOKIE CONSENT =====
function initCookieBanner(){
  const consent=localStorage.getItem('cookieConsent');
  if(!consent){
    const banner=document.getElementById('cookieBanner');
    if(banner) setTimeout(()=>{ banner.style.display='block'; },800);
  }
}
function acceptCookies(){
  localStorage.setItem('cookieConsent','accepted');
  closeCookieBanner();
}
function declineCookies(){
  localStorage.setItem('cookieConsent','declined');
  closeCookieBanner();
}
function closeCookieBanner(){
  const banner=document.getElementById('cookieBanner');
  if(banner){ banner.style.animation='slideDownCookie 0.25s ease forwards'; setTimeout(()=>{ banner.style.display='none'; },260); }
}

// ===== MOBILE NAV TOGGLE =====
function toggleMobileNav(){
  const btn=document.getElementById('hamburgerBtn');
  const nav=document.getElementById('headerNav');
  if(btn&&nav){
    btn.classList.toggle('active');
    nav.classList.toggle('mobile-open');
  }
}
// Close mobile nav when a nav link is clicked
document.addEventListener('click',function(e){
  if(e.target.classList.contains('nav-link')){
    const btn=document.getElementById('hamburgerBtn');
    const nav=document.getElementById('headerNav');
    if(btn&&nav){btn.classList.remove('active');nav.classList.remove('mobile-open');}
  }
});

document.addEventListener('DOMContentLoaded',()=>{
  initTheme();
  generateProspects();
  const cb=document.getElementById('expertModeCheck');if(cb)cb.checked=!!window.expertMode;
  initCookieBanner();
  // Init AdSense units
  try{ (window.adsbygoogle=window.adsbygoogle||[]).push({}); }catch(e){}
});
