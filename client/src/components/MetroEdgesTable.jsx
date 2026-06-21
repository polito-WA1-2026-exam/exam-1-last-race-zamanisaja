import { useMemo } from 'react';
import { Table, Form, Badge } from 'react-bootstrap';
import { GAME_LEVEL } from '../config.js';

// level: 'easy'   – sorted edges, line column visible
//        'medium' – sorted edges, line column hidden
//        'hard'   – shuffled edges, line column hidden
export default function MetroEdgesTable({
  graph,
  selectedEdgeIds,
  onToggleEdge,
  lang = 'fa',
  level = GAME_LEVEL,
  showLineInfo = level === 'easy',
}) {
  const nodeNameById = useMemo(() => {
    const m = new Map();
    for (const n of graph?.nodes ?? []) m.set(n.id, lang === 'fa' ? n.name_fa : n.name_en);
    return m;
  }, [graph, lang]);

  // Keep full line objects here (only needed if we show line info)
  const lineById = useMemo(() => {
    if (!showLineInfo) return new Map();
    const m = new Map();
    for (const l of graph?.lines ?? []) m.set(l.id, l);
    return m;
  }, [graph, showLineInfo]);

  const selected = useMemo(() => new Set((selectedEdgeIds ?? []).map(Number)), [selectedEdgeIds]);

  const edges = useMemo(() => {
    const es = [...(graph?.edges ?? [])];
    if (level === 'hard') {
      // Fisher-Yates shuffle
      for (let i = es.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [es[i], es[j]] = [es[j], es[i]];
      }
    } else {
      es.sort((a, b) => {
        const la = a.line_id?.localeCompare(b.line_id ?? '') ?? 0;
        if (la !== 0) return la;

        const sa = (a.sort_order ?? 0) - (b.sort_order ?? 0);
        if (sa !== 0) return sa;

        return Number(a.id) - Number(b.id);
      });
    }
    return es;
  }, [graph, level]);

  const lineLabel = (l) =>
    lang === 'fa' ? (l?.name_fa ?? l?.name_en ?? '') : (l?.name_en ?? l?.name_fa ?? '');

  return (
    <div style={{ height: '100%', overflow: 'auto', border: '1px solid rgba(0,0,0,.12)', borderRadius: 12 }}>
      <Table hover size="sm" className="mb-0" style={{ margin: 0 }}>
        <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <tr>
            <th style={{ width: 44 }}>Pick</th>
            {showLineInfo && <th style={{ width: 64 }}>Line</th>}
            <th>Edge</th>
          </tr>
        </thead>

        <tbody>
          {edges.length === 0 ? (
            <tr>
              <td colSpan={showLineInfo ? 3 : 2} className="text-muted">
                No edges.
              </td>
            </tr>
          ) : (
            edges.map((e) => {
              const a = nodeNameById.get(e.from_node_id) ?? e.from_node_id;
              const b = nodeNameById.get(e.to_node_id) ?? e.to_node_id;
              const isChecked = selected.has(Number(e.id));

              const line = showLineInfo ? lineById.get(e.line_id) : null;
              const color = line?.color_hex ?? '#999';

              return (
                <tr key={e.id}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => onToggleEdge?.(Number(e.id))}
                      aria-label={`Select edge ${a} to ${b}`}
                    />
                  </td>

                  {showLineInfo && (
                    <td>
                      <Badge bg="light" text="dark" style={{ border: `2px solid ${color}` }}>
                        {lineLabel(line) || e.line_id}
                      </Badge>
                    </td>
                  )}

                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {a} - {b}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </div>
  );
}
