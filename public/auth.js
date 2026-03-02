// ============================================
// Auth & Account Management (Supabase + Stripe)
// ============================================

let supabaseClient = null;
let currentUser = null;
let subscription = null;
let appConfig = null;

async function initAuth() {
  try {
    const res = await fetch('/api/config');
    appConfig = await res.json();
  } catch {
    appConfig = { supabaseUrl: '', supabaseAnonKey: '', stripePublishableKey: '' };
  }
  if (appConfig.supabaseUrl && appConfig.supabaseAnonKey &&
      appConfig.supabaseUrl !== 'https://placeholder.supabase.co') {
    supabaseClient = supabase.createClient(appConfig.supabaseUrl, appConfig.supabaseAnonKey);
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
      currentUser = session.user;
      await checkSubscription();
    }
    supabaseClient.auth.onAuthStateChange(async (event, session) => {
      currentUser = session?.user || null;
      if (currentUser) await checkSubscription();
      else subscription = null;
      updateAuthUI();
    });
  }
  updateAuthUI();
  const params = new URLSearchParams(window.location.search);
  if (params.get('subscription') === 'success') {
    setTimeout(() => {
      showToast('Subscription activated! Welcome to Premium.');
      checkSubscription();
    }, 500);
    window.history.replaceState({}, '', '/');
  }
}

function isPremium() {
  return subscription?.active === true;
}

async function checkSubscription() {
  if (!currentUser) { subscription = null; return; }
  try {
    const res = await fetch(`/api/subscription/${currentUser.id}`);
    subscription = await res.json();
  } catch { subscription = null; }
}

function updateAuthUI() {
  const authBtns = document.getElementById('authButtons');
  const premBadge = document.getElementById('premiumBadge');
  if (!authBtns) return;
  if (currentUser) {
    const name = currentUser.email?.split('@')[0] || 'User';
    authBtns.innerHTML = `
      <button class="header-btn" onclick="showAccountScreen()">${name}</button>
      <button class="header-btn outline" onclick="signOut()">Sign Out</button>
    `;
    if (premBadge) premBadge.style.display = isPremium() ? '' : 'none';
  } else {
    authBtns.innerHTML = `
      <button class="header-btn" onclick="showAuthModal('login')">Log In</button>
      <button class="header-btn primary" onclick="showAuthModal('signup')">Sign Up</button>
    `;
    if (premBadge) premBadge.style.display = 'none';
  }
}

function showAuthModal(mode) {
  const modal = document.getElementById('authModal');
  const body = document.getElementById('authModalBody');
  const isLogin = mode === 'login';
  body.innerHTML = `
    <h2>${isLogin ? 'Welcome Back' : 'Create Account'}</h2>
    <p class="auth-sub">${isLogin ? 'Log in to save your mock drafts' : 'Sign up to save drafts and get premium features'}</p>
    <button class="google-sso-btn" onclick="signInWithGoogle()">
      <svg width="18" height="18" viewBox="0 0 48 48" style="flex-shrink:0"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
      Continue with Google
    </button>
    <div class="auth-divider"><span>or</span></div>
    <form id="authForm" onsubmit="handleAuth(event, '${mode}')">
      <div class="form-group">
        <label>Email</label>
        <input type="email" id="authEmail" required placeholder="you@email.com" autocomplete="email">
      </div>
      <div class="form-group">
        <label>Password</label>
        <input type="password" id="authPassword" required placeholder="${isLogin ? 'Your password' : 'Min 6 characters'}" minlength="6" autocomplete="${isLogin ? 'current-password' : 'new-password'}">
      </div>
      <div id="authError" class="auth-error"></div>
      <button type="submit" class="auth-submit-btn">${isLogin ? 'Log In' : 'Create Account'}</button>
    </form>
    <div class="auth-switch">
      ${isLogin
        ? 'Don\'t have an account? <a href="#" onclick="showAuthModal(\'signup\');return false">Sign Up</a>'
        : 'Already have an account? <a href="#" onclick="showAuthModal(\'login\');return false">Log In</a>'}
    </div>
    <div class="auth-legal">By continuing, you agree to our <a href="#" onclick="showLegalPage('terms');return false">Terms of Service</a> and <a href="#" onclick="showLegalPage('privacy');return false">Privacy Policy</a>.</div>
  `;
  modal.classList.add('active');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('active');
}

async function signInWithGoogle() {
  if (!supabaseClient) {
    showToast('Auth not configured — add Supabase keys to .env');
    return;
  }
  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) showToast(error.message);
}

async function handleAuth(e, mode) {
  e.preventDefault();
  const email = document.getElementById('authEmail').value;
  const password = document.getElementById('authPassword').value;
  const errEl = document.getElementById('authError');
  errEl.textContent = '';
  if (!supabaseClient) {
    errEl.textContent = 'Auth not configured. See setup guide.';
    return;
  }
  try {
    let result;
    if (mode === 'signup') {
      result = await supabaseClient.auth.signUp({ email, password });
      if (result.error) throw result.error;
      errEl.style.color = 'var(--accent-green)';
      errEl.textContent = 'Check your email to confirm your account!';
      return;
    } else {
      result = await supabaseClient.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
    }
    closeAuthModal();
    showToast('Logged in successfully!');
  } catch (err) {
    errEl.style.color = 'var(--accent-red)';
    errEl.textContent = err.message || 'Authentication failed';
  }
}

async function signOut() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  currentUser = null;
  subscription = null;
  updateAuthUI();
  goHome();
  showToast('Signed out');
}

