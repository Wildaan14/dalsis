import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Thermometer, Droplets, AlertTriangle, History, Activity, Zap } from 'lucide-react';
import { MapContainer, TileLayer, useMapEvents, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const EwsModule = () => {
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [location, setLocation] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [envData, setEnvData] = useState([]);
  const [view, setView] = useState('input'); // 'input' or 'monitor'
  const [mapSelection, setMapSelection] = useState(null); // {lat, lon}

  useEffect(() => {
    fetchEwsHistory();
    fetchEnvData();
  }, []);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchEwsHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/ews/history`);
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching EWS history:', error);
    }
  };

  const fetchEnvData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/environmental/latest`);
      setEnvData(response.data);
    } catch (error) {
      console.error('Error fetching environmental data:', error);
    }
  };

  const syncGeeeData = () => {
    if (!location) {
      alert('Silakan pilih lokasi terlebih dahulu bg!');
      return;
    }
    const selected = envData.find(d => d.kabupaten === location);
    if (selected) {
      setTemperature(selected.air_temp_c);
      setHumidity(selected.humidity_rh);
    }
  };

  const MapEvents = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        setMapSelection({ lat, lon: lng });
        setMapLoading(true);
        try {
          const res = await axios.post(`${API_BASE_URL}/api/environmental/point`, {
            lat, lon: lng
          });
          if (res.data.success !== false) {
            setTemperature(res.data.air_temp_c);
            setHumidity(res.data.humidity_rh);
            setLocation(`Koordinat: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          } else {
            alert('Gagal ambil data GEE di titik ini bg!');
          }
        } catch (err) {
          console.error(err);
          alert('Error sinkronisasi GEE via peta');
        } finally {
          setMapLoading(false);
        }
      },
    });
    return mapSelection ? <Marker position={[mapSelection.lat, mapSelection.lon]} /> : null;
  };

  const calculateTHI = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/ews/thi`, {
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity)
      });
      setResult(response.data);
    } catch (error) {
      console.error(error);
      alert('Error calculating THI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Activity className="text-primary" /> Early Warning System Iklim (EWS)
          </h1>
          <p className="subtitle" style={{ marginBottom: 0 }}>Pemantauan THI & Heat Stress Real-time (Data Satelit GEE 2025-2026).</p>
        </div>
        <div className="filter-tabs" style={{ marginBottom: 0 }}>
          <div 
            className={`filter-tab ${view === 'input' ? 'active' : ''}`}
            onClick={() => setView('input')}
          >
            <Zap size={16} /> Analisis Spasial GEE
          </div>
          <div 
            className={`filter-tab ${view === 'monitor' ? 'active' : ''}`}
            onClick={() => setView('monitor')}
          >
            <Activity size={16} /> Monitoring IoT
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        {view === 'input' ? (
          <div className="grid-2">
            <div className="glass-panel delay-1" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                {mapLoading && (
                  <div style={{ position: 'absolute', zIndex: 1000, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '0.8rem' }}>
                    🛰️ Sedang Menarik Data Satelit GEE...
                  </div>
                )}
                <MapContainer center={[-6.9175, 107.6191]} zoom={8} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapEvents />
                </MapContainer>
              </div>

              <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>💡 <em>Klik pada peta di atas untuk mengambil data cuaca real-time dari koordinat pilihan abang.</em></p>
                <form onSubmit={calculateTHI}>
                  <div className="input-group">
                    <label className="input-label">Lokasi Terpilih</label>
                    <input 
                      className="input-field" 
                      value={location}
                      readOnly
                      placeholder="Klik pada peta atau pilih wilayah..."
                    />
                  </div>

                  <div className="grid-2" style={{ gap: '1rem' }}>
                    <div className="input-group">
                      <label className="input-label">Suhu (°C)</label>
                      <div style={{ position: 'relative' }}>
                        <Thermometer size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                        <input 
                          type="number" step="0.1" required className="input-field" 
                          style={{ paddingLeft: '2.2rem' }} value={temperature}
                          onChange={(e) => setTemperature(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Lembab (%)</label>
                      <div style={{ position: 'relative' }}>
                        <Droplets size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                        <input 
                          type="number" required className="input-field" 
                          style={{ paddingLeft: '2.2rem' }} value={humidity}
                          onChange={(e) => setHumidity(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading || mapLoading}>
                    {loading ? 'Mengkalkulasi...' : 'Analisis Skor Kesehatan Ternak'}
                  </button>
                </form>
              </div>
            </div>

            <div className="glass-panel delay-2">
              {result ? (
                <>
                  <h3 style={{ marginBottom: '1.5rem' }}>Diagnosis GEE (Bernabucci 2010): <span className={`text-${result.level.toLowerCase()}`}>{result.stress}</span></h3>
                  
                  <div className="stat-card" style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '12px' }}>
                    <div className="stat-icon" style={{ background: `rgba(${result.level==='MERAH'?'239,68,68':'16,185,129'},0.1)` }}>
                      <Thermometer size={24} className={result.level==='MERAH'?'text-danger':'text-primary'} />
                    </div>
                    <div className="stat-info">
                      <h3>Skor Index (THI)</h3>
                      <div className="value" style={{ fontSize: '2.5rem' }}>{result.thi}</div>
                      <span className={`badge alert-${result.level.toLowerCase()}`}>{result.level} LEVEL</span>
                    </div>
                  </div>

                  <div className="glass-panel" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Zap size={16} /> REKOMENDASI MITIGASI:
                    </h4>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {result.recommendations.map((rec, i) => (
                        <li key={i} style={{ 
                          padding: '0.75rem 0', 
                          borderBottom: i < result.recommendations.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', 
                          fontSize: '0.85rem',
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'flex-start'
                        }}>
                          <span style={{ color: 'var(--primary)', marginTop: '2px' }}>•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
                  <Zap size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                  <h3>Belum Ada Data</h3>
                  <p>Silakan klik pada peta di sisi kiri untuk memicu analisis real-time dari Google Earth Engine.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-panel animate-fade-in">
             <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} className="text-primary" /> Live Data Sensor IoT Peternakan (Sapi Potong & Perah)
            </h3>
            <div className="info-banner" style={{ marginBottom: '1.5rem' }}>
              <p>📊 <strong>Status Terkini:</strong> Memantau kesehatan ternak secara individu menggunakan sensor suhu tubuh dan detak jantung.</p>
            </div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Waktu (Sensor)</th>
                    <th>Animal ID</th>
                    <th>Subyek (°C)</th>
                    <th>Detak Jantung</th>
                    <th>Ambient (°C)</th>
                    <th>THI</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontSize: '0.8rem' }}>{new Date(row.date).toLocaleString()}</td>
                      <td><span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>{row.animal_id}</span></td>
                      <td style={{ fontWeight: 600, color: row.body_temp > 39 ? 'var(--danger)' : 'var(--primary)' }}>{parseFloat(row.body_temp).toFixed(1)}°C</td>
                      <td>{Math.round(row.heart_rate)} bpm</td>
                      <td>{parseFloat(row.amb_temp).toFixed(1)}°C</td>
                      <td style={{ fontWeight: 700 }}>{parseFloat(row.THI).toFixed(1)}</td>
                      <td>
                        <span className={`badge alert-${row.label_stress === 1 ? 'merah' : 'hijau'}`}>
                          {row.label_stress === 1 ? 'STRESS' : 'NORMAL'}
                        </span>
                      </td>
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

export default EwsModule;
