'use strict';

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

module.exports = {
  seedMetro,
  getMetroGraph,
  listMetroEdges,
};
