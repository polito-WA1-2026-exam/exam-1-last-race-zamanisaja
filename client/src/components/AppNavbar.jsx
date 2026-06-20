import { Navbar, Nav, Container, Button } from 'react-bootstrap';

export default function AppNavbar({
  user,
  summary,
  onLogout,
  onShowLogin,
  onShowRegister,
  lang,
  onToggleLang,
}) {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand href="#">My App</Navbar.Brand>

        <Nav className="ms-auto align-items-center">
          <Navbar.Text className="me-3">
            High score: <strong>{summary?.highScore ?? '—'}</strong>
            <span className="ms-2 text-secondary">(Global: {summary?.globalHighScore ?? '—'})</span>
          </Navbar.Text>

          {/* Language toggle: always visible */}
          <Button
            variant="outline-light"
            size="sm"
            onClick={onToggleLang}
            className="me-3"
            style={{
              fontFamily:
                '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui',
              fontSize: 16,
              lineHeight: 1,
            }}
            aria-label="Toggle language"
            title={lang === 'fa' ? 'زبان: فارسی' : 'Language: English'}
          >
            {lang === 'fa' ? '🇮🇷' : 'US'}
          </Button>
          
          {user ? (
            <>
              <Navbar.Text className="me-3">
                Welcome, <strong>{user.name}</strong>!
              </Navbar.Text>
              <Button variant="outline-light" size="sm" onClick={onLogout}>
                Logout
              </Button>
            </>
          ) : (
            <div className="d-flex gap-2">
              <Button variant="outline-light" size="sm" onClick={onShowLogin}>
                Login
              </Button>
              <Button variant="light" size="sm" onClick={onShowRegister}>
                Register
              </Button>
            </div>
          )}
        </Nav>
      </Container>
    </Navbar>
  );
}
