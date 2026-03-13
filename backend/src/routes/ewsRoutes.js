const express = require('express');
const router = express.Router();
const ewsController = require('../controllers/ewsController');

// GET /api/ews/history
router.get('/history', ewsController.getEwsHistory);

// POST /api/ews/thi
router.post('/thi', ewsController.calculateTHI);

module.exports = router;
