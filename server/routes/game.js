'use strict';

const express = require('express');
const crypto  = require('crypto');
const { createGame, listGamesByOwner, getHighGameScoreByOwner, getGlobalHighGameScore, getTopScores } = require('../db');
const { isLoggedIn } = require('./auth');

const router = express.Router();

router.post('/games', isLoggedIn, (req, res) => {
  const owner_id = req.user.user_id;
  const { score } = req.body ?? {};

    const num = Number(score);
    if (!Number.isFinite(num)) {
      return res.status(422).json({ error: 'Score must be a finite number.' });
    }

    const intScore = Math.trunc(num);
    const game_id = crypto.randomUUID();

    try {
      createGame({ game_id, owner_id, score: intScore });
      return res.status(201).json({ game_id, owner_id, score: intScore });
    } catch (err) {
      console.error('[games] save failed', err);
      return res.status(500).json({ error: 'Could not save game.' });
    }
  });

  router.get('/games', isLoggedIn, (req, res) => {
    const owner_id = req.user.user_id;
    const limit = req.query.limit ? Math.max(1, Math.min(200, Number(req.query.limit))) : 50;

    try {
      const rows = listGamesByOwner(owner_id, { limit });
      return res.json(rows);
    } catch (err) {
      console.error('[games] list failed', err);
      return res.status(500).json({ error: 'Could not list games.' });
    }
  });

  router.get('/games/summary', isLoggedIn, (req, res) => {
    const owner_id = req.user.user_id;

    try {
        const highScore = getHighGameScoreByOwner(owner_id);
        const globalHighScore = getGlobalHighGameScore();
        return res.json({ highScore, globalHighScore });
    } catch (err) {
        console.error('[games] summary failed', err);
        return res.status(500).json({ error: 'Could not load game summary.' });
    }
  });

  router.get('/games/leaderboard', isLoggedIn, (req, res) => {
    try {
      const rows = getTopScores(3);
      return res.json(rows);
    } catch (err) {
      console.error('[games] leaderboard failed', err);
      return res.status(500).json({ error: 'Could not load leaderboard.' });
    }
  });

module.exports = router;