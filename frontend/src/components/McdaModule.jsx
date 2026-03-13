import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Map as MapIcon } from 'lucide-react';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const McdaModule = () => {
  const [livestockType, setLivestockType] = useState('Sapi Perah');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOptimal = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/mcda/optimal?livestockType=${encodeURIComponent(livestockType)}`);
      setLocations(res.data.top_locations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h1>MCDA Lokasi Optimal</h1>
      <p className="subtitle">Analisis Multi-Kriteria Keputusan (AHP-TOPSIS) untuk kesesuaian lahan ternak Jawa Barat.</p>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1 }}>
        <div className="glass-panel delay-1" style={{ width: '400px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapIcon size={20} className="text-secondary" /> Parametrisasi Model
          </h3>
          
          <form onSubmit={fetchOptimal} style={{ marginBottom: '2rem' }}>
            <div className="input-group">
              <label className="input-label">Target Komoditas</label>
              <select 
                className="input-field" 
                value={livestockType}
                onChange={(e) => setLivestockType(e.target.value)}
              >
                <option value="Sapi Perah">Sapi Perah</option>
                <option value="Sapi Potong">Sapi Potong</option>
                <option value="Domba Garut">Domba Garut</option>
              </select>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Navigation size={18} /> Run AHP-TOPSIS Engine
            </button>
          </form>

          {locations.length > 0 && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.875rem', textTransform: 'uppercase' }}>Peringkat Kesesuaian (Top 4)</h4>
              
              {locations.map((loc, idx) => (
                <div key={loc.id} style={{ 
                  padding: '1rem', 
                  background: idx === 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)', 
                  borderRadius: 'var(--radius-sm)',
                  border: idx === 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600 }}>#{idx + 1} {loc.name}</div>
                    <div className={loc.suitabilityScore > 4 ? "badge alert-hijau" : "badge alert-kuning"}>Score: {loc.suitabilityScore}</div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{loc.kab}</div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                    <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>Slope: {loc.metrics.slope_deg}°</span>
                    <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>Air: {loc.metrics.water_dist_m}m</span>
                    <span style={{ padding: '0.2rem 0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>Pasar: {loc.metrics.market_dist_km}km</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel delay-2" style={{ flex: 1, padding: '0.5rem', overflow: 'hidden' }}>
          {/* Centered dynamically based on Jabar Mock Bounding Box */}
          <MapContainer center={[-6.914, 107.618]} zoom={8} style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-md)' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {locations.map((loc, idx) => (
              <Marker key={loc.id} position={[loc.lat, loc.lon]}>
                <Popup>
                  <div style={{ color: '#0f172a' }}>
                    <strong>Ranking #{idx + 1}</strong><br/>
                    {loc.name}, {loc.kab}<br/>
                    Skor: {loc.suitabilityScore}/5.0<br/>
                    (NDVI: {loc.metrics.ndvi_score})
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default McdaModule;
