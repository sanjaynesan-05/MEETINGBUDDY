import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

const ConfidenceBadge = ({ score }) => {
  if (score === undefined || score === null) return null;
  
  const percentage = Math.round(score * 100);
  
  let bg = '#fee2e2';
  let color = '#b91c1c';
  let border = '#fca5a5';
  let Icon = ShieldAlert;
  
  if (percentage >= 90) {
    bg = '#dcfce7';
    color = '#15803d';
    border = '#bbf7d0';
    Icon = ShieldCheck;
  } else if (percentage >= 70) {
    bg = '#fef9c3';
    color = '#a16207';
    border = '#fef08a';
    Icon = Shield;
  }

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '2px 8px',
      borderRadius: 'var(--radius-full)',
      fontSize: 'var(--text-xs)',
      fontWeight: 500,
      background: bg,
      color: color,
      border: `1px solid ${border}`,
    }}>
      <Icon size={14} />
      <span>Confidence: {percentage}%</span>
    </div>
  );
};

export default ConfidenceBadge;
