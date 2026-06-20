'use strict';

const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');

const DB_FILE = './db.sqlite';
const db = new Database(DB_FILE);

// Make sure this path matches your project structure
const metroSeed = require('./metro/tehran.l1-l4.seed');
const { EVENTS } = require('./metro/events.js');

// ── Schema ──────────────────────────────────────────────────────────────────
db.exec(`
  PRAGMA foreign_keys = ON;

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
    id       TEXT PRIMARY KEY,  -- ASCII slug
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

  -- Events: 9 global event definitions
  CREATE TABLE IF NOT EXISTS events (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    code      TEXT NOT NULL UNIQUE,             -- E01..E09
    title_en  TEXT NOT NULL,
    title_fa  TEXT NOT NULL,
    score     INTEGER NOT NULL CHECK(score BETWEEN -4 AND 4),
    is_active INTEGER NOT NULL DEFAULT 1
  );

  -- Event occurrences per round (optional but matches “option 1” design)
  CREATE TABLE IF NOT EXISTS round_events (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    TEXT NOT NULL,
    round_id   TEXT NOT NULL,                   -- uuid/string from your app
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

// ── Migrations (for existing db.sqlite files) ────────────────────────────────
// CREATE TABLE IF NOT EXISTS does NOT add new columns, so we patch old DBs here.
try {
  db.exec(`ALTER TABLE metro_line ADD COLUMN name_fa TEXT NOT NULL DEFAULT ''`);
} catch (e) {
  // ignore "duplicate column name: name_fa"
}

// If you had metro_line rows before adding name_fa, ensure it's not empty.
try {
  db.prepare(`UPDATE metro_line SET name_fa = name_en WHERE name_fa = ''`).run();
} catch (e) {
  // ignore if table/column not ready for some reason
}

// ── Seed Users (only once) ──────────────────────────────────────────────────
async function seed() {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (count > 0) {
    console.log('DB already seeded (users), skipping user seed.');
    return;
  }

  const users = [
    { id: 'userid1', name: 'sadjad', email: 'sadjad@example.com', password: 'sadjad1234' },
    { id: 'userid2', name: 'ali', email: 'ali@example.com', password: 'ali1234' },
    { id: 'userid3', name: 'momo', email: 'momo@example.com', password: 'momo1234' },
  ];

  const insert = db.prepare('INSERT INTO users (id, name, email, hash) VALUES (?, ?, ?, ?)');

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    insert.run(u.id, u.name, u.email, hash);
    console.log(`Seeded user: ${u.name}`);
  }
}

// ── Seed Events (idempotent) ────────────────────────────────────────────────
function seedEvents() {
  // Validate the EVENTS array a bit (optional but helpful)
  if (!Array.isArray(EVENTS) || EVENTS.length !== 9) {
    throw new Error(`EVENTS must contain exactly 9 entries (got ${EVENTS?.length ?? 'null'})`);
  }
  for (const e of EVENTS) {
    if (!e.code || !e.title_en || !e.title_fa) throw new Error('Invalid event shape in EVENTS');
    if (!Number.isInteger(e.score) || e.score < -4 || e.score > 4) {
      throw new Error(`Invalid score for event ${e.code}: ${e.score}`);
    }
  }

  const upsert = db.prepare(`
    INSERT INTO events (code, title_en, title_fa, score, is_active)
    VALUES (@code, @title_en, @title_fa, @score, 1)
    ON CONFLICT(code) DO UPDATE SET
      title_en  = excluded.title_en,
      title_fa  = excluded.title_fa,
      score     = excluded.score,
      is_active = 1;
  `);

  const tx = db.transaction(() => {
    for (const e of EVENTS) upsert.run(e);
  });

  tx();
}

// ── DAO: Users ──────────────────────────────────────────────────────────────
function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function getUserById(id) {
  return db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(id);
}

function createUser({ id, name, email, hash }) {
  const stmt = db.prepare('INSERT INTO users (id, name, email, hash) VALUES (?, ?, ?, ?)');
  return stmt.run(id, name, email, hash);
}

// ── DAO: Records ────────────────────────────────────────────────────────────
function createRecord({ owner_type, owner_id, value, ts }) {
  const stmt = db.prepare('INSERT INTO records (owner_type, owner_id, value, ts) VALUES (?, ?, ?, ?)');
  const info = stmt.run(owner_type, owner_id, value, ts);
  return info.lastInsertRowid;
}

function listRecordsByOwner(owner_type, owner_id) {
  return db.prepare(
    `SELECT record_id, owner_type, owner_id, value, ts
     FROM records
     WHERE owner_type = ? AND owner_id = ?
     ORDER BY record_id DESC`
  ).all(owner_type, owner_id);
}

function getHighScoreByOwner(owner_type, owner_id) {
  const row = db
    .prepare('SELECT MAX(value) AS highScore FROM records WHERE owner_type = ? AND owner_id = ?')
    .get(owner_type, owner_id);
  return row.highScore;
}

function getGlobalHighScore() {
  const row = db.prepare('SELECT MAX(value) AS highScore FROM records').get();
  return row.highScore;
}

// ── Metro helpers ───────────────────────────────────────────────────────────
function canonicalEdge(a, b) {
  return a < b ? [a, b] : [b, a];
}

/**
 * Idempotent metro seed:
 * - upserts lines + nodes
 * - deletes edges for seeded lines then reinserts (makes iteration easy)
 */
function seedMetro() {
  const tx = db.transaction(() => {
    const upsertLine = db.prepare(`
      INSERT INTO metro_line (id, name_en, name_fa, color_hex, sort_order)
      VALUES (@id, @name_en, @name_fa, @color_hex, @sort_order)
      ON CONFLICT(id) DO UPDATE SET
        name_en=excluded.name_en,
        name_fa=excluded.name_fa,
        color_hex=excluded.color_hex,
        sort_order=excluded.sort_order;
    `);

    for (const line of metroSeed.LINES) upsertLine.run(line);

    const upsertNode = db.prepare(`
      INSERT INTO metro_node (id, name_en, name_fa, type, x, y)
      VALUES (@id, @name_en, @name_fa, @type, @x, @y)
      ON CONFLICT(id) DO UPDATE SET
        name_en=excluded.name_en,
        name_fa=excluded.name_fa,
        type=excluded.type,
        x=excluded.x,
        y=excluded.y;
    `);

    for (const node of metroSeed.NODES) upsertNode.run(node);

    const delEdges = db.prepare(`DELETE FROM metro_edge WHERE line_id = ?`);
    for (const l of metroSeed.LINES) delEdges.run(l.id);

    const insEdge = db.prepare(`
      INSERT INTO metro_edge (from_node_id, to_node_id, line_id, sort_order)
      VALUES (?, ?, ?, ?);
    `);

    for (const e of metroSeed.EDGES) {
      const [from, to] = canonicalEdge(e.from_node_id, e.to_node_id);
      insEdge.run(from, to, e.line_id, e.sort_order ?? 0);
    }
  });

  tx();
}

// ── Metro DAO ───────────────────────────────────────────────────────────────
function getMetroGraph() {
  const lines = db
    .prepare('SELECT id, name_en, name_fa, color_hex, sort_order FROM metro_line ORDER BY sort_order')
    .all();

  const nodes = db.prepare('SELECT id, name_en, name_fa, type, x, y FROM metro_node').all();

  const edges = db
    .prepare(
      `SELECT id, from_node_id, to_node_id, line_id, sort_order
       FROM metro_edge
       ORDER BY line_id, sort_order, id`
    )
    .all();

  return { lines, nodes, edges };
}

function listMetroEdges({ line_id } = {}) {
  if (line_id) {
    return db
      .prepare(
        `SELECT id, from_node_id, to_node_id, line_id, sort_order
         FROM metro_edge
         WHERE line_id = ?
         ORDER BY sort_order, id`
      )
      .all(line_id);
  }

  return db
    .prepare(
      `SELECT id, from_node_id, to_node_id, line_id, sort_order
       FROM metro_edge
       ORDER BY line_id, sort_order, id`
    )
    .all();
}

// ── Events DAO ──────────────────────────────────────────────────────────────
function listEvents({ activeOnly = true } = {}) {
  if (activeOnly) {
    return db
      .prepare('SELECT code, title_en, title_fa, score FROM events WHERE is_active = 1 ORDER BY code')
      .all();
  }
  return db.prepare('SELECT code, title_en, title_fa, score, is_active FROM events ORDER BY code').all();
}

function getEventByCode(code) {
  return db.prepare('SELECT code, title_en, title_fa, score, is_active FROM events WHERE code = ?').get(code);
}

/**
 * Record that an event happened in a specific round.
 * Stores the score at time of occurrence for history stability.
 */
function createRoundEvent({ user_id, round_id, event_code }) {
  const event = getEventByCode(event_code);
  if (!event || event.is_active !== 1) {
    throw new Error('Invalid or inactive event_code');
  }

  const stmt = db.prepare(
    `INSERT INTO round_events (user_id, round_id, event_code, score)
     VALUES (?, ?, ?, ?)`
  );
  const info = stmt.run(user_id, round_id, event_code, event.score);
  return info.lastInsertRowid;
}

function listRoundEvents({ user_id, round_id } = {}) {
  if (round_id) {
    return db
      .prepare(
        `SELECT id, user_id, round_id, event_code, score, created_at
         FROM round_events
         WHERE round_id = ?
         ORDER BY id ASC`
      )
      .all(round_id);
  }

  if (user_id) {
    return db
      .prepare(
        `SELECT id, user_id, round_id, event_code, score, created_at
         FROM round_events
         WHERE user_id = ?
         ORDER BY id DESC`
      )
      .all(user_id);
  }

  return db
    .prepare(
      `SELECT id, user_id, round_id, event_code, score, created_at
       FROM round_events
       ORDER BY id DESC`
    )
    .all();
}

module.exports = {
  // Seed
  seed,
  seedMetro,
  seedEvents,

  // Metro
  getMetroGraph,
  listMetroEdges,

  // Users
  getUserByEmail,
  getUserById,
  createUser,

  // Records
  createRecord,
  listRecordsByOwner,
  getHighScoreByOwner,
  getGlobalHighScore,

  // Events
  listEvents,
  getEventByCode,
  createRoundEvent,
  listRoundEvents,
};
