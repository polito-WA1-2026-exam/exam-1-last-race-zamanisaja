import { useEffect, useMemo, useRef, useState } from 'react';
import { Container, Spinner, Alert } from 'react-bootstrap';
import AppNavbar from './components/AppNavbar.jsx';
import PlayHud from './components/PlayHud.jsx';
import TehranMetroMap from './components/TehranMetroMap.jsx';
import MetroEdgesTable from './components/MetroEdgesTable.jsx';
import GameInstructions from './components/GameInstructions.jsx';
import { getStationLabel } from './components/utils.js';
import { API } from './api.js';
import { useGameLogic } from './hooks/useGameLogic.js';

export default function App() {
  const [user, setUser] = useState(null); // null = not logged in
  const [checking, setChecking] = useState(true); // true while restoring session

  const [gamesSummary, setGamesSummary] = useState({ highScore: null, globalHighScore: null });
  const [leaderboard, setLeaderboard] = useState([]);

  const [metroGraph, setMetroGraph] = useState(null);
  const [metroError, setMetroError] = useState('');

  const [lang, setLang] = useState('en'); // 'en' | 'fa'

  const [navbarHeight, setNavbarHeight] = useState(0); // for sticky HUD positioning
  const navbarRef = useRef(null);

  const {
    mode,
    timeLeft,
    startStation,
    destinationStation,
    selectedEdgeIds,
    setSelectedEdgeIds,
    validationResult,
    score,
    roundEvents,
    showSplit,
    visibleEdgeIds,
    toggleEdge,
    startRound,
    enterSetupMode,
    enterValidateMode,
  } = useGameLogic({ user, metroGraph, lang, setMetroError, setGamesSummary, setLeaderboard });

  const highlightedNodeIds = useMemo(
    () => [startStation?.id, destinationStation?.id].filter(Boolean),
    [startStation, destinationStation]
  );

  // Session restore
  useEffect(() => {
    API.getSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  // Navbar summary
  useEffect(() => {
    if (!user) {
      setGamesSummary({ highScore: null, globalHighScore: null });
      return;
    }
    API.getGamesSummary()
      .then(setGamesSummary)
      .catch(() => setGamesSummary({ highScore: null, globalHighScore: null }));
  }, [user]);

  // Leaderboard
  useEffect(() => {
    API.getLeaderboard()
      .then(setLeaderboard)
      .catch(() => setLeaderboard([]));
  }, [user]);

  // Load metro graph
  useEffect(() => {
    if (!user) {
      setMetroGraph(null);
      setMetroError('');
      return;
    }
    setMetroError('');
    API.getMetroGraph()
      .then(setMetroGraph)
      .catch((err) => {
        setMetroGraph(null);
        setMetroError(err.message || 'Failed to load metro graph');
      });
  }, [user]);

  // Measure navbar height for sticky HUD positioning
  useEffect(() => {
    const el = navbarRef.current;
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

  async function handleLogout() {
    try {
      await API.logout();
    } finally {
      setUser(null);
      enterSetupMode();
    }
  }

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
        ref={navbarRef}
        user={user}
        summary={gamesSummary}
        leaderboard={leaderboard}
        onLogout={handleLogout}
        onLogin={setUser}
        onRegister={setUser}
        lang={lang}
        onToggleLang={() => setLang((l) => (l === 'en' ? 'fa' : 'en'))}
        onBrandClick={mode === 'validation' ? enterSetupMode : undefined}
      />

      <PlayHud
        mode={mode}
        lang={lang}
        navbarHeight={navbarHeight}
        startStation={startStation}
        destinationStation={destinationStation}
        timeLeft={timeLeft}
        visibleEdgeCount={visibleEdgeIds.length}
        user={user}
        metroGraph={metroGraph}
        selectedEdgeCount={selectedEdgeIds.length}
        onStartRound={startRound}
        onValidate={enterValidateMode}
        onRestart={enterSetupMode}
        validationResult={validationResult}
        score={score}
        roundEvents={roundEvents}
        getStationLabel={getStationLabel}
      />

      <Container fluid className="py-4">
        <div style={{ padding: '0 16px' }}>
          <div className="mt-3">
            {!user ? (
              /* ── Guests: instructions only, no map ── */
              <GameInstructions lang={lang} />
            ) : (
              /* ── Logged-in users: full game UI ── */
              <>
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
              </>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
