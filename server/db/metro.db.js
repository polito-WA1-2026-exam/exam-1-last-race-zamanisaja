'use strict';

// ─── Tehran L1-L4 seed data ───────────────────────────────────────────────────

const LINES = [
  { id: 'L1', name_en: 'Line 1', name_fa: 'خط 1', color_hex: '#E31E24', sort_order: 1 }, // red
  { id: 'L2', name_en: 'Line 2', name_fa: 'خط 2', color_hex: '#233B8E', sort_order: 2 }, // dark blue
  { id: 'L3', name_en: 'Line 3', name_fa: 'خط 3', color_hex: '#00AEEF', sort_order: 3 }, // cyan
  { id: 'L4', name_en: 'Line 4', name_fa: 'خط 4', color_hex: '#F7D000', sort_order: 4 }, // yellow
];

// Helper for quick node creation
const S = (id, name_en, name_fa, x, y) => ({ id, name_en, name_fa, type: 'station', x, y });

/**
 * Coordinates are schematic, not geographic.
 * You will likely tweak x/y for readability after first render.
 */
const NODES = [
  // ---------------- L1 (Tajrish -> Kahrizak) ----------------
  // S('tajrish', 'Tajrish', 'تجریش', 670, 50),
  // S('gheytariyeh', 'Gheytariyeh', 'قیطریه', 670, 90),
  // S('sadr', 'Sadr', 'صدر', 670, 120),
  // S('gholhak', 'Gholhak', 'قلهک', 670, 150),
  // S('dr-shariati', 'Doctor Shariati', 'دکتر شریعتی', 670, 180),
  // S('mirdamad', 'Mirdamad', 'میرداماد', 670, 205),
  S('haghani', 'Haghani', 'حقانی', 650, 235),
  S('hemmat', 'Hemmat', 'همت', 630, 265),
  S('mosalla', 'Mosalla', 'مصلی', 630, 290),
  S('beheshti', 'Beheshti', 'بهشتی', 630, 325), // intersection (L1/L3)
  S('mofatteh', 'Mofatteh', 'مفتح', 630, 355),
  S('haftom-tir', 'Haftom Tir', 'هفتم تیر', 630, 390),
  S('taleghani', 'Taleghani', 'طالقانی', 630, 425),
  S('darvazeh-dowlat', 'Darvazeh Dowlat', 'دروازه دولت', 630, 460), // intersection (L1/L4)
  S('saadi', "Sa'di", 'سعدی', 630, 500),
  S('imam-khomeini', 'Imam Khomeini', 'امام خمینی', 630, 545), // intersection (L1/L2)
  S('panzdah-khordad', 'Panzdah Khordad', 'پانزده خرداد', 630, 580),
  S('khayyam', 'Khayyam', 'خیام', 630, 605),
  // S('mohammadiyeh', 'Mohammadiyeh', 'محمدیه', 630, 640),
  // S('shoush', 'Shoush', 'شوش', 630, 670),
  // S('payane-jonoub', 'Payane Jonoob', 'پایانه جنوب', 630, 700),
  // S('shahr-rey', 'Shahr Rey', 'شهرری', 630, 820),
  // S('haram-motahhar', 'Haram Motahhar Emam Khomeini', 'حرم مطهر امام خمینی', 630, 910),
  // S('kahrizak', 'Kahrizak', 'کهریزک', 630, 945),

  // ---------------- L2 (Farhangsara -> Sadeghiyeh) ----------------
  // S('farhangsara', 'Farhangsara', 'فرهنگسرا', 950, 300),
  // S('tehranpars', 'Tehranpars', 'تهرانپارس', 920, 300),
  // S('bagheri', 'Bagheri', 'باقری', 890, 300),
  // S('elm-o-sanat', 'Daneshgah Elm-o-Sanat', 'دانشگاه علم و صنعت', 860, 300),
  // S('janbazan', 'Janbazan', 'جانبازان', 810, 300),
  // S('fadaak', 'Fadak', 'فدک', 795, 325),
  // S('sabalan', 'Sabalan', 'سبلان', 780, 350),
  S('madani', 'Madani', 'مدنی', 765, 375),
  S('emam-hossein', 'Emam Hossein', 'امام حسین', 750, 400),
  S('darvazeh-shemiran', 'Darvazeh Shemiran', 'دروازه شمیران', 695, 460), // intersection (L2/L4)
  S('baharestan', 'Baharestan', 'بهارستان', 680, 485),
  S('mellat', 'Mellat', 'ملت', 660, 510),
  // imam-khomeini is already defined above (intersection)
  S('hassan-abad', 'Hassan Abad', 'حسن‌آباد', 595, 545),
  S('horr', 'Horr', ' حر', 525, 545),
  S('shademan', 'Shademan', 'شادمان', 460, 460), // intersection (L2/L4)
  S('sharif-university', 'Sharif University', 'دانشگاه شریف', 425, 425),
  S('tarasht', 'Tarasht', 'طرشت', 400, 400),
  S('sadeghiyeh', 'Sadeghiyeh', 'صادقیه', 375, 375),

  // ---------------- L3 (Qaem -> Azadegan) ----------------
  // S('ghaem', "Gha'em", 'قائم', 950, 120),
  // S('mahallati', 'Mahallati', 'محلاتی', 915, 120),
  // S('aghdasieh', 'Aghdasieh', 'اقدسیه', 880, 120),
  // S('nobonyad', 'Nobonyad', 'نوبنیاد', 850, 120),
  // S('hossein-abad', 'Hossein Abad', 'حسین‌آباد', 820, 120),
  // S('heravi', 'Heravi', ' هروی', 800, 160),
  // S('zeynoddin', 'Zeynoddin', 'زین‌الدین', 780, 200),
  // S('khajeh-abdollah-ansari', 'Khajeh Abdollah Ansari', 'خواجه عبدالله انصاری', 755, 225),
  S('sayyad-shirazi', 'Sayyad Shirazi', 'صیاد شیرازی', 725, 260),
  S('ghoddoosi', 'Ghoddoosi', 'قدوسی', 700, 295),
  S('sohrevardi', 'Sohrevardi', 'سهروردی', 675, 325),
  // beheshti is already defined above (intersection)
  S('mirza-ye-shirazi', 'Mirza-ye Shirazi', 'میرزا شیرازی', 600, 325),
  S('jahad', 'Jahad', ' جهاد', 575, 355),
  S('vali-asr', 'Vali Asr', ' ولی‌عصر', 550, 390),
  S('teatr-shahr', 'Theatre Shahr', 'تئاتر شهر', 550, 460), // intersection (L3/L4)
  S('moniriyeh', 'Moniriyeh', 'منیریه', 550, 600),
  S('mahdiyeh', 'Mahdiyeh', 'مهدیه', 550, 640),
  S('rahahan', 'Rahahan', 'راه‌آهن', 550, 680),
  // S('azadegan', 'Azadegan', 'آزادگان', 520, 850),

  // ---------------- L4 (Kolahdouz -> Mehrabad) ----------------
  // S('kolahdouz', 'Kolahdouz', 'کلاهدوز', 950, 520),
  // S('nirou-havaei', 'Nirou Havaei', 'نیروی هوایی', 905, 520),
  // S('nabard', 'Nabard', 'نبرد', 855, 520),
  S('pirouzi', 'Pirouzi', 'پیروزی', 815, 520),
  S('shohada', 'Shohada', ' شهدا', 740, 520),
  // darvazeh-shemiran is already defined above (intersection)
  // darvazeh-dowlat is already defined above (intersection)
  S('ferdowsi', 'Ferdowsi', 'فردوسی', 590, 460),
  // teatr-shahr is already defined above (intersection)
  S('enghelab', 'Enghelab', ' انقلاب', 520, 460),
  S('towhid', 'Towhid', 'توحید', 485, 460),
  // shademan is already defined above (intersection)
  S('dr-habibollah', 'Dr. Habibollah', 'دکتر حبیب‌الله', 420, 460),
  S('ostad-moein', 'Ostad Moein', 'استاد معین', 385, 460),
  S('azadi', 'Azadi', 'آزادی', 350, 460),
  S('bimeh', 'Bimeh', 'بیمه', 325, 460),
  S('mehrabad-t1-2', 'Mehrabad Airport', 'فرودگاه مهرآباد', 325, 500),
  // S('mehrabad-t4-6', 'Mehrabad Airport Terminal 4&6', 'پایانه ۴ و ۶ فرودگاه مهرآباد', 325, 550),
];


