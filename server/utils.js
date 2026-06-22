'use strict';

const BASE_SCORE = 20;

/**
 * Returns an undirected key for a pair of node IDs.
 * Used to detect physically duplicate segments regardless of direction.
 */
function keyUndirected(a, b) {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}

/**
 * Builds a Set of station IDs that are interchange stations
 * (i.e. served by two or more lines).
 */
function computeInterchanges(graph) {
  const byStation = new Map();
  for (const e of graph.edges || []) {
    if (!byStation.has(e.from_node_id)) byStation.set(e.from_node_id, new Set());
    if (!byStation.has(e.to_node_id))   byStation.set(e.to_node_id,   new Set());
    byStation.get(e.from_node_id).add(e.line_id);
    byStation.get(e.to_node_id).add(e.line_id);
  }

  const interchanges = new Set();
  for (const [id, lineSet] of byStation)
    if (lineSet.size >= 2) interchanges.add(id);

  return interchanges;
}

/**
 * Validates that the selected edges form a legal, continuous route from
 * startStationId to destinationStationId according to the metro graph rules
 * (no duplicate segments, line-change only at interchange stations).
 */
function validateRoute(graph, selectedEdgeIds, startStationId, destinationStationId) {
  if (!graph)
    return { ok: false, reasonCode: 'GRAPH_MISSING' };
  if (!startStationId || !destinationStationId)
    return { ok: false, reasonCode: 'MISSING_ENDPOINTS' };
  if (!Array.isArray(selectedEdgeIds) || selectedEdgeIds.length === 0)
    return { ok: false, reasonCode: 'NO_SEGMENTS' };

  // Normalise to numbers
  const normalised = selectedEdgeIds.map(Number);
  const idSet = new Set(normalised);
  if (idSet.size !== normalised.length)
    return { ok: false, reasonCode: 'DUPLICATE_SEGMENT' };

  const edgeById    = new Map((graph.edges || []).map((e) => [e.id, e]));
  const chosenEdges = [...idSet].map((id) => edgeById.get(id)).filter(Boolean);
  if (chosenEdges.length !== idSet.size)
    return { ok: false, reasonCode: 'UNKNOWN_EDGE' };

  // Detect physically duplicate segments (same pair of nodes, different IDs)
  const segSet = new Set();
  for (const e of chosenEdges) {
    const k = keyUndirected(e.from_node_id, e.to_node_id);
    if (segSet.has(k)) return { ok: false, reasonCode: 'DUPLICATE_SEGMENT' };
    segSet.add(k);
  }

  const interchanges = computeInterchanges(graph);

  // Build adjacency for chosen edges only
  const edgesByNode = new Map();
  for (const e of chosenEdges) {
    if (!edgesByNode.has(e.from_node_id)) edgesByNode.set(e.from_node_id, []);
    if (!edgesByNode.has(e.to_node_id))   edgesByNode.set(e.to_node_id,   []);
    edgesByNode.get(e.from_node_id).push(e);
    edgesByNode.get(e.to_node_id).push(e);
  }

  if (!edgesByNode.has(startStationId))
    return { ok: false, reasonCode: 'MISSING_START' };
  if (!edgesByNode.has(destinationStationId))
    return { ok: false, reasonCode: 'MISSING_DESTINATION' };

  const used         = new Set();
  const routeEdgeIds = [];
  const routeNodeIds = [startStationId];

  function nextNodeIfAllowed(cur, edge, curLine) {
    const next =
      edge.from_node_id === cur ? edge.to_node_id  :
      edge.to_node_id   === cur ? edge.from_node_id : null;
    if (!next) return null;
    // Line change is only allowed at interchange stations
    if (curLine && edge.line_id !== curLine && !interchanges.has(cur)) return null;
    return next;
  }

  function dfs(cur, curLine) {
    if (used.size === chosenEdges.length) return cur === destinationStationId;
    for (const edge of (edgesByNode.get(cur) || [])) {
      if (used.has(edge.id)) continue;
      const next = nextNodeIfAllowed(cur, edge, curLine);
      if (!next) continue;
      used.add(edge.id);    routeEdgeIds.push(edge.id);  routeNodeIds.push(next);
      if (dfs(next, edge.line_id)) return true;
      used.delete(edge.id); routeEdgeIds.pop();           routeNodeIds.pop();
    }
    return false;
  }

  const found = dfs(startStationId, null);

  if (!found) {
    // Second pass: can we reach the destination at all (ignoring the "use every edge" rule)?
    const reachUsed = new Set();
    function canReach(node, lineId) {
      if (node === destinationStationId) return true;
      for (const edge of edgesByNode.get(node) || []) {
        if (reachUsed.has(edge.id)) continue;
        const next = nextNodeIfAllowed(node, edge, lineId);
        if (!next) continue;
        reachUsed.add(edge.id);
        if (canReach(next, edge.line_id)) return true;
        reachUsed.delete(edge.id);
      }
      return false;
    }
    const reachable = canReach(startStationId, null);
    return {
      ok: false,
      reasonCode: reachable ? 'EXTRA_SEGMENTS' : 'NO_ROUTE',
    };
  }

  // If we reach here, the route is valid
  return { ok: true, reasonCode: 'SUCCESS', routeEdgeIds, routeNodeIds };
}

/**
 * Assigns one random event per route edge and computes the final score.
 * Event scores are only returned to the client AFTER the round is complete,
 * via the POST /api/games response — they are never sent in advance.
 */
function scoreRoute(routeEdgeIds, events, baseScore = BASE_SCORE) {
  if (!Array.isArray(events) || events.length === 0)
    return { finalScore: baseScore, triggeredEvents: [] };

  const triggeredEvents = routeEdgeIds.map((edgeId) => {
    const ev = events[Math.floor(Math.random() * events.length)];
    return {
      edgeId,
      eventCode:  ev.code,
      title_en:   ev.title_en,
      title_fa:   ev.title_fa,
      eventScore: ev.score,
    };
  });

  const finalScore =
    baseScore + triggeredEvents.reduce((sum, e) => sum + e.eventScore, 0);

  return { finalScore, triggeredEvents };
}

module.exports = { validateRoute, scoreRoute, BASE_SCORE };
