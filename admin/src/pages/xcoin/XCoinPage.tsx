import React, { useState, useEffect, useCallback } from 'react';
import { Coins, ArrowUpRight, ArrowDownRight, RefreshCw, Activity, ShieldCheck } from 'lucide-react';
import { adminApi } from '../../api/adminApi';

interface ChartPoint {
  time: string;
  price: number;
}

interface XCoinMarketData {
  currentPrice: number;
  currentPriceFormatted: string;
  change24h: string;
  isPositive: boolean;
  buyPrice: string;
  sellPrice: string;
  volume24h: number;
  volume24hFormatted: string;
  totalSupply: string;
  circulatingSupply: string;
  marketStatus: string;
  timeframe: string;
  chartPoints: ChartPoint[];
  settings?: {
    minBuy: number;
    maxBuy: number;
    minSell: number;
    maxSell: number;
  };
}

export const XCoinPage: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'1H' | '24H' | '1W' | '1M' | '1Y'>('24H');
  const [loading, setLoading] = useState(true);
  const [marketData, setMarketData] = useState<XCoinMarketData | null>(null);

  const [minBuy, setMinBuy] = useState('100');
  const [maxBuy, setMaxBuy] = useState('100000');
  const [minSell, setMinSell] = useState('100');
  const [maxSell, setMaxSell] = useState('100000');
  const [isUpdating, setIsUpdating] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const fetchMarketData = useCallback(async (selectedTimeframe: string) => {
    try {
      setLoading(true);
      const res = await adminApi.getXCoinMarketData(selectedTimeframe);
      if (res && res.data) {
        setMarketData(res.data);
        if (res.data.settings) {
          setMinBuy(String(res.data.settings.minBuy ?? 100));
          setMaxBuy(String(res.data.settings.maxBuy ?? 100000));
          setMinSell(String(res.data.settings.minSell ?? 100));
          setMaxSell(String(res.data.settings.maxSell ?? 100000));
        }
      }
    } catch (err) {
      console.error('Failed to load xCoin market data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData(timeframe);
  }, [timeframe, fetchMarketData]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await adminApi.updateXCoinSettings({
        minBuy: Number(minBuy),
        maxBuy: Number(maxBuy),
        minSell: Number(minSell),
        maxSell: Number(maxSell),
      });
      setSavedMessage('Market trading limits updated successfully!');
      setTimeout(() => setSavedMessage(''), 4000);
    } catch (err: any) {
      console.error('Failed to update market settings:', err);
      setSavedMessage(err?.message || 'Failed to update settings');
      setTimeout(() => setSavedMessage(''), 4000);
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper to construct dynamic SVG path from chartPoints
  const renderChartSvg = () => {
    const points = marketData?.chartPoints || [];
    if (points.length === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', color: '#94A3B8' }}>
          No chart data available
        </div>
      );
    }

    const width = 700;
    const height = 180;
    const padding = 20;

    const prices = points.map((p) => p.price);
    const minP = Math.min(...prices) * 0.998;
    const maxP = Math.max(...prices) * 1.002;
    const range = maxP - minP || 1;

    const coords = points.map((p, idx) => {
      const x = padding + (idx / (points.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((p.price - minP) / range) * (height - 2 * padding);
      return { x, y, price: p.price, time: p.time };
    });

    // Build smooth bezier curve
    let pathD = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const areaPathD = `${pathD} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;
    const lastCoord = coords[coords.length - 1];

    return (
      <div style={{ width: '100%', height: '200px' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <linearGradient id="zapAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          <line x1="0" y1="35" x2={width} y2="35" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="0" y1="75" x2={width} y2="75" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="0" y1="115" x2={width} y2="115" stroke="#F1F5F9" strokeWidth="1" />
          <line x1="0" y1="155" x2={width} y2="155" stroke="#F1F5F9" strokeWidth="1" />

          {/* Area Fill */}
          <path d={areaPathD} fill="url(#zapAreaGradient)" />

          {/* Stroke Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#2563EB"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Last Price Indicator Dot */}
          <circle cx={lastCoord.x} cy={lastCoord.y} r="5.5" fill="#2563EB" stroke="#FFFFFF" strokeWidth="2.5" />
        </svg>

        {/* Dynamic X-Axis Labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8', fontWeight: '700', marginTop: '8px' }}>
          {coords.map((c, i) => (
            <span key={i}>{c.time}</span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.4px', margin: 0 }}>
            xCoin / Market
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748B', fontWeight: '500', margin: '4px 0 0' }}>
            Manage real-time xCoin pricing, reserve valuation, limits, and market engine parameters.
          </p>
        </div>

        <button
          onClick={() => fetchMarketData(timeframe)}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: '12.5px', fontWeight: '700' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Engine
        </button>
      </div>

      {/* Top Price Bar Card */}
      <div className="card" style={{ padding: '20px 28px', marginBottom: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          {/* Current xCoin Price */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D97706',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.15)'
            }}>
              <Coins size={24} />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>Current xCoin Price</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.5px' }}>
                  {marketData ? marketData.currentPriceFormatted : '₹ 108.37'}
                </span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: marketData?.isPositive !== false ? '#16A34A' : '#DC2626' }}>
                  {marketData ? marketData.change24h : '↑ 2.4% (24h)'}
                </span>
              </div>
            </div>
          </div>

          {/* Buy Price */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 20px',
            backgroundColor: '#EFF6FF',
            borderRadius: '12px'
          }}>
            <ArrowDownRight size={20} color="#2563EB" />
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Buy Price</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#2563EB' }}>
                {marketData ? marketData.buyPrice : '₹ 109.20'}
              </div>
            </div>
          </div>

          {/* Sell Price */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 20px',
            backgroundColor: '#FFF7ED',
            borderRadius: '12px'
          }}>
            <ArrowUpRight size={20} color="#EA580C" />
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Sell Price</div>
              <div style={{ fontSize: '18px', fontWeight: '900', color: '#EA580C' }}>
                {marketData ? marketData.sellPrice : '₹ 107.50'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {savedMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          backgroundColor: savedMessage.includes('Failed') ? '#FEE2E2' : '#DCFCE7',
          color: savedMessage.includes('Failed') ? '#DC2626' : '#16A34A',
          fontSize: '13px',
          fontWeight: '700',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <ShieldCheck size={16} />
          {savedMessage}
        </div>
      )}

      {/* Two Column Layout: Market Chart (Left) + Market Settings (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '22px' }}>
        
        {/* Left: Market Chart Card */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#2563EB" />
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', margin: 0 }}>Market Chart</h3>
              </div>
              <div style={{ display: 'flex', backgroundColor: '#F1F5F9', borderRadius: '8px', padding: '3px', gap: '2px' }}>
                {(['1H', '24H', '1W', '1M', '1Y'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: timeframe === t ? '#2563EB' : 'transparent',
                      color: timeframe === t ? '#FFFFFF' : '#64748B',
                      fontSize: '11px',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic SVG Area Chart */}
            {renderChartSvg()}
          </div>

          {/* Bottom Metrics Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            paddingTop: '20px',
            marginTop: '16px',
            borderTop: '1px solid #F1F5F9'
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>24h Volume</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>
                {marketData ? marketData.volume24hFormatted : '₹ 12.4 L'}
              </div>
              <div style={{ fontSize: '10.5px', color: '#16A34A', fontWeight: '700' }}>
                {marketData ? marketData.change24h : '↑ 8.4%'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Total xCoin Supply</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>
                {marketData ? marketData.totalSupply : '10.0 M'}
              </div>
              <div style={{ fontSize: '10.5px', color: '#16A34A', fontWeight: '700' }}>
                ↑ 1.2%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Circulating Supply</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>
                {marketData ? marketData.circulatingSupply : '8.4 M'}
              </div>
              <div style={{ fontSize: '10.5px', color: '#16A34A', fontWeight: '700' }}>
                ↑ 2.1%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>Market Status</div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#16A34A' }}>
                {marketData ? marketData.marketStatus : 'Active'}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Market Settings Card */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginBottom: '18px' }}>
            Market Settings
          </h3>

          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Min Buy Amount
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '10px', fontSize: '13px', fontWeight: '700', color: '#64748B' }}>₹</span>
                <input
                  type="number"
                  className="form-input"
                  style={{ paddingLeft: '28px', height: '42px', fontSize: '13.5px' }}
                  value={minBuy}
                  onChange={(e) => setMinBuy(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Max Buy Amount
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '10px', fontSize: '13px', fontWeight: '700', color: '#64748B' }}>₹</span>
                <input
                  type="number"
                  className="form-input"
                  style={{ paddingLeft: '28px', height: '42px', fontSize: '13.5px' }}
                  value={maxBuy}
                  onChange={(e) => setMaxBuy(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Min Sell Amount
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '10px', fontSize: '13px', fontWeight: '700', color: '#64748B' }}>₹</span>
                <input
                  type="number"
                  className="form-input"
                  style={{ paddingLeft: '28px', height: '42px', fontSize: '13.5px' }}
                  value={minSell}
                  onChange={(e) => setMinSell(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#475569', display: 'block', marginBottom: '6px' }}>
                Max Sell Amount
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '10px', fontSize: '13px', fontWeight: '700', color: '#64748B' }}>₹</span>
                <input
                  type="number"
                  className="form-input"
                  style={{ paddingLeft: '28px', height: '42px', fontSize: '13.5px' }}
                  value={maxSell}
                  onChange={(e) => setMaxSell(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdating}
              className="btn btn-primary"
              style={{
                height: '44px',
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '13.5px',
                marginTop: '6px'
              }}
            >
              {isUpdating ? 'Saving...' : 'Update Settings'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
