'use strict';

function initGameSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      game_id     TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      score       INTEGER NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_games_user ON games(user_id);
    CREATE INDEX IF NOT EXISTS idx_games_created ON games(created_at);
  `);
}

function createGame(db, { game_id, user_id, score }) {
  const info = db
    .prepare(
      `INSERT INTO games (game_id, user_id, score)
       VALUES (?, ?, ?)`
    )
    .run(game_id, user_id, score);

  return info.changes === 1;
}

function getGameById(db, game_id) {
  return db
    .prepare(
      `SELECT game_id, user_id, score, created_at
       FROM games
       WHERE game_id = ?`
    )
    .get(game_id);
}

function listGamesByUser(db, user_id, { limit = 50 } = {}) {
  return db
    .prepare(
      `SELECT game_id, user_id, score, created_at
       FROM games
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`
    )
    .all(user_id, limit);
}

function getHighGameScoreByUser(db, user_id) {
  const row = db
    .prepare(
      `SELECT MAX(score) AS highScore
       FROM games
       WHERE user_id = ?`
    )
    .get(user_id);

  return row?.highScore ?? null;
}

function getGlobalHighGameScore(db) {
  const row = db
    .prepare(
      `SELECT MAX(score) AS globalHighScore
       FROM games`
    )
    .get();

  return row?.globalHighScore ?? null;
}

function getTopScores(db, limit = 3) {
  return db
    .prepare(
      `SELECT
         MAX(g.score) AS score,
         u.name
       FROM games g
       JOIN users u ON g.user_id = u.user_id
       GROUP BY g.user_id
       ORDER BY score DESC
       LIMIT ?`
    )
    .all(limit);
}

module.exports = {
  initGameSchema,
  createGame,
  getGameById,
  listGamesByUser,
  getHighGameScoreByUser,
  getGlobalHighGameScore,
  getTopScores,
};