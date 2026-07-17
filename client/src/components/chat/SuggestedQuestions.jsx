import React from 'react';
import { Sparkles } from 'lucide-react';

const SuggestedQuestions = ({ onSelect }) => {
  const questions = [
    "What decisions were made?",
    "Who owns this task?",
    "Summarize discussion.",
    "List action items."
  ];

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium px-1 dark:text-gray-400">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        Suggested Questions
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(q)}
            className="px-4 py-2 text-sm bg-white border border-gray-200 rounded-full hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-indigo-400"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQuestions;
