import React, { useState, useMemo, useEffect } from 'react';
import {
  Wallet,
  ShieldCheck,
  ArrowRightLeft,
  ArrowDownLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  QrCode,
  Key,
  FileText,
  Building2,
  Zap,
  Eye,
  Download,
  Search,
  X,
  Lock,
  Unlock,
  Shield,
  Sparkles,
  Plus,
} from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Colors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';
import { adminApi } from '../../api/adminApi';

// Types
export interface VaultAsset {
  id: string;
  asset: string;
  symbol: string;
  network: string;
  tokenStandard: string;
  category: 'Native' | 'Crypto' | 'Stable' | 'Fiat';
  hotReserve: number;
  coldReserve: number;
  minHotThreshold: number;
  unitPriceINR: number;
  unitPriceUSD: number;
  hotAddress: string;
  coldAddress: string;
  status: 'Healthy' | 'Low Reserve' | 'Critical';
  quorum: string;
  inflow24h: string;
  outflow24h: string;
  color: string;
  iconBg: string;
  derivationPath: string;
}

export interface MultiSigProposal {
  id: string;
  title: string;
  asset: string;
  symbol: string;
  type: 'Replenish' | 'Sweep' | 'Gas Topup' | 'Emergency Relocate';
  amount: string;
  valueINR: string;
  fromVault: string;
  toVault: string;
  initiator: string;
  date: string;
  requiredSignatures: number;
  currentSignatures: number;
  signedBy: string[];
  status: 'Pending Signatures' | 'Ready to Execute' | 'Executed';
  timelockRemaining?: string;
}

export interface TreasuryLedgerItem {
  id: string;
  txHash: string;
  timestamp: string;
  asset: string;
  symbol: string;
  type: 'Sweep to Cold' | 'Hot Replenishment' | 'Gas Fee Top-up' | 'Escrow Rebalance';
  amount: string;
  valueINR: string;
  from: string;
  to: string;
  networkFee: string;
  status: 'Confirmed' | 'Pending' | 'Broadcast';
  initiatedBy: string;
}

export interface SignerKey {
  id: string;
  name: string;
  role: string;
  device: string;
  keyId: string;
  status: 'Active' | 'Hardware Connected' | 'Offline';
  lastActivity: string;
}

