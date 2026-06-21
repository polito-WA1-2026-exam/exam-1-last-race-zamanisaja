const API_BASE = 'http://localhost:3001';

// All requests include credentials (session cookie)
async function request(method, path, body) {
  const options = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) options.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, options);

  if (res.status === 204) return null;

  const data = await res.json();

  if (!res.ok) throw new Error(data.error ?? 'Request failed');

  return data;
}

export const API = {
  // Auth
  login:      (email, password) => request('POST',   '/api/sessions', { email, password }),
  logout:     ()                => request('DELETE',  '/api/sessions/current'),
  getSession: ()                => request('GET',     '/api/sessions/current'),

  // Registration (auto-login server-side)
  register:   (name, email, password) => request('POST', '/api/users', { name, email, password }),

  // Metro
  getMetroGraph: () => request('GET', '/api/metro/graph'),
  listMetroEdges: (line_id) => {
    const qs = line_id ? `?line_id=${encodeURIComponent(line_id)}` : '';
    return request('GET', `/api/metro/edges${qs}`);
  },

  // Events
  listEvents: () => request('GET', '/api/events'),

  // Games
  createGame: ({ score }) => request('POST', '/api/games', { score }),
  listGames: (limit) => {
    const qs = limit ? `?limit=${encodeURIComponent(limit)}` : '';
    return request('GET', `/api/games${qs}`);
  },
  getGamesSummary: () => request('GET', '/api/games/summary'),
  getLeaderboard: () => request('GET', `/api/games/leaderboard`),
};
