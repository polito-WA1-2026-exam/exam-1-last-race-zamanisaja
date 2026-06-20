import { useMemo } from 'react';

/**
 * Props:
 * - graph: {
 *    lines: [{id,color_hex,name_en,sort_order}],
 *    nodes: [{id,name_en,name_fa,x,y,type}],
 *    edges: [{id,from_node_id,to_node_id,line_id,sort_order}]
 *   }
 * - onSelectNode?: (node) => void
 * - showEdges?: boolean   (when false: render stations + labels only)
 */

const FONT_LABEL = 9;
const FONT_LEGEND_TITLE = 10;
const FONT_LEGEND_ITEM = 9;

export default function TehranMetroMap({ graph, onSelectNode, showEdges = true }) {
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

  const baseStroke = 10;

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
        {/* Base edges (optional) */}
        {showEdges &&
          edgesWithPoints.map((e) => {
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

        {/* Nodes + always-on English labels */}
        {(graph.nodes ?? []).map((n) => {
          const isImportant = isIntersectionNode(n.id);
          const r = isImportant ? 8 : 6;

          // flip label left/right to reduce collisions
          const onRight = n.x < centerX;
          const labelDx = onRight ? 10 : -10;

          return (
            <g
              key={`node-${n.id}`}
              onClick={() => onSelectNode?.(n)}
              style={{ cursor: onSelectNode ? 'pointer' : 'default' }}
            >
              <circle cx={n.x} cy={n.y} r={r + 3} fill="rgba(255,255,255,0.92)" stroke="rgba(0,0,0,0)" />
              <circle cx={n.x} cy={n.y} r={r} fill={isImportant ? '#111' : '#fff'} stroke="#111" strokeWidth={2.5} />

              <text
                x={n.x + labelDx}
                y={n.y}
                fontSize={FONT_LABEL}
                fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial"
                fill="rgba(0,0,0,0.78)"
                textAnchor={onRight ? 'start' : 'end'}
                dominantBaseline="middle"
              >
                {n.name_en}
              </text>
            </g>
          );
        })}

        {/* Legend (no background box) */}
        <g transform={`translate(${bounds.x + 18}, ${bounds.y + 18})`}>
          <text
            x="0"
            y="12"
            fontSize={FONT_LEGEND_TITLE}
            fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial"
            fill="rgba(0,0,0,0.72)"
          >
            Lines 1–4
          </text>

          {(graph.lines ?? [])
            .slice()
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((l, i) => (
              <g key={`leg-${l.id}`} transform={`translate(0, ${20 + i * 16})`}>
                <line x1="0" y1="6" x2="34" y2="6" stroke={l.color_hex} strokeWidth="7" strokeLinecap="round" />
                <text
                  x="44"
                  y="9"
                  fontSize={FONT_LEGEND_ITEM}
                  fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial"
                  fill="rgba(0,0,0,0.78)"
                >
                  {l.name_en}
                </text>
              </g>
            ))}
        </g>
      </svg>

      <div style={styles.hint}>Station names are always shown (English).</div>
    </div>
  );
}

function isIntersectionNode(id) {
  return (
    id === 'darvazeh-dowlat' ||
    id === 'teatr-e-shahr' ||
    id === 'shahid-beheshti' ||
    id === 'imam-khomeini' ||
    // id === 'meydan-e-enghelab' ||
    id === 'darvazeh-shemiran' ||
    id === 'shademan'
  );
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
    fontSize: 11,
    color: 'rgba(0,0,0,0.62)',
    borderTop: '1px solid rgba(0,0,0,0.08)',
  },
};
