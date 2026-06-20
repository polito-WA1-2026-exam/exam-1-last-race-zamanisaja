import { useState } from 'react';
import { Navbar, Nav, Container, Button, OverlayTrigger, Popover, ButtonGroup } from 'react-bootstrap';
import LoginForm from './LoginForm.jsx';
import RegisterForm from './RegisterForm.jsx';

export default function AppNavbar({
  user,
  summary,
  onLogout,
  onLogin,
  onRegister,
  lang,
  onToggleLang,
}) {
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'

  const authPopover = (
    <Popover id="auth-popover">
      <Popover.Header
        as="div"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div style={{ fontWeight: 600 }}>Account</div>
        <ButtonGroup size="sm">
          <Button
            variant={authTab === 'login' ? 'primary' : 'outline-primary'}
            onClick={() => setAuthTab('login')}
          >
            Login
          </Button>
          <Button
            variant={authTab === 'register' ? 'primary' : 'outline-primary'}
            onClick={() => setAuthTab('register')}
          >
            Register
          </Button>
        </ButtonGroup>
      </Popover.Header>

      <Popover.Body style={{ width: 340 }}>
        {authTab === 'login' ? (
          <LoginForm onLogin={onLogin} compact />
        ) : (
          <RegisterForm onRegister={onRegister} compact />
        )}
      </Popover.Body>
    </Popover>
  );

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
              fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui',
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
            // ✅ Step E: one button that opens the popover
            <OverlayTrigger trigger="click" placement="bottom-end" overlay={authPopover} rootClose>
              <Button variant="outline-light" size="sm">
                Login
              </Button>
            </OverlayTrigger>
          )}
        </Nav>
      </Container>
    </Navbar>
  );
}
