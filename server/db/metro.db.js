'use strict';

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


function canonicalEdge(a, b) {
  return a < b ? [a, b] : [b, a];
}

/**
 * Idempotent metro seed:
 * - upserts lines + nodes
 * - deletes edges for seeded lines then reinserts
 */
function seedMetro(db, metroSeed) {
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
      const [from, to] = canonicalEdge(e.from_node_id, e.to_node_id);
      insEdge.run(from, to, e.line_id, e.sort_order ?? 0);
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
