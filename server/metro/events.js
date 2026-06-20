// events.js
'use strict';

// 9 possible events, each score must be between -4 and +4
const EVENTS = [
  { code: 'E01', title_en: 'Unexpected closure', title_fa: 'بسته شدن ناگهانی', score: -4 },
  { code: 'E02', title_en: 'Crowded platform', title_fa: 'سکوی شلوغ', score: -3 },
  { code: 'E03', title_en: 'Signal delay', title_fa: 'تاخیر سیگنال', score: -2 },
  { code: 'E04', title_en: 'Escalator outage', title_fa: 'خرابی پله‌برقی', score: -1 },
  { code: 'E05', title_en: 'Quiet journey', title_fa: 'سفر آرام', score: +0 },
  { code: 'E06', title_en: 'Train arrived early', title_fa: 'رسیدن زودتر قطار', score: +1 },
  { code: 'E07', title_en: 'Helpful staff', title_fa: 'کمک کارکنان', score: +2 },
  { code: 'E08', title_en: 'Kind passenger', title_fa: 'مسافر مهربان', score: +3 },
  { code: 'E09', title_en: 'Meeting the love of life', title_fa: 'دیدار با عشق زندگی', score: +4 },
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

module.exports = { EVENTS };
