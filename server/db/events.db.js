'use strict';

const EVENTS = [
  { code: 'E01', title_en: 'Getting Robbed',            title_fa: 'دزدیده شدن',          score: -4 },
  { code: 'E02', title_en: 'Crowded platform',          title_fa: 'سکوی شلوغ',           score: -3 },
  { code: 'E03', title_en: 'Signal delay',              title_fa: 'تاخیر سیگنال',        score: -2 },
  { code: 'E04', title_en: 'Escalator outage',          title_fa: 'خرابی پله‌برقی',       score: -1 },
  { code: 'E05', title_en: 'Quiet journey',             title_fa: 'سفر آرام',             score:  0 },
  { code: 'E06', title_en: 'Train arrived early',       title_fa: 'رسیدن زودتر قطار',    score: +1 },
  { code: 'E07', title_en: 'Helpful staff',             title_fa: 'کمک کارکنان',          score: +2 },
  { code: 'E08', title_en: 'Kind passenger',            title_fa: 'مسافر مهربان',         score: +3 },
  { code: 'E09', title_en: 'Meeting the love of life',  title_fa: 'دیدار با عشق زندگی',  score: +4 },
];

function assertValidEvents(events) {
  if (!Array.isArray(events) || events.length !== 9) {
    throw new Error(`EVENTS must contain exactly 9 entries (got ${events?.length ?? 'null'})`);
  }

  const seen = new Set();
  for (const e of events) {
    if (!e.code || typeof e.code !== 'string') throw new Error('Event code missing');
    if (seen.has(e.code)) throw new Error(`Duplicate event code: ${e.code}`);
    seen.add(e.code);

    if (typeof e.score !== 'number' || !Number.isInteger(e.score) || e.score < -4 || e.score > 4) {
      throw new Error(`Invalid score for ${e.code}: ${e.score} (must be integer -4..4)`);
    }

    if (!e.title_en || !e.title_fa) throw new Error(`Missing titles for ${e.code}`);
  }
}

assertValidEvents(EVENTS);

function initEventsSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      code      TEXT NOT NULL UNIQUE,
      title_en  TEXT NOT NULL,
      title_fa  TEXT NOT NULL,
      score     INTEGER NOT NULL CHECK(score BETWEEN -4 AND 4),
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS round_events (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    TEXT NOT NULL,
      round_id   TEXT NOT NULL,
      event_code TEXT NOT NULL,
      score      INTEGER NOT NULL CHECK(score BETWEEN -4 AND 4),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),

      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(event_code) REFERENCES events(code),

      UNIQUE(round_id, event_code)
    );

    CREATE INDEX IF NOT EXISTS idx_round_events_user  ON round_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_round_events_round ON round_events(round_id);
  `);
}

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


module.exports = {
  EVENTS,
  initEventsSchema,
  seedEvents,
  listEvents,
  getEventByCode,
};