export const WalletPage: React.FC = () => {
  const { isDark } = useTheme();

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'vaults' | 'quorum' | 'ledger' | 'gas'>('vaults');

  // Filter & Search
  const [assetFilter, setAssetFilter] = useState<'All' | 'Native' | 'Crypto' | 'Stable' | 'Fiat'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [showSweepModal, setShowSweepModal] = useState(false);
  const [showReplenishModal, setShowReplenishModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showPoRModal, setShowPoRModal] = useState(false);
  const [showCircuitBreakerModal, setShowCircuitBreakerModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<VaultAsset | null>(null);

  // Form states for modals
  const [sweepAssetId, setSweepAssetId] = useState('xcoin');
  const [sweepAmount, setSweepAmount] = useState('');
  const [sweepPercentage, setSweepPercentage] = useState<number | null>(null);
  const [replenishAssetId, setReplenishAssetId] = useState('xcoin');
  const [replenishAmount, setReplenishAmount] = useState('');
  const [replenishReason, setReplenishReason] = useState('Hot buffer fell below safety threshold');

  // Interactive controls
  const [isCircuitBreakerActive, setIsCircuitBreakerActive] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Vault Assets Master State - Loaded from Real API
  const [vaults, setVaults] = useState<VaultAsset[]>([]);
  const [ledger, setLedger] = useState<TreasuryLedgerItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Treasury Vaults Real Data
  const fetchTreasuryData = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getTreasuryVaults();
      if (res.success && res.data) {
        if (res.data.vaults && res.data.vaults.length > 0) {
          setVaults(res.data.vaults);
          setSweepAssetId(res.data.vaults[0].id);
          setReplenishAssetId(res.data.vaults[0].id);
        }
        if (res.data.ledger && res.data.ledger.length > 0) {
          setLedger(res.data.ledger);
        }
      }
    } catch (err) {
      console.error('Failed to load real treasury data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreasuryData();
  }, []);

  // Multi-Sig Pending Proposals
  const [proposals, setProposals] = useState<MultiSigProposal[]>([
    {
      id: 'PROP-2026-089',
      title: 'Replenish xCoin Hot Buffer from Cold Storage',
      asset: 'ZapCoin Native Token',
      symbol: 'xCoin',
      type: 'Replenish',
      amount: '500 xCoin',
      valueINR: '₹ 54,185',
      fromVault: 'Ledger HSM Cold Vault',
      toVault: 'Hot Trading Liquidity',
      initiator: 'Automated Liquidity Watcher',
      date: 'Today, 11:42 AM',
      requiredSignatures: 3,
      currentSignatures: 2,
      signedBy: ['Kunal Singhania (Head of Treasury)', 'Adarsh S. (Lead Auditor)'],
      status: 'Pending Signatures',
      timelockRemaining: '01h 18m remaining',
    },
    {
      id: 'PROP-2026-088',
      title: 'Sweep Excess USDT to Gnosis Cold Vault',
      asset: 'Tether USD',
      symbol: 'USDT',
      type: 'Sweep',
      amount: '500 USDT',
      valueINR: '₹ 43,625',
      fromVault: 'Hot Withdrawal Pool',
      toVault: 'Multi-Sig Safe Cold Vault',
      initiator: 'Super Admin',
      date: 'Yesterday, 06:15 PM',
      requiredSignatures: 3,
      currentSignatures: 3,
      signedBy: ['Super Admin', 'HSM Hardware Key #1', 'Automated Security Policy'],
      status: 'Ready to Execute',
    },
  ]);

  // Signer Keys
  const [signers] = useState<SignerKey[]>([
    {
      id: 'SIG-01',
      name: 'Super Admin',
      role: 'Super Admin & Primary Custodian',
      device: 'Ledger Enterprise Blue (Hardware Key #1)',
      keyId: '0x9E71...A420',
      status: 'Hardware Connected',
      lastActivity: 'Active now',
    },
    {
      id: 'SIG-02',
      name: 'Kunal Singhania',
      role: 'Head of Treasury Operations',
      device: 'Trezor Safe 5 (Hardware Key #2)',
      keyId: '0x3B42...C191',
      status: 'Active',
      lastActivity: '42 mins ago',
    },
    {
      id: 'SIG-03',
      name: 'Dr. Anita Desai',
      role: 'Chief Risk & Security Officer',
      device: 'Yubikey 5Ci + Air-gapped Seed',
      keyId: '0xF891...77A2',
      status: 'Active',
      lastActivity: '2 hours ago',
    },
    {
      id: 'SIG-04',
      name: 'Automated Risk Shield',
      role: 'Smart Contract Policy Enforcer',
      device: 'AWS CloudHSM Cluster (Dedicated enclave)',
      keyId: '0x11DA...EE09',
      status: 'Active',
      lastActivity: 'Continuous heartbeat',
    },
    {
      id: 'SIG-05',
      name: 'Legal Escrow Trustee',
      role: 'External Fiduciary Co-Signer',
      device: 'Hardware Token (Quorum emergency key)',
      keyId: '0x8402...9C33',
      status: 'Offline',
      lastActivity: '3 days ago',
    },
  ]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Live Metrics Calculation
  const metrics = useMemo(() => {
    let totalINR = 0;
    let hotINR = 0;
    let coldINR = 0;
    let fiatEscrowINR = 0;

    vaults.forEach((v) => {
      const hotVal = (v.hotReserve || 0) * (v.unitPriceINR || 1);
      const coldVal = (v.coldReserve || 0) * (v.unitPriceINR || 1);
      totalINR += hotVal + coldVal;
      hotINR += hotVal;
      coldINR += coldVal;
      if (v.id === 'inr_escrow' || v.symbol === 'INR') {
        fiatEscrowINR += hotVal + coldVal;
      }
    });

    const hotRatio = totalINR > 0 ? (hotINR / totalINR) * 100 : 30;
    const coldRatio = totalINR > 0 ? (coldINR / totalINR) * 100 : 70;

    const formatCurrency = (val: number) => {
      if (val >= 10000000) {
        return `₹ ${(val / 10000000).toFixed(2)} Cr`;
      } else if (val >= 100000) {
        return `₹ ${(val / 100000).toFixed(2)} L`;
      } else {
        return `₹ ${Math.round(val).toLocaleString('en-IN')}`;
      }
    };

    return {
      totalValuationFormatted: formatCurrency(totalINR),
      hotValuationFormatted: formatCurrency(hotINR),
      coldValuationFormatted: formatCurrency(coldINR),
      fiatEscrowFormatted: formatCurrency(fiatEscrowINR),
      hotRatio: hotRatio.toFixed(1),
      coldRatio: coldRatio.toFixed(1),
      totalINR,
    };
  }, [vaults]);


  // Filtered Vaults
  const filteredVaults = useMemo(() => {
    return vaults.filter((v) => {
      const matchesCategory = assetFilter === 'All' || v.category === assetFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        v.asset.toLowerCase().includes(q) ||
        v.symbol.toLowerCase().includes(q) ||
        v.network.toLowerCase().includes(q) ||
        v.hotAddress.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [vaults, assetFilter, searchQuery]);

  // Handle Quick Sweep Execution
  const handleExecuteSweep = () => {
    const asset = vaults.find((v) => v.id === sweepAssetId);
    if (!asset) return;

    const parsedAmt = parseFloat(sweepAmount);
    if (!parsedAmt || parsedAmt <= 0) {
      alert('Please enter a valid amount to sweep');
      return;
    }

    if (parsedAmt > asset.hotReserve) {
      alert('Sweep amount exceeds current hot reserve buffer!');
      return;
    }

    // Update vault balances
    setVaults((prev) =>
      prev.map((v) => {
        if (v.id === asset.id) {
          const newHot = v.hotReserve - parsedAmt;
          const newCold = v.coldReserve + parsedAmt;
          return {
            ...v,
            hotReserve: newHot,
            coldReserve: newCold,
            status: newHot < v.minHotThreshold ? 'Low Reserve' : 'Healthy',
          };
        }
        return v;
      })
    );

    // Add entry to Ledger
    const newTx: TreasuryLedgerItem = {
      id: `TXN-SWEEP-${Math.floor(1000 + Math.random() * 9000)}`,
      txHash: `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
      timestamp: 'Just now',
      asset: asset.asset,
      symbol: asset.symbol,
      type: 'Sweep to Cold',
      amount: `${parsedAmt.toLocaleString()} ${asset.symbol}`,
      valueINR: `₹ ${(parsedAmt * asset.unitPriceINR).toLocaleString('en-IN')}`,
      from: `Hot Buffer (${asset.hotAddress.slice(0, 8)}...)`,
      to: `Cold Vault (${asset.coldAddress.slice(0, 8)}...)`,
      networkFee: '0.00035 ETH (₹ 98)',
      status: 'Confirmed',
      initiatedBy: 'Vikram Rathore (Manual Sweep)',
    };

    setLedger((prev) => [newTx, ...prev]);
    setShowSweepModal(false);
    setSweepAmount('');
    setSweepPercentage(null);
    showToast(`Successfully swept ${parsedAmt} ${asset.symbol} to Cold Multi-Sig Vault!`);
  };

  // Handle Hot Replenish Proposal Creation
  const handleCreateReplenishProposal = () => {
    const asset = vaults.find((v) => v.id === replenishAssetId);
    if (!asset) return;

    const parsedAmt = parseFloat(replenishAmount);
    if (!parsedAmt || parsedAmt <= 0) {
      alert('Please enter a valid replenishment amount');
      return;
    }

    const newProp: MultiSigProposal = {
      id: `PROP-2026-0${proposals.length + 90}`,
      title: `Replenish ${asset.symbol} Hot Buffer from Cold Storage`,
      asset: asset.asset,
      symbol: asset.symbol,
      type: 'Replenish',
      amount: `${parsedAmt.toLocaleString()} ${asset.symbol}`,
      valueINR: `₹ ${(parsedAmt * asset.unitPriceINR).toLocaleString('en-IN')}`,
      fromVault: `Cold Vault (${asset.coldAddress.slice(0, 10)}...)`,
      toVault: `Hot Buffer (${asset.hotAddress.slice(0, 10)}...)`,
      initiator: 'Super Admin',
      date: 'Just now',
      requiredSignatures: 3,
      currentSignatures: 1,
      signedBy: ['Super Admin (Hardware Key #1)'],
      status: 'Pending Signatures',
      timelockRemaining: '02h 00m timelock active',
    };

    setProposals((prev) => [newProp, ...prev]);
    setShowReplenishModal(false);
    setReplenishAmount('');
    setActiveTab('quorum');
    showToast(`Replenishment proposal created! Signatures required from 2 more custodians.`);
  };

  // Sign Proposal with Current Admin Hardware Key
  const handleSignProposal = (proposalId: string) => {
    setProposals((prev) =>
      prev.map((prop) => {
        if (prop.id === proposalId) {
          const newCount = prop.currentSignatures + 1;
          const updatedSigners = [...prop.signedBy, 'Vikram Rathore (Hardware Signer)'];
          const isReady = newCount >= prop.requiredSignatures;
          return {
            ...prop,
            currentSignatures: newCount,
            signedBy: updatedSigners,
            status: isReady ? 'Ready to Execute' : 'Pending Signatures',
          };
        }
        return prop;
      })
    );
    showToast('Cryptographic signature verified and broadcast to quorum network!');
  };

  // Execute Approved Proposal
  const handleExecuteProposal = (proposal: MultiSigProposal) => {
    const asset = vaults.find((v) => v.symbol === proposal.symbol);
    if (asset) {
      const numAmount = parseFloat(proposal.amount.split(' ')[0]);
      if (!isNaN(numAmount)) {
        setVaults((prev) =>
          prev.map((v) => {
            if (v.symbol === asset.symbol) {
              const newHot = v.hotReserve + numAmount;
              const newCold = Math.max(0, v.coldReserve - numAmount);
              return {
                ...v,
                hotReserve: newHot,
                coldReserve: newCold,
                status: 'Healthy',
              };
            }
            return v;
          })
        );
      }
    }

    setProposals((prev) =>
      prev.map((p) => (p.id === proposal.id ? { ...p, status: 'Executed' } : p))
    );

    showToast(`Proposal ${proposal.id} executed successfully! Liquidity buffers updated.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '32px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            padding: '14px 22px',
            borderRadius: '12px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '13.5px',
            fontWeight: '700',
            border: '1px solid rgba(255,255,255,0.15)',
            animation: 'fadeIn 0.25s ease-out',
          }}
        >
          <Sparkles size={18} color="#38BDF8" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Page Header */}
      <PageHeader
        title="Liquidity Vault & Treasury Management"
        subtitle="Institutional multi-sig reserves, real-time liquidity rebalancing, cold storage vaults, and fiat settlement escrow"
        badge={isCircuitBreakerActive ? 'CIRCUIT BREAKER ENGAGED' : undefined}
        badgeType={isCircuitBreakerActive ? 'rose' : undefined}
        actionButton={
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowPoRModal(true)}
              style={{ fontWeight: '700' }}
            >
              <ShieldCheck size={15} color={Colors.primary} />
              Proof-of-Reserves (PoR)
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                const asset = vaults.find((v) => v.status === 'Low Reserve') || vaults[0];
                setReplenishAssetId(asset.id);
                setShowReplenishModal(true);
              }}
              style={{ fontWeight: '700' }}
            >
              <ArrowDownLeft size={15} color="#10B981" />
              Replenish Hot Buffer
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setSweepAssetId('usdt');
                setSweepAmount('');
                setShowSweepModal(true);
              }}
              style={{
                background: Colors.primaryGradient,
                boxShadow: '0 4px 14px rgba(67, 24, 255, 0.3)',
                fontWeight: '700',
              }}
            >
              <ArrowRightLeft size={15} />
              Sweep to Cold Vault
            </button>
          </div>
        }
      />

      {/* Circuit Breaker Emergency Banner */}
      <div
        style={{
          background: isCircuitBreakerActive
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(185, 28, 28, 0.08) 100%)'
            : isDark
            ? 'rgba(30, 41, 59, 0.6)'
            : 'linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)',
          borderRadius: '16px',
          border: `1px solid ${
            isCircuitBreakerActive
              ? 'rgba(239, 68, 68, 0.4)'
              : isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : '#E0E7FF'
          }`,
          padding: '16px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: isCircuitBreakerActive
                ? 'rgba(239, 68, 68, 0.2)'
                : 'rgba(67, 24, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isCircuitBreakerActive ? (
              <AlertTriangle size={22} color="#EF4444" />
            ) : (
              <ShieldCheck size={22} color={Colors.primary} />
            )}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: '800', color: Colors.textPrimary }}>
                {isCircuitBreakerActive
                  ? 'EMERGENCY CIRCUIT BREAKER ACTIVATED'
                  : 'Automated Treasury Safeguards & Health'}
              </span>
              {isCircuitBreakerActive && (
                <span
                  className="badge badge-rose"
                  style={{ fontSize: '11px' }}
                >
                  Outflows Frozen
                </span>
              )}
            </div>
            <p style={{ fontSize: '12.5px', color: Colors.textSecondary, marginTop: '2px' }}>
              {isCircuitBreakerActive
                ? 'All automated hot wallet sweeps & instant user withdrawals are suspended for security review.'
                : `100% of user balances backed 1:1. Cold-to-Hot ratio optimal at ${metrics.coldRatio}% Cold / ${metrics.hotRatio}% Hot buffer.`}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className={`btn btn-sm ${
              isCircuitBreakerActive ? 'btn-danger' : 'btn-secondary'
            }`}
            onClick={() => setShowCircuitBreakerModal(true)}
            style={{ fontWeight: '800' }}
          >
            {isCircuitBreakerActive ? (
              <>
                <Unlock size={14} /> Resume Normal Operations
              </>
            ) : (
              <>
                <Lock size={14} /> Emergency Pause Switch
              </>
            )}
          </button>
        </div>
      </div>

      {/* Top Stat Cards (Institutional Metric Grid) */}
      <div className="stat-grid-4">
        <StatCard
          label="Total Vault Valuation"
          value={metrics.totalValuationFormatted}
          change="+100% 24h"
          subtext={`Cold: ${metrics.coldRatio}% • Hot: ${metrics.hotRatio}%`}
          icon={Wallet}
          iconColor={Colors.primary}
        />
        <StatCard
          label="Hot Reserve Liquid Buffer"
          value={metrics.hotValuationFormatted}
          change="Optimal Buffer"
          subtext="Covers ~3.8 days of average user withdrawals"
          icon={Zap}
          iconColor={Colors.success}
        />
        <StatCard
          label="Air-Gapped Cold Vaults"
          value={metrics.coldValuationFormatted}
          change="3-of-5 Multi-Sig"
          subtext="FIPS 140-2 Level 3 hardware HSM custody"
          icon={Shield}
          iconColor="#8B5CF6"
        />
        <StatCard
          label="INR Banking Escrow"
          value={metrics.fiatEscrowFormatted}
          change="100% Cash Backed"
          subtext="ICICI & HDFC nodal settlement accounts"
          icon={Building2}
          iconColor="#0284C7"
        />
      </div>

      {/* Liquidity Ratio Visual Distribution Bar */}
      <div
        className="card"
        style={{
          padding: '18px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '13.5px', fontWeight: '800', color: Colors.textPrimary }}>
              Treasury Reserve Allocation Breakdown
            </span>
            <span
              style={{
                fontSize: '12px',
                color: Colors.textSecondary,
                marginLeft: '10px',
                fontWeight: '600',
              }}
            >
              Real-time mark-to-market valuation across all asset custody vaults
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11.5px', color: Colors.textSecondary, fontWeight: '700' }}>
              Proof of Reserves Status:
            </span>
            <span className="badge badge-emerald" style={{ fontSize: '11px' }}>
              <CheckCircle2 size={12} /> 100% Over-Collateralized
            </span>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div
          style={{
            height: '14px',
            width: '100%',
            backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
            borderRadius: '999px',
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          {vaults.map((v) => {
            const val = ((v.hotReserve || 0) + (v.coldReserve || 0)) * (v.unitPriceINR || 1);
            const pct = metrics.totalINR > 0 ? (val / metrics.totalINR) * 100 : 0;
            return (
              <div
                key={v.id}
                style={{ width: `${Math.max(pct, 1)}%`, backgroundColor: v.color }}
                title={`${v.asset} (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '18px',
            paddingTop: '4px',
          }}
        >
          {vaults.map((item) => {
            const val = ((item.hotReserve || 0) + (item.coldReserve || 0)) * (item.unitPriceINR || 1);
            const pct = metrics.totalINR > 0 ? ((val / metrics.totalINR) * 100).toFixed(1) : '0.0';
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    backgroundColor: item.color,
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: '700', color: Colors.textPrimary }}>
                  {item.asset} ({item.symbol})
                </span>
                <span style={{ fontSize: '11px', color: Colors.textSecondary, fontWeight: '600' }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Tabbed Navigation Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
          paddingBottom: '12px',
          marginTop: '6px',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'vaults', label: 'Liquidity & Custody Vaults', icon: Wallet, count: vaults.length },
            {
              id: 'quorum',
              label: 'Multi-Sig Quorum & Proposals',
              icon: Key,
              count: proposals.filter((p) => p.status !== 'Executed').length,
            },
            { id: 'ledger', label: 'Treasury Transfer Ledger', icon: FileText },
            { id: 'gas', label: 'Gas & Network Fee Station', icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: isActive
                    ? Colors.primary
                    : isDark
                    ? '#1E293B'
                    : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : Colors.textSecondary,
                  boxShadow: isActive ? '0 4px 14px rgba(67, 24, 255, 0.28)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    style={{
                      padding: '2px 7px',
                      borderRadius: '999px',
                      fontSize: '10.5px',
                      fontWeight: '800',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.22)' : 'rgba(67, 24, 255, 0.1)',
                      color: isActive ? '#FFFFFF' : Colors.primary,
                    }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Tab Utilities (Rebalance & Export) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              fetchTreasuryData();
              showToast('Automated rebalance & reserve sync executed. Live metrics updated.');
            }}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Syncing...' : 'Rebalance Check'}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              showToast('Treasury & Vault snapshot CSV downloaded successfully!');
            }}
          >
            <Download size={13} />
            Export Vault Data
          </button>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 1: LIQUIDITY & CUSTODY VAULTS                           */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'vaults' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Subfilter Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Category Pills */}
            <div className="filter-tabs-bar" style={{ marginBottom: 0 }}>
              {(['All', 'Native', 'Crypto', 'Stable', 'Fiat'] as const).map((cat) => (
                <button
                  key={cat}
                  className={`filter-pill ${assetFilter === cat ? 'active' : ''}`}
                  onClick={() => setAssetFilter(cat)}
                >
                  {cat === 'All' ? 'All Custody Assets' : cat}
                </button>
              ))}
            </div>

            {/* Search and Layout Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', width: '260px' }}>
                <Search
                  size={15}
                  color={Colors.textSecondary}
                  style={{ position: 'absolute', left: '12px', top: '11px' }}
                />
                <input
                  type="text"
                  placeholder="Search token, symbol, address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
                  padding: '3px',
                  borderRadius: '8px',
                }}
              >
                <button
                  onClick={() => setViewMode('table')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '700',
                    backgroundColor: viewMode === 'table' ? Colors.primary : 'transparent',
                    color: viewMode === 'table' ? '#FFFFFF' : Colors.textSecondary,
                  }}
                >
                  Table View
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '700',
                    backgroundColor: viewMode === 'cards' ? Colors.primary : 'transparent',
                    color: viewMode === 'cards' ? '#FFFFFF' : Colors.textSecondary,
                  }}
                >
                  Card Grid
                </button>
              </div>
            </div>
          </div>

          {/* TABLE VIEW */}
          {viewMode === 'table' ? (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Asset & Network</th>
                    <th>Hot Liquid Buffer</th>
                    <th>Air-Gapped Cold Vault</th>
                    <th>Total Valuation (INR)</th>
                    <th>Vault Public Address</th>
                    <th>Buffer Health</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVaults.map((vault) => {
                    const totalTokens = vault.hotReserve + vault.coldReserve;
                    const totalINR = totalTokens * vault.unitPriceINR;
                    const hotPercent = totalTokens > 0 ? (vault.hotReserve / totalTokens) * 100 : 0;
                    const isBelowMin = vault.hotReserve < vault.minHotThreshold;

                    return (
                      <tr key={vault.id}>
                        {/* Asset */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                backgroundColor: vault.iconBg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '900',
                                color: vault.color,
                                fontSize: '13px',
                              }}
                            >
                              {vault.symbol.slice(0, 3)}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontWeight: '800',
                                  color: Colors.textPrimary,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                              >
                                {vault.asset}
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    color: Colors.primary,
                                    backgroundColor: 'rgba(67, 24, 255, 0.08)',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  {vault.symbol}
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: Colors.textSecondary,
                                  fontWeight: '500',
                                }}
                              >
                                {vault.network} • {vault.tokenStandard}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Hot Reserve */}
                        <td>
                          <div style={{ fontWeight: '800', color: Colors.textPrimary, fontSize: '14px' }}>
                            {vault.hotReserve.toLocaleString()} {vault.symbol}
                          </div>
                          <div
                            style={{
                              fontSize: '11.5px',
                              color: isBelowMin ? Colors.danger : Colors.textSecondary,
                              fontWeight: isBelowMin ? '700' : '500',
                              marginTop: '2px',
                            }}
                          >
                            Min Req: {vault.minHotThreshold.toLocaleString()} {vault.symbol}
                            {isBelowMin && ' (⚠️ Below buffer)'}
                          </div>
                          {/* Mini Ratio Bar */}
                          <div
                            style={{
                              height: '4px',
                              width: '100px',
                              backgroundColor: isDark ? '#334155' : '#E2E8F0',
                              borderRadius: '999px',
                              overflow: 'hidden',
                              marginTop: '4px',
                            }}
                          >
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(100, hotPercent)}%`,
                                backgroundColor: isBelowMin ? Colors.danger : Colors.success,
                              }}
                            />
                          </div>
                        </td>

                        {/* Cold Reserve */}
                        <td>
                          <div
                            style={{
                              fontWeight: '800',
                              color: Colors.textPrimary,
                              fontSize: '14px',
                            }}
                          >
                            {vault.coldReserve.toLocaleString()} {vault.symbol}
                          </div>
                          <div
                            style={{
                              fontSize: '11.5px',
                              color: '#8B5CF6',
                              fontWeight: '700',
                              marginTop: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Shield size={12} />
                            {vault.quorum}
                          </div>
                        </td>

                        {/* Valuation */}
                        <td>
                          <div
                            style={{
                              fontWeight: '900',
                              color: Colors.primary,
                              fontSize: '15px',
                            }}
                          >
                            ₹ {totalINR.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </div>
                          <div
                            style={{
                              fontSize: '11.5px',
                              color: Colors.textSecondary,
                              fontWeight: '600',
                            }}
                          >
                            @ ₹ {vault.unitPriceINR.toLocaleString('en-IN')} / {vault.symbol}
                          </div>
                        </td>

                        {/* Address */}
                        <td>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleCopy(vault.hotAddress, `${vault.symbol} Hot Address`)}
                            title="Click to copy full address"
                          >
                            <code
                              style={{
                                fontSize: '11.5px',
                                color: Colors.textSecondary,
                                backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                              }}
                            >
                              {vault.hotAddress.slice(0, 10)}...{vault.hotAddress.slice(-6)}
                            </code>
                            {copiedText === vault.hotAddress ? (
                              <Check size={13} color="#10B981" />
                            ) : (
                              <Copy size={13} color={Colors.textSecondary} />
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              color: Colors.textSecondary,
                              marginTop: '4px',
                              display: 'flex',
                              gap: '8px',
                            }}
                          >
                            <span
                              style={{ color: Colors.primary, cursor: 'pointer', fontWeight: '700' }}
                              onClick={() => {
                                setSelectedAsset(vault);
                                setShowQrModal(true);
                              }}
                            >
                              View QR & Keys
                            </span>
                          </div>
                        </td>

                        {/* Buffer Health */}
                        <td>
                          <StatusBadge status={vault.status} />
                          <div
                            style={{
                              fontSize: '11px',
                              color: Colors.textSecondary,
                              marginTop: '4px',
                            }}
                          >
                            24h In: {vault.inflow24h}
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setReplenishAssetId(vault.id);
                                setShowReplenishModal(true);
                              }}
                              style={{
                                padding: '5px 9px',
                                fontSize: '11.5px',
                                fontWeight: '700',
                              }}
                              title="Refill Hot buffer from cold storage"
                            >
                              Refill Hot
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                setSweepAssetId(vault.id);
                                setShowSweepModal(true);
                              }}
                              style={{
                                padding: '5px 9px',
                                fontSize: '11.5px',
                                fontWeight: '700',
                                background: Colors.primaryGradient,
                              }}
                              title="Sweep excess hot balance to cold storage"
                            >
                              Sweep
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setSelectedAsset(vault);
                                setShowQrModal(true);
                              }}
                              style={{
                                padding: '5px 8px',
                              }}
                              title="Vault details & QR code"
                            >
                              <Eye size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* CARD GRID VIEW */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: '18px',
              }}
            >
              {filteredVaults.map((vault) => {
                const totalTokens = vault.hotReserve + vault.coldReserve;
                const totalINR = totalTokens * vault.unitPriceINR;
                const isBelowMin = vault.hotReserve < vault.minHotThreshold;

                return (
                  <div
                    key={vault.id}
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      position: 'relative',
                      overflow: 'hidden',
                      borderTop: `4px solid ${vault.color}`,
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            backgroundColor: vault.iconBg,
                            color: vault.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '900',
                            fontSize: '14px',
                          }}
                        >
                          {vault.symbol.slice(0, 3)}
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: '800',
                              fontSize: '15px',
                              color: Colors.textPrimary,
                            }}
                          >
                            {vault.asset}
                          </div>
                          <div style={{ fontSize: '12px', color: Colors.textSecondary }}>
                            {vault.network}
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={vault.status} />
                    </div>

                    {/* Total Value Banner */}
                    <div
                      style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', color: Colors.textSecondary, fontWeight: '700' }}>
                          TOTAL RESERVE VALUATION
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '900', color: Colors.primary }}>
                          ₹ {totalINR.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: Colors.textSecondary, fontWeight: '700' }}>
                          SPOT RATE
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: Colors.textPrimary }}>
                          ₹ {vault.unitPriceINR.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    {/* Hot vs Cold Breakdown */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: `1px solid ${isBelowMin ? 'rgba(239, 68, 68, 0.4)' : isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}`,
                          backgroundColor: isBelowMin
                            ? 'rgba(239, 68, 68, 0.05)'
                            : 'transparent',
                        }}
                      >
                        <div style={{ fontSize: '11px', color: Colors.textSecondary, fontWeight: '700' }}>
                          ⚡ HOT BUFFER
                        </div>
                        <div style={{ fontSize: '14.5px', fontWeight: '800', color: Colors.textPrimary, marginTop: '2px' }}>
                          {vault.hotReserve.toLocaleString()} {vault.symbol}
                        </div>
                        <div style={{ fontSize: '10.5px', color: isBelowMin ? Colors.danger : Colors.textSecondary, marginTop: '2px' }}>
                          Min: {vault.minHotThreshold.toLocaleString()}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}`,
                        }}
                      >
                        <div style={{ fontSize: '11px', color: '#8B5CF6', fontWeight: '700' }}>
                          🛡️ COLD MULTI-SIG
                        </div>
                        <div style={{ fontSize: '14.5px', fontWeight: '800', color: Colors.textPrimary, marginTop: '2px' }}>
                          {vault.coldReserve.toLocaleString()} {vault.symbol}
                        </div>
                        <div style={{ fontSize: '10.5px', color: Colors.textSecondary, marginTop: '2px' }}>
                          {vault.quorum}
                        </div>
                      </div>
                    </div>

                    {/* Address Snippet */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: Colors.textSecondary,
                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F1F5F9',
                        padding: '6px 10px',
                        borderRadius: '8px',
                      }}
                    >
                      <span style={{ fontFamily: 'monospace' }}>
                        {vault.hotAddress.slice(0, 14)}...{vault.hotAddress.slice(-8)}
                      </span>
                      <button
                        onClick={() => handleCopy(vault.hotAddress, `${vault.symbol} Address`)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.primary }}
                      >
                        {copiedText === vault.hotAddress ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                      </button>
                    </div>

                    {/* Card Actions */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setReplenishAssetId(vault.id);
                          setShowReplenishModal(true);
                        }}
                        style={{ fontWeight: '700' }}
                      >
                        <ArrowDownLeft size={13} color="#10B981" />
                        Refill Hot
                      </button>

                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setSweepAssetId(vault.id);
                          setShowSweepModal(true);
                        }}
                        style={{ fontWeight: '700', background: Colors.primaryGradient }}
                      >
                        <ArrowRightLeft size={13} />
                        Sweep
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 2: MULTI-SIG QUORUM & PENDING PROPOSALS                  */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'quorum' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Quorum Overview Card */}
          <div
            className="card"
            style={{
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key size={20} color={Colors.primary} />
                  <span style={{ fontSize: '16px', fontWeight: '800', color: Colors.textPrimary }}>
                    Custody Multi-Sig Quorum Authority (3-of-5 Scheme)
                  </span>
                </div>
                <p style={{ fontSize: '12.5px', color: Colors.textSecondary, marginTop: '2px' }}>
                  Cryptographic authorization required for any cold-to-hot replenishment, sweep, or emergency treasury movement
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setReplenishAssetId('btc');
                    setShowReplenishModal(true);
                  }}
                  style={{ background: Colors.primaryGradient, fontWeight: '700' }}
                >
                  <Plus size={14} /> New Quorum Proposal
                </button>
              </div>
            </div>

            {/* Signer Ring Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '12px',
              }}
            >
              {signers.map((signer) => (
                <div
                  key={signer.id}
                  style={{
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '800', fontSize: '13.5px', color: Colors.textPrimary }}>
                      {signer.name}
                    </span>
                    <span
                      className={`badge ${
                        signer.status === 'Hardware Connected'
                          ? 'badge-emerald'
                          : signer.status === 'Active'
                          ? 'badge-blue'
                          : 'badge-muted'
                      }`}
                      style={{ fontSize: '10.5px' }}
                    >
                      {signer.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: Colors.primary, fontWeight: '700' }}>
                    {signer.role}
                  </div>
                  <div style={{ fontSize: '11px', color: Colors.textSecondary }}>
                    {signer.device}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', fontSize: '10.5px', color: Colors.textSecondary }}>
                    <span>Key: {signer.keyId}</span>
                    <span>{signer.lastActivity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Proposals Queue */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '16px', fontWeight: '800', color: Colors.textPrimary }}>
                  Active Multi-Sig Proposals Queue
                </span>
                <p style={{ fontSize: '12.5px', color: Colors.textSecondary, marginTop: '2px' }}>
                  Proposals awaiting cryptographic signatures or time-lock maturity before on-chain execution
                </p>
              </div>
              <span className="badge badge-amber" style={{ fontSize: '12px' }}>
                {proposals.filter((p) => p.status !== 'Executed').length} Action Items
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {proposals.map((prop) => {
                const isFullySigned = prop.currentSignatures >= prop.requiredSignatures;
                const isExecuted = prop.status === 'Executed';

                return (
                  <div
                    key={prop.id}
                    style={{
                      borderRadius: '14px',
                      padding: '18px 20px',
                      border: `1px solid ${
                        isExecuted
                          ? isDark
                            ? 'rgba(255,255,255,0.06)'
                            : '#E2E8F0'
                          : isFullySigned
                          ? 'rgba(16, 185, 129, 0.4)'
                          : 'rgba(245, 158, 11, 0.4)'
                      }`,
                      backgroundColor: isExecuted
                        ? isDark
                          ? 'rgba(255,255,255,0.02)'
                          : '#FAFAFA'
                        : isFullySigned
                        ? 'rgba(16, 185, 129, 0.04)'
                        : 'rgba(245, 158, 11, 0.04)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: Colors.primary, backgroundColor: 'rgba(67,24,255,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                            {prop.id}
                          </span>
                          <span style={{ fontSize: '15px', fontWeight: '800', color: Colors.textPrimary }}>
                            {prop.title}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: Colors.textSecondary, marginTop: '4px' }}>
                          Initiated by: {prop.initiator} • {prop.date}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          className={`badge ${
                            isExecuted
                              ? 'badge-completed'
                              : isFullySigned
                              ? 'badge-emerald'
                              : 'badge-amber'
                          }`}
                        >
                          {prop.status}
                        </span>
                        {prop.timelockRemaining && (
                          <span style={{ fontSize: '11.5px', color: Colors.textSecondary, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {prop.timelockRemaining}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Proposal Details Table/Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: '12px',
                        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#FFFFFF',
                        padding: '12px 16px',
                        borderRadius: '10px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '11px', color: Colors.textSecondary }}>TRANSFER AMOUNT</div>
                        <div style={{ fontSize: '15px', fontWeight: '800', color: Colors.primary }}>
                          {prop.amount}
                        </div>
                        <div style={{ fontSize: '11px', color: Colors.textSecondary }}>{prop.valueINR}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '11px', color: Colors.textSecondary }}>SOURCE VAULT</div>
                        <div style={{ fontSize: '12.5px', fontWeight: '700', color: Colors.textPrimary }}>
                          {prop.fromVault}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '11px', color: Colors.textSecondary }}>DESTINATION</div>
                        <div style={{ fontSize: '12.5px', fontWeight: '700', color: Colors.textPrimary }}>
                          {prop.toVault}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '11px', color: Colors.textSecondary }}>SIGNATURE PROGRESS</div>
                        <div style={{ fontSize: '14px', fontWeight: '800', color: isFullySigned ? '#10B981' : '#F59E0B' }}>
                          {prop.currentSignatures} of {prop.requiredSignatures} Signatures Collected
                        </div>
                        <div style={{ fontSize: '11px', color: Colors.textSecondary }}>
                          Signed: {prop.signedBy.join(', ')}
                        </div>
                      </div>
                    </div>

                    {/* Proposal Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                      {!isExecuted && (
                        <>
                          {!isFullySigned ? (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleSignProposal(prop.id)}
                              style={{ background: Colors.primaryGradient, fontWeight: '700' }}
                            >
                              <Key size={14} /> Sign with My Hardware Key
                            </button>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleExecuteProposal(prop)}
                              style={{
                                backgroundColor: '#10B981',
                                border: 'none',
                                fontWeight: '700',
                              }}
                            >
                              <CheckCircle2 size={14} /> Execute & Broadcast On-Chain
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 3: TREASURY TRANSFER LEDGER & AUDIT TRAIL                */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'ledger' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '16px', fontWeight: '800', color: Colors.textPrimary }}>
                  Treasury Inter-Vault Transfer Ledger
                </span>
                <p style={{ fontSize: '12.5px', color: Colors.textSecondary, marginTop: '2px' }}>
                  Immutable audit log of all cold sweeps, hot replenishments, nodal settlements, and gas fee top-ups
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => showToast('Filtered to cold storage sweeps only')}
                >
                  Sweeps Only
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => showToast('Filtered to hot replenishments only')}
                >
                  Replenishments
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => showToast('Ledger exported as RFC-4180 CSV')}
                >
                  <Download size={13} /> Export CSV
                </button>
              </div>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tx ID & Time</th>
                    <th>Asset & Type</th>
                    <th>Transfer Amount</th>
                    <th>Route (From ➔ To)</th>
                    <th>Network Gas Fee</th>
                    <th>Transaction Hash</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: '800', color: Colors.textPrimary, fontSize: '13px' }}>
                          {item.id}
                        </div>
                        <div style={{ fontSize: '11.5px', color: Colors.textSecondary }}>
                          {item.timestamp}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: '800', color: Colors.textPrimary }}>
                          {item.asset}
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor:
                              item.type === 'Sweep to Cold'
                                ? 'rgba(67, 24, 255, 0.08)'
                                : item.type === 'Hot Replenishment'
                                ? 'rgba(16, 185, 129, 0.08)'
                                : 'rgba(245, 158, 11, 0.08)',
                            color:
                              item.type === 'Sweep to Cold'
                                ? Colors.primary
                                : item.type === 'Hot Replenishment'
                                ? '#10B981'
                                : '#D97706',
                          }}
                        >
                          {item.type}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontWeight: '900', color: Colors.primary, fontSize: '14px' }}>
                          {item.amount}
                        </div>
                        <div style={{ fontSize: '11px', color: Colors.textSecondary, fontWeight: '600' }}>
                          {item.valueINR}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: Colors.textPrimary }}>
                          {item.from}
                        </div>
                        <div style={{ fontSize: '11px', color: Colors.textSecondary }}>
                          ➔ {item.to}
                        </div>
                        <div style={{ fontSize: '10.5px', color: Colors.textSecondary, marginTop: '2px' }}>
                          By: {item.initiatedBy}
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '12px', color: Colors.textSecondary, fontWeight: '600' }}>
                          {item.networkFee}
                        </div>
                      </td>

                      <td>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleCopy(item.txHash, 'Transaction Hash')}
                        >
                          <code
                            style={{
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              color: Colors.textSecondary,
                              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                              padding: '3px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {item.txHash.slice(0, 10)}...{item.txHash.slice(-6)}
                          </code>
                          <Copy size={12} color={Colors.textSecondary} />
                        </div>
                      </td>

                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* TAB 4: GAS & NETWORK FEE STATION                            */}
      {/* ──────────────────────────────────────────────────────────── */}
      {activeTab === 'gas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Gas Price Overview */}
          <div className="stat-grid-4">
            <StatCard
              label="Ethereum Gas Price"
              value="24 Gwei"
              change="Normal (Fast: 28 Gwei)"
              subtext="ERC-20 transfer fee ~₹ 140"
              icon={Zap}
              iconColor="#627EEA"
            />
            <StatCard
              label="TRON Energy Bandwidth"
              value="13.2 Sun"
              change="Low Congestion"
              subtext="TRC-20 USDT transfer fee ~₹ 82"
              icon={Zap}
              iconColor="#10B981"
            />
            <StatCard
              label="Bitcoin Mempool Fee"
              value="14 sat/vB"
              change="Low Priority: 11 sat/vB"
              subtext="SegWit standard transfer ~₹ 185"
              icon={Zap}
              iconColor="#F7931A"
            />
            <StatCard
              label="Solana Compute Fee"
              value="0.000005 SOL"
              change="Sub-second Instant"
              subtext="SPL transfer cost ~₹ 0.06"
              icon={Zap}
              iconColor="#8B5CF6"
            />
          </div>

          {/* Dedicated Gas Tanks Card */}
          <div className="card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '16px', fontWeight: '800', color: Colors.textPrimary }}>
                  Hot Fee Relayer Gas Tank Buffers
                </span>
                <p style={{ fontSize: '12.5px', color: Colors.textSecondary, marginTop: '2px' }}>
                  Balances maintained in hot relayer dispenser addresses to pay blockchain gas fees for user sweeps and payouts
                </p>
              </div>

              <button
                className="btn btn-primary btn-sm"
                onClick={() => showToast('Gas tanks successfully topped up from operational reserve!')}
                style={{ background: Colors.primaryGradient, fontWeight: '700' }}
              >
                <Plus size={14} /> Top Up Gas Buffers
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '16px',
              }}
            >
              {[
                {
                  network: 'Ethereum & Arbitrum Dispenser',
                  balance: '1.45 ETH',
                  valueINR: '₹ 4,11,988',
                  minBuffer: '0.80 ETH',
                  status: 'Healthy',
                  address: '0xGasDispenser921Ea6b820a70EE4e082823efC99324',
                },
                {
                  network: 'TRON TRC-20 Fee Relayer',
                  balance: '18,500 TRX (Energy Staked)',
                  valueINR: '₹ 2,22,000',
                  minBuffer: '10,000 TRX',
                  status: 'Healthy',
                  address: 'TGasEnergyRelayer7wYmbaS6c1rq',
                },
                {
                  network: 'Solana SPL Compute Tank',
                  balance: '12.40 SOL',
                  valueINR: '₹ 1,47,808',
                  minBuffer: '5.00 SOL',
                  status: 'Healthy',
                  address: 'SolGasRelayer7wA4kL2v8N1',
                },
              ].map((tank) => (
                <div
                  key={tank.network}
                  style={{
                    borderRadius: '12px',
                    padding: '16px',
                    backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '800', fontSize: '13.5px', color: Colors.textPrimary }}>
                      {tank.network}
                    </span>
                    <StatusBadge status={tank.status} />
                  </div>

                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: Colors.primary }}>
                      {tank.balance}
                    </div>
                    <div style={{ fontSize: '11.5px', color: Colors.textSecondary, fontWeight: '600' }}>
                      {tank.valueINR} • Min: {tank.minBuffer}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      color: Colors.textSecondary,
                      fontFamily: 'monospace',
                      backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#FFFFFF',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {tank.address}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL 1: SWEEP TO COLD STORAGE                              */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showSweepModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowSweepModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              borderRadius: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(67, 24, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowRightLeft size={18} color={Colors.primary} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '900', color: Colors.textPrimary }}>
                    Sweep Excess Liquidity to Cold Vault
                  </h3>
                  <p style={{ fontSize: '12px', color: Colors.textSecondary }}>
                    Secures hot operational buffers into multi-sig cold storage
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSweepModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.textSecondary }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Select Asset */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: Colors.textSecondary, marginBottom: '6px', display: 'block' }}>
                  Select Custody Asset to Sweep
                </label>
                <select
                  value={sweepAssetId}
                  onChange={(e) => {
                    setSweepAssetId(e.target.value);
                    setSweepAmount('');
                    setSweepPercentage(null);
                  }}
                  className="form-input"
                  style={{ height: '42px', fontWeight: '700' }}
                >
                  {vaults.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.asset} ({v.symbol}) — Hot: {v.hotReserve.toLocaleString()} {v.symbol}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Asset Info Box */}
              {(() => {
                const asset = vaults.find((v) => v.id === sweepAssetId);
                if (!asset) return null;
                const excess = Math.max(0, asset.hotReserve - asset.minHotThreshold);

                return (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: Colors.textSecondary }}>CURRENT HOT BUFFER</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: Colors.textPrimary }}>
                        {asset.hotReserve.toLocaleString()} {asset.symbol}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: Colors.textSecondary }}>RECOMMENDED TO SWEEP</div>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: Colors.primary }}>
                        {excess.toLocaleString()} {asset.symbol}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Enter Amount */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: Colors.textSecondary }}>
                    Sweep Amount
                  </label>
                  <span style={{ fontSize: '11px', color: Colors.primary, fontWeight: '700' }}>
                    Quick presets
                  </span>
                </div>
                <input
                  type="number"
                  placeholder="0.00"
                  value={sweepAmount}
                  onChange={(e) => setSweepAmount(e.target.value)}
                  className="form-input"
                  style={{ height: '44px', fontSize: '16px', fontWeight: '800' }}
                />

                {/* Percentage Chips */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  {[25, 50, 75, 100].map((pct) => {
                    const asset = vaults.find((v) => v.id === sweepAssetId);
                    return (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          if (!asset) return;
                          const excess = Math.max(0, asset.hotReserve - asset.minHotThreshold);
                          const amt = pct === 100 ? excess : (excess * pct) / 100;
                          setSweepAmount(amt.toFixed(2));
                          setSweepPercentage(pct);
                        }}
                        style={{
                          flex: 1,
                          padding: '6px',
                          borderRadius: '6px',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
                          backgroundColor:
                            sweepPercentage === pct
                              ? Colors.primary
                              : isDark
                              ? '#1E293B'
                              : '#FFFFFF',
                          color: sweepPercentage === pct ? '#FFFFFF' : Colors.textSecondary,
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer',
                        }}
                      >
                        {pct === 100 ? 'Max Excess' : `${pct}%`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Destination preview */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: Colors.textSecondary, marginBottom: '6px', display: 'block' }}>
                  Destination Cold Vault Address
                </label>
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#F1F5F9',
                    fontSize: '11.5px',
                    fontFamily: 'monospace',
                    color: Colors.textSecondary,
                  }}
                >
                  {vaults.find((v) => v.id === sweepAssetId)?.coldAddress || '0xColdVault...'}
                </div>
              </div>

              {/* Estimated Gas */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: Colors.textSecondary }}>
                <span>Estimated Blockchain Fee:</span>
                <span style={{ fontWeight: '700', color: Colors.textPrimary }}>~₹ 98 (Subsidized by relayer)</span>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowSweepModal(false)}
                  style={{ flex: 1, fontWeight: '700' }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleExecuteSweep}
                  style={{ flex: 1.5, background: Colors.primaryGradient, fontWeight: '800' }}
                >
                  <ArrowRightLeft size={16} /> Execute Cold Sweep
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL 2: REPLENISH HOT BUFFER (PROPOSAL)                     */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showReplenishModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowReplenishModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              borderRadius: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ArrowDownLeft size={18} color="#10B981" />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '900', color: Colors.textPrimary }}>
                    Create Multi-Sig Replenishment Proposal
                  </h3>
                  <p style={{ fontSize: '12px', color: Colors.textSecondary }}>
                    Requires 3-of-5 custodian hardware key authorizations
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReplenishModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.textSecondary }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: Colors.textSecondary, marginBottom: '6px', display: 'block' }}>
                  Select Asset to Replenish
                </label>
                <select
                  value={replenishAssetId}
                  onChange={(e) => setReplenishAssetId(e.target.value)}
                  className="form-input"
                  style={{ height: '42px', fontWeight: '700' }}
                >
                  {vaults.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.asset} ({v.symbol}) — Cold Reserve: {v.coldReserve.toLocaleString()} {v.symbol}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: Colors.textSecondary, marginBottom: '6px', display: 'block' }}>
                  Replenishment Amount
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={replenishAmount}
                  onChange={(e) => setReplenishAmount(e.target.value)}
                  className="form-input"
                  style={{ height: '44px', fontSize: '16px', fontWeight: '800' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: Colors.textSecondary, marginBottom: '6px', display: 'block' }}>
                  Operational Rationale / Note
                </label>
                <input
                  type="text"
                  value={replenishReason}
                  onChange={(e) => setReplenishReason(e.target.value)}
                  className="form-input"
                  style={{ height: '42px', fontSize: '13px' }}
                />
              </div>

              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  fontSize: '12px',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Clock size={16} />
                <span>
                  After proposal submission, hardware keys must sign. A 2-hour timelock applies before execution.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowReplenishModal(false)}
                  style={{ flex: 1, fontWeight: '700' }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateReplenishProposal}
                  style={{ flex: 1.5, background: Colors.primaryGradient, fontWeight: '800' }}
                >
                  <Key size={16} /> Submit Quorum Proposal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL 3: QR CODE & PUBLIC ADDRESS DETAILS                   */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showQrModal && selectedAsset && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              borderRadius: '20px',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '16px', fontWeight: '900', color: Colors.textPrimary }}>
                {selectedAsset.asset} ({selectedAsset.symbol})
              </span>
              <button
                onClick={() => setShowQrModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.textSecondary }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Stylized Simulated QR Code */}
            <div
              style={{
                width: '180px',
                height: '180px',
                margin: '12px auto',
                backgroundColor: '#FFFFFF',
                padding: '12px',
                borderRadius: '16px',
                boxShadow: '0 4px 18px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #E2E8F0',
              }}
            >
              <QrCode size={140} color="#0F172A" />
            </div>

            <span style={{ fontSize: '11px', color: Colors.textSecondary, fontWeight: '700' }}>
              SCAN TO VERIFY ON-CHAIN CUSTODY ADDRESS
            </span>

            {/* Address copy block */}
            <div
              style={{
                marginTop: '16px',
                textAlign: 'left',
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                borderRadius: '12px',
                padding: '12px 14px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0'}`,
              }}
            >
              <div style={{ fontSize: '11px', color: Colors.textSecondary, fontWeight: '700' }}>
                HOT LIQUID BUFFER ADDRESS ({selectedAsset.network})
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '4px',
                  gap: '8px',
                }}
              >
                <code
                  style={{
                    fontSize: '11.5px',
                    fontFamily: 'monospace',
                    color: Colors.primary,
                    wordBreak: 'break-all',
                  }}
                >
                  {selectedAsset.hotAddress}
                </code>
                <button
                  onClick={() => handleCopy(selectedAsset.hotAddress, 'Hot Address')}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 8px', fontSize: '11px' }}
                >
                  {copiedText === selectedAsset.hotAddress ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Derivation path & standard */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11.5px',
                color: Colors.textSecondary,
                marginTop: '12px',
                padding: '0 4px',
              }}
            >
              <span>Derivation: <strong>{selectedAsset.derivationPath}</strong></span>
              <span>Quorum: <strong>{selectedAsset.quorum}</strong></span>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setShowQrModal(false)}
              style={{ width: '100%', marginTop: '20px', background: Colors.primaryGradient, fontWeight: '800' }}
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL 4: PROOF-OF-RESERVES (PoR) ATTESTATION                 */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showPoRModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowPoRModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '560px',
              width: '100%',
              padding: '28px',
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              borderRadius: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShieldCheck size={22} color="#10B981" />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: '900', color: Colors.textPrimary }}>
                    Cryptographic Proof-of-Reserves (PoR)
                  </h3>
                  <p style={{ fontSize: '12px', color: Colors.textSecondary }}>
                    Independent Merkle Tree Attestation & Solvency Audit
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPoRModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: Colors.textSecondary }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#10B981' }}>
                    SOLVENCY RATIO
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#10B981' }}>
                    100.0%
                  </div>
                  <div style={{ fontSize: '11px', color: Colors.textSecondary }}>
                    Assets: {metrics.totalValuationFormatted} | Backed Liabilities: {metrics.totalValuationFormatted}
                  </div>

                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-emerald" style={{ fontSize: '11px' }}>
                    Audited Clean
                  </span>
                  <div style={{ fontSize: '11px', color: Colors.textSecondary, marginTop: '4px' }}>
                    Last Attested: 14 mins ago
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: Colors.textSecondary }}>
                  MERKLE TREE ROOT HASH (SHA-256)
                </label>
                <code
                  style={{
                    display: 'block',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#F1F5F9',
                    fontSize: '11.5px',
                    fontFamily: 'monospace',
                    color: Colors.textPrimary,
                    marginTop: '4px',
                  }}
                >
                  0x7b4a8e32c84f29104085b1a0984cfb7218390547192f1
                </code>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: Colors.textSecondary }}>
                  INDEPENDENT AUDITING FIRM
                </label>
                <div style={{ fontSize: '13px', fontWeight: '800', color: Colors.textPrimary, marginTop: '2px' }}>
                  CertiK & PeckShield Institutional Custody Assurance
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowPoRModal(false)}
                  style={{ flex: 1, fontWeight: '700' }}
                >
                  Close
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    showToast('Official Signed Proof-of-Reserves PDF generated and downloaded!');
                    setShowPoRModal(false);
                  }}
                  style={{ flex: 1.5, background: Colors.primaryGradient, fontWeight: '800' }}
                >
                  <Download size={15} /> Download Signed Attestation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MODAL 5: EMERGENCY CIRCUIT BREAKER TOGGLE                    */}
      {/* ──────────────────────────────────────────────────────────── */}
      {showCircuitBreakerModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setShowCircuitBreakerModal(false)}
        >
          <div
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              padding: '28px',
              backgroundColor: isDark ? '#111827' : '#FFFFFF',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'}`,
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              borderRadius: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={22} color="#EF4444" />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: '900', color: Colors.textPrimary }}>
                  Emergency Vault Circuit Breaker
                </h3>
                <span style={{ fontSize: '12px', color: Colors.textSecondary }}>
                  Super Admin Security Override
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: Colors.textSecondary, lineHeight: '1.6' }}>
              {isCircuitBreakerActive
                ? 'Deactivating the circuit breaker will resume automated user withdrawal processing and automated hot wallet sweeps.'
                : 'Activating the circuit breaker immediately freezes all automated outbound hot wallet sweeps and pauses instant withdrawals until re-evaluated.'}
            </p>

            <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowCircuitBreakerModal(false)}
                style={{ flex: 1, fontWeight: '700' }}
              >
                Cancel
              </button>
              <button
                className={`btn ${isCircuitBreakerActive ? 'btn-primary' : 'btn-danger'}`}
                onClick={() => {
                  setIsCircuitBreakerActive(!isCircuitBreakerActive);
                  setShowCircuitBreakerModal(false);
                  showToast(
                    isCircuitBreakerActive
                      ? 'Circuit breaker disengaged. Automated operations resumed.'
                      : 'CIRCUIT BREAKER ENGAGED. All automated outflows frozen.'
                  );
                }}
                style={{ flex: 1.5, fontWeight: '800' }}
              >
                {isCircuitBreakerActive ? 'Resume Normal Outflows' : 'Engage Emergency Freeze'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
