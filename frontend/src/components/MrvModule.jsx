import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, Factory, History, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

const MrvModule = () => {
  const [livestockType, setLivestockType] = useState('Sapi Potong');
  const [quantity, setQuantity] = useState(150);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState('calculator'); // 'calculator', 'history', or 'satelit'
  const [envData, setEnvData] = useState([]);

  useEffect(() => {
    if (view === 'history') {
      fetchHistory();
    } else if (view === 'satelit') {
      fetchEnvData();
    }
  }, [view]);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/mrv/history`);
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const fetchEnvData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/environmental/latest`);
      setEnvData(response.data);
    } catch (error) {
      console.error('Error fetching GEE data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMrv = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/mrv/calculate`, {
        livestockType,
        quantity: parseInt(quantity),
        location: 'Jawa Barat'
      });
      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert('Error calculating emissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1>Digital MRV (IPCC Tier 1)</h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>Sistem pelaporan emisi GRK Periode 2025 - 2026 (AR6 Standard).</p>
        </div>
        <div className="filter-tabs" style={{ marginBottom: 0 }}>
          <div 
            className={`filter-tab ${view === 'calculator' ? 'active' : ''}`}
            onClick={() => setView('calculator')}
          >
            <Factory size={16} /> Kalkulator
          </div>
          <div 
            className={`filter-tab ${view === 'history' ? 'active' : ''}`}
            onClick={() => setView('history')}
          >
            <History size={16} /> Data Riil & Tren
          </div>
          <div 
            className={`filter-tab ${view === 'satelit' ? 'active' : ''}`}
            onClick={() => setView('satelit')}
          >
            <BarChart3 size={16} /> Monitoring Satelit (GEE)
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        {view === 'calculator' && (
          <div className="grid-2">
            <div className="glass-panel delay-1">
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={20} className="text-primary" /> Inventarisasi Peternakan
              </h3>
              <form onSubmit={calculateMrv}>
                <div className="input-group">
                  <label className="input-label">Jenis Ternak</label>
                  <select 
                    className="input-field" 
                    value={livestockType}
                    onChange={(e) => setLivestockType(e.target.value)}
                  >
                    <option value="Sapi Potong">Sapi Potong (Beef Cattle)</option>
                    <option value="Sapi Perah">Sapi Perah (Dairy Cattle)</option>
                    <option value="Kambing">Kambing (Goat)</option>
                    <option value="Domba">Domba (Sheep)</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label className="input-label">Populasi (Ekor)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    className="input-field" 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                  <BarChart3 size={18} /> {loading ? 'Mengkalkulasi...' : 'Hitung Emisi Tahunan'}
                </button>
              </form>
            </div>

            {result && (
              <div className="glass-panel delay-2">
                <h3 style={{ marginBottom: '1.5rem' }}>Hasil Kalkulasi: {result.results.category}</h3>
                <div className="stat-info">
                  <h3>Total Emisi</h3>
                  <div className="value" style={{ color: result.results.total_CO2eq_tons_per_year > 1000 ? 'var(--danger)' : 'var(--primary)' }}>
                    {result.results.total_CO2eq_tons_per_year.toLocaleString()}
                    <span style={{ fontSize: '1rem', marginLeft: '0.5rem', color: 'var(--text-muted)' }}>ton CO₂eq/thn</span>
                  </div>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  <h4 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Mitigasi :</h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {result.mitigation_recommendations.map((rec, idx) => (
                      <li key={idx} style={{ 
                        padding: '0.75rem', 
                        background: 'rgba(255,255,255,0.03)', 
                        borderRadius: '8px', 
                        marginBottom: '0.5rem', 
                        fontSize: '0.85rem',
                        display: 'flex',
                        gap: '0.5rem'
                      }}>
                        <span style={{ color: rec.priority.includes('HIGH') ? 'var(--danger)' : 'var(--accent)' }}>•</span>
                        {rec.text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'history' && (
          <div className="glass-panel animate-fade-in">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History size={20} className="text-secondary" /> Laporan Emisi Historis (2025 - 2026)
            </h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kabupaten/Kota</th>
                    <th>Tahun</th>
                    <th>Total Ternak</th>
                    <th>Emisi (tCO₂eq)</th>
                    <th>Priority</th>
                    <th>Rekomendasi Utama (DSS)</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row, idx) => {
                    const prevYearData = history.find(h => h.kabupaten === row.kabupaten && h.tahun === row.tahun - 1);
                    const trend = prevYearData ? (row.total_CO2eq_t > prevYearData.total_CO2eq_t ? 'up' : 'down') : null;

                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{row.kabupaten}</td>
                        <td><span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>{row.tahun}</span></td>
                        <td>{row.total_ternak?.toLocaleString()} ekor</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {row.total_CO2eq_t?.toLocaleString()}
                            {trend === 'up' && <TrendingUp size={14} className="trend-up" />}
                            {trend === 'down' && <TrendingDown size={14} className="trend-down" />}
                          </div>
                        </td>
                        <td>
                          <span className={`badge alert-${(row.priority || 'LOW').toLowerCase() === 'high' ? 'merah' : (row.priority || 'LOW').toLowerCase() === 'medium' ? 'kuning' : 'hijau'}`}>
                            {row.priority || 'LOW'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {row.recommendation || 'Lanjutkan manajemen optimal'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'satelit' && (
          <div className="glass-panel animate-fade-in">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={20} className="text-primary" /> Monitoring Kondisi Lingkungan (Live GEE)
            </h3>
            <div className="info-banner">
              <p>🛰️ <strong>Data Satelit:</strong> Menampilkan NDVI (Vegetasi Pakan) dan LST (Suhu Permukaan) terbaru dari Google Earth Engine untuk Jawa Barat.</p>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kabupaten/Kota</th>
                    <th>Status Pakan</th>
                    <th>Vegetasi (NDVI)</th>
                    <th>Suhu Permukaan (LST)</th>
                    <th>Periode Data</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Tunggu sebentar, sedang mengambil data dari satelit...</td></tr>
                  ) : envData.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{item.kabupaten}</td>
                      <td>
                        <span className={`status-tag ${item.status_pakan === 'Subur' ? 'status-green' : 'status-red'}`}>
                          {item.status_pakan}
                        </span>
                      </td>
                      <td>
                        <div className="ndvi-bar">
                          <div className="bar-fill" style={{ width: `${Math.min(item.ndvi_pakan * 100, 100)}%` }}></div>
                          <span style={{ fontSize: '0.8rem' }}>{item.ndvi_pakan}</span>
                        </div>
                      </td>
                      <td>{item.lst_temp_c}°C</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MrvModule;
