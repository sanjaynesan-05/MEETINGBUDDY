import React from 'react';

const LoadingSkeleton = () => {
  return (
    <div className="flex items-start gap-4 mb-6 max-w-3xl animate-pulse">
      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-1/2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-5/6"></div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
