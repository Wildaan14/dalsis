const fs = require('fs');
const path = require('path');

/**
 * DALSIS-AI Modul 1: EARLY WARNING SYSTEM (EWS) IKLIM
 * Menghitung THI (Temperature-Humidity Index)
 */

exports.calculateTHI = (req, res) => {
  try {
    const { temperature, humidity } = req.body;

    if (temperature === undefined || humidity === undefined) {
      return res.status(400).json({ error: 'Temperature (C) and humidity (%) are required.' });
    }

    // Rumus THI
    // THI = (1.8 × T + 32) - (0.55 - 0.0055 × RH) × ((1.8 × T + 32) - 58)
    const T = parseFloat(temperature);
    const RH = parseFloat(humidity);

    const term1 = (1.8 * T) + 32;
    const term2 = 0.55 - (0.0055 * RH);
    const term3 = term1 - 58;

    const thi = term1 - (term2 * term3);

    // Kategori
    let level = 'HIJAU';
    let stress = 'Normal, tidak stres';
    let recommendations = [];

    if (thi > 88) {
      level = 'MERAH';
      stress = 'Severe Stress, darurat';
      recommendations = [
        'SEGERA pasang sistem pendingin air (sprinkler) aktif',
        'Sediakan air es ad libitum (>120 L/ekor/hari)',
        'Hentikan aktivitas transportasi atau intervensi fisik pada ternak'
      ];
    } else if (thi >= 79 && thi <= 88) {
      level = 'ORANYE';
      stress = 'Moderate Stress, berbahaya';
      recommendations = [
        'Pastikan air minum ad libitum (80–120 L/ekor/hari)',
        'Aktifkan kipas/sprinkler untuk sirkulasi udara (turunkan THI 2-4 poin)',
        'Pindahkan pemberian pakan ke pagi (05.00–07.00) dan malam (18.00–20.00)'
      ];
    } else if (thi >= 72 && thi < 79) {
      level = 'KUNING';
      stress = 'Mild Stress, waspada';
      recommendations = [
        'Pantau konsumsi pakan ternak',
        'Pastikan sirkulasi udara di kandang lancar',
        'Sediakan air segar mencukupi'
      ];
    } else {
      recommendations = [
        'Kondisi optimal. Pertahankan manajemen pakan harian seperti biasa.',
        'Dokumentasikan event suhu harian untuk rekaman jangka panjang.'
      ];
    }

    res.json({
      thi: parseFloat(thi.toFixed(2)),
      level,
      stress,
      recommendations,
      references: [
        'Bernabucci et al. (2010) J Dairy Sci',
        'IPCC AR6 WG2 Chapter 5 (2022)'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate THI.' });
  }
};

exports.getEwsHistory = (req, res) => {
  try {
    const csvPath = path.join(__dirname, '../../data/dataset_dalsis_final_2025.csv');
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ error: 'Data GEE/Iklim not found. Please run the data pipeline.' });
    }

    const fileContent = fs.readFileSync(csvPath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Map new GEE columns to legacy frontend structure if necessary, 
    // or provide clean district data
    const records = lines.slice(1).map(line => {
      const vals = line.split(',');
      const obj = {};
      headers.forEach((h, i) => {
        let val = vals[i];
        if (!isNaN(val) && val.trim() !== '') val = parseFloat(val);
        obj[h] = val;
      });

      // Mapping for EwsModule.jsx (Frontend Compatibility)
      return {
        date: new Date(2025, obj.bulan - 1, 1).toISOString(),
        animal_id: obj.kab_kota, // Use district name as ID
        body_temp: obj.LST_celsius || 38.5, // Mock if missing
        heart_rate: 60 + (obj.THI * 0.2), // Mock based on stress
        amb_temp: obj.T_celsius,
        humidity: obj.RH_persen,
        THI: obj.THI,
        label_stress: obj.risk_category >= 1 ? 1 : 0
      };
    });

    res.json(records.slice(-100)); // Return last 100 records
  } catch (error) {
    console.error('Error in getEwsHistory:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
