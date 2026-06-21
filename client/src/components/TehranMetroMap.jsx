import { useMemo } from 'react';

/**
 * Props:
 * - graph: {
 *    lines: [{id,color_hex,name_fa,name_en,sort_order}],
 *    nodes: [{id,name_fa,name_en,x,y,type}],
 *    edges: [{id,from_node_id,to_node_id,line_id,sort_order}]
 *   }
 * - onSelectNode?: (node) => void
 * - mode?: 'normal' | 'play' | 'validation'
 * - highlightedNodeIds?: string[]
 * - selectedEdgeIds?: string[]   // IMPORTANT: in validation mode, App should pass SUBMITTED ids here
 * - lang?: 'fa' | 'en'
 */

const FONT_LABEL = 9;
const FONT_LEGEND_TITLE = 10;
const FONT_LEGEND_ITEM = 9;

// Manual label placement per station id.
// dx/dy are offsets from the station (node) coordinates.
const LABELS = {
  // Intersections (examples — tune as you like)
  // l1
  // 'shahid-haghani' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  // 'shahid-hemmat' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  // 'mosalla' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  'beheshti' : { dx: 5, dy: -15, anchor: 'start', baseline: 'middle' },
  // 'shahid-mofatteh' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  // 'shohada-ye-haftom-e-tir' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  // 'taleghani' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  'darvazeh-dowlat' : { dx: 10, dy: -10, anchor: 'start', baseline: 'middle' },
  'saadi' : { dx: -10, dy: 0, anchor: 'end', baseline: 'middle' },
  // 'imam-khomeini' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  // 'panzdah-khordad' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  // 'khayyam' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  // l2
  // 'shahid-madani' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  // 'emam-hossein' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  // 'darvazeh-shemiran' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  // 'baharestan' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  // 'mellat' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  'hassan-abad' : { dx: 0, dy: -15, anchor: 'middle', baseline: 'middle' },
  'horr' : { dx: -10, dy: 0, anchor: 'end', baseline: 'middle' },
  'shademan' : { dx: 0, dy: -20, anchor: 'middle', baseline: 'middle' },
  'sharif-university' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  'tarasht' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  'sadeghiyeh' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  // l3
  // 'shahid-sayyad-shirazi' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  // 'shahid-ghoddoosi' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  // 'sohrevardi' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  'mirza-ye-shirazi' : { dx: -25, dy: -15, anchor: 'middle', baseline: 'middle' },
  'jahad' : { dx: -10, dy: 0, anchor: 'end', baseline: 'middle' },
  'vali-asr' : { dx: -10, dy: 0, anchor: 'end', baseline: 'middle' },
  'teatr-shahr' : { dx: 0, dy: 20, anchor: 'middle', baseline: 'middle' },
  // 'moniriyeh' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  // 'mahdiyeh' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  // 'rahahan' : { dx: 14, dy: -10, anchor: 'start', baseline: 'middle' },
  // l4
  'pirouzi' : { dx: 10, dy: 0, anchor: 'start', baseline: 'middle' },
  'shohada' : { dx: 14, dy: -10, anchor: 'middle', baseline: 'middle' },
  'ferdowsi' : { dx: 0, dy: -15, anchor: 'middle', baseline: 'middle' },
  'enghelab' : { dx: 0, dy: -15, anchor: 'middle', baseline: 'middle' },
  'towhid' : { dx: 0, dy: +15, anchor: 'middle', baseline: 'middle' },
  'dr-habibollah' : { dx: 0, dy: 15, anchor: 'middle', baseline: 'middle' },
  'ostad-moein' : { dx: 0, dy: -15, anchor: 'middle', baseline: 'middle' },
  'azadi' : { dx: 0, dy: 15, anchor: 'middle', baseline: 'middle' },
  'bimeh' : { dx: -10, dy: -15, anchor: 'start', baseline: 'middle' },
  'mehrabad-t1-2' : { dx: 14, dy: 0, anchor: 'start', baseline: 'middle' },
};

const DEFAULT_LABEL = { dx: 12, dy: 0, anchor: 'start', baseline: 'middle' };

