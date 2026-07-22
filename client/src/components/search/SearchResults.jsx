import React from 'react';
import { useSearchContext } from '../../context/SearchContext';
import SearchCard from './SearchCard';
import SearchPagination from './SearchPagination';
import SearchSkeleton from './SearchSkeleton';
import SearchEmpty from './SearchEmpty';
import SearchError from './SearchError';

export default function SearchResults() {
  const { results, loading, error, searchState } = useSearchContext();
  
  // Only show empty if we actually searched for something and are not loading
  const hasSearched = !!(searchState.query || searchState.meetingType || searchState.from || searchState.to);

  if (error) {
    return <SearchError message={error} />;
  }

  if (loading) {
    return (
      <div className="search-results-container">
        <SearchSkeleton />
      </div>
    );
  }

  if (results.length === 0 && hasSearched) {
    return <SearchEmpty />;
  }

  if (results.length === 0) {
    // Initial state before search
    return (
      <div className="search-empty-initial">
        <p>Type a keyword or select a filter to begin searching.</p>
      </div>
    );
  }

  return (
    <div className="search-results-container">
      <div className="search-results-list">
        {results.map(result => (
          <SearchCard key={result.meetingId || Math.random()} result={result} />
        ))}
      </div>
      <SearchPagination />
    </div>
  );
}
