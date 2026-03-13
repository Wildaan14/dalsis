const fs = require('fs');
const path = require('path');

const ee = require('@google/earthengine');
const privateKey = require('../config/gee-key.json');

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

  // Initialize GE 
  ee.data.authenticateViaPrivateKey(privateKey, () => {
    ee.initialize(null, null, () => {
      try {
        const point = ee.Geometry.Point([lon, lat]);
        const now = new Date();
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const start_str = start.toISOString().split('T')[0];
        const end_str = now.toISOString().split('T')[0];

        // 1. NDVI (Sentinel-2)
        const s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
          .filterBounds(point)
          .filterDate(start_str, end_str)
          .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
          .median();
        
        const ndvi = s2.normalizedDifference(['B8', 'B4']).rename('NDVI');
        const ndvi_stats = ndvi.reduceRegion({
          reducer: ee.Reducer.mean(),
          geometry: point,
          scale: 10
        });

        // 2. LST (MODIS)
        const lst_col = ee.ImageCollection('MODIS/061/MOD11A1')
          .filterBounds(point)
          .filterDate(start_str, end_str)
          .select('LST_Day_1km')
          .median();
        
        const lst_c = lst_col.multiply(0.02).subtract(273.15).rename('LST');
        const lst_stats = lst_c.reduceRegion({
          reducer: ee.Reducer.mean(),
          geometry: point,
          scale: 1000
        });

        // 3. ERA5-Land (Temp & Humidity - Approximate as hourly collection is large)
        const era5 = ee.ImageCollection("ECMWF/ERA5_LAND/MONTHLY_AGGR")
          .filterBounds(point)
          .filterDate(start_str, end_str)
          .select(['temperature_2m', 'dewpoint_temperature_2m'])
          .median();

        const t_air_img = era5.select('temperature_2m').subtract(273.15);
        const td_air_img = era5.select('dewpoint_temperature_2m').subtract(273.15);
        
        // RH Formula integration in EE
        const rh_img = t_air_img.expression(
          '100 * (exp((17.625 * td) / (243.04 + td)) / exp((17.625 * t) / (243.04 + t)))',
          { 't': t_air_img, 'td': td_air_img }
        ).rename('RH');

        const climate_stats = ee.Image.cat([t_air_img.rename('T'), rh_img]).reduceRegion({
          reducer: ee.Reducer.mean(),
          geometry: point,
          scale: 10000
        });

        // Combined Fetch
        const combined = ee.Dictionary({
          'ndvi': ndvi_stats.get('NDVI'),
          'lst': lst_stats.get('LST'),
          'temp': climate_stats.get('T'),
          'rh': climate_stats.get('RH')
        });

        combined.evaluate((val, err) => {
          if (err) {
            console.error('EE Evaluate Error:', err);
            return res.status(500).json({ error: 'GEE evaluation failed' });
          }
          res.json({
            lat, lon,
            air_temp_c: val.temp ? Math.round(val.temp * 100) / 100 : 0,
            humidity_rh: val.rh ? Math.round(val.rh * 10) / 10 : 0,
            ndvi_pakan: val.ndvi ? Math.round(val.ndvi * 10000) / 10000 : 0,
            lst_temp_c: val.lst ? Math.round(val.lst * 100) / 100 : 0,
            success: true
          });
        });

      } catch (err) {
        console.error('GEE Logic Error:', err);
        res.status(500).json({ error: 'GEE processing failed' });
      }
    }, (err) => {
      console.error('GEE Init Error:', err);
      res.status(500).json({ error: 'GEE initialization failed' });
    });
  }, (err) => {
    console.error('GEE Auth Error:', err);
    res.status(500).json({ error: 'GEE authentication failed' });
  });
};
