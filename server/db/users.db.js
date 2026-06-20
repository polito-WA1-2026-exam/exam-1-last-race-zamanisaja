'use strict';

const bcrypt = require('bcrypt');

async function seedUsersOnce(db) {
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

function getUserByEmail(db, email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
}

function getUserById(db, id) {
  return db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(id);
}

function createUser(db, { id, name, email, hash }) {
  const stmt = db.prepare('INSERT INTO users (id, name, email, hash) VALUES (?, ?, ?, ?)');
  return stmt.run(id, name, email, hash);
}

module.exports = {
  seedUsersOnce,
  getUserByEmail,
  getUserById,
  createUser,
};
