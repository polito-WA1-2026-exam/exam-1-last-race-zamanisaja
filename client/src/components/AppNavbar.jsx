import { forwardRef, useState } from 'react';
import { Navbar, Nav, Container, Button, OverlayTrigger, Popover, ButtonGroup } from 'react-bootstrap';
import LoginForm from './LoginForm.jsx';
import RegisterForm from './RegisterForm.jsx';
import LeaderboardPopover from './LeaderboardPopover.jsx';
import './AuthPopover.css';

const AppNavbar = forwardRef(function AppNavbar({
  user,
  summary,
  leaderboard,
  onLogout,
  onLogin,
  onRegister,
  lang,
  onToggleLang,
  onBrandClick,
}, ref) {
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'

  const authPopover = (
    <Popover id="auth-popover" style={{ maxWidth: 360, width: 360 }}>
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

      <Popover.Body style={{ overflowX: 'hidden' }}>
        {authTab === 'login' ? (
          <LoginForm onLogin={onLogin} compact />
        ) : (
          <RegisterForm onRegister={onRegister} compact />
        )}
      </Popover.Body>
    </Popover>
  );

  return (
    <Navbar ref={ref} bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand
          onClick={onBrandClick}
          style={{ cursor: 'pointer' }}
        >
          {lang === 'fa' ? 'مترو تهران' : 'Tehran Metro'}
        </Navbar.Brand>

        <Nav className="ms-auto align-items-center">
          <Navbar.Text className="me-3">
            {lang === 'fa' ? 'بهترین امتیاز:' : 'High score:'} <strong>{summary?.highScore ?? '—'}</strong>
            <span className="ms-2"> </span>
            <LeaderboardPopover leaderboard={leaderboard}>
              <span
                className="ms-2 text"
                style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
                title="View leaderboard"
              >
                {lang === 'fa' ? 'جهانی:' : 'Global:'} {summary?.globalHighScore ?? '—'}
              </span>
            </LeaderboardPopover>
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
        <>
          <Navbar.Text className="me-3">
            {lang === 'fa' ? 'خوش آمدید' : 'Welcome'} <strong>{user ? user.name : ''}</strong>!
          </Navbar.Text>

          {user ? (
            <Button variant="outline-light" size="sm" onClick={onLogout}>
              {lang === 'fa' ? 'خروج' : 'Logout'}
            </Button>
          ) : (
            <OverlayTrigger trigger="click" placement="bottom-end" overlay={authPopover} rootClose>
              <Button variant="outline-light" size="sm">
                Login
              </Button>
            </OverlayTrigger>
          )}
        </>
        </Nav>
      </Container>
    </Navbar>
  );
});

export default AppNavbar;
