import { useMemo } from 'react';

/**
 * Props:
 * - graph: {
 *    lines: [{id,color_hex,name_en,sort_order}],
 *    nodes: [{id,name_en,name_fa,x,y,type}],
 *    edges: [{id,from_node_id,to_node_id,line_id,sort_order}]
 *   }
 * - highlightEdgeIds?: number[]  (future game: selected route edges)
 * - onSelectNode?: (node) => void
 */

const FONT_LABEL = 10;
const FONT_LEGEND_TITLE = 11;
const FONT_LEGEND_ITEM = 10;


export default function TehranMetroMap({ graph, highlightEdgeIds = [], onSelectNode }) {
  const { lineById, nodeById, edgesWithPoints, bounds } = useMemo(() => {
    const lineById = Object.fromEntries((graph?.lines ?? []).map((l) => [l.id, l]));
    const nodeById = Object.fromEntries((graph?.nodes ?? []).map((n) => [n.id, n]));

    const edges = (graph?.edges ?? [])
      .map((e) => {
        const a = nodeById[e.from_node_id];
        const b = nodeById[e.to_node_id];
        if (!a || !b) return null;
        return { ...e, a, b };
      })
      .filter(Boolean);

    const xs = (graph?.nodes ?? []).map((n) => n.x);
    const ys = (graph?.nodes ?? []).map((n) => n.y);

    const minX = xs.length ? Math.min(...xs) : 0;
    const maxX = xs.length ? Math.max(...xs) : 1000;
    const minY = ys.length ? Math.min(...ys) : 0;
    const maxY = ys.length ? Math.max(...ys) : 700;

    const pad = 70;
    const bounds = {
      x: minX - pad,
      y: minY - pad,
      w: maxX - minX + pad * 2,
      h: maxY - minY + pad * 2,
    };

    return { lineById, nodeById, edgesWithPoints: edges, bounds };
  }, [graph]);

  const highlightSet = useMemo(() => new Set((highlightEdgeIds ?? []).map(Number)), [highlightEdgeIds]);

  const baseStroke = 10;
  const highlightStroke = 16;

  if (!graph) return null;

  const centerX = bounds.x + bounds.w / 2;

  return (
    <div style={styles.wrap}>
      <svg
        viewBox={`${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}`}
        style={styles.svg}
        role="img"
        aria-label="Tehran Metro schematic map"
      >
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
          </pattern>

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

        {/* <rect x={bounds.x} y={bounds.y} width={bounds.w} height={bounds.h} fill="url(#grid)" /> */}

        {/* Edges (base) */}
        {edgesWithPoints.map((e) => {
          const color = lineById[e.line_id]?.color_hex ?? '#999';
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
              opacity={0.95}
            />
          );
        })}

        {/* Highlighted route edges (drawn on top) */}
        {edgesWithPoints
          .filter((e) => highlightSet.has(Number(e.id)))
          .map((e) => {
            const color = lineById[e.line_id]?.color_hex ?? '#111';
            return (
              <g key={`hl-${e.id}`} filter="url(#edgeGlow)">
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

        {/* Nodes + ALWAYS-ON English labels */}
        {(graph.nodes ?? []).map((n) => {
          const isImportant = isIntersectionNode(n.id); // optional: quick rule for your known intersections
          const r = isImportant ? 8 : 6;

          // flip label left/right to reduce collisions
          const w = labelWidth(n.name_en);
          const onRight = n.x < centerX;
          const dx = onRight ? 10 : -(w + 10);
          // const rectX = n.x + dx;
          // const rectY = n.y - 16;

          return (
            <g
              key={`node-${n.id}`}
              onClick={() => onSelectNode?.(n)}
              style={{ cursor: onSelectNode ? 'pointer' : 'default' }}
            >
              <circle cx={n.x} cy={n.y} r={r + 3} fill="rgba(255,255,255,0.9)" stroke="rgba(0,0,0,0.0)" />
              <circle cx={n.x} cy={n.y} r={r} fill={isImportant ? '#111' : '#fff'} stroke="#111" strokeWidth={2.5} />

              {/* <rect
                x={rectX}
                y={rectY}
                rx="6"
                ry="6"
                width={w}
                height="22"
                fill="rgba(255,255,255,0.92)"
                stroke="rgba(0,0,0,0.12)"
              // /> */}
              <text
                x={n.x + dx}
                y={n.y}
                fontSize={FONT_LABEL}
                fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial"
                fill="#111"
              >
                {n.name_en}
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${bounds.x + 18}, ${bounds.y + 18})`}>
          {/* <rect
            x="0"
            y="0"
            width="220"
            height={22 + (graph.lines?.length ?? 0) * 18}
            rx="12"
            fill="rgba(255,255,255,0.92)"
            stroke="rgba(0,0,0,0.12)"
          /> */}
          <text x="14" y="18" fontSize={FONT_LEGEND_TITLE} fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial" fill="#111">
            Lines 1–4
          </text>

          {(graph.lines ?? [])
            .slice()
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((l, i) => (
              <g key={`leg-${l.id}`} transform={`translate(14, ${28 + i * 18})`}>
                <line x1="0" y1="6" x2="34" y2="6" stroke={l.color_hex} strokeWidth="8" strokeLinecap="round" />
                <text x="44" y="10" fontSize={FONT_LEGEND_ITEM} fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial" fill="#111">
                  {l.name_en}
                </text>
              </g>
            ))}
        </g>
      </svg>

      <div style={styles.hint}>
        Station names are always shown (English). Click stations later for gameplay.
      </div>
    </div>
  );
}

/**
 * Optional: treat your known transfer stations as “important” (bigger dot).
 * Keep this list aligned with your seed.
 */
function isIntersectionNode(id) {
  return (
    id === 'darvazeh-dowlat' ||
    id === 'teatr-e-shahr' ||
    id === 'shahid-beheshti' ||
    id === 'imam-khomeini' ||
    id === 'meydan-e-enghelab' ||
    id === 'darvazeh-shemiran' ||
    id === 'shademan'
  );
}

/**
 * Cheap label width estimator so we can draw a background rect.
 */
function labelWidth(text) {
  const t = String(text ?? '');
  const min = 70;
  const max = 240;
  const w = 12 + t.length * 6.8;
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
    minWidth: 0,
    height: 'auto',
  },
  hint: {
    padding: '10px 12px',
    fontSize: FONT_LABEL,
    color: 'rgba(0,0,0,0.62)',
    borderTop: '1px solid rgba(0,0,0,0.08)',
  },
};
