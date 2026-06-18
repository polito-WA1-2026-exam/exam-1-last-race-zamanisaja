'use strict';
const Database = require('better-sqlite3');
const db = new Database('./db.sqlite');

db.exec(`
  DROP TABLE IF EXISTS records;

  CREATE TABLE IF NOT EXISTS records (
    record_id  INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_type TEXT NOT NULL CHECK(owner_type IN ('user','guest')),
    owner_id   TEXT NOT NULL,
    value      REAL NOT NULL,
    ts         TEXT NOT NULL
  );
`);

console.log('records table reset to owner-based schema.');
