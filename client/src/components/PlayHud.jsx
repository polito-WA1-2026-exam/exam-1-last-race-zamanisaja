import { Alert } from 'react-bootstrap';

export default function PlayHud({
  mode,
  lang,
  navbarHeight,
  startStation,
  destinationStation,
  timeLeft,
  visibleEdgeCount,
  primaryButton,
  validationResult,
  score,
  roundEvents,
  getStationLabel,
}) {
  // We also show the HUD in normal mode so the user can hit Ready from the same place.

  const hasStations = !!startStation && !!destinationStation;

  const showTimer = mode === 'play';
  const lowTime = showTimer && timeLeft <= 3;

  return (
    <div
      style={{
        position: 'sticky',
        top: navbarHeight,
        zIndex: 1031, // above sticky navbar (1030-ish), below modals (1050)
        padding: '10px 16px',
      }}
    >
      {/* Main HUD bar */}
      <div
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 14,
          padding: '12px 14px',
          boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
        }}
      >
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <div className="text-muted" style={{ fontSize: 14 }}>
            <div>
              Start: <strong>{hasStations ? getStationLabel(startStation, lang) : '—'}</strong>
            </div>
            <div>
              Destination: <strong>{hasStations ? getStationLabel(destinationStation, lang) : '—'}</strong>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3 flex-wrap">
            <div className="text-muted" style={{ fontSize: 12 }}>
              selected segments: <strong>{mode === 'play' || mode === 'validation' ? visibleEdgeCount : 0}</strong>
            </div>

            <div
              className="text-muted"
              style={{
                fontSize: 12,
                color: lowTime ? '#b02a37' : undefined,
              }}
            >
              time left: <strong>{showTimer ? `${timeLeft}s` : '-'}</strong>
            </div>

            <button
              type="button"
              className={primaryButton.className}
              onClick={primaryButton.onClick}
              disabled={primaryButton.disabled}
              title={primaryButton.title}
            >
              {primaryButton.label}
            </button>
          </div>
        </div>
      </div>

      {/* Validation message (optional, but nice to keep in the HUD zone) */}
      {mode === 'validation' && validationResult && (
        <Alert
          variant={validationResult.ok ? 'success' : 'danger'}
          className="mb-2"
          style={{
            borderRadius: 14,
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
          }}
        >
          <strong>{validationResult.ok ? 'Correct!' : 'Not valid'}</strong>
          <div style={{ fontSize: 13, opacity: 0.9 }}>
            {validationResult.ok ? (
              <>
                <div>Your route is valid. Score: <strong>{score ?? 0}</strong></div>
                {roundEvents && roundEvents.length > 0 && (
                  <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12 }}>
                    {roundEvents.map((ev, i) => (
                      <li key={i} style={{ color: ev.eventScore > 0 ? '#198754' : ev.eventScore < 0 ? '#b02a37' : 'inherit' }}>
                        {lang === 'fa' ? ev.title_fa : ev.title_en}
                        {' '}
                        <strong>({ev.eventScore > 0 ? '+' : ''}{ev.eventScore})</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <>Score: <strong>0</strong> — {validationResult.reason}</>
            )}
          </div>
        </Alert>
      )}

    </div>
  );
}