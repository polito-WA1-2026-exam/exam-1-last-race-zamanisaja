'use strict';

const express        = require('express');
const session        = require('express-session');
const cors           = require('cors');
const passport       = require('passport');
const LocalStrategy  = require('passport-local').Strategy;
const bcrypt         = require('bcrypt');
const SqliteStore    = require('connect-sqlite3')(session);

const crypto = require('crypto');
const {
  initReferenceData,

  // Metro
  getMetroGraph,
  listMetroEdges,

  // Users
  getUserByEmail,
  getUserById,
  createUser,

  // Events
  listEvents,
 } = require('./db');

 const makeGameRouter = require('./routes/game');

const PORT        = 3001;
const CLIENT_ORIGIN = 'http://localhost:5173';  // Vite default

const app = express();

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());

// CORS — must come before routes and session
app.use(cors({
  origin: CLIENT_ORIGIN,
  credentials: true,          // allow session cookies cross-origin
}));

// Session
app.use(session({
  store: new SqliteStore({ db: 'sessions.sqlite', dir: './' }),
  secret: 'super-secret-key-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 8,  // 8 hours
  },
}));

// Passport
app.use(passport.initialize());
app.use(passport.session());

// ── Guest identity (cookie-based) ─────────────────────────────────────────
function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=');
    if (!k) continue;
    out[k] = decodeURIComponent(rest.join('=') || '');
  }
  return out;
}

function ensureGuestId(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  let guestId = cookies.guestId;

  if (!guestId) {
    guestId = crypto.randomUUID();
    // Cookie is readable only by server (HttpOnly).
    // Since client/server are on different origins in dev, we rely on credentials: 'include'.
    res.setHeader('Set-Cookie', `guestId=${encodeURIComponent(guestId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60*60*24*365}`);
  }

  req.guestId = guestId;
}

function getOwner(req, res) {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return { owner_type: 'user', owner_id: req.user.id };
  }
  ensureGuestId(req, res);
  return { owner_type: 'guest', owner_id: req.guestId };
}

// ── Passport local strategy ─────────────────────────────────────────────────
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = getUserByEmail(email);
      if (!user) return done(null, false, { message: 'Invalid credentials.' });

      const match = await bcrypt.compare(password, user.hash);
      if (!match) return done(null, false, { message: 'Invalid credentials.' });

      // Never pass hash to the session
      return done(null, { id: user.id, name: user.name, email: user.email });
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = getUserById(id);
  done(null, user || false);
});

// ── Auth guard middleware ────────────────────────────────────────────────────
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Not authenticated.' });
}

// ── Routes ───────────────────────────────────────────────────────────────────

// POST /api/users  →  register (auto-login)
app.post('/api/users', async (req, res) => {
  const { name, email, password } = req.body ?? {};

  if (!name || !email || !password) {
    return res.status(422).json({ error: 'Missing required fields (name, email, password).' });
  }

  // Very lightweight email sanity check
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(422).json({ error: 'Invalid email format.' });
  }

  // Check duplicate early (still handle UNIQUE constraint too)
  const existing = getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered.' });
  }

  try {
    const id = crypto.randomUUID();
    const hash = await bcrypt.hash(password, 10);

    createUser({ id, name, email, hash });

    const user = { id, name, email };

    // Auto-login
    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Registration succeeded but login failed.' });
      return res.status(201).json(user);
    });
  } catch (err) {
    // In case UNIQUE(email) triggers due to race
    if (String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Email already registered.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Registration failed.' });
  }
});

// POST /api/sessions  →  login
app.post('/api/sessions', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err)   return next(err);
    if (!user) return res.status(401).json({ error: info?.message ?? 'Login failed.' });

    req.login(user, (err) => {
      if (err) return next(err);
      return res.json({ id: user.id, name: user.name, email: user.email });
    });
  })(req, res, next);
});

// GET /api/sessions/current  →  who am I?
app.get('/api/sessions/current', isLoggedIn, (req, res) => {
  res.json({ id: req.user.id, name: req.user.name, email: req.user.email });
});

// DELETE /api/sessions/current  →  logout
app.delete('/api/sessions/current', isLoggedIn, (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed.' });
    res.json({ message: 'Logged out.' });
  });
});

app.get('/api/metro/graph', (req, res) => {
  res.json(getMetroGraph());
});

app.get('/api/metro/edges', (req, res) => {
  const line_id = req.query.line_id;
  res.json(listMetroEdges({ line_id }));
});

// GET /api/events -> list the 9 events (active only)
app.get('/api/events', (req, res) => {
  res.json(listEvents({ activeOnly: true }));
});

app.use('/api', makeGameRouter({ getOwner }));

// ── Start ────────────────────────────────────────────────────────────────────
(async () => {
  try {
    initReferenceData();     // seeds metro + events (idempotent)
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to init database:', err);
    process.exit(1);
  }
})();
