const fs = require('fs');
const path = require('path');

const { spawn } = require('child_process');

exports.getLatestEnvironmentalData = (req, res) => {
  try {
    const geePath = path.join(__dirname, '../../data/gee_environmental_data.json');
    
    if (!fs.existsSync(geePath)) {
      return res.status(404).json({ 
        message: 'Environmental data from GEE not yet available. Please run the GEE pipeline.' 
      });
    }

    const data = JSON.parse(fs.readFileSync(geePath, 'utf8'));
    res.json(data);
  } catch (error) {
    console.error('Error reading GEE data:', error);
    res.status(500).json({ error: 'Failed to retrieve environmental data.' });
  }
};

exports.getPointData = (req, res) => {
  const { lat, lon } = req.body;
  
  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and Longitude are required.' });
  }

  const scriptPath = path.join(__dirname, '../gee_point_query.py');
  const pythonProcess = spawn('python', [scriptPath, lat, lon]);

  let dataString = '';
  pythonProcess.stdout.on('data', (data) => {
    dataString += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python Error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    try {
      if (code !== 0) {
        return res.status(500).json({ error: 'GEE script failed to execute' });
      }
      const result = JSON.parse(dataString);
      res.json(result);
    } catch (e) {
      console.error('Error parsing GEE output:', e);
      res.status(500).json({ error: 'Failed to parse GEE output' });
    }
  });
};
