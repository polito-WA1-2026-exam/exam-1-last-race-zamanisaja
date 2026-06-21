import { OverlayTrigger, Popover, Button } from 'react-bootstrap';

const medals = ['🥇', '🥈', '🥉'];

export default function LeaderboardPopover({ leaderboard, children }) {
  const popover = (
    <Popover id="leaderboard-popover" style={{ maxWidth: 300, width: 300 }}>
      <Popover.Header as="div" style={{ fontWeight: 600 }}>
        🏆 Leaderboard
      </Popover.Header>
      <Popover.Body style={{ padding: '0.5rem 0' }}>
        {leaderboard && leaderboard.length > 0 ? (
          <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {leaderboard.map((entry, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.35rem 1rem',
                  borderBottom: i < leaderboard.length - 1 ? '1px solid #f0f0f0' : 'none',
                }}
              >
                <span style={{ fontSize: 18 }}>{medals[i] ?? `#${i + 1}`}</span>
                <span style={{ flex: 1, margin: '0 0.75rem', fontWeight: 500 }}>
                  {entry.name}
                </span>
                <span style={{ fontWeight: 700, color: '#0d6efd' }}>{entry.score}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div style={{ textAlign: 'center', color: '#888', padding: '0.5rem 1rem' }}>
            No scores yet
          </div>
        )}
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger trigger="click" placement="bottom-end" overlay={popover} rootClose>
      {children}
    </OverlayTrigger>
  );
}
