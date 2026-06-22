'use strict';

const express = require('express');
const crypto  = require('crypto');
const { createGame, listGamesByUser, getHighGameScoreByUser, getGlobalHighGameScore, getTopScores } = require('../db');
const { isLoggedIn } = require('./auth');

const router = express.Router();

router.post('/games', isLoggedIn, (req, res) => {
  const user_id = req.user.user_id;
  const { startStationId, destinationStationId, selectedEdgeIds } = req.body ?? {};

  if (
    typeof startStationId       !== 'string' ||
    typeof destinationStationId !== 'string' ||
    !Array.isArray(selectedEdgeIds)
  ) {
    return res.status(422).json({
      error: 'Required: startStationId (string), destinationStationId (string), selectedEdgeIds (array).',
    });
  }

  if (startStationId.trim() === '' || destinationStationId.trim() === '') {
    return res.status(422).json({ error: 'startStationId and destinationStationId must not be empty.' });
  }

  if (selectedEdgeIds.length > 200) {
    return res.status(422).json({ error: 'selectedEdgeIds may not contain more than 200 items.' });
  }

  if (selectedEdgeIds.some((id) => typeof id !== 'number' && typeof id !== 'string')) {
    return res.status(422).json({ error: 'Each item in selectedEdgeIds must be a number or string.' });
  }

  const graph  = getMetroGraph();
  const result = validateRoute(graph, selectedEdgeIds, startStationId, destinationStationId);

  let finalScore      = 0;
  let triggeredEvents = [];

  if (result.ok) {
    const events = listEvents({ activeOnly: true });
    ({ finalScore, triggeredEvents } = scoreRoute(result.routeEdgeIds, events));
  }

  const game_id = crypto.randomUUID();

    try {
      createGame({ game_id, user_id, score: intScore });
      return res.status(201).json({ game_id, user_id, score: intScore });
    } catch (err) {
      console.error('[games] save failed', err);
      return res.status(500).json({ error: 'Could not save game.' });
    }
  });

  router.get('/games', isLoggedIn, (req, res) => {
    const user_id = req.user.user_id;
    const limit = req.query.limit ? Math.max(1, Math.min(200, Number(req.query.limit))) : 50;

    try {
      const rows = listGamesByUser(user_id, { limit });
      return res.json(rows);
    } catch (err) {
      console.error('[games] list failed', err);
      return res.status(500).json({ error: 'Could not list games.' });
    }
  });

  router.get('/games/summary', isLoggedIn, (req, res) => {
    const user_id = req.user.user_id;

    try {
        const highScore = getHighGameScoreByUser(user_id);
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