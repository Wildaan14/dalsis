const express = require('express');
const router = express.Router();
const mcdaController = require('../controllers/mcdaController');

// GET /api/mcda/optimal?livestockType=Sapi%20Perah
router.get('/optimal', mcdaController.getOptimalLocations);

module.exports = router;
