const express = require('express');
const router = express.Router();
const environmentalController = require('../controllers/environmentalController');

router.get('/latest', environmentalController.getLatestEnvironmentalData);
router.post('/point', environmentalController.getPointData);

module.exports = router;
