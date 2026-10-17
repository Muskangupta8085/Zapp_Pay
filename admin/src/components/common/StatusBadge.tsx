import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let badgeClass = 'badge-indigo';

  switch (status.toLowerCase()) {
    case 'verified':
    case 'approved':
    case 'completed':
    case 'active':
    case 'healthy':
    case 'sent':
      badgeClass = 'badge-emerald';
      break;
    case 'pending':
    case 'processing':
    case 'monitored':
    case 'scheduled':
    case 'low reserve':
      badgeClass = 'badge-amber';
      break;
    case 'rejected':
    case 'frozen':
    case 'blocked':
    case 'failed':
    case 'cancelled':
    case 'critical':
      badgeClass = 'badge-rose';
      break;
    default:
      badgeClass = 'badge-indigo';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {status}
    </span>
  );
};
