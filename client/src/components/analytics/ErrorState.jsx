import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({ error, onRetry }) {
  return (
    <div className="analytics-error">
      <AlertCircle size={48} />
      <h2>Unable to load analytics</h2>
      <p>{error || 'An unexpected error occurred while fetching your data.'}</p>
      {onRetry && (
        <button className="btn btn-outline" onClick={onRetry} style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <RefreshCw size={16} /> Retry
        </button>
      )}
    </div>
  );
}
