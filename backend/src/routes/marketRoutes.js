const express = require('express');
const router = express.Router();
const marketController = require('../controllers/marketController');

// GET /api/market/prices
router.get('/prices', marketController.getMarketPrices);

// POST /api/market/match
// Body: { buyerLocation: string, targetType: string, expectedQuantity: number }
router.post('/match', marketController.matchMarket);

module.exports = router;
