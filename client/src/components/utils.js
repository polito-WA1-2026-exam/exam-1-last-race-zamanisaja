// utils.js
// One home for: labels, random start/destination picker, and route validation.
import { TEST_MODE, START_STATION_ID, DESTINATION_STATION_ID } from '../config.js';

export function getStationLabel(station, lang = 'fa') {
  if (!station) return '-';
  return lang === 'fa' ? station.name_fa : station.name_en;
}

/* ------------------------ Random station picking ------------------------ */

function buildAdjacency(graph) {
  const adj = new Map();

  for (const node of graph.nodes || []) {
    if (node.type === 'station') adj.set(node.id, []);
  }

  for (const edge of graph.edges || []) {
    const a = edge.from_node_id;
    const b = edge.to_node_id;
    if (adj.has(a) && adj.has(b)) {
      adj.get(a).push(b);
      adj.get(b).push(a);
    }
  }

  return adj;
}

function shortestDistance(graph, startId, endId) {
  if (!graph || startId === endId) return 0;

  const adj = buildAdjacency(graph);
  const queue = [[startId, 0]];
  const visited = new Set([startId]);

  while (queue.length) {
    const [cur, dist] = queue.shift();
    if (cur === endId) return dist;

    for (const nxt of adj.get(cur) || []) {
      if (!visited.has(nxt)) {
        visited.add(nxt);
        queue.push([nxt, dist + 1]);
      }
    }
  }

  return Infinity;
}

/**
 * Picks random { start, destination } stations such that shortest-path distance >= minDistance.
 * Returns null if not found within attemptLimit tries.
 */
export function pickRandomStations(graph, minDistance = 3, attemptLimit = 200) {
  if (TEST_MODE) {
    if (!graph?.nodes) return null;

    const start = graph.nodes.find((n) => n.id === START_STATION_ID && n.type === 'station');
    const destination = graph.nodes.find((n) => n.id === DESTINATION_STATION_ID && n.type === 'station');

    if (!start || !destination) return null;
    return { start, destination };
  }

  if (!graph?.nodes || !graph?.edges) return null;

  const stations = graph.nodes.filter((n) => n.type === 'station');
  if (stations.length < 2) return null;

  for (let attempt = 0; attempt < attemptLimit; attempt += 1) {
    const start = stations[Math.floor(Math.random() * stations.length)];

    const candidates = stations.filter((s) => {
      if (s.id === start.id) return false;
      const d = shortestDistance(graph, start.id, s.id);
      return Number.isFinite(d) && d >= minDistance;
    });

    if (candidates.length) {
      const destination = candidates[Math.floor(Math.random() * candidates.length)];
      return { start, destination };
    }
  }

  return null;
}

/* ------------------------ Route validation (game rules) ------------------------ */

function keyUndirected(a, b) {
  return a < b ? `${a}__${b}` : `${b}__${a}`;
}

/**
 * Interchange = station incident to edges from 2+ different lines.
 * (Computed from the full graph so it matches the real metro rules.)
 */
function computeInterchanges(graph) {
  const byStation = new Map(); // stationId -> Set(line_id)

  for (const e of graph.edges || []) {
    if (!byStation.has(e.from_node_id)) byStation.set(e.from_node_id, new Set());
    if (!byStation.has(e.to_node_id)) byStation.set(e.to_node_id, new Set());
    byStation.get(e.from_node_id).add(e.line_id);
    byStation.get(e.to_node_id).add(e.line_id);
  }

  const interchanges = new Set();
  for (const [stationId, lineSet] of byStation.entries()) {
    if (lineSet.size >= 2) interchanges.add(stationId);
  }

  return interchanges;
}

/**
 * Valid route rules:
 * - Must start at startStationId and end at destinationStationId
 * - Each chosen segment must be a real edge in the graph
 * - Segments must form a single continuous traversal (a "walk")
 * - Line changes allowed only at interchange stations
 * - Station repeats allowed
 * - No segment used more than once
 *
 * NOTE:
 * selectedEdgeIds is an unordered set. We validate by trying to ORDER them into
 * a legal route that uses every chosen edge exactly once.
 *
 * Returns:
 * {
 *   ok: boolean,
 *   reason?: string,
 *   routeEdgeIds?: string[],
 *   routeNodeIds?: string[],
 * }
 */
