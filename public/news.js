// ============================================
// News Feed — Draft Experts + RSS
// ============================================

// ===== DRAFT EXPERTS DATABASE =====
const DRAFT_INDUSTRY_EXPERTS = [
  {name:'Mel Kiper Jr.',handle:'MelKiperESPN',outlet:'ESPN',role:'Senior Draft Analyst'},
  {name:'Daniel Jeremiah',handle:'MoveTheSticks',outlet:'NFL Network',role:'Draft Analyst'},
  {name:'Dane Brugler',handle:'dpbrugler',outlet:'The Athletic',role:'Draft Analyst'},
  {name:'Lance Zierlein',handle:'LanceZierlein',outlet:'NFL.com',role:'Draft Analyst'},
  {name:'Jordan Reid',handle:'Jordan_Reid',outlet:'ESPN',role:'Draft Analyst'},
  {name:'Bucky Brooks',handle:'BuckyBrooks',outlet:'NFL Network',role:'Draft Analyst'},
  {name:'Chad Reuter',handle:'chad_reuter',outlet:'NFL.com',role:'Mock Draft Analyst'},
  {name:'Trevor Sikkema',handle:'TampaBayTre',outlet:'PFF',role:'Draft Analyst'},
  {name:'Benjamin Solak',handle:'BenjaminSolak',outlet:'ESPN',role:'Draft Analyst'},
  {name:'Kyle Crabbs',handle:'GrsAreGreener',outlet:'The 33rd Team',role:'Draft Analyst'},
  {name:'Todd McShay',handle:'McShay13',outlet:'The McShay Report',role:'Draft Analyst'},
  {name:'Matt Miller',handle:'nfldraftscout',outlet:'ESPN',role:'Draft Analyst'},
  {name:'Jim Nagy',handle:'JimNagy_SB',outlet:'Senior Bowl',role:'Executive Director'},
  {name:'Mike Renner',handle:'mikerenner_',outlet:'PFF',role:'Lead Draft Analyst'},
  {name:'Connor Rogers',handle:'ConnorJRogers',outlet:'PFF / NBC Sports',role:'Draft Analyst'},
  {name:'Eric Edholm',handle:'Eric_Edholm',outlet:'NFL.com',role:'Draft Analyst'},
  {name:'Chris Trapasso',handle:'ChrisTrapasso',outlet:'CBS Sports',role:'Draft Analyst'},
  {name:'Ryan Wilson',handle:'ryanwilsonCBS',outlet:'CBS Sports',role:'Draft Analyst'},
  {name:'Emory Hunt',handle:'FBallGameplan',outlet:'CBS Sports / Football Gameplan',role:'Draft Analyst'},
  {name:'Nate Tice',handle:'Nate_Tice',outlet:'Yahoo Sports',role:'NFL Analyst'},
  {name:'Cynthia Frelund',handle:'cfrelund',outlet:'NFL Network',role:'Analytics Analyst'},
  {name:'Charles Davis',handle:'charl3s13',outlet:'NFL Network / CBS',role:'Draft Analyst'},
];

