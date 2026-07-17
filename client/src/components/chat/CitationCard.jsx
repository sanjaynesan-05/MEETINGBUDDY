import React from 'react';
import { FileText, Clock, User } from 'lucide-react';

const CitationCard = ({ citation }) => {
  return (
    <div className="flex flex-col gap-2 p-3 mt-2 text-sm bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 hover:border-indigo-300 transition-colors dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-750">
      <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          <span className="font-medium truncate max-w-[120px]" title={citation.meetingId}>
            {citation.meetingId}
          </span>
        </div>
        {citation.similarityScore && (
          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
            {Math.round(citation.similarityScore * 100)}% match
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
        <div className="flex items-center gap-1">
          <User className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-medium">{citation.speaker || 'Unknown'}</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span>{citation.startTime || '00:00:00'} - {citation.endTime || '00:00:00'}</span>
        </div>
      </div>
    </div>
  );
};

export default CitationCard;
