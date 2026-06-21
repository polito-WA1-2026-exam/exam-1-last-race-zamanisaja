'use strict';

const express       = require('express');
const session       = require('express-session');
const cors          = require('cors');
const passport      = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt        = require('bcrypt');
const SqliteStore   = require('connect-sqlite3')(session);

const { initReferenceData, getUserByEmail, getUserById } = require('./db');

const authRouter     = require('./routes/auth');
const metroRouter    = require('./routes/metro');
const eventsRouter   = require('./routes/events');
const gameRouter     = require('./routes/game');

const PORT          = 3001;
const CLIENT_ORIGIN = 'http://localhost:5173';

const app = express();

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(session({
  store: new SqliteStore({ db: 'sessions.sqlite', dir: './' }),
  secret: 'super-secret-key-change-in-prod',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 8 },
}));
app.use(passport.initialize());
app.use(passport.session());

// ── Passport ─────────────────────────────────────────────────────────────────
passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = getUserByEmail(email);
    if (!user) return done(null, false, { message: 'Invalid credentials.' });
    const match = await bcrypt.compare(password, user.hash);
    if (!match) return done(null, false, { message: 'Invalid credentials.' });
    return done(null, { id: user.id, name: user.name, email: user.email });
  } catch (err) {
    return done(err);
  }
}));

// ── user session handling ─────────────────────────────────────────────────────
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, getUserById(id) || false));


// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api',        authRouter);
app.use('/api/metro',  metroRouter);
app.use('/api/events', eventsRouter);
app.use('/api',        gameRouter);

// ── Start ─────────────────────────────────────────────────────────────────────
(async () => {
  try {
    initReferenceData();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to init database:', err);
    process.exit(1);
  }
})();
