import React from 'react';
import { Copy, Check } from 'lucide-react';

const MessageToolbar = ({ onCopy, copied }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <button 
        onClick={onCopy}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: 'var(--text-xs)',
          color: 'var(--md-on-surface-variant)',
        }}
        title="Copy Answer"
      >
        {copied ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
};

export default MessageToolbar;