export default function TehranMetroMap({
  graph,
  onSelectNode,
  mode = 'normal',
  lang = 'fa',
  highlightedNodeIds = [],
  selectedEdgeIds = [],
}) {
  const isFa = lang === 'fa';
  const isNormalMode = mode === 'normal';
  const isPlayMode = mode === 'play';
  const isValidationMode = mode === 'validation';

  const nodeLabel = (n) => (isFa ? n.name_fa : n.name_en);
  const lineLabel = (l) => (isFa ? l.name_fa : l.name_en);

  const { lineById, edgesWithPoints, bounds } = useMemo(() => {
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

    return { lineById, edgesWithPoints: edges, bounds };
  }, [graph]);

  // What edges to show
  const visibleEdges = useMemo(() => {
    if (isNormalMode) return edgesWithPoints;
    if (isPlayMode) return []; // hide all lines during selection phase (your original intent)
    if (isValidationMode) return edgesWithPoints.filter((e) => selectedEdgeIds.includes(e.id));
    return edgesWithPoints;
  }, [edgesWithPoints, isNormalMode, isPlayMode, isValidationMode, selectedEdgeIds]);

  // What nodes to show
  const visibleNodes = useMemo(() => {
    const nodes = graph?.nodes ?? [];

    // In play mode, show ONLY start + destination (matches your hint text).
    // if (isPlayMode) return nodes.filter((n) => highlightedNodeIds.includes(n.id));

    // In validation mode, show all nodes so the selected edges have context.
    // (If you prefer: filter to endpoints of selected edges.)
    return nodes;
  }, [graph, isPlayMode, highlightedNodeIds]);

  const baseStroke = 10;
  if (!graph) return null;

  return (
    <div style={styles.wrap}>
      <svg
        viewBox={`${bounds.x} ${bounds.y} ${bounds.w} ${bounds.h}`}
        style={styles.svg}
        role="img"
        aria-label="Metro schematic map"
      >
        {!isPlayMode &&
          visibleEdges.map((e) => {
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

        {visibleNodes.map((n) => {
          const isIntersection = isIntersectionNode(n.id);
          const isHighlighted = highlightedNodeIds.includes(n.id);

          const r = isIntersection && !isPlayMode ? 8 : 6;

          let fill = '#fff';
          if ((isPlayMode || isValidationMode) && isHighlighted) fill = '#22c55e';
          else if (isIntersection && !isPlayMode) fill = '#111';

          const cfg = LABELS[n.id] ?? DEFAULT_LABEL;
          const labelX = n.x + (cfg.dx ?? 0);
          const labelY = n.y + (cfg.dy ?? 0);
          const anchor = cfg.anchor ?? 'start';
          const baseline = cfg.baseline ?? 'middle';

          return (
            <g
              key={`node-${n.id}`}
              onClick={() => onSelectNode?.(n)}
              style={{ cursor: onSelectNode ? 'pointer' : 'default' }}
            >
              <circle cx={n.x} cy={n.y} r={r} fill={fill} stroke="#111" strokeWidth={2.5} />
              <text
                x={labelX}
                y={labelY}
                fontSize={FONT_LABEL}
                fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial"
                fill="rgba(0,0,0,0.80)"
                textAnchor={anchor}
                dominantBaseline={baseline}
              >
                {nodeLabel(n)}
              </text>
            </g>
          );
        })}

        {isNormalMode && (
          <g transform={`translate(${bounds.x + 18}, ${bounds.y + 18})`}>
            <text
              x="0"
              y="12"
              fontSize={FONT_LEGEND_TITLE}
              fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Arial"
              fill="rgba(0,0,0,0.72)"
            >
              {isFa ? 'خطوط ۱ تا ۴' : 'Lines 1–4'}
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
                    {lineLabel(l)}
                  </text>
                </g>
              ))}
          </g>
        )}
      </svg>
    </div>
  );
}

function isIntersectionNode(id) {
  return (
    id === 'darvazeh-dowlat' ||
    id === 'teatr-e-shahr' ||
    id === 'shahid-beheshti' ||
    id === 'imam-khomeini' ||
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
