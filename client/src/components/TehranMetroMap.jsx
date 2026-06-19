import { useMemo, useState } from 'react';

/**
 * Props:
 * - graph: { lines: [{id,color_hex,name_en,sort_order}], nodes: [{id,name_en,name_fa,x,y,type}], edges: [{id,from_node_id,to_node_id,line_id}] }
 * - highlightEdgeIds?: number[]  (future game: selected route edges)
 * - onSelectNode?: (node) => void
 */
export default function TehranMetroMap({ graph, highlightEdgeIds = [], onSelectNode }) {
  const [hoverNodeId, setHoverNodeId] = useState(null);

  const { lineById, nodeById, edgesWithPoints, bounds, importantNodeIds } = useMemo(() => {
    const lineById = Object.fromEntries((graph?.lines ?? []).map(l => [l.id, l]));
    const nodeById = Object.fromEntries((graph?.nodes ?? []).map(n => [n.id, n]));

    const edges = (graph?.edges ?? [])
      .map(e => {
        const a = nodeById[e.from_node_id];
        const b = nodeById[e.to_node_id];
        if (!a || !b) return null;
        return { ...e, a, b };
      })
      .filter(Boolean);

    // Compute bounds for viewBox padding
    const xs = (graph?.nodes ?? []).map(n => n.x);
    const ys = (graph?.nodes ?? []).map(n => n.y);
    const minX = xs.length ? Math.min(...xs) : 0;
    const maxX = xs.length ? Math.max(...xs) : 1000;
    const minY = ys.length ? Math.min(...ys) : 0;
    const maxY = ys.length ? Math.max(...ys) : 700;

    const pad = 70;
    const bounds = { x: minX - pad, y: minY - pad, w: (maxX - minX) + pad * 2, h: (maxY - minY) + pad * 2 };

    // “Important” labels: intersections + endpoints (degree=1) + hovered
    const degree = {};
    for (const e of edges) {
      degree[e.from_node_id] = (degree[e.from_node_id] ?? 0) + 1;
      degree[e.to_node_id] = (degree[e.to_node_id] ?? 0) + 1;
    }
    const important = new Set();
    for (const n of graph?.nodes ?? []) {
      const deg = degree[n.id] ?? 0;
      if (deg <= 1) important.add(n.id); // endpoints
    }
    // heuristic intersections: nodes touched by >=3 edges OR explicitly named type 'intersection'
    for (const n of graph?.nodes ?? []) {
      const deg = degree[n.id] ?? 0;
      if (deg >= 3 || n.type === 'intersection') important.add(n.id);
    }

    return { lineById, nodeById, edgesWithPoints: edges, bounds, importantNodeIds: important };
  }, [graph]);

  const highlightSet = useMemo(() => new Set((highlightEdgeIds ?? []).map(Number)), [highlightEdgeIds]);

  // Keep strokes crisp at different zooms
  const baseStroke = 10;
  const highlightStroke = 16;

  if (!graph) return null;

  return (
    <div style={styles.wrap}>
      <svg
        viewBox={`${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}`}
        style={styles.svg}
        role="img"
        aria-label="Tehran Metro schematic map"
      >
        {/* Background grid (very subtle) */}
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
          </pattern>

          {/* Glow for highlighted edges */}
          <filter id="edgeGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.55 0"
              result="coloredBlur"
            />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x={bounds.x} y={bounds.y} width={bounds.w} height={bounds.h} fill="url(#grid)" />

        {/* Edges (base) */}
        {edgesWithPoints.map(e => {
          const color = lineById[e.line_id]?.color_hex ?? '#999';
          const isHover = hoverNodeId && (hoverNodeId === e.from_node_id || hoverNodeId === e.to_node_id);
          const dim = hoverNodeId && !isHover;

          return (
            <line
              key={`edge-${e.id}`}
              x1={e.a.x}
              y1={e.a.y}
              x2={e.b.x}
              y2={e.b.y}
              stroke={color}
              strokeWidth={baseStroke}
              strokeLinecap="round"
              opacity={dim ? 0.25 : 0.95}
            />
          );
        })}

        {/* Highlighted route edges (drawn on top) */}
        {edgesWithPoints
          .filter(e => highlightSet.has(Number(e.id)))
          .map(e => {
            const color = lineById[e.line_id]?.color_hex ?? '#111';
            return (
              <g key={`hl-${e.id}`} filter="url(#edgeGlow)">
                {/* white under-stroke to separate from background/other lines */}
                <line
                  x1={e.a.x}
                  y1={e.a.y}
                  x2={e.b.x}
                  y2={e.b.y}
                  stroke="#fff"
                  strokeWidth={highlightStroke + 6}
                  strokeLinecap="round"
                  opacity={0.95}
                />
                <line
                  x1={e.a.x}
                  y1={e.a.y}
                  x2={e.b.x}
                  y2={e.b.y}
                  stroke={color}
                  strokeWidth={highlightStroke}
                  strokeLinecap="round"
                  opacity={1}
                />
              </g>
            );
          })}

        {/* Nodes */}
        {(graph.nodes ?? []).map(n => {
          const isHover = hoverNodeId === n.id;

          // Slightly larger if important/transfer or hovered
          const r = isHover ? 10 : importantNodeIds.has(n.id) ? 8 : 6;

          return (
            <g
              key={`node-${n.id}`}
              onMouseEnter={() => setHoverNodeId(n.id)}
              onMouseLeave={() => setHoverNodeId(null)}
              onClick={() => onSelectNode?.(n)}
              style={{ cursor: onSelectNode ? 'pointer' : 'default' }}
            >
              <circle cx={n.x} cy={n.y} r={r + 3} fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.0)" />
              <circle
                cx={n.x}
                cy={n.y}
                r={r}
                fill={importantNodeIds.has(n.id) ? '#111' : '#fff'}
                stroke="#111"
                strokeWidth={2.5}
              />

              {/* Label: show for important nodes; show also on hover */}
              {(importantNodeIds.has(n.id) || isHover) && (
                <g>
                  <rect
                    x={n.x + 10}
                    y={n.y - 16}
                    rx="6"
                    ry="6"
                    width={labelWidth(n.name_en)}
                    height="22"
                    fill="rgba(255,255,255,0.92)"
                    stroke="rgba(0,0,0,0.12)"
                  />
                  <text
                    x={n.x + 16}
                    y={n.y}
                    fontSize="13"
                    fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial"
                    fill="#111"
                  >
                    {n.name_en}
                  </text>

                  {/* Secondary line (Farsi) on hover only */}
                  {isHover && (
                    <>
                      <rect
                        x={n.x + 10}
                        y={n.y + 8}
                        rx="6"
                        ry="6"
                        width={labelWidth(n.name_fa || '')}
                        height="22"
                        fill="rgba(255,255,255,0.92)"
                        stroke="rgba(0,0,0,0.12)"
                      />
                      <text
                        x={n.x + 16}
                        y={n.y + 24}
                        fontSize="13"
                        fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial"
                        fill="#333"
                        direction="rtl"
                        style={{ unicodeBidi: 'plaintext' }}
                      >
                        {n.name_fa}
                      </text>
                    </>
                  )}
                </g>
              )}
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${bounds.x + 18}, ${bounds.y + 18})`}>
          <rect x="0" y="0" width="220" height={22 + (graph.lines?.length ?? 0) * 18} rx="12" fill="rgba(255,255,255,0.92)" stroke="rgba(0,0,0,0.12)" />
          <text x="14" y="18" fontSize="13" fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial" fill="#111">
            Lines 1–4
          </text>
          {(graph.lines ?? [])
            .slice()
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((l, i) => (
              <g key={`leg-${l.id}`} transform={`translate(14, ${28 + i * 18})`}>
                <line x1="0" y1="6" x2="34" y2="6" stroke={l.color_hex} strokeWidth="8" strokeLinecap="round" />
                <text x="44" y="10" fontSize="12.5" fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial" fill="#111">
                  {l.name_en}
                </text>
              </g>
            ))}
        </g>
      </svg>

      <div style={styles.hint}>
        Hover a station to see its Persian name. Later: click stations/edges for gameplay.
      </div>
    </div>
  );
}

/**
 * Cheap label width estimator so we can draw a background rect.
 * (It doesn't have to be perfect; it just prevents ugly overlaps.)
 */
function labelWidth(text) {
  const t = String(text ?? '');
  const min = 86;
  const max = 220;
  const w = 10 + t.length * 7.2;
  return Math.max(min, Math.min(max, w));
}

const styles = {
  wrap: {
    width: '100%',
    overflowX: 'auto',
    border: '1px solid rgba(0,0,0,0.12)',
    borderRadius: 14,
    background: 'linear-gradient(180deg, #ffffff 0%, #fbfbfd 100%)',
  },
  svg: {
    display: 'block',
    width: '100%',
    minWidth: 1100, // allows horizontal scroll on small screens
    height: 'auto',
  },
  hint: {
    padding: '10px 12px',
    fontSize: 12,
    color: 'rgba(0,0,0,0.62)',
    borderTop: '1px solid rgba(0,0,0,0.08)',
  },
};
