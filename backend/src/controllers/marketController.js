/**
 * DALSIS-AI Modul 2: PLATFORM KOMUNITAS & MARKETPLACE PETERNAKAN
 * Mock market data and matching algorithm
 */

const marketPrices = [
  { id: 1, type: 'Sapi Potong (Limosin)', location: 'Cianjur', pricePerKg: 52000, trend: '+2%' },
  { id: 2, type: 'Sapi Perah (FH)', location: 'Lembang', pricePerHead: 25000000, trend: 'stable' },
  { id: 3, type: 'Kambing (PE)', location: 'Garut', pricePerHead: 3500000, trend: '+5%' },
  { id: 4, type: 'Domba (Garut)', location: 'Garut', pricePerHead: 4000000, trend: '+1%' }
];

const mockListing = [
  { 
    id: 101, 
    farmerId: 'f_001', 
    name: 'Bapak Usep', 
    location: { district: 'Lembang', lat: -6.814, lon: 107.618 }, 
    type: 'Sapi Perah', 
    quantity: 5, 
    trustScore: 4.8,
    certification: 'NKv'
  },
  { 
    id: 102, 
    farmerId: 'f_002', 
    name: 'Ibu Aisyah', 
    location: { district: 'Garut', lat: -7.227, lon: 107.900 }, 
    type: 'Domba Garut', 
    quantity: 20, 
    trustScore: 4.9,
    certification: 'Organik'
  }
];

exports.getMarketPrices = (req, res) => {
  res.json({
    source: 'Pusdatin Kementan & Pasar Lokal Jawa Barat (Simulasi)',
    lastUpdate: new Date().toISOString(),
    data: marketPrices
  });
};

exports.matchMarket = (req, res) => {
  try {
    const { buyerLocation, targetType, expectedQuantity } = req.body;
    
    // Algoritma simulasi sederhana: filter tipe dan kuantitas, kemudian urutkan berdasarkan trust score
    let matches = mockListing.filter(listing => listing.type.toLowerCase().includes(targetType.toLowerCase()));
    
    // Sort by trust score & capable quantity
    matches.sort((a, b) => b.trustScore - a.trustScore);

    res.json({
      query: { buyerLocation, targetType, expectedQuantity },
      matches,
      kpiNote: 'Algoritma matching dirancang untuk mengurangi middlemen hingga 30% berdasarkan rute (Ghadge et al., 2021)'
    });
  } catch (error) {
    res.status(500).json({ error: 'Market matching failed.' });
  }
};
