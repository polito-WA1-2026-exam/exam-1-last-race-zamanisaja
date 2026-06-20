// src/metro/pickStations.js

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

/** Returns the label for a station based on the current language. */
export function getStationLabel(station, lang = 'fa') {
    if (!station) return '-';
    return lang === 'fa' ? station.name_fa : station.name_en;
}