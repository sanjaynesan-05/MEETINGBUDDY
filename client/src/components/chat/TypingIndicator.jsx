import React from 'react';
import { Bot } from 'lucide-react';

const TypingIndicator = () => {
  return (
    <div className="ai-msg-row">
      <div className="ai-avatar">
        <Bot size={20} />
      </div>
      <div className="ai-msg-bubble" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', width: 'auto', padding: '12px 18px' }}>
        <span className="spinner spinner-sm" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--md-on-surface-variant)' }}>AI is thinking...</span>
      </div>
    </div>
  );
};

export default TypingIndicator;