const TEAM_BEAT_REPORTERS = {
  LV: [
    {name:'Vincent Bonsignore',handle:'VinnyBonsignore',outlet:'Las Vegas Review-Journal'},
    {name:'Tashan Reed',handle:'tashanreed',outlet:'The Athletic'},
    {name:'Paul Gutierrez',handle:'PGutierrezESPN',outlet:'ESPN'},
  ],
  NYJ: [
    {name:'Rich Cimini',handle:'RichCimini',outlet:'ESPN'},
    {name:'Connor Hughes',handle:'Connor_J_Hughes',outlet:'SNY'},
    {name:'Zack Rosenblatt',handle:'ZackBlatt',outlet:'The Athletic'},
  ],
  ARI: [
    {name:'Josh Weinfuss',handle:'joshweinfuss',outlet:'ESPN'},
    {name:'Darren Urban',handle:'Cardschatter',outlet:'AZCardinals.com'},
    {name:'Howard Balzer',handle:'HBalzer721',outlet:'SI / Cardinals'},
  ],
  TEN: [
    {name:'Turron Davenport',handle:'TDavenport_NFL',outlet:'ESPN'},
    {name:'Terry McCormick',handle:'terrymc13',outlet:'Titan Insider'},
    {name:'Paul Kuharsky',handle:'PaulKuharsky',outlet:'PaulKuharsky.com'},
  ],
  NYG: [
    {name:'Jordan Raanan',handle:'JordanRaanan',outlet:'ESPN'},
    {name:'Dan Duggan',handle:'DDuggan21',outlet:'The Athletic'},
    {name:'Art Stapleton',handle:'art_stapleton',outlet:'NorthJersey.com'},
  ],
  CLE: [
    {name:'Jake Trotter',handle:'Jake_Trotter',outlet:'ESPN'},
    {name:'Zac Jackson',handle:'AkronJackson',outlet:'The Athletic'},
    {name:'Mary Kay Cabot',handle:'MaryKayCabot',outlet:'Cleveland.com'},
  ],
  WAS: [
    {name:'John Keim',handle:'john_keim',outlet:'ESPN'},
    {name:'Ben Standig',handle:'BenStandig',outlet:'The Athletic'},
    {name:'Nicki Jhabvala',handle:'NickiJhabvala',outlet:'Washington Post'},
  ],
  NO: [
    {name:'Katherine Terrell',handle:'Kat_Terrell',outlet:'ESPN'},
    {name:'Jeff Duncan',handle:'JeffDuncan_',outlet:'The Times-Picayune'},
    {name:'Nick Underhill',handle:'Nick_Underhill',outlet:'NewOrleans.Football'},
  ],
  KC: [
    {name:'Adam Teicher',handle:'adamteicher',outlet:'ESPN'},
    {name:'Nate Taylor',handle:'ByNateTaylor',outlet:'The Athletic'},
    {name:'Sam McDowell',handle:'SamMcDowell11',outlet:'Kansas City Star'},
  ],
  CIN: [
    {name:'Ben Baby',handle:'Ben_Baby',outlet:'ESPN'},
    {name:'Jay Morrison',handle:'JayMorrisonATH',outlet:'The Athletic'},
    {name:'Kelsey Conway',handle:'KelseyLConway',outlet:'Cincinnati Enquirer'},
  ],
  MIA: [
    {name:'Marcel Louis-Jacques',handle:'Marcel_LJ',outlet:'ESPN'},
    {name:'David Furones',handle:'DavidFurones_',outlet:'South Florida Sun Sentinel'},
    {name:'Joe Schad',handle:'schadjoe',outlet:'Palm Beach Post'},
  ],
  DAL: [
    {name:'Todd Archer',handle:'toddarcher',outlet:'ESPN'},
    {name:'Jon Machota',handle:'jonmachota',outlet:'The Athletic'},
    {name:'Calvin Watkins',handle:'calvinwatkins',outlet:'Dallas Morning News'},
  ],
  ATL: [
    {name:'Michael Rothstein',handle:'MikeRothstein',outlet:'ESPN'},
    {name:'Josh Kendall',handle:'JoshKendallATH',outlet:'The Athletic'},
    {name:'Tori McElhaney',handle:'tori_mcelhaney',outlet:'AtlantaFalcons.com'},
  ],
  BAL: [
    {name:'Jamison Hensley',handle:'jamisonhensley',outlet:'ESPN'},
    {name:'Jeff Zrebiec',handle:'jeffzrebiec',outlet:'The Athletic'},
    {name:'Jonas Shaffer',handle:'jonas_shaffer',outlet:'Baltimore Banner'},
  ],
  TB: [
    {name:'Jenna Laine',handle:'JennaLaineESPN',outlet:'ESPN'},
    {name:'Greg Auman',handle:'gregauman',outlet:'Fox Sports'},
    {name:'Rick Stroud',handle:'NFLSTROUD',outlet:'Tampa Bay Times'},
  ],
  IND: [
    {name:'Stephen Holder',handle:'HolderStephen',outlet:'ESPN'},
    {name:'Zak Keefer',handle:'zkeefer',outlet:'The Athletic'},
    {name:'Joel Erickson',handle:'JoelAErickson',outlet:'Indianapolis Star'},
  ],
  DET: [
    {name:'Eric Woodyard',handle:'E_Woodyard',outlet:'ESPN'},
    {name:'Colton Pouncy',handle:'colton_pouncy',outlet:'The Athletic'},
    {name:'Dave Birkett',handle:'davebirkett',outlet:'Detroit Free Press'},
  ],
  MIN: [
    {name:'Kevin Seifert',handle:'SeifertESPN',outlet:'ESPN'},
    {name:'Alec Lewis',handle:'alec_lewis',outlet:'The Athletic'},
    {name:'Ben Goessling',handle:'BenGoessling',outlet:'Star Tribune'},
  ],
  CAR: [
    {name:'David Newton',handle:'DNewtonespn',outlet:'ESPN'},
    {name:'Joe Person',handle:'josephperson',outlet:'The Athletic'},
    {name:'Sheena Quick',handle:'Sheena_Marie3',outlet:'Fox 46'},
  ],
  GB: [
    {name:'Rob Demovsky',handle:'RobDemovsky',outlet:'ESPN'},
    {name:'Matt Schneidman',handle:'mattschneidman',outlet:'The Athletic'},
    {name:'Ryan Wood',handle:'ByRyanWood',outlet:'USA Today'},
  ],
  PIT: [
    {name:'Brooke Pryor',handle:'bepryor',outlet:'ESPN'},
    {name:'Mark Kaboly',handle:'MarkKaboly',outlet:'The Athletic'},
    {name:'Ray Fittipaldo',handle:'rayfitt1',outlet:'Pittsburgh Post-Gazette'},
  ],
  LAC: [
    {name:'Kris Rhim',handle:'krisrhim1',outlet:'ESPN'},
    {name:'Daniel Popper',handle:'danielrpopper',outlet:'The Athletic'},
    {name:'Jeff Miller',handle:'JeffMillerLAT',outlet:'LA Times'},
  ],
  PHI: [
    {name:'Tim McManus',handle:'Tim_McManus',outlet:'ESPN'},
    {name:'Zach Berman',handle:'ZBermanATH',outlet:'The Athletic'},
    {name:'Jeff McLane',handle:'Jeff_McLane',outlet:'Philadelphia Inquirer'},
  ],
  JAX: [
    {name:'Mike DiRocco',handle:'ESPNdirocco',outlet:'ESPN'},
    {name:'Demetrius Harvey',handle:'Demetrius82',outlet:'The Athletic'},
    {name:'John Reid',handle:'JohnReid64',outlet:'Florida Times-Union'},
  ],
  CHI: [
    {name:'Courtney Cronin',handle:'CourtneyRCronin',outlet:'ESPN'},
    {name:'Kevin Fishbain',handle:'kfishbain',outlet:'The Athletic'},
    {name:'Brad Biggs',handle:'BradBiggs',outlet:'Chicago Tribune'},
  ],
  BUF: [
    {name:'Alaina Getzenberg',handle:'agetzenberg',outlet:'ESPN'},
    {name:'Joe Buscaglia',handle:'JoeBuscaglia',outlet:'The Athletic'},
    {name:'Vic Carucci',handle:'viccarucci',outlet:'Buffalo News'},
  ],
  SF: [
    {name:'Nick Wagoner',handle:'nwagoner',outlet:'ESPN'},
    {name:'David Lombardi',handle:'LombardiHimself',outlet:'The Athletic'},
    {name:'Matt Maiocco',handle:'MaioccoNBCS',outlet:'NBC Sports Bay Area'},
  ],
  HOU: [
    {name:'DJ Bien-Aime',handle:'Djbienaime',outlet:'ESPN'},
    {name:'Aaron Reiss',handle:'aaronreiss',outlet:'The Athletic'},
    {name:'Jonathan Alexander',handle:'JAlexanderNFL',outlet:'Houston Chronicle'},
  ],
  LAR: [
    {name:'Sarah Barshop',handle:'SarahBarshop',outlet:'ESPN'},
    {name:'Jourdan Rodrigue',handle:'JourdanRodrigue',outlet:'The Athletic'},
    {name:'Gary Klein',handle:'garykleinLAT',outlet:'LA Times'},
  ],
  DEN: [
    {name:'Jeff Legwold',handle:'JFLegwold',outlet:'ESPN'},
    {name:'Nick Kosmider',handle:'NickKosmider',outlet:'The Athletic'},
    {name:'Ryan O\'Halloran',handle:'ryanohalloran',outlet:'Denver Post'},
  ],
  NE: [
    {name:'Mike Reiss',handle:'MikeReiss',outlet:'ESPN'},
    {name:'Chad Graff',handle:'ChadGraff',outlet:'The Athletic'},
    {name:'Ben Volin',handle:'BenVolin',outlet:'Boston Globe'},
  ],
  SEA: [
    {name:'Brady Henderson',handle:'BradyHenderson',outlet:'ESPN'},
    {name:'Michael-Shawn Dugar',handle:'MikeDugar',outlet:'The Athletic'},
    {name:'Bob Condotta',handle:'bcondotta',outlet:'Seattle Times'},
  ],
};

