import React from 'react';
import { useSearchContext } from '../../context/SearchContext';

const SearchStats = React.memo(() => {
  const { stats, loading } = useSearchContext();

  if (!stats && !loading) return null;
  if (loading) return <div className="search-stats-placeholder" />;

  return (
    <div className="search-stats">
      <span>{stats.total || stats.returned || 0} Results</span>
      <span className="stats-dot">•</span>
      <span>{stats.executionTimeMs} ms</span>
      <span className="stats-dot">•</span>
      <span>Keyword Search</span>
      <span className="stats-dot">•</span>
      <span className="stats-version">v1.0</span>
    </div>
  );
});

export default SearchStats;
