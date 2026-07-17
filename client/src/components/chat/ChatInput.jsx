import React, { useState, useRef, useEffect } from 'react';
import { Send, CornerDownLeft } from 'lucide-react';

const ChatInput = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput('');
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  return (
    <div className="relative flex items-end w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 overflow-hidden">
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about your meetings..."
        disabled={disabled}
        className="w-full max-h-[120px] py-4 pl-4 pr-12 bg-transparent border-0 focus:ring-0 resize-none outline-none dark:text-white"
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={!input.trim() || disabled}
        className="absolute right-2 bottom-2 p-2 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700 transition-colors"
      >
        <Send className="w-4 h-4" />
      </button>
      <div className="absolute right-2 top-2 text-xs text-gray-400 hidden sm:flex items-center gap-1 pointer-events-none">
        <CornerDownLeft className="w-3 h-3" />
      </div>
    </div>
  );
};

export default ChatInput;
