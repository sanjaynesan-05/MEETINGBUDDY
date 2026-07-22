import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot } from 'lucide-react';
import ConfidenceBadge from './ConfidenceBadge';
import CitationCard from './CitationCard';
import MessageToolbar from './MessageToolbar';

const AIMessage = ({ content, confidence, citations = [], metadata, id }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ai-msg-row">
      <div className="ai-avatar">
        <Bot size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="ai-msg-bubble">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', fontSize: 'var(--text-xs)', color: 'var(--md-on-surface-variant)' }}>
          <MessageToolbar onCopy={handleCopy} copied={copied} />
          
          {confidence !== undefined && (
            <ConfidenceBadge score={confidence} />
          )}
          
          {metadata?.responseTime && (
            <span>
              {(metadata.responseTime / 1000).toFixed(2)}s
            </span>
          )}
        </div>

        {citations && citations.length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--md-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
              Sources & Citations
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
              {citations.map((cit, idx) => (
                <CitationCard key={idx} citation={cit} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIMessage;
