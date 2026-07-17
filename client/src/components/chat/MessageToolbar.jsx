import React from 'react';
import { Copy, Check } from 'lucide-react';

const MessageToolbar = ({ onCopy, copied }) => {
  return (
    <div className="flex items-center">
      <button 
        onClick={onCopy}
        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
        title="Copy Answer"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
};

export default MessageToolbar;
