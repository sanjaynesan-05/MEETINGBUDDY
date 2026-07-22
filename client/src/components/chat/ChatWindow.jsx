import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import ErrorCard from './ErrorCard';
import SuggestedQuestions from './SuggestedQuestions';

const ChatWindow = ({ messages, isLoading, error, onRetry, onSuggestSelect }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const isEmpty = messages.length === 0;

  return (
    <div className="chat-window">
      {isEmpty && !isLoading && !error && (
        <div style={{ textAlign: 'center', padding: '40px 20px', maxWidth: '500px', margin: 'auto' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--md-primary-container)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '32px',
          }}>
            👋
          </div>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--md-on-surface)', marginBottom: '8px' }}>
            AI Meeting Intelligence
          </h2>
          <p style={{ color: 'var(--md-on-surface-variant)', fontSize: 'var(--text-base)', marginBottom: '24px' }}>
            Ask me anything about your past meetings, decisions made, action items, or general summaries.
          </p>
          <SuggestedQuestions onSelect={onSuggestSelect} />
        </div>
      )}

      <div className="chat-window-content">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div style={{ marginTop: '16px' }}>
            <TypingIndicator />
          </div>
        )}

        {error && (
          <ErrorCard error={error} onRetry={onRetry} />
        )}

        <div ref={bottomRef} style={{ height: '16px' }} />
      </div>
    </div>
  );
};

export default ChatWindow;
