'use strict';

const express = require('express');
const { listEvents } = require('../db');

const router = express.Router();

// GET /api/events -> list the 9 events (active only)
router.get('/', (req, res) => {
  res.json(listEvents({ activeOnly: true }));
});

module.exports = router;
