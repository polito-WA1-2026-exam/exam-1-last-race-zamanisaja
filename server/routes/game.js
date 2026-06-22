'use strict';

const express  = require('express');
const crypto   = require('crypto');
const {
  createGame, listGamesByUser, getHighGameScoreByUser,
  getGlobalHighGameScore, getTopScores, getMetroGraph, listEvents,
} = require('../db');
const { isLoggedIn }                = require('./auth');
const { validateRoute, scoreRoute } = require('../utils');

const router = express.Router();

// POST /api/games
// Body: { startStationId, destinationStationId, selectedEdgeIds }
// Server validates the route and computes the score — the client never touches scoring logic.
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
    const events = listEvents();
    ({ finalScore, triggeredEvents } = scoreRoute(result.routeEdgeIds, events));
  }

  const game_id = crypto.randomUUID();

  try {
    createGame({ game_id, user_id, score: finalScore });
    return res.status(201).json({
      game_id,
      score:          finalScore,
      valid:          result.ok,
      reasonCode:     result.reasonCode,
      triggeredEvents,              // event scores only revealed here, after the round ends
    });
  } catch (err) {
    console.error('[games] save failed', err);
    return res.status(500).json({ error: 'Could not save game.' });
  }
});

router.get('/games', isLoggedIn, (req, res) => {
  const user_id = req.user.user_id;
  const limit   = req.query.limit ? Math.max(1, Math.min(200, Number(req.query.limit))) : 50;
  try {
    return res.json(listGamesByUser(user_id, { limit }));
  } catch (err) {
    console.error('[games] list failed', err);
    return res.status(500).json({ error: 'Could not list games.' });
  }
});

router.get('/games/summary', isLoggedIn, (req, res) => {
  const user_id = req.user.user_id;
  try {
    return res.json({
      highScore:       getHighGameScoreByUser(user_id),
      globalHighScore: getGlobalHighGameScore(),
    });
  } catch (err) {
    console.error('[games] summary failed', err);
    return res.status(500).json({ error: 'Could not load game summary.' });
  }
});

router.get('/games/leaderboard', isLoggedIn, (req, res) => {
  try {
    return res.json(getTopScores(3));
  } catch (err) {
    console.error('[games] leaderboard failed', err);
    return res.status(500).json({ error: 'Could not load leaderboard.' });
  }
});

module.exports = router;