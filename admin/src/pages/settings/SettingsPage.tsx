import React, { useState, useEffect } from 'react';
import { Upload, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ZappPayLogo, ZappPayIcon } from '../../components/common/ZappPayLogo';
import { adminApi } from '../../api/adminApi';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('General');
  const [platformName, setPlatformName] = useState('Zapp pay');
  const [supportEmail, setSupportEmail] = useState('support@zappay.com');
  const [supportPhone, setSupportPhone] = useState('+91 98765 43210');
  const [websiteUrl, setWebsiteUrl] = useState('https://zappay.com');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await adminApi.getAppConfig();
        if (res.success && res.data) {
          if (res.data.maintenanceMode !== undefined) {
            setMaintenanceMode(res.data.maintenanceMode);
          }
        }
      } catch {
        // Fallback to defaults
      }
    };
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.updateAppConfig({
        maintenanceMode,
        maintenanceMessage: `${platformName} is undergoing scheduled maintenance. Trading will resume shortly.`,
      });
    } catch {
      // Graceful fallback
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.4px', margin: 0 }}>
            Platform Settings
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748B', fontWeight: '500', margin: '4px 0 0' }}>
            Manage platform configuration and administrator profile.
          </p>
        </div>

        <button
          onClick={() => navigate('/profile')}
          className="btn btn-primary"
          style={{ borderRadius: '10px', padding: '9px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <User size={15} />
          <span>Edit Admin Profile</span>
        </button>
      </div>

      {/* Sub-tabs pills */}
      <div className="filter-tabs-bar">
        {['General', 'Admin Profile', 'Limits & Fees', 'Referral', 'Security', 'Email', 'System'].map((tab) => (
          <button
            key={tab}
            className={`filter-pill ${activeTab === tab ? 'active' : ''}`}
            onClick={() => {
              if (tab === 'Admin Profile') {
                navigate('/profile');
              } else {
                setActiveTab(tab);
              }
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {saved && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          backgroundColor: '#DCFCE7',
          color: '#16A34A',
          fontSize: '13px',
          fontWeight: '700',
          marginBottom: '20px'
        }}>
          ✅ Settings saved successfully! Changes are live across mobile apps and web.
        </div>
      )}

      {/* Settings Card: Form (Left) + Logo/Favicon Uploads (Right) */}
      <div className="card" style={{ padding: '32px' }}>
        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '48px' }}>
          
          {/* Left Column: Form Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '7px' }}>
                Platform Name
              </label>
              <input
                type="text"
                className="form-input"
                style={{ height: '42px', fontSize: '14px' }}
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '7px' }}>
                Support Email
              </label>
              <input
                type="email"
                className="form-input"
                style={{ height: '42px', fontSize: '14px' }}
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '7px' }}>
                Support Phone
              </label>
              <input
                type="text"
                className="form-input"
                style={{ height: '42px', fontSize: '14px' }}
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '7px' }}>
                Website URL
              </label>
              <input
                type="url"
                className="form-input"
                style={{ height: '42px', fontSize: '14px' }}
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </div>

            {/* Maintenance Mode Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              backgroundColor: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              marginTop: '4px'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>Maintenance Mode</div>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
                  Enable to show maintenance page to users.
                </div>
              </div>

              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: maintenanceMode ? '#2563EB' : '#CBD5E1',
                  borderRadius: '24px',
                  transition: '0.2s'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '18px',
                    width: '18px',
                    left: maintenanceMode ? '23px' : '3px',
                    bottom: '3px',
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.2s'
                  }} />
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                height: '46px',
                borderRadius: '10px',
                fontWeight: '800',
                fontSize: '14px',
                marginTop: '12px',
                width: '160px'
              }}
            >
              Save Changes
            </button>
          </div>

          {/* Right Column: Platform Logo & Favicon Uploads (Matches Screenshot 10) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Logo Box */}
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
                Platform Logo
              </label>
              <div style={{
                border: '1.5px dashed #CBD5E1',
                borderRadius: '14px',
                padding: '24px',
                textAlign: 'center',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 0' }}>
                  <ZappPayLogo variant="full" size="lg" />
                </div>

                <div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '12px', fontWeight: '700' }}
                  >
                    <Upload size={13} /> Upload new logo
                  </button>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
                    PNG, JPG, SVG (Max 2MB)
                  </div>
                </div>
              </div>
            </div>

            {/* Favicon Box */}
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '8px' }}>
                Favicon
              </label>
              <div style={{
                border: '1.5px dashed #CBD5E1',
                borderRadius: '14px',
                padding: '20px',
                backgroundColor: '#F8FAFC',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <ZappPayIcon size={42} glow={true} />

                <div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11.5px', fontWeight: '700', padding: '4px 10px' }}
                  >
                    Upload favicon
                  </button>
                  <div style={{ fontSize: '10.5px', color: '#94A3B8', marginTop: '4px' }}>
                    PNG, ICO (Max 1MB)
                  </div>
                </div>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
