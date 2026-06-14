'use strict';

const express        = require('express');
const session        = require('express-session');
const cors           = require('cors');
const passport       = require('passport');
const LocalStrategy  = require('passport-local').Strategy;
const bcrypt         = require('bcrypt');
const SqliteStore    = require('connect-sqlite3')(session);

const { seed, getUserByEmail, getUserById } = require('./db');

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

// ── Start ────────────────────────────────────────────────────────────────────
seed()
  .then(() => {
    app.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  })
  .catch((err) => {
    console.error('Failed to seed database:', err);
    process.exit(1);
  });
