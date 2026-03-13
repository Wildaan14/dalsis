/**
 * DALSIS-AI Modul 4: PENENTUAN LOKASI OPTIMAL PETERNAKAN — MCDA JAWA BARAT
 * AHP-TOPSIS Mock Implementation
 */

// Mock Data Kecamatan dengan Parameter MCDA
const KECAMATAN_JABAR_MOCK = [
  { 
    id: 1, name: 'Lembang', kab: 'Bandung Barat', lat: -6.814, lon: 107.618,
    metrics: {
      slope_deg: 18, water_dist_m: 800, temp_c: 20, rain_mm: 2200, risk_bnpb: 3,
      market_dist_km: 15, ndvi_score: 0.75
    }
  },
  { 
    id: 2, name: 'Cikajang', kab: 'Garut', lat: -7.348, lon: 107.788,
    metrics: {
      slope_deg: 12, water_dist_m: 300, temp_c: 22, rain_mm: 2500, risk_bnpb: 1,
      market_dist_km: 18, ndvi_score: 0.85
    }
  },
  { 
    id: 3, name: 'Ciater', kab: 'Subang', lat: -6.741, lon: 107.659,
    metrics: {
      slope_deg: 14, water_dist_m: 450, temp_c: 25, rain_mm: 1800, risk_bnpb: 2,
      market_dist_km: 25, ndvi_score: 0.80
    }
  },
  { 
    id: 4, name: 'Pangalengan', kab: 'Bandung', lat: -7.182, lon: 107.568,
    metrics: {
      slope_deg: 10, water_dist_m: 200, temp_c: 18, rain_mm: 3000, risk_bnpb: 2,
      market_dist_km: 30, ndvi_score: 0.90
    }
  }
];

// Algoritma simulasi MCDA (AHP-TOPSIS simplified weighted sum untuk mock system)
const calculateSuitabilityScore = (metrics, livestockType) => {
  // Bobot AHP
  const env_weight = 0.35;
  const climate_weight = 0.25;
  const socioeco_weight = 0.25;
  const tech_weight = 0.15;

  let score = 0;

  // Slope < 15 is better
  const slopeScore = metrics.slope_deg < 15 ? 100 : (20 - metrics.slope_deg) * 10;
  // Water < 500 is better
  const waterScore = metrics.water_dist_m < 500 ? 100 : (1000 - metrics.water_dist_m) * 0.1;
  const envFactor = ((slopeScore + waterScore)/2) * env_weight;

  // Temp & Rain
  const tempScore = (metrics.temp_c >= 18 && metrics.temp_c <= 28) ? 100 : 50;
  const rainScore = (metrics.rain_mm >= 1500 && metrics.rain_mm <= 3000) ? 100 : 60;
  const climateFactor = ((tempScore + rainScore)/2) * climate_weight;

  // Socioeco
  const socioFactor = (metrics.market_dist_km < 20 ? 100 : 70) * socioeco_weight;

  // Technical (NDVI for forage)
  const techFactor = (metrics.ndvi_score * 100) * tech_weight;

  score = envFactor + climateFactor + socioFactor + techFactor;
  
  // Return skala 1-5
  return parseFloat(((score / 100) * 5).toFixed(2));
};

exports.getOptimalLocations = (req, res) => {
  try {
    const { livestockType } = req.query;

    if (!livestockType) {
      return res.status(400).json({ error: 'livestockType parameter is required (e.g. Sapi Perah)' });
    }

    const analyzedLocations = KECAMATAN_JABAR_MOCK.map(loc => {
      const scoreScale5 = calculateSuitabilityScore(loc.metrics, livestockType);
      
      let category = 'Kurang Sesuai';
      if (scoreScale5 > 4.5) category = 'Sangat Sesuai (Optimal)';
      else if (scoreScale5 >= 3.5) category = 'Sesuai';
      
      return {
        ...loc,
        suitabilityScore: scoreScale5,
        category,
        recommendation: `Berdasarkan parameter NDVI, lereng, dan jarak pasar (MCDA Jawa Barat).`
      };
    });

    // Sort descending
    analyzedLocations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

    res.json({
      title: `Pemetaan Lokasi Optimal (MCDA Jawa Barat) untuk ${livestockType}`,
      bounding_box: '[105.0, -8.2, 109.3, -5.7]',
      top_locations: analyzedLocations,
      methodology: 'AHP-TOPSIS (Analytic Hierarchy Process + Technique for Order Preference by Similarity to Ideal Solution)',
      references: [
        'Saaty (1980) AHP',
        'Hwang & Yoon (1981) TOPSIS',
        'BIG (2023) Peta RBI'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process MCDA.' });
  }
};
