import { useEffect, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import AppNavbar from './components/AppNavbar.jsx';
import LoginForm from './components/LoginForm.jsx';
import { API } from './api.js';

export default function App() {
  const [user, setUser]           = useState(null);    // null = not logged in
  const [showLogin, setShowLogin] = useState(false);
  const [checking, setChecking]   = useState(true);    // true while restoring session

  // On mount, check whether a session already exists (e.g. after hot-reload)
  useEffect(() => {
    API.getSession()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
  }, []);

  function handleLogin(loggedInUser) {
    setUser(loggedInUser);
    setShowLogin(false);
  }

  async function handleLogout() {
    try {
      await API.logout();
    } finally {
      setUser(null);
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
        onShowLogin={() => setShowLogin(true)}
      />

      <Container className="py-5">
        {showLogin && !user ? (
          <LoginForm onLogin={handleLogin} />
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
