import React, { createContext, useContext } from 'react';
import { useSearch } from '../hooks/useSearch';

const SearchContext = createContext();

export function SearchProvider({ children }) {
  const searchProps = useSearch();

  return (
    <SearchContext.Provider value={searchProps}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearchContext() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
}
