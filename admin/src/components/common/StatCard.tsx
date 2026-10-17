import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Colors } from '../../constants/colors';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtext?: string;
  icon?: LucideIcon;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  isPositive = true,
  subtext,
  icon: Icon,
  iconColor = Colors.primary,
}) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: Colors.textSecondary }}>
          {label}
        </span>
        {Icon && (
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            backgroundColor: 'rgba(67, 24, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Icon size={18} color={iconColor} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
        <span style={{ fontSize: '26px', fontWeight: '900', color: Colors.textPrimary, letterSpacing: '-0.5px' }}>
          {value}
        </span>
        {change && (
          <span style={{
            fontSize: '12.5px',
            fontWeight: '800',
            color: isPositive ? Colors.success : Colors.danger,
            display: 'inline-flex',
            alignItems: 'center',
          }}>
            {change}
          </span>
        )}
      </div>

      {subtext && (
        <span style={{ fontSize: '12px', color: Colors.textMuted, fontWeight: '600' }}>
          {subtext}
        </span>
      )}
    </div>
  );
};
