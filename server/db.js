'use strict';

const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');

const DB_FILE = './db.sqlite';
const db = new Database(DB_FILE);

// ── Schema ──────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id       TEXT PRIMARY KEY,
    name     TEXT NOT NULL,
    email    TEXT NOT NULL UNIQUE,
    hash     TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS records (
    record_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   TEXT NOT NULL,
    value     REAL NOT NULL,
    ts        TEXT NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
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

function createRecord({ user_id, value, ts }) {
  const stmt = db.prepare('INSERT INTO records (user_id, value, ts) VALUES (?, ?, ?)');
  const info = stmt.run(user_id, value, ts);
  return info.lastInsertRowid;
}

function listRecordsByUser(user_id) {
  return db.prepare('SELECT record_id, user_id, value, ts FROM records WHERE user_id = ? ORDER BY record_id DESC').all(user_id);
}

module.exports = { seed, getUserByEmail, getUserById, createUser, createRecord, listRecordsByUser };