export function validateRoute(graph, selectedEdgeIds, startStationId, destinationStationId) {
  if (!graph) return { ok: false, reason: 'Graph missing' };
  if (!startStationId || !destinationStationId) return { ok: false, reason: 'Start/destination missing' };

  if (!Array.isArray(selectedEdgeIds) || selectedEdgeIds.length === 0) {
    return { ok: false, reason: 'No segments selected' };
  }

  // (A) No duplicate edge IDs
  const idSet = new Set(selectedEdgeIds);
  if (idSet.size !== selectedEdgeIds.length) {
    return { ok: false, reason: 'A segment was selected more than once' };
  }

  // (B) All edges exist
  const edgeById = new Map((graph.edges || []).map((e) => [e.id, e]));
  const chosenEdges = selectedEdgeIds.map((id) => edgeById.get(id)).filter(Boolean);
  if (chosenEdges.length !== selectedEdgeIds.length) {
    return { ok: false, reason: 'Some selected edges do not exist in the graph' };
  }

  // (C) No duplicate physical segments (in case the dataset ever has parallel IDs)
  const segSet = new Set();
  for (const e of chosenEdges) {
    const k = keyUndirected(e.from_node_id, e.to_node_id);
    if (segSet.has(k)) return { ok: false, reason: 'Route contains the same segment more than once' };
    segSet.add(k);
  }

  const interchanges = computeInterchanges(graph);

  // Build adjacency only for chosen edges for fast traversal search
  const edgesByNode = new Map(); // nodeId -> edge objects
  for (const e of chosenEdges) {
    if (!edgesByNode.has(e.from_node_id)) edgesByNode.set(e.from_node_id, []);
    if (!edgesByNode.has(e.to_node_id)) edgesByNode.set(e.to_node_id, []);
    edgesByNode.get(e.from_node_id).push(e);
    edgesByNode.get(e.to_node_id).push(e);
  }

  if (!edgesByNode.has(startStationId)) return { ok: false, reason: 'Selected route does not touch the start station' };
  if (!edgesByNode.has(destinationStationId))
    return { ok: false, reason: 'Selected route does not touch the destination station' };

  // Depth-first search / backtracking to find an ordering that uses each selected edge once
  const used = new Set(); // edge.id
  const routeEdgeIds = [];
  const routeNodeIds = [startStationId];

  function nextNodeIfAllowed(currentNode, edge, currentLineId) {
    const next =
      edge.from_node_id === currentNode
        ? edge.to_node_id
        : edge.to_node_id === currentNode
          ? edge.from_node_id
          : null;

    if (!next) return null;

    // Line-change rule
    if (currentLineId && edge.line_id !== currentLineId) {
      if (!interchanges.has(currentNode)) return null;
    }

    return next;
  }

  function dfs(currentNode, currentLineId) {
    if (used.size === chosenEdges.length) {
      return currentNode === destinationStationId;
    }

    const candidates = edgesByNode.get(currentNode) || [];
    for (const edge of candidates) {
      if (used.has(edge.id)) continue;

      const nextNode = nextNodeIfAllowed(currentNode, edge, currentLineId);
      if (!nextNode) continue;

      used.add(edge.id);
      routeEdgeIds.push(edge.id);
      routeNodeIds.push(nextNode);

      if (dfs(nextNode, edge.line_id)) return true;

      used.delete(edge.id);
      routeEdgeIds.pop();
      routeNodeIds.pop();
    }

    return false;
  }

  const found = dfs(startStationId, null);

  if (!found) {
    // Second pass: can we reach the destination at all (no "use every edge" requirement)?
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
      reason: reachable
        ? 'A path from start to destination exists among your segments, but not all selected segments can be used exactly once — you may have selected extra or redundant segments.'
        : 'Selected segments cannot form a continuous route from start to destination under the line-change rules.',
    };
  }
}


export const BASE_SCORE = 20;

export function pickRandomEvent(events) {
  if (!Array.isArray(events) || events.length === 0) {
    throw new Error('events list is empty');
  }
  return events[Math.floor(Math.random() * events.length)];
}

/**
 * Assign one random event to each edgeId.
 * Returns: [{ edgeId, eventCode, eventScore }]
 */
export function assignEventsToEdges(edgeIds, events) {
  if (!Array.isArray(edgeIds)) throw new Error('edgeIds must be an array');

  return edgeIds.map((edgeId) => {
    const ev = pickRandomEvent(events);
    return {
      edgeId,
      eventCode: ev.code,
      eventScore: ev.score,
      title_en: ev.title_en,
      title_fa: ev.title_fa,
    };
  });
}

export function calculateGameScore(assignments, baseScore = BASE_SCORE) {
  const delta = (assignments || []).reduce((sum, a) => sum + (a.eventScore ?? 0), 0);
  return baseScore + delta;
}

/**
 * Convenience: given edgeIds + events, produce full result.
 */
export function simulateEdgeEventsAndScore(edgeIds, events, baseScore = BASE_SCORE) {
  const assignments = assignEventsToEdges(edgeIds, events);
  const finalScore = calculateGameScore(assignments, baseScore);
  return { baseScore, finalScore, assignments, triggeredEvents: assignments };
}