const E = (a, b, line_id, sort_order) => ({ from_node_id: a, to_node_id: b, line_id, sort_order });

const EDGES = [
  // ---------------- L1 ----------------
  // E('tajrish', 'gheytariyeh', 'L1', 10),
  // E('gheytariyeh', 'sadr', 'L1', 20),
  // E('sadr', 'gholhak', 'L1', 30),
  // E('gholhak', 'dr-shariati', 'L1', 40),
  // E('dr-shariati', 'mirdamad', 'L1', 50),
  // E('mirdamad', 'haghani', 'L1', 60),
  E('haghani', 'hemmat', 'L1', 70),
  E('hemmat', 'mosalla', 'L1', 80),
  E('mosalla', 'beheshti', 'L1', 90),
  E('beheshti', 'mofatteh', 'L1', 100),
  E('mofatteh', 'haftom-tir', 'L1', 110),
  E('haftom-tir', 'taleghani', 'L1', 120),
  E('taleghani', 'darvazeh-dowlat', 'L1', 130),
  E('darvazeh-dowlat', 'saadi', 'L1', 140),
  E('saadi', 'imam-khomeini', 'L1', 150),
  E('imam-khomeini', 'panzdah-khordad', 'L1', 160),
  E('panzdah-khordad', 'khayyam', 'L1', 170),
  // E('khayyam', 'mohammadiyeh', 'L1', 180),
  // E('mohammadiyeh', 'shoush', 'L1', 190),
  // E('shoush', 'payane-jonoub', 'L1', 200),
  // E('payane-jonoub', 'shahr-rey', 'L1', 210),
  // E('shahr-rey', 'haram-motahhar', 'L1', 220),
  // E('haram-motahhar', 'kahrizak', 'L1', 230),

  // ---------------- L2 ----------------
  // E('farhangsara', 'tehranpars', 'L2', 10),
  // E('tehranpars', 'bagheri', 'L2', 20),
  // E('bagheri', 'elm-o-sanat', 'L2', 30),
  // E('elm-o-sanat', 'janbazan', 'L2', 40),
  // E('janbazan', 'fadaak', 'L2', 50),
  // E('fadaak', 'sabalan', 'L2', 60),
  // E('sabalan', 'madani', 'L2', 70),
  E('madani', 'emam-hossein', 'L2', 80),
  E('emam-hossein', 'darvazeh-shemiran', 'L2', 90),
  E('darvazeh-shemiran', 'baharestan', 'L2', 100),
  E('baharestan', 'mellat', 'L2', 110),
  E('mellat', 'imam-khomeini', 'L2', 120),
  E('imam-khomeini', 'hassan-abad', 'L2', 130), // intersection
  E('hassan-abad', 'horr', 'L2', 140),
  E('horr', 'shademan', 'L2', 150),     // intersection
  E('shademan', 'sharif-university', 'L2', 160),
  E('sharif-university', 'tarasht', 'L2', 170),
  E('tarasht', 'sadeghiyeh', 'L2', 180),

  // ---------------- L3 ----------------
  // E('ghaem', 'mahallati', 'L3', 10),
  // E('mahallati', 'aghdasieh', 'L3', 20),
  // E('aghdasieh', 'nobonyad', 'L3', 30),
  // E('nobonyad', 'hossein-abad', 'L3', 40),
  // E('hossein-abad', 'heravi', 'L3', 50),
  // E('heravi', 'zeynoddin', 'L3', 60),
  // E('zeynoddin', 'khajeh-abdollah-ansari', 'L3', 70),
  // E('khajeh-abdollah-ansari', 'sayyad-shirazi', 'L3', 80),
  E('sayyad-shirazi', 'ghoddoosi', 'L3', 90),
  E('ghoddoosi', 'sohrevardi', 'L3', 100),
  E('sohrevardi', 'beheshti', 'L3', 110), // intersection
  E('beheshti', 'mirza-ye-shirazi', 'L3', 120),
  E('mirza-ye-shirazi', 'jahad', 'L3', 130),
  E('jahad', 'vali-asr', 'L3', 140),
  E('vali-asr', 'teatr-shahr', 'L3', 150),     // intersection
  E('teatr-shahr', 'moniriyeh', 'L3', 160),
  E('moniriyeh', 'mahdiyeh', 'L3', 170),
  E('mahdiyeh', 'rahahan', 'L3', 180),
  // E('rahahan', 'azadegan', 'L3', 190),

  // ---------------- L4 (Kolahdouz -> Mehrabad) ----------------
  // E('kolahdouz', 'nirou-havaei', 'L4', 10),
  // E('nirou-havaei', 'nabard', 'L4', 20),
  // E('nabard', 'pirouzi', 'L4', 30),
  E('pirouzi', 'shohada', 'L4', 40),
  E('shohada', 'darvazeh-shemiran', 'L4', 50),     // intersection
  E('darvazeh-shemiran', 'darvazeh-dowlat', 'L4', 60), // intersection
  E('darvazeh-dowlat', 'ferdowsi', 'L4', 70),
  E('ferdowsi', 'teatr-shahr', 'L4', 80),        // intersection
  E('teatr-shahr', 'enghelab', 'L4', 90), // intersection
  E('enghelab', 'towhid', 'L4', 100),
  E('towhid', 'shademan', 'L4', 110),              // intersection
  E('shademan', 'dr-habibollah', 'L4', 120),
  E('dr-habibollah', 'ostad-moein', 'L4', 130),
  E('ostad-moein', 'azadi', 'L4', 140),
  E('azadi', 'bimeh', 'L4', 150),
  E('bimeh', 'mehrabad-t1-2', 'L4', 160),
  // E('mehrabad-t1-2', 'mehrabad-t4-6', 'L4', 170),
];

