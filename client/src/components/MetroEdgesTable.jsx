import { useEffect, useMemo, useRef } from 'react';
import { Table, Form, Badge } from 'react-bootstrap';
import { GAME_LEVEL } from '../config.js';

/** Controlled checkbox that also supports the indeterminate state via a ref+effect. */
function IndeterminateCheckbox({ checked, indeterminate, onChange, 'aria-label': ariaLabel }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate ?? false;
  }, [indeterminate]);
  return (
    <Form.Check
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
    />
  );
}

// level: 'easy'   – sorted edges, line column visible
//        'medium' – sorted edges, line column hidden
//        'hard'   – shuffled edges, line column hidden
export default function MetroEdgesTable({
  graph,
  selectedEdgeIds,
  onToggleEdge,
  onClearAll,
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
      es.sort((a, b) => Number(a.id) - Number(b.id));
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
            <th style={{ width: 44 }}>
              <IndeterminateCheckbox
                checked={selected.size > 0 && selected.size === edges.length}
                indeterminate={selected.size > 0 && selected.size < edges.length}
                onChange={() => {
                  if (selected.size > 0) onClearAll?.();
                  else edges.forEach((e) => onToggleEdge?.(Number(e.id)));
                }}
                aria-label="Deselect all"
              />
            </th>
            {showLineInfo && <th style={{ width: 64 }}>Line</th>}
            <th>Segment</th>
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
