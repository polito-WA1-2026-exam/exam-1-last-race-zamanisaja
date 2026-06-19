'use strict';

const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');

const DB_FILE = './db.sqlite';
const db = new Database(DB_FILE);

const metroSeed = require('./metro/tehran.l1-l4.seed');

// ── Schema ──────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id       TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    email    TEXT NOT NULL UNIQUE,
    hash     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS records (
    record_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_type TEXT NOT NULL CHECK(owner_type IN ('user','guest')) ,
    owner_id   TEXT NOT NULL,
    value      REAL NOT NULL,
    ts         TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS metro_line (
    id         TEXT PRIMARY KEY,
    name_en    TEXT NOT NULL,
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
`);

// ── Seed ────────────────────────────────────────────────────────────────────
// Only insert if the table is empty, so re-running is idempotent.
async function seed() {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (count > 0) {
    console.log('DB already seeded, skipping.');
    return;
  }

  const users = [
    { id: 'userid1', name: 'sadjad', email: 'sadjad@example.com', password: 'sadjad1234' },
    { id: 'userid2', name: 'ali',    email: 'ali@example.com',    password: 'ali1234'    },
    { id: 'userid3', name: 'momo',   email: 'momo@example.com',   password: 'momo1234'   },
  ];

  const insert = db.prepare(
    'INSERT INTO users (id, name, email, hash) VALUES (?, ?, ?, ?)'
  );

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    insert.run(u.id, u.name, u.email, hash);
    console.log(`Seeded user: ${u.name}`);
  }
}

// ── DAO ─────────────────────────────────────────────────────────────────────
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

function createRecord({ owner_type, owner_id, value, ts }) {
  const stmt = db.prepare('INSERT INTO records (owner_type, owner_id, value, ts) VALUES (?, ?, ?, ?)');
  const info = stmt.run(owner_type, owner_id, value, ts);
  return info.lastInsertRowid;
}

function listRecordsByOwner(owner_type, owner_id) {
  return db.prepare('SELECT record_id, owner_type, owner_id, value, ts FROM records WHERE owner_type = ? AND owner_id = ? ORDER BY record_id DESC').all(owner_type, owner_id);
}

function getHighScoreByOwner(owner_type, owner_id) {
  const row = db.prepare('SELECT MAX(value) AS highScore FROM records WHERE owner_type = ? AND owner_id = ?').get(owner_type, owner_id);
  return row.highScore;
}

function getGlobalHighScore() {
  const row = db.prepare('SELECT MAX(value) AS highScore FROM records').get();
  return row.highScore;
}

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
      INSERT INTO metro_line (id, name_en, color_hex, sort_order)
      VALUES (@id, @name_en, @color_hex, @sort_order)
      ON CONFLICT(id) DO UPDATE SET
        name_en=excluded.name_en,
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

function getMetroGraph() {
  const lines = db.prepare(
    'SELECT id, name_en, color_hex, sort_order FROM metro_line ORDER BY sort_order'
  ).all();

  const nodes = db.prepare(
    'SELECT id, name_en, name_fa, type, x, y FROM metro_node'
  ).all();

  const edges = db.prepare(
    'SELECT id, from_node_id, to_node_id, line_id, sort_order FROM metro_edge ORDER BY line_id, sort_order, id'
  ).all();

  return { lines, nodes, edges };
}

function listMetroEdges({ line_id } = {}) {
  if (line_id) {
    return db.prepare(
      'SELECT id, from_node_id, to_node_id, line_id, sort_order FROM metro_edge WHERE line_id = ? ORDER BY sort_order, id'
    ).all(line_id);
  }
  return db.prepare(
    'SELECT id, from_node_id, to_node_id, line_id, sort_order FROM metro_edge ORDER BY line_id, sort_order, id'
  ).all();
}


module.exports = { 
  seed,
  // Metro
  seedMetro,
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
};