const TEHRAN_SEED = { LINES, NODES, EDGES };

// ─────────────────────────────────────────────────────────────────────────────

function initMetroSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS metro_line (
      id         TEXT PRIMARY KEY,
      name_en    TEXT NOT NULL,
      name_fa    TEXT NOT NULL,
      color_hex  TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS metro_node (
      id       TEXT PRIMARY KEY,
      name_en  TEXT NOT NULL,
      name_fa  TEXT NOT NULL,
      type     TEXT NOT NULL CHECK(type IN ('station','intersection')),
      x        INTEGER NOT NULL,
      y        INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS metro_edge (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      from_node_id  TEXT NOT NULL,
      to_node_id    TEXT NOT NULL,
      line_id       TEXT NOT NULL,
      sort_order    INTEGER NOT NULL DEFAULT 0,

      FOREIGN KEY(from_node_id) REFERENCES metro_node(id) ON DELETE CASCADE,
      FOREIGN KEY(to_node_id)   REFERENCES metro_node(id) ON DELETE CASCADE,
      FOREIGN KEY(line_id)      REFERENCES metro_line(id) ON DELETE CASCADE,

      UNIQUE(from_node_id, to_node_id, line_id)
    );

    CREATE INDEX IF NOT EXISTS idx_metro_edge_line ON metro_edge(line_id);
    CREATE INDEX IF NOT EXISTS idx_metro_edge_from ON metro_edge(from_node_id);
    CREATE INDEX IF NOT EXISTS idx_metro_edge_to   ON metro_edge(to_node_id);
  `);
}


/**
 * Idempotent metro seed:
 * - upserts lines + nodes
 * - deletes edges for seeded lines then reinserts
 */
function seedMetro(db, metroSeed = TEHRAN_SEED) {
  const tx = db.transaction(() => {
    const upsertLine = db.prepare(`
      INSERT INTO metro_line (id, name_en, name_fa, color_hex, sort_order)
      VALUES (@id, @name_en, @name_fa, @color_hex, @sort_order)
      ON CONFLICT(id) DO UPDATE SET
        name_en=excluded.name_en,
        name_fa=excluded.name_fa,
        color_hex=excluded.color_hex,
        sort_order=excluded.sort_order;
    `);

    for (const line of metroSeed.LINES) upsertLine.run(line);

    const upsertNode = db.prepare(`
      INSERT INTO metro_node (id, name_en, name_fa, type, x, y)
      VALUES (@id, @name_en, @name_fa, @type, @x, @y)
      ON CONFLICT(id) DO UPDATE SET
        name_en=excluded.name_en,
        name_fa=excluded.name_fa,
        type=excluded.type,
        x=excluded.x,
        y=excluded.y;
    `);

    for (const node of metroSeed.NODES) upsertNode.run(node);

    const delEdges = db.prepare(`DELETE FROM metro_edge WHERE line_id = ?`);
    for (const l of metroSeed.LINES) delEdges.run(l.id);

    const insEdge = db.prepare(`
      INSERT INTO metro_edge (from_node_id, to_node_id, line_id, sort_order)
      VALUES (?, ?, ?, ?);
    `);

    for (const e of metroSeed.EDGES) {
      insEdge.run(e.from_node_id, e.to_node_id, e.line_id, e.sort_order ?? 0);
    }
  });

  tx();
}

function getMetroGraph(db) {
  const lines = db
    .prepare('SELECT id, name_en, name_fa, color_hex, sort_order FROM metro_line ORDER BY sort_order')
    .all();

  const nodes = db.prepare('SELECT id, name_en, name_fa, type, x, y FROM metro_node').all();

  const edges = db
    .prepare(
      `SELECT id, from_node_id, to_node_id, line_id, sort_order
       FROM metro_edge
       ORDER BY line_id, sort_order, id`
    )
    .all();

  return { lines, nodes, edges };
}

function listMetroEdges(db, { line_id } = {}) {
  if (line_id) {
    return db
      .prepare(
        `SELECT id, from_node_id, to_node_id, line_id, sort_order
         FROM metro_edge
         WHERE line_id = ?
         ORDER BY sort_order, id`
      )
      .all(line_id);
  }

  return db
    .prepare(
      `SELECT id, from_node_id, to_node_id, line_id, sort_order
       FROM metro_edge
       ORDER BY line_id, sort_order, id`
    )
    .all();
}

function migrateMetroSchema(db) {
  try {
    db.exec(`ALTER TABLE metro_line ADD COLUMN name_fa TEXT NOT NULL DEFAULT ''`);
  } catch (e) {}

  try {
    db.prepare(`UPDATE metro_line SET name_fa = name_en WHERE name_fa = ''`).run();
  } catch (e) {}
}

module.exports = {
  initMetroSchema,
  seedMetro,
  getMetroGraph,
  listMetroEdges,
  migrateMetroSchema,
};
