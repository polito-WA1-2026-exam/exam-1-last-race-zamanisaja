'use strict';

function initRecordsSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS records (
      record_id  INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_type TEXT NOT NULL CHECK(owner_type IN ('user','guest')),
      owner_id   TEXT NOT NULL,
      value      REAL NOT NULL,
      ts         TEXT NOT NULL
    );
  `);
}

function createRecord(db, { owner_type, owner_id, value, ts }) {
  const stmt = db.prepare('INSERT INTO records (owner_type, owner_id, value, ts) VALUES (?, ?, ?, ?)');
  const info = stmt.run(owner_type, owner_id, value, ts);
  return info.lastInsertRowid;
}

function listRecordsByOwner(db, owner_type, owner_id) {
  return db
    .prepare(
      `SELECT record_id, owner_type, owner_id, value, ts
       FROM records
       WHERE owner_type = ? AND owner_id = ?
       ORDER BY record_id DESC`
    )
    .all(owner_type, owner_id);
}

function getHighScoreByOwner(db, owner_type, owner_id) {
  const row = db
    .prepare('SELECT MAX(value) AS highScore FROM records WHERE owner_type = ? AND owner_id = ?')
    .get(owner_type, owner_id);
  return row?.highScore ?? null;
}

function getGlobalHighScore(db) {
  const row = db.prepare('SELECT MAX(value) AS highScore FROM records').get();
  return row?.highScore ?? null;
}

module.exports = {
  initRecordsSchema,
  createRecord,
  listRecordsByOwner,
  getHighScoreByOwner,
  getGlobalHighScore,
};
