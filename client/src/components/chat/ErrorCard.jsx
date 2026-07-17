import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorCard = ({ error, onRetry }) => {
  if (!error) return null;
  
  return (
    <div className="flex flex-col items-center justify-center p-6 my-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl max-w-2xl mx-auto">
      <AlertCircle className="w-8 h-8 text-red-500 mb-3" />
      <p className="text-red-700 dark:text-red-400 text-sm font-medium mb-4 text-center">
        {error}
      </p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 text-sm font-semibold rounded-lg shadow-sm border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorCard;
