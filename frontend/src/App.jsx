import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import EwsModule from './components/EwsModule';
import MrvModule from './components/MrvModule';
import MarketModule from './components/MarketModule';
import McdaModule from './components/McdaModule';

function App() {
  const [activeModule, setActiveModule] = useState('ews');

  const renderModule = () => {
    switch(activeModule) {
      case 'ews':
        return <EwsModule />;
      case 'mrv':
        return <MrvModule />;
      case 'market':
        return <MarketModule />;
      case 'mcda':
        return <McdaModule />;
      default:
        return <EwsModule />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar activeModule={activeModule} setActiveModule={setActiveModule} />
      <main className="main-content">
        {renderModule()}
      </main>
    </div>
  );
}

export default App;
