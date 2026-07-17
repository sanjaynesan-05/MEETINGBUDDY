import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

const ConfidenceBadge = ({ score }) => {
  if (score === undefined || score === null) return null;
  
  const percentage = Math.round(score * 100);
  
  let color = 'bg-red-100 text-red-800 border-red-200';
  let Icon = ShieldAlert;
  
  if (percentage >= 90) {
    color = 'bg-green-100 text-green-800 border-green-200';
    Icon = ShieldCheck;
  } else if (percentage >= 70) {
    color = 'bg-yellow-100 text-yellow-800 border-yellow-200';
    Icon = Shield;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color} dark:bg-opacity-20`}>
      <Icon className="w-3.5 h-3.5" />
      <span>Confidence: {percentage}%</span>
    </div>
  );
};

export default ConfidenceBadge;
