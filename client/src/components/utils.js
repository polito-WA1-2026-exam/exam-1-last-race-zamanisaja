// utils.js

export function getStationLabel(station, lang = 'fa') {
  if (!station) return '-';
  return lang === 'fa' ? station.name_fa : station.name_en;
}

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
 */
export function pickRandomStations(graph, minDistance = 3, attemptLimit = 200) {
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

/**
 * Validate a user's chosen edges as a "path attempt".
 *
 * Checks:
 *  1) All selected edges are connected together (one connected component).
 *  2) The endpoints of the selection match the required (startStationId, destinationStationId).
 *
 * Notes:
 * - This does NOT enforce "simple path" (no cycles) by default.
 * - If the user selects extra branches, it will fail endpoint logic (usually).
 *
 * Returns:
 * {
 *   ok: boolean,
 *   connected: boolean,
 *   endpointsMatch: boolean,
 *   endpoints: string[], // station ids that are endpoints (degree 1) in the selected subgraph
 *   reason?: string
 * }
 */
export function validateSelectedEdges(graph, selectedEdgeIds, startStationId, destinationStationId) {
  if (!graph) {
    return { ok: false, connected: false, endpointsMatch: false, endpoints: [], reason: 'Graph missing' };
  }

  if (!Array.isArray(selectedEdgeIds) || selectedEdgeIds.length === 0) {
    return { ok: false, connected: false, endpointsMatch: false, endpoints: [], reason: 'No edges selected' };
  }

  if (!startStationId || !destinationStationId) {
    return { ok: false, connected: false, endpointsMatch: false, endpoints: [], reason: 'Start/destination missing' };
  }

  const edgeById = new Map((graph.edges || []).map((e) => [e.id, e]));
  const selectedEdges = selectedEdgeIds
    .map((id) => edgeById.get(id))
    .filter(Boolean);

  if (selectedEdges.length !== selectedEdgeIds.length) {
    return {
      ok: false,
      connected: false,
      endpointsMatch: false,
      endpoints: [],
      reason: 'Some selected edges do not exist in the graph',
    };
  }

  // Build adjacency only for the selected subgraph + compute degrees
  const adj = new Map();      // stationId -> Set(neighbors)
  const degree = new Map();   // stationId -> number

  const addNode = (id) => {
    if (!adj.has(id)) adj.set(id, new Set());
    if (!degree.has(id)) degree.set(id, 0);
  };

  for (const e of selectedEdges) {
    const a = e.from_node_id;
    const b = e.to_node_id;

    addNode(a);
    addNode(b);

    adj.get(a).add(b);
    adj.get(b).add(a);

    degree.set(a, degree.get(a) + 1);
    degree.set(b, degree.get(b) + 1);
  }

  const nodesInSelection = Array.from(adj.keys());
  if (nodesInSelection.length === 0) {
    return { ok: false, connected: false, endpointsMatch: false, endpoints: [], reason: 'Empty selection' };
  }

  // (1) Connectivity check (BFS over selected subgraph)
  const start = nodesInSelection[0];
  const visited = new Set([start]);
  const queue = [start];

  while (queue.length) {
    const cur = queue.shift();
    for (const nxt of adj.get(cur) || []) {
      if (!visited.has(nxt)) {
        visited.add(nxt);
        queue.push(nxt);
      }
    }
  }

  const connected = visited.size === nodesInSelection.length;

  // (2) Endpoint check:
  // For a path-like selection, endpoints are nodes with degree 1.
  const endpoints = nodesInSelection.filter((id) => degree.get(id) === 1);

  // We accept either order: (start,dest) or (dest,start)
  const endpointsMatch =
    endpoints.length === 2 &&
    ((endpoints[0] === startStationId && endpoints[1] === destinationStationId) ||
      (endpoints[0] === destinationStationId && endpoints[1] === startStationId));

  const ok = connected && endpointsMatch;

  let reason = undefined;
  if (!connected) reason = 'Selected edges are not connected';
  else if (!endpointsMatch)
    reason = 'Selected path endpoints do not match the required start/destination';

  return { ok, connected, endpointsMatch, endpoints, reason };
}
