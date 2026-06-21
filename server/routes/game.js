'use strict';

const express = require('express');
const crypto = require('crypto');
const { createGame, listGamesByOwner } = require('../db');

module.exports = function makeGameRouter({ getOwner }) {
  const router = express.Router();

  router.post('/games', (req, res) => {
    const { owner_type, owner_id } = getOwner(req, res);
    const { score } = req.body ?? {};

    const num = Number(score);
    if (!Number.isFinite(num)) {
      return res.status(422).json({ error: 'Score must be a finite number.' });
    }

    const intScore = Math.trunc(num);
    const game_id = crypto.randomUUID();

    try {
      createGame({ game_id, owner_type, owner_id, score: intScore });

      console.log('[games] saved', { game_id, owner_type, owner_id, score: intScore });

      return res.status(201).json({ game_id, owner_type, owner_id, score: intScore });
    } catch (err) {
      console.error('[games] save failed', err);
      return res.status(500).json({ error: 'Could not save game.' });
    }
  });

  router.get('/games', (req, res) => {
    const { owner_type, owner_id } = getOwner(req, res);
    const limit = req.query.limit ? Math.max(1, Math.min(200, Number(req.query.limit))) : 50;

    try {
      const rows = listGamesByOwner(owner_type, owner_id, { limit });
      return res.json(rows);
    } catch (err) {
      console.error('[games] list failed', err);
      return res.status(500).json({ error: 'Could not list games.' });
    }
  });

  return router;
};
