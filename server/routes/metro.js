'use strict';

const express = require('express');
const { isLoggedIn } = require('./auth');
const { getMetroGraph, listMetroEdges } = require('../db');

const router = express.Router();

router.get('/graph', isLoggedIn, (req, res) => {
  res.json(getMetroGraph());
});

router.get('/edges', isLoggedIn, (req, res) => {
  const { line_id } = req.query;
  if (line_id !== undefined && (typeof line_id !== 'string' || line_id.trim() === '')) {
    return res.status(422).json({ error: 'line_id must be a non-empty string.' });
  }
  res.json(listMetroEdges({ line_id: line_id?.trim() }));
});

module.exports = router;
