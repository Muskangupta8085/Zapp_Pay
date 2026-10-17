import React from 'react';
import { Colors } from '../../constants/colors';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  badgeType?: 'emerald' | 'amber' | 'rose' | 'indigo';
  actionButton?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  badgeType = 'indigo',
  actionButton,
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '28px',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: Colors.textPrimary, letterSpacing: '-0.5px' }}>
            {title}
          </h1>
          {badge && (
            <span className={`badge badge-${badgeType}`}>
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p style={{ fontSize: '14px', color: Colors.textSecondary, marginTop: '4px', fontWeight: '500' }}>
            {subtitle}
          </p>
        )}
      </div>

      {actionButton && <div>{actionButton}</div>}
    </div>
  );
};
