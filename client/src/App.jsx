import { useEffect, useState } from 'react';
import { Container, Spinner, Alert } from 'react-bootstrap';
import AppNavbar from './components/AppNavbar.jsx';
import LoginForm from './components/LoginForm.jsx';
import RegisterForm from './components/RegisterForm.jsx';
import TehranMetroMap from './components/TehranMetroMap.jsx';
import MetroEdgesTable from './components/MetroEdgesTable.jsx';
import { API } from './api.js';

export default function App() {
  const [user, setUser] = useState(null); // null = not logged in
  const [authView, setAuthView] = useState('none'); // 'none' | 'login' | 'register'
  const [checking, setChecking] = useState(true); // true while restoring session

  const [recordsSummary, setRecordsSummary] = useState({ highScore: null, globalHighScore: null });

  const [metroGraph, setMetroGraph] = useState(null);
  const [metroError, setMetroError] = useState('');

  const [selectedEdgeIds, setSelectedEdgeIds] = useState([]);

  // Phase: false = map-only (full width), true = split view (map + edges)
  const [ready, setReady] = useState(false);

  function toggleEdge(edgeId) {
    setSelectedEdgeIds((prev) => {
      const s = new Set(prev);
      if (s.has(edgeId)) s.delete(edgeId);
      else s.add(edgeId);
      return Array.from(s);
    });
  }

  // Session restore
  useEffect(() => {
    API.getSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  // Keep navbar summary working
  useEffect(() => {
    API.getRecordsSummary()
      .then(setRecordsSummary)
      .catch(() => setRecordsSummary({ highScore: null, globalHighScore: null }));
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

  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
    setAuthView('none');
  }

  function handleRegister(registeredUser) {
    setUser(registeredUser);
    setAuthView('none');
  }

  async function handleLogout() {
    try {
      await API.logout();
    } finally {
      setUser(null);
      setSelectedEdgeIds([]);
      setReady(false);
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
        user={user}
        summary={recordsSummary}
        onLogout={handleLogout}
        onShowLogin={() => setAuthView('login')}
        onShowRegister={() => setAuthView('register')}
      />

      <Container fluid className="py-4">
        <div style={{ padding: '0 16px' }}>
          <div className="d-flex justify-content-between align-items-baseline flex-wrap gap-2 mt-2">
            <div>
              <h1 className="h3 mb-1">Tehran Metro (game board)</h1>
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
            </div>

            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div className="text-muted" style={{ fontSize: 12 }}>
                selected edges: <strong>{selectedEdgeIds.length}</strong>
              </div>

              <button
                type="button"
                className={ready ? 'btn btn-sm btn-outline-secondary' : 'btn btn-sm btn-success'}
                onClick={() => setReady((r) => !r)}
                disabled={!metroGraph}
                title={ready ? 'Hide edge selection' : 'Start selecting edges'}
              >
                {ready ? 'Hide edges' : 'Ready'}
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
                  gridTemplateColumns: ready ? '1fr 1fr' : '1fr', // full-width map until Ready
                  gap: 16,
                  height: '75vh',
                  minHeight: 560,
                  alignItems: 'stretch',
                }}
              >
                {/* Map (always visible) */}
                <div style={{ height: '100%', overflow: 'auto', minWidth: 0 }}>
                  <TehranMetroMap graph={metroGraph} highlightEdgeIds={selectedEdgeIds} />
                </div>

                {/* Edge selection (only when ready) */}
                {ready && (
                  <div style={{ height: '100%', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <div className="d-flex justify-content-between align-items-baseline mb-2">
                      <div className="text-muted">Edges</div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setSelectedEdgeIds([])}
                        disabled={selectedEdgeIds.length === 0}
                      >
                        Clear
                      </button>
                    </div>

                    <div style={{ flex: 1, minHeight: 0 }}>
                      <MetroEdgesTable
                        graph={metroGraph}
                        selectedEdgeIds={selectedEdgeIds}
                        onToggleEdge={toggleEdge}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {!user && authView === 'login' ? (
            <LoginForm onLogin={handleLogin} />
          ) : !user && authView === 'register' ? (
            <RegisterForm onRegister={handleRegister} />
          ) : null}
        </div>
      </Container>
    </>
  );
}
