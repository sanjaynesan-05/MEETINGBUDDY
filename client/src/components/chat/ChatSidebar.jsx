import React from 'react';
import { MessageSquare, Plus, Settings } from 'lucide-react';

const ChatSidebar = ({ onNewChat }) => {
  return (
    <div className="w-64 h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col hidden md:flex">
      <div className="p-4">
        <button 
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent</div>
        
        {/* Mock history item */}
        <button className="w-full flex items-center gap-3 p-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm text-left">
          <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="truncate">Current Session</span>
        </button>
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <button className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </div>
  );
};

export default ChatSidebar;
