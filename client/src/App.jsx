import { useEffect, useState } from 'react';
import { Container, Spinner, Alert } from 'react-bootstrap';
import AppNavbar from './components/AppNavbar.jsx';
import LoginForm from './components/LoginForm.jsx';
import RegisterForm from './components/RegisterForm.jsx';
import TehranMetroMap from './components/TehranMetroMap.jsx';
import MetroEdgesTable from './components/MetroEdgesTable.jsx';
import { pickRandomStations, getStationLabel } from './components/utils.js';


import { API } from './api.js';

export default function App() {
  const [user, setUser] = useState(null); // null = not logged in
  const [checking, setChecking] = useState(true); // true while restoring session

  const [recordsSummary, setRecordsSummary] = useState({ highScore: null, globalHighScore: null });

  const [metroGraph, setMetroGraph] = useState(null);
  const [metroError, setMetroError] = useState('');

  const [selectedEdgeIds, setSelectedEdgeIds] = useState([]);

  // Layout state: false = map-only, true = split view (map + edges)
  const [ready, setReady] = useState(false);

  // Map mode: 'normal' | 'play' | 'validation'
  const [mode, setMode] = useState('normal');

  const [lang, setLang] = useState('fa'); // 'fa' | 'en'
  const [timeLeft, setTimeLeft] = useState(10);

  const [startStation, setStartStation] = useState(null);
  const [destinationStation, setDestinationStation] = useState(null);

  function toggleEdge(edgeId) {
    setSelectedEdgeIds((prev) => {
      const s = new Set(prev);
      if (s.has(edgeId)) s.delete(edgeId);
      else s.add(edgeId);
      return Array.from(s);
    });
  }

  function startRound() {
    if (!metroGraph) return;

    const pair = pickRandomStations(metroGraph, 3);
    if (!pair) {
      setMetroError('Could not find two stations at least 3 stops apart.');
      return;
    }

    setMetroError('');
    setSelectedEdgeIds([]);
    setStartStation(pair.start);
    setDestinationStation(pair.destination);
    setTimeLeft(10);
    setReady(true);
    setMode('play');
  }

  function enterNormalMode() {
    setReady(false);
    setSelectedEdgeIds([]);
    setStartStation(null);
    setDestinationStation(null);
    setMode('normal');
  }

  function enterValidateMode() {
    setReady(false);
    setMode('validation');
  }

  function backToPlayMode() {
    if (!ready) return;
    setMode('play');
  }

  useEffect(() => {
    API.getSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    API.getRecordsSummary()
      .then(setRecordsSummary)
      .catch(() => setRecordsSummary({ highScore: null, globalHighScore: null }));
  }, [user]);

  useEffect(() => {
    setMetroError('');
    API.getMetroGraph()
      .then(setMetroGraph)
      .catch((err) => {
        setMetroGraph(null);
        setMetroError(err.message || 'Failed to load metro graph');
      });
  }, []);

  // Countdown runs only in play mode
  useEffect(() => {
    if (!ready || mode !== 'play') return;

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          setMode('validation');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [ready, mode]);

  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
  }

  function handleRegister(registeredUser) {
    setUser(registeredUser);
  }

  async function handleLogout() {
    try {
      await API.logout();
    } finally {
      setUser(null);
      enterNormalMode();
    }
  }

  const highlightedNodeIds = [startStation?.id, destinationStation?.id].filter(Boolean);

  const primaryButton = (() => {
    if (!metroGraph) {
      return {
        label: 'Ready',
        className: 'btn btn-sm btn-success',
        onClick: startRound,
        disabled: true,
        title: 'Metro graph not loaded yet',
      };
    }

    if (mode === 'normal') {
      return {
        label: 'Ready',
        className: 'btn btn-sm btn-success',
        onClick: startRound,
        disabled: false,
        title: 'Start selecting edges',
      };
    }

    if (mode === 'play') {
      return {
        label: 'Validate',
        className: 'btn btn-sm btn-primary',
        onClick: enterValidateMode,
        disabled: selectedEdgeIds.length === 0,
        title: 'Show only the selected edges on the map',
      };
    }

    return {
      label: 'Restart',
      className: 'btn btn-sm btn-outline-secondary',
      onClick: enterNormalMode,
      disabled: false,
      title: 'End this round and return to the full map',
    };
  })();

  if (checking) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <>
      <AppNavbar
        user={user}
        summary={recordsSummary}
        onLogout={handleLogout}
        onLogin={handleLogin}
        onRegister={handleRegister}
        lang={lang}
        onToggleLang={() => setLang((l) => (l === 'en' ? 'fa' : 'en'))}
      />

      <Container fluid className="py-4">
        <div style={{ padding: '0 16px' }}>
          <div className="d-flex justify-content-between align-items-baseline flex-wrap gap-2 mt-2">
            <div>
              <h1 className="h3 mb-1">Tehran Metro</h1>
              <div className="text-muted">
                {user ? (
                  <>
                    Logged in as <strong>{user.name}</strong>
                  </>
                ) : (
                  <>
                    Browsing as <strong>Guest</strong>
                  </>
                )}
              </div>

              <div className="text-muted mt-2" style={{ fontSize: 14 }}>
                <div>
                  Start: <strong>{getStationLabel(startStation)}</strong>
                </div>
                <div>
                  Destination: <strong>{getStationLabel(destinationStation)}</strong>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div className="text-muted" style={{ fontSize: 12 }}>
                selected edges: <strong>{selectedEdgeIds.length}</strong>
              </div>

              <div className="text-muted" style={{ fontSize: 12 }}>
                time left: <strong>{mode === 'play' ? `${timeLeft}s` : '-'}</strong>
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

          <div className="mt-3">
            {metroError && <Alert variant="danger">{metroError}</Alert>}

            {!metroGraph ? (
              <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh', minHeight: 520 }}>
                <Spinner animation="border" />
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: ready ? '1fr 1fr' : '1fr',
                  gap: 16,
                  height: '75vh',
                  minHeight: 560,
                  alignItems: 'stretch',
                }}
              >
                <div style={{ height: '100%', overflow: 'auto', minWidth: 0 }}>
                  <TehranMetroMap
                    graph={metroGraph}
                    mode={mode}
                    lang={lang}
                    highlightedNodeIds={highlightedNodeIds}
                    selectedEdgeIds={selectedEdgeIds}
                  />
                </div>

                {ready && (
                  <div
                    style={{
                      height: '100%',
                      minWidth: 0,
                      overflow: 'hidden',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: 12,
                      background: '#fff',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid rgba(0,0,0,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                        background: '#fff',
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                        {mode === 'validation' ? 'Selected edges' : 'Edges'}
                      </div>

                      <div className="d-flex gap-2">
                        {mode === 'validation' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={backToPlayMode}
                          >
                            Back to play
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setSelectedEdgeIds([])}
                          disabled={selectedEdgeIds.length === 0}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                      <MetroEdgesTable
                        graph={metroGraph}
                        selectedEdgeIds={selectedEdgeIds}
                        onToggleEdge={toggleEdge}
                        lang={lang}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
