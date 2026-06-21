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
  res.json(listMetroEdges({ line_id }));
});

module.exports = router;
