'use strict';

const express = require('express');
const { isLoggedIn } = require('./auth');
const { listEvents } = require('../db');

const router = express.Router();

// GET /api/events -> list the 9 events (active only)
router.get('/', isLoggedIn, (req, res) => {
  res.json(listEvents({ activeOnly: true }));
});

module.exports = router;
