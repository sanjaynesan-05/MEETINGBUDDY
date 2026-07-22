import React from 'react';
import { SearchProvider } from '../context/SearchContext';
import SearchLayout from '../components/search/SearchLayout';

export default function SearchPage() {
  return (
    <SearchProvider>
      <div className="page-content search-page">
        <SearchLayout />
      </div>
    </SearchProvider>
  );
}
