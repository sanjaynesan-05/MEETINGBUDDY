import React from 'react';
import { Bot, Filter } from 'lucide-react';

const ChatHeader = ({ meetingFilter, setMeetingFilter }) => {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-10 sticky top-0 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center dark:bg-indigo-900/50">
          <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">AI Assistant</h1>
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <Filter className="w-4 h-4 text-gray-500" />
        <select 
          value={meetingFilter}
          onChange={(e) => setMeetingFilter(e.target.value)}
          className="bg-transparent border-none text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer font-medium outline-none"
        >
          <option value="all">All Meetings</option>
          <option value="meeting123">Q2 Planning (Mock)</option>
        </select>
      </div>
    </header>
  );
};

export default ChatHeader;
