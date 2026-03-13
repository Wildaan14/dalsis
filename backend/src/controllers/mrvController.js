const fs = require('fs');
const path = require('path');

// GWP (Global Warming Potential) berdasarkan IPCC AR6 (2021)
const GWP_CH4 = 28;
const GWP_N2O = 265;

// Emission Factors (kg/hd/yr) untuk Southeast Asia (IPCC 2019 Vol.4)
const EMISSION_FACTORS = {
  'Sapi Potong': { enteric_CH4: 47, manure_CH4: 1.0, manure_N2O: 0.66 },
  'Sapi Perah':  { enteric_CH4: 118, manure_CH4: 16.0, manure_N2O: 1.18 },
  'Kambing':     { enteric_CH4: 5, manure_CH4: 0.17, manure_N2O: 0.16 },
  'Domba':       { enteric_CH4: 5, manure_CH4: 0.28, manure_N2O: 0.16 },
};

exports.calculateEmissions = (req, res) => {
  try {
    const { livestockType, quantity, location } = req.body;

    if (!livestockType || !quantity) {
      return res.status(400).json({ error: 'Livestock Type and Quantity are required.' });
    }

    const factor = EMISSION_FACTORS[livestockType];
    if (!factor) {
      return res.status(400).json({ error: `Livestock type ${livestockType} is not supported. Use Sapi Potong, Sapi Perah, Kambing, or Domba.` });
    }

    // Kalkulasi Total Emisi kg/tahun
    const totalEntericCH4 = quantity * factor.enteric_CH4;
    const totalManureCH4 = quantity * factor.manure_CH4;
    const totalManureN2O = quantity * factor.manure_N2O;

    // Konversi ke CO2eq (GWP equivalency) - dalam satuan ton CO2eq
    const co2eq_Enteric = (totalEntericCH4 * GWP_CH4) / 1000;
    const co2eq_ManureCH4 = (totalManureCH4 * GWP_CH4) / 1000;
    const co2eq_ManureN2O = (totalManureN2O * GWP_N2O) / 1000;

    const total_CO2eq = parseFloat((co2eq_Enteric + co2eq_ManureCH4 + co2eq_ManureN2O).toFixed(2));

    // Rekomendasi berdasarkan tingkat emisi
    let recommendations = [];
    let emissionCategory = 'RENDAH';

    if (total_CO2eq > 500) {
      emissionCategory = 'MERAH';
      recommendations = [
        { priority: '🔴 HIGH', text: 'Wajib mitigasi: Pasang biodigester & 3-NOP (Sesuai DALSIS Pillar 4)' },
        { priority: '🔴 HIGH', text: 'Laporkan data emisi segera ke portal SIGN-SMART Kementerian LHK' }
      ];
    } else if (total_CO2eq >= 200 && total_CO2eq <= 500) {
      emissionCategory = 'KUNING';
      recommendations = [
        { priority: '🟡 MED', text: 'Terapkan Best Management Practices (BMP) & pakan efisien' },
        { priority: '🟡 MED', text: 'Pantau tren emisi 6 bulan sekali untuk mencegah kenaikan status' }
      ];
    } else {
      emissionCategory = 'HIJAU';
      recommendations = [
        { priority: '🟢 LOW', text: 'Pertahankan praktik saat ini. Daftarkan ke mekanisme kredit karbon REDD+' }
      ];
    }

    res.json({
      input: { livestockType, quantity, location },
      mr_data: {
        total_Enteric_CH4_kg: totalEntericCH4,
        total_Manure_CH4_kg: totalManureCH4,
        total_Manure_N2O_kg: totalManureN2O
      },
      results: {
        total_CO2eq_tons_per_year: total_CO2eq,
        category: emissionCategory
      },
      mitigation_recommendations: recommendations,
      references: [
        'IPCC (2019) Vol.4 Table 10.11',
        'Gerber et al. FAO GLEAM (2013)'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate emissions.' });
  }
};

exports.getHistory = (req, res) => {
  try {
    const mrvPath = path.join(__dirname, '../../data/mrv_output.csv');
    const dssPath = path.join(__dirname, '../../data/dss_policy_recommendations.csv');
    
    if (!fs.existsSync(mrvPath)) {
      return res.status(404).json({ error: 'MRV output data not found.' });
    }

    const mrvLines = fs.readFileSync(mrvPath, 'utf8').split('\n').filter(l => l.trim() !== '');
    const mrvHeaders = mrvLines[0].split(',').map(h => h.trim());
    
    let dssMap = {};
    if (fs.existsSync(dssPath)) {
      const dssLines = fs.readFileSync(dssPath, 'utf8').split('\n').filter(l => l.trim() !== '');
      const dssHeaders = dssLines[0].split(',').map(h => h.trim());
      dssLines.slice(1).forEach(line => {
        const vals = line.split(',');
        const name = vals[0].trim();
        dssMap[name] = {
          priority: vals[3].trim(),
          recommendation: vals[2].trim()
        };
      });
    }

    const results = mrvLines.slice(1).map(line => {
      const vals = line.split(',');
      const obj = {};
      mrvHeaders.forEach((h, i) => {
        let val = vals[i];
        if (!isNaN(val) && val.trim() !== '') val = parseFloat(val);
        obj[h] = val;
      });

      const districtName = obj.nama_wilayah;
      const dssInfo = dssMap[districtName] || {};

      return {
        kabupaten: districtName,
        tahun: 2025,
        total_ternak: obj.total_ternak,
        total_CO2eq_t: obj.total_CO2eq_ton,
        priority: dssInfo.priority || 'NORMAL',
        recommendation: dssInfo.recommendation || 'Lanjutkan monitoring.'
      };
    });

    res.json(results);
  } catch (error) {
    console.error('Error reading MRV history:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
