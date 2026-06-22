'use strict';

const Database = require('better-sqlite3');

const usersDb = require('./db/users.db');
const metroDb = require('./db/metro.db');
const eventsDb = require('./db/events.db');
const gameDb = require('./db/game.db');

const DB_FILE = './db.sqlite';
const db = new Database(DB_FILE);

// Ensure foreign keys are actually enforced in SQLite.
db.pragma('foreign_keys = ON');

// Initialize schema (each module owns its own CREATE TABLE statements)
usersDb.initUsersSchema(db);
metroDb.initMetroSchema(db);
eventsDb.initEventsSchema(db);
gameDb.initGameSchema(db);

// Migrations (patch older db.sqlite files)
metroDb.migrateMetroSchema(db);

// Reference data seeding (explicit, called from server startup)
async function initReferenceData() {
  metroDb.seedMetro(db);
  eventsDb.seedEvents(db, eventsDb.EVENTS);
  await usersDb.seedUsersOnce(db);
  gameDb.seedDefaultGames(db);
}


module.exports = {
  db,

  // Seed
  initReferenceData,

  // Users
  getUserByEmail: (email) => usersDb.getUserByEmail(db, email),
  getUserById: (id) => usersDb.getUserById(db, id),
  createUser: (data) => usersDb.createUser(db, data),

  // Metro
  getMetroGraph: () => metroDb.getMetroGraph(db),
  listMetroEdges: (opts) => metroDb.listMetroEdges(db, opts),

  // Events
  listEvents: (opts) => eventsDb.listEvents(db, opts),
  getEventByCode: (code) => eventsDb.getEventByCode(db, code),

  // Games (export when you’re ready to use it)
  createGame: (data) => gameDb.createGame(db, data),
  seedDefaultGames: () => gameDb.seedDefaultGames(db),
  getGameById: (game_id) => gameDb.getGameById(db, game_id),
  listGamesByUser: (user_id, opts) => gameDb.listGamesByUser(db, user_id, opts),
  getHighGameScoreByUser: (user_id) => gameDb.getHighGameScoreByUser(db, user_id),
  getGlobalHighGameScore: () => gameDb.getGlobalHighGameScore(db),
  getTopScores: (limit) => gameDb.getTopScores(db, limit),
};
