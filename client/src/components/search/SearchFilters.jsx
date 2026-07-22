import React from 'react';
import { useSearchContext } from '../../context/SearchContext';

export default function SearchFilters() {
  const { searchState, setFilters, clearSearch } = useSearchContext();

  const handleTypeChange = (e) => {
    setFilters({ meetingType: e.target.value });
  };

  const handleLimitChange = (e) => {
    setFilters({ limit: parseInt(e.target.value, 10) });
  };

  const hasFilters = searchState.meetingType || searchState.from || searchState.to || searchState.query;

  return (
    <div className="search-filters">
      <select 
        className="search-select" 
        value={searchState.meetingType || ''} 
        onChange={handleTypeChange}
        aria-label="Meeting Type Filter"
      >
        <option value="">All Types</option>
        <option value="Planning">Planning</option>
        <option value="Review">Review</option>
        <option value="Standup">Standup</option>
        <option value="Client">Client</option>
        <option value="Engineering Staff Meeting">Engineering Staff Meeting</option>
      </select>

      <select 
        className="search-select" 
        value={searchState.limit} 
        onChange={handleLimitChange}
        aria-label="Results Per Page"
      >
        <option value={10}>10 per page</option>
        <option value={20}>20 per page</option>
        <option value={50}>50 per page</option>
      </select>

      {hasFilters && (
        <button className="btn btn-text search-reset-btn" onClick={clearSearch}>
          Reset
        </button>
      )}
    </div>
  );
}
