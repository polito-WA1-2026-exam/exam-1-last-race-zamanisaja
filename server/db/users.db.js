'use strict';

const bcrypt = require('bcrypt');

function initUsersSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id  TEXT PRIMARY KEY,
      name     TEXT NOT NULL,
      email    TEXT NOT NULL UNIQUE,
      hash     TEXT NOT NULL
    );
  `);
}

async function seedUsersOnce(db) {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (count > 0) {
    console.log('DB already seeded (users), skipping user seed.');
    return;
  }

  const users = [
    { user_id: 'd3dce95d-ced2-47fb-a73a-dd255de85b31', name: 'sadjad', email: 'sadjad@example.com', password: 'sadjad1234' },
    { user_id: '6052d233-68d2-4b36-af3c-82adc02e2324', name: 'ali', email: 'ali@example.com', password: 'ali1234' },
    { user_id: 'f3b2c1d0-4e5f-4b6a-8c7d-8e9f0a1b2c3d', name: 'momo', email: 'momo@example.com', password: 'momo1234' },
  ];

  const insert = db.prepare('INSERT INTO users (user_id, name, email, hash) VALUES (?, ?, ?, ?)');

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    insert.run(u.user_id, u.name, u.email, hash);
    console.log(`Seeded user: ${u.name}`);
  }
}

function getUserByEmail(db, email) {
  return db.prepare('SELECT user_id, name, email, hash FROM users WHERE email = ?').get(email);
}

function getUserById(db, user_id) {
  return db.prepare('SELECT user_id, name, email FROM users WHERE user_id = ?').get(user_id);
}

function createUser(db, { id, name, email, hash }) {
  const stmt = db.prepare('INSERT INTO users (user_id, name, email, hash) VALUES (?, ?, ?, ?)');
  return stmt.run(id, name, email, hash);
}

module.exports = {
  initUsersSchema,
  seedUsersOnce,
  getUserByEmail,
  getUserById,
  createUser,
};
