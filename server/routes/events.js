'use strict';

const express = require('express');
const { isLoggedIn } = require('./auth');
const { listEvents } = require('../db');

const router = express.Router();

// GET /api/events — list the events titles
router.get('/', isLoggedIn, (req, res) => {
  const events = listEvents();
  res.json(events.map(({ code, title_en, title_fa }) => ({ code, title_en, title_fa })));
});

module.exports = router;
