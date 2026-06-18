import { useEffect, useState } from 'react';
import { Container, Spinner, Form, Button, Alert, Table } from 'react-bootstrap';
import AppNavbar from './components/AppNavbar.jsx';
import LoginForm from './components/LoginForm.jsx';
import RegisterForm from './components/RegisterForm.jsx';
import { API } from './api.js';

export default function App() {
  const [user, setUser]              = useState(null);    // null = not logged in
  const [authView, setAuthView]      = useState('none');  // 'none' | 'login' | 'register'
  const [checking, setChecking]      = useState(true);    // true while restoring session

  const [numValue, setNumValue]      = useState('');
  const [submitError, setSubmitError] = useState('');
  const [records, setRecords]         = useState([]);

  // On mount, check whether a session already exists (e.g. after hot-reload)
  useEffect(() => {
    API.getSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    if (!user) {
      setRecords([]);
      return;
    }
    API.listRecords()
      .then(setRecords)
      .catch(() => setRecords([]));
  }, [user]);

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
        onLogout={handleLogout}
        onShowLogin={() => setAuthView('login')}
        onShowRegister={() => setAuthView('register')}
      />

      <Container className="py-5">
        {!user && authView === 'login' ? (
          <LoginForm onLogin={handleLogin} />
        ) : !user && authView === 'register' ? (
          <RegisterForm onRegister={handleRegister} />
        ) : (
          <div className="text-center mt-5">
            <h1>Welcome to my page!</h1>
            {user && (
              <p className="text-muted mt-2">
                You are logged in as <strong>{user.name}</strong>.
              </p>
            )}
          </div>
        )}
      </Container>
    </>
  );
}
