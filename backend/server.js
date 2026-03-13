require('dotenv').config();
const express = require('express');
const cors = require('cors');

const ewsRoutes = require('./src/routes/ewsRoutes');
const marketRoutes = require('./src/routes/marketRoutes');
const mrvRoutes = require('./src/routes/mrvRoutes');
const mcdaRoutes = require('./src/routes/mcdaRoutes');
const environmentalRoutes = require('./src/routes/environmentalRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ews', ewsRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/mrv', mrvRoutes);
app.use('/api/mcda', mcdaRoutes);
app.use('/api/environmental', environmentalRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'DALSIS-AI Backend is running.' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`DALSIS-AI Backend Server running on port ${PORT}`);
});

module.exports = app;
