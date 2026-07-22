import React from 'react';
import SearchBar from './SearchBar';
import SearchFilters from './SearchFilters';
import SearchStats from './SearchStats';

export default function SearchToolbar() {
  return (
    <div className="search-toolbar">
      <div className="search-toolbar-controls">
        <SearchBar />
        <SearchFilters />
      </div>
      <SearchStats />
    </div>
  );
}
