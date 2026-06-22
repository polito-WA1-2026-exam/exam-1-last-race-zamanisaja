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


function initEventsSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      code      TEXT NOT NULL UNIQUE,
      title_en  TEXT NOT NULL,
      title_fa  TEXT NOT NULL,
      score     INTEGER NOT NULL CHECK(score BETWEEN -4 AND 4)
    );
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
    INSERT INTO events (code, title_en, title_fa, score)
    VALUES (@code, @title_en, @title_fa, @score)
    ON CONFLICT(code) DO UPDATE SET
      title_en = excluded.title_en,
      title_fa = excluded.title_fa,
      score    = excluded.score;
  `);

  db.transaction(() => {
    for (const e of EVENTS) upsert.run(e);
  })();
}

function listEvents(db) {
  return db.prepare('SELECT code, title_en, title_fa, score FROM events ORDER BY code').all();
}

function getEventByCode(db, code) {
  return db
    .prepare('SELECT code, title_en, title_fa, score FROM events WHERE code = ?')
    .get(code);
}


module.exports = {
  EVENTS,
  initEventsSchema,
  seedEvents,
  listEvents,
  getEventByCode,
};
