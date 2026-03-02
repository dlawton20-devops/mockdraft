// ============================================
// News Feed — Twitter Embeds + RSS
// ============================================

const TEAM_TWITTER_HANDLES = {
  LV: ['Raiders'], NYJ: ['nyjets'], ARI: ['AZCardinals'], TEN: ['Titans'],
  NYG: ['Giants'], CLE: ['Browns'], WAS: ['Commanders'], NO: ['Saints'],
  KC: ['Chiefs'], CIN: ['Bengals'], MIA: ['MiamiDolphins'], DAL: ['dallascowboys'],
  ATL: ['AtlantaFalcons'], BAL: ['Ravens'], TB: ['Buccaneers'], IND: ['Colts'],
  DET: ['Lions'], MIN: ['Vikings'], CAR: ['Panthers'], GB: ['packers'],
  PIT: ['steelers'], LAC: ['chargers'], PHI: ['Eagles'], JAX: ['Jaguars'],
  CHI: ['ChicagoBears'], BUF: ['BuffaloBills'], SF: ['49ers'], HOU: ['HoustonTexans'],
  LAR: ['RamsNFL'], DEN: ['Broncos'], NE: ['Patriots'], SEA: ['Seahawks'],
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

async function loadTeamNews(team) {
  const feed = document.getElementById('newsFeed');
  const teamObj = TEAMS.find(t => t.abbr === team);
  const handle = TEAM_TWITTER_HANDLES[team]?.[0] || team;

  feed.innerHTML = `
    <div class="news-section">
      <h3 class="news-section-title">${teamObj?.name || team} Draft News</h3>
      <div class="news-twitter-embed">
        <a class="twitter-timeline"
          href="https://twitter.com/${handle}"
          data-theme="${document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'}" data-height="500" data-chrome="noheader nofooter noborders transparent"
          data-tweet-limit="5">
          Loading @${handle} tweets...
        </a>
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
          <span class="rl-icon">🏈</span>
          <div><strong>NFL.com Prospects</strong><span>Official prospect profiles & combine data</span></div>
        </a>
        <a href="https://www.nfl.com/draft/tracker/picks" target="_blank" rel="noopener" class="resource-link">
          <span class="rl-icon">📊</span>
          <div><strong>NFL Draft Tracker</strong><span>Live pick tracker during the draft</span></div>
        </a>
        <a href="https://www.espn.com/nfl/draft/rounds" target="_blank" rel="noopener" class="resource-link">
          <span class="rl-icon">📰</span>
          <div><strong>ESPN Draft Coverage</strong><span>Analysis, mock drafts & grades</span></div>
        </a>
      </div>
    </div>
  `;

  // Reload Twitter widgets
  if (window.twttr && window.twttr.widgets) {
    window.twttr.widgets.load();
  }

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
    if (el) el.innerHTML = '<p class="empty-state">News feed unavailable — check back later.</p>';
  }
}
