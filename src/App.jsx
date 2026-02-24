import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign, AlertCircle } from 'lucide-react';

const App = () => {
  const [btcData, setBtcData] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [signal, setSignal] = useState(null);
  const [indicators, setIndicators] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchBitcoinData = async () => {
    try {
      setError(null);
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily'
      );
      
      if (!response.ok) {
        throw new Error('API Anfrage fehlgeschlagen');
      }
      
      const data = await response.json();
      
      const formattedData = data.prices.map((item) => ({
        date: new Date(item[0]).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }),
        price: item[1],
        timestamp: item[0]
      }));
      
      setBtcData(formattedData);
      setCurrentPrice(formattedData[formattedData.length - 1].price);
      
      calculateIndicators(formattedData);
      
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const calculateIndicators = (data) => {
    const prices = data.map(d => d.price);
    
    const sma7 = calculateSMA(prices, 7);
    const sma20 = calculateSMA(prices, 20);
    const rsi = calculateRSI(prices, 14);
    
    const enrichedData = data.map((d, i) => ({
      ...d,
      sma7: i >= 6 ? sma7[i] : null,
      sma20: i >= 19 ? sma20[i] : null
    }));
    
    setBtcData(enrichedData);
    
    const currentSMA7 = sma7[sma7.length - 1];
    const currentSMA20 = sma20[sma20.length - 1];
    const currentRSI = rsi;
    
    let generatedSignal = 'NEUTRAL';
    let signalStrength = 0;
    let reasons = [];
    
    if (currentSMA7 > currentSMA20) {
      signalStrength += 1;
      reasons.push('SMA7 über SMA20 (Bullish)');
    } else if (currentSMA7 < currentSMA20) {
      signalStrength -= 1;
      reasons.push('SMA7 unter SMA20 (Bearish)');
    }
    
    if (currentRSI < 30) {
      signalStrength += 1;
      reasons.push(`RSI bei ${currentRSI.toFixed(1)} (Überverkauft)`);
    } else if (currentRSI > 70) {
      signalStrength -= 1;
      reasons.push(`RSI bei ${currentRSI.toFixed(1)} (Überkauft)`);
    }
    
    const priceChange7d = ((prices[prices.length - 1] - prices[prices.length - 7]) / prices[prices.length - 7]) * 100;
    if (priceChange7d > 5) {
      signalStrength += 1;
      reasons.push(`+${priceChange7d.toFixed(1)}% in 7 Tagen (Starker Aufwärtstrend)`);
    } else if (priceChange7d < -5) {
      signalStrength -= 1;
      reasons.push(`${priceChange7d.toFixed(1)}% in 7 Tagen (Starker Abwärtstrend)`);
    }
    
    if (signalStrength >= 2) {
      generatedSignal = 'KAUFEN';
    } else if (signalStrength <= -2) {
      generatedSignal = 'VERKAUFEN';
    }
    
    setSignal({
      type: generatedSignal,
      strength: Math.abs(signalStrength),
      reasons: reasons
    });
    
    setIndicators({
      sma7: currentSMA7,
      sma20: currentSMA20,
      rsi: currentRSI,
      priceChange7d: priceChange7d
    });
  };

  const calculateSMA = (prices, period) => {
    const sma = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sma.push(null);
      } else {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }
    return sma;
  };

  const calculateRSI = (prices, period = 14) => {
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }
    
    const gains = changes.slice(-period).map(c => c > 0 ? c : 0);
    const losses = changes.slice(-period).map(c => c < 0 ? Math.abs(c) : 0);
    
    const avgGain = gains.reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return rsi;
  };

  useEffect(() => {
    fetchBitcoinData();
    
    const interval = setInterval(() => {
      fetchBitcoinData();
    }, 300000);
    
    return () => clearInterval(interval);
  }, []);

  const getSignalColor = () => {
    if (signal?.type === 'KAUFEN') return '#00ff88';
    if (signal?.type === 'VERKAUFEN') return '#ff4444';
    return '#ffa500';
  };

  const getSignalIcon = () => {
    if (signal?.type === 'KAUFEN') return <TrendingUp size={48} />;
    if (signal?.type === 'VERKAUFEN') return <TrendingDown size={48} />;
    return <Activity size={48} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-400 font-mono">Lade Bitcoin-Daten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md">
          <AlertCircle className="text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-red-400 mb-2">Fehler beim Laden</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button 
            onClick={fetchBitcoinData}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-500 to-cyan-400 bg-clip-text text-transparent mb-2 font-sans">
            ₿ Bitcoin Trading Signale
          </h1>
          <p className="text-gray-400 font-mono text-sm">
            Automatische Analyse mit technischen Indikatoren
          </p>
          {lastUpdate && (
            <p className="text-gray-500 text-xs mt-2 font-mono">
              Letzte Aktualisierung: {lastUpdate.toLocaleTimeString('de-DE')}
            </p>
          )}
        </header>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-300 font-mono">Aktueller BTC Preis</h2>
              <DollarSign className="text-orange-500" size={24} />
            </div>
            <div className="text-4xl font-bold text-white mb-2">
              ${currentPrice?.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-sm font-mono ${indicators.priceChange7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {indicators.priceChange7d >= 0 ? '+' : ''}{indicators.priceChange7d?.toFixed(2)}% (7 Tage)
            </div>
          </div>

          <div 
            className="bg-slate-800/50 backdrop-blur border rounded-xl p-6 transition-all"
            style={{ borderColor: getSignalColor() }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-300 font-mono">Trading Signal</h2>
              {getSignalIcon()}
            </div>
            <div 
              className="text-4xl font-bold mb-2"
              style={{ color: getSignalColor() }}
            >
              {signal?.type}
            </div>
            <div className="text-sm text-gray-400 font-mono">
              Signalstärke: {signal?.strength}/3
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-200 mb-4 font-mono">
            Preisverlauf & Moving Averages (30 Tage)
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={btcData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                style={{ fontSize: '12px', fontFamily: 'monospace' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '12px', fontFamily: 'monospace' }}
                tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  fontFamily: 'monospace'
                }}
                formatter={(value) => [`$${value.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`, '']}
              />
              <Legend 
                wrapperStyle={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="#f97316" 
                strokeWidth={3}
                dot={false}
                name="BTC Preis"
              />
              <Line 
                type="monotone" 
                dataKey="sma7" 
                stroke="#00ff88" 
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                name="SMA 7"
              />
              <Line 
                type="monotone" 
                dataKey="sma20" 
                stroke="#00d9ff" 
                strokeWidth={2}
                dot={false}
                strokeDasharray="5 5"
                name="SMA 20"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h3 className="text-sm text-gray-400 font-mono mb-2">SMA 7 Tage</h3>
            <div className="text-2xl font-bold text-green-400">
              ${indicators.sma7?.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h3 className="text-sm text-gray-400 font-mono mb-2">SMA 20 Tage</h3>
            <div className="text-2xl font-bold text-cyan-400">
              ${indicators.sma20?.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h3 className="text-sm text-gray-400 font-mono mb-2">RSI (14)</h3>
            <div className={`text-2xl font-bold ${
              indicators.rsi < 30 ? 'text-green-400' : 
              indicators.rsi > 70 ? 'text-red-400' : 
              'text-orange-400'
            }`}>
              {indicators.rsi?.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {indicators.rsi < 30 ? 'Überverkauft' : 
               indicators.rsi > 70 ? 'Überkauft' : 
               'Neutral'}
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-200 mb-4 font-mono">
            Analyse-Faktoren
          </h2>
          <ul className="space-y-2">
            {signal?.reasons.map((reason, index) => (
              <li key={index} className="flex items-start text-gray-300 font-mono text-sm">
                <span className="text-orange-500 mr-2">▹</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-xl p-6 text-center">
          <AlertCircle className="text-yellow-500 mx-auto mb-3" size={32} />
          <h3 className="text-lg font-bold text-yellow-400 mb-2">⚠️ Wichtiger Hinweis</h3>
          <p className="text-gray-300 text-sm font-mono max-w-3xl mx-auto">
            Dies ist keine Finanzberatung! Diese App dient nur zu Lern- und Demonstrationszwecken. 
            Trading mit echtem Geld birgt erhebliche Risiken. Investiere nur Geld, das du bereit bist zu verlieren. 
            Führe immer deine eigene Recherche durch und konsultiere einen Finanzberater.
          </p>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={fetchBitcoinData}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition font-mono"
          >
            🔄 Daten aktualisieren
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
