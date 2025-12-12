import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CryptoPortfolioTracker = () => {
  const INITIAL_INVESTMENT = 500;
  const COIN_ALLOCATION = 100;
  const TARGET_MULTIPLIER = 5;
  const TRACKING_DAYS = 180;
  
  // BASELINE: December 11, 2025 11:37 PM Eastern Time
  const START_DATE = new Date('2025-12-11T23:37:00-05:00');
  
  // FIXED BASELINE PRICES - Everyone sees same performance from these prices
  const BASELINE_PRICES = {
    'arbitrum': { price: 0.2113, change24h: 0 },           // ARB
    'optimism': { price: 0.3111, change24h: 0 },           // OP
    'celestia': { price: 0.5897, change24h: 0 },           // TIA
    'injective-protocol': { price: 5.56, change24h: 0 },   // INJ
    'render-token': { price: 1.61, change24h: 0 }          // RENDER
  };
  
  const coins = [
    { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum', color: '#28A0F0' },
    { id: 'optimism', symbol: 'OP', name: 'Optimism', color: '#FF0420' },
    { id: 'celestia', symbol: 'TIA', name: 'Celestia', color: '#7B61FF' },
    { id: 'injective-protocol', symbol: 'INJ', name: 'Injective', color: '#00F2FE' },
    { id: 'render-token', symbol: 'RENDER', name: 'Render', color: '#E84855' }
  ];

  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const fetchPrices = async () => {
    try {
      const ids = coins.map((c) => c.id).join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
      );
      const data = await response.json();
      
      const formattedPrices = {};
      coins.forEach((coin) => {
        if (data[coin.id]) {
          formattedPrices[coin.id] = {
            price: data[coin.id].usd,
            change24h: data[coin.id].usd_24h_change || 0
          };
        }
      });
      
      setPrices(formattedPrices);
      setLastUpdate(new Date());
      
      const timestamp = Date.now();
      setPriceHistory((prev) => {
        const newEntry = { timestamp };
        coins.forEach((coin) => {
          if (formattedPrices[coin.id]) {
            newEntry[coin.symbol] = formattedPrices[coin.id].price;
          }
        });
        return [...prev.slice(-50), newEntry];
      });
      
      setLoading(false);
      setError(null);
    } catch (err) {
      setError('Failed to fetch prices');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const priceInterval = setInterval(fetchPrices, 60000);
    const timeInterval = setInterval(() => setCurrentTime(Date.now()), 1000);
    
    return () => {
      clearInterval(priceInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const calculatePortfolioValue = () => {
    let total = 0;
    coins.forEach((coin) => {
      if (prices[coin.id]) {
        const holdings = COIN_ALLOCATION / BASELINE_PRICES[coin.id].price;
        total += holdings * prices[coin.id].price;
      }
    });
    return total;
  };

  const calculateCoinValue = (coinId) => {
    if (!prices[coinId]) return 0;
    const holdings = COIN_ALLOCATION / BASELINE_PRICES[coinId].price;
    return holdings * prices[coinId].price;
  };

  const calculatePerformance = (coinId) => {
    if (!prices[coinId]) return 0;
    return ((prices[coinId].price - BASELINE_PRICES[coinId].price) / BASELINE_PRICES[coinId].price) * 100;
  };

  const getTimeRemaining = () => {
    const endDate = new Date(START_DATE.getTime() + (TRACKING_DAYS * 24 * 60 * 60 * 1000));
    const remaining = endDate.getTime() - currentTime;
    
    if (remaining <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }
    
    const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds, total: remaining };
  };

  const portfolioValue = calculatePortfolioValue();
  const portfolioPerformance = ((portfolioValue - INITIAL_INVESTMENT) / INITIAL_INVESTMENT) * 100;
  const targetValue = INITIAL_INVESTMENT * TARGET_MULTIPLIER;
  const timeRemaining = getTimeRemaining();

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #0a0e27 0%, #1a1d3a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Space Mono", monospace',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '48px',
            marginBottom: '20px',
            animation: 'pulse 2s infinite'
          }}>⚡</div>
          <div style={{ fontSize: '20px', opacity: 0.7 }}>LOADING PORTFOLIO DATA</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1d3a 100%)',
      padding: '40px 20px',
      fontFamily: '"Space Mono", monospace',
      color: '#fff'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Orbitron:wght@900&display=swap');
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes glow {
          0%, 100% { text-shadow: 0 0 20px rgba(0, 217, 255, 0.5); }
          50% { text-shadow: 0 0 40px rgba(0, 217, 255, 0.8); }
        }
        
        .coin-card {
          animation: slideIn 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .coin-card:nth-child(1) { animation-delay: 0.1s; }
        .coin-card:nth-child(2) { animation-delay: 0.2s; }
        .coin-card:nth-child(3) { animation-delay: 0.3s; }
        .coin-card:nth-child(4) { animation-delay: 0.4s; }
        .coin-card:nth-child(5) { animation-delay: 0.5s; }
      `}</style>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <header style={{ marginBottom: '60px', textAlign: 'center' }}>
          <h1 style={{ 
            fontFamily: '"Orbitron", sans-serif',
            fontSize: '72px',
            fontWeight: '900',
            margin: '0 0 20px 0',
            background: 'linear-gradient(45deg, #00D9FF, #7B61FF, #FF6B35)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '4px',
            animation: 'glow 3s infinite'
          }}>
            5X OR BUST
          </h1>
          <p style={{ 
            fontSize: '18px',
            opacity: 0.7,
            letterSpacing: '2px'
          }}>
            HIGH-RISK CRYPTO PORTFOLIO TRACKER
          </p>
        </header>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '30px',
          marginBottom: '60px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(0, 217, 255, 0.3)',
            borderRadius: '20px',
            padding: '30px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ 
              fontSize: '14px', 
              opacity: 0.6, 
              marginBottom: '10px',
              letterSpacing: '1px'
            }}>
              PORTFOLIO VALUE
            </div>
            <div style={{ 
              fontSize: '48px', 
              fontWeight: '700',
              color: portfolioValue >= INITIAL_INVESTMENT ? '#00FF88' : '#FF4444'
            }}>
              ${portfolioValue.toFixed(2)}
            </div>
            <div style={{ 
              fontSize: '20px',
              marginTop: '10px',
              color: portfolioPerformance >= 0 ? '#00FF88' : '#FF4444'
            }}>
              {portfolioPerformance >= 0 ? '▲' : '▼'} {Math.abs(portfolioPerformance).toFixed(2)}%
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(123, 97, 255, 0.3)',
            borderRadius: '20px',
            padding: '30px'
          }}>
            <div style={{ 
              fontSize: '14px', 
              opacity: 0.6, 
              marginBottom: '10px',
              letterSpacing: '1px'
            }}>
              TARGET (5X)
            </div>
            <div style={{ fontSize: '48px', fontWeight: '700' }}>
              ${targetValue.toFixed(2)}
            </div>
            <div style={{ 
              fontSize: '16px',
              marginTop: '10px',
              opacity: 0.7
            }}>
              {((portfolioValue / targetValue) * 100).toFixed(1)}% THERE
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 107, 53, 0.3)',
            borderRadius: '20px',
            padding: '30px'
          }}>
            <div style={{ 
              fontSize: '14px', 
              opacity: 0.6, 
              marginBottom: '10px',
              letterSpacing: '1px'
            }}>
              TIME REMAINING
            </div>
            <div style={{ 
              fontSize: '36px', 
              fontWeight: '700',
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px',
              justifyContent: 'center'
            }}>
              <div>
                <span style={{ fontSize: '48px' }}>{timeRemaining.days}</span>
                <span style={{ fontSize: '16px', opacity: 0.7 }}>d</span>
              </div>
              <div>
                <span style={{ fontSize: '48px' }}>{timeRemaining.hours}</span>
                <span style={{ fontSize: '16px', opacity: 0.7 }}>h</span>
              </div>
              <div>
                <span style={{ fontSize: '48px' }}>{timeRemaining.minutes}</span>
                <span style={{ fontSize: '16px', opacity: 0.7 }}>m</span>
              </div>
            </div>
            <div style={{ 
              fontSize: '16px',
              marginTop: '10px',
              opacity: 0.7
            }}>
              OF 180 DAYS
            </div>
          </div>
        </div>

        {priceHistory.length > 1 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '60px'
          }}>
            <h2 style={{ 
              fontSize: '24px',
              marginBottom: '30px',
              letterSpacing: '2px',
              fontWeight: '700'
            }}>
              LIVE PRICE CHART
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={priceHistory}>
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                  stroke="#666"
                />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(10, 14, 39, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '10px',
                    fontFamily: '"Space Mono", monospace'
                  }}
                />
                <Legend />
                {coins.map((coin) => (
                  <Line
                    key={coin.id}
                    type="monotone"
                    dataKey={coin.symbol}
                    stroke={coin.color}
                    strokeWidth={2}
                    dot={false}
                    name={coin.symbol}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '30px',
          marginBottom: '40px'
        }}>
          {coins.map((coin, index) => {
            const coinValue = calculateCoinValue(coin.id);
            const performance = calculatePerformance(coin.id);
            const current = prices[coin.id];
            
            return (
              <div 
                key={coin.id}
                className="coin-card"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  border: `2px solid ${coin.color}40`,
                  borderRadius: '20px',
                  padding: '30px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${coin.color}20, transparent)`,
                  filter: 'blur(30px)'
                }} />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '20px'
                  }}>
                    <div>
                      <div style={{ 
                        fontSize: '28px',
                        fontWeight: '700',
                        color: coin.color,
                        marginBottom: '5px'
                      }}>
                        {coin.symbol}
                      </div>
                      <div style={{ fontSize: '14px', opacity: 0.6 }}>
                        {coin.name}
                      </div>
                    </div>
                    <div style={{ 
                      background: current?.change24h >= 0 ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                      color: current?.change24h >= 0 ? '#00FF88' : '#FF4444',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '700'
                    }}>
                      {current?.change24h >= 0 ? '▲' : '▼'} {Math.abs(current?.change24h || 0).toFixed(2)}%
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', opacity: 0.6, marginBottom: '5px' }}>
                      CURRENT PRICE
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '700' }}>
                      ${current?.price.toFixed(4)}
                    </div>
                  </div>

                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '15px'
                  }}>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '5px' }}>
                        VALUE
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '700' }}>
                        ${coinValue.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '5px' }}>
                        PERFORMANCE
                      </div>
                      <div style={{ 
                        fontSize: '20px',
                        fontWeight: '700',
                        color: performance >= 0 ? '#00FF88' : '#FF4444'
                      }}>
                        {performance >= 0 ? '+' : ''}{performance.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <footer style={{ 
          textAlign: 'center',
          opacity: 0.5,
          fontSize: '14px',
          marginTop: '60px',
          paddingTop: '30px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ marginBottom: '10px' }}>
            Last Update: {lastUpdate?.toLocaleTimeString()}
          </div>
          <div>
            ⚠️ This is a high-risk portfolio. Only invest what you can afford to lose. ⚠️
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px' }}>
            Data from CoinGecko API • Updates every 60 seconds
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CryptoPortfolioTracker;
