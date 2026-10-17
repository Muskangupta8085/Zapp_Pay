import React from 'react';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Download, TrendingUp, DollarSign, Users } from 'lucide-react';
import { Colors } from '../../constants/colors';

export const AnalyticsPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Platform revenue statistics, fee capture, deposit vs payout ratios, and exportable ledger statements"
        badge="Financial Reporting"
        badgeType="emerald"
        actionButton={
          <button className="btn btn-primary btn-sm">
            <Download size={14} /> Export Financial Ledger (CSV)
          </button>
        }
      />

      <div className="stat-grid">
        <StatCard
          label="Total Monthly Revenue"
          value="₹ 18,92,400"
          change="+32.4%"
          subtext="From exchange spreads & fees"
          icon={TrendingUp}
          iconColor={Colors.primary}
        />
        <StatCard
          label="Gross Deposits (INR)"
          value="₹ 1.48 Cr"
          change="+19.2%"
          subtext="Processed through UPI & IMPS"
          icon={DollarSign}
          iconColor={Colors.success}
        />
        <StatCard
          label="Gross Withdrawals (INR)"
          value="₹ 92.40 L"
          change="+14.0%"
          subtext="Settled to user bank accounts"
          icon={DollarSign}
          iconColor={Colors.info}
        />
        <StatCard
          label="New KYC Submissions"
          value="842"
          change="+45 today"
          subtext="91.4% approval rate"
          icon={Users}
          iconColor={Colors.primaryLight}
        />
      </div>

      {/* Visual summaries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: Colors.textPrimary, marginBottom: '16px' }}>
            Volume Distribution by Asset
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { name: 'ZapCoin Native (xCoin)', pct: '62%', color: Colors.primary },
              { name: 'Tether USD (USDT)', pct: '24%', color: Colors.success },
              { name: 'Bitcoin (BTC)', pct: '9%', color: Colors.warning },
              { name: 'Ethereum (ETH)', pct: '5%', color: Colors.primaryLight },
            ].map((asset) => (
              <div key={asset.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: Colors.textPrimary, fontWeight: '700' }}>{asset.name}</span>
                  <span style={{ color: asset.color, fontWeight: '800' }}>{asset.pct}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#F4F7FE', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: asset.pct, height: '100%', backgroundColor: asset.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: Colors.textPrimary, marginBottom: '16px' }}>
            Deposit Channel Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { name: 'UPI Instant VPA (GPay / PhonePe)', pct: '74%', color: Colors.primary },
              { name: 'Static QR Deposit', pct: '18%', color: Colors.info },
              { name: 'Direct IMPS Bank Transfer', pct: '8%', color: Colors.primaryLight },
            ].map((channel) => (
              <div key={channel.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: Colors.textPrimary, fontWeight: '700' }}>{channel.name}</span>
                  <span style={{ color: channel.color, fontWeight: '800' }}>{channel.pct}</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#F4F7FE', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{ width: channel.pct, height: '100%', backgroundColor: channel.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
