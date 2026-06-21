'use strict';

const express = require('express');
const { getMetroGraph, listMetroEdges } = require('../db');

const router = express.Router();

router.get('/graph', (req, res) => {
  res.json(getMetroGraph());
});

router.get('/edges', (req, res) => {
  const { line_id } = req.query;
  res.json(listMetroEdges({ line_id }));
});

module.exports = router;
