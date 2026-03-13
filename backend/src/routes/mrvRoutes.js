const express = require('express');
const router = express.Router();
const mrvController = require('../controllers/mrvController');

// GET /api/mrv/history
router.get('/history', mrvController.getHistory);

// POST /api/mrv/calculate
router.post('/calculate', mrvController.calculateEmissions);

module.exports = router;
