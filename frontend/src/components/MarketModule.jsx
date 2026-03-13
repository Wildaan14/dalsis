import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Store, Tag, Users, Search, CheckCircle } from 'lucide-react';

const MarketModule = () => {
  const [prices, setPrices] = useState([]);
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [targetType, setTargetType] = useState('Sapi Perah');
  const [expectedQuantity, setExpectedQuantity] = useState(5);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/market/prices');
      setPrices(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/market/match', {
        buyerLocation: 'Bandung',
        targetType,
        expectedQuantity: parseInt(expectedQuantity)
      });
      setMatches(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1>Marketplace & Komunitas</h1>
      <p className="subtitle">Platform penghubung peternak dan pasar untuk memutus rantai tengkulak.</p>

      <div className="grid-2">
        <div className="glass-panel delay-1">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Tag size={20} className="text-secondary" /> Harga Acuan Jawa Barat
          </h3>
          
          {loading && !matches ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat data harga Pusdatin...</div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {prices.map(price => (
                <div key={price.id} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{price.type}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{price.location}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 700 }}>
                      Rp {price.pricePerKg ? `${(price.pricePerKg).toLocaleString()}/kg` : `${(price.pricePerHead).toLocaleString()}/ekor`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: price.trend.includes('+') ? '#34d399' : '#94a3b8' }}>
                      {price.trend}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-panel delay-2">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} className="text-secondary" /> Market Matching Cerdas
          </h3>
          
          <form onSubmit={handleMatch} style={{ marginBottom: '2rem' }}>
            <div className="grid-2">
               <div className="input-group">
                <label className="input-label">Jenis Komoditi (Query)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Kapasitas Beli</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={expectedQuantity}
                  onChange={(e) => setExpectedQuantity(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Search size={18} /> Cari Peternak Langsung
            </button>
          </form>

          {matches && (
            <div className="animate-fade-in">
              <h4 style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.875rem', textTransform: 'uppercase' }}>Hasil Matching Rekomendasi</h4>
              {matches.matches.length > 0 ? matches.matches.map(m => (
                <div key={m.id} style={{ 
                  padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {m.name} <CheckCircle size={14} color="#34d399" />
                    </div>
                    <div className="badge alert-hijau">Trust: ⭐ {m.trustScore}</div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    {m.type} • Stok {m.quantity} Ekor • Sertifikasi: {m.certification}
                  </div>
                  <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Lokasi: {m.location.district}
                  </div>
                </div>
              )) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#f87171' }}>Tidak ditemukan peternak untuk komoditas tersebut di database saat ini.</div>
              )}
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem' }}>
                KPI Note: {matches.kpiNote}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarketModule;
