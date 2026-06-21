import { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { API } from '../api.js';

export default function LoginForm({ onLogin, compact }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await API.login(email, password);
      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (compact) return (
    <Form onSubmit={handleSubmit} style={{ width: '100%', boxSizing: 'border-box' }}>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form.Group className="mb-3" controlId="email">
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="password">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </Form.Group>
      <Button type="submit" variant="primary" className="w-100" disabled={loading}>
        {loading ? <Spinner size="sm" animation="border" /> : 'Login'}
      </Button>
    </Form>
  );

  return (
    <div style={{ maxWidth: 380 }} className="mx-auto mt-5 p-4 border rounded shadow-sm bg-white">
      <h4 className="mb-4">Sign in</h4>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
        </Form.Group>

        <Form.Group className="mb-4" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </Form.Group>

        <Button type="submit" variant="primary" className="w-100" disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : 'Login'}
        </Button>
      </Form>
    </div>
  );
}
