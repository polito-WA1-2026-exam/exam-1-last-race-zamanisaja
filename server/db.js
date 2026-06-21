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
function initReferenceData() {
  metroDb.seedMetro(db);
  eventsDb.seedEvents(db, eventsDb.EVENTS);
  usersDb.seedUsersOnce(db)
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
  createRoundEvent: (data) => eventsDb.createRoundEvent(db, data),
  listRoundEvents: (opts) => eventsDb.listRoundEvents(db, opts),

  // Games (export when you’re ready to use it)
  createGame: (data) => gameDb.createGame(db, data),
  getGameById: (game_id) => gameDb.getGameById(db, game_id),
  listGamesByOwner: (owner_type, owner_id, opts) => gameDb.listGamesByOwner(db, owner_type, owner_id, opts),
  getHighGameScoreByOwner: (owner_type, owner_id) => gameDb.getHighGameScoreByOwner(db, owner_type, owner_id),
  getGlobalHighGameScore: () => gameDb.getGlobalHighGameScore(db),
};
