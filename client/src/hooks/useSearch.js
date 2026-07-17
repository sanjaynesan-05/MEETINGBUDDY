import { useState, useMemo } from 'react';

/**
 * Hook for searching/filtering a list of items based on a query.
 * @param {Array} items - The items to search through
 * @param {Array<string>} searchKeys - The keys of the item objects to search within
 */
export function useSearch(items = [], searchKeys = ['title', 'description']) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const lowerQuery = searchQuery.toLowerCase();
    
    return items.filter((item) => {
      return searchKeys.some((key) => {
        const val = item[key];
        if (typeof val === 'string') {
          return val.toLowerCase().includes(lowerQuery);
        }
        return false;
      });
    });
  }, [items, searchQuery, searchKeys]);

  return { searchQuery, setSearchQuery, filteredItems };
}
