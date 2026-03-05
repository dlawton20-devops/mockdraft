require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 8080;

let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_URL !== 'https://placeholder.supabase.co') {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || '');
}

let stripe;
try {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} catch (e) {
  console.warn('Stripe not configured — payment routes disabled');
}

// Stripe webhook needs raw body — must be before express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    if (userId && supabase) {
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        status: 'active',
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'user_id' });
    }
  }

  if (event.type === 'customer.subscription.deleted' && supabase) {
    const sub = event.data.object;
    await supabase.from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('stripe_subscription_id', sub.id);
  }

  res.json({ received: true });
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Stripe checkout session
app.post('/api/checkout', async (req, res) => {
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' });
  const { userId, email } = req.body;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      customer_email: email,
      metadata: { user_id: userId },
      success_url: `${process.env.APP_URL}?subscription=success`,
      cancel_url: `${process.env.APP_URL}?subscription=cancelled`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

const noDb = (res) => res.status(503).json({ error: 'Database not configured' });

// Check subscription status
app.get('/api/subscription/:userId', async (req, res) => {
  if (!supabase) return res.json({ active: false, data: null });
  const { data } = await supabase.from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', req.params.userId)
    .single();
  res.json({ active: data?.status === 'active', data: data || null });
});

// Save a mock draft
app.post('/api/drafts', async (req, res) => {
  if (!supabase) return noDb(res);
  const { userId, mode, teamAbbr, overallGrade, results, tradeLog } = req.body;
  const { data, error } = await supabase.from('mock_drafts').insert({
    user_id: userId, mode, team_abbr: teamAbbr,
    overall_grade: overallGrade, results, trade_log: tradeLog,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Get user's draft history
app.get('/api/drafts/:userId', async (req, res) => {
  if (!supabase) return res.json([]);
  const { data, error } = await supabase.from('mock_drafts')
    .select('id, created_at, mode, team_abbr, overall_grade')
    .eq('user_id', req.params.userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// Get a specific draft
app.get('/api/drafts/detail/:id', async (req, res) => {
  if (!supabase) return noDb(res);
  const { data, error } = await supabase.from('mock_drafts')
    .select('*').eq('id', req.params.id).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Delete a draft
app.delete('/api/drafts/:id', async (req, res) => {
  if (!supabase) return noDb(res);
  const { error } = await supabase.from('mock_drafts').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// RSS proxy for team news (avoids CORS)
const TEAM_RSS = {
  LV: 'https://www.silverandblackpride.com/rss/index.xml',
  NYJ: 'https://www.ganggreennation.com/rss/index.xml',
  ARI: 'https://www.revengeofthebirds.com/rss/index.xml',
  TEN: 'https://www.musiccitymiracles.com/rss/index.xml',
  NYG: 'https://www.bigblueview.com/rss/index.xml',
  CLE: 'https://www.dawgsbynature.com/rss/index.xml',
  WAS: 'https://www.hogshaven.com/rss/index.xml',
  NO: 'https://www.canalstreetchronicles.com/rss/index.xml',
  KC: 'https://www.arrowheadpride.com/rss/index.xml',
  CIN: 'https://www.cincinnatijungle.com/rss/index.xml',
  MIA: 'https://www.thephinsider.com/rss/index.xml',
  DAL: 'https://www.bloggingtheboys.com/rss/index.xml',
  ATL: 'https://www.thefalcoholic.com/rss/index.xml',
  BAL: 'https://www.baltimorebeatdown.com/rss/index.xml',
  TB: 'https://www.bucsation.com/rss/index.xml',
  IND: 'https://www.stampedeblue.com/rss/index.xml',
  DET: 'https://www.prideofdetroit.com/rss/index.xml',
  MIN: 'https://www.dailynorseman.com/rss/index.xml',
  CAR: 'https://www.catscratchreader.com/rss/index.xml',
  GB: 'https://www.acmepackingcompany.com/rss/index.xml',
  PIT: 'https://www.behindthesteelcurtain.com/rss/index.xml',
  LAC: 'https://www.boltsfromtheblue.com/rss/index.xml',
  PHI: 'https://www.bleedinggreennation.com/rss/index.xml',
  JAX: 'https://www.bigcatcountry.com/rss/index.xml',
  CHI: 'https://www.windycitygridiron.com/rss/index.xml',
  BUF: 'https://www.buffalorumblings.com/rss/index.xml',
  SF: 'https://www.ninersnation.com/rss/index.xml',
  HOU: 'https://www.battleredblog.com/rss/index.xml',
  LAR: 'https://www.turfshowtimes.com/rss/index.xml',
  DEN: 'https://www.milehighreport.com/rss/index.xml',
  NE: 'https://www.patspulpit.com/rss/index.xml',
  SEA: 'https://www.fieldgulls.com/rss/index.xml',
};

app.get('/api/news/:team', async (req, res) => {
  const team = req.params.team.toUpperCase();
  const url = TEAM_RSS[team];
  if (!url) return res.status(404).json({ error: 'Team not found' });
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'MockDraftSim/1.0 (RSS Reader)' },
      signal: AbortSignal.timeout(8000),
    });
    const text = await response.text();
    const xml2js = require('xml2js');
    const parsed = await xml2js.parseStringPromise(text);
    let items;
    if (parsed?.rss?.channel?.[0]?.item) {
      // RSS format
      items = parsed.rss.channel[0].item.slice(0, 15).map(item => ({
        title: item.title?.[0] || '',
        link: item.link?.[0] || '',
        pubDate: item.pubDate?.[0] || '',
        description: (item.description?.[0] || '').replace(/<[^>]*>/g, '').slice(0, 200),
      }));
    } else if (parsed?.feed?.entry) {
      // Atom format
      items = parsed.feed.entry.slice(0, 15).map(entry => {
        const link = entry.link?.find(l => l.$?.rel === 'alternate')?.$.href || entry.link?.[0]?.$.href || '';
        const title = entry.title?.[0]?._ || entry.title?.[0] || '';
        const updated = entry.updated?.[0] || entry.published?.[0] || '';
        const summary = (entry.summary?.[0]?._ || entry.summary?.[0] || entry.content?.[0]?._ || '').replace(/<[^>]*>/g, '').slice(0, 200);
        return { title, link, pubDate: updated, description: summary };
      });
    } else {
      items = [];
    }
    res.json({ team, source: 'SB Nation', items });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch RSS', detail: err.message });
  }
});

// Config endpoint (safe public keys only)
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

// Dynamic prospect data (from data pipeline + ML)
app.get('/api/prospects', (req, res) => {
  const p = path.join(__dirname, 'data', 'prospects.json');
  if (!fs.existsSync(p)) return res.status(404).json({ error: 'Run: node scripts/extract-seed.js && node scripts/update-data.js' });
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    res.json({ prospects: data, source: 'dynamic' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Cron: daily at 6am — extract seed, run ML, update prospects
cron.schedule('0 6 * * *', () => {
  try {
    execSync('node scripts/extract-seed.js', { cwd: __dirname, stdio: 'pipe' });
    execSync('node scripts/ml-combine-impact.js', { cwd: __dirname, stdio: 'pipe' });
    execSync('node scripts/update-data.js', { cwd: __dirname, stdio: 'pipe' });
    console.log('[Cron] Prospect data updated');
  } catch (e) {
    console.error('[Cron] Update failed:', e.message);
  }
});

// Serve index.html for non-API, non-static routes (SPA fallback)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ensure data exists on startup (run pipeline if missing)
const prospectsPath = path.join(__dirname, 'data', 'prospects.json');
if (!fs.existsSync(prospectsPath)) {
  try {
    require('child_process').execSync('node scripts/extract-seed.js', { cwd: __dirname, stdio: 'pipe' });
    require('child_process').execSync('node scripts/ml-combine-impact.js', { cwd: __dirname, stdio: 'pipe' });
    require('child_process').execSync('node scripts/update-data.js', { cwd: __dirname, stdio: 'pipe' });
    console.log('[Startup] Generated data/prospects.json');
  } catch (e) {
    console.warn('[Startup] Run: node scripts/extract-seed.js && node scripts/update-data.js');
  }
}

app.listen(PORT, () => console.log(`Draft Simulator running on http://localhost:${PORT}`));
