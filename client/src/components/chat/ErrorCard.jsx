import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorCard = ({ error, onRetry }) => {
  if (!error) return null;
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
      margin: 'var(--space-4) auto',
      background: 'var(--md-error-container)',
      border: '1px solid var(--md-error-light)',
      borderRadius: 'var(--radius-md)',
      maxWidth: '600px',
    }}>
      <AlertCircle size={24} color="var(--md-error)" style={{ marginBottom: '8px' }} />
      <p style={{ color: 'var(--md-error)', fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: '12px', textAlign: 'center' }}>
        {error}
      </p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorCard;
