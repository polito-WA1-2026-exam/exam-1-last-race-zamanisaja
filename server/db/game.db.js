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

 function seedDefaultGames(db) {
    const insert = db.prepare(`
    INSERT OR IGNORE INTO games (game_id, user_id, score, created_at)
    VALUES (?, ?, ?, ?)
  `);

  insert.run('56ea2a9a-d114-4835-8f39-d42e4d200260', 'd3dce95d-ced2-47fb-a73a-dd255de85b31', 21, '2026-06-21 23:38:38'); // sadjad
  insert.run('17a7a0f4-3b09-4318-9195-3dd31a0f3544', 'f3b2c1d0-4e5f-4b6a-8c7d-8e9f0a1b2c3d', 23, '2026-06-21 23:40:40'); // momo
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
  seedDefaultGames,
  createGame,
  getGameById,
  listGamesByUser,
  getHighGameScoreByUser,
  getGlobalHighGameScore,
  getTopScores,
};