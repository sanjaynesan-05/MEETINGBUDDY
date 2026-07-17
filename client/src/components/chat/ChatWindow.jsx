import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import ErrorCard from './ErrorCard';
import SuggestedQuestions from './SuggestedQuestions';

const ChatWindow = ({ messages, isLoading, error, onRetry, onSuggestSelect }) => {
  const bottomRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 flex flex-col scroll-smooth">
      {isEmpty && !isLoading && !error && (
        <div className="flex flex-col items-center justify-center flex-1 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-3xl">👋</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            AI Meeting Intelligence
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Ask me anything about your past meetings, decisions made, action items, or general summaries.
          </p>
          <SuggestedQuestions onSelect={onSuggestSelect} />
        </div>
      )}

      <div className="max-w-4xl mx-auto w-full">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        
        {isLoading && (
          <div className="mt-4">
            <TypingIndicator />
          </div>
        )}
        
        {error && (
          <ErrorCard error={error} onRetry={onRetry} />
        )}
        
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
};

export default ChatWindow;
