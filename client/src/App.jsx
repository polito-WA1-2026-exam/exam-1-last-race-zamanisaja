import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { Container, Spinner, Alert } from 'react-bootstrap';
import AppNavbar from './components/AppNavbar.jsx';
import PlayHud from './components/PlayHud.jsx';
import TehranMetroMap from './components/TehranMetroMap.jsx';
import MetroEdgesTable from './components/MetroEdgesTable.jsx';
import { pickRandomStations, getStationLabel, validateRoute, simulateEdgeEventsAndScore } from './components/utils.js';
import { API } from './api.js';
import { DEFAULT_TIMER } from './config.js';

export default function App() {
  const [user, setUser] = useState(null); // null = not logged in
  const [checking, setChecking] = useState(true); // true while restoring session

  // Prevent double-submit (can happen in React StrictMode / racing timer)
  const validatingRef = useRef(false);

  const [gamesSummary, setGamesSummary] = useState({ highScore: null, globalHighScore: null });

  const [metroGraph, setMetroGraph] = useState(null);
  const [metroError, setMetroError] = useState('');
  
  const [events, setEvents] = useState([]);
  
  const [selectedEdgeIds, setSelectedEdgeIds] = useState([]);     // live selection (play)
  const [submittedEdgeIds, setSubmittedEdgeIds] = useState([]);   // frozen selection (validation)

  // 'normal' | 'play' | 'validation'
  const [mode, setMode] = useState('normal');

  const [lang, setLang] = useState('fa');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIMER);

  const [startStation, setStartStation] = useState(null);
  const [destinationStation, setDestinationStation] = useState(null);

  const [validationResult, setValidationResult] = useState(null);

  const [score, setScore] = useState(null); // null until validation happens

  const [navbarHeight, setNavbarHeight] = useState(0); // for sticky HUD positioning

  const showSplit = mode === 'play'; // restore 50/50 only in play mode

  const highlightedNodeIds = useMemo(
    () => [startStation?.id, destinationStation?.id].filter(Boolean),
    [startStation, destinationStation]
  );

  // Map should see submitted edges in validation, live edges in play (normal shows all anyway)
  const visibleEdgeIds = mode === 'validation' ? submittedEdgeIds : selectedEdgeIds;

  function toggleEdge(edgeId) {
    if (mode !== 'play') return;

    setSelectedEdgeIds((prev) => {
      const s = new Set(prev);
      if (s.has(edgeId)) s.delete(edgeId);
      else s.add(edgeId);
      return Array.from(s);
    });
  }

  function startRound() {
    if (!metroGraph) return;

    // set the score to null at the start of a new round (before validation)
    setScore(null);

    const pair = pickRandomStations(metroGraph, 3);
    if (!pair) {
      setMetroError('Could not find two stations at least 3 stations apart.');
      return;
    }

    setMetroError('');
    setValidationResult(null);

    setSelectedEdgeIds([]);
    setSubmittedEdgeIds([]);

    setStartStation(pair.start);
    setDestinationStation(pair.destination);

    setTimeLeft(DEFAULT_TIMER);
    setMode('play');
  }

  function enterNormalMode() {
    setMode('normal');
    setTimeLeft(DEFAULT_TIMER);

    setSelectedEdgeIds([]);
    setSubmittedEdgeIds([]);

    setStartStation(null);
    setDestinationStation(null);

    setValidationResult(null);
    setMetroError('');
    setScore(null);
  }

  const enterValidateMode = useCallback(() => {
    if (!metroGraph) return;

    // Guard: can be triggered by timer + click, or dev StrictMode quirks
    if (validatingRef.current) return;
    validatingRef.current = true;

    const snapshot = [...selectedEdgeIds];

    setSubmittedEdgeIds(snapshot);
    setSelectedEdgeIds([]);

    const result = validateRoute(metroGraph, snapshot, startStation?.id, destinationStation?.id);
    setValidationResult(result);

    let finalScore = 0;

    if (result.ok) {
      if (!events.length) {
        finalScore = 20;
      } else {
        ({ finalScore } = simulateEdgeEventsAndScore(snapshot, events, 20));
      }
    }

    setScore(finalScore);

    // Save game score (for both valid and invalid routes)
    API.createGame({ score: finalScore })
      .then((r) => {
        // Refresh navbar summary so it updates immediately
        return API.getGamesSummary();
      })
      .then(setGamesSummary)
      .catch((e) => console.error('[client] submit/refresh failed', e));

    setMode('validation');
  }, [metroGraph, selectedEdgeIds, startStation?.id, destinationStation?.id, events]);

  // Release the guard when we leave validation mode (i.e., start a new round / go back)
  useEffect(() => {
    if (mode !== 'play') validatingRef.current = false;
  }, [mode]);


  // Session restore
  useEffect(() => {
    API.getSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  // Navbar summary
  useEffect(() => {
    API.getGamesSummary()
      .then(setGamesSummary)
      .catch(() => setGamesSummary({ highScore: null, globalHighScore: null }));
  }, [user]);

  // Load metro graph
  useEffect(() => {
    setMetroError('');
    API.getMetroGraph()
      .then(setMetroGraph)
      .catch((err) => {
        setMetroGraph(null);
        setMetroError(err.message || 'Failed to load metro graph');
      });
  }, []);

  // Measure navbar height for sticky HUD positioning
  useEffect(() => {
    const el = document.getElementById('app-navbar');
    if (!el) return;

    const update = () => setNavbarHeight(el.getBoundingClientRect().height || 0);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);

    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  // Load events
  useEffect(() => {
    API.listEvents()
      .then(setEvents)
      .catch(() => setEvents([]));
  }, []);

  // Countdown: only in play mode; at 0 -> auto validation
  useEffect(() => {
    if (mode !== 'play') return;

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          // Auto-validate when time expires
          enterValidateMode();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [mode, enterValidateMode]);

  async function handleLogout() {
    try {
      await API.logout();
    } finally {
      setUser(null);
      enterNormalMode();
    }
  }

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
        title: 'Validate your route',
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
        summary={gamesSummary}
        onLogout={handleLogout}
        onLogin={setUser}
        onRegister={setUser}
        lang={lang}
        onToggleLang={() => setLang((l) => (l === 'en' ? 'fa' : 'en'))}
      />

      <PlayHud
        mode={mode}
        lang={lang}
        navbarHeight={navbarHeight}
        startStation={startStation}
        destinationStation={destinationStation}
        timeLeft={timeLeft}
        visibleEdgeCount={visibleEdgeIds.length}
        primaryButton={primaryButton}
        validationResult={validationResult}
        score={score}
        getStationLabel={getStationLabel}
      />

      <Container fluid className="py-4">
        <div style={{ padding: '0 16px' }}>
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
                  gridTemplateColumns: showSplit ? '1fr 1fr' : '1fr',
                  gap: 16,
                  height: '75vh',
                  minHeight: 560,
                  alignItems: 'stretch',
                }}
              >
                {/* Map */}
                <div style={{ height: '100%', overflow: 'auto', minWidth: 0 }}>
                  <TehranMetroMap
                    graph={metroGraph}
                    mode={mode}
                    lang={lang}
                    highlightedNodeIds={highlightedNodeIds}
                    selectedEdgeIds={visibleEdgeIds}
                  />
                </div>

                {/* Right panel ONLY in play mode (50/50 restored) */}
                {showSplit && (
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
                    <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                      <MetroEdgesTable
                        graph={metroGraph}
                        selectedEdgeIds={selectedEdgeIds}
                        onToggleEdge={toggleEdge}
                        onClearAll={() => setSelectedEdgeIds([])}
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