// ===== SUBSCRIPTION / PRICING =====
async function startCheckout() {
  if (!currentUser) { showAuthModal('signup'); return; }
  try {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id, email: currentUser.email }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else showToast('Payment setup not configured yet');
  } catch {
    showToast('Payment system not available');
  }
}

// ===== ACCOUNT SCREEN =====
function showAccountScreen() {
  showScreen('accountScreen');
  renderAccountPage();
}

async function renderAccountPage() {
  const content = document.getElementById('accountContent');
  if (!currentUser) { content.innerHTML = '<p>Please log in.</p>'; return; }
  const email = currentUser.email;
  const sub = isPremium();
  let historyHTML = '<p class="loading-text">Loading draft history...</p>';
  content.innerHTML = `
    <div class="account-header">
      <div class="account-avatar">${email[0].toUpperCase()}</div>
      <div class="account-info">
        <h2>${email}</h2>
        <div class="account-badge ${sub ? 'premium' : 'free'}">${sub ? 'Premium Member' : 'Free Account'}</div>
      </div>
    </div>
    ${!sub ? `<div class="upgrade-banner">
      <div class="ub-text"><strong>Upgrade to Premium — $10/month</strong><br>Save unlimited drafts, team news feeds, ad-free experience</div>
      <button class="auth-submit-btn" onclick="startCheckout()" style="margin:0;width:auto;padding:10px 24px">Subscribe</button>
    </div>` : ''}
    <div class="account-section">
      <h3>Favourite Team</h3>
      <p class="account-section-desc">Your news feed will default to this team when you visit the News tab.</p>
      <div class="fav-team-row">
        <select id="favTeamSelect" class="fav-team-select" onchange="saveFavoriteTeam(this.value)">
          <option value="">— Select a team —</option>
          ${(typeof TEAMS !== 'undefined' ? TEAMS : []).map(t => `<option value="${t.abbr}">${t.name} (${t.abbr})</option>`).join('')}
        </select>
        <button class="sim-btn" onclick="showNewsScreen(document.getElementById('favTeamSelect').value||undefined)">View News &rarr;</button>
      </div>
    </div>
    <h3 style="margin:24px 0 12px">Your Mock Draft History</h3>
    <div id="draftHistoryList">${historyHTML}</div>
  `;
  // Pre-select saved favourite team
  const favSel = document.getElementById('favTeamSelect');
  if (favSel) { const saved = getFavoriteTeam(); if (saved) favSel.value = saved; }

  try {
    const res = await fetch(`/api/drafts/${currentUser.id}`);
    const drafts = await res.json();
    const list = document.getElementById('draftHistoryList');
    if (!drafts.length) {
      list.innerHTML = '<p class="empty-state">No saved drafts yet. Complete a mock draft and save it!</p>';
      return;
    }
    list.innerHTML = drafts.map(d => `
      <div class="history-row">
        <div class="hr-date">${new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
        <div class="hr-mode">${d.mode === 'manual' ? 'Team Draft' : d.mode === 'auto' ? 'Full Sim' : 'Prediction'}</div>
        <div class="hr-team">${d.team_abbr || 'All Teams'}</div>
        <div class="hr-grade"><span class="result-grade-badge ${gradeColor(d.overall_grade || 'C')}">${d.overall_grade || '-'}</span></div>
        <button class="hr-delete" onclick="deleteDraft('${d.id}')">×</button>
      </div>
    `).join('');
  } catch {
    document.getElementById('draftHistoryList').innerHTML = '<p class="empty-state">Could not load draft history.</p>';
  }
}

async function saveDraft() {
  if (!currentUser) { showAuthModal('signup'); return; }
  if (!isPremium()) { showToast('Premium required to save drafts. Upgrade for $10/mo!'); return; }
  if (!draftResults || !draftResults.filter(Boolean).length) { showToast('No draft to save'); return; }
  const teamAbbr = userTeamIdx >= 0 ? TEAMS[userTeamIdx].abbr : null;
  const grade = userTeamIdx >= 0 ? getTeamDraftGrade(userTeamIdx) : null;
  const results = draftResults.map((r, i) => r ? {
    pick: i, team: TEAMS[r.teamIdx].abbr, player: r.prospect.name,
    pos: r.prospect.pos, school: r.prospect.school, grade: r.grade,
  } : null).filter(Boolean);
  try {
    await fetch('/api/drafts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id, mode, teamAbbr,
        overallGrade: grade, results, tradeLog,
      }),
    });
    showToast('Draft saved!');
  } catch { showToast('Failed to save draft'); }
}

async function deleteDraft(id) {
  try {
    await fetch(`/api/drafts/${id}`, { method: 'DELETE' });
    renderAccountPage();
  } catch { showToast('Failed to delete'); }
}

// ===== FAVOURITE TEAM =====
function getFavoriteTeam() {
  return localStorage.getItem('favoriteTeam') || null;
}
function saveFavoriteTeam(abbr) {
  localStorage.setItem('favoriteTeam', abbr);
  const el = document.getElementById('favTeamCurrent');
  if (el) {
    const t = (typeof TEAMS !== 'undefined') ? TEAMS.find(t => t.abbr === abbr) : null;
    el.textContent = t ? t.name : abbr;
  }
  showToast(`${abbr} set as your favourite team`);
  // Rerender the select to reflect saved state
  const sel = document.getElementById('favTeamSelect');
  if (sel) sel.value = abbr;
}

// ===== TOAST NOTIFICATIONS =====
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}

document.addEventListener('DOMContentLoaded', initAuth);