let newsTeam = null;

function showNewsScreen(teamAbbr) {
  if (!teamAbbr) {
    const fav = typeof getFavoriteTeam === 'function' ? getFavoriteTeam() : null;
    teamAbbr = newsTeam || fav || (typeof userTeamIdx !== 'undefined' && userTeamIdx >= 0 ? TEAMS[userTeamIdx].abbr : 'SEA');
  }
  newsTeam = teamAbbr;
  showScreen('newsScreen');
  renderNewsTeamPicker();
  loadTeamNews(teamAbbr);
}

function renderNewsTeamPicker() {
  const picker = document.getElementById('newsTeamPicker');
  picker.innerHTML = TEAMS.map(t => `
    <button class="news-team-btn${t.abbr === newsTeam ? ' active' : ''}"
      style="--tc:${t.color}" onclick="showNewsScreen('${t.abbr}')">${t.abbr}</button>
  `).join('');
}

function renderExpertCard(expert) {
  return `<a href="https://x.com/${expert.handle}" target="_blank" rel="noopener" class="expert-card">
    <div class="expert-avatar">${expert.name.split(' ').map(w=>w[0]).join('')}</div>
    <div class="expert-info">
      <div class="expert-name">${expert.name}</div>
      <div class="expert-handle">@${expert.handle}</div>
      <div class="expert-outlet">${expert.outlet}${expert.role ? ' \u2022 ' + expert.role : ''}</div>
    </div>
    <div class="expert-follow-icon">\u2197</div>
  </a>`;
}

