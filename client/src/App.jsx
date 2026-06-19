import { useEffect, useState } from 'react';
import { Container, Spinner, Form, Button, Alert, Table } from 'react-bootstrap';
import AppNavbar from './components/AppNavbar.jsx';
import LoginForm from './components/LoginForm.jsx';
import RegisterForm from './components/RegisterForm.jsx';
import TehranMetroMap from './components/TehranMetroMap.jsx';
import MetroEdgesTable from './components/MetroEdgesTable.jsx';
import { API } from './api.js';

export default function App() {
  const [user, setUser]              = useState(null);    // null = not logged in
  const [authView, setAuthView]      = useState('none');  // 'none' | 'login' | 'register'
  const [checking, setChecking]      = useState(true);    // true while restoring session

  const [numValue, setNumValue]      = useState('');
  const [submitError, setSubmitError] = useState('');
  const [records, setRecords]         = useState([]);
  const [recordsSummary, setRecordsSummary] = useState({ highScore: null, globalHighScore: null });
  const [metroGraph, setMetroGraph] = useState(null);
  const [metroError, setMetroError] = useState('');
  const [selectedEdgeIds, setSelectedEdgeIds] = useState([]);

  function toggleEdge(edgeId) {
    setSelectedEdgeIds((prev) => {
      const s = new Set(prev);
      if (s.has(edgeId)) s.delete(edgeId);
      else s.add(edgeId);
      return Array.from(s);
    });
  }

  // On mount, check whether a session already exists (e.g. after hot-reload)
  useEffect(() => {
    API.getSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  // Load records & summary for the current browser identity (guest) and refresh when user logs in/out
  useEffect(() => {
    API.listRecords()
      .then(setRecords)
      .catch(() => setRecords([]));

    API.getRecordsSummary()
      .then(setRecordsSummary)
      .catch(() => setRecordsSummary({ highScore: null, globalHighScore: null }));
  }, [user]);

  // Load metro graph once (or you can re-load when user changes; not needed here)
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
    // server auto-logs in, so we can treat it as a normal login
    setUser(registeredUser);
    setAuthView('none');
  }

  async function handleSubmitNumber(e) {
    e.preventDefault();
    setSubmitError('');
    try {
      const created = await API.createRecord(numValue);
      setRecords((old) => [created, ...old]);
      setNumValue('');
      API.getRecordsSummary().then(setRecordsSummary).catch(() => {});
    } catch (err) {
      setSubmitError(err.message);
    }
  }

  async function handleLogout() {
    try {
      await API.logout();
    } finally {
      setUser(null);
      setRecords([]);
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

      <Container className="py-5">
        <div className="text-center mt-4">
          <h1>Welcome to my page!</h1>
          {user ? (
            <p className="text-muted mt-2">
              You are logged in as <strong>{user.name}</strong>.
            </p>
          ) : (
            <p className="text-muted mt-2">
              You are browsing as <strong>Guest</strong>.
            </p>
          )}
        </div>
        <div className="mx-auto mt-5" style={{ maxWidth: 1200 }}>
          <h5 className="mb-3">Tehran Metro (game board)</h5>

          {metroError && <Alert variant="danger">{metroError}</Alert>}

          {!metroGraph ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: 280 }}>
              <Spinner animation="border" />
            </div>
          ) : (
            <div className="d-grid"
              style={{
                gridTemplateColumns: '0.4fr 1.3fr', // map smaller, table wider
                gap: 16,
                alignItems: 'start',
              }}
          >
              <div>
                <TehranMetroMap graph={metroGraph} highlightEdgeIds={selectedEdgeIds} />
              </div>

              <div>
                <div className="d-flex justify-content-between align-items-baseline mb-2">
                  <div className="text-muted">Edges</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>
                    selected: <strong>{selectedEdgeIds.length}</strong>
                  </div>
                </div>

                <MetroEdgesTable
                  graph={metroGraph}
                  selectedEdgeIds={selectedEdgeIds}
                  onToggleEdge={toggleEdge}
                />
              </div>
            </div>
          )}
        </div>
        <div className="mx-auto mt-5" style={{ maxWidth: 720 }}>
          <h5 className="mb-3">Submit a number</h5>
          {submitError && <Alert variant="danger">{submitError}</Alert>}

          <Form onSubmit={handleSubmitNumber} className="d-flex gap-2">
            <Form.Control
              type="number"
              value={numValue}
              onChange={(e) => setNumValue(e.target.value)}
              placeholder="Enter a number"
              step="any"
              required
            />
            <Button type="submit" variant="primary">Save</Button>
          </Form>

          <h6 className="mt-4">Your submissions</h6>
          <Table striped bordered hover size="sm" className="mt-2">
            <thead>
              <tr>
                <th>#</th>
                <th>Value</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={3} className="text-muted">No records yet.</td></tr>
              ) : (
                records.map(r => (
                  <tr key={r.record_id}>
                    <td>{r.record_id}</td>
                    <td>{r.value}</td>
                    <td>{r.ts}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        {!user && authView === 'login' ? (
          <LoginForm onLogin={handleLogin} />
        ) : !user && authView === 'register' ? (
          <RegisterForm onRegister={handleRegister} />
        ) : null}
      </Container>
    </>
  );
}
