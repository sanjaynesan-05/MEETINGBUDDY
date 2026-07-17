import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot } from 'lucide-react';
import ConfidenceBadge from './ConfidenceBadge';
import CitationCard from './CitationCard';
import MessageToolbar from './MessageToolbar';

const AIMessage = ({ content, confidence, citations = [], metadata, id }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-4 mb-6 max-w-4xl group">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center dark:bg-indigo-900 mt-1">
        <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
      </div>
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <div className="px-5 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm shadow-sm prose prose-sm sm:prose dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
        
        {/* Footer actions and metadata */}
        <div className="flex flex-wrap items-center gap-3 px-1 mt-1">
          <MessageToolbar onCopy={handleCopy} copied={copied} />
          
          {confidence !== undefined && (
            <ConfidenceBadge score={confidence} />
          )}
          
          {metadata?.responseTime && (
            <span className="text-xs text-gray-400">
              {(metadata.responseTime / 1000).toFixed(2)}s
            </span>
          )}
          {metadata?.model && (
            <span className="text-xs text-gray-400 capitalize">
              {metadata.model}
            </span>
          )}
        </div>

        {/* Citations Panel */}
        {citations && citations.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Sources</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {citations.map((cit, idx) => (
                <CitationCard key={idx} citation={cit} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIMessage;
