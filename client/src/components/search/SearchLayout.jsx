import React from 'react';
import SearchToolbar from './SearchToolbar';
import SearchSuggestions from './SearchSuggestions';
import SearchResults from './SearchResults';

export default function SearchLayout() {
  return (
    <div className="search-layout">
      <div className="search-header">
        <h1 className="page-title">Enterprise Search</h1>
        <p className="page-subtitle">Search across meetings, summaries, decisions and transcripts.</p>
      </div>

      <div className="search-main-content">
        <SearchToolbar />
        <SearchSuggestions />
        <SearchResults />
      </div>
    </div>
  );
}
