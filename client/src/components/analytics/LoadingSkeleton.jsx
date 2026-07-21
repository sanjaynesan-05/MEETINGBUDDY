import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSkeleton() {
  return (
    <div className="analytics-layout" style={{ minHeight: '60vh', justifyContent: 'center', alignItems: 'center' }}>
      <Loader2 size={48} className="animate-spin text-primary" style={{ color: 'var(--md-primary)', marginBottom: 'var(--space-4)' }} />
      <h2 style={{ color: 'var(--md-on-surface)' }}>Loading Analytics...</h2>
      <p style={{ color: 'var(--md-on-surface-variant)' }}>Aggregating your organization's meeting intelligence.</p>
    </div>
  );
}
