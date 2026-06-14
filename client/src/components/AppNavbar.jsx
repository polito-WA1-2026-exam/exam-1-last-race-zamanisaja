import { Navbar, Nav, Container, Button } from 'react-bootstrap';

export default function AppNavbar({ user, onLogout, onShowLogin }) {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand href="#">My App</Navbar.Brand>

        <Nav className="ms-auto align-items-center">
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
            <Button variant="outline-light" size="sm" onClick={onShowLogin}>
              Login
            </Button>
          )}
        </Nav>
      </Container>
    </Navbar>
  );
}
