import React from 'react';
import { CloudRainWind, Store, Activity, Map } from 'lucide-react';

const Sidebar = ({ activeModule, setActiveModule }) => {
  const menuItems = [
    { id: 'ews', label: 'EWS Iklim (THI)', icon: <CloudRainWind size={20} /> },
    { id: 'market', label: 'Komunitas & Pasar', icon: <Store size={20} /> },
    { id: 'mrv', label: 'MRV Emisi GRK', icon: <Activity size={20} /> },
    { id: 'mcda', label: 'MCDA Lokasi', icon: <Map size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity /> DALSIS-AI
        </h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Digital Analytics for Livestock Sustainability
        </p>
      </div>

      <nav style={{ flex: 1 }}>
        {menuItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`nav-item ${activeModule === item.id ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveModule(item.id);
            }}
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: 'var(--glass-border)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <p>FAO × BRIN 2026</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
