'use strict';

const Database = require('better-sqlite3');

const usersDb = require('./db/users.db');
const recordsDb = require('./db/records.db');
const metroDb = require('./db/metro.db');
const eventsDb = require('./db/events.db');

// Seeds / static datasets
const metroSeed = require('./metro/tehran.l1-l4.seed');
const { EVENTS } = require('./metro/events');

const DB_FILE = './db.sqlite';
const db = new Database(DB_FILE);

// Ensure foreign keys are actually enforced in SQLite.
db.pragma('foreign_keys = ON');

// ── Schema ──────────────────────────────────────────────────────────────────
// Keep schema creation centralized so it's easy to see the whole DB.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id       TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    email    TEXT NOT NULL UNIQUE,
    hash     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS records (
    record_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_type TEXT NOT NULL CHECK(owner_type IN ('user','guest')),
    owner_id   TEXT NOT NULL,
    value      REAL NOT NULL,
    ts         TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS metro_line (
    id         TEXT PRIMARY KEY,
    name_en    TEXT NOT NULL,
    name_fa    TEXT NOT NULL,
    color_hex  TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS metro_node (
    id       TEXT PRIMARY KEY,
    name_en  TEXT NOT NULL,
    name_fa  TEXT NOT NULL,
    type     TEXT NOT NULL CHECK(type IN ('station','intersection')),
    x        INTEGER NOT NULL,
    y        INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS metro_edge (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    from_node_id  TEXT NOT NULL,
    to_node_id    TEXT NOT NULL,
    line_id       TEXT NOT NULL,
    sort_order    INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY(from_node_id) REFERENCES metro_node(id) ON DELETE CASCADE,
    FOREIGN KEY(to_node_id)   REFERENCES metro_node(id) ON DELETE CASCADE,
    FOREIGN KEY(line_id)      REFERENCES metro_line(id) ON DELETE CASCADE,

    UNIQUE(from_node_id, to_node_id, line_id)
  );

  CREATE INDEX IF NOT EXISTS idx_metro_edge_line ON metro_edge(line_id);
  CREATE INDEX IF NOT EXISTS idx_metro_edge_from ON metro_edge(from_node_id);
  CREATE INDEX IF NOT EXISTS idx_metro_edge_to   ON metro_edge(to_node_id);

  CREATE TABLE IF NOT EXISTS events (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    code      TEXT NOT NULL UNIQUE,
    title_en  TEXT NOT NULL,
    title_fa  TEXT NOT NULL,
    score     INTEGER NOT NULL CHECK(score BETWEEN -4 AND 4),
    is_active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS round_events (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT NOT NULL,
    round_id   TEXT NOT NULL,
    event_code TEXT NOT NULL,
    score      INTEGER NOT NULL CHECK(score BETWEEN -4 AND 4),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(event_code) REFERENCES events(code),

    UNIQUE(round_id, event_code)
  );

  CREATE INDEX IF NOT EXISTS idx_round_events_user  ON round_events(user_id);
  CREATE INDEX IF NOT EXISTS idx_round_events_round ON round_events(round_id);
`);

// ── Migrations (patch existing db.sqlite files) ─────────────────────────────
// CREATE TABLE IF NOT EXISTS does NOT add new columns.
try {
  db.exec(`ALTER TABLE metro_line ADD COLUMN name_fa TEXT NOT NULL DEFAULT ''`);
} catch (e) {
  // ignore "duplicate column name: name_fa"
}

try {
  db.prepare(`UPDATE metro_line SET name_fa = name_en WHERE name_fa = ''`).run();
} catch (e) {
  // ignore
}

// ── Reference data seeding (idempotent) ─────────────────────────────────────
// Make this explicit: call initReferenceData() once at server startup.
function initReferenceData() {
  metroDb.seedMetro(db, metroSeed);
  eventsDb.seedEvents(db, EVENTS);
}

// Users seed is async; expose it for the server to call once at startup.
async function seedUsersOnce() {
  return usersDb.seedUsersOnce(db);
}

module.exports = {
  db,

  // Seed
  initReferenceData,
  seedUsersOnce,

  // Users
  getUserByEmail: (email) => usersDb.getUserByEmail(db, email),
  getUserById: (id) => usersDb.getUserById(db, id),
  createUser: (data) => usersDb.createUser(db, data),

  // Records
  createRecord: (data) => recordsDb.createRecord(db, data),
  listRecordsByOwner: (owner_type, owner_id) => recordsDb.listRecordsByOwner(db, owner_type, owner_id),
  getHighScoreByOwner: (owner_type, owner_id) => recordsDb.getHighScoreByOwner(db, owner_type, owner_id),
  getGlobalHighScore: () => recordsDb.getGlobalHighScore(db),

  // Metro
  getMetroGraph: () => metroDb.getMetroGraph(db),
  listMetroEdges: (opts) => metroDb.listMetroEdges(db, opts),

  // Events
  listEvents: (opts) => eventsDb.listEvents(db, opts),
  getEventByCode: (code) => eventsDb.getEventByCode(db, code),
  createRoundEvent: (data) => eventsDb.createRoundEvent(db, data),
  listRoundEvents: (opts) => eventsDb.listRoundEvents(db, opts),
};
