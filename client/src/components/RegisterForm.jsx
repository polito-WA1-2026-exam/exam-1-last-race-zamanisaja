import { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { API } from '../api.js';

export default function RegisterForm({ onRegister, compact }) {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await API.register(name, email, password);
      onRegister(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (compact) return (
    <Form onSubmit={handleSubmit} style={{ width: '100%', boxSizing: 'border-box' }}>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form.Group className="mb-3" controlId="name">
        <Form.Label>Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
          autoFocus
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="email">
        <Form.Label>Email</Form.Label>
        <Form.Control
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </Form.Group>
      <Form.Group className="mb-3" controlId="password">
        <Form.Label>Password</Form.Label>
        <Form.Control
          type="password"
          placeholder="Choose a password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </Form.Group>
      <Button type="submit" variant="success" className="w-100" disabled={loading}>
        {loading ? <Spinner size="sm" animation="border" /> : 'Register'}
      </Button>
    </Form>
  );

  return (
    <div style={{ maxWidth: 420 }} className="mx-auto mt-5 p-4 border rounded shadow-sm bg-white">
      <h4 className="mb-4">Create account</h4>

      {error && <Alert variant="danger">{error}</Alert>}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" controlId="name">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Your name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            autoFocus
          />
        </Form.Group>

        <Form.Group className="mb-3" controlId="email">
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </Form.Group>

        <Form.Group className="mb-4" controlId="password">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Choose a password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </Form.Group>

        <Button type="submit" variant="success" className="w-100" disabled={loading}>
          {loading ? <Spinner size="sm" animation="border" /> : 'Register'}
        </Button>
      </Form>
    </div>
  );
}