async function loadTeamNews(team) {
  const feed = document.getElementById('newsFeed');
  const teamObj = TEAMS.find(t => t.abbr === team);
  const teamReporters = TEAM_BEAT_REPORTERS[team] || [];

  feed.innerHTML = `
    <div class="news-section">
      <h3 class="news-section-title">${teamObj?.name || team} Beat Reporters</h3>
      <div class="expert-grid">
        ${teamReporters.map(e => renderExpertCard(e)).join('')}
      </div>
    </div>
    <div class="news-section">
      <h3 class="news-section-title">NFL Draft Analysts</h3>
      <div class="expert-grid">
        ${DRAFT_INDUSTRY_EXPERTS.map(e => renderExpertCard(e)).join('')}
      </div>
    </div>
    <div class="news-section">
      <h3 class="news-section-title">Latest Articles</h3>
      <div id="rssArticles" class="rss-articles">
        <div class="loading-text">Loading news...</div>
      </div>
    </div>
    <div class="news-section">
      <h3 class="news-section-title">Draft Resources</h3>
      <div class="resource-links">
        <a href="https://www.nfl.com/prospects/" target="_blank" rel="noopener" class="resource-link">
          <span class="rl-icon">\uD83C\uDFC8</span>
          <div><strong>NFL.com Prospects</strong><span>Official prospect profiles & combine data</span></div>
        </a>
        <a href="https://www.nfl.com/draft/tracker/picks" target="_blank" rel="noopener" class="resource-link">
          <span class="rl-icon">\uD83D\uDCCA</span>
          <div><strong>NFL Draft Tracker</strong><span>Live pick tracker during the draft</span></div>
        </a>
        <a href="https://www.espn.com/nfl/draft/rounds" target="_blank" rel="noopener" class="resource-link">
          <span class="rl-icon">\uD83D\uDCF0</span>
          <div><strong>ESPN Draft Coverage</strong><span>Analysis, mock drafts & grades</span></div>
        </a>
      </div>
    </div>
  `;

  // Fetch RSS
  try {
    const res = await fetch(`/api/news/${team}`);
    const data = await res.json();
    const el = document.getElementById('rssArticles');
    if (data.items?.length) {
      el.innerHTML = data.items.map(item => `
        <a href="${item.link}" target="_blank" rel="noopener" class="rss-article">
          <div class="rss-title">${item.title}</div>
          <div class="rss-desc">${item.description}</div>
          <div class="rss-meta">${data.source} &bull; ${item.pubDate ? new Date(item.pubDate).toLocaleDateString() : ''}</div>
        </a>
      `).join('');
    } else {
      el.innerHTML = '<p class="empty-state">No articles available right now.</p>';
    }
  } catch {
    const el = document.getElementById('rssArticles');
    if (el) el.innerHTML = '<p class="empty-state">News feed unavailable \u2014 check back later.</p>';
  }
}
