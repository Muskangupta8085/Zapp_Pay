import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, Lock, CheckCircle2, AlertCircle, Save, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { adminApi } from '../../api/adminApi';

export const AdminProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { isDark } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch real profile from backend API on mount
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const res = await adminApi.getMe();
        if (isMounted && res.success && res.data) {
          setName(res.data.name || '');
          setEmail(res.data.email || '');
          setPhone(res.data.phone || '');
          updateUser({
            name: res.data.name,
            email: res.data.email,
            phone: res.data.phone || '',
            role: res.data.role === 'superadmin' ? 'Super Admin' : (res.data.role || user?.role),
          });
        }
      } catch (err) {
        console.error('Failed to load admin profile from backend', err);
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync state if user context updates
  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.email) setEmail(user.email);
      if (user.phone !== undefined) setPhone(user.phone);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Admin name cannot be empty.');
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        setErrorMessage('Please enter your current password to set a new password.');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMessage('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage('New password and confirmation password do not match.');
        return;
      }
    }

    setIsSaving(true);

    try {
      const res = await adminApi.updateProfile({
        fullName: name.trim(),
        phone: phone.trim(),
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      setIsSaving(false);

      if (res.success && res.data) {
        updateUser({
          name: res.data.name || name.trim(),
          phone: res.data.phone || phone.trim(),
        });

        setSuccessMessage('Admin profile updated successfully! Changes are live across the system.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(res.error || 'Failed to update profile.');
      }
    } catch (err: any) {
      setIsSaving(false);
      setErrorMessage(err.message || 'Network error updating profile.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Page Header */}
      <div>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '900',
          color: isDark ? '#F8FAFC' : '#0F172A',
          letterSpacing: '-0.4px',
          margin: 0
        }}>
          Account Profile & Credentials
        </h1>
        <p style={{ fontSize: '13.5px', color: isDark ? '#94A3B8' : '#64748B', fontWeight: '500', margin: '4px 0 0' }}>
          Update your administrator display name, contact phone, and security credentials.
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 18px',
          borderRadius: '12px',
          backgroundColor: '#DCFCE7',
          border: '1px solid #BBF7D0',
          color: '#15803D',
          fontSize: '13px',
          fontWeight: '700',
        }}>
          <CheckCircle2 size={18} color="#16A34A" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 18px',
          borderRadius: '12px',
          backgroundColor: '#FEE2E2',
          border: '1px solid #FECACA',
          color: '#DC2626',
          fontSize: '13px',
          fontWeight: '700',
        }}>
          <AlertCircle size={18} color="#DC2626" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Left Profile Card + Right Edit Form */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.2fr', gap: '24px' }}>
        
        {/* Left Column: Admin Identity Badge Card */}
        <div
          className="card"
          style={{
            padding: '28px 24px',
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            borderRadius: '18px',
            border: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 18px rgba(0,0,0,0.03)',
            height: 'fit-content'
          }}
        >
          {/* Avatar Circle */}
          <div style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: '900',
            fontSize: '32px',
            marginBottom: '16px',
            boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
            border: '3px solid #FFFFFF'
          }}>
            {name ? name[0].toUpperCase() : 'A'}
          </div>

          <h3 style={{
            fontSize: '18px',
            fontWeight: '900',
            color: isDark ? '#F8FAFC' : '#0F172A',
            margin: '0 0 4px'
          }}>
            {name || 'Administrator'}
          </h3>

          <p style={{
            fontSize: '13px',
            color: isDark ? '#94A3B8' : '#64748B',
            fontWeight: '500',
            margin: '0 0 14px'
          }}>
            {email}
          </p>

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '999px',
            backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF',
            color: '#2563EB',
            fontSize: '12px',
            fontWeight: '800',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            marginBottom: '20px'
          }}>
            <Shield size={13} />
            <span>{user?.role || 'Super Admin'}</span>
          </span>

          <div style={{
            width: '100%',
            borderTop: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
            paddingTop: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Account Status:</span>
              <span style={{ color: '#16A34A', fontWeight: '800' }}>Active & Verified</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: isDark ? '#94A3B8' : '#64748B' }}>Session:</span>
              <span style={{ color: isDark ? '#F1F5F9' : '#1E293B', fontWeight: '700' }}>JWT Authenticated</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: isDark ? '#94A3B8' : '#64748B' }}>System Access:</span>
              <span style={{ color: isDark ? '#F1F5F9' : '#1E293B', fontWeight: '700' }}>Full Root Privileges</span>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Profile & Password Form */}
        <div
          className="card"
          style={{
            padding: '32px 36px',
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            borderRadius: '18px',
            border: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 18px rgba(0,0,0,0.03)',
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Section 1: Basic Information */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '15px',
                fontWeight: '800',
                color: isDark ? '#F8FAFC' : '#0F172A',
                marginBottom: '16px'
              }}>
                <User size={18} color="#2563EB" />
                <span>Admin Personal Details</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                {/* Admin Full Name */}
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: isDark ? '#CBD5E1' : '#334155', display: 'block', marginBottom: '7px' }}>
                    Admin Display Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '36px', height: '42px', fontSize: '13.5px', borderRadius: '10px' }}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter admin display name"
                      required
                    />
                  </div>
                </div>

                {/* Contact Phone */}
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: isDark ? '#CBD5E1' : '#334155', display: 'block', marginBottom: '7px' }}>
                    Phone Number
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '36px', height: '42px', fontSize: '13.5px', borderRadius: '10px' }}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter contact phone number"
                    />
                  </div>
                </div>

                {/* Email Address (Read Only) */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: isDark ? '#CBD5E1' : '#334155', display: 'block', marginBottom: '7px' }}>
                    Registered Admin Email
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                    <input
                      type="email"
                      className="form-input"
                      style={{ paddingLeft: '36px', height: '42px', fontSize: '13.5px', borderRadius: '10px', backgroundColor: isDark ? '#1F2937' : '#F8FAFC', cursor: 'not-allowed' }}
                      value={email}
                      disabled
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                    Primary email is tied to root credentials. Contact Superadmin to transfer email identity.
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: '1px', backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }} />

            {/* Section 2: Password & Credentials */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '15px',
                fontWeight: '800',
                color: isDark ? '#F8FAFC' : '#0F172A',
                marginBottom: '16px'
              }}>
                <KeyRound size={18} color="#7C3AED" />
                <span>Change Security Password (Optional)</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: isDark ? '#CBD5E1' : '#334155', display: 'block', marginBottom: '7px' }}>
                    Current Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                    <input
                      type="password"
                      className="form-input"
                      style={{ paddingLeft: '36px', height: '42px', fontSize: '13.5px', borderRadius: '10px' }}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password if changing credentials"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: isDark ? '#CBD5E1' : '#334155', display: 'block', marginBottom: '7px' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                    <input
                      type="password"
                      className="form-input"
                      style={{ paddingLeft: '36px', height: '42px', fontSize: '13.5px', borderRadius: '10px' }}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: '700', color: isDark ? '#CBD5E1' : '#334155', display: 'block', marginBottom: '7px' }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '13px' }} />
                    <input
                      type="password"
                      className="form-input"
                      style={{ paddingLeft: '36px', height: '42px', fontSize: '13.5px', borderRadius: '10px' }}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="submit"
                disabled={isSaving || isLoadingProfile}
                className="btn btn-primary"
                style={{
                  borderRadius: '10px',
                  padding: '11px 28px',
                  fontSize: '14px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#2563EB',
                }}
              >
                <Save size={16} />
                <span>{isSaving ? 'Saving Changes...' : (isLoadingProfile ? 'Loading Profile...' : 'Save Profile Changes')}</span>
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};
