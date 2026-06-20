'use strict';

function seedEvents(db, EVENTS) {
  if (!Array.isArray(EVENTS) || EVENTS.length !== 9) {
    throw new Error(`EVENTS must contain exactly 9 entries (got ${EVENTS?.length ?? 'null'})`);
  }

  for (const e of EVENTS) {
    if (!e.code || !e.title_en || !e.title_fa) throw new Error('Invalid event shape in EVENTS');
    if (!Number.isInteger(e.score) || e.score < -4 || e.score > 4) {
      throw new Error(`Invalid score for event ${e.code}: ${e.score}`);
    }
  }

  const upsert = db.prepare(`
    INSERT INTO events (code, title_en, title_fa, score, is_active)
    VALUES (@code, @title_en, @title_fa, @score, 1)
    ON CONFLICT(code) DO UPDATE SET
      title_en  = excluded.title_en,
      title_fa  = excluded.title_fa,
      score     = excluded.score,
      is_active = 1;
  `);

  db.transaction(() => {
    for (const e of EVENTS) upsert.run(e);
  })();
}

function listEvents(db, { activeOnly = true } = {}) {
  if (activeOnly) {
    return db
      .prepare('SELECT code, title_en, title_fa, score FROM events WHERE is_active = 1 ORDER BY code')
      .all();
  }

  return db.prepare('SELECT code, title_en, title_fa, score, is_active FROM events ORDER BY code').all();
}

function getEventByCode(db, code) {
  return db
    .prepare('SELECT code, title_en, title_fa, score, is_active FROM events WHERE code = ?')
    .get(code);
}

function createRoundEvent(db, { user_id, round_id, event_code }) {
  const event = getEventByCode(db, event_code);
  if (!event || event.is_active !== 1) {
    throw new Error('Invalid or inactive event_code');
  }

  const info = db
    .prepare('INSERT INTO round_events (user_id, round_id, event_code, score) VALUES (?, ?, ?, ?)')
    .run(user_id, round_id, event_code, event.score);

  return info.lastInsertRowid;
}

function listRoundEvents(db, { user_id, round_id } = {}) {
  if (round_id) {
    return db
      .prepare(
        `SELECT id, user_id, round_id, event_code, score, created_at
         FROM round_events
         WHERE round_id = ?
         ORDER BY id ASC`
      )
      .all(round_id);
  }

  if (user_id) {
    return db
      .prepare(
        `SELECT id, user_id, round_id, event_code, score, created_at
         FROM round_events
         WHERE user_id = ?
         ORDER BY id DESC`
      )
      .all(user_id);
  }

  return db
    .prepare(
      `SELECT id, user_id, round_id, event_code, score, created_at
       FROM round_events
       ORDER BY id DESC`
    )
    .all();
}

module.exports = {
  seedEvents,
  listEvents,
  getEventByCode,
  createRoundEvent,
  listRoundEvents,
};
