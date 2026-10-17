import React, { useState } from 'react';
import { ShieldCheck, Edit3, Save, CheckCircle2 } from 'lucide-react';

interface PolicyDoc {
  id: string;
  name: string;
  version: string;
  updatedAt: string;
  summary: string;
}

export const PoliciesPage: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState('terms');
  const [isSaved, setIsSaved] = useState(false);

  const docs: PolicyDoc[] = [
    {
      id: 'terms',
      name: 'Terms of Service & User Agreement',
      version: 'v4.2',
      updatedAt: '01 Oct 2026',
      summary: 'Governs app usage, wallet deposits, trading limits, and user dispute terms.',
    },
    {
      id: 'privacy',
      name: 'Privacy Policy & Data Retention',
      version: 'v3.1',
      updatedAt: '15 Sep 2026',
      summary: 'Complies with Indian Digital Personal Data Protection (DPDP) Act and encryption protocols.',
    },
    {
      id: 'aml',
      name: 'Anti-Money Laundering (AML) & CFT Policy',
      version: 'v5.0',
      updatedAt: '20 Sep 2026',
      summary: 'FIU-IND compliant reporting thresholds, suspicious transaction monitoring, and freeze mandates.',
    },
    {
      id: 'risk',
      name: 'Risk Disclosure & Trading Warnings',
      version: 'v2.8',
      updatedAt: '10 Aug 2026',
      summary: 'Virtual digital asset volatility warning displayed on first deposit.',
    },
  ];

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', letterSpacing: '-0.4px' }}>
            Policies & Legal Compliance
          </h1>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Manage in-app legal policies, regulatory disclosures, and terms of service.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          <span>{isSaved ? 'Changes Published!' : 'Publish Policy Changes'}</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        {/* Document Selector Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {docs.map((doc) => {
            const isSelected = selectedDoc === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc.id)}
                className="card"
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  backgroundColor: isSelected ? '#EFF6FF' : '#FFFFFF',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#2563EB', backgroundColor: '#DBEAFE', padding: '2px 8px', borderRadius: '999px' }}>
                    {doc.version}
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                    Updated {doc.updatedAt}
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', marginTop: '8px' }}>
                  {doc.name}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', lineHeight: '1.4' }}>
                  {doc.summary}
                </div>
              </div>
            );
          })}
        </div>

        {/* Markdown / Document Editor */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="#2563EB" />
              <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A' }}>
                Active Editor: {docs.find((d) => d.id === selectedDoc)?.name}
              </h2>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
              Policy Document Content (Markdown Supported)
            </label>
            <textarea
              className="form-input"
              rows={16}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '13px',
                lineHeight: '1.6',
                padding: '14px',
                height: '380px',
                resize: 'vertical'
              }}
              defaultValue={`# ZAPP PAY PLATFORM TERMS AND CONDITIONS

Last Updated: October 2026
Document Version: 4.2

1. ELIGIBILITY & KYC VERIFICATION
By creating an account on Zapp Pay, you confirm that you are at least 18 years of age and an Indian resident with a valid Permanent Account Number (PAN) and Aadhaar verification.

2. INR WALLET & INSTANT BANK TRANSFERS
Deposits made through UPI or IMPS must originate from a verified bank account in the primary user's name. Third-party deposits are strictly flagged and auto-reversed under Prevention of Money Laundering rules.

3. xCOIN TRADING & LIQUIDITY
All buy and sell orders on the order book are settled instantly against platform liquidity reserves. Pricing reflects dynamic algorithmic spread based on real-time market depth.

4. COMPLIANCE & SUSPICIOUS TRANSACTION FREEZING
Zapp Pay reserves the right to temporarily place holds on accounts demonstrating suspicious velocity, unauthorized bot access, or chargeback disputes.`}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '12px' }}>
              <Edit3 size={14} />
              <span>Changes take effect instantly on client apps upon publishing.</span>
            </div>
            <button onClick={handleSave} className="btn-primary" style={{ padding: '8px 20px' }}>
              Save & Publish Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
