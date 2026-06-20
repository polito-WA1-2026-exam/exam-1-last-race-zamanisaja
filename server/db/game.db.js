{'use strict';

function initGameSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      game_id     TEXT PRIMARY KEY,
      owner_type  TEXT NOT NULL CHECK(owner_type IN ('user','guest')),
      owner_id    TEXT NOT NULL,
      score       INTEGER NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_games_owner ON games(owner_type, owner_id);
    CREATE INDEX IF NOT EXISTS idx_games_created ON games(created_at);
  `);
}

function createGame(db, { game_id, owner_type, owner_id, score }) {
  const info = db
    .prepare(
      `INSERT INTO games (game_id, owner_type, owner_id, score)
       VALUES (?, ?, ?, ?)`
    )
    .run(game_id, owner_type, owner_id, score);

  return info.changes === 1;
}

function getGameById(db, game_id) {
  return db
    .prepare(
      `SELECT game_id, owner_type, owner_id, score, created_at
       FROM games
       WHERE game_id = ?`
    )
    .get(game_id);
}

function listGamesByOwner(db, owner_type, owner_id, { limit = 50 } = {}) {
  return db
    .prepare(
      `SELECT game_id, owner_type, owner_id, score, created_at
       FROM games
       WHERE owner_type = ? AND owner_id = ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(owner_type, owner_id, limit);
}

module.exports = {
  initGameSchema,
  createGame,
  getGameById,
  listGamesByOwner,
};
}