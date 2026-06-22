'use strict';

const express   = require('express');
const passport  = require('passport');
const bcrypt    = require('bcrypt');
const crypto    = require('crypto');
const { getUserByEmail, createUser } = require('../db');

const router = express.Router();

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Not authenticated.' });
}

// POST /api/users  →  register (auto-login)
router.post('/users', async (req, res) => {
  const trimmedName  = (req.body?.name  ?? '').trim();
  const trimmedEmail = (req.body?.email ?? '').trim().toLowerCase();
  const { password } = req.body ?? {};

  if (!trimmedName || !trimmedEmail || !password)
    return res.status(422).json({ error: 'Missing required fields (name, email, password).' });

  if (trimmedName.length < 2 || trimmedName.length > 100)
    return res.status(422).json({ error: 'Name must be between 2 and 100 characters.' });

  if (typeof password !== 'string' || password.length < 6)
    return res.status(422).json({ error: 'Password must be at least 6 characters.' });

  if (password.length > 72)
    return res.status(422).json({ error: 'Password must be 72 characters or fewer.' });

  const { name, email } = { name: trimmedName, email: trimmedEmail };

  if (!/^\S+@\S+\.\S+$/.test(email))
    return res.status(422).json({ error: 'Invalid email format.' });

  if (getUserByEmail(email))
    return res.status(409).json({ error: 'Email already registered.' });

  try {
    const id   = crypto.randomUUID();
    const hash = await bcrypt.hash(password, 10);
    createUser({ id, name, email, hash });

    const user = { user_id: id, name, email };
    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: 'Registration succeeded but login failed.' });
      return res.status(201).json(user);
    });
  } catch (err) {
    if (String(err.message).includes('UNIQUE'))
      return res.status(409).json({ error: 'Email already registered.' });
    console.error(err);
    return res.status(500).json({ error: 'Registration failed.' });
  }
});

// POST /api/sessions  →  login
router.post('/sessions', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err)   return next(err);
    if (!user) return res.status(401).json({ error: info?.message ?? 'Login failed.' });

    req.login(user, (err) => {
      if (err) return next(err);
      return res.json({ user_id: user.user_id, name: user.name, email: user.email });
    });
  })(req, res, next);
});

// GET /api/sessions/current  →  who am I?
router.get('/sessions/current', isLoggedIn, (req, res) => {
  res.json({ user_id: req.user.user_id, name: req.user.name, email: req.user.email });
});

// DELETE /api/sessions/current  →  logout
router.delete('/sessions/current', isLoggedIn, (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed.' });
    res.json({ message: 'Logged out.' });
  });
});

module.exports = router;
module.exports.isLoggedIn = isLoggedIn;