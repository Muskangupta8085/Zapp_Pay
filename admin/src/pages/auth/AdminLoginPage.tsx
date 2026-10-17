import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  Zap,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ZappPayLogo } from '../../components/common/ZappPayLogo';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  // Ensure fields start clean on initial mount to prevent aggressive browser autofill
  useEffect(() => {
    setEmail('');
    setPassword('');
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleQuickFill = (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both admin email and security password.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 500);
      } else {
        setIsLoading(false);
        setErrorMessage(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Network error connecting to authentication server.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      height: '100vh',
      width: '100vw',
      display: 'flex',
      backgroundColor: '#EFF3FC',
      background: 'linear-gradient(135deg, #F3F6FD 0%, #ECEFFB 35%, #E3E3FD 70%, #DDD5FC 100%)',
      fontFamily: 'var(--font-sans)',
      overflow: 'hidden',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      {/* Background Ambient Decorative Waves and Gradients */}
      <style>{`
        @keyframes floatDeviceScreen {
          0%, 100% { transform: perspective(1000px) rotateY(-14deg) rotateX(8deg) translateY(0px); }
          50% { transform: perspective(1000px) rotateY(-14deg) rotateX(8deg) translateY(-10px); }
        }
        @keyframes floatFrontCard {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes livePulse {
          0%, 100% { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6); }
          50% { transform: scale(1.15); opacity: 0.85; box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
        }
        @keyframes shimmerGlow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(220%); }
        }
        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }
        .quick-fill-btn:hover {
          background-color: #F8FAFC !important;
          border-color: #6366F1 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.12);
        }
        .feature-icon-item:hover .icon-box {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.2);
        }
        .bottom-pill-badge:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
          border-color: #CBD5E1 !important;
        }
        .login-submit-btn:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 10px 24px -2px rgba(99, 102, 241, 0.45);
        }
      `}</style>

      {/* Decorative Wave Curves at Bottom-Left */}
      <div style={{
        position: 'absolute',
        bottom: '-12%',
        left: '-8%',
        width: '560px',
        height: '420px',
        borderRadius: '45%',
        background: 'radial-gradient(circle, rgba(167, 139, 250, 0.45) 0%, rgba(192, 132, 252, 0.2) 50%, transparent 75%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '25%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* ======================================================== */}
      {/* LEFT SHOWCASE SECTION (Matches Screenshot 100%)          */}
      {/* ======================================================== */}
      <div style={{
        flex: '1.25',
        padding: '36px 48px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 10,
        boxSizing: 'border-box',
        height: '100vh'
      }}>
        {/* Top Header: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <ZappPayLogo variant="full" size="md" mode="light" />
        </div>

        {/* Center Main Stage */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: '24px',
          alignItems: 'center',
          margin: 'auto 0'
        }}>
          {/* Left Text & Feature Icons */}
          <div>
            {/* Pill Header */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              backgroundColor: '#EEF2FF',
              border: '1px solid #C7D2FE',
              color: '#4F46E5',
              fontSize: '11px',
              fontWeight: '800',
              marginBottom: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.6px'
            }}>
              <Sparkles size={13} color="#6366F1" />
              <span>INSTITUTIONAL COMMAND SUITE</span>
            </div>

            {/* Headline with exact colors */}
            <h1 style={{
              fontSize: '38px',
              fontWeight: '900',
              lineHeight: '1.18',
              letterSpacing: '-1px',
              marginBottom: '14px',
              color: '#0F172A'
            }}>
              Manage. <span style={{ color: '#4F46E5' }}>Monitor.</span> <span style={{ color: '#D97706' }}>Grow.</span><br />
              All in one place.
            </h1>

            <p style={{
              fontSize: '13.5px',
              color: '#64748B',
              lineHeight: '1.6',
              maxWidth: '380px',
              marginBottom: '26px',
              fontWeight: '500'
            }}>
              Real-time peer-to-peer liquidity management, instant payment claim verifications, automated treasury controls, and enterprise compliance.
            </p>

            {/* 4 Feature Icon Items in a Row */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div className="feature-icon-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '68px', cursor: 'default' }}>
                <div className="icon-box" style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#EEF2FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '6px',
                  color: '#4F46E5',
                  transition: 'all 0.2s ease'
                }}>
                  <Zap size={20} />
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', lineHeight: '1.2' }}>
                  Instant<br />Payments
                </span>
              </div>

              <div className="feature-icon-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '68px', cursor: 'default' }}>
                <div className="icon-box" style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#EEF2FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '6px',
                  color: '#4F46E5',
                  transition: 'all 0.2s ease'
                }}>
                  <Shield size={20} />
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', lineHeight: '1.2' }}>
                  Bank-Grade<br />Security
                </span>
              </div>

              <div className="feature-icon-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '68px', cursor: 'default' }}>
                <div className="icon-box" style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#EEF2FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '6px',
                  color: '#4F46E5',
                  transition: 'all 0.2s ease'
                }}>
                  <TrendingUp size={20} />
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', lineHeight: '1.2' }}>
                  Real-time<br />Analytics
                </span>
              </div>

              <div className="feature-icon-item" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '68px', cursor: 'default' }}>
                <div className="icon-box" style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#EEF2FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '6px',
                  color: '#4F46E5',
                  transition: 'all 0.2s ease'
                }}>
                  <Users size={20} />
                </div>
                <span style={{ fontSize: '10.5px', fontWeight: '700', color: '#475569', lineHeight: '1.2' }}>
                  Enterprise<br />Compliance
                </span>
              </div>
            </div>
          </div>

          {/* Right 3D Perspective Hologram Graphic Display */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '290px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Back Tilted Dark Monitor Device */}
            <div style={{
              position: 'absolute',
              top: '0px',
              right: '-10px',
              width: '320px',
              borderRadius: '18px',
              backgroundColor: '#0F1528',
              background: 'linear-gradient(145deg, #131A33 0%, #0B1021 100%)',
              border: '1.5px solid #2A3356',
              boxShadow: '0 25px 50px -10px rgba(15, 23, 42, 0.4), 0 0 25px rgba(99, 102, 241, 0.15)',
              padding: '14px 16px',
              color: '#FFFFFF',
              transform: 'perspective(1000px) rotateY(-14deg) rotateX(8deg)',
              animation: 'floatDeviceScreen 6s ease-in-out infinite',
              zIndex: 2
            }}>
              {/* Device Top Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #1E294B' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={10} color="#FFFFFF" />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#F1F5F9' }}>Zapp Pay</span>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#334155' }} />
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#334155' }} />
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#475569' }} />
                </div>
              </div>

              {/* Main Metric & Chart on Dark Device */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '9px', color: '#94A3B8', fontWeight: '600' }}>Total Settlement</div>
                  <div style={{ fontSize: '18px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-0.4px' }}>₹48,92,450</div>
                </div>
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: '800',
                  color: '#22C55E',
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  padding: '2px 6px',
                  borderRadius: '6px'
                }}>
                  + 12.5%
                </span>
              </div>

              {/* Cyan Glowing Wave */}
              <div style={{ width: '100%', height: '36px', marginBottom: '10px' }}>
                <svg width="100%" height="36" viewBox="0 0 240 36" fill="none">
                  <path
                    d="M0 26 C 40 24, 70 8, 120 18 C 160 26, 190 6, 240 8"
                    stroke="#38BDF8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0 26 C 40 24, 70 8, 120 18 C 160 26, 190 6, 240 8 L 240 36 L 0 36 Z"
                    fill="url(#darkWaveGrad)"
                    opacity="0.35"
                  />
                  <defs>
                    <linearGradient id="darkWaveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38BDF8" />
                      <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* 3 Metric Mini Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '8px', color: '#94A3B8' }}>Active Users</div>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#FFFFFF' }}>12,840</div>
                  <div style={{ fontSize: '7.5px', color: '#22C55E', fontWeight: '700' }}>+ 8.2%</div>
                </div>
                <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '8px', color: '#94A3B8' }}>xCoin Index</div>
                  <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#38BDF8' }}>₹108.37</div>
                  <div style={{ fontSize: '7.5px', color: '#22C55E', fontWeight: '700' }}>+ 2.4%</div>
                </div>
                <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.05)', textAlign: 'center' }}>
                  <div style={{ fontSize: '8px', color: '#94A3B8' }}>Security</div>
                  <div style={{ fontSize: '10px', fontWeight: '800', color: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                    <Shield size={9} /> Verified
                  </div>
                </div>
              </div>
            </div>

            {/* Front Floating White Glass Card (Matches Exact Screenshot) */}
            <div style={{
              position: 'absolute',
              bottom: '5px',
              left: '5px',
              width: '245px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '14px 16px',
              boxShadow: '0 18px 40px -8px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(226, 232, 240, 0.8)',
              animation: 'floatFrontCard 5s ease-in-out infinite',
              zIndex: 3
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
                  <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#0F172A' }}>Live Treasury Node</span>
                </div>
                <span style={{
                  fontSize: '9px',
                  color: '#2563EB',
                  fontWeight: '800',
                  backgroundColor: '#EFF6FF',
                  padding: '2px 6px',
                  borderRadius: '5px'
                }}>
                  99.99% Uptime
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '9px', color: '#64748B', fontWeight: '600' }}>24h Net Settlements</div>
                  <div style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>₹48,92,450</div>
                </div>

                <div style={{ width: '55px', height: '22px' }}>
                  <svg width="55" height="22" viewBox="0 0 55 22" fill="none">
                    <path
                      d="M2 18 C 12 16, 20 6, 32 10 C 42 16, 48 4, 53 5"
                      stroke="#22C55E"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* 3 Metric Boxes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                <div style={{ padding: '4px', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9', textAlign: 'center' }}>
                  <div style={{ fontSize: '7.5px', color: '#64748B' }}>Active Users</div>
                  <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#0F172A' }}>12,840</div>
                </div>
                <div style={{ padding: '4px', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9', textAlign: 'center' }}>
                  <div style={{ fontSize: '7.5px', color: '#64748B' }}>xCoin Index</div>
                  <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#2563EB' }}>₹108.37</div>
                </div>
                <div style={{ padding: '4px', borderRadius: '6px', backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9', textAlign: 'center' }}>
                  <div style={{ fontSize: '7.5px', color: '#64748B' }}>Security</div>
                  <div style={{ fontSize: '9.5px', fontWeight: '800', color: '#16A34A' }}>Verified</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom 3 Pills: 256-Bit Vault, Sub-Second Settlement, Granular RBAC */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="bottom-pill-badge" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            borderRadius: '999px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
            fontSize: '11.5px',
            fontWeight: '700',
            color: '#334155',
            transition: 'all 0.15s ease',
            cursor: 'default'
          }}>
            <Shield size={14} color="#6366F1" />
            <span>256-Bit Vault</span>
          </div>

          <div className="bottom-pill-badge" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            borderRadius: '999px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
            fontSize: '11.5px',
            fontWeight: '700',
            color: '#334155',
            transition: 'all 0.15s ease',
            cursor: 'default'
          }}>
            <Zap size={14} color="#6366F1" />
            <span>Sub-Second Settlement</span>
          </div>

          <div className="bottom-pill-badge" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 16px',
            borderRadius: '999px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
            fontSize: '11.5px',
            fontWeight: '700',
            color: '#334155',
            transition: 'all 0.15s ease',
            cursor: 'default'
          }}>
            <Users size={14} color="#6366F1" />
            <span>Granular RBAC</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* RIGHT AUTHENTICATION CARD (Matches Screenshot 100%)      */}
      {/* ======================================================== */}
      <div style={{
        flex: '0.95',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 40px',
        position: 'relative',
        zIndex: 10,
        boxSizing: 'border-box',
        height: '100vh'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '430px',
          backgroundColor: '#FFFFFF',
          borderRadius: '26px',
          padding: '36px 34px',
          boxShadow: '0 20px 50px -10px rgba(100, 116, 139, 0.15), 0 0 0 1px rgba(241, 245, 249, 0.9)',
          position: 'relative',
          boxSizing: 'border-box'
        }}>
          {/* Header Row: Logo & Admin Gateway Pill */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <ZappPayLogo variant="compact" size="md" mode="light" />
            
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '999px',
              backgroundColor: '#EEF2FF',
              border: '1px solid #E0E7FF',
              color: '#4F46E5',
              fontSize: '11.5px',
              fontWeight: '800'
            }}>
              <LockKeyhole size={12} color="#6366F1" />
              <span>Admin Gateway</span>
            </div>
          </div>

          {/* Titles */}
          <div style={{ marginBottom: '18px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '900',
              color: '#0F172A',
              letterSpacing: '-0.5px',
              margin: '0 0 6px'
            }}>
              Welcome Back
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', fontWeight: '500', margin: 0 }}>
              Authenticate with your credentials to access the central ledger.
            </p>
          </div>

          {/* Quick Demo Access Box (Matches Screenshot) */}
          <div style={{
            marginBottom: '18px',
            padding: '10px 12px',
            backgroundColor: '#F8FAFC',
            borderRadius: '12px',
            border: '1px dashed #CBD5E1',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748B', fontWeight: '700' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={12} color="#F59E0B" />
                Quick Demo Access:
              </span>
              <span style={{ color: '#94A3B8', fontWeight: '500' }}>Click to auto-fill</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="quick-fill-btn"
                onClick={() => handleQuickFill('admin@zappay.com', 'admin123')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>👑</span> Super Admin (admin@zappay.com)
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: '#FEE2E2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              fontSize: '12px',
              fontWeight: '700',
              marginBottom: '16px',
              animation: 'errorShake 0.4s ease-in-out'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Email Field */}
            <div>
              <label style={{
                fontSize: '12.5px',
                fontWeight: '700',
                color: focusedField === 'email' ? '#4F46E5' : '#334155',
                display: 'block',
                marginBottom: '6px',
                transition: 'color 0.15s ease'
              }}>
                Admin Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  color={focusedField === 'email' ? '#4F46E5' : '#94A3B8'}
                  style={{ position: 'absolute', left: '14px', top: '13px', transition: 'color 0.15s ease' }}
                />
                <input
                  type="email"
                  name="zapp_admin_email"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="form-input"
                  style={{
                    paddingLeft: '38px',
                    height: '42px',
                    fontSize: '13.5px',
                    borderRadius: '12px',
                    borderColor: focusedField === 'email' ? '#4F46E5' : '#E2E8F0',
                    backgroundColor: focusedField === 'email' ? '#FFFFFF' : '#F8FAFC',
                    boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(99, 102, 241, 0.15)' : 'none',
                    transition: 'all 0.2s ease',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter admin email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{
                  fontSize: '12.5px',
                  fontWeight: '700',
                  color: focusedField === 'password' ? '#4F46E5' : '#334155',
                  transition: 'color 0.15s ease'
                }}>
                  Security Password *
                </label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Please contact your Superadmin to transfer credentials.');
                  }}
                  style={{ fontSize: '12px', color: '#4F46E5', fontWeight: '700', textDecoration: 'none' }}
                >
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  color={focusedField === 'password' ? '#4F46E5' : '#94A3B8'}
                  style={{ position: 'absolute', left: '14px', top: '13px', transition: 'color 0.15s ease' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="zapp_admin_password"
                  autoComplete="new-password"
                  className="form-input"
                  style={{
                    paddingLeft: '38px',
                    paddingRight: '38px',
                    height: '42px',
                    fontSize: '13.5px',
                    borderRadius: '12px',
                    borderColor: focusedField === 'password' ? '#4F46E5' : '#E2E8F0',
                    backgroundColor: focusedField === 'password' ? '#FFFFFF' : '#F8FAFC',
                    boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(99, 102, 241, 0.15)' : 'none',
                    transition: 'all 0.2s ease',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter security password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '11px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    padding: '2px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} color="#4F46E5" /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '12.5px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#475569', fontWeight: '600' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: '15px', height: '15px', accentColor: '#4F46E5', cursor: 'pointer' }}
                />
                <span>Keep active administrator session</span>
              </label>
            </div>

            {/* Sign In Button with Vibrant Gradient (Matches Screenshot) */}
            <button
              type="submit"
              className="login-submit-btn"
              disabled={isLoading || isSuccess}
              style={{
                height: '46px',
                borderRadius: '12px',
                fontSize: '14.5px',
                fontWeight: '800',
                background: isSuccess ? '#16A34A' : 'linear-gradient(90deg, #4F46E5 0%, #2563EB 50%, #3B82F6 100%)',
                color: '#FFFFFF',
                border: 'none',
                cursor: (isLoading || isSuccess) ? 'not-allowed' : 'pointer',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 20px -2px rgba(79, 70, 229, 0.4)',
                transition: 'all 0.2s ease',
                width: '100%'
              }}
            >
              {/* Shimmer light effect */}
              {!isLoading && !isSuccess && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '50%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent)',
                  transform: 'skewX(-20deg)',
                  animation: 'shimmerGlow 3.5s infinite'
                }} />
              )}

              {isLoading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTopColor: '#FFFFFF',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <span>Verifying Session...</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Access Granted! Redirecting...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Security Badge */}
          <div style={{
            marginTop: '22px',
            paddingTop: '14px',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '11px',
            color: '#64748B',
            fontWeight: '600'
          }}>
            <Shield size={13} color="#16A34A" />
            <span>Encrypted with TLS 1.3 & SHA-256 JWT Security</span>
          </div>
        </div>
      </div>
    </div>
  );
};
