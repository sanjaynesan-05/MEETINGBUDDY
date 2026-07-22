import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useSearchContext } from '../../context/SearchContext';

export default function SearchError({ message }) {
  const { refetch } = useSearchContext();

  return (
    <div className="search-error-state">
      <div className="error-icon-wrapper">
        <AlertCircle size={48} className="error-icon" />
      </div>
      <h2>Something went wrong</h2>
      <p>{message || 'Unable to search meetings.'}</p>
      <button className="btn btn-primary mt-4" onClick={refetch}>
        <RefreshCw size={16} style={{ marginRight: '8px' }} />
        Retry Search
      </button>
    </div>
  );
}
